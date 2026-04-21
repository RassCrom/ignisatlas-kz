import { useState } from "react";
import {
  Calendar, Eye, EyeOff, Layers, Search, MapPin, Info,
  AlertCircle, Trash2, Cloud, Database, Sliders, Satellite,
} from "lucide-react";
import ProductMetadata from './ProductMetadata';
import LayerCard from "./LayerCard";
import {
  searchSentinelData, formatDate, getCloudCoverLabel, getCloudCoverColor
 } from "src/utils/sentinelUtils";
import styles from "./SentinelControls.module.scss";
import useSentinel5Store from "../../../../../app/store/sentinel5Store";
import '../Controls/FireControls/fireControls.scss';

const SentinelControls5 = () => {
  const {
    sentinel5Visible,
    sentinel5Opacity,
    selectedBands5,
    startDate,
    endDate,
    searchResults,
    isLoading,
    activeLayers5,
    setSentinel5Visible,
    setSentinel5Opacity,
    setSelectedBands5,
    setStartDate,
    setEndDate,
    setSearchResults,
    setIsLoading,
    addActiveLayer5,
    clearActiveLayers5,
    removeActiveLayer5,
    toggleLayerVisibility,
  } = useSentinel5Store();

  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeSection, setActiveSection] = useState("search");
  const [isExpanded, setIsExpanded] = useState(false);

  const bandOptions = [
    { value: "NO2", label: "NO2", icon: "🌍", description: "Диоксид азота" },
    { value: "O3", label: "O3", icon: "🌍", description: "Озон" },
    { value: "CH4", label: "CH4", icon: "🌍", description: "Метан" },
  ];

  const handleVisibilityToggle5 = () => {
    setSentinel5Visible(!sentinel5Visible);
  };

  const handleOpacityChange = (e) => {
    setSentinel5Opacity(Number(e.target.value));
  };

  const handleBandChange = (e) => {
    setSelectedBands5(e.target.value);
  };

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

    if (daysDiff > 565) {
      setError("Диапазон дат не может превышать 1 год");
      return;
    }

    setError(null);
    setIsLoading(true);
    setSearchResults([]);
    setActiveSection("results");

    try {
      const bbox = null;
      const data = await searchSentinelData('sentinel5', startDate, endDate, bbox, 10);
      setSearchResults(data.value || []);

      if (data.value?.length === 0) {
        setError("Снимки Sentinel-5 не найдены для указанных критериев");
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

    const layerId = `sentinel_${product.Id}_${5}_${Date.now()}`;

    const layerConfig = {
      id: layerId,
      bands: selectedBands5,
      startDate,
      endDate,
      opacity: sentinel5Opacity / 100,
      productId: product.Id,
      name: product.Name,
      cloudCover: product.CloudCoverPercentage,
      visible: true,
      acquisitionDate: product.ContentDate?.beginPosition,
    };
    console.log(layerConfig);

    addActiveLayer5(layerConfig);
    setSentinel5Visible(true);
    setError(null);
    setActiveSection("layers");
  };

  const showProductDetails = (product) => {
    setSelectedProduct(selectedProduct?.Id === product.Id ? null : product);
  };

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={handleVisibilityToggle5}>
          <div className="fire-controls__toggle-icon">
            {sentinel5Visible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />}
          </div>
          <span className="fire-controls__toggle-label">Sentinel-5</span>
          <Satellite
            size={16}
            className={`fire-controls__flame-icon ${sentinel5Visible ? 'fire-controls__flame-icon--active' : ''}`}
          />
        </div>
        <button
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((v) => !v)}
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className={styles.sentinelControls__content}>
          {/* Navigation Tabs */}
          <div className={styles.sentinelControls__tabs}>
            <button
              className={`${styles.sentinelControls__tab} ${
                activeSection === "search"
                  ? styles["sentinelControls__tab--active"]
                  : ""
              }`}
              onClick={() => setActiveSection("search")}
            >
              <Search size={16} />
              Поиск
            </button>
            <button
              className={`${styles.sentinelControls__tab} ${
                activeSection === "results"
                  ? styles["sentinelControls__tab--active"]
                  : ""
              }`}
              onClick={() => setActiveSection("results")}
              disabled={searchResults.length === 0}
            >
              <Database size={16} />
              Результаты ({searchResults.length})
            </button>
            <button
              className={`${styles.sentinelControls__tab} ${
                activeSection === "layers"
                  ? styles["sentinelControls__tab--active"]
                  : ""
              }`}
              onClick={() => setActiveSection("layers")}
              disabled={activeLayers5.length === 0}
            >
              <Layers size={16} />
              Слои ({activeLayers5.length})
            </button>
          </div>

          {/* Search Section */}
          {activeSection === "search" && (
            <div className={styles.sentinelControls__searchSection}>
              <div className={styles.sentinelControls__section}>
                <label className={styles.sentinelControls__label}>
                  Непрозрачность: {sentinel5Opacity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sentinel5Opacity}
                  onChange={handleOpacityChange}
                  className={styles.sentinelControls__slider}
                />
              </div>

              <div className={styles.sentinelControls__section}>
                <label className={styles.sentinelControls__label}>
                  Комбинация каналов
                </label>
                <select
                  value={selectedBands5}
                  onChange={handleBandChange}
                  className={styles.sentinelControls__select}
                >
                  {bandOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.sentinelControls__dateSection}>
                <div className={styles.sentinelControls__dateGroup}>
                  <label className={styles.sentinelControls__label}>
                    <Calendar size={16} />
                    Дата начала
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={styles.sentinelControls__dateInput}
                    max={endDate || undefined}
                  />
                </div>

                <div className={styles.sentinelControls__dateGroup}>
                  <label className={styles.sentinelControls__label}>
                    <Calendar size={16} />
                    Дата окончания
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={styles.sentinelControls__dateInput}
                    min={startDate || undefined}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              {error && (
                <div className={styles.sentinelControls__error}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                className={styles.sentinelControls__searchBtn}
                onClick={handleSearchSentinelData}
                disabled={isLoading || !startDate || !endDate}
              >
                <Search size={16} />
                {isLoading ? "Поиск..." : "Найти снимки Sentinel-5"}
              </button>
            </div>
          )}

          {/* Results Section */}
          {activeSection === "results" && searchResults.length > 0 && (
            <div className={styles.sentinelControls__resultsSection}>
              <div className={styles.sentinelControls__resultsList}>
                {searchResults.map((result) => (
                  <div key={result.Id} className={styles.resultCard}>
                    <div className={styles.resultCard__header}>
                      <div className={styles.resultCard__info}>
                        <span className={styles.resultCard__date}>
                          {formatDate(result.ContentDate?.beginPosition)}
                        </span>
                        <div className={styles.resultCard__cloudBadge}>
                          <Cloud
                            size={14}
                            style={{
                              color: getCloudCoverColor(
                                result.CloudCoverPercentage
                              ),
                            }}
                          />
                          <span
                            style={{
                              color: getCloudCoverColor(
                                result.CloudCoverPercentage
                              ),
                            }}
                          >
                            {result.CloudCoverPercentage?.toFixed(1) || "N/A"}%
                          </span>
                          <span className={styles.resultCard__cloudLabel}>
                            {getCloudCoverLabel(result.CloudCoverPercentage)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.resultCard__actions}>
                        <button
                          className={styles.resultCard__infoBtn}
                          onClick={() => showProductDetails(result)}
                          title="Подробности"
                        >
                          <Info size={14} />
                        </button>
                        <button
                          className={styles.resultCard__addBtn}
                          onClick={() => addToMap(result)}
                          title="На карту"
                        >
                          <MapPin size={14} />
                          Добавить
                        </button>
                      </div>
                    </div>

                    {selectedProduct?.Id === result.Id && (
                      <ProductMetadata product={result} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Layers Section */}
          {activeSection === "layers" && activeLayers5.length > 0 && (
            <div className={styles.sentinelControls__layersSection}>
              <div className={styles.sentinelControls__layersHeader}>
                <button
                  className={styles.sentinelControls__clearBtn}
                  onClick={() => clearActiveLayers5()}
                  disabled={activeLayers5.length === 0}
                >
                  <Trash2 size={16} />
                  Очистить все ({activeLayers5.length})
                </button>
              </div>
              <div className={styles.sentinelControls__layersList}>
                {activeLayers5.map((layer, index) => (
                  <LayerCard key={layer.id} layer={layer} index={index}
                    removeActiveLayer={removeActiveLayer5}
                    bandOptions={bandOptions} toggleLayerVisibility={toggleLayerVisibility}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SentinelControls5;
