import { usePreferences } from '../../app/PreferencesProvider.tsx';
import { Bar, Canvas, Node } from './kit.tsx';

// Etiqueta (ancho de la raya clara) y cifra de cada fila.
const ROWS = [
  { label: 72, value: 1284 },
  { label: 56, value: 867 },
  { label: 84, value: 342 },
];
const PLUS_ROW = 1;

/**
 * Los contadores públicos (tour, "counters"): un panel con tres filas, una
 * etiqueta y una cifra cada una, y un «+1» recién sumado en una de ellas.
 */
export default function CountersArt() {
  const { t } = usePreferences();
  return (
    <Canvas>
      <Node x={40} y={60} w={320} h={180}>
        <Bar x={24} y={20} w={64} strong />
        <line x1={24} x2={296} y1={40} y2={40} stroke="var(--art-line)" strokeOpacity={0.35} />
        {ROWS.map((r, i) => {
          const y = 72 + i * 40;
          return (
            <g key={r.value}>
              <circle cx={30} cy={y} r={4} fill="var(--art-tile-to)" fillOpacity={0.55} />
              <Bar x={44} y={y - 3} w={r.label} />
              <text x={296} y={y + 7} textAnchor="end" fontFamily="var(--font-mono)" fontSize={20} fontWeight={600} fill="var(--art-ink)">
                {r.value.toLocaleString(t.locale)}
              </text>
              {i === PLUS_ROW && (
                <g transform={`translate(204 ${y - 10})`}>
                  <rect width={36} height={20} rx={10} fill="var(--art-badge)" />
                  <text x={18} y={14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11} fontWeight={600} fill="var(--art-on-badge)">+1</text>
                </g>
              )}
            </g>
          );
        })}
      </Node>
    </Canvas>
  );
}
