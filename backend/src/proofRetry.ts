import type { ProofProvider } from '@midnight-ntwrk/midnight-js-types';

// El proof server 9.0.0 acepta por defecto 10 trabajos a la vez y contesta 429
// al siguiente en vez de hacerle esperar. El proveedor de midnight-js solo
// reintenta 500 y 503, así que un pico de pruebas simultáneas llegaba al
// usuario como error. Aquí se reintenta el 429 con espera creciente.
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1_500;
const MAX_DELAY_MS = 10_000;

/** ¿Es este error (o algo de su cadena de causas) un 429 del proof server? */
export function isProofServerBusy(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current; depth++) {
    const e = current as { status?: unknown; message?: unknown; cause?: unknown };
    if (e.status === 429) return true;
    if (typeof e.message === 'string' && /code="429"/.test(e.message)) return true;
    current = e.cause;
  }
  return false;
}

/** Espera 1.5 s, 3 s, 6 s, 10 s, 10 s (hasta ~30 s) más hasta un 25 % de aleatorio para no sincronizar a los que reintentan. */
export function retryDelayMs(attempt: number, random: () => number = Math.random): number {
  return Math.round(Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS) * (1 + random() * 0.25));
}

export async function withProofServerRetry<T>(
  run: () => Promise<T>,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await run();
    } catch (err) {
      if (!isProofServerBusy(err) || attempt >= MAX_RETRIES) throw err;
      const delay = retryDelayMs(attempt);
      console.warn(`[proof-server] ocupado (429), reintento ${attempt + 1}/${MAX_RETRIES} en ${delay} ms`);
      await sleep(delay);
    }
  }
}

/** Mismo proveedor, pero proveTx reintenta cuando el proof server está lleno. */
export function retryingProofProvider(base: ProofProvider): ProofProvider {
  return {
    ...base,
    proveTx: (unprovenTx, config) => withProofServerRetry(() => base.proveTx(unprovenTx, config)),
  };
}
