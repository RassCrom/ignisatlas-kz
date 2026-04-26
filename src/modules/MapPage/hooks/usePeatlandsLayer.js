import { useEffect, useRef, useState, useCallback } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Overlay from 'ol/Overlay';
import usePeatlandsStore from 'src/app/store/peatlandsStore';

// DN=1 peat dominated, DN=2 peat in soil mosaic
const PEAT_STYLES = {
  1: new Style({
    fill: new Fill({ color: 'rgba(101,56,12,0.55)' }),
    stroke: new Stroke({ color: 'rgba(101,56,12,0.9)', width: 1 }),
  }),
  2: new Style({
    fill: new Fill({ color: 'rgba(160,105,45,0.4)' }),
    stroke: new Stroke({ color: 'rgba(160,105,45,0.8)', width: 0.8 }),
  }),
};
const PEAT_DEFAULT = new Style({
  fill: new Fill({ color: 'rgba(130,80,28,0.45)' }),
  stroke: new Stroke({ color: 'rgba(130,80,28,0.85)', width: 1 }),
});

export const usePeatlandsLayer = (mapInstance, isMapInitialized) => {
  const layerRef   = useRef(null);
  const overlayRef = useRef(null);
  const popupRef   = useRef(null);
  const [popupContent, setPopupContent] = useState(null);

  const visible = usePeatlandsStore((s) => s.visible);
  const opacity = usePeatlandsStore((s) => s.opacity);

  /* ── Create layer ─────────────────────────────────────── */
  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const layer = new VectorLayer({
      source: new VectorSource({
        url: '/layers/peatlands-w.geojson',
        format: new GeoJSON(),
      }),
      style: (feature) => PEAT_STYLES[feature.get('DN')] || PEAT_DEFAULT,
      visible,
      opacity,
      zIndex: 4,
    });

    layer.set('layerType', 'peatlands');
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
        const p = feature.getProperties();
        setPopupContent({ dn: p.DN, description: p.description });
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
