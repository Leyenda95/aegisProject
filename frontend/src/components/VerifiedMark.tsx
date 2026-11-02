import { cx } from '../cx.ts';
import styles from './VerifiedMark.module.css';

// El contorno del ojo del logo (public/images/aegis_mark.svg) como una sola
// línea sobre la rejilla de 24 de los iconos del recorrido, empezando y
// acabando arriba en el centro, para que al dibujarse se cierre ahí.
const RING_LINE = 'M12 5.1C13.4 5.1 14.6 5.5 15.8 6.3L21.7 10.8C22.6 11.5 22.6 12.5 21.7 13.2L15.8 17.7C14.6 18.5 13.4 18.9 12 18.9C10.6 18.9 9.4 18.5 8.2 17.7L2.3 13.2C1.4 12.5 1.4 11.5 2.3 10.8L8.2 6.3C9.4 5.5 10.6 5.1 12 5.1Z';
// El visto, donde el logo tiene la pupila.
const TICK = 'M8.4 12.2L10.9 14.6L15.6 9.9';

type Props = {
  className?: string;
  /** El aro se dibuja hasta cerrarse y después el visto. */
  draw?: boolean;
  /** Sin título es decorativa (el texto de al lado ya lo dice). */
  title?: string;
};

/**
 * La marca de "hecho y comprobado" de Aegis: el aro del logo con un visto
 * dentro. Es la misma en toda la app (registro de la tienda, señal publicada,
 * pasos de publicar, compras del móvil). Toma el color del texto y el tamaño
 * del font-size; el grosor del trazo se ajusta con --verified-stroke.
 */
export default function VerifiedMark({ className, draw = false, title }: Props) {
  return (
    <svg
      className={cx(styles.mark, draw && styles.draw, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path className={styles.ring} d={RING_LINE} pathLength={1} />
      <path className={styles.tick} d={TICK} pathLength={1} />
    </svg>
  );
}
