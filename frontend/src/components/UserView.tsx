import { useEffect, useState } from 'react';
import { SUBCATEGORY_INDEX, SUBCATEGORY_LABELS, type Lang } from '../api.ts';
import { submitSignalViaLace, explainTxError, type ConnectedAPI, type ReceiptJSON } from '../lace.ts';
import { decodeReceiptFromQr } from '../receiptCodec.ts';
import { listVault, addToVault, removeFromVault, type VaultEntry } from '../vault.ts';
import QrScanner from './QrScanner.tsx';
import RedactedTicket from './RedactedTicket.tsx';
import { T } from '../i18n.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';
import ProfileSection from './ProfileSection.tsx';

type Props = {
  lang: Lang;
  lace: ConnectedAPI | null;
  contractAddress: string | null;
  /** Último recibo sellado en la pestaña Tienda de esta misma sesión de demo. */
  lastReceipt: ReceiptJSON | null;
  /** Se llama tras publicar la señal directamente desde `lastReceipt`, para que App lo limpie (ya no se puede reenviar, el contrato marca cada recibo como usado). */
  onReceiptConsumed?: () => void;
  /** Lock global: hay una transacción de otra pestaña/acción esperando confirmación. */
  confirmingMsg: string | null;
  setConfirmingMsg: (msg: string | null) => void;
  /** Se llama tras publicar cualquier señal (directa o desde bóveda), para que StoreView pueda retirar su ticket si es el mismo. */
  onSignalPublished?: (receipt: ReceiptJSON) => void;
};

function isReceiptJSON(v: any): v is ReceiptJSON {
  return v && Array.isArray(v.lines) && v.lines.length > 0
    && v.lines.every((l: any) => l && typeof l.subcategory === 'number' && typeof l.qty === 'number' && typeof l.amount === 'string')
    && typeof v.timestamp === 'string' && typeof v.nonce === 'string';
}

