import { usePreferences } from '../app/PreferencesProvider.tsx';
import UserView from '../components/UserView.tsx';

/**
 * /app: el móvil del cliente a pantalla completa, sin la cabecera de la web.
 * Es lo que se abre en un teléfono de verdad (desde el enlace del QR o
 * instalada en la pantalla de inicio, ver manifest.webmanifest).
 */
export default function AppPage() {
  const { lang } = usePreferences();
  return <UserView lang={lang} variant="app" />;
}
