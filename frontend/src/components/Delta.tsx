import { cx } from '../cx.ts';
import styles from './Delta.module.css';

/** Variación frente al periodo anterior: ▲ 8 %, ▼ 3 %. La flecha lleva el color; la cifra, el del texto. */
export default function Delta({ change, locale }: { change: number; locale: string }) {
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(Math.abs(change));
  const up = change >= 0.005;
  const down = change <= -0.005;
  return (
    <span className={styles.delta}>
      <span aria-hidden="true" className={cx(styles.glyph, up && styles.up, down && styles.down)}>
        {up ? '▲' : down ? '▼' : '='}
      </span>
      <span className={styles.srOnly}>{up ? '+' : down ? '−' : ''}</span>
      {percent}
    </span>
  );
}
