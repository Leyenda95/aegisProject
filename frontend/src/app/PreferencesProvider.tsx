import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import type { Lang } from '../api.ts';
import { T } from '../i18n.ts';

type Theme = 'dark' | 'light';

const THEME_KEY = 'aegis-theme';
const LANG_KEY = 'aegis-lang';

/** Idioma al entrar: el último que se eligió o, si nunca se eligió, el del navegador (si no es español, inglés). */
function initialLang(): Lang {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'es' || saved === 'en') return saved;
  for (const l of [...navigator.languages, navigator.language]) {
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('en')) return 'en';
  }
  return 'en';
}

type Preferences = {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  chooseLang: (lang: Lang) => void;
  /** Los textos en el idioma elegido. */
  t: (typeof T)[Lang];
};

const PreferencesContext = createContext<Preferences | null>(null);

/** Tema e idioma de la interfaz, recordados en el navegador. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'light');

  // useLayoutEffect y no useEffect: el atributo tiene que quedar puesto en
  // cuanto React aplica el cambio, para que la View Transition de
  // toggleTheme capture ya la página con el tema nuevo.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Cambios de tema que aún se están fundiendo (ver toggleTheme).
  const themeSwitches = useRef(0);

  /**
   * Cambia de tema con un solo fundido de toda la página (View Transitions):
   * el navegador la captura, se aplica el tema nuevo de golpe y funde una
   * imagen con la otra. Mientras tanto, .theme-switching (ver index.css)
   * apaga las transiciones propias de cada elemento. Si el navegador no lo
   * soporta, el tema cambia al instante.
   */
  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    if (!('startViewTransition' in document)) { setTheme(next); return; }
    const root = document.documentElement;
    root.classList.add('theme-switching');
    themeSwitches.current++;
    const transition = document.startViewTransition(() => flushSync(() => setTheme(next)));
    // Si se vuelve a pulsar a mitad del fundido, la clase se quita al acabar el último.
    transition.finished.finally(() => {
      if (--themeSwitches.current === 0) root.classList.remove('theme-switching');
    });
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  /** Solo se recuerda el idioma elegido a mano, no el que se deduce del navegador. */
  function chooseLang(l: Lang) {
    setLang(l);
    localStorage.setItem(LANG_KEY, l);
  }

  return (
    <PreferencesContext value={{ theme, toggleTheme, lang, chooseLang, t: T[lang] }}>
      {children}
    </PreferencesContext>
  );
}

export function usePreferences(): Preferences {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences necesita PreferencesProvider');
  return value;
}
