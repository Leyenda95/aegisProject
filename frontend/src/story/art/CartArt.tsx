import type { Category } from '../../api.ts';
import { Arrow, Bar, Canvas, Node, Tile } from './kit.tsx';
import { SignalChip, useSignal } from './parts.tsx';

function Product({ y, category, sub, qty }: { y: number; category: Category; sub: string; qty: number }) {
  const signal = useSignal(category, sub, qty);
  return (
    <Node x={150} y={y} w={214} h={100}>
      <rect x={14} y={14} width={36} height={36} rx={9} fill="var(--art-node-line)" />
      <Bar x={62} y={20} w={72} strong />
      <Bar x={62} y={36} w={104} />
      <SignalChip x={14} y={62} signal={signal} />
    </Node>
  );
}

/**
 * La compra de la demo (tour, "cart"): el carrito y dos productos, cada uno
 * con la señal que saldrá de él (categoría, subcategoría y unidades).
 */
export default function CartArt() {
  return (
    <Canvas>
      <Tile x={36} y={122} size={56} icon="cart" />
      <Arrow d="M98 140 C 126 140, 122 86, 144 86" />
      <Arrow d="M98 160 C 126 160, 122 214, 144 214" />
      <Product y={36} category="fashion" sub="shoes" qty={2} />
      <Product y={164} category="electronics" sub="audio" qty={1} />
    </Canvas>
  );
}
