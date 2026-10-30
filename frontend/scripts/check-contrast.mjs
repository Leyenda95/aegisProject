// Comprueba el contraste WCAG de las parejas de tokens que se leen juntas
// (texto sobre fondo, texto de botón sobre su relleno...), en cada tema y en
// cada look. Uso: node scripts/check-contrast.mjs [archivo.css ...]
// Sin argumentos lee src/index.css y src/lab/looks.css si existe.
import { readFileSync, existsSync } from 'node:fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  files.push('src/index.css');
  if (existsSync('src/lab/looks.css')) files.push('src/lab/looks.css');
}

// Bloques "selector { --token: valor; }" de todos los archivos, en orden.
const blocks = [];
for (const file of files) {
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const vars = {};
    for (const v of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[v[1]] = v[2].trim();
    if (Object.keys(vars).length) blocks.push({ selector: m[1].trim(), vars });
  }
}

// Tokens de un tema: los bloques de :root que aplican, de menos a más específico.
// data-look sin valor (los acentos) vale para cualquier look; data-accent solo
// cuenta si se pide ese acento. Orden del navegador: base, base oscuro, look,
// look oscuro, acento, acento oscuro (a igual rango, el orden del archivo).
function tokens(look, theme, accent = null) {
  const applies = (sel) => {
    if (!sel.startsWith(':root')) return false;
    const lookM = sel.match(/data-look(?:="(\w+)")?/);
    const themeM = sel.match(/data-theme="(\w+)"/);
    const accentM = sel.match(/data-accent="(\w+)"/);
    if (lookM && look === 'base') return false;
    if (lookM && lookM[1] && lookM[1] !== look) return false;
    if (themeM && themeM[1] !== theme) return false;
    if (accentM && accentM[1] !== accent) return false;
    return sel === ':root' || lookM || themeM || accentM;
  };
  const rank = (sel) => (sel.includes('data-accent') ? 4 : 0) + (sel.includes('data-look') ? 2 : 0) + (sel.includes('data-theme') ? 1 : 0);
  return Object.assign({}, ...blocks.filter(b => applies(b.selector)).sort((a, b) => rank(a.selector) - rank(b.selector)).map(b => b.vars));
}

function parse(value) {
  let m = value.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map(c => c + c).join('');
    const n = [0, 2, 4, 6].map(i => parseInt(h.slice(i, i + 2) || 'ff', 16));
    return { r: n[0], g: n[1], b: n[2], a: n[3] / 255 };
  }
  m = value.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const [r, g, b, a = '1'] = m[1].split(/[\s,/]+/);
    return { r: +r, g: +g, b: +b, a: +a };
  }
  return null;
}

// Un color con transparencia se compone sobre el fondo en el que va.
const over = (c, bg) => ({ r: c.r * c.a + bg.r * (1 - c.a), g: c.g * c.a + bg.g * (1 - c.a), b: c.b * c.a + bg.b * (1 - c.a), a: 1 });
const lum = ({ r, g, b }) => {
  const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [texto, fondo, mínimo]. 4.5 para texto normal, 3 para texto grande o trazos.
const PAIRS = [
  ...['--ink-bright', '--ink', '--ink-pale', '--ink-soft', '--ink-dim'].flatMap(t => [[t, '--ground', 4.5], [t, '--surface', 4.5], [t, '--surface-2', 4.5]]),
  ['--ink-faint', '--surface', 3.5],
  ['--ink-faint', '--ground', 3.5],
  ['--on-accent', '--accent-fill', 4.5],
  ['--accent-strong', '--surface', 4.5],
  ['--accent-strong', '--ground', 4.5],
  ['--accent', '--surface', 3],
  ['--price', '--surface', 4.5],
  ['--success', '--surface', 4.5],
  ['--danger', '--surface', 4.5],
  ['--info', '--surface', 4.5],
  ['--accent-strong', '--accent-wash', 4.5],
];

const looks = ['base', ...new Set(blocks.flatMap(b => [...b.selector.matchAll(/data-look="(\w+)"/g)].map(m => m[1])))];
const accents = [...new Set(blocks.flatMap(b => [...b.selector.matchAll(/data-accent="(\w+)"/g)].map(m => m[1])))];
let failures = 0;
function check(name, t) {
  const rows = [];
  for (const [fg, bg, min] of PAIRS) {
    const b = parse(t[bg] ?? ''); const f = parse(t[fg] ?? '');
    if (!b || !f) continue;
    const ground = parse(t['--surface']);
    const solidBg = b.a < 1 ? over(b, ground) : b;
    const r = ratio(over(f, solidBg), solidBg);
    const ok = r >= min;
    if (!ok) failures++;
    rows.push(`${ok ? '  ' : '✗ '}${fg.padEnd(16)} on ${bg.padEnd(14)} ${r.toFixed(2).padStart(5)} (min ${min})`);
  }
  console.log(`\n[${name}]`);
  console.log(rows.join('\n'));
}
for (const look of looks) {
  for (const theme of ['light', 'dark']) check(`${look} · ${theme}`, tokens(look, theme));
}
// Cada acento encima del look "a" (el que los usa).
if (looks.includes('a')) {
  for (const accent of accents) {
    for (const theme of ['light', 'dark']) check(`a+${accent} · ${theme}`, tokens('a', theme, accent));
  }
}
console.log(failures ? `\n${failures} parejas por debajo del mínimo` : '\nTodo el contraste cumple');
process.exit(failures ? 1 : 0);
