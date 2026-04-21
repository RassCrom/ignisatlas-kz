import { Info } from 'lucide-react';
import styles from './LayerInfoPopup.module.scss';

const LayerInfoPopup = ({ option }) => {
  if (!option) {
    return null;
  }

  return (
    <div className={styles.popup}>
      <div className={styles.popupContent}>
        <div className={styles.header}>
          <Info size={16} className={styles.infoIcon} />
          <h3 className={styles.title}>{option.label}</h3>
        </div>
        
        <div className={styles.description}>
          <p>{option.description}</p>
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