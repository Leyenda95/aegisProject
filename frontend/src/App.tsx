import { useEffect, useState } from 'react';
import StoreView from './components/StoreView.tsx';
import UserView from './components/UserView.tsx';
import LandingScreen from './components/LandingScreen.tsx';
import TourGuide from './components/TourGuide.tsx';
import { API_BASE, type Campaign, type MatchResult, type Lang } from './api.ts';
import { type ConnectedAPI, type WalletInfo, listWallets, connectWallet, deployViaLace, seedViaLace, registerStoreViaLace } from './lace.ts';
import { T } from './i18n.ts';
import styles from './App.module.css';

type Tab = 'store' | 'user';

const btnBase: React.CSSProperties = {
  padding: '10px 22px', fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: 'none',
};

export default function App() {
  const [tab, setTab] = useState<Tab>('store');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchResult>>({});

  const [landed, setLanded] = useState(false);
  const [lace, setLace] = useState<ConnectedAPI | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [laceLoading, setLaceLoading] = useState(false);
  const [laceError, setLaceError] = useState<string | null>(null);
  const [laceSlow, setLaceSlow] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [networkId, setNetworkId] = useState('preprod');
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [storeRegistered, setStoreRegistered] = useState(false);
  const [registeringStore, setRegisteringStore] = useState(false);
  const [registerStoreError, setRegisterStoreError] = useState<string | null>(null);

  useEffect(() => {
    if (landed) {
      const t = setTimeout(() => setTourActive(true), 800);
      return () => clearTimeout(t);
    }
  }, [landed]);

  const t = T[lang];

  useEffect(() => {
    fetch(`${API_BASE}/contract-address`)
      .then(r => r.json())
      .then(({ address }) => { if (address) setContractAddress(address); })
      .catch(() => {});
    fetch(`${API_BASE}/network`)
      .then(r => r.json())
      .then(({ networkId }) => { if (networkId) setNetworkId(networkId); })
      .catch(() => {});
  }, []);

  async function handleConnectWallet(walletKey?: string) {
    setLaceError(null);
    if (!walletKey) {
      const wallets = listWallets();
      if (wallets.length === 0) { setLaceError('No se encontró ninguna wallet de Midnight instalada (Lace o 1AM).'); return; }
      if (wallets.length > 1) { setAvailableWallets(wallets); return; }
      walletKey = wallets[0].key;
    }
    setAvailableWallets([]);
    setLaceLoading(true); setLaceSlow(false);
    const slowTimer = setTimeout(() => setLaceSlow(true), 4000);
    try {
      const connected = await connectWallet(walletKey, networkId);
      setLace(connected);
      const { unshieldedAddress } = await connected.getUnshieldedAddress();
      setWalletAddress(unshieldedAddress);
    }
    catch (e: any) {
      const msg: string = e.message ?? '';
      if (msg.includes('shutdown') || msg.includes('can no longer be used')) {
        setLaceError('Conexión con la wallet perdida. Recarga la página e inténtalo de nuevo.');
      } else {
        setLaceError(msg || 'Connection failed');
      }
    }
    finally {
      clearTimeout(slowTimer);
      setLaceLoading(false);
      setLaceSlow(false);
    }
  }

  async function handleDeploy() {
    if (!lace) return;
    setDeployError(null);
    setDeploying(true);
    try {
      const address = await deployViaLace(lace);
      setContractAddress(address);
    } catch (e: any) {
      setDeployError(e.message ?? 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  }

  async function handleSeed() {
    if (!lace) return;
    setSeedError(null);
    setSeeding(true);
    try {
      await seedViaLace(lace);
      setSeeded(true);
    } catch (e: any) {
      const msg: string = e.message ?? '';
      if (msg.toLowerCase().includes('already seeded')) {
        setSeeded(true);
      } else {
        setSeedError(msg || 'Seed failed');
      }
    } finally {
      setSeeding(false);
    }
  }

  async function handleRegisterStore() {
    if (!lace) return;
    setRegisterStoreError(null);
    setRegisteringStore(true);
    try {
      await registerStoreViaLace(lace);
      setStoreRegistered(true);
    } catch (e: any) {
      setRegisterStoreError(e.message ?? 'Register store failed');
    } finally {
      setRegisteringStore(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!landed && <LandingScreen onEnter={() => setLanded(true)} />}
      {landed && tourActive && (
        <TourGuide lang={lang} onClose={() => setTourActive(false)} onSetTab={setTab} />
      )}

      <header className={styles.header}>
        {/* Logo + nombre */}
        <div className={styles.brand}>
          <img src="/images/Aegis_logo_original.png" alt="Aegis" style={{ width: 95, height: 40, objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 600, color: '#FFFFFF', letterSpacing: 2.6, lineHeight: 1.1 }}>AEGIS</h1>
            <p className={styles.brandTagline} style={{ fontSize: 12, color: '#AAAAAA', marginTop: 3 }}>{t.tagline}</p>
          </div>
        </div>

        {/* Tabs */}
        <nav className={styles.nav}>
          {(['store', 'user'] as Tab[]).map(id => (
            <button key={id} data-tour={id === 'user' ? 'tab-user' : undefined} onClick={() => setTab(id)} style={{
              ...btnBase,
              background: tab === id ? '#926A45' : 'transparent',
              color: tab === id ? '#FFFFFF' : '#AAAAAA',
              border: `1px solid ${tab === id ? '#926A45' : '#333333'}`,
            }}>
              {id === 'store' ? t.tabStore : t.tabUser}
            </button>
          ))}
        </nav>

        {/* Controls */}
        <div className={styles.controls}>
          <div style={{ display: 'flex', background: '#111111', borderRadius: 8, padding: 3, border: '1px solid #2A2A2A' }}>
            {(['es', 'en'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                background: lang === l ? '#926A45' : 'transparent',
                color: lang === l ? '#FFFFFF' : '#888888',
                border: 'none', padding: '5px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6,
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {laceError && (
            <span style={{ fontSize: 13, color: '#f87171', maxWidth: 220 }}>{laceError}</span>
          )}

          {!lace && availableWallets.length > 1 ? (
            <div style={{ display: 'flex', gap: 6 }}>
              {availableWallets.map(w => (
                <button key={w.key} onClick={() => handleConnectWallet(w.key)} disabled={laceLoading} style={{
                  ...btnBase,
                  background: '#926A45', color: '#FFFFFF',
                  padding: '10px 18px', fontSize: 13,
                  textTransform: 'capitalize',
                }}>
                  {w.name}
                </button>
              ))}
            </div>
          ) : !lace ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <button onClick={() => handleConnectWallet()} disabled={laceLoading} style={{
                ...btnBase,
                background: '#926A45', color: '#FFFFFF',
                padding: '10px 24px', fontSize: 14,
              }}>
                {laceLoading ? t.connecting : t.connectLace}
              </button>
              {laceSlow && (
                <span style={{ fontSize: 11, color: '#888', maxWidth: 200, textAlign: 'right', lineHeight: 1.4 }}>
                  La wallet está iniciando — el popup de autorización aparecerá en breve
                </span>
              )}
            </div>
          ) : !contractAddress ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <button onClick={handleDeploy} disabled={deploying} style={{
                ...btnBase,
                background: '#926A45', color: '#FFFFFF',
                padding: '10px 24px', fontSize: 14,
              }}>
                {deploying ? t.deploying : t.deployContract}
              </button>
              {deployError && (
                <span style={{ fontSize: 11, color: '#f87171', maxWidth: 220, textAlign: 'right' }}>{deployError}</span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {!storeRegistered && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <button onClick={handleRegisterStore} disabled={registeringStore} style={{
                    ...btnBase,
                    background: 'transparent', color: '#926A45',
                    border: '1px solid #926A45',
                    padding: '9px 18px', fontSize: 13,
                  }}>
                    {registeringStore ? 'Registrando tienda…' : 'Registrar tienda de demo'}
                  </button>
                  {registerStoreError && (
                    <span style={{ fontSize: 11, color: '#f87171', maxWidth: 220, textAlign: 'right' }}>{registerStoreError}</span>
                  )}
                </div>
              )}
              {false && !seeded && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <button onClick={handleSeed} disabled={seeding} style={{
                    ...btnBase,
                    background: 'transparent', color: '#926A45',
                    border: '1px solid #926A45',
                    padding: '9px 18px', fontSize: 13,
                  }}>
                    {seeding ? t.seeding : t.seedData}
                  </button>
                  {seedError && (
                    <span style={{ fontSize: 11, color: '#f87171', maxWidth: 220, textAlign: 'right' }}>{seedError}</span>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {walletAddress && (
                  <span style={{ fontSize: 12, color: '#666666', fontFamily: 'monospace', background: '#111111', border: '1px solid #222222', borderRadius: 6, padding: '4px 10px' }}>
                    …{walletAddress.slice(-14)}
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
                  {t.contractPrefix} …{contractAddress.slice(-10)}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {tab === 'store'
          ? <StoreView lang={lang} lace={lace} contractAddress={contractAddress} campaigns={campaigns} setCampaigns={setCampaigns} matches={matches} setMatches={setMatches} />
          : <UserView lang={lang} lace={lace} contractAddress={contractAddress} />}
      </main>

    </div>
  );
}
