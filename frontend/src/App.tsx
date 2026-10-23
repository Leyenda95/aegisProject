import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from './app/PreferencesProvider.tsx';
import { ChainProvider } from './app/ChainProvider.tsx';
import { WalletProvider } from './app/WalletProvider.tsx';
import { TxProvider } from './app/TxProvider.tsx';
import Layout from './app/Layout.tsx';
import DemoPage from './routes/DemoPage.tsx';
import SetupPage from './routes/SetupPage.tsx';

// Si el backend no responde, se espera a la siguiente consulta periódica en
// vez de reintentar en el acto (lo mismo que se hacía antes a mano).
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

/**
 * Rutas: la portada (/), la demo (/demo) y el alta de la demo para quien la
 * ejecuta en local con su propio contrato (/setup). La portada es la misma
 * demo con la pantalla de bienvenida encima: así la demo ya está dibujada
 * (fotos incluidas) cuando se entra, y entrar o volver con el logo no la
 * redibuja ni pierde la cesta. El estado compartido (preferencias, red,
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
                    <Route path="/" element={<DemoPage landing />} />
                    <Route path="/demo" element={<DemoPage />} />
                    <Route path="/setup" element={<SetupPage />} />
                  </Route>
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
