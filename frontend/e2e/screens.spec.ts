import { test, expect } from '@playwright/test';
import { RECEIPT, INSIGHTS, open, mockWallets, enter, skipIntro, settle, shot } from './mocks.ts';

// Recorre la demo y captura cada pantalla, en tema claro y oscuro (ver
// playwright.config.ts). El backend va simulado con datos fijos y el reloj
// congelado, para que dos pasadas sobre el mismo código den exactamente la
// misma imagen: cualquier diferencia es un cambio real de la interfaz.

for (const theme of ['light', 'dark'] as const) {
  test.describe(theme, () => {
    test('portada y cómo funciona', async ({ page }) => {
      await open(page, theme);
      await expect(page.getByText('señales anónimas en Midnight · en directo')).toBeVisible();
      // El logo enorme y translúcido de la portada sale en cada pasada con
      // variaciones mínimas de color (cientos de píxeles casi iguales): aquí
      // se toleran los cambios de color pequeños, como hace Playwright por defecto.
      await shot(page, `${theme}-portada`, { fullPage: false, threshold: 0.2 });

      // Baja hasta los pasos. Sin shot(): settle() volvería arriba.
      const how = page.getByRole('heading', { name: 'Cómo funciona' });
      await how.evaluate(el => el.scrollIntoView({ block: 'start' }));
      const top = () => how.evaluate(el => Math.round(el.getBoundingClientRect().top));
      await expect.poll(async () => {
        const before = await top();
        await page.waitForTimeout(150);
        return before === await top() && before < 320;
      }).toBe(true);
      // Aparta el ratón por si cae encima del botón del final.
      await page.mouse.move(0, 0);
      await expect.soft(page).toHaveScreenshot(`${theme}-como-funciona.png`, { threshold: 0.2 });

      // El botón del final abre la intro (encima de la demo); al saltarla se
      // llega a la demo y la página vuelve a desplazarse.
      await page.getByRole('button', { name: 'Explorar' }).last().click();
      await skipIntro(page);
      await expect(page.getByText('Punto de venta (demo)')).toBeVisible();
      await expect(page.locator('html')).not.toHaveClass(/landing-open/);
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
      // El ticket que vuela de la caja al móvil, ya aterrizado, y el
      // bocadillo que lo señala (sale al aterrizar).
      await page.waitForTimeout(1300);
      await shot(page, `${theme}-ticket`);

      if (!sideBySide) {
        await page.getByRole('button', { name: 'Ir al móvil' }).click();
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
