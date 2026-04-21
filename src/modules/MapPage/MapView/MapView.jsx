import { useRef, useState, useMemo, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { Popover } from "antd";

import MapToolbar from "./components/MapToolbar.jsx";
import FirePopup from "./components/FirePopup.jsx";
import FireModelPopup from "./components/FireModelPopup.jsx";
import EmergencyPopup from "./components/EmergencyPopup.jsx";
import SettlementsPopup from "./components/SettlementsPopup.jsx";
import WeatherPopup from "./components/WeatherPopup.jsx";
import usePopupManager from "./components/PopupManager.jsx";

import {
  createAdminBoundary,
  createBlanketLayer,
  createEmergencyLayers,
} from "../utils/layers.js";
import { osmLayer } from "../utils/basemaps.js";

import useFireStore from "src/app/store/fireStore";
import useAdminBoundaryStore from "src/app/store/adminBoundaryStore.js";
import useSentinelStore from "src/app/store/sentinelStore.js";
import useSentinel3Store from "src/app/store/sentinel3Store.js";
import useSentinel5Store from "src/app/store/sentinel5Store.js";
import useSentinel1Store from "src/app/store/sentinel1Store.js";
import useMethaneStore from "src/app/store/methaneStore";
import useRiskMapStore from "src/app/store/riskMapStore.js";
import useFireModellingStore from "src/app/store/fireModellingStore.js";
import { useLayersStore } from "src/app/store/layersStore.js";
import useMapStore from "src/app/store/mapStore.js";

import { useMapInitialization } from "../hooks/useMapInitialization";
import { useFireLayer } from "../hooks/useFireLayer";
import { useSentinelLayers } from "../hooks/useSentinelLayers";
import { useMethaneLayers } from "../hooks/useMethaneLayers";
import { useRiskLayers } from "../hooks/useRiskLayers";
import { useLulcLayer } from "../hooks/useLulcLayer";
import { useSettlementsLayer } from "../hooks/useSettlementsLayer";
import { useFireModelling } from "../hooks/useFireModelling.js";
import { useEmergencyPopup } from "../hooks/useEmergencyPopup.js";

import "ol/ol.css";
import "ol-geocoder/dist/ol-geocoder.min.css";
import "react-toastify/dist/ReactToastify.css";
import styles from "./MapView.module.scss";
import "./mapStyles.scss";

const MapView = () => {
  const mapRef = useRef(null);
  const [basemap, setBasemap] = useState(osmLayer);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [weatherCoordinate, setWeatherCoordinate] = useState(null);

  // Store hooks
  const fireStore = useFireStore();
  const adminBoundaryStore = useAdminBoundaryStore();
  const methaneStore = useMethaneStore();
  const sentinelStore = useSentinelStore();
  const sentinel3Store = useSentinel3Store();
  const sentinel5Store = useSentinel5Store();
  const sentinel1Store = useSentinel1Store();
  const riskMapStore = useRiskMapStore();
  const { layers } = useLayersStore();

  // Custom hooks
  const { fireLayer, loadFireData } = useFireLayer(fireStore);
  const methaneLayers = useMethaneLayers(methaneStore);
  const mapStore = useMapStore();
  const fireModellingStore = useFireModellingStore();

  // Base layers
  const blanket = useMemo(() => createBlanketLayer(), []);
  const adminBoundaries = useMemo(
    () => ({
      country: createAdminBoundary(
        "1",
        adminBoundaryStore.layerVisibility.country_boundaries
      ),
      region: createAdminBoundary(
        "2",
        adminBoundaryStore.layerVisibility.region_boundaries
      ),
      district: createAdminBoundary(
        "3",
        adminBoundaryStore.layerVisibility.district_boundaries
      ),
    }),
    []
  );
  const emergencyLayers = useMemo(() => createEmergencyLayers(), []);

  // initial layers for map
  const initialLayers = [
    adminBoundaries.country,
    adminBoundaries.region,
    adminBoundaries.district,
    methaneLayers.tiffLayer,
    methaneLayers.emitJsonLayer,
    ...methaneLayers.emitLayers,
    methaneLayers.sn2Layer,
    blanket,
    ...emergencyLayers,
  ];

  // Initialize map
  const { mapInstance, isMapInitialized } = useMapInitialization(
    mapRef,
    basemap,
    initialLayers,
    styles
  );

  // global reference for other hooks
  useEffect(() => {
    if (mapInstance) {
      window.mapInstance = mapInstance;
    }
  }, [mapInstance]);

  // Weather popup via context menu event
  useEffect(() => {
    const handler = (e) => setWeatherCoordinate(e.detail.coordinate);
    window.addEventListener('cm:weather', handler);
    return () => window.removeEventListener('cm:weather', handler);
  }, []);

  // Initialize sentinel layers
  const sentinelLayers = useSentinelLayers("sentinel2", sentinelStore);
  const sentinel3Layers = useSentinelLayers("sentinel3", sentinel3Store);
  const sentinel5Layers = useSentinelLayers("sentinel5", sentinel5Store);
  const sentinel1Layers = useSentinelLayers("sentinel1", sentinel1Store);

  // Initialize risk layers
  useRiskLayers(riskMapStore.riskDates, mapInstance, isMapInitialized);
  useLulcLayer(mapInstance, isMapInitialized);
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

  // Emergency layers popup
  const {
    popupRef:    emergencyPopupRef,
    popupContent: emergencyPopupContent,
    closePopup:  closeEmergencyPopup,
  } = useEmergencyPopup(mapInstance, emergencyLayers);

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
    setupPopupInteractions,
    fireLayer?.getVisible(),
    isOverlayReady,
    fireLayer,
  ]);

  // Admin boundary visibility and opacity
  useEffect(() => {
    Object.entries(adminBoundaries).forEach(([key, layer]) => {
      const visibilityKey = `${key}_boundaries`;
      const visibility = adminBoundaryStore.layerVisibility[visibilityKey];
      const opacity = adminBoundaryStore.layerOpacity[visibilityKey] ?? 1;

      layer.setVisible(visibility);
      layer.setOpacity(opacity);
    });
  }, [
    adminBoundaries,
    adminBoundaryStore.layerVisibility,
    adminBoundaryStore.layerOpacity,
  ]);

  // Emergency layers
  useEffect(() => {
    emergencyLayers.forEach((layer) => {
      const id = layer.get("id");
      const layerConfig = layers.find((i) => i.id === id);
      if (layerConfig) {
        layer.setVisible(layerConfig.visible);
      }
    });
  }, [emergencyLayers, layers]);

  // Fire layer management
  useEffect(() => {
    if (!isMapInitialized || !mapInstance || !fireLayer) return;

    if (fireStore.fireLayerVisible) {
      if (
        fireLayer
          .getLayers()
          .every((layer) => !mapInstance.getLayers().getArray().includes(layer))
      ) {
        loadFireData(mapInstance);
      } else {
        fireLayer.setVisible(true);
      }
    } else if (fireLayer.getVisible()) {
      fireLayer.setVisible(false);
    }
  }, [fireStore.fireLayerVisible, isMapInitialized, fireLayer, loadFireData]);

  // Update fire layer when date changes
  useEffect(() => {
    if (fireStore.fireLayerVisible && fireLayer && mapInstance) {
      loadFireData(mapInstance);
    }
  }, [fireStore.dateHasChanged]);

  // Add map interactions
  useEffect(() => {
    if (!mapInstance) return;

    mapInstance.showPopup = showPopup;
    mapInstance.closePopup = closePopup;

    const handleClick = (event) => {
      mapInstance.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
        if (layer === methaneLayers.emitJsonLayer) {
          setSelectedFeature(feature.getProperties());
          setIsModalVisible(true);
          return true;
        }
      });
    };

    mapInstance.on("click", handleClick);

    return () => {
      mapInstance.un("click", handleClick);
    };
  }, [mapInstance, showPopup, closePopup, methaneLayers.emitJsonLayer]);

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

        {isModalVisible && selectedFeature && (
          <Popover
            open={true}
            onOpenChange={(visible) => setIsModalVisible(visible)}
            content={
              <div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <strong>Информация</strong>
                  <button
                    onClick={() => setIsModalVisible(false)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "16px",
                      cursor: "pointer",
                      lineHeight: "1",
                      fontWeight: 700,
                    }}
                  >
                    ✕
                  </button>
                </div>
                <hr style={{ margin: "8px 0" }} />
                {Object.entries(selectedFeature)
                  .filter(
                    ([key]) =>
                      ![
                        "layer",
                        "path",
                        "DAAC Scene Names",
                        "geometry",
                      ].includes(key)
                  )
                  .map(([key, value]) => (
                    <p key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </p>
                  ))}
              </div>
            }
            placement="top"
            arrow={false}
          >
            <div
              style={{
                position: "absolute",
                right: 250,
                bottom: 25,
                cursor: "pointer",
              }}
            />
          </Popover>
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
