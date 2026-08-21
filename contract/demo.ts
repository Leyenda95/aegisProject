/**
 * Primera transacción reproducible de Aegis, end-to-end, en el simulador.
 *
 *   npm run demo          (desde contract/)
 *
 * No necesita nodo, indexer ni proof server: todo corre en memoria.
 */
import { Subcategory } from './managed/aegis/contract/index.js';
import { AegisSimulator } from './simulator.js';

const line = (s = '') => console.log(s);

line('=== Aegis · demo end-to-end (simulador) ===');
line();

const sim = new AegisSimulator();
line('1) Contrato desplegado en el simulador');
line(`   dirección: ${sim.contractAddress}`);
line();

sim.submitPurchase(Subcategory.mobile);
line('2) submitPurchase(Subcategory.mobile)');
line(`   totalSignals       = ${sim.ledger.totalSignals}`);
line(`   signalsElectronics = ${sim.ledger.signalsElectronics}`);
line(`   signalsMobile      = ${sim.ledger.signalsMobile}`);
line();

sim.submitPurchase(Subcategory.restaurant);
line('3) submitPurchase(Subcategory.restaurant)');
line(`   totalSignals   = ${sim.ledger.totalSignals}`);
line(`   signalsFood       = ${sim.ledger.signalsFood}`);
line(`   signalsRestaurant = ${sim.ledger.signalsRestaurant}`);
line();

const campaignId = sim.registerCampaign();
line('4) registerCampaign()');
line(`   id devuelto    = ${campaignId}`);
line(`   campaignCount  = ${sim.ledger.campaignCount}`);
line();

sim.seed({ initMobile: 10n, totalElectronics: 10n, grandTotal: 10n });
line('5) seed(...) — solo se puede llamar una vez');
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
line('6) Reintentar seed(...) tras ya haber sembrado');
line(`   -> ${seedError.split('\n')[0]}`);
line();

line('=== Estado público final ===');
line(`   totalSignals  = ${sim.ledger.totalSignals}`);
line(`   campaignCount = ${sim.ledger.campaignCount}`);
line(`   isSeeded      = ${sim.ledger.isSeeded}`);
