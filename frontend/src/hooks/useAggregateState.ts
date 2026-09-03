import { useCallback, useEffect, useState } from 'react';
import { getState, type AegisState } from '../api.ts';

/**
 * Estado agregado del contrato (los contadores públicos). Se consulta al
 * montar y cada 10 s. Lo comparten la cinta de estadísticas (App) y el
 * desglose por categoría (StoreView), así que vive aquí en vez de dentro de
 * una sola vista.
 */
export function useAggregateState(intervalMs = 10_000) {
  const [state, setState] = useState<AegisState | null>(null);

  const refresh = useCallback(async () => {
    try {
      setState(await getState());
    } catch {
      // backend caído o sin contrato: se reintenta en el siguiente tick
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { state, refresh };
}
