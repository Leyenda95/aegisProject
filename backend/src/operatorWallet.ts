/**
 * Wallet propia del backend ("operadora"): paga y envía las transacciones
 * de registerStore/attestReceipt. No sustituye ninguna autorización, el
 * secreto de admin/tienda ya vive en contract.ts (getAdminKey/getStoreKey)
 * y la prueba ZK ya se genera con él antes de llegar aquí. Esta wallet
 * solo balancea DUST, firma el envío y lo somete a la red, en un único
 * paso (no hay una segunda parte a la que proteger, como en el patrón de
 * "DUST sponsorship" de la documentación de Midnight).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import WebSocket from 'ws';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import {
  HDWallet, Roles, generateRandomSeed,
  createKeystore, PublicKey as UnshieldedPublicKey, type UnshieldedKeystore,
  WalletFacade, WalletEntrySchema, type DefaultConfiguration,
  ShieldedWallet, UnshieldedWallet, DustWallet,
  InMemoryTransactionHistoryStorage,
  // El paquete con guion (@midnight-ntwrk/wallet-sdk-*) es una línea distinta
  // y desactualizada frente al nodo público actual, de ahí el "Normal
  // Closure" nada más conectar. La barrera correcta, sin guion tras
  // "midnight" (ver matriz de compatibilidad), es esta.
} from '@midnightntwrk/wallet-sdk';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import type { NetworkConfig } from './config.js';

if (!(globalThis as any).WebSocket) (globalThis as any).WebSocket = WebSocket as any;

const NETWORK = process.env['MIDNIGHT_NETWORK'] ?? 'local';
const SEED_FILE = `.operator-wallet-seed-${NETWORK}`;
const STATE_FILE = `.operator-wallet-state-${NETWORK}.json`;

/** Semilla nueva la primera vez, persistida después, mismo patrón que las claves de admin/tienda en contract.ts. */
function loadOrCreateSeed(): Buffer {
  if (existsSync(SEED_FILE)) {
    return Buffer.from(readFileSync(SEED_FILE, 'utf8').trim(), 'hex');
  }
  const seed = Buffer.from(generateRandomSeed());
  writeFileSync(SEED_FILE, seed.toString('hex'));
  return seed;
}

type SavedState = { shielded: string; unshielded: string; dust: string };

/**
 * Una wallet nueva tiene que escanear TODO el histórico de índices shielded
 * (y DUST, que usa el mismo mecanismo) desde el génesis para saber cuáles
 * son suyos, en preprod son ~1.45M índices a ~120/s, o sea horas, no
 * segundos. No hay parámetro de "altura de nacimiento" en el SDK para
 * saltárselo (comprobado: ni ShieldedWallet ni DustWallet lo exponen). La
 * única forma de que esto no se repita en cada reinicio es guardar el
 * estado de sincronización ya alcanzado y reanudar desde ahí con restore().
 */
function loadSavedState(): SavedState | null {
  if (!existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8')) as SavedState;
  } catch {
    return null;
  }
}

async function persistState(wallet: WalletFacade): Promise<void> {
  const state: SavedState = {
    shielded: await wallet.shielded.serializeState(),
    unshielded: await wallet.unshielded.serializeState(),
    dust: await wallet.dust.serializeState(),
  };
  writeFileSync(STATE_FILE, JSON.stringify(state));
}

/**
 * Guarda el progreso de sync cada `intervalMs` y al salir del proceso, para
 * no perder horas de escaneo si el proceso se reinicia. Llamar una vez tras
 * construir la wallet operadora.
 */
export function startStatePersistence(wallet: WalletFacade, intervalMs = 30_000): void {
  const save = () => { persistState(wallet).catch((err) => console.error('No se pudo guardar el estado de la wallet operadora:', err)); };
  const interval = setInterval(save, intervalMs);
  interval.unref?.();
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => { save(); });
  }
  process.once('beforeExit', save);
}

/**
 * Progreso visible del sync en el log del servidor, sin esto, el proceso
 * puede parecer "colgado" durante minutos u horas sin ninguna señal de que
 * sigue vivo. Se auto-desuscribe en cuanto ve `isSynced`.
 */
function logSyncProgress(wallet: WalletFacade): void {
  const LOG_EVERY_MS = 15_000;
  let lastLogTime = 0;
  const sub = wallet.state().subscribe((s) => {
    if (s.isSynced) {
      console.log('[operator-wallet] sincronizado');
      sub.unsubscribe();
      return;
    }
    const now = Date.now();
    if (now - lastLogTime < LOG_EVERY_MS) return;
    lastLogTime = now;
    const dp = s.dust.progress as { appliedIndex: bigint; highestRelevantWalletIndex: bigint };
    const sp = s.shielded.progress as { appliedIndex: bigint; highestRelevantWalletIndex: bigint };
    console.log(`[operator-wallet] sync, dust ${dp.appliedIndex}/${dp.highestRelevantWalletIndex}, shielded ${sp.appliedIndex}/${sp.highestRelevantWalletIndex}`);
  });
}

