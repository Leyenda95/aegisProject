import { PRODUCTS, stockImageUrl, type Product } from './catalog.ts';

// .webp primero: es el formato de todas las fotos que hay ahora (pequeñas, de
// 256 px). Cada extensión que se prueba y no existe es una petición fallida más.
const EXTS = ['.webp', '.png', '.jpg', '.jpeg'];

/** Dónde buscar la foto de un producto, en orden: la local en cada formato y, si no hay, una de stock. */
export function productImageCandidates(product: Product): string[] {
  return [...EXTS.map(ext => product.image + ext), stockImageUrl(product)];
}

/**
 * Descarga en segundo plano las fotos de todo el catálogo cuando el navegador
 * está desocupado, para que al cambiar de categoría ya estén en caché. Son
 * pequeñas (unos 430 KB todas juntas). Devuelve cómo cancelarlo.
 */
export function preloadProductImages(): () => void {
  const preload = () => {
    for (const p of PRODUCTS) new Image().src = p.image + EXTS[0];
  };
  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(preload);
    return () => cancelIdleCallback(id);
  }
  const timer = setTimeout(preload, 1500);
  return () => clearTimeout(timer);
}
