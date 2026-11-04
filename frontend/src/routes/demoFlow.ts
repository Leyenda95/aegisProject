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
  /** Se ha comprobado en Midnight que la tienda está en el registro (ver StoreRegistry). */
  storeChecked: boolean;
  /** La publicación que dejó atrás «Nueva venta»: ya no cuenta para la etapa. */
  dismissedNonce: string | null;
};

export const INITIAL_FLOW: DemoFlow = { cartCount: 0, sealing: false, sealedNonce: null, sheetOpen: false, publishing: null, storeChecked: false, dismissedNonce: null };

/**
 * Las etapas de una compra en la demo, en orden: de la cesta vacía a la
 * señal en el agregado. Las leen la línea de progreso y el tour guiado.
 */
export const STAGES = ['shop', 'cart', 'sealing', 'sealed', 'sharing', 'proving', 'sent', 'aggregated'] as const;
export type Stage = typeof STAGES[number];

const PUBLISH_STAGE: Partial<Record<PublishStep, Stage>> = {
  proving: 'proving', signing: 'proving', sent: 'sent', aggregated: 'aggregated',
};

/**
 * En qué etapa está la demo. Una publicación solo cuenta si es la del ticket
 * cobrado (o si no hay ninguno), y deja de contar en cuanto empieza otra venta.
 */
export function stageOf(flow: DemoFlow): Stage {
  const published = publishedStage(flow);
  if (published) return published;
  if (flow.sheetOpen) return 'sharing';
  if (flow.sealedNonce) return 'sealed';
  if (flow.sealing) return 'sealing';
  return flow.cartCount > 0 ? 'cart' : 'shop';
}

function publishedStage(flow: DemoFlow): Stage | undefined {
  const pub = flow.publishing;
  if (!pub || pub.nonce === flow.dismissedNonce) return undefined;
  const newSale = flow.cartCount > 0 && flow.sealedNonce === null;
  const otherTicket = flow.sealedNonce !== null && pub.nonce !== flow.sealedNonce;
  return newSale || otherTicket ? undefined : PUBLISH_STAGE[pub.step];
}

/** La etapa `stage` ya ha llegado a `target` (o más allá). */
export function reached(stage: Stage, target: Stage): boolean {
  return STAGES.indexOf(stage) >= STAGES.indexOf(target);
}

/** El ticket recién cobrado espera en el móvil: aún no se ha abierto para publicarlo. */
export function ticketWaiting(flow: DemoFlow): boolean {
  return flow.sealedNonce !== null && !flow.sheetOpen && flow.publishing?.nonce !== flow.sealedNonce;
}

/** Para contarle a la demo un cambio. Fuera de ella (la app en /app) no hace nada. */
export const DemoFlowContext = createContext<(patch: Partial<DemoFlow>) => void>(() => {});

export function useReportFlow(): (patch: Partial<DemoFlow>) => void {
  return useContext(DemoFlowContext);
}
