/**
 * aegis.compact no declara ningún witness: todos los circuitos son públicos y
 * solo usan disclose() sobre sus propios argumentos. No hay estado privado.
 */
import type { Witnesses } from './managed/aegis/contract/index.js';

export type AegisPrivateState = Record<string, never>;

export const emptyPrivateState: AegisPrivateState = {};

export const witnesses: Witnesses<AegisPrivateState> = {};
