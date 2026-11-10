import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import {
  submitCallTx,
  createUnprovenDeployTx,
  createUnprovenCallTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import type { SerializedContractState } from '@midnight-ntwrk/midnight-js-types';
import * as ledger8Runtime from '../../contract/runtime.js';
import { ContractCall, Transaction } from '@midnightntwrk/ledger-v9';
import { Contract, ledger, pureCircuits, Subcategory, type Receipt } from '../../contract/managed/aegis/contract/index.js';
import { witnesses, type AegisPrivateState } from '../../contract/witnesses.js';
import type { AegisProviders } from './providers.js';

export { Subcategory };
export type { Receipt };

const NETWORK = process.env['MIDNIGHT_NETWORK'] ?? 'local';

/**
 * Con MOCK_CHAIN=true, buildRegisterStoreTx/buildAttestReceiptTx no tocan
 * la red de Midnight en absoluto (ni prueban ni construyen nada), sirve
 * para seguir probando el flujo/UI de tienda sin depender del proof
 * server. isStoreRegistered también responde en local en ese modo, con
 * un flag en memoria, se resetea al reiniciar el backend.
 */
const MOCK_CHAIN = process.env['MOCK_CHAIN'] === 'true';
let mockStoreRegistered = false;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(__dirname, '../../contract/managed/aegis');

// El contrato desplegado está compilado con compactc 0.31 (runtime 0.16, ledger
// 8). midnight-js 5 lo recibe como instancia, no envuelto en CompiledContract
// (eso solo vale para contratos ledger 9). Los artefactos los sirve el
// zkConfigProvider (ver providers.ts).
export const CompiledAegisContract = new Contract(witnesses);

/**
 * Decodifica el estado de un contrato ledger 8 leído del indexer. Antes del
 * fork llega como v8 y lo lee el runtime 0.16 del propio contrato; tras el
 * fork llega como v9, se decodifica con el runtime 0.21 y se pasa como dato
 * plano al 0.16, único que acepta `ledger()`.
 */
export function decodeAegisState(contractState: SerializedContractState) {
  const stateValue = contractState.deserialize({
    v8: { deserialize: (bytes: Uint8Array) => ledger8Runtime.ContractState.deserialize(bytes).data.state },
    v9: {
      deserialize: (bytes: Uint8Array) =>
        ledger8Runtime.StateValue.decode(ContractState.deserialize(bytes).data.state.encode()),
    },
  });
  return ledger(stateValue as any);
}

// Único identificador bajo el que este backend guarda el estado privado del
// contrato en su privateStateProvider en memoria (ver providers.ts). Como el
// backend solo maneja una instancia de contrato a la vez, un id fijo basta.
const PRIVATE_STATE_ID = 'aegis';

/**
 * Claves operativas del backend (admin del registro de tiendas, y la propia
 * tienda de demo). Se generan una vez y se guardan en disco para que sean
 * estables entre reinicios, nunca se commitean (ver .gitignore).
 */
function loadOrCreateKey(fileName: string): Uint8Array {
  if (existsSync(fileName)) {
    return new Uint8Array(Buffer.from(readFileSync(fileName, 'utf8').trim(), 'hex'));
  }
  const key = randomBytes(32);
  writeFileSync(fileName, Buffer.from(key).toString('hex'));
  return new Uint8Array(key);
}

export function getAdminKey(): Uint8Array {
  return loadOrCreateKey(`.admin-key-${NETWORK}`);
}

export function getStoreKey(): Uint8Array {
  return loadOrCreateKey(`.store-key-${NETWORK}`);
}

// Un recibo sella hasta 8 líneas (rollup por subcategoría). El circuito ZK
// tiene tamaño fijo: siempre son 8 entradas; las no usadas van a cero y
// lineCount dice cuántas cuentan.
export const MAX_RECEIPT_LINES = 8;

/** Línea del rollup tal y como la manda el frontend (ya agrupada por subcategoría). */
export type ReceiptLineInput = { subcategory: number; qty: number; amount: number };

/** Forma de un Receipt apta para JSON (bigint/Uint8Array no lo son). */
export type ReceiptLineJSON = { subcategory: number; qty: number; amount: string };
export type ReceiptJSON = { lines: ReceiptLineJSON[]; timestamp: string; nonce: string };

type RtLine = Receipt['lines'][number];

/** Rellena hasta 8 líneas con ceros, mismo padding en la tienda (sella) y en el comprador (gasta), para que el commitment coincida. */
function padLines(lines: { subcategory: number; qty: number | bigint; amount: number | bigint | string }[]): RtLine[] {
  const out: RtLine[] = lines.slice(0, MAX_RECEIPT_LINES).map(l => ({
    subcategory: l.subcategory as unknown as RtLine['subcategory'],
    qty: BigInt(l.qty),
    amount: BigInt(l.amount as any),
  }));
  while (out.length < MAX_RECEIPT_LINES) {
    out.push({ subcategory: 0 as unknown as RtLine['subcategory'], qty: 0n, amount: 0n });
  }
  return out;
}

export function receiptToJSON(r: Receipt): ReceiptJSON {
  const count = Number(r.lineCount);
  return {
    lines: r.lines.slice(0, count).map(l => ({
      subcategory: l.subcategory as unknown as number,
      qty: Number(l.qty),
      amount: l.amount.toString(),
    })),
    timestamp: r.timestamp.toString(),
    nonce: Buffer.from(r.nonce).toString('hex'),
  };
}

/**
 * Genera un recibo nuevo con timestamp y nonce frescos, lo llama la tienda
 * al vender. Recibe el rollup por subcategoría; se ordena por importe
 * descendente y se queda con las 8 de mayor valor (el resto no se sella).
 */
export function makeReceipt(lines: ReceiptLineInput[]): Receipt {
  const active = lines
    .filter(l => l.qty > 0 && l.amount >= 0)
    .sort((a, b) => (b.amount - a.amount) || (a.subcategory - b.subcategory))
    .slice(0, MAX_RECEIPT_LINES);
  return {
    lines: padLines(active),
    lineCount: BigInt(active.length),
    timestamp: BigInt(Date.now()),
    nonce: new Uint8Array(randomBytes(32)),
  };
}

export function receiptFromJSON(j: ReceiptJSON): Receipt {
  const active = (j.lines ?? []).slice(0, MAX_RECEIPT_LINES);
  return {
    lines: padLines(active),
    lineCount: BigInt(active.length),
    timestamp: BigInt(j.timestamp),
    nonce: new Uint8Array(Buffer.from(j.nonce, 'hex')),
  };
}

export type AegisState = {
  signalsElectronics: bigint; signalsFashion: bigint; signalsFood: bigint;
  signalsSports: bigint; signalsHome: bigint; signalsOther: bigint;
  signalsMobile: bigint; signalsTablet: bigint; signalsComputer: bigint;
  signalsCamera: bigint; signalsAudio: bigint; signalsGaming: bigint;
  signalsShoes: bigint; signalsTops: bigint; signalsBottoms: bigint;
  signalsAccessories: bigint; signalsOuterwear: bigint;
  signalsGroceries: bigint; signalsRestaurant: bigint; signalsCafes: bigint; signalsFastfood: bigint; signalsLocalshops: bigint;
  signalsEquipment: bigint; signalsClothing: bigint; signalsFootwear: bigint; signalsSupplements: bigint;
  signalsFurniture: bigint; signalsAppliances: bigint; signalsDecor: bigint; signalsTools: bigint;
  totalSignals: bigint;
  campaignCount: bigint;
  isSeeded: bigint;
};

export async function registerCampaign(
  providers: AegisProviders,
  contractAddress: ContractAddress,
): Promise<void> {
  await (submitCallTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'registerCampaign',
    args: [],
  });
}

