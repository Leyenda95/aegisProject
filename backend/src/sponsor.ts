// Patrocinio de transacciones: en vez de devolver la transacción para que
// la pague la wallet del usuario (Lace), el backend se la pasa al bot de
// señales (repo aegis-signal-bot, src/sponsor.ts), que la paga con su DUST
// y la envía. Así se puede usar Aegis sin wallet y sin DUST.
//
// El bot solo recibe transacciones que este backend acaba de construir y
// probar, por la red privada de Railway, con un token compartido. Para que
// nadie vacíe el DUST del bot lanzando transacciones sin parar, cada IP
// tiene un límite de transacciones patrocinadas por hora.
//
// Variables de entorno (si falta alguna, el patrocinio está desactivado y
// todo funciona como antes, pagando con la wallet conectada):
//   SPONSOR_URL    p. ej. http://aegis-signal-bot.railway.internal:8080
//   SPONSOR_TOKEN  el mismo secreto que en el bot
import type http from 'node:http';

const SPONSOR_URL = process.env['SPONSOR_URL']?.replace(/\/$/, '');
const SPONSOR_TOKEN = process.env['SPONSOR_TOKEN'];

const MAX_PER_IP_PER_HOUR = 30;
const HOUR_MS = 60 * 60 * 1000;
const recentByIp = new Map<string, number[]>();

// Olvida las IPs sin envíos en la última hora, para que el mapa no crezca sin fin.
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of recentByIp) {
    if (times.every((t) => now - t >= HOUR_MS)) recentByIp.delete(ip);
  }
}, HOUR_MS).unref();

export function sponsorConfigured(): boolean {
  return Boolean(SPONSOR_URL && SPONSOR_TOKEN);
}

async function callSponsor(route: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  return fetch(`${SPONSOR_URL}${route}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${SPONSOR_TOKEN}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

// Último motivo registrado, para escribir en el log solo cuando cambia.
let lastStatus = '';

function logStatus(status: string): void {
  if (status === lastStatus) return;
  lastStatus = status;
  console.log(`[sponsor] ${status}`);
}

/** Pregunta al bot si su wallet está lista para pagar. */
async function checkBotReady(): Promise<boolean> {
  try {
    // Margen amplio: el bot está a ratos ocupado (procesando bloques,
    // reconectando con el indexer) y tarda varios segundos en contestar.
    const res = await callSponsor('/health', {}, 10_000);
    if (res.status === 401) { logStatus('unavailable: the bot rejected SPONSOR_TOKEN (not the same in both services?)'); return false; }
    if (!res.ok) { logStatus(`unavailable: ${SPONSOR_URL}/health answered ${res.status}`); return false; }
    const { ready } = await res.json() as { ready?: boolean };
    logStatus(ready === true ? `available at ${SPONSOR_URL}` : 'unavailable: the bot wallet is still syncing');
    return ready === true;
  } catch (err) {
    const cause = (err as { cause?: { code?: string } }).cause?.code;
    logStatus(`unavailable: cannot reach ${SPONSOR_URL} (${cause ?? (err instanceof Error ? err.message : String(err))})`);
    return false;
  }
}

// El estado se comprueba en segundo plano y se guarda: así /sponsor-status
// responde al instante, y un fallo suelto (el bot tardó en contestar) no
// lo marca como caído mientras haya respondido bien hace poco.
const CHECK_EVERY_MS = 20_000;
const GRACE_MS = 60_000;
let lastReadyAt = 0;

if (sponsorConfigured()) {
  const check = async () => { if (await checkBotReady()) lastReadyAt = Date.now(); };
  void check();
  setInterval(() => { void check(); }, CHECK_EVERY_MS).unref();
} else {
  logStatus(`disabled: ${!SPONSOR_URL ? 'SPONSOR_URL' : 'SPONSOR_TOKEN'} is not set`);
}

/** Si el bot ha estado listo para pagar en el último minuto. */
export function sponsorAvailable(): boolean {
  return sponsorConfigured() && Date.now() - lastReadyAt < GRACE_MS;
}

/**
 * IP real de quien llama. Railway pone delante un proxy que la añade en
 * X-Forwarded-For; sin proxy (en local) se usa la de la conexión.
 */
function clientIp(req: http.IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

/** Cuenta un envío patrocinado para esa IP. Devuelve false si ya agotó su cupo de la última hora. */
export function takeSponsorQuota(req: http.IncomingMessage): boolean {
  const ip = clientIp(req);
  const now = Date.now();
  const recent = (recentByIp.get(ip) ?? []).filter((t) => now - t < HOUR_MS);
  if (recent.length >= MAX_PER_IP_PER_HOUR) {
    recentByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  recentByIp.set(ip, recent);
  return true;
}

/** Pide al bot que pague y envíe la transacción. Devuelve su id. */
export async function sponsorTx(txHex: string): Promise<string> {
  // Generoso: el bot paga de una en una y puede haber otras en cola.
  const res = await callSponsor('/sponsor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx: txHex }),
  }, 5 * 60_000);
  const data = await res.json().catch(() => ({})) as { txId?: string; error?: string };
  if (!res.ok || !data.txId) throw new Error(`Sponsor failed: ${data.error ?? res.statusText}`);
  return data.txId;
}
