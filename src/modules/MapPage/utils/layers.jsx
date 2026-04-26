import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON.js";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { bbox as bboxStrategy } from "ol/loadingstrategy";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Fire,
  FirstAidKit,
  Hospital,
  AirplaneTilt,
  UsersThree,
  Train,
  Drop,
  ShieldWarning,
} from "@phosphor-icons/react";

import { useLayersStore } from "../../../app/store/layersStore";

export const createBlanketLayer = () => {
  return new VectorLayer({
    declutter: true,
    source: new VectorSource({
      url: "/layers/blanket.geojson",
      format: new GeoJSON(),
    }),
    zIndex: 99999,
    overlaps: false,
    renderMode: "vector",
    style: new Style({
      fill: new Fill({ color: "rgba(13, 14, 14, .95)" }),
    }),
  });
};

const sharedAdminStyle = new Style({
  stroke: new Stroke({ color: "#4999E8", width: 1 }),
  fill: new Fill({ color: "rgba(0, 0, 0, 0.2)" }),
});

export const createAdminBoundary = (level, layerVisibility = false) => {
  return new VectorLayer({
    updateWhileAnimating: false,
    updateWhileInteracting: false,
    declutter: true,
    visible: layerVisibility,
    source: new VectorSource({
      url: `/layers/KAZ_OSM_BORDER_LVL${level}.geojson`,
      format: new GeoJSON(),
    }),
    url: (extent) => `/api/boundaries?level=${level}&bbox=${extent.join(",")}`,
    strategy: bboxStrategy,
    overlaps: false,
    renderMode: "image",
    style: sharedAdminStyle,
  });
};

const phosphorIconToDataUrl = (IconComponent, options = {}) => {
  const {
    color = "#f8fafc",
    weight = "fill",
    size = 24,
  } = options;

  const svg = renderToStaticMarkup(
    <IconComponent
      size={size}
      color={color}
      weight={weight}
      xmlns="http://www.w3.org/2000/svg"
    />
  );

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const createPhosphorStyle = (IconComponent, options = {}) => {
  const {
    color = "#f8fafc",
    weight = "fill",
    scale = 0.85,
    anchor = [0.5, 0.5],
  } = options;

  return new Style({
    image: new Icon({
      src: phosphorIconToDataUrl(IconComponent, {
        color,
        weight,
        size: 24,
      }),
      scale,
      anchor,
      crossOrigin: "anonymous",
    }),
  });
};


const styles = {
  rescueStyle: createPhosphorStyle(FirstAidKit, {
    color: "#38bdf8",
    weight: "fill",
  }),

  fireDepStyle: createPhosphorStyle(Fire, {
    color: "#f97316",
    weight: "fill",
  }),

  hydrantStyle: createPhosphorStyle(Drop, {
    color: "#60a5fa",
    weight: "fill",
  }),

  healthStyle: createPhosphorStyle(Hospital, {
    color: "#ef4444",
    weight: "fill",
  }),

  aviaStyle: createPhosphorStyle(AirplaneTilt, {
    color: "#c4b5fd",
    weight: "fill",
  }),

  osoStyle: createPhosphorStyle(ShieldWarning, {
    color: "#facc15",
    weight: "fill",
  }),

  pointSoboraStyle: createPhosphorStyle(UsersThree, {
    color: "#22c55e",
    weight: "fill",
  }),

  trainFireStyle: createPhosphorStyle(Train, {
    color: "#fb7185",
    weight: "fill",
  }),
};

export const createEmergencyLayers = () => {
  const { layers } = useLayersStore.getState();

  return layers.map((cfg) => {
    const layer = new VectorLayer({
      declutter: true,
      visible: cfg.visible,
      opacity: 1,
      source: new VectorSource({
        url: `/layers/kchs/${cfg.geojsonFile}`,
        format: new GeoJSON(),
      }),
      style: styles[cfg.style] || null,
    });

    layer.set("id", cfg.id);

    return layer;
  });
};