export async function readState(
  providers: AegisProviders,
  contractAddress: ContractAddress,
): Promise<AegisState> {
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) throw new Error('Contract state not found');
  return decodeAegisState(state.contractState) as unknown as AegisState;
}

function txToHex(tx: any): string {
  return Buffer.from((tx as any).serialize()).toString('hex');
}

/**
 * Un contrato ledger 8 ya no se puede desplegar: Preprod corre ledger 9 y
 * midnight-js 5 lo rechaza (EraMismatchError, ledger8-deploy-on-ledger9-network).
 * Desplegar uno nuevo exige recompilar con compactc 0.36 (contrato ledger 9).
 */
export async function buildDeployTx(
  _providers: AegisProviders,
): Promise<{ tx: string; contractAddress: ContractAddress }> {
  throw new Error(
    'Desplegar un contrato nuevo requiere recompilarlo con compactc 0.36.0 (ledger 9). ' +
    'El contrato actual (compactc 0.31) solo admite llamadas.',
  );
}

export type SeedData = {
  mobile: number; tablet: number; computer: number; camera: number; audio: number; gaming: number;
  shoes: number; tops: number; bottoms: number; accessories: number; outerwear: number;
  groceries: number; restaurant: number; cafes: number; fastfood: number; localshops: number;
  equipment: number; clothing: number; footwear: number; supplements: number;
  furniture: number; appliances: number; decor: number; tools: number;
  other: number;
};

