import axios from 'axios';
import { toast } from 'react-toastify';

const RAW_SOURCE_ID = 'fire-source';
const CLUSTER_SOURCE_ID = 'fire-cluster-source';
const HEAT_LAYER_ID = 'fire-heatmap';
const CLUSTER_LAYER_ID = 'fire-clusters';
const CLUSTER_COUNT_LAYER_ID = 'fire-cluster-count';
const POINT_LAYER_ID = 'fire-points';
const LAYER_IDS = [HEAT_LAYER_ID, CLUSTER_LAYER_ID, CLUSTER_COUNT_LAYER_ID, POINT_LAYER_ID];
const SOURCE_IDS = [RAW_SOURCE_ID, CLUSTER_SOURCE_ID];

const wrapFeature = (feature) => ({
  getProperties: () => feature.properties || {},
  get: (key) => feature.properties?.[key],
});

const normalizeFeature = (feature, index) => {
  const properties = { ...(feature.properties || {}) };

  if (!properties.name) {
    properties.name = properties.locality || `Point ${index + 1}`;
  }
  if (typeof properties.confidence === 'string') {
    properties.confidence = parseFloat(properties.confidence);
  }
  if (typeof properties.technogenic === 'string') {
    properties.technogenic = properties.technogenic === 'true';
  }
  if (typeof properties.model === 'string') {
    properties.model = parseInt(properties.model, 10);
  }
  if (properties.model === undefined || properties.model === null || Number.isNaN(properties.model)) {
    properties.model = 0;
  }

  return {
    ...feature,
    properties,
  };
};

const featureKey = (feature) => JSON.stringify(feature.geometry?.coordinates || []);

const fetchFireFeatures = async (date1, date2, signal) => {
  const url = `https://api.igmass.kz/fire/firebetweendate?date1=${date1}&date2=${date2}`;
  const response = await axios.get(url, { signal });
  return (response.data?.features || []).map(normalizeFeature);
};

let availableFireDatesPromise = null;

