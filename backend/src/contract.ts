import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  submitCallTx,
  createUnprovenDeployTx,
  createUnprovenCallTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Contract, Subcategory, ledger } from '../../contract/managed/aegis/contract/index.js';
import type { AegisProviders } from './providers.js';

export { Subcategory };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(__dirname, '../../contract/managed/aegis');

export const CompiledAegisContract = CompiledContract.make('aegis', Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

export type AegisState = {
  signalsElectronics: bigint; signalsFashion: bigint; signalsFood: bigint;
  signalsSports: bigint; signalsHome: bigint; signalsOther: bigint;
  signalsMobile: bigint; signalsTablet: bigint; signalsComputer: bigint;
  signalsCamera: bigint; signalsAudio: bigint; signalsGaming: bigint;
  signalsShoes: bigint; signalsTops: bigint; signalsBottoms: bigint;
  signalsAccessories: bigint; signalsOuterwear: bigint;
  signalsGroceries: bigint; signalsRestaurant: bigint; signalsDrinks: bigint; signalsSnacks: bigint;
  signalsEquipment: bigint; signalsClothing: bigint; signalsFootwear: bigint; signalsSupplements: bigint;
  signalsFurniture: bigint; signalsAppliances: bigint; signalsDecor: bigint; signalsTools: bigint;
  totalSignals: bigint;
  campaignCount: bigint;
  isSeeded: bigint;
};

export async function registerCampaign(
  providers: AegisProviders,
  contractAddress: ContractAddress,
): Promise<void> {
  await (submitCallTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'registerCampaign',
    args: [],
  });
}

export async function readState(
  providers: AegisProviders,
  contractAddress: ContractAddress,
): Promise<AegisState> {
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) throw new Error('Contract state not found');
  return ledger(state.data) as AegisState;
}

function txToHex(tx: any): string {
  return Buffer.from((tx as any).serialize()).toString('hex');
}

/** Construye y prueba la transacción de despliegue, sin firmarla. Lace la firma y la envía. */
export async function buildDeployTx(
  providers: AegisProviders,
): Promise<{ tx: string; contractAddress: ContractAddress }> {
  const unprovenData = await (createUnprovenDeployTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    signingKey: sampleSigningKey(),
  });

  const provenTx = await providers.proofProvider.proveTx(unprovenData.private.unprovenTx);

  return {
    tx: txToHex(provenTx),
    contractAddress: unprovenData.public.contractAddress,
  };
}

export type SeedData = {
  mobile: number; tablet: number; computer: number; camera: number; audio: number; gaming: number;
  shoes: number; tops: number; bottoms: number; accessories: number; outerwear: number;
  groceries: number; restaurant: number; drinks: number; snacks: number;
  equipment: number; clothing: number; footwear: number; supplements: number;
  furniture: number; appliances: number; decor: number; tools: number;
  other: number;
};

export async function buildSeedTx(
  providers: AegisProviders,
  contractAddress: ContractAddress,
  data: SeedData,
): Promise<string> {
  const b = (n: number) => BigInt(n);
  const totalElectronics = b(data.mobile + data.tablet + data.computer + data.camera + data.audio + data.gaming);
  const totalFashion = b(data.shoes + data.tops + data.bottoms + data.accessories + data.outerwear);
  const totalFood = b(data.groceries + data.restaurant + data.drinks + data.snacks);
  const totalSports = b(data.equipment + data.clothing + data.footwear + data.supplements);
  const totalHome = b(data.furniture + data.appliances + data.decor + data.tools);
  const grandTotal = totalElectronics + totalFashion + totalFood + totalSports + totalHome + b(data.other);

  const unprovenData = await (createUnprovenCallTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'seed',
    args: [
      b(data.mobile), b(data.tablet), b(data.computer), b(data.camera), b(data.audio), b(data.gaming),
      b(data.shoes), b(data.tops), b(data.bottoms), b(data.accessories), b(data.outerwear),
      b(data.groceries), b(data.restaurant), b(data.drinks), b(data.snacks),
      b(data.equipment), b(data.clothing), b(data.footwear), b(data.supplements),
      b(data.furniture), b(data.appliances), b(data.decor), b(data.tools),
      b(data.other),
      totalElectronics, totalFashion, totalFood, totalSports, totalHome,
      grandTotal,
    ],
  });
  const provenTx = await providers.proofProvider.proveTx(unprovenData.private.unprovenTx);
  return txToHex(provenTx);
}

export async function buildSignalTx(
  providers: AegisProviders,
  contractAddress: ContractAddress,
  subcat: Subcategory,
): Promise<string> {
  const unprovenData = await (createUnprovenCallTx as any)(providers, {
    compiledContract: CompiledAegisContract,
    contractAddress,
    circuitId: 'submitPurchase',
    args: [subcat],
  });

  const provenTx = await providers.proofProvider.proveTx(unprovenData.private.unprovenTx);

  return txToHex(provenTx);
}
