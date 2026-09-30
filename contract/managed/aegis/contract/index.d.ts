import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum Subcategory { mobile = 0,
                          tablet = 1,
                          computer = 2,
                          camera = 3,
                          audio = 4,
                          gaming = 5,
                          shoes = 6,
                          tops = 7,
                          bottoms = 8,
                          accessories = 9,
                          outerwear = 10,
                          groceries = 11,
                          restaurant = 12,
                          cafes = 13,
                          fastfood = 14,
                          localshops = 15,
                          equipment = 16,
                          clothing = 17,
                          footwear = 18,
                          supplements = 19,
                          furniture = 20,
                          appliances = 21,
                          decor = 22,
                          tools = 23,
                          other = 24
}

export type Receipt = { lines: { subcategory: Subcategory,
                                 qty: bigint,
                                 amount: bigint
                               }[];
                        lineCount: bigint;
                        timestamp: bigint;
                        nonce: Uint8Array
                      };

export type Witnesses<PS> = {
  local_secret_key(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  getStorePath(context: __compactRuntime.WitnessContext<Ledger, PS>,
               pk_0: Uint8Array): [PS, { leaf: Uint8Array,
                                         path: { sibling: { field: bigint },
                                                 goes_left: boolean
                                               }[]
                                       }];
  getReceipt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Receipt];
}

export type ImpureCircuits<PS> = {
  registerStore(context: __compactRuntime.CircuitContext<PS>,
                storePk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  attestReceipt(context: __compactRuntime.CircuitContext<PS>,
                commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitPurchase(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  seed(context: __compactRuntime.CircuitContext<PS>,
       initMobile_0: bigint,
       initTablet_0: bigint,
       initComputer_0: bigint,
       initCamera_0: bigint,
       initAudio_0: bigint,
       initGaming_0: bigint,
       initShoes_0: bigint,
       initTops_0: bigint,
       initBottoms_0: bigint,
       initAccessories_0: bigint,
       initOuterwear_0: bigint,
       initGroceries_0: bigint,
       initRestaurant_0: bigint,
       initCafes_0: bigint,
       initFastfood_0: bigint,
       initLocalshops_0: bigint,
       initEquipment_0: bigint,
       initClothing_0: bigint,
       initFootwear_0: bigint,
       initSupplements_0: bigint,
       initFurniture_0: bigint,
       initAppliances_0: bigint,
       initDecor_0: bigint,
       initTools_0: bigint,
       initOther_0: bigint,
       totalElectronics_0: bigint,
       totalFashion_0: bigint,
       totalFood_0: bigint,
       totalSports_0: bigint,
       totalHome_0: bigint,
       grandTotal_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  registerCampaign(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, bigint>;
}

export type ProvableCircuits<PS> = {
  registerStore(context: __compactRuntime.CircuitContext<PS>,
                storePk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  attestReceipt(context: __compactRuntime.CircuitContext<PS>,
                commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitPurchase(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  seed(context: __compactRuntime.CircuitContext<PS>,
       initMobile_0: bigint,
       initTablet_0: bigint,
       initComputer_0: bigint,
       initCamera_0: bigint,
       initAudio_0: bigint,
       initGaming_0: bigint,
       initShoes_0: bigint,
       initTops_0: bigint,
       initBottoms_0: bigint,
       initAccessories_0: bigint,
       initOuterwear_0: bigint,
       initGroceries_0: bigint,
       initRestaurant_0: bigint,
       initCafes_0: bigint,
       initFastfood_0: bigint,
       initLocalshops_0: bigint,
       initEquipment_0: bigint,
       initClothing_0: bigint,
       initFootwear_0: bigint,
       initSupplements_0: bigint,
       initFurniture_0: bigint,
       initAppliances_0: bigint,
       initDecor_0: bigint,
       initTools_0: bigint,
       initOther_0: bigint,
       totalElectronics_0: bigint,
       totalFashion_0: bigint,
       totalFood_0: bigint,
       totalSports_0: bigint,
       totalHome_0: bigint,
       grandTotal_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  registerCampaign(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, bigint>;
}

export type PureCircuits = {
  storePublicKey(sk_0: Uint8Array): Uint8Array;
  receiptCommitment(r_0: Receipt): Uint8Array;
}

export type Circuits<PS> = {
  storePublicKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  receiptCommitment(context: __compactRuntime.CircuitContext<PS>, r_0: Receipt): __compactRuntime.CircuitResults<PS, Uint8Array>;
  registerStore(context: __compactRuntime.CircuitContext<PS>,
                storePk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  attestReceipt(context: __compactRuntime.CircuitContext<PS>,
                commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitPurchase(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  seed(context: __compactRuntime.CircuitContext<PS>,
       initMobile_0: bigint,
       initTablet_0: bigint,
       initComputer_0: bigint,
       initCamera_0: bigint,
       initAudio_0: bigint,
       initGaming_0: bigint,
       initShoes_0: bigint,
       initTops_0: bigint,
       initBottoms_0: bigint,
       initAccessories_0: bigint,
       initOuterwear_0: bigint,
       initGroceries_0: bigint,
       initRestaurant_0: bigint,
       initCafes_0: bigint,
       initFastfood_0: bigint,
       initLocalshops_0: bigint,
       initEquipment_0: bigint,
       initClothing_0: bigint,
       initFootwear_0: bigint,
       initSupplements_0: bigint,
       initFurniture_0: bigint,
       initAppliances_0: bigint,
       initDecor_0: bigint,
       initTools_0: bigint,
       initOther_0: bigint,
       totalElectronics_0: bigint,
       totalFashion_0: bigint,
       totalFood_0: bigint,
       totalSports_0: bigint,
       totalHome_0: bigint,
       grandTotal_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  registerCampaign(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, bigint>;
}

export type Ledger = {
  readonly signalsElectronics: bigint;
  readonly signalsFashion: bigint;
  readonly signalsFood: bigint;
  readonly signalsSports: bigint;
  readonly signalsHome: bigint;
  readonly signalsOther: bigint;
  readonly signalsMobile: bigint;
  readonly signalsTablet: bigint;
  readonly signalsComputer: bigint;
  readonly signalsCamera: bigint;
  readonly signalsAudio: bigint;
  readonly signalsGaming: bigint;
  readonly signalsShoes: bigint;
  readonly signalsTops: bigint;
  readonly signalsBottoms: bigint;
  readonly signalsAccessories: bigint;
  readonly signalsOuterwear: bigint;
  readonly signalsGroceries: bigint;
  readonly signalsRestaurant: bigint;
  readonly signalsCafes: bigint;
  readonly signalsFastfood: bigint;
  readonly signalsLocalshops: bigint;
  readonly signalsEquipment: bigint;
  readonly signalsClothing: bigint;
  readonly signalsFootwear: bigint;
  readonly signalsSupplements: bigint;
  readonly signalsFurniture: bigint;
  readonly signalsAppliances: bigint;
  readonly signalsDecor: bigint;
  readonly signalsTools: bigint;
  readonly totalSignals: bigint;
  readonly campaignCount: bigint;
  readonly isSeeded: bigint;
  readonly admin: Uint8Array;
  registeredStores: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  sealedReceipts: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  usedReceipts: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
