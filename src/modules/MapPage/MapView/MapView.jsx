import { useRef, useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";

import MapToolbar from "./components/MapToolbar.jsx";
import FirePopup from "./components/FirePopup.jsx";
import FireModelPopup from "./components/FireModelPopup.jsx";
import EmergencyPopup from "./components/EmergencyPopup.jsx";
import SettlementsPopup from "./components/SettlementsPopup.jsx";
import WeatherPopup from "./components/WeatherPopup.jsx";
import usePopupManager from "./components/PopupManager.jsx";

import { DEFAULT_BASEMAP_KEY } from "../utils/basemaps.js";

import useFireStore from "src/app/store/fireStore";
import {
  clearMapInstance,
  setMapInstance,
} from "src/modules/MapPage/services/mapService.js";

import useRiskMapStore from "src/app/store/riskMapStore.js";
import useFireModellingStore from "src/app/store/fireModellingStore.js";
import useMapStore from "src/app/store/mapStore.js";

import { useMapInitialization } from "../hooks/useMapInitialization";
import { useFireLayer } from "../hooks/useFireLayer";

import { useRiskLayers } from "../hooks/useRiskLayers";
import { useLulcLayer } from "../hooks/useLulcLayer";
import { useLulcPcLayer } from "../hooks/useLulcPcLayer";
import { useDemLayer } from "../hooks/useDemLayer";
import { useAnalysisLayers } from "../hooks/useAnalysisLayers";
import { useSettlementsLayer } from "../hooks/useSettlementsLayer";
import { useFireModelling } from "../hooks/useFireModelling.js";
import { useEmergencyPopup } from "../hooks/useEmergencyPopup.js";
import { useAoiDraw } from "../hooks/useAoiDraw.js";
import { useFootprintPreview } from "../hooks/useFootprintPreview.js";
import { useBookmarksLayer } from "../hooks/useBookmarksLayer.js";
import { useClimateZonesLayer } from "../hooks/useClimateZonesLayer.js";
import { useProtectedAreasLayer } from "../hooks/useProtectedAreasLayer.js";
import { usePeatlandsLayer } from "../hooks/usePeatlandsLayer.js";
import ClimateZonesPopup from "./components/ClimateZonesPopup.jsx";
import ProtectedAreasPopup from "./components/ProtectedAreasPopup.jsx";
import PeatlandsPopup from "./components/PeatlandsPopup.jsx";

import "maplibre-gl/dist/maplibre-gl.css";
import "react-toastify/dist/ReactToastify.css";
import styles from "./MapView.module.scss";
import "./mapStyles.scss";

const MapView = () => {
  const mapRef = useRef(null);
  const [basemap, setBasemap] = useState(DEFAULT_BASEMAP_KEY);
  const [weatherCoordinate, setWeatherCoordinate] = useState(null);

  // Store hooks
  const fireStore = useFireStore();
  const riskMapStore = useRiskMapStore();
  const fireDatesRef = useRef({
    start: fireStore.fireStartDate,
    end: fireStore.fireEndDate,
  });
  const fireLayerVisibleRef = useRef(fireStore.fireLayerVisible);

  // Custom hooks
  const { fireLayer, loadFireData } = useFireLayer(fireStore);
  const mapStore = useMapStore();
  const fireModellingStore = useFireModellingStore();

  // Initialize map
  const { mapInstance, isMapInitialized } = useMapInitialization(
    mapRef,
    basemap
  );

  useEffect(() => {
    fireDatesRef.current = {
      start: fireStore.fireStartDate,
      end: fireStore.fireEndDate,
    };
  }, [fireStore.fireStartDate, fireStore.fireEndDate]);

  useEffect(() => {
    fireLayerVisibleRef.current = fireStore.fireLayerVisible;
  }, [fireStore.fireLayerVisible]);

  // Shared reference for sidebar tools that are rendered outside MapView.
  useEffect(() => {
    if (!mapInstance) return;

    setMapInstance(mapInstance);
    return () => clearMapInstance(mapInstance);
  }, [mapInstance]);

  // Weather popup via context menu event
  useEffect(() => {
    const handler = (e) => setWeatherCoordinate(e.detail.coordinate);
    window.addEventListener('cm:weather', handler);
    return () => window.removeEventListener('cm:weather', handler);
  }, []);



  // Sentinel Explorer – AOI draw & footprint preview
  useAoiDraw(mapInstance, isMapInitialized);
  useFootprintPreview(mapInstance, isMapInitialized);

  // Initialize risk layers
  useRiskLayers(riskMapStore.riskDates, mapInstance, isMapInitialized);
  useLulcLayer(mapInstance, isMapInitialized);
  useLulcPcLayer(mapInstance, isMapInitialized);
  useDemLayer(mapInstance, isMapInitialized);
  useAnalysisLayers(mapInstance, isMapInitialized);
  const {
    popupRef:     settlementsPopupRef,
    popupContent: settlementsPopupContent,
    closePopup:   closeSettlementsPopup,
  } = useSettlementsLayer(mapInstance, isMapInitialized);
  const {
    popupRef:    fireModelPopupRef,
    popupContent: fireModelPopupContent,
    closePopup:  closeFireModelPopup,
  } = useFireModelling(
    mapStore.fireModelLayer,
    mapInstance,
    isMapInitialized,
    fireModellingStore.addFireModellingLayer,
    fireModellingStore.setMapInstance
  );

  // Initialize Spatial Bookmarks markers
  useBookmarksLayer(mapInstance, isMapInitialized);

  // Climate zones layer
  const {
    popupRef:     czPopupRef,
    popupContent: czPopupContent,
    closePopup:   closeCzPopup,
  } = useClimateZonesLayer(mapInstance, isMapInitialized);

  // Protected areas layer
  const {
    popupRef:     paPopupRef,
    popupContent: paPopupContent,
    closePopup:   closePaPopup,
  } = useProtectedAreasLayer(mapInstance, isMapInitialized);

  // Peatlands layer
  const {
    popupRef:     peatPopupRef,
    popupContent: peatPopupContent,
    closePopup:   closePeatPopup,
  } = usePeatlandsLayer(mapInstance, isMapInitialized);

  // Emergency layers popup
  const {
    popupRef:    emergencyPopupRef,
    popupContent: emergencyPopupContent,
    closePopup:  closeEmergencyPopup,
  } = useEmergencyPopup(mapInstance, isMapInitialized);

  // Popup management
  const {
    popupRef,
    popupContent,
    closePopup,
    showPopup,
    setupPopupInteractions,
    isOverlayReady,
    handleFireModelLayer,
  } = usePopupManager(mapInstance, fireLayer);

  // Set up popup interactions
  useEffect(() => {
    if (!isMapInitialized || !mapInstance || !fireLayer || !isOverlayReady) {
      return;
    }

    const cleanup = setupPopupInteractions();
    return cleanup;
  }, [
    isMapInitialized,
    mapInstance,
    setupPopupInteractions,
    isOverlayReady,
    fireLayer,
  ]);

  // Fire layer management
  useEffect(() => {
    if (!isMapInitialized || !mapInstance || !fireLayer) return;

    if (fireStore.fireLayerVisible) {
      const { start, end } = fireDatesRef.current;
      loadFireData(mapInstance, start, end, true);
    } else if (fireLayer.getVisible()) {
      fireLayer.setVisible(false);
    }
  }, [fireStore.fireLayerVisible, isMapInitialized, mapInstance, fireLayer, loadFireData]);

  // Update fire layer when date changes
  useEffect(() => {
    if (fireLayerVisibleRef.current && fireLayer && mapInstance) {
      const { start, end } = fireDatesRef.current;
      loadFireData(mapInstance, start, end, true);
    }
  }, [fireStore.dateHasChanged, fireLayer, loadFireData, mapInstance]);

  // Add map interactions
  useEffect(() => {
    if (!mapInstance) return;

    mapInstance.showPopup = showPopup;
    mapInstance.closePopup = closePopup;


    return () => {
    };
  }, [mapInstance, showPopup, closePopup]);

  return (
    <div id="fullscreen" className={styles.fullscreen}>
      <div ref={mapRef} className={styles.map__container}>
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
        />

        {isMapInitialized && (
          <MapToolbar
            map={mapInstance}
            currentBasemap={basemap}
            onBasemapChange={setBasemap}
          />
        )}

        <FirePopup
          popupRef={popupRef}
          content={popupContent}
          onClose={closePopup}
          onWeather={(coord) => setWeatherCoordinate(coord)}
          onFireModel={handleFireModelLayer}
        />

        <FireModelPopup
          popupRef={fireModelPopupRef}
          content={fireModelPopupContent}
          onClose={closeFireModelPopup}
        />

        <EmergencyPopup
          popupRef={emergencyPopupRef}
          content={emergencyPopupContent}
          onClose={closeEmergencyPopup}
        />

        <SettlementsPopup
          popupRef={settlementsPopupRef}
          content={settlementsPopupContent}
          onClose={closeSettlementsPopup}
        />

        <ClimateZonesPopup
          popupRef={czPopupRef}
          content={czPopupContent}
          onClose={closeCzPopup}
        />

        <ProtectedAreasPopup
          popupRef={paPopupRef}
          content={paPopupContent}
          onClose={closePaPopup}
        />

        <PeatlandsPopup
          popupRef={peatPopupRef}
          content={peatPopupContent}
          onClose={closePeatPopup}
        />

        {weatherCoordinate && (
          <WeatherPopup
            coordinate={weatherCoordinate}
            onClose={() => setWeatherCoordinate(null)}
          />
        )}
      </div>
    </div>
  );
};

export default MapView;
