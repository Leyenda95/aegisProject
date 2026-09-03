import { useEffect, useRef, useState } from 'react';

/**
 * Detecta qué claves de `counts` han subido desde la última vez que cambió
 * el objeto y por cuánto. El resultado se limpia solo tras `holdMs`, así
 * que sirve para pulsar una barra/chip y lanzar un aviso cuando entra una
 * señal nueva.
 */
export function useCountBumps(counts: Record<string, number> | null, holdMs = 1500): Record<string, number> {
  const prev = useRef<Record<string, number> | null>(null);
  const [bumped, setBumped] = useState<Record<string, number>>({});
  const sig = counts ? Object.entries(counts).map(([k, v]) => `${k}:${v}`).join('|') : '';

  useEffect(() => {
    if (!counts) return;
    const before = prev.current;
    prev.current = { ...counts };
    if (!before) return;
    const ups: Record<string, number> = {};
    for (const k of Object.keys(counts)) {
      const d = (counts[k] ?? 0) - (before[k] ?? 0);
      if (d > 0) ups[k] = d;
    }
    if (Object.keys(ups).length === 0) return;
    setBumped(ups);
    const id = setTimeout(() => setBumped({}), holdMs);
    return () => clearTimeout(id);
    // `sig` codifica el contenido de `counts`; no hace falta `counts` en deps.

  }, [sig, holdMs]);

  return bumped;
}
