import { REPO_URL, type ArtId, type IconId } from './ids.ts';
import { parsePosition } from './position.ts';
import type { TourId } from './tour.ts';

/**
 * Cómo se compone cada diapositiva. El texto va aparte (story/copy.*.ts),
 * con las mismas claves.
 * - cover: la bienvenida, sobre un fondo oscuro dibujado.
 * - feature: dibujo a un lado y texto al otro; debajo, opcionalmente,
 *   tarjetas o una lista numerada que sigue los números del dibujo. Con
 *   cta, el botón de empezar ese tour.
 * - contrast: lo público frente a lo privado (lo privado en oscuro).
 * - stack: lo que Aegis usa de Midnight y para qué; con enlaces en el
 *   resumen.
 * - mission: lo que vas a hacer en la demo, paso a paso, con su número.
 * - checklist: lo que has hecho.
 * - getStarted: por dónde seguir: dos tarjetas con dibujo (el
 *   código y la documentación) y una franja de contacto.
 */
export type SlideLayout =
  | { kind: 'cover' }
  | { kind: 'feature'; art: ArtId; items?: 'cards' | 'numbered'; cta?: TourId }
  | { kind: 'contrast' }
  | { kind: 'stack'; links: boolean }
  | { kind: 'mission'; steps: readonly MissionStep[] }
  | { kind: 'checklist' }
  | { kind: 'getStarted' };

/** Lo que vas a hacer en la demo, en orden (diapositiva "mission"). */
export type MissionId = 'buy' | 'scan' | 'choose' | 'watch';
export type MissionStep = { id: MissionId; icon: IconId };
const MISSION: readonly MissionStep[] = [
  { id: 'buy', icon: 'cart' },
  { id: 'scan', icon: 'person' },
  { id: 'choose', icon: 'eye' },
  { id: 'watch', icon: 'chart' },
];

export const DECKS = {
  intro: [
    { id: 'welcome', layout: { kind: 'cover' } },
    { id: 'disclaimer', layout: { kind: 'feature', art: 'disclaimer' } },
    { id: 'problem', layout: { kind: 'feature', art: 'problem' } },
    { id: 'idea', layout: { kind: 'feature', art: 'idea' } },
    { id: 'players', layout: { kind: 'feature', art: 'players', items: 'cards' } },
    { id: 'flow', layout: { kind: 'feature', art: 'flow', items: 'numbered' } },
    { id: 'publicPrivate', layout: { kind: 'contrast' } },
    { id: 'builtWith', layout: { kind: 'stack', links: false } },
    { id: 'mission', layout: { kind: 'mission', steps: MISSION } },
    { id: 'ready', layout: { kind: 'feature', art: 'ready', cta: 'tour' } },
  ],
  recap: [
    { id: 'experienced', layout: { kind: 'checklist' } },
    { id: 'beyond', layout: { kind: 'feature', art: 'beyond' } },
    { id: 'pieces', layout: { kind: 'stack', links: true } },
    { id: 'start', layout: { kind: 'getStarted' } },
  ],
} as const satisfies Record<string, readonly { id: string; layout: SlideLayout }[]>;

export type DeckId = keyof typeof DECKS;
export type SlideIdOf<D extends DeckId> = typeof DECKS[D][number]['id'];

/** Por dónde seguir (última diapositiva del recap). */
export type ResourceId = 'repo' | 'docs' | 'contact';
export const RESOURCES: Record<ResourceId, { icon: IconId; href: string }> = {
  repo: { icon: 'github', href: REPO_URL },
  docs: { icon: 'docs', href: 'https://docs.midnight.network' },
  contact: { icon: 'mail', href: 'mailto:alvaro@tricubo.tech' },
};

export function parseSlide(deck: DeckId, param: string | undefined): number | null {
  return parsePosition(param, DECKS[deck].length);
}

const KEY_STEP = new Map<string, 1 | -1>([['ArrowRight', 1], ['PageDown', 1], ['ArrowLeft', -1], ['PageUp', -1]]);

/**
 * Cuánto mueve una tecla la presentación: una diapositiva adelante o atrás,
 * o nada (otra tecla, con modificadores o escribiendo en un campo).
 */
export function keyStep(
  e: { key: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean },
  typing: boolean,
): 1 | -1 | 0 {
  const step = KEY_STEP.get(e.key);
  if (typing || e.altKey || e.ctrlKey || e.metaKey || step === undefined) return 0;
  return step;
}

export type RichPart = { text: string; strong: boolean; em: boolean };

/** Una marca cerrada: **negrita** o *cursiva*. */
const MARKED = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/** Trozos de un texto con **negritas** y *cursivas*, sin trozos vacíos. */
export function splitRich(text: string): RichPart[] {
  const parts: RichPart[] = [];
  const marks = new RegExp(MARKED);
  let from = 0;
  for (let m = marks.exec(text); m !== null; m = marks.exec(text)) {
    if (m.index > from) parts.push({ text: text.slice(from, m.index), strong: false, em: false });
    parts.push(m[1] === undefined
      ? { text: m[2], strong: false, em: true }
      : { text: m[1], strong: true, em: false });
    from = m.index + m[0].length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), strong: false, em: false });
  return parts;
}
