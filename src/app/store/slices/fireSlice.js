// Helper functions for default dates
const formatDate = (date) => date.toISOString().split('T')[0];

const today = new Date();
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const defaultDateStart = formatDate(sevenDaysAgo);
const defaultDateEnd = formatDate(today);

export const createFireSlice = (set, get) => ({
  // layer visibility
  fireLayerVisible: false,
  fireDate: null, 
  fireOpacity: 100,
  fireIntensityFilter: 'all',
  fireStartDate: defaultDateStart,
  fireEndDate: defaultDateEnd,
  fireHeatmapMode: false,
  autoRefresh: false,
  fireLength: 0,
  dateHasChanged: false,
  confidenceFilter: 0, // Current confidence filter value
  confidenceFilterTimeout: null, // For delayed application
  
  // stats
  avgIntensity: null,
  avgConfidence: null,
  totalTechnogenicFires: 0,
  totalNaturalFires: 0,
  newFiresSinceLastDay: 0,
  firesByRegion: {},
  firesBySatellite: {},
  firesByDate: {},
  firesByConfidence: {},
  firesByIntensity: {},
  firesByModel: {}, // New: statistics by model
  
  // for filtering
  selectedRegions: [],
  selectedSatellites: [],
  confidenceThreshold: 0,
  showTechnogenicOnly: false,
  showNaturalOnly: false,
  selectedModel: null, // null = all, 0 = model 0, 1 = model 1
  
  // UI states
  opacityValues: {},
  toggleStates: {},
  expandedItems: {},

  // stats setters
  setAvgIntensity: (intensity) =>
    set(() => ({
      avgIntensity: intensity
    })),

  setAvgConfidence: (confidence) =>
    set(() => ({
      avgConfidence: confidence
    })),

  setTotalTechnogenicFires: (count) =>
    set(() => ({
      totalTechnogenicFires: count
    })),

  setTotalNaturalFires: (count) =>
    set(() => ({
      totalNaturalFires: count
    })),

  setNewFiresSinceLastDay: (lastDay) =>
    set(() => ({
      newFiresSinceLastDay: lastDay
    })),

  setFiresByRegion: (regionStats) =>
    set(() => ({
      firesByRegion: regionStats
    })),

  setFiresBySatellite: (satelliteStats) =>
    set(() => ({
      firesBySatellite: satelliteStats
    })),

  setFiresByConfidence: (confidenceStats) =>
    set(() => ({
      firesByConfidence: confidenceStats
    })),

  setFiresByDate: (dateStats) =>
    set(() => ({
      firesByDate: dateStats
    })),

  setFiresByModel: (modelStats) =>
    set(() => ({
      firesByModel: modelStats
    })),

  // filter setters
  setSelectedRegions: (regions) =>
    set(() => ({
      selectedRegions: regions
    })),

  setSelectedSatellites: (satellites) =>
    set(() => ({
      selectedSatellites: satellites
    })),

  setConfidenceThreshold: (threshold) =>
    set(() => ({
      confidenceThreshold: threshold
    })),

  setShowTechnogenicOnly: (show) =>
    set(() => ({
      showTechnogenicOnly: show,
      showNaturalOnly: show ? false : get().showNaturalOnly
    })),

  setShowNaturalOnly: (show) =>
    set(() => ({
      showNaturalOnly: show,
      showTechnogenicOnly: show ? false : get().showTechnogenicOnly
    })),

  setSelectedModel: (model) =>
    set(() => ({
      selectedModel: model
    })),

  // setters
  setDateHasChanged: () => 
    set((state) => ({
      dateHasChanged: !state.dateHasChanged
    })),

  setFireDate: (date) => 
    set(() => ({
      fireDate: date,
    })),

  setFireLayerVisible: () =>
    set((state) => ({
      fireLayerVisible: !state.fireLayerVisible
    })),

  setOpacityValue: (id, value) =>
    set((state) => ({
      opacityValues: { ...state.opacityValues, [id]: value },
    })),
  
  setConfidenceFilter: (value) =>
    set(() => ({
      confidenceFilter: value
    })),

  setConfidenceFilterTimeout: (timeout) =>
    set(() => ({
      confidenceFilterTimeout: timeout
    })),

  toggleOption: (id) =>
    set((state) => ({
      toggleStates: { ...state.toggleStates, [id]: !state.toggleStates[id] },
    })),

  toggleExpandedItem: (id) =>
    set((state) => ({
      expandedItems: { ...state.expandedItems, [id]: !state.expandedItems[id] },
    })),
  
  setFireOpacity: (opacity) => set({ fireOpacity: opacity }),
  
  setFireIntensityFilter: (filter) => set({ fireIntensityFilter: filter }),
  
  setFireStartDate: (date) => set({ fireStartDate: date }),
  
  setFireEndDate: (date) => set({ fireEndDate: date }),
  
  setFireHeatmapMode: (mode) => set({ fireHeatmapMode: mode }),
  
  setAutoRefresh: (refresh) => set({ autoRefresh: refresh }),

  setFireLength: (length) => set({ fireLength: length }),

  // Method to calculate and update all statistics from features
  updateFireStatistics: (features, newFires) => {
    const state = get();
    
    if (!features || features.length === 0) {
      state.setAvgIntensity(null);
      state.setAvgConfidence(null);
      state.setTotalTechnogenicFires(0);
      state.setTotalNaturalFires(0);
      state.setNewFiresSinceLastDay(0);
      state.setFiresByRegion({});
      state.setFiresBySatellite({});
      state.setFiresByConfidence({});
      state.setFiresByDate({});
      state.setFiresByModel({});
      return;
    }

    let totalConfidence = 0;
    let confidenceCount = 0;
    let technogenicCount = 0;
    let naturalCount = 0;
    const regionStats = {};
    const satelliteStats = {};
    const confidenceStats = {};
    const dateStats = {};
    const modelStats = {}

    features.forEach(feature => {
      const props = feature.getProperties();
      
      if (props.confidence && !isNaN(props.confidence)) {
        totalConfidence += parseFloat(props.confidence);
        confidenceCount++;
      }

      if (props.technogenic === true) {
        technogenicCount++;
      } else {
        naturalCount++;
      }

      // by region
      const region = props.region || props.region_ru || 'Unknown';
      regionStats[region] = (regionStats[region] || 0) + 1;

      // by satellite
      const satellite = props.satellite || 'Unknown';
      satelliteStats[satellite] = (satelliteStats[satellite] || 0) + 1;

      // Categorize confidence
      let confidenceLevel = 'Unknown';
      const confidenceValue = props.confidence;

      if (typeof confidenceValue === 'number') {
        if (confidenceValue >= 70) {
          confidenceLevel = 'High';
        } else if (confidenceValue >= 30) {
          confidenceLevel = 'Medium';
        } else {
          confidenceLevel = 'Low';
        }
      }

      // Update confidence stats
      confidenceStats[confidenceLevel] = (confidenceStats[confidenceLevel] || 0) + 1;

      // by date
      const date = props.acq_date || 'Unknown';
      dateStats[date] = (dateStats[date] || 0) + 1;

      // by model - handle both number and string values
      let modelValue = props.model;
      if (typeof modelValue === 'string') {
        modelValue = parseInt(modelValue, 10);
      }
      if (typeof modelValue === 'number' && !isNaN(modelValue)) {
        const modelKey = `Model ${modelValue}`;
        modelStats[modelKey] = (modelStats[modelKey] || 0) + 1;
      } else {
        modelStats['Unknown'] = (modelStats['Unknown'] || 0) + 1;
      }
    });

    // Update all statistics
    state.setAvgConfidence(confidenceCount > 0 ? (totalConfidence / confidenceCount).toFixed(2) : null);
    state.setTotalTechnogenicFires(technogenicCount);
    state.setTotalNaturalFires(naturalCount);
    state.setFiresByRegion(regionStats);
    state.setFiresBySatellite(satelliteStats);
    state.setFiresByConfidence(confidenceStats);
    state.setFiresByDate(dateStats);
    state.setFiresByModel(modelStats);
    state.setNewFiresSinceLastDay(newFires);

    const avgIntensity = confidenceCount > 0 ? (totalConfidence / confidenceCount).toFixed(2) : null;
    state.setAvgIntensity(avgIntensity);
  },

  getFilteredFeatures: (allFeatures) => {
    const state = get();
    
    return allFeatures.filter(feature => {
      const props = feature.getProperties();
      
      // Region filter
      if (state.selectedRegions.length > 0) {
        const region = props.region || props.region_ru;
        if (!state.selectedRegions.includes(region)) {
          return false;
        }
      }

      // Satellite filter
      if (state.selectedSatellites.length > 0) {
        if (!state.selectedSatellites.includes(props.satellite)) {
          return false;
        }
      }

      // Confidence threshold filter
      if (state.confidenceThreshold > 0) {
        const confidence = parseFloat(props.confidence) || 0;
        if (confidence < state.confidenceThreshold) {
          return false;
        }
      }

      // Technogenic filter
      if (state.showTechnogenicOnly && props.technogenic !== true) {
        return false;
      }

      // Natural filter
      if (state.showNaturalOnly && props.technogenic === true) {
        return false;
      }

      // Model filter - improved handling
      if (state.selectedModel !== null) {
        let featureModel = props.model;
        
        // Convert string to number if needed
        if (typeof featureModel === 'string') {
          featureModel = parseInt(featureModel, 10);
        }
        
        // Check if the feature's model matches the selected model
        if (featureModel !== state.selectedModel) {
          return false;
        }
      }

      return true;
    });
  },

  // Method to reset all filters
  resetFilters: () => {
    const state = get();
    state.setSelectedRegions([]);
    state.setSelectedSatellites([]);
    state.setConfidenceThreshold(0);
    state.setShowTechnogenicOnly(false);
    state.setShowNaturalOnly(false);
    state.setSelectedModel(null);
  },

  // Method to get available regions from current data
  getAvailableRegions: () => {
    const state = get();
    return Object.keys(state.firesByRegion);
  },

  // Method to get available satellites from current data
  getAvailableSatellites: () => {
    const state = get();
    return Object.keys(state.firesBySatellite);
  },

  // Method to get available models from current data
  getAvailableModels: () => {
    const state = get();
    return Object.keys(state.firesByModel);
  },

  // Method to toggle between model filters
  toggleModelFilter: (modelValue) => {
    const state = get();
    if (state.selectedModel === modelValue) {
      // If the same model is selected, clear the filter
      state.setSelectedModel(null);
    } else {
      // Otherwise, set the new model filter
      state.setSelectedModel(modelValue);
    }
  },

  // Method to check if a specific model filter is active
  isModelFilterActive: (modelValue) => {
    const state = get();
    return state.selectedModel === modelValue;
  },

  // Method to get current active filters summary
  getActiveFiltersSummary: () => {
    const state = get();
    const summary = {};
    
    if (state.selectedRegions.length > 0) {
      summary.regions = state.selectedRegions;
    }
    
    if (state.selectedSatellites.length > 0) {
      summary.satellites = state.selectedSatellites;
    }
    
    if (state.confidenceThreshold > 0) {
      summary.confidenceThreshold = state.confidenceThreshold;
    }
    
    if (state.showTechnogenicOnly) {
      summary.technogenic = 'technogenic only';
    } else if (state.showNaturalOnly) {
      summary.technogenic = 'natural only';
    }
    
    if (state.selectedModel !== null) {
      summary.model = `Model ${state.selectedModel}`;
    }
    
    return summary;
  }
});