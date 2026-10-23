import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SUBCATEGORY_INDEX, SUBCATEGORY_LABELS, CATEGORY_LABELS, type Lang } from '../api.ts';
import { SUBCAT_TO_CATEGORY, formatEUR } from '../catalog.ts';
import type { ReceiptJSON } from '../lace.ts';
import type { ShareField } from '../sharePrefs.ts';
import type { PublishStep } from '../routes/demoFlow.ts';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import { useDialog } from '../hooks/useDialog.ts';
import PublishProgress from './PublishProgress.tsx';
import styles from './ReceiptTicket.module.css';

// Campos ya presentes en el ticket: al marcarlos, se resalta la fila que ya
// existe (no se duplica en el bloque "va on-chain"). Campos nuevos (edad,
// ticket medio) no tienen fila propia, así que se añaden como línea nueva
// dentro del sello. Ninguno de los dos casos toca el contrato todavía: es
// una vista previa del diseño de revelación selectiva. Edad y ticket medio
// van con un valor de ejemplo fijo (no hay perfil de usuario real todavía).
type OptionalField = ShareField;
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

/** Por dónde va la publicación, una vez pulsado el botón (ver UserView). */
export type PublishProgressState = {
  step: PublishStep;
  signed: boolean;
  sponsored: boolean;
  error: string | null;
};

type Props = {
  lang: Lang;
  receipt: ReceiptJSON;
  onConfirm: () => void;
  onCancel: () => void;
  /** Deshabilita los botones, p. ej. mientras otra transacción espera confirmación. */
  confirmDisabled?: boolean;
  /** Lo que se comparte por defecto (pestaña Privacidad): sale ya marcado. */
  initialShare?: ShareField[];
  /** Contenido extra al final del menú lateral (p. ej. dónde se genera la prueba). */
  sideMenuExtra?: ReactNode;
  /** Ya se ha pulsado Publicar: en lugar del ticket, los pasos de la publicación. */
  progress?: PublishProgressState | null;
  /** La prueba se genera en el equipo del usuario. */
  localProof?: boolean;
  /** La primera vez, las tarjetas de qué acaba de pasar. */
  explain?: boolean;
  onViewMarket?: () => void;
};

/**
 * Al escanear el QR: reconstruye el ticket original. Arranca en modo "con
 * censura" (todo lo no publicado se difumina y se apaga, dejando nítidas
 * solo las subcategorías selladas) y dos botones alternan con la vista "sin
 * censura" y repiten la animación. Al publicar, enseña los pasos de verdad.
 */
