import type { Lang } from './api.ts';

const en = {
  // Header
  tagline: 'Private market intelligence',
  tabStore: 'Store',
  tabUser: 'User',

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

  // UserView
  userTitle: 'User device',
  userSubtitle: 'Select what you bought. Your signal is published anonymously, nobody sees who you are or how much you spent.',
  userStep1: 'Select a category',
  userStep2: 'Select a subcategory',
  userSubmit: 'Contribute anonymous signal →',
  userSubmitting: 'Submitting...',
  userPrivacy: 'Privacy guaranteed:',
  userPrivacyDetail: 'Only the subcategory is published on-chain. No identity, no amount, no store.',
  userSentTitle: 'Signal published on Midnight',
  userSentDetail: 'Your signal has been added to the aggregate.',

  // Profile tab
  profileTab: 'My profile',
  contributeTab: 'Contribute',
  profilePrivateBanner: 'Only visible on your device',
  profilePrivateSub: 'This data never leaves your phone. Zero-knowledge proof sent to the network.',
  profileStatPurchases: 'Purchases',
  profileStatSpent: 'This month',
  profileStatTopCat: 'Top category',
  profileBreakdown: 'Spending by category',
  profileReceipts: 'Recent receipts',
  profileYourData: 'Your data (local)',
  profileWhatMidnightSees: 'What Midnight sees',
  profileAnonymous: 'No identity · No amount · No store',
};

const es: typeof en = {
  tagline: 'Inteligencia de mercado privada',
  tabStore: 'Tienda',
  tabUser: 'Usuario',

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

  userTitle: 'Dispositivo de usuario',
  userSubtitle: 'Selecciona lo que has comprado. Tu señal se publica de forma anónima, nadie ve quién eres ni cuánto has gastado.',
  userStep1: 'Selecciona una categoría',
  userStep2: 'Selecciona una subcategoría',
  userSubmit: 'Contribuir señal anónima →',
  userSubmitting: 'Enviando...',
  userPrivacy: 'Privacidad garantizada:',
  userPrivacyDetail: 'Solo la subcategoría se publica on-chain. Sin identidad, sin importe, sin tienda.',
  userSentTitle: 'Señal publicada en Midnight',
  userSentDetail: 'Tu señal se ha añadido al agregado.',

  // Profile tab
  profileTab: 'Mi perfil',
  contributeTab: 'Contribuir',
  profilePrivateBanner: 'Solo visible en tu dispositivo',
  profilePrivateSub: 'Estos datos nunca salen de tu móvil. Se envía una prueba ZK anónima a la red.',
  profileStatPurchases: 'Compras',
  profileStatSpent: 'Este mes',
  profileStatTopCat: 'Categoría top',
  profileBreakdown: 'Gasto por categoría',
  profileReceipts: 'Últimas compras',
  profileYourData: 'Tus datos (local)',
  profileWhatMidnightSees: 'Lo que Midnight ve',
  profileAnonymous: 'Sin identidad · Sin importe · Sin tienda',
};

export const T: Record<Lang, typeof en> = { en, es };
