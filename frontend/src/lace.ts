import { API_BASE, type Lang } from './api.ts';
import { T } from './i18n.ts';

// Igual que ReceiptJSON en backend/src/contract.ts, el recibo tal y como
// viaja por la red y se codifica en el QR (bigint/Uint8Array no son JSON).
//
// `lines` = el rollup por subcategoría que SÍ se sella y se señala (máx 8,
// las de mayor importe). `subcategory` es el índice del enum Subcategory,
// `amount` va en céntimos como string.
//
// `items` es un extra SOLO del QR/dispositivo: el desglose por producto para
// pintar el ticket original y la animación de censura. El backend lo ignora.
export type ReceiptLine = { subcategory: number; qty: number; amount: string };
export type ReceiptItem = { name: string; qty: number; unitCents: number };
export type ReceiptJSON = {
  lines: ReceiptLine[];
  timestamp: string;
  nonce: string;
  items?: ReceiptItem[];
};

export type ConnectedAPI = {
  getUnshieldedAddress: () => Promise<{ unshieldedAddress: string }>;
  balanceUnsealedTransaction: (txHex: string) => Promise<{ tx: string }>;
  submitTransaction: (txHex: string) => Promise<void>;
};

// PermissionRejected/Rejected son decisiones reales del usuario en el popup
// de la wallet, nunca hay que reintentarlas solos (reabriría el popup sin que
// lo haya pedido). Todo lo demás (InternalError, Disconnected, InvalidRequest,
// o incluso un error que no siga el shape de la spec, como un "request failed"
// suelto) se trata como transitorio.
export function isDeliberateWalletRejection(e: any): boolean {
  return e?.code === 'PermissionRejected' || e?.code === 'Rejected';
}

/**
 * La wallet dio la sesión por terminada: el código Disconnected de la spec,
 * o solo el texto ("Not connected to wallet", "shutdown"...), según la
 * wallet. No se reintenta: hay que volver a conectar.
 */
export function isWalletDisconnected(e: any): boolean {
  if (e?.code === 'Disconnected') return true;
  const msg = String(e?.message ?? e?.reason ?? '');
  return /not connected|disconnected|shutdown|can no longer be used/i.test(msg);
}

/** Avisa a WalletProvider de que la wallet cortó la sesión a mitad de una acción. */
export const walletEvents = new EventTarget();

/**
 * La extensión corre su propio service worker (Manifest V3) y, si lleva un
 * rato inactivo, la primera llamada lo despierta pero el mensaje se pierde
 * antes de recibir respuesta: la promesa rechaza aunque la wallet esté bien.
 * El texto/código exacto del error varía por wallet (Lace lo llama
 * InternalError/"Wallet is unavailable", otras pueden dar solo "request
 * failed"), así que no filtramos por ese texto: reintentamos cualquier fallo
 * que no sea un rechazo deliberado del usuario. Un segundo intento casi
 * siempre funciona porque el worker ya está despierto, pero esa ventana es
 * corta (se vuelve a dormir en pocos segundos), así que el reintento es
 * automático e inmediato en vez de esperar a que el usuario pulse otra vez.
 */
async function withWalletUnavailableRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      if (isWalletDisconnected(e)) {
        walletEvents.dispatchEvent(new Event('disconnected'));
        throw e;
      }
      if (isDeliberateWalletRejection(e) || attempt === maxAttempts) throw e;
      console.warn(`Wallet call failed (attempt ${attempt}/${maxAttempts}), retrying`, e);
      await new Promise(resolve => setTimeout(resolve, 300 * attempt));
    }
  }
  throw new Error('unreachable');
}

export type WalletInfo = { key: string; name: string; icon: string; rdns: string; apiVersion: string };

// Las wallets se anuncian bajo claves arbitrarias (strings fijos como 'lace'/'1am',
// o UUIDs CAIP-372 según la versión), nunca asumir una clave concreta, usar nombre/rdns.
export function listWallets(): WalletInfo[] {
  const midnight = (window as any).midnight as Record<string, any> | undefined;
  if (!midnight) return [];
  return Object.entries(midnight).map(([key, api]) => ({
    key, name: api.name, icon: api.icon, rdns: api.rdns, apiVersion: api.apiVersion,
  }));
}

