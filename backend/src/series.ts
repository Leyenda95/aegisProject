// Cálculos sobre la lista de instantáneas del contrato que guarda history.ts
// (los contadores tras cada transacción, o tras la última de cada hora en el
// historial antiguo): qué cambió en cada transacción, cuánto viene de las
// cargas de datos de demo y las series por periodo de las gráficas. No tiene
// estado propio, así se puede probar con listas inventadas.
import type { AegisState } from './contract.js';

export type TimeRange = '7d' | '30d' | '90d' | '365d';

export const RANGE_DAYS: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

// Separación entre los puntos de una serie: la menor de estas que no pase de
// MAX_POINTS. Siempre horas enteras: del historial antiguo solo queda el
// estado al final de cada hora (ver trackContractHistory), y en esos
// instantes es exacto.
const STEPS_MS = [HOUR_MS, 6 * HOUR_MS, DAY_MS, 3 * DAY_MS];
const MAX_POINTS = 170;

// Las transacciones que se miran como mucho al buscar las últimas con
// cambios: más atrás todo está compactado por horas.
const RECENT_SCAN = 500;

export const COUNTER_FIELDS = [
  'signalsElectronics', 'signalsFashion', 'signalsFood', 'signalsSports', 'signalsHome', 'signalsOther',
  'signalsMobile', 'signalsTablet', 'signalsComputer', 'signalsCamera', 'signalsAudio', 'signalsGaming',
  'signalsShoes', 'signalsTops', 'signalsBottoms', 'signalsAccessories', 'signalsOuterwear',
  'signalsGroceries', 'signalsRestaurant', 'signalsCafes', 'signalsFastfood', 'signalsLocalshops',
  'signalsEquipment', 'signalsClothing', 'signalsFootwear', 'signalsSupplements',
  'signalsFurniture', 'signalsAppliances', 'signalsDecor', 'signalsTools',
  'totalSignals', 'campaignCount', 'isSeeded',
] as const satisfies readonly (keyof AegisState)[];

type CounterField = typeof COUNTER_FIELDS[number];

// Contadores que no son compras: se toman del estado actual, restarlos no
// tiene sentido.
export const NON_PURCHASE_FIELDS = new Set<string>(['campaignCount', 'isSeeded']);

const SIGNAL_FIELDS = COUNTER_FIELDS.filter((f) => !NON_PURCHASE_FIELDS.has(f));

export const ZERO_COUNTERS = Object.fromEntries(COUNTER_FIELDS.map((f) => [f, 0n])) as AegisState;

export type Snapshot = {
  height: number;
  timestamp: number;
  state: AegisState;
  /**
   * Lo que han sumado hasta aquí las cargas de datos de demo (el circuito
   * seed): miles de señales de golpe que no son actividad del mercado. Las
   * series las cuentan, como los contadores, pero lo dicen (History.demo).
   */
  seeded: AegisState;
  /**
   * La instantánea anterior de la lista es la transacción justo anterior en
   * la cadena: la diferencia entre las dos es exactamente lo que hizo esta.
   * Falso cuando entre medias se descartaron otras (compactación por horas).
   */
  exact: boolean;
};

/** Contadores en texto para el JSON (BigInt no se puede serializar). */
export type Counts = Partial<Record<CounterField, string>>;

export function toCounts(state: AegisState): Counts {
  return Object.fromEntries(COUNTER_FIELDS.map((f) => [f, state[f].toString()]));
}

/** Los contadores que cambian de `before` a `after`, con la diferencia. */
export function deltaCounts(after: AegisState, before: AegisState): Counts {
  const delta: Counts = {};
  for (const f of COUNTER_FIELDS) {
    const d = after[f] - before[f];
    if (d !== 0n) delta[f] = d.toString();
  }
  return delta;
}

/**
 * Lo sumado por las cargas de datos de demo hasta `state`, sabiendo la
 * instantánea anterior. Una carga se reconoce porque sube isSeeded. En el
 * historial compactado por horas cuenta como carga todo lo de esa hora: las
 * cargas se hacen al montar la demo, sin compras alrededor.
 */
export function seededAfter(prev: Snapshot | undefined, state: AegisState): AegisState {
  const before = prev?.state ?? ZERO_COUNTERS;
  const seeded = prev?.seeded ?? ZERO_COUNTERS;
  if (state.isSeeded <= before.isSeeded) return seeded;
  const next = { ...seeded };
  for (const f of SIGNAL_FIELDS) next[f] += state[f] - before[f];
  return next;
}

