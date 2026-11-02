import { useState, type CSSProperties } from 'react';
import NumberFlow from '@number-flow/react';
import { CATEGORY_LABELS, SUBCATEGORY_LABELS, type Category, type Lang } from '../api.ts';
import { cx } from '../cx.ts';
import { usePreferences } from '../app/PreferencesProvider.tsx';
import { useChain } from '../app/ChainProvider.tsx';
import AegisMark from './AegisMark.tsx';
import { useLockPageScroll } from '../pageScroll.ts';
import styles from './LandingScreen.module.css';

// Lo que tarda la portada en fundirse (.exiting) y dejar ver lo de debajo.
const EXIT_MS = 650;
const LANGS: Lang[] = ['es', 'en'];

// Señales que flotan alrededor del titular: dónde (x, y en %), cuán lejos (z:
// 0 cerca, 1 lejos, más pequeña y borrosa) y qué dicen. Solo a media altura,
// a los lados de la segunda línea y del botón: arriba restarían protagonismo
// a la marca y a la píldora del contador.
const FLOATERS: { x: number; y: number; z: number; category: Category; sub: string; qty: number }[] = [
  { x: 5, y: 36, z: 0.5, category: 'fashion', sub: 'shoes', qty: 2 },
  { x: 82, y: 38, z: 0.5, category: 'electronics', sub: 'audio', qty: 1 },
  { x: 4, y: 58, z: 1, category: 'food', sub: 'cafes', qty: 1 },
  { x: 73, y: 60, z: 0, category: 'sports', sub: 'equipment', qty: 1 },
];

function splitHeadline(text: string): [string, string] {
  const i = text.indexOf('. ');
  return i < 0 ? [text, ''] : [text.slice(0, i + 1), text.slice(i + 2)];
}

/** Las señales flotan alrededor del titular; de vez en cuando una se enciende. */
function FloatingSignals({ lang }: { lang: Lang }) {
  return (
    <div className={styles.floaters} aria-hidden="true">
      {FLOATERS.map((f, i) => (
        <span key={i} className={styles.floater} style={{ '--x': `${f.x}%`, '--y': `${f.y}%`, '--z': f.z, '--i': i } as CSSProperties}>
          <span className={styles.floaterDot} />
          {CATEGORY_LABELS[lang][f.category]} › {SUBCATEGORY_LABELS[lang][f.sub]} ×{f.qty}
        </span>
      ))}
    </div>
  );
}

/** El ticket de la compra: sellado, o con todo difuminado salvo lo que se comparte. */
function TicketCard({ lang, mode }: { lang: Lang; mode: 'sealed' | 'redacted' | 'animated' }) {
  const { t } = usePreferences();
  const rows = [[t.landingItem1, '89,00 €'], [t.landingItem2, '129,00 €'], [`${t.landingCardLabel} •••• 4821`, '218,00 €']];
  return (
    <div className={cx(styles.card, styles[mode])}>
      <div className={styles.cardHead}>
        <span>{t.landingStore}</span>
        <span className={styles.tag}>◆ {t.landingSealed}</span>
      </div>
      {rows.map(([a, b], i) => (
        <div key={i} className={styles.row} style={{ '--r': i } as CSSProperties}>
          <span>{a}</span><span>{b}</span>
        </div>
      ))}
      {mode !== 'sealed' && (
        <div className={styles.keepRow}>{CATEGORY_LABELS[lang].fashion} › {SUBCATEGORY_LABELS[lang].shoes} ×2</div>
      )}
    </div>
  );
}

/** El mercado público: barras por categoría; la de la compra sube en dos. */
function MarketCard({ lang, animated = false }: { lang: Lang; animated?: boolean }) {
  const { t } = usePreferences();
  const bars: [Category, number][] = [['fashion', 92], ['food', 70], ['electronics', 52], ['sports', 38]];
  return (
    <div className={cx(styles.card, animated && styles.animated)}>
      <div className={styles.cardHead}>
        <span>{t.landingMarket}</span>
        <span className={styles.liveTag}><span className={styles.dot} /> {t.signalsLive}</span>
      </div>
      {bars.map(([cat, w]) => (
        <div key={cat} className={styles.barRow}>
          <span>{CATEGORY_LABELS[lang][cat]}</span>
          <span className={styles.track}><span className={cx(styles.fill, cat === 'fashion' && styles.fillBump)} style={{ width: `${w}%` }} /></span>
          <span className={styles.plus}>{cat === 'fashion' ? '+2' : ''}</span>
        </div>
      ))}
    </div>
  );
}

