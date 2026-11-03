import { reached, type Stage } from '../routes/demoFlow.ts';
import type { ArtId } from './ids.ts';
import { parsePosition } from './position.ts';

/**
 * Zonas que el tour puede resaltar. La caja (pos) contiene el catálogo, la
 * cesta, el recibo cobrado y el sello de tienda registrada; las demás no se
 * anidan. La wallet está en la cabecera, fuera de la demo.
 */
export type TourTarget =
  | 'wallet' | 'ribbon' | 'pos' | 'registry' | 'catalog' | 'basket' | 'receipt'
  | 'tools' | 'phone' | 'sheet' | 'market';

const PARENT: Partial<Record<TourTarget, TourTarget>> = { registry: 'pos', catalog: 'pos', basket: 'pos', receipt: 'pos' };

/**
 * Lo que la demo ya ha hecho y que un paso con acción puede esperar: llegar
 * a una etapa de la compra, tener una wallet conectada o haber comprobado en
 * Midnight que la tienda está registrada. El patrocinio no cuenta como
 * wallet: llega al poco de cargar y haría saltar el primer paso sin leerlo.
 */
export type TourFacts = { stage: Stage; wallet: boolean; storeChecked: boolean };
export type Milestone = Stage | 'wallet' | 'storeChecked';

export type TourStep = {
  id: string;
  /** Qué se ve: la demo (caja y móvil) o el mercado. */
  view: 'demo' | 'market';
  /** Qué columna se enseña cuando la caja y el móvil no caben juntos. */
  side: 'store' | 'user';
  /** Lo que se resalta; lo demás se apaga. Vacío: la demo tal cual. */
  focus: readonly TourTarget[];
  /** Paso con acción: avanza solo cuando la demo llega a esto. */
  waitFor?: Milestone;
  /** La acción solo adelanta el paso: «Siguiente» no espera a que se haga. */
  optional?: boolean;
  /** Al entrar, la página vuelve arriba del todo en vez de encuadrar lo resaltado. */
  top?: boolean;
  art: ArtId;
};

/**
 * El tour empieza por la wallet y la cinta de contadores, comprueba el
 * registro de la tienda antes de vender, enseña el recibo antes de ir al
 * móvil y acaba la compra en el mercado.
 */
export const TOURS = {
  tour: [
    { id: 'wallet', view: 'demo', side: 'store', focus: ['wallet'], waitFor: 'wallet', optional: true, top: true, art: 'wallet' },
    { id: 'ribbon', view: 'demo', side: 'store', focus: ['ribbon'], art: 'counters' },
    { id: 'registry', view: 'demo', side: 'store', focus: ['registry'], waitFor: 'storeChecked', art: 'registry' },
    { id: 'addToCart', view: 'demo', side: 'store', focus: ['catalog'], waitFor: 'cart', art: 'cart' },
    { id: 'charge', view: 'demo', side: 'store', focus: ['basket'], waitFor: 'sealed', art: 'seal' },
    { id: 'receipt', view: 'demo', side: 'store', focus: ['receipt'], art: 'qr' },
    { id: 'ticket', view: 'demo', side: 'user', focus: ['phone'], waitFor: 'sharing', art: 'vault' },
    { id: 'share', view: 'demo', side: 'user', focus: ['sheet'], waitFor: 'proving', art: 'disclosure' },
    { id: 'publish', view: 'demo', side: 'user', focus: ['sheet'], waitFor: 'sent', optional: true, art: 'proof' },
    { id: 'market', view: 'market', side: 'store', focus: ['market'], top: true, art: 'market' },
    { id: 'report', view: 'demo', side: 'store', focus: ['tools'], art: 'agent' },
    { id: 'explore', view: 'demo', side: 'store', focus: [], top: true, art: 'explore' },
  ],
} as const satisfies Record<string, readonly TourStep[]>;

export type TourId = keyof typeof TOURS;
export type TourStepIdOf<T extends TourId> = typeof TOURS[T][number]['id'];

/**
 * Cómo se pinta una zona en un paso: resaltada, apagada o sin cambios (sin
 * foco en el paso, o porque está dentro o alrededor de lo resaltado).
 */
export function focusState(step: TourStep, target: TourTarget): 'selected' | 'muted' | undefined {
  if (step.focus.length === 0) return undefined;
  if (step.focus.includes(target)) return 'selected';
  const parent = PARENT[target];
  const insideFocus = parent !== undefined && step.focus.includes(parent);
  const aroundFocus = step.focus.some(f => PARENT[f] === target);
  return insideFocus || aroundFocus ? undefined : 'muted';
}

/** Si la demo ya ha hecho lo que pide el paso (un paso sin acción nunca lo está). */
export function isDone(step: TourStep, facts: TourFacts): boolean {
  switch (step.waitFor) {
    case undefined: return false;
    case 'wallet': return facts.wallet;
    case 'storeChecked': return facts.storeChecked;
    default: return reached(facts.stage, step.waitFor);
  }
}

/**
 * El paso avanza solo cuando la demo pasa a haber hecho lo que pide. Solo
 * con ese cambio: al volver atrás a un paso ya hecho, no rebota.
 */
export function advancesOn(step: TourStep, before: TourFacts, now: TourFacts): boolean {
  return isDone(step, now) && !isDone(step, before);
}

/** Si «Siguiente» espera a que se haga la acción del paso (las opcionales no). */
export function blocksNext(step: TourStep, facts: TourFacts): boolean {
  return step.waitFor !== undefined && step.optional !== true && !isDone(step, facts);
}

/**
 * Cuánto espera el paso, en ms, desde que la demo hace lo que pide hasta
 * avanzar: lo justo en el registro para ver la insignia de verificado, y
 * unos segundos tras enviar la señal para ver cómo se suma al agregado (sin
 * esperar a que llegue: el mercado la recibe en directo).
 */
const ADVANCE_DELAY: Partial<Record<Milestone, number>> = { storeChecked: 1800, sent: 3500 };

export function advanceDelay(step: TourStep): number {
  return (step.waitFor && ADVANCE_DELAY[step.waitFor]) ?? 0;
}

/** Lo que ocupa algo en vertical: lo resaltado, o la parte de la ventana que no tapan cabecera ni panel. */
export type Span = { top: number; bottom: number };

/**
 * Cuánto bajar la página (en px; negativo, subir) para poner a la vista lo
 * resaltado, o null si ya se ve bien. Lo que cabe, con su margen alrededor,
 * se ve entero: si ya se ve no se mueve y si no se centra. Lo que no cabe se
 * enseña desde su principio, justo bajo la cabecera.
 */
export function revealScroll(target: Span, visible: Span, margin: number): number | null {
  const top = visible.top + margin;
  const bottom = visible.bottom - margin;
  if (target.bottom - target.top <= bottom - top) {
    if (target.top >= top && target.bottom <= bottom) return null;
    return (target.top + target.bottom) / 2 - (top + bottom) / 2;
  }
  const delta = target.top - top;
  return Math.abs(delta) < 2 ? null : delta;
}

export function parseStep(tour: TourId, param: string | undefined): number | null {
  return parsePosition(param, TOURS[tour].length);
}

const TOUR_PATH = /^\/tour(?:\/([^/]*))?$/;

/**
 * El tour de una ruta (/tour/3) y su paso, o null si la ruta no es de un
 * tour. Con un paso que no existe, el tour sí y el paso null.
 */
export function parseTourPath(pathname: string): { tour: TourId; index: number | null } | null {
  const match = TOUR_PATH.exec(pathname);
  if (!match) return null;
  return { tour: 'tour', index: parseStep('tour', match[1]) };
}
