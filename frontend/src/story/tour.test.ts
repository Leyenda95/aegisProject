import { describe, expect, it } from 'vitest';
import { advanceDelay, advancesOn, blocksNext, focusState, isDone, parseStep, parseTourPath, revealOptions, TOURS, type TourFacts, type TourStep } from './tour.ts';

const TOUR: readonly TourStep[] = TOURS.tour;

const step = (patch: Partial<TourStep>): TourStep => ({ id: 'store', view: 'demo', side: 'store', focus: [], art: 'registry', ...patch });

describe('resaltado del tour', () => {
  it('sin foco no apaga nada: se ve la demo tal cual', () => {
    expect(focusState(step({ focus: [] }), 'phone')).toBeUndefined();
  });

  it('resalta lo que toca y apaga lo demás', () => {
    const s = step({ focus: ['phone'] });
    expect(focusState(s, 'phone')).toBe('selected');
    expect(focusState(s, 'ribbon')).toBe('muted');
  });

  it('con el foco en una parte de la caja, la caja no se apaga pero sí su otra parte', () => {
    const s = step({ focus: ['catalog'] });
    expect(focusState(s, 'catalog')).toBe('selected');
    expect(focusState(s, 'pos')).toBeUndefined();
    expect(focusState(s, 'basket')).toBe('muted');
  });

  it('con el foco en la caja entera, sus partes van con ella', () => {
    const s = step({ focus: ['pos'] });
    expect(focusState(s, 'pos')).toBe('selected');
    expect(focusState(s, 'catalog')).toBeUndefined();
  });

  it('el registro y el recibo son partes de la caja', () => {
    expect(focusState(step({ focus: ['registry'] }), 'pos')).toBeUndefined();
    expect(focusState(step({ focus: ['receipt'] }), 'pos')).toBeUndefined();
    expect(focusState(step({ focus: ['receipt'] }), 'registry')).toBe('muted');
  });

  it('con el foco en la wallet de la cabecera, la demo entera se apaga', () => {
    const s = step({ focus: ['wallet'] });
    expect(focusState(s, 'wallet')).toBe('selected');
    expect(focusState(s, 'pos')).toBe('muted');
  });
});

const facts = (patch: Partial<TourFacts>): TourFacts => ({ stage: 'shop', wallet: false, storeChecked: false, ...patch });

describe('avance automático', () => {
  const charge = step({ waitFor: 'sealed' });

  it('avanza cuando la demo llega a lo que el paso pide', () => {
    expect(advancesOn(charge, facts({ stage: 'sealing' }), facts({ stage: 'sealed' }))).toBe(true);
  });

  it('no avanza en un paso sin acción', () => {
    expect(advancesOn(step({}), facts({ stage: 'cart' }), facts({ stage: 'sealed' }))).toBe(false);
  });

  it('no avanza si la demo aún no ha llegado', () => {
    expect(advancesOn(charge, facts({ stage: 'cart' }), facts({ stage: 'sealing' }))).toBe(false);
  });

  it('no avanza sin cambio: volver atrás a un paso ya hecho no rebota', () => {
    expect(advancesOn(charge, facts({ stage: 'sealed' }), facts({ stage: 'sealed' }))).toBe(false);
  });

  it('no avanza si el paso ya estaba hecho antes del cambio', () => {
    expect(advancesOn(charge, facts({ stage: 'sealed' }), facts({ stage: 'sharing' }))).toBe(false);
  });

  it('avanza aunque la demo se salte etapas', () => {
    expect(advancesOn(step({ waitFor: 'cart' }), facts({ stage: 'shop' }), facts({ stage: 'sealing' }))).toBe(true);
  });

  it('avanza al conectar la wallet', () => {
    const wallet = step({ waitFor: 'wallet', optional: true });
    expect(advancesOn(wallet, facts({}), facts({ wallet: true }))).toBe(true);
    expect(advancesOn(wallet, facts({}), facts({ stage: 'cart' }))).toBe(false);
  });

  it('avanza al comprobar que la tienda está registrada', () => {
    const registry = step({ waitFor: 'storeChecked' });
    expect(advancesOn(registry, facts({}), facts({ storeChecked: true }))).toBe(true);
    expect(advancesOn(registry, facts({}), facts({ stage: 'cart' }))).toBe(false);
  });
});

describe('«Siguiente» bloqueado', () => {
  it('un paso con acción lo bloquea hasta que se hace', () => {
    expect(blocksNext(step({ waitFor: 'sealed' }), facts({ stage: 'cart' }))).toBe(true);
    expect(blocksNext(step({ waitFor: 'sealed' }), facts({ stage: 'sealed' }))).toBe(false);
  });

  it('una acción opcional no lo bloquea nunca', () => {
    expect(blocksNext(step({ waitFor: 'wallet', optional: true }), facts({}))).toBe(false);
  });

  it('un paso sin acción tampoco', () => {
    expect(blocksNext(step({}), facts({}))).toBe(false);
  });
});

describe('la prueba, en marcha', () => {
  it('no espera a que la señal llegue al agregado: avanza unos segundos después de enviarla', () => {
    const publish = TOUR.find(s => s.id === 'publish')!;
    expect(publish.waitFor).toBe('sent');
    expect(blocksNext(publish, facts({ stage: 'proving' }))).toBe(false);
    expect(advanceDelay(publish)).toBeGreaterThanOrEqual(2000);
  });
});

