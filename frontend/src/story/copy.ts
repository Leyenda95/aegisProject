import type { DeckId, MissionId, ResourceId, SlideIdOf } from './deck.ts';
import type { StackId } from './ids.ts';
import type { TourId, TourStepIdOf } from './tour.ts';

/**
 * Forma del guion del recorrido. Cada idioma rellena uno entero
 * (story/copy.es.ts, story/copy.en.ts): si falta el texto de una diapositiva
 * o de un paso, no compila. En los textos, **así** va en negrita, y en los
 * del tour una línea en blanco separa párrafos.
 */
export type Item = { title: string; text: string };

export type SlideCopy = {
  kicker?: string;
  title: string;
  body?: string;
  /** Tarjetas (layout feature con items: 'cards'). */
  items?: readonly Item[];
  /** Lista numerada o de comprobación (feature 'numbered', checklist). */
  steps?: readonly string[];
  /** Columnas con su lista (layout contrast). */
  columns?: readonly { title: string; items: readonly string[] }[];
};

export type TourCopy = {
  title: string;
  body: string;
  /** En los pasos con acción: lo que tiene que hacer quien sigue el tour. */
  todo?: string;
};

/** El texto de cada diapositiva de cada presentación, y de cada paso de cada tour. */
type DeckCopies = { [D in DeckId]: Record<SlideIdOf<D>, SlideCopy> };
type TourCopies = { [T in TourId]: Record<TourStepIdOf<T>, TourCopy> };

export type StoryCopy = DeckCopies & TourCopies & {
  ui: {
    backToStart: string;
    skipIntro: string;
    repository: string;
    backToDemo: string;
    resetToIntro: string;
    slideOf: (n: number, total: number) => string;
    keysHint: string;
    previous: string;
    next: string;
    startJourney: string;
    behindTheScenes: string;
    back: string;
    yourTurn: string;
    stepDone: string;
    switchToFree: string;
    switchToTour: string;
    exploreFreely: string;
    seeRecap: string;
    showMore: string;
    showLess: string;
  };
  /** Rótulos dentro de los dibujos. */
  art: { store: string; customer: string; midnight: string; market: string; agent: string };
  /** Lo que Aegis usa de Midnight y para qué, en dos grupos. */
  stackGroups: readonly [string, string];
  stack: Record<StackId, Item>;
  mission: Record<MissionId, Item>;
  resources: Record<ResourceId, Item>;
};
