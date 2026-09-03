import { useEffect, useState } from 'react';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_STATE_KEY, type AegisState, type Category, type Lang } from '../api.ts';
import { T } from '../i18n.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';
import { useCountBumps } from '../hooks/useCountBumps.ts';

type Props = {
  state: AegisState | null;
  lang: Lang;
  breakdownOpen: boolean;
  onToggleBreakdown: () => void;
};

/**
 * Cinta fija bajo la cabecera: el agregado on-chain de un vistazo, presente
 * en las dos vistas. El desglose por subcategoría vive en StoreView.
 */
export default function StatsRibbon({ state, lang, breakdownOpen, onToggleBreakdown }: Props) {
  const t = T[lang];
  const catLabel = CATEGORY_LABELS[lang];
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const loc = lang === 'es' ? 'es-ES' : 'en-US';
  const fmt = (v: unknown) => Number(v ?? 0).toLocaleString(loc);
  const total = Number(state?.totalSignals ?? 0);

  const counts: Record<string, number> | null = state
    ? Object.fromEntries(CATEGORIES.map(c => [c, Number(state[CATEGORY_STATE_KEY[c]] ?? 0)]))
    : null;
  const bumped = useCountBumps(counts);

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    const ups = Object.entries(bumped);
    if (ups.length === 0) return;
    setToast(ups.map(([c, d]) => `${catLabel[c as Category]} +${d}`).join(' · '));
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [bumped, catLabel]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 24,
      padding: isMobile ? '10px 14px' : '12px 24px',
      borderBottom: '1px solid var(--line)',
      background: 'linear-gradient(180deg, #151412, #111)',
      overflowX: 'auto',
      opacity: state ? 1 : 0.55,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: isMobile ? 20 : 24, fontWeight: 500, color: '#FFFFFF', lineHeight: 1 }}>
          {fmt(total)}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-faint)', lineHeight: 1 }}>
          {t.signalsUnit}
        </span>
      </div>

      {!isMobile && (
        <svg width="96" height="26" viewBox="0 0 96 26" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path d="M0 20 L12 18 L24 19 L36 14 L48 15 L60 9 L72 11 L84 6 L96 7" fill="none" stroke="var(--bronze-deep)" strokeWidth="1.5" />
          <circle cx="96" cy="7" r="2" fill="var(--bronze)" />
        </svg>
      )}

      <div style={{ display: 'flex', gap: 7, flexWrap: isMobile ? 'nowrap' : 'wrap', flexShrink: 0 }}>
        {CATEGORIES.map(cat => {
          const isBump = Boolean(bumped[cat]);
          return (
            <span key={cat} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11.5, whiteSpace: 'nowrap',
              border: `1px solid ${isBump ? 'var(--bronze)' : 'var(--line)'}`,
              background: isBump ? 'var(--bronze-wash)' : 'transparent',
              borderRadius: 999, padding: '4px 11px', color: 'var(--ink-dim)',
              transition: 'border-color 0.3s ease, background 0.3s ease',
            }}>
              {catLabel[cat]}<b style={{ color: isBump ? '#C79A5E' : '#c0956de5', marginLeft: 6 }}>{fmt(state?.[CATEGORY_STATE_KEY[cat]])}</b>
            </span>
          );
        })}
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <button
          onClick={onToggleBreakdown}
          aria-expanded={breakdownOpen}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: breakdownOpen ? 'var(--bronze-wash)' : 'transparent',
            border: `1px solid ${breakdownOpen ? 'var(--bronze-deep)' : 'var(--line)'}`,
            borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
            textTransform: 'uppercase', color: 'var(--ink-dim)',
          }}
        >
          {t.signalsBreakdown}
          <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: breakdownOpen ? 'rotate(180deg)' : 'none', color: '#456D92' }}>▼</span>
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', opacity: 0.75, whiteSpace: 'nowrap' }}>
          {t.signalsRefresh}
        </span>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 60,
          background: 'var(--surface-2)', border: '1px solid var(--bronze-deep)', borderRadius: 10,
          padding: '10px 18px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