describe('espera antes de avanzar', () => {
  it('tras comprobar el registro espera, para que se vea la insignia de verificado', () => {
    expect(advanceDelay(step({ waitFor: 'storeChecked' }))).toBeGreaterThanOrEqual(1500);
  });

  it('en el resto de pasos con acción avanza al momento', () => {
    expect(advanceDelay(step({ waitFor: 'sealed' }))).toBe(0);
    expect(advanceDelay(step({}))).toBe(0);
  });
});

describe('paso hecho', () => {
  it('un paso sin acción nunca está hecho', () => {
    expect(isDone(step({}), facts({ stage: 'aggregated', storeChecked: true }))).toBe(false);
  });

  it('con la tienda comprobada, el paso del registro está hecho', () => {
    expect(isDone(step({ waitFor: 'storeChecked' }), facts({ storeChecked: true }))).toBe(true);
    expect(isDone(step({ waitFor: 'storeChecked' }), facts({}))).toBe(false);
  });
});

describe('paso del tour en la URL', () => {
  it('acepta del 1 al último', () => {
    expect(parseStep('tour', '1')).toBe(1);
    expect(parseStep('tour', String(TOUR.length))).toBe(TOUR.length);
  });

  it('rechaza lo que no es un paso', () => {
    for (const bad of [undefined, '', '0', String(TOUR.length + 1), '2.5', 'abc', '-1']) {
      expect(parseStep('tour', bad)).toBeNull();
    }
  });
});

describe('tour de la ruta', () => {
  it('reconoce el tour y su paso', () => {
    expect(parseTourPath('/tour/3')).toEqual({ tour: 'tour', index: 3 });
  });

  it('sin paso válido, sabe que es el tour pero no el paso', () => {
    expect(parseTourPath('/tour')).toEqual({ tour: 'tour', index: null });
    expect(parseTourPath('/tour/99')).toEqual({ tour: 'tour', index: null });
  });

  it('otras rutas no son del tour', () => {
    for (const path of ['/', '/demo', '/intro/1', '/tourx/1', '/tour/1/2']) {
      expect(parseTourPath(path)).toBeNull();
    }
  });
});

describe('poner a la vista lo resaltado', () => {
  it('lo que ya se ve entero no se mueve', () => {
    expect(revealOptions({ top: 200, bottom: 500 }, { top: 80, bottom: 800 }, false)).toBeNull();
  });

  it('lo que no cabe y ya empieza arriba no se mueve', () => {
    expect(revealOptions({ top: 150, bottom: 1500 }, { top: 80, bottom: 800 }, false)).toBeNull();
  });

  it('lo que no cabe y empieza abajo sí sube', () => {
    expect(revealOptions({ top: 600, bottom: 1900 }, { top: 80, bottom: 800 }, false)?.block).toBe('start');
  });

  it('lo que asoma solo en parte sí se pone a la vista', () => {
    expect(revealOptions({ top: 600, bottom: 900 }, { top: 80, bottom: 800 }, false)).not.toBeNull();
    expect(revealOptions({ top: 40, bottom: 300 }, { top: 80, bottom: 800 }, false)).not.toBeNull();
  });

  it('centra lo que cabe en pantalla', () => {
    expect(revealOptions({ top: 900, bottom: 1200 }, { top: 0, bottom: 800 }, false)).toEqual({ block: 'center', behavior: 'smooth' });
  });

  it('lo que no cabe se enseña desde su principio', () => {
    expect(revealOptions({ top: 900, bottom: 1600 }, { top: 0, bottom: 800 }, false)?.block).toBe('start');
  });

  it('lo que ocupa justo el 80 % de la pantalla ya no se centra', () => {
    expect(revealOptions({ top: 900, bottom: 1540 }, { top: 0, bottom: 800 }, false)?.block).toBe('start');
    expect(revealOptions({ top: 900, bottom: 1539 }, { top: 0, bottom: 800 }, false)?.block).toBe('center');
  });

  it('con movimiento reducido salta sin animación', () => {
    expect(revealOptions({ top: 900, bottom: 1200 }, { top: 0, bottom: 800 }, true)?.behavior).toBe('auto');
  });
});

describe('el recorrido del tour', () => {
  it('empieza por la wallet: al conectarla avanza, pero no la exige porque Aegis patrocina', () => {
    expect(TOUR[0].focus).toEqual(['wallet']);
    expect(TOUR[0].waitFor).toBe('wallet');
    expect(blocksNext(TOUR[0], facts({}))).toBe(false);
  });

  it('tras cobrar enseña el recibo antes de ir al móvil', () => {
    const charge = TOUR.findIndex(s => s.waitFor === 'sealed');
    expect(TOUR[charge + 1].focus).toEqual(['receipt']);
  });

  it('tras la wallet enseña la cinta de contadores, antes de comprar', () => {
    expect(TOUR[1].focus).toEqual(['ribbon']);
  });

  it('tras enviar la señal, enseña el mercado', () => {
    const publish = TOUR.findIndex(s => s.waitFor === 'sent');
    expect(TOUR[publish + 1].view).toBe('market');
  });
});
