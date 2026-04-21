import { useEffect, useRef, useState, useCallback } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import CircleStyle from 'ol/style/Circle';
import RegularShape from 'ol/style/RegularShape';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Overlay from 'ol/Overlay';
import useSettlementsStore from 'src/app/store/settlementsStore';

const FCLASS_STYLE_CONFIG = {
  national_capital: { color: '#FFD700', stroke: '#b8860b', radius: 12, star: true },
  city:             { color: '#3b82f6', stroke: '#1d4ed8', radius: 9 },
  town:             { color: '#8b5cf6', stroke: '#6d28d9', radius: 7 },
  village:          { color: '#22c55e', stroke: '#15803d', radius: 5 },
  suburb:           { color: '#94a3b8', stroke: '#64748b', radius: 3.5 },
};

const STYLE_CACHE = {};

const getFeatureStyle = (fclass) => {
  if (STYLE_CACHE[fclass]) return STYLE_CACHE[fclass];

  const cfg = FCLASS_STYLE_CONFIG[fclass] || FCLASS_STYLE_CONFIG.suburb;
  let image;

  if (cfg.star) {
    image = new RegularShape({
      fill: new Fill({ color: cfg.color }),
      stroke: new Stroke({ color: cfg.stroke, width: 1.5 }),
      points: 5,
      radius: cfg.radius,
      radius2: cfg.radius * 0.4,
      angle: 0,
    });
  } else {
    image = new CircleStyle({
      fill: new Fill({ color: cfg.color }),
      stroke: new Stroke({ color: cfg.stroke, width: 1.5 }),
      radius: cfg.radius,
    });
  }

  STYLE_CACHE[fclass] = new Style({ image });
  return STYLE_CACHE[fclass];
};

export const useSettlementsLayer = (mapInstance, isMapInitialized) => {
  const layerRef   = useRef(null);
  const overlayRef = useRef(null);
  const popupRef   = useRef(null);
  const [popupContent, setPopupContent] = useState(null);

  const visible       = useSettlementsStore((state) => state.visible);
  const opacity       = useSettlementsStore((state) => state.opacity);

  /* ── Create layer once ────────────────────────────────── */
  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const layer = new VectorLayer({
      source: new VectorSource({
        url: '/layers/nas_punkti_5000.geojson',
        format: new GeoJSON(),
      }),
      style: (feature) => getFeatureStyle(feature.get('fclass')),
      visible,
      opacity,
    });

    layer.set('layerType', 'settlements');
    mapInstance.addLayer(layer);
    layerRef.current = layer;

    return () => {
      mapInstance.removeLayer(layer);
      layerRef.current = null;
    };
  }, [mapInstance, isMapInitialized]);

  /* ── Overlay setup ────────────────────────────────────── */
  useEffect(() => {
    if (!mapInstance || !popupRef.current || overlayRef.current) return;

    const overlay = new Overlay({
      element: popupRef.current,
      autoPan: { animation: { duration: 250 }, margin: 80 },
    });

    overlayRef.current = overlay;
    mapInstance.addOverlay(overlay);

    return () => {
      if (mapInstance && overlay) mapInstance.removeOverlay(overlay);
      overlayRef.current = null;
    };
  }, [mapInstance]);

  /* ── Close ────────────────────────────────────────────── */
  const closePopup = useCallback(() => {
    overlayRef.current?.setPosition(undefined);
    setPopupContent(null);
  }, []);

  /* ── Click & hover handlers ───────────────────────────── */
  useEffect(() => {
    if (!mapInstance) return;

    const isSettlementsLayer = (layer) => layer === layerRef.current;

    const handleClick = (evt) => {
      let handled = false;

      mapInstance.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (handled || !isSettlementsLayer(layer)) return;

        const props = feature.getProperties();
        setPopupContent({
          name:       props.name,
          population: props.population,
          fclass:     props.fclass,
        });
        overlayRef.current?.setPosition(evt.coordinate);
        handled = true;
        return true;
      });

      if (!handled) closePopup();
    };

    const handlePointerMove = (evt) => {
      if (evt.dragging) return;
      const pixel = mapInstance.getEventPixel(evt.originalEvent);
      const hit   = mapInstance.hasFeatureAtPixel(pixel, { layerFilter: isSettlementsLayer });
      if (hit) mapInstance.getTargetElement().style.cursor = 'pointer';
    };

    mapInstance.on('click', handleClick);
    mapInstance.on('pointermove', handlePointerMove);

    return () => {
      mapInstance.un('click', handleClick);
      mapInstance.un('pointermove', handlePointerMove);
    };
  }, [mapInstance, closePopup]);

  /* ── Sync visibility ──────────────────────────────────── */
  useEffect(() => {
    layerRef.current?.setVisible(visible);
  }, [visible]);

  /* ── Sync opacity ─────────────────────────────────────── */
  useEffect(() => {
    layerRef.current?.setOpacity(opacity);
  }, [opacity]);

  return { popupRef, popupContent, closePopup };
};
