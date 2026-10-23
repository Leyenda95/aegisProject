import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { SUBCATEGORY_INDEX, type AegisState, type Lang } from '../api.ts';
import { submitSignal, explainTxError, type ReceiptJSON } from '../lace.ts';
import { decodeReceiptFromQr, isReceiptJSON } from '../receiptCodec.ts';
import { addReceipt, markPublished, useVault } from '../vault.ts';
import { useShareDefaults } from '../sharePrefs.ts';
import QrScanner from './QrScanner.tsx';
import RedactedTicket, { type PublishProgressState } from './RedactedTicket.tsx';
import UserPhone from './UserPhone.tsx';
import PrivacyPanel from './PrivacyPanel.tsx';
import ProofLocationPicker, { type ProofServerStatus } from './ProofLocationPicker.tsx';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import { useWallet } from '../app/WalletProvider.tsx';
import { useChain } from '../app/ChainProvider.tsx';
import { useTx } from '../app/TxProvider.tsx';
import { useReportFlow } from '../routes/demoFlow.ts';
import { isLocalProofServerUp, loadLocalProofPreference, saveLocalProofPreference } from '../localProofServer.ts';
import styles from './UserView.module.css';

// Las tarjetas de "¿Qué acaba de pasar?" salen solo la primera vez.
const EXPLAINED_KEY = 'aegis-explained';

type Props = {
  lang: Lang;
  /** 'demo': el móvil dibujado dentro de la demo; 'app': la app a pantalla completa (/app). */
  variant?: 'demo' | 'app';
  /** Se incrementa al llegar desde "Ir a la vista de Usuario": el móvil vuelve al ticket nuevo. */
  goToContributeSignal?: number;
};

function counterKey(subcategory: number): string {
  const sub = SUBCATEGORY_INDEX[subcategory] ?? 'other';
  return 'signals' + sub[0].toUpperCase() + sub.slice(1);
}

/** Los contadores públicos de las subcategorías del recibo, o null si aún no se han leído. */
function receiptCounters(receipt: ReceiptJSON, state: AegisState | null): Record<string, number> | null {
  if (!state) return null;
  return Object.fromEntries(receipt.lines.map(l => [counterKey(l.subcategory), Number(state[counterKey(l.subcategory) as keyof AegisState] ?? 0)]));
}

type Publication = PublishProgressState & {
  receipt: ReceiptJSON;
  /** Los contadores antes de publicar: cuando suben lo que trae el recibo, la señal ya está en el agregado. */
  before: Record<string, number> | null;
};

