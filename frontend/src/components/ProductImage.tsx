import { useState } from 'react';
import { SUBCATEGORY_ICONS } from '../api.ts';
import { stockImageUrl, type Product } from '../catalog.ts';

const EXTS = ['.jpg', '.webp', '.png'];

/**
 * Imagen de un producto del catálogo. Prueba en orden: la imagen local que
 * suba el usuario (frontend/public/images/products/<id>.jpg|webp|png), luego
 * una foto de stock temporal, y por último un emoji de la subcategoría.
 */
export default function ProductImage({ product, size = 96 }: { product: Product; size?: number }) {
  const candidates = [...EXTS.map(ext => product.image + ext), stockImageUrl(product)];
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];

  if (!src) {
    return (
      <div style={{
        width: size, height: size, display: 'grid', placeItems: 'center',
        fontSize: Math.round(size * 0.46), background: '#0D0D0D', borderRadius: 8,
      }}>
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
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, background: '#0D0D0D', display: 'block' }}
    />
  );
}
