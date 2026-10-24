import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import QRCode from 'qrcode';
import { CATEGORY_LABELS, SUBCATEGORY_LABELS, type Category, type Lang } from '../api.ts';
import { attestReceipt, explainTxError, type ReceiptJSON } from '../lace.ts';
import { encodeReceiptForQr, receiptLink } from '../receiptCodec.ts';
import {
  PRODUCTS, SUBCAT_TO_CATEGORY, cartLinesFrom, cartTotalCents, rollupBySubcategory, sealedLines, formatEUR,
} from '../catalog.ts';
import ProductImage from './ProductImage.tsx';
import { preloadProductImages } from '../productImages.ts';
import ReceiptTicket from './ReceiptTicket.tsx';
import InsightsReport from './InsightsReport.tsx';
import { T } from '../i18n.ts';
import { cx } from '../cx.ts';
import { addReceipt, useVault } from '../vault.ts';
import { flyTicket } from '../flyTicket.ts';
import { useWallet } from '../app/WalletProvider.tsx';
import { useChain } from '../app/ChainProvider.tsx';
import { useTx } from '../app/TxProvider.tsx';
import { useReportFlow } from '../routes/demoFlow.ts';
import styles from './StoreView.module.css';

// Orden de las pestañas de categoría en el POS de la demo (moda primero).
// CATEGORIES en sí no se toca: su orden fija el de SUBCATEGORY_INDEX, que
// tiene que coincidir con el enum Subcategory del contrato.
const POS_CATEGORY_ORDER: Category[] = ['fashion', 'electronics', 'food', 'sports', 'home', 'other'];

type Props = {
  lang: Lang;
  /** Cambia a la pestaña Usuario (en tableta y móvil, donde la caja y el móvil van en pestañas). */
  onGoToUser: () => void;
};

