// Redimensiona las imágenes de producto y las pasa a WebP in situ.
//
// Las fotos de stock llegan enormes (varios MB, miles de px) y solo se pintan
// en recuadros de 104 px. Git guardaría ese peso en el historial para
// siempre. Este script las limita a MAX px de lado (de sobra para pantallas
// de alta densidad) y las guarda como <id>.webp, borrando el original.
//
//   cd frontend && node scripts/resize-products.mjs
//
// Reejecutable: las que ya son WebP de MAX px o menos se dejan como están,
// porque recomprimirlas solo les restaría calidad.

import { readdir, stat, rename, unlink } from 'node:fs/promises';
import { join, extname, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'products');
const MAX = 256;
const EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

const files = (await readdir(DIR)).filter(f => EXTS.has(extname(f).toLowerCase())).sort();

let done = 0;
let before = 0;
let after = 0;

for (const name of files) {
  const path = join(DIR, name);
  const { width, height } = await sharp(path).metadata();
  if (extname(name).toLowerCase() === '.webp' && Math.max(width, height) <= MAX) continue;

  const out = join(DIR, basename(name, extname(name)) + '.webp');
  const sizeBefore = (await stat(path)).size;
  before += sizeBefore;

  // sharp no deja leer y escribir el mismo fichero: tmp + rename.
  const tmp = out + '.tmp';
  await sharp(path, { failOn: 'none' })
    .rotate() // respeta la orientación EXIF antes de quitar metadatos
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(tmp);
  await rename(tmp, out);
  if (out !== path) await unlink(path);

  const sizeAfter = (await stat(out)).size;
  after += sizeAfter;
  done++;

  const kb = n => (n / 1024).toFixed(0).padStart(6) + ' KB';
  console.log(name.padEnd(34) + kb(sizeBefore) + '  ->' + kb(sizeAfter));
}

const mb = n => (n / 1048576).toFixed(1) + ' MB';
if (done === 0) console.log('Nada que convertir: todas son WebP de', MAX, 'px o menos.');
else console.log('\n' + done + ' imágenes   ' + mb(before) + '  ->  ' + mb(after));
