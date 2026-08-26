import { useEffect, useState } from 'react';
import { SUBCATEGORY_INDEX, SUBCATEGORY_LABELS, type Lang } from '../api.ts';
import { submitSignalViaLace, type ConnectedAPI, type ReceiptJSON } from '../lace.ts';
import { listVault, addToVault, removeFromVault, type VaultEntry } from '../vault.ts';
import QrScanner from './QrScanner.tsx';
import { T } from '../i18n.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';
import ProfileSection from './ProfileSection.tsx';

type Props = {
  lang: Lang;
  lace: ConnectedAPI | null;
  contractAddress: string | null;
};

function isReceiptJSON(v: any): v is ReceiptJSON {
  return v && typeof v.subcategory === 'number' && typeof v.amount === 'string'
    && typeof v.timestamp === 'string' && typeof v.nonce === 'string';
}

export default function UserView({ lang, lace, contractAddress }: Props) {
  const t = T[lang];
  const subLabel = SUBCATEGORY_LABELS[lang];
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const [activeTab, setActiveTab] = useState<'contribute' | 'profile'>('profile');

  const [vault, setVault] = useState<VaultEntry[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
  const [justSentId, setJustSentId] = useState<string | null>(null);

  useEffect(() => {
    setVault(listVault());
  }, []);

  const needsLace = !lace;
  const needsDeploy = lace && !contractAddress;

  function handleScan(data: string) {
    setScanning(false);
    try {
      const parsed = JSON.parse(data);
      if (!isReceiptJSON(parsed)) throw new Error('QR no reconocido como recibo de Aegis');
      addToVault(parsed);
      setVault(listVault());
      setScanError(null);
    } catch (e: any) {
      setScanError(e?.message ?? 'No se pudo leer el QR');
    }
  }

  async function handleSubmit(entry: VaultEntry) {
    if (!lace) return;
    setSubmittingId(entry.id);
    setSubmitErrors(prev => { const { [entry.id]: _, ...rest } = prev; return rest; });
    try {
      await submitSignalViaLace(lace, entry.receipt);
      removeFromVault(entry.id);
      setVault(listVault());
      setJustSentId(entry.id);
      setTimeout(() => setJustSentId(null), 4000);
    } catch (e: any) {
      setSubmitErrors(prev => ({ ...prev, [entry.id]: e?.message ?? 'Error enviando la señal' }));
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      {/* Logo: outside tour frame */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 8 : 12 }}>
        <img src="/images/aegis_hor_letras.svg" alt="Aegis" style={{ height: isMobile ? 90 : 180, objectFit: 'contain', marginBottom: isMobile ? 12 : 40 }} />
      </div>

      {/* Tour frame: title + subtitle + tabs + content */}
      <div data-tour="profile-section">
        <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>{t.userTitle}</h2>
        <p style={{ color: '#999999', fontSize: isMobile ? 12 : 13, lineHeight: 1.6, textAlign: 'center', marginBottom: isMobile ? 16 : 24 }}>{t.userSubtitle}</p>

        {/* Tab switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: '#111', borderRadius: 10, padding: 4, marginBottom: isMobile ? 16 : 24 }}>
          {(['profile', 'contribute'] as const).map(tab => (
            <button key={tab} data-tour={tab === 'profile' ? 'profile-tab' : 'contribute-tab'} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? '#926A45' : 'transparent',
              color: activeTab === tab ? '#FFFFFF' : '#666',
              border: 'none', borderRadius: 8, padding: isMobile ? '9px' : '10px',
              fontSize: isMobile ? 13 : 13, fontWeight: 600, cursor: 'pointer',
            }}>
              {tab === 'profile' ? t.profileTab : t.contributeTab}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && <ProfileSection lang={lang} />}

        {activeTab === 'contribute' && <div data-tour="contribute-section">
        {needsLace && (
          <div style={{ background: '#111111', border: '1px solid #222222', borderRadius: 8, padding: isMobile ? 12 : 14, marginBottom: 16, fontSize: isMobile ? 12 : 13, color: '#BBBBBB' }}>
            {t.userNeedsLace}
          </div>
        )}
        {needsDeploy && (
          <div style={{ background: '#111111', border: '1px solid #92400e', borderRadius: 8, padding: isMobile ? 12 : 14, marginBottom: 16, fontSize: isMobile ? 12 : 13, color: '#fbbf24' }}>
            {t.userNeedsDeploy}
          </div>
        )}

        <div style={{ marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ fontSize: 12, color: '#999999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Recibo de una compra real
          </div>
          <p style={{ color: '#999999', fontSize: isMobile ? 12 : 13, lineHeight: 1.6, marginBottom: 12 }}>
            La tienda te enseña un código QR al pagar. Escanéalo para añadir el recibo a tu bóveda — decides tú, y cuándo, convertirlo en una señal.
          </p>
          <button
            onClick={() => { setScanError(null); setScanning(true); }}
            disabled={!!needsLace || !!needsDeploy}
            style={{
              width: '100%', background: 'transparent', border: '2px solid #926A45', color: '#926A45',
              padding: isMobile ? '12px' : '13px', fontSize: isMobile ? 14 : 15, borderRadius: 10,
              opacity: (needsLace || needsDeploy) ? 0.3 : 1, cursor: (needsLace || needsDeploy) ? 'not-allowed' : 'pointer',
            }}
          >
            📷 Escanear recibo
          </button>
          {scanError && (
            <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{scanError}</p>
          )}
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#999999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Tu bóveda ({vault.length})
          </div>
          {vault.length === 0 ? (
            <p style={{ color: '#666666', fontSize: isMobile ? 13 : 14 }}>Todavía no has escaneado ningún recibo.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vault.map(entry => {
                const subKey = SUBCATEGORY_INDEX[entry.receipt.subcategory];
                const amount = (Number(entry.receipt.amount) / 100).toFixed(2);
                const sending = submittingId === entry.id;
                return (
                  <div key={entry.id} style={{
                    background: '#111111', border: '1px solid #1A1A1A', borderRadius: 10,
                    padding: isMobile ? 12 : 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  }}>
                    <div>
                      <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: '#FFFFFF' }}>
                        {subLabel[subKey] ?? subKey}
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
                        disabled={sending || !!needsLace || !!needsDeploy}
                        style={{
                          background: '#926A45', color: '#FFFFFF', fontSize: 13, padding: '8px 16px',
                          borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
                          opacity: sending ? 0.5 : 1,
                        }}
                      >
                        {sending ? '…' : 'Enviar señal'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, marginBottom: 16, background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, padding: isMobile ? 12 : 16 }}>
          <div style={{ fontSize: isMobile ? 12 : 12, color: '#BBBBBB', lineHeight: 1.7 }}>
            <strong style={{ color: '#DDDDDD' }}>{t.userPrivacy}</strong> {t.userPrivacyDetail}
          </div>
        </div>
      </div>}

      </div>{/* end profile-section tour frame */}

      {scanning && <QrScanner onScan={handleScan} onClose={() => setScanning(false)} />}

      {/* Midnight branding */}
      <div style={{ textAlign: 'center', marginTop: isMobile ? 40 : 80, padding: '24px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 25 }}>
        <span style={{ fontSize: 11, color: '#8f8f8f', letterSpacing: 1.5, textTransform: 'uppercase' }}>Built on</span>
        <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" style={{ height: 28, opacity: 0.85 }} />
      </div>
    </div>
  );
}
