import { cx } from '../cx.ts';
import styles from './VerifiedMark.module.css';

// El contorno del ojo del logo (public/images/aegis_mark.svg) como una sola
// línea sobre la rejilla de 24 de los iconos del recorrido, empezando y
// acabando arriba en el centro, para que al dibujarse se cierre ahí.
const RING_LINE = 'M12 5.2C12.93 5.2 13.88 5.49 14.84 6.13L21.66 10.67C22.19 11.03 22.4 11.49 22.4 12C22.4 12.51 22.19 12.97 21.66 13.33L14.84 17.87C13.88 18.51 12.93 18.8 12 18.8C11.07 18.8 10.12 18.51 9.16 17.87L2.34 13.33C1.81 12.97 1.6 12.51 1.6 12C1.6 11.49 1.81 11.03 2.34 10.67L9.16 6.13C10.12 5.49 11.07 5.2 12 5.2Z';
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
