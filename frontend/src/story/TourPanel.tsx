import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { usePreferences } from '../app/PreferencesProvider.tsx';
import { cx } from '../cx.ts';
import type { TourCopy } from './copy.ts';
import VerifiedMark from '../components/VerifiedMark.tsx';
import Art from './art/Art.tsx';
import Rich from './Rich.tsx';
import { blocksNext, isDone, type TourFacts } from './tour.ts';
import type { GuidedTour } from './useGuidedTour.ts';
import styles from './TourPanel.module.css';

/**
 * "Detrás de escena": el panel del tour guiado. A la derecha de la demo en
 * escritorio; abajo, plegable, en tableta y móvil. Explica qué pasa por
 * debajo de lo resaltado y, en los pasos con acción, qué toca hacer.
 */
export default function TourPanel({ tour, facts }: { tour: GuidedTour; facts: TourFacts }) {
  const { t } = usePreferences();
  const ui = t.story.ui;
  const { index, total, step, go } = tour;
  const copies: Record<string, TourCopy> = t.story[tour.tour];
  const copy = copies[step.id];
  const last = index === total;
  const done = isDone(step, facts);
  // En un paso con acción, «Siguiente» espera a que se haga (salvo las opcionales).
  const blocked = blocksNext(step, facts);
  const [open, setOpen] = useState(false);
  // Con la ventana de publicar abierta (pasos de la hoja), la franja de arriba va sólida: sin la demo detrás.
  const overSheet = step.focus.some(f => f === 'sheet');

  return (
    <aside className={cx(styles.panel, open && styles.open, last && styles.last, overSheet && styles.overSheet)} aria-label={ui.behindTheScenes} data-tour-panel>
      <header className={styles.top}>
        <span className={styles.eyebrow}>{ui.behindTheScenes}</span>
        <div className={styles.links}>
          <Link className={cx(styles.pill, styles.wideOnly)} to="/intro/1">{ui.resetToIntro}</Link>
          <Link className={styles.pill} to="/demo">{ui.switchToFree}</Link>
        </div>
        <button
          type="button"
          className={styles.fold}
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label={open ? ui.showLess : ui.showMore}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={open ? 'M3 6l5 5 5-5' : 'M3 10l5-5 5 5'} />
          </svg>
        </button>
      </header>

      <div key={step.id} className={styles.body}>
        <Art id={step.art} className={styles.art} />
        <h2 className={styles.title}>{copy.title}</h2>
        <div className={styles.text}>
          {copy.body.split('\n\n').map(p => <p key={p}><Rich text={p} /></p>)}
        </div>
        {copy.todo && <Todo text={copy.todo} done={done} />}
        {last && <Finish />}
      </div>

      <footer className={styles.bottom}>
        <span className={styles.counter}>{ui.slideOf(index, total)}</span>
        <span className={styles.track} style={{ '--p': index / total } as CSSProperties} aria-hidden="true" />
        <button type="button" className={styles.secondary} onClick={() => go(index - 1)} disabled={index === 1}>
          {ui.back}
        </button>
        <button type="button" className={styles.primary} onClick={() => go(index + 1)} disabled={last || blocked}>
          {ui.next}
        </button>
      </footer>
    </aside>
  );
}

/** Lo que toca hacer en un paso con acción, o que ya está hecho al volver a él. */
function Todo({ text, done }: { text: string; done: boolean }) {
  const ui = usePreferences().t.story.ui;
  return (
    <p className={cx(styles.todo, done && styles.todoDone)} aria-live="polite">
      <span className={styles.todoLabel}>
        {done && <VerifiedMark draw />}
        {done ? ui.stepDone : ui.yourTurn}
      </span>
      {text}
    </p>
  );
}

/** Al acabar: seguir por libre o ver el resumen. */
function Finish() {
  const ui = usePreferences().t.story.ui;
  return (
    <div className={styles.finish}>
      <Link className={styles.secondary} to="/demo">{ui.exploreFreely}</Link>
      <Link className={styles.primary} to="/recap/1">{ui.seeRecap} <span aria-hidden="true">→</span></Link>
    </div>
  );
}
