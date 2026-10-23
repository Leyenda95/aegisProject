import { useSyncExternalStore } from 'react';

// Qué compartir por defecto al publicar una señal, además de la categoría y
// la subcategoría (pestaña Privacidad del móvil). La ventana de publicar
// arranca con esto marcado y se puede cambiar compra a compra. Hoy es solo
// la vista previa de la revelación selectiva: el contrato publica siempre la
// subcategoría y la cantidad, y nada más (ver RedactedTicket).
export type ShareField = 'amount' | 'datetime' | 'products' | 'age' | 'avgTicket';
export const SHARE_FIELDS: ShareField[] = ['amount', 'datetime', 'products', 'age', 'avgTicket'];

const KEY = 'aegis-share-defaults';
const EVENT = 'aegis-share-defaults';
const NONE: ShareField[] = [];

let cache: { raw: string | null; fields: ShareField[] } = { raw: null, fields: NONE };

function readDefaults(): ShareField[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cache.fields;
  }
  if (raw === cache.raw) return cache.fields;
  let fields = NONE;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) fields = SHARE_FIELDS.filter(f => parsed.includes(f));
  } catch {
    // Dato corrupto: nada marcado.
  }
  cache = { raw, fields };
  return fields;
}

export function setShareDefault(field: ShareField, on: boolean): void {
  const current = readDefaults();
  const fields = SHARE_FIELDS.filter(f => (f === field ? on : current.includes(f)));
  const raw = JSON.stringify(fields);
  try {
    localStorage.setItem(KEY, raw);
    cache = { raw, fields };
  } catch {
    cache = { raw: null, fields };
  }
  window.dispatchEvent(new Event(EVENT));
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

/** Lo que se comparte por defecto; se actualiza solo. */
export function useShareDefaults(): ShareField[] {
  return useSyncExternalStore(subscribe, readDefaults);
}
