import { useEffect, useRef, useState, useCallback } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Overlay from 'ol/Overlay';
import useProtectedAreasStore from 'src/app/store/protectedAreasStore';

const PA_STYLE = new Style({
  fill: new Fill({ color: 'rgba(52,211,153,0.12)' }),
  stroke: new Stroke({
    color: 'rgba(52,211,153,0.65)',
    width: 1.5,
    lineDash: [4, 3],
  }),
});

export const useProtectedAreasLayer = (mapInstance, isMapInitialized) => {
  const layerRef   = useRef(null);
  const overlayRef = useRef(null);
  const popupRef   = useRef(null);
  const [popupContent, setPopupContent] = useState(null);

  const visible = useProtectedAreasStore((s) => s.visible);
  const opacity = useProtectedAreasStore((s) => s.opacity);

  /* ── Create layer ─────────────────────────────────────── */
  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const layer = new VectorLayer({
      source: new VectorSource({
        url: '/layers/protected_areas-w.geojson',
        format: new GeoJSON(),
      }),
      style: PA_STYLE,
      visible,
      opacity,
      zIndex: 3,
    });

    layer.set('layerType', 'protected_areas');
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
        setPopupContent({
          name:     p.NAME,
          nameEng:  p.NAME_ENG,
          desig:    p.DESIG_ENG,
          iucnCat:  p.IUCN_CAT,
          statusYr: p.STATUS_YR,
          repArea:  p.REP_AREA,
          mangAuth: p.MANG_AUTH,
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