export default function RedactedTicket({
  lang, receipt, onConfirm, onCancel, confirmDisabled, initialShare = [], sideMenuExtra,
  progress = null, localProof = false, explain = false, onViewMarket = () => {},
}: Props) {
  const t = T[lang];
  // Esc hace lo mismo que "Descartar", que no se puede pulsar mientras otra
  // transacción espera confirmación. Publicando, Esc cierra (sigue por detrás).
  const stageRef = useRef<HTMLDivElement>(null);
  useDialog(stageRef, () => { if (progress || !confirmDisabled) onCancel(); });
  const [redacted, setRedacted] = useState(true);
  // Cambia al pulsar "Con censura" para reiniciar la animación (fuerza el
  // remontaje del ticket, con lo que los @keyframes vuelven a correr).
  const [playKey, setPlayKey] = useState(0);

  // Qué campos opcionales ha marcado el usuario en el menú lateral (de
  // partida, los de la pestaña Privacidad). Es solo vista previa: no cambia
  // lo que de verdad se publica (ver comentario del tipo OptionalField).
  const [revealed, setRevealed] = useState<Set<OptionalField>>(() => new Set(initialShare));
  // Campos que el usuario ya ha tocado al menos una vez: a partir de ahí
  // dejan de depender de la animación automática por keyframes (pensada
  // solo para la censura inicial) y pasan a una transición CSS normal, así
  // marcar/desmarcar puede desvanecerse en cualquier dirección. Los marcados
  // por defecto cuentan como tocados: se ven desde el principio.
  const [touched, setTouched] = useState<Set<OptionalField>>(() => new Set(initialShare));
  function toggle(field: OptionalField) {
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field); else next.add(field);
      return next;
    });
    setTouched(prev => (prev.has(field) ? prev : new Set(prev).add(field)));
  }
  const isOn = (field: OptionalField) => revealed.has(field);
  /**
   * Clase y estilo de un trozo de un campo opcional. Hasta que el usuario lo
   * toca sigue la censura automática de siempre (con su retardo, ver veil
   * más abajo); desde entonces se ve o se atenúa según esté marcado (ver
   * .shown y .hidden en ReceiptTicket.module.css).
   */
  function optional(field: OptionalField, extra?: string) {
    if (!touched.has(field)) return { className: cx(styles.censor, extra), style: veil() };
    return { className: cx(styles.censor, extra, isOn(field) ? styles.shown : styles.hidden) };
  }
  /** Fila de un campo opcional: realzada mientras está marcado. */
  const optionalRow = (field: OptionalField, extra?: string) => cx(styles.row, extra, isOn(field) && styles.rowOn);

  const when = new Date(Number(receipt.timestamp));
  const dateStr = when.toLocaleDateString(t.locale);
  const timeStr = when.toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' });
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

  // Al final de <body>: el móvil de la demo va fijo al bajar (sticky), y
  // dentro de él la ventana quedaría por debajo de la cabecera.
  return createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div ref={stageRef} role="dialog" aria-modal="true" aria-label={t.publishSignal} tabIndex={-1} className={styles.stage} onClick={e => e.stopPropagation()}>
      <div className={styles.panel}>
        {progress ? (
          <PublishProgress
            lang={lang}
            step={progress.step}
            local={localProof}
            signed={progress.signed}
            sponsored={progress.sponsored}
            error={progress.error}
            explain={explain}
            onClose={onCancel}
            onViewMarket={onViewMarket}
          />
        ) : <>
        <div className={`${styles.wrap} ${styles.enter}`}>
          <div
            key={`${redacted ? 'r' : 'p'}-${playKey}`}
            className={`${styles.ticket} ${redacted ? styles.redacted : ''}`}
          >
            <div className={`${styles.head} ${styles.censor} ${styles.censorBlock}`} style={veil()}>AEGIS STORE</div>
            <div className={`${styles.sub} ${styles.censor} ${styles.censorBlock}`} style={veil()}>{t.receiptAddr}</div>

            <hr className={styles.rule} />
            <div className={optionalRow('datetime')}>
              <span {...optional('datetime')}>{dateStr}</span>
              <span {...optional('datetime')}>{timeStr}</span>
            </div>
            <div className={styles.row}>
              <span className={`${styles.censor} ${styles.dim}`} style={veil()}>{t.receiptNumber} #{ticketNo}</span>
            </div>

            <hr className={styles.rule} />
            <div className={styles.items}>
              {items.map((it, i) => (
                <div className={optionalRow('products')} key={i}>
                  <span {...optional('products', styles.item)}>{it.qty}× {it.name}</span>
                  <span {...optional('products')}>{formatEUR(it.unitCents * it.qty, lang)}</span>
                </div>
              ))}
            </div>

            <hr className={styles.rule} />
            <div className={styles.row}>
              <span className={`${styles.censor} ${styles.dim}`} style={veil()}>{t.receiptSubtotal}</span>
              <span className={`${styles.censor} ${styles.dim}`} style={veil()}>{formatEUR(base, lang)}</span>
            </div>
            <div className={styles.row}>
              <span className={`${styles.censor} ${styles.dim}`} style={veil()}>{t.receiptVat}</span>
              <span className={`${styles.censor} ${styles.dim}`} style={veil()}>{formatEUR(vat, lang)}</span>
            </div>
            <div className={optionalRow('amount', styles.total)}>
              <span {...optional('amount')}>{t.receiptTotal}</span>
              <span {...optional('amount')}>{formatEUR(totalCents, lang)}</span>
            </div>

            <hr className={styles.rule} />
            <div className={styles.seal}>
              <div className={styles.keep} style={{ animationDelay: `${keepDelayMs}ms` }}>
                {sealed.map((l, i) => (
                  <div className={styles.row} key={i}>
                    <span className={styles.item}>{l.catLabel} › {l.subLabel}</span>
                    <span>×{l.qty}</span>
                  </div>
                ))}
                {isOn('age') && (
                  <div className={styles.row}>
                    <span className={styles.item}>{t.shareAge}</span>
                    <span>{DEMO_AGE}</span>
                  </div>
                )}
                {isOn('avgTicket') && (
                  <div className={styles.row}>
                    <span className={styles.item}>{t.shareAvgTicket}</span>
                    <span>{formatEUR(DEMO_AVG_TICKET_CENTS, lang)}</span>
                  </div>
                )}
              </div>
              <div className={styles.midTag} style={{ animationDelay: `${midTagDelayMs}ms` }}>{t.redactMidtag}</div>
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
            aria-pressed={!redacted}
          >
            {t.redactShowPlain}
          </button>
          <button
            className={`${styles.modeBtn} ${redacted ? styles.modeBtnOn : ''}`}
            onClick={() => { setRedacted(true); setPlayKey(k => k + 1); }}
            aria-pressed={redacted}
          >
            {t.redactShowRedacted}
          </button>
        </div>

        <div className={styles.caption}>
          {redacted
            ? <><strong>{t.redactOnlyThis}</strong><br />{t.redactRest}</>
            : <><strong>{t.redactPlainTitle}</strong><br />{t.redactPlainText}</>}
        </div>

        <div className={styles.actions}>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={confirmDisabled}>{t.publishSignal}</button>
          <button className={styles.discardBtn} onClick={onCancel} disabled={confirmDisabled}>{t.redactDiscard}</button>
        </div>
        </>}
      </div>

      {!progress && <div className={styles.sideMenu}>
        <div className={styles.sideMenuTitle}>{t.shareTitle}</div>
        <div className={styles.previewNote}>{t.sharePreviewNote}</div>

        <div className={`${styles.toggleRow} ${styles.disabled}`}>
          <input type="checkbox" checked disabled />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel}>{t.shareCategory}</label>
            <div className={styles.toggleHint}>{t.shareMandatoryHint}</div>
          </div>
        </div>

        <div className={`${styles.toggleRow} ${styles.disabled}`}>
          <input type="checkbox" checked disabled />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel}>{t.shareSubcategory}</label>
            <div className={styles.toggleHint}>{t.shareMandatoryHint}</div>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <input type="checkbox" id="opt-amount" checked={isOn('amount')} onChange={() => toggle('amount')} />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel} htmlFor="opt-amount">{t.shareAmount}</label>
            <div className={styles.toggleHint}>{t.shareAmountHint}</div>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <input type="checkbox" id="opt-datetime" checked={isOn('datetime')} onChange={() => toggle('datetime')} />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel} htmlFor="opt-datetime">{t.shareDatetime}</label>
            <div className={styles.toggleHint}>{t.shareDatetimeHint}</div>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <input type="checkbox" id="opt-products" checked={isOn('products')} onChange={() => toggle('products')} />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel} htmlFor="opt-products">{t.shareProducts}</label>
            <div className={styles.toggleHint}>{t.shareProductsHint}</div>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <input type="checkbox" id="opt-age" checked={isOn('age')} onChange={() => toggle('age')} />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel} htmlFor="opt-age">{t.shareAge}</label>
            <div className={styles.toggleHint}>{t.shareAgeHint}</div>
            {isOn('age') && <div className={styles.avgValue}>{DEMO_AGE}</div>}
          </div>
        </div>

        <div className={styles.toggleRow}>
          <input type="checkbox" id="opt-avg" checked={isOn('avgTicket')} onChange={() => toggle('avgTicket')} />
          <div className={styles.toggleBody}>
            <label className={styles.toggleLabel} htmlFor="opt-avg">{t.shareAvgTicket}</label>
            <div className={styles.toggleHint}>{t.shareAvgTicketHint}</div>
            {isOn('avgTicket') && <div className={styles.avgValue}>{formatEUR(DEMO_AVG_TICKET_CENTS, lang)}</div>}
          </div>
        </div>

        {sideMenuExtra}
      </div>}
      </div>
    </div>,
    document.body,
  );
}
