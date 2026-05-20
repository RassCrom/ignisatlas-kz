import { lazy, memo, Suspense, useCallback } from "react";
import { ChevronDown } from "lucide-react";

import Options from "../Options/Options";
import { newDD } from "./DropDownData";

// Store hooks
import useFireStore from "src/app/store/fireStore";
import useAdminBoundaryStore from "src/app/store/adminBoundaryStore";
import { useLayersStore } from "../../../../app/store/layersStore";

import styles from "./DropDown.module.scss";

// Keep heavy controls out of the initial map sidebar chunk. They load when a
// user expands the matching option group.
const FireControls = lazy(() => import("./Controls/FireControls/FireControls"));
const SentinelExplorer = lazy(() => import("./SentinelControls/SentinelExplorer"));
const SentinelExplorerOld = lazy(() => import("./SentinelControls/SentinelExplorerOld"));
const LandsatExplorer = lazy(() => import("./SentinelControls/LandsatExplorer"));
const ModisExplorer = lazy(() => import("./SentinelControls/ModisExplorer"));
const AtmosphereExplorer = lazy(() => import("./SentinelControls/AtmosphereExplorer"));
const LSTExplorer = lazy(() => import("./SentinelControls/LSTExplorer"));

const FireRisk = lazy(() => import("./Controls/FireControls/FireRisk"));
const FireModelling = lazy(() => import("./Controls/FireControls/FireModelling"));

const LulcControls = lazy(() => import("./Controls/LulcControls"));
const LulcPcControls = lazy(() => import("./Controls/LulcPcControls"));
const DemControls = lazy(() => import("./Controls/DemControls"));
const SettlementsControls = lazy(() => import("./Controls/SettlementsControls"));
const ClimateZonesControls = lazy(() => import("./Controls/ClimateZonesControls"));
const ProtectedAreasControls = lazy(() => import("./Controls/ProtectedAreasControls"));
const PeatlandsControls = lazy(() => import("./Controls/PeatlandsControls"));
const LayersPanel = lazy(() => import("./Controls/LayersPanel"));

const MeasureDistanceTool = lazy(() => import("./ToolsControls/MeasureDistanceTool"));
const MeasureAreaTool = lazy(() => import("./ToolsControls/MeasureAreaTool"));
const DrawPolygonTool = lazy(() => import("./ToolsControls/DrawPolygonTool"));
const BufferTool = lazy(() => import("./ToolsControls/BufferTool"));
const IntersectTool = lazy(() => import("./ToolsControls/IntersectTool"));
const ProfileTool = lazy(() => import("./ToolsControls/ProfileTool"));

const IdentifyPixelTool = lazy(() => import("./ToolsControls/IdentifyPixelTool"));
const FeatureInfoTool = lazy(() => import("./ToolsControls/FeatureInfoTool"));
const DownloadDataTool = lazy(() => import("./ToolsControls/DownloadDataTool"));
const ExportCsvTool = lazy(() => import("./ToolsControls/ExportCsvTool"));
const ExportGeojsonTool = lazy(() => import("./ToolsControls/ExportGeojsonTool"));
const ApiLinksTool = lazy(() => import("./ToolsControls/ApiLinksTool"));

const SpatialBookmarksTool = lazy(() => import("./ToolsControls/SpatialBookmarksTool"));
const HomeExtentTool = lazy(() => import("./ToolsControls/HomeExtentTool"));
const CoordinateSearchTool = lazy(() => import("./ToolsControls/CoordinateSearchTool"));
const GoToRegionTool = lazy(() => import("./ToolsControls/GoToRegionTool"));
const GeolocateUserTool = lazy(() => import("./ToolsControls/GeolocateUserTool"));

const LazyControl = ({ component: Component, option }) => (
  <Suspense fallback={<div className={styles.dropdown__empty}>Loading...</div>}>
    <Component option={option} />
  </Suspense>
);

