import { useCallback } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';

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
import useModisExplorerStore from 'src/app/store/modisExplorerStore';
import useAtmosphereStore from 'src/app/store/atmosphereStore';
import useLstStore from 'src/app/store/lstStore';

import './FireControls/fireControls.scss';
import './LayersPanel.scss';

// Find an OL layer by its id metadata and apply visibility / opacity changes.
// Used only for explorer tile layers that have no reactive MapView hook.
function syncOlLayer(id, visible, opacity01) {
  if (!window.mapInstance) return;
  const ol = window.mapInstance.getLayers().getArray().find((l) => l.get('id') === id);
  if (!ol) return;
  if (visible !== undefined) ol.setVisible(visible);
  if (opacity01 !== undefined) ol.setOpacity(opacity01);
}

// ─── Shared row ─────────────────────────────────────────────────────────────
function LayerRow({ name, type, provider, visible, opacity01, onToggle, onOpacity, featureCount }) {
  const pct = Math.round((opacity01 ?? 1) * 100);
  return (
    <div className="lm-row">
      <div className="lm-row__top">
        <button
          className={`lm-row__eye${visible ? ' lm-row__eye--on' : ''}`}
          onClick={onToggle}
          title={visible ? 'Hide layer' : 'Show layer'}
        >
          {visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <span className="lm-row__name" title={name}>{name}</span>
        <span className={`lm-badge lm-badge--${type}`}>{type}</span>
      </div>
      <div className="lm-row__bottom">
        <span className="lm-row__provider">{provider}</span>
        {featureCount != null && (
          <span className="lm-row__count">{featureCount.toLocaleString()} features</span>
        )}
        <div className="lm-row__opacity-wrap">
          <input
            type="range"
            min="0"
            max="100"
            value={pct}
            onChange={(e) => onOpacity(Number(e.target.value) / 100)}
            className="lm-slider"
          />
          <span className="lm-row__opacity-val">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div className="lm-section__title">{children}</div>;
}

// ─── Panel ──────────────────────────────────────────────────────────────────
const LayersPanel = () => {
  // Admin boundaries (opacity 0–1)
  const adminVis = useAdminBoundaryStore((s) => s.layerVisibility);
  const adminOpa = useAdminBoundaryStore((s) => s.layerOpacity);
  const changeFirst = useAdminBoundaryStore((s) => s.changeFirst);
  const changeSecond = useAdminBoundaryStore((s) => s.changeSecond);
  const changeThird = useAdminBoundaryStore((s) => s.changeThird);
  const changeAdminOpacity = useAdminBoundaryStore((s) => s.changeOpacity);

  // Emergency / KCHS vector layers (no opacity in store — synced directly to OL)
  const kchsLayers = useLayersStore((s) => s.layers);
  const updateKchs = useLayersStore((s) => s.updateLayer);
  const changeKchsVis = useLayersStore((s) => s.changeVisibility);

  // Settlements (opacity 0–1)
  const settVisible = useSettlementsStore((s) => s.visible);
  const settOpacity = useSettlementsStore((s) => s.opacity);
  const toggleSett = useSettlementsStore((s) => s.toggleVisible);
  const setSettOpacity = useSettlementsStore((s) => s.setOpacity);

  // Fire hotspots (opacity 0–100)
  const fireVisible = useFireStore((s) => s.fireLayerVisible);
  const fireOpacity = useFireStore((s) => s.fireOpacity);
  const setFireVisible = useFireStore((s) => s.setFireLayerVisible);
  const setFireOpacity = useFireStore((s) => s.setFireOpacity);
  const fireLength = useFireStore((s) => s.fireLength);

  // LULC Planetary Computer (opacity 0–1)
  const lulcPcAdded = useLulcPcStore((s) => s.isAdded);
  const lulcPcVisible = useLulcPcStore((s) => s.visible);
  const lulcPcOpacity = useLulcPcStore((s) => s.opacity);
  const lulcPcYear = useLulcPcStore((s) => s.year);
  const toggleLulcPc = useLulcPcStore((s) => s.toggleVisible);
  const setLulcPcOpacity = useLulcPcStore((s) => s.setOpacity);

  // LULC legacy (opacity 0–1)
  const lulcAdded = useLulcStore((s) => s.isAdded);
  const lulcVisible = useLulcStore((s) => s.visible);
  const lulcOpacity = useLulcStore((s) => s.opacity);
  const toggleLulc = useLulcStore((s) => s.toggleVisible);
  const setLulcOpacity = useLulcStore((s) => s.setOpacity);

  // Risk map (opacity 0–1)
  const riskDates = useRiskMapStore((s) => s.riskDates);
  const updateRiskVis = useRiskMapStore((s) => s.updateDateVisibility);
  const updateRiskOpa = useRiskMapStore((s) => s.updateDateOpacity);

  // Fire modelling (opacity 0–1, OL layer instance stored in fm.layer)
  const fmLayers = useFireModellingStore((s) => s.fireModellingLayers);
  const updateFm = useFireModellingStore((s) => s.updateFireModellingLayer);

  // Explorer stores — activeLayers[].opacity is 0–100 int
  const landsatLayers = useLandsatExplorerStore((s) => s.activeLayers);
  const toggleLandsat = useLandsatExplorerStore((s) => s.toggleLayerVisibility);
  const updateLandsatOpa = useLandsatExplorerStore((s) => s.updateLayerOpacity);

  const sentinelLayers = useSentinelExplorerStore((s) => s.activeLayers);
  const toggleSentinel = useSentinelExplorerStore((s) => s.toggleLayerVisibility);
  const updateSentinelOpa = useSentinelExplorerStore((s) => s.updateLayerOpacity);

  const modisLayers = useModisExplorerStore((s) => s.activeLayers);
  const toggleModis = useModisExplorerStore((s) => s.toggleLayerVisibility);
  const updateModisOpa = useModisExplorerStore((s) => s.updateLayerOpacity);

  const atmosphereLayers = useAtmosphereStore((s) => s.activeLayers);
  const toggleAtmosphere = useAtmosphereStore((s) => s.toggleLayerVisibility);
  const updateAtmosphereOpa = useAtmosphereStore((s) => s.updateLayerOpacity);

  const lstLayers = useLstStore((s) => s.activeLayers);
  const toggleLst = useLstStore((s) => s.toggleLayerVisibility);
  const updateLstOpa = useLstStore((s) => s.updateLayerOpacity);

  // Build handlers for a single explorer tile layer (needs store + direct OL sync)
  const makeExplorerHandlers = useCallback((layer, toggleFn, updateOpaFn) => ({
    onToggle: () => {
      const next = !layer.visible;
      toggleFn(layer.id);
      syncOlLayer(layer.id, next, undefined);
    },
    onOpacity: (v01) => {
      updateOpaFn(layer.id, Math.round(v01 * 100));
      syncOlLayer(layer.id, undefined, v01);
    },
  }), []);

  // Active layer count for the header badge
  const totalVisible =
    Object.values(adminVis).filter(Boolean).length +
    kchsLayers.filter((l) => l.visible).length +
    (settVisible ? 1 : 0) +
    (fireVisible ? 1 : 0) +
    (lulcPcAdded && lulcPcVisible ? 1 : 0) +
    (lulcAdded && lulcVisible ? 1 : 0) +
    riskDates.filter((r) => r.isVisible).length +
    Object.values(fmLayers).filter((l) => l.visible ?? true).length +
    [landsatLayers, sentinelLayers, modisLayers, atmosphereLayers, lstLayers]
      .reduce((sum, arr) => sum + arr.filter((l) => l.visible).length, 0);

  const hasDynamicLayers =
    lulcPcAdded || lulcAdded ||
    riskDates.length > 0 ||
    Object.keys(fmLayers).length > 0 ||
    landsatLayers.length > 0 || sentinelLayers.length > 0 ||
    modisLayers.length > 0 || atmosphereLayers.length > 0 || lstLayers.length > 0;

  const hasExplorerLayers =
    landsatLayers.length > 0 || sentinelLayers.length > 0 ||
    modisLayers.length > 0 || atmosphereLayers.length > 0 || lstLayers.length > 0;

  const fmt = (iso) => (iso ? iso.slice(0, 10) : '—');

  return (
    <div className="fire-controls">
      {/* Header */}
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" style={{ cursor: 'default' }}>
          <div className="fire-controls__toggle-icon">
            <Layers size={15} className="fire-controls__icon-active" />
          </div>
          <span className="fire-controls__toggle-label">Layer Management</span>
          {totalVisible > 0 && (
            <span className="lm-count-badge">{totalVisible} visible</span>
          )}
        </div>
      </div>

      <div className="fire-controls__content" style={{ paddingTop: 6 }}>

        {/* ── Base layers ─────────────────────────────────────── */}
        <div className="lm-section">
          <SectionTitle>Base Layers</SectionTitle>

          <LayerRow
            name="Fire Hotspots"
            type="vector"
            provider="NASA FIRMS / API"
            visible={fireVisible}
            opacity01={fireOpacity / 100}
            onToggle={setFireVisible}
            onOpacity={(v01) => setFireOpacity(Math.round(v01 * 100))}
            featureCount={fireLength > 0 ? fireLength : null}
          />

          {[
            { key: 'country_boundaries',  label: 'Kazakhstan Boundary', toggle: changeFirst },
            { key: 'region_boundaries',   label: 'Regions',             toggle: changeSecond },
            { key: 'district_boundaries', label: 'Districts',           toggle: changeThird },
          ].map(({ key, label, toggle }) => (
            <LayerRow
              key={key}
              name={label}
              type="vector"
              provider="OpenStreetMap / Local"
              visible={adminVis[key] ?? false}
              opacity01={adminOpa[key] ?? 1}
              onToggle={toggle}
              onOpacity={(v01) => changeAdminOpacity(key, v01)}
            />
          ))}

          <LayerRow
            name="Settlements"
            type="vector"
            provider="OpenStreetMap"
            visible={settVisible}
            opacity01={settOpacity}
            onToggle={toggleSett}
            onOpacity={setSettOpacity}
          />
        </div>

        {/* ── Emergency / KCHS ─────────────────────────────────── */}
        <div className="lm-section">
          <SectionTitle>Emergency Objects</SectionTitle>
          {kchsLayers.map((layer) => (
            <LayerRow
              key={layer.id}
              name={layer.layerName}
              type="vector"
              provider="Local GeoJSON"
              visible={layer.visible}
              opacity01={layer.opacity ?? 1}
              onToggle={() => changeKchsVis(layer.id)}
              onOpacity={(v01) => {
                updateKchs(layer.id, { opacity: v01 });
                syncOlLayer(layer.id, undefined, v01);
              }}
            />
          ))}
        </div>

        {/* ── Land cover (only if a layer is added) ─────────────── */}
        {(lulcPcAdded || lulcAdded) && (
          <div className="lm-section">
            <SectionTitle>Land Cover</SectionTitle>
            {lulcPcAdded && (
              <LayerRow
                name={`ESRI LULC 10m — ${lulcPcYear}`}
                type="raster"
                provider="Planetary Computer / Sentinel-2"
                visible={lulcPcVisible}
                opacity01={lulcPcOpacity}
                onToggle={toggleLulcPc}
                onOpacity={setLulcPcOpacity}
              />
            )}
            {lulcAdded && (
              <LayerRow
                name="ESRI Land Cover (legacy)"
                type="raster"
                provider="ArcGIS ImageServer"
                visible={lulcVisible}
                opacity01={lulcOpacity}
                onToggle={toggleLulc}
                onOpacity={setLulcOpacity}
              />
            )}
          </div>
        )}

        {/* ── Fire analysis (only if active) ───────────────────── */}
        {(riskDates.length > 0 || Object.keys(fmLayers).length > 0) && (
          <div className="lm-section">
            <SectionTitle>Fire Analysis</SectionTitle>
            {riskDates.map((r) => (
              <LayerRow
                key={r.id}
                name={`Fire Risk — ${r.date}`}
                type="raster"
                provider="Local / API"
                visible={r.isVisible}
                opacity01={r.opacity ?? 1}
                onToggle={() => updateRiskVis(r.id, !r.isVisible)}
                onOpacity={(v01) => updateRiskOpa(r.id, v01)}
              />
            ))}
            {Object.values(fmLayers).map((fm) => (
              <LayerRow
                key={fm.id}
                name={`Fire Model — ${fmt(fm.addedAt)}`}
                type="raster"
                provider="Local / API"
                visible={fm.visible ?? true}
                opacity01={fm.opacity ?? 1}
                onToggle={() => {
                  const next = !(fm.visible ?? true);
                  updateFm(fm.id, { visible: next });
                  if (fm.layer) fm.layer.setVisible(next);
                }}
                onOpacity={(v01) => {
                  updateFm(fm.id, { opacity: v01 });
                  if (fm.layer) fm.layer.setOpacity(v01);
                }}
              />
            ))}
          </div>
        )}

        {/* ── Explorer tile layers (only if any active) ─────────── */}
        {hasExplorerLayers && (
          <div className="lm-section">
            <SectionTitle>Satellite Imagery</SectionTitle>

            {landsatLayers.map((layer) => {
              const { onToggle, onOpacity } = makeExplorerHandlers(layer, toggleLandsat, updateLandsatOpa);
              return (
                <LayerRow
                  key={layer.id}
                  name={`Landsat — ${fmt(layer.acquisitionDate)}`}
                  type="raster"
                  provider="Planetary Computer"
                  visible={layer.visible}
                  opacity01={(layer.opacity ?? 80) / 100}
                  onToggle={onToggle}
                  onOpacity={onOpacity}
                />
              );
            })}

            {sentinelLayers.map((layer) => {
              const { onToggle, onOpacity } = makeExplorerHandlers(layer, toggleSentinel, updateSentinelOpa);
              return (
                <LayerRow
                  key={layer.id}
                  name={`Sentinel — ${fmt(layer.acquisitionDate)}`}
                  type="raster"
                  provider="Planetary Computer"
                  visible={layer.visible}
                  opacity01={(layer.opacity ?? 80) / 100}
                  onToggle={onToggle}
                  onOpacity={onOpacity}
                />
              );
            })}

            {modisLayers.map((layer) => {
              const { onToggle, onOpacity } = makeExplorerHandlers(layer, toggleModis, updateModisOpa);
              return (
                <LayerRow
                  key={layer.id}
                  name={`MODIS — ${fmt(layer.acquisitionDate)}`}
                  type="raster"
                  provider="Planetary Computer"
                  visible={layer.visible}
                  opacity01={(layer.opacity ?? 80) / 100}
                  onToggle={onToggle}
                  onOpacity={onOpacity}
                />
              );
            })}

            {atmosphereLayers.map((layer) => {
              const { onToggle, onOpacity } = makeExplorerHandlers(layer, toggleAtmosphere, updateAtmosphereOpa);
              return (
                <LayerRow
                  key={layer.id}
                  name={`Atmosphere — ${fmt(layer.acquisitionDate)}`}
                  type="raster"
                  provider="Planetary Computer / Sentinel-5P"
                  visible={layer.visible}
                  opacity01={(layer.opacity ?? 80) / 100}
                  onToggle={onToggle}
                  onOpacity={onOpacity}
                />
              );
            })}

            {lstLayers.map((layer) => {
              const { onToggle, onOpacity } = makeExplorerHandlers(layer, toggleLst, updateLstOpa);
              const provider = layer.collection === 'landsat-c2-l2'
                ? 'Planetary Computer / Landsat'
                : 'Planetary Computer / MODIS';
              return (
                <LayerRow
                  key={layer.id}
                  name={`LST — ${fmt(layer.acquisitionDate)}`}
                  type="raster"
                  provider={provider}
                  visible={layer.visible}
                  opacity01={(layer.opacity ?? 80) / 100}
                  onToggle={onToggle}
                  onOpacity={onOpacity}
                />
              );
            })}
          </div>
        )}

        {!hasDynamicLayers && (
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
