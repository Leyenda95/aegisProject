import { cx } from '../cx.ts';
import styles from './BuiltOnMidnight.module.css';

/** "Built on Midnight" al pie de las vistas. El espacio alrededor lo pone quien lo usa (className). */
export default function BuiltOnMidnight({ className }: { className?: string }) {
  return (
    <div className={cx(styles.root, className)}>
      <span className={cx('builtOnLabel', styles.label)}>Built on</span>
      <img src="/images/midnight/logo-horizontal-white.png" alt="Midnight Network" className={cx('midnight-logo', styles.logo)} />
    </div>
  );
}
