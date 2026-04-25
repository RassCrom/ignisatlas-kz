export const newDD = [
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
            "id": "lulc_pc",
            "label": "ESRI Sentinel-2 Land Cover (10m)",
            "description": "Ежегодная карта LULC (2017–2023) с 9 классами на основе Sentinel-2, 10 м разрешение. Источник: Planetary Computer."
          },
          {
            "id": "lulc",
            "label": "ESRI Land Cover (устаревший)",
            "description": "Глобальная карта от ArcGIS ImageServer. Нефильтрованный слой без выбора года."
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
          },
          {
            "id": "lst_explorer",
            "label": "Температура поверхности (LST)",
            "description": "Температура поверхности земли (MODIS 11A1/11A2 и Landsat 8/9) через Planetary Computer. Дневные/ночные снимки в °C."
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
        "label_ru": "Sentinel mission",
        "isExpanded": true,
        "options": [
          {
            "id": "sentinel_explorer",
            "label": "Sentinel Explorer",
            "description": "Единая панель поиска и визуализации спутниковых данных Sentinel-1, -2, -3 и -5P. Поиск по области, дате и облачности."
          }
        ]
      },
      {
        "id": "landsat_archive",
        "label_ru": "Landsat mission",
        "isExpanded": false,
        "options": [
          {
            "id": "landsat_explorer",
            "label": "Landsat Explorer",
            "description": "Unified search and visualization of Landsat 4, 5, 7, 8, 9 imagery via Microsoft Planetary Computer STAC API."
          }
        ]
      },
      {
        "id": "modis_archive",
        "label_ru": "MODIS mission",
        "isExpanded": false,
        "options": [
          {
            "id": "modis_explorer",
            "label": "MODIS Explorer",
            "description": "Unified search and visualization of MODIS Daily Fire Anomalies and Surface Reflectance imagery via Microsoft Planetary Computer STAC API."
          }
        ]
      },
      {
        "id": "atmosphere_archive",
        "label_ru": "Atmosphere & Emissions",
        "isExpanded": false,
        "options": [
          {
            "id": "atmosphere_explorer",
            "label": "Atmosphere Explorer",
            "description": "Global search and analysis of atmospheric composition (CH₄, CO, NO₂, aerosols) via Sentinel-5P on Microsoft Planetary Computer."
          }
        ]
      }
    ]
  },
  {
    "id": 4,
    "key": "tools",
    "items": [
      {
        "id": "bookmarks_manager",
        "label_ru": "Пространственные закладки",
        "isExpanded": true,
        "options": [
          {
            "id": "spatial_bookmark_tool",
            "label": "Менеджер закладок",
            "description": "Сохранение и управление позициями на карте для быстрого возврата."
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
    id: 7,
    key: 'layers_panel',
    items: [
      {
        id: 'layers_panel_item',
        label_ru: 'Управление слоями',
        isExpanded: true,
        options: [
          { id: 'layers_panel', label: 'Layer Management' }
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