import { useEffect } from 'react';

/**
 * Llama a `callback` al montar y después cada `ms`, pero solo con la pestaña
 * visible: si está oculta no lo ve nadie, así que no se pide nada. Al volver
 * a la pestaña se llama en el acto, sin esperar al siguiente aviso, para que
 * lo que se ve esté al día. `callback` tiene que ser estable (useCallback):
 * si cambia, se vuelve a llamar al momento.
 */
export function useVisibleInterval(callback: () => void, ms: number): void {
  useEffect(() => {
    const tick = () => { if (!document.hidden) callback(); };
    tick();
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [callback, ms]);
}
