import styles from './LockTexture.module.css';

const VIEWBOX = '0 0 100 120';

/** Silueta de un candado: el arco, el cuerpo y la bocallave (hueco, con evenodd). */
const LOCK = [
  'M22 50 V34 A28 28 0 0 1 78 34 V50 H66 V34 A16 16 0 0 0 34 34 V50 Z',
  'M18 50 H82 A10 10 0 0 1 92 60 V108 A10 10 0 0 1 82 118 H18 A10 10 0 0 1 8 108 V60 A10 10 0 0 1 18 50 Z',
  'M46 83 L44 99 H56 L54 83 A9 9 0 1 0 46 83 Z',
].join(' ');

/**
 * Textura para una tarjeta oscura (lo privado, en la intro): un candado
 * grande en una esquina, con un velo claro y su sombra, así que se ve en
 * relieve. Decorativa; la coloca y recorta quien la usa (className).
 */
export default function LockTexture({ className }: { className?: string }) {
  return (
    <div className={`${styles.root} ${className ?? ''}`} aria-hidden="true">
      <svg viewBox={VIEWBOX} className={styles.layer}>
        <path d={LOCK} fillRule="evenodd" />
      </svg>
    </div>
  );
}
