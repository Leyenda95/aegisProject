import { useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { CATEGORY_LABELS, SUBCATEGORY_LABELS, type Category, type Lang } from '../api.ts';
import { PRODUCTS_BY_ID, formatEUR } from '../catalog.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import { usePreferences } from '../app/PreferencesProvider.tsx';
import { useChain } from '../app/ChainProvider.tsx';
import styles from './LandingScreen.module.css';

// Lo que tarda la portada en fundirse (.exiting) antes de dejar ver la demo.
const EXIT_MS = 650;
const LANGS: Lang[] = ['es', 'en'];

// La compra de las ilustraciones: la misma que la primera de la demo, dos
// pares de calzado.
const TICKET_ITEMS = [PRODUCTS_BY_ID['zapatillas-urbanas'], PRODUCTS_BY_ID['botas-cuero']];
// El agregado de la tercera ilustración: cifras de ejemplo, no las del contrato.
const EXAMPLE_COUNTS: [Category, number][] = [['fashion', 2580], ['food', 1883], ['electronics', 1321], ['sports', 958]];

/** El ticket de la compra: sellado en la caja o, con `redacted`, tal como se publica. */
function TicketArt({ lang, redacted = false }: { lang: Lang; redacted?: boolean }) {
  const t = T[lang];
  const total = TICKET_ITEMS.reduce((sum, p) => sum + p.priceCents, 0);
  return (
    <div className={cx(styles.paper, redacted ? styles.paperRedacted : styles.paperSealed)}>
      <div className={styles.paperLines}>
        {TICKET_ITEMS.map(p => (
          <div key={p.id} className={styles.paperRow}>
            <span className={styles.paperItem}>1× {p.name[lang]}</span>
            <span>{formatEUR(p.priceCents, lang)}</span>
          </div>
        ))}
        <div className={cx(styles.paperRow, styles.paperTotal)}>
          <span>TOTAL</span>
          <span>{formatEUR(total, lang)}</span>
        </div>
      </div>
      {redacted ? (
        <div className={styles.keep}>
          <div className={styles.keepLine}>
            <span>{CATEGORY_LABELS[lang].fashion} › {SUBCATEGORY_LABELS[lang].shoes}</span>
            <span>×2</span>
          </div>
          <span className={styles.midTag}>{t.redactMidtag}</span>
        </div>
      ) : (
        <div className={styles.seal}>◆ {t.receiptSealed} ◆</div>
      )}
    </div>
  );
}

/** El agregado público, como las barras del mercado: la categoría de la compra sube en dos. */
function AggregateArt({ lang }: { lang: Lang }) {
  const number = new Intl.NumberFormat(T[lang].locale);
  const max = Math.max(...EXAMPLE_COUNTS.map(([, count]) => count));
  return (
    <ul className={styles.bars}>
      {EXAMPLE_COUNTS.map(([category, count]) => (
        <li key={category} className={styles.barRow}>
          <span>{CATEGORY_LABELS[lang][category]}</span>
          <span className={styles.barTrack}>
            <span className={styles.bar} style={{ width: `${(count / max) * 100}%` }} />
          </span>
          <span className={styles.barValue}>
            {number.format(count)}
            {category === 'fashion' && <span className={styles.bump}>+2</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Portada: el logo enorme y translúcido, qué es Aegis en una frase, cuántas
 * señales hay ya en Midnight (en directo) y las dos entradas, la demo y el
 * mercado. Debajo, cómo funciona en tres pasos con la misma compra de la demo.
 */
export default function LandingScreen({ onEnter }: { onEnter: (path: string) => void }) {
  const { t, lang, chooseLang } = usePreferences();
  const { state, live } = useChain();
  const [exiting, setExiting] = useState(false);
  const howRef = useRef<HTMLElement>(null);
  const total = state ? Number(state.totalSignals ?? 0) : null;

  // Mientras se ve, la que se desplaza es la portada y no la página de
  // debajo (ver .landing-open en index.css). Al empezar a fundirse, la página
  // recupera su barra, así no da el salto cuando ya se ve.
  useEffect(() => {
    if (exiting) return;
    const root = document.documentElement;
    root.classList.add('landing-open');
    return () => root.classList.remove('landing-open');
  }, [exiting]);

  function enter(path: string) {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onEnter(path), EXIT_MS);
  }

  function showHow() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    howRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <div className={cx(styles.root, exiting && styles.exiting)}>
      <section className={styles.hero}>
        <div className={styles.langs} role="group" aria-label={t.landingLanguage}>
          {LANGS.map(l => (
            <button key={l} type="button" className={styles.lang} onClick={() => chooseLang(l)} aria-pressed={lang === l}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className={styles.heroWrap}>
          <img src="/images/aegis_hor.svg" alt="" className={styles.heroLogo} />
          <div className={styles.heroContent}>
            <p className={styles.title}>AEGIS</p>
            <p className={styles.tagline}>{t.tagline}</p>
            <p className={styles.headline}>{t.landingHeadline}</p>
            {/* Ocupa su sitio aunque aún no haya cifra, para que nada se mueva al llegar. */}
            <p className={cx(styles.counter, total === null && styles.counterPending)}>
              {live && <span className={styles.liveDot} aria-hidden="true" />}
              <NumberFlow className={styles.counterValue} value={total ?? 0} locales={t.locale} />
              {' '}{t.landingLiveUnit}{live && ` · ${t.signalsLive}`}
            </p>
            <div className={styles.actions}>
              <button className={styles.cta} onClick={() => enter('/demo')}>{t.landingTryDemo}</button>
              <button className={styles.secondary} onClick={() => enter('/market')}>
                {t.landingSeeMarket} <span aria-hidden="true" className={styles.arrow}>→</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.howLink} onClick={showHow}>
            {t.landingHowLink} <span aria-hidden="true" className={styles.howArrow}>↓</span>
          </button>
          {/* No usa BuiltOnMidnight: el fondo de la portada es siempre oscuro y
              aquí el texto y el logo no deben cambiar con el tema (ver .builtOn). */}
          <div className={styles.builtOn}>
            <span className={styles.builtOnText}>Built on</span>
            <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" className={styles.builtOnLogo} />
          </div>
        </div>
      </section>

      <section ref={howRef} className={styles.how} aria-labelledby="landing-how">
        <h2 id="landing-how" className={styles.howTitle}>{t.landingHowLink}</h2>
        <ol className={styles.steps}>
          {t.landingSteps.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.art} aria-hidden="true">
                {i === 0 && <TicketArt lang={lang} />}
                {i === 1 && <TicketArt lang={lang} redacted />}
                {i === 2 && <AggregateArt lang={lang} />}
              </div>
              <div className={styles.stepBody}>
                <span className={styles.stepNumber}>0{i + 1}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <button className={styles.cta} onClick={() => enter('/demo')}>{t.landingTryDemo}</button>
      </section>
    </div>
  );
}
