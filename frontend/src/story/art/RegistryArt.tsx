import { Arrow, Bar, Canvas, Node, Tile } from './kit.tsx';

const XS = [39, 123, 207, 291];
const W = 70;
const PICKED = 2;

/**
 * El registro de tiendas (tour, "registry"): el árbol arriba y cuatro
 * tiendas debajo. Una está marcada, pero con el «?» queda claro que nadie
 * sabe cuál es.
 */
export default function RegistryArt() {
  return (
    <Canvas>
      <Tile x={172} y={34} size={56} icon="tree" />
      {XS.map(x => (
        <Arrow key={x} d={`M200 98 C 200 142, ${x + W / 2} 136, ${x + W / 2} 178`} />
      ))}
      {XS.map((x, i) => {
        const on = i === PICKED;
        return (
          <g key={x}>
            <Node x={x} y={184} w={W} h={80}>
              <g opacity={on ? 1 : 0.6}>
                <Tile x={20} y={12} size={30} icon="cart" />
              </g>
              <Bar x={15} y={54} w={40} strong={on} />
              <Bar x={22} y={66} w={26} strong={on} />
            </Node>
            {on && (
              <>
                <rect x={x} y={184} width={W} height={80} rx={10} fill="none" stroke="var(--art-tile-to)" strokeWidth={2} />
                <g transform={`translate(${x + W - 2} 186)`}>
                  <circle r={10} fill="var(--art-badge)" />
                  <text y={4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11} fontWeight={600} fill="var(--art-on-badge)">?</text>
                </g>
              </>
            )}
          </g>
        );
      })}
    </Canvas>
  );
}
