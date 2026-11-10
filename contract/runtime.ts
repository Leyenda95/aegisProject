// Reexporta el compact-runtime 0.16.0 que importa el contrato compilado con
// compactc 0.31 (contract/node_modules). El resto del repo usa 0.21.0; este
// es el único sitio que debe tocar el 0.16.0 desde fuera del contrato.
export * from '@midnight-ntwrk/compact-runtime';
