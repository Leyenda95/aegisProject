export type AegisState = {
  signalsElectronics: string; signalsFashion: string; signalsFood: string;
  signalsSports: string; signalsHome: string; signalsOther: string;
  signalsMobile: string; signalsTablet: string; signalsComputer: string;
  signalsCamera: string; signalsAudio: string; signalsGaming: string;
  signalsShoes: string; signalsTops: string; signalsBottoms: string;
  signalsAccessories: string; signalsOuterwear: string;
  signalsGroceries: string; signalsRestaurant: string; signalsCafes: string; signalsFastfood: string; signalsLocalshops: string;
  signalsEquipment: string; signalsClothing: string; signalsFootwear: string; signalsSupplements: string;
  signalsFurniture: string; signalsAppliances: string; signalsDecor: string; signalsTools: string;
  totalSignals: string; campaignCount: string;
  isSeeded?: string;
};

// Las recomendaciones en texto plano (string) son el formato antiguo del
// backend: se siguen aceptando por si Vercel y Railway no se despliegan a la vez.
export type Insights = {
  summary: string;
  trending: string[];
  recommendations: ({ title: string; detail: string } | string)[];
};

export type Campaign = {
  id: string;
  targetCategory: string;
  minSignals: number;
  message: string;
};

export type MatchResult = {
  campaignId: string;
  matches: boolean;
  reason: string;
};

export const CATEGORIES = ['electronics', 'fashion', 'food', 'sports', 'home', 'other'] as const;
export type Category = typeof CATEGORIES[number];

/** Categoría -> nombre del contador de categoría en AegisState. */
export const CATEGORY_STATE_KEY: Record<Category, keyof AegisState> = {
  electronics: 'signalsElectronics', fashion: 'signalsFashion', food: 'signalsFood',
  sports: 'signalsSports', home: 'signalsHome', other: 'signalsOther',
};

export const SUBCATEGORIES = {
  electronics: ['mobile', 'tablet', 'computer', 'camera', 'audio', 'gaming'],
  fashion:     ['shoes', 'tops', 'bottoms', 'accessories', 'outerwear'],
  food:        ['groceries', 'restaurant', 'cafes', 'fastfood', 'localshops'],
  sports:      ['equipment', 'clothing', 'footwear', 'supplements'],
  home:        ['furniture', 'appliances', 'decor', 'tools'],
  other:       ['other'],
} as const;

export type Subcategory = typeof SUBCATEGORIES[Category][number];

// Mismo orden que el enum Subcategory del contrato (contract/aegis.compact) -
// el índice numérico que llega en un recibo escaneado se traduce con esto.
export const SUBCATEGORY_INDEX: readonly string[] = CATEGORIES.flatMap(c => SUBCATEGORIES[c]);

export type Lang = 'en' | 'es';

export const CATEGORY_LABELS: Record<Lang, Record<Category, string>> = {
  en: { electronics: 'Electronics', fashion: 'Fashion', food: 'Food', sports: 'Sports', home: 'Home', other: 'Other' },
  es: { electronics: 'Electrónica', fashion: 'Moda', food: 'Alimentación', sports: 'Deportes', home: 'Hogar', other: 'Otros' },
};

export const SUBCATEGORY_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    mobile: 'Mobile', tablet: 'Tablet', computer: 'Computer', camera: 'Camera', audio: 'Audio', gaming: 'Gaming',
    shoes: 'Shoes', tops: 'Tops', bottoms: 'Bottoms', accessories: 'Accessories', outerwear: 'Outerwear',
    groceries: 'Groceries', restaurant: 'Restaurants', cafes: 'Cafés', fastfood: 'Fast food', localshops: 'Local shops',
    equipment: 'Equipment', clothing: 'Clothing', footwear: 'Footwear', supplements: 'Supplements',
    furniture: 'Furniture', appliances: 'Appliances', decor: 'Decor', tools: 'Tools', other: 'Other',
  },
  es: {
    mobile: 'Móvil', tablet: 'Tablet', computer: 'Ordenador', camera: 'Cámara', audio: 'Audio', gaming: 'Videojuegos',
    shoes: 'Calzado', tops: 'Camisetas', bottoms: 'Pantalones', accessories: 'Accesorios', outerwear: 'Abrigos',
    groceries: 'Supermercado', restaurant: 'Restaurantes', cafes: 'Cafeterías', fastfood: 'Comida rápida', localshops: 'Tiendas locales',
    equipment: 'Equipamiento', clothing: 'Ropa', footwear: 'Calzado', supplements: 'Suplementos',
    furniture: 'Muebles', appliances: 'Electrodomésticos', decor: 'Decoración', tools: 'Herramientas', other: 'Otros',
  },
};