/** La última instantánea hasta ese momento, o undefined si el contrato aún no existía. */
export function snapshotAt(snapshots: readonly Snapshot[], time: number): Snapshot | undefined {
  // Búsqueda binaria: la lista va en orden de llegada, que es el de los bloques.
  let lo = 0;
  let hi = snapshots.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (snapshots[mid].timestamp <= time) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 ? snapshots[lo - 1] : undefined;
}

/** Contadores en ese momento: los de la última transacción hasta entonces, o todo a cero antes del despliegue. */
function stateAt(snapshots: readonly Snapshot[], time: number): AegisState {
  return snapshotAt(snapshots, time)?.state ?? ZERO_COUNTERS;
}

function periodCounts(end: AegisState, start: AegisState): Counts {
  return Object.fromEntries(SIGNAL_FIELDS.map((f) => [f, (end[f] - start[f]).toString()]));
}

/** Señales de las cargas de datos de demo entre dos momentos. */
function seededBetween(snapshots: readonly Snapshot[], start: number, end: number): string {
  const seeded = (t: number) => snapshotAt(snapshots, t)?.seeded.totalSignals ?? 0n;
  return (seeded(end) - seeded(start)).toString();
}

export type History = {
  range: TimeRange;
  /** Principio y final (ahora) del periodo, en ms. */
  from: number;
  to: number;
  /** Duración del periodo. La serie del anterior va desplazada esto hacia delante, para pintarla encima. */
  span: number;
  /** Primera transacción del contrato (su despliegue), o null si no hay ninguna. */
  since: number | null;
  /** Señales acumuladas desde `from`, como [instante, señales]. Todas, como los contadores del contrato. */
  current: [number, number][];
  /** Lo mismo en el periodo anterior, en los mismos instantes; null si el contrato no existía en todo ese periodo. */
  previous: [number, number][] | null;
  /** Señales por contador en el periodo y en el anterior. */
  totals: { current: Counts; previous: Counts | null };
  /**
   * De ellas, las de una carga de datos de demo (miles de golpe al montar la
   * demo): la web lo dice y no compara periodos cuando hay alguna, porque la
   * comparación saldría falseada.
   */
  demo: { current: string; previous: string | null };
};

/**
 * Serie de un periodo para las gráficas: las señales acumuladas desde que
 * empieza, punto a punto, y lo mismo en el periodo anterior para comparar.
 * Si el contrato es más nuevo que el periodo, la serie empieza en su despliegue.
 */
export function buildHistory(snapshots: readonly Snapshot[], range: TimeRange, now: number): History {
  const span = RANGE_DAYS[range] * DAY_MS;
  const since = snapshots[0]?.timestamp ?? null;
  const start = since !== null ? Math.max(since, now - span) : now - span;
  const step = STEPS_MS.find((s) => (now - start) / s <= MAX_POINTS) ?? STEPS_MS.at(-1)!;
  const gridEnd = Math.floor(now / step) * step;
  const from = since !== null && since > gridEnd - span
    ? Math.min(Math.floor(since / step) * step, gridEnd)
    : gridEnd - span;

  const times: number[] = [];
  for (let t = from; t <= gridEnd; t += step) times.push(t);
  if (now > gridEnd) times.push(now);

  const total = (t: number) => stateAt(snapshots, t).totalSignals;
  const base = total(from);
  const current = times.map((t): [number, number] => [t, Number(total(t) - base)]);

  // El periodo anterior acaba donde empieza este. El último punto de este (ahora)
  // cae un poco más allá de un periodo entero, y ahí el anterior ya no sube.
  const prevFrom = from - span;
  const hasPrevious = since !== null && since <= prevFrom;
  const prevBase = total(prevFrom);
  const previous = hasPrevious
    ? times.map((t): [number, number] => [t, Number(total(Math.min(t - span, from)) - prevBase)])
    : null;

  const atFrom = stateAt(snapshots, from);
  return {
    range,
    from,
    to: now,
    span,
    since,
    current,
    previous,
    totals: {
      current: periodCounts(stateAt(snapshots, now), atFrom),
      previous: hasPrevious ? periodCounts(atFrom, stateAt(snapshots, prevFrom)) : null,
    },
    demo: {
      current: seededBetween(snapshots, from, now),
      previous: hasPrevious ? seededBetween(snapshots, prevFrom, from) : null,
    },
  };
}

