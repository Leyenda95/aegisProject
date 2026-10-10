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

/**
 * Desde el 09-10-2026 el indexer y el RPC de preprod los sirve Blockfrost
 * (Midnight apagó los suyos). Misma API, solo cambian las URLs y hace falta
 * un token (project_id) que va en la propia URL: los clientes del SDK solo
 * aceptan URLs. El token es privado, por eso se lee de una variable de
 * entorno y el frontend nunca habla con Blockfrost directamente (pasa por
 * GET /state del backend).
 */
function preprodConfig(): NetworkConfig {
  const projectId = process.env['BLOCKFROST_PROJECT_ID'];
  if (!projectId) throw new Error('BLOCKFROST_PROJECT_ID is required on preprod (create a project at https://blockfrost.io)');
  const auth = `project_id=${encodeURIComponent(projectId)}`;
  return {
    networkId: 'preprod',
    indexer: `https://midnight-preprod.blockfrost.io/api/v0?${auth}`,
    indexerWS: `wss://midnight-preprod.blockfrost.io/api/v0/ws?${auth}`,
    proofServer: 'http://127.0.0.1:6300',
    relayURL: `wss://rpc.midnight-preprod.blockfrost.io?${auth}`,
  };
}

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
  if (network === 'preprod') return preprodConfig();
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
