import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import {
  submitCallTx,
  createUnprovenDeployTx,
  createUnprovenCallTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Contract, ledger, pureCircuits, Subcategory, type Receipt } from '../../contract/managed/aegis/contract/index.js';
import { witnesses, type AegisPrivateState } from '../../contract/witnesses.js';
import type { AegisProviders } from './providers.js';

export { Subcategory };
export type { Receipt };

const NETWORK = process.env['MIDNIGHT_NETWORK'] ?? 'local';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(__dirname, '../../contract/managed/aegis');

export const CompiledAegisContract = CompiledContract.make('aegis', Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

// Único identificador bajo el que este backend guarda el estado privado del
// contrato en su privateStateProvider en memoria (ver providers.ts). Como el
// backend solo maneja una instancia de contrato a la vez, un id fijo basta.
const PRIVATE_STATE_ID = 'aegis';

/**
 * Claves operativas del backend (admin del registro de tiendas, y la propia
 * tienda de demo). Se generan una vez y se guardan en disco para que sean
 * estables entre reinicios — nunca se commitean (ver .gitignore).
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

/** Forma de un Receipt apta para JSON (bigint/Uint8Array no lo son). */
export type ReceiptJSON = { subcategory: number; amount: string; timestamp: string; nonce: string };

export function receiptToJSON(r: Receipt): ReceiptJSON {
  return {
    subcategory: r.subcategory as unknown as number,
    amount: r.amount.toString(),
    timestamp: r.timestamp.toString(),
    nonce: Buffer.from(r.nonce).toString('hex'),
  };
}

/** Genera un recibo nuevo con timestamp y nonce frescos — lo llama la tienda al vender. */
export function makeReceipt(subcategory: number, amount: bigint): Receipt {
  return {
    subcategory: subcategory as any,
    amount,
    timestamp: BigInt(Date.now()),
    nonce: new Uint8Array(randomBytes(32)),
  };
}

export function receiptFromJSON(j: ReceiptJSON): Receipt {
  return {
    subcategory: j.subcategory as any,
    amount: BigInt(j.amount),
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
  signalsGroceries: bigint; signalsRestaurant: bigint; signalsDrinks: bigint; signalsSnacks: bigint;
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
  return ledger(state.data) as AegisState;
}

function txToHex(tx: any): string {
  return Buffer.from((tx as any).serialize()).toString('hex');
}

/** Construye y prueba la transacción de despliegue, sin firmarla. Lace la firma y la envía. */
export async function buildDeployTx(
  providers: AegisProviders,
): Promise<{ tx: string; contractAddress: ContractAddress }> {
  const adminKey = getAdminKey();
  const initialPrivateState: AegisPrivateState = { secretKey: adminKey, receipt: null };

  const unprovenData = await (createUnprovenDeployTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    signingKey: sampleSigningKey(),
    initialPrivateState,
  });

  const provenTx = await providers.proofProvider.proveTx(unprovenData.private.unprovenTx);

  return {
    tx: txToHex(provenTx),
    contractAddress: unprovenData.public.contractAddress,
  };
}

export type SeedData = {
  mobile: number; tablet: number; computer: number; camera: number; audio: number; gaming: number;
  shoes: number; tops: number; bottoms: number; accessories: number; outerwear: number;
  groceries: number; restaurant: number; drinks: number; snacks: number;
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
  const totalFood = b(data.groceries + data.restaurant + data.drinks + data.snacks);
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
      b(data.groceries), b(data.restaurant), b(data.drinks), b(data.snacks),
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

/** El admin da de alta la tienda de demo en el árbol Merkle de tiendas registradas. */
export async function buildRegisterStoreTx(
  providers: AegisProviders,
  contractAddress: ContractAddress,
): Promise<string> {
  const adminKey = getAdminKey();
  const storeKey = getStoreKey();
  const storePk = pureCircuits.storePublicKey(storeKey);

  await providers.privateStateProvider.set(PRIVATE_STATE_ID, { secretKey: adminKey, receipt: null } as AegisPrivateState);

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
 * transacción: el llamador es quien debe convertirlo en QR — nunca se
 * guarda ni se loguea más allá de esta respuesta.
 */
export async function buildAttestReceiptTx(
  providers: AegisProviders,
  contractAddress: ContractAddress,
  receipt: Receipt,
): Promise<string> {
  const storeKey = getStoreKey();
  const commitment = pureCircuits.receiptCommitment(receipt);

  await providers.privateStateProvider.set(PRIVATE_STATE_ID, { secretKey: storeKey, receipt: null } as AegisPrivateState);

  const unprovenData = await (createUnprovenCallTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'attestReceipt',
    args: [commitment],
    privateStateId: PRIVATE_STATE_ID,
  });
  const provenTx = await providers.proofProvider.proveTx(unprovenData.private.unprovenTx);
  return txToHex(provenTx);
}

/** El usuario envía como señal un recibo ya sellado por una tienda (escaneado de un QR). */
export async function buildSignalTx(
  providers: AegisProviders,
  contractAddress: ContractAddress,
  receipt: Receipt,
): Promise<string> {
  await providers.privateStateProvider.set(PRIVATE_STATE_ID, { secretKey: new Uint8Array(32), receipt } as AegisPrivateState);

  const unprovenData = await (createUnprovenCallTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'submitPurchase',
    privateStateId: PRIVATE_STATE_ID,
  });

  const provenTx = await providers.proofProvider.proveTx(unprovenData.private.unprovenTx);

  return txToHex(provenTx);
}
