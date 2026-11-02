import type { Lang } from '../api.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import { stageOf, type DemoFlow, type Stage } from './demoFlow.ts';
import styles from './DemoProgress.module.css';

type Progress = { done: number; busy: boolean; hint: keyof typeof T.en.flowHints };

/**
 * Para cada etapa, cuántos pasos de la línea están hechos (el siguiente es
 * el que toca), si ese está en marcha y qué frase va debajo.
 */
const PROGRESS: Record<Stage, Progress> = {
  shop: { done: 0, busy: false, hint: 'shop' },
  cart: { done: 1, busy: false, hint: 'seal' },
  sealing: { done: 1, busy: true, hint: 'sealing' },
  sealed: { done: 3, busy: false, hint: 'share' },
  sharing: { done: 3, busy: false, hint: 'share' },
  proving: { done: 4, busy: true, hint: 'publishing' },
  sent: { done: 5, busy: true, hint: 'aggregating' },
  aggregated: { done: 6, busy: false, hint: 'done' },
};

export function progressOf(flow: DemoFlow): Progress {
  return PROGRESS[stageOf(flow)];
}

/**
 * Línea de progreso de la demo, de la compra a la señal en el agregado:
 * guía el recorrido sin avisos que parpadean.
 */
export default function DemoProgress({ lang, flow, onViewMarket }: { lang: Lang; flow: DemoFlow; onViewMarket: () => void }) {
  const t = T[lang];
  const { done, busy, hint } = progressOf(flow);
  const total = t.flowSteps.length;

  return (
    <nav className={styles.progress} aria-label={t.flowLabel}>
      <ol className={styles.steps}>
        {t.flowSteps.map((label, i) => (
          <li
            key={label}
            className={cx(styles.step, i < done && styles.done, i === done && styles.current, i === done && busy && styles.busy)}
            aria-current={i === done ? 'step' : undefined}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label}>{label}</span>
          </li>
        ))}
      </ol>
      <p className={styles.hint} aria-live="polite">
        <span className={styles.stepOf}>{t.flowStepOf(Math.min(done + 1, total), total)}</span>
        {t.flowHints[hint]}
        {hint === 'done' && (
          <button type="button" className={styles.link} onClick={onViewMarket}>{t.flowViewMarket}</button>
        )}
      </p>
    </nav>
  );
}
