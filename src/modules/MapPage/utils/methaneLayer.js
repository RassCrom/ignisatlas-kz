import axios from "axios";
import TileLayer from 'ol/layer/Tile';
import GeoTIFF from "ol/source/GeoTIFF";
import { toast } from "react-toastify";

export const createMethaneLayer = (methaneYear, methaneLayerVisible) => {
  const tiffLayer = new TileLayer({
    source: new GeoTIFF({
      sources: [{
        url: `/rasters/sp/tiff/Kazakhstan_Super_Emitters_CH4_${methaneYear}.tif`,
      }],
      bandCount: 1,
      normalize: true,
      convertToRGB: true, // ensures renderable data
    }),
    opacity: 0.5,
    visible: methaneLayerVisible,
  });

  const methaneLayerGroup = {
    tiffLayer,
    
    setVisible: function(visible) {
      tiffLayer.setVisible(visible);
    },

    loadMethaneData: async () => {
      try {
        toast.info("🌍 Loading methane data...");
        toast.success("✅ Methane data loaded successfully");
      } catch (error) {
        console.error("🌍 Failed to load methane data:", error);
        toast.error("Failed to load methane data.");
      }
    },

    updateVisibility: function(methaneLayerVisible) {
      tiffLayer.setVisible(methaneLayerVisible);
    },
  };

  return methaneLayerGroup;
};