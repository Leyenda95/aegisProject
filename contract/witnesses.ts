/**
 * Estado privado del contrato Aegis: la clave secreta de quien está
 * actuando (admin al dar de alta una tienda, o la propia tienda al sellar
 * un recibo) y el recibo que se está intentando enviar como señal.
 *
 * Nada de esto sale nunca del proceso que lo mantiene en memoria, ver
 * el diseño de privacidad en la memoria del proyecto: el recibo completo
 * (importe, timestamp) nunca debe persistirse ni registrarse en logs.
 */
import type { Receipt, Witnesses } from './managed/aegis/contract/index.js';

export type AegisPrivateState = {
  readonly secretKey: Uint8Array;
  readonly receipt: Receipt | null;
};

export const emptyPrivateState: AegisPrivateState = {
  secretKey: new Uint8Array(32),
  receipt: null,
};

export const witnesses: Witnesses<AegisPrivateState> = {
  local_secret_key: ({ privateState }) => [privateState, privateState.secretKey],

  // El árbol de tiendas ya está en el estado público (ledger); no hace
  // falta mantener una copia privada, basta con pedirle la ruta a la
  // tienda tal y como la ve el propio ledger ahora mismo.
  getStorePath: ({ ledger, privateState }, pk: Uint8Array) => {
    const path = ledger.registeredStores.findPathForLeaf(pk);
    if (!path) throw new Error('Store not registered in the Merkle tree');
    return [privateState, path];
  },

  getReceipt: ({ privateState }) => {
    if (!privateState.receipt) throw new Error('No receipt set in private state');
    return [privateState, privateState.receipt];
  },
};
