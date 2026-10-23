import { createContext, useContext, useState, type ReactNode } from 'react';

type Tx = {
  /**
   * Aviso mientras se espera la confirmación on-chain de una transacción ya
   * enviada. Mientras hay uno, no se lanza otra: el backend probaría contra un
   * estado que el indexer todavía no ha puesto al día (ver pollUntil en lace.ts).
   */
  confirming: string | null;
  setConfirming: (message: string | null) => void;
};

const TxContext = createContext<Tx | null>(null);

/**
 * Las transacciones en curso, compartidas por toda la página: así una que se
 * lanza en la tienda bloquea también el móvil, y no se pierde al cambiar de
 * vista ni de página.
 */
export function TxProvider({ children }: { children: ReactNode }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  return <TxContext value={{ confirming, setConfirming }}>{children}</TxContext>;
}

export function useTx(): Tx {
  const value = useContext(TxContext);
  if (!value) throw new Error('useTx necesita TxProvider');
  return value;
}
