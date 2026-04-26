import { Home } from 'lucide-react';
import { flyHome } from 'src/modules/MapPage/utils/flyHome';
import styles from './ToolsControls.module.scss';

const HomeExtentTool = () => {
  const handleClick = () => {
    if (!window.mapInstance) return;
    flyHome(window.mapInstance.getView());
  };

  return (
    <div className={styles.bookmarksContainer}>
      <div className={styles.creationPanel}>
        <p className={styles.toolDesc}>
          Сбросить вид карты к начальному охвату всей территории Казахстана.
        </p>
        <button className={styles.saveBtn} onClick={handleClick}>
          <Home size={14} />
          Вернуться к полному охвату
        </button>
      </div>
    </div>
  );
};

export default HomeExtentTool;