/* ── Self-subscribed controls (need no props from DropDown) ── */
const SELF_SUBSCRIBED = {
  sentinel_explorer: SentinelExplorer,
  sentinel_explorer_old: SentinelExplorerOld,
  landsat_explorer: LandsatExplorer,
  modis_explorer: ModisExplorer,
  atmosphere_explorer: AtmosphereExplorer,
  fire_pinpoints: FireControls,
  fire_risk: FireRisk,
  fire_modelling: FireModelling,
  lst_explorer: LSTExplorer,
  lulc: LulcControls,
  lulc_pc: LulcPcControls,
  dem_pc: DemControls,
  settlements_layer: SettlementsControls,
  measure_distance: MeasureDistanceTool,
  measure_area: MeasureAreaTool,
  draw_polygon: DrawPolygonTool,
  buffer_tool: BufferTool,
  intersect_tool: IntersectTool,
  profile_tool: ProfileTool,
  spatial_bookmark_tool: SpatialBookmarksTool,
  home_extent: HomeExtentTool,
  coordinate_search: CoordinateSearchTool,
  go_to_region: GoToRegionTool,
  geolocate_user: GeolocateUserTool,
  layers_panel: LayersPanel,
  climate_zones: ClimateZonesControls,
  protected_area_boundaries: ProtectedAreasControls,
  peatlands: PeatlandsControls,
  identify_pixel: IdentifyPixelTool,
  feature_info: FeatureInfoTool,
  download_data: DownloadDataTool,
  export_csv: ExportCsvTool,
  export_geojson: ExportGeojsonTool,
  api_links: ApiLinksTool,
};

const DropDown = memo(({ openTabIndex }) => {
  /* ── Store subscriptions ─────────────────────────────────── */
  const {
    toggleStates, toggleOption,
    expandedItems, toggleExpandedItem,
  } = useFireStore();

  const {
    layerOpacity,
    changeFirst, changeSecond, changeThird, changeOpacity,
  } = useAdminBoundaryStore();

  const { layers, updateLayer, changeVisibility } = useLayersStore();

  /* ── Opacity helpers ─────────────────────────────────────── */
  const getOpacityValue = useCallback(
    (optionId) => {
      const layer = layers.find(l => l.id === optionId);
      return layer ? (layer.opacity ?? 1) : layerOpacity[optionId];
    },
    [layerOpacity, layers]
  );

  const getToggleState = useCallback(
    (optionId) => {
      const layer = layers.find(l => l.id === optionId);
      return layer ? layer.visible : (toggleStates[optionId] || false);
    },
    [toggleStates, layers]
  );

  const handleOpacityValue = useCallback(
    (optionId, value) => {
      const layer = layers.find(l => l.id === optionId);
      if (layer) updateLayer(optionId, { opacity: value });
      else changeOpacity(optionId, value);
    },
    [layers, updateLayer, changeOpacity]
  );

  const handleToggleChange = useCallback(
    (optionId) => {
      const layer = layers.find(l => l.id === optionId);
      if (layer) { changeVisibility(optionId); return; }
      if (optionId === "country_boundaries")  changeFirst();
      else if (optionId === "region_boundaries")   changeSecond();
      else if (optionId === "district_boundaries")  changeThird();
      toggleOption(optionId);
    },
    [layers, changeVisibility, changeFirst, changeSecond, changeThird, toggleOption]
  );

  /* ── Option renderer ─────────────────────────────────────── */
  const renderOption = useCallback(
    (option) => {
      // Self-subscribed controls need no props
      const selfSubscribed = SELF_SUBSCRIBED[option.id];
      if (selfSubscribed) {
        return <LazyControl key={option.id} component={selfSubscribed} option={option} />;
      }

      return (
        <Options
          key={option.id}
          isOpacityOn={option.layerType}
          option={option}
          getToggleState={getToggleState}
          handleToggleChange={handleToggleChange}
          getOpacityValue={getOpacityValue}
          setOpacityValue={handleOpacityValue}
        />
      );
    },
    [
      getToggleState, handleToggleChange, getOpacityValue, handleOpacityValue,
    ]
  );

  /* ── Render ──────────────────────────────────────────────── */
  const currentSection = newDD.find((section) => section.id === openTabIndex);
  if (!currentSection) {
    return <div className={styles.dropdown__empty}>No data available</div>;
  }

  return (
    <div className={styles.dropdown}>

      {currentSection.items.map((item) => (
        <div key={item.id} className={styles.dropdown__item}>
          <div
            className={styles.dropdown__heading}
            onClick={() => toggleExpandedItem(item.id)}
            aria-expanded={expandedItems[item.id]}
          >
            <h3>{item.label_ru}</h3>
            <ChevronDown
              size={18}
              className={`${styles.dropdown__icon} ${
                expandedItems[item.id] ? styles["dropdown__icon--rotated"] : ""
              }`}
            />
          </div>

          {expandedItems[item.id] && (
            <div className={styles.dropdown__options}>
              {item.options.map(renderOption)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

DropDown.displayName = "DropDown";

export default DropDown;
