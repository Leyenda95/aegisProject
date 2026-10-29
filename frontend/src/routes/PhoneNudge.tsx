import { useLayoutEffect, useRef, useState } from 'react';
import type { Lang } from '../api.ts';
import { T } from '../i18n.ts';
import styles from './PhoneNudge.module.css';

/**
 * En escritorio, recién cobrado: un bocadillo junto al móvil que apunta al
 * ticket que acaba de llegar (su tarjeta, data-phone-ticket), para que la
 * vista pase de la caja al móvil. En tableta y móvil no sale: allí lo dice
 * la caja, bajo el recibo.
 */
export default function PhoneNudge({ lang }: { lang: Lang }) {
  const t = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState<number | null>(null);

  // A la altura del centro de la tarjeta, sin contar el rebote con el que
  // llega (empieza 10 px más arriba): se le quita su desplazamiento. Se
  // vuelve a medir si se desplaza la pantalla del móvil o cambia la ventana.
  useLayoutEffect(() => {
    const card = document.querySelector<HTMLElement>('[data-phone-ticket]');
    function measure() {
      const col = ref.current?.offsetParent;
      if (!card || !col) return;
      const a = card.getBoundingClientRect();
      const shift = new DOMMatrixReadOnly(getComputedStyle(card).transform).m42;
      setTop(a.top + a.height / 2 - shift - col.getBoundingClientRect().top);
    }
    measure();
    document.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      document.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div ref={ref} className={styles.nudge} style={top === null ? undefined : { top }}>
      <span className={styles.eyebrow}>{t.nudgeEyebrow}</span>
      {t.nudgePhone}
    </div>
  );
}
