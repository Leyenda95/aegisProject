import { test, expect, type Page } from '@playwright/test';
import { CONTRACT_ADDRESS } from '../src/chainConfig.ts';

// Recorre la demo y captura cada pantalla, en tema claro y oscuro (ver
// playwright.config.ts). El backend va simulado con datos fijos y el reloj
// congelado, para que dos pasadas sobre el mismo código den exactamente la
// misma imagen: cualquier diferencia es un cambio real de la interfaz.

const API = 'http://localhost:3001';
const NOW = new Date('2026-10-23T10:00:00+02:00');

// Contadores del contrato: los mismos que siembra "Cargar datos demo".
const SUBCATEGORIES: Record<string, Record<string, number>> = {
  electronics: { mobile: 312, tablet: 187, computer: 245, camera: 98, audio: 201, gaming: 278 },
  fashion: { shoes: 334, tops: 889, bottoms: 798, accessories: 345, outerwear: 212 },
  food: { groceries: 921, restaurant: 356, cafes: 267, fastfood: 189, localshops: 150 },
  sports: { equipment: 134, clothing: 276, footwear: 355, supplements: 193 },
  home: { furniture: 88, appliances: 121, decor: 167, tools: 74 },
  other: { other: 63 },
};

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const STATE: Record<string, string> = { campaignCount: '0', isSeeded: '1' };
let total = 0;
for (const [category, subs] of Object.entries(SUBCATEGORIES)) {
  const sum = Object.values(subs).reduce((a, b) => a + b, 0);
  STATE[`signals${cap(category)}`] = String(sum);
  for (const [sub, n] of Object.entries(subs)) STATE[`signals${cap(sub)}`] = String(n);
  total += sum;
}
STATE.totalSignals = String(total);

// Lo que sella la tienda al cobrar dos pares de calzado (subcategoría 6, shoes).
const RECEIPT = {
  lines: [{ subcategory: 6, qty: 2, amount: '21800' }],
  timestamp: String(NOW.getTime()),
  nonce: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
};

const INSIGHTS = {
  summary: 'La moda y la alimentación concentran más de la mitad de las señales de la última semana. Las camisetas y los pantalones tiran de la moda, y el supermercado sigue siendo la compra más repetida.',
  trending: ['Camisetas', 'Supermercado', 'Pantalones'],
  recommendations: [
    { title: 'Refuerza los básicos de temporada', detail: 'Las camisetas suben semana a semana: amplía tallas y colores antes del fin de semana.' },
    { title: 'Combina moda y calzado', detail: 'Quien compra pantalones también busca calzado: prueba un descuento por llevarse los dos.' },
    { title: 'Aprovecha el tirón del supermercado', detail: 'Es la categoría con más compras repetidas: un programa de puntos fidelizaría ese tráfico.' },
  ],
};

// Historial del contrato para /history: desplegado hace 50 días (como el de
// Preprod), con la carga de demo (STATE) una hora después, más señales de
// día que de noche y algo más de actividad cada semana.
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const DEPLOYED = NOW.getTime() - 50 * DAY;
const SEEDED_AT = DEPLOYED + HOUR;
const HOURLY: number[] = [0];
for (let t = DEPLOYED; t < NOW.getTime(); t += HOUR) {
  const daytime = 2 + 1.5 * Math.sin(((new Date(t).getUTCHours() - 9) / 24) * 2 * Math.PI);
  const growth = 1 + ((t - DEPLOYED) / (50 * DAY)) * 0.3;
  HOURLY.push(HOURLY[HOURLY.length - 1] + Math.round(daytime * growth));
}
const demoAt = (t: number) => (t >= SEEDED_AT ? Number(STATE.totalSignals) : 0);
const activityAt = (t: number) => (t < DEPLOYED ? 0 : HOURLY[Math.min(HOURLY.length - 1, Math.floor((t - DEPLOYED) / HOUR))]) + demoAt(t);

// Reparto por categoría en el periodo y en el anterior: unas suben y otras bajan.
const SHARES_NOW: Record<string, number> = { Fashion: 0.29, Food: 0.25, Electronics: 0.17, Sports: 0.14, Home: 0.09, Other: 0.06 };
const SHARES_BEFORE: Record<string, number> = { Fashion: 0.26, Food: 0.27, Electronics: 0.18, Sports: 0.12, Home: 0.11, Other: 0.06 };
const split = (n: number, shares: Record<string, number>) => ({
  ...Object.fromEntries(Object.entries(shares).map(([category, share]) => [`signals${category}`, String(Math.round(n * share))])),
  totalSignals: String(n),
});