export const CATEGORY_ICONS: Record<Category, string> = {
  electronics: '💻', fashion: '👗', food: '🛒', sports: '⚽', home: '🏠', other: '📦',
};

export const SUBCATEGORY_ICONS: Record<string, string> = {
  mobile: '📱', tablet: '📟', computer: '🖥️', camera: '📷', audio: '🎧', gaming: '🎮',
  shoes: '👟', tops: '👕', bottoms: '👖', accessories: '👜', outerwear: '🧥',
  groceries: '🥦', restaurant: '🍽️', cafes: '☕', fastfood: '🍔', localshops: '🏪',
  equipment: '🏋️', clothing: '🩳', footwear: '⛸️', supplements: '💊',
  furniture: '🛋️', appliances: '🫧', decor: '🖼️', tools: '🔧',
  other: '📦',
};

// Dirección del backend. Cada persona que prueba el proyecto levanta el
// backend en su propia máquina, así que "localhost" apunta correctamente al
// suyo propio, sin importar si el frontend se sirve desde Vercel o en local.
// Cuando el backend pase a vivir en un servidor real, basta con fijar
// VITE_API_URL en el build de Vercel.
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/** Error de una petición al backend, con su código HTTP. */
export class RequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function handleJson<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const body = await r.text().catch(() => r.statusText);
    throw new RequestError(body || `Request failed (${r.status})`, r.status);
  }
  return r.json() as Promise<T>;
}

export type TimeRange = '7d' | '30d' | '90d' | '365d';

/** Contadores en texto, como los manda el backend: solo los que vienen al caso. */
export type Counts = Partial<Record<keyof AegisState, string>>;

/** Una transacción que cambió algún contador: lo que sumó a cada uno. */
export type Change = { height: number; timestamp: number; delta: Counts };

/** Serie de un periodo para las gráficas (GET /history, ver backend/src/series.ts). */
export type History = {
  range: TimeRange;
  /** Principio y final (el momento de la respuesta) del periodo, en ms. */
  from: number;
  to: number;
  /** Duración del periodo. */
  span: number;
  /** Despliegue del contrato; si es posterior al principio del periodo, la serie empieza ahí. */
  since: number | null;
  /** Señales acumuladas desde el principio del periodo, como [instante, señales]. Todas, como los contadores. */
  current: [number, number][];
  /** Lo mismo en el periodo anterior, en los mismos instantes; null si el contrato aún no existía. */
  previous: [number, number][] | null;
  /** Señales por contador en el periodo y en el anterior. */
  totals: { current: Counts; previous: Counts | null };
  /** De ellas, las de una carga de datos de demo en cada periodo (falsearían una comparación). */
  demo: { current: string; previous: string | null };
};

export async function getHistory(range: TimeRange): Promise<History> {
  return handleJson<History>(await fetch(`${API_BASE}/history?range=${range}`));
}

export async function getInsights(storeProfile?: string, lang: Lang = 'en', range: TimeRange = '7d'): Promise<Insights> {
  const params = new URLSearchParams({ lang, range });
  if (storeProfile) params.set('store', storeProfile);
  return handleJson<Insights>(await fetch(`${API_BASE}/insights?${params}`));
}

export async function postCampaign(data: Omit<Campaign, 'id'>): Promise<{ id: string }> {
  return handleJson<{ id: string }>(await fetch(`${API_BASE}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }));
}

export async function getMatch(id: string): Promise<MatchResult> {
  return handleJson<MatchResult>(await fetch(`${API_BASE}/match/${id}`));
}
