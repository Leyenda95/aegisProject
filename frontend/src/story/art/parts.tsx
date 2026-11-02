import type { ReactNode } from 'react';
import { CATEGORY_LABELS, SUBCATEGORY_LABELS, type Category } from '../../api.ts';
import { usePreferences } from '../../app/PreferencesProvider.tsx';
import { Bar, Chip, Node } from './kit.tsx';

/**
 * Piezas compartidas por varias ilustraciones: la señal localizada, el recibo
 * difuminado, el teléfono y el QR. Solo usan los colores de --art-*.
 */

/** Texto de una señal («Moda › Calzado ×2») y el ancho que necesita su píldora. */
export function useSignal(category: Category, sub: string, qty: number) {
  const { lang } = usePreferences();
  const text = `${CATEGORY_LABELS[lang][category]} › ${SUBCATEGORY_LABELS[lang][sub]} ×${qty}`;
  return { text, w: Math.round(34 + text.length * 5.9) };
}

/**
 * Píldora de señal. x es el borde izquierdo, el centro o el derecho según
 * anchor; scale la agranda en las ilustraciones grandes.
 */
export function SignalChip({ x, y, signal, anchor = 'start', scale = 1 }: {
  x: number;
  y: number;
  signal: { text: string; w: number };
  anchor?: 'start' | 'middle' | 'end';
  scale?: number;
}) {
  const width = signal.w * scale;
  const left = anchor === 'start' ? x : anchor === 'middle' ? x - width / 2 : x - width;
  return (
    <g transform={`translate(${left} ${y}) scale(${scale})`}>
      <Chip x={0} y={0} w={signal.w}>{signal.text}</Chip>
    </g>
  );
}

/** Y (relativa al recibo) de la raya de producto i. */
export const receiptRowY = (i: number) => 40 + i * 16;

const NAME = [0.9, 0.62, 0.78, 0.5, 0.7, 0.58];

/**
 * Recibo lleno de rayas que no se dejan leer. strong marca una línea (su
 * índice) como la única que cuenta.
 */
export function Receipt({ x, y, w, h, strong }: { x: number; y: number; w: number; h: number; strong?: number }) {
  const rows = Math.floor((h - 40 - 38 - 6) / 16) + 1;
  const room = w - 28 - 16 - 12;
  return (
    <Node x={x} y={y} w={w} h={h}>
      <Bar x={14} y={14} w={Math.round(w * 0.36)} />
      <line x1={14} x2={w - 14} y1={30} y2={30} stroke="var(--art-line)" strokeOpacity={0.35} strokeDasharray="3 4" />
      {Array.from({ length: rows }, (_, i) => {
        const on = i === strong;
        return (
          <g key={i}>
            {on && (
              <rect x={6} y={receiptRowY(i) - 6} width={w - 12} height={18} rx={6} fill="var(--art-tile-to)" fillOpacity={0.12} stroke="var(--art-tile-to)" strokeOpacity={0.6} />
            )}
            <Bar x={14} y={receiptRowY(i)} w={Math.round(room * NAME[i % NAME.length])} strong={on} />
            <Bar x={w - 30} y={receiptRowY(i)} w={16} strong={on} />
          </g>
        );
      })}
      <line x1={14} x2={w - 14} y1={h - 34} y2={h - 34} stroke="var(--art-line)" strokeOpacity={0.35} strokeDasharray="3 4" />
      <Bar x={14} y={h - 24} w={26} />
      <Bar x={w - 44} y={h - 24} w={30} />
    </Node>
  );
}

/** Contorno de teléfono con su muesca; lo de dentro, en coordenadas locales. */
export function Phone({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={w}
        height={h}
        rx={w * 0.2}
        fill="var(--art-node)"
        stroke="var(--art-line)"
        strokeWidth={1.6}
        style={{ filter: 'drop-shadow(0 6px 12px var(--art-glow))' }}
      />
      <rect x={w / 2 - 14} y={9} width={28} height={5} rx={2.5} fill="var(--art-line)" fillOpacity={0.5} />
      {children}
    </g>
  );
}

const QR_N = 11;

// Celdas del QR: un generador congruencial fijo, para que el dibujo no cambie entre renders.
const QR_CELLS = (() => {
  let s = 7;
  const next = () => ((s = (s * 1103515245 + 12345) >>> 0) >>> 16) & 1;
  const cells: [number, number][] = [];
  for (let r = 0; r < QR_N; r++) {
    for (let c = 0; c < QR_N; c++) {
      const finder = (r < 4 && c < 4) || (r < 4 && c > QR_N - 5) || (r > QR_N - 5 && c < 4);
      if (!finder && next()) cells.push([r, c]);
    }
  }
  return cells;
})();

/** Cuadrícula de rectángulos que imita un QR, con los tres cuadros de las esquinas. */
export function QrGrid({ x, y, size }: { x: number; y: number; size: number }) {
  const c = size / QR_N;
  const finders: [number, number][] = [[0, 0], [0, QR_N - 3], [QR_N - 3, 0]];
  return (
    <g transform={`translate(${x} ${y})`} fill="var(--art-ink)">
      {QR_CELLS.map(([r, col]) => (
        <rect key={`${r}-${col}`} x={col * c + 0.6} y={r * c + 0.6} width={c - 1.2} height={c - 1.2} rx={1.2} />
      ))}
      {finders.map(([r, col]) => (
        <g key={`f${r}-${col}`}>
          <rect x={col * c} y={r * c} width={c * 3} height={c * 3} rx={c * 0.5} />
          <rect x={col * c + c * 0.7} y={r * c + c * 0.7} width={c * 1.6} height={c * 1.6} rx={c * 0.3} fill="var(--art-node)" />
        </g>
      ))}
    </g>
  );
}
