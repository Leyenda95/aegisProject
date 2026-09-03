/**
 * Simulador local del contrato Aegis.
 *
 * Ejecuta los circuitos con el runtime de Compact contra un estado en memoria,
 * sin nodo, sin indexer y sin proof server.
 */
import {
  type CircuitContext,
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  type Ledger,
  ledger,
  pureCircuits,
  type Receipt,
  type Subcategory,
} from './managed/aegis/contract/index.js';
import { type AegisPrivateState, emptyPrivateState, witnesses } from './witnesses.js';

export class AegisSimulator {
  readonly contract: Contract<AegisPrivateState>;
  readonly contractAddress: string;
  private circuitContext: CircuitContext<AegisPrivateState>;

  constructor(adminSecretKey: Uint8Array = new Uint8Array(32).fill(1), contractAddress: string = sampleContractAddress()) {
    this.contract = new Contract<AegisPrivateState>(witnesses);
    this.contractAddress = contractAddress;

    const coinPublicKey = '0'.repeat(64);
    const initial = this.contract.initialState(
      createConstructorContext({ ...emptyPrivateState, secretKey: adminSecretKey }, coinPublicKey),
    );
    this.circuitContext = createCircuitContext(
      contractAddress,
      initial.currentZswapLocalState,
      initial.currentContractState,
      initial.currentPrivateState,
    );
  }

  /** Estado público actual, tipado. */
  get ledger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  /** Hash público de una clave secreta de tienda/admin, cálculo local, sin transacción. */
  static storePublicKey(secretKey: Uint8Array): Uint8Array {
    return pureCircuits.storePublicKey(secretKey);
  }

  /** Compromiso de un recibo, cálculo local, sin transacción. */
  static receiptCommitment(receipt: Receipt): Uint8Array {
    return pureCircuits.receiptCommitment(receipt);
  }

  /** Cambia qué clave secreta usan los siguientes circuitos que la requieran (admin o tienda). */
  actingAs(secretKey: Uint8Array): void {
    this.circuitContext.currentPrivateState = {
      ...this.circuitContext.currentPrivateState,
      secretKey,
    };
  }

  /** Deja preparado el recibo que leerá el siguiente submitPurchase(). */
  holdingReceipt(receipt: Receipt | null): void {
    this.circuitContext.currentPrivateState = {
      ...this.circuitContext.currentPrivateState,
      receipt,
    };
  }

  registerStore(storePk: Uint8Array): void {
    const result = this.contract.impureCircuits.registerStore(this.circuitContext, storePk);
    this.circuitContext = result.context;
  }

  attestReceipt(commitment: Uint8Array): void {
    const result = this.contract.impureCircuits.attestReceipt(this.circuitContext, commitment);
    this.circuitContext = result.context;
  }

  submitPurchase(): void {
    const result = this.contract.impureCircuits.submitPurchase(this.circuitContext);
    this.circuitContext = result.context;
  }

  seed(counts: {
    initMobile?: bigint; initTablet?: bigint; initComputer?: bigint;
    initCamera?: bigint; initAudio?: bigint; initGaming?: bigint;
    initShoes?: bigint; initTops?: bigint; initBottoms?: bigint;
    initAccessories?: bigint; initOuterwear?: bigint;
    initGroceries?: bigint; initRestaurant?: bigint; initCafes?: bigint; initFastfood?: bigint; initLocalshops?: bigint;
    initEquipment?: bigint; initClothing?: bigint; initFootwear?: bigint; initSupplements?: bigint;
    initFurniture?: bigint; initAppliances?: bigint; initDecor?: bigint; initTools?: bigint;
    initOther?: bigint;
    totalElectronics?: bigint; totalFashion?: bigint; totalFood?: bigint;
    totalSports?: bigint; totalHome?: bigint;
    grandTotal?: bigint;
  } = {}): void {
    const z = 0n;
    const result = this.contract.impureCircuits.seed(
      this.circuitContext,
      counts.initMobile ?? z, counts.initTablet ?? z, counts.initComputer ?? z,
      counts.initCamera ?? z, counts.initAudio ?? z, counts.initGaming ?? z,
      counts.initShoes ?? z, counts.initTops ?? z, counts.initBottoms ?? z,
      counts.initAccessories ?? z, counts.initOuterwear ?? z,
      counts.initGroceries ?? z, counts.initRestaurant ?? z, counts.initCafes ?? z, counts.initFastfood ?? z, counts.initLocalshops ?? z,
      counts.initEquipment ?? z, counts.initClothing ?? z, counts.initFootwear ?? z, counts.initSupplements ?? z,
      counts.initFurniture ?? z, counts.initAppliances ?? z, counts.initDecor ?? z, counts.initTools ?? z,
      counts.initOther ?? z,
      counts.totalElectronics ?? z, counts.totalFashion ?? z, counts.totalFood ?? z,
      counts.totalSports ?? z, counts.totalHome ?? z,
      counts.grandTotal ?? z,
    );
    this.circuitContext = result.context;
  }

  registerCampaign(): bigint {
    const result = this.contract.impureCircuits.registerCampaign(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }
}

const MAX_LINES = 8;

export type ReceiptLineInput = { subcategory: Subcategory; qty: bigint; amount: bigint };

function padLines(active: ReceiptLineInput[]): Receipt['lines'] {
  const zeroSub = 0 as unknown as Subcategory; // relleno: enum 0, se ignora porque i >= lineCount
  const out = active.slice(0, MAX_LINES).map(l => ({ subcategory: l.subcategory, qty: l.qty, amount: l.amount }));
  while (out.length < MAX_LINES) out.push({ subcategory: zeroSub, qty: 0n, amount: 0n });
  return out;
}

/** Recibo de una sola subcategoría (qty 1), atajo para los tests que solo comprueban el mapeo a contadores. */
export function makeReceipt(subcategory: Subcategory, amount: bigint, timestamp: bigint, nonce?: Uint8Array): Receipt {
  return makeMultiReceipt([{ subcategory, qty: 1n, amount }], timestamp, nonce);
}

/** Recibo con varias subcategorías (rollup), hasta 8 líneas. */
export function makeMultiReceipt(lines: ReceiptLineInput[], timestamp: bigint, nonce?: Uint8Array): Receipt {
  const active = lines.slice(0, MAX_LINES);
  return {
    lines: padLines(active),
    lineCount: BigInt(active.length),
    timestamp,
    nonce: nonce ?? crypto.getRandomValues(new Uint8Array(32)),
  };
}
