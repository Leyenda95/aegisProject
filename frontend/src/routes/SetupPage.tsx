import { useState } from 'react';
import { Link } from 'react-router';
import { deployViaLace, registerStoreViaLace, seedViaLace } from '../lace.ts';
import { cx } from '../cx.ts';
import { usePreferences } from '../app/PreferencesProvider.tsx';
import { useWallet } from '../app/WalletProvider.tsx';
import { useChain } from '../app/ChainProvider.tsx';
import { useTx } from '../app/TxProvider.tsx';
import styles from './SetupPage.module.css';

type Step = 'wallet' | 'contract' | 'store' | 'data';

// Etiqueta de cada paso en los códigos de error cortos (ver briefError).
const ERROR_LABEL: Record<Step, string> = { wallet: 'wallet', contract: 'deploy', store: 'register-store', data: 'seed' };

/** Los errores del SDK son larguísimos. Deja el detalle en la consola y muestra solo un código corto. */
function briefError(label: string, e: unknown): string {
  console.error(`[${label}]`, e);
  const msg = (e as any)?.message ?? String(e);
  let h = 0;
  for (let i = 0; i < msg.length; i++) h = (h * 31 + msg.charCodeAt(i)) | 0;
  return `${label} · ERR-${(Math.abs(h) % 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * Alta de la demo cuando se ejecuta en local con un contrato propio: conectar
 * la wallet, desplegar el contrato, registrar la tienda de demo y cargar
 * datos de partida. Cada paso es una transacción que firma la wallet.
 */
export default function SetupPage() {
  const { t, lang } = usePreferences();
  const { wallet, choices, connecting, connect } = useWallet();
  const { contractAddress, setContractAddress, storeRegistered, setStoreRegistered, state } = useChain();
  const { confirming, setConfirming } = useTx();
  const [running, setRunning] = useState<Step | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Step, string>>>({});
  // Se marca al terminar de cargar los datos, sin esperar al siguiente refresco de los contadores.
  const [seeded, setSeeded] = useState(false);

  const done: Record<Step, boolean> = {
    wallet: !!wallet,
    contract: !!contractAddress,
    store: storeRegistered,
    data: seeded || Number(state?.isSeeded ?? 0) > 0,
  };
  const busy = running !== null || !!confirming;

  async function run(step: Step, action: () => Promise<void>) {
    setErrors(prev => ({ ...prev, [step]: undefined }));
    setRunning(step);
    try {
      await action();
    } catch (e) {
      setErrors(prev => ({ ...prev, [step]: briefError(ERROR_LABEL[step], e) }));
    } finally {
      setRunning(null);
      setConfirming(null);
    }
  }

  const steps: { key: Step; title: string; hint: string; label: string; ready: boolean; onClick: () => void }[] = [
    {
      key: 'wallet', title: t.setupWallet, hint: t.setupWalletHint, ready: true,
      label: connecting ? t.connecting : t.connectLace,
      onClick: () => void connect(),
    },
    {
      key: 'contract', title: t.setupContract, hint: t.setupContractHint, ready: done.wallet,
      label: running === 'contract' ? t.deploying : t.deployContract,
      onClick: () => void run('contract', async () => {
        setContractAddress(await deployViaLace(wallet!, lang, () => setConfirming(t.confirmDeploying)));
      }),
    },
    {
      key: 'store', title: t.setupStore, hint: t.setupStoreHint, ready: done.wallet && done.contract,
      label: running === 'store' ? t.registeringStore : t.registerStore,
      onClick: () => void run('store', async () => {
        await registerStoreViaLace(wallet!, lang, () => setConfirming(t.confirmRegisteringStore));
        setStoreRegistered(true);
      }),
    },
    {
      key: 'data', title: t.setupData, hint: t.setupDataHint, ready: done.wallet && done.contract,
      label: running === 'data' ? t.seeding : t.seedData,
      onClick: () => void run('data', async () => {
        await seedViaLace(wallet!, contractAddress!, lang, () => setConfirming(t.confirmSeeding));
        setSeeded(true);
      }),
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>{t.setupTitle}</h2>
        <p className={styles.intro}>{t.setupIntro}</p>

        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={step.key} className={cx(styles.step, done[step.key] && styles.stepDone)}>
              <span className={styles.number} aria-hidden="true">{done[step.key] ? '✓' : i + 1}</span>
              <div className={styles.stepBody}>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepHint}>{step.hint}</div>
                {errors[step.key] && <div className={styles.stepError}>{errors[step.key]}</div>}
              </div>
              {done[step.key] ? (
                <span className={styles.doneTag}>{t.setupDone}</span>
              ) : step.key === 'wallet' && choices.length > 1 ? (
                <div className={styles.choices}>
                  {choices.map(w => (
                    <button key={w.key} className={cx(styles.action, styles.choice)} onClick={() => void connect(w.key)} disabled={connecting}>
                      {w.name}
                    </button>
                  ))}
                </div>
              ) : (
                <button className={styles.action} onClick={step.onClick} disabled={!step.ready || busy}>
                  {step.label}
                </button>
              )}
            </li>
          ))}
        </ol>

        {Object.values(done).every(Boolean) && (
          <div className={styles.ready}>
            {t.setupReady}
            <Link to="/demo" className={styles.readyLink}>{t.setupGoToDemo} →</Link>
          </div>
        )}
      </div>
    </main>
  );
}
