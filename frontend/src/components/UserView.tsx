import { useEffect, useState } from 'react';
import { type Lang } from '../api.ts';
import { submitSignal, explainTxError, type ConnectedAPI, type ReceiptJSON } from '../lace.ts';
import { decodeReceiptFromQr } from '../receiptCodec.ts';
import QrScanner from './QrScanner.tsx';
import RedactedTicket from './RedactedTicket.tsx';
import { T } from '../i18n.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';
import UserPhone from './UserPhone.tsx';
import ProofLocationPicker, { type ProofServerStatus } from './ProofLocationPicker.tsx';
import { isLocalProofServerUp, loadLocalProofPreference, saveLocalProofPreference } from '../localProofServer.ts';

type Props = {
  lang: Lang;
  lace: ConnectedAPI | null;
  /** El backend paga las transacciones (patrocinio): publicar señales no necesita wallet. */
  sponsored: boolean;
  contractAddress: string | null;
  /** Último recibo sellado en la pestaña Tienda de esta misma sesión de demo. */
  lastReceipt: ReceiptJSON | null;
  /** Se llama tras publicar la señal directamente desde `lastReceipt`, para que App lo limpie (ya no se puede reenviar, el contrato marca cada recibo como usado). */
  onReceiptConsumed?: () => void;
  /** Lock global: hay una transacción de otra pestaña/acción esperando confirmación. */
  confirmingMsg: string | null;
  setConfirmingMsg: (msg: string | null) => void;
  /** Se llama tras publicar cualquier señal (escaneada o el último recibo), para que StoreView pueda retirar su ticket si es el mismo. */
  onSignalPublished?: (receipt: ReceiptJSON) => void;
  /** Se incrementa cada vez que se navega aquí desde "Go to User View" en la tienda: lleva la pantalla del móvil arriba, donde está el ticket nuevo. */
  goToContributeSignal?: number;
};

function isReceiptJSON(v: any): v is ReceiptJSON {
  return v && Array.isArray(v.lines) && v.lines.length > 0
    && v.lines.every((l: any) => l && typeof l.subcategory === 'number' && typeof l.qty === 'number' && typeof l.amount === 'string')
    && typeof v.timestamp === 'string' && typeof v.nonce === 'string';
}

