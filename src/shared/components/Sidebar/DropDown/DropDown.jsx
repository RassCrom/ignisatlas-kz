import { memo, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import dayjs from "dayjs";

import tileList from "./emit_list.json";
import Options from "../Options/Options";
import { newDD } from "./DropDownData";

// Store hooks
import useFireStore from "src/app/store/fireStore";
import useMethaneStore from "src/app/store/methaneStore";
import useAdminBoundaryStore from "src/app/store/adminBoundaryStore";
import { useLayersStore } from "../../../../app/store/layersStore";

// Controls — Methane
import MethaneControls from "./Controls/Methane/MethaneControls";
import MethaneLegend from "./Controls/Methane/MethaneLegend";
import EmitControls from "./Controls/Methane/EmitControls";

// Controls — Satellite (Copernicus/OpenEO)
import SatelliteInputForm from "./SentinelControls/SatelliteInputForm";
import Sentinel2Controls from "./SentinelControls/Sentinel2Controls";
import { useSatelliteData } from "./SentinelControls/useSatelliteData";

// Controls — Sentinel imagery
import SentinelControls from "./SentinelControls/SentinelControls";
import SentinelControls3 from "./SentinelControls/SentinelControls3";
import SentinelControls5 from "./SentinelControls/SentinelControls5";
import SentinelControls1 from "./SentinelControls/SentinelControls1";
import HLSControls from "./SentinelControls/HLSControls";

// Controls — Fire
import FireControls from "./Controls/FireControls/FireControls";
import FireRisk from "./Controls/FireControls/FireRisk";
import FireModelling from "./Controls/FireControls/FireModelling";

// Controls — Layers
import LulcControls from "./Controls/LulcControls";
import SettlementsControls from "./Controls/SettlementsControls";

import styles from "./DropDown.module.scss";

/* ── Self-subscribed controls (need no props from DropDown) ── */
const SELF_SUBSCRIBED = {
  sentinel2:         (opt) => <SentinelControls key={opt.id} productType="sentinel2" />,
  sentinel3:         (opt) => <SentinelControls3 key={opt.id} />,
  sentinel5:         (opt) => <SentinelControls5 key={opt.id} />,
  sentinel1:         (opt) => <SentinelControls1 key={opt.id} />,
  hls_landsat:       (opt) => <HLSControls key={opt.id} />,
  fire_risk:         (opt) => <FireRisk key={opt.id} />,
  fire_modelling:    (opt) => <FireModelling key={opt.id} />,
  lulc:              (opt) => <LulcControls key={opt.id} />,
  settlements_layer: (opt) => <SettlementsControls key={opt.id} />,
};

const DropDown = memo(({ openTabIndex }) => {
  /* ── Store subscriptions ─────────────────────────────────── */
  const {
    toggleStates, toggleOption,
    expandedItems, toggleExpandedItem,
    setFireLayerVisible, fireLayerVisible,
    fireOpacity, setFireOpacity,
    fireIntensityFilter, setFireIntensityFilter,
    fireStartDate, fireEndDate, setFireStartDate, setFireEndDate,
    fireHeatmapMode, setFireHeatmapMode,
    autoRefresh, setAutoRefresh,
    fireLength, setDateHasChanged,
  } = useFireStore();

  const {
    setMethaneYear, setMethaneLayerVisible, setMethaneOpacity,
    methaneYear, methaneLayerVisible, methaneOpacity,
    emmitLayerVisible, emmitLayerIds,
    beginDateEmmit, endDateEmmit,
    setEmmitLayerIds, setEmmitLayerVisible,
    setBeginDateEmmit, setEndDateEmmit,
    emitSn2LayerVisible, emitSn2Opacity,
    setEmitSn2LayerVisible, setEmitSn2Opacity,
  } = useMethaneStore();

  const {
    layerVisibility, layerOpacity,
    changeFirst, changeSecond, changeThird, changeOpacity,
  } = useAdminBoundaryStore();

  const { layers, updateLayer, changeVisibility } = useLayersStore();

  const satelliteHookData = useSatelliteData();

  /* ── EMIT tile filter by date range ─────────────────────── */
  useEffect(() => {
    if (!beginDateEmmit || !endDateEmmit) return;
    const matchingIds = tileList
      .filter(({ date }) => {
        const d = dayjs(date);
        return (
          d.isAfter(dayjs(beginDateEmmit).subtract(1, "day")) &&
          d.isBefore(dayjs(endDateEmmit).add(1, "day"))
        );
      })
      .map(({ full_string }) => full_string);
    setEmmitLayerIds(matchingIds);
  }, [beginDateEmmit, endDateEmmit, setEmmitLayerIds]);

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
      if (selfSubscribed) return selfSubscribed(option);

      // Prop-dependent controls
      switch (option.id) {
        case "copernicus_image":
          return <SatelliteInputForm key={option.id} {...satelliteHookData} />;

        case "sp":
          return (
            <MethaneControls
              key={option.id}
              methaneLayerVisible={methaneLayerVisible}
              setMethaneLayerVisible={setMethaneLayerVisible}
              methaneYear={methaneYear}
              setMethaneYear={setMethaneYear}
              methaneOpacity={methaneOpacity}
              setMethaneOpacity={setMethaneOpacity}
            />
          );

        case "sp_sn2":
          return (
            <Sentinel2Controls
              key={option.id}
              emitSn2LayerVisible={emitSn2LayerVisible}
              setEmitSn2LayerVisible={setEmitSn2LayerVisible}
              emitSn2Opacity={emitSn2Opacity}
              setEmitSn2Opacity={setEmitSn2Opacity}
            />
          );

        case "sp_instances":
          return (
            <EmitControls
              key={option.id}
              emmitLayerVisible={emmitLayerVisible}
              setEmmitLayerVisible={setEmmitLayerVisible}
              beginDateEmmit={beginDateEmmit}
              endDateEmmit={endDateEmmit}
              setBeginDateEmmit={setBeginDateEmmit}
              setEndDateEmmit={setEndDateEmmit}
              emmitLayerIds={emmitLayerIds}
            />
          );

        case "fire_pinpoints":
          return (
            <FireControls
              key={option.id}
              fireLayerVisible={fireLayerVisible}
              setFireLayerVisible={setFireLayerVisible}
              fireOpacity={fireOpacity}
              setFireOpacity={setFireOpacity}
              fireIntensityFilter={fireIntensityFilter}
              setFireIntensityFilter={setFireIntensityFilter}
              fireStartDate={fireStartDate}
              fireEndDate={fireEndDate}
              setFireStartDate={setFireStartDate}
              setFireEndDate={setFireEndDate}
              fireHeatmapMode={fireHeatmapMode}
              setFireHeatmapMode={setFireHeatmapMode}
              autoRefresh={autoRefresh}
              setAutoRefresh={setAutoRefresh}
              fireLength={fireLength}
              setDateHasChanged={setDateHasChanged}
            />
          );

        default:
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
      }
    },
    [
      satelliteHookData,
      methaneLayerVisible, setMethaneLayerVisible, methaneYear, setMethaneYear,
      methaneOpacity, setMethaneOpacity,
      emitSn2LayerVisible, setEmitSn2LayerVisible, emitSn2Opacity, setEmitSn2Opacity,
      emmitLayerVisible, setEmmitLayerVisible,
      beginDateEmmit, endDateEmmit, setBeginDateEmmit, setEndDateEmmit, emmitLayerIds,
      fireLayerVisible, setFireLayerVisible, fireOpacity, setFireOpacity,
      fireIntensityFilter, setFireIntensityFilter,
      fireStartDate, fireEndDate, setFireStartDate, setFireEndDate,
      fireHeatmapMode, setFireHeatmapMode, autoRefresh, setAutoRefresh,
      fireLength, setDateHasChanged,
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
      <MethaneLegend
        methaneLayerVisible={methaneLayerVisible}
        emitSn2LayerVisible={emitSn2LayerVisible}
        emmitLayerVisible={emmitLayerVisible}
      />

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
