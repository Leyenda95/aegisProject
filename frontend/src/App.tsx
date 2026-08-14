import { useState } from 'react';
import StoreView from './components/StoreView.tsx';
import LandingScreen from './components/LandingScreen.tsx';

export default function App() {
  const [landed, setLanded] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!landed && <LandingScreen onEnter={() => setLanded(true)} />}

      <header style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 24px', borderBottom: '1px solid #ddd' }}>
        <strong style={{ fontSize: 18 }}>Aegis</strong>
      </header>

      <main style={{ flex: 1, padding: 24 }}>
        <StoreView />
      </main>
    </div>
  );
}
