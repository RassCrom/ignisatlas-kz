import { useNavigate } from 'react-router-dom';
import styles from './NotFoundPage.module.scss';

const PARTICLE_COUNT = 5;

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.particles} aria-hidden="true">
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <span key={i} className={styles.particle} />
        ))}
      </div>

      <div className={styles.card}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Территория не найдена</h1>
        <p className={styles.desc}>
          Похоже, эти координаты не существуют на карте IgnisAtlas.
        </p>

        <div className={styles.actions}>
          <a href="/" className={styles.btn__primary}>
            На главную
          </a>
          <a href="/map" className={styles.btn__secondary}>
            Открыть карту
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
