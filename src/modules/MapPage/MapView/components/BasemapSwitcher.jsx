import { useState, useRef, useEffect } from "react";
import { Map as MapIcon, X } from "lucide-react";
import { basemapOptions, getAllBasemaps } from "../../utils/basemaps";
import styles from './BasemapSwitcher.module.scss';

const BasemapSwitcher = ({ currentBasemap, onBasemapChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  const allBasemaps = getAllBasemaps();

  // Group basemaps by type
  const rasterBasemaps = allBasemaps.filter(basemap => basemap.type === 'raster');
  const vectorBasemaps = allBasemaps.filter(basemap => basemap.type === 'vector');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleBasemapChange = async (basemap) => {
    if (currentBasemap === basemap.layer) return;
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      onBasemapChange(basemap.layer);
      setIsOpen(false);
    } catch (error) {
      console.error('Error changing basemap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event, basemap) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBasemapChange(basemap);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Format basemap name for display
  const formatName = (name) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Vector$/, '')
      .trim();
  };

  const renderBasemapGroup = (basemaps, title) => {
    if (basemaps.length === 0) return null;
    
    return (
      <div className={styles.basemapGroup}>
        <div className={styles.categoryTitle}>{title}</div>
        {basemaps.map((basemap) => (
          <button
            key={basemap.key}
            className={`${styles.basemapOption} ${
              currentBasemap === basemap.layer ? styles.active : ""
            }`}
            onClick={() => handleBasemapChange(basemap)}
            onKeyDown={(e) => handleKeyDown(e, basemap)}
            disabled={isLoading}
            aria-pressed={currentBasemap === basemap.layer}
          >
            <span className={styles.basemapName}>
              {formatName(basemap.name)}
            </span>
            <span className={styles.basemapType}>
              {basemap.type}
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.basemapSwitcher} ref={dropdownRef}>
      <button
        className={`${styles.basemapButton} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Закрыть подложки" : "Открыть подложки"}
        title="Подложка карты"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={isLoading}
      >
        {isOpen ? <X /> : <MapIcon />}
      </button>

      {isOpen && (
        <div 
          className={styles.basemapOptions} 
          role="menu"
          aria-label="Basemap options"
        >
          {isLoading ? (
            <div className={styles.loading}>
              Смена подложки...
            </div>
          ) : (
            <>
              {renderBasemapGroup(rasterBasemaps, 'Растровые')}
              {renderBasemapGroup(vectorBasemaps, 'Векторные')}
              
              {/* Fallback if no categorized basemaps */}
              {rasterBasemaps.length === 0 && vectorBasemaps.length === 0 && (
                <div className={styles.basemapGroup}>
                  {Object.keys(basemapOptions).map((key) => (
                    <button
                      key={key}
                      className={`${styles.basemapOption} ${
                        currentBasemap === basemapOptions[key] ? styles.active : ""
                      }`}
                      onClick={() => handleBasemapChange({ 
                        key, 
                        layer: basemapOptions[key], 
                        name: key 
                      })}
                      onKeyDown={(e) => handleKeyDown(e, { 
                        key, 
                        layer: basemapOptions[key], 
                        name: key 
                      })}
                    >
                      <span className={styles.basemapName}>
                        {formatName(key)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BasemapSwitcher;