type OperatorWallet = {
  wallet: WalletFacade;
  unshieldedKeystore: UnshieldedKeystore;
  shieldedSecretKeys: ledger.ZswapSecretKeys;
  dustSecretKey: ledger.DustSecretKey;
  address: string;
};

let cached: Promise<OperatorWallet> | null = null;

function buildConfiguration(config: NetworkConfig): DefaultConfiguration {
  return {
    networkId: config.networkId as DefaultConfiguration['networkId'],
    // additionalFeeOverhead solo hace falta en devnet local (fee ~0 -> error 117);
    // preprod/preview ya tienen una tasa de fee real. Ver skill wallet-sdk.
    costParameters: config.networkId === 'undeployed'
      ? { feeBlocksMargin: 5, additionalFeeOverhead: 1_000_000n }
      : { feeBlocksMargin: 5 },
    relayURL: new URL(config.relayURL),
    provingServerUrl: new URL(config.proofServer),
    indexerClientConnection: {
      indexerHttpUrl: config.indexer,
      indexerWsUrl: config.indexerWS,
    },
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema),
  };
}

async function buildOperatorWallet(config: NetworkConfig): Promise<OperatorWallet> {
  const seed = loadOrCreateSeed();
  const hd = HDWallet.fromSeed(seed);
  if (hd.type !== 'seedOk') throw new Error('Semilla de la wallet operadora inválida');

  const derived = hd.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust] as const)
    .deriveKeysAt(0);
  if (derived.type !== 'keysDerived') throw new Error('No se pudieron derivar las claves de la wallet operadora');
  hd.hdWallet.clear();

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derived.keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(derived.keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(derived.keys[Roles.NightExternal], config.networkId as any);
  const address = UnshieldedPublicKey.fromKeyStore(unshieldedKeystore).address;

  const configuration = buildConfiguration(config);
  // restore() confirmado roto en este entorno/versión del SDK (3/3 intentos
  // reales entraron en bucle de errores Wallet.Sync, con estados de tamaños
  // muy distintos, no es cuestión de un fichero corrupto puntual). Se
  // desactiva hasta investigarlo a fondo: siempre arranque limpio desde
  // génesis. persistState()/loadSavedState() se dejan para depurar
  // restore() más adelante, pero no se usa su resultado aquí.
  console.log(`[operator-wallet] SIN estado guardado, escaneo completo desde génesis (red: ${config.networkId})`);

  const wallet = await WalletFacade.init({
    configuration,
    shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (cfg) => UnshieldedWallet(cfg).startWithPublicKey(UnshieldedPublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (cfg) => DustWallet(cfg).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  startStatePersistence(wallet);
  logSyncProgress(wallet);

  return { wallet, unshieldedKeystore, shieldedSecretKeys, dustSecretKey, address };
}

export function getOperatorWallet(config: NetworkConfig): Promise<OperatorWallet> {
  if (!cached) cached = buildOperatorWallet(config);
  return cached;
}

/** Dirección para fondear desde el faucet, no hace falta esperar al sync de la wallet. */
export function getOperatorAddressSync(config: NetworkConfig): string {
  const seed = loadOrCreateSeed();
  const hd = HDWallet.fromSeed(seed);
  if (hd.type !== 'seedOk') throw new Error('Semilla de la wallet operadora inválida');
  const derived = hd.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.NightExternal] as const)
    .deriveKeysAt(0);
  if (derived.type !== 'keysDerived') throw new Error('No se pudieron derivar las claves de la wallet operadora');
  hd.hdWallet.clear();
  const unshieldedKeystore = createKeystore(derived.keys[Roles.NightExternal], config.networkId as any);
  return UnshieldedPublicKey.fromKeyStore(unshieldedKeystore).address;
}

/**
 * Balancea (solo DUST, registerStore/attestReceipt no mueven tokens),
 * firma, prueba y envía una tx que proofProvider.proveTx ya probó.
 */
export async function submitViaOperatorWallet(
  config: NetworkConfig,
  provenTx: UnboundTransaction,
): Promise<string> {
  const { wallet, unshieldedKeystore, shieldedSecretKeys, dustSecretKey } = await getOperatorWallet(config);

  const recipe = await wallet.balanceUnboundTransaction(
    provenTx,
    { shieldedSecretKeys, dustSecretKey },
    { ttl: new Date(Date.now() + 30 * 60 * 1000), tokenKindsToBalance: ['dust'] },
  );
  const signed = await wallet.signRecipe(recipe, (data) => unshieldedKeystore.signData(data));
  const finalized = await wallet.finalizeRecipe(signed);
  return wallet.submitTransaction(finalized);
}
