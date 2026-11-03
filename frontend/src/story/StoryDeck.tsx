import { useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import type { Lang } from '../api.ts';
import { usePreferences } from '../app/PreferencesProvider.tsx';
import { DECKS, keyStep, parseSlide, type DeckId, type SlideLayout } from './deck.ts';
import type { SlideCopy, StoryCopy } from './copy.ts';
import { REPO_URL } from './ids.ts';
import { useLockPageScroll } from '../pageScroll.ts';
import Slide from './Slide.tsx';
import styles from './StoryDeck.module.css';

const LANGS: Lang[] = ['es', 'en'];

function slideAt(story: StoryCopy, deck: DeckId, index: number): { id: string; layout: SlideLayout; copy: SlideCopy } {
  const slide: { id: string; layout: SlideLayout } = DECKS[deck][index - 1];
  const copies: Record<string, SlideCopy> = story[deck];
  return { ...slide, copy: copies[slide.id] };
}

/**
 * Una presentación del recorrido (/intro/:n o /recap/:n), encima de la demo
 * como la portada: así la demo ya está dibujada al empezar el tour, y al
 * volver del resumen sigue como se dejó.
 */
export default function StoryDeck({ deck }: { deck: DeckId }) {
  const index = parseSlide(deck, useParams().n);
  if (index === null) return <Navigate to={`/${deck}/1`} replace />;
  return <DeckView deck={deck} index={index} />;
}

function DeckView({ deck, index }: { deck: DeckId; index: number }) {
  const { t } = usePreferences();
  const ui = t.story.ui;
  const navigate = useNavigate();
  const total = DECKS[deck].length;
  const slide = slideAt(t.story, deck, index);

  const go = useCallback((n: number) => {
    if (n >= 1 && n <= total) navigate(`/${deck}/${n}`);
  }, [deck, total, navigate]);

  const move = useCallback((step: 1 | -1) => go(index + step), [go, index]);
  // Cada diapositiva empieza arriba, aunque en la anterior se bajara para seguir leyendo.
  const stage = useRef<HTMLElement>(null);
  useEffect(() => { stage.current?.scrollTo({ top: 0 }); }, [index]);
  useLockPageScroll();
  useArrowKeys(move);

  return (
    <div className={styles.root} data-landing>
      <div className={styles.progress} style={{ '--p': index / total } as CSSProperties} aria-hidden="true" />
      <div className={styles.frame}>
        <DeckTop deck={deck} index={index} />

        <main ref={stage} className={styles.stage}>
          <div key={slide.id} className={styles.slide}>
            <Slide layout={slide.layout} copy={slide.copy} />
          </div>
        </main>

        <footer className={styles.bottom}>
          <span className={styles.counter}>{ui.slideOf(index, total)}</span>
          <span className={styles.hint}>{ui.keysHint}</span>
          <div className={styles.nav}>
            <button type="button" className={styles.navBtn} onClick={() => go(index - 1)} disabled={index === 1} aria-label={ui.previous}>
              <Chevron back />
            </button>
            <button type="button" className={`${styles.navBtn} ${styles.navNext}`} onClick={() => go(index + 1)} disabled={index === total} aria-label={ui.next}>
              <Chevron />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * Cabecera: a la izquierda, volver (al principio de la intro o a la demo
 * desde el resumen); a la derecha, saltar la intro o volver a ella, el
 * repositorio y el idioma.
 */
function DeckTop({ deck, index }: { deck: DeckId; index: number }) {
  const { t, lang, chooseLang } = usePreferences();
  const ui = t.story.ui;
  const intro = deck === 'intro';
  return (
    <header className={styles.top}>
      <div className={styles.topGroup}>
        {!intro && <Link className={styles.pill} to="/demo">{ui.backToDemo}</Link>}
        {intro && index > 1 && <Link className={styles.pill} to="/intro/1">{ui.backToStart}</Link>}
      </div>
      <div className={styles.topGroup}>
        <Link className={styles.pill} to={intro ? '/tour/1' : '/intro/1'}>{intro ? ui.skipIntro : ui.resetToIntro}</Link>
        <a className={`${styles.pill} ${styles.wideOnly}`} href={REPO_URL} target="_blank" rel="noreferrer">{ui.repository}</a>
        <div className={styles.langs} role="group" aria-label={t.landingLanguage}>
          {LANGS.map(l => (
            <button key={l} type="button" className={styles.lang} onClick={() => chooseLang(l)} aria-pressed={lang === l}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

/** Flecha de los botones del pie, dibujada para que quede centrada (un carácter ‹ › cae bajo). */
function Chevron({ back = false }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={styles.chevron}>
      <path d={back ? 'M14.5 6L8.5 12l6 6' : 'M9.5 6l6 6-6 6'} />
    </svg>
  );
}

/** Las flechas del teclado (y avance/retroceso de página) mueven la presentación. */
function useArrowKeys(onStep: (step: 1 | -1) => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, select') !== null;
      const step = keyStep(e, typing);
      if (step === 0) return;
      e.preventDefault();
      onStep(step);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStep]);
}
