// Genera los iconos de la app a partir de public/images/aegis_mark.svg.
//
// La marca es más ancha que alta (640,1 x 454 ud.), así que se escala por el
// ancho, se centra y se conserva la proporción. Se renderiza con Chromium de
// Playwright, sin dependencias nuevas.
//
//   cd frontend && npm run icons
//
// Sobrescribe en public/: favicon.svg, favicon.png, apple-touch-icon.png,
// icons/icon-192.png, icons/icon-512.png e icons/icon-maskable-512.png.

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const INK = '#182531';
const PAPER = '#E8EAF6';

// Cuadro tight de la marca (viewBox original) y su proporción.
const VB = { x: 448, y: 271.7, w: 640.1, h: 454 };
const PAD = 24; // margen del favicon.svg para que no se recorte

const source = await readFile(join(PUBLIC, 'images', 'aegis_mark.svg'), 'utf8');
const paths = [...source.matchAll(/<path [^>]*\/>/g)].map(m => m[0]);
if (paths.length !== 2) throw new Error('aegis_mark.svg debería tener 2 paths, tiene ' + paths.length);

// 1. favicon.svg: la marca con margen y color claro en modo oscuro.
const viewBox = [VB.x - PAD, VB.y - PAD, VB.w + 2 * PAD, VB.h + 2 * PAD].join(' ');
const favicon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="${INK}">` +
  `<style>@media (prefers-color-scheme: dark) { path { fill: ${PAPER}; } }</style>` +
  paths.join('') +
  `</svg>\n`;
await writeFile(join(PUBLIC, 'favicon.svg'), favicon);
console.log('favicon.svg'.padEnd(30) + 'vector');

// Resto: PNG. fraction = ancho de la marca / ancho del lienzo.
const PNGS = [
  { file: 'favicon.png', size: 32, fraction: 0.9, bg: null, fg: INK },
  { file: 'apple-touch-icon.png', size: 180, fraction: 0.62, bg: INK, fg: PAPER },
  { file: 'icons/icon-192.png', size: 192, fraction: 0.62, bg: INK, fg: PAPER },
  { file: 'icons/icon-512.png', size: 512, fraction: 0.62, bg: INK, fg: PAPER },
  // Maskable: el fondo llena todo y la marca queda dentro de la zona segura.
  { file: 'icons/icon-maskable-512.png', size: 512, fraction: 0.5, bg: INK, fg: PAPER },
];

const markSvg = (fg, width) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" ` +
  `width="${width}" height="${(width * VB.h) / VB.w}" fill="${fg}">${paths.join('')}</svg>`;

const browser = await chromium.launch();
try {
  for (const { file, size, fraction, bg, fg } of PNGS) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(
      `<!doctype html><style>html,body{margin:0;width:${size}px;height:${size}px;` +
        `background:${bg ?? 'transparent'};display:grid;place-items:center;overflow:hidden}` +
        `svg{display:block}</style>${markSvg(fg, size * fraction)}`,
    );
    await page.screenshot({ path: join(PUBLIC, file), omitBackground: bg === null });
    await page.close();
    console.log(file.padEnd(30) + size + 'x' + size);
  }
} finally {
  await browser.close();
}