/** La app misma, en bucle: el ticket se difumina, la señal viaja y sube el mercado. */
function FlowCardArt({ lang }: { lang: Lang }) {
  return (
    <div className={styles.stage} aria-hidden="true">
      <TicketCard lang={lang} mode="animated" />
      <div className={styles.wire}><span className={styles.travel} /></div>
      <MarketCard lang={lang} animated />
    </div>
  );
}

/**
 * Portada: la marca, cuántas señales hay ya en Midnight (en directo), qué es
 * Aegis en una frase y la entrada a la demo, con la app animada debajo. Luego
 * tres cifras y cómo funciona en tres pasos con la misma compra.
 */
export default function LandingScreen({ onEnter, onExited }: { onEnter: () => void; onExited: () => void }) {
  const { t, lang, chooseLang } = usePreferences();
  const { state, live } = useChain();
  const [exiting, setExiting] = useState(false);
  const total = state ? Number(state.totalSignals ?? 0) : null;
  const [line1, line2] = splitHeadline(t.landingHeadline);

  // Mientras está montada, la que se desplaza es la portada y no la página
  // de debajo. Sigue así durante el fundido: debajo ya está la intro, que
  // también bloquea, y la barra no llega a asomar entre las dos.
  useLockPageScroll();

  // Se entra al pulsar, para que lo siguiente (la intro) ya esté debajo
  // mientras la portada se funde; `onExited` avisa cuando ya no se ve.
  function enter() {
    if (exiting) return;
    setExiting(true);
    onEnter();
    setTimeout(onExited, EXIT_MS);
  }

  return (
    <div className={cx(styles.root, exiting && styles.exiting)} data-landing>
      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.blob1} /><span className={styles.blob2} /><span className={styles.blob3} />
      </div>

      <header className={styles.nav}>
        <div className={styles.langs} role="group" aria-label={t.landingLanguage}>
          {LANGS.map(l => (
            <button key={l} type="button" className={styles.lang} onClick={() => chooseLang(l)} aria-pressed={lang === l}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <section className={styles.hero}>
        <FloatingSignals lang={lang} />
        <div className={styles.lockup}>
          <AegisMark className={styles.lockupMark} blink />
          <span className={styles.lockupName}>AEGIS</span>
        </div>
        {/* Ocupa su sitio aunque aún no haya cifra, para que nada se mueva al llegar. */}
        <p className={cx(styles.pill, total === null && styles.pending)}>
          <span className={cx(styles.dot, !live && styles.dotIdle)} aria-hidden="true" />
          <NumberFlow className={styles.pillValue} value={total ?? 0} locales={t.locale} />
          {' '}{t.landingLiveUnit}{live && ` · ${t.signalsLive}`}
        </p>
        <h1 className={styles.headline}>
          <span className={styles.line1}>{line1}</span>{' '}
          <span className={styles.line2}>{line2}</span>
        </h1>
        <p className={styles.sub}>{t.landingSub}</p>
        <button className={styles.cta} onClick={enter}>
          {t.landingExplore} <span aria-hidden="true" className={styles.ctaArrow}>→</span>
        </button>
        <div className={styles.art}>
          <FlowCardArt lang={lang} />
        </div>
      </section>

      <section className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}><NumberFlow value={total ?? 0} locales={t.locale} /></span>
          <span className={styles.statLabel}>{t.landingStatSignals}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>6</span>
          <span className={styles.statLabel}>{t.landingStatCategories}</span>
        </div>
        <div className={styles.stat}>
          <span className={cx(styles.statValue, styles.statZero)}>0</span>
          <span className={styles.statLabel}>{t.landingStatExposed}</span>
        </div>
      </section>

      <section className={styles.how} aria-labelledby="landing-how">
        <h2 id="landing-how" className={styles.howTitle}>{t.landingHowLink}</h2>
        <ol className={styles.steps}>
          {t.landingSteps.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.stepArt} aria-hidden="true">
                {i === 0 && <TicketCard lang={lang} mode="sealed" />}
                {i === 1 && <TicketCard lang={lang} mode="redacted" />}
                {i === 2 && <MarketCard lang={lang} />}
              </div>
              <span className={styles.stepNumber}>0{i + 1}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className={styles.footer}>
        <button className={styles.cta} onClick={enter}>
          {t.landingExplore} <span aria-hidden="true" className={styles.ctaArrow}>→</span>
        </button>
        <div className={styles.builtOn}>
          <span>Built on</span>
          <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" className={styles.builtOnLogo} />
        </div>
      </footer>
    </div>
  );
}
