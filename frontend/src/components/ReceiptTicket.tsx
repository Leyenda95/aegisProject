import type { Lang } from '../api.ts';
import { formatEUR } from '../catalog.ts';
import type { ReceiptJSON } from '../lace.ts';
import styles from './ReceiptTicket.module.css';

export type TicketLine = { name: string; qty: number; unitCents: number };

type Props = {
  lang: Lang;
  lines: TicketLine[];
  totalCents: number;
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
    proof: 'Prueba anti doble gasto',
    note: 'On-chain solo se registran las categorías y subcategorías. El resto de información publicada la decides tú!',
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
    proof: 'Double spend proof',
    note: 'On-chain only categories and subcategories are recorded. You decide what else gets published!',
    scan: 'Scan it with your Aegis app',
    thanks: 'THANK YOU FOR YOUR PURCHASE!',
    locale: 'en-GB',
  },
} as const;

/** Recibo de caja con estética de ticket real, lo enseña la tienda al cobrar. */
export default function ReceiptTicket({ lang, lines, totalCents, receipt, qr }: Props) {
  const tt = L[lang];
  const when = new Date(Number(receipt.timestamp));
  const dateStr = when.toLocaleDateString(tt.locale);
  const timeStr = when.toLocaleTimeString(tt.locale, { hour: '2-digit', minute: '2-digit' });
  const ticketNo = receipt.nonce.slice(0, 8).toUpperCase();
  const base = Math.round(totalCents / 1.21);
  const vat = totalCents - base;
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
