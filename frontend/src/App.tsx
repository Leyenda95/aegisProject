import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from './app/PreferencesProvider.tsx';
import { ChainProvider } from './app/ChainProvider.tsx';
import { WalletProvider } from './app/WalletProvider.tsx';
import { TxProvider } from './app/TxProvider.tsx';
import Layout from './app/Layout.tsx';
import DemoPage from './routes/DemoPage.tsx';
import SetupPage from './routes/SetupPage.tsx';
import AppPage from './routes/AppPage.tsx';
import ImportReceiptPage from './routes/ImportReceiptPage.tsx';
import type { DemoScene } from './routes/DemoPage.tsx';
import ArtGallery from './story/art/ArtGallery.tsx';

// Si el backend no responde, se espera a la siguiente consulta periódica en
// vez de reintentar en el acto (lo mismo que se hacía antes a mano).
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const LANDING: DemoScene = { kind: 'landing' };
const INTRO: DemoScene = { kind: 'deck', deck: 'intro' };
const RECAP: DemoScene = { kind: 'deck', deck: 'recap' };
const TOUR: DemoScene = { kind: 'tour' };
const FREE_DEMO: DemoScene = { kind: 'free', view: 'demo' };
const FREE_MARKET: DemoScene = { kind: 'free', view: 'market' };

/**
 * Rutas: la portada (/), la intro y el resumen del recorrido (/intro/:n,
 * /recap/:n), la demo (/demo), el mercado (/market) y el alta de la demo
 * para quien la ejecuta en local con su propio contrato (/setup). Todas
 * menos el alta son la misma demo, con algo encima o con la pestaña del
 * mercado: así la demo ya está dibujada (fotos incluidas) cuando se entra,
 * e ir y volver no la redibuja ni pierde la cesta. Fuera de la web, sin su cabecera: la app del móvil (/app) y lo que
 * abre el QR de un ticket (/r#...). El estado compartido (preferencias, red,
 * wallet, transacciones) vive por encima de las rutas.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <ChainProvider>
          <WalletProvider>
            <TxProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<DemoPage scene={LANDING} />} />
                    <Route path="/intro/:n?" element={<DemoPage scene={INTRO} />} />
                    <Route path="/recap/:n?" element={<DemoPage scene={RECAP} />} />
                    <Route path="/tour/:step?" element={<DemoPage scene={TOUR} />} />
                    <Route path="/demo" element={<DemoPage scene={FREE_DEMO} />} />
                    <Route path="/market" element={<DemoPage scene={FREE_MARKET} />} />
                    <Route path="/setup" element={<SetupPage />} />
                    {/* Galería de ilustraciones del recorrido, para dibujarlas (solo en desarrollo). */}
                    {import.meta.env.DEV && <Route path="/art" element={<ArtGallery />} />}
                  </Route>
                  <Route path="/app" element={<AppPage />} />
                  <Route path="/r" element={<ImportReceiptPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </TxProvider>
          </WalletProvider>
        </ChainProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}
