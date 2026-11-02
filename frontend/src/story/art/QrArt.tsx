import { Arrow, Bar, Canvas, Chip, Node } from './kit.tsx';
import { Phone, QrGrid } from './parts.tsx';

/**
 * El recibo en un QR (tour, "qr"): el recibo completo viaja en el fragmento
 * de la dirección (lo que va tras #), que nunca llega a un servidor, del QR
 * de la tienda al teléfono del cliente.
 */
export default function QrArt() {
  return (
    <Canvas>
      <Node x={30} y={86} w={128} h={128}>
        <QrGrid x={14} y={14} size={100} />
      </Node>
      <Arrow d="M168 150 L266 150" dashed />
      <Chip x={178} y={138} w={78}>
        <tspan fontFamily="var(--font-mono)">#9f3a…</tspan>
      </Chip>
      <Phone x={276} y={52} w={100} h={196}>
        <Node x={12} y={34} w={76} h={72}>
          <Bar x={10} y={14} w={34} strong />
          <Bar x={10} y={30} w={52} />
          <Bar x={10} y={44} w={40} />
        </Node>
        <Bar x={18} y={126} w={64} />
        <Bar x={18} y={142} w={48} />
      </Phone>
    </Canvas>
  );
}
