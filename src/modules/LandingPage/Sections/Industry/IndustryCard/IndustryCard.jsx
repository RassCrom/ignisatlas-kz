import styles from './IndustryCard.module.scss';

const IndustryCard = ({ title, image, description }) => {
  return (
    <article className={styles.card}>
      <div className={styles.card__image}>
        <img 
          src={image} 
          alt={title}
          loading="lazy"
          className={styles.card__img}
        />
      </div>
      
      <div className={styles.card__overlay} />
      
      <div className={styles.card__content}>
        <h3 className={styles.card__title}>{title}</h3>
        {description && (
          <p className={styles.card__description}>{description}</p>
        )}
      </div>
    </article>
  );
};

export default IndustryCard;