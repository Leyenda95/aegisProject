import type { Lang } from '../api.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import type { PublishStep } from '../routes/demoFlow.ts';
import styles from './PublishProgress.module.css';
import VerifiedMark from './VerifiedMark.tsx';

type Props = {
  lang: Lang;
  step: PublishStep;
  /** La prueba se genera en el equipo del usuario. */
  local: boolean;
  /** Hubo que firmar con la wallet (sin patrocinio): ese paso también sale. */
  signed: boolean;
  /** La comisión la pagó el patrocinio de Aegis. */
  sponsored: boolean;
  error: string | null;
  /** La primera vez, las tres tarjetas de qué acaba de pasar. */
  explain: boolean;
  onClose: () => void;
  onViewMarket: () => void;
};

/**
 * Lo que enseña la ventana de publicar tras pulsar el botón: los pasos de
 * verdad (la prueba, la firma si hace falta, el envío y su llegada al
 * agregado público) y, al acabar, una marca y el enlace al mercado.
 */
export default function PublishProgress({ lang, step, local, signed, sponsored, error, explain, onClose, onViewMarket }: Props) {
  const t = T[lang];

  if (step === 'failed') {
    return (
      <div className={styles.progress} role="alert">
        <div className={styles.head}>
          <h2 className={styles.title}>{t.publishFailedTitle}</h2>
          {error && <p className={styles.error}>{error}</p>}
          <p className={styles.sub}>{t.publishKeepsTicket}</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>{t.publishClose}</button>
        </div>
      </div>
    );
  }

  const steps: { id: PublishStep; label: string }[] = [
    { id: 'proving', label: local ? t.publishStepProvingLocal : t.publishStepProving },
    ...(signed ? [{ id: 'signing' as const, label: t.publishStepSigning }] : []),
    { id: 'sent', label: t.publishStepSent },
    { id: 'aggregated', label: t.publishStepAggregated },
  ];
  // Hasta dónde está hecho: el paso que va después es el que está en marcha.
  const sentIndex = steps.findIndex(s => s.id === 'sent');
  const done = step === 'aggregated' ? steps.length : step === 'sent' ? sentIndex + 1 : steps.findIndex(s => s.id === step);
  const published = step === 'sent' || step === 'aggregated';

  return (
    <div className={styles.progress}>
      <div className={styles.head}>
        {published && <VerifiedMark draw className={styles.check} />}
        <h2 className={styles.title}>{published ? t.publishDoneTitle : t.publishing}</h2>
        {published && sponsored && <p className={styles.sub}>{t.feePaidByAegis}</p>}
      </div>

      <ol className={styles.steps} aria-live="polite">
        {steps.map((s, i) => {
          const state = i < done ? 'done' : i === done ? 'active' : 'pending';
          return (
            <li key={s.id} className={cx(styles.step, styles[state])}>
              <span className={styles.marker} aria-hidden="true">{state === 'done' && <VerifiedMark draw />}</span>
              {s.label}
            </li>
          );
        })}
      </ol>

      {!published && <p className={styles.sub}>{t.publishBackground}</p>}

      <div className={styles.actions}>
        {published && <button type="button" className={styles.primary} onClick={onViewMarket}>{t.publishViewMarket}</button>}
        <button type="button" className={styles.secondary} onClick={onClose}>{t.publishClose}</button>
      </div>

      {published && explain && (
        <section className={styles.explainer}>
          <h3 className={styles.explainerTitle}>{t.explainerTitle}</h3>
          {t.explainerCards.map(card => (
            <div key={card.title} className={styles.card}>
              <div className={styles.cardTitle}>{card.title}</div>
              <p className={styles.cardText}>{card.text}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
