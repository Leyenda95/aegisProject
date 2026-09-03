import { useState } from 'react';
import {
  CATEGORIES, CATEGORY_LABELS, CATEGORY_STATE_KEY,
  SUBCATEGORIES, SUBCATEGORY_LABELS,
  type AegisState, type Category, type Lang,
} from '../api.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';

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
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const [expandedCat, setExpandedCat] = useState<Category | null>(null);
  const total = Number(state?.totalSignals ?? 0);

  return (
    <div data-tour="categories-grid" style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : bp === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
      gap: 10,
    }}>
      {CATEGORIES.map(cat => {
        const catVal = Number(state?.[CATEGORY_STATE_KEY[cat]] ?? 0);
        const catPct = total > 0 ? (catVal / total) * 100 : 0;
        const isOpen = expandedCat === cat;
        const subs = SUBCATEGORIES[cat] as readonly string[];
        return (
          <div key={cat} style={{ gridColumn: isOpen ? '1 / -1' : undefined }}>
            <button
              onClick={() => setExpandedCat(isOpen ? null : cat)}
              style={{
                width: '100%', background: isOpen ? '#926a4513' : 'var(--surface-2)',
                border: `1px solid ${isOpen ? '#926A45' : 'var(--line)'}`,
                borderRadius: isOpen ? '10px 10px 0 0' : 10,
                padding: isMobile ? '10px 12px' : '14px 16px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: isOpen ? '#FFFFFF' : '#DDDDDD', flex: 1, textAlign: 'left' }}>
                  {catLabel[cat]}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 15 : 18, fontWeight: 500, color: '#c0956de5' }}>{catVal}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#CCCCCC', width: 34, textAlign: 'right' }}>{catPct.toFixed(0)}%</span>
                <span style={{ fontSize: 12, color: '#456D92', marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</span>
              </div>
              <div style={{ background: 'var(--line)', height: 3, borderRadius: isOpen ? 0 : '0 0 4px 4px' }}>
                <div style={{ width: `${catPct}%`, height: '100%', background: '#926A45', borderRadius: 3, transition: 'width 0.4s' }} />
              </div>
            </button>
            {isOpen && (
              <div style={{
                background: 'var(--ground)', border: '1px solid #926A45', borderTop: 'none',
                borderRadius: '0 0 10px 10px', padding: isMobile ? 10 : 16,
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : `repeat(${Math.min(subs.length, 6)}, 1fr)`,
                gap: isMobile ? 6 : 8,
              }}>
                {subs.map(sub => {
                  const subVal = Number(state?.[subcatKey(sub)] ?? 0);
                  const subPct = catVal > 0 ? (subVal / catVal) * 100 : 0;
                  return (
                    <div key={sub} style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: isMobile ? '8px 4px' : '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 15 : 18, fontWeight: 500, color: '#FFFFFF' }}>{subVal}</div>
                      <div style={{ fontSize: isMobile ? 10 : 11, color: '#AAAAAA', marginTop: 2 }}>{subLabel[sub]}</div>
                      <div style={{ marginTop: 4, background: 'var(--line)', borderRadius: 3, height: 3 }}>
                        <div style={{ width: `${subPct}%`, height: '100%', background: '#926A45', borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: 10, color: '#AAAAAA', marginTop: 2 }}>{subPct.toFixed(0)}%</div>
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
