import { API_BASE } from './api.ts';

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

export async function deployViaLace(
  lace: ConnectedAPI,
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

export async function seedViaLace(lace: ConnectedAPI): Promise<void> {
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
}

export async function checkStoreRegistered(): Promise<boolean> {
  const r = await fetch(`${API_BASE}/store-registered`);
  if (!r.ok) return false;
  const { registered } = await r.json();
  return Boolean(registered);
}

/**
 * Alta única de la tienda de demo en el árbol de tiendas registradas.
 * La wallet operadora del backend resultó poco fiable (sync de horas,
 * cortes de red que la dejaban colgada, ver operatorWallet.ts), así que
 * esto vuelve a pasar por Lace: el backend prueba, Lace balancea/firma/envía.
 */
export async function registerStoreViaLace(lace: ConnectedAPI): Promise<void> {
  const r = await fetch(`${API_BASE}/register-store`, { method: 'POST' });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error ?? 'Failed to build register-store tx');
  }
  const { tx } = await r.json();
  await laceBalanceAndSubmit(lace, tx);
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
  const { tx, receipt } = await r.json();
  await laceBalanceAndSubmit(lace, tx);
  return receipt as ReceiptJSON;
}

/** El usuario envía como señal un recibo ya sellado por una tienda (escaneado de un QR). */
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
