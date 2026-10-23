import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Lang, TimeRange } from '../api.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import styles from './TrendChart.module.css';

type Point = [number, number];

type Props = {
  /** Señales acumuladas desde el principio del periodo, como [instante, señales]. */
  current: Point[];
  /** Lo mismo en el periodo anterior, en los mismos instantes; null si no hay con qué comparar. */
  previous: Point[] | null;
  range: TimeRange;
  lang: Lang;
  /** Son los datos de otro periodo mientras llegan los del elegido: se pintan atenuados. */
  stale?: boolean;
};

const HEIGHT = 200;
const HEIGHT_NARROW = 170;
// A la derecha, las cifras del eje vertical; abajo, las fechas.
const MARGIN = { top: 12, right: 44, bottom: 28, left: 0 };
const DAY_MS = 86_400_000;
// Ancho mínimo por etiqueta de fecha.
const TICK_SPACE = 72;

/**
 * Eje vertical redondo: de 0 a un máximo con entre tres y cinco tramos de
 * 1, 2, 2,5 o 5 por una potencia de 10 (0, 100, 200...), el que más se ajuste.
 * Siempre en enteros: son señales.
 */
function niceScale(max: number): { max: number; ticks: number[] } {
  if (max <= 0) return { max: 1, ticks: [0] };
  let best = { top: Math.max(1, Math.ceil(max)), step: 1 };
  if (max > 5) {
    best = { top: Infinity, step: 1 };
    for (let k = Math.floor(Math.log10(max / 5)); k <= Math.ceil(Math.log10(max)); k++) {
      for (const nice of [1, 2, 2.5, 5]) {
        const step = nice * 10 ** k;
        if (step < 1 || !Number.isInteger(step)) continue;
        const top = Math.ceil(max / step) * step;
        const count = top / step;
        if (count >= 3 && count <= 5 && (top < best.top || (top === best.top && step > best.step))) best = { top, step };
      }
    }
    if (best.top === Infinity) best = { top: Math.ceil(max), step: Math.ceil(max) };
  }
  const ticks: number[] = [];
  for (let v = 0; v <= best.top; v += best.step) ticks.push(v);
  return { max: best.top, ticks };
}

/** Medianoches (hora local) dentro del periodo, espaciadas para que quepan sus etiquetas. */
function dayTicks(t0: number, t1: number, maxTicks: number): number[] {
  const days: number[] = [];
  const day = new Date(t0);
  day.setHours(24, 0, 0, 0);
  for (; day.getTime() <= t1; day.setDate(day.getDate() + 1)) days.push(day.getTime());
  const stride = Math.ceil(days.length / Math.max(1, maxTicks));
  return days.filter((_, i) => i % stride === 0);
}

/** El punto de la serie más cercano a un instante (búsqueda binaria: van en orden). */
function nearestIndex(points: Point[], time: number): number {
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid][0] < time) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 && time - points[lo - 1][0] < points[lo][0] - time ? lo - 1 : lo;
}

/**
 * Gráfica de un periodo del mercado: las señales acumuladas en bronce y, en
 * gris, el periodo anterior para comparar. Una línea vertical sigue al
 * puntero (o a las flechas del teclado) con los valores de ese momento, y
 * los mismos datos van en una tabla para lectores de pantalla.
 */
