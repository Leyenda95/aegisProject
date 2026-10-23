import { CATEGORIES, CATEGORY_LABELS, CATEGORY_STATE_KEY, type AegisState, type Lang } from '../api.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import { useCountBumps } from '../hooks/useCountBumps.ts';
import styles from './StatsRibbon.module.css';

const BUMP_MS = 2600;

/** "+N" flotante sobre un número de la cinta (ver .bump en StatsRibbon.module.css). */
function BumpBadge({ delta }: { delta: number }) {
  return (
    <span aria-hidden="true" className={styles.bump} style={{ animationDuration: `${BUMP_MS}ms` }}>
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
    <div className={styles.root}>
    <div className={cx(styles.ribbon, !state && styles.loading)}>
      <div className={styles.totalGroup}>
        <span className={styles.total}>
          {fmt(total)}
          {/* La clave cambia con cada total nuevo: así la animación vuelve a
              empezar si entra otra compra mientras aún se ve la anterior. */}
          {totalBump > 0 && <BumpBadge key={`total-${total}`} delta={totalBump} />}
        </span>
        <span className={cx(styles.unit, styles.unitLong)}>{t.signalsUnit}</span>
        <span className={cx(styles.unit, styles.unitShort)}>{t.signalsUnitShort}</span>
      </div>

      <svg className={styles.sparkline} width="96" height="26" viewBox="0 0 96 26" aria-hidden="true">
        <path d="M0 20 L12 18 L24 19 L36 14 L48 15 L60 9 L72 11 L84 6 L96 7" fill="none" stroke="var(--bronze-deep)" strokeWidth="1.5" />
        <circle cx="96" cy="7" r="2" fill="var(--bronze)" />
      </svg>

      <div className={styles.chips}>
        {CATEGORIES.map(cat => {
          const isBump = Boolean(bumped[cat]);
          return (
            <span key={cat} className={cx(styles.chip, isBump && styles.chipBump)}>
              {catLabel[cat]}<b className={styles.chipValue}>{fmt(state?.[CATEGORY_STATE_KEY[cat]])}</b>
              {isBump && <BumpBadge key={`${cat}-${total}`} delta={bumped[cat]} />}
            </span>
          );
        })}
      </div>

      <div className={styles.side}>
        <button className={styles.breakdownBtn} onClick={onToggleBreakdown} aria-expanded={breakdownOpen}>
          {t.signalsBreakdown}
          <span aria-hidden="true" className={styles.breakdownChevron}>▼</span>
        </button>
        <span className={styles.refresh}>{t.signalsRefresh}</span>
      </div>
    </div>

    <div className={styles.scrollHint}>
      <div className={styles.chevrons}>
        {[0, 1].map(i => (
          <svg key={i} width="9" height="16" viewBox="0 0 12 24" fill="none" stroke="var(--bronze-deep)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 5 L9 12 L3 19" />
          </svg>
        ))}
      </div>
    </div>
    </div>
  );
}
