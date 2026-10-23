import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import StoreView from './components/StoreView.tsx';
import UserView from './components/UserView.tsx';
import LandingScreen from './components/LandingScreen.tsx';
import TourGuide from './components/TourGuide.tsx';
import { type Campaign, type MatchResult, type Lang } from './api.ts';
import { type ConnectedAPI, type WalletInfo, type ReceiptJSON, listWallets, connectWallet, deployViaLace, seedViaLace, registerStoreViaLace, checkStoreRegistered, getLocalContractAddress, getSponsorAvailable } from './lace.ts';
import { T } from './i18n.ts';
import { cx } from './cx.ts';
import { useAggregateState } from './hooks/useAggregateState.ts';
import { useVisibleInterval } from './hooks/useVisibleInterval.ts';
import { CONTRACT_ADDRESS, NETWORK_ID } from './chainConfig.ts';
import StatsRibbon from './components/StatsRibbon.tsx';
import SignalsBreakdown from './components/SignalsBreakdown.tsx';
import styles from './App.module.css';

type Tab = 'store' | 'user';
type Theme = 'dark' | 'light';

const THEME_KEY = 'aegis-theme';
const LANG_KEY = 'aegis-lang';

/** Idioma al entrar: el último que se eligió o, si nunca se eligió, el del navegador (si no es español, inglés). */
function initialLang(): Lang {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'es' || saved === 'en') return saved;
  for (const l of [...navigator.languages, navigator.language]) {
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('en')) return 'en';
  }
  return 'en';
}

