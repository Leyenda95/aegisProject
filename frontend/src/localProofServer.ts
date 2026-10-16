// Proof server en el equipo del usuario, sin ningún import pesado (a
// diferencia de localProver.ts), para poder comprobar si está levantado
// desde la UI sin cargar el runtime del contrato.

export const LOCAL_PROOF_SERVER = 'http://127.0.0.1:6300';

// Mismo comando que la documentación de Midnight ("Proving transactions locally").
export const LOCAL_PROOF_SERVER_COMMAND = 'docker run -p 6300:6300 midnightntwrk/proof-server:8.1.3';

/** true si responde el proof server local. */
export async function isLocalProofServerUp(): Promise<boolean> {
  try {
    const r = await fetch(`${LOCAL_PROOF_SERVER}/health`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}

const STORAGE_KEY = 'aegis.localProof';

/** Si el usuario eligió probar sus señales en su equipo (se recuerda en este navegador). */
export function loadLocalProofPreference(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

export function saveLocalProofPreference(enabled: boolean): void {
  try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch { /* sin almacenamiento: solo dura esta sesión */ }
}
