import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from 'ol/format/GeoJSON.js'
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import { useLayersStore } from "../../../app/store/layersStore";

export const createBlanketLayer = () => {
  return new VectorLayer({
    declutter: true,
    source: new VectorSource({
      url: "/layers/blanket.geojson",
      format: new GeoJSON(),
      // strategy: bboxStrategy, // BUG BBOX startegy causes readding the layer on the max zoom out
    }),
    overlaps: false,
    renderMode: 'vector',
    style: new Style({
      fill: new Fill({ color: "rgba(13, 14, 14, 0.7)" }),
    }),
  });
};

const sharedAdminStyle = new Style({
  stroke: new Stroke({ color: "#4999E8", width: 1 }),
  fill: new Fill({ color: "rgba(0, 0, 0, 0.2)" })
});

export const createAdminBoundary = (level, layerVisibility = false) => {
  return new VectorLayer({
    updateWhileAnimating: false,
    updateWhileInteracting: false,
    declutter: true,
    visible: layerVisibility,
    source: new VectorSource({
      url: `/layers/KAZ_OSM_BORDER_LVL${level}.geojson`,
      format: new GeoJSON()
    }),
    url: extent => `/api/boundaries?level=${level}&bbox=${extent.join(',')}`,
    strategy: bboxStrategy,
    overlaps: false,
    renderMode: 'image',
    style: sharedAdminStyle
  })
}

const iconScale = 0.04

const styles = {
  rescueStyle: new Style({
    image: new Icon({ src: "/icons/rescue.png", scale: iconScale })
  }),
  fireDepStyle: new Style({
    image: new Icon({ src: "/icons/fire.png", scale: iconScale })
  }),
  hydrantStyle: new Style({
    image: new Icon({ src: "/icons/hydrant.png", scale: iconScale })
  }),
  healthStyle: new Style({
    image: new Icon({ src: "/icons/hospital.png", scale: iconScale })
  }),
  aviaStyle: new Style({
    image: new Icon({ src: "/icons/avia.png", scale: iconScale })
  }),
  osoStyle: new Style({
    image: new Icon({ src: "/icons/oso.png", scale: iconScale })
  }),
  pointSoboraStyle: new Style({
    image: new Icon({ src: "/icons/assembly.png", scale: iconScale })
  }),
  trainFireStyle: new Style({
    image: new Icon({ src: "/icons/train.png", scale: iconScale })
  })
};

export const createEmergencyLayers = () => {
  const { layers } = useLayersStore.getState();

  return layers.map(cfg => {
    const layer = new VectorLayer({
      declutter: true,
      visible: cfg.visible,
      opacity: 1,
      source: new VectorSource({
        url: `/layers/kchs/${cfg.geojsonFile}`,
        format: new GeoJSON()
      }),
      style: styles[cfg.style] || null
    });

    layer.set('id', cfg.id);

    return layer;
  });
};
