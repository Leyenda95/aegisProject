import { CATEGORIES, SUBCATEGORIES, SUBCATEGORY_INDEX, type Category, type Lang } from './api.ts';

/**
 * Catálogo de productos de la tienda de demo. Es solo del frontend: nada de
 * esto viaja on-chain. Cuando la tienda cobra una cesta, el recibo sellado
 * lleva únicamente {subcategoría dominante, importe total}, el detalle de
 * artículos se queda en el ticket de papel (ver ReceiptTicket).
 *
 * Imágenes: deja las tuyas en `frontend/public/images/products/<id>.jpg`
 * (también valen `.webp` y `.png`). Mientras no exista la local, se usa una
 * foto de stock temporal por palabra clave; si tampoco carga, un emoji.
 */
export type Product = {
  id: string;
  /** Clave de SUBCATEGORIES / enum Subcategory del contrato. */
  subcategory: string;
  name: Record<Lang, string>;
  priceCents: number;
  /** Ruta local sin extensión, ProductImage prueba .jpg/.webp/.png. */
  image: string;
  /** Palabra(s) clave para la foto de stock temporal. */
  stockKeyword: string;
};

function mk(id: string, subcategory: string, es: string, en: string, priceCents: number, stockKeyword: string): Product {
  return { id, subcategory, name: { es, en }, priceCents, image: `/images/products/${id}`, stockKeyword };
}

export const PRODUCTS: Product[] = [
  // Electrónica
  mk('smartphone-61', 'mobile', 'Smartphone 6,1"', 'Smartphone 6.1"', 69900, 'smartphone'),
  mk('smartphone-plus', 'mobile', 'Smartphone Plus 6,7"', 'Smartphone Plus 6.7"', 99900, 'smartphone'),
  mk('tablet-10', 'tablet', 'Tablet 10"', 'Tablet 10"', 34900, 'tablet'),
  mk('tablet-pro-12', 'tablet', 'Tablet Pro 12"', 'Tablet Pro 12"', 79900, 'tablet computer'),
  mk('laptop-ultraligero', 'computer', 'Portátil ultraligero', 'Ultralight laptop', 109900, 'laptop'),
  mk('sobremesa-compacto', 'computer', 'Sobremesa compacto', 'Compact desktop', 84900, 'desktop computer'),
  mk('camara-sin-espejo', 'camera', 'Cámara sin espejo', 'Mirrorless camera', 74900, 'camera'),
  mk('camara-accion', 'camera', 'Cámara de acción', 'Action camera', 29900, 'action camera'),
  mk('auriculares-inalambricos', 'audio', 'Auriculares inalámbricos', 'Wireless earbuds', 12900, 'earbuds'),
  mk('altavoz-bluetooth', 'audio', 'Altavoz Bluetooth', 'Bluetooth speaker', 5900, 'speaker'),
  mk('consola-portatil', 'gaming', 'Consola portátil', 'Handheld console', 39900, 'game console'),
  mk('mando-inalambrico', 'gaming', 'Mando inalámbrico', 'Wireless controller', 6900, 'gamepad'),

  // Moda
  mk('zapatillas-urbanas', 'shoes', 'Zapatillas urbanas', 'Urban sneakers', 8900, 'sneakers'),
  mk('botas-cuero', 'shoes', 'Botas de cuero', 'Leather boots', 12900, 'leather boots'),
  mk('camiseta-algodon', 'tops', 'Camiseta de algodón', 'Cotton t-shirt', 1900, 't-shirt'),
  mk('camisa-lino', 'tops', 'Camisa de lino', 'Linen shirt', 3900, 'shirt'),
  mk('vaqueros-slim', 'bottoms', 'Vaqueros slim', 'Slim jeans', 5900, 'jeans'),
  mk('pantalon-chino', 'bottoms', 'Pantalón chino', 'Chino trousers', 4500, 'chino trousers'),
  mk('cinturon-piel', 'accessories', 'Cinturón de piel', 'Leather belt', 2900, 'belt'),
  mk('gorra-bordada', 'accessories', 'Gorra bordada', 'Embroidered cap', 1900, 'cap'),
  mk('chaqueta-vaquera', 'outerwear', 'Chaqueta vaquera', 'Denim jacket', 7900, 'denim jacket'),
  mk('abrigo-lana', 'outerwear', 'Abrigo de lana', 'Wool coat', 14900, 'wool coat'),

  // Alimentación
  mk('cesta-compra', 'groceries', 'Cesta de la compra', 'Grocery basket', 3450, 'groceries'),
  mk('pack-despensa', 'groceries', 'Pack despensa', 'Pantry pack', 1990, 'pantry food'),
  mk('menu-dia', 'restaurant', 'Menú del día', 'Set lunch menu', 1500, 'lunch plate'),
  mk('cena-dos', 'restaurant', 'Cena para dos', 'Dinner for two', 4800, 'restaurant dinner'),
  mk('cafe-especialidad', 'drinks', 'Café de especialidad 250 g', 'Specialty coffee 250g', 990, 'coffee beans'),
  mk('refrescos-x6', 'drinks', 'Pack de refrescos x6', 'Soft drinks x6', 450, 'soda cans'),
  mk('frutos-secos', 'snacks', 'Bolsa de frutos secos', 'Mixed nuts bag', 550, 'nuts'),
  mk('tableta-chocolate', 'snacks', 'Tableta de chocolate', 'Chocolate bar', 320, 'chocolate'),

  // Deportes
  mk('esterilla-yoga', 'equipment', 'Esterilla de yoga', 'Yoga mat', 2490, 'yoga mat'),
  mk('mancuernas-set', 'equipment', 'Juego de mancuernas', 'Dumbbell set', 5990, 'dumbbell'),
  mk('camiseta-tecnica', 'clothing', 'Camiseta técnica', 'Technical tee', 2490, 'sportswear'),
  mk('mallas-running', 'clothing', 'Mallas de running', 'Running tights', 3490, 'running tights'),
  mk('zapatillas-running', 'footwear', 'Zapatillas de running', 'Running shoes', 9900, 'running shoes'),
  mk('botas-trekking', 'footwear', 'Botas de trekking', 'Trekking boots', 11900, 'hiking boots'),
  mk('proteina-1kg', 'supplements', 'Proteína en polvo 1 kg', 'Protein powder 1kg', 2990, 'protein powder'),
  mk('barritas-x12', 'supplements', 'Barritas energéticas x12', 'Energy bars x12', 1590, 'energy bar'),

  // Hogar
  mk('silla-escritorio', 'furniture', 'Silla de escritorio', 'Desk chair', 8900, 'office chair'),
  mk('estanteria-modular', 'furniture', 'Estantería modular', 'Modular shelf', 5900, 'shelf'),
  mk('cafetera-espresso', 'appliances', 'Cafetera espresso', 'Espresso machine', 12900, 'espresso machine'),
  mk('aspirador-sin-cable', 'appliances', 'Aspirador sin cable', 'Cordless vacuum', 17900, 'vacuum cleaner'),
  mk('lampara-mesa', 'decor', 'Lámpara de mesa', 'Table lamp', 3900, 'table lamp'),
  mk('cojines-x2', 'decor', 'Juego de cojines x2', 'Cushion set x2', 2490, 'cushion'),
  mk('taladro-inalambrico', 'tools', 'Taladro inalámbrico', 'Cordless drill', 6900, 'power drill'),
  mk('destornilladores-set', 'tools', 'Set de destornilladores', 'Screwdriver set', 1990, 'screwdriver'),

  // Otros
  mk('tarjeta-regalo', 'other', 'Tarjeta regalo', 'Gift card', 2500, 'gift card'),
  mk('articulo-vario', 'other', 'Artículo variado', 'Misc item', 999, 'cardboard box'),
];

