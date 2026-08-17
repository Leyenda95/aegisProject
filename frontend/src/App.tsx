import { useState } from 'react';
import StoreView from './components/StoreView.tsx';
import LandingScreen from './components/LandingScreen.tsx';
import type { Campaign, MatchResult, Lang } from './api.ts';
import { T } from './i18n.ts';
import styles from './App.module.css';

export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchResult>>({});

  const [landed, setLanded] = useState(false);
  const lang: Lang = 'en';

  const t = T[lang];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!landed && <LandingScreen onEnter={() => setLanded(true)} />}

      <header className={styles.header}>
        {/* Logo + nombre */}
        <div className={styles.brand}>
          <img src="/images/Aegis_logo_original.png" alt="Aegis" style={{ width: 95, height: 40, objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 600, color: '#FFFFFF', letterSpacing: 2.6, lineHeight: 1.1 }}>AEGIS</h1>
            <p className={styles.brandTagline} style={{ fontSize: 12, color: '#AAAAAA', marginTop: 3 }}>{t.tagline}</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <StoreView lang={lang} campaigns={campaigns} setCampaigns={setCampaigns} matches={matches} setMatches={setMatches} />
      </main>

    </div>
  );
}
