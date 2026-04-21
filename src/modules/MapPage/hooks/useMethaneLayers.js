import { useMemo, useEffect } from 'react';
import TileLayer from 'ol/layer/Tile.js';
import XYZ from 'ol/source/XYZ.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from "ol/style/Fill";

export const useMethaneLayers = (methaneStore) => {
  const {
    methaneYear,
    methaneLayerVisible,
    methaneOpacity,
    emmitLayerVisible,
    emmitLayerIds,
    emitSn2LayerVisible,
    emitSn2Opacity,
    sandGeoVectorVisible
  } = methaneStore;

  const tiffLayer = useMemo(() => {
    return new TileLayer({
      source: new XYZ({
        url: `https://fires.kz/data/ch4_tiles/${methaneYear}/{z}/{x}/{-y}.png`,
        projection: 'EPSG:3857',
        tileSize: [256, 256],
        maxZoom: 10,
        onError: (error) => {
          if (error.status !== 404) {
            console.error('Error loading Tiff XYZ tile:', error);
          }
        },
      }),
      opacity: methaneOpacity * 0.01,
      visible: methaneLayerVisible,
    });
  }, [methaneYear, methaneLayerVisible]);

  const sn2Layer = useMemo(() => {
    return new TileLayer({
      source: new XYZ({
        url: 'https://fires.kz/data/mbmp_final/{z}/{x}/{-y}.png',
        projection: 'EPSG:3857',
        tileSize: [256, 256],
        maxZoom: 14,
        onError: (error) => {
          if (error.status !== 404) {
            console.error('Error loading Tiff XYZ tile:', error);
          }
        },
      }),
      opacity: emitSn2Opacity * 0.01,
      visible: emitSn2LayerVisible
    });
  }, [emitSn2LayerVisible]);

  const emitLayers = useMemo(() => {
    if (emmitLayerIds.length === 0) return [];

    return emmitLayerIds.map((emit) => {
      return new TileLayer({
        source: new XYZ({
          url: `https://fires.kz/data/emit_tiles/${emit}/{z}/{x}/{-y}.png`,
          projection: 'EPSG:3857',
          tileSize: [256, 256],
          maxZoom: 14,
          onError: (error) => {
            if (error.status !== 404) {
              console.error('Error loading Emit XYZ tile:', error);
            }
          },
        }),
        visible: emmitLayerVisible,
      });
    });
  }, [emmitLayerVisible, emmitLayerIds]);

  const emitJsonLayer = useMemo(() => {
    const source = new VectorSource({
      url: `/emit_json/emit_all.geojson`,
      projection: 'EPSG:3857',
      format: new GeoJSON(),
    });

    return new VectorLayer({
      source,
      style: new Style({
        stroke: new Stroke({
          color: 'red',
          width: 5,
        }),
        fill: new Fill({
          color: "#fff",
        })
      }),
      visible: emmitLayerVisible
    });
  }, [emmitLayerVisible, emmitLayerIds]);

  const sandGeoVectorLayer = useMemo(() => {
    return new VectorLayer({
      source: new VectorSource({
        url: 'https://fires.kz/data/carbon_mapper_.geojson',
        format: new GeoJSON(),
      }),
      visible: sandGeoVectorVisible,
    });
  }, [sandGeoVectorVisible]);

  useEffect(() => {
    tiffLayer.setOpacity(methaneOpacity * 0.01);
  }, [methaneOpacity, tiffLayer]);

  useEffect(() => {
    sn2Layer.setOpacity(emitSn2Opacity * 0.01);
  }, [emitSn2Opacity, sn2Layer]);

  return {
    tiffLayer,
    sn2Layer,
    emitLayers,
    emitJsonLayer,
    sandGeoVectorLayer
  };
};
