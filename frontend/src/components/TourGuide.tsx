import { useEffect, useState, useCallback } from 'react';
import type { Lang } from '../api.ts';

interface Step {
  target: string;
  title: Record<Lang, string>;
  desc: Record<Lang, string>;
  side: 'top' | 'bottom';
}

const STEPS: Step[] = [
  {
    target: 'aggregated-signals',
    title: { en: 'Aggregated Signals', es: 'Señales Agregadas' },
    desc: {
      en: 'Every purchase signal is ZK-proven before being added to the aggregate. No individual data is ever visible — only the total count per category.',
      es: 'Cada señal de compra se verifica con ZK antes de sumarse al agregado. Ningún dato individual es visible, solo el total por categoría.',
    },
    side: 'bottom',
  },
  {
    target: 'categories-grid',
    title: { en: 'Market Categories', es: 'Categorías de Mercado' },
    desc: {
      en: 'Signals are broken down by category and subcategory. Click any category to explore the distribution — all derived from anonymous aggregated data.',
      es: 'Las señales se desglosan por categoría y subcategoría. Haz clic para explorar el desglose, todo a partir de datos anónimos.',
    },
    side: 'bottom',
  },
  {
    target: 'insights-section',
    title: { en: 'Market Intelligence', es: 'Inteligencia de Mercado' },
    desc: {
      en: 'An AI agent analyses the aggregated signals and surfaces strategic insights for your store — without ever accessing individual user data.',
      es: 'Un agente IA analiza las señales agregadas y genera inteligencia estratégica para tu tienda, sin acceder nunca a datos de usuarios individuales.',
    },
    side: 'top',
  },
  {
    target: 'campaign-section',
    title: { en: 'Create a Campaign', es: 'Crear una Campaña' },
    desc: {
      en: 'Target a category and set a minimum signal threshold. You discover that demand exists — not who the buyers are.',
      es: 'Apunta a una categoría y define un umbral mínimo de señales. Descubres que hay demanda, sin saber quiénes son los compradores.',
    },
    side: 'top',
  },
];

interface Rect { top: number; left: number; width: number; height: number; }
interface Props {
  lang: Lang;
  onClose: () => void;
}

const PAD = 10;
const OFFSET = 14;
const FADE = 200; // ms for opacity transition

export default function TourGuide({ lang, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);

  const isLast = step === STEPS.length - 1;
  const isMobile = window.innerWidth < 680;
  const tw = isMobile ? window.innerWidth - 32 : 360;

  const measure = useCallback(() => {
    const el = document.querySelector(`[data-tour="${STEPS[step].target}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useEffect(() => {
    const current = STEPS[step];

    // Fade out, reposition, fade in
    setVisible(false);

    // Scroll while invisible
    const t2 = setTimeout(() => {
      document.querySelector(`[data-tour="${current.target}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', measure);
    };
  }, [step, measure]);

  function goNext() { isLast ? onClose() : setStep(s => s + 1); }
  function goPrev() { if (step > 0) setStep(s => s - 1); }

  const current = STEPS[step];

  const sy = rect ? rect.top - PAD : 0;
  const sx = rect ? rect.left - PAD : 0;
  const sw = rect ? rect.width + PAD * 2 : 0;
  const sh = rect ? rect.height + PAD * 2 : 0;

  // Tooltip position
  let tooltipStyle: React.CSSProperties = {};
  if (rect) {
    const tx = Math.max(16, Math.min(rect.left + rect.width / 2 - tw / 2, window.innerWidth - tw - 16));
    let ty: number;
    if (current.side === 'bottom') {
      ty = rect.top + rect.height + PAD + OFFSET;
    } else {
      const above = rect.top - PAD - OFFSET - 220;
      ty = above >= 16 ? above : rect.top + rect.height + PAD + OFFSET;
    }
    ty = Math.max(16, Math.min(ty, window.innerHeight - 260));
    tooltipStyle = { top: ty, left: tx, width: tw };
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
      {/* Overlay strips — no position transitions, only opacity via parent */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, sy), background: 'rgba(0,0,0,0.75)' }} />
      <div style={{ position: 'fixed', top: sy + sh, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)' }} />
      <div style={{ position: 'fixed', top: sy, left: 0, width: Math.max(0, sx), height: sh, background: 'rgba(0,0,0,0.75)' }} />
      <div style={{ position: 'fixed', top: sy, left: sx + sw, right: 0, height: sh, background: 'rgba(0,0,0,0.75)' }} />
      <div style={{
        position: 'fixed', top: sy, left: sx, width: sw, height: sh,
        border: `${sw > 0 ? 2 : 0}px solid #926A45`, borderRadius: 14,
        boxShadow: sw > 0 ? '0 0 0 4px rgba(146,106,69,0.18)' : 'none',
      }} />

      {/* Tooltip */}
      <div style={{
        position: 'fixed', ...tooltipStyle,
        background: '#141414', border: '1px solid #926A45', borderRadius: 14,
        padding: isMobile ? '16px 18px' : '20px 22px',
        pointerEvents: visible ? 'auto' : 'none',
        boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: i <= step ? '#926A45' : '#2A2A2A',
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

        <div style={{ fontSize: isMobile ? 13 : 14, color: '#CCCCCC', lineHeight: 1.65, marginBottom: 18 }}>
          {current.desc[lang]}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#555',
            fontSize: 13, cursor: 'pointer', padding: 0,
          }}>
            {lang === 'es' ? 'Saltar' : 'Skip'}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button onClick={goPrev} style={{
                background: '#1A1A1A', border: '1px solid #333', color: '#AAA',
                fontSize: 13, padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
              }}>←</button>
            )}
            <button onClick={goNext} style={{
              background: '#926A45', border: 'none', color: '#FFF',
              fontSize: 13, fontWeight: 600, padding: '7px 18px', borderRadius: 8, cursor: 'pointer',
            }}>
              {isLast
                ? (lang === 'es' ? 'Finalizar' : 'Finish')
                : (lang === 'es' ? 'Siguiente →' : 'Next →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
