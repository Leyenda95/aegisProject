// El proof server carga los parámetros públicos de cada tamaño de circuito
// (k) solo cuando llega la primera prueba que los necesita. Por eso la
// primera transacción tras arrancarlo tardaba casi un minuto (medido: 57 s
// frente a 3 s las siguientes). Su ruta /fetch-params/{k} los carga de
// antemano: el backend se la pide al arrancar y, por si el proof server se
// reinicia por su cuenta, cada 10 minutos (si ya están cargados responde en
// milisegundos).
const K_VALUES = [10, 11, 12, 13, 14, 15, 16, 17];
const EVERY_MS = 10 * 60_000;

async function warmUp(proofServer: string): Promise<void> {
  const started = Date.now();
  for (const k of K_VALUES) {
    const res = await fetch(`${proofServer}/fetch-params/${k}`, { signal: AbortSignal.timeout(10 * 60_000) });
    // 404: el proof server se arrancó con --no-fetch-params y no tiene esta
    // ruta; entonces carga los parámetros en la primera prueba y no hay nada
    // que hacer aquí.
    if (res.status === 404) return;
    if (!res.ok) throw new Error(`fetch-params/${k} answered ${res.status}`);
  }
  const secs = (Date.now() - started) / 1000;
  if (secs > 1) console.log(`[proof-server] proving params loaded (${secs.toFixed(1)}s)`);
}

export function startProofServerWarmup(proofServer: string): void {
  const run = () => {
    warmUp(proofServer).catch((err) => console.error('[proof-server] could not preload proving params:', err instanceof Error ? err.message : err));
  };
  run();
  setInterval(run, EVERY_MS).unref();
}
