import { API_BASE, getState, type Lang } from './api.ts';
import { T } from './i18n.ts';

// Igual que ReceiptJSON en backend/src/contract.ts, el recibo tal y como
// viaja por la red y se codifica en el QR (bigint/Uint8Array no son JSON).
//
// `lines` = el rollup por subcategoría que SÍ se sella y se señala (máx 8,
// las de mayor importe). `subcategory` es el índice del enum Subcategory,
// `amount` va en céntimos como string.
//
// `items` es un extra SOLO del QR/dispositivo: el desglose por producto para
// pintar el ticket original y la animación de censura. El backend lo ignora.
export type ReceiptLine = { subcategory: number; qty: number; amount: string };
export type ReceiptItem = { name: string; qty: number; unitCents: number };
export type ReceiptJSON = {
  lines: ReceiptLine[];
  timestamp: string;
  nonce: string;
  items?: ReceiptItem[];
};

export type ConnectedAPI = {
  getUnshieldedAddress: () => Promise<{ unshieldedAddress: string }>;
  balanceUnsealedTransaction: (txHex: string) => Promise<{ tx: string }>;
  submitTransaction: (txHex: string) => Promise<void>;
};

function isWalletUnavailable(e: any): boolean {
  return e?.code === 'InternalError' && e?.reason === 'Wallet is unavailable';
}

export type WalletInfo = { key: string; name: string; icon: string; rdns: string; apiVersion: string };

// Las wallets se anuncian bajo claves arbitrarias (strings fijos como 'lace'/'1am',
// o UUIDs CAIP-372 según la versión), nunca asumir una clave concreta, usar nombre/rdns.
export function listWallets(): WalletInfo[] {
  const midnight = (window as any).midnight as Record<string, any> | undefined;
  if (!midnight) return [];
  return Object.entries(midnight).map(([key, api]) => ({
    key, name: api.name, icon: api.icon, rdns: api.rdns, apiVersion: api.apiVersion,
  }));
}

export async function connectWallet(walletKey: string, networkId: string): Promise<ConnectedAPI> {
  const midnight = (window as any).midnight as Record<string, any> | undefined;
  const api = midnight?.[walletKey];
  if (!api) throw new Error('Wallet extension not found. Please install Lace or 1AM.');

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await api.connect(networkId);
    } catch (e: any) {
      if (!isWalletUnavailable(e) || attempt === maxAttempts) throw e;
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
  throw new Error('unreachable');
}

export async function laceBalanceAndSubmit(
  lace: ConnectedAPI,
  txHex: string,
): Promise<void> {
  const { tx: balancedHex } = await lace.balanceUnsealedTransaction(txHex);
  await lace.submitTransaction(balancedHex);
}

/** No resuelve hasta que el indexer ya sirve estado para esa dirección (mismo motivo que el resto de *ViaLace). */
async function waitForContractIndexed(lang: Lang): Promise<void> {
  await pollUntil(async () => {
    try { await getState(); return true; } catch { return false; }
  }, lang);
}

export async function deployViaLace(
  lace: ConnectedAPI,
  lang: Lang,
  onWaiting?: () => void,
): Promise<string> {
  const r = await fetch(`${API_BASE}/build-tx/deploy`);
  if (!r.ok) throw new Error(`Build deploy tx failed: ${await r.text()}`);
  const { tx, contractAddress } = await r.json();

  await laceBalanceAndSubmit(lace, tx);

  const r2 = await fetch(`${API_BASE}/contract-address`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: contractAddress }),
  });
  if (!r2.ok) throw new Error(`Failed to store contract address: ${await r2.text()}`);

  onWaiting?.();
  await waitForContractIndexed(lang);

  return contractAddress as string;
}

const DEFAULT_SEED = {
  mobile: 312, tablet: 187, computer: 245, camera: 98, audio: 201, gaming: 278,
  shoes: 334, tops: 889, bottoms: 798, accessories: 345, outerwear: 212,
  groceries: 921, restaurant: 356, cafes: 267, fastfood: 189, localshops: 150,
  equipment: 134, clothing: 276, footwear: 355, supplements: 193,
  furniture: 88, appliances: 121, decor: 167, tools: 74,
  other: 63,
};

