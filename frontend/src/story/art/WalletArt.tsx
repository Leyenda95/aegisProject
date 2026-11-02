import { Arrow, Bar, Canvas, Label, Node } from './kit.tsx';

/**
 * Conecta tu wallet (tour 2): la cabecera de la web con su botón de conectar
 * y las dos wallets de Midnight a las que llega, Lace y 1AM.
 *
 * Logos (public/images/wallets/), marcas de sus dueños, usados solo para
 * identificar con qué wallets se integra la app:
 * - lace.svg: símbolo de Lace (Input Output Global), tal cual lo sirve la
 *   cabecera de https://www.lace.io.
 * - 1am.svg: icono de app de 1AM (Webisoft), del paquete de logos de su kit de
 *   marca, https://www.1am.xyz/marketing (1AM_Logo.zip, logos/1am-icon.svg).
 */
export default function WalletArt() {
  return (
    <Canvas>
      <Node x={40} y={44} w={320} h={64}>
        <Bar x={20} y={22} w={64} strong />
        <Bar x={20} y={36} w={44} />
        <rect x={226} y={18} width={74} height={28} rx={9} fill="var(--art-tile-to)" />
        <rect x={242} y={29} width={42} height={6} rx={3} fill="var(--art-on-tile)" fillOpacity={0.85} />
      </Node>
      <Arrow dashed d="M 262 112 C 262 146, 150 140, 132 176" />
      <Arrow dashed d="M 300 112 C 300 146, 290 140, 268 176" />
      <WalletCard x={96} y={180} src="/images/wallets/lace.svg" label="Lace" />
      <WalletCard x={232} y={180} src="/images/wallets/1am.svg" label="1AM" />
    </Canvas>
  );
}

const CARD = 72;
const LOGO = 48;

/**
 * Tarjeta blanca con el logo de una wallet y su nombre debajo. Siempre blanca,
 * también en modo oscuro, para que los logos se vean con sus colores.
 */
function WalletCard({ x, y, src, label }: { x: number; y: number; src: string; label: string }) {
  const pad = (CARD - LOGO) / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={CARD}
        height={CARD}
        rx={CARD * 0.28}
        fill="#FFFFFF"
        stroke="var(--art-node-line)"
        style={{ filter: 'drop-shadow(0 6px 10px var(--art-glow))' }}
      />
      <image href={src} x={pad} y={pad} width={LOGO} height={LOGO} />
      <Label x={CARD / 2} y={CARD + 18}>{label}</Label>
    </g>
  );
}