/** Lo mismo que calcula backend/src/series.ts, sobre el historial inventado. */
function historyFor(range: string) {
  const span = ({ '7d': 7, '30d': 30, '90d': 90, '365d': 365 } as Record<string, number>)[range] * DAY;
  const now = NOW.getTime();
  const start = Math.max(DEPLOYED, now - span);
  const step = [HOUR, 6 * HOUR, DAY, 3 * DAY].find(s => (now - start) / s <= 170) ?? 3 * DAY;
  const gridEnd = Math.floor(now / step) * step;
  const from = DEPLOYED > gridEnd - span ? Math.floor(DEPLOYED / step) * step : gridEnd - span;
  const times: number[] = [];
  for (let t = from; t <= gridEnd; t += step) times.push(t);
  if (now > gridEnd) times.push(now);
  const current = times.map(t => [t, activityAt(t) - activityAt(from)]);
  const previous = DEPLOYED <= from - span
    ? times.map(t => [t, activityAt(Math.min(t - span, from)) - activityAt(from - span)])
    : null;
  return {
    range, from, to: now, span, since: DEPLOYED, current, previous,
    totals: {
      current: split(current[current.length - 1][1], SHARES_NOW),
      previous: previous ? split(previous[previous.length - 1][1], SHARES_BEFORE) : null,
    },
    demo: {
      current: String(demoAt(now) - demoAt(from)),
      previous: previous ? String(demoAt(from) - demoAt(from - span)) : null,
    },
  };
}

// Últimas señales que manda /events al conectarse, de la más nueva a la más
// vieja: hace cuántos segundos y qué sumó a cada contador.
const RECENT = ([
  [4, { signalsTops: '2', signalsFashion: '2', totalSignals: '2' }],
  [70, { signalsGroceries: '1', signalsCafes: '2', signalsFood: '3', totalSignals: '3' }],
  [5 * 60, { signalsAudio: '1', signalsElectronics: '1', totalSignals: '1' }],
  [12 * 60, { signalsFurniture: '1', signalsDecor: '3', signalsHome: '4', totalSignals: '4' }],
  [40 * 60, { signalsOther: '1', totalSignals: '1' }],
  [2 * 3600, { signalsShoes: '1', signalsFashion: '1', totalSignals: '1' }],
] as const).map(([secondsAgo, delta], i) => ({ height: 900_000 - i * 7, timestamp: NOW.getTime() - secondsAgo * 1000, delta }));

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Headers': '*',
};

/** Con `fresh`, un contrato recién desplegado: sin tienda registrada ni datos de demo. */
async function mockBackend(page: Page, { fresh = false } = {}) {
  const state = fresh ? { ...STATE, isSeeded: '0' } : STATE;
  await page.route(`${API}/**`, async route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers: CORS, json: body });
    const url = new URL(route.request().url());
    switch (url.pathname) {
      case '/state': return json(state);
      case '/history': return json(historyFor(url.searchParams.get('range') ?? '7d'));
      // El estado y las últimas señales, y la conexión se cierra. El navegador
      // no volverá a conectar en 10 minutos (retry), así que el directo sigue
      // encendido durante toda la prueba.
      case '/events': return route.fulfill({
        headers: { ...CORS, 'Content-Type': 'text/event-stream' },
        body: `retry: 600000\n\nevent: snapshot\ndata: ${JSON.stringify({
          contractAddress: CONTRACT_ADDRESS, height: 900_000, timestamp: NOW.getTime(), state, recent: fresh ? [] : RECENT,
        })}\n\n`,
      });
      case '/sponsor-status': return json({ available: true });
      case '/store-registered': return json({ registered: !fresh });
      case '/receipt-status': return json({ sealed: true, used: false });
      case '/attest-receipt': return json({ receipt: RECEIPT, commitmentHex: 'ab'.repeat(32), sponsored: true });
      case '/build-tx/signal': return json({ sponsored: true });
      case '/insights': return json(INSIGHTS);
      default: return json({ error: 'Not found' }, 404);
    }
  });
}

async function open(page: Page, theme: 'light' | 'dark', { fresh = false, path = '/' } = {}) {
  await page.clock.setFixedTime(NOW);
  await page.addInitScript(t => {
    localStorage.setItem('aegis-theme', t);
    localStorage.setItem('aegis-lang', 'es');
  }, theme);
  await mockBackend(page, { fresh });
  await page.goto(path);
}

/** Dos wallets de Midnight instaladas (Lace y 1AM), que aceptan la conexión sin preguntar. */
async function mockWallets(page: Page) {
  await page.addInitScript(() => {
    const api = {
      getUnshieldedAddress: async () => ({ unshieldedAddress: 'mn_addr_preprod1demo00000000000000000000000000000a1b2c3' }),
      balanceUnsealedTransaction: async (tx: string) => ({ tx }),
      submitTransaction: async () => {},
    };
    const wallet = (name: string) => ({ name, icon: '', rdns: `io.${name}`, apiVersion: '4.0.0', connect: async () => api });
    (window as unknown as { midnight: unknown }).midnight = { lace: wallet('lace'), '1am': wallet('1am') };
  });
}

