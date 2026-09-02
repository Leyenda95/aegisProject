import type { AegisState } from './contract.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

export type Campaign = {
  id: string;
  targetCategory: string;
  minSignals: number;
  message: string;
};

export type MarketInsights = {
  summary: string;
  trending: string[];
  recommendations: string[];
};

export type CampaignMatch = {
  campaignId: bigint;
  matches: boolean;
  reason: string;
};

const LABELS = {
  en: {
    electronics: 'Electronics', fashion: 'Fashion', food: 'Food',
    sports: 'Sports', home: 'Home', other: 'Other',
    mobile: 'Mobile', tablet: 'Tablet', computer: 'Computer', camera: 'Camera', audio: 'Audio', gaming: 'Gaming',
    shoes: 'Shoes', tops: 'Tops', bottoms: 'Bottoms', accessories: 'Accessories', outerwear: 'Outerwear',
    groceries: 'Groceries', restaurant: 'Restaurant', drinks: 'Drinks', snacks: 'Snacks',
    equipment: 'Equipment', clothing: 'Clothing', footwear: 'Footwear', supplements: 'Supplements',
    furniture: 'Furniture', appliances: 'Appliances', decor: 'Decor', tools: 'Tools',
    signals: 'signals', total: 'TOTAL SIGNALS',
  },
  es: {
    electronics: 'Electrónica', fashion: 'Moda', food: 'Alimentación',
    sports: 'Deportes', home: 'Hogar', other: 'Otros',
    mobile: 'Móvil', tablet: 'Tablet', computer: 'Ordenador', camera: 'Cámara', audio: 'Audio', gaming: 'Videojuegos',
    shoes: 'Calzado', tops: 'Camisetas', bottoms: 'Pantalones', accessories: 'Accesorios', outerwear: 'Abrigos',
    groceries: 'Supermercado', restaurant: 'Restauración', drinks: 'Bebidas', snacks: 'Snacks',
    equipment: 'Equipamiento', clothing: 'Ropa deportiva', footwear: 'Calzado deportivo', supplements: 'Suplementos',
    furniture: 'Muebles', appliances: 'Electrodomésticos', decor: 'Decoración', tools: 'Herramientas',
    signals: 'señales', total: 'TOTAL SEÑALES',
  },
};

function buildStateDescription(state: AegisState, lang = 'en'): string {
  const l = LABELS[lang as keyof typeof LABELS] ?? LABELS.en;
  const s = (n: bigint) => n.toString();
  return `
${l.total}: ${s(state.totalSignals)}

${l.electronics.toUpperCase()} (${s(state.signalsElectronics)} ${l.signals}):
  ${l.mobile}: ${s(state.signalsMobile)} | ${l.tablet}: ${s(state.signalsTablet)} | ${l.computer}: ${s(state.signalsComputer)}
  ${l.camera}: ${s(state.signalsCamera)} | ${l.audio}: ${s(state.signalsAudio)} | ${l.gaming}: ${s(state.signalsGaming)}

${l.fashion.toUpperCase()} (${s(state.signalsFashion)} ${l.signals}):
  ${l.shoes}: ${s(state.signalsShoes)} | ${l.tops}: ${s(state.signalsTops)} | ${l.bottoms}: ${s(state.signalsBottoms)}
  ${l.accessories}: ${s(state.signalsAccessories)} | ${l.outerwear}: ${s(state.signalsOuterwear)}

${l.food.toUpperCase()} (${s(state.signalsFood)} ${l.signals}):
  ${l.groceries}: ${s(state.signalsGroceries)} | ${l.restaurant}: ${s(state.signalsRestaurant)}
  ${l.drinks}: ${s(state.signalsDrinks)} | ${l.snacks}: ${s(state.signalsSnacks)}

${l.sports.toUpperCase()} (${s(state.signalsSports)} ${l.signals}):
  ${l.equipment}: ${s(state.signalsEquipment)} | ${l.clothing}: ${s(state.signalsClothing)}
  ${l.footwear}: ${s(state.signalsFootwear)} | ${l.supplements}: ${s(state.signalsSupplements)}

${l.home.toUpperCase()} (${s(state.signalsHome)} ${l.signals}):
  ${l.furniture}: ${s(state.signalsFurniture)} | ${l.appliances}: ${s(state.signalsAppliances)}
  ${l.decor}: ${s(state.signalsDecor)} | ${l.tools}: ${s(state.signalsTools)}

${l.other.toUpperCase()}: ${s(state.signalsOther)} ${l.signals}
`.trim();
}

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as any;
  const text = data.content[0].text as string;
  return text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
}

const SECTOR_SUBCATS: Record<string, { keywords: string[]; subcats: (keyof typeof LABELS.es)[] }> = {
  fashion:     { keywords: ['moda','fashion','ropa','calzado','zapatos','textil','clothing','apparel','boutique'], subcats: ['shoes','tops','bottoms','accessories','outerwear'] },
  electronics: { keywords: ['electrónica','electronics','tecnología','tech','móviles','ordenadores','gadget'],    subcats: ['mobile','tablet','computer','camera','audio','gaming'] },
  food:        { keywords: ['alimentación','food','comida','restaurante','cocina','supermercado','grocery'],      subcats: ['groceries','restaurant','drinks','snacks'] },
  sports:      { keywords: ['deporte','sports','fitness','gym','gimnasio','atletismo'],                          subcats: ['equipment','clothing','footwear','supplements'] },
  home:        { keywords: ['hogar','home','decoración','muebles','casa','furniture'],                           subcats: ['furniture','appliances','decor','tools'] },
};

