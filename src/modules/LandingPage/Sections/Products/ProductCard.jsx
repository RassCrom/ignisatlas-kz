import styles from './ProductCard.module.scss';
import Button from '../shared/Button/Button';

const ProductCard = ({ 
  title, 
  description, 
  image, 
  link, 
  buttonText,
  variant = 'regular', // 'regular' or 'wide'
  theme = 'light' // 'light', 'purple', 'pink', 'coral'
}) => {
  return (
    <article className={`${styles.card} ${styles[`card--${variant}`]} ${styles[`card--${theme}`]}`}>
      <div className={styles.card__content}>
        <h3 className={styles.card__title}>{title}</h3>
        <p className={styles.card__description}>{description}</p>
        <Button 
          href={link} 
          variant={theme === 'light' || theme === 'purple' ? 'primary' : 'secondary'}
        >
          {buttonText}
        </Button>
      </div>
      <div className={styles.card__image}>
        <img src={image} alt={title} loading="lazy" />
      </div>
    </article>
  );
};

export default ProductCard;