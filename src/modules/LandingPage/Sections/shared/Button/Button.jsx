import styles from './Button.module.scss';

const Button = ({ 
  children, 
  href, 
  variant = 'primary', // 'primary' or 'secondary'
  ...props 
}) => {
  const buttonClass = `${styles.hero__btn} ${styles[`hero__btn--${variant}`]}`;

  if (href) {
    return (
      <a href={href} className={buttonClass} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

export default Button;