import { motion } from 'framer-motion';
import Button from '../shared/Button/Button';
import StatCard from './StatCard/StatCard';
import styles from './Hero.module.scss';

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const statsData = [
    {
      id: 1,
      value: '30 000',
      label: 'очага зарегистрировано за последние 12 месяцев'
    },
    {
      id: 2,
      value: '3 900',
      label: 'очага зарегистрировано за последние 3 месяца'
    },
    {
      id: 3,
      value: '134',
      label: 'очага зарегистрировано за последние 24 часа'
    }
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.hero__overlay} />
      
      <div className={styles.hero__container}>
        <motion.div 
          className={styles.hero__content}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className={styles.hero__title}
            variants={titleVariants}
          >
            <motion.span 
              className={styles.hero__highlight}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              Fires KZ
            </motion.span>
            {' '}— современная карта мониторинга пожаров в Казахстане
          </motion.h1>

          <motion.div 
            className={styles.hero__actions}
            variants={itemVariants}
          >
            <Button 
              href="/map"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Открыть карту
            </Button>
            
            <Button 
              href="#about"
              variant="secondary"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              О продукте
            </Button>
          </motion.div>
        </motion.div>
      </div>
      
      <motion.div 
        className={styles.hero__stats}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 1, duration: 0.8 }}
      >
        {statsData.map((stat) => (
          <StatCard 
            key={stat.id}
            value={stat.value}
            label={stat.label}
            variants={itemVariants}
          />
        ))}
      </motion.div>
    </section>
  );
};

export default Hero;