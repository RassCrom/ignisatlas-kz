import { Flame } from 'lucide-react';
import styles from './LoadingPage.module.scss';

const PARTICLE_COUNT = 10;

// progress: 0–100 (omit for indeterminate — hides progress bar)
// message: override default loading text
const LoadingPage = ({
  progress,
  message = 'Инициализация карты...',
}) => (
  <div className={styles.loading}>
    <div className={styles.particles} aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <span key={i} className={styles.particle} />
      ))}
    </div>

    <div className={styles.content}>
      <div className={styles.logo}>
        <Flame className={styles.logo__icon} strokeWidth={1.5} />
        <span className={styles.logo__name}>IgnisAtlas</span>
      </div>

      <p className={styles.brand}>IgnisAtlas</p>

      <p className={styles.message}>{message}</p>
    </div>

    {progress !== undefined && (
      <div
        className={styles.progress}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Прогресс загрузки"
      >
        <div
          className={styles.progress__fill}
          style={{ width: `${progress}%` }}
        />
      </div>
    )}
  </div>
);

export default LoadingPage;
