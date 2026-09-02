import { describe, expect, it } from 'vitest';
import { Subcategory } from '../managed/aegis/contract/index.js';
import { AegisSimulator, makeReceipt, makeMultiReceipt } from '../simulator.js';

const ADMIN_KEY = new Uint8Array(32).fill(1);
const STORE_KEY = new Uint8Array(32).fill(2);
const OTHER_KEY = new Uint8Array(32).fill(3);

/** Deja el simulador con una tienda registrada, lista para atestiguar recibos. */
function withRegisteredStore(): AegisSimulator {
  const sim = new AegisSimulator(ADMIN_KEY);
  const storePk = AegisSimulator.storePublicKey(STORE_KEY);
  sim.actingAs(ADMIN_KEY);
  sim.registerStore(storePk);
  return sim;
}

/** Sella un recibo con la tienda ya registrada y lo deja listo para submitPurchase(). */
function sealReceipt(sim: AegisSimulator, subcategory: Subcategory, amount = 1000n, timestamp = 1n) {
  const receipt = makeReceipt(subcategory, amount, timestamp);
  const commitment = AegisSimulator.receiptCommitment(receipt);
  sim.actingAs(STORE_KEY);
  sim.attestReceipt(commitment);
  sim.holdingReceipt(receipt);
  return receipt;
}

describe('registerStore', () => {
  it('el admin puede dar de alta una tienda', () => {
    const sim = new AegisSimulator(ADMIN_KEY);
    const storePk = AegisSimulator.storePublicKey(STORE_KEY);
    sim.actingAs(ADMIN_KEY);
    expect(() => sim.registerStore(storePk)).not.toThrow();
  });

  it('rechaza el alta si quien llama no es el admin', () => {
    const sim = new AegisSimulator(ADMIN_KEY);
    const storePk = AegisSimulator.storePublicKey(STORE_KEY);
    sim.actingAs(OTHER_KEY);
    expect(() => sim.registerStore(storePk)).toThrow(/Not admin/);
  });
});

describe('attestReceipt', () => {
  it('una tienda registrada puede sellar el compromiso de un recibo', () => {
    const sim = withRegisteredStore();
    const receipt = makeReceipt(Subcategory.mobile, 500n, 1n);
    const commitment = AegisSimulator.receiptCommitment(receipt);
    sim.actingAs(STORE_KEY);
    expect(() => sim.attestReceipt(commitment)).not.toThrow();
  });

  it('rechaza a una tienda no registrada', () => {
    const sim = new AegisSimulator(ADMIN_KEY); // sin dar de alta ninguna tienda
    const receipt = makeReceipt(Subcategory.mobile, 500n, 1n);
    const commitment = AegisSimulator.receiptCommitment(receipt);
    sim.actingAs(STORE_KEY);
    // El witness getStorePath corta aquí mismo, antes incluso de que el
    // circuito llegue a su propio assert, no hay ruta Merkle que ofrecer
    // para una hoja que nunca se insertó en el árbol.
    expect(() => sim.attestReceipt(commitment)).toThrow(/Store not registered in the Merkle tree/);
  });
});

describe('submitPurchase', () => {
  it('incrementa categoría, subcategoría y total con un recibo sellado', () => {
    const sim = withRegisteredStore();
    sealReceipt(sim, Subcategory.restaurant);
    sim.submitPurchase();

    expect(sim.ledger.totalSignals).toBe(1n);
    expect(sim.ledger.signalsFood).toBe(1n);
    expect(sim.ledger.signalsRestaurant).toBe(1n);
    expect(sim.ledger.signalsElectronics).toBe(0n);
  });

  it('rechaza un recibo que ninguna tienda ha sellado', () => {
    const sim = withRegisteredStore();
    const receipt = makeReceipt(Subcategory.mobile, 500n, 1n);
    sim.holdingReceipt(receipt); // nunca se llamó a attestReceipt con su commitment
    expect(() => sim.submitPurchase()).toThrow(/Receipt not attested/);
  });

  it('rechaza reutilizar el mismo recibo dos veces', () => {
    const sim = withRegisteredStore();
    sealReceipt(sim, Subcategory.mobile);
    sim.submitPurchase();
    expect(() => sim.submitPurchase()).toThrow(/Receipt already used/);
  });

  it.each([
    [Subcategory.mobile, 'signalsElectronics', 'signalsMobile'],
    [Subcategory.outerwear, 'signalsFashion', 'signalsOuterwear'],
    [Subcategory.snacks, 'signalsFood', 'signalsSnacks'],
    [Subcategory.supplements, 'signalsSports', 'signalsSupplements'],
    [Subcategory.tools, 'signalsHome', 'signalsTools'],
  ] as const)('mapea %s a sus dos contadores', (subcategory, category, sub) => {
    const sim = withRegisteredStore();
    sealReceipt(sim, subcategory);
    sim.submitPurchase();
    expect(sim.ledger[category]).toBe(1n);
    expect(sim.ledger[sub]).toBe(1n);
  });

  it('la subcategoría `other` solo toca el contador de esa categoría', () => {
    const sim = withRegisteredStore();
    sealReceipt(sim, Subcategory.other);
    sim.submitPurchase();
    expect(sim.ledger.signalsOther).toBe(1n);
    expect(sim.ledger.totalSignals).toBe(1n);
  });

  it('varias señales de recibos distintos se acumulan', () => {
    const sim = withRegisteredStore();

    sealReceipt(sim, Subcategory.mobile, 100n, 1n);
    sim.submitPurchase();
    sealReceipt(sim, Subcategory.mobile, 200n, 2n);
    sim.submitPurchase();
    sealReceipt(sim, Subcategory.tablet, 300n, 3n);
    sim.submitPurchase();

    expect(sim.ledger.signalsElectronics).toBe(3n);
    expect(sim.ledger.signalsMobile).toBe(2n);
    expect(sim.ledger.signalsTablet).toBe(1n);
    expect(sim.ledger.totalSignals).toBe(3n);
  });

  it('un recibo con varias subcategorías señala cada una por sus unidades (rollup)', () => {
    const sim = withRegisteredStore();
    const receipt = makeMultiReceipt([
      { subcategory: Subcategory.tops, qty: 15n, amount: 28500n },
      { subcategory: Subcategory.bottoms, qty: 5n, amount: 29500n },
    ], 1n);
    const commitment = AegisSimulator.receiptCommitment(receipt);
    sim.actingAs(STORE_KEY);
    sim.attestReceipt(commitment);
    sim.holdingReceipt(receipt);
    sim.submitPurchase();

    expect(sim.ledger.signalsTops).toBe(15n);
    expect(sim.ledger.signalsBottoms).toBe(5n);
    expect(sim.ledger.signalsFashion).toBe(20n);
    expect(sim.ledger.totalSignals).toBe(20n);
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
    const sim = withRegisteredStore();
    sealReceipt(sim, Subcategory.mobile, 100n, 1n);
    sim.submitPurchase();
    sim.seed({ initTablet: 2n, totalElectronics: 2n, grandTotal: 2n });
    sealReceipt(sim, Subcategory.tablet, 200n, 2n);
    sim.submitPurchase();

    expect(sim.ledger.signalsMobile).toBe(1n);
    expect(sim.ledger.signalsTablet).toBe(3n);
    expect(sim.ledger.signalsElectronics).toBe(1n + 2n + 1n);
    expect(sim.ledger.totalSignals).toBe(1n + 2n + 1n);
  });
});
