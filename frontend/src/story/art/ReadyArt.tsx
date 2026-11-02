import { Bar, Canvas, Node, Tile } from './kit.tsx';
import { Phone, QrGrid } from './parts.tsx';

// El tono medio del degradado de las baldosas: un color plano con el final
// del degradado (--art-tile-to) se ve más oscuro que la baldosa de al lado.
const TILE_MID = 'color-mix(in srgb, var(--art-tile-from), var(--art-tile-to))';

/**
 * ¿Empezamos? (intro, "ready"): un teléfono con un ticket, el QR del recibo
 * y un botón, y el símbolo de Midnight asomando por su esquina inferior
 * derecha, la red donde acabará la señal.
 */
export default function ReadyArt() {
  return (
    <Canvas>
      <Phone x={126} y={38} w={124} h={212}>
        <Node x={14} y={34} w={96} h={64}>
          <rect x={12} y={14} width={44} height={6} rx={3} fill={TILE_MID} />
          <Bar x={12} y={30} w={70} />
          <Bar x={12} y={44} w={52} />
        </Node>
        <QrGrid x={34} y={112} size={56} />
        <rect x={24} y={182} width={62} height={16} rx={8} fill={TILE_MID} />
      </Phone>
      <Tile x={216} y={208} size={58} icon="midnight" />
    </Canvas>
  );
}
