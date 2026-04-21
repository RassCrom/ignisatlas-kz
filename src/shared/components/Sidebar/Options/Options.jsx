import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import { useMemo, useState } from 'react';
import { Clock, Info, Eye, EyeOff, RefreshCw } from "lucide-react";

import './Options.scss';
import LayerInfoPopup from "./LayerInfoPopup";

const Options = ({
  option,
  isOpacityOn,
  getToggleState,
  handleToggleChange,
  getOpacityValue,
  setOpacityValue,
  showOpacity = true,
  onLayerRefresh,
  isLoading = false
}) => {
  const [showLayerInfo, setShowLayerInfo] = useState(false);
  const [opacityInputValue, setOpacityInputValue] = useState(getOpacityValue(option.id) * 100);

  const isEnabled = getToggleState(option.id);
  const currentOpacity = getOpacityValue(option.id) * 100;

  const layerType = useMemo(() => !(isOpacityOn === 'Point'), []);

  const handleOpacityChange = (value) => {
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    setOpacityInputValue(numValue);
    if (setOpacityValue) {
      setOpacityValue(option.id, numValue / 100);
    }
  };

  const handleOpacitySliderChange = (e) => {
    const value = parseInt(e.target.value);
    setOpacityInputValue(value);
    if (setOpacityValue) {
      setOpacityValue(option.id, value / 100);
    }
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    if (onLayerRefresh) {
      onLayerRefresh(option.id);
    }
  };

  return (
    <div className="layer-option">
      {/* Header with toggle and main controls */}
      <div className="layer-option__header">
        <div className="layer-option__left">
          <div className="layer-option__title">
            <div className="layer-icon">
              {option.id === "fire_pinpoints" && <Clock size={16} />}
              {!["fire_pinpoints", "satellite"].includes(option.id) && (
                isEnabled ? <Eye size={16} /> : <EyeOff size={16} />
              )}
            </div>
            <span className="layer-label">{option.label}</span>
          </div>
        </div>
        
        <div className="layer-option__right">
          <div className="layer-controls">
            {/* Info tooltip */}
            <div 
              className="info-tooltip-container"
              onClick={() => setShowLayerInfo(!showLayerInfo)}
            >
              <Info size={14} className="info-icon" />
              {showLayerInfo && (<LayerInfoPopup option={option} />)}
            </div>

            {/* Refresh button */}
            {onLayerRefresh && (
              <button 
                className={`refresh-btn ${isLoading ? 'loading' : ''}`}
                onClick={handleRefresh}
                disabled={isLoading}
                title="Refresh layer data"
              >
                <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
              </button>
            )}

            {/* Main toggle */}
            <ToggleSwitch
              isChecked={isEnabled}
              onChange={() => handleToggleChange(option.id)}
            />
          </div>
        </div>
      </div>

      {/* Expanded controls when layer is enabled & layer is not Point type */}
      {layerType && isEnabled && showOpacity && (
        <div className="layer-option__controls">
          <div className="opacity-control">
            <div className="opacity-header">
              <span className="opacity-label">
                {opacityInputValue === 0 ? <EyeOff size={12} /> : <Eye size={12} />}
                Opacity
              </span>
              <div className="opacity-input-container">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={opacityInputValue}
                  onChange={(e) => handleOpacityChange(e.target.value)}
                  onBlur={() => setOpacityInputValue(currentOpacity)} // Sync on blur
                  className="opacity-input"
                />
                <span className="opacity-unit">%</span>
              </div>
            </div>
            
            <div className="opacity-slider-container">
              <div className="slider-track">
                <div 
                  className="slider-fill" 
                  style={{ width: `${currentOpacity}%` }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacityInputValue}
                  onChange={handleOpacitySliderChange}
                  className="opacity-slider"
                />
              </div>
              <div className="opacity-markers">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Options;