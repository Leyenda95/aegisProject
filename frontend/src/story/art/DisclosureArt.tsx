import { Arrow, Canvas, Tile } from './kit.tsx';
import { Receipt, SignalChip, receiptRowY, useSignal } from './parts.tsx';

const RECEIPT = { x: 30, y: 50, h: 200 };
const ROW = 6;

/**
 * Qué se revela (tour, "disclosure"): del recibo, tapado casi entero, solo
 * una línea sale convertida en señal, y es lo único que ve el ojo de fuera.
 */
export default function DisclosureArt() {
  const signal = useSignal('fashion', 'shoes', 2);
  const y = RECEIPT.y + receiptRowY(ROW) + 3;
  const x = 370 - signal.w;
  const cx = x + signal.w / 2;
  return (
    <Canvas>
      <Receipt x={RECEIPT.x} y={RECEIPT.y} w={130} h={RECEIPT.h} strong={ROW} />
      <Arrow d={`M168 ${y} L${x - 8} ${y}`} />
      <SignalChip x={x} y={y - 12} signal={signal} />
      <Arrow d={`M${cx} ${y - 14} L${cx} ${y - 46}`} />
      <Tile x={cx - 24} y={y - 102} size={48} icon="eye" />
    </Canvas>
  );
}
