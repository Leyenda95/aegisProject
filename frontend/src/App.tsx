import { useEffect, useState } from 'react';
import StoreView from './components/StoreView.tsx';
import UserView from './components/UserView.tsx';
import LandingScreen from './components/LandingScreen.tsx';
import TourGuide from './components/TourGuide.tsx';
import { API_BASE, type Campaign, type MatchResult, type Lang } from './api.ts';
import { type ConnectedAPI, type WalletInfo, type ReceiptJSON, listWallets, connectWallet, deployViaLace, seedViaLace, registerStoreViaLace, checkStoreRegistered } from './lace.ts';
import { T } from './i18n.ts';
import { useAggregateState } from './hooks/useAggregateState.ts';
import StatsRibbon from './components/StatsRibbon.tsx';
import SignalsBreakdown from './components/SignalsBreakdown.tsx';
import { useBreakpoint } from './hooks/useBreakpoint.ts';
import styles from './App.module.css';

type Tab = 'store' | 'user';
type Theme = 'dark' | 'light';

const THEME_KEY = 'aegis-theme';

// Tutorial guiado desactivado de momento. Poner a true para reactivarlo.
const TOUR_ENABLED = false;

const btnBase: React.CSSProperties = {
  padding: '10px 22px', fontSize: 14, fontWeight: 600, letterSpacing: '0.3px', borderRadius: 8, cursor: 'pointer', border: 'none',
};

const pill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
  padding: '4px 11px', border: '1px solid var(--line)', borderRadius: 999,
  color: 'var(--ink-dim)', whiteSpace: 'nowrap',
};

