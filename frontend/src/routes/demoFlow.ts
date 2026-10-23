import { createContext, useContext } from 'react';

/** Por dónde va la publicación de una señal (ver UserView). */
export type PublishStep = 'proving' | 'signing' | 'sent' | 'aggregated' | 'failed';

/**
 * Por dónde va la demo. Lo cuentan la caja (StoreView) y el móvil
 * (UserView), y lo pinta la línea de progreso de DemoPage.
 */
export type DemoFlow = {
  cartCount: number;
  sealing: boolean;
  /** Ticket cobrado en la caja, hasta la siguiente venta. */
  sealedNonce: string | null;
  /** La ventana de publicar está abierta. */
  sheetOpen: boolean;
  /** El ticket que se está publicando (o el último) y por qué paso va. */
  publishing: { nonce: string; step: PublishStep } | null;
};

export const INITIAL_FLOW: DemoFlow = { cartCount: 0, sealing: false, sealedNonce: null, sheetOpen: false, publishing: null };

/** Para contarle a la demo un cambio. Fuera de ella (la app en /app) no hace nada. */
export const DemoFlowContext = createContext<(patch: Partial<DemoFlow>) => void>(() => {});

export function useReportFlow(): (patch: Partial<DemoFlow>) => void {
  return useContext(DemoFlowContext);
}
