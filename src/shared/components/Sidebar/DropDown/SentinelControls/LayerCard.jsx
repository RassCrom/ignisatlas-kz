import { useState } from 'react';
import styles from './SentinelControls.module.scss';
import {
    Eye, EyeOff, Trash2, Cloud, ChevronUp, ChevronDown
} from "lucide-react";
import { formatDate, getCloudCoverLabel, getCloudCoverColor } from "src/utils/sentinelUtils";

const LayerCard = ({ 
    layer, index, bandOptions,
    removeActiveLayer, toggleLayerVisibility
 }) => {
    const [expandedLayers, setExpandedLayers] = useState(new Set());
    const getBandInfo = (bandValue) => {
        return (
            bandOptions.find((option) => option.value === bandValue) || {
                label: bandValue,
                icon: "📡",
            }
        );
    };
    const toggleLayerExpansion = (layerId) => {
        setExpandedLayers((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(layerId)) {
                newSet.delete(layerId);
            } else {
                newSet.add(layerId);
            }
            return newSet;
        });
    };

    const removeLayer = (layerId) => {
        removeActiveLayer(layerId);
        setExpandedLayers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(layerId);
            return newSet;
        });
    };

    
    const toggleLayerVisibilityHandler = (layerId) => {
        toggleLayerVisibility(layerId);
    };

    const bandInfo = getBandInfo(layer.bands);
    const isExpanded = expandedLayers.has(layer.id);

    return (
      <div className={styles.layerCard}>
        <div className={styles.layerCard__header}>
          <div className={styles.layerCard__info}>
            <div className={styles.layerCard__bandInfo}>
              <span className={styles.layerCard__bandIcon}>
                {bandInfo.icon}
              </span>
              <span className={styles.layerCard__bandName}>
                {bandInfo.label}
              </span>
            </div>
            <div className={styles.layerCard__details}>
              <span className={styles.layerCard__date}>
                {formatDate(layer.acquisitionDate)}
              </span>
              {layer.cloudCover !== undefined && (
                <div className={styles.layerCard__cloudBadge}>
                  <Cloud
                    size={12}
                    style={{ color: getCloudCoverColor(layer.cloudCover) }}
                  />
                  <span style={{ color: getCloudCoverColor(layer.cloudCover) }}>
                    {layer.cloudCover.toFixed(1)}%
                  </span>
                  <span className={styles.layerCard__cloudLabel}>
                    {getCloudCoverLabel(layer.cloudCover)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={styles.layerCard__actions}>
            <button
              className={`${styles.layerCard__actionBtn} ${
                layer.visible ? styles["layerCard__actionBtn--active"] : ""
              }`}
              onClick={() => toggleLayerVisibilityHandler(layer.id)}
              title={layer.visible ? "Скрыть слой" : "Показать слой"}
            >
              {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              className={styles.layerCard__actionBtn}
              onClick={() => toggleLayerExpansion(layer.id)}
              title="Подробности"
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              className={`${styles.layerCard__actionBtn} ${styles.layerCard__actionBtn}--danger`}
              onClick={() => removeLayer(layer.id)}
              title="Удалить слой"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={styles.layerCard__expandedContent}>
            <div className={styles.layerCard__properties}>
              <div className={styles.layerCard__property}>
                <span className={styles.layerCard__propertyLabel}>
                  Период:
                </span>
                <span className={styles.layerCard__propertyValue}>
                  {layer.startDate} → {layer.endDate}
                </span>
              </div>
              <div className={styles.layerCard__property}>
                <span className={styles.layerCard__propertyLabel}>
                  Непрозрачность:
                </span>
                <span className={styles.layerCard__propertyValue}>
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>
              <div className={styles.layerCard__property}>
                <span className={styles.layerCard__propertyLabel}>
                  ID продукта:
                </span>
                <span
                  className={styles.layerCard__propertyValue}
                  title={layer.productId}
                >
                  {layer.productId?.substring(0, 20)}...
                </span>
              </div>
            </div>
            {bandInfo.description && (
              <div className={styles.layerCard__description}>
                <span className={styles.layerCard__descriptionLabel}>
                  Канал:
                </span>
                <span className={styles.layerCard__descriptionText}>
                  {bandInfo.description}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
};

export default LayerCard;