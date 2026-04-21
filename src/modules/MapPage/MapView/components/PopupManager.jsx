import { useRef, useState, useEffect, useCallback } from "react";
import Overlay from "ol/Overlay";
import * as turf from '@turf/turf';
import useMapStore from "../../../../app/store/mapStore";
import useFireModellingStore from 'src/app/store/fireModellingStore';

/* ── Helpers ───────────────────────────────────────── */

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const getConfidenceLabel = (confidence) => {
  if (!confidence) return null;
  const confValue = parseFloat(confidence);
  if (isNaN(confValue)) {
    if (typeof confidence === "string") {
      const lower = confidence.toLowerCase();
      if (lower.includes("high")) return ["high", "Высокая"];
      if (lower.includes("med"))  return ["medium", "Средняя"];
      if (lower.includes("low"))  return ["low", "Низкая"];
    }
    return null;
  }
  if (confValue >= 80) return ["high", "Высокая"];
  if (confValue >= 50) return ["medium", "Средняя"];
  return ["low", "Низкая"];
};

// Keys that are shown in dedicated fields → skip in "extra" section
const SKIP_PROPS = new Set([
  'name', 'date', 'datetime', 'acq_date', 'acq_time',
  'confidence', 'power', 'brightness', 'frp',
  'geometry', 'lat', 'lon', 'latitude', 'longitude',
  'fireimageid', 'model', 'technogenic',
]);

const PROP_LABELS = {
  satellite:    'Спутник',
  satname:      'Спутник',
  instrument:   'Инструмент',
  scan:         'Скан',
  track:        'Трек',
  version:      'Версия',
  type:         'Тип',
  daynight:     'День/Ночь',
};

const formatPropValue = (key, value) => {
  if (key === 'daynight') return value === 'D' ? 'День' : value === 'N' ? 'Ночь' : value;
  return String(value);
};

/* ── API call ──────────────────────────────────────── */

const callFireModelAPI = async (fireImageId) => {
  if (!fireImageId) return;
  try {
    const response = await fetch(
      `https://api.igmass.kz/fire/firemodelbyid?id=${fireImageId}`
    );
    const data = await response.json();
    return {
      ...data,
      features: data.features.map((feature) => {
        const areaSqM = turf.area(feature);
        return {
          ...feature,
          type: "Feature",
          properties: {
            ...feature.properties,
            area_sqm:  areaSqM,
            area_ha:   areaSqM / 10_000,
            area_sqkm: areaSqM / 1_000_000,
          },
        };
      }),
    };
  } catch (error) {
    console.error("Error calling Fire Model API:", error);
  }
};

/* ── Hook ──────────────────────────────────────────── */

