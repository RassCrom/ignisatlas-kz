import { useState, useEffect, useRef, useCallback } from 'react';
import { Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import useAnalysisStore from 'src/app/store/analysisStore';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'feature_info';

const FeatureCard = ({ layerId, props }) => {
  const [open, setOpen] = useState(true);
  const entries = Object.entries(props).slice(0, 20);

  return (
    <div style={{
      background: 'rgba(9,10,36,0.4)',
      border: '1px solid rgba(136,139,224,0.14)',
      borderRadius: '0.35rem',
      overflow: 'hidden',
    }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.35rem 0.5rem',
          cursor: 'pointer',
          background: 'rgba(136,139,224,0.06)',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'rgba(136,139,224,0.85)',
        }}
      >
        <span>{layerId}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </div>

      {open && (
        <div style={{ padding: '0.3rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          {entries.map(([k, v]) => (
            <div key={k} className={styles.resultRow} style={{ fontSize: '0.65rem' }}>
              <span style={{ color: 'rgba(217,218,245,0.45)' }}>{k}</span>
              <span style={{ maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all' }}>
                {String(v).slice(0, 80)}
              </span>
            </div>
          ))}
          {Object.keys(props).length > 20 && (
            <p style={{ fontSize: '0.62rem', color: 'rgba(217,218,245,0.25)', margin: '0.15rem 0 0' }}>
              +{Object.keys(props).length - 20} атрибутов скрыто
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const FeatureInfoTool = () => {
  const [isActive, setIsActive] = useState(false);
  const [features, setFeatures] = useState(null); // null = not queried yet

  const listenerKeyRef = useRef(null);

  const { activeToolId, setActiveTool } = useAnalysisStore();
  const blocked = activeToolId !== null && activeToolId !== TOOL_ID;

  const handleClick = useCallback((e) => {
    const map = window.mapInstance;
    if (!map) return;

    const found = [];
    map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      const props = feature.getProperties();
      const cleaned = Object.fromEntries(
        Object.entries(props).filter(([k]) => k !== 'geometry')
      );
      if (Object.keys(cleaned).length > 0) {
        found.push({ layerId: layer?.get('id') ?? 'unknown', props: cleaned });
      }
    }, { hitTolerance: 8 });

    setFeatures(found);
  }, []);

  const activate = useCallback(() => {
    const map = window.mapInstance;
    if (!map || blocked) return;

    setActiveTool(TOOL_ID);
    setIsActive(true);
    setFeatures(null);

    map.getTargetElement().style.cursor = 'help';
    listenerKeyRef.current = handleClick;
    map.on('singleclick', handleClick);
  }, [blocked, setActiveTool, handleClick]);

  const deactivate = useCallback(() => {
    const map = window.mapInstance;
    if (map && listenerKeyRef.current) {
      map.un('singleclick', listenerKeyRef.current);
      listenerKeyRef.current = null;
      map.getTargetElement().style.cursor = '';
    }
    setIsActive(false);
    setActiveTool(null);
  }, [setActiveTool]);

  useEffect(() => {
    return () => {
      const map = window.mapInstance;
      if (map && listenerKeyRef.current) {
        map.un('singleclick', listenerKeyRef.current);
        map.getTargetElement().style.cursor = '';
      }
    };
  }, []);

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Кликните на объект карты, чтобы просмотреть его атрибуты.
      </p>

      {isActive ? (
        <button className={styles.cancelBtn} onClick={deactivate}>
          <X size={13} /> Деактивировать
        </button>
      ) : (
        <button className={styles.activateBtn} onClick={activate} disabled={blocked}>
          <Info size={13} /> Активировать
        </button>
      )}

      {features !== null && (
        features.length === 0 ? (
          <p className={baseStyles.toolDesc} style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            Объекты не найдены
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span className={styles.sectionLabel}>{features.length} объект(ов)</span>
            {features.map((f, i) => (
              <FeatureCard key={i} layerId={f.layerId} props={f.props} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default FeatureInfoTool;
