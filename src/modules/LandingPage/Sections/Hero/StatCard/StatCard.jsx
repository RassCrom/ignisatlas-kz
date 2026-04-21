import { motion } from 'framer-motion';
import styles from './StatCard.module.scss';

const StatCard = ({ value, label, variants }) => {
  return (
    <motion.article 
      className={styles.card}
      variants={variants}
    >
      <div className={styles.card__value}>{value}</div>
      <div className={styles.card__divider} />
      <p className={styles.card__label}>{label}</p>
    </motion.article>
  );
};

export default StatCard;
