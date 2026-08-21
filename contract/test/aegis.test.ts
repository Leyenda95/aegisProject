import { describe, expect, it } from 'vitest';
import { Subcategory } from '../managed/aegis/contract/index.js';
import { AegisSimulator } from '../simulator.js';

describe('submitPurchase', () => {
  it('incrementa categoría, subcategoría y total', () => {
    const sim = new AegisSimulator();
    sim.submitPurchase(Subcategory.restaurant);

    expect(sim.ledger.totalSignals).toBe(1n);
    expect(sim.ledger.signalsFood).toBe(1n);
    expect(sim.ledger.signalsRestaurant).toBe(1n);
    expect(sim.ledger.signalsElectronics).toBe(0n);
  });

  it.each([
    [Subcategory.mobile, 'signalsElectronics', 'signalsMobile'],
    [Subcategory.outerwear, 'signalsFashion', 'signalsOuterwear'],
    [Subcategory.snacks, 'signalsFood', 'signalsSnacks'],
    [Subcategory.supplements, 'signalsSports', 'signalsSupplements'],
    [Subcategory.tools, 'signalsHome', 'signalsTools'],
  ] as const)('mapea %s a sus dos contadores', (subcategory, category, sub) => {
    const sim = new AegisSimulator();
    sim.submitPurchase(subcategory);
    expect(sim.ledger[category]).toBe(1n);
    expect(sim.ledger[sub]).toBe(1n);
  });

  it('la subcategoría `other` solo toca el contador de esa categoría', () => {
    const sim = new AegisSimulator();
    sim.submitPurchase(Subcategory.other);
    expect(sim.ledger.signalsOther).toBe(1n);
    expect(sim.ledger.totalSignals).toBe(1n);
  });

  it('varias señales se acumulan', () => {
    const sim = new AegisSimulator();
    sim.submitPurchase(Subcategory.mobile);
    sim.submitPurchase(Subcategory.mobile);
    sim.submitPurchase(Subcategory.tablet);
    expect(sim.ledger.signalsElectronics).toBe(3n);
    expect(sim.ledger.signalsMobile).toBe(2n);
    expect(sim.ledger.signalsTablet).toBe(1n);
    expect(sim.ledger.totalSignals).toBe(3n);
  });
});

describe('registerCampaign', () => {
  it('devuelve ids incrementales y actualiza el contador', () => {
    const sim = new AegisSimulator();
    expect(sim.registerCampaign()).toBe(0n);
    expect(sim.registerCampaign()).toBe(1n);
    expect(sim.registerCampaign()).toBe(2n);
    expect(sim.ledger.campaignCount).toBe(3n);
  });
});

describe('seed', () => {
  it('inicializa los contadores solo la primera vez', () => {
    const sim = new AegisSimulator();
    sim.seed({ initMobile: 5n, totalElectronics: 5n, grandTotal: 5n });

    expect(sim.ledger.signalsMobile).toBe(5n);
    expect(sim.ledger.signalsElectronics).toBe(5n);
    expect(sim.ledger.totalSignals).toBe(5n);
    expect(sim.ledger.isSeeded).toBe(1n);
  });

  it('rechaza sembrar dos veces', () => {
    const sim = new AegisSimulator();
    sim.seed();
    expect(() => sim.seed()).toThrow(/Already seeded/);
  });

  it('convive con señales enviadas antes o después', () => {
    const sim = new AegisSimulator();
    sim.submitPurchase(Subcategory.mobile);
    sim.seed({ initTablet: 2n, totalElectronics: 2n, grandTotal: 2n });
    sim.submitPurchase(Subcategory.tablet);

    expect(sim.ledger.signalsMobile).toBe(1n);
    expect(sim.ledger.signalsTablet).toBe(3n);
    expect(sim.ledger.signalsElectronics).toBe(1n + 2n + 1n);
    expect(sim.ledger.totalSignals).toBe(1n + 2n + 1n);
  });
});
