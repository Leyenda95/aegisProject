import type { AegisState } from './contract.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5-5';

export type Campaign = {
  id: string;
  targetCategory: string;
  minSignals: number;
  message: string;
};

export type Recommendation = {
  title: string;
  detail: string;
};

export type MarketInsights = {
  summary: string;
  trending: string[];
  recommendations: Recommendation[];
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
    groceries: 'Groceries', restaurant: 'Restaurants', cafes: 'Cafés', fastfood: 'Fast food', localshops: 'Local shops',
    equipment: 'Equipment', clothing: 'Clothing', footwear: 'Footwear', supplements: 'Supplements',
    furniture: 'Furniture', appliances: 'Appliances', decor: 'Decor', tools: 'Tools',
    signals: 'signals', total: 'TOTAL SIGNALS',
  },
  es: {
    electronics: 'Electrónica', fashion: 'Moda', food: 'Alimentación',
    sports: 'Deportes', home: 'Hogar', other: 'Otros',
    mobile: 'Móvil', tablet: 'Tablet', computer: 'Ordenador', camera: 'Cámara', audio: 'Audio', gaming: 'Videojuegos',
    shoes: 'Calzado', tops: 'Camisetas', bottoms: 'Pantalones', accessories: 'Accesorios', outerwear: 'Abrigos',
    groceries: 'Supermercado', restaurant: 'Restaurantes', cafes: 'Cafeterías', fastfood: 'Comida rápida', localshops: 'Tiendas locales',
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
  ${l.groceries}: ${s(state.signalsGroceries)} | ${l.restaurant}: ${s(state.signalsRestaurant)} | ${l.cafes}: ${s(state.signalsCafes)}
  ${l.fastfood}: ${s(state.signalsFastfood)} | ${l.localshops}: ${s(state.signalsLocalshops)}

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
      // Si el modelo rechaza la petición por sus filtros de seguridad, la
      // API la reintenta sola con otro modelo dentro de la misma llamada.
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({
      model: MODEL,
      // Sonnet 5.5 piensa antes de responder y ese razonamiento cuenta para
      // max_tokens: con 1024 podía cortarse el JSON a medias.
      max_tokens: 4000,
      // Esfuerzo bajo: piensa lo justo para elegir buenos consejos sin
      // disparar el coste ni el tiempo de respuesta.
      output_config: { effort: 'low' },
      fallbacks: 'default',
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as any;
  if (data.stop_reason === 'refusal') throw new Error('The model declined to answer');
  // Con el razonamiento activo, content[0] ya no es el texto (llegan antes
  // bloques "thinking"), así que hay que buscar el bloque de texto.
  const textBlock = (data.content as any[]).find(b => b.type === 'text');
  if (!textBlock) throw new Error('Empty response from model');
  const text = textBlock.text as string;
  return text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
}

const SECTOR_SUBCATS: Record<string, { keywords: string[]; subcats: (keyof typeof LABELS.es)[] }> = {
  fashion:     { keywords: ['moda','fashion','ropa','calzado','zapatos','textil','clothing','apparel','boutique'], subcats: ['shoes','tops','bottoms','accessories','outerwear'] },
  electronics: { keywords: ['electrónica','electronics','tecnología','tech','móviles','ordenadores','gadget'],    subcats: ['mobile','tablet','computer','camera','audio','gaming'] },
  food:        { keywords: ['alimentación','food','comida','restaurante','cocina','supermercado','grocery'],      subcats: ['groceries','restaurant','cafes','fastfood','localshops'] },
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

const CATEGORY_STATE_KEY: Record<string, keyof AegisState> = {
  electronics: 'signalsElectronics', fashion: 'signalsFashion', food: 'signalsFood',
  sports: 'signalsSports', home: 'signalsHome',
};

function subcategoryStateMap(state: AegisState): Record<string, bigint> {
  return {
    shoes: state.signalsShoes, tops: state.signalsTops, bottoms: state.signalsBottoms,
    accessories: state.signalsAccessories, outerwear: state.signalsOuterwear,
    mobile: state.signalsMobile, tablet: state.signalsTablet, computer: state.signalsComputer,
    camera: state.signalsCamera, audio: state.signalsAudio, gaming: state.signalsGaming,
    groceries: state.signalsGroceries, restaurant: state.signalsRestaurant,
    cafes: state.signalsCafes, fastfood: state.signalsFastfood, localshops: state.signalsLocalshops,
    equipment: state.signalsEquipment, clothing: state.signalsClothing,
    footwear: state.signalsFootwear, supplements: state.signalsSupplements,
    furniture: state.signalsFurniture, appliances: state.signalsAppliances,
    decor: state.signalsDecor, tools: state.signalsTools,
  };
}

/**
 * Igual que buildStateDescription pero recortada a la categoría del sector
 * detectado y sus subcategorías. Al modelo no le llegan las demás categorías
 * en absoluto, así que no puede hablar de ellas aunque se lo pidan, no basta
 * con instruirle a ignorarlas.
 */
function buildSectorStateDescription(state: AegisState, lang: string, sector: string): string {
  const l = LABELS[lang as keyof typeof LABELS] ?? LABELS.en;
  const s = (n: bigint) => n.toString();
  const stateMap = subcategoryStateMap(state);
  const rows = SECTOR_SUBCATS[sector].subcats
    .map(k => `  ${l[k as keyof typeof l]}: ${s(stateMap[k] ?? 0n)}`)
    .join('\n');
  const categoryTotal = state[CATEGORY_STATE_KEY[sector] as keyof AegisState];
  return `${(l[sector as keyof typeof l] as string).toUpperCase()} (${s(categoryTotal)} ${l.signals}):\n${rows}`;
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
    ? `This analysis is for a store that describes itself as: "${storeProfile}". Use this only to tailor which recommendations are relevant to them.`
    : null;

  let trendingRule = '';
  let stateDescription: string;
  let scopeRule = '';

  if (sector && SECTOR_SUBCATS[sector]) {
    const subkeys = SECTOR_SUBCATS[sector].subcats;
    const stateMap = subcategoryStateMap(state);
    const sorted = subkeys
      .map(k => ({ name: l[k as keyof typeof l] as string, count: Number(stateMap[k] ?? 0n) }))
      .sort((a, b) => b.count - a.count);
    const trendingData = sorted.map(e => `${e.name}: ${e.count}`).join('\n');
    trendingRule = `trending: use EXACTLY these entries in this exact order (already sorted for you):\n${trendingData}\nCopy them verbatim into the JSON array. Do NOT add or remove entries.`;
    stateDescription = buildSectorStateDescription(state, lang, sector);
    scopeRule = `\n- This store only sells ${l[sector as keyof typeof l]}. The data above is the only category you have, do not mention or compare it against other product categories.`;
  } else {
    trendingRule = `trending: list the top 6 subcategories by signal count (highest first). Format: "Name: N".`;
    stateDescription = buildStateDescription(state, lang);
  }

  const system = `You are Aegis, an experienced retail advisor talking face to face with a shop owner.
You read anonymous, aggregated data about what shoppers are buying and turn it into a few sharp, useful tips.
Always respond ONLY with valid JSON matching exactly: { "summary": string, "trending": string[], "recommendations": [{ "title": string, "detail": string }] }`;

  const user = `${storeContext ? storeContext + '\n\n' : ''}The numbers below show how many shoppers across the whole Aegis network recently bought in each category. They are not this store's own sales, the store has no data of its own here. Look at them and tell the owner what is worth doing:

${stateDescription}

Content rules:
- summary: TWO or THREE short sentences, max 60 words in total. Start with the most important takeaway for this store, said plainly. Then add the context that explains it: what is pulling the demand, what is falling behind, or what is coming with the season.
- ${trendingRule}
- recommendations: exactly 3 tips, the ones with the most impact. Each one has:
  - title: a short action, 3 to 7 words, starting with a verb (e.g. "Pon las zapatillas a la vista").
  - detail: ONE sentence, max 25 words, saying why or how. Use a number from the data only if it really helps.
- Take into account the time of year and what is coming next: ${getSeasonContext(lang)}${scopeRule}
- Never describe the numbers as this store's own sales or activity. They are what shoppers in general are buying.

Style rules (very important):
- Write like a person who knows retail talking to a friend who owns a shop: natural, direct, everyday words. Use "tú" in Spanish.
- No jargon or technical terms: never say "signals", "señales", "data", "ZK", "network", "blockchain", "KPI", "engagement", "insight", "segment", "conversion", "omnichannel".
- No corporate filler words like "optimize", "leverage", "boost", "strategy", "synergy", "potenciar", "aprovechar", "optimizar", "estrategia", "capitalizar", "impulsar".
- No slashes, no dashes of any kind, no parentheses, no semicolons, no colons inside sentences, no emojis, no bold or markdown.
- No vague advice. Every tip must be something the owner could do this week.
- Respond entirely in ${lang === 'es' ? 'Spanish from Spain. Do not use English words for category or product names.' : 'English.'}
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