function readExplained(): boolean {
  try {
    return localStorage.getItem(EXPLAINED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function UserView({ lang, variant = 'demo', goToContributeSignal }: Props) {
  const t = T[lang];
  const navigate = useNavigate();
  const { wallet: lace } = useWallet();
  // Con patrocinio, el backend paga las transacciones: publicar señales no necesita wallet.
  const { sponsored, contractAddress, state } = useChain();
  // Lock global: hay una transacción de otra pestaña/acción esperando confirmación.
  const { confirming: confirmingMsg } = useTx();
  const vault = useVault();
  const shareDefaults = useShareDefaults();
  const reportFlow = useReportFlow();

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  // Ticket abierto en la ventana de publicar (escaneado o el nuevo del móvil).
  const [open, setOpen] = useState<ReceiptJSON | null>(null);
  // La última publicación: sigue aunque se cierre la ventana.
  const [publication, setPublication] = useState<Publication | null>(null);
  const [explained, setExplained] = useState(readExplained);
  // Probar la señal con el proof server del propio usuario (ver localProver.ts).
  const [localProof, setLocalProof] = useState(loadLocalProofPreference);
  const [proofServer, setProofServer] = useState<ProofServerStatus>('checking');

  async function checkProofServer() {
    setProofServer('checking');
    setProofServer(await isLocalProofServerUp() ? 'up' : 'down');
  }

  useEffect(() => {
    if (localProof) void checkProofServer();
  }, [localProof]);

  function chooseLocalProof(local: boolean) {
    setLocalProof(local);
    saveLocalProofPreference(local);
  }

  const localProofBlocked = localProof && proofServer !== 'up';
  const needsLace = !lace && !sponsored;
  const needsDeploy = !needsLace && !contractAddress;
  const publishing = publication?.step === 'proving' || publication?.step === 'signing';

  // Enviada la señal, se espera a verla en los contadores públicos: entonces
  // ya cuenta en el agregado (con directo, en cuanto entra el bloque).
  useEffect(() => {
    if (publication?.step !== 'sent' || !publication.before) return;
    const now = receiptCounters(publication.receipt, state);
    const before = publication.before;
    if (!now) return;
    const arrived = publication.receipt.lines.every(l => now[counterKey(l.subcategory)] >= before[counterKey(l.subcategory)] + l.qty);
    if (arrived) setPublication(p => (p && p.receipt.nonce === publication.receipt.nonce ? { ...p, step: 'aggregated' } : p));
  }, [state, publication]);

  useEffect(() => {
    reportFlow({ sheetOpen: open !== null, publishing: publication && { nonce: publication.receipt.nonce, step: publication.step } });
  }, [open, publication, reportFlow]);

  function openTicket(receipt: ReceiptJSON) {
    // Otro ticket: lo de la publicación anterior ya no hace falta enseñarlo.
    if (publication && !publishing && publication.receipt.nonce !== receipt.nonce) setPublication(null);
    setOpen(receipt);
  }

  async function handleScan(data: string) {
    if (!data || !data.trim()) return; // lectura vacía de la cámara: se ignora, sigue escaneando
    setScanning(false);
    try {
      const parsed = await decodeReceiptFromQr(data);
      if (!isReceiptJSON(parsed)) throw new Error(t.scanNotAegis);
      // Se guarda en el móvil y se abre para elegir qué revelar y publicarlo.
      addReceipt(parsed);
      setScanError(null);
      openTicket(parsed);
    } catch (e: any) {
      setScanError(e?.message ?? t.scanReadFailed);
    }
  }

  async function handlePublish() {
    if (needsLace || !open || confirmingMsg || localProofBlocked || publishing) return;
    const receipt = open;
    setPublication({ receipt, before: receiptCounters(receipt, state), step: 'proving', signed: false, sponsored: false, error: null });
    const update = (patch: Partial<Publication>) =>
      setPublication(p => (p && p.receipt.nonce === receipt.nonce ? { ...p, ...patch } : p));
    try {
      const paidBySponsor = await submitSignal(lace, receipt, lang, {
        localProof, sponsored, contractAddress,
        onSigning: () => update({ step: 'signing', signed: true }),
      });
      markPublished(receipt.nonce, paidBySponsor);
      update({ step: 'sent', sponsored: paidBySponsor });
    } catch (e: any) {
      update({ step: 'failed', error: e?.message ? explainTxError(e, lang) : t.sendSignalError });
    }
  }

  function closeSheet() {
    setOpen(null);
    if (publication?.step === 'failed') setPublication(null);
    // Las tarjetas de qué acaba de pasar ya se han visto.
    if ((publication?.step === 'sent' || publication?.step === 'aggregated') && !explained) {
      setExplained(true);
      try {
        localStorage.setItem(EXPLAINED_KEY, '1');
      } catch {
        // Sin localStorage: volverán a salir la próxima vez que se cargue la página.
      }
    }
  }

  const proofPicker = (
    <ProofLocationPicker
      lang={lang}
      local={localProof}
      onChange={chooseLocalProof}
      status={proofServer}
      onRetry={() => void checkProofServer()}
      disabled={publishing}
    />
  );

  // Avisos en el móvil mientras la ventana de publicar está cerrada.
  const step = !open ? publication?.step : undefined;
  const messages = scanError ? <p className={styles.error}>{scanError}</p>
    : step === 'proving' || step === 'signing' ? <p className={styles.pending}>{t.signalConfirming}</p>
    : step === 'sent' || step === 'aggregated' ? <p className={styles.sent}>{t.userSentTitle} ✓{publication?.sponsored && ` · ${t.feePaidByAegis}`}</p>
    : step === 'failed' ? <p className={styles.error}>{publication?.error}</p>
    : null;

  return (
    <div className={cx(styles.root, variant === 'app' && styles.app)}>
      {variant === 'demo' && (
        <>
          <h2 className={styles.title}>{t.userTitle}</h2>
          <p className={styles.subtitle}>{t.userSubtitle}</p>
        </>
      )}

      <UserPhone
        lang={lang}
        entries={vault}
        needsLace={needsLace}
        needsDeploy={needsDeploy}
        busy={!!confirmingMsg}
        onOpenTicket={openTicket}
        onScan={() => { setScanError(null); setScanning(true); }}
        messages={messages}
        privacy={<PrivacyPanel lang={lang} count={vault.length} proofPicker={proofPicker} />}
        scrollTopSignal={goToContributeSignal}
        bare={variant === 'app'}
      />

      {scanning && <QrScanner lang={lang} onScan={handleScan} onClose={() => setScanning(false)} />}

      {open && (
        <RedactedTicket
          key={open.nonce}
          lang={lang}
          receipt={open}
          onConfirm={() => void handlePublish()}
          onCancel={closeSheet}
          confirmDisabled={!!confirmingMsg || localProofBlocked || publishing}
          initialShare={shareDefaults}
          sideMenuExtra={proofPicker}
          progress={publication && publication.receipt.nonce === open.nonce ? publication : null}
          localProof={localProof}
          explain={!explained}
          onViewMarket={() => { closeSheet(); navigate('/market'); }}
        />
      )}
    </div>
  );
}
