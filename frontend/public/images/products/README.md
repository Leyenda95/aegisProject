# Imágenes de producto del catálogo de la tienda

Deja aquí una imagen por producto con el **id del producto** como nombre de
fichero. El id de cada producto está en [`frontend/src/catalog.ts`](../../../src/catalog.ts)
(campo `id` de cada entrada de `PRODUCTS`).

- Formatos admitidos: `.webp`, `.png`, `.jpg` (se prueban en ese orden, así
  que con `.webp` no hay peticiones fallidas antes de dar con la imagen).
- Recomendado: cuadradas o 4:3. Después pasa `node scripts/resize-products.mjs`
  desde `frontend`: las deja en WebP de 256 px de lado como máximo, que pesan
  unos 10 KB cada una.
- Ejemplos: `smartphone-61.webp`, `zapatillas-urbanas.webp`, `cafetera-espresso.webp`.

Mientras no exista la imagen local de un producto, la app usa una foto de
stock temporal (loremflickr, por palabra clave) y, si tampoco carga, un
emoji de la subcategoría. En cuanto subas el fichero con el nombre correcto,
se usa automáticamente sin tocar código.

Lista completa de ids: ver `PRODUCTS` en `catalog.ts`.