const fetchAvailableFireDates = async () => {
  if (!availableFireDatesPromise) {
    availableFireDatesPromise = axios
      .get('https://api.igmass.kz/fire/firehuzdates', { responseType: 'text' })
      .then((response) => {
        const rawData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        const cleaned = rawData
          .replace(/'/g, '"')
          .replace(/(\d{4})\.(\d{1,2})\.(\d{1,2})/g, '$1-$2-$3');
        const data = JSON.parse(cleaned);
        return data
          .map((item) => new Date(item[0]).toISOString().split('T')[0])
          .sort();
      })
      .catch((error) => {
        availableFireDatesPromise = null;
        throw error;
      });
  }
  return availableFireDatesPromise;
};

const getLatestAvailableFireDate = async (maxDate) => {
  const dates = await fetchAvailableFireDates();
  if (!dates.length) return null;
  const matchingDates = dates.filter((date) => date <= maxDate);
  return matchingDates.at(-1) || dates.at(-1);
};

const getPreviousAvailableFireDate = async (date) => {
  try {
    const dates = await fetchAvailableFireDates();
    return dates.filter((availableDate) => availableDate < date).at(-1) || null;
  } catch (error) {
    console.warn('Fire date list unavailable; skipping delta statistics.', error);
    return null;
  }
};

export const createFireLayer = (setFireLength, updateFireStatistics) => {
  let map = null;
  let visible = false;
  let originalFeatures = [];
  let filteredFeatures = [];
  let currentFilters = [];
  let activeLoadController = null;

  const getCollection = () => ({
    type: 'FeatureCollection',
    features: filteredFeatures,
  });

  const syncSource = () => {
    if (!map) return;
    SOURCE_IDS.forEach((sourceId) => {
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(getCollection());
      }
    });
    setFireLength?.(filteredFeatures.length);
  };

  const applyCurrentFilters = () => {
    filteredFeatures = currentFilters.reduce(
      (features, filter) => features.filter(filter.filterFunction),
      [...originalFeatures],
    );
    syncSource();
    return filteredFeatures.length;
  };

  const removeLayersAndSources = () => {
    LAYER_IDS.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    SOURCE_IDS.forEach((sourceId) => {
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
  };

  const ensureLayers = () => {
    if (!map) return;

    if (map.getSource(RAW_SOURCE_ID) && !map.getSource(CLUSTER_SOURCE_ID)) {
      removeLayersAndSources();
    }

    if (!map.getSource(RAW_SOURCE_ID)) {
      map.addSource(RAW_SOURCE_ID, {
        type: 'geojson',
        data: getCollection(),
      });
    }

    if (!map.getSource(CLUSTER_SOURCE_ID)) {
      map.addSource(CLUSTER_SOURCE_ID, {
        type: 'geojson',
        data: getCollection(),
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 12,
        clusterMinPoints: 2,
      });
    }

    if (!map.getLayer(HEAT_LAYER_ID)) {
      map.addLayer({
        id: HEAT_LAYER_ID,
        type: 'heatmap',
        source: RAW_SOURCE_ID,
        maxzoom: 9,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['coalesce', ['get', 'confidence'], 50], 0, 0, 100, 1],
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.2, 'rgba(0, 255, 255, 0.6)',
            0.4, 'rgba(0, 255, 0, 0.6)',
            0.7, 'rgba(255, 255, 0, 0.6)',
            1, 'rgba(255, 0, 0, 0.9)',
          ],
          'heatmap-radius': 7,
          'heatmap-opacity': 1,
        },
        layout: { visibility: 'none' },
      });
    }

    if (!map.getLayer(CLUSTER_LAYER_ID)) {
      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: 'circle',
        source: CLUSTER_SOURCE_ID,
        minzoom: 8,
        maxzoom: 13,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#f97316', 10, '#ef4444', 50, '#b91c1c'],
          'circle-radius': ['step', ['get', 'point_count'], 12, 2, 14, 4, 17, 8, 20, 16, 23, 32, 25],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.7,
        },
        layout: { visibility: 'none' },
      });
    }

    if (!map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: 'symbol',
        source: CLUSTER_SOURCE_ID,
        minzoom: 8,
        maxzoom: 13,
        filter: ['has', 'point_count'],
        layout: {
          visibility: 'none',
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#fff',
        },
      });
    }

    if (!map.getLayer(POINT_LAYER_ID)) {
      map.addLayer({
        id: POINT_LAYER_ID,
        type: 'circle',
        source: RAW_SOURCE_ID,
        minzoom: 12,
        paint: {
          'circle-color': ['case', ['==', ['get', 'technogenic'], true], '#60a5fa', '#f97316'],
          'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'confidence'], 50], 0, 4, 100, 9],
          'circle-stroke-width': 1.6,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.92,
        },
        layout: { visibility: 'none' },
      });
    }
  };

  const setLayersVisibilityForZoom = () => {
    if (!map) return;
    const zoom = map.getZoom();
    const heatVisible = visible && zoom <= 8;
    const clusterVisible = visible && zoom > 8 && zoom <= 12;
    const pointVisible = visible && zoom > 12;
    if (map.getLayer(HEAT_LAYER_ID)) map.setLayoutProperty(HEAT_LAYER_ID, 'visibility', heatVisible ? 'visible' : 'none');
    if (map.getLayer(CLUSTER_LAYER_ID)) map.setLayoutProperty(CLUSTER_LAYER_ID, 'visibility', clusterVisible ? 'visible' : 'none');
    if (map.getLayer(CLUSTER_COUNT_LAYER_ID)) map.setLayoutProperty(CLUSTER_COUNT_LAYER_ID, 'visibility', clusterVisible ? 'visible' : 'none');
    if (map.getLayer(POINT_LAYER_ID)) map.setLayoutProperty(POINT_LAYER_ID, 'visibility', pointVisible ? 'visible' : 'none');
  };

  const fireLayerGroup = {
    heatmapLayer: HEAT_LAYER_ID,
    clusterLayer: CLUSTER_LAYER_ID,
    pointLayer: POINT_LAYER_ID,

    attachToMap(nextMap) {
      if (map === nextMap) {
        ensureLayers();
        setLayersVisibilityForZoom();
        return;
      }
      if (map) {
        map.off('zoomend', setLayersVisibilityForZoom);
      }
      map = nextMap;
      ensureLayers();
      map.on('zoomend', setLayersVisibilityForZoom);
      setLayersVisibilityForZoom();
    },

    detachFromMap() {
      if (!map) return;
      map.off('zoomend', setLayersVisibilityForZoom);
      removeLayersAndSources();
      map = null;
    },

    async loadFireData(date1, date2) {
      activeLoadController?.abort();
      activeLoadController = new AbortController();
      const signal = activeLoadController.signal;

      try {
        toast.info('🔥 Loading fire points...');
        let effectiveStartDate = date1;
        let features;

        try {
          features = await fetchFireFeatures(date1, date2, signal);
        } catch (error) {
          if (signal.aborted || error.code === 'ERR_CANCELED') return filteredFeatures.length;
          const status = error.response?.status;
          if (status < 500) throw error;

          const fallbackDate = await getLatestAvailableFireDate(date2);
          if (!fallbackDate || (fallbackDate === date1 && fallbackDate === date2)) throw error;

          console.warn(`Fire data unavailable for ${date1} - ${date2}; loading latest available date ${fallbackDate}.`, error);
          toast.warn(`Selected fire date is unavailable. Loading ${fallbackDate}.`);
          effectiveStartDate = fallbackDate;
          features = await fetchFireFeatures(fallbackDate, fallbackDate, signal);
        }

        let newFiresCount = 0;
        const previousDate = await getPreviousAvailableFireDate(effectiveStartDate);

        if (previousDate) {
          try {
            const previousFeatures = await fetchFireFeatures(previousDate, previousDate, signal);
            const previousKeys = new Set(previousFeatures.map(featureKey));
            newFiresCount = features.filter((feature) => !previousKeys.has(featureKey(feature))).length;
          } catch (error) {
            console.warn(`Fire delta statistics unavailable for previous date ${previousDate}.`, error);
          }
        }

        originalFeatures = features;
        filteredFeatures = features;
        applyCurrentFilters();

        updateFireStatistics?.(features.map(wrapFeature), newFiresCount);
        toast.success(`✅ Loaded ${features.length} fire point${features.length === 1 ? '' : 's'}`);
        return features.length;
      } catch (error) {
        if (signal.aborted || error.code === 'ERR_CANCELED') return filteredFeatures.length;
        originalFeatures = [];
        filteredFeatures = [];
        syncSource();
        updateFireStatistics?.([], 0);
        console.error('🔥 Failed to fetch fire data:', error);
        const status = error.response?.status;
        toast.error(status ? `Failed to load fire data (${status}).` : 'Failed to load fire data.');
        return 0;
      } finally {
        if (activeLoadController?.signal === signal) {
          activeLoadController = null;
        }
      }
    },

    setVisible(nextVisible) {
      visible = nextVisible;
      setLayersVisibilityForZoom();
    },

    getVisible() {
      return visible;
    },

    addFilter(name, filterFunction) {
      this.removeFilter(name);
      currentFilters.push({ name, filterFunction });
      applyCurrentFilters();
    },

    removeFilter(name) {
      currentFilters = currentFilters.filter((filter) => filter.name !== name);
      applyCurrentFilters();
    },

    clearAllFilters() {
      currentFilters = [];
      filteredFeatures = [...originalFeatures];
      syncSource();
    },

    clearTechnogenicFilter() { this.removeFilter('technogenic'); },
    clearModelFilter() { this.removeFilter('model'); },
    removeTechnogenicFilter() { this.removeFilter('technogenic'); },
    removeModelFilter() { this.removeFilter('model'); },
    removeRegionFilter() { this.removeFilter('region'); },
    removeConfidenceFilter() { this.removeFilter('confidence'); },

    showOnlyTechnogenic() {
      this.addFilter('technogenic', (feature) => feature.properties?.technogenic === true);
    },

    showOnlyNatural() {
      this.addFilter('technogenic', (feature) => feature.properties?.technogenic !== true);
    },

    showOnlyModel0() {
      this.addFilter('model', (feature) => feature.properties?.model === 0);
    },

    showOnlyModel1() {
      this.addFilter('model', (feature) => feature.properties?.model === 1);
    },

    filterByRegions(regions) {
      if (!regions?.length) {
        this.removeFilter('region');
      } else {
        this.addFilter('region', (feature) => {
          const region = feature.properties?.region || feature.properties?.region_ru;
          return regions.includes(region);
        });
      }
    },

    filterByConfidence(minConfidence) {
      if (!minConfidence) {
        this.removeFilter('confidence');
      } else {
        this.addFilter('confidence', (feature) => Number(feature.properties?.confidence || 0) >= minConfidence);
      }
    },

    filterByModel(modelValue) {
      if (modelValue === null || modelValue === undefined) {
        this.removeModelFilter();
      } else {
        this.addFilter('model', (feature) => feature.properties?.model === modelValue);
      }
    },

    getAllFeatures() {
      return filteredFeatures.map(wrapFeature);
    },

    getOriginalFeatures() {
      return originalFeatures.map(wrapFeature);
    },

    getLayers() {
      return LAYER_IDS;
    },

    containsLayer(layerId) {
      return LAYER_IDS.includes(typeof layerId === 'string' ? layerId : layerId?.id);
    },
  };

  return fireLayerGroup;
};
