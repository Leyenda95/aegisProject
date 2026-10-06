// Compras por periodo de tiempo. El contrato solo guarda contadores
// acumulados, pero cada transacción que lo toca queda en la cadena con su
// fecha y el estado en que dejó el contrato. Así que las compras de un
// periodo son la resta entre los contadores al final y al principio de ese
// periodo, sin tocar el contrato ni guardar nada en disco.
//
// El indexer no tiene ninguna consulta que liste ese historial (contractAction
// con un bloque concreto solo responde si hubo una transacción justo en ese
// bloque), pero sí una suscripción, contractActions, que emite todas las
// transacciones del contrato desde el bloque que se le pida y luego sigue
// emitiendo las nuevas en directo. El backend se suscribe al arrancar y
// guarda en memoria solo los contadores y la fecha de cada una.
import { createHash } from 'node:crypto';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';
import { ContractState, type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { ledger } from '../../contract/managed/aegis/contract/index.js';
import type { AegisState } from './contract.js';

export type TimeRange = '7d' | '30d' | '90d' | '365d';

const RANGE_DAYS: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseRange(value: string | null): TimeRange {
  return value && value in RANGE_DAYS ? value as TimeRange : '7d';
}

// Contadores que no son compras: se toman del estado actual, restarlos no
// tiene sentido.
const NON_PURCHASE_FIELDS = new Set(['campaignCount', 'isSeeded']);

type Snapshot = { height: number; timestamp: number; state: AegisState };

let snapshots: Snapshot[] = [];
// Al reconectar, graphql-ws vuelve a pedir la suscripción con la misma
// variable de inicio, así que pueden repetirse transacciones ya recibidas.
let seen = new Set<string>();
let caughtUp: Promise<void> | null = null;
let trackedAddress: string | null = null;
let disposeClient: (() => void) | null = null;

const SUBSCRIPTION = `
  subscription ($address: HexEncoded!, $offset: BlockOffset) {
    contractActions(address: $address, offset: $offset) {
      state
      transaction { block { height timestamp } }
    }
  }`;

type ActionMessage = {
  contractActions: { state: string; transaction: { block: { height: number; timestamp: number } } };
};

/**
 * Empieza a seguir el historial del contrato. La promesa se resuelve cuando
 * ya ha llegado todo el historial anterior (la suscripción no avisa de
 * cuándo termina de ponerse al día, así que se da por hecho cuando pasa un
 * rato sin recibir nada). Se puede llamar varias veces, solo se suscribe
 * una por contrato: si cambia la dirección (se desplegó uno nuevo), se
 * descarta el historial anterior y se empieza de cero.
 */
export function trackContractHistory(indexerWS: string, contractAddress: ContractAddress): Promise<void> {
  if (caughtUp && trackedAddress === contractAddress) return caughtUp;

  disposeClient?.();
  snapshots = [];
  seen = new Set();
  trackedAddress = contractAddress;

  caughtUp = new Promise((resolve) => {
    let quietTimer: NodeJS.Timeout | undefined;
    const restartQuietTimer = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(resolve, 2000);
    };

    // Si se corta la conexión, graphql-ws reintenta solo. Al reconectar se
    // pide desde el bloque siguiente al último recibido, para no duplicar.
    const client = createClient({ url: indexerWS, webSocketImpl: WebSocket, retryAttempts: Infinity, lazy: false });
    disposeClient = () => { void client.dispose(); };
    const subscribe = () => {
      if (trackedAddress !== contractAddress) return;
      const last = snapshots.at(-1);
      client.subscribe<ActionMessage>(
        { query: SUBSCRIPTION, variables: { address: contractAddress, offset: { height: last ? last.height + 1 : 0 } } },
        {
          next: ({ data }) => {
            if (!data || trackedAddress !== contractAddress) return;
            const { state, transaction: { block } } = data.contractActions;
            const key = `${block.height}:${createHash('sha256').update(state).digest('hex')}`;
            if (seen.has(key)) return;
            seen.add(key);
            snapshots.push({
              height: block.height,
              timestamp: block.timestamp,
              state: ledger(ContractState.deserialize(Buffer.from(state, 'hex')).data) as AegisState,
            });
            restartQuietTimer();
          },
          error: (err) => {
            console.error('[history] subscription error, retrying in 5s', err);
            setTimeout(subscribe, 5000);
          },
          complete: () => setTimeout(subscribe, 5000),
        },
      );
    };
    subscribe();
    restartQuietTimer();
  });
  return caughtUp;
}

/** Estado del contrato en un momento dado: el de la última transacción hasta esa fecha. */
function stateAt(time: number): AegisState | null {
  for (let i = snapshots.length - 1; i >= 0; i--) {
    if (snapshots[i].timestamp <= time) return snapshots[i].state;
  }
  // Antes de desplegarse el contrato no hay estado: cuenta como todo a cero,
  // así "último año" muestra todo lo que hay aunque el contrato sea más nuevo.
  return null;
}

function subtract(end: AegisState, start: AegisState | null): AegisState {
  const result: Record<string, bigint> = {};
  for (const [key, value] of Object.entries(end)) {
    if (typeof value !== 'bigint') continue;
    result[key] = NON_PURCHASE_FIELDS.has(key) || !start
      ? value
      : value - (start[key as keyof AegisState] as bigint);
  }
  return result as AegisState;
}

export type PeriodStates = {
  range: TimeRange;
  /** Compras dentro del periodo elegido (de hace N días hasta ahora). */
  current: AegisState;
  /** Compras en el periodo anterior de la misma duración, para comparar. */
  previous: AegisState;
};

export async function readPeriodStates(
  indexerWS: string,
  contractAddress: ContractAddress,
  range: TimeRange,
): Promise<PeriodStates> {
  await trackContractHistory(indexerWS, contractAddress);
  const now = snapshots.at(-1)?.state;
  if (!now) throw new Error('Contract state not found');

  const span = RANGE_DAYS[range] * DAY_MS;
  const start = stateAt(Date.now() - span);
  const prevStart = stateAt(Date.now() - 2 * span);

  return {
    range,
    current: subtract(now, start),
    previous: start ? subtract(start, prevStart) : subtract(now, now),
  };
}
