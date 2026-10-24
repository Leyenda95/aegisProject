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
//
// Lo mismo sirve para el directo de la web (cada transacción nueva se avisa
// en onLiveEvent, que GET /events reenvía al navegador) y para las series de
// las gráficas (readHistory, GET /history). Los cálculos están en series.ts.
//
// Recibir todo el historial tarda (cada transacción trae el estado entero del
// contrato, que crece con cada recibo): con unas miles de transacciones, más
// de diez minutos. Por eso lo ya leído se guarda en disco y, tras un
// reinicio, solo se piden las transacciones nuevas.
import { createHash } from 'node:crypto';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';
import { ContractState, type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { ledger } from '../../contract/managed/aegis/contract/index.js';
import type { AegisState } from './contract.js';
import type { NetworkConfig } from './config.js';
import {
  COUNTER_FIELDS, DAY_MS, HOUR_MS, RANGE_DAYS,
  buildHistory, compactSnapshots, deltaCounts, fromCounts, parseSnapshots, recentChanges, seededAfter, serializeSnapshots,
  toCounts,
  type Change, type Counts, type History, type Snapshot, type TimeRange,
} from './series.js';

export { COUNTER_FIELDS };
export type { TimeRange };

// Al cargar el historial, las transacciones de las dos últimas horas se
// procesan una a una, como las que llegan en directo: así, nada más arrancar,
// ya se sabe qué hizo cada una de las más recientes (la lista de últimas
// señales que manda /events al conectarse).
const RECENT_MS = 2 * 60 * 60 * 1000;
const RECENT_LIMIT = 20;

// El historial guardado, en el directorio de trabajo (en Railway, el volumen
// /data, ver el Dockerfile), como la dirección del contrato.
const HISTORY_FILE = `.history-${process.env['MIDNIGHT_NETWORK'] ?? 'local'}.json`;
const SAVE_EVERY_MS = 60_000;
// Lo de hace más de dos días se guarda compactado por horas (ver compactSnapshots).
const KEEP_EXACT_MS = 2 * DAY_MS;

export function parseRange(value: string | null): TimeRange {
  return value && value in RANGE_DAYS ? value as TimeRange : '7d';
}

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

/** Estado del contrato al conectarse a /events, con las últimas transacciones que cambiaron algo. */
export type LiveSnapshot = { contractAddress: string; height: number; timestamp: number; state: Counts; recent: Change[] };
/** Una transacción nueva que ha cambiado algún contador. */
export type LiveChange = Change & { contractAddress: string; state: Counts };
export type LiveEvent = { type: 'snapshot'; data: LiveSnapshot } | { type: 'change'; data: LiveChange };

const listeners = new Set<(event: LiveEvent) => void>();

/**
 * Avisa de cada transacción nueva que cambie algún contador ('change') y de
 * cuándo termina de cargarse el historial ('snapshot'). Devuelve cómo dejar
 * de escuchar.
 */
export function onLiveEvent(listener: (event: LiveEvent) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function emit(event: LiveEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (err) {
      console.error('[history] live listener failed:', err);
    }
  }
}

/** Lo que manda /events al conectarse, o null mientras se carga el historial. */
export function liveSnapshot(contractAddress: string): LiveSnapshot | null {
  const last = snapshots.at(-1);
  if (!isCaughtUp || trackedAddress !== contractAddress || !last) return null;
  return {
    contractAddress,
    height: last.height,
    timestamp: last.timestamp,
    state: toCounts(last.state),
    recent: recentChanges(snapshots, RECENT_LIMIT),
  };
}

/**
 * El historial guardado de este contrato, sin las transacciones de su último
 * bloque: así la suscripción vuelve a pedir ese bloque entero (puede tener
 * más de una) y sigue desde ahí. Vacío si no hay fichero o es de otro contrato.
 */
function loadSnapshots(contractAddress: string): Snapshot[] {
  try {
    const saved = parseSnapshots(readFileSync(HISTORY_FILE, 'utf8'));
    if (!saved || saved.contractAddress !== contractAddress || saved.snapshots.length === 0) return [];
    const lastHeight = saved.snapshots.at(-1)!.height;
    const loaded = saved.snapshots.filter((s) => s.height < lastHeight);
    console.log(`[history] ${loaded.length} snapshots read from ${HISTORY_FILE}, resuming at block ${lastHeight}`);
    return loaded;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') console.error(`[history] cannot read ${HISTORY_FILE}, loading everything:`, err);
    return [];
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Compacta lo antiguo y guarda el historial en disco (de golpe, para no dejar nunca un fichero a medias). */
function saveSnapshots(contractAddress: string): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (trackedAddress !== contractAddress) return;
  snapshots = compactSnapshots(snapshots, Date.now() - KEEP_EXACT_MS);
  try {
    writeFileSync(`${HISTORY_FILE}.tmp`, serializeSnapshots(contractAddress, snapshots));
    renameSync(`${HISTORY_FILE}.tmp`, HISTORY_FILE);
  } catch (err) {
    console.error(`[history] cannot save ${HISTORY_FILE}:`, err);
  }
}

/** Guarda como mucho una vez por minuto, también mientras se carga el historial. */
function scheduleSave(contractAddress: string): void {
  saveTimer ??= setTimeout(() => saveSnapshots(contractAddress), SAVE_EVERY_MS);
}

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
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  trackedAddress = contractAddress;
  snapshots = loadSnapshots(contractAddress);
  seen = new Set();
  isCaughtUp = false;

  caughtUp = new Promise((resolve) => {
    let targetHeight: number | null = null;
    // Al cargar el historial anterior, deserializar el estado de cada
    // transacción bloquea el proceso varios minutos (son miles y el estado
    // crece con cada recibo). Para los informes por periodos basta con el
    // estado al final de cada hora, así que se guarda la última recibida
    // (`pending`) y solo se procesa cuando llega una de otra hora. Las de la
    // última media hora (RECENT_MS) y, una vez al día, cada transacción
    // nueva se procesan al momento.
    let pending: ActionMessage['contractActions'] | null = null;
    // Si se ha descartado alguna transacción desde la última guardada: la
    // siguiente que se guarde no es la justo posterior (ver Snapshot.exact).
    let dropped = false;
    const processPending = (): Snapshot | null => {
      if (!pending) return null;
      const { state, transaction: { block } } = pending;
      const counters = readCounters(state);
      const snapshot: Snapshot = {
        height: block.height,
        timestamp: block.timestamp,
        state: counters,
        seeded: seededAfter(snapshots.at(-1), counters),
        exact: !dropped,
      };
      snapshots.push(snapshot);
      pending = null;
      dropped = false;
      scheduleSave(contractAddress);
      return snapshot;
    };
    const checkCaughtUp = () => {
      if (isCaughtUp || targetHeight === null || trackedAddress !== contractAddress) return;
      const lastHeight = pending?.transaction.block.height ?? snapshots.at(-1)?.height;
      if (lastHeight === undefined || lastHeight < targetHeight) return;
      processPending();
      isCaughtUp = true;
      saveSnapshots(contractAddress);
      console.log(`[history] caught up: ${snapshots.length} snapshots loaded`);
      const snapshot = liveSnapshot(contractAddress);
      if (snapshot) emit({ type: 'snapshot', data: snapshot });
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
              // En directo: cada transacción nueva, al momento, y se avisa si
              // ha cambiado algo (sellar un recibo o dar de alta una tienda no
              // toca ningún contador).
              pending = action;
              const snapshot = processPending()!;
              const delta = deltaCounts(snapshot.state, snapshots.at(-2)?.state ?? snapshot.state);
              if (Object.keys(delta).length > 0) {
                emit({ type: 'change', data: { contractAddress, height: snapshot.height, timestamp: snapshot.timestamp, state: toCounts(snapshot.state), delta } });
              }
              return;
            }
            if (block.timestamp >= Date.now() - RECENT_MS) {
              processPending();
              pending = action;
              processPending();
            } else {
              const hourOf = (ts: number) => Math.floor(ts / HOUR_MS);
              if (pending && hourOf(pending.transaction.block.timestamp) !== hourOf(block.timestamp)) processPending();
              else if (pending) dropped = true;
              pending = action;
            }
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

export type PeriodStates = {
  range: TimeRange;
  /** Compras dentro del periodo elegido, las mismas que cuenta el mercado (ver buildHistory). */
  current: AegisState;
  /**
   * Las del periodo anterior de la misma duración, para comparar, o null si no
   * se puede: el contrato aún no existía en todo ese periodo, o en alguno de
   * los dos hay una carga de datos de demo, que falsearía la comparación (la
   * misma regla que la web, ver periodFigures).
   */
  previous: AegisState | null;
};

/**
 * true cuando el historial está cargado; false si no termina en `waitMs`:
 * tras un reinicio puede tardar mucho (cada transacción del bot lo alarga) y
 * quien llama no debe quedarse esperando todo ese rato.
 */
async function waitForHistory(
  indexer: Pick<NetworkConfig, 'indexer' | 'indexerWS'>,
  contractAddress: ContractAddress,
  waitMs: number,
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ready = await Promise.race([
    trackContractHistory(indexer, contractAddress).then(() => true),
    new Promise<false>((resolve) => { timer = setTimeout(() => resolve(false), waitMs); }),
  ]);
  clearTimeout(timer);
  return ready;
}

/** null si el historial no termina de cargarse en `waitMs` (ver waitForHistory). */
export async function readPeriodStates(
  indexer: Pick<NetworkConfig, 'indexer' | 'indexerWS'>,
  contractAddress: ContractAddress,
  range: TimeRange,
  waitMs: number,
): Promise<PeriodStates | null> {
  const history = await readHistory(indexer, contractAddress, range, waitMs);
  if (!history) return null;
  const { totals, demo } = history;
  return {
    range,
    current: fromCounts(totals.current),
    previous: totals.previous && demo.current === '0' && demo.previous === '0' ? fromCounts(totals.previous) : null,
  };
}

/** Serie del periodo para las gráficas (ver buildHistory), o null si el historial aún se carga. */
export async function readHistory(
  indexer: Pick<NetworkConfig, 'indexer' | 'indexerWS'>,
  contractAddress: ContractAddress,
  range: TimeRange,
  waitMs: number,
): Promise<History | null> {
  if (!await waitForHistory(indexer, contractAddress, waitMs)) return null;
  return buildHistory(snapshots, range, Date.now());
}
