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
    fontFamily: 'var(--font-display)', fontSize: isMobile ? 15 : 16, fontWeight: 600, color: '#FFFFFF', margin: '0 0 12px',
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
  const sealedTicketLines = sealed.map(r => ({
    label: `${catLabel[SUBCAT_TO_CATEGORY[r.subcategory]]} › ${subLabel[r.subcategory]}`,
    qty: r.qty,
    amountCents: r.amountCents,
  }));
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
              sealedLines={sealedTicketLines}
              overflowCount={overflowCount}
              receipt={posReceipt}
              qr={posQr}
            />
            <div className="aegis-hint" style={{ '--hint-accent': '#64d1a9', '--hint-glow': 'rgba(100, 209, 169, 0.45)' } as React.CSSProperties}>
              {t.posGoToUserCallout}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onGoToUser} style={{ background: 'var(--bronze-deep)', color: '#FFFFFF', fontSize: 13, padding: '8px 16px', fontWeight: 600 }}>
                {t.posGoToUser}
              </button>
              <button onClick={handleResetPos} style={{ background: 'var(--surface-2)', border: '1px solid #222222', color: 'var(--ink-soft)', fontSize: 13, padding: '8px 16px' }}>
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
                    color: browseCat === cat ? '#FFFFFF' : 'var(--ink-dim)',
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
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#c0956de5' }}>{formatEUR(prod.priceCents, lang)}</div>
                      {qty === 0 ? (
                        <button onClick={() => addToCart(prod.id)} style={{ background: 'var(--bronze-deep)', color: '#FFFFFF', fontSize: 12, padding: '6px 14px', width: '100%' }}>
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
              background: 'var(--ground)', border: '1px solid #2A2A2A', borderRadius: 10, padding: isMobile ? 12 : 16,
              display: 'flex', flexDirection: 'column', gap: 10,
              position: twoCol ? 'sticky' : undefined, top: twoCol ? 84 : undefined,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{t.posBasket} ({cartCount})</div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #222222', paddingTop: 8, fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                    <span>{t.posTotal}</span><span>{formatEUR(totalCents, lang)}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--ink-dim)', lineHeight: 1.5 }}>{t.posSealNote(sealedSummary)}</p>
                </>
              )}
              {posError && <p style={{ color: '#f87171', fontSize: 13 }}>{posError}</p>}
              <button
                onClick={handleCheckout}
                disabled={cartLines.length === 0 || posSelling || !!confirmingMsg}
                style={{
                  background: 'var(--bronze-deep)', color: '#fff', width: '100%', fontSize: isMobile ? 14 : undefined,
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
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--ink-dim)' }}>⚙ {t.storeTools}</span>
          <span style={{ fontSize: 16, color: '#456D92', transition: 'transform 0.2s', display: 'inline-block', transform: storeToolsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
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
                  style={{ background: 'var(--bronze-deep)', color: '#FFFFFF', whiteSpace: 'nowrap', fontSize: isMobile ? 14 : undefined }}>
                  {loadingInsights ? t.insightsGenerating : t.insightsGenerate}
                </button>
              </div>
              {insightsError ? (
                <p style={{ color: '#f87171', fontSize: 14 }}>Error: {insightsError}</p>
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

            {/* Crear campaña */}
            <div style={tool} data-tour="campaign-section">
              <h3 style={toolTitle}>{t.campaignTitle}</h3>
              <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
                </div>
                <button type="submit" disabled={creating} style={{ background: 'var(--bronze-deep)', color: '#fff', width: isMobile ? '100%' : undefined, alignSelf: isMobile ? undefined : 'flex-start', fontSize: isMobile ? 14 : undefined }}>
                  {creating ? t.campaignSubmitting : t.campaignSubmit}
                </button>
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
                      <div key={c.id} style={{ background: 'var(--ground)', border: '1px solid #1A1A1A', borderRadius: 8, padding: isMobile ? 12 : 16, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: isMobile ? 10 : 16 }}>
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
                              background: match.matches ? '#064e3b' : '#1A1A1A',
                              color: match.matches ? '#34d399' : '#555555',
                              borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600,
                            }}>
                              {match.matches ? t.campaignActive : t.campaignNoMatch}
                            </span>
                          )}
                          <button onClick={() => handleRefreshMatch(c.id)} disabled={refreshing === c.id}
                            style={{ background: 'var(--surface-2)', border: '1px solid #222222', color: 'var(--ink-soft)', fontSize: 12, padding: '5px 12px' }}>
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
        <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" style={{ height: 28, opacity: 0.85 }} />
      </div>
    </>
  );
}
