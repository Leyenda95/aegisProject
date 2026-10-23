import { useSyncExternalStore } from 'react';
import type { ReceiptJSON } from './lace.ts';

// Los tickets del cliente, guardados solo en este dispositivo: los que
// llegan de la caja de la demo, del escáner o de un enlace /r#. Sobreviven a
// las recargas y nunca salen del navegador; "Borrar mis datos" (pestaña
// Privacidad del móvil) los quita. Va en localStorage: son pocos y pequeños,
// y así otra pestaña abierta (la app en /app, p. ej.) se entera al momento.
const KEY = 'aegis-vault-v1';
const EVENT = 'aegis-vault';

export type VaultEntry = {
  receipt: ReceiptJSON;
  /** Cuándo llegó al móvil. */
  receivedAt: number;
  /** Cuándo se publicó su señal; sin esto, el ticket sigue pendiente. */
  publishedAt?: number;
  /** La comisión de la señal la pagó el patrocinio de Aegis. */
  sponsored?: boolean;
};

// Lo último leído, para devolver siempre el mismo array mientras no cambie
// (useSyncExternalStore lo exige). Si localStorage está bloqueado, los tickets
// viven solo aquí, en memoria, hasta recargar.
let cache: { raw: string | null; entries: VaultEntry[] } = { raw: null, entries: [] };

function readVault(): VaultEntry[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cache.entries;
  }
  if (raw === cache.raw) return cache.entries;
  let entries: VaultEntry[] = [];
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) entries = parsed as VaultEntry[];
  } catch {
    // Dato corrupto: se empieza de cero.
  }
  cache = { raw, entries };
  return entries;
}

function writeVault(entries: VaultEntry[]): void {
  const raw = JSON.stringify(entries);
  try {
    localStorage.setItem(KEY, raw);
    cache = { raw, entries };
  } catch {
    cache = { raw: null, entries };
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Guarda un ticket recién recibido (si ya estaba, no hace nada). Los más nuevos, primero. */
export function addReceipt(receipt: ReceiptJSON): void {
  const entries = readVault();
  if (entries.some(e => e.receipt.nonce === receipt.nonce)) return;
  writeVault([{ receipt, receivedAt: Date.now() }, ...entries]);
}

/** Marca un ticket como publicado: pasa de pendiente a la lista de compras con la señal enviada. */
export function markPublished(nonce: string, sponsored: boolean): void {
  writeVault(readVault().map(e => (e.receipt.nonce === nonce ? { ...e, publishedAt: Date.now(), sponsored } : e)));
}

/** "Borrar mis datos": todos los tickets de este dispositivo. */
export function clearVault(): void {
  writeVault([]);
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) onChange(); };
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** Los tickets del dispositivo, el más nuevo primero; se actualiza solo. */
export function useVault(): VaultEntry[] {
  return useSyncExternalStore(subscribe, readVault);
}
