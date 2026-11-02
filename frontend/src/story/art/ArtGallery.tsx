import type { ArtId } from '../ids.ts';
import Art from './Art.tsx';
import styles from './ArtGallery.module.css';

const BIG: ArtId[] = ['disclaimer', 'problem', 'idea', 'players', 'flow', 'ready', 'beyond'];
const SMALL: ArtId[] = ['wallet', 'registry', 'counters', 'vault', 'cart', 'seal', 'qr', 'disclosure', 'proof', 'market', 'agent', 'explore'];

/**
 * Todas las ilustraciones del recorrido en una página (/art, solo en
 * desarrollo): las de la intro con los colores de la portada y las del tour
 * con los del tema, para dibujarlas y revisarlas sin recorrer la demo.
 */
export default function ArtGallery() {
  return (
    <div className={styles.root}>
      <section data-landing className={styles.landing}>
        <div className={styles.grid}>
          {BIG.map(id => <figure key={id}><Art id={id} /><figcaption>{id}</figcaption></figure>)}
        </div>
      </section>
      <section className={styles.grid}>
        {SMALL.map(id => <figure key={id}><Art id={id} /><figcaption>{id}</figcaption></figure>)}
      </section>
    </div>
  );
}
