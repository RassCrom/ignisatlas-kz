import { Home } from 'lucide-react';
import { flyHome } from '../../utils/flyHome';
import { useI18n } from 'src/shared/i18n/I18nProvider';
import styles from './HomeButton.module.scss'

const HomeButton = ({ view }) => {
  const { t } = useI18n();

  return (
    <div className={styles.goHome}>
      <button 
        className={styles.homeButton} 
        onClick={() => flyHome(view)}
        aria-label={t("map.controls.homeView")}
      >
        <Home />
      </button>
    </div>
  );
};

export default HomeButton;
