import type { Lang } from '../api.ts';
import { formatEUR } from '../catalog.ts';
import type { ReceiptJSON } from '../lace.ts';
import styles from './ReceiptTicket.module.css';

export type TicketLine = { name: string; qty: number; unitCents: number };
export type SealedLine = { label: string; qty: number; amountCents: number };

type Props = {
  lang: Lang;
  lines: TicketLine[];
  totalCents: number;
  /** Rollup por subcategoría que sí se sella y se señala (máx 8). */
  sealedLines: SealedLine[];
  /** Subcategorías que se quedaron fuera del sello (>8). */
  overflowCount: number;
  receipt: ReceiptJSON;
  qr: string | null;
};

const L = {
  es: {
    addr: 'C/ del Ejemplo 12 · Madrid · CIF B00000000',
    ticket: 'Ticket',
    subtotal: 'Subtotal',
    vat: 'IVA (21%) incl.',
    total: 'TOTAL',
    sealed: 'SELLADO EN MIDNIGHT',
    sealedAmount: 'Importe sellado',
    overflow: (n: number) => `+${n} subcategoría${n === 1 ? '' : 's'} fuera del sello`,
    proof: 'Prueba anti-doble-gasto',
    note: 'On-chain solo se registran las subcategorías y sus unidades. Ni identidad, ni tienda, ni importe, ni el detalle de artículos.',
    scan: 'Escanéalo con tu app Aegis',
    thanks: '¡GRACIAS POR SU COMPRA!',
    locale: 'es-ES',
  },
  en: {
    addr: '12 Example St · Madrid · VAT B00000000',
    ticket: 'Receipt',
    subtotal: 'Subtotal',
    vat: 'VAT (21%) incl.',
    total: 'TOTAL',
    sealed: 'SEALED ON MIDNIGHT',
    sealedAmount: 'Sealed amount',
    overflow: (n: number) => `+${n} subcategor${n === 1 ? 'y' : 'ies'} left out of the seal`,
    proof: 'Double-spend proof',
    note: 'On-chain only the subcategories and their unit counts are recorded. No identity, no store, no amount, no itemised detail.',
    scan: 'Scan it with your Aegis app',
    thanks: 'THANK YOU FOR YOUR PURCHASE!',
    locale: 'en-GB',
  },
} as const;

/** Recibo de caja con estética de ticket real, lo enseña la tienda al cobrar. */
export default function ReceiptTicket({ lang, lines, totalCents, sealedLines, overflowCount, receipt, qr }: Props) {
  const tt = L[lang];
  const when = new Date(Number(receipt.timestamp));
  const dateStr = when.toLocaleDateString(tt.locale);
  const timeStr = when.toLocaleTimeString(tt.locale, { hour: '2-digit', minute: '2-digit' });
  const ticketNo = receipt.nonce.slice(0, 8).toUpperCase();
  const base = Math.round(totalCents / 1.21);
  const vat = totalCents - base;
  const sealedTotal = sealedLines.reduce((s, l) => s + l.amountCents, 0);
  const bars = receipt.nonce.slice(0, 34).split('').map(ch => (parseInt(ch, 16) % 4) + 1);

  return (
    <div className={styles.wrap}>
      <div className={styles.ticket}>
        <div className={styles.head}>AEGIS STORE</div>
        <div className={styles.sub}>{tt.addr}</div>

        <hr className={styles.rule} />
        <div className={styles.row}><span>{dateStr}</span><span>{timeStr}</span></div>
        <div className={styles.row}><span className={styles.dim}>{tt.ticket} #{ticketNo}</span></div>

        <hr className={styles.rule} />
        {lines.map((l, i) => (
          <div className={styles.row} key={i}>
            <span className={styles.item}>{l.qty}× {l.name}</span>
            <span>{formatEUR(l.unitCents * l.qty, lang)}</span>
          </div>
        ))}

        <hr className={styles.rule} />
        <div className={styles.row}><span className={styles.dim}>{tt.subtotal}</span><span className={styles.dim}>{formatEUR(base, lang)}</span></div>
        <div className={styles.row}><span className={styles.dim}>{tt.vat}</span><span className={styles.dim}>{formatEUR(vat, lang)}</span></div>
        <div className={`${styles.row} ${styles.total}`}><span>{tt.total}</span><span>{formatEUR(totalCents, lang)}</span></div>

        <hr className={styles.rule} />
        <div className={styles.seal}>
          <div className={styles.sealHead}>◆ {tt.sealed} ◆</div>
          {sealedLines.map((l, i) => (
            <div className={styles.row} key={i}>
              <span className={styles.item}>{l.label} ×{l.qty}</span>
              <span>{formatEUR(l.amountCents, lang)}</span>
            </div>
          ))}
          <div className={styles.row}><span className={styles.dim}>{tt.sealedAmount}</span><span className={styles.dim}>{formatEUR(sealedTotal, lang)}</span></div>
          {overflowCount > 0 && <div className={styles.note}>{tt.overflow(overflowCount)}</div>}
          <div className={styles.note}>{tt.proof}: {ticketNo}...</div>
          <div className={styles.note}>{tt.note}</div>
        </div>

        <div className={styles.barcode}>
          {bars.map((w, i) => <span key={i} className={styles.bar} style={{ width: w }} />)}
        </div>

        {qr && (
          <>
            <img className={styles.qr} src={qr} alt="QR" />
            <div className={styles.sub}>{tt.scan}</div>
          </>
        )}

        <hr className={styles.rule} />
        <div className={styles.thanks}>{tt.thanks}</div>
      </div>
    </div>
  );
}
