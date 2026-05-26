import { lazy, Suspense } from 'react';

import styles from "./MapPage.module.scss";

const MapView = lazy(() => import('./MapView/MapView'));
const Sidebar = lazy(() => import("src/shared/components/Sidebar/Sidebar"));

const MapPage = () => {
  return (
    <div className={styles.main}>
      <Suspense fallback={null}>
        <MapView />
      </Suspense>
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
    </div>
  );
};

export default MapPage;
