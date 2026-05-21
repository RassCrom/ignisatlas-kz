import { useCallback, useEffect, useMemo } from 'react';
import { createFireLayer } from "../utils/fireLayer.js";

export const useFireLayer = (fireStore) => {
  const {
    setFireLength,
    updateFireStatistics,
    showTechnogenicOnly,
    showNaturalOnly,
    selectedModel,
    selectedRegions,
  } = fireStore;

  const fireLayer = useMemo(() => 
    createFireLayer(setFireLength, updateFireStatistics), 
    [setFireLength, updateFireStatistics]
  );

  const loadFireData = useCallback(async (mapInstance, date1, date2, nextVisible) => {
    if (!fireLayer || !mapInstance) return;

    try {
      fireLayer.attachToMap(mapInstance);
      await fireLayer.loadFireData(date1, date2);
      fireLayer.setVisible(nextVisible);
    } catch (error) {
      console.error('Error loading fire data:', error);
    }
  }, [fireLayer]);

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
