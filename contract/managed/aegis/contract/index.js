import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

export var Subcategory;
(function (Subcategory) {
  Subcategory[Subcategory['mobile'] = 0] = 'mobile';
  Subcategory[Subcategory['tablet'] = 1] = 'tablet';
  Subcategory[Subcategory['computer'] = 2] = 'computer';
  Subcategory[Subcategory['camera'] = 3] = 'camera';
  Subcategory[Subcategory['audio'] = 4] = 'audio';
  Subcategory[Subcategory['gaming'] = 5] = 'gaming';
  Subcategory[Subcategory['shoes'] = 6] = 'shoes';
  Subcategory[Subcategory['tops'] = 7] = 'tops';
  Subcategory[Subcategory['bottoms'] = 8] = 'bottoms';
  Subcategory[Subcategory['accessories'] = 9] = 'accessories';
  Subcategory[Subcategory['outerwear'] = 10] = 'outerwear';
  Subcategory[Subcategory['groceries'] = 11] = 'groceries';
  Subcategory[Subcategory['restaurant'] = 12] = 'restaurant';
  Subcategory[Subcategory['cafes'] = 13] = 'cafes';
  Subcategory[Subcategory['fastfood'] = 14] = 'fastfood';
  Subcategory[Subcategory['localshops'] = 15] = 'localshops';
  Subcategory[Subcategory['equipment'] = 16] = 'equipment';
  Subcategory[Subcategory['clothing'] = 17] = 'clothing';
  Subcategory[Subcategory['footwear'] = 18] = 'footwear';
  Subcategory[Subcategory['supplements'] = 19] = 'supplements';
  Subcategory[Subcategory['furniture'] = 20] = 'furniture';
  Subcategory[Subcategory['appliances'] = 21] = 'appliances';
  Subcategory[Subcategory['decor'] = 22] = 'decor';
  Subcategory[Subcategory['tools'] = 23] = 'tools';
  Subcategory[Subcategory['other'] = 24] = 'other';
})(Subcategory || (Subcategory = {}));

const _descriptor_0 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_1 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_2 = new __compactRuntime.CompactTypeEnum(24, 1);

const _descriptor_3 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_4 = __compactRuntime.CompactTypeBoolean;

const _descriptor_5 = __compactRuntime.CompactTypeField;

class _MerkleTreeDigest_0 {
  alignment() {
    return _descriptor_5.alignment();
  }
  fromValue(value_0) {
    return {
      field: _descriptor_5.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.field);
  }
}

const _descriptor_6 = new _MerkleTreeDigest_0();

class _SubcatLine_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      subcategory: _descriptor_2.fromValue(value_0),
      qty: _descriptor_0.fromValue(value_0),
      amount: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.subcategory).concat(_descriptor_0.toValue(value_0.qty).concat(_descriptor_1.toValue(value_0.amount)));
  }
}

const _descriptor_7 = new _SubcatLine_0();

const _descriptor_8 = new __compactRuntime.CompactTypeVector(8, _descriptor_7);

const _descriptor_9 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

class _Receipt_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_9.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment())));
  }
  fromValue(value_0) {
    return {
      lines: _descriptor_8.fromValue(value_0),
      lineCount: _descriptor_9.fromValue(value_0),
      timestamp: _descriptor_1.fromValue(value_0),
      nonce: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.lines).concat(_descriptor_9.toValue(value_0.lineCount).concat(_descriptor_1.toValue(value_0.timestamp).concat(_descriptor_3.toValue(value_0.nonce))));
  }
}

const _descriptor_10 = new _Receipt_0();

class _MerkleTreePathEntry_0 {
  alignment() {
    return _descriptor_6.alignment().concat(_descriptor_4.alignment());
  }
  fromValue(value_0) {
    return {
      sibling: _descriptor_6.fromValue(value_0),
      goes_left: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.sibling).concat(_descriptor_4.toValue(value_0.goes_left));
  }
}

const _descriptor_11 = new _MerkleTreePathEntry_0();

const _descriptor_12 = new __compactRuntime.CompactTypeVector(10, _descriptor_11);

class _MerkleTreePath_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_12.alignment());
  }
  fromValue(value_0) {
    return {
      leaf: _descriptor_3.fromValue(value_0),
      path: _descriptor_12.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.leaf).concat(_descriptor_12.toValue(value_0.path));
  }
}

const _descriptor_13 = new _MerkleTreePath_0();

const _descriptor_14 = new __compactRuntime.CompactTypeBytes(6);

class _LeafPreimage_0 {
  alignment() {
    return _descriptor_14.alignment().concat(_descriptor_3.alignment());
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_14.fromValue(value_0),
      data: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_14.toValue(value_0.domain_sep).concat(_descriptor_3.toValue(value_0.data));
  }
}

const _descriptor_15 = new _LeafPreimage_0();

const _descriptor_16 = new __compactRuntime.CompactTypeVector(26, _descriptor_3);

const _descriptor_17 = new __compactRuntime.CompactTypeVector(2, _descriptor_5);

const _descriptor_18 = new __compactRuntime.CompactTypeVector(2, _descriptor_3);

class _Either_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_4.fromValue(value_0),
      left: _descriptor_3.fromValue(value_0),
      right: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_left).concat(_descriptor_3.toValue(value_0.left).concat(_descriptor_3.toValue(value_0.right)));
  }
}

const _descriptor_19 = new _Either_0();

const _descriptor_20 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_3.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.bytes);
  }
}

