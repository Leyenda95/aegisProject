// Lee el estado agregado del contrato (los contadores públicos) a través del
// backend (GET /state): el indexer de preprod, en Blockfrost, exige un token
// que no debe ir en el navegador. Así tampoco hace falta cargar aquí el runtime
// del contrato (~11MB de WebAssembly) solo para leer el estado.
import { API_BASE, type AegisState } from './api.ts';

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
  const r = await fetch(`${API_BASE}/state`);
  if (!r.ok) throw new Error(`State request failed (${r.status})`);
  return r.json() as Promise<AegisState>;
}
