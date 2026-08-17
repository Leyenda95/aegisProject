import type { Lang } from './api.ts';

const en = {
  // Header
  tagline: 'Private market intelligence',
  tabStore: 'Store',

  // StoreView — signals
  signalsTitle: 'Aggregated signals on Midnight',
  signalsTotal: (n: number) => `${n} total`,
  signalsRefresh: 'updates every 10s',

  // StoreView — insights
  insightsTitle: 'Market Intelligence',
  insightsPlaceholder: 'Describe your store (e.g. urban fashion for young people)',
  insightsGenerate: 'Generate insights',
  insightsGenerating: 'Analyzing...',
  insightsEmpty: 'Describe your store and click the button to let the agent analyze the current market.',
  insightsTrending: 'TRENDING',
  insightsRecommendations: 'RECOMMENDATIONS',

  // StoreView — campaign
  campaignTitle: 'Create campaign',
  campaignTargetLabel: 'Target category',
  campaignMinLabel: 'Minimum signals required',
  campaignMessageLabel: 'Campaign message',
  campaignMessagePlaceholder: 'e.g. 20% off all laptops this weekend',
  campaignSubmit: 'Register campaign',
  campaignSubmitting: 'Registering...',
  campaignListTitle: 'Registered campaigns',
  campaignMinSuffix: (n: number) => `min. ${n} signals`,
  campaignId: (id: string) => `ID #${id}`,
  campaignActive: 'Active',
  campaignNoMatch: '○ No match',
  campaignRefresh: '↻ Refresh',
};

const es: typeof en = {
  tagline: 'Inteligencia de mercado privada',
  tabStore: 'Tienda',

  signalsTitle: 'Señales agregadas en Midnight',
  signalsTotal: (n: number) => `${n} en total`,
  signalsRefresh: 'se actualiza cada 10s',

  insightsTitle: 'Inteligencia de mercado',
  insightsPlaceholder: 'Describe tu tienda (ej: moda urbana para jóvenes)',
  insightsGenerate: 'Generar informe',
  insightsGenerating: 'Analizando...',
  insightsEmpty: 'Describe tu tienda y pulsa el botón para que el agente analice el estado actual del mercado.',
  insightsTrending: 'TENDENCIAS',
  insightsRecommendations: 'RECOMENDACIONES',

  campaignTitle: 'Crear campaña',
  campaignTargetLabel: 'Categoría objetivo',
  campaignMinLabel: 'Señales mínimas requeridas',
  campaignMessageLabel: 'Mensaje de campaña',
  campaignMessagePlaceholder: 'ej: 20% de descuento en portátiles este fin de semana',
  campaignSubmit: 'Registrar campaña',
  campaignSubmitting: 'Registrando...',
  campaignListTitle: 'Campañas registradas',
  campaignMinSuffix: (n: number) => `mín. ${n} señales`,
  campaignId: (id: string) => `ID #${id}`,
  campaignActive: 'Activa',
  campaignNoMatch: '○ Sin coincidencia',
  campaignRefresh: '↻ Actualizar',
};

export const T: Record<Lang, typeof en> = { en, es };
