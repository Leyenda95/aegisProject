import { useState } from 'react';
import { SUBCATEGORY_ICONS } from '../api.ts';
import { stockImageUrl, type Product } from '../catalog.ts';

const EXTS = ['.jpg', '.jpeg', '.webp', '.png'];

/**
 * Imagen de un producto del catálogo. Prueba en orden: la imagen local que
 * suba el usuario (frontend/public/images/products/<id>.jpg|jpeg|webp|png),
 * luego una foto de stock temporal, y por último un emoji de la subcategoría.
 *
 * La imagen se muestra entera dentro de un recuadro cuadrado (object-fit:
 * contain), sin recortar ni deformar, sobre un fondo gris oscuro. Así da
 * igual el tamaño o la proporción del fichero que se suba.
 */
export default function ProductImage({ product, size = 96 }: { product: Product; size?: number }) {
  const candidates = [...EXTS.map(ext => product.image + ext), stockImageUrl(product)];
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];

  const frame = {
    width: size,
    height: size,
    borderRadius: 10,
    background: '#242424b4',
    flexShrink: 0,
  } as const;

  if (!src) {
    return (
      <div style={{ ...frame, display: 'grid', placeItems: 'center', fontSize: Math.round(size * 0.42) }}>
        {SUBCATEGORY_ICONS[product.subcategory] ?? '📦'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setIdx(i => i + 1)}
      style={{ ...frame, objectFit: 'contain', padding: Math.round(size * 0.08), display: 'block' }}
    />
  );
}
