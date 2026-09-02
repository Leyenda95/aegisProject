# Imágenes de producto del catálogo de la tienda

Deja aquí una imagen por producto con el **id del producto** como nombre de
fichero. El id de cada producto está en [`frontend/src/catalog.ts`](../../../src/catalog.ts)
(campo `id` de cada entrada de `PRODUCTS`).

- Formatos admitidos: `.jpg`, `.webp`, `.png` (se prueban en ese orden).
- Recomendado: cuadradas o 4:3, ~400×400 px, optimizadas para web.
- Ejemplos: `smartphone-61.jpg`, `zapatillas-urbanas.webp`, `cafetera-espresso.png`.

Mientras no exista la imagen local de un producto, la app usa una foto de
stock temporal (loremflickr, por palabra clave) y, si tampoco carga, un
emoji de la subcategoría. En cuanto subas el fichero con el nombre correcto,
se usa automáticamente sin tocar código.

Lista completa de ids: ver `PRODUCTS` en `catalog.ts`.
