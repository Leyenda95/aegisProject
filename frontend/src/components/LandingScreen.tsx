import { useState } from 'react';
import styles from './LandingScreen.module.css';

export default function LandingScreen({ onEnter }: { onEnter: () => void }) {
  const [exiting, setExiting] = useState(false);

  function handleEnter() {
    setExiting(true);
    setTimeout(onEnter, 650);
  }

  return (
    <div className={`${styles.root} ${exiting ? styles.exiting : ''}`}>
      <div className={styles.heroWrap}>
        <img src="/images/aegis_hor.svg" alt="Aegis" className={styles.heroLogo} />
        <div className={styles.heroContent}>
          <p className={styles.title}>AEGIS</p>
          <p className={styles.tagline}>Private Market Intelligence</p>
          <p className={styles.sub}>A new era of privacy.</p>
          <button className={styles.cta} onClick={handleEnter}>Explore</button>
        </div>
      </div>

      {/* No usa BuiltOnMidnight: el fondo de la portada es siempre oscuro y
          aquí el texto y el logo no deben cambiar con el tema (ver .builtOn). */}
      <div className={styles.footer}>
        <div className={styles.builtOn}>
          <span className={styles.builtOnText}>Built on</span>
          <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" className={styles.builtOnLogo} />
        </div>
      </div>
    </div>
  );
}
