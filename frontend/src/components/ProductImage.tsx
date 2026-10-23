import { useState } from 'react';
import { SUBCATEGORY_ICONS } from '../api.ts';
import { stockImageUrl, type Product } from '../catalog.ts';
import { cx } from '../cx.ts';
import styles from './ProductImage.module.css';

// .png primero porque es el formato de todas las imágenes que hay ahora: cada
// extensión que se prueba y no existe es una petición fallida más.
const EXTS = ['.png', '.webp', '.jpg', '.jpeg'];

/**
 * Imagen de un producto del catálogo. Prueba en orden: la imagen local que
 * suba el usuario (frontend/public/images/products/<id>.png|webp|jpg|jpeg),
 * luego una foto de stock temporal, y por último un emoji de la subcategoría.
 *
 * La imagen se muestra entera dentro de un recuadro cuadrado (object-fit:
 * contain), sin recortar ni deformar, sobre un fondo neutro. Así da igual
 * el tamaño o la proporción del fichero que se suba.
 */
export default function ProductImage({ product }: { product: Product }) {
  const candidates = [...EXTS.map(ext => product.image + ext), stockImageUrl(product)];
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];

  if (!src) {
    return (
      <div className={cx(styles.frame, styles.emoji)}>
        {SUBCATEGORY_ICONS[product.subcategory] ?? '📦'}
      </div>
    );
  }

  return (
    <img
      className={cx(styles.frame, styles.photo)}
      src={src}
      alt=""
      loading="lazy"
      onError={() => setIdx(i => i + 1)}
    />
  );
}
