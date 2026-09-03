// Redimensiona y recomprime las imágenes de producto in situ.
//
// Las fotos de stock llegan enormes (varios MB, miles de px) y solo se pintan
// en recuadros de ~200 px. Git guardaría ese peso en el historial para
// siempre. Este script las limita a MAX px de lado y las recomprime.
//
//   cd frontend && node scripts/resize-products.mjs
//
// Sobrescribe los ficheros. Reejecutable: volver a pasarlo no degrada más
// (ya están por debajo de MAX, withoutEnlargement evita reescalar).

import { readdir, stat, rename } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'products');
const MAX = 640;
const EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

const files = (await readdir(DIR)).filter(f => EXTS.has(extname(f).toLowerCase())).sort();
if (files.length === 0) { console.log('No hay imágenes en', DIR); process.exit(0); }

let before = 0;
let after = 0;

for (const name of files) {
  const path = join(DIR, name);
  const sizeBefore = (await stat(path)).size;
  before += sizeBefore;

  const ext = extname(name).toLowerCase();
  let img = sharp(path, { failOn: 'none' })
    .rotate() // respeta la orientación EXIF antes de quitar metadatos
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });

  if (ext === '.png') img = img.png({ compressionLevel: 9, palette: true, quality: 90 });
  else if (ext === '.jpg' || ext === '.jpeg') img = img.jpeg({ quality: 82, mozjpeg: true });
  else if (ext === '.webp') img = img.webp({ quality: 82 });
  else if (ext === '.avif') img = img.avif({ quality: 55 });

  // sharp no deja leer y escribir el mismo fichero: tmp + rename.
  const tmp = path + '.tmp';
  await img.toFile(tmp);
  await rename(tmp, path);

  const sizeAfter = (await stat(path)).size;
  after += sizeAfter;

  const kb = n => (n / 1024).toFixed(0).padStart(6) + ' KB';
  console.log(name.padEnd(34) + kb(sizeBefore) + '  ->' + kb(sizeAfter));
}

const mb = n => (n / 1048576).toFixed(1) + ' MB';
console.log('\n' + files.length + ' imágenes   ' + mb(before) + '  ->  ' + mb(after));
