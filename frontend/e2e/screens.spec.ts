import { test, expect, type Page } from '@playwright/test';

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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Headers': '*',
};

/** Con `fresh`, un contrato recién desplegado: sin tienda registrada ni datos de demo. */
async function mockBackend(page: Page, { fresh = false } = {}) {
  await page.route(`${API}/**`, async route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers: CORS, json: body });
    switch (new URL(route.request().url()).pathname) {
      case '/state': return json(fresh ? { ...STATE, isSeeded: '0' } : STATE);
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

async function open(page: Page, theme: 'light' | 'dark', { fresh = false } = {}) {
  await page.clock.setFixedTime(NOW);
  await page.addInitScript(t => {
    localStorage.setItem('aegis-theme', t);
    localStorage.setItem('aegis-lang', 'es');
  }, theme);
  await mockBackend(page, { fresh });
  await page.goto('/');
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

async function shot(page: Page, name: string, { fullPage = true, threshold }: { fullPage?: boolean; threshold?: number } = {}) {
  await settle(page);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage, threshold });
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

    test('compra, ticket, móvil, publicar y explicación', async ({ page }) => {
      await open(page, theme);
      await enter(page);
      const add = page.getByRole('button', { name: 'Añadir', exact: true });
      await add.first().click();
      await add.first().click();
      await shot(page, `${theme}-tienda`);

      await page.getByRole('button', { name: 'Cobrar y generar QR' }).click();
      await expect(page.getByRole('img', { name: 'QR' })).toBeVisible();
      await shot(page, `${theme}-ticket`);

      await page.getByRole('button', { name: 'Ir a la vista de Usuario' }).click();
      await shot(page, `${theme}-movil`);

      await page.getByRole('button', { name: /Publicar señal/ }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await shot(page, `${theme}-publicar`, { fullPage: false });

      // Vista previa de la revelación selectiva, con dos campos marcados.
      await dialog.getByLabel('Importe total del ticket').check();
      await dialog.getByLabel('Tu edad').check();
      await shot(page, `${theme}-publicar-opciones`, { fullPage: false });

      await dialog.getByRole('button', { name: 'Publicar señal' }).click();
      await expect(page.getByRole('dialog', { name: '¿Qué acaba de pasar?' })).toBeVisible();
      await shot(page, `${theme}-explicacion`, { fullPage: false });
    });

    test('cabecera con wallet', async ({ page }) => {
      await mockWallets(page);
      await open(page, theme, { fresh: true });
      await enter(page);
      const header = page.locator('header');

      await page.getByRole('button', { name: 'Conectar Billetera' }).click();
      await expect(header.getByRole('button', { name: 'lace' })).toBeVisible();
      await settle(page);
      await expect(header).toHaveScreenshot(`${theme}-cabecera-wallets.png`);

      await header.getByRole('button', { name: 'lace' }).click();
      await expect(header.getByText(/Wallet · /)).toBeVisible();
      await settle(page);
      await expect(header).toHaveScreenshot(`${theme}-cabecera-conectada.png`);
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
  });
}
