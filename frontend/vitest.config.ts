import { defineConfig } from 'vitest/config';

// Pruebas de la lógica pura (src/**/*.test.ts). Las capturas de Playwright
// viven en e2e/ y tienen su propio ejecutor.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: { reporter: ['text', 'lcov'], include: ['src/**/*.{ts,tsx}'] },
  },
});