const _descriptor_21 = new _ContractAddress_0();

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.local_secret_key) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named local_secret_key');
    }
    if (typeof(witnesses_0.getStorePath) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named getStorePath');
    }
    if (typeof(witnesses_0.getReceipt) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named getReceipt');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      storePublicKey(context, ...args_1) {
        return { result: pureCircuits.storePublicKey(...args_1), context };
      },
      receiptCommitment(context, ...args_1) {
        return { result: pureCircuits.receiptCommitment(...args_1), context };
      },
      registerStore: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`registerStore: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const storePk_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('registerStore',
                                     'argument 1 (as invoked from Typescript)',
                                     'aegis.compact line 137 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(storePk_0.buffer instanceof ArrayBuffer && storePk_0.BYTES_PER_ELEMENT === 1 && storePk_0.length === 32)) {
          __compactRuntime.typeError('registerStore',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'aegis.compact line 137 char 1',
                                     'Bytes<32>',
                                     storePk_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(storePk_0),
            alignment: _descriptor_3.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._registerStore_0(context,
                                               partialProofData,
                                               storePk_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      attestReceipt: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`attestReceipt: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const commitment_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('attestReceipt',
                                     'argument 1 (as invoked from Typescript)',
                                     'aegis.compact line 145 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(commitment_0.buffer instanceof ArrayBuffer && commitment_0.BYTES_PER_ELEMENT === 1 && commitment_0.length === 32)) {
          __compactRuntime.typeError('attestReceipt',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'aegis.compact line 145 char 1',
                                     'Bytes<32>',
                                     commitment_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(commitment_0),
            alignment: _descriptor_3.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._attestReceipt_0(context,
                                               partialProofData,
                                               commitment_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      submitPurchase: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`submitPurchase: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('submitPurchase',
                                     'argument 1 (as invoked from Typescript)',
                                     'aegis.compact line 210 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._submitPurchase_0(context, partialProofData);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      seed: (...args_1) => {
        if (args_1.length !== 32) {
          throw new __compactRuntime.CompactError(`seed: expected 32 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const initMobile_0 = args_1[1];
        const initTablet_0 = args_1[2];
        const initComputer_0 = args_1[3];
        const initCamera_0 = args_1[4];
        const initAudio_0 = args_1[5];
        const initGaming_0 = args_1[6];
        const initShoes_0 = args_1[7];
        const initTops_0 = args_1[8];
        const initBottoms_0 = args_1[9];
        const initAccessories_0 = args_1[10];
        const initOuterwear_0 = args_1[11];
        const initGroceries_0 = args_1[12];
        const initRestaurant_0 = args_1[13];
        const initCafes_0 = args_1[14];
        const initFastfood_0 = args_1[15];
        const initLocalshops_0 = args_1[16];
        const initEquipment_0 = args_1[17];
        const initClothing_0 = args_1[18];
        const initFootwear_0 = args_1[19];
        const initSupplements_0 = args_1[20];
        const initFurniture_0 = args_1[21];
        const initAppliances_0 = args_1[22];
        const initDecor_0 = args_1[23];
        const initTools_0 = args_1[24];
        const initOther_0 = args_1[25];
        const totalElectronics_0 = args_1[26];
        const totalFashion_0 = args_1[27];
        const totalFood_0 = args_1[28];
        const totalSports_0 = args_1[29];
        const totalHome_0 = args_1[30];
        const grandTotal_0 = args_1[31];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('seed',
                                     'argument 1 (as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(initMobile_0) === 'bigint' && initMobile_0 >= 0n && initMobile_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initMobile_0)
        }
        if (!(typeof(initTablet_0) === 'bigint' && initTablet_0 >= 0n && initTablet_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initTablet_0)
        }
        if (!(typeof(initComputer_0) === 'bigint' && initComputer_0 >= 0n && initComputer_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initComputer_0)
        }
        if (!(typeof(initCamera_0) === 'bigint' && initCamera_0 >= 0n && initCamera_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initCamera_0)
        }
        if (!(typeof(initAudio_0) === 'bigint' && initAudio_0 >= 0n && initAudio_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initAudio_0)
        }
        if (!(typeof(initGaming_0) === 'bigint' && initGaming_0 >= 0n && initGaming_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initGaming_0)
        }
        if (!(typeof(initShoes_0) === 'bigint' && initShoes_0 >= 0n && initShoes_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initShoes_0)
        }
        if (!(typeof(initTops_0) === 'bigint' && initTops_0 >= 0n && initTops_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 8 (argument 9 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initTops_0)
        }
        if (!(typeof(initBottoms_0) === 'bigint' && initBottoms_0 >= 0n && initBottoms_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 9 (argument 10 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initBottoms_0)
        }
        if (!(typeof(initAccessories_0) === 'bigint' && initAccessories_0 >= 0n && initAccessories_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 10 (argument 11 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initAccessories_0)
        }
        if (!(typeof(initOuterwear_0) === 'bigint' && initOuterwear_0 >= 0n && initOuterwear_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 11 (argument 12 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initOuterwear_0)
        }
        if (!(typeof(initGroceries_0) === 'bigint' && initGroceries_0 >= 0n && initGroceries_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 12 (argument 13 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initGroceries_0)
        }
        if (!(typeof(initRestaurant_0) === 'bigint' && initRestaurant_0 >= 0n && initRestaurant_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 13 (argument 14 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initRestaurant_0)
        }
        if (!(typeof(initCafes_0) === 'bigint' && initCafes_0 >= 0n && initCafes_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 14 (argument 15 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initCafes_0)
        }
        if (!(typeof(initFastfood_0) === 'bigint' && initFastfood_0 >= 0n && initFastfood_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 15 (argument 16 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initFastfood_0)
        }
        if (!(typeof(initLocalshops_0) === 'bigint' && initLocalshops_0 >= 0n && initLocalshops_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 16 (argument 17 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initLocalshops_0)
        }
        if (!(typeof(initEquipment_0) === 'bigint' && initEquipment_0 >= 0n && initEquipment_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 17 (argument 18 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initEquipment_0)
        }
        if (!(typeof(initClothing_0) === 'bigint' && initClothing_0 >= 0n && initClothing_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 18 (argument 19 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initClothing_0)
        }
        if (!(typeof(initFootwear_0) === 'bigint' && initFootwear_0 >= 0n && initFootwear_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 19 (argument 20 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initFootwear_0)
        }
        if (!(typeof(initSupplements_0) === 'bigint' && initSupplements_0 >= 0n && initSupplements_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 20 (argument 21 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initSupplements_0)
        }
        if (!(typeof(initFurniture_0) === 'bigint' && initFurniture_0 >= 0n && initFurniture_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 21 (argument 22 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initFurniture_0)
        }
        if (!(typeof(initAppliances_0) === 'bigint' && initAppliances_0 >= 0n && initAppliances_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 22 (argument 23 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initAppliances_0)
        }
        if (!(typeof(initDecor_0) === 'bigint' && initDecor_0 >= 0n && initDecor_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 23 (argument 24 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initDecor_0)
        }
        if (!(typeof(initTools_0) === 'bigint' && initTools_0 >= 0n && initTools_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 24 (argument 25 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initTools_0)
        }
        if (!(typeof(initOther_0) === 'bigint' && initOther_0 >= 0n && initOther_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 25 (argument 26 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     initOther_0)
        }
        if (!(typeof(totalElectronics_0) === 'bigint' && totalElectronics_0 >= 0n && totalElectronics_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 26 (argument 27 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     totalElectronics_0)
        }
        if (!(typeof(totalFashion_0) === 'bigint' && totalFashion_0 >= 0n && totalFashion_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 27 (argument 28 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     totalFashion_0)
        }
        if (!(typeof(totalFood_0) === 'bigint' && totalFood_0 >= 0n && totalFood_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 28 (argument 29 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     totalFood_0)
        }
        if (!(typeof(totalSports_0) === 'bigint' && totalSports_0 >= 0n && totalSports_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 29 (argument 30 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     totalSports_0)
        }
        if (!(typeof(totalHome_0) === 'bigint' && totalHome_0 >= 0n && totalHome_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 30 (argument 31 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     totalHome_0)
        }
        if (!(typeof(grandTotal_0) === 'bigint' && grandTotal_0 >= 0n && grandTotal_0 <= 65535n)) {
          __compactRuntime.typeError('seed',
                                     'argument 31 (argument 32 as invoked from Typescript)',
                                     'aegis.compact line 230 char 1',
                                     'Uint<0..65536>',
                                     grandTotal_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(initMobile_0).concat(_descriptor_0.toValue(initTablet_0).concat(_descriptor_0.toValue(initComputer_0).concat(_descriptor_0.toValue(initCamera_0).concat(_descriptor_0.toValue(initAudio_0).concat(_descriptor_0.toValue(initGaming_0).concat(_descriptor_0.toValue(initShoes_0).concat(_descriptor_0.toValue(initTops_0).concat(_descriptor_0.toValue(initBottoms_0).concat(_descriptor_0.toValue(initAccessories_0).concat(_descriptor_0.toValue(initOuterwear_0).concat(_descriptor_0.toValue(initGroceries_0).concat(_descriptor_0.toValue(initRestaurant_0).concat(_descriptor_0.toValue(initCafes_0).concat(_descriptor_0.toValue(initFastfood_0).concat(_descriptor_0.toValue(initLocalshops_0).concat(_descriptor_0.toValue(initEquipment_0).concat(_descriptor_0.toValue(initClothing_0).concat(_descriptor_0.toValue(initFootwear_0).concat(_descriptor_0.toValue(initSupplements_0).concat(_descriptor_0.toValue(initFurniture_0).concat(_descriptor_0.toValue(initAppliances_0).concat(_descriptor_0.toValue(initDecor_0).concat(_descriptor_0.toValue(initTools_0).concat(_descriptor_0.toValue(initOther_0).concat(_descriptor_0.toValue(totalElectronics_0).concat(_descriptor_0.toValue(totalFashion_0).concat(_descriptor_0.toValue(totalFood_0).concat(_descriptor_0.toValue(totalSports_0).concat(_descriptor_0.toValue(totalHome_0).concat(_descriptor_0.toValue(grandTotal_0))))))))))))))))))))))))))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()))))))))))))))))))))))))))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._seed_0(context,
                                      partialProofData,
                                      initMobile_0,
                                      initTablet_0,
                                      initComputer_0,
                                      initCamera_0,
                                      initAudio_0,
                                      initGaming_0,
                                      initShoes_0,
                                      initTops_0,
                                      initBottoms_0,
                                      initAccessories_0,
                                      initOuterwear_0,
                                      initGroceries_0,
                                      initRestaurant_0,
                                      initCafes_0,
                                      initFastfood_0,
                                      initLocalshops_0,
                                      initEquipment_0,
                                      initClothing_0,
                                      initFootwear_0,
                                      initSupplements_0,
                                      initFurniture_0,
                                      initAppliances_0,
                                      initDecor_0,
                                      initTools_0,
                                      initOther_0,
                                      totalElectronics_0,
                                      totalFashion_0,
                                      totalFood_0,
                                      totalSports_0,
                                      totalHome_0,
                                      grandTotal_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      registerCampaign: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`registerCampaign: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('registerCampaign',
                                     'argument 1 (as invoked from Typescript)',
                                     'aegis.compact line 285 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._registerCampaign_0(context, partialProofData);
        partialProofData.output = { value: _descriptor_1.toValue(result_0), alignment: _descriptor_1.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      registerStore: this.circuits.registerStore,
      attestReceipt: this.circuits.attestReceipt,
      submitPurchase: this.circuits.submitPurchase,
      seed: this.circuits.seed,
      registerCampaign: this.circuits.registerCampaign
    };
    this.provableCircuits = {
      registerStore: this.circuits.registerStore,
      attestReceipt: this.circuits.attestReceipt,
      submitPurchase: this.circuits.submitPurchase,
      seed: this.circuits.seed,
      registerCampaign: this.circuits.registerCampaign
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    let stateValue_3 = __compactRuntime.StateValue.newArray();
    stateValue_3 = stateValue_3.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_3 = stateValue_3.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_3 = stateValue_3.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_3 = stateValue_3.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_3 = stateValue_3.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_3 = stateValue_3.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_3 = stateValue_3.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(stateValue_3);
    let stateValue_2 = __compactRuntime.StateValue.newArray();
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(stateValue_2);
    let stateValue_1 = __compactRuntime.StateValue.newArray();
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(stateValue_1);
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('registerStore', new __compactRuntime.ContractOperation());
    state_0.setOperation('attestReceipt', new __compactRuntime.ContractOperation());
    state_0.setOperation('submitPurchase', new __compactRuntime.ContractOperation());
    state_0.setOperation('seed', new __compactRuntime.ContractOperation());
    state_0.setOperation('registerCampaign', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(1n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(2n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(3n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(4n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(5n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(6n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(1n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(2n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(3n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(4n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(5n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(6n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(7n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(8n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(9n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(10n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(11n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(12n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(13n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(14n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(1n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(2n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(3n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(4n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(5n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(6n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(7n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(8n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(9n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(10n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(11n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(12n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newBoundedMerkleTree(
                                                                       new __compactRuntime.StateBoundedMerkleTree(10)
                                                                     )).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                                                        alignment: _descriptor_1.alignment() })).arrayPush(__compactRuntime.StateValue.newMap(
                                                                                                                                                                             new __compactRuntime.StateMap()
                                                                                                                                                                           ))
                                                          .encode() } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(13n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(14n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_0 = this._storePublicKey_0(this._local_secret_key_0(context,
                                                                  partialProofData));
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(11n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _merkleTreePathRoot_0(path_0) {
    return { field:
               this._folder_0((...args_0) =>
                                this._merkleTreePathEntryRoot_0(...args_0),
                              this._degradeToTransient_0(this._persistentHash_1({ domain_sep:
                                                                                    new Uint8Array([109, 100, 110, 58, 108, 104]),
                                                                                  data:
                                                                                    path_0.leaf })),
                              path_0.path) };
  }
  _merkleTreePathEntryRoot_0(recursiveDigest_0, entry_0) {
    const left_0 = entry_0.goes_left ? recursiveDigest_0 : entry_0.sibling.field;
    const right_0 = entry_0.goes_left ?
                    entry_0.sibling.field :
                    recursiveDigest_0;
    return this._transientHash_0([left_0, right_0]);
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_17, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_18, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_15, value_0);
    return result_0;
  }
  _persistentCommit_0(value_0, rand_0) {
    const result_0 = __compactRuntime.persistentCommit(_descriptor_16,
                                                       value_0,
                                                       rand_0);
    return result_0;
  }
  _degradeToTransient_0(x_0) {
    const result_0 = __compactRuntime.degradeToTransient(x_0);
    return result_0;
  }
  _local_secret_key_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.local_secret_key(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('local_secret_key',
                                 'return value',
                                 'aegis.compact line 99 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_3.toValue(result_0),
      alignment: _descriptor_3.alignment()
    });
    return result_0;
  }
  _getStorePath_0(context, partialProofData, pk_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.getStorePath(witnessContext_0,
                                                                       pk_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.leaf.buffer instanceof ArrayBuffer && result_0.leaf.BYTES_PER_ELEMENT === 1 && result_0.leaf.length === 32 && Array.isArray(result_0.path) && result_0.path.length === 10 && result_0.path.every((t) => typeof(t) === 'object' && typeof(t.sibling) === 'object' && typeof(t.sibling.field) === 'bigint' && t.sibling.field >= 0 && t.sibling.field <= __compactRuntime.MAX_FIELD && typeof(t.goes_left) === 'boolean'))) {
      __compactRuntime.typeError('getStorePath',
                                 'return value',
                                 'aegis.compact line 100 char 1',
                                 'struct MerkleTreePath<leaf: Bytes<32>, path: Vector<10, struct MerkleTreePathEntry<sibling: struct MerkleTreeDigest<field: Field>, goes_left: Boolean>>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_13.toValue(result_0),
      alignment: _descriptor_13.alignment()
    });
    return result_0;
  }
  _getReceipt_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.getReceipt(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && Array.isArray(result_0.lines) && result_0.lines.length === 8 && result_0.lines.every((t) => typeof(t) === 'object' && typeof(t.subcategory) === 'number' && t.subcategory >= 0 && t.subcategory <= 24 && typeof(t.qty) === 'bigint' && t.qty >= 0n && t.qty <= 65535n && typeof(t.amount) === 'bigint' && t.amount >= 0n && t.amount <= 18446744073709551615n) && typeof(result_0.lineCount) === 'bigint' && result_0.lineCount >= 0n && result_0.lineCount <= 255n && typeof(result_0.timestamp) === 'bigint' && result_0.timestamp >= 0n && result_0.timestamp <= 18446744073709551615n && result_0.nonce.buffer instanceof ArrayBuffer && result_0.nonce.BYTES_PER_ELEMENT === 1 && result_0.nonce.length === 32)) {
      __compactRuntime.typeError('getReceipt',
                                 'return value',
                                 'aegis.compact line 101 char 1',
                                 'struct Receipt<lines: Vector<8, struct SubcatLine<subcategory: Enum<Subcategory, mobile, tablet, computer, camera, audio, gaming, shoes, tops, bottoms, accessories, outerwear, groceries, restaurant, cafes, fastfood, localshops, equipment, clothing, footwear, supplements, furniture, appliances, decor, tools, other>, qty: Uint<0..65536>, amount: Uint<0..18446744073709551616>>>, lineCount: Uint<0..256>, timestamp: Uint<0..18446744073709551616>, nonce: Bytes<32>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_10.toValue(result_0),
      alignment: _descriptor_10.alignment()
    });
    return result_0;
  }
  _storePublicKey_0(sk_0) {
    return this._persistentHash_0([new Uint8Array([97, 101, 103, 105, 115, 58, 115, 116, 111, 114, 101, 58, 112, 107, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   sk_0]);
  }
  _receiptCommitment_0(r_0) {
    return this._persistentCommit_0([__compactRuntime.convertFieldToBytes(32,
                                                                          BigInt(r_0.lines[0].subcategory),
                                                                          'aegis.compact line 117 char 7'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[0].qty,
                                                                          'aegis.compact line 117 char 55'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[0].amount,
                                                                          'aegis.compact line 117 char 84'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          BigInt(r_0.lines[1].subcategory),
                                                                          'aegis.compact line 118 char 7'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[1].qty,
                                                                          'aegis.compact line 118 char 55'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[1].amount,
                                                                          'aegis.compact line 118 char 84'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          BigInt(r_0.lines[2].subcategory),
                                                                          'aegis.compact line 119 char 7'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[2].qty,
                                                                          'aegis.compact line 119 char 55'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[2].amount,
                                                                          'aegis.compact line 119 char 84'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          BigInt(r_0.lines[3].subcategory),
                                                                          'aegis.compact line 120 char 7'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[3].qty,
                                                                          'aegis.compact line 120 char 55'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[3].amount,
                                                                          'aegis.compact line 120 char 84'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          BigInt(r_0.lines[4].subcategory),
                                                                          'aegis.compact line 121 char 7'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[4].qty,
                                                                          'aegis.compact line 121 char 55'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[4].amount,
                                                                          'aegis.compact line 121 char 84'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          BigInt(r_0.lines[5].subcategory),
                                                                          'aegis.compact line 122 char 7'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[5].qty,
                                                                          'aegis.compact line 122 char 55'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[5].amount,
                                                                          'aegis.compact line 122 char 84'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          BigInt(r_0.lines[6].subcategory),
                                                                          'aegis.compact line 123 char 7'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[6].qty,
                                                                          'aegis.compact line 123 char 55'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[6].amount,
                                                                          'aegis.compact line 123 char 84'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          BigInt(r_0.lines[7].subcategory),
                                                                          'aegis.compact line 124 char 7'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[7].qty,
                                                                          'aegis.compact line 124 char 55'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lines[7].amount,
                                                                          'aegis.compact line 124 char 84'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.lineCount,
                                                                          'aegis.compact line 125 char 7'),
                                     __compactRuntime.convertFieldToBytes(32,
                                                                          r_0.timestamp,
                                                                          'aegis.compact line 126 char 7')],
                                    r_0.nonce);
  }
  _registerStore_0(context, partialProofData, storePk_0) {
    const sk_0 = this._local_secret_key_0(context, partialProofData);
    __compactRuntime.assert(this._equal_0(this._storePublicKey_0(sk_0),
                                          _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_9.toValue(2n),
                                                                                                                                alignment: _descriptor_9.alignment() } },
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_9.toValue(11n),
                                                                                                                                alignment: _descriptor_9.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value)),
                            'Not admin');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(12n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.leafHash(
                                                                                              { value: _descriptor_3.toValue(storePk_0),
                                                                                                alignment: _descriptor_3.alignment() }
                                                                                            )).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: 1 } },
                                       { ins: { cached: true, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 3 } }]);
    return [];
  }
  _attestReceipt_0(context, partialProofData, commitment_0) {
    const sk_0 = this._local_secret_key_0(context, partialProofData);
    const pk_0 = this._storePublicKey_0(sk_0);
    const path_0 = this._getStorePath_0(context, partialProofData, pk_0);
    const digest_0 = this._merkleTreePathRoot_0(path_0);
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(2n),
                                                                                                                  alignment: _descriptor_9.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(12n),
                                                                                                                  alignment: _descriptor_9.alignment() } }] } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(2n),
                                                                                                                  alignment: _descriptor_9.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(digest_0),
                                                                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Not a registered store');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(13n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(commitment_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  _bumpSubcategory_0(context, partialProofData, sub_0, q_0) {
    if (sub_0 === 0) {
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_9.toValue(0n),
                                                                    alignment: _descriptor_9.alignment() } },
                                                         { tag: 'value',
                                                           value: { value: _descriptor_9.toValue(0n),
                                                                    alignment: _descriptor_9.alignment() } }] } },
                                         { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                { value: _descriptor_0.toValue(q_0),
                                                                  alignment: _descriptor_0.alignment() }
                                                                  .value
                                                              )) } },
                                         { ins: { cached: true, n: 2 } }]);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_9.toValue(0n),
                                                                    alignment: _descriptor_9.alignment() } },
                                                         { tag: 'value',
                                                           value: { value: _descriptor_9.toValue(6n),
                                                                    alignment: _descriptor_9.alignment() } }] } },
                                         { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                { value: _descriptor_0.toValue(q_0),
                                                                  alignment: _descriptor_0.alignment() }
                                                                  .value
                                                              )) } },
                                         { ins: { cached: true, n: 2 } }]);
    } else {
      if (sub_0 === 1) {
        __compactRuntime.queryLedgerState(context,
                                          partialProofData,
                                          [
                                           { idx: { cached: false,
                                                    pushPath: true,
                                                    path: [
                                                           { tag: 'value',
                                                             value: { value: _descriptor_9.toValue(0n),
                                                                      alignment: _descriptor_9.alignment() } },
                                                           { tag: 'value',
                                                             value: { value: _descriptor_9.toValue(0n),
                                                                      alignment: _descriptor_9.alignment() } }] } },
                                           { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                  { value: _descriptor_0.toValue(q_0),
                                                                    alignment: _descriptor_0.alignment() }
                                                                    .value
                                                                )) } },
                                           { ins: { cached: true, n: 2 } }]);
        __compactRuntime.queryLedgerState(context,
                                          partialProofData,
                                          [
                                           { idx: { cached: false,
                                                    pushPath: true,
                                                    path: [
                                                           { tag: 'value',
                                                             value: { value: _descriptor_9.toValue(1n),
                                                                      alignment: _descriptor_9.alignment() } },
                                                           { tag: 'value',
                                                             value: { value: _descriptor_9.toValue(0n),
                                                                      alignment: _descriptor_9.alignment() } }] } },
                                           { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                  { value: _descriptor_0.toValue(q_0),
                                                                    alignment: _descriptor_0.alignment() }
                                                                    .value
                                                                )) } },
                                           { ins: { cached: true, n: 2 } }]);
      } else {
        if (sub_0 === 2) {
          __compactRuntime.queryLedgerState(context,
                                            partialProofData,
                                            [
                                             { idx: { cached: false,
                                                      pushPath: true,
                                                      path: [
                                                             { tag: 'value',
                                                               value: { value: _descriptor_9.toValue(0n),
                                                                        alignment: _descriptor_9.alignment() } },
                                                             { tag: 'value',
                                                               value: { value: _descriptor_9.toValue(0n),
                                                                        alignment: _descriptor_9.alignment() } }] } },
                                             { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                    { value: _descriptor_0.toValue(q_0),
                                                                      alignment: _descriptor_0.alignment() }
                                                                      .value
                                                                  )) } },
                                             { ins: { cached: true, n: 2 } }]);
          __compactRuntime.queryLedgerState(context,
                                            partialProofData,
                                            [
                                             { idx: { cached: false,
                                                      pushPath: true,
                                                      path: [
                                                             { tag: 'value',
                                                               value: { value: _descriptor_9.toValue(1n),
                                                                        alignment: _descriptor_9.alignment() } },
                                                             { tag: 'value',
                                                               value: { value: _descriptor_9.toValue(1n),
                                                                        alignment: _descriptor_9.alignment() } }] } },
                                             { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                    { value: _descriptor_0.toValue(q_0),
                                                                      alignment: _descriptor_0.alignment() }
                                                                      .value
                                                                  )) } },
                                             { ins: { cached: true, n: 2 } }]);
        } else {
          if (sub_0 === 3) {
            __compactRuntime.queryLedgerState(context,
                                              partialProofData,
                                              [
                                               { idx: { cached: false,
                                                        pushPath: true,
                                                        path: [
                                                               { tag: 'value',
                                                                 value: { value: _descriptor_9.toValue(0n),
                                                                          alignment: _descriptor_9.alignment() } },
                                                               { tag: 'value',
                                                                 value: { value: _descriptor_9.toValue(0n),
                                                                          alignment: _descriptor_9.alignment() } }] } },
                                               { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                      { value: _descriptor_0.toValue(q_0),
                                                                        alignment: _descriptor_0.alignment() }
                                                                        .value
                                                                    )) } },
                                               { ins: { cached: true, n: 2 } }]);
            __compactRuntime.queryLedgerState(context,
                                              partialProofData,
                                              [
                                               { idx: { cached: false,
                                                        pushPath: true,
                                                        path: [
                                                               { tag: 'value',
                                                                 value: { value: _descriptor_9.toValue(1n),
                                                                          alignment: _descriptor_9.alignment() } },
                                                               { tag: 'value',
                                                                 value: { value: _descriptor_9.toValue(2n),
                                                                          alignment: _descriptor_9.alignment() } }] } },
                                               { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                      { value: _descriptor_0.toValue(q_0),
                                                                        alignment: _descriptor_0.alignment() }
                                                                        .value
                                                                    )) } },
                                               { ins: { cached: true, n: 2 } }]);
          } else {
            if (sub_0 === 4) {
              __compactRuntime.queryLedgerState(context,
                                                partialProofData,
                                                [
                                                 { idx: { cached: false,
                                                          pushPath: true,
                                                          path: [
                                                                 { tag: 'value',
                                                                   value: { value: _descriptor_9.toValue(0n),
                                                                            alignment: _descriptor_9.alignment() } },
                                                                 { tag: 'value',
                                                                   value: { value: _descriptor_9.toValue(0n),
                                                                            alignment: _descriptor_9.alignment() } }] } },
                                                 { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                        { value: _descriptor_0.toValue(q_0),
                                                                          alignment: _descriptor_0.alignment() }
                                                                          .value
                                                                      )) } },
                                                 { ins: { cached: true, n: 2 } }]);
              __compactRuntime.queryLedgerState(context,
                                                partialProofData,
                                                [
                                                 { idx: { cached: false,
                                                          pushPath: true,
                                                          path: [
                                                                 { tag: 'value',
                                                                   value: { value: _descriptor_9.toValue(1n),
                                                                            alignment: _descriptor_9.alignment() } },
                                                                 { tag: 'value',
                                                                   value: { value: _descriptor_9.toValue(3n),
                                                                            alignment: _descriptor_9.alignment() } }] } },
                                                 { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                        { value: _descriptor_0.toValue(q_0),
                                                                          alignment: _descriptor_0.alignment() }
                                                                          .value
                                                                      )) } },
                                                 { ins: { cached: true, n: 2 } }]);
            } else {
              if (sub_0 === 5) {
                __compactRuntime.queryLedgerState(context,
                                                  partialProofData,
                                                  [
                                                   { idx: { cached: false,
                                                            pushPath: true,
                                                            path: [
                                                                   { tag: 'value',
                                                                     value: { value: _descriptor_9.toValue(0n),
                                                                              alignment: _descriptor_9.alignment() } },
                                                                   { tag: 'value',
                                                                     value: { value: _descriptor_9.toValue(0n),
                                                                              alignment: _descriptor_9.alignment() } }] } },
                                                   { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                          { value: _descriptor_0.toValue(q_0),
                                                                            alignment: _descriptor_0.alignment() }
                                                                            .value
                                                                        )) } },
                                                   { ins: { cached: true, n: 2 } }]);
                __compactRuntime.queryLedgerState(context,
                                                  partialProofData,
                                                  [
                                                   { idx: { cached: false,
                                                            pushPath: true,
                                                            path: [
                                                                   { tag: 'value',
                                                                     value: { value: _descriptor_9.toValue(1n),
                                                                              alignment: _descriptor_9.alignment() } },
                                                                   { tag: 'value',
                                                                     value: { value: _descriptor_9.toValue(4n),
                                                                              alignment: _descriptor_9.alignment() } }] } },
                                                   { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                          { value: _descriptor_0.toValue(q_0),
                                                                            alignment: _descriptor_0.alignment() }
                                                                            .value
                                                                        )) } },
                                                   { ins: { cached: true, n: 2 } }]);
              } else {
                if (sub_0 === 6) {
                  __compactRuntime.queryLedgerState(context,
                                                    partialProofData,
                                                    [
                                                     { idx: { cached: false,
                                                              pushPath: true,
                                                              path: [
                                                                     { tag: 'value',
                                                                       value: { value: _descriptor_9.toValue(0n),
                                                                                alignment: _descriptor_9.alignment() } },
                                                                     { tag: 'value',
                                                                       value: { value: _descriptor_9.toValue(1n),
                                                                                alignment: _descriptor_9.alignment() } }] } },
                                                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                            { value: _descriptor_0.toValue(q_0),
                                                                              alignment: _descriptor_0.alignment() }
                                                                              .value
                                                                          )) } },
                                                     { ins: { cached: true, n: 2 } }]);
                  __compactRuntime.queryLedgerState(context,
                                                    partialProofData,
                                                    [
                                                     { idx: { cached: false,
                                                              pushPath: true,
                                                              path: [
                                                                     { tag: 'value',
                                                                       value: { value: _descriptor_9.toValue(1n),
                                                                                alignment: _descriptor_9.alignment() } },
                                                                     { tag: 'value',
                                                                       value: { value: _descriptor_9.toValue(5n),
                                                                                alignment: _descriptor_9.alignment() } }] } },
                                                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                            { value: _descriptor_0.toValue(q_0),
                                                                              alignment: _descriptor_0.alignment() }
                                                                              .value
                                                                          )) } },
                                                     { ins: { cached: true, n: 2 } }]);
                } else {
                  if (sub_0 === 7) {
                    __compactRuntime.queryLedgerState(context,
                                                      partialProofData,
                                                      [
                                                       { idx: { cached: false,
                                                                pushPath: true,
                                                                path: [
                                                                       { tag: 'value',
                                                                         value: { value: _descriptor_9.toValue(0n),
                                                                                  alignment: _descriptor_9.alignment() } },
                                                                       { tag: 'value',
                                                                         value: { value: _descriptor_9.toValue(1n),
                                                                                  alignment: _descriptor_9.alignment() } }] } },
                                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                              { value: _descriptor_0.toValue(q_0),
                                                                                alignment: _descriptor_0.alignment() }
                                                                                .value
                                                                            )) } },
                                                       { ins: { cached: true,
                                                                n: 2 } }]);
                    __compactRuntime.queryLedgerState(context,
                                                      partialProofData,
                                                      [
                                                       { idx: { cached: false,
                                                                pushPath: true,
                                                                path: [
                                                                       { tag: 'value',
                                                                         value: { value: _descriptor_9.toValue(1n),
                                                                                  alignment: _descriptor_9.alignment() } },
                                                                       { tag: 'value',
                                                                         value: { value: _descriptor_9.toValue(6n),
                                                                                  alignment: _descriptor_9.alignment() } }] } },
                                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                              { value: _descriptor_0.toValue(q_0),
                                                                                alignment: _descriptor_0.alignment() }
                                                                                .value
                                                                            )) } },
                                                       { ins: { cached: true,
                                                                n: 2 } }]);
                  } else {
                    if (sub_0 === 8) {
                      __compactRuntime.queryLedgerState(context,
                                                        partialProofData,
                                                        [
                                                         { idx: { cached: false,
                                                                  pushPath: true,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_9.toValue(0n),
                                                                                    alignment: _descriptor_9.alignment() } },
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_9.toValue(1n),
                                                                                    alignment: _descriptor_9.alignment() } }] } },
                                                         { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                { value: _descriptor_0.toValue(q_0),
                                                                                  alignment: _descriptor_0.alignment() }
                                                                                  .value
                                                                              )) } },
                                                         { ins: { cached: true,
                                                                  n: 2 } }]);
                      __compactRuntime.queryLedgerState(context,
                                                        partialProofData,
                                                        [
                                                         { idx: { cached: false,
                                                                  pushPath: true,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_9.toValue(1n),
                                                                                    alignment: _descriptor_9.alignment() } },
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_9.toValue(7n),
                                                                                    alignment: _descriptor_9.alignment() } }] } },
                                                         { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                { value: _descriptor_0.toValue(q_0),
                                                                                  alignment: _descriptor_0.alignment() }
                                                                                  .value
                                                                              )) } },
                                                         { ins: { cached: true,
                                                                  n: 2 } }]);
                    } else {
                      if (sub_0 === 9) {
                        __compactRuntime.queryLedgerState(context,
                                                          partialProofData,
                                                          [
                                                           { idx: { cached: false,
                                                                    pushPath: true,
                                                                    path: [
                                                                           { tag: 'value',
                                                                             value: { value: _descriptor_9.toValue(0n),
                                                                                      alignment: _descriptor_9.alignment() } },
                                                                           { tag: 'value',
                                                                             value: { value: _descriptor_9.toValue(1n),
                                                                                      alignment: _descriptor_9.alignment() } }] } },
                                                           { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                  { value: _descriptor_0.toValue(q_0),
                                                                                    alignment: _descriptor_0.alignment() }
                                                                                    .value
                                                                                )) } },
                                                           { ins: { cached: true,
                                                                    n: 2 } }]);
                        __compactRuntime.queryLedgerState(context,
                                                          partialProofData,
                                                          [
                                                           { idx: { cached: false,
                                                                    pushPath: true,
                                                                    path: [
                                                                           { tag: 'value',
                                                                             value: { value: _descriptor_9.toValue(1n),
                                                                                      alignment: _descriptor_9.alignment() } },
                                                                           { tag: 'value',
                                                                             value: { value: _descriptor_9.toValue(8n),
                                                                                      alignment: _descriptor_9.alignment() } }] } },
                                                           { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                  { value: _descriptor_0.toValue(q_0),
                                                                                    alignment: _descriptor_0.alignment() }
                                                                                    .value
                                                                                )) } },
                                                           { ins: { cached: true,
                                                                    n: 2 } }]);
                      } else {
                        if (sub_0 === 10) {
                          __compactRuntime.queryLedgerState(context,
                                                            partialProofData,
                                                            [
                                                             { idx: { cached: false,
                                                                      pushPath: true,
                                                                      path: [
                                                                             { tag: 'value',
                                                                               value: { value: _descriptor_9.toValue(0n),
                                                                                        alignment: _descriptor_9.alignment() } },
                                                                             { tag: 'value',
                                                                               value: { value: _descriptor_9.toValue(1n),
                                                                                        alignment: _descriptor_9.alignment() } }] } },
                                                             { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                    { value: _descriptor_0.toValue(q_0),
                                                                                      alignment: _descriptor_0.alignment() }
                                                                                      .value
                                                                                  )) } },
                                                             { ins: { cached: true,
                                                                      n: 2 } }]);
                          __compactRuntime.queryLedgerState(context,
                                                            partialProofData,
                                                            [
                                                             { idx: { cached: false,
                                                                      pushPath: true,
                                                                      path: [
                                                                             { tag: 'value',
                                                                               value: { value: _descriptor_9.toValue(1n),
                                                                                        alignment: _descriptor_9.alignment() } },
                                                                             { tag: 'value',
                                                                               value: { value: _descriptor_9.toValue(9n),
                                                                                        alignment: _descriptor_9.alignment() } }] } },
                                                             { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                    { value: _descriptor_0.toValue(q_0),
                                                                                      alignment: _descriptor_0.alignment() }
                                                                                      .value
                                                                                  )) } },
                                                             { ins: { cached: true,
                                                                      n: 2 } }]);
                        } else {
                          if (sub_0 === 11) {
                            __compactRuntime.queryLedgerState(context,
                                                              partialProofData,
                                                              [
                                                               { idx: { cached: false,
                                                                        pushPath: true,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_9.toValue(0n),
                                                                                          alignment: _descriptor_9.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_9.toValue(2n),
                                                                                          alignment: _descriptor_9.alignment() } }] } },
                                                               { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                      { value: _descriptor_0.toValue(q_0),
                                                                                        alignment: _descriptor_0.alignment() }
                                                                                        .value
                                                                                    )) } },
                                                               { ins: { cached: true,
                                                                        n: 2 } }]);
                            __compactRuntime.queryLedgerState(context,
                                                              partialProofData,
                                                              [
                                                               { idx: { cached: false,
                                                                        pushPath: true,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_9.toValue(1n),
                                                                                          alignment: _descriptor_9.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_9.toValue(10n),
                                                                                          alignment: _descriptor_9.alignment() } }] } },
                                                               { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                      { value: _descriptor_0.toValue(q_0),
                                                                                        alignment: _descriptor_0.alignment() }
                                                                                        .value
                                                                                    )) } },
                                                               { ins: { cached: true,
                                                                        n: 2 } }]);
                          } else {
                            if (sub_0 === 12) {
                              __compactRuntime.queryLedgerState(context,
                                                                partialProofData,
                                                                [
                                                                 { idx: { cached: false,
                                                                          pushPath: true,
                                                                          path: [
                                                                                 { tag: 'value',
                                                                                   value: { value: _descriptor_9.toValue(0n),
                                                                                            alignment: _descriptor_9.alignment() } },
                                                                                 { tag: 'value',
                                                                                   value: { value: _descriptor_9.toValue(2n),
                                                                                            alignment: _descriptor_9.alignment() } }] } },
                                                                 { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                        { value: _descriptor_0.toValue(q_0),
                                                                                          alignment: _descriptor_0.alignment() }
                                                                                          .value
                                                                                      )) } },
                                                                 { ins: { cached: true,
                                                                          n: 2 } }]);
                              __compactRuntime.queryLedgerState(context,
                                                                partialProofData,
                                                                [
                                                                 { idx: { cached: false,
                                                                          pushPath: true,
                                                                          path: [
                                                                                 { tag: 'value',
                                                                                   value: { value: _descriptor_9.toValue(1n),
                                                                                            alignment: _descriptor_9.alignment() } },
                                                                                 { tag: 'value',
                                                                                   value: { value: _descriptor_9.toValue(11n),
                                                                                            alignment: _descriptor_9.alignment() } }] } },
                                                                 { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                        { value: _descriptor_0.toValue(q_0),
                                                                                          alignment: _descriptor_0.alignment() }
                                                                                          .value
                                                                                      )) } },
                                                                 { ins: { cached: true,
                                                                          n: 2 } }]);
                            } else {
                              if (sub_0 === 13) {
                                __compactRuntime.queryLedgerState(context,
                                                                  partialProofData,
                                                                  [
                                                                   { idx: { cached: false,
                                                                            pushPath: true,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_9.toValue(0n),
                                                                                              alignment: _descriptor_9.alignment() } },
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_9.toValue(2n),
                                                                                              alignment: _descriptor_9.alignment() } }] } },
                                                                   { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                          { value: _descriptor_0.toValue(q_0),
                                                                                            alignment: _descriptor_0.alignment() }
                                                                                            .value
                                                                                        )) } },
                                                                   { ins: { cached: true,
                                                                            n: 2 } }]);
                                __compactRuntime.queryLedgerState(context,
                                                                  partialProofData,
                                                                  [
                                                                   { idx: { cached: false,
                                                                            pushPath: true,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_9.toValue(1n),
                                                                                              alignment: _descriptor_9.alignment() } },
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_9.toValue(12n),
                                                                                              alignment: _descriptor_9.alignment() } }] } },
                                                                   { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                          { value: _descriptor_0.toValue(q_0),
                                                                                            alignment: _descriptor_0.alignment() }
                                                                                            .value
                                                                                        )) } },
                                                                   { ins: { cached: true,
                                                                            n: 2 } }]);
                              } else {
                                if (sub_0 === 14) {
                                  __compactRuntime.queryLedgerState(context,
                                                                    partialProofData,
                                                                    [
                                                                     { idx: { cached: false,
                                                                              pushPath: true,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_9.toValue(0n),
                                                                                                alignment: _descriptor_9.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_9.toValue(2n),
                                                                                                alignment: _descriptor_9.alignment() } }] } },
                                                                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                            { value: _descriptor_0.toValue(q_0),
                                                                                              alignment: _descriptor_0.alignment() }
                                                                                              .value
                                                                                          )) } },
                                                                     { ins: { cached: true,
                                                                              n: 2 } }]);
                                  __compactRuntime.queryLedgerState(context,
                                                                    partialProofData,
                                                                    [
                                                                     { idx: { cached: false,
                                                                              pushPath: true,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_9.toValue(1n),
                                                                                                alignment: _descriptor_9.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_9.toValue(13n),
                                                                                                alignment: _descriptor_9.alignment() } }] } },
                                                                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                            { value: _descriptor_0.toValue(q_0),
                                                                                              alignment: _descriptor_0.alignment() }
                                                                                              .value
                                                                                          )) } },
                                                                     { ins: { cached: true,
                                                                              n: 2 } }]);
                                } else {
                                  if (sub_0 === 15) {
                                    __compactRuntime.queryLedgerState(context,
                                                                      partialProofData,
                                                                      [
                                                                       { idx: { cached: false,
                                                                                pushPath: true,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_9.toValue(0n),
                                                                                                  alignment: _descriptor_9.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_9.toValue(2n),
                                                                                                  alignment: _descriptor_9.alignment() } }] } },
                                                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                              { value: _descriptor_0.toValue(q_0),
                                                                                                alignment: _descriptor_0.alignment() }
                                                                                                .value
                                                                                            )) } },
                                                                       { ins: { cached: true,
                                                                                n: 2 } }]);
                                    __compactRuntime.queryLedgerState(context,
                                                                      partialProofData,
                                                                      [
                                                                       { idx: { cached: false,
                                                                                pushPath: true,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_9.toValue(1n),
                                                                                                  alignment: _descriptor_9.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_9.toValue(14n),
                                                                                                  alignment: _descriptor_9.alignment() } }] } },
                                                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                              { value: _descriptor_0.toValue(q_0),
                                                                                                alignment: _descriptor_0.alignment() }
                                                                                                .value
                                                                                            )) } },
                                                                       { ins: { cached: true,
                                                                                n: 2 } }]);
                                  } else {
                                    if (sub_0 === 16) {
                                      __compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { idx: { cached: false,
                                                                                  pushPath: true,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_9.toValue(0n),
                                                                                                    alignment: _descriptor_9.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_9.toValue(3n),
                                                                                                    alignment: _descriptor_9.alignment() } }] } },
                                                                         { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                { value: _descriptor_0.toValue(q_0),
                                                                                                  alignment: _descriptor_0.alignment() }
                                                                                                  .value
                                                                                              )) } },
                                                                         { ins: { cached: true,
                                                                                  n: 2 } }]);
                                      __compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { idx: { cached: false,
                                                                                  pushPath: true,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_9.toValue(2n),
                                                                                                    alignment: _descriptor_9.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_9.toValue(0n),
                                                                                                    alignment: _descriptor_9.alignment() } }] } },
                                                                         { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                { value: _descriptor_0.toValue(q_0),
                                                                                                  alignment: _descriptor_0.alignment() }
                                                                                                  .value
                                                                                              )) } },
                                                                         { ins: { cached: true,
                                                                                  n: 2 } }]);
                                    } else {
                                      if (sub_0 === 17) {
                                        __compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { idx: { cached: false,
                                                                                    pushPath: true,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_9.toValue(0n),
                                                                                                      alignment: _descriptor_9.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_9.toValue(3n),
                                                                                                      alignment: _descriptor_9.alignment() } }] } },
                                                                           { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                  { value: _descriptor_0.toValue(q_0),
                                                                                                    alignment: _descriptor_0.alignment() }
                                                                                                    .value
                                                                                                )) } },
                                                                           { ins: { cached: true,
                                                                                    n: 2 } }]);
                                        __compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { idx: { cached: false,
                                                                                    pushPath: true,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_9.toValue(2n),
                                                                                                      alignment: _descriptor_9.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_9.toValue(1n),
                                                                                                      alignment: _descriptor_9.alignment() } }] } },
                                                                           { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                  { value: _descriptor_0.toValue(q_0),
                                                                                                    alignment: _descriptor_0.alignment() }
                                                                                                    .value
                                                                                                )) } },
                                                                           { ins: { cached: true,
                                                                                    n: 2 } }]);
                                      } else {
                                        if (sub_0 === 18) {
                                          __compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { idx: { cached: false,
                                                                                      pushPath: true,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_9.toValue(0n),
                                                                                                        alignment: _descriptor_9.alignment() } },
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_9.toValue(3n),
                                                                                                        alignment: _descriptor_9.alignment() } }] } },
                                                                             { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                    { value: _descriptor_0.toValue(q_0),
                                                                                                      alignment: _descriptor_0.alignment() }
                                                                                                      .value
                                                                                                  )) } },
                                                                             { ins: { cached: true,
                                                                                      n: 2 } }]);
                                          __compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { idx: { cached: false,
                                                                                      pushPath: true,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_9.toValue(2n),
                                                                                                        alignment: _descriptor_9.alignment() } },
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_9.toValue(2n),
                                                                                                        alignment: _descriptor_9.alignment() } }] } },
                                                                             { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                    { value: _descriptor_0.toValue(q_0),
                                                                                                      alignment: _descriptor_0.alignment() }
                                                                                                      .value
                                                                                                  )) } },
                                                                             { ins: { cached: true,
                                                                                      n: 2 } }]);
                                        } else {
                                          if (sub_0 === 19) {
                                            __compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { idx: { cached: false,
                                                                                        pushPath: true,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_9.toValue(0n),
                                                                                                          alignment: _descriptor_9.alignment() } },
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_9.toValue(3n),
                                                                                                          alignment: _descriptor_9.alignment() } }] } },
                                                                               { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                      { value: _descriptor_0.toValue(q_0),
                                                                                                        alignment: _descriptor_0.alignment() }
                                                                                                        .value
                                                                                                    )) } },
                                                                               { ins: { cached: true,
                                                                                        n: 2 } }]);
                                            __compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { idx: { cached: false,
                                                                                        pushPath: true,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_9.toValue(2n),
                                                                                                          alignment: _descriptor_9.alignment() } },
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_9.toValue(3n),
                                                                                                          alignment: _descriptor_9.alignment() } }] } },
                                                                               { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                      { value: _descriptor_0.toValue(q_0),
                                                                                                        alignment: _descriptor_0.alignment() }
                                                                                                        .value
                                                                                                    )) } },
                                                                               { ins: { cached: true,
                                                                                        n: 2 } }]);
                                          } else {
                                            if (sub_0 === 20) {
                                              __compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { idx: { cached: false,
                                                                                          pushPath: true,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_9.toValue(0n),
                                                                                                            alignment: _descriptor_9.alignment() } },
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_9.toValue(4n),
                                                                                                            alignment: _descriptor_9.alignment() } }] } },
                                                                                 { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                        { value: _descriptor_0.toValue(q_0),
                                                                                                          alignment: _descriptor_0.alignment() }
                                                                                                          .value
                                                                                                      )) } },
                                                                                 { ins: { cached: true,
                                                                                          n: 2 } }]);
                                              __compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { idx: { cached: false,
                                                                                          pushPath: true,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_9.toValue(2n),
                                                                                                            alignment: _descriptor_9.alignment() } },
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_9.toValue(4n),
                                                                                                            alignment: _descriptor_9.alignment() } }] } },
                                                                                 { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                        { value: _descriptor_0.toValue(q_0),
                                                                                                          alignment: _descriptor_0.alignment() }
                                                                                                          .value
                                                                                                      )) } },
                                                                                 { ins: { cached: true,
                                                                                          n: 2 } }]);
                                            } else {
                                              if (sub_0 === 21) {
                                                __compactRuntime.queryLedgerState(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { idx: { cached: false,
                                                                                            pushPath: true,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_9.toValue(0n),
                                                                                                              alignment: _descriptor_9.alignment() } },
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_9.toValue(4n),
                                                                                                              alignment: _descriptor_9.alignment() } }] } },
                                                                                   { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                          { value: _descriptor_0.toValue(q_0),
                                                                                                            alignment: _descriptor_0.alignment() }
                                                                                                            .value
                                                                                                        )) } },
                                                                                   { ins: { cached: true,
                                                                                            n: 2 } }]);
                                                __compactRuntime.queryLedgerState(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { idx: { cached: false,
                                                                                            pushPath: true,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_9.toValue(2n),
                                                                                                              alignment: _descriptor_9.alignment() } },
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_9.toValue(5n),
                                                                                                              alignment: _descriptor_9.alignment() } }] } },
                                                                                   { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                          { value: _descriptor_0.toValue(q_0),
                                                                                                            alignment: _descriptor_0.alignment() }
                                                                                                            .value
                                                                                                        )) } },
                                                                                   { ins: { cached: true,
                                                                                            n: 2 } }]);
                                              } else {
                                                if (sub_0 === 22) {
                                                  __compactRuntime.queryLedgerState(context,
                                                                                    partialProofData,
                                                                                    [
                                                                                     { idx: { cached: false,
                                                                                              pushPath: true,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_9.toValue(0n),
                                                                                                                alignment: _descriptor_9.alignment() } },
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_9.toValue(4n),
                                                                                                                alignment: _descriptor_9.alignment() } }] } },
                                                                                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                            { value: _descriptor_0.toValue(q_0),
                                                                                                              alignment: _descriptor_0.alignment() }
                                                                                                              .value
                                                                                                          )) } },
                                                                                     { ins: { cached: true,
                                                                                              n: 2 } }]);
                                                  __compactRuntime.queryLedgerState(context,
                                                                                    partialProofData,
                                                                                    [
                                                                                     { idx: { cached: false,
                                                                                              pushPath: true,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_9.toValue(2n),
                                                                                                                alignment: _descriptor_9.alignment() } },
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_9.toValue(6n),
                                                                                                                alignment: _descriptor_9.alignment() } }] } },
                                                                                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                            { value: _descriptor_0.toValue(q_0),
                                                                                                              alignment: _descriptor_0.alignment() }
                                                                                                              .value
                                                                                                          )) } },
                                                                                     { ins: { cached: true,
                                                                                              n: 2 } }]);
                                                } else {
                                                  if (sub_0 === 23) {
                                                    __compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { idx: { cached: false,
                                                                                                pushPath: true,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(0n),
                                                                                                                  alignment: _descriptor_9.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(4n),
                                                                                                                  alignment: _descriptor_9.alignment() } }] } },
                                                                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                              { value: _descriptor_0.toValue(q_0),
                                                                                                                alignment: _descriptor_0.alignment() }
                                                                                                                .value
                                                                                                            )) } },
                                                                                       { ins: { cached: true,
                                                                                                n: 2 } }]);
                                                    __compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { idx: { cached: false,
                                                                                                pushPath: true,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(2n),
                                                                                                                  alignment: _descriptor_9.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(7n),
                                                                                                                  alignment: _descriptor_9.alignment() } }] } },
                                                                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                              { value: _descriptor_0.toValue(q_0),
                                                                                                                alignment: _descriptor_0.alignment() }
                                                                                                                .value
                                                                                                            )) } },
                                                                                       { ins: { cached: true,
                                                                                                n: 2 } }]);
                                                  } else {
                                                    __compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { idx: { cached: false,
                                                                                                pushPath: true,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(0n),
                                                                                                                  alignment: _descriptor_9.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(5n),
                                                                                                                  alignment: _descriptor_9.alignment() } }] } },
                                                                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                                              { value: _descriptor_0.toValue(q_0),
                                                                                                                alignment: _descriptor_0.alignment() }
                                                                                                                .value
                                                                                                            )) } },
                                                                                       { ins: { cached: true,
                                                                                                n: 2 } }]);
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return [];
  }
  _submitPurchase_0(context, partialProofData) {
    const receipt_0 = this._getReceipt_0(context, partialProofData);
    const commitment_0 = this._receiptCommitment_0(receipt_0);
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(2n),
                                                                                                                  alignment: _descriptor_9.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_9.toValue(13n),
                                                                                                                  alignment: _descriptor_9.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(commitment_0),
                                                                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Receipt not attested by a registered store');
    __compactRuntime.assert(!_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_9.toValue(14n),
                                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(commitment_0),
                                                                                                                                               alignment: _descriptor_3.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Receipt already used');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(14n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(commitment_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    const count_0 = receipt_0.lineCount;
    this._folder_1(context,
                   partialProofData,
                   ((context, partialProofData, t_0, i_0) =>
                    {
                      let t_1;
                      if (t_1 = i_0, t_1 < count_0) {
                        const sub_0 = receipt_0.lines[i_0].subcategory;
                        const q_0 = receipt_0.lines[i_0].qty;
                        this._bumpSubcategory_0(context,
                                                partialProofData,
                                                sub_0,
                                                q_0);
                        __compactRuntime.queryLedgerState(context,
                                                          partialProofData,
                                                          [
                                                           { idx: { cached: false,
                                                                    pushPath: true,
                                                                    path: [
                                                                           { tag: 'value',
                                                                             value: { value: _descriptor_9.toValue(2n),
                                                                                      alignment: _descriptor_9.alignment() } },
                                                                           { tag: 'value',
                                                                             value: { value: _descriptor_9.toValue(8n),
                                                                                      alignment: _descriptor_9.alignment() } }] } },
                                                           { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                                  { value: _descriptor_0.toValue(q_0),
                                                                                    alignment: _descriptor_0.alignment() }
                                                                                    .value
                                                                                )) } },
                                                           { ins: { cached: true,
                                                                    n: 2 } }]);
                      }
                      return t_0;
                    }),
                   [],
                   [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n]);
    return [];
  }
  _seed_0(context,
          partialProofData,
          initMobile_0,
          initTablet_0,
          initComputer_0,
          initCamera_0,
          initAudio_0,
          initGaming_0,
          initShoes_0,
          initTops_0,
          initBottoms_0,
          initAccessories_0,
          initOuterwear_0,
          initGroceries_0,
          initRestaurant_0,
          initCafes_0,
          initFastfood_0,
          initLocalshops_0,
          initEquipment_0,
          initClothing_0,
          initFootwear_0,
          initSupplements_0,
          initFurniture_0,
          initAppliances_0,
          initDecor_0,
          initTools_0,
          initOther_0,
          totalElectronics_0,
          totalFashion_0,
          totalFood_0,
          totalSports_0,
          totalHome_0,
          grandTotal_0)
  {
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(6n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initMobile_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initTablet_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initComputer_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initCamera_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(3n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initAudio_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(4n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initGaming_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(5n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initShoes_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(6n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initTops_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(7n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initBottoms_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(8n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initAccessories_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(9n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initOuterwear_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(10n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initGroceries_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(11n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initRestaurant_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(12n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initCafes_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(13n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initFastfood_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(14n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initLocalshops_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initEquipment_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initClothing_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initFootwear_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(3n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initSupplements_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(4n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initFurniture_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(5n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initAppliances_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(6n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initDecor_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(7n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initTools_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(totalElectronics_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(1n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(totalFashion_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(totalFood_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(3n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(totalSports_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(4n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(totalHome_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(0n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(5n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(initOther_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(8n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(grandTotal_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    const tmp_0 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(10n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(tmp_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  _registerCampaign_0(context, partialProofData) {
    const id_0 = _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_9.toValue(2n),
                                                                                                       alignment: _descriptor_9.alignment() } },
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_9.toValue(9n),
                                                                                                       alignment: _descriptor_9.alignment() } }] } },
                                                                            { popeq: { cached: true,
                                                                                       result: undefined } }]).value);
    const tmp_0 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(2n),
                                                                  alignment: _descriptor_9.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_9.toValue(9n),
                                                                  alignment: _descriptor_9.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(tmp_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    return id_0;
  }
  _folder_0(f, x, a0) {
    for (let i = 0; i < 10; i++) { x = f(x, a0[i]); }
    return x;
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _folder_1(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get signalsElectronics() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(0n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(0n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsFashion() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(0n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsFood() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(0n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsSports() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(0n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(3n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsHome() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(0n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(4n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsOther() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(0n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(5n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsMobile() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(0n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(6n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsTablet() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(0n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsComputer() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsCamera() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsAudio() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(3n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsGaming() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(4n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsShoes() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(5n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsTops() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(6n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsBottoms() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(7n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsAccessories() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(8n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsOuterwear() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(9n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsGroceries() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(10n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsRestaurant() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(11n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsCafes() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(12n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsFastfood() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(13n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsLocalshops() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(14n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsEquipment() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(0n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsClothing() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(1n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsFootwear() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsSupplements() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(3n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsFurniture() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(4n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsAppliances() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(5n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsDecor() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(6n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get signalsTools() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(7n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get totalSignals() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(8n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get campaignCount() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(9n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get isSeeded() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(10n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get admin() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(2n),
                                                                                                   alignment: _descriptor_9.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_9.toValue(11n),
                                                                                                   alignment: _descriptor_9.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    registeredStores: {
      isFull(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isFull: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(2n),
                                                                                                     alignment: _descriptor_9.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(12n),
                                                                                                     alignment: _descriptor_9.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(1n),
                                                                                                     alignment: _descriptor_9.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(1024n),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'lt',
                                                                          'neg',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      checkRoot(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`checkRoot: expected 1 argument, received ${args_0.length}`);
        }
        const rt_0 = args_0[0];
        if (!(typeof(rt_0) === 'object' && typeof(rt_0.field) === 'bigint' && rt_0.field >= 0 && rt_0.field <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('checkRoot',
                                     'argument 1',
                                     'aegis.compact line 95 char 1',
                                     'struct MerkleTreeDigest<field: Field>',
                                     rt_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(2n),
                                                                                                     alignment: _descriptor_9.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(12n),
                                                                                                     alignment: _descriptor_9.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(2n),
                                                                                                     alignment: _descriptor_9.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(rt_0),
                                                                                                                                 alignment: _descriptor_6.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      root(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`root: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2].asArray()[12];
        return ((result) => result             ? __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(result)             : undefined)(self_0.asArray()[0].asBoundedMerkleTree().rehash().root()?.value);
      },
      firstFree(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`first_free: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2].asArray()[12];
        return __compactRuntime.CompactTypeField.fromValue(self_0.asArray()[1].asCell().value);
      },
      pathForLeaf(...args_0) {
        if (args_0.length !== 2) {
          throw new __compactRuntime.CompactError(`path_for_leaf: expected 2 arguments, received ${args_0.length}`);
        }
        const index_0 = args_0[0];
        const leaf_0 = args_0[1];
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0 && index_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 1',
                                     'aegis.compact line 95 char 1',
                                     'Field',
                                     index_0)
        }
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 2',
                                     'aegis.compact line 95 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[2].asArray()[12];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(10, _descriptor_3).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().pathForLeaf(    index_0,    {      value: _descriptor_3.toValue(leaf_0),      alignment: _descriptor_3.alignment()    }  )?.value);
      },
      findPathForLeaf(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`find_path_for_leaf: expected 1 argument, received ${args_0.length}`);
        }
        const leaf_0 = args_0[0];
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('find_path_for_leaf',
                                     'argument 1',
                                     'aegis.compact line 95 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[2].asArray()[12];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(10, _descriptor_3).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().findPathForLeaf(    {      value: _descriptor_3.toValue(leaf_0),      alignment: _descriptor_3.alignment()    }  )?.value);
      },
      history(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`history: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2].asArray()[12];
        return self_0.asArray()[2].asMap().keys().map(  (elem) => __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    sealedReceipts: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(2n),
                                                                                                     alignment: _descriptor_9.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(13n),
                                                                                                     alignment: _descriptor_9.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(2n),
                                                                                                     alignment: _descriptor_9.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(13n),
                                                                                                     alignment: _descriptor_9.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'aegis.compact line 96 char 1',
                                     'Bytes<32>',
                                     elem_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(2n),
                                                                                                     alignment: _descriptor_9.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(13n),
                                                                                                     alignment: _descriptor_9.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2].asArray()[13];
        return self_0.asMap().keys().map((elem) => _descriptor_3.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    usedReceipts: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(2n),
                                                                                                     alignment: _descriptor_9.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(14n),
                                                                                                     alignment: _descriptor_9.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(2n),
                                                                                                     alignment: _descriptor_9.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(14n),
                                                                                                     alignment: _descriptor_9.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'aegis.compact line 97 char 1',
                                     'Bytes<32>',
                                     elem_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(2n),
                                                                                                     alignment: _descriptor_9.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_9.toValue(14n),
                                                                                                     alignment: _descriptor_9.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2].asArray()[14];
        return self_0.asMap().keys().map((elem) => _descriptor_3.fromValue(elem.value))[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  local_secret_key: (...args) => undefined,
  getStorePath: (...args) => undefined,
  getReceipt: (...args) => undefined
});
export const pureCircuits = {
  storePublicKey: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`storePublicKey: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_0 = args_0[0];
    if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32)) {
      __compactRuntime.typeError('storePublicKey',
                                 'argument 1',
                                 'aegis.compact line 103 char 1',
                                 'Bytes<32>',
                                 sk_0)
    }
    return _dummyContract._storePublicKey_0(sk_0);
  },
  receiptCommitment: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`receiptCommitment: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const r_0 = args_0[0];
    if (!(typeof(r_0) === 'object' && Array.isArray(r_0.lines) && r_0.lines.length === 8 && r_0.lines.every((t) => typeof(t) === 'object' && typeof(t.subcategory) === 'number' && t.subcategory >= 0 && t.subcategory <= 24 && typeof(t.qty) === 'bigint' && t.qty >= 0n && t.qty <= 65535n && typeof(t.amount) === 'bigint' && t.amount >= 0n && t.amount <= 18446744073709551615n) && typeof(r_0.lineCount) === 'bigint' && r_0.lineCount >= 0n && r_0.lineCount <= 255n && typeof(r_0.timestamp) === 'bigint' && r_0.timestamp >= 0n && r_0.timestamp <= 18446744073709551615n && r_0.nonce.buffer instanceof ArrayBuffer && r_0.nonce.BYTES_PER_ELEMENT === 1 && r_0.nonce.length === 32)) {
      __compactRuntime.typeError('receiptCommitment',
                                 'argument 1',
                                 'aegis.compact line 114 char 1',
                                 'struct Receipt<lines: Vector<8, struct SubcatLine<subcategory: Enum<Subcategory, mobile, tablet, computer, camera, audio, gaming, shoes, tops, bottoms, accessories, outerwear, groceries, restaurant, cafes, fastfood, localshops, equipment, clothing, footwear, supplements, furniture, appliances, decor, tools, other>, qty: Uint<0..65536>, amount: Uint<0..18446744073709551616>>>, lineCount: Uint<0..256>, timestamp: Uint<0..18446744073709551616>, nonce: Bytes<32>>',
                                 r_0)
    }
    return _dummyContract._receiptCommitment_0(r_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
