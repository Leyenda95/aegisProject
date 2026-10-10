// Lee el estado agregado del contrato (los contadores públicos) a través del
// backend (GET /state). Antes se leía directamente del indexador público de
// Midnight, pero desde el 09-10-2026 el de preprod lo sirve Blockfrost y
// exige un token que no debe ir en el navegador: cualquiera que abriera la
// página podría copiarlo y gastar nuestra cuota. El backend añade el token
// en el servidor y devuelve solo los contadores.
//
// Como efecto secundario, el navegador ya no carga el runtime del contrato
// (~11MB de WebAssembly) solo para leer el estado.
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
