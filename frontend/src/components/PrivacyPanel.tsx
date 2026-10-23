import { useState, type ReactNode } from 'react';
import type { Lang } from '../api.ts';
import { T } from '../i18n.ts';
import { SHARE_FIELDS, setShareDefault, useShareDefaults, type ShareField } from '../sharePrefs.ts';
import { clearVault } from '../vault.ts';
import styles from './PrivacyPanel.module.css';

type Props = {
  lang: Lang;
  /** Cuántos tickets hay guardados en el dispositivo. */
  count: number;
  /** Dónde se genera la prueba (ProofLocationPicker, con su estado en UserView). */
  proofPicker: ReactNode;
};

/**
 * Pestaña Privacidad del móvil: qué se comparte por defecto al publicar, dónde
 * se genera la prueba y borrar todo lo guardado en el dispositivo.
 */
export default function PrivacyPanel({ lang, count, proofPicker }: Props) {
  const t = T[lang];
  const defaults = useShareDefaults();
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);
  const labels: Record<ShareField, [string, string]> = {
    amount: [t.shareAmount, t.shareAmountHint],
    datetime: [t.shareDatetime, t.shareDatetimeHint],
    products: [t.shareProducts, t.shareProductsHint],
    age: [t.shareAge, t.shareAgeHint],
    avgTicket: [t.shareAvgTicket, t.shareAvgTicketHint],
  };

  return (
    <div className={styles.panel}>
      <section className={styles.block}>
        <h3 className={styles.title}>{t.privacyShareTitle}</h3>
        <p className={styles.hint}>{t.privacyShareHint}</p>
        <ul className={styles.switches}>
          {SHARE_FIELDS.map(field => {
            const on = defaults.includes(field);
            return (
              <li key={field} className={styles.switchRow}>
                <span className={styles.switchText} id={`share-default-${field}`}>
                  {labels[field][0]}
                  <span className={styles.switchHint}>{labels[field][1]}</span>
                </span>
                <button
                  type="button" role="switch" aria-checked={on} aria-labelledby={`share-default-${field}`}
                  className={styles.switch} onClick={() => setShareDefault(field, !on)}
                >
                  <span className={styles.knob} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.block}>{proofPicker}</section>

      <section className={styles.block}>
        <h3 className={styles.title}>{t.privacyDataTitle}</h3>
        <p className={styles.hint}>{cleared && count === 0 ? t.privacyCleared : t.privacyDataHint(count)}</p>
        {confirming ? (
          <div className={styles.confirm} role="alertdialog" aria-label={t.privacyClearConfirm}>
            <p>{t.privacyClearConfirm}</p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.danger} onClick={() => { clearVault(); setConfirming(false); setCleared(true); }}>
                {t.privacyClearYes}
              </button>
              <button type="button" className={styles.secondary} onClick={() => setConfirming(false)}>{t.privacyClearNo}</button>
            </div>
          </div>
        ) : (
          <button type="button" className={styles.secondary} onClick={() => setConfirming(true)} disabled={count === 0}>
            {t.privacyClear}
          </button>
        )}
      </section>
    </div>
  );
}
