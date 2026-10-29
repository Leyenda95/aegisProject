import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { usePreferences } from '../app/PreferencesProvider.tsx';
import { useChain } from '../app/ChainProvider.tsx';
import { cx } from '../cx.ts';
import LandingScreen from '../components/LandingScreen.tsx';
import StatsRibbon from '../components/StatsRibbon.tsx';
import SignalsBreakdown from '../components/SignalsBreakdown.tsx';
import StoreView from '../components/StoreView.tsx';
import UserView from '../components/UserView.tsx';
import MarketView from '../components/MarketView.tsx';
import BuiltOnMidnight from '../components/BuiltOnMidnight.tsx';
import DemoProgress from './DemoProgress.tsx';
import PhoneNudge from './PhoneNudge.tsx';
import { DemoFlowContext, INITIAL_FLOW, ticketWaiting, type DemoFlow } from './demoFlow.ts';
import styles from './DemoPage.module.css';

type Tab = 'store' | 'user';

/**
 * La demo: cinta con el agregado, la caja de la tienda y el móvil del
 * cliente (lado a lado en escritorio, en pestañas en tableta y móvil) y el
 * mercado. Con `landing` (en /), la pantalla de bienvenida va encima; con
 * `market` (en /market), se ve el mercado. Es la misma página en las tres
 * rutas, así que la cesta o un ticket abierto siguen al ir y volver.
 */
export default function DemoPage({ landing = false, market = false }: { landing?: boolean; market?: boolean }) {
  const { t, lang } = usePreferences();
  const { state } = useChain();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('store');
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  // Se incrementa al cobrar un ticket y al pulsar "Ir al móvil" desde la
  // caja: el móvil vuelve a su lista de tickets, con el nuevo arriba.
  const [goToContributeSignal, setGoToContributeSignal] = useState(0);
  const [flow, setFlow] = useState<DemoFlow>(INITIAL_FLOW);
  const reportFlow = useCallback((patch: Partial<DemoFlow>) => setFlow(f => ({ ...f, ...patch })), []);

  useEffect(() => {
    if (flow.sealedNonce) setGoToContributeSignal(n => n + 1);
  }, [flow.sealedNonce]);

  function showTab(next: Tab) {
    setTab(next);
    if (market) navigate('/demo');
  }

  return (
    <DemoFlowContext value={reportFlow}>
      {landing && <LandingScreen onEnter={() => navigate('/demo')} />}

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

      {/* En escritorio, "Demo" enseña la caja y el móvil a la vez; en tableta
          y móvil, cada uno tiene su pestaña (ver .wideOnly y .narrowOnly). */}
      <div className={styles.tabsWrap}>
        <div className={styles.tabs}>
          <button className={cx(styles.tab, styles.wideOnly)} onClick={() => showTab(tab)} aria-pressed={!market}>
            {t.tabDemo}
          </button>
          {(['store', 'user'] as Tab[]).map(id => (
            <button key={id} className={cx(styles.tab, styles.narrowOnly)} onClick={() => showTab(id)} aria-pressed={!market && tab === id}>
              {id === 'store' ? t.tabStore : t.tabUser}
            </button>
          ))}
          <button className={styles.tab} onClick={() => navigate('/market')} aria-pressed={market}>
            {t.tabMarket}
          </button>
        </div>
      </div>

      {/* La caja y el móvil se quedan montados siempre (solo se oculta lo que
          no toca): así una acción en curso (un cobro esperando confirmación,
          p. ej.) no se pierde al cambiar de pestaña, y la cesta o el ticket
          abierto siguen como estaban al volver. */}
      <main className={cx(styles.main, !market && styles.mainDemo)}>
        {market && <MarketView lang={lang} />}
        <div hidden={market}>
          <DemoProgress lang={lang} flow={flow} onViewMarket={() => navigate('/market')} />
          <div className={styles.split} data-tab={tab}>
            <div className={styles.storeCol}>
              <StoreView
                lang={lang}
                onGoToUser={() => { setTab('user'); setGoToContributeSignal(n => n + 1); window.scrollTo({ top: 0 }); }}
              />
            </div>
            <div className={styles.userCol}>
              {ticketWaiting(flow) && <PhoneNudge key={flow.sealedNonce} lang={lang} />}
              <UserView lang={lang} goToContributeSignal={goToContributeSignal} />
            </div>
          </div>
        </div>
        <BuiltOnMidnight className={styles.builtOn} />
      </main>
    </DemoFlowContext>
  );
}
