import { describe, expect, it } from 'vitest';
import { txHashFromHex } from './txHash.ts';
// Transacción real de preview (ledger 9) tal como la sirve el indexer (raw) junto con
// el hash que da el propio indexer y que acepta el explorador.
import fixture from './txHash.fixture.json';

describe('hash de una transacción ya sellada', () => {
  it('coincide con el hash que da el indexer para esa misma transacción', () => {
    expect(txHashFromHex(fixture.raw)).toBe(fixture.hash);
  });

  it('es el hash (64 hex), no uno de los identificadores (66 hex)', () => {
    const hash = txHashFromHex(fixture.raw);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(fixture.identifiers).not.toContain(hash);
  });

  it('acepta el hex con prefijo 0x', () => {
    expect(txHashFromHex(`0x${fixture.raw}`)).toBe(fixture.hash);
  });

  it('devuelve null si no es una transacción sellada', () => {
    expect(txHashFromHex('')).toBeNull();
    expect(txHashFromHex('zz')).toBeNull();
    expect(txHashFromHex('00ff')).toBeNull();
  });
});
