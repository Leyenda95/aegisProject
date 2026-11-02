import type { IconId } from '../ids.ts';
import { Arrow, Canvas, Mark, Tile } from './kit.tsx';

const CX = 200;
const CY = 150;
const SIZE = 52;

// Encuestas, salud, fidelidad y eventos, en las cuatro esquinas.
const USES: { icon: IconId; sx: number; sy: number }[] = [
  { icon: 'docs', sx: -1, sy: -1 },
  { icon: 'proof', sx: 1, sy: -1 },
  { icon: 'wallet', sx: -1, sy: 1 },
  { icon: 'scan', sx: 1, sy: 1 },
];

/**
 * Más allá del comercio (recap, "beyond"): el ojo de Aegis en el centro y,
 * unidos por líneas discontinuas, otros usos de la misma idea.
 */
export default function BeyondArt() {
  return (
    <Canvas>
      <circle cx={CX} cy={CY} r={46} fill="var(--art-node)" stroke="var(--art-node-line)" />
      <Mark cx={CX} cy={CY} w={56} />
      {USES.map(u => {
        const dx = 128 * u.sx;
        const dy = 86 * u.sy;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        const edge = SIZE / 2 / Math.max(Math.abs(ux), Math.abs(uy)) + 8;
        const from = 54;
        return (
          <g key={u.icon}>
            <Arrow
              d={`M${Math.round(CX + from * ux)} ${Math.round(CY + from * uy)} L${Math.round(CX + dx - edge * ux)} ${Math.round(CY + dy - edge * uy)}`}
              dashed
            />
            <Tile x={CX + dx - SIZE / 2} y={CY + dy - SIZE / 2} size={SIZE} icon={u.icon} />
          </g>
        );
      })}
    </Canvas>
  );
}
