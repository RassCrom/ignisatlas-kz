import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import Section from "../../components/Section";
import { useReportI18n } from "../../reportI18n";
import styles from "./FireMap.module.scss";

const MIN_YEAR = 2001;
const MAX_YEAR = 2024;

const SENSOR_OPTIONS = [
  { value: "all",   label: "MODIS + VIIRS" },
  { value: "MODIS", label: "MODIS" },
  { value: "VIIRS", label: "VIIRS" },
];

const buildFilter = (yearRange, confidence, sensor) => {
  const filters = ["all"];

  filters.push([">=", ["to-number", ["slice", ["get", "acq_date"], 0, 4]], yearRange[0]]);
  filters.push(["<=", ["to-number", ["slice", ["get", "acq_date"], 0, 4]], yearRange[1]]);

  if (confidence !== "all") {
    filters.push(["==", ["get", "confidence"], confidence]);
  }
  if (sensor !== "all") {
    filters.push(["==", ["get", "instrument"], sensor]);
  }

  return filters;
};

let pmtilesRegistered = false;

const FireMap = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const { text } = useReportI18n();
  const [yearRange, setYearRange] = useState([MIN_YEAR, MAX_YEAR]);
  const [confidence, setConfidence] = useState("all");
  const [sensor, setSensor] = useState("all");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    if (!pmtilesRegistered) {
      const protocol = new Protocol();
      maplibregl.addProtocol('pmtiles', protocol.tile);
      pmtilesRegistered = true;
    }

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          "basemap": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "basemap",
            type: "raster",
            source: "basemap",
            paint: { "raster-brightness-min": 0, "raster-brightness-max": 0.3, "raster-saturation": -0.8 },
          },
        ],
      },
      center: [66.9, 48.0],
      zoom: 4,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("firms", {
        type: "vector",
        url: "pmtiles:///firms-01-24.pmtiles",
      });

      map.addLayer({
        id: "fires-heat",
        type: "heatmap",
        source: "firms",
        "source-layer": "firms",
        maxzoom: 9,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "bright_t31"], 200, 0, 400, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(232,64,37,0)",
            0.2, "rgba(232,64,37,0.4)",
            0.5, "rgba(255,140,66,0.7)",
            0.8, "rgba(255,200,50,0.85)",
            1, "rgba(255,255,180,1)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
        },
      });

      map.addLayer({
        id: "fires-point",
        type: "circle",
        source: "firms",
        "source-layer": "firms",
        minzoom: 7,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 2, 12, 5],
          "circle-color": [
            "match", ["get", "confidence"],
            "high",   "#ff4400",
            "medium", "#ff8c00",
            "low",    "#ffcc44",
            "#ff4400",
          ],
          "circle-opacity": 0.8,
          "circle-stroke-width": 0.5,
          "circle-stroke-color": "rgba(255,255,255,0.3)",
        },
      });

      setIsLoaded(true);
    });

    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isLoaded) return;

    const filter = buildFilter(yearRange, confidence, sensor);
    if (map.getLayer("fires-heat")) map.setFilter("fires-heat", filter);
    if (map.getLayer("fires-point")) map.setFilter("fires-point", filter);
  }, [yearRange, confidence, sensor, isLoaded]);

  return (
    <Section id="firemap" className={styles.wrapper}>
      <h2 className={styles.title}>{text.fireMap.title}</h2>
      <p className={styles.subtitle}>{text.fireMap.subtitle}</p>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>{text.common.period}</label>
          <div className={styles.yearRow}>
            <span className={styles.yearVal}>{yearRange[0]}</span>
            <div className={styles.sliderTrack}>
              <input
                type="range"
                className={styles.slider}
                min={MIN_YEAR}
                max={MAX_YEAR}
                value={yearRange[0]}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setYearRange(([, end]) => [Math.min(v, end - 1), end]);
                }}
              />
              <input
                type="range"
                className={styles.slider}
                min={MIN_YEAR}
                max={MAX_YEAR}
                value={yearRange[1]}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setYearRange(([start]) => [start, Math.max(v, start + 1)]);
                }}
              />
            </div>
            <span className={styles.yearVal}>{yearRange[1]}</span>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>{text.common.confidence}</label>
          <div className={styles.pills}>
            {[
              { value: "all", label: text.common.allLevels },
              { value: "high", label: text.common.high },
              { value: "medium", label: text.common.medium },
              { value: "low", label: text.common.low },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.pill} ${confidence === opt.value ? styles.pillActive : ""}`}
                onClick={() => setConfidence(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>{text.common.sensor}</label>
          <div className={styles.pills}>
            {SENSOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.pill} ${sensor === opt.value ? styles.pillActive : ""}`}
                onClick={() => setSensor(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.mapWrap}>
        <div ref={mapRef} className={styles.map} />

        <div className={styles.legend}>
          <div className={styles.legendTitle}>{text.fireMap.densityPoints}</div>
          <div className={styles.legendBar} />
          <div className={styles.legendLabels}>
            <span>{text.common.low}</span>
            <span>{text.common.high}</span>
          </div>
        </div>

        {!isLoaded && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>{text.common.loadingFireData}</span>
          </div>
        )}
      </div>

      <p className={styles.note}>
        {text.fireMap.note} <code>firms-01-24.pmtiles</code> (PMTiles v3, {text.fireMap.vector}).
      </p>
    </Section>
  );
};

export default FireMap;
