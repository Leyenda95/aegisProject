import { CATEGORIES, CATEGORY_STATE_KEY, type Category, type History } from './api.ts';

export type PeriodFigures = {
  /** Señales del periodo, todas, como los contadores del contrato. */
  total: number;
  /** Variación frente al periodo anterior, o null si no se puede comparar. */
  change: number | null;
  /** Señales de la carga de datos de demo dentro del periodo. */
  demo: number;
  /** Por categoría, de la que más señales tiene a la que menos. */
  categories: { category: Category; count: number; change: number | null }[];
};

/**
 * Las cifras de un periodo (GET /history) frente al anterior, las mismas en
 * el mercado y en el informe de la tienda. Si en alguno de los dos periodos
 * hay una carga de datos de demo no se comparan: miles de señales de golpe
 * falsearían la variación.
 */
export function periodFigures(data: History): PeriodFigures {
  const demo = Number(data.demo?.current ?? 0);
  const comparable = demo === 0 && Number(data.demo?.previous ?? 0) === 0 && data.totals.previous !== null;
  const change = (now: number, before: number) => (comparable && before > 0 ? (now - before) / before : null);
  const total = Number(data.totals.current.totalSignals ?? 0);
  const categories = CATEGORIES.map(category => {
    const key = CATEGORY_STATE_KEY[category];
    const count = Number(data.totals.current[key] ?? 0);
    return { category, count, change: change(count, Number(data.totals.previous?.[key] ?? 0)) };
  }).sort((a, b) => b.count - a.count);
  return { total, change: change(total, Number(data.totals.previous?.totalSignals ?? 0)), demo, categories };
}
