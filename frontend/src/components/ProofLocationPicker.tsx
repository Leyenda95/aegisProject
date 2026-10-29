import { useState } from 'react';
import type { Lang } from '../api.ts';
import { T } from '../i18n.ts';
import { LOCAL_PROOF_SERVER_COMMAND, type ProofServerStatus } from '../localProofServer.ts';
import styles from './ProofLocationPicker.module.css';

type Props = {
  lang: Lang;
  /** true = la prueba se genera en el equipo del usuario (ver localProver.ts). */
  local: boolean;
  onChange: (local: boolean) => void;
  status: ProofServerStatus;
  onRetry: () => void;
  disabled?: boolean;
};

/** Elige si la prueba de la señal la genera nuestro proof server o el del propio usuario. */
export default function ProofLocationPicker({ lang, local, onChange, status, onRetry, disabled }: Props) {
  const t = T[lang];
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(LOCAL_PROOF_SERVER_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* sin permiso de portapapeles: el comando sigue a la vista para copiarlo a mano */ }
  }

  return (
    <div className={styles.section}>
      <div>
        <div className={styles.title}>{t.proofTitle}</div>
        <div className={styles.subtitle}>{t.proofSubtitle}</div>
      </div>

      <div className={styles.options} role="radiogroup" aria-label={t.proofTitle}>
        <button
          type="button" role="radio" aria-checked={!local} disabled={disabled}
          className={`${styles.option} ${!local ? styles.optionOn : ''}`}
          onClick={() => onChange(false)}
        >
          <span className={styles.radio} />
          <span className={styles.optionBody}>
            <span className={styles.optionLabel}>{t.proofServerLabel}</span>
            <span className={styles.optionHint}>{t.proofServerHint}</span>
          </span>
        </button>

        <button
          type="button" role="radio" aria-checked={local} disabled={disabled}
          className={`${styles.option} ${local ? styles.optionOn : ''}`}
          onClick={() => onChange(true)}
        >
          <span className={styles.radio} />
          <span className={styles.optionBody}>
            <span className={styles.optionLabel}>{t.proofLocalLabel}<span className={styles.tag}>{t.proofLocalTag}</span></span>
            <span className={styles.optionHint}>{t.proofLocalHint}</span>
          </span>
        </button>
      </div>

      {local && (
        <div className={`${styles.status} ${styles[status]}`} role="status">
          <span className={styles.dot} />
          {t.proofStatus[status]}
        </div>
      )}

      {local && status === 'down' && (
        <div className={styles.help}>
          {t.proofHelp}
          <div className={styles.command}>
            <code>{LOCAL_PROOF_SERVER_COMMAND}</code>
            <button type="button" className={styles.copy} onClick={() => void copyCommand()}>{copied ? t.proofCopied : t.proofCopy}</button>
          </div>
          <button type="button" className={styles.retry} onClick={onRetry}>{t.proofRetry}</button>
        </div>
      )}
    </div>
  );
}