function detectSector(profile: string): string | null {
  const lower = profile.toLowerCase();
  for (const [sector, { keywords }] of Object.entries(SECTOR_SUBCATS)) {
    if (keywords.some(k => lower.includes(k))) return sector;
  }
  return null;
}

function getSeasonContext(lang: string): string {
  const date = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return lang === 'es'
    ? `Fecha actual: ${date}.`
    : `Current date: ${date}.`;
}

export async function generateInsights(state: AegisState, storeProfile?: string, lang = 'en'): Promise<MarketInsights> {
  const sector = storeProfile ? detectSector(storeProfile) : null;
  const l = LABELS[lang as keyof typeof LABELS] ?? LABELS.en;

  const storeContext = storeProfile
    ? `This analysis is for a store that describes itself as: "${storeProfile}".`
    : null;

  let trendingData = '';
  let trendingRule = '';
  if (sector && SECTOR_SUBCATS[sector]) {
    const subkeys = SECTOR_SUBCATS[sector].subcats;
    const stateMap: Record<string, bigint> = {
      shoes: state.signalsShoes, tops: state.signalsTops, bottoms: state.signalsBottoms,
      accessories: state.signalsAccessories, outerwear: state.signalsOuterwear,
      mobile: state.signalsMobile, tablet: state.signalsTablet, computer: state.signalsComputer,
      camera: state.signalsCamera, audio: state.signalsAudio, gaming: state.signalsGaming,
      groceries: state.signalsGroceries, restaurant: state.signalsRestaurant,
      drinks: state.signalsDrinks, snacks: state.signalsSnacks,
      equipment: state.signalsEquipment, clothing: state.signalsClothing,
      footwear: state.signalsFootwear, supplements: state.signalsSupplements,
      furniture: state.signalsFurniture, appliances: state.signalsAppliances,
      decor: state.signalsDecor, tools: state.signalsTools,
    };
    const sorted = subkeys
      .map(k => ({ name: l[k as keyof typeof l] as string, count: Number(stateMap[k] ?? 0n) }))
      .sort((a, b) => b.count - a.count);
    trendingData = sorted.map(e => `${e.name}: ${e.count}`).join('\n');
    trendingRule = `trending: use EXACTLY these entries in this exact order (already sorted for you):\n${trendingData}\nCopy them verbatim into the JSON array. Do NOT add or remove entries.`;
  } else {
    trendingRule = `trending: list the top 6 subcategories by signal count (highest first). Format: "Name: N".`;
  }

  const system = `You are Aegis, a market intelligence agent for retail stores.
You work with ZK aggregated purchase signals from Midnight, fully anonymous, no individual data visible.
Always respond ONLY with valid JSON matching exactly: { "summary": string, "trending": string[], "recommendations": string[] }`;

  const user = `${storeContext ? storeContext + '\n\n' : ''}Analyze this market data and generate intelligence:

${buildStateDescription(state, lang)}

Rules:
- summary: 2-3 sentences focused on what matters most to this store. Be specific, not generic.
- ${trendingRule}
- recommendations: 4-5 concrete, actionable recommendations tailored to this store's product range. Reference actual numbers from the data. Take into account the current season and upcoming seasonal trends: ${getSeasonContext(lang)}
- Respond entirely in ${lang === 'es' ? 'Spanish. Do not use English words for category or product names.' : 'English.'}.
- Do not include any text outside the JSON.`;

  const text = await callClaude(system, user);
  return JSON.parse(text) as MarketInsights;
}

export async function matchCampaign(
  campaign: Campaign,
  state: AegisState,
): Promise<CampaignMatch> {
  const categorySignals: Record<string, bigint> = {
    electronics: state.signalsElectronics,
    fashion: state.signalsFashion,
    food: state.signalsFood,
    sports: state.signalsSports,
    home: state.signalsHome,
    other: state.signalsOther,
  };

  const currentSignals = categorySignals[campaign.targetCategory] ?? 0n;
  const meetsThreshold = currentSignals >= BigInt(campaign.minSignals);

  const system = `You are Aegis's campaign matching agent.
Explain why a campaign is active or inactive given the current market state.
Respond in JSON: { "reason": string }`;

  const user = `Campaign to evaluate:
- Target category: ${campaign.targetCategory}
- Message: ${campaign.message}
- Minimum signal threshold required: ${campaign.minSignals}

${buildStateDescription(state)}

Current signals in target category (${campaign.targetCategory}): ${currentSignals}
Meets threshold? ${meetsThreshold ? 'Yes' : 'No'}

Evaluate whether this campaign should activate and explain the reasoning.`;

  const text = await callClaude(system, user);
  const parsed = JSON.parse(text) as { reason: string };
  return { campaignId: campaign.id as any, matches: meetsThreshold, reason: parsed.reason as string };
}
