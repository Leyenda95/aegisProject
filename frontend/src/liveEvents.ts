// Directo del backend (GET /events, Server-Sent Events): el estado del
// contrato en cuanto cambia, sin preguntar por /state cada 10 s. Si el
// backend no lo tiene (una versión anterior) o la conexión se pierde y no
// vuelve, se avisa con onLive(false) y quien lo usa sigue preguntando como
// antes (ver ChainProvider).
import { API_BASE, type AegisState, type Change, type Counts } from './api.ts';

/** Al conectarse: el estado y las últimas transacciones que cambiaron algo, de la más nueva a la más vieja. */
export type LiveSnapshot = { contractAddress: string; height: number; timestamp: number; state: AegisState; recent: Change[] };
/** Una transacción nueva que ha cambiado algún contador. */
export type LiveChange = { contractAddress: string; height: number; timestamp: number; state: AegisState; delta: Counts };

type Handlers = {
  onSnapshot: (snapshot: LiveSnapshot) => void;
  onChange: (change: LiveChange) => void;
  /** true al recibir el estado; false si no hay directo (el backend no responde o aún carga su historial). */
  onLive: (live: boolean) => void;
};

// El backend manda un ping cada 25 s: tanto rato sin noticias es que la
// conexión se ha quedado colgada aunque el navegador no lo note.
const SILENCE_MS = 60_000;
// Tras reconectar, si el estado no llega en este rato (el backend se ha
// reiniciado y aún carga el historial), no hay directo hasta que llegue.
const GRACE_MS = 15_000;
// Si el backend rechaza la conexión (no tiene /events), se vuelve a probar
// pasado un buen rato.
const RETRY_MS = 60_000;

function parse<T>(event: Event): T {
  return JSON.parse((event as MessageEvent<string>).data) as T;
}

/** Abre la conexión y la mantiene viva. Devuelve cómo cerrarla. */
export function connectLive({ onSnapshot, onChange, onLive }: Handlers): () => void {
  let source: EventSource | null = null;
  let silence: ReturnType<typeof setTimeout> | undefined;
  let grace: ReturnType<typeof setTimeout> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  // Se cortó y el navegador está volviendo a conectar por su cuenta.
  let reconnecting = false;

  const stop = () => {
    source?.close();
    source = null;
    clearTimeout(silence);
    clearTimeout(grace);
    clearTimeout(retry);
  };

  const reopenAfter = (ms: number) => {
    stop();
    onLive(false);
    retry = setTimeout(open, ms);
  };

  // Cada mensaje, incluido el ping, demuestra que la conexión sigue viva.
  const heard = () => {
    clearTimeout(silence);
    silence = setTimeout(() => reopenAfter(0), SILENCE_MS);
  };

  function open() {
    reconnecting = false;
    source = new EventSource(`${API_BASE}/events`);
    heard();
    source.onopen = () => {
      if (!reconnecting) return;
      clearTimeout(grace);
      grace = setTimeout(() => onLive(false), GRACE_MS);
    };
    source.addEventListener('snapshot', event => {
      heard();
      reconnecting = false;
      clearTimeout(grace);
      onSnapshot(parse<LiveSnapshot>(event));
      onLive(true);
    });
    source.addEventListener('change', event => {
      heard();
      onChange(parse<LiveChange>(event));
    });
    source.addEventListener('ping', heard);
    source.onerror = () => {
      if (source?.readyState === EventSource.CLOSED) {
        reopenAfter(RETRY_MS);
        return;
      }
      // Un corte suelto no apaga el directo; si al reconectar tampoco hay
      // respuesta, el backend no está y sí.
      if (reconnecting) onLive(false);
      reconnecting = true;
    };
  }

  open();
  return stop;
}
