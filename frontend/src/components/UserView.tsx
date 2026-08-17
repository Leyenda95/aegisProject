import { useState } from 'react';
import {
  CATEGORIES, SUBCATEGORIES, CATEGORY_LABELS,
  SUBCATEGORY_LABELS, postSignal,
  type Category, type Lang,
} from '../api.ts';
import { T } from '../i18n.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';
import ProfileSection from './ProfileSection.tsx';

type Props = {
  lang: Lang;
};

export default function UserView({ lang }: Props) {
  const t = T[lang];
  const catLabel = CATEGORY_LABELS[lang];
  const subLabel = SUBCATEGORY_LABELS[lang];
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const [activeTab, setActiveTab] = useState<'contribute' | 'profile'>('profile');

  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedSubcat, setSelectedSubcat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCatSelect(cat: Category) {
    setSelectedCat(cat);
    setSelectedSubcat(null);
  }

  const canSubmit = !!selectedSubcat && !loading;

  async function handleContribute() {
    if (!selectedSubcat) return;
    setLoading(true);
    setError(null);
    try {
      await postSignal(selectedSubcat);
      setSent(true);
      setTimeout(() => { setSent(false); setSelectedCat(null); setSelectedSubcat(null); }, 600_000);
    } catch (e: any) {
      console.error('[Aegis] contribution error:', e);
      setError(e.message || e.toString() || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/images/aegis_hor_letras.svg" alt="Aegis" style={{ height: isMobile ? 90 : 180, objectFit: 'contain', marginBottom: isMobile ? 16 : 40 }} />
          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#64d1a9dc', marginBottom: 12 }}>{t.userSentTitle}</div>
          <div style={{ maxWidth: 400, margin: '0 auto', fontSize: isMobile ? 13 : 14, color: '#E5F0FE', marginBottom: 24 }}>{t.userSentDetail}</div>
        </div>
        <div style={{ marginTop: isMobile ? 24 : 48, padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 25, width: '100%' }}>
          <span style={{ fontSize: 11, color: '#8f8f8f', letterSpacing: 1.5, textTransform: 'uppercase' }}>Built on</span>
          <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" style={{ height: 28, opacity: 0.85 }} />
        </div>
      </div>
    );
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

        <div style={{ marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ fontSize: 12, color: '#999999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t.userStep1}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => handleCatSelect(cat)} style={{
                background: selectedCat === cat ? '#926a4510' : '#111111',
                border: `2px solid ${selectedCat === cat ? '#926A45' : '#222222'}`,
                borderRadius: 10, padding: isMobile ? '10px 6px' : '12px 8px',
                color: selectedCat === cat ? '#FFFFFF' : '#888888',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                fontSize: isMobile ? 13 : 12, fontWeight: selectedCat === cat ? 600 : 400, cursor: 'pointer',
              }}>
                {catLabel[cat]}
              </button>
            ))}
          </div>
        </div>

        {selectedCat && (
          <div style={{ marginBottom: isMobile ? 16 : 24 }}>
            <div style={{ fontSize: 12, color: '#999999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.userStep2}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
              {SUBCATEGORIES[selectedCat].map((sub: string) => (
                <button key={sub} onClick={() => setSelectedSubcat(sub)} style={{
                  background: selectedSubcat === sub ? '#926a4510' : '#111111',
                  border: `2px solid ${selectedSubcat === sub ? '#926A45' : '#1A1A1A'}`,
                  borderRadius: 10, padding: isMobile ? '10px 6px' : '12px 8px',
                  color: selectedSubcat === sub ? '#ffffff' : '#555555',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  fontSize: isMobile ? 13 : 12, fontWeight: selectedSubcat === sub ? 600 : 400, cursor: 'pointer',
                }}>
                  {subLabel[sub]}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: '#111111', border: '1px solid #7f1d1d', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: isMobile ? 12 : 13, color: '#f87171' }}>
            {error}
          </div>
        )}

        <button onClick={handleContribute} disabled={!canSubmit} style={{
          width: '100%', background: '#926A45', color: '#FFFFFF',
          padding: isMobile ? '13px' : '14px', fontSize: isMobile ? 15 : 16, borderRadius: 10,
          opacity: !canSubmit ? 0.3 : 1,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}>
          {loading ? t.userSubmitting : t.userSubmit}
        </button>

        <div style={{ marginTop: 14, marginBottom: 16, background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, padding: isMobile ? 12 : 16 }}>
          <div style={{ fontSize: isMobile ? 12 : 12, color: '#BBBBBB', lineHeight: 1.7 }}>
            <strong style={{ color: '#DDDDDD' }}>{t.userPrivacy}</strong> {t.userPrivacyDetail}
          </div>
        </div>
      </div>}

      </div>{/* end profile-section tour frame */}

      {/* Midnight branding */}
      <div style={{ textAlign: 'center', marginTop: isMobile ? 40 : 80, padding: '24px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 25 }}>
        <span style={{ fontSize: 11, color: '#8f8f8f', letterSpacing: 1.5, textTransform: 'uppercase' }}>Built on</span>
        <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" style={{ height: 28, opacity: 0.85 }} />
      </div>
    </div>
  );
}
