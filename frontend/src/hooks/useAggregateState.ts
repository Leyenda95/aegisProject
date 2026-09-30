import { useCallback, useEffect, useState } from 'react';
import { type AegisState } from '../api.ts';

/**
 * Estado agregado del contrato (los contadores públicos). Se consulta al
 * montar y cada 10 s, directamente del indexador (ver chainState.ts), sin
 * pasar por el backend. Lo comparten la cinta de estadísticas (App) y el
 * desglose por categoría (StoreView), así que vive aquí en vez de dentro de
 * una sola vista.
 *
 * chainState.ts se importa con import() dinámico, no de forma estática:
 * carga ~11MB de WASM (el runtime del contrato), y con un import estático
 * ese peso se cargaría al arrancar toda la página en vez de solo cuando
 * hace falta leer el estado, retrasando el primer render de todo lo demás.
 */
export function useAggregateState(contractAddress: string | null, intervalMs = 10_000) {
  const [state, setState] = useState<AegisState | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { readChainState } = await import('../chainState.ts');
      setState(await readChainState(contractAddress));
    } catch {
      // indexador caído o sin contrato: se reintenta en el siguiente tick
    }
  }, [contractAddress]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { state, refresh };
}
