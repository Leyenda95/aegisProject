import type { Lang } from '../api.ts';
import { formatEUR } from '../catalog.ts';
import type { ReceiptJSON } from '../lace.ts';
import { T } from '../i18n.ts';
import styles from './ReceiptTicket.module.css';

export type TicketLine = { name: string; qty: number; unitCents: number };

type Props = {
  lang: Lang;
  lines: TicketLine[];
  totalCents: number;
  receipt: ReceiptJSON;
  qr: string | null;
};

/** Recibo de caja con estética de ticket real, lo enseña la tienda al cobrar. */
export default function ReceiptTicket({ lang, lines, totalCents, receipt, qr }: Props) {
  const t = T[lang];
  const when = new Date(Number(receipt.timestamp));
  const dateStr = when.toLocaleDateString(t.locale);
  const timeStr = when.toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' });
  const ticketNo = receipt.nonce.slice(0, 8).toUpperCase();
  const base = Math.round(totalCents / 1.21);
  const vat = totalCents - base;
  const bars = receipt.nonce.slice(0, 34).split('').map(ch => (parseInt(ch, 16) % 4) + 1);

  return (
    <div className={styles.wrap}>
      <div className={styles.ticket}>
        <div className={styles.head}>AEGIS STORE</div>
        <div className={styles.sub}>{t.receiptAddr}</div>

        <hr className={styles.rule} />
        <div className={styles.row}><span>{dateStr}</span><span>{timeStr}</span></div>
        <div className={styles.row}><span className={styles.dim}>{t.receiptNumber} #{ticketNo}</span></div>

        <hr className={styles.rule} />
        {lines.map((l, i) => (
          <div className={styles.row} key={i}>
            <span className={styles.item}>{l.qty}× {l.name}</span>
            <span>{formatEUR(l.unitCents * l.qty, lang)}</span>
          </div>
        ))}

        <hr className={styles.rule} />
        <div className={styles.row}><span className={styles.dim}>{t.receiptSubtotal}</span><span className={styles.dim}>{formatEUR(base, lang)}</span></div>
        <div className={styles.row}><span className={styles.dim}>{t.receiptVat}</span><span className={styles.dim}>{formatEUR(vat, lang)}</span></div>
        <div className={`${styles.row} ${styles.total}`}><span>{t.receiptTotal}</span><span>{formatEUR(totalCents, lang)}</span></div>

        <hr className={styles.rule} />
        <div className={styles.seal}>
          <div className={styles.sealHead}>◆ {t.receiptSealed} ◆</div>
          <div className={styles.note}>{t.receiptProof}: {ticketNo}...</div>
          <div className={styles.note}>{t.receiptNote}</div>
        </div>

        <div className={styles.barcode}>
          {bars.map((w, i) => <span key={i} className={styles.bar} style={{ width: w }} />)}
        </div>

        {qr && (
          <>
            <img className={styles.qr} src={qr} alt="QR" />
            <div className={styles.sub}>{t.receiptScan}</div>
          </>
        )}

        <hr className={styles.rule} />
        <div className={styles.thanks}>{t.receiptThanks}</div>
      </div>
    </div>
  );
}
