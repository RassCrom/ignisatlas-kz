export const newDD = [
  {
    id: 0,
    key: 'methane',
    items: [
      {
        id: 'methane_main',
        label_ru: 'Area Flux Mappers',
        options: [
          {
            id: 'sp',
            label: 'Super Emitters 2019',
          },
        ]
      },
      {
        id: 'methane_instances',
        label_ru: 'Point source imagers',
        options: [
          {
            id: 'sp_sn2',
            label: 'Super Emitters 2019',
          },
          {
            id: 'sp_instances',
            label: 'Super Emitters 2019',
          },
        ]
      }
    ]
  },
  {
    "id": 1,
    "key": "add_layers",
    "items": [
      {
        "id": "admin_boundaries",
        "label_ru": "Админстративные границы",
        "options": [
          {
            "id": "country_boundaries",
            "label": "Границы Казахстана",
            "description": "Полигональный слой, показывающий официальные государственные границы Республики Казахстан."
          },
          {
            "id": "region_boundaries",
            "label": "Области Казахстана",
            "description": "Административные границы всех областей и городов республиканского значения Казахстана."
          },
          {
            "id": "district_boundaries",
            "label": "Районы Казахстана",
            "description": "Детализированные границы районов внутри областей и городов Казахстана."
          }
        ]
      },
      {
        "id": "land_cover",
        "label_ru": "Землепользование",
        "options": [
          {
            "id": "lulc",
            "label": "ESRI Sentinel-2 Land Cover (10m)",
            "description": "Глобальная карта использования и покрытия земель на основе данных Sentinel-2 с разрешением 10 м (ESRI / Impact Observatory). 9 классов покрытия."
          }
        ]
      },
      {
        "id": "settlements",
        "label_ru": "Населённые пункты",
        "options": [
          {
            "id": "settlements_layer",
            "label": "Населённые пункты Казахстана",
            "description": "Точечный слой населённых пунктов Казахстана: столица, города, посёлки, сёла и пригороды. Источник: OpenStreetMap."
          }
        ]
      },
      {
        "id": "kchs_objects",
        "label_ru": "Объекты КЧС",
        "options": [
          {
            "id": "fire_departments",
            "label": "Пожарные части",
            "layerType": "Point",
            "description": "Места расположения пожарных частей, обеспечивающих тушение пожаров и реагирование на ЧС."
          },
          {
            "id": "hospitals",
            "label": "Больницы",
            "layerType": "Point",
            "description": "Медицинские учреждения, оказывающие помощь пострадавшим при чрезвычайных ситуациях."
          },
          {
            "id": "fire_hydrants",
            "label": "Пожарные гидранты",
            "layerType": "Point",
            "description": "Точки с расположением пожарных гидрантов, используемых для забора воды при тушении пожаров."
          },
          {
            "id": "ava_ss",
            "label": "Аварийно-спасательная служба",
            "layerType": "Point",
            "description": "Подразделения аварийно-спасательных служб, готовых к ликвидации последствий ЧС."
          },
          {
            "id": "kaz_avia",
            "label": "КазАвиаСпас",
            "layerType": "Point",
            "description": "Базы и объекты авиационного подразделения МЧС Казахстана, применяемого для спасательных операций."
          },
          {
            "id": "oso",
            "label": "Объекты ОСО",
            "layerType": "Point",
            "description": "Объекты особого социального обслуживания (например, детские дома, интернаты), требующие приоритетной защиты при ЧС."
          },
          {
            "id": "ps",
            "label": "Пункты сбора",
            "layerType": "Point",
            "description": "Официально определённые места сбора населения при эвакуации в чрезвычайных ситуациях."
          },
          {
            "id": "fire_trains",
            "label": "Пожарные поезда",
            "layerType": "Point",
            "description": "Места дислокации пожарных поездов, применяемых для тушения пожаров на железной дороге и промышленных объектах."
          }
        ]
      }
    ]
  },
  {
    "id": 2,
    "key": "fire",
    "items": [
      {
        "id": "fire",
        "label_ru": "Мониторинг пожаров",
        "isExpanded": true,
        "options": [
          {
            "id": "fire_pinpoints",
            "label": "Горячие точки",
            "description": "Актуальные данные о местах возможных возгораний, зафиксированных спутниковыми системами (hotspots)."
          },
          {
            "id": "fire_risk",
            "label": "Карта пожароопасности",
            "description": "Прогнозная карта, отображающая уровень пожарной опасности на территории Казахстана."
          },
          {
            "id": "fire_modelling",
            "label": "Карта моделирования пожаров",
            "description": "Результаты математического моделирования распространения пожаров с учётом погодных условий и ландшафта."
          }
        ]
      }
    ]
  },
  {
    "id": 3,
    "key": "satellites",
    "items": [
      {
        "id": "satellite",
        "label_ru": "Satellite images",
        "isExpanded": true,
        "options": [
          {
            "id": "sentinel2",
            "label": "Sentinel-2",
            "description": "Оптические спутниковые изображения высокого разрешения (10–20 м), используемые для мониторинга растительности, пожаров и землепользования."
          },
          {
            "id": "sentinel3",
            "label": "Sentinel-3",
            "description": "Спутниковые данные среднего разрешения для мониторинга атмосферы, температуры поверхности и водных объектов."
          },
          {
            "id": "sentinel5",
            "label": "Sentinel-5",
            "description": "Данные для наблюдения за качеством воздуха и атмосферными газами (озон, CO₂, NO₂)."
          },
          {
            "id": "sentinel1",
            "label": "Sentinel-1",
            "description": "Радарные спутниковые данные (SAR), позволяющие наблюдать землю и объекты в любых погодных условиях, днём и ночью."
          }
        ]
      },
      {
        "id": "landsat_archive",
        "label_ru": "Landsat Archive (HLS L30)",
        "isExpanded": false,
        "options": [
          {
            "id": "hls_landsat",
            "label": "HLS L30 (Harmonized Landsat)",
            "description": "Поиск архивных снимков Landsat 8/9 (30 м) через STAC API NASA LP DAAC и Planetary Computer. Ограничено территорией Казахстана."
          }
        ]
      }
    ]
  },

  {
    id: 5,
    key: 'feedback',
    header_ru: 'Обратная связь',
    items: [
      {
        id: 'bug_report',
        label_ru: 'Сообщить об ошибке',
        isExpanded: false,
        options: [
          {
            id: 'report_bug',
            label: 'Форма ошибки',
            action: 'reportBug',
            icon: 'alert-triangle',
            isActive: false,
            url: null,
          }
        ]
      },
      {
        id: 'suggestion',
        label_ru: 'Предложение',
        isExpanded: false,
        options: [
          {
            id: 'suggest_feature',
            label: 'Предложить улучшение',
            action: 'suggestFeature',
            icon: 'message-circle',
            isActive: false,
            url: null,
          }
        ]
      }
    ]
  },
  {
    id: 6,
    key: 'learning',
    header_ru: 'Обучение',
    items: [
      {
        id: 'tutorial',
        label_ru: 'Руководство',
        isExpanded: false,
        options: [
          {
            id: 'start_tutorial',
            label: 'Пошаговое обучение',
            action: 'startTutorial',
            icon: 'book-open',
            isActive: false,
            url: null,
          }
        ]
      },
      {
        id: 'videos',
        label_ru: 'Видеоуроки',
        isExpanded: false,
        options: [
          {
            id: 'video_tips',
            label: 'Смотри видео',
            action: 'showVideoGuide',
            icon: 'video',
            isActive: false,
            url: null,
          }
        ]
      }
    ]
  }
];