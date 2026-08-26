import { API_BASE } from './api.ts';

// Igual que ReceiptJSON en backend/src/contract.ts — el recibo tal y como
// viaja por la red y se codifica en el QR (bigint/Uint8Array no son JSON).
export type ReceiptJSON = { subcategory: number; amount: string; timestamp: string; nonce: string };

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
// o UUIDs CAIP-372 según la versión) — nunca asumir una clave concreta, usar nombre/rdns.
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
  shoes: 334, tops: 289, bottoms: 198, accessories: 145, outerwear: 112,
  groceries: 421, restaurant: 356, drinks: 267, snacks: 189,
  equipment: 134, clothing: 176, footwear: 155, supplements: 93,
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

/** Alta única de la tienda de demo en el árbol de tiendas registradas — la hace el admin. */
export async function registerStoreViaLace(lace: ConnectedAPI): Promise<void> {
  const r = await fetch(`${API_BASE}/build-tx/register-store`);
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error ?? 'Failed to build register-store tx');
  }
  const { tx } = await r.json();
  await laceBalanceAndSubmit(lace, tx);
}

/** La tienda vende y sella el compromiso del recibo on-chain. Devuelve el
 * recibo completo — quien llama es responsable de convertirlo en QR y no
 * guardarlo en ningún otro sitio. */
export async function attestReceiptViaLace(
  lace: ConnectedAPI,
  subcategory: string,
  amount: number,
): Promise<ReceiptJSON> {
  const r = await fetch(`${API_BASE}/build-tx/attest-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subcategory, amount }),
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