export async function buildSeedTx(
  providers: AegisProviders,
  contractAddress: ContractAddress,
  data: SeedData,
): Promise<string> {
  const b = (n: number) => BigInt(n);
  const totalElectronics = b(data.mobile + data.tablet + data.computer + data.camera + data.audio + data.gaming);
  const totalFashion = b(data.shoes + data.tops + data.bottoms + data.accessories + data.outerwear);
  const totalFood = b(data.groceries + data.restaurant + data.cafes + data.fastfood + data.localshops);
  const totalSports = b(data.equipment + data.clothing + data.footwear + data.supplements);
  const totalHome = b(data.furniture + data.appliances + data.decor + data.tools);
  const grandTotal = totalElectronics + totalFashion + totalFood + totalSports + totalHome + b(data.other);

  const unprovenData = await (createUnprovenCallTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'seed',
    args: [
      b(data.mobile), b(data.tablet), b(data.computer), b(data.camera), b(data.audio), b(data.gaming),
      b(data.shoes), b(data.tops), b(data.bottoms), b(data.accessories), b(data.outerwear),
      b(data.groceries), b(data.restaurant), b(data.cafes), b(data.fastfood), b(data.localshops),
      b(data.equipment), b(data.clothing), b(data.footwear), b(data.supplements),
      b(data.furniture), b(data.appliances), b(data.decor), b(data.tools),
      b(data.other),
      totalElectronics, totalFashion, totalFood, totalSports, totalHome,
      grandTotal,
    ],
  });
  const provenTx = await providers.proofProvider.proveTx(unprovenData.private.unprovenTx);
  return txToHex(provenTx);
}

// El contrato en el que ya se ha visto registrada la tienda de demo.
let contractWithStore: ContractAddress | null = null;

/**
 * ¿Ya está la tienda de demo en el árbol de tiendas registradas? El admin
 * y la tienda son claves que el propio backend gestiona (getAdminKey/
 * getStoreKey), así que puede comprobarlo contra el ledger público sin
 * necesitar ninguna wallet, es la misma comprobación de pertenencia que
 * hace el witness getStorePath (ver witnesses.ts).
 *
 * El "sí" se recuerda: el contrato no permite quitar tiendas, y deserializar
 * su estado bloquea el proceso varios segundos en cada carga de la web. Con
 * `fresh` se lee igualmente: es lo que pide el botón de comprobar el registro.
 */
export async function isStoreRegistered(
  providers: AegisProviders,
  contractAddress: ContractAddress,
  fresh = false,
): Promise<boolean> {
  if (MOCK_CHAIN) return mockStoreRegistered;
  if (!fresh && contractWithStore === contractAddress) return true;
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) return false;
  const storePk = pureCircuits.storePublicKey(getStoreKey());
  const registered = decodeAegisState(state.contractState).registeredStores.findPathForLeaf(storePk) !== undefined;
  if (registered) contractWithStore = contractAddress;
  return registered;
}

/**
 * El admin da de alta la tienda de demo en el árbol Merkle de tiendas
 * registradas. La autorización del circuito la resuelve el secreto de admin
 * (server-side) y el backend prueba; la wallet conectada en el navegador
 * balancea, firma y envía, igual que en signal/deploy/seed.
 */
export async function buildRegisterStoreTx(
  providers: AegisProviders,
  contractAddress: ContractAddress,
): Promise<string> {
  if (MOCK_CHAIN) {
    mockStoreRegistered = true;
    return '';
  }
  const adminKey = getAdminKey();
  const storeKey = getStoreKey();
  const storePk = pureCircuits.storePublicKey(storeKey);

  await providers.privateStateProvider.forContract(contractAddress).set(PRIVATE_STATE_ID, { secretKey: adminKey, receipt: null } as AegisPrivateState);

  const unprovenData = await (createUnprovenCallTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'registerStore',
    args: [storePk],
    privateStateId: PRIVATE_STATE_ID,
  });
  const provenTx = await providers.proofProvider.proveTx(unprovenData.private.unprovenTx);
  return txToHex(provenTx);
}

/**
 * La tienda sella el compromiso de un recibo. Genera el recibo aquí mismo
 * (el backend hace de "caja" en esta demo) y lo devuelve junto a la
 * transacción probada: el llamador (Lace, en el navegador) es quien
 * balancea, firma y envía. Ver nota de buildRegisterStoreTx.
 */
export async function buildAttestReceiptTx(
  providers: AegisProviders,
  contractAddress: ContractAddress,
  receipt: Receipt,
): Promise<{ tx: string; commitmentHex: string }> {
  const commitment = pureCircuits.receiptCommitment(receipt);
  const commitmentHex = Buffer.from(commitment).toString('hex');
  if (MOCK_CHAIN) {
    return { tx: '', commitmentHex };
  }
  const storeKey = getStoreKey();

  await providers.privateStateProvider.forContract(contractAddress).set(PRIVATE_STATE_ID, { secretKey: storeKey, receipt: null } as AegisPrivateState);

  const unprovenData = await (createUnprovenCallTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'attestReceipt',
    args: [commitment],
    privateStateId: PRIVATE_STATE_ID,
  });
  const provenTx = await providers.proofProvider.proveTx(unprovenData.private.unprovenTx);
  return { tx: txToHex(provenTx), commitmentHex };
}

