import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  CATEGORY_ICONS, CATEGORY_LABELS, SUBCATEGORY_ICONS, SUBCATEGORY_INDEX,
  type Category, type Lang,
} from '../api.ts';
import { SUBCAT_TO_CATEGORY, formatEUR } from '../catalog.ts';
import type { ReceiptJSON } from '../lace.ts';
import type { VaultEntry } from '../vault.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import styles from './UserPhone.module.css';

type Tab = 'tickets' | 'spending' | 'privacy';
const TABS: Tab[] = ['tickets', 'spending', 'privacy'];

type Purchase = { key: string; store: string; date: Date; cents: number; subcategory: string; signaled: boolean };

const DAY_MS = 86_400_000;

// Compras de ejemplo, para que la app no esté vacía la primera vez: tiendas
// inventadas y marcadas como ejemplo en la lista. `signaled` marca las que
// ya se publicaron como señal, para que se vean las dos situaciones.
// El nombre de la tienda cambia con el idioma.
const EXAMPLES: { store: Record<Lang, string>; daysAgo: number; cents: number; subcategory: string; signaled: boolean }[] = [
  { store: { es: 'Mercado del Sol', en: 'Sunny Market' }, daysAgo: 2, cents: 14230, subcategory: 'groceries', signaled: true },
  { store: { es: 'TecnoPunto', en: 'TechCorner' }, daysAgo: 4, cents: 8900, subcategory: 'mobile', signaled: false },
  { store: { es: 'Moda Norte', en: 'Northside Apparel' }, daysAgo: 6, cents: 4500, subcategory: 'tops', signaled: true },
  { store: { es: 'Súper Ahorro', en: 'ValueMart' }, daysAgo: 8, cents: 8950, subcategory: 'groceries', signaled: false },
  { store: { es: 'Deportes Cima', en: 'Summit Sports' }, daysAgo: 11, cents: 8900, subcategory: 'footwear', signaled: true },
  { store: { es: 'Casa Lumen', en: 'Lumen Home' }, daysAgo: 13, cents: 9500, subcategory: 'decor', signaled: false },
  { store: { es: 'Sonido Plus', en: 'SoundHouse' }, daysAgo: 15, cents: 14900, subcategory: 'audio', signaled: true },
  { store: { es: 'Vaqueros & Co.', en: 'Denim & Co.' }, daysAgo: 18, cents: 3599, subcategory: 'bottoms', signaled: false },
  { store: { es: 'Arcade Center', en: 'Arcade Center' }, daysAgo: 20, cents: 5900, subcategory: 'gaming', signaled: false },
  { store: { es: 'Trattoria Roma', en: 'Trattoria Roma' }, daysAgo: 22, cents: 4850, subcategory: 'restaurant', signaled: false },
];

/** Total del recibo en céntimos: el desglose por producto si viene, si no las líneas selladas. */
function receiptCents(r: ReceiptJSON): number {
  const items = r.items ?? [];
  if (items.length > 0) return items.reduce((s, it) => s + it.unitCents * it.qty, 0);
  return r.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
}

/** Subcategoría principal del recibo: las líneas van ordenadas por importe, la primera es la de más gasto. */
function mainSubcategory(r: ReceiptJSON): string {
  return SUBCATEGORY_INDEX[r.lines[0]?.subcategory ?? -1] ?? 'other';
}

function purchaseFromEntry(e: VaultEntry): Purchase {
  return {
    key: e.receipt.nonce, store: 'Aegis Store', date: new Date(Number(e.receipt.timestamp)),
    cents: receiptCents(e.receipt), subcategory: mainSubcategory(e.receipt), signaled: Boolean(e.publishedAt),
  };
}

function TabIcon({ tab }: { tab: Tab }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tab === 'tickets' && <path d="M5 3h14v18l-2.3-1.6L14.3 21 12 19.4 9.7 21l-2.4-1.6L5 21zM9 8h6M9 12h6" />}
      {tab === 'spending' && <path d="M5 20V11M10 20V5M15 20v-7M20 20V8" />}
      {tab === 'privacy' && <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />}
    </svg>
  );
}

