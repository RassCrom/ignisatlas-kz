import { useCallback, useEffect, useRef, useState } from "react";
import { area } from '@turf/turf';
import useMapStore from "../../../../app/store/mapStore";
import useFireModellingStore from 'src/app/store/fireModellingStore';
import { createPopup } from "../../utils/maplibreHelpers";

const FIRE_INTERACTIVE_LAYERS = ['fire-clusters', 'fire-points'];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
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
  if (Number.isNaN(confValue)) {
    if (typeof confidence === "string") {
      const lower = confidence.toLowerCase();
      if (lower.includes("high")) return ["high", "Высокая"];
      if (lower.includes("med")) return ["medium", "Средняя"];
      if (lower.includes("low")) return ["low", "Низкая"];
    }
    return null;
  }
  if (confValue >= 80) return ["high", "Высокая"];
  if (confValue >= 50) return ["medium", "Средняя"];
  return ["low", "Низкая"];
};

const SKIP_PROPS = new Set([
  'name', 'date', 'datetime', 'acq_date', 'acq_time',
  'confidence', 'power', 'brightness', 'frp',
  'geometry', 'lat', 'lon', 'latitude', 'longitude',
  'fireimageid', 'model', 'technogenic',
]);

const PROP_LABELS = {
  satellite: 'Спутник',
  satname: 'Спутник',
  instrument: 'Инструмент',
  scan: 'Скан',
  track: 'Трек',
  version: 'Версия',
  type: 'Тип',
  daynight: 'День/Ночь',
};

const formatPropValue = (key, value) => {
  if (key === 'daynight') return value === 'D' ? 'День' : value === 'N' ? 'Ночь' : value;
  return String(value);
};

const callFireModelAPI = async (fireImageId) => {
  if (!fireImageId) return undefined;
  try {
    const response = await fetch(`https://api.igmass.kz/fire/firemodelbyid?id=${fireImageId}`);
    const data = await response.json();
    return {
      ...data,
      features: data.features.map((feature) => {
        const areaSqM = area(feature);
        return {
          ...feature,
          type: "Feature",
          properties: {
            ...feature.properties,
            area_sqm: areaSqM,
            area_ha: areaSqM / 10_000,
            area_sqkm: areaSqM / 1_000_000,
          },
        };
      }),
    };
  } catch (error) {
    console.error("Error calling Fire Model API:", error);
    return undefined;
  }
};

const usePopupManager = (map, fireLayer) => {
  const popupRef = useRef();
  const popupInstanceRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);
  const [isPopupReady, setIsPopupReady] = useState(false);
  const { setFireModelLayer } = useMapStore();
  const { setTotalArea } = useFireModellingStore();

  const handleFireModelLayer = useCallback(async (fireImageId) => {
    const modelLayer = await callFireModelAPI(fireImageId);
    if (modelLayer?.features) {
      const totalAreaHa = modelLayer.features.reduce((sum, f) => sum + (f.properties.area_ha || 0), 0);
      setTotalArea(totalAreaHa);
    }
    setFireModelLayer(modelLayer);
  }, [setFireModelLayer, setTotalArea]);

  useEffect(() => {
    if (!map || !popupRef.current || popupInstanceRef.current) return;
    popupInstanceRef.current = createPopup().setDOMContent(popupRef.current);
    setIsPopupReady(true);
    return () => {
      popupInstanceRef.current?.remove();
      popupInstanceRef.current = null;
      setIsPopupReady(false);
    };
  }, [map]);

  const closePopup = useCallback((e) => {
    e?.preventDefault();
    popupInstanceRef.current?.remove();
    setPopupContent(null);
    return false;
  }, []);

  const showPopup = useCallback((coordinate, content) => {
    if (!map || !coordinate) return;
    setPopupContent(content);
    popupInstanceRef.current?.setLngLat(coordinate).addTo(map);
  }, [map]);

  const setupPopupInteractions = useCallback(() => {
    if (!map || !fireLayer) return () => {};

    const getAvailableFireLayers = () =>
      FIRE_INTERACTIVE_LAYERS.filter((layerId) => map.getLayer(layerId));

    const handlePointerMove = (event) => {
      const layers = getAvailableFireLayers();
      const hit = layers.length
        ? map.queryRenderedFeatures(event.point, { layers }).length > 0
        : false;
      map.getCanvas().style.cursor = hit ? "pointer" : "";
    };

    const handleFirePopupClick = (event) => {
      closePopup();
      const layers = getAvailableFireLayers();
      if (!layers.length) return;

      const feature = map.queryRenderedFeatures(event.point, { layers })[0];
      if (!feature) return;

      const props = feature.properties || {};

      if (props.cluster || props.point_count) {
        showPopup([event.lngLat.lng, event.lngLat.lat], {
          type: 'fire-cluster',
          coordinate: [event.lngLat.lng, event.lngLat.lat],
          count: props.point_count || props.point_count_abbreviated || 0,
          dateRange: null,
        });
        return;
      }

      const name = props.name || 'Очаг возгорания';
      const date = formatDate(props.date || props.datetime || props.acq_date || '');
      const confidenceRaw = props.confidence || '';
      const power = props.power || props.brightness || props.frp || '';
      const model = props.model || '';
      const fireImageId = props.fireimageid || '';
      const seenLabels = new Set();
      const extra = [];

      Object.entries(props).forEach(([key, value]) => {
        if (SKIP_PROPS.has(key) || value === undefined || value === null || value === '') return;
        const label = PROP_LABELS[key] || key;
        if (seenLabels.has(label)) return;
        seenLabels.add(label);
        extra.push({ key: label, value: formatPropValue(key, value) });
      });

      const confidenceLabel = getConfidenceLabel(confidenceRaw);
      showPopup([event.lngLat.lng, event.lngLat.lat], {
        type: 'fire-point',
        coordinate: [event.lngLat.lng, event.lngLat.lat],
        name,
        date,
        confidence: confidenceLabel
          ? { level: confidenceLabel[0], label: confidenceLabel[1], raw: confidenceRaw }
          : null,
        power: power ? String(power) : '',
        model,
        fireImageId,
        isTechnogenic: props.technogenic === true || props.technogenic === 'true',
        extra,
      });
    };

    map.on("mousemove", handlePointerMove);
    map.on("click", handleFirePopupClick);

    return () => {
      map.off("mousemove", handlePointerMove);
      map.off("click", handleFirePopupClick);
    };
  }, [map, fireLayer, closePopup, showPopup]);

  return {
    popupRef,
    popupContent,
    closePopup,
    showPopup,
    setupPopupInteractions,
    isOverlayReady: isPopupReady,
    handleFireModelLayer,
  };
};

export default usePopupManager;
