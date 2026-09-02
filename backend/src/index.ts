import { readFileSync } from 'node:fs';
import pino from 'pino';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { getConfig } from './config.js';
import { buildProviders } from './providers.js';
import { zkConfigPath } from './contract.js';
import { createServer } from './api.js';

const NETWORK = process.env['MIDNIGHT_NETWORK'] ?? 'local';
const ADDRESS_FILE = `.contract-address-${NETWORK}`;

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });

async function main() {
  const config = getConfig();
  setNetworkId(config.networkId);

  const providers = buildProviders(zkConfigPath, config);

  let contractAddress: string | null = null;
  try {
    contractAddress = readFileSync(ADDRESS_FILE, 'utf8').trim();
    logger.info(`Reusing contract at: ${contractAddress}`);
  } catch {
    logger.info('No contract address found. Deploy via the wallet in the frontend.');
  }

  createServer({ providers, contractAddress, networkId: config.networkId, config });
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
