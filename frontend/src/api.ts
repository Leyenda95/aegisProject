export type AegisState = {
  signalsElectronics: string; signalsFashion: string; signalsFood: string;
  signalsSports: string; signalsHome: string; signalsOther: string;
  signalsMobile: string; signalsTablet: string; signalsComputer: string;
  signalsCamera: string; signalsAudio: string; signalsGaming: string;
  signalsShoes: string; signalsTops: string; signalsBottoms: string;
  signalsAccessories: string; signalsOuterwear: string;
  signalsGroceries: string; signalsRestaurant: string; signalsDrinks: string; signalsSnacks: string;
  signalsEquipment: string; signalsClothing: string; signalsFootwear: string; signalsSupplements: string;
  signalsFurniture: string; signalsAppliances: string; signalsDecor: string; signalsTools: string;
  totalSignals: string; campaignCount: string;
};

export type Insights = {
  summary: string;
  trending: string[];
  recommendations: string[];
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

export const SUBCATEGORIES = {
  electronics: ['mobile', 'tablet', 'computer', 'camera', 'audio', 'gaming'],
  fashion:     ['shoes', 'tops', 'bottoms', 'accessories', 'outerwear'],
  food:        ['groceries', 'restaurant', 'drinks', 'snacks'],
  sports:      ['equipment', 'clothing', 'footwear', 'supplements'],
  home:        ['furniture', 'appliances', 'decor', 'tools'],
  other:       ['other'],
} as const;

export type Subcategory = typeof SUBCATEGORIES[Category][number];

export type Lang = 'en' | 'es';

export const CATEGORY_LABELS: Record<Lang, Record<Category, string>> = {
  en: { electronics: 'Electronics', fashion: 'Fashion', food: 'Food', sports: 'Sports', home: 'Home', other: 'Other' },
  es: { electronics: 'Electrónica', fashion: 'Moda', food: 'Alimentación', sports: 'Deportes', home: 'Hogar', other: 'Otros' },
};

export const SUBCATEGORY_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    mobile: 'Mobile', tablet: 'Tablet', computer: 'Computer', camera: 'Camera', audio: 'Audio', gaming: 'Gaming',
    shoes: 'Shoes', tops: 'Tops', bottoms: 'Bottoms', accessories: 'Accessories', outerwear: 'Outerwear',
    groceries: 'Groceries', restaurant: 'Restaurant', drinks: 'Drinks', snacks: 'Snacks',
    equipment: 'Equipment', clothing: 'Clothing', footwear: 'Footwear', supplements: 'Supplements',
    furniture: 'Furniture', appliances: 'Appliances', decor: 'Decor', tools: 'Tools', other: 'Other',
  },
  es: {
    mobile: 'Móvil', tablet: 'Tablet', computer: 'Ordenador', camera: 'Cámara', audio: 'Audio', gaming: 'Videojuegos',
    shoes: 'Calzado', tops: 'Camisetas', bottoms: 'Pantalones', accessories: 'Accesorios', outerwear: 'Abrigos',
    groceries: 'Supermercado', restaurant: 'Restauración', drinks: 'Bebidas', snacks: 'Snacks',
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
  groceries: '🥦', restaurant: '🍽️', drinks: '🥤', snacks: '🍿',
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

async function handleJson<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const body = await r.text().catch(() => r.statusText);
    throw new Error(body || `Request failed (${r.status})`);
  }
  return r.json() as Promise<T>;
}

export async function getState(): Promise<AegisState> {
  return handleJson<AegisState>(await fetch(`${API_BASE}/state`));
}

export async function getInsights(storeProfile?: string, lang: Lang = 'en'): Promise<Insights> {
  const params = new URLSearchParams({ lang });
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