// Tutorial guiado desactivado de momento. Poner a true para reactivarlo.
const TOUR_ENABLED = false;

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

  const [landed, setLanded] = useState(false);
  const [lace, setLace] = useState<ConnectedAPI | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>(initialLang);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'light');
  const [laceLoading, setLaceLoading] = useState(false);
  const [laceError, setLaceError] = useState<string | null>(null);
  const [laceSlow, setLaceSlow] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const networkId = NETWORK_ID;
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [storeRegistered, setStoreRegistered] = useState(false);
  // Si el backend paga las transacciones (patrocinio): entonces sellar y
  // publicar señales no necesita wallet (ver lace.ts getSponsorAvailable).
  const [sponsored, setSponsored] = useState(false);
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
  // camino: escaneado o último recibo). StoreView lo usa para retirar su ticket/QR en
  // cuanto ese mismo recibo queda publicado, en vez de dejarlo enseñado
  // indefinidamente como si aún estuviera pendiente.
  const [publishedReceiptNonce, setPublishedReceiptNonce] = useState<string | null>(null);

  // Se incrementa cada vez que se pulsa "Go to User View" desde la tienda:
  // UserView mantiene su pestaña interna (Contribute/My Profile) aunque se
  // oculte al cambiar de tab (ver `display:none` más abajo, no se desmonta),
  // así que sin esta señal explícita podía quedarse en My Profile si el
  // usuario la había abierto antes.
  const [goToContributeSignal, setGoToContributeSignal] = useState(0);

  const { state: aggregateState } = useAggregateState(contractAddress);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  useEffect(() => {
    if (landed && TOUR_ENABLED) {
      const t = setTimeout(() => setTourActive(true), 800);
      return () => clearTimeout(t);
    }
  }, [landed]);

  // useLayoutEffect y no useEffect: el atributo tiene que quedar puesto en
  // cuanto React aplica el cambio, para que la View Transition de
  // toggleTheme capture ya la página con el tema nuevo.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Cambios de tema que aún se están fundiendo (ver toggleTheme).
  const themeSwitches = useRef(0);

  /**
   * Cambia de tema con un solo fundido de toda la página (View Transitions):
   * el navegador la captura, se aplica el tema nuevo de golpe y funde una
   * imagen con la otra. Mientras tanto, .theme-switching (ver index.css)
   * apaga las transiciones propias de cada elemento. Si el navegador no lo
   * soporta, el tema cambia al instante.
   */
  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    if (!('startViewTransition' in document)) { setTheme(next); return; }
    const root = document.documentElement;
    root.classList.add('theme-switching');
    themeSwitches.current++;
    const transition = document.startViewTransition(() => flushSync(() => setTheme(next)));
    // Si se vuelve a pulsar a mitad del fundido, la clase se quita al acabar el último.
    transition.finished.finally(() => {
      if (--themeSwitches.current === 0) root.classList.remove('theme-switching');
    });
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  /** Solo se recuerda el idioma elegido a mano, no el que se deduce del navegador. */
  function chooseLang(l: Lang) {
    setLang(l);
    localStorage.setItem(LANG_KEY, l);
  }

  const t = T[lang];

  useEffect(() => {
    // Dirección de contrato y red: datos públicos y fijos (ver chainState.ts),
    // ya no hace falta pedírselos al backend. En local (`npm run dev`) se
    // pregunta además al backend, por si quien clona el repo despliega el suyo:
    // solo si responde que no tiene ninguno se ofrece desplegar.
    setContractAddress(CONTRACT_ADDRESS);
    if (import.meta.env.DEV) {
      getLocalContractAddress().then(address => {
        if (address !== undefined) setContractAddress(address);
      }).catch(() => {});
    }
    checkStoreRegistered().then(registered => { if (registered) setStoreRegistered(true); }).catch(() => {});
  }, []);

  // El patrocinio puede ir y venir (el bot se reinicia o tarda en tener la
  // wallet lista), así que se vuelve a comprobar cada minuto en vez de solo
  // al cargar la página, y en cuanto se vuelve a la pestaña.
  const refreshSponsor = useCallback(() => { getSponsorAvailable().then(setSponsored); }, []);
  useVisibleInterval(refreshSponsor, 60_000);

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
    if (!lace || !contractAddress) return;
    setSeedError(null);
    setSeeding(true);
    try {
      await seedViaLace(lace, contractAddress, lang, () => setConfirmingMsg(t.confirmSeeding));
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
    <div className={styles.app}>
      {!landed && <LandingScreen onEnter={() => setLanded(true)} />}
      {landed && tourActive && (
        <TourGuide lang={lang} onClose={() => setTourActive(false)} onSetTab={setTab} />
      )}

      <header className={styles.header}>
        {/* Logo + nombre + red: agrupados para poder apilar la píldora de red
            bajo el logo solo en móvil (ver .brandGroup en App.module.css) */}
        <div className={styles.brandGroup}>
          <div className={styles.brand}>
            <img className={styles.logo} src="/images/Aegis_logo_original.png" alt="Aegis" />
            {/* Móvil: wordmark con "AEGIS" integrado en vez de marca + <h1>
                por separado, una variante por tema (ver .logo/.logoMobileWordmark
                en el media query de móvil). */}
            <img className={styles.logoMobileWordmarkLight} src="/images/AEGIS_logo_movil_black.png" alt="Aegis" />
            <img className={styles.logoMobileWordmarkDark} src="/images/AEGIS_logo_movil_white.png" alt="Aegis" />
            <div className={styles.brandText}>
              <h1 className={styles.brandName}>AEGIS</h1>
              <p className={styles.brandTagline}>{t.tagline}</p>
            </div>
          </div>

          {landed && (
            <span className={styles.headerPills}>
              <span className={styles.pill}>
                <span className={cx(styles.dot, lace ? styles.dotOn : styles.dotIdle)} />
                {networkId}
              </span>
              <span className={styles.pill} title={sponsored ? t.sponsorOnHint : t.sponsorOffHint}>
                <span className={cx(styles.dot, sponsored && styles.dotOn)} />
                {sponsored ? t.sponsorOn : t.sponsorOff}
              </span>
            </span>
          )}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.controlsSecondary}>
            <button
              className={styles.themeBtn}
              onClick={toggleTheme}
              title={theme === 'dark' ? t.lightMode : t.darkMode}
              aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>

            <div className={styles.langSwitch}>
              {(['es', 'en'] as Lang[]).map(l => (
                <button key={l} className={styles.langBtn} onClick={() => chooseLang(l)} aria-pressed={lang === l}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlsWallet}>
          {!lace && availableWallets.length > 1 ? (
            <div className={styles.walletChoices}>
              {availableWallets.map(w => (
                <button key={w.key} className={cx(styles.btn, styles.btnPrimary, styles.walletChoice)} onClick={() => handleConnectWallet(w.key)} disabled={laceLoading}>
                  {w.name}
                </button>
              ))}
            </div>
          ) : !lace ? (
            <div className={styles.stack}>
              <button className={cx(styles.btn, styles.btnPrimary, styles.walletMain)} onClick={() => handleConnectWallet()} disabled={laceLoading}>
                {laceLoading ? t.connecting : t.connectLace}
              </button>
              {laceSlow && (
                <span className={styles.slowHint}>
                  {t.laceSlowHint}
                </span>
              )}
            </div>
          ) : !contractAddress ? (
            <div className={styles.stack}>
              <button className={cx(styles.btn, styles.btnPrimary, styles.walletMain)} onClick={handleDeploy} disabled={deploying || !!confirmingMsg}>
                {deploying ? t.deploying : t.deployContract}
              </button>
              {deployError && (
                <span className={styles.setupError}>{deployError}</span>
              )}
            </div>
          ) : (
            <div className={styles.walletRow}>
              {!storeRegistered && (
                <div className={styles.stack}>
                  <button className={cx(styles.btn, styles.btnOutline, styles.setupBtn)} onClick={handleRegisterStore} disabled={registeringStore || !!confirmingMsg}>
                    {registeringStore ? t.registeringStore : t.registerStore}
                  </button>
                  {registerStoreError && (
                    <span className={styles.setupError}>{registerStoreError}</span>
                  )}
                </div>
              )}
              {/* Datos de demo: visible tras desplegar, se oculta cuando ya se ha sembrado (flag local o isSeeded on-chain, que se resetea al redesplegar). */}
              {!seeded && Number(aggregateState?.isSeeded ?? 0) === 0 && (
                <div className={styles.stack}>
                  <button className={cx(styles.btn, styles.btnOutline, styles.setupBtn)} onClick={handleSeed} disabled={seeding || !!confirmingMsg}>
                    {seeding ? t.seeding : t.seedData}
                  </button>
                  {seedError && (
                    <span className={styles.seedError}>{seedError}</span>
                  )}
                </div>
              )}
              <span className={styles.pill}>Wallet · {walletAddress ? `…${walletAddress.slice(-6)}` : 'connected'}</span>
            </div>
          )}
          </div>

          {/* Debajo de idioma/tema, no de wallet: si el error apareciera junto
              al botón desbordaba la fila en pantallas estrechas. Ancho
              limitado al del propio botón de Connect Wallet en vez de a todo
              el bloque de controles. */}
          {laceError && (
            <span className={styles.controlsError}>{laceError}</span>
          )}
        </div>
      </header>

      {confirmingMsg && (
        <div className={styles.confirming}>
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
        <div className={styles.breakdown}>
          <div className={styles.breakdownInner}>
            <SignalsBreakdown state={aggregateState} lang={lang} />
          </div>
        </div>
      )}

      {landed && (
        <div className={styles.tabsWrap}>
          <div className={styles.tabs}>
            {(['store', 'user'] as Tab[]).map(id => (
              <button key={id} className={styles.tab} data-tour={id === 'user' ? 'tab-user' : undefined} onClick={() => setTab(id)} aria-pressed={tab === id}>
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
        <div hidden={tab !== 'store'}>
          <StoreView lang={lang} lace={lace} sponsored={sponsored} contractAddress={contractAddress} campaigns={campaigns} setCampaigns={setCampaigns} matches={matches} setMatches={setMatches} aggregateState={aggregateState} onReceiptGenerated={setLastReceipt} confirmingMsg={confirmingMsg} setConfirmingMsg={setConfirmingMsg} onGoToUser={() => { setTab('user'); setGoToContributeSignal(n => n + 1); window.scrollTo({ top: 0 }); }} publishedReceiptNonce={publishedReceiptNonce} />
        </div>
        <div hidden={tab !== 'user'}>
          <UserView lang={lang} lace={lace} sponsored={sponsored} contractAddress={contractAddress} lastReceipt={lastReceipt} onReceiptConsumed={() => setLastReceipt(null)} confirmingMsg={confirmingMsg} setConfirmingMsg={setConfirmingMsg} onSignalPublished={(receipt) => setPublishedReceiptNonce(receipt.nonce)} goToContributeSignal={goToContributeSignal} />
        </div>
      </main>

    </div>
  );
}
