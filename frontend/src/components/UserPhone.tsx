import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  CATEGORY_ICONS, CATEGORY_LABELS, SUBCATEGORY_ICONS, SUBCATEGORY_INDEX,
  type Category, type Lang,
} from '../api.ts';
import { SUBCAT_TO_CATEGORY, formatEUR } from '../catalog.ts';
import type { ReceiptJSON } from '../lace.ts';
import { T } from '../i18n.ts';
import styles from './UserPhone.module.css';

// Historial de ejemplo: no hay perfil de usuario real todavía. `signaled`
// marca las compras que ya se publicaron como señal, para que la lista
// enseñe las dos situaciones.
type Purchase = { key: string; store: string; date: Date; cents: number; subcategory: string; signaled: boolean };

const MOCK_PURCHASES: Purchase[] = [
  { store: 'Mercadona',       date: '2026-05-21', cents: 14230, subcategory: 'groceries',  signaled: true },
  { store: 'MediaMarkt',      date: '2026-05-19', cents: 8900,  subcategory: 'mobile',     signaled: false },
  { store: 'Zara',            date: '2026-05-17', cents: 4500,  subcategory: 'tops',       signaled: true },
  { store: 'Carrefour',       date: '2026-05-15', cents: 8950,  subcategory: 'groceries',  signaled: false },
  { store: 'JD Sports',       date: '2026-05-12', cents: 8900,  subcategory: 'footwear',   signaled: true },
  { store: 'El Corte Inglés', date: '2026-05-10', cents: 9500,  subcategory: 'decor',      signaled: false },
  { store: 'MediaMarkt',      date: '2026-05-08', cents: 14900, subcategory: 'audio',      signaled: true },
  { store: 'Pull&Bear',       date: '2026-05-05', cents: 3599,  subcategory: 'bottoms',    signaled: false },
  { store: 'Fnac',            date: '2026-05-03', cents: 5900,  subcategory: 'gaming',     signaled: false },
  { store: 'La Tagliatella',  date: '2026-05-01', cents: 4850,  subcategory: 'restaurant', signaled: false },
].map((p, i) => ({ ...p, key: `mock-${i}`, date: new Date(p.date) }));

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

function purchaseFromReceipt(r: ReceiptJSON): Purchase {
  return {
    key: r.nonce, store: 'Aegis Store', date: new Date(Number(r.timestamp)),
    cents: receiptCents(r), subcategory: mainSubcategory(r), signaled: true,
  };
}

type Props = {
  lang: Lang;
  /** Ticket recién sellado en la tienda, pendiente de publicar. */
  lastReceipt: ReceiptJSON | null;
  /** Recibos ya publicados como señal en esta sesión, el más reciente primero. */
  published: ReceiptJSON[];
  needsLace: boolean;
  needsDeploy: boolean;
  busy: boolean;
  onPublishLast: () => void;
  onScan: () => void;
  /** Avisos del envío en curso (confirmando, publicado, error). */
  messages?: ReactNode;
  /** Cambia cuando hay que volver al principio de la pantalla (p. ej. al llegar desde la tienda). */
  scrollTopSignal?: number;
};

