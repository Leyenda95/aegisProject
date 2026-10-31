import { test, expect } from '@playwright/test';
import { open, enter } from './mocks.ts';

// El bocadillo "Ticket escaneado" sale junto al móvil en escritorio, a la
// altura del ticket recién llegado. Si se desplaza la pantalla del móvil, se
// queda donde estaba: no persigue a la tarjeta.

test('el bocadillo no se mueve al desplazar la pantalla del móvil', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'solo sale con la caja y el móvil lado a lado');
  await open(page, 'light');
  await enter(page);
  await page.getByRole('button', { name: 'Añadir', exact: true }).first().click();
  await page.getByRole('button', { name: 'Cobrar y generar QR' }).click();

  const nudge = page.getByText('Ya está en tu móvil. Pulsa «Publicar señal».');
  await expect(nudge).toBeVisible();
  // Espera a que acabe de aparecer (nudgeIn) para medir quieto.
  await page.waitForTimeout(1300);
  const before = await nudge.boundingBox();

  await page.locator('[data-phone-ticket]').evaluate(card => {
    let el = card.parentElement;
    while (el && getComputedStyle(el).overflowY !== 'auto') el = el.parentElement;
    if (!el) throw new Error('sin pantalla con scroll');
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(200);

  expect(await nudge.boundingBox()).toEqual(before);
});
