import type { ReactNode } from 'react';
import type { IconId } from './ids.ts';

/**
 * Iconos de línea del recorrido. Todos se dibujan sobre una rejilla de 24 con
 * ~2 de margen, con el mismo trazo (1.75, puntas redondas). El tamaño sale del
 * font-size y el color de currentColor. Solo los puntos diminutos van rellenos.
 */
const PATHS: Record<IconId, ReactNode> = {
  // Documento con la esquina doblada y dos líneas de código
  contract: (
    <>
      <path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z" />
      <path d="M14 2.5V8h5.5" />
      <path d="M8.5 13h7M8.5 17h5" />
    </>
  ),
  // Escudo con un check (prueba de conocimiento cero)
  proof: (
    <>
      <path d="M12 2.5L4.5 5.5v6c0 4.7 3.1 8.2 7.5 10 4.4-1.8 7.5-5.3 7.5-10v-6z" />
      <path d="M8.75 12l2.5 2.5 4-4.75" />
    </>
  ),
  // Árbol de Merkle: raíz, dos nodos, cuatro hojas y los conectores
  tree: (
    <>
      <circle cx="12" cy="4.5" r="2" />
      <circle cx="7" cy="11.5" r="2" />
      <circle cx="17" cy="11.5" r="2" />
      <path d="M12 6.5v2M7 9.5v-1h10v1" />
      <path d="M7 13.5v2M4.5 17.75V15.5h5v2.25" />
      <path d="M17 13.5v2M14.5 17.75V15.5h5v2.25" />
      <circle cx="4.5" cy="19.25" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="19.25" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="19.25" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="19.25" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  // Sello: disco con aro interior y cinta con muesca
  seal: (
    <>
      <circle cx="12" cy="9" r="6.5" />
      <circle cx="12" cy="9" r="2.5" />
      <path d="M8.5 14.5L7 21.5l5-3 5 3-1.5-7" />
    </>
  ),
  // Surtidor: cuerpo con visor, base y manguera que sale por la derecha
  fuel: (
    <>
      <path d="M4 21.5V4.5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v17" />
      <path d="M3 21.5h11M4 10h9" />
      <path d="M13 12.5h2a2 2 0 0 1 2 2v3a2 2 0 0 0 4 0V9.5l-3-3" />
    </>
  ),
  // Cartera: cuerpo redondeado, solapa asomando por detrás y cierre con punto
  wallet: (
    <>
      <rect x="3" y="7" width="18" height="13.5" rx="2.5" />
      <path d="M6 7l8.8-3.1a1.5 1.5 0 0 1 2 1.4V7" />
      <path d="M21 11.5h-4.25a2.25 2.25 0 0 0 0 4.5H21" />
      <circle cx="16.75" cy="13.75" r="0.75" fill="currentColor" stroke="none" />
    </>
  ),
  // Base de datos: tapa elíptica, laterales y dos curvas de separación
  indexer: (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.75" />
      <path d="M4.5 5.5v13c0 1.5 3.4 2.75 7.5 2.75s7.5-1.25 7.5-2.75v-13" />
      <path d="M4.5 12c0 1.5 3.4 2.75 7.5 2.75s7.5-1.25 7.5-2.75" />
    </>
  ),
  // Destello de cuatro puntas (agente de IA) y un pequeño más en la esquina
  agent: (
    <>
      <path d="M12 3C12.6 8.4 15.6 11.4 21 12c-5.4.6-8.4 3.6-9 9-.6-5.4-3.6-8.4-9-9 5.4-.6 8.4-3.6 9-9z" />
      <path d="M19.5 3.25v3M18 4.75h3" />
    </>
  ),
  // Carrito: asa, cesta trapezoidal y dos ruedas
  cart: (
    <>
      <path d="M2.5 3.5h2.8l2.2 11.1h10.4l2.4-8.1H5.9" />
      <circle cx="9.5" cy="19.25" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="19.25" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  // Marco de escaneo: cuatro esquinas y un cuadrado pequeño en el centro
  scan: (
    <>
      <path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8" />
      <path d="M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8" />
      <path d="M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16" />
      <path d="M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </>
  ),
  // Ojo: contorno almendrado suave, iris y una pupila pequeña rellena
  eye: (
    <>
      <path d="M2.5 12C5 8 8.3 6 12 6s7 2 9.5 6c-2.5 4-5.8 6-9.5 6s-7-2-9.5-6z" />
      <circle cx="12" cy="12" r="3.4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  // Persona: cabeza y hombros en arco
  person: (
    <>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.5 20.5c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" />
    </>
  ),
  // Mercado público: línea que sube con un punto al final, sobre la base
  market: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M4 15.5l5-5 4 3.5 5-6.5" />
      <circle cx="18.5" cy="7.5" r="1.75" fill="currentColor" stroke="none" />
    </>
  ),
  // Aviso: círculo con una exclamación discreta
  alert: (
    <>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 7.25v6" />
      <circle cx="12" cy="16.6" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  // Símbolo de Midnight (relleno): aro y tres cuadrados en columna, el de kit.tsx a escala 20/24
  midnight: (
    <g transform="translate(2 2) scale(0.8333)" fill="currentColor" stroke="none">
      <path fillRule="evenodd" d="M12 0a12 12 0 1 1 0 24a12 12 0 1 1 0-24zm0 2.23a9.77 9.77 0 1 0 0 19.54a9.77 9.77 0 1 0 0-19.54z" />
      <rect x={10.88} y={3.84} width={2.23} height={2.23} />
      <rect x={10.88} y={7.26} width={2.23} height={2.23} />
      <rect x={10.88} y={10.88} width={2.23} height={2.23} />
    </g>
  ),
  // Tres barras que suben
  chart: (
    <>
      <rect x="3.5" y="14.5" width="4.5" height="6" rx="1" />
      <rect x="9.75" y="9.5" width="4.5" height="11" rx="1" />
      <rect x="16" y="3.5" width="4.5" height="17" rx="1" />
    </>
  ),
  // Rama de git: dos nodos en una línea y un tercero que se une con una curva
  github: (
    <>
      <circle cx="6.5" cy="5" r="2.5" />
      <circle cx="6.5" cy="19" r="2.5" />
      <circle cx="17.5" cy="7" r="2.5" />
      <path d="M6.5 7.5v9" />
      <path d="M17.5 9.5v.5a5 5 0 0 1-5 5h-6" />
    </>
  ),
  // Libro abierto: dos páginas curvas y el lomo
  docs: (
    <>
      <path d="M12 6.5C10 5 7.5 4.5 3.5 4.5v13c4 0 6.5.5 8.5 2 2-1.5 4.5-2 8.5-2v-13c-4 0-6.5.5-8.5 2z" />
      <path d="M12 6.5v13" />
    </>
  ),
  // Ventana de terminal con el prompt >_
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M7 9.5l3 2.5-3 2.5" />
      <path d="M12.5 14.5H17" />
    </>
  ),
  // Sobre: cuerpo redondeado y la solapa en V
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.75 7.25L12 13.25l8.25-6" />
    </>
  ),
  // Candado cerrado con el ojo de la cerradura
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.75v2.5" />
    </>
  ),
};

export default function Icon({ id, className }: { id: IconId; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[id]}
    </svg>
  );
}
