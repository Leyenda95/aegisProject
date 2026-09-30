import { useEffect, useRef, useState } from 'react';
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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const ups = Object.entries(bumped);
    if (ups.length === 0) return; // `bumped` se limpia solo a los 1500ms (ver useCountBumps);
    // eso también dispara este efecto, así que NO hay que tocar el temporizador aquí,
    // o cancelaríamos el que ya está en marcha para ocultar el toast.
    setToast(ups.map(([c, d]) => `${catLabel[c as Category]} +${d}`).join(' · '));
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, [bumped, catLabel]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  return (
    <div style={{ position: 'relative' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 24,
      padding: isMobile ? '10px 14px' : '12px 24px',
      borderBottom: '1px solid var(--line)',
      background: 'var(--surface)',
      overflowX: 'auto',
      opacity: state ? 1 : 0.55,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: isMobile ? 20 : 24, fontWeight: 500, color: 'var(--ink-bright)', lineHeight: 1 }}>
          {fmt(total)}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-dim)', lineHeight: 1 }}>
          {isMobile ? t.signalsUnitShort : t.signalsUnit}
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
              borderRadius: 999, padding: '4px 11px', color: 'var(--ink-soft)',
              transition: 'border-color 0.3s ease, background 0.3s ease',
            }}>
              {catLabel[cat]}<b style={{ color: isBump ? '#C79A5E' : 'var(--price)', marginLeft: 6 }}>{fmt(state?.[CATEGORY_STATE_KEY[cat]])}</b>
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
            background: 'var(--bronze-wash)',
            border: `1px solid ${breakdownOpen ? 'var(--bronze-deep)' : 'var(--line)'}`,
            borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500, color: 'var(--ink-soft)',
          }}
        >
          {t.signalsBreakdown}
          <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: breakdownOpen ? 'rotate(180deg)' : 'none', color: 'var(--accent-blue)' }}>▼</span>
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-dim)', whiteSpace: 'nowrap' }}>
          {t.signalsRefresh}
        </span>
      </div>
    </div>

    {/* Indica que la cinta se puede desplazar en horizontal: fuera del div
        con overflowX, para que se quede fija en el borde en vez de
        desplazarse con el resto del contenido. */}
    {isMobile && (
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 34,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
        background: 'linear-gradient(to right, transparent, var(--surface) 65%)',
        pointerEvents: 'none',
      }}>
        {/* Dos chevrones que se mueven a la vez, en sincronía. */}
        <div style={{ display: 'flex', gap: 1 }}>
          {[0, 1].map(i => (
            <svg key={i} width="9" height="16" viewBox="0 0 12 24" fill="none" stroke="var(--bronze-deep)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              style={{ animation: 'aegis-chevron-flow 1.8s ease-in-out infinite' }}>
              <path d="M3 5 L9 12 L3 19" />
            </svg>
          ))}
        </div>
      </div>
    )}

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
