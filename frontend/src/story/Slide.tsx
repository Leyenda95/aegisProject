import { Link } from 'react-router';
import { usePreferences } from '../app/PreferencesProvider.tsx';
import AegisMark from '../components/AegisMark.tsx';
import { cx } from '../cx.ts';
import { RESOURCES, type MissionStep, type SlideLayout } from './deck.ts';
import type { Item, SlideCopy } from './copy.ts';
import { STACK, STACK_GROUPS } from './ids.ts';
import type { TourId } from './tour.ts';
import Art from './art/Art.tsx';
import CoverArt from './art/CoverArt.tsx';
import RingTexture from './art/RingTexture.tsx';
import Icon from './Icon.tsx';
import Rich from './Rich.tsx';
import styles from './Slide.module.css';

/** Una diapositiva: su composición (de story/deck.ts) con su texto. */
export default function Slide({ layout, copy }: { layout: SlideLayout; copy: SlideCopy }) {
  switch (layout.kind) {
    case 'cover': return <Cover copy={copy} />;
    case 'feature': return <Feature layout={layout} copy={copy} />;
    case 'contrast': return <Contrast copy={copy} />;
    case 'stack': return <Stack copy={copy} links={layout.links} />;
    case 'mission': return <Mission copy={copy} steps={layout.steps} />;
    case 'checklist': return <Checklist copy={copy} />;
    case 'getStarted': return <GetStarted copy={copy} />;
  }
}

function Heading({ copy, center = false }: { copy: SlideCopy; center?: boolean }) {
  return (
    <div className={cx(styles.heading, center && styles.center)}>
      <h2 className={styles.title}><Rich text={copy.title} /></h2>
      {copy.body && <p className={styles.body}><Rich text={copy.body} /></p>}
    </div>
  );
}

/**
 * La bienvenida: el logo con el contorno del ojo saliendo en ondas
 * (CoverArt).
 */
function Cover({ copy }: { copy: SlideCopy }) {
  return (
    <section className={cx(styles.hero, styles.cover)}>
      <div className={styles.heroGlow} aria-hidden="true" />
      <CoverArt className={styles.coverWaves} />
      <AegisMark className={styles.heroMark} blink />
      {copy.kicker && <p className={styles.kicker}>{copy.kicker}</p>}
      <h1 className={styles.heroTitle}>{copy.title}</h1>
      {copy.body && <p className={styles.heroBody}><Rich text={copy.body} /></p>}
    </section>
  );
}

function Feature({ layout, copy }: { layout: Extract<SlideLayout, { kind: 'feature' }>; copy: SlideCopy }) {
  return (
    <section className={styles.feature} data-art={layout.art}>
      <div className={styles.featureTop}>
        <Art id={layout.art} className={styles.art} />
        <div className={styles.featureText}>
          <Heading copy={copy} />
          {layout.cta && <TourStart tour={layout.cta} />}
        </div>
      </div>
      {layout.items === 'cards' && <Cards items={copy.items ?? []} />}
      {layout.items === 'numbered' && <Numbered steps={copy.steps ?? []} />}
    </section>
  );
}

function Cards({ items }: { items: readonly Item[] }) {
  return (
    <ul className={styles.cards}>
      {items.map(item => (
        <li key={item.title} className={styles.card}>
          <h3 className={styles.cardTitle}>{item.title}</h3>
          <p className={styles.cardText}><Rich text={item.text} /></p>
        </li>
      ))}
    </ul>
  );
}

/** La lista con los números del dibujo. */
function Numbered({ steps }: { steps: readonly string[] }) {
  return (
    <ol className={styles.numbered}>
      {steps.map((step, i) => (
        <li key={step} className={styles.numberedItem}>
          <span className={styles.number}>{i + 1}</span>
          <span><Rich text={step} /></span>
        </li>
      ))}
    </ol>
  );
}

