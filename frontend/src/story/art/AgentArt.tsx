import { Arrow, Bar, Canvas, Node, Tile } from './kit.tsx';

const COUNTERS = [
  { label: 26, value: 38 },
  { label: 20, value: 28 },
  { label: 30, value: 18 },
];

/**
 * El agente (tour, "agent"): lee los contadores agregados, nunca una compra,
 * y escribe un informe para la tienda.
 */
export default function AgentArt() {
  return (
    <Canvas>
      <Node x={20} y={96} w={96} h={108}>
        {COUNTERS.map((c, i) => (
          <g key={i}>
            <Bar x={12} y={22 + i * 28} w={c.label} />
            <Bar x={46} y={22 + i * 28} w={c.value} strong />
          </g>
        ))}
      </Node>
      <Arrow d="M124 150 L160 150" />
      <Tile x={168} y={118} size={64} icon="agent" />
      <Arrow d="M240 150 L276 150" />
      <Node x={284} y={82} w={96} h={136}>
        <Bar x={12} y={18} w={56} strong />
        <Bar x={12} y={40} w={72} />
        <Bar x={12} y={54} w={64} />
        <Bar x={12} y={68} w={72} />
        <Bar x={12} y={82} w={44} />
        <Bar x={12} y={104} w={68} />
      </Node>
    </Canvas>
  );
}
