import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useDroughtStore from 'src/app/store/droughtStore';
import {
  buildDroughtFeatureCollection,
  summarizeDrought,
} from 'src/utils/droughtMonitor';
import {
  createPopup,
  removeSourceWithLayers,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

const SOURCE_ID = 'drought-monitor-source';
const FILL_LAYER_ID = 'drought-monitor-fill';
const LINE_LAYER_ID = 'drought-monitor-line';

export const useDroughtLayer = (mapInstance, isMapInitialized) => {
  const popupRef = useRef(null);
  const popupInstanceRef = useRef(null);
  const [regions, setRegions] = useState(null);
  const [popupContent, setPopupContent] = useState(null);

  const visible = useDroughtStore((state) => state.visible);
  const opacity = useDroughtStore((state) => state.opacity);
  const selectedIndex = useDroughtStore((state) => state.selectedIndex);
  const selectedMonth = useDroughtStore((state) => state.selectedMonth);
  const severityFilter = useDroughtStore((state) => state.severityFilter);
  const regionFilter = useDroughtStore((state) => state.regionFilter);
  const showOutlines = useDroughtStore((state) => state.showOutlines);
  const setPinnedRegionCode = useDroughtStore((state) => state.setPinnedRegionCode);

  useEffect(() => {
    let cancelled = false;

    fetch('/layers/regions.geojson')
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setRegions(data);
      })
      .catch((error) => {
        console.error('Failed to load drought regions:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const droughtData = useMemo(() => buildDroughtFeatureCollection({
    regions,
    selectedIndex,
    selectedMonth,
    severityFilter,
    regionFilter,
  }), [regionFilter, regions, selectedIndex, selectedMonth, severityFilter]);

  const summary = useMemo(() => summarizeDrought(droughtData), [droughtData]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized || !regions) return;

    if (!mapInstance.getSource(SOURCE_ID)) {
      mapInstance.addSource(SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
    }

    if (!mapInstance.getLayer(FILL_LAYER_ID)) {
      mapInstance.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        layout: { visibility: 'none' },
        paint: {
          'fill-color': ['get', 'drought_color'],
          'fill-opacity': [
            'case',
            ['boolean', ['get', 'drought_included'], false],
            0.58,
            0.04,
          ],
        },
      });
    }

    if (!mapInstance.getLayer(LINE_LAYER_ID)) {
      mapInstance.addLayer({
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: { visibility: 'none' },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['get', 'drought_included'], false],
            '#fff4c2',
            'rgba(255,255,255,0.18)',
          ],
          'line-opacity': [
            'case',
            ['boolean', ['get', 'drought_included'], false],
            0.75,
            0.2,
          ],
          'line-width': [
            'case',
            ['boolean', ['get', 'drought_included'], false],
            1.1,
            0.5,
          ],
        },
      });
    }

    return () => removeSourceWithLayers(mapInstance, SOURCE_ID);
  }, [isMapInitialized, mapInstance, regions]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized || !mapInstance.getSource(SOURCE_ID)) return;
    mapInstance.getSource(SOURCE_ID)?.setData(droughtData);
  }, [droughtData, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerVisibility(mapInstance, FILL_LAYER_ID, visible);
    setLayerVisibility(mapInstance, LINE_LAYER_ID, visible && showOutlines);
  }, [isMapInitialized, mapInstance, showOutlines, visible]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized || !mapInstance.getLayer(FILL_LAYER_ID)) return;
    mapInstance.setPaintProperty(FILL_LAYER_ID, 'fill-opacity', [
      'case',
      ['boolean', ['get', 'drought_included'], false],
      opacity,
      0.04,
    ]);
  }, [isMapInitialized, mapInstance, opacity]);

  useEffect(() => {
    if (!mapInstance || !popupRef.current || popupInstanceRef.current) return;
    popupInstanceRef.current = createPopup().setDOMContent(popupRef.current);
    return () => {
      popupInstanceRef.current?.remove();
      popupInstanceRef.current = null;
    };
  }, [mapInstance]);

  const closePopup = useCallback(() => {
    popupInstanceRef.current?.remove();
    setPopupContent(null);
  }, []);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const handleClick = (event) => {
      const feature = mapInstance.queryRenderedFeatures(event.point, { layers: [FILL_LAYER_ID] })[0];
      if (!feature?.properties) {
        closePopup();
        return;
      }

      setPinnedRegionCode(feature.properties.drought_region_code);
      setPopupContent(feature.properties);
      popupInstanceRef.current?.setLngLat(event.lngLat).addTo(mapInstance);
    };

    mapInstance.on('click', handleClick);
    return () => mapInstance.off('click', handleClick);
  }, [closePopup, isMapInitialized, mapInstance, setPinnedRegionCode]);

  return {
    popupRef,
    popupContent,
    closePopup,
    droughtData,
    droughtSummary: summary,
    droughtRegions: regions,
  };
};
