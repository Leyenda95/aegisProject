import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { advanceDelay, advancesOn, parseTourPath, revealScroll, TOURS, type Span, type TourFacts, type TourId, type TourStep } from './tour.ts';

export type GuidedTour = { tour: TourId; index: number; total: number; step: TourStep; go: (n: number) => void };

/**
 * El tour de la ruta (/tour/3) y su paso, o null fuera de un tour.
 * Lo leen la demo y la cabecera (que tiene el botón de la wallet).
 */
export function useTourRoute(): { tour: TourId; index: number | null } | null {
  return parseTourPath(useLocation().pathname);
}

/**
 * El tour guiado sobre la demo. Devuelve el paso de la URL (null si no hay
 * tour o el paso no existe) y avanza solo cuando la demo pasa a haber hecho
 * lo que pide el paso en curso.
 */
export function useGuidedTour(facts: TourFacts): GuidedTour | null {
  const route = useTourRoute();
  const navigate = useNavigate();
  const tourId = route?.tour;
  const total = tourId ? TOURS[tourId].length : 0;
  const steps: readonly TourStep[] | undefined = tourId && TOURS[tourId];
  const tour = route && route.index !== null && steps
    ? { tour: route.tour, index: route.index, total, step: steps[route.index - 1] }
    : null;

  const go = useCallback((n: number) => {
    if (tourId && n >= 1 && n <= total) navigate(`/${tourId}/${n}`);
  }, [navigate, tourId, total]);

  useAutoAdvance(tour, facts, go);
  useTourPage(tour !== null);
  useRevealFocus(tour ? `${tour.tour}/${tour.step.id}` : undefined, tour?.step.top === true);

  return tour && { ...tour, go };
}

/** Pasa al siguiente paso cuando la demo pasa a haber hecho lo que pide el actual. */
function useAutoAdvance(tour: { index: number; step: TourStep } | null, facts: TourFacts, go: (n: number) => void) {
  const before = useRef(facts);
  const step = tour?.step;
  const index = tour?.index ?? 0;
  const { stage, wallet, storeChecked, cartCount, cartGoal } = facts;
  const timer = useRef<number | undefined>(undefined);
  // Si se sale del paso (o de la página) antes de tiempo, no se avanza.
  useEffect(() => () => window.clearTimeout(timer.current), [index]);
  useEffect(() => {
    const now = { stage, wallet, storeChecked, cartCount, cartGoal };
    const prev = before.current;
    before.current = now;
    if (!step || !advancesOn(step, prev, now)) return;
    const delay = advanceDelay(step);
    if (delay === 0) go(index + 1);
    else timer.current = window.setTimeout(() => go(index + 1), delay);
  }, [stage, wallet, storeChecked, cartCount, cartGoal, step, index, go]);
}

/** Mientras dura el tour, la página deja sitio al panel (ver html.tour-open en index.css). */
function useTourPage(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    root.classList.add('tour-open');
    return () => root.classList.remove('tour-open');
  }, [on]);
}

/**
 * La parte de la ventana que se ve de verdad: sin la cabecera (fija) ni,
 * en tableta y móvil, la hoja del tour abajo (lo que mide de verdad, que
 * cambia con el texto del paso).
 */
function visibleSpan(): Span {
  const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
  const sheetBelow = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tour-inset-bottom')) > 0;
  const panel = sheetBelow ? document.querySelector('[data-tour-panel]')?.getBoundingClientRect().top : undefined;
  return { top: Math.max(0, header), bottom: panel ?? window.innerHeight };
}

/** Aire entre lo resaltado y la cabecera o el panel; más en las zonas con el marco separado (.tour-loose). */
function revealMargin(el: Element): number {
  return el.classList.contains('tour-loose') ? 28 : 16;
}

/** Cuánto tiempo, tras ponerlo a la vista, se sigue encuadrando lo resaltado si cambia de tamaño. */
const SETTLE_MS = 1500;

/**
 * Al cambiar de paso, lo resaltado se pone a la vista (o, si el paso lo
 * pide, la página vuelve arriba del todo). Si aún no está (al entrar directo
 * a un paso, la caja aparece cuando llega el estado del contrato), se espera
 * a que aparezca. Si justo después cambia de tamaño (las herramientas de la
 * tienda se despliegan al resaltarlas), se vuelve a encuadrar. La ventana de
 * publicar no mueve la página: va fija encima y ya empieza arriba.
 */
function useRevealFocus(stepKey: string | undefined, toTop: boolean) {
  useEffect(() => {
    if (!stepKey) return;
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (toTop) {
      const frame = requestAnimationFrame(() => window.scrollTo({ top: 0, behavior }));
      return () => cancelAnimationFrame(frame);
    }
    const fit = (el: Element) => {
      if (el.closest('[aria-modal="true"]')) return;
      const delta = revealScroll(el.getBoundingClientRect(), visibleSpan(), revealMargin(el));
      if (delta !== null) window.scrollTo({ top: window.scrollY + delta, behavior });
    };
    const resize = new ResizeObserver(entries => fit(entries[0].target));
    let stopResize = 0;
    const reveal = () => {
      const el = document.querySelector('[data-tour="selected"]');
      if (!el) return false;
      fit(el);
      resize.observe(el);
      stopResize = window.setTimeout(() => resize.disconnect(), SETTLE_MS);
      return true;
    };
    const observer = new MutationObserver(() => {
      if (reveal()) observer.disconnect();
    });
    const frame = requestAnimationFrame(() => {
      if (!reveal()) observer.observe(document.body, { childList: true, subtree: true, attributeFilter: ['data-tour'] });
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      window.clearTimeout(stopResize);
    };
  }, [stepKey, toTop]);
}
