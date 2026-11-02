import { describe, expect, it } from 'vitest';
import { DECKS, keyStep, parseSlide, splitRich } from './deck.ts';

describe('diapositiva en la URL', () => {
  it('acepta del 1 al total de la presentación', () => {
    expect(parseSlide('intro', '1')).toBe(1);
    expect(parseSlide('recap', String(DECKS.recap.length))).toBe(DECKS.recap.length);
  });

  it('rechaza lo que no es una diapositiva', () => {
    for (const bad of [undefined, '', '0', String(DECKS.intro.length + 1), '1.5', 'x']) {
      expect(parseSlide('intro', bad)).toBeNull();
    }
  });
});

describe('texto con negritas y cursivas', () => {
  const plain = (text: string) => ({ text, strong: false, em: false });
  const strong = (text: string) => ({ text, strong: true, em: false });
  const em = (text: string) => ({ text, strong: false, em: true });

  it('separa los trozos marcados con **', () => {
    expect(splitRich('Las tiendas ven **qué se vende**, no **quién**.')).toEqual([
      plain('Las tiendas ven '), strong('qué se vende'), plain(', no '), strong('quién'), plain('.'),
    ]);
  });

  it('los trozos marcados con * van en cursiva', () => {
    expect(splitRich('*Aegis* convierte cada compra en una **señal**.')).toEqual([
      em('Aegis'), plain(' convierte cada compra en una '), strong('señal'), plain('.'),
    ]);
  });

  it('sin marcas es un solo trozo', () => {
    expect(splitRich('Hola')).toEqual([plain('Hola')]);
  });

  it('no deja trozos vacíos', () => {
    expect(splitRich('**Todo**')).toEqual([strong('Todo')]);
    expect(splitRich('*Todo*')).toEqual([em('Todo')]);
  });

  it('una marca sin cerrar se queda como texto', () => {
    expect(splitRich('2 * 3')).toEqual([plain('2 * 3')]);
  });
});

describe('teclas de la presentación', () => {
  const key = (k: string, mods: Partial<{ altKey: boolean; ctrlKey: boolean; metaKey: boolean }> = {}) =>
    ({ key: k, altKey: false, ctrlKey: false, metaKey: false, ...mods });

  it('las flechas y avance/retroceso de página mueven una diapositiva', () => {
    expect(keyStep(key('ArrowRight'), false)).toBe(1);
    expect(keyStep(key('PageDown'), false)).toBe(1);
    expect(keyStep(key('ArrowLeft'), false)).toBe(-1);
    expect(keyStep(key('PageUp'), false)).toBe(-1);
  });

  it('no se mueve con otras teclas, con modificadores ni escribiendo', () => {
    expect(keyStep(key('Enter'), false)).toBe(0);
    expect(keyStep(key('ArrowRight', { altKey: true }), false)).toBe(0);
    expect(keyStep(key('ArrowLeft', { metaKey: true }), false)).toBe(0);
    expect(keyStep(key('ArrowRight', { ctrlKey: true }), false)).toBe(0);
    expect(keyStep(key('ArrowRight'), true)).toBe(0);
  });
});
