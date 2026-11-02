import { usePreferences } from '../../app/PreferencesProvider.tsx';
import type { IconId } from '../ids.ts';
import { Canvas, Label, Mark, Tile } from './kit.tsx';

const CX = 200;
const CY = 146;
const SIZE = 44;

/**
 * Los cinco sitios del anillo (radio 104 alrededor de CX, CY), de arriba en
 * el sentido de las agujas, cada 72 grados: centro de la baldosa y dónde va
 * su rótulo (fuera del anillo: arriba, a un lado o debajo).
 */
const SLOTS: { x: number; y: number; lx: number; ly: number; anchor: 'start' | 'middle' | 'end' }[] = [
  { x: 200, y: 42, lx: 200, ly: 12, anchor: 'middle' },
  { x: 299, y: 114, lx: 331, ly: 118, anchor: 'start' },
  { x: 261, y: 230, lx: 261, ly: 274, anchor: 'middle' },
  { x: 139, y: 230, lx: 139, ly: 274, anchor: 'middle' },
  { x: 101, y: 114, lx: 69, ly: 118, anchor: 'end' },
];

/**
 * Quién participa (intro, "players"): los cinco actores en un anillo
 * alrededor de Aegis, en el orden de las tarjetas de la diapositiva.
 */
export default function PlayersArt() {
  const a = usePreferences().t.story.art;
  const players: { icon: IconId; label: string }[] = [
    { icon: 'cart', label: a.store },
    { icon: 'person', label: a.customer },
    { icon: 'midnight', label: a.midnight },
    { icon: 'market', label: a.market },
    { icon: 'agent', label: a.agent },
  ];
  return (
    <Canvas>
      <circle cx={CX} cy={CY} r={104} fill="none" stroke="var(--art-line)" strokeDasharray="3 6" strokeWidth={1.4} />
      <circle cx={CX} cy={CY} r={46} fill="var(--art-node)" stroke="var(--art-node-line)" />
      <Mark cx={CX} cy={CY} w={56} />
      {players.map((p, i) => {
        const slot = SLOTS[i];
        return (
          <g key={p.label}>
            <Tile x={slot.x - SIZE / 2} y={slot.y - SIZE / 2} size={SIZE} icon={p.icon} />
            <Label x={slot.lx} y={slot.ly} anchor={slot.anchor}>{p.label}</Label>
          </g>
        );
      })}
    </Canvas>
  );
}
