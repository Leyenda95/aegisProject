import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { T } from '../i18n.ts';
import type { Lang } from '../api.ts';

type Props = {
  lang: Lang;
  onScan: (data: string) => void;
  onClose: () => void;
};

export default function QrScanner({ lang, onScan, onClose }: Props) {
  const t = T[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;

    function tick() {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(frame.data, frame.width, frame.height);
          // jsQR a veces "engancha" un patrón antes de tiempo y devuelve
          // data vacía, no es un escaneo válido, hay que seguir mirando.
          if (code && code.data.trim()) {
            stopped = true;
            onScan(code.data);
            return;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        // En desarrollo, StrictMode monta el efecto dos veces seguidas, si
        // la limpieza ya se disparó mientras esperábamos la cámara, no
        // toques el <video> ni sigas: ya no está en el DOM.
        if (stopped) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr: any) {
            // Interrumpido por el remount de StrictMode, inofensivo, el
            // segundo montaje (el real) sigue su curso normalmente.
            if (playErr?.name === 'AbortError') return;
            throw playErr;
          }
        }
        if (!stopped) tick();
      } catch (e: any) {
        if (!stopped) setError(e?.message ?? t.scannerCameraError);
      }
    }

    start();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [onScan]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000ee', zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16,
    }}>
      {error ? (
        <div style={{ color: 'var(--danger)', maxWidth: 320, textAlign: 'center', fontSize: 14 }}>{error}</div>
      ) : (
        <video ref={videoRef} style={{ maxWidth: '90vw', maxHeight: '70vh', borderRadius: 12 }} playsInline muted />
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button onClick={onClose} style={{
        background: 'var(--bronze-deep)', color: 'var(--on-bronze)', padding: '10px 24px', borderRadius: 8,
        border: 'none', fontSize: 14, cursor: 'pointer',
      }}>
        {t.scannerCancel}
      </button>
    </div>
  );
}
