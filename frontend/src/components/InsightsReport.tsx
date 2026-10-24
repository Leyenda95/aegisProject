import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getInsights, CATEGORY_LABELS, type Insights, type Lang, type TimeRange } from '../api.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import { useHistory } from '../hooks/useHistory.ts';
import { periodFigures } from '../periodFigures.ts';
import Delta from './Delta.tsx';
import styles from './InsightsReport.module.css';

const TIME_RANGES: TimeRange[] = ['7d', '30d', '90d', '365d'];
// El perfil de la tienda se recuerda en el navegador para el próximo informe.
const PROFILE_KEY = 'aegis-store-profile';

function readProfile(): string {
  try {
    return localStorage.getItem(PROFILE_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveProfile(value: string): void {
  try {
    localStorage.setItem(PROFILE_KEY, value);
  } catch {
    // Sin localStorage: solo se pierde recordarlo.
  }
}

/**
 * Informe de mercado para la tienda: el agente de IA lee el agregado del
 * periodo y propone recomendaciones para su perfil. Encima, las cifras del
 * mismo periodo frente al anterior, las mismas que enseña el mercado.
 */
export default function InsightsReport({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [profile, setProfile] = useState(readProfile);
  // Periodo que analizará el próximo informe. Cambiarlo no genera nada por
  // sí solo: hay que pulsar el botón.
  const [range, setRange] = useState<TimeRange>('7d');
  // El informe que se enseña, que puede ser de otro periodo mientras se genera el nuevo.
  const [report, setReport] = useState<{ insights: Insights; range: TimeRange } | null>(null);
  const [copied, setCopied] = useState(false);
  const request = useMutation({
    mutationFn: (r: TimeRange) => getInsights(profile.trim() || undefined, lang, r),
    onSuccess: (insights, r) => setReport({ insights, range: r }),
  });
  const pending = request.isPending;
  const history = useHistory(report?.range ?? range);
  const figures = history.data && report && history.data.range === report.range ? periodFigures(history.data) : null;
  const number = new Intl.NumberFormat(t.locale);

  function chooseProfile(value: string) {
    setProfile(value);
    saveProfile(value);
  }

  async function copyReport() {
    if (!report) return;
    const { insights } = report;
    const lines = [
      `${t.insightsTitle} · ${t.insightsRangeNames[report.range]}`,
      '',
      insights.summary,
      '',
      `${t.insightsTrending}: ${(insights.trending ?? []).join(', ')}`,
      '',
      `${t.insightsRecommendations}:`,
      ...(insights.recommendations ?? []).map((r, i) => `${i + 1}. ${typeof r === 'string' ? r : `${r.title}. ${r.detail}`}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Sin permiso de portapapeles: el informe sigue a la vista para copiarlo a mano.
    }
  }

  return (
    <div className={styles.tool}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t.insightsTitle}</h3>
        <div className={styles.ranges} role="group" aria-label={t.marketPeriod}>
          {TIME_RANGES.map(r => (
            <button key={r} className={styles.range} disabled={pending} onClick={() => setRange(r)} aria-pressed={range === r}>
              {t.insightsRanges[r]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.form}>
        <input
          id="store-profile"
          className={styles.input}
          type="text"
          placeholder={t.insightsPlaceholder}
          aria-label={t.insightsPlaceholder}
          value={profile}
          onChange={e => chooseProfile(e.target.value)}
        />
        <button className={styles.generate} onClick={() => request.mutate(range)} disabled={pending}>
          {pending ? t.insightsGenerating : t.insightsGenerate}
        </button>
      </div>
      <div className={styles.suggestions}>
        {t.insightsSuggestions.map(s => (
          <button key={s} type="button" className={styles.suggestion} onClick={() => chooseProfile(s)} aria-pressed={profile === s}>
            {s}
          </button>
        ))}
      </div>

      {request.error ? (
        <p className={styles.error}>Error: {request.error.message || t.errorUnknown}</p>
      ) : pending && !report ? (
        // Mientras se genera el primero, su forma; los siguientes dejan el anterior atenuado.
        <div className={styles.skeleton} role="status" aria-label={t.insightsGenerating}>
          <span className={styles.bone} style={{ width: '36%' }} />
          <span className={styles.bone} style={{ width: '94%' }} />
          <span className={styles.bone} style={{ width: '82%' }} />
          <div className={styles.boneCards}>
            <span className={styles.bone} />
            <span className={styles.bone} />
            <span className={styles.bone} />
          </div>
        </div>
      ) : report ? (
        <div className={cx(styles.report, pending && styles.stale)}>
          {figures && (
            <div className={styles.figures}>
              <p className={styles.figureMain}>
                <b>{number.format(figures.total)}</b> {t.marketPeriodLabel[report.range]}
                {figures.change !== null && <> · <Delta change={figures.change} locale={t.locale} /> {t.marketVsPrevious[report.range]}</>}
              </p>
              <ul className={styles.categoryFigures}>
                {figures.categories.map(c => (
                  <li key={c.category} className={styles.categoryFigure}>
                    {CATEGORY_LABELS[lang][c.category]}
                    <b>{number.format(c.count)}</b>
                    {c.change !== null && <Delta change={c.change} locale={t.locale} />}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(report.insights.trending ?? []).length > 0 && (
            <div className={styles.trending}>
              <div className={styles.sectionLabel}>{t.insightsTrending} · {t.insightsRangeNames[report.range].toUpperCase()}</div>
              <div className={styles.trendChips}>
                {report.insights.trending.map((item, i) => <span key={i} className={styles.trendChip}>{item}</span>)}
              </div>
            </div>
          )}
          <p className={styles.summary}>{report.insights.summary}</p>

          <div className={styles.sectionLabel}>{t.insightsRecommendations}</div>
          <ol className={styles.recs}>
            {(report.insights.recommendations ?? []).map((r, i) => {
              const title = typeof r === 'string' ? null : r.title;
              const detail = typeof r === 'string' ? r : r.detail;
              return (
                <li key={i} className={styles.rec}>
                  <span className={styles.recNumber}>{i + 1}</span>
                  {title && <div className={styles.recTitle}>{title}</div>}
                  <p className={styles.recDetail}>{detail}</p>
                </li>
              );
            })}
          </ol>

          <div className={styles.copyRow}>
            <button type="button" className={styles.copy} onClick={() => void copyReport()}>
              {copied ? `${t.insightsCopied} ✓` : t.insightsCopy}
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.empty}>{t.insightsEmpty}</p>
      )}
    </div>
  );
}
