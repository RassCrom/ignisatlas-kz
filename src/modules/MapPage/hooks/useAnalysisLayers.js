import { useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import useAnalysisStore from 'src/app/store/analysisStore';

const POLY_STYLE = new Style({
  fill: new Fill({ color: 'rgba(136, 139, 224, 0.15)' }),
  stroke: new Stroke({ color: 'rgba(136, 139, 224, 0.7)', width: 2 }),
});

const geojsonFormat = new GeoJSON();

export const useAnalysisLayers = (mapInstance, isMapInitialized) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);

  const drawnPolygons = useAnalysisStore((s) => s.drawnPolygons);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const source = new VectorSource();
    const layer = new VectorLayer({ source, style: POLY_STYLE, zIndex: 500 });
    layer.set('id', 'analysis-polygons');

    mapInstance.addLayer(layer);
    sourceRef.current = source;
    layerRef.current = layer;

    return () => {
      if (mapInstance) mapInstance.removeLayer(layer);
    };
  }, [mapInstance, isMapInitialized]);

  useEffect(() => {
    if (!sourceRef.current) return;

    sourceRef.current.clear();
    drawnPolygons.forEach((p) => {
      if (!p.visible) return;
      const feature = geojsonFormat.readFeature(p.geojson, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      feature.setId(p.id);
      sourceRef.current.addFeature(feature);
    });
  }, [drawnPolygons]);
};
