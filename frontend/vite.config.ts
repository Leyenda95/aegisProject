import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

const MANAGED_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../contract/managed/aegis');

// Artefactos ZK que necesita el navegador para probar la señal con el proof
// server del propio usuario (ver src/localProver.ts): solo los de
// submitPurchase, con la estructura que espera FetchZkConfigProvider. Se
// sirven desde contract/managed en vez de copiarlos a public/, así no hay
// una segunda copia de la clave de prueba (~19.5MB) en el repo que pueda
// quedarse desfasada al recompilar el contrato.
const ZK_FILES = [
  'compiler/contract-info.json',
  'keys/submitPurchase.prover',
  'keys/submitPurchase.verifier',
  'zkir/submitPurchase.bzkir',
];

function zkArtifacts(): Plugin {
  return {
    name: 'aegis-zk-artifacts',
    configureServer(server) {
      server.middlewares.use('/zk', (req, res, next) => {
        const file = req.url?.split('?')[0].replace(/^\//, '');
        if (!file || !ZK_FILES.includes(file)) return next();
        res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'application/octet-stream');
        res.end(readFileSync(path.join(MANAGED_DIR, file)));
      });
    },
    generateBundle() {
      for (const file of ZK_FILES) {
        this.emitFile({ type: 'asset', fileName: `zk/${file}`, source: readFileSync(path.join(MANAGED_DIR, file)) });
      }
    },
  };
}

export default defineConfig({
  // wasm(): localProver.ts importa el contrato compilado
  // (contract/managed/aegis/contract/index.js), que arrastra
  // @midnight-ntwrk/compact-runtime -> @midnight-ntwrk/ledger-v8, que es
  // WebAssembly de verdad. Sin este plugin Vite no sabe cargar el .wasm
  // (ver patrón oficial en los ejemplos de Midnight: leaderboard, bboard).
  plugins: [react(), wasm(), zkArtifacts()],
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
