import { useEffect, useRef } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Icon } from 'ol/style';
import styles from './MapComponent.module.scss';

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const almatyCoords = [76.9286, 43.2220];
    
    // marker feature
    const marker = new Feature({
      geometry: new Point(fromLonLat(almatyCoords)),
      name: 'Ионосфера'
    });

    marker.setStyle(new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: 'https://openlayers.org/en/latest/examples/data/icon.png',
        scale: 0.7
      })
    }));

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [marker]
      })
    });

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        center: fromLonLat(almatyCoords),
        zoom: 13,
        minZoom: 3,
        maxZoom: 18
      }),
      controls: []
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(null);
      }
    };
  }, []);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapRef} className={styles.map} />
    </div>
  );
};

export default MapComponent;