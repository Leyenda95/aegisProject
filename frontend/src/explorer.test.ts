import { describe, expect, it } from 'vitest';
import { explorerTxUrl } from './explorer.ts';

const HASH = 'd1c21bf1c2aa14c492a9fca41f33f71a02a40972c806f3a13f48e40d070163e0';

describe('enlace a la transacción en el explorador', () => {
  it('apunta al explorador de la red en la que está el contrato', () => {
    expect(explorerTxUrl('preprod', HASH)).toBe(`https://preprod.midnightexplorer.com/transactions/${HASH}`);
    expect(explorerTxUrl('preview', HASH)).toBe(`https://preview.midnightexplorer.com/transactions/${HASH}`);
  });

  it('no hay enlace en la red local, que no tiene explorador', () => {
    expect(explorerTxUrl('local', HASH)).toBeNull();
    expect(explorerTxUrl('undeployed', HASH)).toBeNull();
  });

  it('no hay enlace sin un hash de transacción válido', () => {
    expect(explorerTxUrl('preprod', undefined)).toBeNull();
    expect(explorerTxUrl('preprod', '')).toBeNull();
    // Un identificador de transacción (33 bytes) no es el hash: el explorador no lo encuentra.
    expect(explorerTxUrl('preprod', `00${HASH}`)).toBeNull();
    expect(explorerTxUrl('preprod', 'zz'.repeat(32))).toBeNull();
  });

  it('acepta el hash con prefijo 0x o en mayúsculas', () => {
    expect(explorerTxUrl('preprod', `0x${HASH.toUpperCase()}`)).toBe(`https://preprod.midnightexplorer.com/transactions/${HASH}`);
  });
});
