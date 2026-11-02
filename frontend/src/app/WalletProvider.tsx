import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { NETWORK_ID } from '../chainConfig.ts';
import {
  connectWallet, isDeliberateWalletRejection, isWalletDisconnected, listWallets, walletEvents,
  type ConnectedAPI, type WalletInfo,
} from '../lace.ts';
import { usePreferences } from './PreferencesProvider.tsx';

type Wallet = {
  /** La wallet conectada (Lace, 1AM...), o null. */
  wallet: ConnectedAPI | null;
  address: string | null;
  /** Wallets instaladas entre las que elegir, cuando hay más de una. */
  choices: WalletInfo[];
  connecting: boolean;
  /** La extensión tarda en responder: se está despertando y su ventana saldrá en breve. */
  slow: boolean;
  error: string | null;
  /** Sin clave: conecta la única wallet instalada, o pide elegir si hay varias. */
  connect: (walletKey?: string) => Promise<void>;
};

const WalletContext = createContext<Wallet | null>(null);

// La última wallet conectada, por su rdns: la clave de window.midnight no
// sirve, porque Lace estrena una en cada carga de la página.
const SAVED_KEY = 'aegis.wallet';
// Lo que se espera a que la extensión aparezca en window.midnight al cargar.
const INJECT_WAIT_MS = 3000;

function loadSavedWallet(): string | null {
  try { return localStorage.getItem(SAVED_KEY); } catch { return null; }
}

function saveWallet(rdns: string | null): void {
  try {
    if (rdns) localStorage.setItem(SAVED_KEY, rdns);
    else localStorage.removeItem(SAVED_KEY);
  } catch { /* sin almacenamiento: solo se pierde la reconexión al recargar */ }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { t } = usePreferences();
  const [wallet, setWallet] = useState<ConnectedAPI | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [choices, setChoices] = useState<WalletInfo[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open(info: WalletInfo) {
    const connected = await connectWallet(info.key, NETWORK_ID);
    const { unshieldedAddress } = await connected.getUnshieldedAddress();
    setWallet(connected);
    setAddress(unshieldedAddress);
    setError(null);
    saveWallet(info.rdns);
  }

  async function connect(walletKey?: string) {
    setError(null);
    const wallets = listWallets();
    if (!walletKey) {
      if (wallets.length === 0) { setError(t.noWalletFound); return; }
      if (wallets.length > 1) { setChoices(wallets); return; }
      walletKey = wallets[0].key;
    }
    const info = wallets.find(w => w.key === walletKey);
    if (!info) { setError(t.noWalletFound); return; }
    setChoices([]);
    setConnecting(true); setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    try {
      await open(info);
    }
    catch (e: any) {
      if (isDeliberateWalletRejection(e)) saveWallet(null);
      setError(isWalletDisconnected(e) ? t.walletConnectionLost : e.message || t.connectionFailed);
    }
    finally {
      clearTimeout(slowTimer);
      setConnecting(false);
      setSlow(false);
    }
  }

  // Al cargar, se vuelve a conectar sola la última wallet, en cuanto la
  // extensión aparece. Sin clic, la wallet solo puede contestar si ya tenía
  // el sitio autorizado; si no, falla y todo sigue como sin conectar, sin
  // avisos. Si la wallet rechaza la conexión, se olvida.
  useEffect(() => {
    const rdns = loadSavedWallet();
    if (!rdns) return;
    const started = Date.now();
    const timer = setInterval(() => {
      const info = listWallets().find(w => w.rdns === rdns);
      if (!info && Date.now() - started < INJECT_WAIT_MS) return;
      clearInterval(timer);
      if (info) open(info).catch(e => { if (isDeliberateWalletRejection(e)) saveWallet(null); });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // La wallet cortó la sesión a mitad de una acción (ver lace.ts): se da por
  // desconectada, para volver a conectarla desde la cabecera.
  useEffect(() => {
    const lost = () => {
      setWallet(null);
      setAddress(null);
      setError(t.walletConnectionLost);
    };
    walletEvents.addEventListener('disconnected', lost);
    return () => walletEvents.removeEventListener('disconnected', lost);
  }, [t]);

  return (
    <WalletContext value={{ wallet, address, choices, connecting, slow, error, connect }}>
      {children}
    </WalletContext>
  );
}

export function useWallet(): Wallet {
  const value = useContext(WalletContext);
  if (!value) throw new Error('useWallet necesita WalletProvider');
  return value;
}
