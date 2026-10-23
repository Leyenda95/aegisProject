import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getHistory, RequestError, type History, type TimeRange } from '../api.ts';
import { useChain } from '../app/ChainProvider.tsx';

// La última serie recibida de cada periodo, guardada en el navegador: al
// volver a la página, o mientras el backend recién arrancado vuelve a leer
// el historial del contrato (tarda minutos), se enseña al momento en vez de
// una gráfica vacía, y se sustituye en cuanto llega la nueva.
const CACHE_KEY = 'aegis-history-v2';

type Cache = { contractAddress: string; series: Partial<Record<TimeRange, History>> };

function readCache(contractAddress: string | null, range: TimeRange): History | undefined {
  if (!contractAddress) return undefined;
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Cache | null;
    // De otro contrato (se desplegó uno nuevo): no sirve.
    return cache?.contractAddress === contractAddress ? cache.series[range] : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(contractAddress: string, history: History): void {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Cache | null;
    const cache: Cache = saved?.contractAddress === contractAddress ? saved : { contractAddress, series: {} };
    cache.series[history.range] = history;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Sin localStorage (modo privado, bloqueado): solo se pierde el arranque instantáneo.
  }
}

/**
 * Serie de un periodo para las gráficas (GET /history). Con directo se vuelve
 * a pedir en cuanto entra una señal (ver ChainProvider); sin él, cada minuto.
 * Al cambiar de periodo se queda la anterior hasta que llega la nueva.
 */
export function useHistory(range: TimeRange) {
  const { contractAddress } = useChain();
  return useQuery({
    queryKey: ['history', contractAddress, range],
    queryFn: async () => {
      const history = await getHistory(range);
      if (contractAddress) writeCache(contractAddress, history);
      return history;
    },
    enabled: contractAddress !== null,
    refetchInterval: 60_000,
    // Lo guardado se enseña al momento, pero cuenta como viejo: se pide igualmente.
    initialData: () => readCache(contractAddress, range),
    initialDataUpdatedAt: 0,
    placeholderData: keepPreviousData,
    // 503: el backend acaba de arrancar y aún carga el historial del contrato.
    retry: (failures, error) => error instanceof RequestError && error.status === 503 && failures < 60,
    retryDelay: 5_000,
  });
}
