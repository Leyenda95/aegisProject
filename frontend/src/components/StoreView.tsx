import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import QRCode from 'qrcode';
import {
  getInsights, postCampaign, getMatch,
  CATEGORIES, CATEGORY_LABELS, CATEGORY_STATE_KEY as CAT_KEY, SUBCATEGORY_LABELS,
  type AegisState, type Insights, type Campaign, type MatchResult, type Category, type Lang,
} from '../api.ts';
import { attestReceiptViaLace, explainTxError, type ConnectedAPI, type ReceiptJSON } from '../lace.ts';
import { encodeReceiptForQr } from '../receiptCodec.ts';
import {
  PRODUCTS, SUBCAT_TO_CATEGORY, cartLinesFrom, cartTotalCents, rollupBySubcategory, sealedLines, formatEUR,
} from '../catalog.ts';
import ProductImage from './ProductImage.tsx';
import ReceiptTicket from './ReceiptTicket.tsx';
import { T } from '../i18n.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';

// Orden de las pestañas de categoría en el POS de la demo (moda primero).
// CATEGORIES en sí no se toca: su orden fija el de SUBCATEGORY_INDEX, que
// tiene que coincidir con el enum Subcategory del contrato.
const POS_CATEGORY_ORDER: Category[] = ['fashion', 'electronics', 'food', 'sports', 'home', 'other'];

type Props = {
  lang: Lang;
  lace: ConnectedAPI | null;
  contractAddress: string | null;
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  matches: Record<string, MatchResult>;
  setMatches: Dispatch<SetStateAction<Record<string, MatchResult>>>;
  aggregateState: AegisState | null;
  /** Notifica el recibo sellado a App, para que UserView pueda usarlo sin cámara/QR. */
  onReceiptGenerated?: (receipt: ReceiptJSON) => void;
  /** Lock global: hay una transacción de otra pestaña/acción esperando confirmación. */
  confirmingMsg: string | null;
  setConfirmingMsg: (msg: string | null) => void;
  /** Cambia a la pestaña Usuario (guía el flujo cobro -> publicar señal). */
  onGoToUser: () => void;
  /** Nonce del último recibo ya publicado como señal (ver App). Si coincide con el ticket abierto aquí, se retira. */
  publishedReceiptNonce: string | null;
};

