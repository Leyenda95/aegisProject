import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { ReceiptJSON } from '../lace.ts';
import { usePreferences } from '../app/PreferencesProvider.tsx';
import { useChain } from '../app/ChainProvider.tsx';
import LandingScreen from '../components/LandingScreen.tsx';
import StatsRibbon from '../components/StatsRibbon.tsx';
import SignalsBreakdown from '../components/SignalsBreakdown.tsx';
import StoreView from '../components/StoreView.tsx';
import UserView from '../components/UserView.tsx';
import MarketView from '../components/MarketView.tsx';
import TourGuide from '../components/TourGuide.tsx';
import styles from './DemoPage.module.css';

type Tab = 'store' | 'user';

// Tutorial guiado desactivado de momento. Poner a true para reactivarlo.
const TOUR_ENABLED = false;

/**
 * La demo: cinta con el agregado, y las vistas de la tienda, del móvil del
 * cliente y del mercado. Con `landing` (en /), la pantalla de bienvenida va
 * encima; con `market` (en /market), se ve el mercado. Es la misma página en
 * las tres rutas, así que la cesta o un ticket abierto siguen al ir y volver.
 */
export default function DemoPage({ landing = false, market = false }: { landing?: boolean; market?: boolean }) {
  const { t, lang } = usePreferences();
  const { state } = useChain();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('store');
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  // Último recibo sellado en la pestaña Tienda de esta misma sesión de demo,
  // para poder usarlo directamente en la pestaña Usuario sin pasar por
  // cámara/QR (ver UserView "usar último recibo").
  const [lastReceipt, setLastReceipt] = useState<ReceiptJSON | null>(null);
  // Nonce del último recibo cuya señal se acaba de publicar (desde cualquier
  // camino: escaneado o último recibo). StoreView lo usa para retirar su ticket/QR en
  // cuanto ese mismo recibo queda publicado, en vez de dejarlo enseñado
  // indefinidamente como si aún estuviera pendiente.
  const [publishedReceiptNonce, setPublishedReceiptNonce] = useState<string | null>(null);
  // Se incrementa cada vez que se pulsa "Ir a la vista de Usuario" desde la
  // tienda: el móvil vuelve arriba, donde está el ticket nuevo.
  const [goToContributeSignal, setGoToContributeSignal] = useState(0);

  useEffect(() => {
    if (!TOUR_ENABLED || landing) return;
    const timer = setTimeout(() => setTourActive(true), 800);
    return () => clearTimeout(timer);
  }, [landing]);

  return (
    <>
      {landing && <LandingScreen onEnter={() => navigate('/demo')} />}
      {tourActive && (
        <TourGuide lang={lang} onClose={() => setTourActive(false)} onSetTab={setTab} />
      )}

      <StatsRibbon
        state={state}
        lang={lang}
        breakdownOpen={breakdownOpen}
        onToggleBreakdown={() => setBreakdownOpen(o => !o)}
      />
      {breakdownOpen && (
        <div className={styles.breakdown}>
          <div className={styles.breakdownInner}>
            <SignalsBreakdown state={state} lang={lang} />
          </div>
        </div>
      )}

      <div className={styles.tabsWrap}>
        <div className={styles.tabs}>
          {(['store', 'user'] as Tab[]).map(id => (
            <button
              key={id}
              className={styles.tab}
              data-tour={id === 'user' ? 'tab-user' : undefined}
              onClick={() => { setTab(id); if (market) navigate('/demo'); }}
              aria-pressed={!market && tab === id}
            >
              {id === 'store' ? t.tabStore : t.tabUser}
            </button>
          ))}
          <button className={styles.tab} onClick={() => navigate('/market')} aria-pressed={market}>
            {t.tabMarket}
          </button>
        </div>
      </div>

      {/* La tienda y el móvil se quedan montados siempre (solo se oculta lo
          que no toca): así una acción en curso (un cobro esperando
          confirmación, p. ej.) no se pierde al cambiar de pestaña, y la cesta
          o el ticket abierto siguen como estaban al volver. */}
      <main className={styles.main}>
        {market && <MarketView lang={lang} />}
        <div hidden={market || tab !== 'store'}>
          <StoreView
            lang={lang}
            onReceiptGenerated={setLastReceipt}
            onGoToUser={() => { setTab('user'); setGoToContributeSignal(n => n + 1); window.scrollTo({ top: 0 }); }}
            publishedReceiptNonce={publishedReceiptNonce}
          />
        </div>
        <div hidden={market || tab !== 'user'}>
          <UserView
            lang={lang}
            lastReceipt={lastReceipt}
            onReceiptConsumed={() => setLastReceipt(null)}
            onSignalPublished={receipt => setPublishedReceiptNonce(receipt.nonce)}
            goToContributeSignal={goToContributeSignal}
          />
        </div>
      </main>
    </>
  );
}
