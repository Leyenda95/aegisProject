import { useEffect, useState } from 'react';

/** La hora actual, puesta al día cada `intervalMs`: para textos como "hace 4 s". */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
