import { describe, expect, it } from 'vitest';
import { fitsReceipt, MAX_RECEIPT_LINES, type RollupLine } from './catalog.ts';

const lines = (n: number): RollupLine[] => Array.from({ length: n }, (_, i) => ({ subcategory: `s${i}`, qty: 1, amountCents: 100 }));

describe('el límite de líneas del recibo', () => {
  it('con línea libre cabe cualquier subcategoría', () => {
    expect(fitsReceipt(lines(MAX_RECEIPT_LINES - 1), 'nueva')).toBe(true);
  });

  it('con el recibo lleno no cabe una subcategoría nueva', () => {
    expect(fitsReceipt(lines(MAX_RECEIPT_LINES), 'nueva')).toBe(false);
  });

  it('con el recibo lleno sí cabe más de una subcategoría ya presente', () => {
    expect(fitsReceipt(lines(MAX_RECEIPT_LINES), 's0')).toBe(true);
  });
});
