import MapView from './MapView/MapView';
import Sidebar from "src/shared/components/Sidebar/Sidebar";
import styles from "./MapPage.module.scss";

const MapPage = () => {
  return (
    <div className={styles.main}>
      <MapView />
      <Sidebar />
    </div>
  );
};

export default MapPage;