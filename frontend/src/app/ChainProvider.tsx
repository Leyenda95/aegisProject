import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AegisState, Change } from '../api.ts';
import { CONTRACT_ADDRESS } from '../chainConfig.ts';
import { readChainState } from '../chainState.ts';
import { connectLive } from '../liveEvents.ts';
import { checkStoreRegistered, getLocalContractAddress, getSponsorAvailable } from '../lace.ts';

// Cuántas de las últimas transacciones con cambios se guardan (la lista del mercado).
const RECENT_LIMIT = 20;

// Último estado recibido, guardado en el navegador: al volver a abrir la
// página se enseña al instante, sin esperar a la primera respuesta del
// backend, y se sustituye en cuanto llega la nueva.
const CACHE_KEY = 'aegis-aggregate-state';

function readCache(contractAddress: string | null): AegisState | undefined {
  if (!contractAddress) return undefined;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const cached = JSON.parse(raw) as { contractAddress: string; state: AegisState };
    // De otro contrato (se desplegó uno nuevo): no sirve.
    return cached.contractAddress === contractAddress ? cached.state : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(contractAddress: string, state: AegisState): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ contractAddress, state }));
  } catch {
    // Sin localStorage (modo privado, bloqueado): solo se pierde el arranque instantáneo.
  }
}

type Chain = {
  /** Contrato con el que trabaja la demo, o null si en local aún no hay ninguno desplegado. */
  contractAddress: string | null;
  setContractAddress: (address: string) => void;
  storeRegistered: boolean;
  setStoreRegistered: (registered: boolean) => void;
  /** El backend ya contestó si la tienda está registrada (hasta entonces, storeRegistered es false sin saberlo). */
  storeChecked: boolean;
  /** El backend paga las transacciones (patrocinio): sellar y publicar no necesitan wallet. */
  sponsored: boolean;
  /** Contadores públicos del contrato; null hasta la primera respuesta. */
  state: AegisState | null;
  /** Conectado al directo del backend (GET /events): los contadores cambian en cuanto entra una señal. */
  live: boolean;
  /** Últimas transacciones que cambiaron algún contador, de la más nueva a la más vieja (solo con directo). */
  recent: Change[];
};

const ChainContext = createContext<Chain | null>(null);

/**
 * Lo que la demo sabe de la red: qué contrato usa, si la tienda de demo está
 * registrada, si hay patrocinio y los contadores agregados. Los dos últimos
 * se piden con TanStack Query: cada cierto tiempo, solo con la pestaña
 * visible, y otra vez en cuanto se vuelve a ella. Los contadores, además,
 * llegan en directo mientras haya conexión con /events.
 */
export function ChainProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [contractAddress, setContractAddress] = useState<string | null>(CONTRACT_ADDRESS);
  const [storeRegistered, setStoreRegistered] = useState(false);
  const [storeChecked, setStoreChecked] = useState(false);
  const [live, setLive] = useState(false);
  const [recent, setRecent] = useState<Change[]>([]);

  useEffect(() => {
    // Dirección de contrato y red: datos públicos y fijos (ver chainConfig.ts),
    // no hace falta pedírselos al backend. En local (`npm run dev`) se
    // pregunta además al backend, por si quien clona el repo despliega el suyo:
    // solo si responde que no tiene ninguno se ofrece desplegar.
    if (import.meta.env.DEV) {
      getLocalContractAddress().then(address => {
        if (address !== undefined) setContractAddress(address);
      }).catch(() => {});
    }
    checkStoreRegistered().then(registered => {
      if (registered) setStoreRegistered(true);
      setStoreChecked(true);
    }).catch(() => {});
  }, []);

  // El patrocinio puede ir y venir (el bot se reinicia o tarda en tener la
  // wallet lista), así que se vuelve a comprobar cada minuto.
  const sponsor = useQuery({
    queryKey: ['sponsor'],
    queryFn: getSponsorAvailable,
    refetchInterval: 60_000,
  });

  const aggregate = useQuery({
    queryKey: ['state', contractAddress],
    queryFn: async () => {
      const fresh = await readChainState(contractAddress);
      if (contractAddress) writeCache(contractAddress, fresh);
      return fresh;
    },
    // Con directo, solo de vez en cuando, por si acaso.
    refetchInterval: live ? 60_000 : 10_000,
    // Lo guardado se enseña al momento, pero cuenta como viejo: se pide igualmente.
    initialData: () => readCache(contractAddress),
    initialDataUpdatedAt: 0,
  });

  useEffect(() => {
    if (!contractAddress) return;
    const applyState = (state: AegisState) => {
      // Una consulta a /state en vuelo podría llegar después con el estado de antes.
      void queryClient.cancelQueries({ queryKey: ['state', contractAddress] });
      queryClient.setQueryData(['state', contractAddress], state);
      writeCache(contractAddress, state);
      // Las series de las gráficas (ver useHistory) también han cambiado.
      void queryClient.invalidateQueries({ queryKey: ['history', contractAddress] });
    };
    const disconnect = connectLive({
      onSnapshot: snapshot => {
        if (snapshot.contractAddress !== contractAddress) return;
        applyState(snapshot.state);
        setRecent(snapshot.recent);
      },
      onChange: change => {
        if (change.contractAddress !== contractAddress) return;
        applyState(change.state);
        const { height, timestamp, delta } = change;
        setRecent(prev => [{ height, timestamp, delta }, ...prev].slice(0, RECENT_LIMIT));
      },
      onLive: setLive,
    });
    return () => {
      disconnect();
      setLive(false);
      setRecent([]);
    };
  }, [contractAddress, queryClient]);

  return (
    <ChainContext value={{
      contractAddress, setContractAddress,
      storeRegistered, setStoreRegistered, storeChecked,
      sponsored: sponsor.data ?? false,
      state: aggregate.data ?? null,
      live,
      recent,
    }}>
      {children}
    </ChainContext>
  );
}

export function useChain(): Chain {
  const value = useContext(ChainContext);
  if (!value) throw new Error('useChain necesita ChainProvider');
  return value;
}
