// Hash de una transacción ya sellada (firmada, probada y con binding), la
// que devuelve la wallet en balanceUnsealedTransaction y luego envía tal
// cual con submitTransaction. Es el hash que guarda el indexer y que busca
// el explorador (32 bytes, 64 hex); no confundir con identifiers(), que son
// de 33 bytes y el explorador no los encuentra.
//
// Importa ledger-v9 (WebAssembly): este módulo se carga con import()
// dinámico desde lace.ts, como localProver.ts, para no meterlo en el
// paquete inicial.
import { Transaction } from '@midnightntwrk/ledger-v9';

/** Hash hex de la transacción serializada, o null si no es una transacción sellada válida. */
export function txHashFromHex(hex: string): string | null {
  const clean = hex.replace(/^0x/i, '');
  if (!clean || clean.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(clean)) return null;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  try {
    const hash = Transaction.deserialize('signature', 'proof', 'binding', bytes).transactionHash().replace(/^0x/i, '').toLowerCase();
    return /^[0-9a-f]{64}$/.test(hash) ? hash : null;
  } catch {
    return null;
  }
}
