import { describe, expect, it } from 'vitest';
import { INITIAL_FLOW, reached, stageOf, ticketWaiting, type DemoFlow } from './demoFlow.ts';

const flow = (patch: Partial<DemoFlow>): DemoFlow => ({ ...INITIAL_FLOW, ...patch });
const sealed = { cartCount: 2, sealedNonce: 'a' };

describe('etapa de la demo', () => {
  it('recorre la compra de principio a fin', () => {
    expect(stageOf(INITIAL_FLOW)).toBe('shop');
    expect(stageOf(flow({ cartCount: 1 }))).toBe('cart');
    expect(stageOf(flow({ cartCount: 1, sealing: true }))).toBe('sealing');
    expect(stageOf(flow(sealed))).toBe('sealed');
    expect(stageOf(flow({ ...sealed, sheetOpen: true }))).toBe('sharing');
    expect(stageOf(flow({ ...sealed, sheetOpen: true, publishing: { nonce: 'a', step: 'proving' } }))).toBe('proving');
    expect(stageOf(flow({ ...sealed, sheetOpen: true, publishing: { nonce: 'a', step: 'signing' } }))).toBe('proving');
    expect(stageOf(flow({ ...sealed, publishing: { nonce: 'a', step: 'sent' } }))).toBe('sent');
    expect(stageOf(flow({ ...sealed, publishing: { nonce: 'a', step: 'aggregated' } }))).toBe('aggregated');
  });

  it('una publicación fallida deja el ticket por compartir', () => {
    expect(stageOf(flow({ ...sealed, sheetOpen: true, publishing: { nonce: 'a', step: 'failed' } }))).toBe('sharing');
  });

  it('una venta nueva empieza de cero aunque la anterior llegara al agregado', () => {
    expect(stageOf(flow({ cartCount: 1, publishing: { nonce: 'a', step: 'aggregated' } }))).toBe('cart');
  });

  it('no mezcla la publicación de otro ticket con el cobrado', () => {
    expect(stageOf(flow({ ...sealed, publishing: { nonce: 'b', step: 'aggregated' } }))).toBe('sealed');
  });
});

describe('etapa alcanzada', () => {
  it('una etapa alcanza las anteriores y a sí misma, no las siguientes', () => {
    expect(reached('sealed', 'cart')).toBe(true);
    expect(reached('sealed', 'sealed')).toBe(true);
    expect(reached('sealed', 'sharing')).toBe(false);
  });
});

describe('ticket esperando en el móvil', () => {
  it('espera desde que se cobra hasta que se abre para publicarlo', () => {
    expect(ticketWaiting(INITIAL_FLOW)).toBe(false);
    expect(ticketWaiting(flow(sealed))).toBe(true);
    expect(ticketWaiting(flow({ ...sealed, sheetOpen: true }))).toBe(false);
  });

  it('deja de esperar en cuanto se publica, aunque se cierre la ventana', () => {
    expect(ticketWaiting(flow({ ...sealed, publishing: { nonce: 'a', step: 'proving' } }))).toBe(false);
  });

  it('la publicación de otro ticket no cuenta', () => {
    expect(ticketWaiting(flow({ ...sealed, publishing: { nonce: 'b', step: 'sent' } }))).toBe(true);
  });
});
