import { CATEGORIES, CATEGORY_LABELS, CATEGORY_STATE_KEY, type AegisState, type Lang } from '../api.ts';
import { T } from '../i18n.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';
import { useCountBumps } from '../hooks/useCountBumps.ts';

const BUMP_MS = 2600;

/** "+N" flotante sobre un número de la cinta (animación aegis-bump-float en index.css). */
function BumpBadge({ delta }: { delta: number }) {
  return (
    <span aria-hidden="true" style={{
      position: 'absolute', top: -11, right: 6,
      fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, lineHeight: 1,
      color: 'var(--bronze)', pointerEvents: 'none',
      animation: `aegis-bump-float ${BUMP_MS}ms ease-out forwards`,
    }}>
      +{delta}
    </span>
  );
}

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
  // Cuando entran señales nuevas, un "+N" sobre cada categoría que sube y
  // junto al total. Se mantiene montado lo mismo que dura su animación
  // (BUMP_MS), para que se desvanezca entero en vez de desaparecer de golpe.
  const bumped = useCountBumps(counts, BUMP_MS);
  const totalBump = Object.values(bumped).reduce((sum, d) => sum + d, 0);

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
        <span style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: isMobile ? 20 : 24, fontWeight: 500, color: 'var(--ink-bright)', lineHeight: 1 }}>
          {fmt(total)}
          {/* La clave cambia con cada total nuevo: así la animación vuelve a
              empezar si entra otra compra mientras aún se ve la anterior. */}
          {totalBump > 0 && <BumpBadge key={`total-${total}`} delta={totalBump} />}
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
              position: 'relative',
              fontFamily: 'var(--font-mono)', fontSize: 11.5, whiteSpace: 'nowrap',
              border: `1px solid ${isBump ? 'var(--bronze)' : 'var(--line)'}`,
              background: isBump ? 'var(--bronze-wash)' : 'transparent',
              borderRadius: 999, padding: '4px 11px', color: 'var(--ink-soft)',
              // Se enciende rápido y se apaga despacio.
              transition: isBump ? 'border-color 0.3s ease, background 0.3s ease' : 'border-color 1s ease, background 1s ease',
            }}>
              {catLabel[cat]}<b style={{ color: isBump ? '#C79A5E' : 'var(--price)', marginLeft: 6, transition: 'color 1s ease' }}>{fmt(state?.[CATEGORY_STATE_KEY[cat]])}</b>
              {isBump && <BumpBadge key={`${cat}-${total}`} delta={bumped[cat]} />}
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
    </div>
  );
}
