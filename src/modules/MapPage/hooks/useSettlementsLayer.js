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

const STYLE_CACHE = {};

const getThemeByBasemap = (basemapStyle) => {
  if (basemapStyle === 'google-satellite') {
    return {
      fill: '#f0f0f0',
      stroke: '#ffffff',
      capitalFill: '#ffffff',
      capitalStroke: '#d4d4d4',
      opacity: 0.9,
    };
  }

  return {
    fill: '#0a0a0a',
    stroke: '#ffffff',
    capitalFill: '#0a0a0a',
    capitalStroke: '#ffffff',
    opacity: 0.85,
  };
};

const FCLASS_STYLE_CONFIG = {
  national_capital: { radius: 8, star: true },
  city:             { radius: 5.5 },
  town:             { radius: 4.5 },
  village:          { radius: 3.5 },
  suburb:           { radius: 2.5 },
};

const getFeatureStyle = (fclass, basemapStyle = 'osm') => {
  const cacheKey = `${fclass}-${basemapStyle}`;
  if (STYLE_CACHE[cacheKey]) return STYLE_CACHE[cacheKey];

  const cfg = FCLASS_STYLE_CONFIG[fclass] || FCLASS_STYLE_CONFIG.suburb;
  const theme = getThemeByBasemap(basemapStyle);

  const fillColor =
    fclass === 'national_capital'
      ? theme.capitalFill
      : theme.fill;

  const strokeColor =
    fclass === 'national_capital'
      ? theme.capitalStroke
      : theme.stroke;

  const image = cfg.star
    ? new RegularShape({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: strokeColor, width: 1.4 }),
        points: 5,
        radius: cfg.radius,
        radius2: cfg.radius * 0.45,
        angle: 0,
      })
    : new CircleStyle({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: strokeColor, width: 1.2 }),
        radius: cfg.radius,
      });

  STYLE_CACHE[cacheKey] = new Style({ image });
  return STYLE_CACHE[cacheKey];
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
      const hit = mapInstance.hasFeatureAtPixel(pixel, {
        layerFilter: isSettlementsLayer,
      });

      mapInstance.getTargetElement().style.cursor = hit ? 'pointer' : '';
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
