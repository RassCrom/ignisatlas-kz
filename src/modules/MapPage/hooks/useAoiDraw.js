import { useEffect, useRef, useCallback } from 'react';
import Draw, { createBox } from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { transformExtent } from 'ol/proj';
import useAoiStore from 'src/app/store/aoiStore';

const AOI_STYLE = new Style({
  stroke: new Stroke({
    color: 'rgba(136, 139, 224, 0.8)',
    width: 2,
    lineDash: [6, 4],
  }),
  fill: new Fill({
    color: 'rgba(136, 139, 224, 0.1)',
  }),
});

const geojsonFormat = new GeoJSON();

/**
 * Hook that adds AOI (Area of Interest) drawing tools to the OpenLayers map.
 * Supports bounding box and polygon draw modes.
 * Uses the shared aoiStore so both Sentinel and Landsat explorers share one AOI.
 */
export const useAoiDraw = (mapInstance, isMapInitialized) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);
  const drawRef = useRef(null);

  const aoiDrawMode = useAoiStore((s) => s.aoiDrawMode);
  const setAoi = useAoiStore((s) => s.setAoi);
  const clearAoiStore = useAoiStore((s) => s.clearAoi);
  const setAoiDrawMode = useAoiStore((s) => s.setAoiDrawMode);

  const aoiVisible = useAoiStore((s) => s.aoiVisible);

  // Initialize the vector layer once
  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const source = new VectorSource();
    const layer = new VectorLayer({
      source,
      style: AOI_STYLE,
      zIndex: 999,
      visible: aoiVisible,
    });
    layer.set('id', 'aoi-draw-layer');

    mapInstance.addLayer(layer);
    sourceRef.current = source;
    layerRef.current = layer;

    return () => {
      if (mapInstance) {
        mapInstance.removeLayer(layer);
      }
      sourceRef.current = null;
      layerRef.current = null;
    };
  }, [mapInstance, isMapInitialized]);

  // Sync AOI visibility with store
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setVisible(aoiVisible);
    }
  }, [aoiVisible]);

  // Handle draw mode changes
  useEffect(() => {
    if (!mapInstance || !isMapInitialized || !sourceRef.current) return;

    // Remove any previous draw interaction
    if (drawRef.current) {
      mapInstance.removeInteraction(drawRef.current);
      drawRef.current = null;
    }

    if (!aoiDrawMode) return;

    // Clear previous AOI
    sourceRef.current.clear();

    const drawType = aoiDrawMode === 'box' ? 'Circle' : 'Polygon';
    const drawOptions = {
      source: sourceRef.current,
      type: drawType,
    };

    // Box mode uses geometryFunction for rectangle
    if (aoiDrawMode === 'box') {
      drawOptions.geometryFunction = createBox();
    }

    const draw = new Draw(drawOptions);
    drawRef.current = draw;

    draw.on('drawend', (event) => {
      const feature = event.feature;
      const geom = feature.getGeometry();

      // Convert to WGS84 GeoJSON
      const geojson = geojsonFormat.writeGeometryObject(geom, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      });

      // Compute bbox
      const extent3857 = geom.getExtent();
      const bbox = transformExtent(extent3857, 'EPSG:3857', 'EPSG:4326');
      const roundedBbox = bbox.map((v) => Math.round(v * 1000000) / 1000000);

      setAoi(geojson, roundedBbox);
      setAoiDrawMode(null); // Exit draw mode after completing

      // Remove draw interaction after completion
      setTimeout(() => {
        if (mapInstance && drawRef.current) {
          mapInstance.removeInteraction(drawRef.current);
          drawRef.current = null;
        }
      }, 50);
    });

    mapInstance.addInteraction(draw);

    return () => {
      if (mapInstance && drawRef.current) {
        mapInstance.removeInteraction(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [aoiDrawMode, mapInstance, isMapInitialized, setAoi, setAoiDrawMode]);

  // Clear AOI from map and store
  const clearAoi = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.clear();
    }
    clearAoiStore();
  }, [clearAoiStore]);

  return { clearAoi };
};
