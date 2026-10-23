/**
 * Una copia del ticket de la caja encoge y vuela hasta su tarjeta en el
 * móvil (demo lado a lado, en escritorio). Es solo un adorno: si alguno de
 * los dos no se ve (en tableta y móvil van en pestañas distintas) o el
 * sistema pide reducir el movimiento, no hace nada.
 */
export function flyTicket(from: HTMLElement | null, to: HTMLElement | null): void {
  if (!from || !to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (!a.width || !a.height || !b.width || !b.height) return;

  const ghost = from.cloneNode(true) as HTMLElement;
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`,
    margin: '0', zIndex: '900', pointerEvents: 'none', transformOrigin: 'top left',
  });
  document.body.appendChild(ghost);

  // Acaba centrado en la tarjeta y a su tamaño, como si entrara en ella.
  const scale = Math.min(b.width / a.width, b.height / a.height);
  const endX = b.left + b.width / 2 - a.left - (a.width * scale) / 2;
  const endY = b.top + b.height / 2 - a.top - (a.height * scale) / 2;
  const midScale = (1 + scale) / 2.4;
  const animation = ghost.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${endX * 0.55}px, ${endY * 0.55 - 50}px) scale(${midScale}) rotate(-4deg)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${endX}px, ${endY}px) scale(${scale})`, opacity: 0 },
  ], { duration: 900, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' });
  const remove = () => ghost.remove();
  animation.finished.then(remove, remove);
}
