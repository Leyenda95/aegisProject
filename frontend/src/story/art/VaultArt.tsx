import { Bar, Canvas, Node } from './kit.tsx';
import { Phone } from './parts.tsx';

const TICKETS = [
  { x: 18, y: 32 },
  { x: 12, y: 104 },
  { x: 12, y: 170 },
];

/**
 * Los recibos en el móvil (tour, "vault"): tres tickets apilados dentro del
 * teléfono, con el de arriba levantado: el que se va a publicar.
 */
export default function VaultArt() {
  return (
    <Canvas>
      <Phone x={130} y={22} w={140} h={256}>
        {TICKETS.map((t, i) => (
          <g key={i} opacity={i === 0 ? 1 : 0.75}>
            <Node x={t.x} y={t.y} w={110} h={58}>
              <Bar x={12} y={14} w={44} strong={i === 0} />
              <Bar x={12} y={30} w={70} />
              <Bar x={12} y={42} w={50} />
              <Bar x={84} y={14} w={14} strong={i === 0} />
            </Node>
          </g>
        ))}
      </Phone>
    </Canvas>
  );
}
