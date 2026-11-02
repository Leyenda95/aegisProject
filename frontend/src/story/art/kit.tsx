import { createContext, useContext, useId, type ReactNode } from 'react';
import { ARC, MARK_VIEWBOX, RING } from '../../components/AegisMark.tsx';
import type { IconId } from '../ids.ts';
import Icon from '../Icon.tsx';
import styles from './kit.module.css';

/**
 * Piezas para dibujar las ilustraciones del recorrido con un mismo estilo:
 * baldosas con icono, nodos claros, flechas, números y rótulos. Todas sobre
 * un lienzo de 400 x 300, con los colores de --art-* (index.css).
 */

// Prefijo único por dibujo para los degradados y la punta de flecha: puede
// haber varios dibujos en la misma página.
const Uid = createContext('art');

export function Canvas({ children }: { children: ReactNode }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 400 300" className={styles.canvas} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-tile`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" className={styles.tileFrom} />
          <stop offset="1" className={styles.tileTo} />
        </linearGradient>
        <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1.5L8.5 5L1 8.5" className={styles.arrowHead} />
        </marker>
      </defs>
      <Uid value={uid}>{children}</Uid>
    </svg>
  );
}

/**
 * Baldosa con degradado y un icono claro dentro; el rótulo, debajo. En lugar de
 * un icono de línea puede llevar un glifo propio (un logo relleno) dibujado
 * sobre una rejilla de 24, que se escala al mismo hueco que el icono.
 */
export function Tile({ x, y, size = 56, icon, glyph, label }: { x: number; y: number; size?: number; icon?: IconId; glyph?: ReactNode; label?: string }) {
  const uid = useContext(Uid);
  const pad = size * 0.25;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={size} height={size} rx={size * 0.28} fill={`url(#${uid}-tile)`} className={styles.tile} />
      {glyph ? (
        <g transform={`translate(${pad} ${pad}) scale(${(size - pad * 2) / 24})`} className={styles.onTile}>
          {glyph}
        </g>
      ) : (
        icon && (
          <g transform={`translate(${pad} ${pad})`} className={styles.onTile} style={{ fontSize: size - pad * 2 }}>
            <Icon id={icon} />
          </g>
        )
      )}
      {label && <Label x={size / 2} y={size + 16}>{label}</Label>}
    </g>
  );
}

/** Tarjeta clara: un ticket, una ventana, un contador. */
export function Node({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={10} className={styles.node} />
      {children}
    </g>
  );
}

/** Raya de texto difuminada dentro de un nodo (lo que no se deja leer). */
export function Bar({ x, y, w, strong = false }: { x: number; y: number; w: number; strong?: boolean }) {
  return <rect x={x} y={y} width={w} height={6} rx={3} className={strong ? styles.barStrong : styles.bar} />;
}

/** Número en un círculo, el mismo que en la lista de la diapositiva. */
export function Badge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={10} className={styles.badge} />
      <text y={4} textAnchor="middle" className={styles.badgeText}>{n}</text>
    </g>
  );
}

/** Flecha por un trazado SVG (d); discontinua para lo que no va a la cadena. */
export function Arrow({ d, dashed = false }: { d: string; dashed?: boolean }) {
  const uid = useContext(Uid);
  return <path d={d} className={dashed ? styles.arrowDashed : styles.arrow} markerEnd={`url(#${uid}-arrow)`} />;
}

export function Label({ x, y, children, anchor = 'middle' }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end' }) {
  return <text x={x} y={y} textAnchor={anchor} className={styles.label}>{children}</text>;
}

/** Píldora de señal: «Moda › Calzado ×2». */
export function Chip({ x, y, w, children }: { x: number; y: number; w: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={24} rx={12} className={styles.node} />
      <circle cx={13} cy={12} r={3} className={styles.dot} />
      <text x={22} y={16} className={styles.chipText}>{children}</text>
    </g>
  );
}

/** El ojo de Aegis, centrado en (cx, cy) y de ancho w. */
export function Mark({ cx, cy, w }: { cx: number; cy: number; w: number }) {
  const h = w * (454 / 640.1);
  return (
    <svg x={cx - w / 2} y={cy - h / 2} width={w} height={h} viewBox={MARK_VIEWBOX} className={styles.mark}>
      <path d={RING} fillRule="evenodd" />
      <path d={ARC} />
    </svg>
  );
}

