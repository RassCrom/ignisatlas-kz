import axios from "axios";
import Icon from 'ol/style/Icon.js';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { Heatmap as HeatmapLayer } from 'ol/layer';
import Cluster from 'ol/source/Cluster';
import { toast } from "react-toastify";

export const createFireLayer = (setFireLength, fireStartDate, fireEndDate, updateFireStatistics) => {
  // console.log(fireStartDate, fireEndDate)
  // Main vector source to hold all fire point features
  const source = new VectorSource();

  // original features for filtering
  let originalFeatures = [];
  let currentFilters = [];
  
  // cluster for medium zoom 
  const clusterSource = new Cluster({
    distance: 40,
    source: source,
    minDistance: 20
  });
  
  // const pointStyle = new Style({
  //   image: new Icon({
  //     src: '/flame.png',
  //     scale: 0.5,
  //     size: [30, 30],
  //   }),
  // });
  
  // heatmap for zoom levels (1-8)
  const heatmapLayer = new HeatmapLayer({
    source: source,
    blur: 7,
    radius: 3,
    weight: function(feature) {
      const confidence = feature.get('confidence') || 50;
      return Math.min(1, confidence / 100);
    },
    gradient: ['rgba(0, 0, 255, 0.6)', 'rgba(0, 255, 255, 0.6)', 'rgba(0, 255, 0, 0.6)', 
               'rgba(255, 255, 0, 0.6)', 'rgba(255, 0, 0, 0.9)'],
    visible: false
  });
  
  // cluster for medium zoom levels (8-12)
  const clusterLayer = new VectorLayer({
    source: clusterSource,
    style: function(feature) {
      const features = feature.get('features');
      const size = features.length;
      
      // Calculate average confidence for cluster color intensity
      let avgConfidence = 0;
      let confidenceCount = 0;
      features.forEach(f => {
        const conf = f.get('confidence');
        if (conf && !isNaN(conf)) {
          avgConfidence += parseFloat(conf);
          confidenceCount++;
        }
      });
      avgConfidence = confidenceCount > 0 ? avgConfidence / confidenceCount : 50;
      
      const intensity = Math.min(1, avgConfidence / 100);
      const red = Math.floor(255 * intensity);
      const green = Math.floor(69 * (1 - intensity));
      
      // circle radius based on cluster size
      let radius = Math.min(25, 12 + Math.log2(size) * 5);
      
      return new Style({
        image: new CircleStyle({
          radius: radius,
          fill: new Fill({
            color: `rgba(${red}, ${green}, 0, 0.7)`
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 2
          })
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: '#fff'
          }),
          font: 'bold 12px Arial'
        })
      });
    },
    visible: false
  });
  
  const getPointStyle = (feature) => {
    const props = feature.getProperties();
    const confidence = props.confidence || 50;
    const isTechnogenic = props.technogenic === true;
    
    const iconSrc = isTechnogenic ? '/flame-tech.png' : '/flame.png';
    const scale = 0.3 + (confidence / 100) * 0.4;
    
    return new Style({
      image: new Icon({
        src: iconSrc,
        scale: scale,
        size: [30, 30],
      }),
    });
  };
  
  // point for high zoom (13+)
  const pointLayer = new VectorLayer({
    declutter: true,
    source: source,
    renderMode: "vector",
    style: getPointStyle,
    properties: { id: "fireLayer" },
    visible: false
  });
  
  // Create a layer group object to manage the three layers
  const fireLayerGroup = {
    heatmapLayer,
    clusterLayer,
    pointLayer,
    
    // Function to load fire data with date range
    loadFireData: async (date1, date2) => {
      try {
        source.clear();
        toast.info("🔥 Loading fire points...");
        
        const url = `https://api.igmass.kz/fire/firebetweendate?date1=${date1}&date2=${date2}`;
        const response = await axios.get(url);
        
        const format = new GeoJSON();
        const features = format.readFeatures(response.data, {
          featureProjection: "EPSG:3857",
        });

        // today's date and yesterday's date
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // today's fires
        const todayUrl = `https://api.igmass.kz/fire/firebetweendate?date1=${todayStr}&date2=${todayStr}`;
        const todayResponse = await axios.get(todayUrl);
        
        // yesterday's fires
        const yesterdayUrl = `https://api.igmass.kz/fire/firebetweendate?date1=${yesterdayStr}&date2=${yesterdayStr}`;
        const yesterdayResponse = await axios.get(yesterdayUrl);

        const todayFeatures = format.readFeatures(todayResponse.data, {
          featureProjection: "EPSG:3857",
        });
        const yesterdayFeatures = format.readFeatures(yesterdayResponse.data, {
          featureProjection: "EPSG:3857",
        });
        
        // Create a Set of yesterday's fire locations for quick lookup
        const yesterdayLocations = new Set(
          yesterdayFeatures.map(feature => {
            const coords = feature.getGeometry().getCoordinates();
            return `${coords[0]},${coords[1]}`;
          })
        );
        
        // Count new fires (fires that exist today but not yesterday)
        const newFires = todayFeatures.filter(feature => {
          const coords = feature.getGeometry().getCoordinates();
          const locationKey = `${coords[0]},${coords[1]}`;
          return !yesterdayLocations.has(locationKey);
        });
        
        features.forEach((feature, index) => {
          const props = feature.getProperties();
          
          if (!props.name) {
            const locality = props.locality || `Point ${index + 1}`;
            feature.set('name', locality);
          }
          
          // Ensure confidence is a number
          if (props.confidence && typeof props.confidence === 'string') {
            feature.set('confidence', parseFloat(props.confidence));
          }
          
          // Ensure technogenic is boolean
          if (typeof props.technogenic === 'string') {
            feature.set('technogenic', props.technogenic === 'true');
          }

          // Ensure model is a number
          if (props.model && typeof props.model === 'string') {
            feature.set('model', parseInt(props.model, 10));
          } else if (props.model === undefined || props.model === null) {
            // Set default model value if not present
            feature.set('model', 0);
          }
        });

        // original features
        originalFeatures = [...features];
        
        source.addFeatures(features);

        // Update fire count
        if (setFireLength) {
          setFireLength(features.length);
        }
        
        // Update statistics
        if (updateFireStatistics) {
          updateFireStatistics(features, newFires.length);
        }
        
        // Set initial visibility based on zoom level
        if (fireLayerGroup._map) {
          const zoom = fireLayerGroup._map.getView().getZoom();
          fireLayerGroup.updateLayerVisibility(zoom);
        } else {
          // Default if no map is set yet
          heatmapLayer.setVisible(true);
          clusterLayer.setVisible(false);
          pointLayer.setVisible(false);
        }
        
        toast.success(`✅ Loaded ${features.length} fire point${features.length === 1 ? '' : 's'}`);
        return features.length;
      } catch (error) {
        console.error("🔥 Failed to fetch fire data:", error);
        toast.error("Failed to load fire data.");
        return 0;
      }
    },
    
    // Function to update layer visibility based on zoom level
    updateLayerVisibility: function(zoom) {
      if (zoom <= 8) {
        heatmapLayer.setVisible(true);
        clusterLayer.setVisible(false);
        pointLayer.setVisible(false);
      } else if (zoom > 8 && zoom <= 12) {
        heatmapLayer.setVisible(false);
        clusterLayer.setVisible(true);
        pointLayer.setVisible(false);
      } else {
        heatmapLayer.setVisible(false);
        clusterLayer.setVisible(false);
        pointLayer.setVisible(true);
      }
    },
    
    // Function to set visibility for all layers
    setVisible: function(visible) {
      if (fireLayerGroup._map && visible) {
        const zoom = fireLayerGroup._map.getView().getZoom();
        this.updateLayerVisibility(zoom);
      } else {
        heatmapLayer.setVisible(false);
        clusterLayer.setVisible(false);
        pointLayer.setVisible(false);
      }
      
      this._visible = visible;
    },
    
    // Function to get visibility state
    getVisible: function() {
      return this._visible;
    },
    
    // Enhanced filtering system
    addFilter: function(name, filterFunction) {
      // Remove existing filter with same name
      this.removeFilter(name);
      
      // Add new filter
      currentFilters.push({ name, filterFunction });
      
      // Apply all filters
      this.applyCurrentFilters();
    },
    
    removeFilter: function(name) {
      currentFilters = currentFilters.filter(filter => filter.name !== name);
      this.applyCurrentFilters();
    },
    
    applyCurrentFilters: function() {
      let filteredFeatures = [...originalFeatures];
      
      // Apply all filters sequentially
      currentFilters.forEach(filter => {
        filteredFeatures = filteredFeatures.filter(filter.filterFunction);
      });
      
      // Update source
      source.clear();
      source.addFeatures(filteredFeatures);
      
      // Update fire count
      if (setFireLength) {
        setFireLength(filteredFeatures.length);
      }
      
      return filteredFeatures.length;
    },
    
    clearAllFilters: function() {
      currentFilters = [];
      source.clear();
      source.addFeatures(originalFeatures);
      
      if (setFireLength) {
        setFireLength(originalFeatures.length);
      }
    },

    clearTechnogenicFilter: function() {
      this.removeFilter('technogenic');
    },

    clearModelFilter: function() {
      this.removeFilter('model');
    },
    
    // Specific technogenic filter methods
    showOnlyTechnogenic: function() {
      this.addFilter('technogenic', feature => feature.get('technogenic') === true);
    },
    
    showOnlyNatural: function() {
      this.addFilter('technogenic', feature => feature.get('technogenic') !== true);
    },
    
    removeTechnogenicFilter: function() {
      this.removeFilter('technogenic');
    },
    
    // Model filter methods
    showOnlyModel0: function() {
      this.addFilter('model', feature => feature.get('model') === 0);
    },
    
    showOnlyModel1: function() {
      this.addFilter('model', feature => feature.get('model') === 1);
    },
    
    removeModelFilter: function() {
      this.removeFilter('model');
    },

    // Region filter methods
    filterByRegions: function(regions) {
      if (!regions || regions.length === 0) {
        this.removeFilter('region');
      } else {
        this.addFilter('region', feature => {
          const featureRegion = feature.get('region') || feature.get('region_ru');
          return regions.includes(featureRegion);
        });
      }
    },

    filterByConfidence: function(minConfidence) {
      if (minConfidence === 0 || minConfidence === null || minConfidence === undefined) {
        this.removeFilter('confidence');
      } else {
        this.addFilter('confidence', feature => {
          const confidence = feature.get('confidence');
          return confidence && confidence >= minConfidence;
        });
      }
    },

    removeConfidenceFilter: function() {
      this.removeFilter('confidence');
    },

    removeRegionFilter: function() {
      this.removeFilter('region');
    },

    // Check if region filter is active
    isRegionFilterActive: function() {
      return currentFilters.some(filter => filter.name === 'region');
    },

    // Get current region filter values
    getCurrentRegionFilter: function() {
      const regionFilter = currentFilters.find(filter => filter.name === 'region');
      if (!regionFilter) return [];
      
      // This is a simplified way to get the active regions
      // In a real implementation, you might want to store this info differently
      return [];
    },
    
    // Generic model filter with specific value
    filterByModel: function(modelValue) {
      if (modelValue === null || modelValue === undefined) {
        this.removeModelFilter();
      } else {
        this.addFilter('model', feature => feature.get('model') === modelValue);
      }
    },
    
    // Check if technogenic filter is active
    isTechnogenicFilterActive: function() {
      return currentFilters.some(filter => filter.name === 'technogenic');
    },
    
    // Check if model filter is active
    isModelFilterActive: function() {
      return currentFilters.some(filter => filter.name === 'model');
    },
    
    // Get current model filter value
    getCurrentModelFilter: function() {
      const modelFilter = currentFilters.find(filter => filter.name === 'model');
      if (!modelFilter) return null;
      
      // Test the filter function with model 0 and 1 to determine which is active
      const testFeature0 = { get: () => 0 };
      const testFeature1 = { get: () => 1 };
      
      if (modelFilter.filterFunction(testFeature0)) return 0;
      if (modelFilter.filterFunction(testFeature1)) return 1;
      
      return null;
    },
    
    // Get current filter status
    getFilterStatus: function() {
      return {
        hasFilters: currentFilters.length > 0,
        activeFilters: currentFilters.map(f => f.name),
        totalFeatures: originalFeatures.length,
        visibleFeatures: source.getFeatures().length,
        isTechnogenicActive: this.isTechnogenicFilterActive(),
        isModelActive: this.isModelFilterActive(),
        currentModelFilter: this.getCurrentModelFilter()
      };
    },
    
    // Function to get all features
    getAllFeatures: function() {
      return source.getFeatures();
    },
    
    // Function to get original (unfiltered) features
    getOriginalFeatures: function() {
      return originalFeatures;
    },
    
    attachToMap: function(map) {
      this._map = map;
      // zoom change listener
      if (map) {
        const view = map.getView();
        view.on('change:resolution', () => {
          if (this._visible) {
            const zoom = view.getZoom();
            this.updateLayerVisibility(zoom);
          }
        });
      }
    },
    
    getLayers: function() {
      return [heatmapLayer, clusterLayer, pointLayer];
    },
    
    // Check if a layer belongs to this fire layer group
    containsLayer: function(layer) {
      return layer === heatmapLayer || 
             layer === clusterLayer || 
             layer === pointLayer;
    },
    
    _visible: false,
    _map: null
  };
  
  return fireLayerGroup;
};