// Comprueba que los módulos CSS no llevan colores literales.
//
// Todos los colores salen de los tokens de src/index.css. Este script busca
// hex, rgb(), rgba(), hsl() y hsla() en src/**/*.module.css e informa de
// cada uno como archivo:línea: literal. Sale con código 1 si encuentra alguno.
//
//   cd frontend && node scripts/check-colors.mjs
//
// Los nombres (transparent, currentColor, inherit...) no cuentan.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

// Archivos fuera de la comprobación (se reescribirá más adelante).
const IGNORADOS = new Set([]);

// Excepciones puntuales (archivo + literal exacto). Cada una debe llevar su motivo.
const PERMITIDOS = [];

const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/g;

function* recorrer(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) yield* recorrer(ruta);
    else if (e.name.endsWith('.module.css')) yield ruta;
  }
}

// Vacía los comentarios conservando los saltos de línea, para no mover los números de línea.
const sinComentarios = css => css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));

let fallos = 0;

for (const ruta of [...recorrer(SRC)].sort()) {
  const file = relative(ROOT, ruta).split(sep).join('/');
  if (IGNORADOS.has(file)) continue;
  sinComentarios(readFileSync(ruta, 'utf8')).split('\n').forEach((linea, i) => {
    for (const [literal] of linea.matchAll(COLOR)) {
      if (PERMITIDOS.some(p => p.file === file && p.literal === literal)) continue;
      console.error(`${file}:${i + 1}: ${literal}`);
      fallos++;
    }
  });
}

if (fallos) {
  console.error(`\n${fallos} color(es) literal(es). Usa los tokens de src/index.css.`);
  process.exit(1);
}
console.log('check-colors: sin colores literales en los módulos CSS.');
