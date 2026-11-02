import { Arrow, Canvas } from './kit.tsx';
import { Receipt, SignalChip, useSignal } from './parts.tsx';

const SCALE = 1.3;

/**
 * Una compra, una señal anónima (intro, "idea"): el recibo, lleno de rayas
 * que no se dejan leer, y una única píldora que sale de él con la subcategoría
 * y las unidades.
 */
export default function IdeaArt() {
  const signal = useSignal('fashion', 'shoes', 2);
  const x = 364 - signal.w * SCALE;
  return (
    <Canvas>
      <Receipt x={36} y={66} w={118} h={168} />
      <Arrow d={`M164 150 L${x - 10} 150`} />
      <SignalChip x={x} y={150 - 12 * SCALE} signal={signal} scale={SCALE} />
    </Canvas>
  );
}
