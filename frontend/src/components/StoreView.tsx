import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import QRCode from 'qrcode';
import {
  getState, getInsights, postCampaign, getMatch,
  CATEGORIES, CATEGORY_LABELS,
  SUBCATEGORIES, SUBCATEGORY_LABELS,
  type AegisState, type Insights, type Campaign, type MatchResult, type Category, type Lang,
} from '../api.ts';
import { attestReceiptViaLace, type ConnectedAPI, type ReceiptJSON } from '../lace.ts';
import {
  PRODUCTS, SUBCAT_TO_CATEGORY, cartLinesFrom, cartTotalCents, rollupBySubcategory, sealedLines, formatEUR,
} from '../catalog.ts';
import ProductImage from './ProductImage.tsx';
import ReceiptTicket from './ReceiptTicket.tsx';
import { T } from '../i18n.ts';
import { useBreakpoint } from '../hooks/useBreakpoint.ts';

type Props = {
  lang: Lang;
  lace: ConnectedAPI | null;
  contractAddress: string | null;
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  matches: Record<string, MatchResult>;
  setMatches: Dispatch<SetStateAction<Record<string, MatchResult>>>;
};

const CAT_KEY: Record<Category, keyof AegisState> = {
  electronics: 'signalsElectronics', fashion: 'signalsFashion', food: 'signalsFood',
  sports: 'signalsSports', home: 'signalsHome', other: 'signalsOther',
};

function subcatKey(sub: string): keyof AegisState {
  return ('signals' + sub[0].toUpperCase() + sub.slice(1)) as keyof AegisState;
}

