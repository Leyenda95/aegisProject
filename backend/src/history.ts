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
import type { NetworkConfig } from './config.js';

export type TimeRange = '7d' | '30d' | '90d' | '365d';

const RANGE_DAYS: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

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
// true una vez recibido todo el historial anterior: a partir de ahí el
// último snapshot es el estado actual del contrato (ver latestCounters).
let isCaughtUp = false;
let trackedAddress: string | null = null;
let disposeClient: (() => void) | null = null;

const SUBSCRIPTION = `
  subscription ($address: HexEncoded!, $offset: BlockOffset) {
    contractActions(address: $address, offset: $offset) {
      state
      transaction { block { height timestamp } }
    }
  }`;

export const COUNTER_FIELDS = [
  'signalsElectronics', 'signalsFashion', 'signalsFood', 'signalsSports', 'signalsHome', 'signalsOther',
  'signalsMobile', 'signalsTablet', 'signalsComputer', 'signalsCamera', 'signalsAudio', 'signalsGaming',
  'signalsShoes', 'signalsTops', 'signalsBottoms', 'signalsAccessories', 'signalsOuterwear',
  'signalsGroceries', 'signalsRestaurant', 'signalsCafes', 'signalsFastfood', 'signalsLocalshops',
  'signalsEquipment', 'signalsClothing', 'signalsFootwear', 'signalsSupplements',
  'signalsFurniture', 'signalsAppliances', 'signalsDecor', 'signalsTools',
  'totalSignals', 'campaignCount', 'isSeeded',
] as const satisfies readonly (keyof AegisState)[];

/**
 * Lee los contadores de un estado del contrato y libera enseguida la
 * memoria del estado. ContractState vive en WebAssembly, fuera del heap de
 * JavaScript: el recolector de basura no ve lo que ocupa y casi nunca lo
 * libera por su cuenta. Sin el free(), cada transacción del historial
 * dejaba su estado completo en memoria y con unas mil transacciones el
 * proceso pasaba de 1 GB (Railway lo mataba por falta de memoria).
 */
function readCounters(stateHex: string): AegisState {
  const contractState = ContractState.deserialize(Buffer.from(stateHex, 'hex'));
  const chargedState = contractState.data;
  try {
    const l = ledger(chargedState) as unknown as Record<string, bigint>;
    const counters: Record<string, bigint> = {};
    for (const field of COUNTER_FIELDS) counters[field] = l[field]!;
    return counters as AegisState;
  } finally {
    // free() existe en tiempo de ejecución (lo genera wasm-bindgen), pero no
    // aparece en los tipos del paquete.
    (chargedState as unknown as { free?: () => void }).free?.();
    (contractState as unknown as { free?: () => void }).free?.();
  }
}

type ActionMessage = {
  contractActions: { state: string; transaction: { block: { height: number; timestamp: number } } };
};

const LATEST_ACTION = `
  query ($address: HexEncoded!) {
    contractAction(address: $address) {
      transaction { block { height } }
    }
  }`;

/** Bloque de la última transacción del contrato, preguntado al indexer por HTTP. */
async function latestActionHeight(indexer: string, contractAddress: string): Promise<number> {
  const res = await fetch(indexer, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: LATEST_ACTION, variables: { address: contractAddress } }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.json() as {
    data?: { contractAction?: { transaction: { block: { height: number } } } | null };
    errors?: { message: string }[];
  };
  const height = body.data?.contractAction?.transaction.block.height;
  if (height === undefined) throw new Error(body.errors?.[0]?.message ?? `indexer answered ${res.status}`);
  return height;
}

/**
 * Empieza a seguir el historial del contrato. La promesa se resuelve cuando
 * ya ha llegado todo el historial anterior. La suscripción no avisa de
 * cuándo termina de ponerse al día, así que al empezar se pregunta al
 * indexer cuál es la última transacción del contrato y se espera a recibir
 * hasta ella. (Antes se daba por hecho tras un rato sin recibir nada, pero
 * Blockfrost a veces tarda más que ese rato entre envíos y el historial se
 * daba por completo a medias.) Se puede llamar varias veces, solo se
 * suscribe una por contrato: si cambia la dirección (se desplegó uno
 * nuevo), se descarta el historial anterior y se empieza de cero.
 */
