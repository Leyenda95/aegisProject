import { Link, useLocation } from 'react-router';
import type { Lang } from '../api.ts';
import { NETWORK_ID } from '../chainConfig.ts';
import { cx } from '../cx.ts';
import { usePreferences } from './PreferencesProvider.tsx';
import { useWallet } from './WalletProvider.tsx';
import { useChain } from './ChainProvider.tsx';
import AegisMark from '../components/AegisMark.tsx';
import { useRouteTourFocus } from '../story/tourFocus.ts';
import styles from './Header.module.css';

export default function Header() {
  const { t, theme, toggleTheme, lang, chooseLang } = usePreferences();
  const { wallet, address, choices, connecting, slow, error, connect } = useWallet();
  const { sponsored, contractAddress, storeRegistered, storeChecked, state } = useChain();
  const { pathname } = useLocation();
  // En el paso de la wallet del tour, el botón de conectar es lo resaltado.
  // En los demás no se apaga: la cabecera sigue a mano durante todo el tour.
  const walletFocus = useRouteTourFocus('wallet') === 'selected' ? 'selected' : undefined;
  // Y, mientras no hay wallet, un cartel bajo el botón dice qué pulsar.
  const connectHint = walletFocus && !wallet && !connecting ? t.connectToContinue : null;
  // Algo del alta de la demo sin hacer (en la práctica, solo en local con un
  // contrato propio): con la wallet conectada, enlace a /setup.
  // Solo cuando ya se sabe: mientras llegan el registro y los contadores, no
  // se enseña (si no, aparece un momento al cargar y desaparece).
  const setupPending = !contractAddress
    || (storeChecked && !storeRegistered)
    || (state !== null && Number(state.isSeeded ?? 0) === 0);

  return (
    <header className={styles.header}>
      {/* Logo + nombre + red: agrupados para poder apilar la píldora de red
          bajo el logo solo en móvil (ver .brandGroup en Header.module.css) */}
      <div className={styles.brandGroup}>
        <Link to="/" className={styles.brand} aria-label={t.homeLink}>
          <AegisMark className={styles.logo} title="Aegis" />
          <div className={styles.brandText}>
            <h1 className={styles.brandName}>AEGIS</h1>
            <p className={styles.brandTagline}>{t.tagline}</p>
          </div>
        </Link>

        <span className={styles.headerPills}>
          <span className={styles.pill}>
            <span className={cx(styles.dot, wallet ? styles.dotOn : styles.dotIdle)} />
            {NETWORK_ID}
          </span>
          <span className={styles.pill} title={sponsored ? t.sponsorOnHint : t.sponsorOffHint}>
            <span className={cx(styles.dot, sponsored && styles.dotOn)} />
            {sponsored ? t.sponsorOn : t.sponsorOff}
          </span>
        </span>
      </div>

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

        <div className={styles.controlsWallet} data-tour={walletFocus}>
        {!wallet && choices.length > 1 ? (
          <div className={styles.walletChoices}>
            {choices.map(w => (
              <button key={w.key} className={cx(styles.btn, styles.btnPrimary, styles.walletChoice)} onClick={() => connect(w.key)} disabled={connecting}>
                {w.name}
              </button>
            ))}
          </div>
        ) : !wallet ? (
          <div className={styles.stack}>
            <button className={cx(styles.btn, styles.btnPrimary, styles.walletMain)} onClick={() => connect()} disabled={connecting}>
              {connecting ? t.connecting : t.connectLace}
            </button>
            {slow && (
              <span className={styles.slowHint}>
                {t.laceSlowHint}
              </span>
            )}
          </div>
        ) : (
          <div className={styles.walletRow}>
            {setupPending && pathname !== '/setup' && (
              <Link to="/setup" className={cx(styles.btn, styles.btnOutline, styles.setupLink)}>{t.setupLink}</Link>
            )}
            <span className={styles.pill}>Wallet · {address ? `…${address.slice(-6)}` : 'connected'}</span>
          </div>
        )}
        {connectHint && <span className={styles.tourHint} role="status">{connectHint}</span>}
        </div>

        {/* Debajo de idioma/tema, no de wallet: si el error apareciera junto
            al botón desbordaba la fila en pantallas estrechas. Ancho
            limitado al del propio botón de Connect Wallet en vez de a todo
            el bloque de controles. */}
        {error && (
          <span className={styles.controlsError}>{error}</span>
        )}
      </div>
    </header>
  );
}
