import { useCallback, useMemo, useState } from 'react';
import { Eye, EyeOff, Layers, Search, X } from 'lucide-react';

import useAdminBoundaryStore from 'src/app/store/adminBoundaryStore';
import { useLayersStore } from 'src/app/store/layersStore';
import useSettlementsStore from 'src/app/store/settlementsStore';
import useFireStore from 'src/app/store/fireStore';
import useLulcPcStore from 'src/app/store/lulcPcStore';
import useLulcStore from 'src/app/store/lulcStore';
import useRiskMapStore from 'src/app/store/riskMapStore';
import useFireModellingStore from 'src/app/store/fireModellingStore';
import useLandsatExplorerStore from 'src/app/store/landsatExplorerStore';
import useSentinelExplorerStore from 'src/app/store/sentinelExplorerStore';
import useSentinelExplorerOldStore from 'src/app/store/sentinelExplorerOldStore';
import useModisExplorerStore from 'src/app/store/modisExplorerStore';
import useAtmosphereStore from 'src/app/store/atmosphereStore';
import useLstStore from 'src/app/store/lstStore';
import useFuelMoistureStore from 'src/app/store/fuelMoistureStore';
import useWaterMonitoringStore from 'src/app/store/waterMonitoringStore';
import useGlacierMonitoringStore from 'src/app/store/glacierMonitoringStore';
import useDemStore from 'src/app/store/demStore';
import useProtectedAreasStore from 'src/app/store/protectedAreasStore';
import useClimateZonesStore from 'src/app/store/climateZonesStore';
import usePeatlandsStore from 'src/app/store/peatlandsStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';

import './FireControls/fireControls.scss';
import './LayersPanel.scss';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'visible', label: 'Visible' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'raster', label: 'Raster' },
  { id: 'vector', label: 'Vector' },
];

function syncMapLayer(id, visible, opacity01) {
  const map = getMapInstance();
  if (!map?.getLayer(id)) return;

  if (visible !== undefined) {
    map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
  }

  if (opacity01 !== undefined) {
    const layerType = map.getLayer(id)?.type;
    const paintProperty = layerType === 'fill'
      ? 'fill-opacity'
      : layerType === 'line'
        ? 'line-opacity'
        : layerType === 'circle'
          ? 'circle-opacity'
          : 'raster-opacity';
    map.setPaintProperty(id, paintProperty, opacity01);
  }
}

function syncMapLayers(ids = [], visible, opacity01) {
  ids.forEach((id) => syncMapLayer(id, visible, opacity01));
}

