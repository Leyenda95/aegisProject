import { MARK_VIEWBOX, RING } from '../../components/AegisMark.tsx';
import styles from './RingTexture.module.css';

/** Solo el contorno exterior del aro de Aegis. */
const OUTLINE = RING.slice(0, RING.indexOf('Z') + 1);

/** Capas concéntricas, de la de atrás (la más grande) a la de delante. */
const LAYERS = [2.6, 2.05, 1.5];

/**
 * Textura de marca para una tarjeta oscura (lo privado, en la intro): la
 * forma del ojo de Aegis en láminas apiladas desde una esquina, cada una
 * con un velo claro y su sombra, así que se ve en relieve. Decorativa; la
 * coloca y recorta quien la usa (className).
 */
export default function RingTexture({ className }: { className?: string }) {
  return (
    <div className={`${styles.root} ${className ?? ''}`} aria-hidden="true">
      {LAYERS.map(scale => (
        <svg key={scale} viewBox={MARK_VIEWBOX} className={styles.layer} style={{ width: `${scale * 150}px` }}>
          <path d={OUTLINE} />
        </svg>
      ))}
    </div>
  );
}
