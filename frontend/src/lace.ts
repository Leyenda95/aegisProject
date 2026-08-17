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
  const r = await fetch('/api/build-tx/deploy');
  if (!r.ok) throw new Error(`Build deploy tx failed: ${await r.text()}`);
  const { tx, contractAddress } = await r.json();

  await laceBalanceAndSubmit(lace, tx);

  const r2 = await fetch('/api/contract-address', {
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
  const r = await fetch('/api/build-tx/seed', {
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

export async function submitSignalViaLace(
  lace: ConnectedAPI,
  subcategory: string,
): Promise<void> {
  const r = await fetch('/api/build-tx/signal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subcategory }),
  });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error || `Backend error ${r.status}`);
  }
  const { tx } = await r.json();
  await laceBalanceAndSubmit(lace, tx);
}
