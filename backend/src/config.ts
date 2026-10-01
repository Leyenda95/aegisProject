export type NetworkConfig = {
  networkId: string;
  indexer: string;
  indexerWS: string;
  proofServer: string;
  /** Endpoint RPC del nodo, solo lo usa la wallet operadora del backend (ver operatorWallet.ts). */
  relayURL: string;
};

export const LOCAL_CONFIG: NetworkConfig = {
  networkId: 'undeployed',
  indexer: 'http://127.0.0.1:8088/api/v4/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  proofServer: 'http://127.0.0.1:6300',
  relayURL: 'ws://127.0.0.1:9944',
};

export const PREPROD_CONFIG: NetworkConfig = {
  networkId: 'preprod',
  indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  proofServer: 'http://127.0.0.1:6300',
  relayURL: 'wss://rpc.preprod.midnight.network',
};

export const PREVIEW_CONFIG: NetworkConfig = {
  networkId: 'preview',
  indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  proofServer: 'http://127.0.0.1:6300',
  relayURL: 'wss://rpc.preview.midnight.network',
};

function getNetworkConfig(): NetworkConfig {
  const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';
  if (network === 'local') return LOCAL_CONFIG;
  if (network === 'preprod') return PREPROD_CONFIG;
  if (network === 'preview') return PREVIEW_CONFIG;
  throw new Error(`Unknown network: ${network}. Supported: 'local', 'preprod', 'preview'.`);
}

/**
 * PROOF_SERVER_URL solo hace falta en el despliegue en Railway, donde el
 * proof server es otro servicio y no 127.0.0.1. En local no se define y
 * se usa el de siempre.
 */
export function getConfig(): NetworkConfig {
  const config = getNetworkConfig();
  const proofServer = process.env['PROOF_SERVER_URL'];
  return proofServer ? { ...config, proofServer } : config;
}