/** Los errores del SDK son larguísimos. Deja el detalle en la consola y muestra solo un código corto. */
function briefError(label: string, e: unknown): string {
  console.error(`[${label}]`, e);
  const msg = (e as any)?.message ?? String(e);
  let h = 0;
  for (let i = 0; i < msg.length; i++) h = (h * 31 + msg.charCodeAt(i)) | 0;
  return `${label} · ERR-${(Math.abs(h) % 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('store');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchResult>>({});

  const isMobile = useBreakpoint() === 'mobile';
  const [landed, setLanded] = useState(false);
  const [lace, setLace] = useState<ConnectedAPI | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'light');
  const [laceLoading, setLaceLoading] = useState(false);
  const [laceError, setLaceError] = useState<string | null>(null);
  const [laceSlow, setLaceSlow] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [networkId, setNetworkId] = useState('preprod');
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [storeRegistered, setStoreRegistered] = useState(false);
  // Último recibo sellado en la pestaña Tienda de esta misma sesión de demo,
  // para poder usarlo directamente en la pestaña Usuario sin pasar por
  // cámara/QR (ver UserView "usar último recibo").
  const [lastReceipt, setLastReceipt] = useState<ReceiptJSON | null>(null);
  const [registeringStore, setRegisteringStore] = useState(false);
  const [registerStoreError, setRegisterStoreError] = useState<string | null>(null);
  // Mensaje neutro (no error) mientras se espera la confirmación on-chain de
  // una transacción ya enviada, para no dejar lanzar la siguiente contra un
  // estado que el indexer todavía no ha puesto al día (ver lace.ts pollUntil).
  const [confirmingMsg, setConfirmingMsg] = useState<string | null>(null);
  // Nonce del último recibo cuya señal se acaba de publicar (desde cualquier
  // camino: directo o bóveda). StoreView lo usa para retirar su ticket/QR en
  // cuanto ese mismo recibo queda publicado, en vez de dejarlo enseñado
  // indefinidamente como si aún estuviera pendiente.
  const [publishedReceiptNonce, setPublishedReceiptNonce] = useState<string | null>(null);

  // Se incrementa cada vez que se pulsa "Go to User View" desde la tienda:
  // UserView mantiene su pestaña interna (Contribute/My Profile) aunque se
  // oculte al cambiar de tab (ver `display:none` más abajo, no se desmonta),
  // así que sin esta señal explícita podía quedarse en My Profile si el
  // usuario la había abierto antes.
  const [goToContributeSignal, setGoToContributeSignal] = useState(0);

  const { state: aggregateState } = useAggregateState();
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  useEffect(() => {
    if (landed && TOUR_ENABLED) {
      const t = setTimeout(() => setTourActive(true), 800);
      return () => clearTimeout(t);
    }
  }, [landed]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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
    checkStoreRegistered().then(registered => { if (registered) setStoreRegistered(true); });
  }, []);

  async function handleConnectWallet(walletKey?: string) {
    setLaceError(null);
    if (!walletKey) {
      const wallets = listWallets();
      if (wallets.length === 0) { setLaceError(t.noWalletFound); return; }
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
        setLaceError(t.walletConnectionLost);
      } else {
        setLaceError(msg || t.connectionFailed);
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
      const address = await deployViaLace(lace, lang, () => setConfirmingMsg(t.confirmDeploying));
      setContractAddress(address);
    } catch (e: any) {
      setDeployError(briefError('deploy', e));
    } finally {
      setDeploying(false);
      setConfirmingMsg(null);
    }
  }

  async function handleSeed() {
    if (!lace) return;
    setSeedError(null);
    setSeeding(true);
    try {
      await seedViaLace(lace, lang, () => setConfirmingMsg(t.confirmSeeding));
      setSeeded(true);
    } catch (e: any) {
      setSeedError(briefError('seed', e));
    } finally {
      setSeeding(false);
      setConfirmingMsg(null);
    }
  }

  async function handleRegisterStore() {
    if (!lace) return;
    setRegisterStoreError(null);
    setRegisteringStore(true);
    try {
      await registerStoreViaLace(lace, lang, () => setConfirmingMsg(t.confirmRegisteringStore));
      setStoreRegistered(true);
    } catch (e: any) {
      setRegisterStoreError(briefError('register-store', e));
    } finally {
      setRegisteringStore(false);
      setConfirmingMsg(null);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!landed && <LandingScreen onEnter={() => setLanded(true)} />}
      {landed && tourActive && (
        <TourGuide lang={lang} onClose={() => setTourActive(false)} onSetTab={setTab} />
      )}

      <header className={`${styles.header} aegis-fade-gradient`}>
        {/* Logo + nombre + red: agrupados para poder apilar la píldora de red
            bajo el logo solo en móvil (ver .brandGroup en App.module.css) */}
        <div className={styles.brandGroup}>
          <div className={styles.brand}>
            <img className={styles.logo} src="/images/Aegis_logo_original.png" alt="Aegis" style={{ objectFit: 'contain' }} />
            {/* Móvil: wordmark con "AEGIS" integrado en vez de marca + <h1>
                por separado, una variante por tema (ver .logo/.logoMobileWordmark
                en el media query de móvil). */}
            <img className={styles.logoMobileWordmarkLight} src="/images/AEGIS_logo_movil_black.png" alt="Aegis" style={{ objectFit: 'contain' }} />
            <img className={styles.logoMobileWordmarkDark} src="/images/AEGIS_logo_movil_white.png" alt="Aegis" style={{ objectFit: 'contain' }} />
            <div className={styles.brandText}>
              <h1 className={styles.brandName} style={{ fontWeight: 600, color: 'var(--ink-bright)', letterSpacing: 2.6, lineHeight: 1.1 }}>AEGIS</h1>
              <p className={styles.brandTagline} style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 3 }}>{t.tagline}</p>
            </div>
          </div>

          {landed && (
            <span style={pill}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: lace ? '#63B98A' : '#8a6440' }} />
              {networkId}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.controlsSecondary}>
            <button
              onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? t.lightMode : t.darkMode}
              style={{
                background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-dim)',
                width: 34, height: 34, borderRadius: 8, padding: 0, fontSize: 15, lineHeight: 1,
              }}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>

            <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 8, padding: 3, border: '1px solid var(--line)' }}>
              {(['es', 'en'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  background: lang === l ? 'var(--bronze-wash)' : 'transparent',
                  color: lang === l ? 'var(--ink-bright)' : 'var(--ink-dim)',
                  border: `1px solid ${lang === l ? 'var(--bronze-deep)' : 'transparent'}`,
                  padding: '5px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlsWallet}>
          {!lace && availableWallets.length > 1 ? (
            <div style={{ display: 'flex', gap: 6 }}>
              {availableWallets.map(w => (
                <button key={w.key} onClick={() => handleConnectWallet(w.key)} disabled={laceLoading} style={{
                  ...btnBase,
                  background: 'var(--bronze-deep)', color: 'var(--on-bronze)',
                  padding: '7px 13px', fontSize: 13,
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
                background: 'var(--bronze-deep)', color: 'var(--on-bronze)',
                padding: '7px 17px', fontSize: 14,
              }}>
                {laceLoading ? t.connecting : t.connectLace}
              </button>
              {laceSlow && (
                <span style={{ fontSize: 11, color: '#888', maxWidth: 200, textAlign: 'right', lineHeight: 1.4 }}>
                  {t.laceSlowHint}
                </span>
              )}
            </div>
          ) : !contractAddress ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <button onClick={handleDeploy} disabled={deploying || !!confirmingMsg} style={{
                ...btnBase,
                background: 'var(--bronze-deep)', color: 'var(--on-bronze)',
                padding: '7px 17px', fontSize: 14,
              }}>
                {deploying ? t.deploying : t.deployContract}
              </button>
              {deployError && (
                <span style={{ fontSize: 11, color: 'var(--danger)', maxWidth: 220, textAlign: 'right' }}>{deployError}</span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {!storeRegistered && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <button onClick={handleRegisterStore} disabled={registeringStore || !!confirmingMsg} style={{
                    ...btnBase,
                    background: 'transparent', color: 'var(--bronze-deep)',
                    border: '1px solid var(--bronze-deep)',
                    padding: '9px 18px', fontSize: 13,
                  }}>
                    {registeringStore ? t.registeringStore : t.registerStore}
                  </button>
                  {registerStoreError && (
                    <span style={{ fontSize: 11, color: 'var(--danger)', maxWidth: 220, textAlign: 'right' }}>{registerStoreError}</span>
                  )}
                </div>
              )}
              {/* Datos de demo: visible tras desplegar, se oculta cuando ya se ha sembrado (flag local o isSeeded on-chain, que se resetea al redesplegar). */}
              {!seeded && Number(aggregateState?.isSeeded ?? 0) === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <button onClick={handleSeed} disabled={seeding || !!confirmingMsg} style={{
                    ...btnBase,
                    background: 'transparent', color: 'var(--bronze-deep)',
                    border: '1px solid var(--bronze-deep)',
                    padding: '9px 18px', fontSize: 13,
                  }}>
                    {seeding ? t.seeding : t.seedData}
                  </button>
                  {seedError && (
                    <span style={{ fontSize: 12, color: 'var(--danger)', maxWidth: 240, textAlign: 'right', lineHeight: 1.4 }}>{seedError}</span>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={pill}>Wallet · {walletAddress ? `…${walletAddress.slice(-6)}` : 'connected'}</span>
                {/* Solo en desktop/tablet: en móvil la pareja wallet+contrato
                    no cabe bien y descuadra el bloque de controles. */}
                {!isMobile && (
                  <span style={pill}>{t.contractPrefix} 0x…{contractAddress.slice(-4)}</span>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Debajo de idioma/tema, no de wallet: si el error apareciera junto
              al botón desbordaba la fila en pantallas estrechas. Ancho
              limitado al del propio botón de Connect Wallet en vez de a todo
              el bloque de controles. */}
          {laceError && (
            <span className={styles.controlsError} style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'right', lineHeight: 1.4 }}>{laceError}</span>
          )}
        </div>
      </header>

      {/* Aviso global: una transacción ya se envió y se está esperando su confirmación on-chain antes de permitir la siguiente. */}
      {confirmingMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 12, color: '#c9a468', background: 'var(--surface)',
          borderBottom: '1px solid var(--line)', padding: '6px 12px',
        }}>
          <span className="aegis-spinner" />
          {confirmingMsg}
        </div>
      )}

      {landed && (
        <StatsRibbon
          state={aggregateState}
          lang={lang}
          breakdownOpen={breakdownOpen}
          onToggleBreakdown={() => setBreakdownOpen(o => !o)}
        />
      )}
      {landed && breakdownOpen && (
        <div style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface)', padding: '16px 24px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <SignalsBreakdown state={aggregateState} lang={lang} />
          </div>
        </div>
      )}

      {landed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 16px 0' }}>
          <div style={{ display: 'inline-flex', gap: 3, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: 3 }}>
            {(['store', 'user'] as Tab[]).map(id => (
              <button key={id} data-tour={id === 'user' ? 'tab-user' : undefined} onClick={() => setTab(id)} style={{
                background: tab === id ? 'var(--bronze-wash)' : 'transparent',
                color: tab === id ? 'var(--ink-bright)' : 'var(--ink-dim)',
                border: `1px solid ${tab === id ? 'var(--bronze-deep)' : 'transparent'}`,
                borderRadius: 7, padding: '8px 28px', fontSize: 13, fontWeight: 600,
                fontFamily: 'var(--font-display)', cursor: 'pointer',
              }}>
                {id === 'store' ? t.tabStore : t.tabUser}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Las dos vistas se quedan montadas siempre (solo se oculta la que no toca), para
          que una acción en curso en una pestaña (p. ej. esperando la confirmación de un
          checkout) no se pierda si cambias a la otra antes de que termine. */}
      <main className={styles.main}>
        <div style={{ display: tab === 'store' ? 'block' : 'none' }}>
          <StoreView lang={lang} lace={lace} contractAddress={contractAddress} campaigns={campaigns} setCampaigns={setCampaigns} matches={matches} setMatches={setMatches} aggregateState={aggregateState} onReceiptGenerated={setLastReceipt} confirmingMsg={confirmingMsg} setConfirmingMsg={setConfirmingMsg} onGoToUser={() => { setTab('user'); setGoToContributeSignal(n => n + 1); window.scrollTo({ top: 0 }); }} publishedReceiptNonce={publishedReceiptNonce} />
        </div>
        <div style={{ display: tab === 'user' ? 'block' : 'none' }}>
          <UserView lang={lang} lace={lace} contractAddress={contractAddress} lastReceipt={lastReceipt} onReceiptConsumed={() => setLastReceipt(null)} confirmingMsg={confirmingMsg} setConfirmingMsg={setConfirmingMsg} onSignalPublished={(receipt) => setPublishedReceiptNonce(receipt.nonce)} goToContributeSignal={goToContributeSignal} />
        </div>
      </main>

    </div>
  );
}