export async function connectWallet(walletKey: string, networkId: string): Promise<ConnectedAPI> {
  const midnight = (window as any).midnight as Record<string, any> | undefined;
  const api = midnight?.[walletKey];
  if (!api) throw new Error('Wallet extension not found. Please install Lace or 1AM.');

  return withWalletUnavailableRetry(() => api.connect(networkId));
}

/**
 * La wallet paga, firma y sella la transacción y la envía tal cual.
 * Devuelve la transacción sellada (hex), la misma que se envió: de ahí sale
 * su hash para el explorador (ver txHash.ts), porque submitTransaction no
 * devuelve nada.
 */
export async function laceBalanceAndSubmit(
  lace: ConnectedAPI,
  txHex: string,
): Promise<string> {
  const { tx: balancedHex } = await withWalletUnavailableRetry(() => lace.balanceUnsealedTransaction(txHex));
  await withWalletUnavailableRetry(() => lace.submitTransaction(balancedHex));
  return balancedHex;
}

/** No resuelve hasta que el indexer ya sirve estado para esa dirección (mismo motivo que el resto de *ViaLace). */
async function waitForContractIndexed(contractAddress: string, lang: Lang): Promise<void> {
  const { readChainState } = await import('./chainState.ts');
  await pollUntil(async () => {
    try { await readChainState(contractAddress); return true; } catch { return false; }
  }, lang);
}

export async function deployViaLace(
  lace: ConnectedAPI,
  lang: Lang,
  onWaiting?: () => void,
): Promise<string> {
  const r = await fetch(`${API_BASE}/build-tx/deploy`);
  if (!r.ok) throw new Error(`Build deploy tx failed: ${await r.text()}`);
  const { tx, contractAddress } = await r.json();

  await laceBalanceAndSubmit(lace, tx);

  const r2 = await fetch(`${API_BASE}/contract-address`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: contractAddress }),
  });
  if (!r2.ok) throw new Error(`Failed to store contract address: ${await r2.text()}`);

  onWaiting?.();
  await waitForContractIndexed(contractAddress, lang);

  return contractAddress as string;
}

const DEFAULT_SEED = {
  mobile: 312, tablet: 187, computer: 245, camera: 98, audio: 201, gaming: 278,
  shoes: 334, tops: 889, bottoms: 798, accessories: 345, outerwear: 212,
  groceries: 921, restaurant: 356, cafes: 267, fastfood: 189, localshops: 150,
  equipment: 134, clothing: 276, footwear: 355, supplements: 193,
  furniture: 88, appliances: 121, decor: 167, tools: 74,
  other: 63,
};