/** El botón de empezar el tour. */
function TourStart({ tour }: { tour: TourId }) {
  const { t } = usePreferences();
  return (
    <div className={styles.ctaRow}>
      <Link to={`/${tour}/1`} className={styles.cta}>
        {t.story.ui.startJourney} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

/**
 * Lo público frente a lo privado, en contraste: lo que queda en
 * la cadena, claro y abierto; lo que se queda en el móvil, oscuro y cerrado.
 */
function Contrast({ copy }: { copy: SlideCopy }) {
  return (
    <section className={styles.plain}>
      <Heading copy={copy} />
      <div className={styles.columns}>
        {copy.columns?.map((column, i) => (
          <div key={column.title} className={cx(styles.side, i === 1 && styles.sideDark)}>
            {i === 1 && <RingTexture className={styles.sideRings} />}
            <span className={styles.sideBadge}><Icon id={i === 0 ? 'eye' : 'lock'} /></span>
            <h3 className={styles.sideTitle}>{column.title}</h3>
            <ul className={styles.sideList}>
              {column.items.map(item => <li key={item}><Rich text={item} /></li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Lo que Aegis usa de Midnight, en dos grupos: en la intro, solo
 * el nombre; en el resumen, con lo que hace y enlace.
 */
function Stack({ copy, links }: { copy: SlideCopy; links: boolean }) {
  const s = usePreferences().t.story;
  return (
    <section className={styles.plain}>
      <Heading copy={copy} />
      <div className={cx(styles.groups, links && styles.groupsWide)}>
        {STACK_GROUPS.map((group, gi) => (
          <div key={s.stackGroups[gi]} className={styles.group}>
            <h3 className={styles.groupTitle}>{s.stackGroups[gi]}</h3>
            <ul className={links ? styles.linkGrid : styles.chips}>
              {group.map(id => links ? (
                <li key={id}>
                  <a className={styles.linkCard} href={STACK[id].href} target="_blank" rel="noreferrer">
                    <Icon id={STACK[id].icon} className={styles.linkIcon} />
                    <span className={styles.cardTitle}>{s.stack[id].title} <span aria-hidden="true">↗</span></span>
                    <span className={styles.cardText}><Rich text={s.stack[id].text} /></span>
                  </a>
                </li>
              ) : (
                <li key={id} className={styles.chip}>
                  <Icon id={STACK[id].icon} className={styles.chipIcon} />
                  {s.stack[id].title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Mission({ copy, steps }: { copy: SlideCopy; steps: readonly MissionStep[] }) {
  const { t } = usePreferences();
  return (
    <section className={styles.plain}>
      <Heading copy={copy} />
      <ol className={styles.mission}>
        {steps.map(({ id, icon }, i) => (
          <li key={id} className={styles.missionCard}>
            <span className={cx(styles.number, styles.missionNumber)}>{i + 1}</span>
            <Icon id={icon} className={styles.missionIcon} />
            <span className={styles.cardTitle}>{t.story.mission[id].title}</span>
            <span className={styles.cardText}><Rich text={t.story.mission[id].text} /></span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Checklist({ copy }: { copy: SlideCopy }) {
  return (
    <section className={styles.plain}>
      <Heading copy={copy} />
      <ul className={styles.checklist}>
        {copy.steps?.map(step => (
          <li key={step} className={styles.check}>
            <svg className={styles.checkMark} viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="10" />
              <path d="M6 10.4l2.6 2.6L14.2 7.4" />
            </svg>
            <span><Rich text={step} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Las dos tarjetas de la última diapositiva: lo que se lee y su dibujo. */
const START_CARDS = [
  { id: 'repo', art: 'repo' },
  { id: 'docs', art: 'docs' },
] as const;

/**
 * Por dónde seguir: dos tarjetas grandes con su
 * dibujo y, debajo, una franja con el correo de contacto.
 */
function GetStarted({ copy }: { copy: SlideCopy }) {
  const { t } = usePreferences();
  const r = t.story.resources;
  return (
    <section className={styles.plain}>
      <Heading copy={copy} center />
      <ul className={styles.startCards}>
        {START_CARDS.map(({ id, art }) => (
          <li key={id}>
            <a className={styles.startCard} href={RESOURCES[id].href} target="_blank" rel="noreferrer">
              <Art id={art} className={styles.startArt} />
              <span className={styles.cardTitle}>{r[id].title} <span aria-hidden="true">↗</span></span>
              <span className={styles.cardText}><Rich text={r[id].text} /></span>
            </a>
          </li>
        ))}
      </ul>
      <a className={styles.contactBar} href={RESOURCES.contact.href}>
        <Icon id={RESOURCES.contact.icon} />
        <span><strong>{r.contact.title}</strong> {r.contact.text}</span>
      </a>
    </section>
  );
}
