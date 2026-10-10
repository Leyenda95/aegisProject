import { useEffect, useState } from 'react';
import { type Lang } from '../api.ts';
import { submitSignal, explainTxError, type ConnectedAPI, type ReceiptJSON } from '../lace.ts';
import { decodeReceiptFromQr } from '../receiptCodec.ts';
import QrScanner from './QrScanner.tsx';
import RedactedTicket from './RedactedTicket.tsx';
import { T } from '../i18n.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';
import ProfileSection from './ProfileSection.tsx';

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
  /** Se incrementa cada vez que se navega aquí desde "Go to User View" en la tienda: fuerza la pestaña Contribute aunque My Profile estuviera abierta. */
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
  const [activeTab, setActiveTab] = useState<'contribute' | 'profile'>('contribute');

  useEffect(() => {
    if (goToContributeSignal) setActiveTab('contribute');
  }, [goToContributeSignal]);

  const [scanning, setScanning] = useState(false);
  // Recibo abierto en RedactedTicket (escaneado o el último sellado), a la
  // espera de elegir qué revelar y publicarlo.
  const [scanned, setScanned] = useState<ReceiptJSON | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);
  // Error de una publicación que falló después de haber cerrado ya el ticket
  // (ver el cierre a los 5 s en handleTicketConfirm).
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  // Si la última señal publicada la pagó el patrocinio (para decirlo en el mensaje de éxito).
  const [lastSponsored, setLastSponsored] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

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
    if (needsLace || !scanned || confirmingMsg) return;
    const receipt = scanned;
    setPublishing(true);
    setPublishError(null);
    setBackgroundError(null);
    // Con patrocinio, a los 5 s se cierra el ticket y se enseña la
    // explicación, sin esperar a que la red confirme la transacción (puede
    // tardar bastante más). Si luego fallara, el error se enseña debajo de
    // los botones. Con wallet propia no se adelanta: se espera a que el
    // usuario la apruebe en su ventana y la wallet la envíe.
    let closed = false;
    const closeTicket = () => {
      if (closed) return;
      closed = true;
      setScanned(null);
      setShowExplainer(true);
    };
    const earlyClose = sponsored ? setTimeout(closeTicket, 5000) : undefined;
    try {
      setLastSponsored(await submitSignal(lace, receipt, lang));
      onSignalPublished?.(receipt);
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
      {/* Tour frame: title + subtitle + tabs + content */}
      <div data-tour="profile-section">
        <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>{t.userTitle}</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: isMobile ? 12 : 13, lineHeight: 1.6, textAlign: 'center', marginBottom: isMobile ? 16 : 24 }}>{t.userSubtitle}</p>

        {/* Tab switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, background: 'var(--surface-2)', border: '1px solid var(--gray-800)', borderRadius: 9, padding: 3, marginBottom: isMobile ? 16 : 24 }}>
          {(['contribute', 'profile'] as const).map(tab => (
            <button key={tab} data-tour={tab === 'profile' ? 'profile-tab' : 'contribute-tab'} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? '#926a4520' : 'transparent',
              color: activeTab === tab ? 'var(--ink-bright)' : 'var(--ink-dim)',
              border: `1px solid ${activeTab === tab ? 'var(--bronze-deep)' : 'transparent'}`,
              borderRadius: 6, padding: isMobile ? '9px' : '10px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              {tab === 'profile' ? t.profileTab : t.contributeTab}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && <ProfileSection lang={lang} />}

        {activeTab === 'contribute' && <div data-tour="contribute-section" style={{
          border: `${isMobile ? 8 : 10}px solid var(--raised)`, borderRadius: isMobile ? 24 : 30,
          background: 'var(--ground)', padding: isMobile ? 16 : 22, maxWidth: 420, margin: '0 auto',
          boxShadow: '0 22px 55px rgba(0, 0, 0, 0.5)',
        }}>
        <div style={{ width: 58, height: 5, borderRadius: 3, background: 'var(--line)', margin: '2px auto 16px' }} />
        {needsLace && (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--gray-850)', borderRadius: 8, padding: isMobile ? 12 : 14, marginBottom: 16, fontSize: isMobile ? 12 : 13, color: 'var(--ink-pale)' }}>
            {t.userNeedsLace}
          </div>
        )}
        {needsDeploy && (
          <div style={{ background: 'var(--surface-2)', border: '1px solid #92400e', borderRadius: 8, padding: isMobile ? 12 : 14, marginBottom: 16, fontSize: isMobile ? 12 : 13, color: '#fbbf24' }}>
            {t.userNeedsDeploy}
          </div>
        )}

        <div style={{ marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
            {t.scanSectionLabel}
          </div>
          <p style={{ color: 'var(--ink-soft)', fontSize: isMobile ? 12 : 13, lineHeight: 1.6, marginBottom: 12 }}>
            {t.scanIntro}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <button
                onClick={() => { setScanError(null); setScanning(true); }}
                disabled={!!needsLace || !!needsDeploy}
                style={{
                  width: '100%', background: '#926a4514', border: '2px solid var(--bronze-deep)', color: 'var(--bronze-deep)',
                  padding: isMobile ? '14px 10px' : '18px 10px', fontSize: isMobile ? 14 : 15, fontWeight: 700, borderRadius: 12,
                  opacity: (needsLace || needsDeploy) ? 0.3 : 1, cursor: (needsLace || needsDeploy) ? 'not-allowed' : 'pointer',
                }}
              >
                {t.scanButton}
              </button>
              {scanError && (
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{scanError}</p>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              {lastReceipt && !needsLace && !needsDeploy && (
                <span style={{
                  position: 'absolute', top: -9, right: 8, background: 'var(--success-strong)', color: '#0a0a0a',
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, letterSpacing: 0.3,
                }}>
                  {t.newTicketBadge}
                </span>
              )}
              <button
                onClick={useLastReceipt}
                disabled={!lastReceipt || !!needsLace || !!needsDeploy || !!confirmingMsg}
                style={{
                  width: '100%',
                  background: lastReceipt ? 'color-mix(in srgb, var(--success) 18%, transparent)' : '#456d9226',
                  border: `2px solid ${lastReceipt ? 'var(--success)' : 'var(--accent-blue)'}`, color: lastReceipt ? 'var(--success)' : 'var(--accent-blue)',
                  padding: isMobile ? '14px 10px' : '18px 10px', fontSize: isMobile ? 14 : 15, fontWeight: 700, borderRadius: 12,
                  opacity: (!lastReceipt || needsLace || needsDeploy || confirmingMsg) ? 0.3 : 1, cursor: (!lastReceipt || needsLace || needsDeploy || confirmingMsg) ? 'not-allowed' : 'pointer',
                }}
              >
                {t.useLastReceiptButton}
              </button>
              <p style={{ color: lastReceipt ? 'var(--success)' : 'var(--ink-dim)', fontSize: 11.5, marginTop: 8, lineHeight: 1.5, fontWeight: lastReceipt ? 600 : 400 }}>
                {lastReceipt ? t.useLastReceiptReady : t.useLastReceiptEmpty}
              </p>
            </div>
          </div>
          {justPublished && (
            <p style={{ color: 'var(--success-strong)', fontSize: 13, fontWeight: 600, marginTop: 10 }}>{t.userSentTitle} ✓{lastSponsored && ` · ${t.feePaidByAegis}`}</p>
          )}
          {publishing && !scanned && (
            <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 10 }}>{t.signalConfirming}</p>
          )}
          {backgroundError && (
            <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{backgroundError}</p>
          )}
        </div>

        <div style={{ marginTop: 14, marginBottom: 16, background: 'var(--surface-2)', border: '1px solid var(--gray-800)', borderRadius: 8, padding: isMobile ? 12 : 16 }}>
          <div style={{ fontSize: isMobile ? 12 : 12, color: 'var(--ink-pale)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--ink-pale)' }}>{t.userPrivacy}</strong> {t.userPrivacyDetail}
          </div>
        </div>
      </div>}

      </div>{/* end profile-section tour frame */}

      {scanning && <QrScanner lang={lang} onScan={handleScan} onClose={() => setScanning(false)} />}

      {scanned && (
        <RedactedTicket
          lang={lang}
          receipt={scanned}
          onConfirm={handleTicketConfirm}
          onCancel={handleTicketCancel}
          confirmLabel={publishing ? t.publishing : t.publishSignal}
          confirmDisabled={publishing || !!confirmingMsg}
          error={publishError}
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
