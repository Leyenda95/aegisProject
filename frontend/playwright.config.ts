import { defineConfig } from '@playwright/test';

// Capturas de las pantallas principales (ver e2e/screens.spec.ts) para
// comparar el antes y el después de un cambio:
//   1. con la versión de la que se parte, `npm run screens:update` guarda
//      las capturas de referencia en e2e/screens/;
//   2. tras el cambio, `npm run screens` compara pantalla a pantalla y deja
//      las diferencias (antes, después y resaltado) en test-results/.
// Las capturas dependen de la máquina (fuentes, sistema) y pesan, así que
// no van a git: la referencia se genera en local antes de cada cambio.
export default defineConfig({
  testDir: 'e2e',
  snapshotPathTemplate: 'e2e/screens/{projectName}/{arg}{ext}',
  fullyParallel: true,
  reporter: 'list',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
    // threshold 0: cualquier cambio de color cuenta (por defecto se ignoran
    // los pequeños). maxDiffPixels 20: el suavizado del texto varía a veces
    // en un par de píxeles sueltos; un cambio de verdad mueve cientos.
    toHaveScreenshot: { animations: 'disabled', threshold: 0, maxDiffPixels: 20 },
  },
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1280, height: 800 } } },
    // Sin isMobile: a este ancho la cabecera no cabe y, en modo móvil,
    // Chromium aleja y acerca la página a su aire en cada pasada.
    { name: 'tableta', use: { viewport: { width: 820, height: 1180 } } },
    { name: 'movil', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
