import { usePreferences } from '../../app/PreferencesProvider.tsx';
import { Arrow, Badge, Canvas, Tile } from './kit.tsx';

/**
 * Cómo viaja una compra (intro, "flow"): cinco pasos, con los mismos
 * números que la lista. Lo que va a la cadena, con trazo continuo; el QR,
 * que va de mano en mano, discontinuo.
 *
 *   Tienda ──1──▶ Midnight ──4──▶ Mercado
 *     ┊2            ▲                │5
 *   Cliente ──3─────┘             Agente
 */
export default function FlowArt() {
  const a = usePreferences().t.story.art;
  return (
    <Canvas>
      <Tile x={40} y={36} icon="cart" label={a.store} />
      <Tile x={40} y={188} icon="person" label={a.customer} />
      <Tile x={170} y={108} size={64} icon="midnight" label={a.midnight} />
      <Tile x={308} y={36} icon="market" label={a.market} />
      <Tile x={308} y={188} icon="agent" label={a.agent} />

      <Arrow d="M102 64 C 136 64, 140 120, 164 132" />
      <Badge x={130} y={78} n={1} />

      <Arrow d="M68 116 L68 180" dashed />
      <Badge x={68} y={148} n={2} />

      <Arrow d="M102 216 C 136 216, 140 160, 164 148" />
      <Badge x={130} y={202} n={3} />

      <Arrow d="M240 132 C 268 126, 272 64, 302 64" />
      <Badge x={264} y={80} n={4} />

      <Arrow d="M336 116 L336 180" />
      <Badge x={352} y={148} n={5} />
    </Canvas>
  );
}
