import { useEffect } from 'react';

// Cuántas capas a pantalla completa (portada, presentación) piden ahora
// mismo que la página de debajo no se desplace.
let locks = 0;

/**
 * Mientras el componente está montado, la página de debajo ni se mueve ni
 * enseña su barra (ver .landing-open en index.css). Se cuentan los bloqueos
 * para que, al pasar de una capa a otra, la barra no aparezca y desaparezca
 * entre las dos.
 */
export function useLockPageScroll() {
  useEffect(() => {
    const root = document.documentElement;
    locks += 1;
    root.classList.add('landing-open');
    return () => {
      locks -= 1;
      if (locks === 0) root.classList.remove('landing-open');
    };
  }, []);
}