/** El usuario envía como señal un recibo ya sellado por una tienda (escaneado de un QR). */
export async function buildSignalTx(
  providers: AegisProviders,
  contractAddress: ContractAddress,
  receipt: Receipt,
): Promise<{ tx: string; commitmentHex: string }> {
  const commitment = pureCircuits.receiptCommitment(receipt);
  const commitmentHex = Buffer.from(commitment).toString('hex');

  await providers.privateStateProvider.forContract(contractAddress).set(PRIVATE_STATE_ID, { secretKey: new Uint8Array(32), receipt } as AegisPrivateState);

  const unprovenData = await (createUnprovenCallTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'submitPurchase',
    privateStateId: PRIVATE_STATE_ID,
  });

  const provenTx = await providers.proofProvider.proveTx(unprovenData.private.unprovenTx);

  return { tx: txToHex(provenTx), commitmentHex };
}

/**
 * Estado público que necesita quien construye una llamada al contrato por su
 * cuenta (el navegador, cuando el usuario prueba su señal con su propio proof
 * server). Es lo mismo que el SDK pide al indexer en createUnprovenCallTx,
 * solo que el indexer de preprod pide un token que no puede ir al navegador,
 * así que se lo sirve el backend ya serializado.
 */
export async function getContractStatesHex(
  providers: AegisProviders,
  contractAddress: ContractAddress,
): Promise<{
  zswapState: string; contractState: string; ledgerParameters: string;
  zswapEra: string; contractEra: string; ledgerParametersEra: string;
} | null> {
  const states = await providers.publicDataProvider.queryZSwapAndContractState(contractAddress);
  if (!states) return null;
  const hex = (s: { serialize(): Uint8Array }) => Buffer.from(s.serialize()).toString('hex');
  return {
    zswapState: hex(states.zswapChainState),
    contractState: hex(states.contractState),
    ledgerParameters: hex(states.ledgerParameters),
    zswapEra: states.zswapChainState.era,
    contractEra: states.contractState.era,
    ledgerParametersEra: states.ledgerParameters.era,
  };
}

/**
 * ¿Es esta transacción (ya probada, sin pagar) una señal y nada más? Es
 * decir, una única llamada a submitPurchase de nuestro contrato, sin mover
 * tokens. Se comprueba antes de pasar al patrocinio una transacción que no ha
 * construido el backend, para que nadie use el DUST del bot para otra cosa.
 */
export function isSignalTx(txHex: string, contractAddress: ContractAddress): boolean {
  let tx;
  try {
    tx = Transaction.deserialize('signature', 'proof', 'pre-binding', new Uint8Array(Buffer.from(txHex, 'hex')));
  } catch {
    return false;
  }
  return isOnlySubmitPurchase(tx, contractAddress);
}

/** La parte de isSignalTx que no depende de si la transacción ya está probada. */
export function isOnlySubmitPurchase(tx: Transaction<any, any, any>, contractAddress: ContractAddress): boolean {
  if (tx.guaranteedOffer || tx.fallibleOffer?.size) return false;
  const intents = [...(tx.intents?.values() ?? [])];
  if (intents.length !== 1) return false;
  const [intent] = intents;
  if (intent.guaranteedUnshieldedOffer || intent.fallibleUnshieldedOffer || intent.dustActions) return false;
  if (intent.actions.length !== 1) return false;
  const [action] = intent.actions;
  if (!(action instanceof ContractCall) || action.address !== contractAddress) return false;
  const entryPoint = typeof action.entryPoint === 'string' ? action.entryPoint : new TextDecoder().decode(action.entryPoint);
  return entryPoint === 'submitPurchase';
}

/**
 * Lectura barata (sin probar nada) de si un commitment ya está sellado
 * (attestReceipt confirmado) y/o ya usado (submitPurchase confirmado), tal y
 * como lo ve el backend a través del indexer. Pensado para que el frontend
 * espere a que una transacción se confirme antes de lanzar la siguiente en
 * vez de adivinar un tiempo fijo.
 */
export async function getReceiptStatus(
  providers: AegisProviders,
  contractAddress: ContractAddress,
  commitmentHex: string,
): Promise<{ sealed: boolean; used: boolean }> {
  const commitment = new Uint8Array(Buffer.from(commitmentHex, 'hex'));
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) return { sealed: false, used: false };
  const l = decodeAegisState(state.contractState);
  return { sealed: l.sealedReceipts.member(commitment), used: l.usedReceipts.member(commitment) };
}
