import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { usePreferences } from '../app/PreferencesProvider.tsx';
import { decodeReceiptFromQr, isReceiptJSON } from '../receiptCodec.ts';
import { addReceipt } from '../vault.ts';
import styles from './ImportReceiptPage.module.css';

/**
 * /r#AEG1:... es lo que abre la cámara del móvil al escanear el QR de la
 * tienda: guarda el ticket en el móvil y abre la app con él. Lo que va tras
 * # nunca llega al servidor, y se borra de la barra de direcciones en cuanto
 * se lee, para que no se quede en el historial.
 */
export default function ImportReceiptPage() {
  const { t } = usePreferences();
  const navigate = useNavigate();
  // Se lee una sola vez: en desarrollo el efecto corre dos veces y la
  // segunda ya no encontraría el #.
  const [code] = useState(() => window.location.hash.slice(1));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    history.replaceState(null, '', '/r');
    let cancelled = false;
    decodeReceiptFromQr(code)
      .then(receipt => {
        if (cancelled) return;
        if (!isReceiptJSON(receipt)) throw new Error('Not an Aegis receipt');
        addReceipt(receipt);
        navigate('/app', { replace: true });
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [code, navigate]);

  return (
    <main className={styles.page}>
      {failed ? (
        <>
          <p>{t.importFailed}</p>
          <Link to="/app" className={styles.link}>{t.importGoApp}</Link>
        </>
      ) : (
        <p><span className="aegis-spinner" /> {t.importOpening}</p>
      )}
    </main>
  );
}
