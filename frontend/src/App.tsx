import { useState } from 'react';
import StoreView from './components/StoreView.tsx';
import UserView from './components/UserView.tsx';

type Tab = 'store' | 'user';

export default function App() {
  const [tab, setTab] = useState<Tab>('user');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 24px', borderBottom: '1px solid #ddd' }}>
        <strong style={{ fontSize: 18 }}>Aegis</strong>
        <nav style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setTab('user')} disabled={tab === 'user'}>Usuario</button>
          <button onClick={() => setTab('store')} disabled={tab === 'store'}>Tienda</button>
        </nav>
      </header>

      <main style={{ flex: 1, padding: 24 }}>
        {tab === 'user' ? <UserView /> : <StoreView />}
      </main>
    </div>
  );
}
