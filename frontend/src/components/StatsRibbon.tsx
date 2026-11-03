import { CATEGORIES, CATEGORY_LABELS, CATEGORY_STATE_KEY, type AegisState, type Lang } from '../api.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import { useChain } from '../app/ChainProvider.tsx';
import { useCountBumps } from '../hooks/useCountBumps.ts';
import { useHistory } from '../hooks/useHistory.ts';
import Sparkline from './Sparkline.tsx';
import { useTourFocus } from '../story/tourFocus.ts';
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
  const { live } = useChain();
  const week = useHistory('7d');
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
  const tourFocus = useTourFocus('ribbon');

  return (
    <div className={styles.root} data-tour={tourFocus} data-ribbon>
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

      <Sparkline className={styles.sparkline} points={week.data?.current} />

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
        {live ? (
          <span className={cx(styles.refresh, styles.live)}>{t.signalsLive}</span>
        ) : (
          <span className={styles.refresh}>{t.signalsRefresh}</span>
        )}
      </div>
    </div>

    <div className={styles.scrollHint}>
      <div className={styles.chevrons}>
        {[0, 1].map(i => (
          <svg key={i} width="9" height="16" viewBox="0 0 12 24" fill="none" stroke="var(--accent-strong)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 5 L9 12 L3 19" />
          </svg>
        ))}
      </div>
    </div>
    </div>
  );
}