function LayerRow({ layer }) {
  const pct = Math.round((layer.opacity01 ?? 1) * 100);

  return (
    <div className="lm-row">
      <div className="lm-row__top">
        <button
          type="button"
          className={`lm-row__eye${layer.visible ? ' lm-row__eye--on' : ''}`}
          onClick={layer.onToggle}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
          aria-label={layer.visible ? `Hide ${layer.name}` : `Show ${layer.name}`}
        >
          {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <span className="lm-row__name" title={layer.name}>{layer.name}</span>
        <span className={`lm-badge lm-badge--${layer.type}`}>{layer.type}</span>
      </div>
      <div className="lm-row__bottom">
        <span className="lm-row__provider" title={layer.provider}>{layer.provider}</span>
        {layer.featureCount != null && (
          <span className="lm-row__count">{layer.featureCount.toLocaleString()} features</span>
        )}
        <div className="lm-row__opacity-wrap">
          <input
            type="range"
            min="0"
            max="100"
            value={pct}
            onChange={(event) => layer.onOpacity(Number(event.target.value) / 100)}
            className="lm-slider"
            aria-label={`${layer.name} opacity`}
          />
          <span className="lm-row__opacity-val">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, count }) {
  return (
    <div className="lm-section__title">
      <span>{title}</span>
      <span className="lm-section__count">{count}</span>
    </div>
  );
}

const fmt = (iso) => (iso ? iso.slice(0, 10) : '-');

const searchableText = (layer, sectionTitle) =>
  `${sectionTitle} ${layer.name} ${layer.provider} ${layer.type}`.toLowerCase();

const filterLayer = (layer, sectionTitle, query, filter) => {
  if (filter === 'visible' && !layer.visible) return false;
  if (filter === 'hidden' && layer.visible) return false;
  if ((filter === 'raster' || filter === 'vector') && layer.type !== filter) return false;
  if (!query) return true;
  return searchableText(layer, sectionTitle).includes(query);
};

const LayersPanel = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const adminVis = useAdminBoundaryStore((s) => s.layerVisibility);
  const adminOpa = useAdminBoundaryStore((s) => s.layerOpacity);
  const changeFirst = useAdminBoundaryStore((s) => s.changeFirst);
  const changeSecond = useAdminBoundaryStore((s) => s.changeSecond);
  const changeThird = useAdminBoundaryStore((s) => s.changeThird);
  const changeAdminOpacity = useAdminBoundaryStore((s) => s.changeOpacity);

  const kchsLayers = useLayersStore((s) => s.layers);
  const updateKchs = useLayersStore((s) => s.updateLayer);
  const changeKchsVis = useLayersStore((s) => s.changeVisibility);

  const settVisible = useSettlementsStore((s) => s.visible);
  const settOpacity = useSettlementsStore((s) => s.opacity);
  const toggleSett = useSettlementsStore((s) => s.toggleVisible);
  const setSettOpacity = useSettlementsStore((s) => s.setOpacity);

  const fireVisible = useFireStore((s) => s.fireLayerVisible);
  const fireOpacity = useFireStore((s) => s.fireOpacity);
  const setFireVisible = useFireStore((s) => s.setFireLayerVisible);
  const setFireOpacity = useFireStore((s) => s.setFireOpacity);
  const fireLength = useFireStore((s) => s.fireLength);

  const lulcPcAdded = useLulcPcStore((s) => s.isAdded);
  const lulcPcVisible = useLulcPcStore((s) => s.visible);
  const lulcPcOpacity = useLulcPcStore((s) => s.opacity);
  const lulcPcYear = useLulcPcStore((s) => s.year);
  const toggleLulcPc = useLulcPcStore((s) => s.toggleVisible);
  const setLulcPcOpacity = useLulcPcStore((s) => s.setOpacity);

  const lulcAdded = useLulcStore((s) => s.isAdded);
  const lulcVisible = useLulcStore((s) => s.visible);
  const lulcOpacity = useLulcStore((s) => s.opacity);
  const toggleLulc = useLulcStore((s) => s.toggleVisible);
  const setLulcOpacity = useLulcStore((s) => s.setOpacity);

  const riskDates = useRiskMapStore((s) => s.riskDates);
  const updateRiskVis = useRiskMapStore((s) => s.updateDateVisibility);
  const updateRiskOpa = useRiskMapStore((s) => s.updateDateOpacity);

  const fmLayers = useFireModellingStore((s) => s.fireModellingLayers);
  const updateFm = useFireModellingStore((s) => s.updateFireModellingLayer);

  const landsatLayers = useLandsatExplorerStore((s) => s.activeLayers);
  const toggleLandsat = useLandsatExplorerStore((s) => s.toggleLayerVisibility);
  const updateLandsatOpa = useLandsatExplorerStore((s) => s.updateLayerOpacity);

  const sentinelLayers = useSentinelExplorerStore((s) => s.activeLayers);
  const toggleSentinel = useSentinelExplorerStore((s) => s.toggleLayerVisibility);
  const updateSentinelOpa = useSentinelExplorerStore((s) => s.updateLayerOpacity);

  const sentinelOldLayers = useSentinelExplorerOldStore((s) => s.activeLayers);
  const toggleSentinelOld = useSentinelExplorerOldStore((s) => s.toggleLayerVisibility);
  const updateSentinelOldOpa = useSentinelExplorerOldStore((s) => s.updateLayerOpacity);

  const modisLayers = useModisExplorerStore((s) => s.activeLayers);
  const toggleModis = useModisExplorerStore((s) => s.toggleLayerVisibility);
  const updateModisOpa = useModisExplorerStore((s) => s.updateLayerOpacity);

  const atmosphereLayers = useAtmosphereStore((s) => s.activeLayers);
  const toggleAtmosphere = useAtmosphereStore((s) => s.toggleLayerVisibility);
  const updateAtmosphereOpa = useAtmosphereStore((s) => s.updateLayerOpacity);

  const lstLayers = useLstStore((s) => s.activeLayers);
  const toggleLst = useLstStore((s) => s.toggleLayerVisibility);
  const updateLstOpa = useLstStore((s) => s.updateLayerOpacity);

  const fuelMoistureLayers = useFuelMoistureStore((s) => s.activeLayers);
  const toggleFuelMoisture = useFuelMoistureStore((s) => s.toggleLayerVisibility);
  const updateFuelMoistureOpa = useFuelMoistureStore((s) => s.updateLayerOpacity);

  const waterBodiesVisible = useWaterMonitoringStore((s) => s.visible);
  const waterBodiesOpacity = useWaterMonitoringStore((s) => s.opacity);
  const toggleWaterBodies = useWaterMonitoringStore((s) => s.toggleVisible);
  const setWaterBodiesOpacity = useWaterMonitoringStore((s) => s.setOpacity);
  const waterMonitoringLayers = useWaterMonitoringStore((s) => s.activeLayers);
  const toggleWaterMonitoring = useWaterMonitoringStore((s) => s.toggleLayerVisibility);
  const updateWaterMonitoringOpa = useWaterMonitoringStore((s) => s.updateLayerOpacity);

  const glacierInventoryVisible = useGlacierMonitoringStore((s) => s.visible);
  const glacierInventoryOpacity = useGlacierMonitoringStore((s) => s.opacity);
  const toggleGlacierInventory = useGlacierMonitoringStore((s) => s.toggleVisible);
  const setGlacierInventoryOpacity = useGlacierMonitoringStore((s) => s.setOpacity);
  const glacierMonitoringLayers = useGlacierMonitoringStore((s) => s.activeLayers);
  const toggleGlacierMonitoring = useGlacierMonitoringStore((s) => s.toggleLayerVisibility);
  const updateGlacierMonitoringOpa = useGlacierMonitoringStore((s) => s.updateLayerOpacity);

  const demAdded = useDemStore((s) => s.isAdded);
  const demVisible = useDemStore((s) => s.visible);
  const demOpacity = useDemStore((s) => s.opacity);
  const demRenderer = useDemStore((s) => s.renderer);
  const toggleDem = useDemStore((s) => s.toggleVisible);
  const setDemOpacity = useDemStore((s) => s.setOpacity);

  const protectedAreasVisible = useProtectedAreasStore((s) => s.visible);
  const protectedAreasOpacity = useProtectedAreasStore((s) => s.opacity);
  const toggleProtectedAreas = useProtectedAreasStore((s) => s.toggleVisible);
  const setProtectedAreasOpacity = useProtectedAreasStore((s) => s.setOpacity);

  const climateZonesVisible = useClimateZonesStore((s) => s.visible);
  const climateZonesOpacity = useClimateZonesStore((s) => s.opacity);
  const toggleClimateZones = useClimateZonesStore((s) => s.toggleVisible);
  const setClimateZonesOpacity = useClimateZonesStore((s) => s.setOpacity);

  const peatlandsVisible = usePeatlandsStore((s) => s.visible);
  const peatlandsOpacity = usePeatlandsStore((s) => s.opacity);
  const togglePeatlands = usePeatlandsStore((s) => s.toggleVisible);
  const setPeatlandsOpacity = usePeatlandsStore((s) => s.setOpacity);

  const makeExplorerHandlers = useCallback((layer, toggleFn, updateOpaFn) => ({
    onToggle: () => {
      const next = !layer.visible;
      toggleFn(layer.id);
      syncMapLayer(layer.layerId || layer.id, next, undefined);
    },
    onOpacity: (opacity01) => {
      updateOpaFn(layer.id, Math.round(opacity01 * 100));
      syncMapLayer(layer.layerId || layer.id, undefined, opacity01);
    },
  }), []);

  const sections = useMemo(() => {
    const baseLayers = [
      {
        id: 'fire-hotspots',
        name: 'Fire Hotspots',
        type: 'vector',
        provider: 'NASA FIRMS / API',
        visible: fireVisible,
        opacity01: fireOpacity / 100,
        featureCount: fireLength > 0 ? fireLength : null,
        onToggle: setFireVisible,
        onOpacity: (opacity01) => setFireOpacity(Math.round(opacity01 * 100)),
      },
      {
        id: 'country-boundaries',
        name: 'Kazakhstan Boundary',
        type: 'vector',
        provider: 'OpenStreetMap / Local',
        visible: adminVis.country_boundaries ?? false,
        opacity01: adminOpa.country_boundaries ?? 1,
        onToggle: changeFirst,
        onOpacity: (opacity01) => changeAdminOpacity('country_boundaries', opacity01),
      },
      {
        id: 'region-boundaries',
        name: 'Regions',
        type: 'vector',
        provider: 'OpenStreetMap / Local',
        visible: adminVis.region_boundaries ?? false,
        opacity01: adminOpa.region_boundaries ?? 1,
        onToggle: changeSecond,
        onOpacity: (opacity01) => changeAdminOpacity('region_boundaries', opacity01),
      },
      {
        id: 'district-boundaries',
        name: 'Districts',
        type: 'vector',
        provider: 'OpenStreetMap / Local',
        visible: adminVis.district_boundaries ?? false,
        opacity01: adminOpa.district_boundaries ?? 1,
        onToggle: changeThird,
        onOpacity: (opacity01) => changeAdminOpacity('district_boundaries', opacity01),
      },
      {
        id: 'settlements',
        name: 'Settlements',
        type: 'vector',
        provider: 'OpenStreetMap',
        visible: settVisible,
        opacity01: settOpacity,
        onToggle: toggleSett,
        onOpacity: setSettOpacity,
      },
    ];

    const emergencyLayers = kchsLayers.map((layer) => ({
      id: `kchs-${layer.id}`,
      name: layer.layerName,
      type: 'vector',
      provider: 'Local GeoJSON',
      visible: layer.visible,
      opacity01: layer.opacity ?? 1,
      onToggle: () => changeKchsVis(layer.id),
      onOpacity: (opacity01) => updateKchs(layer.id, { opacity: opacity01 }),
    }));

    const landCoverLayers = [
      lulcPcAdded && {
        id: 'lulc-pc',
        name: `ESRI LULC 10m - ${lulcPcYear}`,
        type: 'raster',
        provider: 'Planetary Computer / Sentinel-2',
        visible: lulcPcVisible,
        opacity01: lulcPcOpacity,
        onToggle: toggleLulcPc,
        onOpacity: setLulcPcOpacity,
      },
      lulcAdded && {
        id: 'lulc-legacy',
        name: 'ESRI Land Cover legacy',
        type: 'raster',
        provider: 'ArcGIS ImageServer',
        visible: lulcVisible,
        opacity01: lulcOpacity,
        onToggle: toggleLulc,
        onOpacity: setLulcOpacity,
      },
    ].filter(Boolean);

    const fireAnalysisLayers = [
      ...riskDates.map((riskDate) => ({
        id: `risk-${riskDate.id}`,
        name: `Fire Risk - ${riskDate.date}`,
        type: 'raster',
        provider: 'Local / API',
        visible: riskDate.isVisible,
        opacity01: riskDate.opacity ?? 1,
        onToggle: () => updateRiskVis(riskDate.id, !riskDate.isVisible),
        onOpacity: (opacity01) => updateRiskOpa(riskDate.id, opacity01),
      })),
      ...Object.values(fmLayers).map((layer) => ({
        id: `fire-model-${layer.id}`,
        name: `Fire Model - ${fmt(layer.addedAt)}`,
        type: 'raster',
        provider: 'Local / API',
        visible: layer.visible ?? true,
        opacity01: layer.opacity ?? 1,
        onToggle: () => {
          const next = !(layer.visible ?? true);
          updateFm(layer.id, { visible: next });
          syncMapLayers(layer.layerIds, next, undefined);
        },
        onOpacity: (opacity01) => {
          updateFm(layer.id, { opacity: opacity01 });
          syncMapLayers(layer.layerIds, undefined, opacity01);
        },
      })),
      ...fuelMoistureLayers.map((layer) => ({
        id: `fuel-moisture-${layer.id}`,
        name: `${layer.indexLabel || 'NDMI'} Fuel Dryness - ${fmt(layer.acquisitionDate)}`,
        type: 'raster',
        provider: 'Planetary Computer / Sentinel-2',
        visible: layer.visible,
        opacity01: (layer.opacity ?? 82) / 100,
        ...makeExplorerHandlers(layer, toggleFuelMoisture, updateFuelMoistureOpa),
      })),
    ];

    const thematicLayers = [
      demAdded && {
        id: 'dem-relief',
        name: `Relief - ${demRenderer}`,
        type: 'raster',
        provider: 'Planetary Computer / Copernicus DEM',
        visible: demVisible,
        opacity01: demOpacity,
        onToggle: toggleDem,
        onOpacity: setDemOpacity,
      },
      {
        id: 'water-bodies',
        name: 'Kazakhstan Water Bodies',
        type: 'vector',
        provider: 'Public GeoJSON',
        visible: waterBodiesVisible,
        opacity01: waterBodiesOpacity,
        onToggle: toggleWaterBodies,
        onOpacity: setWaterBodiesOpacity,
      },
      {
        id: 'glacier-inventory',
        name: 'Kazakhstan Glaciers',
        type: 'vector',
        provider: 'Public GeoJSON',
        visible: glacierInventoryVisible,
        opacity01: glacierInventoryOpacity,
        featureCount: 1754,
        onToggle: toggleGlacierInventory,
        onOpacity: setGlacierInventoryOpacity,
      },
      {
        id: 'protected-areas',
        name: 'Границы ООПТ',
        type: 'vector',
        provider: 'Protected areas boundaries',
        visible: protectedAreasVisible,
        opacity01: protectedAreasOpacity,
        onToggle: toggleProtectedAreas,
        onOpacity: setProtectedAreasOpacity,
      },
      {
        id: 'climate-zones',
        name: 'Климатические зоны',
        type: 'vector',
        provider: 'Climate zones',
        visible: climateZonesVisible,
        opacity01: climateZonesOpacity,
        onToggle: toggleClimateZones,
        onOpacity: setClimateZonesOpacity,
      },
      {
        id: 'peatlands',
        name: 'Торфяники',
        type: 'vector',
        provider: 'Peatlands',
        visible: peatlandsVisible,
        opacity01: peatlandsOpacity,
        onToggle: togglePeatlands,
        onOpacity: setPeatlandsOpacity,
      },
    ].filter(Boolean);

    const satelliteLayers = [
      ...landsatLayers.map((layer) => ({
        id: `landsat-${layer.id}`,
        name: `Landsat - ${fmt(layer.acquisitionDate)}`,
        type: 'raster',
        provider: 'Planetary Computer',
        visible: layer.visible,
        opacity01: (layer.opacity ?? 80) / 100,
        ...makeExplorerHandlers(layer, toggleLandsat, updateLandsatOpa),
      })),
      ...sentinelLayers.map((layer) => ({
        id: `sentinel-${layer.id}`,
        name: `Sentinel - ${fmt(layer.acquisitionDate)}`,
        type: 'raster',
        provider: 'Planetary Computer',
        visible: layer.visible,
        opacity01: (layer.opacity ?? 80) / 100,
        ...makeExplorerHandlers(layer, toggleSentinel, updateSentinelOpa),
      })),
      ...sentinelOldLayers.map((layer) => ({
        id: `sentinel-legacy-${layer.id}`,
        name: `Sentinel Legacy - ${fmt(layer.acquisitionDate)}`,
        type: 'raster',
        provider: 'Copernicus / Sentinel Hub',
        visible: layer.visible,
        opacity01: layer.opacity ?? 0.8,
        onToggle: () => {
          const next = !layer.visible;
          toggleSentinelOld(layer.id);
          syncMapLayer(layer.layerId || layer.id, next, undefined);
        },
        onOpacity: (opacity01) => {
          updateSentinelOldOpa(layer.id, opacity01);
          syncMapLayer(layer.layerId || layer.id, undefined, opacity01);
        },
      })),
      ...modisLayers.map((layer) => ({
        id: `modis-${layer.id}`,
        name: `MODIS - ${fmt(layer.acquisitionDate)}`,
        type: 'raster',
        provider: 'Planetary Computer',
        visible: layer.visible,
        opacity01: (layer.opacity ?? 80) / 100,
        ...makeExplorerHandlers(layer, toggleModis, updateModisOpa),
      })),
      ...atmosphereLayers.map((layer) => ({
        id: `atmosphere-${layer.id}`,
        name: `${layer.name || 'Atmosphere'} - ${fmt(layer.acquisitionDate || layer.date)}`,
        type: 'raster',
        provider: layer.provider || 'NASA GIBS WMS',
        visible: layer.visible,
        opacity01: (layer.opacity ?? 80) / 100,
        ...makeExplorerHandlers(layer, toggleAtmosphere, updateAtmosphereOpa),
      })),
      ...lstLayers.map((layer) => ({
        id: `lst-${layer.id}`,
        name: `LST - ${fmt(layer.acquisitionDate)}`,
        type: 'raster',
        provider: layer.collection === 'landsat-c2-l2'
          ? 'Planetary Computer / Landsat'
          : 'Planetary Computer / MODIS',
        visible: layer.visible,
        opacity01: (layer.opacity ?? 80) / 100,
        ...makeExplorerHandlers(layer, toggleLst, updateLstOpa),
      })),
      ...waterMonitoringLayers.map((layer) => ({
        id: `water-monitoring-${layer.id}`,
        name: `${layer.indexLabel || 'Water'} - ${fmt(layer.acquisitionDate)}`,
        type: 'raster',
        provider: layer.collection?.includes('sentinel-3')
          ? 'Planetary Computer / Sentinel-3 OLCI'
          : 'Planetary Computer / Sentinel-2',
        visible: layer.visible,
        opacity01: (layer.opacity ?? 82) / 100,
        ...makeExplorerHandlers(layer, toggleWaterMonitoring, updateWaterMonitoringOpa),
      })),
      ...glacierMonitoringLayers.map((layer) => ({
        id: `glacier-monitoring-${layer.id}`,
        name: `${layer.indexLabel || 'Glacier'} - ${fmt(layer.acquisitionDate)}`,
        type: 'raster',
        provider: 'Planetary Computer / Sentinel-2',
        visible: layer.visible,
        opacity01: (layer.opacity ?? 84) / 100,
        ...makeExplorerHandlers(layer, toggleGlacierMonitoring, updateGlacierMonitoringOpa),
      })),
    ];

    return [
      { id: 'base', title: 'Base Layers', layers: baseLayers },
      { id: 'emergency', title: 'Emergency Objects', layers: emergencyLayers },
      { id: 'land-cover', title: 'Land Cover', layers: landCoverLayers },
      { id: 'thematic', title: 'Relief & Thematic Layers', layers: thematicLayers },
      { id: 'fire-analysis', title: 'Fire Analysis', layers: fireAnalysisLayers },
      { id: 'satellite', title: 'Satellite & API Layers', layers: satelliteLayers },
    ].filter((section) => section.layers.length > 0);
  }, [
    adminOpa,
    adminVis,
    atmosphereLayers,
    changeAdminOpacity,
    changeFirst,
    changeKchsVis,
    changeSecond,
    changeThird,
    climateZonesOpacity,
    climateZonesVisible,
    demAdded,
    demOpacity,
    demRenderer,
    demVisible,
    fireLength,
    fireOpacity,
    fireVisible,
    fmLayers,
    fuelMoistureLayers,
    glacierInventoryOpacity,
    glacierInventoryVisible,
    glacierMonitoringLayers,
    kchsLayers,
    landsatLayers,
    lstLayers,
    lulcAdded,
    lulcOpacity,
    lulcPcAdded,
    lulcPcOpacity,
    lulcPcVisible,
    lulcPcYear,
    lulcVisible,
    makeExplorerHandlers,
    modisLayers,
    riskDates,
    sentinelLayers,
    sentinelOldLayers,
    setFireOpacity,
    setFireVisible,
    setClimateZonesOpacity,
    setDemOpacity,
    setGlacierInventoryOpacity,
    setLulcOpacity,
    setLulcPcOpacity,
    setPeatlandsOpacity,
    setProtectedAreasOpacity,
    setSettOpacity,
    settOpacity,
    settVisible,
    toggleAtmosphere,
    toggleClimateZones,
    toggleDem,
    toggleFuelMoisture,
    toggleGlacierInventory,
    toggleGlacierMonitoring,
    toggleLandsat,
    toggleLst,
    toggleLulc,
    toggleLulcPc,
    toggleModis,
    togglePeatlands,
    toggleProtectedAreas,
    toggleSentinel,
    toggleSentinelOld,
    toggleSett,
    updateAtmosphereOpa,
    updateFm,
    updateFuelMoistureOpa,
    updateGlacierMonitoringOpa,
    updateKchs,
    updateLandsatOpa,
    updateLstOpa,
    updateModisOpa,
    updateRiskOpa,
    updateRiskVis,
    updateSentinelOpa,
    updateSentinelOldOpa,
    setWaterBodiesOpacity,
    toggleWaterBodies,
    toggleWaterMonitoring,
    updateWaterMonitoringOpa,
    waterBodiesOpacity,
    waterBodiesVisible,
    waterMonitoringLayers,
    peatlandsOpacity,
    peatlandsVisible,
    protectedAreasOpacity,
    protectedAreasVisible,
  ]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredSections = useMemo(
    () => sections
      .map((section) => ({
        ...section,
        layers: section.layers.filter((layer) => filterLayer(layer, section.title, normalizedQuery, filter)),
      }))
      .filter((section) => section.layers.length > 0),
    [filter, normalizedQuery, sections]
  );

  const allLayers = sections.flatMap((section) => section.layers);
  const filteredCount = filteredSections.reduce((sum, section) => sum + section.layers.length, 0);
  const visibleCount = allLayers.filter((layer) => layer.visible).length;
  const dynamicCount = allLayers.length - 8;
  const hasSearch = normalizedQuery.length > 0 || filter !== 'all';

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" style={{ cursor: 'default' }}>
          <div className="fire-controls__toggle-icon">
            <Layers size={15} className="fire-controls__icon-active" />
          </div>
          <span className="fire-controls__toggle-label">Layer Management</span>
          {visibleCount > 0 && (
            <span className="lm-count-badge">{visibleCount} visible</span>
          )}
        </div>
      </div>

      <div className="fire-controls__content lm-panel">
        <div className="lm-toolbar">
          <label className="lm-search">
            <Search size={13} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search layers"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear layer search"
              >
                <X size={12} />
              </button>
            )}
          </label>

          <div className="lm-filter-tabs" role="group" aria-label="Layer filters">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? 'lm-filter-tabs__item lm-filter-tabs__item--active' : 'lm-filter-tabs__item'}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="lm-summary">
            <span>{filteredCount} shown</span>
            <span>{allLayers.length} total</span>
          </div>
        </div>

        {filteredSections.map((section) => (
          <div key={section.id} className="lm-section">
            <SectionTitle title={section.title} count={section.layers.length} />
            {section.layers.map((layer) => (
              <LayerRow key={layer.id} layer={layer} />
            ))}
          </div>
        ))}

        {filteredSections.length === 0 && (
          <div className="lm-empty">
            No layers match the current search.
            <br />Try a layer name, provider, or type.
          </div>
        )}

        {!hasSearch && dynamicCount <= 0 && (
          <div className="lm-empty">
            No dynamic layers added yet.
            <br />Use the other tabs to add land cover,
            <br />fire analysis, or satellite imagery.
          </div>
        )}
      </div>
    </div>
  );
};

export default LayersPanel;