export default function UserView({ lang, lace, contractAddress, lastReceipt, onReceiptConsumed, confirmingMsg, onSignalPublished }: Props) {
  const t = T[lang];
  const subLabel = SUBCATEGORY_LABELS[lang];
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const [activeTab, setActiveTab] = useState<'contribute' | 'profile'>('contribute');

  const [vault, setVault] = useState<VaultEntry[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<ReceiptJSON | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
  const [justSentId, setJustSentId] = useState<string | null>(null);
  // Fuente del ticket abierto en RedactedTicket: 'scan' sigue el flujo de
  // siempre (confirmar -> bóveda -> "Enviar señal" aparte); 'direct' es el
  // atajo con `lastReceipt` (confirmar publica la señal ahí mismo, sin pasar
  // por la bóveda).
  const [publishSource, setPublishSource] = useState<'scan' | 'direct' | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    setVault(listVault());
  }, []);

  const needsLace = !lace;
  const needsDeploy = lace && !contractAddress;

  async function handleScan(data: string) {
    if (!data || !data.trim()) return; // lectura vacía de la cámara: se ignora, sigue escaneando
    setScanning(false);
    try {
      const parsed = await decodeReceiptFromQr(data);
      if (!isReceiptJSON(parsed)) throw new Error(t.scanNotAegis);
      setScanned(parsed);
      setPublishSource('scan');
      setScanError(null);
    } catch (e: any) {
      setScanError(e?.message ?? t.scanReadFailed);
    }
  }

  function useLastReceipt() {
    if (!lastReceipt) return;
    setPublishError(null);
    setPublishSource('direct');
    setScanned(lastReceipt);
  }

  async function handleTicketConfirm() {
    if (publishSource === 'direct') {
      if (!lace || !scanned || confirmingMsg) return;
      setPublishing(true);
      setPublishError(null);
      try {
        await submitSignalViaLace(lace, scanned);
        onSignalPublished?.(scanned);
        setScanned(null);
        setPublishSource(null);
        onReceiptConsumed?.();
        setJustPublished(true);
        setShowExplainer(true);
        setTimeout(() => setJustPublished(false), 4000);
      } catch (e: any) {
        setPublishError(e?.message ? explainTxError(e, lang) : t.sendSignalError);
      } finally {
        setPublishing(false);
      }
      return;
    }
    if (scanned) {
      addToVault(scanned);
      setVault(listVault());
    }
    setScanned(null);
    setPublishSource(null);
  }

  function handleTicketCancel() {
    setScanned(null);
    setPublishSource(null);
    setPublishError(null);
  }

  async function handleSubmit(entry: VaultEntry) {
    if (!lace || confirmingMsg) return;
    setSubmittingId(entry.id);
    setSubmitErrors(prev => { const { [entry.id]: _, ...rest } = prev; return rest; });
    try {
      await submitSignalViaLace(lace, entry.receipt);
      onSignalPublished?.(entry.receipt);
      removeFromVault(entry.id);
      setVault(listVault());
      setJustSentId(entry.id);
      setShowExplainer(true);
      setTimeout(() => setJustSentId(null), 4000);
    } catch (e: any) {
      setSubmitErrors(prev => ({ ...prev, [entry.id]: e?.message ? explainTxError(e, lang) : t.sendSignalError }));
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Tour frame: title + subtitle + tabs + content */}
      <div data-tour="profile-section">
        <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>{t.userTitle}</h2>
        <p style={{ color: '#999999', fontSize: isMobile ? 12 : 13, lineHeight: 1.6, textAlign: 'center', marginBottom: isMobile ? 16 : 24 }}>{t.userSubtitle}</p>

        {/* Tab switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, background: 'var(--surface-2)', border: '1px solid #2A2A2A', borderRadius: 9, padding: 3, marginBottom: isMobile ? 16 : 24 }}>
          {(['contribute', 'profile'] as const).map(tab => (
            <button key={tab} data-tour={tab === 'profile' ? 'profile-tab' : 'contribute-tab'} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? '#926a4520' : 'transparent',
              color: activeTab === tab ? '#FFFFFF' : '#888888',
              border: `1px solid ${activeTab === tab ? '#926A45' : 'transparent'}`,
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
          <div style={{ background: 'var(--surface-2)', border: '1px solid #222222', borderRadius: 8, padding: isMobile ? 12 : 14, marginBottom: 16, fontSize: isMobile ? 12 : 13, color: '#BBBBBB' }}>
            {t.userNeedsLace}
          </div>
        )}
        {needsDeploy && (
          <div style={{ background: 'var(--surface-2)', border: '1px solid #92400e', borderRadius: 8, padding: isMobile ? 12 : 14, marginBottom: 16, fontSize: isMobile ? 12 : 13, color: '#fbbf24' }}>
            {t.userNeedsDeploy}
          </div>
        )}

        <div style={{ marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ fontSize: 12, color: '#999999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t.scanSectionLabel}
          </div>
          <p style={{ color: '#999999', fontSize: isMobile ? 12 : 13, lineHeight: 1.6, marginBottom: 12 }}>
            {t.scanIntro}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <button
                onClick={() => { setScanError(null); setScanning(true); }}
                disabled
                style={{
                  width: '100%', background: '#926a4514', border: '2px solid #926A45', color: '#E8C9A6',
                  padding: isMobile ? '14px 10px' : '18px 10px', fontSize: isMobile ? 14 : 15, fontWeight: 700, borderRadius: 12,
                  opacity: 0.3, cursor: 'not-allowed',
                }}
              >
                {t.scanButton}
              </button>
              <p style={{ color: '#666666', fontSize: 11.5, marginTop: 8, lineHeight: 1.5 }}>
                {t.scanUnavailable}
              </p>
              {scanError && (
                <p style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{scanError}</p>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              {lastReceipt && !needsLace && !needsDeploy && (
                <span style={{
                  position: 'absolute', top: -9, right: 8, background: '#64d1a9dc', color: '#0a0a0a',
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, letterSpacing: 0.3,
                }}>
                  {t.newTicketBadge}
                </span>
              )}
              <button
                onClick={useLastReceipt}
                disabled={!lastReceipt || !!needsLace || !!needsDeploy || !!confirmingMsg}
                style={{
                  width: '100%', background: '#456d9214', border: `2px solid ${lastReceipt ? '#64d1a9' : '#456D92'}`, color: '#A8C2E0',
                  padding: isMobile ? '14px 10px' : '18px 10px', fontSize: isMobile ? 14 : 15, fontWeight: 700, borderRadius: 12,
                  opacity: (!lastReceipt || needsLace || needsDeploy || confirmingMsg) ? 0.3 : 1, cursor: (!lastReceipt || needsLace || needsDeploy || confirmingMsg) ? 'not-allowed' : 'pointer',
                }}
              >
                {t.useLastReceiptButton}
              </button>
              <p style={{ color: lastReceipt ? '#64d1a9dc' : '#666666', fontSize: 11.5, marginTop: 8, lineHeight: 1.5, fontWeight: lastReceipt ? 600 : 400 }}>
                {lastReceipt ? t.useLastReceiptReady : t.useLastReceiptEmpty}
              </p>
            </div>
          </div>
          {justPublished && (
            <p style={{ color: '#64d1a9dc', fontSize: 13, fontWeight: 600, marginTop: 10 }}>{t.userSentTitle} ✓</p>
          )}
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#999999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t.vaultLabel(vault.length)}
          </div>
          {vault.length === 0 ? (
            <p style={{ color: '#666666', fontSize: isMobile ? 13 : 14 }}>{t.vaultEmpty}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vault.map(entry => {
                const rls = entry.receipt.lines ?? [];
                const summary = rls
                  .map(l => `${subLabel[SUBCATEGORY_INDEX[l.subcategory]] ?? '?'} ×${l.qty}`)
                  .join(' · ');
                const amount = (rls.reduce((s, l) => s + Number(l.amount), 0) / 100).toFixed(2);
                const sending = submittingId === entry.id;
                return (
                  <div key={entry.id} style={{
                    background: 'var(--surface-2)', border: '1px solid #1A1A1A', borderRadius: 10,
                    padding: isMobile ? 12 : 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  }}>
                    <div>
                      <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: '#FFFFFF' }}>
                        {summary}
                      </div>
                      <div style={{ fontSize: 12, color: '#AAAAAA' }}>{amount} €</div>
                      {submitErrors[entry.id] && (
                        <div style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{submitErrors[entry.id]}</div>
                      )}
                    </div>
                    {justSentId === entry.id ? (
                      <span style={{ fontSize: 13, color: '#64d1a9dc', fontWeight: 600 }}>{t.userSentTitle} ✓</span>
                    ) : (
                      <button
                        onClick={() => handleSubmit(entry)}
                        disabled={sending || !!needsLace || !!needsDeploy || !!confirmingMsg}
                        style={{
                          background: '#926A45', color: '#FFFFFF', fontSize: 13, padding: '8px 16px',
                          borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
                          opacity: sending ? 0.5 : 1,
                        }}
                      >
                        {sending ? '...' : t.sendSignal}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, marginBottom: 16, background: 'var(--surface-2)', border: '1px solid #2A2A2A', borderRadius: 8, padding: isMobile ? 12 : 16 }}>
          <div style={{ fontSize: isMobile ? 12 : 12, color: '#BBBBBB', lineHeight: 1.7 }}>
            <strong style={{ color: '#DDDDDD' }}>{t.userPrivacy}</strong> {t.userPrivacyDetail}
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
          confirmLabel={publishSource === 'direct' ? (publishing ? t.publishing : t.publishSignal) : undefined}
          confirmDisabled={publishSource === 'direct' && (publishing || !!confirmingMsg)}
          error={publishSource === 'direct' ? publishError : null}
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
                color: '#888888', fontSize: 22, width: 32, height: 32, padding: 0, lineHeight: 1,
              }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: '#FFFFFF', marginBottom: 18, paddingRight: 24 }}>
              {t.explainerTitle}
            </h3>
            <p style={{ fontSize: 14.5, color: '#CCCCCC', lineHeight: 1.7, marginBottom: 14 }}>{t.explainerBody1}</p>
            <p style={{ fontSize: 14.5, color: '#CCCCCC', lineHeight: 1.7, marginBottom: 14 }}>{t.explainerBody2}</p>
            <p style={{ fontSize: 14.5, color: '#CCCCCC', lineHeight: 1.7, marginBottom: 14 }}>{t.explainerBody3}</p>
            <p style={{ fontSize: 14.5, color: '#CCCCCC', lineHeight: 1.7, marginBottom: 26 }}>{t.explainerBody4}</p>
            <button
              onClick={() => setShowExplainer(false)}
              style={{ display: 'block', margin: '12px auto 0', background: '#926A45', color: '#FFFFFF', padding: '10px 44px', fontSize: 14, fontWeight: 600 }}
            >
              {t.explainerClose}
            </button>
          </div>
        </div>
      )}

      {/* Midnight branding */}
      <div style={{ textAlign: 'center', marginTop: isMobile ? 40 : 80, padding: '24px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 25 }}>
        <span style={{ fontSize: 11, color: '#8f8f8f', letterSpacing: 1.5, textTransform: 'uppercase' }}>Built on</span>
        <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" style={{ height: 28, opacity: 0.85 }} />
      </div>
    </div>
  );
}
