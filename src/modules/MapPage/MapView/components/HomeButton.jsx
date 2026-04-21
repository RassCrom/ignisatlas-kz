import { Home } from 'lucide-react';
import { flyHome } from '../../utils/flyHome';
import styles from './HomeButton.module.scss'

const HomeButton = ({ view }) => {
  return (
    <div className={styles.goHome}>
      <button 
        className={styles.homeButton} 
        onClick={() => flyHome(view)}
        aria-label="Go to home position"
      >
        <Home />
      </button>
    </div>
  );
};

export default HomeButton;