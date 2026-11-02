import { createContext, useContext } from 'react';
import { focusState, TOURS, type TourStep, type TourTarget } from './tour.ts';
import { useTourRoute } from './useGuidedTour.ts';

/** El paso del tour guiado en curso; null fuera del tour (demo libre, app del móvil). */
export const TourStepContext = createContext<TourStep | null>(null);

export function useTourStep(): TourStep | null {
  return useContext(TourStepContext);
}

/**
 * Para el atributo data-tour de una zona de la demo: resaltada, apagada o
 * nada (fuera del tour no se pone). Los estilos están en index.css.
 */
export function useTourFocus(target: TourTarget): 'selected' | 'muted' | undefined {
  const step = useTourStep();
  return step ? focusState(step, target) : undefined;
}

/** Lo mismo para lo que está fuera de la demo (la wallet de la cabecera): el paso sale de la ruta. */
export function useRouteTourFocus(target: TourTarget): 'selected' | 'muted' | undefined {
  const route = useTourRoute();
  const step = route && route.index !== null ? TOURS[route.tour][route.index - 1] : null;
  return step ? focusState(step, target) : undefined;
}
