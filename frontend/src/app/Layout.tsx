import { Outlet } from 'react-router';
import Header from './Header.tsx';
import { useTx } from './TxProvider.tsx';
import styles from './Layout.module.css';

/** Cabecera y aviso de transacción en curso, comunes a la demo y al alta. */
export default function Layout() {
  const { confirming } = useTx();
  return (
    <div className={styles.app}>
      <Header />
      {confirming && (
        <div className={styles.confirming}>
          <span className="aegis-spinner" />
          {confirming}
        </div>
      )}
      <Outlet />
    </div>
  );
}
