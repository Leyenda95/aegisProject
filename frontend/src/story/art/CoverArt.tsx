import type { CSSProperties } from 'react';
import { MARK_VIEWBOX, RING } from '../../components/AegisMark.tsx';
import styles from './CoverArt.module.css';

/** Solo el contorno exterior del aro: con los dos, cada onda sería una línea doble. */
const OUTLINE = RING.slice(0, RING.indexOf('Z') + 1);

/** Tres ondas que salen una detrás de otra, repartidas a lo largo del ciclo (una cada 3 s). */
const WAVES = [0, 1, 2];

/**
 * Movimiento de la portada de la intro: el contorno del ojo de Aegis sale
 * del logo en ondas que crecen y se desvanecen, como una señal que se
 * propaga. Va detrás del logo (lo coloca quien lo usa, con className).
 * Decorativo.
 */
export default function CoverArt({ className }: { className?: string }) {
  return (
    <div className={`${styles.waves} ${className ?? ''}`} aria-hidden="true">
      {WAVES.map(i => (
        <svg key={i} viewBox={MARK_VIEWBOX} className={styles.wave} style={{ '--i': i } as CSSProperties}>
          <path d={OUTLINE} />
        </svg>
      ))}
    </div>
  );
}
