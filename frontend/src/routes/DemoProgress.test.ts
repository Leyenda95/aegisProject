import { describe, expect, it } from 'vitest';
import { progressOf } from './DemoProgress.tsx';
import { INITIAL_FLOW, type DemoFlow } from './demoFlow.ts';

const flow = (patch: Partial<DemoFlow>): DemoFlow => ({ ...INITIAL_FLOW, ...patch });
const publishing = (nonce: string, step: NonNullable<DemoFlow['publishing']>['step']) => ({ publishing: { nonce, step } });

describe('línea de progreso de la demo', () => {
  it('empieza en la compra', () => {
    expect(progressOf(INITIAL_FLOW)).toEqual({ done: 0, busy: false, hint: 'shop' });
  });

  it('con algo en la cesta, toca cobrar', () => {
    expect(progressOf(flow({ cartCount: 2 }))).toEqual({ done: 1, busy: false, hint: 'seal' });
  });

  it('mientras se sella, el paso de sellar está en marcha', () => {
    expect(progressOf(flow({ cartCount: 2, sealing: true }))).toEqual({ done: 1, busy: true, hint: 'sealing' });
  });

  it('con el ticket cobrado, o con la ventana de publicar abierta, toca elegir qué compartir', () => {
    expect(progressOf(flow({ cartCount: 2, sealedNonce: 'a' }))).toEqual({ done: 3, busy: false, hint: 'share' });
    expect(progressOf(flow({ cartCount: 2, sealedNonce: 'a', sheetOpen: true }))).toEqual({ done: 3, busy: false, hint: 'share' });
    expect(progressOf(flow({ sheetOpen: true }))).toEqual({ done: 3, busy: false, hint: 'share' });
  });

  it('sigue la publicación del ticket cobrado hasta el agregado', () => {
    const sealed = { cartCount: 2, sealedNonce: 'a', sheetOpen: true };
    expect(progressOf(flow({ ...sealed, ...publishing('a', 'proving') }))).toEqual({ done: 4, busy: true, hint: 'publishing' });
    expect(progressOf(flow({ ...sealed, ...publishing('a', 'signing') }))).toEqual({ done: 4, busy: true, hint: 'publishing' });
    expect(progressOf(flow({ ...sealed, ...publishing('a', 'sent') }))).toEqual({ done: 5, busy: true, hint: 'aggregating' });
    expect(progressOf(flow({ ...sealed, ...publishing('a', 'aggregated') }))).toEqual({ done: 6, busy: false, hint: 'done' });
  });

  it('una publicación fallida vuelve a elegir qué compartir', () => {
    expect(progressOf(flow({ cartCount: 2, sealedNonce: 'a', sheetOpen: true, ...publishing('a', 'failed') })))
      .toEqual({ done: 3, busy: false, hint: 'share' });
  });

  it('no cuenta la publicación de otro ticket mientras hay uno cobrado', () => {
    expect(progressOf(flow({ cartCount: 2, sealedNonce: 'a', ...publishing('b', 'aggregated') })))
      .toEqual({ done: 3, busy: false, hint: 'share' });
  });

  it('una venta nueva deja atrás la publicación anterior', () => {
    expect(progressOf(flow({ cartCount: 1, ...publishing('a', 'aggregated') })))
      .toEqual({ done: 1, busy: false, hint: 'seal' });
  });

  it('cuenta la publicación de un ticket anterior si no hay venta en curso', () => {
    expect(progressOf(flow({ ...publishing('b', 'proving') }))).toEqual({ done: 4, busy: true, hint: 'publishing' });
  });
});
