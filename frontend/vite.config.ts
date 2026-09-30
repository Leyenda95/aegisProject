import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  // wasm(): chainState.ts importa el contrato compilado
  // (contract/managed/aegis/contract/index.js), que arrastra
  // @midnight-ntwrk/compact-runtime -> @midnight-ntwrk/ledger-v8, que es
  // WebAssembly de verdad. Sin este plugin Vite no sabe cargar el .wasm
  // (ver patrón oficial en los ejemplos de Midnight: leaderboard, bboard).
  plugins: [react(), wasm()],
  // Evita instanciar compact-runtime dos veces si algún día hay más de un
  // punto de entrada al mismo paquete (el WASM ata la identidad de clase a
  // la instancia que la creó, dos copias romperían los `instanceof`).
  resolve: {
    dedupe: ['@midnight-ntwrk/compact-runtime', '@midnight-ntwrk/ledger-v8'],
  },
  // El wasm generado usa `await` de nivel superior para instanciarse.
  // esnext lo soporta de forma nativa, así no hace falta transpilarlo (y
  // no hace falta vite-plugin-top-level-await, cuya versión actual choca
  // con la de swc instalada aquí).
  build: { target: 'esnext' },
  optimizeDeps: { esbuildOptions: { target: 'esnext' } },
  server: {
    watch: {
      usePolling: true,
    },
  },
});
