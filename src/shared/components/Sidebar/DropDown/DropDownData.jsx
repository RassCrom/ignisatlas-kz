export const newDD = [
  {
    "id": 1,
    "key": "add_layers",
    "items": [
      {
        "id": "admin_boundaries",
        "label_ru": "Административные границы",
        "options": [
          {
            "id": "country_boundaries",
            "label": "Kazakhstan Borders",
            "label_ru": "Границы Казахстана",
            "description": "Полигональный слой, показывающий официальные государственные границы Республики Казахстан.",
            "layerType": "Polygon",
            "source": "OpenStreetMap / КазГеодезия",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["admin", "boundaries", "kazakhstan"],
            "status": "active"
          },
          {
            "id": "region_boundaries",
            "label": "Kazakhstan Regions",
            "label_ru": "Области Казахстана",
            "description": "Административные границы всех областей и городов республиканского значения Казахстана.",
            "layerType": "Polygon",
            "source": "OpenStreetMap / КазГеодезия",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["admin", "regions", "boundaries"],
            "status": "active"
          },
          {
            "id": "district_boundaries",
            "label": "Kazakhstan Districts",
            "label_ru": "Районы Казахстана",
            "description": "Детализированные границы районов внутри областей и городов Казахстана.",
            "layerType": "Polygon",
            "source": "OpenStreetMap",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["admin", "districts", "boundaries"],
            "status": "active"
          },
          {
            "id": "protected_area_boundaries",
            "label": "Kazakhstan Protected Areas",
            "label_ru": "ООПТ РК",
            "description": "Детализированные границы особо охраняемых природных территорий РК.",
            "layerType": "Polygon",
            "source": "UNEP-WCMC and IUCN (2026)",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["admin", "protected areas", "boundaries"],
            "status": "active"
          }
        ]
      },      
      {
        "id": "terrain",
        "label_ru": "Рельеф (слои не готовы)",
        "options": [
          {
            "id": "dem_pc",
            "label": "Copernicus DEM GLO-30",
            "label_ru": "Copernicus DEM GLO-30 (30м)",
            "description": "",
            "layerType": "Raster",
            "source": "ESRI / Microsoft Planetary Computer",
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["dem", "dsm", "TanDEM-X", "Copernicus"],
            "status": "not active"
          },
          {
            "id": "hillshade",
            "label": "Hillshade",
            "label_ru": "Теневая отмывка",
            "description": "Визуализация рельефа методом теневой отмывки для наглядного отображения форм поверхности.",
            "layerType": "Raster",
            "source": "Copernicus DEM GLO-30",
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["terrain", "hillshade", "dem"],
            "status": "not active"
          },
          {
            "id": "slope",
            "label": "Slope",
            "label_ru": "Крутизна склонов",
            "description": "Карта крутизны склонов в градусах, рассчитанная по цифровой модели рельефа.",
            "layerType": "Raster",
            "source": "Copernicus DEM GLO-30",
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["terrain", "slope", "dem"],
            "status": "not active"
          },
          {
            "id": "aspect",
            "label": "Aspect",
            "label_ru": "Экспозиция склонов",
            "description": "Направление склона относительно сторон света — влияет на инсоляцию и риск возгорания.",
            "layerType": "Raster",
            "source": "Copernicus DEM GLO-30",
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["terrain", "aspect", "dem"],
            "status": "not active"
          },
          {
            "id": "elevation_contours",
            "label": "Elevation Contours",
            "label_ru": "Горизонтали",
            "description": "Изолинии высот с заданным интервалом для отображения рельефа на топографических картах.",
            "layerType": "Line",
            "source": "Copernicus DEM GLO-30",
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["terrain", "contours", "elevation"],
            "status": "not active"
          },
          {
            "id": "terrain_roughness",
            "label": "Terrain Roughness",
            "label_ru": "Пересечённость рельефа",
            "description": "Индекс пересечённости рельефа (TRI) — мера изменчивости высот в окрестности каждой точки.",
            "layerType": "Raster",
            "source": "Copernicus DEM GLO-30",
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["terrain", "roughness", "tri"],
            "status": "not active"
          },
          {
            "id": "topographic_position",
            "label": "Topographic Position Index",
            "label_ru": "Положение в рельефе",
            "description": "Индекс топографического положения (TPI) — определяет, находится ли точка на вершине, склоне или в долине.",
            "layerType": "Raster",
            "source": "Copernicus DEM GLO-30",
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["terrain", "tpi", "topography"],
            "status": "not active"
          }
        ]
      },
      {
        "id": "climate",
        "label_ru": "Климатические зоны",
        "options": [
          {
            "id": "climate_zones",
            "label": "Köppen Climate Zones (1976–2000)",
            "label_ru": "Климатические зоны Кёппена (1976–2000)",
            "description": "Климатическая классификация территории Казахстана по схеме Кёппена–Гейгера на основе данных за 1976–2000 гг.",
            "layerType": "Polygon",
            "source": "Köppen–Geiger Climate Classification",
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["climate", "koppen", "zones"],
            "status": "active"
          }
        ]
      },
      {
        "id": "soils",
        "label_ru": "Почвы",
        "options": [
          {
            "id": "peatlands",
            "label": "Peatlands",
            "label_ru": "Торфяники",
            "description": "Слой торфяных почв Казахстана: полигоны с преобладанием торфа (DN=1) и торф в мозаике почв (DN=2). 1 188 полигонов.",
            "layerType": "Polygon",
            "source": "IIASA / GlobCover",
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["soils", "peatlands", "carbon"],
            "status": "active"
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
            "label_ru": "ESRI Sentinel-2 Землепользование (10м)",
            "description": "Ежегодная карта LULC (2017–2023) с 9 классами на основе Sentinel-2, 10 м разрешение. Источник: Planetary Computer.",
            "layerType": "Raster",
            "source": "ESRI / Microsoft Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["lulc", "land-cover", "sentinel-2"],
            "status": "active"
          },
          {
            "id": "lulc",
            "label": "ESRI Land Cover (Legacy)",
            "label_ru": "ESRI Land Cover (устаревший)",
            "description": "Глобальная карта от ArcGIS ImageServer. Нефильтрованный слой без выбора года.",
            "layerType": "Raster",
            "source": "ESRI / ArcGIS",
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["lulc", "land-cover"],
            "status": "deprecated"
          }
        ]
      },
      {
        "id": "settlements",
        "label_ru": "Населённые пункты",
        "options": [
          {
            "id": "settlements_layer",
            "label": "Kazakhstan Settlements",
            "label_ru": "Населённые пункты Казахстана",
            "description": "Точечный слой населённых пунктов Казахстана: столица, города, посёлки, сёла и пригороды. Источник: OpenStreetMap.",
            "layerType": "Point",
            "source": "OpenStreetMap",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["settlements", "population", "cities"],
            "status": "active"
          }
        ]
      },
      {
        "id": "kchs_objects",
        "label_ru": "Объекты КЧС",
        "options": [
          {
            "id": "fire_departments",
            "label": "Fire Departments",
            "label_ru": "Пожарные части",
            "layerType": "Point",
            "description": "Места расположения пожарных частей, обеспечивающих тушение пожаров и реагирование на ЧС.",
            "source": "МЧС Казахстана",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["fire", "emergency", "infrastructure"],
            "status": "active"
          },
          {
            "id": "hospitals",
            "label": "Hospitals",
            "label_ru": "Больницы",
            "layerType": "Point",
            "description": "Медицинские учреждения, оказывающие помощь пострадавшим при чрезвычайных ситуациях.",
            "source": "МЧС / Минздрав",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["health", "emergency", "infrastructure"],
            "status": "active"
          },
          {
            "id": "fire_hydrants",
            "label": "Fire Hydrants",
            "label_ru": "Пожарные гидранты",
            "layerType": "Point",
            "description": "Точки с расположением пожарных гидрантов, используемых для забора воды при тушении пожаров.",
            "source": "МЧС Казахстана",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["fire", "water", "infrastructure"],
            "status": "active"
          },
          {
            "id": "ava_ss",
            "label": "Emergency Rescue Service",
            "label_ru": "Аварийно-спасательная служба",
            "layerType": "Point",
            "description": "Подразделения аварийно-спасательных служб, готовых к ликвидации последствий ЧС.",
            "source": "МЧС Казахстана",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["emergency", "rescue", "infrastructure"],
            "status": "active"
          },
          {
            "id": "kaz_avia",
            "label": "KazAviaSpaS",
            "label_ru": "КазАвиаСпас",
            "layerType": "Point",
            "description": "Базы и объекты авиационного подразделения МЧС Казахстана, применяемого для спасательных операций.",
            "source": "МЧС Казахстана",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["aviation", "emergency", "rescue"],
            "status": "active"
          },
          {
            "id": "oso",
            "label": "OSO Facilities",
            "label_ru": "Объекты ОСО",
            "layerType": "Point",
            "description": "Объекты особого социального обслуживания (например, детские дома, интернаты), требующие приоритетной защиты при ЧС.",
            "source": "МЧС Казахстана",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["social", "emergency", "priority"],
            "status": "active"
          },
          {
            "id": "ps",
            "label": "Assembly Points",
            "label_ru": "Пункты сбора",
            "layerType": "Point",
            "description": "Официально определённые места сбора населения при эвакуации в чрезвычайных ситуациях.",
            "source": "МЧС Казахстана",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["evacuation", "emergency", "assembly"],
            "status": "active"
          },
          {
            "id": "fire_trains",
            "label": "Fire Trains",
            "label_ru": "Пожарные поезда",
            "layerType": "Point",
            "description": "Места дислокации пожарных поездов, применяемых для тушения пожаров на железной дороге и промышленных объектах.",
            "source": "МЧС / КТЖ",
            "isTemporal": false,
            "isDownloadable": true,
            "tags": ["fire", "railway", "emergency"],
            "status": "active"
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
            "label": "Fire Hotspots",
            "label_ru": "Горячие точки",
            "description": "Актуальные данные о местах возможных возгораний, зафиксированных спутниковыми системами (hotspots).",
            "layerType": "Point",
            "source": "NASA FIRMS / VIIRS / MODIS",
            "isTemporal": true,
            "isDownloadable": true,
            "tags": ["fire", "hotspots", "real-time"],
            "status": "active"
          },
          {
            "id": "fire_risk",
            "label": "Fire Risk Map",
            "label_ru": "Карта пожароопасности",
            "description": "Прогнозная карта, отображающая уровень пожарной опасности на территории Казахстана.",
            "layerType": "Raster",
            "source": "Внутренняя модель",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["fire", "risk", "prediction"],
            "status": "active"
          },
          {
            "id": "fire_modelling",
            "label": "Fire Spread Model",
            "label_ru": "Карта моделирования пожаров",
            "description": "Результаты математического моделирования распространения пожаров с учётом погодных условий и ландшафта.",
            "layerType": "Raster",
            "source": "Внутренняя модель",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["fire", "modelling", "simulation"],
            "status": "active"
          },
          {
            "id": "lst_explorer",
            "label": "Land Surface Temperature (LST)",
            "label_ru": "Температура поверхности (LST)",
            "description": "Температура поверхности земли (MODIS 11A1/11A2 и Landsat 8/9) через Planetary Computer. Дневные/ночные снимки в °C.",
            "layerType": "Raster",
            "source": "NASA / MODIS / Landsat / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["temperature", "lst", "thermal"],
            "status": "active"
          }
        ]
      },
      {
        "id": "drought",
        "label_ru": "Мониторинг засухи (не работает)",
        "isExpanded": true,
        "options": [
          {
            "id": "drought_indices",
            "label": "Drought Indices",
            "label_ru": "Индексы засухи",
            "description": "Актуальные данные о местах возможных возгораний, зафиксированных спутниковыми системами (hotspots).",
            "layerType": "Raster",
            "source": "NASA FIRMS / MODIS",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["drought", "indices", "vegetation"],
            "status": "not active"
          },
        ]
      },
      {
        "id": "vegetation_health",
        "label_ru": "Состояние растительности",
        "isExpanded": false,
        "options": [
          {
            "id": "ndvi_current",
            "label": "NDVI Current State",
            "label_ru": "NDVI текущее состояние",
            "description": "Индекс нормализованной разности растительности (NDVI) по актуальным спутниковым данным.",
            "layerType": "Raster",
            "source": "Sentinel-2 / MODIS / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["ndvi", "vegetation", "drought"],
            "status": "not active"
          },
          {
            "id": "ndvi_anomaly",
            "label": "NDVI Anomaly",
            "label_ru": "Аномалия NDVI",
            "description": "Отклонение текущего NDVI от многолетней нормы — индикатор стресса растительности.",
            "layerType": "Raster",
            "source": "MODIS / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["ndvi", "anomaly", "vegetation"],
            "status": "not active"
          },
          {
            "id": "evi",
            "label": "Enhanced Vegetation Index",
            "label_ru": "Enhanced Vegetation Index",
            "description": "Улучшенный индекс растительности (EVI), менее подверженный насыщению в густых лесах.",
            "layerType": "Raster",
            "source": "MODIS / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["evi", "vegetation", "modis"],
            "status": "not active"
          },
          {
            "id": "vci",
            "label": "Vegetation Condition Index",
            "label_ru": "Vegetation Condition Index",
            "description": "Индекс состояния растительности (VCI) — нормализованное отклонение NDVI от исторического минимума и максимума.",
            "layerType": "Raster",
            "source": "MODIS / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["vci", "vegetation", "drought"],
            "status": "not active"
          },
          {
            "id": "tci",
            "label": "Temperature Condition Index",
            "label_ru": "Temperature Condition Index",
            "description": "Индекс температурного состояния (TCI) на основе теплового излучения поверхности.",
            "layerType": "Raster",
            "source": "MODIS LST / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["tci", "temperature", "drought"],
            "status": "not active"
          },
          {
            "id": "vhi",
            "label": "Vegetation Health Index",
            "label_ru": "Vegetation Health Index",
            "description": "Индекс здоровья растительности (VHI) — комбинация VCI и TCI для оценки засухи.",
            "layerType": "Raster",
            "source": "MODIS / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["vhi", "vegetation", "drought"],
            "status": "not active"
          },
          {
            "id": "fapar",
            "label": "Fraction of Absorbed PAR",
            "label_ru": "Fraction of Absorbed PAR",
            "description": "Доля поглощённой фотосинтетически активной радиации (FAPAR) — показатель продуктивности растительности.",
            "layerType": "Raster",
            "source": "Sentinel-2 / MODIS / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["fapar", "vegetation", "par"],
            "status": "not active"
          },
          {
            "id": "biomass_proxy",
            "label": "Biomass Proxy",
            "label_ru": "Прокси биомассы",
            "description": "Прокси-оценка надземной биомассы на основе спутниковых индексов растительности.",
            "layerType": "Raster",
            "source": "Sentinel-1 / Sentinel-2 / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["biomass", "vegetation", "proxy"],
            "status": "not active"
          }
        ]
      },
      {
        "id": "water_stress",
        "label_ru": "Дефицит воды и гидрологический стресс",
        "isExpanded": false,
        "options": [
          {
            "id": "soil_moisture_surface",
            "label": "Surface Soil Moisture",
            "label_ru": "Поверхностная влажность почвы",
            "description": "Влажность верхнего слоя почвы (~5 см) по данным спутниковой микроволновой съёмки.",
            "layerType": "Raster",
            "source": "Sentinel-1 / ESA CCI / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["soil-moisture", "water", "drought"],
            "status": "not active"
          },
          {
            "id": "soil_moisture_rootzone",
            "label": "Root Zone Soil Moisture",
            "label_ru": "Влажность корнеобитаемого слоя",
            "description": "Влажность почвы в зоне корней (0–100 см) — ключевой показатель агрономической засухи.",
            "layerType": "Raster",
            "source": "ERA5-Land / Copernicus CDS",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["soil-moisture", "rootzone", "drought"],
            "status": "not active"
          },
          {
            "id": "soil_moisture_anomaly",
            "label": "Soil Moisture Anomaly",
            "label_ru": "Аномалия влажности почвы",
            "description": "Отклонение влажности почвы от многолетней нормы — индикатор начала или окончания засухи.",
            "layerType": "Raster",
            "source": "ESA CCI Soil Moisture / Copernicus",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["soil-moisture", "anomaly", "drought"],
            "status": "not active"
          },
          {
            "id": "reservoir_extent",
            "label": "Reservoir Extent",
            "label_ru": "Площадь водохранилищ",
            "description": "Текущая площадь поверхности водохранилищ по спутниковым данным.",
            "layerType": "Polygon",
            "source": "Sentinel-2 / JRC Global Surface Water",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["reservoir", "water", "surface-water"],
            "status": "not active"
          },
          {
            "id": "lake_area_change",
            "label": "Lake Area Change",
            "label_ru": "Изменение площади озёр",
            "description": "Динамика изменения площади озёр относительно базового периода.",
            "layerType": "Raster",
            "source": "Sentinel-2 / JRC Global Surface Water",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["lake", "water", "change-detection"],
            "status": "not active"
          },
          {
            "id": "river_discharge_anomaly",
            "label": "River Discharge Anomaly",
            "label_ru": "Аномалия стока рек",
            "description": "Отклонение речного стока от нормы — индикатор гидрологической засухи.",
            "layerType": "Raster",
            "source": "GloFAS / Copernicus EMS",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["river", "discharge", "drought"],
            "status": "not active"
          },
          {
            "id": "streamflow_deficit",
            "label": "Streamflow Deficit",
            "label_ru": "Дефицит речного стока",
            "description": "Абсолютный дефицит стока относительно среднемноголетних значений.",
            "layerType": "Raster",
            "source": "GloFAS / Copernicus EMS",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["streamflow", "deficit", "hydrology"],
            "status": "not active"
          },
          {
            "id": "groundwater_proxy",
            "label": "Groundwater Proxy",
            "label_ru": "Прокси подземных вод",
            "description": "Прокси-оценка изменений запасов подземных вод на основе данных GRACE.",
            "layerType": "Raster",
            "source": "NASA GRACE / GRACE-FO",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["groundwater", "grace", "water"],
            "status": "not active"
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
            "label_ru": "Sentinel Explorer",
            "description": "Единая панель поиска и визуализации спутниковых данных Sentinel-1, -2, -3 и -5P. Поиск по области, дате и облачности.",
            "layerType": "Raster",
            "source": "ESA / Copernicus / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["sentinel", "satellite", "imagery"],
            "status": "active"
          },
          {
            "id": "sentinel_explorer_old",
            "label": "Sentinel Explorer (Legacy CDSE)",
            "label_ru": "Sentinel Explorer (Устаревший CDSE)",
            "description": "Устаревшая панель Sentinel на основе Copernicus Data Space (CDSE) и Sentinel Hub WMS.",
            "layerType": "Raster",
            "source": "ESA / CDSE / Sentinel Hub",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["sentinel", "satellite", "legacy"],
            "status": "deprecated"
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
            "label_ru": "Landsat Explorer",
            "description": "Unified search and visualization of Landsat 4, 5, 7, 8, 9 imagery via Microsoft Planetary Computer STAC API.",
            "layerType": "Raster",
            "source": "USGS / NASA / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["landsat", "satellite", "imagery"],
            "status": "active"
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
            "label_ru": "MODIS Explorer",
            "description": "Unified search and visualization of MODIS Daily Fire Anomalies and Surface Reflectance imagery via Microsoft Planetary Computer STAC API.",
            "layerType": "Raster",
            "source": "NASA / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["modis", "satellite", "fire"],
            "status": "active"
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
            "label_ru": "Атмосфера и выбросы",
            "description": "Global search and analysis of atmospheric composition (CH₄, CO, NO₂, aerosols) via Sentinel-5P on Microsoft Planetary Computer.",
            "layerType": "Raster",
            "source": "ESA / Sentinel-5P / Planetary Computer",
            "isTemporal": true,
            "isDownloadable": false,
            "tags": ["atmosphere", "emissions", "sentinel-5p"],
            "status": "active"
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
            "label": "Bookmark Manager",
            "label_ru": "Менеджер закладок",
            "description": "Сохранение и управление позициями на карте для быстрого возврата.",
            "layerType": null,
            "source": null,
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["tools", "bookmarks"],
            "status": "active"
          }
        ]
      },
      {
        "id": "user_tools",
        "label_ru": "Инструменты гео поиска",
        "isExpanded": true,
        "options": [
          {
            "id": "home_extent",
            "label": "Home Extent",
            "label_ru": "Вернуться к полному охвату",
            "description": "Сбросить вид карты к начальному охвату всей территории Казахстана.",
            "layerType": null,
            "source": null,
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["tools", "navigation", "extent"],
            "status": "active"
          },
          {
            "id": "coordinate_search",
            "label": "Coordinate Search",
            "label_ru": "Поиск по координатам",
            "description": "Перейти к заданным географическим координатам (широта/долгота или UTM).",
            "layerType": null,
            "source": null,
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["tools", "navigation", "search"],
            "status": "active"
          },
          {
            "id": "go_to_region",
            "label": "Go to Region",
            "label_ru": "Быстрый переход к области",
            "description": "Выбрать область Казахстана из списка и мгновенно перейти к её охвату на карте.",
            "layerType": null,
            "source": null,
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["tools", "navigation", "region"],
            "status": "active"
          },
          {
            "id": "geolocate_user",
            "label": "My Location",
            "label_ru": "Моё местоположение",
            "description": "Определить текущее местоположение пользователя и центрировать карту по нему.",
            "layerType": null,
            "source": null,
            "isTemporal": false,
            "isDownloadable": false,
            "tags": ["tools", "navigation", "geolocation"],
            "status": "active"
          }
        ]
      },
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
            label: 'Bug Report Form',
            label_ru: 'Форма ошибки',
            description: 'Отправьте сообщение об ошибке или некорректной работе платформы.',
            action: 'reportBug',
            icon: 'alert-triangle',
            isActive: false,
            url: null,
            layerType: null,
            source: null,
            isTemporal: false,
            isDownloadable: false,
            tags: ['feedback', 'bug'],
            status: 'active'
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
            label: 'Suggest Improvement',
            label_ru: 'Предложить улучшение',
            description: 'Поделитесь идеями по улучшению функциональности платформы.',
            action: 'suggestFeature',
            icon: 'message-circle',
            isActive: false,
            url: null,
            layerType: null,
            source: null,
            isTemporal: false,
            isDownloadable: false,
            tags: ['feedback', 'suggestion'],
            status: 'active'
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
          {
            id: 'layers_panel',
            label: 'Layer Management',
            label_ru: 'Управление слоями',
            description: 'Управление видимостью, порядком и настройками всех активных слоёв карты.',
            layerType: null,
            source: null,
            isTemporal: false,
            isDownloadable: false,
            tags: ['tools', 'layers'],
            status: 'active'
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
            label: 'Step-by-step Tutorial',
            label_ru: 'Пошаговое обучение',
            description: 'Интерактивное обучение основным функциям платформы мониторинга пожаров.',
            action: 'startTutorial',
            icon: 'book-open',
            isActive: false,
            url: null,
            layerType: null,
            source: null,
            isTemporal: false,
            isDownloadable: false,
            tags: ['learning', 'tutorial'],
            status: 'active'
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
            label: 'Watch Video Guide',
            label_ru: 'Смотри видео',
            description: 'Видеоуроки по работе с картой, слоями и инструментами платформы.',
            action: 'showVideoGuide',
            icon: 'video',
            isActive: false,
            url: null,
            layerType: null,
            source: null,
            isTemporal: false,
            isDownloadable: false,
            tags: ['learning', 'video'],
            status: 'active'
          }
        ]
      }
    ]
  }
];
