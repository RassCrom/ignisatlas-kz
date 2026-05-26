import styles from './LoadingPage.module.scss';

const LoadingPage = ({
  progress,
  message = 'Инициализация карты...',
}) => (
  <div className={styles.loading} role="status" aria-label={message}>
    <div className={styles.scene} aria-hidden="true">
      {/* Pulsing rings */}
      <span className={`${styles.ring} ${styles.ring1}`} />
      <span className={`${styles.ring} ${styles.ring2}`} />
      <span className={`${styles.ring} ${styles.ring3}`} />

      {/* Target frame */}
      <div className={styles.target}>
        <span className={`${styles.corner} ${styles.cornerTL}`} />
        <span className={`${styles.corner} ${styles.cornerTR}`} />
        <span className={`${styles.corner} ${styles.cornerBL}`} />
        <span className={`${styles.corner} ${styles.cornerBR}`} />

        {/* Crosshair */}
        <span className={`${styles.cross} ${styles.crossH}`} />
        <span className={`${styles.cross} ${styles.crossV}`} />

        {/* Scanner sweep */}
        <span className={styles.sweep} />

        {/* Center dot */}
        <span className={styles.dot} />
      </div>

      {/* Coordinate labels */}
      <span className={`${styles.coord} ${styles.coordTop}`}>48.0000°N</span>
      <span className={`${styles.coord} ${styles.coordRight}`}>66.0000°E</span>
    </div>

    <div className={styles.content}>
      <p className={styles.runes} aria-hidden="true">𐰔𐰐 𐱅𐰘𐰜𐰓</p>
      <p className={styles.brand}>Tabiat Küzeti</p>
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
        <div className={styles.progress__fill} style={{ width: `${progress}%` }} />
      </div>
    )}
  </div>
);

export default LoadingPage;
