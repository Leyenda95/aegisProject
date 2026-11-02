import { Arrow, Canvas, Tile } from './kit.tsx';
import { Receipt } from './parts.tsx';

/**
 * La prueba de conocimiento cero (tour 2, "proof"): como ProofArt, pero la
 * prueba lleva el símbolo de Midnight, la red que la verifica.
 */
export default function ProofArt() {
  return (
    <Canvas>
      <Receipt x={26} y={84} w={80} h={132} />
      <Arrow d="M114 150 L152 150" />
      <Tile x={158} y={108} size={84} icon="midnight" />
      <Arrow d="M250 150 L304 150" />
      <Tile x={312} y={122} size={56} icon="contract" />
      <g transform="translate(364 126)">
        <circle r={10} fill="var(--art-badge)" />
        <path d="M-4.2 0.4 L-1.2 3.4 L4.4 -2.8" fill="none" stroke="var(--art-on-badge)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Canvas>
  );
}
