import { useCallback, useEffect, useState } from 'react';
import { type AegisState } from '../api.ts';

// Último estado recibido, guardado en el navegador: al volver a abrir la
// página se enseña al instante, sin esperar a la primera respuesta del
// backend, y se sustituye en cuanto llega la nueva.
const CACHE_KEY = 'aegis-aggregate-state';

function readCache(contractAddress: string | null): AegisState | null {
  if (!contractAddress) return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { contractAddress: string; state: AegisState };
    // De otro contrato (se desplegó uno nuevo): no sirve.
    return cached.contractAddress === contractAddress ? cached.state : null;
  } catch {
    return null;
  }
}

function writeCache(contractAddress: string, state: AegisState): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ contractAddress, state }));
  } catch {
    // Sin localStorage (modo privado, bloqueado): solo se pierde el arranque instantáneo.
  }
}

/**
 * Estado agregado del contrato (los contadores públicos). Se consulta al
 * montar y cada 10 s a través del backend (ver chainState.ts). Lo comparten
 * la cinta de estadísticas (App) y el desglose por categoría (StoreView),
 * así que vive aquí en vez de dentro de una sola vista.
 */
export function useAggregateState(contractAddress: string | null, intervalMs = 10_000) {
  const [state, setState] = useState<AegisState | null>(() => readCache(contractAddress));

  const refresh = useCallback(async () => {
    try {
      const { readChainState } = await import('../chainState.ts');
      const fresh = await readChainState(contractAddress);
      setState(fresh);
      if (contractAddress) writeCache(contractAddress, fresh);
    } catch {
      // indexador caído o sin contrato: se reintenta en el siguiente tick
    }
  }, [contractAddress]);

  useEffect(() => {
    // Si la dirección llega después del primer render, se enseña ya lo guardado para ella.
    const cached = readCache(contractAddress);
    if (cached) setState(cached);
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs, contractAddress]);

  return { state, refresh };
}
