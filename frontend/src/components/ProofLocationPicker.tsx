import { useState } from 'react';
import type { Lang } from '../api.ts';
import { LOCAL_PROOF_SERVER_COMMAND } from '../localProofServer.ts';
import styles from './ProofLocationPicker.module.css';

export type ProofServerStatus = 'checking' | 'up' | 'down';

type Props = {
  lang: Lang;
  /** true = la prueba se genera en el equipo del usuario (ver localProver.ts). */
  local: boolean;
  onChange: (local: boolean) => void;
  status: ProofServerStatus;
  onRetry: () => void;
  disabled?: boolean;
};

const L = {
  es: {
    title: 'Proof server',
    subtitle: 'Elige cómo se genera la prueba de tu señal.',
    serverLabel: 'Aegis Proof Server',
    serverHint: 'Prueba generada en los servidores de Aegis',
    localLabel: 'Local',
    localTag: 'Privado',
    localHint: 'Proof server propio en tu equipo',
    checking: 'Buscando tu proof server...',
    up: 'Proof server listo en 127.0.0.1:6300',
    down: 'No se encuentra el proof server',
    help: 'Arráncalo con Docker y vuelve a comprobarlo:',
    copy: 'Copiar',
    copied: 'Copiado',
    retry: 'Comprobar de nuevo',
  },
  en: {
    title: 'Proof server',
    subtitle: "Choose how your signal's proof is generated.",
    serverLabel: 'Aegis Proof Server',
    serverHint: 'Hosted proving on Aegis servers',
    localLabel: 'Local',
    localTag: 'Private',
    localHint: 'Self-hosted proof server on your machine',
    checking: 'Looking for your proof server...',
    up: 'Proof server ready at 127.0.0.1:6300',
    down: 'Proof server not found',
    help: 'Start it with Docker and check again:',
    copy: 'Copy',
    copied: 'Copied',
    retry: 'Check again',
  },
} as const;

/** Elige si la prueba de la señal la genera nuestro proof server o el del propio usuario. */
export default function ProofLocationPicker({ lang, local, onChange, status, onRetry, disabled }: Props) {
  const tt = L[lang];
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
        <div className={styles.title}>{tt.title}</div>
        <div className={styles.subtitle}>{tt.subtitle}</div>
      </div>

      <div className={styles.options} role="radiogroup" aria-label={tt.title}>
        <button
          type="button" role="radio" aria-checked={!local} disabled={disabled}
          className={`${styles.option} ${!local ? styles.optionOn : ''}`}
          onClick={() => onChange(false)}
        >
          <span className={styles.radio} />
          <span className={styles.optionBody}>
            <span className={styles.optionLabel}>{tt.serverLabel}</span>
            <span className={styles.optionHint}>{tt.serverHint}</span>
          </span>
        </button>

        <button
          type="button" role="radio" aria-checked={local} disabled={disabled}
          className={`${styles.option} ${local ? styles.optionOn : ''}`}
          onClick={() => onChange(true)}
        >
          <span className={styles.radio} />
          <span className={styles.optionBody}>
            <span className={styles.optionLabel}>{tt.localLabel}<span className={styles.tag}>{tt.localTag}</span></span>
            <span className={styles.optionHint}>{tt.localHint}</span>
          </span>
        </button>
      </div>

      {local && (
        <div className={`${styles.status} ${styles[status]}`} role="status">
          <span className={styles.dot} />
          {tt[status]}
        </div>
      )}

      {local && status === 'down' && (
        <div className={styles.help}>
          {tt.help}
          <div className={styles.command}>
            <code>{LOCAL_PROOF_SERVER_COMMAND}</code>
            <button type="button" className={styles.copy} onClick={() => void copyCommand()}>{copied ? tt.copied : tt.copy}</button>
          </div>
          <button type="button" className={styles.retry} onClick={onRetry}>{tt.retry}</button>
        </div>
      )}
    </div>
  );
}
