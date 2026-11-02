import { Bar, Canvas, Chip, Node, Tile } from './kit.tsx';

/**
 * Aviso de la intro ("disclaimer"): la ventana de la red de pruebas con su
 * etiqueta Preprod y, asomando por una esquina, el aviso (una exclamación).
 */
export default function DisclaimerArt() {
  return (
    <Canvas>
      <circle cx={200} cy={150} r={132} fill="none" stroke="var(--art-line)" strokeDasharray="3 6" strokeWidth={1.4} />
      <Node x={105} y={85} w={190} h={130}>
        {[0, 1, 2].map(i => (
          <circle key={i} cx={18 + i * 13} cy={22} r={3.5} fill="var(--art-line)" fillOpacity={0.6} />
        ))}
        <Chip x={190 - 14 - 78} y={10} w={78}>Preprod</Chip>
        <line x1={0} x2={190} y1={44} y2={44} stroke="var(--art-line)" strokeOpacity={0.35} />
        <Bar x={16} y={62} w={76} strong />
        <Bar x={16} y={80} w={146} />
        <Bar x={16} y={96} w={118} />
        <Bar x={16} y={112} w={90} />
      </Node>
      <Tile x={262} y={186} size={60} icon="alert" />
    </Canvas>
  );
}
