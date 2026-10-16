// Construye y prueba la señal (submitPurchase) en el propio navegador, contra
// el proof server que el usuario tiene en su equipo, en vez de mandar el
// recibo al backend para que lo pruebe allí. Así el recibo completo (líneas,
// importes, fecha) no sale nunca del dispositivo: lo único que se envía es
// la transacción ya probada, que solo revela lo mismo que la señal on-chain.
//
// Este módulo carga ~11MB de WebAssembly en cuanto se importa (arrastra
// @midnight-ntwrk/compact-runtime -> @midnight-ntwrk/ledger-v8 a través del
// contrato compilado). Por eso solo se carga con un import() dinámico (ver
// lace.ts), y solo cuando el usuario elige probar en su equipo.
import { createUnprovenCallTxFromInitialStates } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
// ContractState sale de compact-runtime y no de ledger-v8: el runtime del
// contrato solo acepta su propia clase (igual que hace el SDK al leerlo del indexer).
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import {
  LedgerParameters, ZswapChainState, sampleCoinPublicKey, sampleEncryptionPublicKey,
} from '@midnight-ntwrk/ledger-v8';
// eslint-disable-next-line -- artefacto generado por `compact compile`, no hay tipos de paquete propios.
import { Contract, type Receipt } from '../../contract/managed/aegis/contract/index.js';
import { witnesses, type AegisPrivateState } from '../../contract/witnesses.ts';
import { API_BASE } from './api.ts';
import { NETWORK_ID } from './chainConfig.ts';
import { LOCAL_PROOF_SERVER } from './localProofServer.ts';
import type { ReceiptJSON } from './lace.ts';

setNetworkId(NETWORK_ID);

// Mismo tamaño fijo que MAX_RECEIPT_LINES en backend/src/contract.ts: el
// circuito siempre recibe 8 líneas, las que sobran van a cero.
const MAX_RECEIPT_LINES = 8;

const CompiledAegisContract = CompiledContract.make('aegis', Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  // En el navegador los artefactos ZK llegan por FetchZkConfigProvider, esta
  // ruta solo la guarda compact-js, no la lee.
  CompiledContract.withCompiledFileAssets('/zk'),
);

const zkConfigProvider = new FetchZkConfigProvider<'submitPurchase'>(`${window.location.origin}/zk`, fetch.bind(window));
const proofProvider = httpClientProofProvider(LOCAL_PROOF_SERVER, zkConfigProvider);

const fromHex = (h: string) => Uint8Array.from(h.match(/.{2}/g) ?? [], (b) => parseInt(b, 16));
const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

type RtLine = Receipt['lines'][number];

/** Igual que receiptFromJSON en backend/src/contract.ts: mismo padding, si no el commitment no coincidiría con el sellado. */
function receiptFromJSON(j: ReceiptJSON): Receipt {
  const active = j.lines.slice(0, MAX_RECEIPT_LINES);
  const lines: RtLine[] = active.map((l) => ({
    subcategory: l.subcategory as unknown as RtLine['subcategory'],
    qty: BigInt(l.qty),
    amount: BigInt(l.amount),
  }));
  while (lines.length < MAX_RECEIPT_LINES) {
    lines.push({ subcategory: 0 as unknown as RtLine['subcategory'], qty: 0n, amount: 0n });
  }
  return { lines, lineCount: BigInt(active.length), timestamp: BigInt(j.timestamp), nonce: fromHex(j.nonce) };
}

async function fetchContractStates() {
  const r = await fetch(`${API_BASE}/contract-states`);
  if (!r.ok) throw new Error(`Contract state request failed (${r.status})`);
  const s = await r.json() as { zswapState: string; contractState: string; ledgerParameters: string };
  return {
    zswapChainState: ZswapChainState.deserialize(fromHex(s.zswapState)),
    contractState: ContractState.deserialize(fromHex(s.contractState)),
    ledgerParameters: LedgerParameters.deserialize(fromHex(s.ledgerParameters)),
  };
}

/** Devuelve la transacción de la señal ya probada, en hex, lista para que la pague la wallet o el patrocinio. */
export async function proveSignalLocally(receipt: ReceiptJSON, contractAddress: string): Promise<string> {
  const { zswapChainState, contractState, ledgerParameters } = await fetchContractStates();
  const initialPrivateState: AegisPrivateState = { secretKey: new Uint8Array(32), receipt: receiptFromJSON(receipt) };

  const unproven = await (createUnprovenCallTxFromInitialStates as any)(zkConfigProvider, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'submitPurchase',
    // El backend usa las mismas claves de ejemplo (ver providers.ts): la
    // señal no crea ni recibe monedas, así que no hay a quién cifrarlas.
    coinPublicKey: sampleCoinPublicKey(),
    initialContractState: contractState,
    initialZswapChainState: zswapChainState,
    ledgerParameters,
    initialPrivateState,
  }, sampleEncryptionPublicKey());

  const proven = await proofProvider.proveTx(unproven.private.unprovenTx);
  return toHex(proven.serialize());
}