/** Pasa la portada y espera a que la cinta tenga los contadores. */
async function enter(page: Page) {
  await page.getByRole('button', { name: 'Explore' }).click();
  await expect(page.getByRole('button', { name: 'Explore' })).toHaveCount(0);
  await expect(page.getByText(STATE.totalSignals, { exact: true }).first()).toBeVisible();
}

/**
 * Deja la página y todo lo que tenga scroll propio (la cinta, p. ej.) en su
 * posición inicial (si no, la cabecera y la cesta, que son fijas, salen a la
 * altura a la que se hubiera desplazado la página, y la cinta movida) y
 * espera a fuentes e imágenes, también las de carga diferida.
 */
async function settle(page: Page) {
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    for (const el of document.querySelectorAll('*')) {
      if (el.scrollLeft) el.scrollLeft = 0;
      if (el.scrollTop) el.scrollTop = 0;
    }
    for (const img of document.querySelectorAll('img')) img.loading = 'eager';
    await Promise.all([...document.images].map(img => img.complete
      ? null
      : new Promise(resolve => { img.onload = img.onerror = resolve; })));
    await document.fonts.ready;
  });
}

// expect.soft: si una foto no coincide, el recorrido sigue y se comparan
// también las siguientes, así un cambio enseña todo lo que toca de una vez.
async function shot(page: Page, name: string, { fullPage = true, threshold }: { fullPage?: boolean; threshold?: number } = {}) {
  await settle(page);
  await expect.soft(page).toHaveScreenshot(`${name}.png`, { fullPage, threshold });
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(theme, () => {
    test('portada', async ({ page }) => {
      await open(page, theme);
      // El logo enorme y translúcido de la portada sale en cada pasada con
      // variaciones mínimas de color (cientos de píxeles casi iguales): aquí
      // se toleran los cambios de color pequeños, como hace Playwright por defecto.
      await shot(page, `${theme}-portada`, { fullPage: false, threshold: 0.2 });
    });

    test('compra, ticket, móvil, publicar y explicación', async ({ page }, info) => {
      // En escritorio la caja y el móvil van lado a lado; en tableta y móvil, en pestañas.
      const sideBySide = info.project.name === 'escritorio';
      await open(page, theme);
      await enter(page);
      const add = page.getByRole('button', { name: 'Añadir', exact: true });
      await add.first().click();
      await add.first().click();
      await shot(page, `${theme}-tienda`);

      await page.getByRole('button', { name: 'Cobrar y generar QR' }).click();
      await expect(page.getByRole('img', { name: 'QR' })).toBeVisible();
      // El ticket que vuela de la caja al móvil, ya aterrizado.
      await page.waitForTimeout(1000);
      await shot(page, `${theme}-ticket`);

      if (!sideBySide) {
        await page.getByRole('button', { name: 'Ir a la vista de Usuario' }).click();
        await shot(page, `${theme}-movil`);
      }

      await page.getByRole('button', { name: /Publicar señal/ }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await shot(page, `${theme}-publicar`, { fullPage: false });

      // Vista previa de la revelación selectiva, con dos campos marcados.
      await dialog.getByLabel('Importe total del ticket').check();
      await dialog.getByLabel('Tu edad').check();
      await shot(page, `${theme}-publicar-opciones`, { fullPage: false });

      // Publicada: los pasos y, por ser la primera vez, qué acaba de pasar.
      await dialog.getByRole('button', { name: 'Publicar señal' }).click();
      await expect(dialog.getByText('Señal publicada')).toBeVisible();
      await expect(dialog.getByText('¿Qué acaba de pasar?')).toBeVisible();
      await shot(page, `${theme}-explicacion`, { fullPage: false });
    });

    test('pestañas del móvil', async ({ page }, info) => {
      test.skip(info.project.name === 'escritorio', 'en escritorio el móvil ya sale en las demás');
      await open(page, theme);
      await enter(page);
      await page.getByRole('button', { name: 'Usuario', exact: true }).click();
      const phone = page.getByRole('navigation', { name: 'Mi Aegis' });
      await phone.getByRole('button', { name: 'Gastos' }).click();
      await shot(page, `${theme}-movil-gastos`);
      await phone.getByRole('button', { name: 'Privacidad' }).click();
      await shot(page, `${theme}-movil-privacidad`);
    });

    test('app a pantalla completa', async ({ page }, info) => {
      test.skip(info.project.name !== 'movil', 'es lo que se abre en un teléfono');
      await open(page, theme, { path: '/app' });
      await expect(page.getByText('Mi Aegis')).toBeVisible();
      await shot(page, `${theme}-app`);
    });

    test('enlace del QR', async ({ page }, info) => {
      test.skip(info.project.name !== 'movil', 'es lo que abre la cámara del teléfono');
      await open(page, theme, { path: '/app' });
      // El enlace que lleva el QR de un ticket, hecho con el mismo código que la caja.
      const link = await page.evaluate(async receipt => {
        const { encodeReceiptForQr, receiptLink } = await import('/src/receiptCodec.ts');
        return receiptLink(await encodeReceiptForQr(receipt));
      }, RECEIPT);
      await page.goto(link);
      await expect(page).toHaveURL(/\/app$/);
      await expect(page.getByText(/Nuevo ticket/)).toBeVisible();
      // Se queda guardado en el móvil.
      await page.reload();
      await expect(page.getByText(/Nuevo ticket/)).toBeVisible();
      await shot(page, `${theme}-app-ticket`);
    });

    test('cabecera con wallet', async ({ page }) => {
      await mockWallets(page);
      await open(page, theme, { fresh: true });
      await enter(page);
      const header = page.locator('header');
      // El borde de las píldoras varía unos pocos píxeles de suavizado entre
      // pasadas cuando corren varias pruebas a la vez: un poco más de margen.
      const options = { maxDiffPixels: 60 };

      await page.getByRole('button', { name: 'Conectar Billetera' }).click();
      await expect(header.getByRole('button', { name: 'lace' })).toBeVisible();
      await settle(page);
      await expect.soft(header).toHaveScreenshot(`${theme}-cabecera-wallets.png`, options);

      await header.getByRole('button', { name: 'lace' }).click();
      await expect(header.getByText(/Wallet · /)).toBeVisible();
      await settle(page);
      await expect.soft(header).toHaveScreenshot(`${theme}-cabecera-conectada.png`, options);
    });

    test('preparar demo', async ({ page }) => {
      await mockWallets(page);
      await open(page, theme, { fresh: true, path: '/setup' });
      const main = page.getByRole('main');
      // El contrato ya existe (el de la demo): su paso sale hecho.
      await expect(main.getByText('Hecho')).toHaveCount(1);
      await shot(page, `${theme}-setup`);

      await main.getByRole('button', { name: 'Conectar Billetera' }).click();
      await main.getByRole('button', { name: 'lace' }).click();
      await expect(main.getByText('Hecho')).toHaveCount(2);
      await shot(page, `${theme}-setup-conectada`);
    });

    test('desglose de señales', async ({ page }) => {
      await open(page, theme);
      await enter(page);
      await page.getByRole('button', { name: /Desglose completo/ }).click();
      await page.getByRole('button', { name: /^Moda \d/ }).click();
      await shot(page, `${theme}-desglose`);
    });

    test('informe de mercado', async ({ page }) => {
      await open(page, theme);
      await enter(page);
      await page.getByRole('button', { name: /Herramientas de tienda/ }).click();
      await page.getByRole('button', { name: 'Generar informe' }).click();
      await expect(page.getByText(INSIGHTS.recommendations[0].title)).toBeVisible();
      await shot(page, `${theme}-informe`);
    });

    test('mercado', async ({ page }) => {
      await open(page, theme);
      await enter(page);
      await page.getByRole('button', { name: 'Mercado', exact: true }).click();
      await expect(page).toHaveURL(/\/market$/);
      await expect(page.getByText('señales en la última semana')).toBeVisible();
      await expect(page.getByText('hace 4 s')).toBeVisible();
      await shot(page, `${theme}-mercado`);

      // La ficha de un punto de la gráfica.
      const plot = page.locator('figure [tabindex="0"]');
      const box = (await plot.boundingBox())!;
      await page.mouse.move(box.x + box.width * 0.35, box.y + box.height / 2);
      await expect(page.getByRole('tooltip')).toBeVisible();
      await shot(page, `${theme}-mercado-ficha`, { fullPage: false });

      // Un periodo más largo que el contrato: empieza en su despliegue.
      await page.mouse.move(0, 0);
      await page.getByRole('button', { name: '3M', exact: true }).click();
      await expect(page.getByText('señales en los últimos 3 meses')).toBeVisible();
      await expect(page.getByText(/cuando se desplegó el contrato/)).toBeVisible();
      await expect(page.getByText('incluye las 7253 señales de la carga de datos de demo')).toBeVisible();
      await shot(page, `${theme}-mercado-3m`);
    });
  });
}
