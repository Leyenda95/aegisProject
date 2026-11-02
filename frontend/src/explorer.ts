// Enlaces al explorador de bloques (midnightexplorer.com, uno de los que
// cita la documentación de Midnight). Cada red tiene su subdominio y la
// página de una transacción es /transactions/<hash>. Ojo: espera el hash
// de la transacción (32 bytes), no uno de sus identificadores (33 bytes),
// que es lo que devuelve la wallet al enviarla; con un identificador da 404.
const EXPLORERS: Record<string, string> = {
  preprod: 'https://preprod.midnightexplorer.com',
  preview: 'https://preview.midnightexplorer.com',
};

/** URL de la transacción en el explorador de esa red, o null si la red no tiene explorador (local) o el hash no es válido. */
export function explorerTxUrl(network: string, hash: string | null | undefined): string | null {
  const base = EXPLORERS[network];
  const clean = hash?.replace(/^0x/i, '').toLowerCase();
  if (!base || !clean || !/^[0-9a-f]{64}$/.test(clean)) return null;
  return `${base}/transactions/${clean}`;
}