export default function StoreView({ lang, lace, contractAddress, campaigns, setCampaigns, matches, setMatches }: Props) {
  const t = T[lang];
  const catLabel = CATEGORY_LABELS[lang];
  const subLabel = SUBCATEGORY_LABELS[lang];
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const card: React.CSSProperties = {
    background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 12,
    padding: isMobile ? 14 : 28, marginBottom: 16,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: isMobile ? 17 : 21, fontWeight: 700, color: '#FFFFFF',
    letterSpacing: 0.3, marginBottom: 0,
  };

  const stepBtn: React.CSSProperties = {
    background: '#1A1A1A', border: '1px solid #333333', color: '#DDDDDD',
    fontSize: 16, lineHeight: 1, width: 28, height: 28, borderRadius: 6, cursor: 'pointer', padding: 0,
  };

  const [state, setState] = useState<AegisState | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [expandedCat, setExpandedCat] = useState<Category | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [storeProfile, setStoreProfile] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [form, setForm] = useState({ targetCategory: 'electronics', minSignals: 2, message: '' });
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [campaignOpen, setCampaignOpen] = useState(false);

  const [posOpen, setPosOpen] = useState(false);
  const [browseCat, setBrowseCat] = useState<Category>('electronics');
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
    if (!lace || cartLines.length === 0 || sealed.length === 0) return;
    setPosSelling(true);
    setPosError(null);
    try {
      // Se sellan las 8 subcategorías de mayor importe (rollup). El desglose
      // por producto viaja en el QR solo para pintar el ticket original.
      const receipt = await attestReceiptViaLace(
        lace,
        sealed.map(r => ({ subcategory: r.subcategory, qty: r.qty, amount: r.amountCents })),
      );
      const receiptForQr: ReceiptJSON = {
        ...receipt,
        items: cartLines.slice(0, 24).map(l => ({ name: l.product.name[lang], qty: l.qty, unitCents: l.product.priceCents })),
      };
      setPosReceipt(receiptForQr);
      setPosQr(await QRCode.toDataURL(JSON.stringify(receiptForQr), { margin: 1, width: 260 }));
    } catch (e: any) {
      setPosError(e?.message ?? t.posSealError);
    } finally {
      setPosSelling(false);
    }
  }

  function handleResetPos() {
    setPosReceipt(null);
    setPosQr(null);
    setPosError(null);
    setCart({});
  }

  async function handleManualRefresh() {
    setManualRefreshing(true);
    try { setState(await getState()); }
    finally { setManualRefreshing(false); }
  }

  async function handleRefreshMatch(id: string) {
    setRefreshing(id);
    try {
      const match = await getMatch(id);
      setMatches(prev => ({ ...prev, [id]: match }));
    } finally {
      setRefreshing(null);
    }
  }

  useEffect(() => {
    getState().then(setState);
    const interval = setInterval(async () => {
      const newState = await getState();
      setState(newState);
      setMatches(prev => {
        const updated = { ...prev };
        for (const c of campaigns) {
          const signals = Number(newState[CAT_KEY[c.targetCategory as Category] ?? 'signalsOther'] ?? 0);
          if (updated[c.id]) updated[c.id] = { ...updated[c.id], matches: signals >= c.minSignals };
        }
        return updated;
      });
    }, 10_000);
    return () => clearInterval(interval);
  }, [campaigns]);

  const total = Number(state?.totalSignals ?? 0);

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
      {/* Logo Aegis */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 16 : 36 }}>
        <img src="/images/aegis_hor_letras.svg" alt="Aegis" style={{ height: isMobile ? 90 : 180, objectFit: 'contain' }} />
      </div>

      {/* Señales agregadas */}
      <div style={card} data-tour="aggregated-signals">
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 4 : 0, marginBottom: isMobile ? 12 : 20 }}>
          <h2 style={sectionTitle}>{t.signalsTitle}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: isMobile ? 0 : 12 }}>
            <span style={{ fontSize: 12, color: '#888888', fontWeight: 400 }}>
              {t.signalsTotal(total)} · {t.signalsRefresh}
            </span>
            <button onClick={handleManualRefresh} disabled={manualRefreshing} style={{
              background: 'transparent', border: '1px solid #333', borderRadius: 6,
              color: '#666', fontSize: 11, padding: '2px 10px', cursor: 'pointer',
            }}>
              {manualRefreshing ? '...' : '↻'}
            </button>
          </div>
        </div>
        <div data-tour="categories-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : bp === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 10 }}>
          {CATEGORIES.map(cat => {
            const catVal = Number(state?.[CAT_KEY[cat]] ?? 0);
            const catPct = total > 0 ? (catVal / total) * 100 : 0;
            const isOpen = expandedCat === cat;
            const subs = SUBCATEGORIES[cat] as readonly string[];
            return (
              <div key={cat} style={{ gridColumn: isOpen ? '1 / -1' : undefined }}>
                <button
                  onClick={() => setExpandedCat(isOpen ? null : cat)}
                  style={{
                    width: '100%', background: isOpen ? '#926a4513' : '#111111',
                    border: `1px solid ${isOpen ? '#926A45' : '#222222'}`,
                    borderRadius: isOpen ? '10px 10px 0 0' : 10,
                    padding: isMobile ? '10px 12px' : '14px 16px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: isOpen ? '#FFFFFF' : '#DDDDDD', flex: 1, textAlign: 'left' }}>
                      {catLabel[cat]}
                    </span>
                    <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: '#c0956de5' }}>{catVal}</span>
                    <span style={{ fontSize: 11, color: '#CCCCCC', width: 32, textAlign: 'right' }}>{catPct.toFixed(0)}%</span>
                    <span style={{ fontSize: 12, color: '#456D92', marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                  <div style={{ background: '#1A1A1A', height: 3, borderRadius: isOpen ? 0 : '0 0 4px 4px' }}>
                    <div style={{ width: `${catPct}%`, height: '100%', background: '#926A45', borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                </button>
                {isOpen && (
                  <div style={{
                    background: '#0D0D0D', border: '1px solid #926A45', borderTop: 'none',
                    borderRadius: '0 0 10px 10px', padding: isMobile ? 10 : 16,
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : `repeat(${Math.min(subs.length, 6)}, 1fr)`,
                    gap: isMobile ? 6 : 8,
                  }}>
                    {subs.map(sub => {
                      const subVal = Number(state?.[subcatKey(sub)] ?? 0);
                      const subPct = catVal > 0 ? (subVal / catVal) * 100 : 0;
                      return (
                        <div key={sub} style={{ background: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: isMobile ? '8px 4px' : '10px 8px', textAlign: 'center' }}>
                          <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: '#FFFFFF' }}>{subVal}</div>
                          <div style={{ fontSize: isMobile ? 10 : 11, color: '#AAAAAA', marginTop: 2 }}>{subLabel[sub]}</div>
                          <div style={{ marginTop: 4, background: '#1A1A1A', borderRadius: 3, height: 3 }}>
                            <div style={{ width: `${subPct}%`, height: '100%', background: '#926A45', borderRadius: 3, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ fontSize: 10, color: '#AAAAAA', marginTop: 2 }}>{subPct.toFixed(0)}%</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div style={card} data-tour="insights-section">
        <h2 style={{ ...sectionTitle, marginBottom: 14 }}>{t.insightsTitle}</h2>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, marginBottom: 16 }}>
          <input
            type="text"
            placeholder={t.insightsPlaceholder}
            value={storeProfile}
            onChange={e => setStoreProfile(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={handleInsights} disabled={loadingInsights}
            style={{ background: '#926A45', color: '#FFFFFF', whiteSpace: 'nowrap', fontSize: isMobile ? 14 : undefined }}>
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
                <div style={{ fontSize: 12, color: '#AAAAAA', marginBottom: 8 }}>{t.insightsTrending}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {insights.trending.map((item, i) => (
                    <span key={i} style={{ background: '#111111', border: '1px solid #926A45', borderRadius: 20, padding: '4px 12px', fontSize: 13 }}>{item}</span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, color: '#AAAAAA', marginBottom: 8 }}>{t.insightsRecommendations}</div>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(insights.recommendations ?? []).map((r, i) => (
                  <li key={i} style={{ color: '#CCCCCC', fontSize: isMobile ? 13 : 14, lineHeight: 1.5 }}>{r}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p style={{ color: '#666666', fontSize: isMobile ? 13 : 14 }}>{t.insightsEmpty}</p>
        )}
      </div>

      {/* Punto de venta (demo): la cesta de productos genera el recibo sellado y su QR */}
      <div style={card}>
        <button
          onClick={() => setPosOpen(o => !o)}
          style={{
            width: '100%', background: 'transparent', border: 'none', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
            marginBottom: posOpen ? (isMobile ? 14 : 20) : 0,
          }}
        >
          <h2 style={sectionTitle}>{t.posTitle}</h2>
          <span style={{ fontSize: 18, color: '#456D92', transition: 'transform 0.2s', display: 'inline-block', transform: posOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>

        {posOpen && (!contractAddress ? (
          <p style={{ color: '#888888', fontSize: 13 }}>{t.posDeployFirst}</p>
        ) : !lace ? (
          <p style={{ color: '#888888', fontSize: 13 }}>{t.posConnectFirst}</p>
        ) : posQr && posReceipt ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <p style={{ color: '#AAAAAA', fontSize: 13, textAlign: 'center' }}>{t.posScanHint}</p>
            <ReceiptTicket
              lang={lang}
              lines={cartLines.map(l => ({ name: l.product.name[lang], qty: l.qty, unitCents: l.product.priceCents }))}
              totalCents={totalCents}
              sealedLines={sealedTicketLines}
              overflowCount={overflowCount}
              receipt={posReceipt}
              qr={posQr}
            />
            <button onClick={handleResetPos} style={{ background: '#111111', border: '1px solid #222222', color: '#AAAAAA', fontSize: 13, padding: '8px 16px' }}>
              {t.posNewSale}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ color: '#888888', fontSize: 13 }}>{t.posCatalogHint}</p>

            {/* Filtro de categoría */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setBrowseCat(cat)} style={{
                  background: browseCat === cat ? '#926a4510' : '#111111',
                  border: `2px solid ${browseCat === cat ? '#926A45' : '#222222'}`,
                  borderRadius: 10, padding: isMobile ? '8px 4px' : '10px 6px',
                  color: browseCat === cat ? '#FFFFFF' : '#888888',
                  fontSize: 12, cursor: 'pointer',
                }}>
                  {catLabel[cat]}
                </button>
              ))}
            </div>

            {/* Catálogo */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 10 }}>
              {PRODUCTS.filter(prod => SUBCAT_TO_CATEGORY[prod.subcategory] === browseCat).map(prod => {
                const qty = cart[prod.id] ?? 0;
                return (
                  <div key={prod.id} style={{
                    background: '#111111', border: `1px solid ${qty > 0 ? '#926A45' : '#1F1F1F'}`,
                    borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
                  }}>
                    <ProductImage product={prod} size={isMobile ? 84 : 104} />
                    <div style={{ fontSize: 12, color: '#DDDDDD', textAlign: 'center', lineHeight: 1.3, minHeight: 32 }}>{prod.name[lang]}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#c0956de5' }}>{formatEUR(prod.priceCents, lang)}</div>
                    {qty === 0 ? (
                      <button onClick={() => addToCart(prod.id)} style={{ background: '#926A45', color: '#FFFFFF', fontSize: 12, padding: '6px 14px', width: '100%' }}>
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

            {/* Cesta */}
            <div style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 10, padding: isMobile ? 12 : 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{t.posBasket} ({cartCount})</div>
              {cartLines.length === 0 ? (
                <p style={{ color: '#666666', fontSize: 13 }}>{t.posEmpty}</p>
              ) : (
                <>
                  {cartLines.map(l => (
                    <div key={l.product.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#CCCCCC' }}>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.qty}× {l.product.name[lang]}
                      </span>
                      <span style={{ color: '#DDDDDD' }}>{formatEUR(l.product.priceCents * l.qty, lang)}</span>
                      <button onClick={() => setQty(l.product.id, 0)} style={{ background: 'transparent', border: 'none', color: '#666666', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>✕</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #222222', paddingTop: 8, fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                    <span>{t.posTotal}</span><span>{formatEUR(totalCents, lang)}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: '#888888', lineHeight: 1.5 }}>{t.posSealNote(sealedSummary)}</p>
                </>
              )}
              {posError && <p style={{ color: '#f87171', fontSize: 13 }}>{posError}</p>}
              <button
                onClick={handleCheckout}
                disabled={cartLines.length === 0 || posSelling}
                style={{
                  background: '#926A45', color: '#fff', width: '100%', fontSize: isMobile ? 14 : undefined,
                  opacity: (cartLines.length === 0 || posSelling) ? 0.4 : 1,
                }}
              >
                {posSelling ? t.posSealing : t.posCheckout}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Crear campaña, desplegable */}
      <div style={card} data-tour="campaign-section">
        <button
          onClick={() => setCampaignOpen(o => !o)}
          style={{
            width: '100%', background: 'transparent', border: 'none', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
            marginBottom: campaignOpen ? (isMobile ? 14 : 20) : 0,
          }}
        >
          <h2 style={sectionTitle}>{t.campaignTitle}</h2>
          <span style={{ fontSize: 18, color: '#456D92', transition: 'transform 0.2s', display: 'inline-block', transform: campaignOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>

        {campaignOpen && (
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
            <button type="submit" disabled={creating} style={{ background: '#926A45', color: '#fff', width: isMobile ? '100%' : undefined, alignSelf: isMobile ? undefined : 'flex-start', fontSize: isMobile ? 14 : undefined }}>
              {creating ? t.campaignSubmitting : t.campaignSubmit}
            </button>
          </form>
        )}
      </div>

      {/* Campañas activas */}
      {campaigns.length > 0 && (
        <div style={card}>
          <h2 style={{ ...sectionTitle, marginBottom: isMobile ? 12 : 16 }}>{t.campaignListTitle}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {campaigns.map(c => {
              const match = matches[c.id];
              return (
                <div key={c.id} style={{ background: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: isMobile ? 12 : 16, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: isMobile ? 10 : 16 }}>
                  <div>
                    <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, marginBottom: 4 }}>{c.message}</div>
                    <div style={{ fontSize: 12, color: '#AAAAAA' }}>
                      {catLabel[c.targetCategory as Category]} · {t.campaignMinSuffix(c.minSignals)} · {t.campaignId(c.id)}
                    </div>
                    {match && <div style={{ fontSize: 12, color: '#AAAAAA', marginTop: 8 }}>{match.reason}</div>}
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
                      style={{ background: '#111111', border: '1px solid #222222', color: '#AAAAAA', fontSize: 12, padding: '5px 12px' }}>
                      {refreshing === c.id ? '...' : t.campaignRefresh}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Midnight branding */}
      <div style={{ marginTop: isMobile ? 24 : 80, padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 25, width: '100%' }}>
        <span style={{ fontSize: 11, color: '#8f8f8f', letterSpacing: 1.5, textTransform: 'uppercase' }}>Built on</span>
        <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" style={{ height: 28, opacity: 0.85 }} />
      </div>
    </>
  );
}
