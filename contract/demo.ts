/**
 * Primera transacción reproducible de Aegis, end-to-end, en el simulador.
 *
 *   npm run demo          (desde contract/)
 *
 * No necesita nodo, indexer ni proof server: todo corre en memoria.
 */
import { Subcategory } from './managed/aegis/contract/index.js';
import { AegisSimulator, makeReceipt } from './simulator.js';

const line = (s = '') => console.log(s);

const ADMIN_KEY = new Uint8Array(32).fill(1);
const STORE_KEY = new Uint8Array(32).fill(2);

line('=== Aegis · demo end-to-end (simulador) ===');
line();

const sim = new AegisSimulator(ADMIN_KEY);
line('1) Contrato desplegado en el simulador');
line(`   dirección: ${sim.contractAddress}`);
line();

const storePk = AegisSimulator.storePublicKey(STORE_KEY);
sim.actingAs(ADMIN_KEY);
sim.registerStore(storePk);
line('2) registerStore(storePk) — el admin da de alta una tienda');
line();

const receipt = makeReceipt(Subcategory.mobile, 89999n, 1n);
const commitment = AegisSimulator.receiptCommitment(receipt);
sim.actingAs(STORE_KEY);
sim.attestReceipt(commitment);
line('3) attestReceipt(commitment) — la tienda sella un recibo sin decir cuál es');
line('   (demuestra pertenencia al árbol de tiendas, no revela cuál de ellas es)');
line();

sim.holdingReceipt(receipt);
sim.submitPurchase();
line('4) submitPurchase() — el usuario envía el recibo ya sellado como señal');
line(`   totalSignals       = ${sim.ledger.totalSignals}`);
line(`   signalsElectronics = ${sim.ledger.signalsElectronics}`);
line(`   signalsMobile      = ${sim.ledger.signalsMobile}`);
line();

let reuseError = 'no falló (!)';
try {
  sim.submitPurchase();
} catch (error) {
  reuseError = error instanceof Error ? error.message : String(error);
}
line('5) Reintentar submitPurchase() con el mismo recibo');
line(`   -> ${reuseError.split('\n')[0]}`);
line();

const receipt2 = makeReceipt(Subcategory.restaurant, 4250n, 2n);
const commitment2 = AegisSimulator.receiptCommitment(receipt2);
sim.actingAs(STORE_KEY);
sim.attestReceipt(commitment2);
sim.holdingReceipt(receipt2);
sim.submitPurchase();
line('6) Segundo recibo, sellado y enviado');
line(`   totalSignals   = ${sim.ledger.totalSignals}`);
line(`   signalsFood       = ${sim.ledger.signalsFood}`);
line(`   signalsRestaurant = ${sim.ledger.signalsRestaurant}`);
line();

const campaignId = sim.registerCampaign();
line('7) registerCampaign()');
line(`   id devuelto    = ${campaignId}`);
line(`   campaignCount  = ${sim.ledger.campaignCount}`);
line();

sim.seed({ initMobile: 10n, totalElectronics: 10n, grandTotal: 10n });
line('8) seed(...) — solo se puede llamar una vez');
line(`   isSeeded           = ${sim.ledger.isSeeded}`);
line(`   signalsMobile      = ${sim.ledger.signalsMobile}`);
line(`   signalsElectronics = ${sim.ledger.signalsElectronics}`);
line(`   totalSignals       = ${sim.ledger.totalSignals}`);
line();

let seedError = 'no falló (!)';
try {
  sim.seed();
} catch (error) {
  seedError = error instanceof Error ? error.message : String(error);
}
line('9) Reintentar seed(...) tras ya haber sembrado');
line(`   -> ${seedError.split('\n')[0]}`);
line();

line('=== Estado público final ===');
line(`   totalSignals  = ${sim.ledger.totalSignals}`);
line(`   campaignCount = ${sim.ledger.campaignCount}`);
line(`   isSeeded      = ${sim.ledger.isSeeded}`);