export async function seedViaLace(lace: ConnectedAPI, contractAddress: string, lang: Lang, onWaiting?: () => void): Promise<void> {
  const r = await fetch(`${API_BASE}/build-tx/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(DEFAULT_SEED),
  });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error ?? 'Failed to build seed tx');
  }
  const { tx } = await r.json();
  await laceBalanceAndSubmit(lace, tx);
  onWaiting?.();
  const { readChainState } = await import('./chainState.ts');
  await pollUntil(async () => Number((await readChainState(contractAddress)).isSeeded ?? 0) > 0, lang);
}

// Asserts del contrato que casi siempre significan "la transacción anterior
// todavía no se ha confirmado en la red", no que algo esté mal de verdad.
const LIKELY_UNCONFIRMED_ASSERTS = [
  'Not a registered store',
  'Receipt not attested by a registered store',
];

/** Antepone una explicación en lenguaje llano cuando el error es uno de los asserts típicos de "aún no confirmado". */
export function explainTxError(e: unknown, lang: Lang): string {
  if (isWalletDisconnected(e)) return T[lang].walletConnectionLost;
  const msg = (e as any)?.message ?? String(e);
  if (LIKELY_UNCONFIRMED_ASSERTS.some((s) => msg.includes(s))) {
    return T[lang].txMaybeUnconfirmed(msg);
  }
  return msg;
}

/**
 * Solo en local: el contrato que desplegó este backend, null si responde que
 * aún no tiene ninguno, o undefined si no lo sabe (backend antiguo o caído).
 */
export async function getLocalContractAddress(): Promise<string | null | undefined> {
  const r = await fetch(`${API_BASE}/contract-address`);
  if (!r.ok) return undefined;
  const { address } = await r.json();
  return address ?? null;
}

export async function checkStoreRegistered(): Promise<boolean> {
  const r = await fetch(`${API_BASE}/store-registered`);
  if (!r.ok) return false;
  const { registered } = await r.json();
  return Boolean(registered);
}

/**
 * Consulta barata de si un commitment ya está sellado (attestReceipt
 * confirmado) y/o usado (submitPurchase confirmado), según lo que ve el
 * backend por el indexer.
 */
export async function getReceiptStatus(commitmentHex: string): Promise<{ sealed: boolean; used: boolean }> {
  const r = await fetch(`${API_BASE}/receipt-status?commitment=${commitmentHex}`);
  if (!r.ok) return { sealed: false, used: false };
  return r.json();
}

/**
 * Reintenta `check` hasta que devuelva true o se agote `timeoutMs`. Cada
 * transacción se prueba en el backend con el estado actual del ledger; si se
 * lanza la siguiente antes de que el indexer refleje la anterior, el assert
 * correspondiente falla ("Not a registered store", "Receipt not attested by
 * a registered store", etc.). Este helper es lo que evita esa carrera: las
 * funciones *ViaLace y attestReceipt no resuelven hasta que su efecto es visible on-chain.
 */
async function pollUntil(check: () => Promise<boolean>, lang: Lang, { intervalMs = 1500, timeoutMs = 120_000 } = {}): Promise<void> {
  const start = Date.now();
  while (!(await check())) {
    if (Date.now() - start > timeoutMs) throw new Error(T[lang].txConfirmTimeout);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/**
 * Alta única de la tienda de demo en el árbol de tiendas registradas.
 * La wallet operadora del backend resultó poco fiable (sync de horas,
 * cortes de red que la dejaban colgada, ver operatorWallet.ts), así que
 * esto vuelve a pasar por Lace: el backend prueba, Lace balancea/firma/envía.
 *
 * No resuelve hasta que `store-registered` confirma el alta (ver pollUntil),
 * para que quien llama no pueda lanzar la siguiente transacción contra un
 * estado que el indexer todavía no ha puesto al día. `onWaiting` se llama
 * justo al empezar esa espera, para que la UI pueda avisar de que ya se
 * envió y solo falta la confirmación.
 */
export async function registerStoreViaLace(lace: ConnectedAPI, lang: Lang, onWaiting?: () => void): Promise<void> {
  const r = await fetch(`${API_BASE}/register-store`, { method: 'POST' });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error ?? 'Failed to build register-store tx');
  }
  const { tx } = await r.json();
  await laceBalanceAndSubmit(lace, tx);
  onWaiting?.();
  await pollUntil(() => checkStoreRegistered(), lang);
}

/**
 * ¿Puede el backend pagar las transacciones (patrocinio, ver
 * backend/src/sponsor.ts)? Si sí, el sellado y las señales funcionan sin
 * wallet y, con wallet conectada, tampoco le cuestan DUST al usuario.
 */
export async function getSponsorAvailable(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/sponsor-status`);
    if (!r.ok) return false;
    const { available } = await r.json();
    return available === true;
  } catch {
    return false;
  }
}

/**
 * Con una wallet conectada, paga y firma ella: quien la conecta quiere firmar
 * cada paso. Sin wallet, las rutas que construyen una transacción con
 * `sponsor: true` la devuelven ya pagada y enviada (`sponsored`); si el
 * patrocinio no está disponible, sin pagar (`tx`), y entonces no se puede.
 * Devuelve true si la pagó el patrocinio. `onSigning` avisa justo antes de
 * pedir la firma a la wallet; `onSubmitted` recibe la transacción sellada
 * que envió la wallet.
 */
async function payIfNotSponsored(
  lace: ConnectedAPI | null,
  built: { sponsored?: boolean; tx?: string },
  lang: Lang,
  onSigning?: () => void,
  onSubmitted?: (balancedHex: string) => void,
): Promise<boolean> {
  if (built.sponsored) return true;
  if (!lace || !built.tx) throw new Error(T[lang].sponsorUnavailable);
  onSigning?.();
  // La llamada va aparte: dentro de `onSubmitted?.(...)` no se evaluaría
  // (ni se pediría la firma) cuando quien llama no pasa `onSubmitted`.
  const balancedHex = await laceBalanceAndSubmit(lace, built.tx);
  onSubmitted?.(balancedHex);
  return false;
}

/**
 * Hash de la transacción sellada que envió la wallet. Carga ledger-v8
 * (WebAssembly) solo aquí, bajo demanda. Si algo falla, null: solo se
 * pierde el enlace al explorador, no el sellado.
 */
