import { type MidnightProviders, type PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { sampleCoinPublicKey, sampleEncryptionPublicKey } from '@midnightntwrk/ledger-v9';
import { type NetworkConfig } from './config.js';
import { retryingProofProvider } from './proofRetry.js';

export type AegisCircuits = 'submitPurchase' | 'seed' | 'registerCampaign' | 'registerStore' | 'attestReceipt';
export type AegisProviders = MidnightProviders<any>;

/**
 * El backend nunca tiene claves de usuario: solo construye y prueba
 * transacciones. Firmarlas, pagarlas y enviarlas es cosa de la wallet
 * conectada en el navegador (ver frontend/src/lace.ts), así que
 * walletProvider/midnightProvider aquí son solo placeholders para que el
 * tipado de las funciones de construcción de tx sea satisfecho.
 */
function inMemoryPrivateStateProvider(): PrivateStateProvider {
  // midnight-js 5: el estado privado se alcanza por contrato (forContract).
  const states = new Map<string, Map<string, unknown>>();
  const signingKeys = new Map<string, unknown>();
  const forContract = (address: string) => {
    if (!states.has(address)) states.set(address, new Map());
    const own = states.get(address)!;
    return {
      contractAddress: address,
      set: async (id: string, state: unknown) => { own.set(id, state); },
      get: async (id: string) => own.get(id) ?? null,
      remove: async (id: string) => { own.delete(id); },
      clear: async () => { own.clear(); },
      exportPrivateStates: async () => { throw new Error('Not implemented'); },
      importPrivateStates: async () => { throw new Error('Not implemented'); },
    };
  };
  return {
    forContract,
    clearAll: async () => { states.clear(); },
    setSigningKey: async (addr: unknown, key: unknown) => { signingKeys.set(String(addr), key); },
    getSigningKey: async (addr: unknown) => signingKeys.get(String(addr)) ?? null,
    removeSigningKey: async (addr: unknown) => { signingKeys.delete(String(addr)); },
    clearSigningKeys: async () => { signingKeys.clear(); },
    exportSigningKeys: async () => { throw new Error('Not implemented'); },
    importSigningKeys: async () => { throw new Error('Not implemented'); },
  } as unknown as PrivateStateProvider;
}

export function buildProviders(zkConfigPath: string, config: NetworkConfig): AegisProviders {
  // Los artefactos de compactc 0.31 no traen compiler/contract-manifest.json,
  // solo contract-info.json: 'require-if-present' avisa en vez de fallar.
  const zkConfigProvider = new NodeZkConfigProvider<AegisCircuits>(zkConfigPath, { verify: 'require-if-present' });

  return {
    privateStateProvider: inMemoryPrivateStateProvider(),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: retryingProofProvider(httpClientProofProvider(config.proofServer, zkConfigProvider)),
    walletProvider: {
      supportedEras: ['v8', 'v9'],
      getCoinPublicKey: () => sampleCoinPublicKey(),
      getEncryptionPublicKey: () => sampleEncryptionPublicKey(),
      balanceTx: async () => {
        throw new Error('balanceTx no se usa: el backend solo prueba, balancea la wallet.');
      },
    },
    midnightProvider: {
      supportedEras: ['v8', 'v9'],
      submitTx: async () => {
        throw new Error('submitTx no se usa: la wallet conectada en el frontend envía la transacción.');
      },
    },
    config: { networkId: config.networkId, ttlSeconds: 3600 },
  };
}
