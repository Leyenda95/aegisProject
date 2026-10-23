import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * Lo básico de accesibilidad de un modal (el elemento de `ref`, que debe
 * llevar role="dialog" y tabIndex={-1}):
 * - al abrirse, el foco pasa al modal, así un lector de pantalla lo anuncia;
 * - Tab y Mayús+Tab dan la vuelta dentro, sin irse a la página de detrás;
 * - Esc llama a `onClose`;
 * - al cerrarse, el foco vuelve a donde estaba (el botón que lo abrió, p. ej.).
 * `open` es para modales que no se desmontan al cerrarse.
 */
export function useDialog(ref: RefObject<HTMLElement>, onClose: () => void, open = true): void {
  // Siempre la última onClose, sin volver a lanzar el efecto (y mover el foco) cada vez que cambia.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    dialog.focus({ preventScroll: true });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus({ preventScroll: true });
    };
  }, [ref, open]);
}
