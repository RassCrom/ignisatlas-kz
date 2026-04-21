import { create } from 'zustand';

export const useLayersStore = create(set => ({
  layers: [
    {
      "id": 'ava_ss',
      "geojsonFile": "Avariino_spasatelnaya_sluzhba.geojson",
      "layerName": "Аварийно-спасательная служба",
      "visible": false,
      "style": "rescueStyle"
    },
    {
      "id": 'fire_departments',
      "geojsonFile": "fireDep.geojson",
      "layerName": "Пожарные части",
      "visible": false,
      "style": "fireDepStyle"
    },
    {
      "id": 'fire_hydrants',
      "geojsonFile": "Gidranty_KZ.geojson",
      "layerName": "Гидранты",
      "visible": false,
      "style": "hydrantStyle"
    },
    {
      "id": 'hospitals',
      "geojsonFile": "HealthFacilities.geojson",
      "layerName": "Медицинские учреждения",
      "visible": false,
      "style": "healthStyle"
    },
    {
      "id": 'kaz_avia',
      "geojsonFile": "KazAviaSpas.geojson",
      "layerName": "КазАвиаСпас",
      "visible": false,
      "style": "aviaStyle"
    },
    {
      "id": 'oso',
      "geojsonFile": "OSO_1.geojson",
      "layerName": "Объекты ОСО",
      "visible": false,
      "style": "osoStyle"
    },
    {
      "id": 'ps',
      "geojsonFile": "Point_sobora.geojson",
      "layerName": "Пункты сбора",
      "visible": false,
      "style": "pointSoboraStyle"
    },
    {
      "id": 'fire_trains',
      "geojsonFile": "Poj_poezda.geojson",
      "layerName": "Пожарные поезда",
      "visible": false,
      "style": "trainFireStyle"
    }
  ],
  updateLayer: (id, updates) =>
    set(state => ({
      layers: state.layers.map(l =>
        l.id === id ? { ...l, ...updates } : l
      )
    })),

  changeVisibility: (id) =>
    set(state => ({
      layers: state.layers.map(l =>
        l.id === id ? { ...l, visible: !l.visible } : l
      )
    }))
}));
