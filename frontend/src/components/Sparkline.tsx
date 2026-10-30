const WIDTH = 96;
const HEIGHT = 26;
// El punto final (r = 2) cabe entero dentro del recuadro.
const PAD = 2;
// Con más puntos no se distinguiría nada a este tamaño.
const MAX_POINTS = 48;

/**
 * Minigráfica de la cinta: las señales acumuladas en la última semana (ver
 * useHistory), con un punto en el valor de ahora. Sin datos todavía (la
 * primera visita con el backend recién arrancado), una línea tenue en su
 * sitio, para que no quede un hueco ni se mueva la cinta al llegar.
 */
export default function Sparkline({ points, className }: { points: [number, number][] | undefined; className?: string }) {
  let path = '';
  let end: [number, number] | null = null;
  if (points && points.length > 1) {
    const stride = Math.ceil(points.length / MAX_POINTS);
    const sampled = points.filter((_, i) => i % stride === 0 || i === points.length - 1);
    const t0 = sampled[0][0];
    const t1 = sampled[sampled.length - 1][0];
    const max = Math.max(...sampled.map(([, v]) => v));
    const coords = sampled.map(([t, v]): [number, number] => [
      PAD + ((t - t0) / (t1 - t0 || 1)) * (WIDTH - 2 * PAD),
      // Sin ninguna señal en la semana, una línea plana abajo.
      HEIGHT - PAD - 4 - (max > 0 ? v / max : 0) * (HEIGHT - 2 * PAD - 8),
    ]);
    path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    end = coords[coords.length - 1];
  }

  return (
    <svg className={className} width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
      {path ? (
        <path d={path} fill="none" stroke="var(--accent-strong)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      ) : (
        <path d={`M${PAD} ${HEIGHT / 2} L${WIDTH - PAD} ${HEIGHT / 2}`} fill="none" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" />
      )}
      {end && <circle cx={end[0]} cy={end[1]} r="2" fill="var(--accent)" />}
    </svg>
  );
}
