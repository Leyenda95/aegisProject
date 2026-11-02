import { usePreferences } from '../../app/PreferencesProvider.tsx';
import { Arrow, Canvas, Chip, Tile } from './kit.tsx';
import { Receipt } from './parts.tsx';

/**
 * El sello del recibo (tour, "seal"): el recibo viaja al contrato en forma de
 * compromiso (un hash que no se deshace); un sello asoma por su esquina.
 */
export default function SealArt() {
  const a = usePreferences().t.story.art;
  return (
    <Canvas>
      <Receipt x={36} y={84} w={100} h={132} />
      <Arrow d="M144 150 L292 150" />
      <Chip x={177} y={138} w={84}>
        <tspan fontFamily="var(--font-mono)">0x9f3a…</tspan>
      </Chip>
      <Tile x={300} y={118} size={64} icon="contract" label={a.midnight} />
      <Tile x={112} y={194} size={40} icon="seal" />
    </Canvas>
  );
}
