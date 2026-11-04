import { test, expect, type Page } from '@playwright/test';
import { STATE, open, shot } from './mocks.ts';

// La intro, el tour guiado y el resumen (ver src/story), en tema claro y
// oscuro. Igual que screens.spec.ts: backend simulado y reloj congelado. La
// intro y el resumen son capas fijas encima de la demo y el panel del tour
// también, así que se captura solo lo que se ve (fullPage: false).

const panel = (page: Page) => page.getByRole('complementary', { name: 'Detrás de escena' });
const tourTitle = (page: Page, name: string) => panel(page).getByRole('heading', { name, level: 2 });
const slideTitle = (page: Page, name: string) => page.getByRole('heading', { name, level: 2 });

/** El tour ya está dibujado: el panel, la caja de la tienda y los contadores de la cinta. */
async function tourReady(page: Page) {
  await expect(panel(page)).toBeVisible();
  await expect(page.getByText('Punto de venta', { exact: true })).toBeVisible();
  await expect(page.getByText(STATE.totalSignals, { exact: true }).first()).toBeVisible();
}

/**
 * El tour desplaza la demo hasta lo que explica (con animación): se espera a
 * que la página se quede quieta y se captura donde queda, no desde arriba.
 */
async function tourShot(page: Page, name: string) {
  await expect.poll(async () => {
    const before = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(150);
    return before === await page.evaluate(() => window.scrollY);
  }).toBe(true);
  // Aparta el ratón: se queda encima del último botón pulsado.
  await page.mouse.move(0, 0);
  await shot(page, name, { fullPage: false, keepScroll: true });
}

/** Una diapositiva de la intro o del resumen: el ratón fuera, por los botones del pie. */
async function deckShot(page: Page, name: string, options: { threshold?: number } = {}) {
  await page.mouse.move(0, 0);
  await shot(page, name, { fullPage: false, ...options });
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(theme, () => {
    test('intro: diapositivas 1, 5, 6 y 10', async ({ page }) => {
      await open(page, theme, { path: '/intro/1' });
      await expect(page.getByText('1 de 10')).toBeVisible();
      // La cabecera de la web también tiene un h1 "AEGIS": se busca dentro de la intro.
      await expect(page.locator('[data-landing]').getByRole('heading', { name: 'Aegis', level: 1 })).toBeVisible();
      // El logo grande y su resplandor varían en color unos pocos píxeles de
      // una pasada a otra, como en la portada: se tolera igual que allí.
      await deckShot(page, `${theme}-intro-1`, { threshold: 0.2 });

      // Con los botones del pie, que es como se avanza con el ratón o el dedo.
      // Se espera al contador entre clics: un clic antes de que se redibuje
      // la diapositiva cuenta desde la anterior.
      const next = page.getByRole('button', { name: 'Siguiente' });
      for (let n = 2; n <= 5; n++) {
        await next.click();
        await expect(page.getByText(`${n} de 10`)).toBeVisible();
      }
      await expect(slideTitle(page, 'Quién participa')).toBeVisible();
      await deckShot(page, `${theme}-intro-5`);

      await next.click();
      await expect(page).toHaveURL(/\/intro\/6$/);
      await expect(slideTitle(page, 'Cómo viaja una compra')).toBeVisible();
      await deckShot(page, `${theme}-intro-6`);

      for (let n = 7; n <= 10; n++) {
        await next.click();
        await expect(page.getByText(`${n} de 10`)).toBeVisible();
      }
      await expect(page).toHaveURL(/\/intro\/10$/);
      await expect(slideTitle(page, '¿Empezamos?')).toBeVisible();
      await deckShot(page, `${theme}-intro-10`);
    });

    test('resumen: diapositivas 1 y 3', async ({ page }) => {
      await open(page, theme, { path: '/recap/1' });
      await expect(slideTitle(page, 'Lo que acabas de hacer')).toBeVisible();
      await deckShot(page, `${theme}-recap-1`);

      // Con las flechas del teclado. Tras cada cambio, la diapositiva vuelve a
      // atender al teclado un instante después de dibujarse: una pulsación
      // demasiado pronto cuenta desde la anterior, y se repite.
      await page.keyboard.press('ArrowRight');
      await expect(slideTitle(page, 'Más allá del comercio')).toBeVisible();
      await expect(async () => {
        await page.keyboard.press('ArrowRight');
        await expect(page).toHaveURL(/\/recap\/3$/, { timeout: 1000 });
      }).toPass();
      await expect(slideTitle(page, 'Construido sobre Midnight')).toBeVisible();
      await deckShot(page, `${theme}-recap-3`);
    });

    test('tour: paso 1, desde el final de la intro', async ({ page }) => {
      await open(page, theme, { path: '/intro/10' });
      await expect(slideTitle(page, '¿Empezamos?')).toBeVisible();
      await page.getByRole('link', { name: /Iniciar el recorrido/ }).click();
      await expect(page).toHaveURL(/\/tour\/1$/);
      await expect(tourTitle(page, 'Conecta tu wallet')).toBeVisible();
      await tourReady(page);
      await tourShot(page, `${theme}-tour-1`);
    });

    test('tour: paso 5, tras añadir un producto', async ({ page }) => {
      await open(page, theme, { path: '/tour/4' });
      await tourReady(page);
      await expect(tourTitle(page, 'Añade algo a la cesta')).toBeVisible();

      // El paso 4 avanza solo al añadir un producto a la cesta.
      await page.getByRole('button', { name: 'Añadir', exact: true }).first().click();
      await expect(page).toHaveURL(/\/tour\/5$/);
      await expect(tourTitle(page, 'Cobra y sella el recibo')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cobrar y generar QR' })).toBeVisible();
      await tourShot(page, `${theme}-tour-5`);
    });

    test('tour: paso 8, con la ventana de publicar abierta', async ({ page }) => {
      await open(page, theme, { path: '/tour/4' });
      await tourReady(page);
      await page.getByRole('button', { name: 'Añadir', exact: true }).first().click();
      await expect(page).toHaveURL(/\/tour\/5$/);

      // Cobrar sella el recibo y lleva al paso 6, el recibo con su QR.
      await page.getByRole('button', { name: 'Cobrar y generar QR' }).click();
      await expect(page).toHaveURL(/\/tour\/6$/);
      await expect(tourTitle(page, 'El recibo y su QR')).toBeVisible();

      // Ese paso no tiene acción: se sigue con «Siguiente» hasta el móvil.
      await panel(page).getByRole('button', { name: 'Siguiente' }).click();
      await expect(page).toHaveURL(/\/tour\/7$/);
      await expect(tourTitle(page, 'El ticket, en tu móvil')).toBeVisible();
      // El ticket que vuela de la caja al móvil, ya aterrizado.
      await page.waitForTimeout(1300);

      // Publicar la señal desde el ticket nuevo lleva al paso 8.
      await page.getByRole('button', { name: /Publicar señal/ }).click();
      await expect(page).toHaveURL(/\/tour\/8$/);
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(tourTitle(page, 'Tus datos, tu decisión')).toBeVisible();
      await tourShot(page, `${theme}-tour-8`);
    });

    test('tour: paso 12', async ({ page }) => {
      await open(page, theme, { path: '/tour/12' });
      await tourReady(page);
      await expect(tourTitle(page, 'Ahora, por tu cuenta')).toBeVisible();
      await expect(panel(page).getByRole('link', { name: /Ver el resumen/ })).toBeVisible();
      await tourShot(page, `${theme}-tour-12`);
    });
  });
}
