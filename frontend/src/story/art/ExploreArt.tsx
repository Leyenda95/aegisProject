import type { IconId } from '../ids.ts';
import { Canvas, Mark, Tile } from './kit.tsx';

const CX = 200;
const CY = 150;
const R = 100;
const SIZE = 46;
const TILES: IconId[] = ['cart', 'scan', 'chart'];

/**
 * Explora tú (tour, "explore"): el ojo de Aegis en el centro y, en un anillo
 * discontinuo a su alrededor, la tienda, el cliente y el mercado.
 */
export default function ExploreArt() {
  return (
    <Canvas>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--art-line)" strokeDasharray="3 6" strokeWidth={1.4} />
      <circle cx={CX} cy={CY} r={42} fill="var(--art-node)" stroke="var(--art-node-line)" />
      <Mark cx={CX} cy={CY} w={52} />
      {TILES.map((icon, i) => {
        const angle = (-90 + i * 120) * (Math.PI / 180);
        return (
          <Tile
            key={icon}
            x={CX + R * Math.cos(angle) - SIZE / 2}
            y={CY + R * Math.sin(angle) - SIZE / 2}
            size={SIZE}
            icon={icon}
          />
        );
      })}
    </Canvas>
  );
}
