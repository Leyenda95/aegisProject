// Lee el estado agregado del contrato directamente del indexador público de
// Midnight, sin pasar por el backend: son contadores públicos, pensados para
// consultarse así (mismo publicDataProvider que usa backend/src/providers.ts,
// mismos valores de backend/src/config.ts PREPROD_CONFIG).
//
// Este módulo carga ~11MB de WebAssembly en cuanto se importa (arrastra
// @midnight-ntwrk/compact-runtime -> @midnight-ntwrk/ledger-v8 a través del
// contrato compilado). Por eso quien lo use debe hacerlo con un import()
// dinámico (ver useAggregateState.ts, lace.ts), nunca con un `import`
// estático: un estático haría que ese WASM se cargara al arrancar la página
// entera, no solo cuando hace falta leer el estado.
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
// eslint-disable-next-line -- artefacto generado por `compact compile`, no hay tipos de paquete propios (ver explicación en el chat).
import { ledger } from '../../contract/managed/aegis/contract/index.js';
import type { AegisState } from './api.ts';
import { NETWORK_ID } from './chainConfig.ts';

const INDEXER = 'https://indexer.preprod.midnight.network/api/v4/graphql';
const INDEXER_WS = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';

setNetworkId(NETWORK_ID);

// El 3er argumento evita que la librería intente usar `isomorphic-ws`
// (que en el navegador no expone `.WebSocket`, ver aviso del build) como
// implementación por defecto para las suscripciones: aquí ya hay un
// WebSocket nativo del navegador, se lo damos explícito.
// El tipado del paquete espera el `WebSocket` de Node (paquete `ws`, con
// `.Server`, etc.), pero en el navegador el que hace falta es el global del
// propio navegador: mismo valor correcto en tiempo de ejecución, solo un
// tipado ajeno pensado para Node.
const publicDataProvider = indexerPublicDataProvider(INDEXER, INDEXER_WS, WebSocket as any);

const STATE_FIELDS = [
  'signalsElectronics', 'signalsFashion', 'signalsFood', 'signalsSports', 'signalsHome', 'signalsOther',
  'signalsMobile', 'signalsTablet', 'signalsComputer', 'signalsCamera', 'signalsAudio', 'signalsGaming',
  'signalsShoes', 'signalsTops', 'signalsBottoms', 'signalsAccessories', 'signalsOuterwear',
  'signalsGroceries', 'signalsRestaurant', 'signalsCafes', 'signalsFastfood', 'signalsLocalshops',
  'signalsEquipment', 'signalsClothing', 'signalsFootwear', 'signalsSupplements',
  'signalsFurniture', 'signalsAppliances', 'signalsDecor', 'signalsTools',
  'totalSignals', 'campaignCount', 'isSeeded',
] as const satisfies readonly (keyof AegisState)[];

const ZERO_STATE = Object.fromEntries(STATE_FIELDS.map(k => [k, '0'])) as AegisState;

export async function readChainState(contractAddress: string | null): Promise<AegisState> {
  if (!contractAddress) return ZERO_STATE;
  const state = await publicDataProvider.queryContractState(contractAddress as any);
  if (!state) return ZERO_STATE;
  const raw = ledger(state.data) as Record<string, { toString(): string }>;
  return Object.fromEntries(STATE_FIELDS.map(k => [k, raw[k].toString()])) as AegisState;
}
