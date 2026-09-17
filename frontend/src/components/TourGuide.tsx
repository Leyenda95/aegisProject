import { useEffect, useRef, useState, useCallback } from 'react';
import type { Lang } from '../api.ts';

interface Step {
  target: string;
  clickTarget?: string;
  hint?: Record<Lang, string>;
  title: Record<Lang, string>;
  desc: Record<Lang, string>;
  note?: Record<Lang, string>;
  tab: 'store' | 'user';
  side: 'top' | 'bottom' | 'right';
  noScroll?: boolean;
}

const STEPS: Step[] = [
  {
    target: 'aggregated-signals',
    title: { en: 'Aggregated Signals', es: 'Señales Agregadas' },
    desc: {
      en: 'Every purchase signal is ZK-proven before being added to the aggregate. No individual data is ever visible, only the total count per category.',
      es: 'Cada señal de compra se verifica con ZK antes de sumarse al agregado. Ningún dato individual es visible, solo el total por categoría.',
    },
    tab: 'store', side: 'bottom',
  },
  {
    target: 'categories-grid',
    title: { en: 'Market Categories', es: 'Categorías de Mercado' },
    desc: {
      en: 'Signals are broken down by category and subcategory. Click any category to explore the distribution, all derived from anonymous aggregated data.',
      es: 'Las señales se desglosan por categoría y subcategoría. Haz clic para explorar el desglose, todo a partir de datos anónimos.',
    },
    tab: 'store', side: 'bottom',
  },
  {
    target: 'insights-section',
    title: { en: 'Market Intelligence', es: 'Inteligencia de Mercado' },
    desc: {
      en: 'An AI agent analyses the aggregated signals and surfaces strategic insights for your store, without ever accessing individual user data.',
      es: 'Un agente IA analiza las señales agregadas y genera inteligencia estratégica para tu tienda, sin acceder nunca a datos de usuarios individuales.',
    },
    tab: 'store', side: 'top',
  },
  {
    target: 'campaign-section',
    title: { en: 'Create a Campaign', es: 'Crear una Campaña' },
    desc: {
      en: 'Target a category and set a minimum signal threshold. You discover that demand exists, not who the buyers are.',
      es: 'Apunta a una categoría y define un umbral mínimo de señales. Descubres que hay demanda, sin saber quiénes son los compradores.',
    },
    tab: 'store', side: 'top',
  },
  {
    target: 'tab-user',
    clickTarget: 'tab-user',
    hint: { en: '↑ Click the tab to continue', es: '↑ Clic en la pestaña para continuar' },
    title: { en: 'Now: The User Side', es: 'Ahora: El Lado del Usuario' },
    desc: {
      en: "The store sees aggregated signals. Now see the experience from the user's perspective. Click the User tab above to continue.",
      es: 'La tienda ve señales agregadas. Ahora ve la experiencia desde el punto de vista del usuario. Haz clic en la pestaña Usuario para continuar.',
    },
    tab: 'store', side: 'bottom', noScroll: true,
  },
  {
    target: 'profile-section',
    title: { en: 'Your Receipts, One Place', es: 'Tus Recibos, en un Solo Lugar' },
    desc: {
      en: 'Every purchase from every store, all on your own device. No central server holds your data. You own it, and you decide what stays private.',
      es: 'Cada compra de cada tienda, todo en tu dispositivo. Ningún servidor central guarda tus datos. Tú los posees y decides qué queda privado.',
    },
    tab: 'user', side: 'right',
  },
  {
    target: 'contribute-tab',
    clickTarget: 'contribute-tab',
    hint: { en: '↑ Click Contribute to continue', es: '↑ Haz clic en Contribuir para continuar' },
    title: { en: 'Ready to Contribute?', es: '¿Listo para Contribuir?' },
    desc: {
      en: 'Now switch to the Contribute tab to see how users privately submit their signals.',
      es: 'Ahora cambia a la pestaña Contribuir para ver cómo los usuarios envían sus señales de forma privada.',
    },
    tab: 'user', side: 'bottom', noScroll: true,
  },
  {
    target: 'contribute-section',
    title: { en: 'Contribute Anonymously', es: 'Contribuir de Forma Anónima' },
    desc: {
      en: 'In this demo you share category and subcategory, but the same system works with age, spending patterns, personal interests, or any signal you choose. Everything verified on Midnight without revealing your identity.',
      es: 'En esta demo compartes categoría y subcategoría, pero el mismo sistema funciona con la edad, patrones de gasto, intereses personales o cualquier señal que elijas. Todo verificado en Midnight sin revelar tu identidad.',
    },
    tab: 'user', side: 'top', noScroll: true,
    note: {
      en: 'Connect your Lace wallet using the button in the top right to submit a real transaction and participate in the testnet.',
      es: 'Conecta tu billetera Lace con el botón de arriba a la derecha para enviar una transacción real y participar en el testnet.',
    },
  },
];

