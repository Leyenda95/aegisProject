import { useState } from 'react';
import type { Lang } from '../api.ts';
import { cx } from '../cx.ts';
import { T } from '../i18n.ts';
import { checkStoreRegistered } from '../lace.ts';
import { useReportFlow } from '../routes/demoFlow.ts';
import Icon from '../story/Icon.tsx';
import { useTourFocus } from '../story/tourFocus.ts';
import styles from './StoreRegistry.module.css';
import VerifiedMark from './VerifiedMark.tsx';

type Check = 'idle' | 'checking' | 'registered' | 'missing' | 'error';

/**
 * Junto al título de la caja: comprueba en Midnight que la tienda de la demo
 * está en el registro de tiendas (su clave pública es una hoja del árbol de
 * Merkle del contrato; ver GET /store-registered en el backend). Es la misma
 * pertenencia que la tienda demuestra, sin decir cuál es, al sellar cada
 * recibo. Con la tienda dentro, se lo cuenta a la demo (el tour lo espera).
 */
export default function StoreRegistry({ lang }: { lang: Lang }) {
  const t = T[lang];
  const reportFlow = useReportFlow();
  const [check, setCheck] = useState<Check>('idle');

  async function run() {
    setCheck('checking');
    try {
      const registered = await checkStoreRegistered();
      setCheck(registered ? 'registered' : 'missing');
      if (registered) reportFlow({ storeChecked: true });
    } catch {
      setCheck('error');
    }
  }

  const done = check === 'registered';
  const label = {
    idle: t.registryCheck,
    checking: t.registryChecking,
    registered: t.registryOk,
    missing: t.registryMissing,
    error: t.registryError,
  }[check];

  return (
    <div className={styles.root} data-tour={useTourFocus('registry')} aria-live="polite">
      {done ? (
        <span className={styles.verified}>
          <span className={styles.seal}><VerifiedMark draw /></span>
          <span className={styles.verifiedText}>
            <strong className={styles.verifiedTitle}>{label}</strong>
            <span className={styles.verifiedMeta}>
              <Icon id="midnight" className={styles.midnight} />
              {t.registryVerified}
            </span>
          </span>
        </span>
      ) : (
        <button type="button" className={cx(styles.badge, styles.action)} onClick={run} disabled={check === 'checking'}>
          {check === 'checking' && <span className="aegis-spinner" />}
          {label}
        </button>
      )}
    </div>
  );
}
