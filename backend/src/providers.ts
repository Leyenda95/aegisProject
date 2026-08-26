import { type MidnightProviders, type PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { sampleCoinPublicKey, sampleEncryptionPublicKey } from '@midnight-ntwrk/ledger-v8';
import { type NetworkConfig } from './config.js';

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
  const states = new Map<string, unknown>();
  const signingKeys = new Map<string, unknown>();
  return {
    setContractAddress: () => {},
    set: async (id: string, state: unknown) => { states.set(id, state); },
    get: async (id: string) => states.get(id) ?? null,
    remove: async (id: string) => { states.delete(id); },
    clear: async () => { states.clear(); },
    setSigningKey: async (addr: unknown, key: unknown) => { signingKeys.set(String(addr), key); },
    getSigningKey: async (addr: unknown) => signingKeys.get(String(addr)) ?? null,
    removeSigningKey: async (addr: unknown) => { signingKeys.delete(String(addr)); },
    clearSigningKeys: async () => { signingKeys.clear(); },
    exportPrivateStates: async () => { throw new Error('Not implemented'); },
    importPrivateStates: async () => { throw new Error('Not implemented'); },
    exportSigningKeys: async () => { throw new Error('Not implemented'); },
    importSigningKeys: async () => { throw new Error('Not implemented'); },
  } as unknown as PrivateStateProvider;
}

export function buildProviders(zkConfigPath: string, config: NetworkConfig): AegisProviders {
  const zkConfigProvider = new NodeZkConfigProvider<AegisCircuits>(zkConfigPath);

  return {
    privateStateProvider: inMemoryPrivateStateProvider(),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: {
      getCoinPublicKey: () => sampleCoinPublicKey(),
      getEncryptionPublicKey: () => sampleEncryptionPublicKey(),
      balanceTx: async (tx: any) => tx.bind(),
    },
    midnightProvider: {
      submitTx: async () => {
        throw new Error('submitTx no se usa: la wallet conectada en el frontend envía la transacción.');
      },
    },
  };
}
