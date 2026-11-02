import { Bar, Canvas, Node } from './kit.tsx';

const POINTS: [number, number][] = [[20, 104], [65, 92], [111, 98], [156, 76], [202, 82], [247, 58], [292, 50]];
const COLUMNS = [34, 52, 28, 44];
const TOP = 3;

/**
 * El mercado (tour, "market"): una gráfica de líneas con la tendencia y, bajo
 * ella, cuatro columnas con lo que suma cada categoría.
 */
export default function MarketArt() {
  const line = POINTS.map(p => p.join(' ')).join(' L');
  return (
    <Canvas>
      <Node x={44} y={36} w={312} h={228}>
        <Bar x={20} y={18} w={64} strong />
        <Bar x={252} y={18} w={40} />
        {[62, 82, 102].map(y => (
          <line key={y} x1={20} x2={292} y1={y} y2={y} stroke="var(--art-line)" strokeOpacity={0.25} />
        ))}
        <path d={`M${line} L292 120 L20 120 Z`} fill="var(--art-tile-to)" fillOpacity={0.1} />
        <path d={`M${line}`} fill="none" stroke="var(--art-tile-to)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={292} cy={50} r={4.5} fill="var(--art-tile-to)" stroke="var(--art-node)" strokeWidth={2} />
        {COLUMNS.map((h, i) => {
          const x = 20 + i * 74.67;
          return (
            <g key={i}>
              <rect x={x} y={200 - h} width={48} height={h} rx={5} fill="var(--art-tile-to)" fillOpacity={i === TOP ? 1 : 0.4} />
              <Bar x={x + 12} y={210} w={24} />
            </g>
          );
        })}
      </Node>
    </Canvas>
  );
}