export default function UserPhone({
  lang, lastReceipt, published, needsLace, needsDeploy, busy, onPublishLast, onScan, messages, scrollTopSignal,
}: Props) {
  const t = T[lang];
  const locale = lang === 'es' ? 'es-ES' : 'en-GB';
  const screenRef = useRef<HTMLDivElement>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const blocked = needsLace || needsDeploy;

  useEffect(() => {
    if (scrollTopSignal) screenRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scrollTopSignal]);

  const purchases = [...published.map(purchaseFromReceipt), ...MOCK_PURCHASES];
  const totalCents = purchases.reduce((s, p) => s + p.cents, 0);
  const signals = purchases.filter(p => p.signaled).length;

  const byCategory = new Map<Category, number>();
  for (const p of purchases) {
    const cat = SUBCAT_TO_CATEGORY[p.subcategory] ?? 'other';
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + p.cents);
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = categories[0]?.[1] ?? 1;

  // Resumen del ticket pendiente para la tarjeta.
  const pending = lastReceipt && {
    items: (lastReceipt.items ?? []).reduce((s, it) => s + it.qty, 0) || lastReceipt.lines.reduce((s, l) => s + l.qty, 0),
    cats: [...new Set(lastReceipt.lines.map(l => CATEGORY_LABELS[lang][SUBCAT_TO_CATEGORY[SUBCATEGORY_INDEX[l.subcategory]] ?? 'other']))],
    cents: receiptCents(lastReceipt),
    time: new Date(Number(lastReceipt.timestamp)).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
  };

  const now = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={styles.phone} data-tour="profile-section">
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
          <div className={styles.appTitle}>{t.phoneTitle}</div>
          <span className={styles.privatePill}>{t.phonePrivate}</span>
        </div>

        {needsLace && <div className={styles.notice}>{t.userNeedsLace}</div>}
        {needsDeploy && <div className={`${styles.notice} ${styles.noticeWarn}`}>{t.userNeedsDeploy}</div>}

        <div data-tour="contribute-section">
          {pending ? (
            <div className={styles.ticketCard} key={lastReceipt?.nonce}>
              <div className={styles.ticketTop}>
                <span>{t.phoneNewTicket} · {pending.time}</span>
                <span className={styles.newBadge}>{t.newTicketBadge}</span>
              </div>
              <div className={styles.ticketStore}>Aegis Store</div>
              <div className={styles.ticketMeta}>{t.phoneItems(pending.items)} · {pending.cats.join(', ')}</div>
              <div className={styles.ticketFoot}>
                <span className={styles.ticketTotal}>{formatEUR(pending.cents, lang)}</span>
                <button className={styles.ticketBtn} onClick={onPublishLast} disabled={blocked || busy}>
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
          {messages && <div className={styles.messages}>{messages}</div>}
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{Math.round(totalCents / 100)}€</div>
            <div className={styles.statLabel}>{t.profileStatSpent}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{purchases.length}</div>
            <div className={styles.statLabel}>{t.profileStatPurchases}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{signals}</div>
            <div className={styles.statLabel}>{t.phoneStatSignals}</div>
          </div>
        </div>

        <div className={styles.collapsible}>
          <button
            type="button" className={styles.collapsibleHead}
            onClick={() => setCategoriesOpen(o => !o)} aria-expanded={categoriesOpen}
          >
            <span className={styles.chartIcon} aria-hidden>
              {[7, 12, 9, 15].map((h, i) => <span key={i} style={{ height: h }} />)}
            </span>
            <span className={styles.collapsibleTitle}>
              {t.phoneAnalyticsTitle}
              <span className={styles.collapsibleSub}>{t.phoneAnalyticsSub(categories.length)}</span>
            </span>
            <span className={styles.collapsibleSummary}>{formatEUR(totalCents, lang)}</span>
            <span className={`${styles.chevron} ${categoriesOpen ? styles.chevronOpen : ''}`} />
          </button>
          {categoriesOpen && (
            <div className={styles.categories}>
              {categories.map(([cat, cents]) => (
                <div key={cat} className={styles.catRow}>
                  <span>{CATEGORY_ICONS[cat]} {CATEGORY_LABELS[lang][cat]}</span>
                  <span className={styles.catAmount}>{Math.round(cents / 100)}€</span>
                  <div className={styles.bar}><span style={{ width: `${(cents / maxCat) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.sectionLabel}>{t.profileReceipts}</div>
        <div className={styles.purchases}>
          {purchases.map(p => (
            <div key={p.key} className={`${styles.purchase} ${p.key.startsWith('mock-') ? '' : styles.purchaseNew}`}>
              <span className={styles.purchaseIcon}>{SUBCATEGORY_ICONS[p.subcategory] ?? '📦'}</span>
              <span className={styles.purchaseBody}>
                <div className={styles.purchaseStore}>{p.store}</div>
                <div className={styles.purchaseDate}>{p.date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</div>
              </span>
              <span className={styles.purchaseRight}>
                <div className={styles.purchaseAmount}>{formatEUR(p.cents, lang)}</div>
                {p.signaled && <span className={styles.signalChip}>✓ {t.phoneSignalChip}</span>}
              </span>
            </div>
          ))}
        </div>

        <p className={styles.footnote}>{t.profilePrivateSub}</p>
      </div>

      <div className={styles.dock}>
        <button className={styles.scanBtn} onClick={onScan} disabled={blocked || busy}>
          <span className={styles.scanIcon} />
          {t.scanButton}
        </button>
      </div>
    </div>
  );
}