type Props = {
  lang: Lang;
  /** Tickets del dispositivo, el más nuevo primero (ver vault.ts). */
  entries: VaultEntry[];
  needsLace: boolean;
  needsDeploy: boolean;
  /** Hay una señal publicándose: hasta que salga no se abre otra. */
  busy: boolean;
  onOpenTicket: (receipt: ReceiptJSON) => void;
  onScan: () => void;
  /** Avisos del envío en curso (confirmando, publicado, error). */
  messages?: ReactNode;
  /** Contenido de la pestaña Privacidad. */
  privacy: ReactNode;
  /** Cambia cuando hay que volver al ticket nuevo (p. ej. al llegar desde la caja). */
  scrollTopSignal?: number;
  /** A pantalla completa, sin el marco del teléfono: la app en /app. */
  bare?: boolean;
};

export default function UserPhone({
  lang, entries, needsLace, needsDeploy, busy, onOpenTicket, onScan, messages, privacy, scrollTopSignal, bare = false,
}: Props) {
  const t = T[lang];
  const screenRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>('tickets');
  const blocked = needsLace || needsDeploy;

  useEffect(() => {
    if (!scrollTopSignal) return;
    setTab('tickets');
    screenRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scrollTopSignal]);

  function chooseTab(next: Tab) {
    setTab(next);
    screenRef.current?.scrollTo({ top: 0 });
  }

  const pending = entries.filter(e => !e.publishedAt);
  const next = pending[0]?.receipt;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const examples: Purchase[] = EXAMPLES.map((p, i) => ({ ...p, store: p.store[lang], key: `example-${i}`, date: new Date(today.getTime() - p.daysAgo * DAY_MS) }));
  const mine = entries.filter(e => e.publishedAt).map(purchaseFromEntry);
  const all = [...entries.map(purchaseFromEntry), ...examples];
  const totalCents = all.reduce((s, p) => s + p.cents, 0);
  const signals = all.filter(p => p.signaled).length;

  const byCategory = new Map<Category, number>();
  for (const p of all) {
    const cat = SUBCAT_TO_CATEGORY[p.subcategory] ?? 'other';
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + p.cents);
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = categories[0]?.[1] ?? 1;

  // Resumen del ticket pendiente para la tarjeta.
  const card = next && {
    items: (next.items ?? []).reduce((s, it) => s + it.qty, 0) || next.lines.reduce((s, l) => s + l.qty, 0),
    cats: [...new Set(next.lines.map(l => CATEGORY_LABELS[lang][SUBCAT_TO_CATEGORY[SUBCATEGORY_INDEX[l.subcategory]] ?? 'other']))],
    cents: receiptCents(next),
    time: new Date(Number(next.timestamp)).toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' }),
  };

  const now = new Date().toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' });
  const purchaseRow = (p: Purchase, isNew: boolean) => (
    <div key={p.key} className={cx(styles.purchase, isNew && styles.purchaseNew)}>
      <span className={styles.purchaseIcon}>{SUBCATEGORY_ICONS[p.subcategory] ?? '📦'}</span>
      <span className={styles.purchaseBody}>
        <div className={styles.purchaseStore}>{p.store}</div>
        <div className={styles.purchaseDate}>{p.date.toLocaleDateString(t.locale, { day: 'numeric', month: 'short' })}</div>
      </span>
      <span className={styles.purchaseRight}>
        <div className={styles.purchaseAmount}>{formatEUR(p.cents, lang)}</div>
        {p.signaled && <span className={styles.signalChip}>✓ {t.phoneSignalChip}</span>}
      </span>
    </div>
  );

  return (
    <div className={cx(styles.phone, bare && styles.bare)}>
      <div className={styles.island} />
      <div className={styles.screen} ref={screenRef}>
        <div className={styles.statusBar}>
          <span>{now}</span>
          <span className={styles.statusIcons}>
            <span className={styles.signal}>
              {[4, 6, 8, 10].map(h => <span key={h} style={{ height: h }} />)}
            </span>
            <span className={styles.battery} />
          </span>
        </div>

        <div className={styles.header}>
          <div className={styles.appTitle}>{tab === 'tickets' ? t.phoneTitle : t.phoneTabs[tab]}</div>
          <span className={styles.privatePill}>{t.phonePrivate}</span>
        </div>

        {tab === 'tickets' && (
          <>
            {needsLace && <div className={styles.notice}>{t.userNeedsLace}</div>}
            {needsDeploy && <div className={cx(styles.notice, styles.noticeWarn)}>{t.userNeedsDeploy}</div>}

            {card && next ? (
              <div className={styles.ticketCard} key={next.nonce} data-phone-ticket>
                <div className={styles.ticketTop}>
                  <span>{t.phoneNewTicket} · {card.time}</span>
                  <span className={styles.newBadge}>{t.newTicketBadge}</span>
                </div>
                <div className={styles.ticketStore}>Aegis Store</div>
                <div className={styles.ticketMeta}>{t.phoneItems(card.items)} · {card.cats.join(', ')}</div>
                <div className={styles.ticketFoot}>
                  <span className={styles.ticketTotal}>{formatEUR(card.cents, lang)}</span>
                  <button className={styles.ticketBtn} onClick={() => onOpenTicket(next)} disabled={blocked || busy}>
                    {t.publishSignal} <span className={styles.ticketArrow}>→</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.emptyCard}>
                <div className={styles.emptyTitle}>{t.phoneEmptyTitle}</div>
                <div className={styles.emptyHint}>{t.phoneEmptyHint}</div>
              </div>
            )}
            {pending.length > 1 && <div className={styles.pendingMore}>{t.phonePendingMore(pending.length - 1)}</div>}
            {messages && <div className={styles.messages}>{messages}</div>}

            {mine.length > 0 && (
              <>
                <div className={styles.sectionLabel}>{t.profileReceipts}</div>
                <div className={styles.purchases}>{mine.map(p => purchaseRow(p, true))}</div>
              </>
            )}
            <div className={styles.examplesLabel}>
              {t.phoneExamples}
              <span>{t.phoneExamplesHint}</span>
            </div>
            <div className={styles.purchases}>{examples.map(p => purchaseRow(p, false))}</div>

            <p className={styles.footnote}>{t.profilePrivateSub}</p>
          </>
        )}

        {tab === 'spending' && (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>{Math.round(totalCents / 100)}€</div>
                <div className={styles.statLabel}>{t.profileStatSpent}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{all.length}</div>
                <div className={styles.statLabel}>{t.profileStatPurchases}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{signals}</div>
                <div className={styles.statLabel}>{t.phoneStatSignals}</div>
              </div>
            </div>

            <div className={styles.collapsible}>
              <div className={styles.collapsibleHead}>
                <span className={styles.chartIcon} aria-hidden>
                  {[7, 12, 9, 15].map((h, i) => <span key={i} style={{ height: h }} />)}
                </span>
                <span className={styles.collapsibleTitle}>
                  {t.phoneAnalyticsTitle}
                  <span className={styles.collapsibleSub}>{t.phoneAnalyticsSub(categories.length)}</span>
                </span>
                <span className={styles.collapsibleSummary}>{formatEUR(totalCents, lang)}</span>
              </div>
              <div className={styles.categories}>
                {categories.map(([cat, cents]) => (
                  <div key={cat} className={styles.catRow}>
                    <span>{CATEGORY_ICONS[cat]} {CATEGORY_LABELS[lang][cat]}</span>
                    <span className={styles.catAmount}>{Math.round(cents / 100)}€</span>
                    <div className={styles.bar}><span style={{ width: `${(cents / maxCat) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <p className={styles.footnote}>{t.profilePrivateSub}</p>
          </>
        )}

        {tab === 'privacy' && privacy}
      </div>

      <div className={styles.dock}>
        {tab === 'tickets' && (
          <button className={styles.scanBtn} onClick={onScan} disabled={blocked || busy}>
            <span className={styles.scanIcon} />
            {t.scanButton}
          </button>
        )}
        <nav className={styles.tabBar} aria-label={t.phoneTitle}>
          {TABS.map(id => (
            <button key={id} className={styles.tabBtn} onClick={() => chooseTab(id)} aria-pressed={tab === id}>
              <TabIcon tab={id} />
              {t.phoneTabs[id]}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
