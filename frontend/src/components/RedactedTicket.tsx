import { useState } from 'react';
import { SUBCATEGORY_INDEX, SUBCATEGORY_LABELS, CATEGORY_LABELS, type Lang } from '../api.ts';
import { SUBCAT_TO_CATEGORY, formatEUR } from '../catalog.ts';
import type { ReceiptJSON } from '../lace.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';
import styles from './ReceiptTicket.module.css';

// Campos ya presentes en el ticket: al marcarlos, se resalta la fila que ya
// existe (no se duplica en el bloque "va on-chain"). Campos nuevos (edad,
// ticket medio) no tienen fila propia, así que se añaden como línea nueva
// dentro del sello. Ninguno de los dos casos toca el contrato todavía: es
// una vista previa del diseño de revelación selectiva. Edad y ticket medio
// van con un valor de ejemplo fijo (no hay perfil de usuario real todavía).
type OptionalField = 'amount' | 'datetime' | 'products' | 'age' | 'avgTicket';
const DEMO_AGE = 25;
const DEMO_AVG_TICKET_CENTS = 7990;

// ===== VELOCIDAD DE LA CENSURA (ver también --censor-dur en ReceiptTicket.module.css) =====
const READ_MS = 1000;    // pausa con el ticket legible antes de empezar a censurar
const STAGGER_MS = 110;  // ms entre un trozo y el siguiente, SÚBELO para que tarde más en total
const MAX_STEPS = 15;    // tope: a partir de aquí los trozos ya no arrancan más tarde
// Cuándo se resalta el bloque "va on-chain" y aparece su etiqueta. Se calcula
// a partir de lo anterior para que SIEMPRE ocurra después de que la censura
// haya pasado por encima; sube KEEP_AFTER_MS si aún así te sale pronto.
const KEEP_AFTER_MS = 900; // margen tras arrancar el último trozo antes del sello
const MIDTAG_AFTER_KEEP_MS = 350; // la etiqueta "↑ ESTO VA ON-CHAIN" tras el resalte
// ========================================================================================

type Props = {
  lang: Lang;
  receipt: ReceiptJSON;
  onConfirm: () => void;
  onCancel: () => void;
};

const L = {
  es: {
    addr: 'C/ del Ejemplo 12 · Madrid · CIF B00000000',
    ticket: 'Ticket', subtotal: 'Subtotal', vat: 'IVA (21%) incl.', total: 'TOTAL',
    showPlain: 'Sin censura', showRedacted: 'Con censura',
    plainTitle: 'Tu ticket completo',
    plainText: 'Se queda íntegro en tu dispositivo. Pulsa «Con censura» para ver qué se publica en Midnight.',
    onlyThis: 'Solo esto se publica en Midnight',
    rest: 'Todo lo demás (tienda, fecha, artículos, precios e importe) se queda en tu dispositivo y nunca llega a la red.',
    midtag: '↑ ESTO VA ON-CHAIN',
    add: 'Añadir a mi bóveda', discard: 'Descartar',
    locale: 'es-ES',
    menuTitle: 'Qué compartir',
    previewNote: 'Cuanto más compartas, más personalizada será tu experiencia. Tú pones el límite.',
    categoryLabel: 'Categoría',
    subcategoryLabel: 'Subcategoría',
    mandatoryHint: 'Siempre se publica',
    amountLabel: 'Importe total del ticket',
    amountHint: 'Cuánto pagaste en total',
    datetimeLabel: 'Fecha y hora exactas',
    datetimeHint: 'Cuándo hiciste la compra',
    productsLabel: 'Productos comprados',
    productsHint: 'Qué compraste, no solo la categoría',
    ageLabel: 'Tu edad',
    ageHint: 'Para ofertas ajustadas a tu edad',
    avgTicketLabel: 'Ticket medio',
    avgTicketHint: 'Cuánto sueles gastar de media',
  },
  en: {
    addr: '12 Example St · Madrid · VAT B00000000',
    ticket: 'Receipt', subtotal: 'Subtotal', vat: 'VAT (21%) incl.', total: 'TOTAL',
    showPlain: 'Uncensored', showRedacted: 'Censored',
    plainTitle: 'Your full receipt',
    plainText: 'It stays complete on your device. Tap "Censored" to see what gets published on Midnight.',
    onlyThis: 'Only this is published on Midnight',
    rest: 'Everything else (store, date, items, prices and amount) stays on your device and never reaches the network.',
    midtag: '↑ THIS GOES ON-CHAIN',
    add: 'Add to my vault', discard: 'Discard',
    locale: 'en-GB',
    menuTitle: 'What to share',
    previewNote: 'The more you share, the more personalized your experience. You set the limit.',
    categoryLabel: 'Category',
    subcategoryLabel: 'Subcategory',
    mandatoryHint: 'Always published',
    amountLabel: 'Total ticket amount',
    amountHint: 'How much you paid in total',
    datetimeLabel: 'Exact date and time',
    datetimeHint: 'When you made the purchase',
    productsLabel: 'Products bought',
    productsHint: 'What you bought, not just the category',
    ageLabel: 'Your age',
    ageHint: 'For offers matched to your age',
    avgTicketLabel: 'Average ticket',
    avgTicketHint: 'How much you typically spend',
  },
} as const;