export default function UserView({ lang, lace, sponsored, contractAddress, lastReceipt, onReceiptConsumed, confirmingMsg, onSignalPublished, goToContributeSignal }: Props) {
  const t = T[lang];
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  // Recibos publicados como señal en esta sesión, para que pasen a la lista
  // de compras del móvil con su marca (solo en memoria, como el resto del perfil).
  const [published, setPublished] = useState<ReceiptJSON[]>([]);

  const [scanning, setScanning] = useState(false);
  // Recibo abierto en RedactedTicket (escaneado o el último sellado), a la
  // espera de elegir qué revelar y publicarlo.
  const [scanned, setScanned] = useState<ReceiptJSON | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);
  // Error de una publicación que falló después de haber cerrado ya el ticket
  // (ver el cierre adelantado en handleTicketConfirm).
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  // Si la última señal publicada la pagó el patrocinio (para decirlo en el mensaje de éxito).
  const [lastSponsored, setLastSponsored] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
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

  async function handleScan(data: string) {
    if (!data || !data.trim()) return; // lectura vacía de la cámara: se ignora, sigue escaneando
    setScanning(false);
    try {
      const parsed = await decodeReceiptFromQr(data);
      if (!isReceiptJSON(parsed)) throw new Error(t.scanNotAegis);
      // Igual que "usar último recibo": se elige qué revelar y se publica ahí mismo.
      setPublishError(null);
      setScanned(parsed);
      setScanError(null);
    } catch (e: any) {
      setScanError(e?.message ?? t.scanReadFailed);
    }
  }

  function useLastReceipt() {
    if (!lastReceipt) return;
    setPublishError(null);
    setScanned(lastReceipt);
  }

  async function handleTicketConfirm() {
    if (needsLace || !scanned || confirmingMsg || localProofBlocked) return;
    const receipt = scanned;
    setPublishing(true);
    setPublishError(null);
    setBackgroundError(null);
    // Con patrocinio, al segundo se cierra el ticket y se enseña la
    // explicación, sin esperar a que la red confirme la transacción (puede
    // tardar bastante más). Si luego fallara, el error se enseña debajo de
    // los botones. Con wallet propia no se adelanta: se espera a que el
    // usuario la apruebe en su ventana y la wallet la envíe. Tampoco si la
    // prueba se genera en el equipo del usuario: todavía se está probando y
    // el ticket es lo que enseña que sigue trabajando.
    let closed = false;
    const closeTicket = () => {
      if (closed) return;
      closed = true;
      setScanned(null);
      setShowExplainer(true);
    };
    const earlyClose = sponsored && !localProof ? setTimeout(closeTicket, 1000) : undefined;
    try {
      setLastSponsored(await submitSignal(lace, receipt, lang, { localProof, sponsored, contractAddress }));
      onSignalPublished?.(receipt);
      setPublished(prev => prev.some(r => r.nonce === receipt.nonce) ? prev : [receipt, ...prev]);
      if (lastReceipt?.nonce === receipt.nonce) onReceiptConsumed?.();
      clearTimeout(earlyClose);
      closeTicket();
      setJustPublished(true);
      setTimeout(() => setJustPublished(false), 4000);
    } catch (e: any) {
      clearTimeout(earlyClose);
      const msg = e?.message ? explainTxError(e, lang) : t.sendSignalError;
      if (closed) setBackgroundError(msg);
      else setPublishError(msg);
    } finally {
      setPublishing(false);
    }
  }

  function handleTicketCancel() {
    setScanned(null);
    setPublishError(null);
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>{t.userTitle}</h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: isMobile ? 12 : 13, lineHeight: 1.6, textAlign: 'center', marginBottom: isMobile ? 16 : 24 }}>{t.userSubtitle}</p>

      <UserPhone
        lang={lang}
        lastReceipt={lastReceipt}
        published={published}
        needsLace={needsLace}
        needsDeploy={needsDeploy}
        busy={publishing || !!confirmingMsg}
        onPublishLast={useLastReceipt}
        onScan={() => { setScanError(null); setScanning(true); }}
        scrollTopSignal={goToContributeSignal}
        messages={(justPublished || (publishing && !scanned) || backgroundError || scanError) && <>
          {justPublished && <p style={{ color: 'var(--success)', fontWeight: 600 }}>{t.userSentTitle} ✓{lastSponsored && ` · ${t.feePaidByAegis}`}</p>}
          {publishing && !scanned && <p style={{ color: 'var(--ink-soft)' }}>{t.signalConfirming}</p>}
          {backgroundError && <p style={{ color: 'var(--danger)' }}>{backgroundError}</p>}
          {scanError && <p style={{ color: 'var(--danger)' }}>{scanError}</p>}
        </>}
      />

      {scanning && <QrScanner lang={lang} onScan={handleScan} onClose={() => setScanning(false)} />}

      {scanned && (
        <RedactedTicket
          lang={lang}
          receipt={scanned}
          onConfirm={handleTicketConfirm}
          onCancel={handleTicketCancel}
          confirmLabel={publishing ? t.publishing : t.publishSignal}
          confirmDisabled={publishing || !!confirmingMsg || localProofBlocked}
          error={publishError}
          status={publishing && localProof ? t.localProofProving : null}
          sideMenuExtra={
            <ProofLocationPicker
              lang={lang}
              local={localProof}
              onChange={chooseLocalProof}
              status={proofServer}
              onRetry={() => void checkProofServer()}
              disabled={publishing}
            />
          }
        />
      )}

      {showExplainer && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            style={{
              position: 'relative', background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 20, padding: 46, maxWidth: 580, width: '100%',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <button
              onClick={() => setShowExplainer(false)}
              aria-label={t.explainerClose}
              style={{
                position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none',
                color: 'var(--ink-dim)', fontSize: 22, width: 32, height: 32, padding: 0, lineHeight: 1,
              }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--ink-bright)', marginBottom: 18, paddingRight: 24 }}>
              {t.explainerTitle}
            </h3>
            <p style={{ fontSize: 14.5, color: 'var(--ink-pale)', lineHeight: 1.7, marginBottom: 14 }}>{t.explainerBody1}</p>
            <p style={{ fontSize: 14.5, color: 'var(--ink-pale)', lineHeight: 1.7, marginBottom: 14 }}>{t.explainerBody2}</p>
            <p style={{ fontSize: 14.5, color: 'var(--ink-pale)', lineHeight: 1.7, marginBottom: 14 }}>{t.explainerBody3}</p>
            <p style={{ fontSize: 14.5, color: 'var(--ink-pale)', lineHeight: 1.7, marginBottom: 26 }}>{t.explainerBody4}</p>
            <button
              onClick={() => setShowExplainer(false)}
              style={{ display: 'block', margin: '12px auto 0', background: 'var(--bronze-deep)', color: 'var(--on-bronze)', padding: '10px 44px', fontSize: 14, fontWeight: 600 }}
            >
              {t.explainerClose}
            </button>
          </div>
        </div>
      )}

      {/* Midnight branding */}
      <div style={{ textAlign: 'center', marginTop: isMobile ? 40 : 80, padding: '24px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 25 }}>
        <span className="builtOnLabel" style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>Built on</span>
        <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" className="midnight-logo" style={{ height: 28, opacity: 0.85 }} />
      </div>
    </div>
  );
}