export async function seedViaLace(lace: ConnectedAPI, lang: Lang, onWaiting?: () => void): Promise<void> {
  const r = await fetch(`${API_BASE}/build-tx/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(DEFAULT_SEED),
  });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error ?? 'Failed to build seed tx');
  }
  const { tx } = await r.json();
  await laceBalanceAndSubmit(lace, tx);
  onWaiting?.();
  await pollUntil(async () => Number((await getState()).isSeeded ?? 0) > 0, lang);
}

// Asserts del contrato que casi siempre significan "la transacción anterior
// todavía no se ha confirmado en la red", no que algo esté mal de verdad.
const LIKELY_UNCONFIRMED_ASSERTS = [
  'Not a registered store',
  'Receipt not attested by a registered store',
];

/** Antepone una explicación en lenguaje llano cuando el error es uno de los asserts típicos de "aún no confirmado". */
export function explainTxError(e: unknown, lang: Lang): string {
  const msg = (e as any)?.message ?? String(e);
  if (LIKELY_UNCONFIRMED_ASSERTS.some((s) => msg.includes(s))) {
    return T[lang].txMaybeUnconfirmed(msg);
  }
  return msg;
}

export async function checkStoreRegistered(): Promise<boolean> {
  const r = await fetch(`${API_BASE}/store-registered`);
  if (!r.ok) return false;
  const { registered } = await r.json();
  return Boolean(registered);
}

/**
 * Consulta barata de si un commitment ya está sellado (attestReceipt
 * confirmado) y/o usado (submitPurchase confirmado), según lo que ve el
 * backend por el indexer.
 */
export async function getReceiptStatus(commitmentHex: string): Promise<{ sealed: boolean; used: boolean }> {
  const r = await fetch(`${API_BASE}/receipt-status?commitment=${commitmentHex}`);
  if (!r.ok) return { sealed: false, used: false };
  return r.json();
}

/**
 * Reintenta `check` hasta que devuelva true o se agote `timeoutMs`. Cada
 * transacción se prueba en el backend con el estado actual del ledger; si se
 * lanza la siguiente antes de que el indexer refleje la anterior, el assert
 * correspondiente falla ("Not a registered store", "Receipt not attested by
 * a registered store", etc.). Este helper es lo que evita esa carrera: las
 * funciones *ViaLace no resuelven hasta que su efecto es visible on-chain.
 */
async function pollUntil(check: () => Promise<boolean>, lang: Lang, { intervalMs = 1500, timeoutMs = 120_000 } = {}): Promise<void> {
  const start = Date.now();
  while (!(await check())) {
    if (Date.now() - start > timeoutMs) throw new Error(T[lang].txConfirmTimeout);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/**
 * Alta única de la tienda de demo en el árbol de tiendas registradas.
 * La wallet operadora del backend resultó poco fiable (sync de horas,
 * cortes de red que la dejaban colgada, ver operatorWallet.ts), así que
 * esto vuelve a pasar por Lace: el backend prueba, Lace balancea/firma/envía.
 *
 * No resuelve hasta que `store-registered` confirma el alta (ver pollUntil),
 * para que quien llama no pueda lanzar la siguiente transacción contra un
 * estado que el indexer todavía no ha puesto al día. `onWaiting` se llama
 * justo al empezar esa espera, para que la UI pueda avisar de que ya se
 * envió y solo falta la confirmación.
 */
export async function registerStoreViaLace(lace: ConnectedAPI, lang: Lang, onWaiting?: () => void): Promise<void> {
  const r = await fetch(`${API_BASE}/register-store`, { method: 'POST' });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error ?? 'Failed to build register-store tx');
  }
  const { tx } = await r.json();
  await laceBalanceAndSubmit(lace, tx);
  onWaiting?.();
  await pollUntil(() => checkStoreRegistered(), lang);
}

/** Línea del rollup que la tienda manda a sellar (subcategoría por nombre del enum, importe en céntimos). */
export type AttestLine = { subcategory: string; qty: number; amount: number };

/**
 * La tienda vende y sella el compromiso del recibo on-chain. Recibe el
 * rollup por subcategoría (ya recortado a las 8 de mayor importe) y devuelve
 * el recibo sellado, quien llama lo convierte en QR. Lace balancea/firma/envía.
 */
export async function attestReceiptViaLace(
  lace: ConnectedAPI,
  lines: AttestLine[],
  lang: Lang,
  onWaiting?: () => void,
): Promise<ReceiptJSON> {
  const r = await fetch(`${API_BASE}/attest-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines }),
  });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error ?? 'Failed to build attest-receipt tx');
  }
  const { tx, receipt, commitmentHex } = await r.json();
  await laceBalanceAndSubmit(lace, tx);
  onWaiting?.();
  await pollUntil(async () => (await getReceiptStatus(commitmentHex)).sealed, lang);
  return receipt as ReceiptJSON;
}

/**
 * El usuario envía como señal un recibo ya sellado por una tienda (escaneado
 * de un QR). A diferencia de las otras acciones, esta no espera a la
 * confirmación on-chain: resuelve en cuanto la red acepta el envío, sin
 * fallar. Es el último paso del flujo (no hay una acción siguiente cuyo
 * assert dependa de este envío), así que la espera solo añadía tiempo sin
 * evitar ningún error real.
 */
export async function submitSignalViaLace(
  lace: ConnectedAPI,
  receipt: ReceiptJSON,
): Promise<void> {
  const r = await fetch(`${API_BASE}/build-tx/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receipt }),
  });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error || `Backend error ${r.status}`);
  }
  const { tx } = await r.json();
  await laceBalanceAndSubmit(lace, tx);
}
