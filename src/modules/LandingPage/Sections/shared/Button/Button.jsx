import { motion } from 'framer-motion';
import styles from './Button.module.scss';

const Button = ({
  children,
  href,
  variant = 'primary',
  disabled,
  ...props
}) => {
  const className = `${styles.hero__btn} ${styles[`hero__btn--${variant}`]}`;

  if (href) {
    return (
      <motion.a href={href} className={className} {...props}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button className={className} disabled={disabled} {...props}>
      {children}
    </motion.button>
  );
};

export default Button;
