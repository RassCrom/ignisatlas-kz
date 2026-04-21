// Constants
export const ICON_SIZE = 16;

export const DEFAULT_SATELLITE_INPUTS = {
  collection: "COPERNICUS/S2_SR",
  startDate: "2019-06-23",
  endDate: "2019-06-30",
  bands: "B4,B3,B2",
  west: "71.21797",
  south: "50.85761",
  east: "71.78519",
  north: "51.35111",
};

export const SATELLITE_COLLECTIONS = [
  { value: "COPERNICUS/S2_SR", label: "Sentinel-2 Surface Reflectance" },
  { value: "SENTINEL1_GRD", label: "Sentinel-1 GRD" },
  { value: "SENTINEL2_L2A", label: "Sentinel-2 L2A" },
  { value: "SENTINEL3_OLCI", label: "Sentinel-3 OLCI" },
];