export default function TrendChart({ current, previous, range, lang, stale = false }: Props) {
  const t = T[lang];
  const gradientId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    // También avisa nada más empezar a observar, con el ancho inicial.
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = width < 520 ? HEIGHT_NARROW : HEIGHT;
  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const last = current.length - 1;
  const t0 = current[0][0];
  const t1 = current[last][0];
  const step = current.length > 2 ? current[1][0] - current[0][0] : DAY_MS;
  const { max: yMax, ticks: yTicks } = niceScale(Math.max(...current.map(p => p[1]), ...(previous ?? []).map(p => p[1])));
  const x = (time: number) => MARGIN.left + ((time - t0) / (t1 - t0 || 1)) * plotW;
  const y = (value: number) => MARGIN.top + plotH - (value / yMax) * plotH;
  const path = (points: Point[]) => points.map(([time, value], i) => `${i ? 'L' : 'M'}${x(time).toFixed(1)},${y(value).toFixed(1)}`).join('');

  const number = new Intl.NumberFormat(t.locale);
  const compact = new Intl.NumberFormat(t.locale, { notation: 'compact', maximumFractionDigits: 2 });
  const tickLabel = new Intl.DateTimeFormat(t.locale, range === '7d' ? { weekday: 'short', day: 'numeric' } : { day: 'numeric', month: 'short' });
  const pointLabel = new Intl.DateTimeFormat(t.locale, step < DAY_MS
    ? { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short' });
  const when = (i: number) => (i === last ? t.marketNow : pointLabel.format(current[i][0]));
  const xTicks = dayTicks(t0, t1, Math.floor(plotW / TICK_SPACE));

  const pointAt = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    const time = t0 + ((clientX - rect.left - MARGIN.left) / (plotW || 1)) * (t1 - t0);
    setActive(nearestIndex(current, time));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const move = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(last);
    else if (move) setActive(i => Math.min(last, Math.max(0, (i ?? last) + move)));
    else return;
    e.preventDefault();
  };

  const summary = `${number.format(current[last][1])} ${t.marketPeriodLabel[range]}`
    + (previous ? `. ${t.marketPreviousName[range]}: ${number.format(previous[last][1])}.` : '.');
  const activeX = active === null ? 0 : x(current[active][0]);

  return (
    <figure className={cx(styles.chart, stale && styles.stale)}>
      {previous && (
        <figcaption className={styles.legend}>
          <span className={styles.legendItem}><span className={cx(styles.key, styles.keyCurrent)} />{t.marketCurrentName[range]}</span>
          <span className={styles.legendItem}><span className={cx(styles.key, styles.keyPrevious)} />{t.marketPreviousName[range]}</span>
        </figcaption>
      )}

      <div
        ref={box}
        className={styles.plot}
        style={{ height }}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setActive(i => i ?? last)}
        onBlur={() => setActive(null)}
        onPointerMove={e => pointAt(e.clientX)}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => pointAt(e.clientX)}
        onPointerLeave={() => { if (document.activeElement !== box.current) setActive(null); }}
      >
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={summary}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--bronze)" stopOpacity="0.18" />
                <stop offset="1" stopColor="var(--bronze)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {yTicks.map(v => (
              <g key={v}>
                <line className={styles.grid} x1={MARGIN.left} x2={MARGIN.left + plotW} y1={y(v)} y2={y(v)} />
                <text className={styles.yLabel} x={width - 2} y={y(v)} dy="0.32em" textAnchor="end">{compact.format(v)}</text>
              </g>
            ))}
            {xTicks.map(time => {
              const tx = x(time);
              const anchor = tx < 20 ? 'start' : tx > plotW - 20 ? 'end' : 'middle';
              return (
                <text key={time} className={styles.xLabel} x={tx} y={height - 8} textAnchor={anchor}>{tickLabel.format(time)}</text>
              );
            })}

            <path d={`${path(current)}L${x(t1).toFixed(1)},${y(0)}L${x(t0).toFixed(1)},${y(0)}Z`} fill={`url(#${gradientId})`} />
            {previous && <path className={styles.previousLine} d={path(previous)} />}
            <path className={styles.currentLine} d={path(current)} />

            {active !== null && (
              <line className={styles.crosshair} x1={activeX} x2={activeX} y1={MARGIN.top} y2={MARGIN.top + plotH} />
            )}
            {active !== null && previous && (
              <circle className={styles.previousDot} cx={activeX} cy={y(previous[active][1])} r="4" />
            )}
            <circle
              className={styles.currentDot}
              cx={active === null ? x(t1) : activeX}
              cy={y(current[active ?? last][1])}
              r="4"
            />
          </svg>
        )}

        {active !== null && (
          <div role="tooltip" className={cx(styles.tooltip, activeX > width / 2 && styles.tooltipLeft)} style={{ left: activeX }}>
            <div className={styles.tooltipWhen}>{when(active)}</div>
            <div className={styles.tooltipRow}>
              <span className={cx(styles.key, styles.keyCurrent)} />
              <b>{number.format(current[active][1])}</b>
              <span>{t.marketCurrentName[range]}</span>
            </div>
            {previous && (
              <div className={styles.tooltipRow}>
                <span className={cx(styles.key, styles.keyPrevious)} />
                <b>{number.format(previous[active][1])}</b>
                <span>{t.marketPreviousName[range]}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <table className={styles.srOnly}>
        <caption>{t.marketTableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{t.marketTableDate}</th>
            <th scope="col">{t.marketCurrentName[range]}</th>
            {previous && <th scope="col">{t.marketPreviousName[range]}</th>}
          </tr>
        </thead>
        <tbody>
          {[...xTicks.map(time => nearestIndex(current, time)), last].map((i, row) => (
            <tr key={row}>
              <th scope="row">{when(i)}</th>
              <td>{number.format(current[i][1])}</td>
              {previous && <td>{number.format(previous[i][1])}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
