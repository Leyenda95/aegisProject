import styles from './ProfileSection.module.css';
import {
  CATEGORY_LABELS, CATEGORY_ICONS,
  SUBCATEGORY_ICONS,
  type Category, type Lang,
} from '../api.ts';
import { T } from '../i18n.ts';

type Receipt = {
  date: string;
  store: string;
  category: Category;
  subcategory: string;
  amount: number;
};

const MOCK_RECEIPTS: Receipt[] = [
  { date: '2026-05-21', store: 'Mercadona',       category: 'food',        subcategory: 'groceries',  amount: 142.30 },
  { date: '2026-05-19', store: 'MediaMarkt',      category: 'electronics', subcategory: 'mobile',     amount: 89.00  },
  { date: '2026-05-17', store: 'Zara',            category: 'fashion',     subcategory: 'tops',       amount: 45.00  },
  { date: '2026-05-15', store: 'Carrefour',       category: 'food',        subcategory: 'groceries',  amount: 89.50  },
  { date: '2026-05-12', store: 'JD Sports',       category: 'sports',      subcategory: 'footwear',   amount: 89.00  },
  { date: '2026-05-10', store: 'El Corte Inglés', category: 'home',        subcategory: 'decor',      amount: 95.00  },
  { date: '2026-05-08', store: 'MediaMarkt',      category: 'electronics', subcategory: 'audio',      amount: 149.00 },
  { date: '2026-05-05', store: 'Pull&Bear',       category: 'fashion',     subcategory: 'bottoms',    amount: 35.99  },
  { date: '2026-05-03', store: 'Fnac',            category: 'electronics', subcategory: 'gaming',     amount: 59.00  },
  { date: '2026-05-01', store: 'La Tagliatella',  category: 'food',        subcategory: 'restaurant', amount: 48.50  },
];

export default function ProfileSection({ lang }: { lang: Lang }) {
  const t = T[lang];
  const catLabel = CATEGORY_LABELS[lang];

  const totalSpent = MOCK_RECEIPTS.reduce((s, r) => s + r.amount, 0);

  const byCategory = MOCK_RECEIPTS.reduce<Record<Category, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + r.amount;
    return acc;
  }, {} as Record<Category, number>);

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]) as [Category, number][];

  return (
    <div className={styles.root}>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryCell}>
          <div className={styles.summaryValue}>{totalSpent.toFixed(0)}€</div>
          <div className={styles.summaryLabel}>{t.profileStatSpent}</div>
        </div>
        <div className={styles.summaryCell}>
          <div className={styles.summaryValue}>{MOCK_RECEIPTS.length}</div>
          <div className={styles.summaryLabel}>{t.profileStatPurchases}</div>
        </div>
      </div>

      {/* Category list */}
      <div className={styles.card}>
        <div className={styles.sectionLabel}>{t.profileBreakdown}</div>
        {sorted.map(([cat, amount]) => (
          <div key={cat} className={styles.catRow}>
            <span className={styles.catName}>{CATEGORY_ICONS[cat]} {catLabel[cat]}</span>
            <span className={styles.catAmount}>{amount.toFixed(0)}€</span>
          </div>
        ))}
      </div>

      {/* Receipt list */}
      <div className={styles.card}>
        <div className={styles.sectionLabel}>{t.profileReceipts}</div>
        {MOCK_RECEIPTS.map((r, i) => (
          <div key={i} className={styles.receiptRow}>
            <span className={styles.receiptIcon}>{SUBCATEGORY_ICONS[r.subcategory]}</span>
            <span className={styles.receiptStore}>{r.store}</span>
            <span className={styles.receiptDate}>{r.date.slice(5)}</span>
            <span className={styles.receiptAmount}>{r.amount.toFixed(2)}€</span>
          </div>
        ))}
      </div>

    </div>
  );
}
