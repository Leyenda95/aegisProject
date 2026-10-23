import { createContext, useContext, useState, type ReactNode } from 'react';
import { NETWORK_ID } from '../chainConfig.ts';
import { connectWallet, listWallets, type ConnectedAPI, type WalletInfo } from '../lace.ts';
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

export function WalletProvider({ children }: { children: ReactNode }) {
  const { t } = usePreferences();
  const [wallet, setWallet] = useState<ConnectedAPI | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [choices, setChoices] = useState<WalletInfo[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect(walletKey?: string) {
    setError(null);
    if (!walletKey) {
      const wallets = listWallets();
      if (wallets.length === 0) { setError(t.noWalletFound); return; }
      if (wallets.length > 1) { setChoices(wallets); return; }
      walletKey = wallets[0].key;
    }
    setChoices([]);
    setConnecting(true); setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    try {
      const connected = await connectWallet(walletKey, NETWORK_ID);
      setWallet(connected);
      const { unshieldedAddress } = await connected.getUnshieldedAddress();
      setAddress(unshieldedAddress);
    }
    catch (e: any) {
      const msg: string = e.message ?? '';
      if (msg.includes('shutdown') || msg.includes('can no longer be used')) {
        setError(t.walletConnectionLost);
      } else {
        setError(msg || t.connectionFailed);
      }
    }
    finally {
      clearTimeout(slowTimer);
      setConnecting(false);
      setSlow(false);
    }
  }

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