async function hashOfSubmitted(balancedHex: string | null): Promise<string | null> {
  if (!balancedHex) return null;
  try {
    const { txHashFromHex } = await import('./txHash.ts');
    return txHashFromHex(balancedHex);
  } catch {
    return null;
  }
}

/** Línea del rollup que la tienda manda a sellar (subcategoría por nombre del enum, importe en céntimos). */
export type AttestLine = { subcategory: string; qty: number; amount: number };

/**
 * La tienda vende y sella el compromiso del recibo on-chain. Recibe el
 * rollup por subcategoría (ya recortado a las 8 de mayor importe) y devuelve
 * el recibo sellado (quien llama lo convierte en QR) y si lo pagó el
 * patrocinio. Paga el patrocinio o, si no está disponible, la wallet conectada.
 * `txHash` es el hash de la transacción de sellado, para enlazarla en el
 * explorador: con patrocinio lo da el backend (preguntando al indexer por
 * el identificador que devuelve el bot); con la wallet se calcula aquí de
 * la transacción sellada que envió. null si no se pudo saber.
 */
export async function attestReceipt(
  lace: ConnectedAPI | null,
  lines: AttestLine[],
  lang: Lang,
  onWaiting?: () => void,
): Promise<{ receipt: ReceiptJSON; sponsored: boolean; txHash: string | null }> {
  const r = await fetch(`${API_BASE}/attest-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines, sponsor: lace === null }),
  });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error ?? 'Failed to build attest-receipt tx');
  }
  const built = await r.json();
  let submittedHex: string | null = null;
  const sponsored = await payIfNotSponsored(lace, built, lang, undefined, (hex) => { submittedHex = hex; });
  onWaiting?.();
  await pollUntil(async () => (await getReceiptStatus(built.commitmentHex)).sealed, lang);
  const txHash = sponsored
    ? (typeof built.txHash === 'string' ? built.txHash : null)
    : await hashOfSubmitted(submittedHex);
  return { receipt: built.receipt as ReceiptJSON, sponsored, txHash };
}

/**
 * El usuario envía como señal un recibo ya sellado por una tienda (escaneado
 * de un QR). A diferencia de las otras acciones, esta no espera a la
 * confirmación on-chain: resuelve en cuanto la red acepta el envío, sin
 * fallar. Es el último paso del flujo (no hay una acción siguiente cuyo
 * assert dependa de este envío), así que la espera solo añadía tiempo sin
 * evitar ningún error real. Paga la wallet conectada o, sin wallet, el
 * patrocinio. Devuelve true si lo pagó el patrocinio.
 *
 * Con `localProof`, la transacción se construye y se prueba en este
 * navegador contra el proof server del usuario (ver localProver.ts) y el
 * recibo no llega al backend: solo la transacción ya probada, si la paga el
 * patrocinio. `onSigning` avisa cuando la prueba ya está y falta la firma de
 * la wallet (sin patrocinio).
 */
export async function submitSignal(
  lace: ConnectedAPI | null,
  receipt: ReceiptJSON,
  lang: Lang,
  {
    localProof = false, sponsored = false, contractAddress = null as string | null,
    onSigning = undefined as (() => void) | undefined,
  } = {},
): Promise<boolean> {
  if (localProof) {
    if (!contractAddress) throw new Error('Contract not deployed yet');
    const { proveSignalLocally } = await import('./localProver.ts');
    const tx = await proveSignalLocally(receipt, contractAddress);
    if (sponsored && !lace) {
      const r = await fetch(`${API_BASE}/sponsor-signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx }),
      });
      // Si el patrocinio falla (por ejemplo, el bot dejó de estar listo), se
      // paga con la wallet si hay una conectada, igual que en el flujo normal.
      if (r.ok) return true;
      if (!lace) {
        const { error } = await r.json().catch(() => ({ error: r.statusText }));
        throw new Error(error || T[lang].sponsorUnavailable);
      }
    }
    return payIfNotSponsored(lace, { tx }, lang, onSigning);
  }

  const r = await fetch(`${API_BASE}/build-tx/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receipt, sponsor: lace === null }),
  });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(error || `Backend error ${r.status}`);
  }
  return payIfNotSponsored(lace, await r.json(), lang, onSigning);
}