export default function StoreView({ lang, onGoToUser }: Props) {
  const t = T[lang];
  const catLabel = CATEGORY_LABELS[lang];
  const subLabel = SUBCATEGORY_LABELS[lang];
  const { wallet: lace } = useWallet();
  const { sponsored, contractAddress } = useChain();
  // Lock global: hay una transacción de otra pestaña/acción esperando confirmación.
  const { confirming: confirmingMsg, setConfirming: setConfirmingMsg } = useTx();
  const [storeToolsOpen, setStoreToolsOpen] = useState(false);

  const [browseCat, setBrowseCat] = useState<Category>('fashion');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [posSelling, setPosSelling] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);
  const [posReceipt, setPosReceipt] = useState<ReceiptJSON | null>(null);
  const [posQr, setPosQr] = useState<string | null>(null);
  // Si el sellado del último recibo lo pagó el patrocinio (para decirlo junto al QR).
  const [posSponsored, setPosSponsored] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const vault = useVault();
  const reportFlow = useReportFlow();

  const cartLines = cartLinesFrom(cart);
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const totalCents = cartTotalCents(cartLines);
  const rollup = rollupBySubcategory(cartLines);
  const sealed = sealedLines(rollup);
  const overflowCount = rollup.length - sealed.length;
  const sealedSummary = sealed.map(r => `${subLabel[r.subcategory]} ×${r.qty}`).join(' · ')
    + (overflowCount > 0 ? ` (+${overflowCount})` : '');

  function addToCart(id: string) {
    setCart(c => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }

  function setQty(id: string, qty: number) {
    setCart(c => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  async function handleCheckout() {
    if ((!lace && !sponsored) || cartLines.length === 0 || sealed.length === 0 || confirmingMsg) return;
    setPosSelling(true);
    setPosError(null);
    try {
      // Se sellan las 8 subcategorías de mayor importe (rollup). El desglose
      // por producto viaja en el QR solo para pintar el ticket original.
      // No resuelve hasta que attestReceipt está confirmado on-chain (ver
      // pollUntil en lace.ts), así que al volver ya se puede publicar la
      // señal sin el assert de "Receipt not attested by a registered store".
      const { receipt, sponsored: paidBySponsor } = await attestReceipt(
        lace,
        sealed.map(r => ({ subcategory: r.subcategory, qty: r.qty, amount: r.amountCents })),
        lang,
        () => setConfirmingMsg(t.confirmSealing),
      );
      const receiptForQr: ReceiptJSON = {
        ...receipt,
        items: cartLines.slice(0, 24).map(l => ({ name: l.product.name[lang], qty: l.qty, unitCents: l.product.priceCents })),
      };
      setPosSponsored(paidBySponsor);
      setPosQr(await QRCode.toDataURL(receiptLink(await encodeReceiptForQr(receiptForQr)), { margin: 1, width: 260 }));
      setPosReceipt(receiptForQr);
      // En la demo, el cliente es este mismo navegador: el ticket llega a su
      // móvil sin escanear, igual que si hubiera abierto el enlace del QR.
      addReceipt(receiptForQr);
    } catch (e: any) {
      setPosError(e?.message ? explainTxError(e, lang) : t.posSealError);
    } finally {
      setPosSelling(false);
      setConfirmingMsg(null);
    }
  }

  function handleResetPos() {
    setPosReceipt(null);
    setPosQr(null);
    setPosError(null);
    setCart({});
  }

  // En cuanto la señal de este mismo ticket se publica desde el móvil, ya no
  // tiene sentido seguir enseñándolo como si estuviera pendiente de
  // escanear: se retira solo, como si se hubiera dado a "Nueva venta".
  const posPublished = Boolean(posReceipt && vault.some(e => e.receipt.nonce === posReceipt.nonce && e.publishedAt));
  useEffect(() => {
    if (posPublished) handleResetPos();
  }, [posPublished]);

  // Recién cobrado, una copia del ticket vuela hasta el móvil (si se ven los dos).
  useEffect(() => {
    if (!posReceipt) return;
    const frame = requestAnimationFrame(() => flyTicket(ticketRef.current, document.querySelector<HTMLElement>('[data-phone-ticket]')));
    return () => cancelAnimationFrame(frame);
  }, [posReceipt]);

  useEffect(() => {
    reportFlow({ cartCount, sealing: posSelling, sealedNonce: posReceipt?.nonce ?? null });
  }, [cartCount, posSelling, posReceipt, reportFlow]);

  // Las fotos de las demás categorías, en segundo plano: cambiar de categoría es instantáneo.
  useEffect(() => preloadProductImages(), []);

  return (
    <>
      {/* Punto de venta (protagonista): cesta -> recibo sellado -> QR */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>{t.posTitle}</div>

        {!contractAddress ? (
          <p className={styles.notice}>{t.posDeployFirst} <Link to="/setup" className={styles.noticeLink}>{t.setupLink}</Link></p>
        ) : !lace && !sponsored ? (
          <p className={styles.notice}>{t.posConnectFirst}</p>
        ) : posQr && posReceipt ? (
          <div className={styles.sold}>
            <p className={styles.scanHint}>{t.posScanHint}{posSponsored && ` · ${t.feePaidByAegis}`}</p>
            <div ref={ticketRef}>
              <ReceiptTicket
                lang={lang}
                lines={cartLines.map(l => ({ name: l.product.name[lang], qty: l.qty, unitCents: l.product.priceCents }))}
                totalCents={totalCents}
                receipt={posReceipt}
                qr={posQr}
              />
            </div>
            <div className={styles.soldActions}>
              {/* En escritorio el móvil está al lado: no hace falta ir a buscarlo. */}
              <button className={cx(styles.goToUser, styles.tabsOnly)} onClick={onGoToUser}>
                {t.posGoToUser}
              </button>
              <button className={styles.newSale} onClick={handleResetPos}>
                {t.posNewSale}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.pos}>
            <div className={styles.catalog}>
              <p className={styles.catalogHint}>{t.posCatalogHint}</p>

              <div className={styles.categories}>
                {POS_CATEGORY_ORDER.map(cat => (
                  <button key={cat} className={styles.category} onClick={() => setBrowseCat(cat)} aria-pressed={browseCat === cat}>
                    {catLabel[cat]}
                  </button>
                ))}
              </div>

              <div className={styles.products}>
                {PRODUCTS.filter(prod => SUBCAT_TO_CATEGORY[prod.subcategory] === browseCat).map(prod => {
                  const qty = cart[prod.id] ?? 0;
                  return (
                    <div key={prod.id} className={cx(styles.product, qty > 0 && styles.productInCart)}>
                      <ProductImage product={prod} />
                      <div className={styles.productName}>{prod.name[lang]}</div>
                      <div className={styles.productPrice}>{formatEUR(prod.priceCents, lang)}</div>
                      {qty === 0 ? (
                        <button className={styles.addBtn} onClick={() => addToCart(prod.id)}>
                          {t.posAdd}
                        </button>
                      ) : (
                        <div className={styles.stepper}>
                          <button className={styles.stepBtn} onClick={() => setQty(prod.id, qty - 1)} aria-label={t.posLess(prod.name[lang])}>−</button>
                          <span className={styles.qty}>{qty}</span>
                          <button className={styles.stepBtn} onClick={() => setQty(prod.id, qty + 1)} aria-label={t.posMore(prod.name[lang])}>+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.basket}>
              <div className={styles.basketTitle}>{t.posBasket} ({cartCount})</div>
              {cartLines.length === 0 ? (
                <p className={styles.notice}>{t.posEmpty}</p>
              ) : (
                <>
                  {cartLines.map(l => (
                    <div key={l.product.id} className={styles.basketLine}>
                      <span className={styles.basketItem}>
                        {l.qty}× {l.product.name[lang]}
                      </span>
                      <span>{formatEUR(l.product.priceCents * l.qty, lang)}</span>
                      <button className={styles.removeBtn} onClick={() => setQty(l.product.id, 0)} aria-label={t.posRemove(l.product.name[lang])}>✕</button>
                    </div>
                  ))}
                  <div className={styles.basketTotal}>
                    <span>{t.posTotal}</span><span>{formatEUR(totalCents, lang)}</span>
                  </div>
                  <p className={styles.sealNote}>{t.posSealNote(sealedSummary)}</p>
                </>
              )}
              {posError && <p className={styles.posError}>{posError}</p>}
              <button
                className={styles.checkout}
                onClick={handleCheckout}
                disabled={cartLines.length === 0 || posSelling || !!confirmingMsg}
              >
                {posSelling ? t.posSealing : t.posCheckout}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Herramientas de tienda: analítica y campañas (secundario) */}
      <div className={cx(styles.card, !storeToolsOpen && styles.toolsClosed)}>
        <button
          className={styles.toolsToggle}
          onClick={() => setStoreToolsOpen(o => !o)}
          aria-expanded={storeToolsOpen}
        >
          {/* SVG en vez del carácter Unicode ⚙: cada plataforma lo renderiza
              con su propia fuente de emoji/símbolos (3D y a color en iOS,
              plano en Android, y con ︎ forzando texto plano el glifo de
              iOS quedaba encima minúsculo). Un SVG se ve igual en todas. */}
          <span className={styles.toolsLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
            </svg>
            {t.storeTools}
          </span>
          <span aria-hidden="true" className={styles.toolsChevron}>▼</span>
        </button>

        {storeToolsOpen && (
          <div className={styles.toolsBody}>
            <InsightsReport lang={lang} />

            {/* Campañas: todavía no se pueden crear (ver campaignSoonText). */}
            <div className={styles.tool}>
              <div className={styles.campaignHeader}>
                <h3 className={styles.toolTitle}>{t.campaignTitle}</h3>
                <span className={styles.soon}>{t.campaignSoon}</span>
              </div>
              <p className={styles.campaignText}>{t.campaignSoonText}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