const usePopupManager = (map, fireLayer) => {
  const popupRef = useRef();
  const [popupContent, setPopupContent] = useState(null);
  const overlayRef = useRef(null);
  const [isOverlayReady, setIsOverlayReady] = useState(false);
  const { setFireModelLayer } = useMapStore();
  const { setTotalArea } = useFireModellingStore();

  const handleFireModelLayer = useCallback(async (fireImageId) => {
    const modelLayer = await callFireModelAPI(fireImageId);
    if (modelLayer?.features) {
      const totalAreaHa = modelLayer.features.reduce(
        (sum, f) => sum + (f.properties.area_ha || 0), 0
      );
      setTotalArea(totalAreaHa);
    }
    setFireModelLayer(modelLayer);
  }, [setFireModelLayer, setTotalArea]);

  /* ── Overlay setup ── */

  useEffect(() => {
    if (!map || !popupRef.current || overlayRef.current) return;

    const overlay = new Overlay({
      element: popupRef.current,
      autoPan: { animation: { duration: 250 }, margin: 80 },
    });

    overlayRef.current = overlay;
    map.addOverlay(overlay);
    setIsOverlayReady(true);

    return () => {
      if (map && overlay) map.removeOverlay(overlay);
      overlayRef.current = null;
      setIsOverlayReady(false);
    };
  }, [map]);

  /* ── Popup actions ── */

  const closePopup = useCallback((e) => {
    e?.preventDefault();
    overlayRef.current?.setPosition(undefined);
    setPopupContent(null);
    return false;
  }, []);

  const showPopup = useCallback((coordinate, content) => {
    if (overlayRef.current && coordinate) {
      setPopupContent(content);
      overlayRef.current.setPosition(coordinate);
    }
  }, []);

  /* ── Map interactions ── */

  const setupPopupInteractions = useCallback(() => {
    if (!map || !fireLayer) return () => {};

    const handlePointerMove = (evt) => {
      if (evt.dragging) return;
      const pixel = map.getEventPixel(evt.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel, {
        layerFilter: (layer) =>
          fireLayer.containsLayer
            ? fireLayer.containsLayer(layer)
            : fireLayer.getLayers().includes(layer),
      });
      map.getTargetElement().style.cursor = hit ? "pointer" : "";
    };

    const handleFirePopupClick = (evt) => {
      closePopup();
      let foundFeature = false;

      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        const isFireLayer = fireLayer.containsLayer
          ? fireLayer.containsLayer(layer)
          : fireLayer.getLayers().includes(layer);

        if (!foundFeature && isFireLayer) {
          /* ── Cluster ── */
          if (layer === fireLayer.clusterLayer) {
            const features = feature.get("features");
            if (features?.length > 1) {
              showPopup(evt.coordinate, {
                type: 'fire-cluster',
                coordinate: evt.coordinate,
                count: features.length,
                dateRange: {
                  start: formatDate(features[0].get("date") || features[0].get("datetime")),
                  end: formatDate(
                    features[features.length - 1].get("date") ||
                    features[features.length - 1].get("datetime")
                  ),
                },
              });
              foundFeature = true;
              return true;
            }
            if (features?.length === 1) feature = features[0];
          }

          /* ── Single fire point ── */
          const props         = feature.getProperties();
          const name          = props.name || 'Очаг возгорания';
          const date          = formatDate(props.date || props.datetime || '');
          const confidenceRaw = props.confidence || '';
          const power         = props.power || props.brightness || props.frp || '';
          const model         = props.model || '';
          const fireImageId   = props.fireimageid || '';

          // Collect extra props (translated, de-duped)
          const seenLabels = new Set();
          const extra = [];
          Object.entries(props).forEach(([key, value]) => {
            if (
              SKIP_PROPS.has(key) ||
              value === undefined || value === null || value === ''
            ) return;
            const label = PROP_LABELS[key] || key;
            if (seenLabels.has(label)) return;
            seenLabels.add(label);
            extra.push({ key: label, value: formatPropValue(key, value) });
          });

          showPopup(evt.coordinate, {
            type:           'fire-point',
            coordinate:     evt.coordinate,
            name,
            date,
            confidence:     getConfidenceLabel(confidenceRaw)
              ? { level: getConfidenceLabel(confidenceRaw)[0], label: getConfidenceLabel(confidenceRaw)[1], raw: confidenceRaw }
              : null,
            power:          power ? String(power) : '',
            model,
            fireImageId,
            isTechnogenic:  props.technogenic === true,
            extra,
          });

          foundFeature = true;
          return true;
        }
        return false;
      });
    };

    if (!isOverlayReady) return () => {};

    map.on("pointermove", handlePointerMove);
    map.on("click", handleFirePopupClick);

    return () => {
      map.un("pointermove", handlePointerMove);
      map.un("click", handleFirePopupClick);
    };
  }, [map, fireLayer, closePopup, showPopup, isOverlayReady]);

  return {
    popupRef,
    popupContent,
    closePopup,
    showPopup,
    setupPopupInteractions,
    isOverlayReady,
    handleFireModelLayer,
  };
};

export default usePopupManager;
