// Proof server en el equipo del usuario, sin ningún import pesado (a
// diferencia de localProver.ts), para poder comprobar si está levantado
// desde la UI sin cargar el runtime del contrato.
import { useEffect, useState } from 'react';

export const LOCAL_PROOF_SERVER = 'http://127.0.0.1:6300';

// Mismo comando que la documentación de Midnight ("Proving transactions locally").
export const LOCAL_PROOF_SERVER_COMMAND = 'docker run -p 6300:6300 midnightntwrk/proof-server:9.0.0';

export type ProofServerStatus = 'checking' | 'up' | 'down';

// Mientras no responde se vuelve a mirar cada poco, así se detecta solo en
// cuanto el usuario arranca Docker (o acepta el permiso del navegador para
// entrar en su red local), sin tener que pulsar "Comprobar de nuevo".
const RECHECK_MS = 3000;

/** true si responde el proof server local. */
export async function isLocalProofServerUp(): Promise<boolean> {
  try {
    const r = await fetch(`${LOCAL_PROOF_SERVER}/health`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Si responde el proof server local, mientras `enabled`. Se vuelve a mirar
 * solo: cada pocos segundos mientras no responde y al volver a la pestaña
 * (por si se ha parado). `recheck` empieza de nuevo desde "Buscando...".
 */
export function useLocalProofServer(enabled: boolean): { status: ProofServerStatus; recheck: () => void } {
  const [status, setStatus] = useState<ProofServerStatus>('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let checking = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      clearTimeout(timer);
      if (checking) return;
      checking = true;
      const up = await isLocalProofServerUp();
      checking = false;
      if (stopped) return;
      setStatus(up ? 'up' : 'down');
      // Con la pestaña oculta no se insiste: se mira otra vez al volver.
      if (!up && document.visibilityState === 'visible') timer = setTimeout(check, RECHECK_MS);
    }

    function onReturn() {
      if (document.visibilityState === 'visible') void check();
    }

    setStatus('checking');
    void check();
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [enabled, attempt]);

  return { status, recheck: () => setAttempt(n => n + 1) };
}

const STORAGE_KEY = 'aegis.localProof';

/** Si el usuario eligió probar sus señales en su equipo (se recuerda en este navegador). */
export function loadLocalProofPreference(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

export function saveLocalProofPreference(enabled: boolean): void {
  try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch { /* sin almacenamiento: solo dura esta sesión */ }
}