export const PRODUCTS_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

/** Para cada subcategoría, la categoría a la que pertenece (para agrupar el catálogo y etiquetar el sello). */
export const SUBCAT_TO_CATEGORY: Record<string, Category> = Object.fromEntries(
  CATEGORIES.flatMap(c => (SUBCATEGORIES[c] as readonly string[]).map(s => [s, c] as const)),
) as Record<string, Category>;

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Foto de stock temporal, determinista por producto, hasta que exista la imagen local. */
export function stockImageUrl(p: Product): string {
  return `https://loremflickr.com/320/240/${encodeURIComponent(p.stockKeyword)}?lock=${hashId(p.id)}`;
}

export type CartLine = { product: Product; qty: number };

export function cartLinesFrom(cart: Record<string, number>): CartLine[] {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: PRODUCTS_BY_ID[id], qty }))
    .filter((l): l is CartLine => Boolean(l.product));
}

export function cartTotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.product.priceCents * l.qty, 0);
}

/** Cuántas líneas (subcategorías distintas) caben en el recibo sellado. Debe coincidir con MAX_RECEIPT_LINES del backend/contrato. */
export const MAX_RECEIPT_LINES = 8;

export type RollupLine = { subcategory: string; qty: number; amountCents: number };

/**
 * "Enrolla" la cesta por subcategoría: una línea por subcategoría distinta
 * con unidades e importe sumados. Ordenada por importe descendente (empates
 * por orden del enum del contrato).
 */
export function rollupBySubcategory(lines: CartLine[]): RollupLine[] {
  const bySub = new Map<string, RollupLine>();
  for (const l of lines) {
    const cur = bySub.get(l.product.subcategory)
      ?? { subcategory: l.product.subcategory, qty: 0, amountCents: 0 };
    cur.qty += l.qty;
    cur.amountCents += l.product.priceCents * l.qty;
    bySub.set(l.product.subcategory, cur);
  }
  return [...bySub.values()].sort((a, b) =>
    (b.amountCents - a.amountCents)
    || (SUBCATEGORY_INDEX.indexOf(a.subcategory) - SUBCATEGORY_INDEX.indexOf(b.subcategory)),
  );
}

/** Las que de verdad se sellan y se señalan: las 8 de mayor importe. El resto queda solo en el ticket de papel. */
export function sealedLines(rollup: RollupLine[]): RollupLine[] {
  return rollup.slice(0, MAX_RECEIPT_LINES);
}

export function formatEUR(cents: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
