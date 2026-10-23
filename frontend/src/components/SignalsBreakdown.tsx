import { useState, type CSSProperties } from 'react';
import {
  CATEGORIES, CATEGORY_LABELS, CATEGORY_STATE_KEY,
  SUBCATEGORIES, SUBCATEGORY_LABELS,
  type AegisState, type Category, type Lang,
} from '../api.ts';
import styles from './SignalsBreakdown.module.css';

function subcatKey(sub: string): keyof AegisState {
  return ('signals' + sub[0].toUpperCase() + sub.slice(1)) as keyof AegisState;
}

type Props = { state: AegisState | null; lang: Lang };

/**
 * Desglose por categoría y subcategoría. Cada categoría se despliega para ver
 * sus subcategorías. Vive en un plegable bajo la cinta (ver App).
 */
export default function SignalsBreakdown({ state, lang }: Props) {
  const catLabel = CATEGORY_LABELS[lang];
  const subLabel = SUBCATEGORY_LABELS[lang];
  const [expandedCat, setExpandedCat] = useState<Category | null>(null);
  const total = Number(state?.totalSignals ?? 0);

  return (
    <div className={styles.grid}>
      {CATEGORIES.map(cat => {
        const catVal = Number(state?.[CATEGORY_STATE_KEY[cat]] ?? 0);
        const catPct = total > 0 ? (catVal / total) * 100 : 0;
        const isOpen = expandedCat === cat;
        const subs = SUBCATEGORIES[cat] as readonly string[];
        return (
          <div key={cat} className={isOpen ? styles.open : undefined}>
            <button className={styles.catBtn} onClick={() => setExpandedCat(isOpen ? null : cat)} aria-expanded={isOpen}>
              <div className={styles.catRow}>
                <span className={styles.catName}>{catLabel[cat]}</span>
                <span className={styles.catValue}>{catVal}</span>
                <span className={styles.catPct}>{catPct.toFixed(0)}%</span>
                <span aria-hidden="true" className={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${catPct}%` }} />
              </div>
            </button>
            {isOpen && (
              <div className={styles.subs} style={{ '--cols': Math.min(subs.length, 6) } as CSSProperties}>
                {subs.map(sub => {
                  const subVal = Number(state?.[subcatKey(sub)] ?? 0);
                  const subPct = catVal > 0 ? (subVal / catVal) * 100 : 0;
                  return (
                    <div key={sub} className={styles.sub}>
                      <div className={styles.subValue}>{subVal}</div>
                      <div className={styles.subName}>{subLabel[sub]}</div>
                      <div className={styles.subTrack}>
                        <div className={styles.fill} style={{ width: `${subPct}%` }} />
                      </div>
                      <div className={styles.subPct}>{subPct.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
