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

/** Si el bot está levantado y con la wallet lista para pagar. */
export async function sponsorAvailable(): Promise<boolean> {
  if (!sponsorConfigured()) return false;
  try {
    const res = await callSponsor('/health', {}, 3000);
    if (!res.ok) return false;
    const { ready } = await res.json() as { ready?: boolean };
    return ready === true;
  } catch {
    return false;
  }
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
