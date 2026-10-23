import { useState } from 'react';
import { Link } from 'react-router';
import NumberFlow from '@number-flow/react';
import {
  CATEGORIES, CATEGORY_LABELS, CATEGORY_STATE_KEY, SUBCATEGORIES, SUBCATEGORY_LABELS,
  type AegisState, type Category, type Change, type Lang, type TimeRange,
} from '../api.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import { useChain } from '../app/ChainProvider.tsx';
import { useHistory } from '../hooks/useHistory.ts';
import { useNow } from '../hooks/useNow.ts';
import TrendChart from './TrendChart.tsx';
import styles from './MarketView.module.css';

const TIME_RANGES: TimeRange[] = ['7d', '30d', '90d', '365d'];
// Las que caben junto a la gráfica y las categorías sin alargar la página.
const FEED_LIMIT = 10;

function subcategoryKey(sub: string): keyof AegisState {
  return ('signals' + sub[0].toUpperCase() + sub.slice(1)) as keyof AegisState;
}

type FeedLine = { category: Category; subcategory: string; qty: number };

/** Qué subcategorías y cuántas unidades trae una transacción (lo único que revela una señal). */
function feedLines(change: Change): FeedLine[] {
  const lines: FeedLine[] = [];
  for (const category of CATEGORIES) {
    for (const subcategory of SUBCATEGORIES[category]) {
      const qty = Number(change.delta[subcategoryKey(subcategory)] ?? 0);
      if (qty > 0) lines.push({ category, subcategory, qty });
    }
  }
  return lines;
}

function timeAgo(timestamp: number, now: number, format: Intl.RelativeTimeFormat): string {
  const seconds = Math.min(0, Math.round((timestamp - now) / 1000));
  if (seconds > -60) return format.format(seconds, 'second');
  if (seconds > -3600) return format.format(Math.round(seconds / 60), 'minute');
  if (seconds > -86400) return format.format(Math.round(seconds / 3600), 'hour');
  return format.format(Math.round(seconds / 86400), 'day');
}

/** Variación frente al periodo anterior: ▲ 8 %, ▼ 3 %. */
function Delta({ change, locale }: { change: number; locale: string }) {
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(Math.abs(change));
  const up = change >= 0.005;
  const down = change <= -0.005;
  return (
    <span className={styles.delta}>
      <span aria-hidden="true" className={cx(styles.deltaGlyph, up && styles.up, down && styles.down)}>
        {up ? '▲' : down ? '▼' : '='}
      </span>
      <span className={styles.srOnly}>{up ? '+' : down ? '−' : ''}</span>
      {percent}
    </span>
  );
}