export function trackContractHistory(
  indexer: Pick<NetworkConfig, 'indexer' | 'indexerWS'>,
  contractAddress: ContractAddress,
): Promise<void> {
  if (caughtUp && trackedAddress === contractAddress) return caughtUp;

  disposeClient?.();
  snapshots = [];
  seen = new Set();
  isCaughtUp = false;
  trackedAddress = contractAddress;

  caughtUp = new Promise((resolve) => {
    let targetHeight: number | null = null;
    // Al cargar el historial anterior, deserializar el estado de cada
    // transacción bloquea el proceso varios minutos (son miles y el estado
    // crece con cada recibo). Para los informes por periodos basta con el
    // estado al final de cada hora, así que se guarda la última recibida
    // (`pending`) y solo se procesa cuando llega una de otra hora. Una vez
    // al día, cada transacción nueva se procesa al momento.
    let pending: ActionMessage['contractActions'] | null = null;
    const processPending = () => {
      if (!pending) return;
      const { state, transaction: { block } } = pending;
      snapshots.push({ height: block.height, timestamp: block.timestamp, state: readCounters(state) });
      pending = null;
    };
    const checkCaughtUp = () => {
      if (isCaughtUp || targetHeight === null || trackedAddress !== contractAddress) return;
      const lastHeight = pending?.transaction.block.height ?? snapshots.at(-1)?.height;
      if (lastHeight === undefined || lastHeight < targetHeight) return;
      processPending();
      isCaughtUp = true;
      console.log(`[history] caught up: ${snapshots.length} snapshots loaded`);
      resolve();
    };
    const fetchTarget = () => {
      if (trackedAddress !== contractAddress) return;
      latestActionHeight(indexer.indexer, contractAddress)
        .then((height) => { targetHeight = height; checkCaughtUp(); })
        .catch((err) => {
          console.error('[history] cannot read the latest contract transaction, retrying in 5s:', err instanceof Error ? err.message : err);
          setTimeout(fetchTarget, 5000);
        });
    };

    // Si se corta la conexión, graphql-ws reintenta solo. Al reconectar se
    // pide desde el bloque siguiente al último recibido, para no duplicar.
    const client = createClient({ url: indexer.indexerWS, webSocketImpl: WebSocket, retryAttempts: Infinity, lazy: false });
    disposeClient = () => { void client.dispose(); };
    const subscribe = () => {
      if (trackedAddress !== contractAddress) return;
      const last = snapshots.at(-1);
      client.subscribe<ActionMessage>(
        { query: SUBSCRIPTION, variables: { address: contractAddress, offset: { height: last ? last.height + 1 : 0 } } },
        {
          next: ({ data }) => {
            if (!data || trackedAddress !== contractAddress) return;
            const action = data.contractActions;
            const { state, transaction: { block } } = action;
            const key = `${block.height}:${createHash('sha256').update(state).digest('hex')}`;
            if (seen.has(key)) return;
            seen.add(key);
            if (isCaughtUp) {
              // En directo: cada transacción nueva, al momento.
              pending = action;
              processPending();
              return;
            }
            const hourOf = (ts: number) => Math.floor(ts / HOUR_MS);
            if (pending && hourOf(pending.transaction.block.timestamp) !== hourOf(block.timestamp)) processPending();
            pending = action;
            checkCaughtUp();
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
    fetchTarget();
  });
  return caughtUp;
}

/**
 * Contadores actuales del contrato, sacados de la memoria: la suscripción
 * recibe cada transacción nueva al momento, así que el último snapshot es
 * el estado actual sin tener que pedirlo al indexer y deserializarlo (que
 * es pesado y bloquea el proceso). null mientras aún se está cargando el
 * historial anterior: entonces quien llama debe leerlo del indexer.
 */
export function latestCounters(contractAddress: string): AegisState | null {
  if (!isCaughtUp || trackedAddress !== contractAddress) return null;
  return snapshots.at(-1)?.state ?? null;
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
  indexer: Pick<NetworkConfig, 'indexer' | 'indexerWS'>,
  contractAddress: ContractAddress,
  range: TimeRange,
): Promise<PeriodStates> {
  await trackContractHistory(indexer, contractAddress);
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
