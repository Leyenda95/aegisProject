import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { usePreferences } from '../app/PreferencesProvider.tsx';
import { useChain } from '../app/ChainProvider.tsx';
import { useWallet } from '../app/WalletProvider.tsx';
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
import { DemoFlowContext, INITIAL_FLOW, stageOf, ticketWaiting, type DemoFlow } from './demoFlow.ts';
import StoryDeck from '../story/StoryDeck.tsx';
import TourPanel from '../story/TourPanel.tsx';
import type { DeckId } from '../story/deck.ts';
import { TourStepContext, useTourFocus, useTourStep } from '../story/tourFocus.ts';
import type { TourFacts } from '../story/tour.ts';
import { useGuidedTour, useTourRoute, type GuidedTour } from '../story/useGuidedTour.ts';
import styles from './DemoPage.module.css';

type Tab = 'store' | 'user';

/**
 * Qué se ve en cada ruta: la portada encima (/), una presentación encima
 * (/intro/:n, /recap/:n), el tour guiado con su panel (/tour/:step) o la
 * demo por libre, con la caja y el móvil (/demo) o con el mercado (/market).
 */
export type DemoScene =
  | { kind: 'landing' }
  | { kind: 'deck'; deck: DeckId }
  | { kind: 'tour' }
  | { kind: 'free'; view: 'demo' | 'market' };

/**
 * La demo: cinta con el agregado, la caja de la tienda y el móvil del
 * cliente (lado a lado en escritorio, en pestañas en tableta y móvil) y el
 * mercado. Es la misma página en todas las rutas de `DemoScene`, así que la
 * cesta o un ticket abierto siguen al ir y volver.
 */
export default function DemoPage({ scene }: { scene: DemoScene }) {
  const { lang } = usePreferences();
  const { state } = useChain();
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('store');
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  // Se incrementa al cobrar un ticket y al pulsar "Ir al móvil" desde la
  // caja: el móvil vuelve a su lista de tickets, con el nuevo arriba.
  const [goToContributeSignal, setGoToContributeSignal] = useState(0);
  const [flow, setFlow] = useState<DemoFlow>(INITIAL_FLOW);
  const reportFlow = useCallback((patch: Partial<DemoFlow>) => setFlow(f => ({ ...f, ...patch })), []);
  const stage = stageOf(flow);
  const facts: TourFacts = { stage, wallet: wallet !== null, storeChecked: flow.storeChecked };

  // En el tour, el paso decide qué se ve: el mercado o la demo y, si la caja
  // y el móvil no caben juntos, cuál de los dos.
  const tour = useGuidedTour(facts);
  const market = tour ? tour.step.view === 'market' : scene.kind === 'free' && scene.view === 'market';
  const side = tour ? tour.step.side : tab;

  useEffect(() => {
    if (flow.sealedNonce) setGoToContributeSignal(n => n + 1);
  }, [flow.sealedNonce]);

  // En el último paso del tour ya salen las pestañas y la línea de progreso: desde ahí se sigue por libre.
  const tourDone = tour !== null && tour.index === tour.total;

  function showTab(next: Tab) {
    setTab(next);
    if (market || tour) navigate('/demo');
  }

  return (
    <DemoFlowContext value={reportFlow}>
      <TourStepContext value={tour?.step ?? null}>
        <SceneLayer scene={scene} tour={tour} facts={facts} />

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

        {(!tour || tourDone) && <DemoTabs market={market} tab={side} onTab={showTab} />}

        {/* La caja y el móvil se quedan montados siempre (solo se oculta lo que
            no toca): así una acción en curso (un cobro esperando confirmación,
            p. ej.) no se pierde al cambiar de pestaña, y la cesta o el ticket
            abierto siguen como estaban al volver. */}
        <main className={cx(styles.main, !market && styles.mainDemo, tour && styles.tourMain)}>
          {market && <MarketView lang={lang} />}
          <div hidden={market}>
            {(!tour || tourDone) && <DemoProgress lang={lang} flow={flow} onViewMarket={() => navigate('/market')} />}
            <div className={styles.split} data-tab={side}>
              <div className={styles.storeCol}>
                <StoreView
                  lang={lang}
                  onGoToUser={() => { setTab('user'); setGoToContributeSignal(n => n + 1); window.scrollTo({ top: 0 }); }}
                />
              </div>
              <UserColumn flow={flow} goToContributeSignal={goToContributeSignal} />
            </div>
          </div>
          <BuiltOnMidnight className={styles.builtOn} />
        </main>
      </TourStepContext>
    </DemoFlowContext>
  );
}

