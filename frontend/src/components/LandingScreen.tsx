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

      <div className={styles.footer}>
        <div style={{ textAlign: 'center', padding: '24px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 25 }}>
          <span style={{ fontSize: 11, color: '#8f8f8f', letterSpacing: 1.5, textTransform: 'uppercase' }}>Built on</span>
          <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" style={{ height: 28, opacity: 0.85 }} />
        </div>
      </div>
    </div>
  );
}