/** Últimas señales que han entrado, en directo, con lo único que se sabe de ellas. */
function LiveFeed({ lang }: { lang: Lang }) {
  const t = T[lang];
  const { live, recent } = useChain();
  const now = useNow(1000);
  // Las que ya estaban al abrir la vista no se animan; las que llegan después, sí.
  const [initial] = useState(() => new Set(recent.map(change => change.height)));
  const relative = new Intl.RelativeTimeFormat(t.locale, { numeric: 'auto', style: 'short' });
  const number = new Intl.NumberFormat(t.locale);
  const items = recent
    .map(change => ({ change, lines: feedLines(change), seed: Number(change.delta.isSeeded ?? 0) > 0 }))
    .filter(item => item.seed || item.lines.length > 0)
    .slice(0, FEED_LIMIT);

  return (
    <section className={cx(styles.card, styles.feed)}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{t.marketRecent}</h3>
        {live && <span className={styles.live}>{t.signalsLive}</span>}
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>{live ? t.marketRecentEmpty : t.marketRecentOffline}</p>
      ) : (
        <ol className={styles.feedList}>
          {items.map(({ change, lines, seed }) => (
            <li key={change.height} className={cx(styles.feedItem, !initial.has(change.height) && styles.feedItemNew)}>
              <div className={styles.feedLines}>
                {seed ? (
                  <span className={styles.feedLine}>
                    {t.marketDemoData}{' '}
                    <span className={styles.qty}>×{number.format(Number(change.delta.totalSignals ?? 0))}</span>
                  </span>
                ) : lines.map(line => (
                  <span key={line.subcategory} className={styles.feedLine}>
                    <span className={styles.feedCategory}>{CATEGORY_LABELS[lang][line.category]}</span>
                    {line.subcategory !== 'other' && (
                      <>
                        {' '}<span aria-hidden="true" className={styles.feedChevron}>›</span>{' '}
                        {SUBCATEGORY_LABELS[lang][line.subcategory]}
                      </>
                    )}
                    {' '}<span className={styles.qty}>×{line.qty}</span>
                  </span>
                ))}
              </div>
              <time className={styles.feedTime} dateTime={new Date(change.timestamp).toISOString()}>
                {timeAgo(change.timestamp, now, relative)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/**
 * Mercado: lo que cualquiera puede ver del agregado en la cadena. Actividad
 * por periodo (cifra, gráfica frente al periodo anterior y categorías) y, al
 * lado, las últimas señales en directo.
 */
export default function MarketView({ lang }: { lang: Lang }) {
  const t = T[lang];
  const { contractAddress } = useChain();
  const [range, setRange] = useState<TimeRange>('7d');
  const history = useHistory(range);
  const data = history.data;
  const number = new Intl.NumberFormat(t.locale);

  if (!contractAddress) {
    return (
      <div className={styles.card}>
        <p className={styles.notice}>
          {t.posDeployFirst} <Link to="/setup" className={styles.noticeLink}>{t.setupLink}</Link>
        </p>
      </div>
    );
  }

  const total = data ? Number(data.totals.current.totalSignals ?? 0) : 0;
  const previousTotal = data?.totals.previous ? Number(data.totals.previous.totalSignals ?? 0) : 0;
  const change = previousTotal > 0 ? (total - previousTotal) / previousTotal : null;
  // El contrato es más nuevo que el periodo: la serie empieza en su despliegue.
  const sinceDeploy = data && data.since !== null && data.since > data.to - data.span ? data.since : null;
  const seeded = data ? Number(data.seeded) : 0;

  const categories = CATEGORIES.map(category => {
    const key = CATEGORY_STATE_KEY[category];
    const count = Number(data?.totals.current[key] ?? 0);
    const before = data?.totals.previous ? Number(data.totals.previous[key] ?? 0) : 0;
    return { category, count, change: before > 0 ? (count - before) / before : null };
  }).sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...categories.map(c => c.count));

  return (
    <div className={styles.market}>
      <p className={styles.intro}>{t.marketIntro}</p>

      <div className={styles.grid}>
        <div className={styles.filters}>
          <h2 className={styles.heading}>{t.marketActivity}</h2>
          <div className={styles.ranges} role="group" aria-label={t.marketPeriod}>
            {TIME_RANGES.map(r => (
              <button key={r} className={styles.range} onClick={() => setRange(r)} aria-pressed={range === r}>
                {t.insightsRanges[r]}
              </button>
            ))}
          </div>
        </div>

        <section className={cx(styles.card, styles.activity)}>
          {data && data.current.length > 0 ? (
            <>
              <div className={styles.headline}>
                <NumberFlow className={styles.figure} value={total} locales={t.locale} />
                <div className={styles.figureLabel}>{t.marketPeriodLabel[range]}</div>
                {change !== null ? (
                  <div className={styles.comparison}>
                    <Delta change={change} locale={t.locale} /> {t.marketVsPrevious[range]}
                  </div>
                ) : sinceDeploy !== null && (
                  <div className={styles.comparison}>
                    {t.marketSince(new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'long' }).format(sinceDeploy))}
                  </div>
                )}
              </div>
              <TrendChart current={data.current} previous={data.previous} range={data.range} lang={lang} stale={history.isPlaceholderData} />
            </>
          ) : (
            <div className={styles.placeholder}>
              <p>{history.isError ? t.marketUnavailable : t.marketLoading}</p>
              {!history.isError && <p className={styles.placeholderHint}>{t.marketLoadingHint}</p>}
            </div>
          )}
        </section>

        {data && <section className={cx(styles.card, styles.categories)}>
          <h3 className={styles.cardTitle}>{t.marketByCategory}</h3>
          <ul className={cx(styles.categoryList, history.isPlaceholderData && styles.stale)}>
            {categories.map(({ category, count, change: categoryChange }) => (
              <li key={category} className={styles.category}>
                <span className={styles.categoryName}>{CATEGORY_LABELS[lang][category]}</span>
                <span className={styles.barTrack}>
                  <span className={styles.bar} style={{ width: `${(count / maxCount) * 100}%` }} />
                </span>
                <span className={styles.categoryValue}>{number.format(count)}</span>
                <span className={styles.categoryChange}>
                  {categoryChange !== null && <Delta change={categoryChange} locale={t.locale} />}
                </span>
              </li>
            ))}
          </ul>
          {seeded > 0 && <p className={styles.note}>{t.marketDemoNote(number.format(seeded))}</p>}
        </section>}

        <LiveFeed lang={lang} />
      </div>
    </div>
  );
}