/**
 * Deja solo la última transacción de cada hora en lo anterior a `cutoff`,
 * como el historial antiguo al cargarlo (ver trackContractHistory). Las
 * series se calculan en horas enteras, así que no pierden nada, y la memoria
 * y el fichero guardado no crecen sin límite. Lo posterior queda entero.
 */
export function compactSnapshots(snapshots: readonly Snapshot[], cutoff: number): Snapshot[] {
  const hourOf = (ts: number) => Math.floor(ts / HOUR_MS);
  const result: Snapshot[] = [];
  let dropped = false;
  for (let i = 0; i < snapshots.length; i++) {
    const s = snapshots[i];
    const next = snapshots[i + 1];
    if (s.timestamp < cutoff && next && hourOf(next.timestamp) === hourOf(s.timestamp)) {
      dropped = true;
      continue;
    }
    // Si se ha quitado la de antes, la diferencia con la anterior ya no es solo lo de esta.
    result.push(dropped && s.exact ? { ...s, exact: false } : s);
    dropped = false;
  }
  return result;
}

const FILE_VERSION = 1;

type SavedHistory = {
  version: number;
  contractAddress: string;
  fields: string[];
  /** Una fila por instantánea: bloque, fecha, exacta (1/0) y los contadores en el orden de `fields`. */
  rows: (number | string)[][];
  /** Lo sumado por las cargas de demo, solo en las filas donde cambia. */
  seeded: Record<number, string[]>;
};

/** El historial en texto, para guardarlo en disco (ver history.ts). */
export function serializeSnapshots(contractAddress: string, snapshots: readonly Snapshot[]): string {
  const saved: SavedHistory = { version: FILE_VERSION, contractAddress, fields: [...COUNTER_FIELDS], rows: [], seeded: {} };
  let seeded = ZERO_COUNTERS;
  snapshots.forEach((s, i) => {
    saved.rows.push([s.height, s.timestamp, s.exact ? 1 : 0, ...COUNTER_FIELDS.map((f) => s.state[f].toString())]);
    if (s.seeded !== seeded) {
      saved.seeded[i] = COUNTER_FIELDS.map((f) => s.seeded[f].toString());
      seeded = s.seeded;
    }
  });
  return JSON.stringify(saved);
}

/** Lo contrario de serializeSnapshots; null si el formato no es el de ahora. */
export function parseSnapshots(text: string): { contractAddress: string; snapshots: Snapshot[] } | null {
  const saved = JSON.parse(text) as SavedHistory;
  if (saved.version !== FILE_VERSION || saved.fields.join() !== COUNTER_FIELDS.join()) return null;
  const toCounters = (values: (number | string)[]) =>
    Object.fromEntries(COUNTER_FIELDS.map((f, k) => [f, BigInt(values[k])])) as AegisState;
  let seeded = ZERO_COUNTERS;
  const snapshots = saved.rows.map((row, i): Snapshot => {
    if (saved.seeded[i]) seeded = toCounters(saved.seeded[i]);
    const [height, timestamp, exact, ...counters] = row;
    return { height: Number(height), timestamp: Number(timestamp), exact: exact === 1, state: toCounters(counters), seeded };
  });
  return { contractAddress: saved.contractAddress, snapshots };
}

export type Change = { height: number; timestamp: number; delta: Counts };

/**
 * Las últimas transacciones que cambiaron algún contador, de la más nueva a
 * la más vieja. Se para en la primera de la que no se sabe qué hizo sola
 * (ver Snapshot.exact): más atrás está compactado por horas y la lista
 * tendría huecos que no se ven, como si no hubiera habido nada entre medias.
 */
export function recentChanges(snapshots: readonly Snapshot[], limit: number): Change[] {
  const recent: Change[] = [];
  const stop = Math.max(1, snapshots.length - RECENT_SCAN);
  for (let i = snapshots.length - 1; i >= stop && recent.length < limit; i--) {
    const s = snapshots[i];
    const delta = deltaCounts(s.state, snapshots[i - 1].state);
    if (Object.keys(delta).length === 0) continue;
    if (!s.exact) break;
    recent.push({ height: s.height, timestamp: s.timestamp, delta });
  }
  return recent;
}
