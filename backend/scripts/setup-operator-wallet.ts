/**
 * Paso único, manual: imprime la dirección de la wallet operadora para que
 * la fondees desde el faucet, espera a que llegue el NIGHT y la registra
 * para generación de DUST.
 *
 * Una wallet nueva tiene que escanear TODO el histórico shielded/DUST desde
 * el génesis para saber qué le pertenece, en preprod son ~1.45M índices a
 * ~120/s, es decir HORAS la primera vez (no hay atajo de "altura de
 * nacimiento" en el SDK). Gracias a operatorWallet.ts (startStatePersistence),
 * ese progreso se guarda en disco cada 30s, así que solo hay que pagar este
 * coste una vez: si el proceso se corta a medias, la próxima ejecución
 * retoma donde se quedó en vez de volver a empezar desde cero.
 *
 * Uso: MIDNIGHT_NETWORK=preprod npm run setup-operator-wallet
 */
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { getConfig } from '../src/config.js';
import { getOperatorWallet } from '../src/operatorWallet.js';

const NETWORK = process.env['MIDNIGHT_NETWORK'] ?? 'local';
const FAUCETS: Record<string, string> = {
  preprod: 'https://faucet.preprod.midnight.network/',
  preview: 'https://faucet.preview.midnight.network/',
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(
      () => reject(new Error(`Timeout (${ms / 1000}s) esperando: ${label}. ¿Es MIDNIGHT_NETWORK='${NETWORK}' la red correcta y está accesible?`)),
      ms,
    )),
  ]);
}

async function waitForFunding(wallet: Awaited<ReturnType<typeof getOperatorWallet>>['wallet']): Promise<void> {
  const nightType = ledger.nativeToken().raw;
  for (let i = 0; i < 120; i++) {
    const state = await wallet.unshielded.waitForSyncedState();
    const balance = state.balances[nightType] ?? 0n;
    if (balance > 0n) {
      console.log(`NIGHT recibido: ${balance}`);
      return;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('Timeout esperando NIGHT en la wallet operadora (10 min)');
}

/**
 * El registro de DUST (estimateRegistration/registerNightUtxosForDustGeneration)
 * espera internamente a dust.waitForSyncedState(), que es justo la parte
 * lenta. En vez de un timeout corto que solo confunde, informamos del
 * progreso real cada minuto (con ETA) mientras esperamos, sin límite salvo
 * un backstop de sanidad de 6h.
 */
async function waitForDustSyncWithProgress(wallet: Awaited<ReturnType<typeof getOperatorWallet>>['wallet']): Promise<void> {
  const LOG_EVERY_MS = 60_000;
  let lastIndex = 0n;
  let lastLogTime = Date.now();
  const sub = wallet.dust.state.subscribe((s) => {
    const now = Date.now();
    if (now - lastLogTime < LOG_EVERY_MS) return;
    const p = s.state.progress as { appliedIndex: bigint; highestRelevantWalletIndex: bigint };
    const elapsedS = (now - lastLogTime) / 1000;
    const rate = elapsedS > 0 ? Number(p.appliedIndex - lastIndex) / elapsedS : 0;
    const remaining = Number(p.highestRelevantWalletIndex - p.appliedIndex);
    const etaMin = rate > 0 ? Math.round(remaining / rate / 60) : NaN;
    console.log(`Sync DUST: ${p.appliedIndex}/${p.highestRelevantWalletIndex} (${rate.toFixed(0)} idx/s, ETA ~${Number.isFinite(etaMin) ? etaMin + ' min' : '?'})`);
    lastIndex = p.appliedIndex;
    lastLogTime = now;
  });
  try {
    await withTimeout(wallet.dust.waitForSyncedState(), 6 * 60 * 60 * 1000, 'sincronización DUST (backstop de 6h)');
  } finally {
    sub.unsubscribe();
  }
}

async function main() {
  const config = getConfig();
  const { wallet, unshieldedKeystore, address } = await getOperatorWallet(config);

  console.log(`Red: ${config.networkId}`);
  console.log(`Dirección de la wallet operadora (unshielded): ${address}`);

  const unshieldedState = await withTimeout(wallet.unshielded.waitForSyncedState(), 60_000, 'sincronización unshielded (rápida)');
  const nightType = ledger.nativeToken().raw;
  let balance = unshieldedState.balances[nightType] ?? 0n;

  if (balance === 0n) {
    const faucetUrl = FAUCETS[NETWORK];
    if (!faucetUrl) {
      throw new Error(`Sin NIGHT y sin faucet conocido para la red '${NETWORK}'. Fondéala manualmente.`);
    }
    console.log(`Sin NIGHT todavía. Fondéala en: ${faucetUrl}`);
    console.log('Esperando a que llegue el NIGHT (hasta 10 min)...');
    await waitForFunding(wallet);
  } else {
    console.log(`Ya tiene NIGHT: ${balance}`);
  }

  const nightUtxos = (await wallet.unshielded.waitForSyncedState()).availableCoins;
  if (nightUtxos.length === 0) {
    throw new Error('Balance de NIGHT > 0 pero sin UTXOs disponibles todavía, espera a que sincronice y reintenta.');
  }

  console.log('Esperando sincronización DUST antes de poder registrar (primera vez: puede tardar horas, ver operatorWallet.ts)...');
  await waitForDustSyncWithProgress(wallet);

  const { fee, dustGenerationEstimations } = await wallet.estimateRegistration(nightUtxos);
  console.log(`Fee estimada de registro: ${fee} DUST`);
  console.log(`UTXOs a registrar: ${dustGenerationEstimations.length}`);

  const nightVerifyingKey = unshieldedKeystore.getPublicKey();
  const recipe = await wallet.registerNightUtxosForDustGeneration(
    nightUtxos,
    nightVerifyingKey,
    (payload) => unshieldedKeystore.signData(payload),
  );
  const finalizedTx = await wallet.finalizeRecipe(recipe);
  const txId = await wallet.submitTransaction(finalizedTx);
  console.log(`Transacción de registro enviada: ${txId}`);

  console.log('Esperando a que empiece a acumularse DUST...');
  await new Promise((r) => setTimeout(r, 15000));
  const dustBalance = (await wallet.dust.waitForSyncedState()).balance(new Date());
  console.log(`Balance de DUST: ${dustBalance}`);

  await wallet.stop();
  // wallet.stop() no libera todos los handles internos del SDK (se vio en
  // vivo: el proceso siguió corriendo >1h después de esta línea, comiendo
  // CPU). Forzamos la salida en vez de confiar en que el event loop se vacíe.
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