/**
 * Lo que va encima de la demo según la escena: la portada, una presentación o
 * el panel del tour. Al entrar desde la portada ya se está en la intro, y la
 * portada sigue encima mientras se funde: así nunca asoma la demo entre las dos.
 */
function SceneLayer({ scene, tour, facts }: { scene: DemoScene; tour: GuidedTour | null; facts: TourFacts }) {
  const [landingFading, setLandingFading] = useState(false);
  const navigate = useNavigate();
  const showLanding = scene.kind === 'landing' || landingFading;
  return (
    <>
      <SceneContent scene={scene} tour={tour} facts={facts} />
      {showLanding && (
        <LandingScreen
          onEnter={() => { setLandingFading(true); navigate('/intro/1'); }}
          onExited={() => setLandingFading(false)}
        />
      )}
    </>
  );
}

function SceneContent({ scene, tour, facts }: { scene: DemoScene; tour: GuidedTour | null; facts: TourFacts }) {
  const route = useTourRoute();
  switch (scene.kind) {
    case 'deck': return <StoryDeck deck={scene.deck} />;
    case 'tour': return tour ? <TourPanel tour={tour} facts={facts} /> : <Navigate to={`/${route?.tour ?? 'tour'}/1`} replace />;
    case 'landing':
    case 'free': return null;
  }
}

/**
 * Pestañas de la demo libre. En escritorio, "Demo" enseña la caja y el móvil
 * a la vez; en tableta y móvil, cada uno tiene su pestaña (ver .wideOnly y
 * .narrowOnly). Al lado, la entrada al tour guiado.
 */
function DemoTabs({ market, tab, onTab }: { market: boolean; tab: Tab; onTab: (tab: Tab) => void }) {
  const { t } = usePreferences();
  const navigate = useNavigate();
  return (
    <div className={styles.tabsWrap}>
      <div className={styles.tabs}>
        <button className={cx(styles.tab, styles.wideOnly)} onClick={() => onTab(tab)} aria-pressed={!market}>
          {t.tabDemo}
        </button>
        {(['store', 'user'] as Tab[]).map(id => (
          <button key={id} className={cx(styles.tab, styles.narrowOnly)} onClick={() => onTab(id)} aria-pressed={!market && tab === id}>
            {id === 'store' ? t.tabStore : t.tabUser}
          </button>
        ))}
        <button className={styles.tab} onClick={() => navigate('/market')} aria-pressed={market}>
          {t.tabMarket}
        </button>
      </div>
      <Link className={styles.tourLink} to="/tour/1">{t.story.ui.switchToTour}</Link>
    </div>
  );
}

/** El móvil del cliente, con el aviso del ticket nuevo (fuera del tour: allí lo dice el panel). */
function UserColumn({ flow, goToContributeSignal }: { flow: DemoFlow; goToContributeSignal: number }) {
  const { lang } = usePreferences();
  const inTour = useTourStep() !== null;
  return (
    <div className={styles.userCol} data-tour={useTourFocus('phone')}>
      {!inTour && ticketWaiting(flow) && <PhoneNudge key={flow.sealedNonce} lang={lang} />}
      <UserView lang={lang} goToContributeSignal={goToContributeSignal} />
    </div>
  );
}
