import { Bar, Canvas, Node, Tile } from './kit.tsx';

/** La documentación de Midnight (recap 2): dos páginas apiladas y el símbolo de Midnight. */
export default function DocsArt() {
  return (
    <Canvas>
      <Node x={112} y={50} w={216} h={170}>
        <Bar x={20} y={24} w={64} strong />
        <Bar x={20} y={46} w={150} />
        <Bar x={20} y={64} w={120} />
      </Node>
      <Node x={62} y={80} w={216} h={172}>
        <Bar x={20} y={26} w={76} strong />
        <Bar x={20} y={50} w={160} />
        <Bar x={20} y={68} w={132} />
        <Bar x={20} y={86} w={150} />
        <Bar x={20} y={112} w={96} strong />
        <Bar x={20} y={130} w={140} />
      </Node>
      <Tile x={252} y={166} size={80} icon="midnight" />
    </Canvas>
  );
}