export default function StoreView({ lang, lace, contractAddress, campaigns, setCampaigns, matches, setMatches, aggregateState, onReceiptGenerated, confirmingMsg, setConfirmingMsg, onGoToUser, publishedReceiptNonce }: Props) {
  const t = T[lang];
  const catLabel = CATEGORY_LABELS[lang];
  const subLabel = SUBCATEGORY_LABELS[lang];
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const twoCol = bp === 'desktop';
  const state = aggregateState;

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12,
    padding: isMobile ? 14 : 26, marginBottom: 16,
  };

  const stepBtn: React.CSSProperties = {
    background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink-pale)',
    fontSize: 16, lineHeight: 1, width: 28, height: 28, borderRadius: 6, cursor: 'pointer', padding: 0,
  };

  const tool: React.CSSProperties = {
    background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10,
    padding: isMobile ? 14 : 20,
  };
  const toolTitle: React.CSSProperties = {
    fontFamily: 'var(--font-display)', fontSize: isMobile ? 15 : 16, fontWeight: 600, color: 'var(--ink-bright)', margin: '0 0 12px',
  };

  const [insights, setInsights] = useState<Insights | null>(null);
  const [storeProfile, setStoreProfile] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [form, setForm] = useState({ targetCategory: 'electronics', minSignals: 2, message: '' });
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [storeToolsOpen, setStoreToolsOpen] = useState(false);

  const [browseCat, setBrowseCat] = useState<Category>('fashion');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [posSelling, setPosSelling] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);
  const [posReceipt, setPosReceipt] = useState<ReceiptJSON | null>(null);
  const [posQr, setPosQr] = useState<string | null>(null);

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
    if (!lace || cartLines.length === 0 || sealed.length === 0 || confirmingMsg) return;
    setPosSelling(true);
    setPosError(null);
    try {
      // Se sellan las 8 subcategorías de mayor importe (rollup). El desglose
      // por producto viaja en el QR solo para pintar el ticket original.
      // No resuelve hasta que attestReceipt está confirmado on-chain (ver
      // pollUntil en lace.ts), así que al volver ya se puede publicar la
      // señal sin el assert de "Receipt not attested by a registered store".
      const receipt = await attestReceiptViaLace(
        lace,
        sealed.map(r => ({ subcategory: r.subcategory, qty: r.qty, amount: r.amountCents })),
        lang,
        () => setConfirmingMsg(t.confirmSealing),
      );
      const receiptForQr: ReceiptJSON = {
        ...receipt,
        items: cartLines.slice(0, 24).map(l => ({ name: l.product.name[lang], qty: l.qty, unitCents: l.product.priceCents })),
      };
      setPosReceipt(receiptForQr);
      setPosQr(await QRCode.toDataURL(await encodeReceiptForQr(receiptForQr), { margin: 1, width: 260 }));
      onReceiptGenerated?.(receiptForQr);
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

  // En cuanto la señal de este mismo ticket se publica (desde la pestaña
  // Usuario), ya no tiene sentido seguir enseñándolo como si estuviera
  // pendiente de escanear: se retira solo, como si se hubiera dado a
  // "Nueva venta".
  useEffect(() => {
    if (publishedReceiptNonce && posReceipt?.nonce === publishedReceiptNonce) {
      handleResetPos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishedReceiptNonce]);

  async function handleRefreshMatch(id: string) {
    setRefreshing(id);
    try {
      const match = await getMatch(id);
      setMatches(prev => ({ ...prev, [id]: match }));
    } finally {
      setRefreshing(null);
    }
  }

  // El agregado lo consulta App (useAggregateState) y llega por props. Aquí
  // solo reevaluamos qué campañas cumplen su umbral cuando cambia el estado.
  useEffect(() => {
    if (!state) return;
    setMatches(prev => {
      const updated = { ...prev };
      for (const c of campaigns) {
        const signals = Number(state[CAT_KEY[c.targetCategory as Category] ?? 'signalsOther'] ?? 0);
        if (updated[c.id]) updated[c.id] = { ...updated[c.id], matches: signals >= c.minSignals };
      }
      return updated;
    });
  }, [state, campaigns, setMatches]);

  async function handleInsights() {
    setLoadingInsights(true);
    setInsightsError(null);
    try { setInsights(await getInsights(storeProfile || undefined, lang)); }
    catch (e: any) { setInsightsError(e?.message ?? t.errorUnknown); }
    finally { setLoadingInsights(false); }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const { id } = await postCampaign(form);
      const campaign = { id, ...form };
      setCampaigns(prev => [...prev, campaign]);
      const match = await getMatch(id);
      setMatches(prev => ({ ...prev, [id]: match }));
      setForm(f => ({ ...f, message: '' }));
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      {/* Punto de venta (protagonista): cesta -> recibo sellado -> QR */}
      <div style={card}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 15 : 16, fontWeight: 600, color: 'var(--ink)', marginBottom: isMobile ? 12 : 16 }}>{t.posTitle}</div>

        {!contractAddress ? (
          <p style={{ color: 'var(--ink-dim)', fontSize: 13 }}>{t.posDeployFirst}</p>
        ) : !lace ? (
          <p style={{ color: 'var(--ink-dim)', fontSize: 13 }}>{t.posConnectFirst}</p>
        ) : posQr && posReceipt ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <p style={{ color: 'var(--ink-soft)', fontSize: 13, textAlign: 'center' }}>{t.posScanHint}</p>
            <ReceiptTicket
              lang={lang}
              lines={cartLines.map(l => ({ name: l.product.name[lang], qty: l.qty, unitCents: l.product.priceCents }))}
              totalCents={totalCents}
              receipt={posReceipt}
              qr={posQr}
            />
            <div className="aegis-hint" style={{ '--hint-accent': 'var(--success)', '--hint-glow': 'rgba(100, 209, 169, 0.45)' } as React.CSSProperties}>
              {t.posGoToUserCallout}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onGoToUser} style={{ background: 'var(--bronze-deep)', color: 'var(--on-bronze)', fontSize: 13, padding: '7px 14px', fontWeight: 600, letterSpacing: '0.3px' }}>
                {t.posGoToUser}
              </button>
              <button onClick={handleResetPos} style={{ background: 'var(--surface-2)', border: '1px solid var(--gray-850)', color: 'var(--ink-soft)', fontSize: 13, padding: '7px 14px', fontWeight: 600, letterSpacing: '0.3px' }}>
                {t.posNewSale}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: twoCol ? '1fr 320px' : '1fr', gap: 16, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              {cartLines.length === 0 && (
                <div className="aegis-hint" style={{ alignSelf: 'flex-start', marginBottom: 6 }}>{t.posFirstPurchase}</div>
              )}
              <p style={{ color: 'var(--ink-dim)', fontSize: 13, margin: 0 }}>{t.posCatalogHint}</p>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: 8 }}>
                {POS_CATEGORY_ORDER.map(cat => (
                  <button key={cat} onClick={() => setBrowseCat(cat)} style={{
                    background: browseCat === cat ? '#926a4510' : 'var(--surface-2)',
                    border: `2px solid ${browseCat === cat ? 'var(--bronze-deep)' : 'var(--line)'}`,
                    borderRadius: 10, padding: isMobile ? '8px 4px' : '10px 6px',
                    color: browseCat === cat ? 'var(--ink-bright)' : 'var(--ink-dim)',
                    fontSize: 12, cursor: 'pointer',
                  }}>
                    {catLabel[cat]}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 10 }}>
                {PRODUCTS.filter(prod => SUBCAT_TO_CATEGORY[prod.subcategory] === browseCat).map(prod => {
                  const qty = cart[prod.id] ?? 0;
                  return (
                    <div key={prod.id} style={{
                      background: 'var(--surface-2)', border: `1px solid ${qty > 0 ? 'var(--bronze-deep)' : 'var(--line)'}`,
                      borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
                    }}>
                      <ProductImage product={prod} size={isMobile ? 84 : 104} />
                      <div style={{ fontSize: 12, color: 'var(--ink-pale)', textAlign: 'center', lineHeight: 1.3, minHeight: 32 }}>{prod.name[lang]}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--price)' }}>{formatEUR(prod.priceCents, lang)}</div>
                      {qty === 0 ? (
                        <button onClick={() => addToCart(prod.id)} style={{ background: 'var(--bronze-deep)', color: 'var(--on-bronze)', fontSize: 12, padding: '6px 14px', width: '100%' }}>
                          {t.posAdd}
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' }}>
                          <button onClick={() => setQty(prod.id, qty - 1)} style={stepBtn}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                          <button onClick={() => setQty(prod.id, qty + 1)} style={stepBtn}>+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              background: 'var(--ground)', border: '1px solid var(--gray-800)', borderRadius: 10, padding: isMobile ? 12 : 16,
              display: 'flex', flexDirection: 'column', gap: 10,
              position: twoCol ? 'sticky' : undefined, top: twoCol ? 84 : undefined,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-bright)' }}>{t.posBasket} ({cartCount})</div>
              {cartLines.length === 0 ? (
                <p style={{ color: 'var(--ink-dim)', fontSize: 13 }}>{t.posEmpty}</p>
              ) : (
                <>
                  {cartLines.map(l => (
                    <div key={l.product.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-pale)' }}>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.qty}× {l.product.name[lang]}
                      </span>
                      <span style={{ color: 'var(--ink-pale)' }}>{formatEUR(l.product.priceCents * l.qty, lang)}</span>
                      <button onClick={() => setQty(l.product.id, 0)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-dim)', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>✕</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gray-850)', paddingTop: 8, fontSize: 15, fontWeight: 700, color: 'var(--ink-bright)' }}>
                    <span>{t.posTotal}</span><span>{formatEUR(totalCents, lang)}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--ink-dim)', lineHeight: 1.5 }}>{t.posSealNote(sealedSummary)}</p>
                </>
              )}
              {posError && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{posError}</p>}
              <button
                onClick={handleCheckout}
                disabled={cartLines.length === 0 || posSelling || !!confirmingMsg}
                style={{
                  background: 'var(--bronze-deep)', color: 'var(--on-bronze)', width: '100%', fontSize: isMobile ? 14 : undefined,
                  opacity: (cartLines.length === 0 || posSelling || !!confirmingMsg) ? 0.4 : 1,
                }}
              >
                {posSelling ? t.posSealing : t.posCheckout}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Herramientas de tienda: analítica y campañas (secundario) */}
      <div style={{ ...card, padding: storeToolsOpen ? (isMobile ? 14 : 26) : '14px 18px' }}>
        <button
          onClick={() => setStoreToolsOpen(o => !o)}
          style={{
            width: '100%', background: 'transparent', border: 'none', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
            marginBottom: storeToolsOpen ? (isMobile ? 14 : 20) : 0,
          }}
        >
          {/* SVG en vez del carácter Unicode ⚙: cada plataforma lo renderiza
              con su propia fuente de emoji/símbolos (3D y a color en iOS,
              plano en Android, y con ︎ forzando texto plano el glifo de
              iOS quedaba encima minúsculo). Un SVG se ve igual en todas. */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--ink-dim)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
            </svg>
            {t.storeTools}
          </span>
          <span style={{ fontSize: 16, color: 'var(--accent-blue)', transition: 'transform 0.2s', display: 'inline-block', transform: storeToolsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>

        {storeToolsOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Market intelligence */}
            <div style={tool} data-tour="insights-section">
              <h3 style={toolTitle}>{t.insightsTitle}</h3>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder={t.insightsPlaceholder}
                  value={storeProfile}
                  onChange={e => setStoreProfile(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button onClick={handleInsights} disabled={loadingInsights}
                  style={{ background: 'var(--bronze-deep)', color: 'var(--on-bronze)', whiteSpace: 'nowrap', fontSize: isMobile ? 14 : undefined }}>
                  {loadingInsights ? t.insightsGenerating : t.insightsGenerate}
                </button>
              </div>
              {insightsError ? (
                <p style={{ color: 'var(--danger)', fontSize: 14 }}>Error: {insightsError}</p>
              ) : insights ? (
                <>
                  <p style={{ color: '#E0E0E0', lineHeight: 1.6, marginBottom: 16, fontSize: isMobile ? 14 : undefined }}>{insights.summary}</p>
                  {(insights.trending ?? []).length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>{t.insightsTrending}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {insights.trending.map((item, i) => (
                          <span key={i} style={{ background: 'var(--ground)', border: '1px solid var(--bronze-deep)', borderRadius: 20, padding: '4px 12px', fontSize: 13 }}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>{t.insightsRecommendations}</div>
                    <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(insights.recommendations ?? []).map((r, i) => (
                        <li key={i} style={{ color: 'var(--ink-pale)', fontSize: isMobile ? 13 : 14, lineHeight: 1.5 }}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--ink-dim)', fontSize: isMobile ? 13 : 14 }}>{t.insightsEmpty}</p>
              )}
            </div>

            {/* Crear campaña: desactivado por ahora, ver campaignSoon. Solo el
                formulario se atenúa (opacity en el <form>, no en el
                contenedor): así la insignia "Soon" se ve nítida en vez de
                lavada al 50% junto con el resto. */}
            <div style={tool} data-tour="campaign-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <h3 style={{ ...toolTitle, margin: 0 }}>{t.campaignTitle}</h3>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                  color: 'var(--bronze-deep)', background: 'var(--bronze-wash)', border: '1px solid var(--bronze-deep)', borderRadius: 999, padding: '2px 8px',
                }}>
                  {t.campaignSoon}
                </span>
              </div>
              <form onSubmit={handleCreateCampaign} style={{ opacity: 0.5 }}>
              <fieldset disabled style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'not-allowed' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: isMobile ? 13 : undefined }}>{t.campaignTargetLabel}</label>
                    <select value={form.targetCategory} onChange={e => setForm(f => ({ ...f, targetCategory: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{catLabel[c]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: isMobile ? 13 : undefined }}>{t.campaignMinLabel}</label>
                    <input type="number" min={1} value={form.minSignals} onChange={e => setForm(f => ({ ...f, minSignals: Number(e.target.value) }))} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: isMobile ? 13 : undefined }}>{t.campaignMessageLabel}</label>
                  <input type="text" placeholder={t.campaignMessagePlaceholder} value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <button type="submit" disabled={creating} style={{ background: 'var(--bronze-deep)', color: 'var(--on-bronze)', width: isMobile ? '100%' : undefined, alignSelf: isMobile ? undefined : 'flex-start', fontSize: isMobile ? 14 : undefined }}>
                  {creating ? t.campaignSubmitting : t.campaignSubmit}
                </button>
              </fieldset>
              </form>
            </div>

            {/* Campañas registradas */}
            {campaigns.length > 0 && (
              <div style={tool}>
                <h3 style={toolTitle}>{t.campaignListTitle}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {campaigns.map(c => {
                    const match = matches[c.id];
                    return (
                      <div key={c.id} style={{ background: 'var(--ground)', border: '1px solid var(--gray-900)', borderRadius: 8, padding: isMobile ? 12 : 16, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: isMobile ? 10 : 16 }}>
                        <div>
                          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, marginBottom: 4 }}>{c.message}</div>
                          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                            {catLabel[c.targetCategory as Category]} · {t.campaignMinSuffix(c.minSignals)} · {t.campaignId(c.id)}
                          </div>
                          {match && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>{match.reason}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-end', gap: 8, flexShrink: 0 }}>
                          {match && (
                            <span style={{
                              background: match.matches ? '#064e3b' : 'var(--gray-900)',
                              color: match.matches ? '#34d399' : 'var(--gray-600)',
                              borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600,
                            }}>
                              {match.matches ? t.campaignActive : t.campaignNoMatch}
                            </span>
                          )}
                          <button onClick={() => handleRefreshMatch(c.id)} disabled={refreshing === c.id}
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--gray-850)', color: 'var(--ink-soft)', fontSize: 12, padding: '5px 12px' }}>
                            {refreshing === c.id ? '...' : t.campaignRefresh}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Midnight branding */}
      <div style={{ marginTop: isMobile ? 24 : 80, padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 25, width: '100%' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Built on</span>
        <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" className="midnight-logo" style={{ height: 28, opacity: 0.85 }} />
      </div>
    </>
  );
}
