import { Arrow, Canvas, Tile } from './kit.tsx';

const CX = 140;
const CY = 150;
const DOTS = 11;

/**
 * Los datos de compra tienen dueño (intro, "problem"): a la izquierda, una
 * plataforma enorme a la que convergen muchas personas; a la derecha, la
 * tienda de barrio sola, con una flecha discontinua que no lleva a nada.
 */
export default function ProblemArt() {
  const people = Array.from({ length: DOTS }, (_, i) => {
    const a = ((90 + i * 18) * Math.PI) / 180;
    const at = (r: number) => ({ x: Math.round(CX + r * Math.cos(a)), y: Math.round(CY + r * Math.sin(a)) });
    return { dot: at(96), from: at(84), to: at(65) };
  });
  return (
    <Canvas>
      {people.map((p, i) => (
        <g key={i}>
          <circle cx={p.dot.x} cy={p.dot.y} r={5.5} fill="var(--art-ink-soft)" fillOpacity={0.75} />
          <Arrow d={`M${p.from.x} ${p.from.y} L${p.to.x} ${p.to.y}`} />
        </g>
      ))}
      <Tile x={CX - 48} y={CY - 48} size={96} icon="chart" />

      <rect x={298} y={56} width={80} height={62} rx={10} fill="none" stroke="var(--art-line)" strokeDasharray="4 5" strokeWidth={1.4} />
      <Arrow d="M338 176 L338 128" dashed />
      <Tile x={315} y={182} size={46} icon="cart" />
    </Canvas>
  );
}
