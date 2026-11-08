// Genera los iconos de la app a partir de public/images/aegis_mark.svg.
//
// La marca es más ancha que alta (1280 x 908 ud.), así que se escala por el
// ancho, se centra y se conserva la proporción. Se renderiza con Chromium de
// Playwright, sin dependencias nuevas.
//
//   cd frontend && npm run icons
//
// Sobrescribe en public/: favicon.svg, favicon.png, apple-touch-icon.png,
// icons/icon-192.png, icons/icon-512.png, icons/icon-maskable-512.png y
// og-image.png.

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const INK = '#182531';
const PAPER = '#E8EAF6';

// Cuadro tight de la marca (viewBox original) y su proporción.
const VB = { x: 0, y: 0, w: 1280, h: 908 };
const PAD = 48; // margen del favicon.svg para que no se recorte

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

  // Imagen al compartir el enlace: la marca con el nombre dentro del ojo,
  // bajo el arco, sobre fondo oscuro. La fuente (Geist) se baja de Google.
  const OG = { width: 1200, height: 630 };
  const page = await browser.newPage({ viewport: OG, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@500&display=swap">` +
      `<style>html,body{margin:0;width:${OG.width}px;height:${OG.height}px;overflow:hidden;` +
      `background:radial-gradient(circle at center,#0E1723,#0A0A0A 70%);display:grid;place-items:center}` +
      `.lockup{position:relative}svg{display:block}` +
      `.name{position:absolute;left:0;right:0;top:58.5%;text-align:center;color:#fff;font:500 68px/1 Geist,sans-serif;` +
      `letter-spacing:.14em;text-indent:.14em;transform:translateY(-50%)}</style>` +
      `<div class="lockup">${markSvg('#456D92', 680)}<div class="name">AEGIS</div></div>`,
    { waitUntil: 'networkidle' },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(PUBLIC, 'og-image.png') });
  await page.close();
  console.log('og-image.png'.padEnd(30) + OG.width + 'x' + OG.height);
} finally {
  await browser.close();
}
