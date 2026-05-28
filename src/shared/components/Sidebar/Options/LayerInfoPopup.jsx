import { Info } from 'lucide-react';
import { useI18n } from "src/shared/i18n/I18nProvider";
import { getLocalizedValue } from "src/shared/i18n/localize";
import styles from './LayerInfoPopup.module.scss';

const LayerInfoPopup = ({ option }) => {
  const { language } = useI18n();

  if (!option) {
    return null;
  }

  return (
    <div className={styles.popup}>
      <div className={styles.popupContent}>
        <div className={styles.header}>
          <Info size={16} className={styles.infoIcon} />
          <h3 className={styles.title}>{getLocalizedValue(option, "label", language)}</h3>
        </div>
        
        <div className={styles.description}>
          <p>{getLocalizedValue(option, "description", language)}</p>
        </div>
        
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Layer ID:</span>
            <span className={styles.detailValue}>{option.id}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.arrow}></div>
    </div>
  );
};

export default LayerInfoPopup;
