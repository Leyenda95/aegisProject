/**
 * Nombres compartidos por el recorrido (intro, tour y recap): ilustraciones,
 * iconos y piezas de la arquitectura. Sin textos: los textos están en
 * story/copy.*.ts, uno por idioma.
 */

/** Ilustraciones (ver story/art). Las grandes van en la intro y el recap; las pequeñas, en el panel del tour. */
export type ArtId =
  | 'disclaimer' | 'problem' | 'idea' | 'players' | 'flow' | 'ready' | 'beyond'
  | 'repo' | 'docs' | 'wallet' | 'registry' | 'counters' | 'vault' | 'cart' | 'seal' | 'qr' | 'disclosure' | 'proof' | 'market' | 'agent' | 'explore';

/** Iconos de línea (ver story/Icon.tsx). */
export type IconId =
  | 'contract' | 'proof' | 'tree' | 'seal' | 'fuel' | 'wallet' | 'indexer' | 'agent'
  | 'cart' | 'scan' | 'eye' | 'chart' | 'github' | 'docs' | 'terminal' | 'lock'
  | 'midnight' | 'person' | 'market' | 'alert' | 'mail';

/**
 * Lo que Aegis usa de Midnight: la infraestructura, cada pieza
 * con lo que hace en Aegis: la red a un lado y las
 * herramientas para llegar a ella al otro.
 */
export type StackId = 'compact' | 'proofServer' | 'disclosure' | 'indexer' | 'dust' | 'midnightJs' | 'wallets';

const DOCS = 'https://docs.midnight.network';
export const STACK: Record<StackId, { icon: IconId; href: string }> = {
  compact: { icon: 'contract', href: DOCS },
  proofServer: { icon: 'proof', href: DOCS },
  disclosure: { icon: 'eye', href: DOCS },
  indexer: { icon: 'indexer', href: DOCS },
  dust: { icon: 'fuel', href: 'https://midnight.network' },
  midnightJs: { icon: 'terminal', href: DOCS },
  wallets: { icon: 'wallet', href: 'https://www.lace.io' },
};

export const STACK_GROUPS: readonly (readonly StackId[])[] = [
  ['compact', 'proofServer', 'dust', 'disclosure', 'indexer'],
  ['midnightJs', 'wallets'],
];

export const REPO_URL = 'https://github.com/Leyenda95/aegisProject';
