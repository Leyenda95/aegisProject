import type { ReceiptJSON } from './lace.ts';

/**
 * Bóveda personal de recibos: vive solo en este dispositivo (localStorage),
 * nunca se manda a ningún backend. Cada recibo escaneado espera aquí hasta
 * que el usuario decide (y cuándo) convertirlo en una señal.
 */
export type VaultEntry = { id: string; receipt: ReceiptJSON; scannedAt: number };

const STORAGE_KEY = 'aegis-receipt-vault';

function readAll(): VaultEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VaultEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: VaultEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage no disponible (privado/bloqueado) — la bóveda no persiste, no es fatal.
  }
}

export function listVault(): VaultEntry[] {
  return readAll().sort((a, b) => b.scannedAt - a.scannedAt);
}

export function addToVault(receipt: ReceiptJSON): VaultEntry {
  const entries = readAll();
  const id = `${receipt.nonce}:${receipt.timestamp}`;
  const existing = entries.find(e => e.id === id);
  if (existing) return existing;
  const entry: VaultEntry = { id, receipt, scannedAt: Date.now() };
  writeAll([...entries, entry]);
  return entry;
}

export function removeFromVault(id: string): void {
  writeAll(readAll().filter(e => e.id !== id));
}