/**
 * Al escanear el QR: reconstruye el ticket original. Arranca en modo "con
 * censura" (todo lo no publicado se difumina y se apaga, dejando nítidas
 * solo las subcategorías selladas) y dos botones alternan con la vista "sin
 * censura" y repiten la animación.
 */
export default function RedactedTicket({ lang, receipt, onConfirm, onCancel }: Props) {
  const tt = L[lang];
  const isMobile = useBreakpoint() === 'mobile';
  const [redacted, setRedacted] = useState(true);
  // Cambia al pulsar "Con censura" para reiniciar la animación (fuerza el
  // remontaje del ticket, con lo que los @keyframes vuelven a correr).
  const [playKey, setPlayKey] = useState(0);

  // Qué campos opcionales ha marcado el usuario en el menú lateral. Es solo
  // vista previa: no cambia lo que de verdad se publica (ver comentario del
  // tipo OptionalField más arriba).
  const [revealed, setRevealed] = useState<Set<OptionalField>>(new Set());
  // Campos que el usuario ya ha tocado al menos una vez: a partir de ahí
  // dejan de depender de la animación automática por keyframes (pensada
  // solo para la censura inicial) y pasan a una transición CSS normal, así
  // marcar/desmarcar puede desvanecerse en cualquier dirección.
  const [touched, setTouched] = useState<Set<OptionalField>>(new Set());
  function toggle(field: OptionalField) {
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field); else next.add(field);
      return next;
    });
    setTouched(prev => (prev.has(field) ? prev : new Set(prev).add(field)));
  }
  const isOn = (field: OptionalField) => revealed.has(field);
  // Mismo efecto que la censura automática del principio: medido con
  // clics reales en el navegador (getComputedStyle), el keyframe veilOut
  // solo llega a bajar la opacidad a 0.1 — el blur nunca se asienta de
  // verdad. Replicar blur(3.5px) aquí hacía que se viera "desaparecido"
  // en vez de "atenuado". Solo opacidad, misma duración --censor-dur.
  const FADE = 'opacity var(--censor-dur) ease';
  function censorStyle(field: OptionalField, delay: () => { animationDelay: string }) {
    if (!touched.has(field)) return delay(); // aún no tocado: sigue la censura automática de siempre
    return isOn(field)
      ? { animation: 'none', filter: 'none', opacity: 1, transition: FADE }
      : { animation: 'none', filter: 'none', opacity: 0.1, transition: FADE };
  }
  function rowHighlight(field: OptionalField) {
    return isOn(field)
      ? { backgroundColor: 'rgba(146, 106, 69, 0.1)', boxShadow: 'inset 0 0 0 1.5px rgba(146, 106, 69, 0.85)', borderRadius: 6, padding: '1px 6px', margin: '-1px -6px' }
      : undefined;
  }

  const when = new Date(Number(receipt.timestamp));
  const dateStr = when.toLocaleDateString(tt.locale);
  const timeStr = when.toLocaleTimeString(tt.locale, { hour: '2-digit', minute: '2-digit' });
  const ticketNo = receipt.nonce.slice(0, 8).toUpperCase();
  const bars = receipt.nonce.slice(0, 34).split('').map(ch => (parseInt(ch, 16) % 4) + 1);

  // Rollup sellado (lo que se queda nítido).
  const sealed = (Array.isArray(receipt.lines) ? receipt.lines : [])
    .filter(l => l && typeof l.subcategory === 'number' && typeof l.qty === 'number')
    .map(l => {
      const key = SUBCATEGORY_INDEX[l.subcategory] ?? 'other';
      return {
        qty: l.qty,
        amountCents: Number(l.amount) || 0,
        subLabel: SUBCATEGORY_LABELS[lang][key] ?? key,
        catLabel: CATEGORY_LABELS[lang][SUBCAT_TO_CATEGORY[key] ?? 'other'],
      };
    });

  // Detalle por producto (solo pantalla). Si no viene, se deriva del rollup.
  const cleanItems = Array.isArray(receipt.items)
    ? receipt.items.filter(it => it && typeof it.name === 'string' && typeof it.qty === 'number' && typeof it.unitCents === 'number')
    : [];
  const sealedTotal = sealed.reduce((s, l) => s + l.amountCents, 0);
  const itemsTotal = cleanItems.reduce((s, it) => s + it.unitCents * it.qty, 0);
  const totalCents = itemsTotal || sealedTotal;
  const base = Math.round(totalCents / 1.21);
  const vat = totalCents - base;
  const items = cleanItems.length > 0
    ? cleanItems
    : sealed.map(l => ({ name: l.subLabel, qty: l.qty, unitCents: l.qty ? Math.round(l.amountCents / l.qty) : 0 }));

  // Cada trozo se difumina un poco más tarde que el anterior (ver consts arriba).
  let step = 0;
  const veil = () => ({ animationDelay: `${READ_MS + Math.min(step++, MAX_STEPS) * STAGGER_MS}ms` });

  // Trozos censurables antes del bloque sellado: 5 fijos (cabecera, dirección,
  // fecha, hora, nº ticket) + 2 por línea de producto + 6 (subtotal/IVA/total).
  const censorsBeforeSeal = 11 + items.length * 2;
  const keepDelayMs = READ_MS + Math.min(censorsBeforeSeal - 1, MAX_STEPS) * STAGGER_MS + KEEP_AFTER_MS;
  const midTagDelayMs = keepDelayMs + MIDTAG_AFTER_KEEP_MS;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.stage} style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
      <div className={styles.panel}>
        <div className={`${styles.wrap} ${styles.enter}`}>
          <div
            key={`${redacted ? 'r' : 'p'}-${playKey}`}
            className={`${styles.ticket} ${redacted ? styles.redacted : ''}`}
          >
            <div className={`${styles.head} ${styles.censor} ${styles.censorBlock}`} style={veil()}>AEGIS STORE</div>
            <div className={`${styles.sub} ${styles.censor} ${styles.censorBlock}`} style={veil()}>{tt.addr}</div>

            <hr className={styles.rule} />
            <div className={styles.row} style={rowHighlight('datetime')}>
              <span className={styles.censor} style={censorStyle('datetime', veil)}>{dateStr}</span>
              <span className={styles.censor} style={censorStyle('datetime', veil)}>{timeStr}</span>
            </div>
            <div className={styles.row}>
              <span className={`${styles.censor} ${styles.dim}`} style={veil()}>{tt.ticket} #{ticketNo}</span>
            </div>

            <hr className={styles.rule} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map((it, i) => (
                <div className={styles.row} key={i} style={rowHighlight('products')}>
                  <span className={`${styles.censor} ${styles.item}`} style={censorStyle('products', veil)}>{it.qty}× {it.name}</span>
                  <span className={styles.censor} style={censorStyle('products', veil)}>{formatEUR(it.unitCents * it.qty, lang)}</span>
                </div>
              ))}
            </div>

            <hr className={styles.rule} />
            <div className={styles.row}>
              <span className={`${styles.censor} ${styles.dim}`} style={veil()}>{tt.subtotal}</span>
              <span className={`${styles.censor} ${styles.dim}`} style={veil()}>{formatEUR(base, lang)}</span>
            </div>
            <div className={styles.row}>
              <span className={`${styles.censor} ${styles.dim}`} style={veil()}>{tt.vat}</span>
              <span className={`${styles.censor} ${styles.dim}`} style={veil()}>{formatEUR(vat, lang)}</span>
            </div>
            <div className={`${styles.row} ${styles.total}`} style={rowHighlight('amount')}>
              <span className={styles.censor} style={censorStyle('amount', veil)}>{tt.total}</span>
              <span className={styles.censor} style={censorStyle('amount', veil)}>{formatEUR(totalCents, lang)}</span>
            </div>

            <hr className={styles.rule} />
            <div className={styles.seal}>
              <div className={styles.keep} style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3, animationDelay: `${keepDelayMs}ms` }}>
                {sealed.map((l, i) => (
                  <div className={styles.row} key={i}>
                    <span className={styles.item}>{l.catLabel} › {l.subLabel}</span>
                    <span>×{l.qty}</span>
                  </div>
                ))}
                {isOn('age') && (
                  <div className={styles.row}>
                    <span className={styles.item}>{tt.ageLabel}</span>
                    <span>{DEMO_AGE}</span>
                  </div>
                )}
                {isOn('avgTicket') && (
                  <div className={styles.row}>
                    <span className={styles.item}>{tt.avgTicketLabel}</span>
                    <span>{formatEUR(DEMO_AVG_TICKET_CENTS, lang)}</span>
                  </div>
                )}
              </div>
              <div className={styles.midTag} style={{ animationDelay: `${midTagDelayMs}ms` }}>{tt.midtag}</div>
            </div>

            <div className={`${styles.censor} ${styles.censorBlock}`} style={veil()}>
              <div className={styles.barcode}>
                {bars.map((w, i) => <span key={i} className={styles.bar} style={{ width: w }} />)}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modes}>
          <button
            className={`${styles.modeBtn} ${!redacted ? styles.modeBtnOn : ''}`}
            onClick={() => setRedacted(false)}
          >
            {tt.showPlain}
          </button>
          <button
            className={`${styles.modeBtn} ${redacted ? styles.modeBtnOn : ''}`}
            onClick={() => { setRedacted(true); setPlayKey(k => k + 1); }}
          >
            {tt.showRedacted}
          </button>
        </div>

        <div className={styles.caption}>
          {redacted
            ? <><strong>{tt.onlyThis}</strong><br />{tt.rest}</>
            : <><strong>{tt.plainTitle}</strong><br />{tt.plainText}</>}
        </div>

        <div className={styles.actions}>
          <button onClick={onConfirm} style={{ flex: 1, background: '#926A45', color: '#fff' }}>{tt.add}</button>
          <button onClick={onCancel} style={{ flex: 1, background: '#111111', border: '1px solid #333333', color: '#AAAAAA' }}>{tt.discard}</button>
        </div>
      </div>

      <div className={styles.sideMenu}>
        <div className={styles.sideMenuTitle}>{tt.menuTitle}</div>
        <div className={styles.previewNote}>{tt.previewNote}</div>

        <div className={`${styles.toggleRow} ${styles.disabled}`}>
          <input type="checkbox" checked disabled />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel}>{tt.categoryLabel}</label>
            <div className={styles.toggleHint}>{tt.mandatoryHint}</div>
          </div>
        </div>

        <div className={`${styles.toggleRow} ${styles.disabled}`}>
          <input type="checkbox" checked disabled />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel}>{tt.subcategoryLabel}</label>
            <div className={styles.toggleHint}>{tt.mandatoryHint}</div>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <input type="checkbox" id="opt-amount" checked={isOn('amount')} onChange={() => toggle('amount')} />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel} htmlFor="opt-amount">{tt.amountLabel}</label>
            <div className={styles.toggleHint}>{tt.amountHint}</div>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <input type="checkbox" id="opt-datetime" checked={isOn('datetime')} onChange={() => toggle('datetime')} />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel} htmlFor="opt-datetime">{tt.datetimeLabel}</label>
            <div className={styles.toggleHint}>{tt.datetimeHint}</div>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <input type="checkbox" id="opt-products" checked={isOn('products')} onChange={() => toggle('products')} />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel} htmlFor="opt-products">{tt.productsLabel}</label>
            <div className={styles.toggleHint}>{tt.productsHint}</div>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <input type="checkbox" id="opt-age" checked={isOn('age')} onChange={() => toggle('age')} />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel} htmlFor="opt-age">{tt.ageLabel}</label>
            <div className={styles.toggleHint}>{tt.ageHint}</div>
            {isOn('age') && <div className={styles.avgValue}>{DEMO_AGE}</div>}
          </div>
        </div>

        <div className={styles.toggleRow}>
          <input type="checkbox" id="opt-avg" checked={isOn('avgTicket')} onChange={() => toggle('avgTicket')} />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel} htmlFor="opt-avg">{tt.avgTicketLabel}</label>
            <div className={styles.toggleHint}>{tt.avgTicketHint}</div>
            {isOn('avgTicket') && <div className={styles.avgValue}>{formatEUR(DEMO_AVG_TICKET_CENTS, lang)}</div>}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
