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

const CAT_KEY: Record<Category, keyof AegisState> = {
  electronics: 'signalsElectronics', fashion: 'signalsFashion', food: 'signalsFood',
  sports: 'signalsSports', home: 'signalsHome', other: 'signalsOther',
};

function subcatKey(sub: string): keyof AegisState {
  return ('signals' + sub[0].toUpperCase() + sub.slice(1)) as keyof AegisState;
}

// Sin backend todavía: el estado agregado vive en memoria del propio cliente,
// sembrado con datos de ejemplo para que la interfaz se vea representativa.
const SEED_SUBCATEGORIES: Record<string, number> = {
  mobile: 312, tablet: 187, computer: 245, camera: 98, audio: 201, gaming: 278,
  shoes: 334, tops: 289, bottoms: 198, accessories: 145, outerwear: 112,
  groceries: 421, restaurant: 356, drinks: 267, snacks: 189,
  equipment: 134, clothing: 176, footwear: 155, supplements: 93,
  furniture: 88, appliances: 121, decor: 167, tools: 74,
  other: 63,
};

function buildInitialState(): AegisState {
  const state = {} as AegisState;
  for (const [sub, value] of Object.entries(SEED_SUBCATEGORIES)) {
    state[subcatKey(sub)] = String(value);
  }
  let total = 0;
  for (const cat of CATEGORIES) {
    const subs = SUBCATEGORIES[cat] as readonly string[];
    const catTotal = subs.reduce((sum, sub) => sum + (SEED_SUBCATEGORIES[sub] ?? 0), 0);
    state[CAT_KEY[cat]] = String(catTotal);
    total += catTotal;
  }
  state.totalSignals = String(total);
  state.campaignCount = '0';
  return state;
}

const mockState: AegisState = buildInitialState();
const campaignsStore = new Map<string, Omit<Campaign, 'id'>>();
let nextCampaignId = 1;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getState(): Promise<AegisState> {
  await delay(150);
  return { ...mockState };
}

export async function getInsights(storeProfile?: string, lang: Lang = 'en'): Promise<Insights> {
  await delay(500);
  const ranked = CATEGORIES
    .map(cat => [cat, Number(mockState[CAT_KEY[cat]] ?? 0)] as [Category, number])
    .sort((a, b) => b[1] - a[1]);
  const [topCat] = ranked[0];
  const [risingCat] = ranked[ranked.length - 2] ?? ranked[ranked.length - 1];
  const labels = CATEGORY_LABELS[lang];

  const summary = lang === 'es'
    ? `Con ${mockState.totalSignals} señales agregadas, ${labels[topCat]} concentra la mayor actividad del mercado${storeProfile ? ` para un perfil como "${storeProfile}"` : ''}.`
    : `Across ${mockState.totalSignals} aggregated signals, ${labels[topCat]} concentrates the highest market activity${storeProfile ? ` for a profile like "${storeProfile}"` : ''}.`;

  const trending = ranked.slice(0, 3).map(([cat]) => labels[cat]);

  const recommendations = lang === 'es'
    ? [
        `Prioriza campañas dirigidas a ${labels[topCat]}, la categoría con más señales.`,
        `Explora ${labels[risingCat]}: tiene margen de crecimiento respecto al resto.`,
      ]
    : [
        `Prioritise campaigns targeting ${labels[topCat]}, the category with the most signals.`,
        `Explore ${labels[risingCat]}: it has room to grow relative to the rest.`,
      ];

  return { summary, trending, recommendations };
}

export async function postCampaign(data: Omit<Campaign, 'id'>): Promise<{ id: string }> {
  await delay(150);
  const id = String(nextCampaignId++);
  campaignsStore.set(id, data);
  mockState.campaignCount = String(campaignsStore.size);
  return { id };
}

export async function getMatch(id: string): Promise<MatchResult> {
  await delay(150);
  const campaign = campaignsStore.get(id);
  if (!campaign) return { campaignId: id, matches: false, reason: 'Unknown campaign' };
  const signals = Number(mockState[CAT_KEY[campaign.targetCategory as Category]] ?? 0);
  const matches = signals >= campaign.minSignals;
  const reason = matches
    ? `${signals} signals recorded (≥ ${campaign.minSignals} required)`
    : `${signals} signals recorded (< ${campaign.minSignals} required)`;
  return { campaignId: id, matches, reason };
}
