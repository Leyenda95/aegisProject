import type { Lang } from '../api.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import type { DemoFlow } from './demoFlow.ts';
import styles from './DemoProgress.module.css';

type Hint = keyof typeof T.en.flowHints;

/**
 * Cuántos pasos están hechos (el siguiente es el que toca), si ese está en
 * marcha y qué frase va debajo. Una publicación de un ticket anterior no
 * cuenta en cuanto empieza una venta nueva.
 */
function progressOf(flow: DemoFlow): { done: number; busy: boolean; hint: Hint } {
  const newSale = flow.cartCount > 0 && flow.sealedNonce === null;
  const pub = flow.publishing && !newSale && (flow.sealedNonce === null || flow.publishing.nonce === flow.sealedNonce)
    ? flow.publishing : null;
  if (pub?.step === 'aggregated') return { done: 6, busy: false, hint: 'done' };
  if (pub?.step === 'sent') return { done: 5, busy: true, hint: 'aggregating' };
  if (pub?.step === 'proving' || pub?.step === 'signing') return { done: 4, busy: true, hint: 'publishing' };
  if (flow.sealedNonce || flow.sheetOpen) return { done: 3, busy: false, hint: 'share' };
  if (flow.sealing) return { done: 1, busy: true, hint: 'sealing' };
  if (flow.cartCount > 0) return { done: 1, busy: false, hint: 'seal' };
  return { done: 0, busy: false, hint: 'shop' };
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
