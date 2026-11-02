/**
 * Una posición de la URL (/intro/3, /tour/5): un entero de 1 a `total`, o
 * null si no lo es. Se lee una vez, al entrar; dentro ya es un número válido.
 */
export function parsePosition(param: string | undefined, total: number): number | null {
  if (!param || !/^\d+$/.test(param)) return null;
  const n = Number(param);
  return n >= 1 && n <= total ? n : null;
}
