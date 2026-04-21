import { useCallback, useEffect, useMemo } from 'react';
import { createFireLayer } from "../utils/fireLayer.js";

export const useFireLayer = (fireStore) => {
  const {
    fireLayerVisible,
    setFireLength,
    fireStartDate,
    fireEndDate,
    dateHasChanged,
    updateFireStatistics,
    showTechnogenicOnly,
    showNaturalOnly,
    selectedModel,
    selectedRegions,
    confidenceFilter
  } = fireStore;

  const fireLayer = useMemo(() => 
    createFireLayer(setFireLength, fireStartDate, fireEndDate, updateFireStatistics), 
    [setFireLength]
  );

  const loadFireData = useCallback(async (mapInstance) => {
    if (!fireLayer || !mapInstance) return;

    try {
      const layers = fireLayer.getLayers();
      layers.forEach(layer => {
        if (!mapInstance.getLayers().getArray().includes(layer)) {
          mapInstance.addLayer(layer);
        }
      });

      fireLayer.attachToMap(mapInstance);
      await fireLayer.loadFireData(fireStartDate, fireEndDate);
      fireLayer.setVisible(fireLayerVisible);
      fireLayer.getLayers().forEach((layer, index) => {
        layer.setZIndex(1000 + index);
      });
    } catch (error) {
      console.error('Error loading fire data:', error);
    }
  }, [fireLayer, fireLayerVisible, fireStartDate, fireEndDate]);

  // Apply filters
  useEffect(() => {
    if (!fireLayer) return;

    if (showTechnogenicOnly) {
      fireLayer.showOnlyTechnogenic();
    } else if (showNaturalOnly) {
      fireLayer.showOnlyNatural();
    } else {
      fireLayer.clearTechnogenicFilter();
    }
  }, [showTechnogenicOnly, showNaturalOnly, fireLayer]);

  useEffect(() => {
    if (!fireLayer) return;

    if (selectedModel === 1) {
      fireLayer.showOnlyModel1();
    } else if (selectedModel === 0) {
      fireLayer.showOnlyModel0();
    } else {
      fireLayer.clearModelFilter();
    }
  }, [selectedModel, fireLayer]);

  useEffect(() => {
    if (!fireLayer) return;

    if (selectedRegions.length > 0) {
      fireLayer.filterByRegions(selectedRegions);
    } else {
      fireLayer.removeRegionFilter();
    }
  }, [selectedRegions, fireLayer]);

  useEffect(() => {
    if (!fireLayer) return;
    
    window.fireLayerInstance = fireLayer;
    
    return () => {
      if (window.fireLayerInstance === fireLayer) {
        delete window.fireLayerInstance;
      }
    };
  }, [fireLayer]);

  return { fireLayer, loadFireData };
};