interface Rect { top: number; left: number; width: number; height: number; }
interface Props {
  lang: Lang;
  onClose: () => void;
  onSetTab: (tab: 'store' | 'user') => void;
}

const PAD = 10;
const OFFSET = 14;
const FADE = 200; // ms for opacity transition

export default function TourGuide({ lang, onClose, onSetTab }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);
  const clickElRef = useRef<Element | null>(null);

  const isLast = step === STEPS.length - 1;
  const isMobile = window.innerWidth < 680;
  const tw = isMobile ? window.innerWidth - 32 : 360;

  const measure = useCallback(() => {
    const el = document.querySelector(`[data-tour="${STEPS[step].target}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  const advanceStep = useCallback(() => setStep(s => s + 1), []);

  useEffect(() => {
    const current = STEPS[step];
    const isManual = !!current.clickTarget;

    // Fade out, reposition, fade in
    setVisible(false);
    onSetTab(current.tab);

    // Auto-clicks and listeners
    const t1 = setTimeout(() => {
      if (current.target === 'profile-section') {
        (document.querySelector('[data-tour="profile-tab"]') as HTMLButtonElement | null)?.click();
      }
      if (isManual && current.clickTarget) {
        const btn = document.querySelector(`[data-tour="${current.clickTarget}"]`);
        if (btn) {
          clickElRef.current = btn;
          btn.addEventListener('click', advanceStep);
        }
      }
    }, 60);

    // Scroll while invisible (skip for steps where the user is already in place)
    const t2 = setTimeout(() => {
      if (!current.noScroll) {
        document.querySelector(`[data-tour="${current.target}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);

    // Measure + fade in after scroll settles
    const t3 = setTimeout(() => {
      measure();
      setVisible(true);
    }, 380);

    // Re-measure in case scroll was still moving
    const t4 = setTimeout(measure, 700);

    window.addEventListener('resize', measure);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', measure);
      if (clickElRef.current) {
        clickElRef.current.removeEventListener('click', advanceStep);
        clickElRef.current = null;
      }
    };
  }, [step, measure, advanceStep, onSetTab]);

  function goNext() { isLast ? onClose() : setStep(s => s + 1); }
  function goPrev() { if (step > 0) setStep(s => s - 1); }

  const current = STEPS[step];
  const isManual = !!current.clickTarget;

  const sy = rect ? rect.top - PAD : 0;
  const sx = rect ? rect.left - PAD : 0;
  const sw = rect ? rect.width + PAD * 2 : 0;
  const sh = rect ? rect.height + PAD * 2 : 0;

  // Tooltip position
  let tooltipStyle: React.CSSProperties = {};
  if (rect) {
    if (current.side === 'right' && !isMobile) {
      const sideTW = 300;
      const spaceRight = window.innerWidth - (rect.left + rect.width + PAD + OFFSET) - 16;
      const spaceLeft = rect.left - PAD - OFFSET - 16;
      if (spaceRight >= sideTW) {
        tooltipStyle = {
          top: Math.max(60, Math.min(rect.top, window.innerHeight - 320)),
          left: rect.left + rect.width + PAD + OFFSET,
          width: sideTW,
        };
      } else if (spaceLeft >= sideTW) {
        tooltipStyle = {
          top: Math.max(60, Math.min(rect.top, window.innerHeight - 320)),
          left: rect.left - PAD - OFFSET - sideTW,
          width: sideTW,
        };
      } else {
        const ty = Math.max(16, Math.min(rect.top + rect.height + PAD + OFFSET, window.innerHeight - 260));
        const tx = Math.max(16, Math.min(rect.left + rect.width / 2 - tw / 2, window.innerWidth - tw - 16));
        tooltipStyle = { top: ty, left: tx, width: tw };
      }
    } else {
      const tx = Math.max(16, Math.min(rect.left + rect.width / 2 - tw / 2, window.innerWidth - tw - 16));
      let ty: number;
      if (current.side === 'bottom' || current.side === 'right') {
        ty = rect.top + rect.height + PAD + OFFSET;
      } else {
        const above = rect.top - PAD - OFFSET - 220;
        ty = above >= 16 ? above : rect.top + rect.height + PAD + OFFSET;
      }
      ty = Math.max(16, Math.min(ty, window.innerHeight - 260));
      tooltipStyle = { top: ty, left: tx, width: tw };
    }
  } else {
    tooltipStyle = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: tw };
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: `opacity ${FADE}ms ease, transform ${FADE}ms ease`,
    }}>
      {/* Overlay strips, no position transitions, only opacity via parent */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, sy), background: 'rgba(0,0,0,0.75)' }} />
      <div style={{ position: 'fixed', top: sy + sh, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)' }} />
      <div style={{ position: 'fixed', top: sy, left: 0, width: Math.max(0, sx), height: sh, background: 'rgba(0,0,0,0.75)' }} />
      <div style={{ position: 'fixed', top: sy, left: sx + sw, right: 0, height: sh, background: 'rgba(0,0,0,0.75)' }} />
      <div style={{
        position: 'fixed', top: sy, left: sx, width: sw, height: sh,
        border: `${sw > 0 ? 2 : 0}px solid var(--bronze-deep)`, borderRadius: 14,
        boxShadow: sw > 0 ? '0 0 0 4px rgba(146,106,69,0.18)' : 'none',
      }} />

      {/* Tooltip */}
      <div style={{
        position: 'fixed', ...tooltipStyle,
        background: '#141414', border: '1px solid var(--bronze-deep)', borderRadius: 14,
        padding: isMobile ? '16px 18px' : '20px 22px',
        pointerEvents: visible ? 'auto' : 'none',
        boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: i <= step ? 'var(--bronze-deep)' : '#2A2A2A',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: '#FFF' }}>
            {current.title[lang]}
          </span>
          <span style={{ fontSize: 11, color: '#555', marginLeft: 10 }}>{step + 1} / {STEPS.length}</span>
        </div>

        <div style={{ fontSize: isMobile ? 13 : 14, color: 'var(--ink-pale)', lineHeight: 1.65, marginBottom: current.note ? 12 : 18 }}>
          {current.desc[lang]}
        </div>

        {current.note && (
          <div style={{
            background: '#1a1200', border: '1px solid var(--bronze-deep)', borderRadius: 8,
            padding: '10px 12px', marginBottom: 18,
            fontSize: isMobile ? 12 : 13, color: '#D4A96A', lineHeight: 1.6,
          }}>
            {current.note[lang]}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#555',
            fontSize: 13, cursor: 'pointer', padding: 0,
          }}>
            {lang === 'es' ? 'Saltar' : 'Skip'}
          </button>

          {isManual ? (
            <span style={{ fontSize: 13, color: 'var(--bronze-deep)', fontWeight: 600 }}>
              {current.hint?.[lang] ?? (lang === 'es' ? 'Haz clic para continuar' : 'Click to continue')}
            </span>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 0 && (
                <button onClick={goPrev} style={{
                  background: '#1A1A1A', border: '1px solid #333', color: '#AAA',
                  fontSize: 13, padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                }}>←</button>
              )}
              <button onClick={goNext} style={{
                background: 'var(--bronze-deep)', border: 'none', color: '#FFF',
                fontSize: 13, fontWeight: 600, padding: '7px 18px', borderRadius: 8, cursor: 'pointer',
              }}>
                {isLast
                  ? (lang === 'es' ? 'Finalizar' : 'Finish')
                  : (lang === 'es' ? 'Siguiente' : 'Next')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
