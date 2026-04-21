import { useState } from "react";
import useSentinelStore from "../../../../../app/store/sentinelStore";
import { searchSentinelData } from "src/utils/sentinelUtils";
import SentinelControlsContainer from "./SentinelControlsContainer";

const SentinelControls = ({ productType }) => {

  const {
    sentinelVisible,
    setSentinelVisible,
    toggleLayerVisibility,
    sentinelOpacity,
    setSentinelOpacity,
    selectedBands,
    setSelectedBands,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    searchResults,
    setSearchResults,
    isLoading,
    setIsLoading,
    activeLayers,
    addActiveLayer,
    clearActiveLayers,
    removeActiveLayer,
  } = useSentinelStore();

  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("search"); // 'search', 'results', 'layers'

  const bandOptions = [
    {
      value: "true-color",
      label: "Натуральные цвета (RGB)",
      icon: "🌍",
      description: "Натуральный цветной композит",
    },
    {
      value: "false-color",
      label: "Ложный цвет (БИК-К-З)",
      icon: "🌿",
      description: "Анализ растительности",
    },
    {
      value: "ndvi",
      label: "NDVI (Растительность)",
      icon: "🌱",
      description: "Нормализованный вегетационный индекс",
    },
    {
      value: "ndwi",
      label: "NDWI (Водные объекты)",
      icon: "💧",
      description: "Обнаружение водных объектов",
    },
    {
      value: "ndbr",
      label: "NDBR (Индекс выжженности)",
      icon: "🔥",
      description: "Картирование степени выгорания",
    },
  ];

  const handleSearchSentinelData = async () => {
    if (!startDate || !endDate) {
      setError("Выберите начальную и конечную даты");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);

    if (daysDiff < 0) {
      setError("Конечная дата должна быть позже начальной");
      return;
    }

    if (daysDiff > 365) {
      setError("Диапазон дат не может превышать 1 год");
      return;
    }

    setError(null);
    setIsLoading(true);
    setSearchResults([]);
    setActiveSection("results");

    try {
      const bbox = null;
      const isBandMethane = selectedBands === "methane";
      console.log(isBandMethane, selectedBands);
      const data = await searchSentinelData(
        productType,
        startDate,
        endDate,
        bbox,
        10,
        isBandMethane
      );
      setSearchResults(data.value || []);

      if (data.value?.length === 0) {
        setError("Снимки Sentinel-2 не найдены для указанных критериев");
      }
    } catch (error) {
      console.error("Error searching Sentinel data:", error);
      setError(`Ошибка поиска: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToMap = (product) => {
    if (!startDate || !endDate) {
      setError("Сначала укажите диапазон дат");
      return;
    }

    const layerId = `sentinel_${product.Id}_${selectedBands}_${Date.now()}`;

    const layerConfig = {
      id: layerId,
      bands: selectedBands,
      startDate,
      endDate,
      opacity: sentinelOpacity / 100,
      productId: product.Id,
      name: product.Name,
      cloudCover: product.CloudCoverPercentage,
      visible: true,
      acquisitionDate: product.ContentDate?.beginPosition,
    };

    console.log(layerConfig);

    addActiveLayer(layerConfig);
    setSentinelVisible(true);
    setError(null);
    setActiveSection("layers");
  };

  const setActiveSectionHandler = (section) => {
    setActiveSection(section);
    setError(null); // Clear errors when switching sections
  };

  return (
    <SentinelControlsContainer 
      // Handlers
      handleSearchSentinelData={handleSearchSentinelData}
      addToMap={addToMap}
      setActiveSection={setActiveSectionHandler}
      
      // State
      error={error}
      activeSection={activeSection}
      
      // Configuration
      bandOptions={bandOptions}
      
      // Store values
      sentinelVisible={sentinelVisible}
      setSentinelVisible={setSentinelVisible}
      toggleLayerVisibility={toggleLayerVisibility}
      sentinelOpacity={sentinelOpacity}
      setSentinelOpacity={setSentinelOpacity}
      selectedBands={selectedBands}
      setSelectedBands={setSelectedBands}
      startDate={startDate}
      endDate={endDate}
      setStartDate={setStartDate}
      setEndDate={setEndDate}
      searchResults={searchResults}
      isLoading={isLoading}
      activeLayers={activeLayers}
      clearActiveLayers={clearActiveLayers}
      removeActiveLayer={removeActiveLayer}
    />
  );
};

export default SentinelControls;