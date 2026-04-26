import { useEffect, useRef, useState, useCallback } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Overlay from 'ol/Overlay';
import useClimateZonesStore from 'src/app/store/climateZonesStore';

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const STYLE_CACHE = {};

const getZoneStyle = (color) => {
  if (STYLE_CACHE[color]) return STYLE_CACHE[color];
  STYLE_CACHE[color] = new Style({
    fill: new Fill({ color: hexToRgba(color, 0.7) }),
    stroke: new Stroke({ color: hexToRgba(color, 0.85), width: 1 }),
  });
  return STYLE_CACHE[color];
};

export const useClimateZonesLayer = (mapInstance, isMapInitialized) => {
  const layerRef   = useRef(null);
  const overlayRef = useRef(null);
  const popupRef   = useRef(null);
  const [popupContent, setPopupContent] = useState(null);

  const visible       = useClimateZonesStore((s) => s.visible);
  const opacity       = useClimateZonesStore((s) => s.opacity);

  /* ── Create layer ─────────────────────────────────────── */
  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const layer = new VectorLayer({
      source: new VectorSource({
        url: '/layers/climate_zones_kg1976-2000-w.geojson',
        format: new GeoJSON(),
      }),
      style: (feature) => getZoneStyle(feature.get('color') || '#888888'),
      visible,
      opacity,
      zIndex: 2,
    });

    layer.set('layerType', 'climate_zones');
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

  /* ── Click & hover ────────────────────────────────────── */
  useEffect(() => {
    if (!mapInstance) return;

    const isMyLayer = (layer) => layer === layerRef.current;

    const handleClick = (evt) => {
      let handled = false;
      mapInstance.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (handled || !isMyLayer(layer)) return;
        const props = feature.getProperties();
        setPopupContent({
          koppen:     props.koppen,
          koppenDesc: props.koppen_desc,
          color:      props.color,
        });
        overlayRef.current?.setPosition(evt.coordinate);
        handled = true;
        return true;
      });
      if (!handled) closePopup();
    };

    const handlePointerMove = (evt) => {
      if (evt.dragging) return;
      const hit = mapInstance.hasFeatureAtPixel(
        mapInstance.getEventPixel(evt.originalEvent),
        { layerFilter: isMyLayer }
      );
      mapInstance.getTargetElement().style.cursor = hit ? 'pointer' : '';
    };

    mapInstance.on('click', handleClick);
    mapInstance.on('pointermove', handlePointerMove);

    return () => {
      mapInstance.un('click', handleClick);
      mapInstance.un('pointermove', handlePointerMove);
    };
  }, [mapInstance, closePopup]);

  /* ── Sync visibility / opacity ────────────────────────── */
  useEffect(() => { layerRef.current?.setVisible(visible); }, [visible]);
  useEffect(() => { layerRef.current?.setOpacity(opacity); }, [opacity]);

  return { popupRef, popupContent, closePopup };
};
