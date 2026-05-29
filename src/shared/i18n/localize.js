const localizedFields = {
  kk: {
    admin_boundaries: { label: "Әкімшілік шекаралар" },
    terrain: { label: "Жер бедері" },
    climate: { label: "Климаттық аймақтар" },
    land_cover: { label: "Жер жамылғысы" },
    settlements: { label: "Елді мекендер" },
    kchs_objects: { label: "Төтенше жағдай нысандары" },
    fire: { label: "Өрт мониторингі" },
    drought: { label: "Құрғақшылық" },
    water_monitoring_group: { label: "Су мониторингі" },
    glacier_monitoring_group: { label: "Мұздықтар мониторингі" },
    satellite: { label: "Ғарыш суреттері" },
    landsat_archive: { label: "Landsat архиві" },
    modis_archive: { label: "MODIS архиві" },
    atmosphere_archive: { label: "Атмосфера" },
    bookmarks_manager: { label: "Кеңістіктік белгілер" },
    analysis_tools: { label: "Талдау құралдары" },
    data_tools: { label: "Деректермен жұмыс" },
    user_tools: { label: "Карта навигациясы" },
    bug_report: { label: "Қате туралы хабарлау" },
    suggestion: { label: "Ұсыныс" },
    presets_item: { label: "Пресеттер" },
    historical_wildfires_item: { label: "Тарихи өрттер" },
    historical_floods_item: { label: "Тарихи су тасқындары" },
    layers_panel_item: { label: "Қабаттарды басқару" },
    tutorial: { label: "Нұсқаулық" },
    videos: { label: "Бейнесабақтар" },

    country_boundaries: {
      label: "Қазақстан шекарасы",
      description: "Қазақстан Республикасының ресми мемлекеттік шекарасын көрсететін полигондық қабат.",
    },
    region_boundaries: {
      label: "Қазақстан облыстары",
      description: "Қазақстанның барлық облыстары мен республикалық маңызы бар қалаларының әкімшілік шекаралары.",
    },
    district_boundaries: {
      label: "Қазақстан аудандары",
      description: "Облыстар мен қалалар ішіндегі аудандардың егжей-тегжейлі шекаралары.",
    },
    protected_area_boundaries: {
      label: "Қазақстанның қорғалатын аумақтары",
      description: "Қазақстандағы ерекше қорғалатын табиғи аумақтардың шекаралары.",
    },
    dem_pc: {
      label: "Copernicus DEM GLO-30",
      description: "TanDEM-X радар деректерінен алынған 30 м ажыратымдылықтағы сандық жер бедері моделі.",
    },
    climate_zones: {
      label: "Кёппен климаттық аймақтары (1976-2000)",
      description: "1976-2000 жылдар деректері бойынша Кёппен-Гейгер схемасындағы Қазақстан климатының жіктелуі.",
    },
    lulc_pc: {
      label: "ESRI Sentinel-2 жер жамылғысы (10 м)",
      description: "Sentinel-2 негізіндегі 2017-2023 жылдарға арналған 10 м ажыратымдылықтағы жыл сайынғы LULC картасы.",
    },
    peatlands: {
      label: "Шымтезек алқаптары",
      description: "Қазақстандағы шымтезекті топырақтар қабаты: басым шымтезек және топырақ мозаикасындағы шымтезек полигондары.",
    },
    lulc: {
      label: "ESRI жер жамылғысы (ескі)",
      description: "ArcGIS ImageServer жаһандық картасы. Жыл таңдаусыз сүзілмеген қабат.",
    },
    settlements_layer: {
      label: "Қазақстан елді мекендері",
      description: "Қазақстан қалалары, кенттері, ауылдары және маңындағы елді мекендердің нүктелік қабаты.",
    },
    fire_departments: {
      label: "Өрт сөндіру бөлімдері",
      description: "Өрт сөндіру және төтенше жағдайларға әрекет ету бөлімдерінің орналасуы.",
    },
    hospitals: {
      label: "Ауруханалар",
      description: "Төтенше жағдайларда зардап шеккендерге көмек көрсететін медициналық мекемелер.",
    },
    fire_hydrants: {
      label: "Өрт гидранттары",
      description: "Өрт сөндіру кезінде су алуға арналған гидранттардың орналасу нүктелері.",
    },
    ava_ss: {
      label: "Авариялық-құтқару қызметі",
      description: "Төтенше жағдай салдарын жоюға дайын құтқару бөлімшелері.",
    },
    kaz_avia: {
      label: "ҚазАвиаҚұтқару",
      description: "Құтқару операцияларына қолданылатын авиациялық бөлімше базалары мен нысандары.",
    },
    oso: {
      label: "Әлеуметтік қорғау нысандары",
      description: "Төтенше жағдайда басым қорғауды қажет ететін арнайы әлеуметтік қызмет көрсету нысандары.",
    },
    ps: {
      label: "Жиналу пункттері",
      description: "Эвакуация кезінде халық жиналатын ресми орындар.",
    },
    fire_trains: {
      label: "Өрт пойыздары",
      description: "Теміржол және өнеркәсіп нысандарындағы өрттерді сөндіруге арналған өрт пойыздарының орналасуы.",
    },
    fire_pinpoints: {
      label: "Өрт ошақтары",
      description: "Спутниктік жүйелер анықтаған ықтимал жану орындары туралы өзекті деректер.",
    },
    fire_risk: {
      label: "Өрт қаупі картасы",
      description: "Қазақстан аумағындағы өрт қаупінің деңгейін көрсететін болжамдық карта.",
    },
    fire_modelling: {
      label: "Өрт таралу моделі",
      description: "Ауа райы мен жер бедерін ескеретін өрт таралуын математикалық модельдеу нәтижелері.",
    },
    burned_areas_modis: {
      label: "MODIS жанған аумақтары",
      description: "Microsoft Planetary Computer арқылы MODIS MCD64A1 v6.1 айлық жанған аумақ деректері.",
    },
    lst_explorer: {
      label: "Жер беті температурасы (LST)",
      description: "Planetary Computer арқылы MODIS және Landsat негізіндегі жер бетінің күндізгі/түнгі температурасы.",
    },
    fuel_moisture: {
      label: "Жанғыш материал ылғалдылығы",
      description: "Sentinel-2 SWIR арналары бойынша NDWI/NDMI негізіндегі құрғақ өсімдік пен жанғыш материал ылғалдылығы.",
    },
    wind_conditions: {
      label: "Жел жағдайы",
      description: "Open-Meteo Forecast API арқылы Қазақстан нүктелері бойынша жел жылдамдығы, екпіні және бағыты.",
    },
    drought_indices: {
      label: "Құрғақшылық мониторингі",
      description: "VHI, VCI, TCI, SPEI және NDVI аномалиясы бойынша құрғақшылықты өңірлік бағалау.",
    },
    drought_forecast: {
      label: "Құрғақшылық болжамы",
      description: "Өңірлік қауіпті нүктелермен үш айлық құрғақшылық қаупінің демонстрациялық болжамы.",
    },
    drought_imagery: {
      label: "Құрғақшылық индекстері",
      description: "NDVI, EVI, NDMI, SAVI, NBR, NDWI, LAI және FPAR индекстері үшін спутниктік суреттерді іздеу.",
    },
    water_bodies: {
      label: "Су нысандары",
      description: "Қазақстан су нысандарының GeoJSON қабаты, сүзгілер және атрибуттық статистика.",
    },
    satellite_water_monitoring: {
      label: "Суды ғарыштан мониторингілеу",
      description: "Planetary Computer арқылы жерүсті суларының ауданы, тартылуы, лайлығы және эвтрофикация көрсеткіштері.",
    },
    glacier_inventory: {
      label: "Мұздықтар тізілімі",
      description: "Қазақстан мұздықтарының GeoJSON қабаты, инвентарь сүзгілері және атрибуттық мәліметтері.",
    },
    satellite_glacier_monitoring: {
      label: "Мұздықтарды ғарыштан мониторингілеу",
      description: "Sentinel-2 индекстері негізінде қар мен мұз жамылғысын, ылғалды қарды және тасты мұздықтарды бақылау.",
    },
    sentinel_explorer: {
      label: "Sentinel зерттеушісі",
      description: "Sentinel-1, -2, -3 және -5P деректерін аумақ, күн және бұлттылық бойынша іздеу және визуалдау панелі.",
    },
    sentinel_explorer_old: {
      label: "Sentinel зерттеушісі (ескі CDSE)",
      description: "Copernicus Data Space және Sentinel Hub WMS негізіндегі ескі Sentinel панелі.",
    },
    landsat_explorer: {
      label: "Landsat зерттеушісі",
      description: "Microsoft Planetary Computer STAC API арқылы Landsat 4, 5, 7, 8, 9 суреттерін іздеу және көрсету.",
    },
    modis_explorer: {
      label: "MODIS зерттеушісі",
      description: "MODIS күнделікті өрт аномалиялары мен жер беті шағылысуы суреттерін іздеу және көрсету.",
    },
    atmosphere_explorer: {
      label: "Атмосфера зерттеушісі",
      description: "Sentinel-5P арқылы CH4, CO, NO2 және аэрозоль сияқты атмосфера құрамын талдау.",
    },
    spatial_bookmark_tool: {
      label: "Белгілер менеджері",
      description: "Картадағы позицияларды сақтап, оларға тез оралуға арналған басқару құралы.",
    },
    measure_distance: {
      label: "Қашықтықты өлшеу",
      description: "Картада сызық салып, оның геодезиялық ұзындығын метрмен немесе километрмен өлшеу.",
    },
    measure_area: {
      label: "Ауданды өлшеу",
      description: "Полигон салып, оның геодезиялық ауданын м2 немесе км2 түрінде есептеу.",
    },
    draw_polygon: {
      label: "Полигон салу және сақтау",
      description: "Буфер және қиылысу құралдары үшін картада атаулы полигон салу және сақтау.",
    },
    buffer_tool: {
      label: "Буфер",
      description: "Полигон айналасында берілген қашықтықтағы буферлік аймақ құру.",
    },
    intersect_tool: {
      label: "Қиылысу",
      description: "Екі полигонның геометриялық қиылысуын тауып, нәтиже ауданын көрсету.",
    },
    identify_pixel: {
      label: "Пикселді анықтау",
      description: "Картадағы нүктенің координатасын, биіктігін және объект атрибуттарын алу.",
    },
    feature_info: {
      label: "Объект атрибуттары",
      description: "Карта объектісін басып, оның атрибуттар кестесін қарау.",
    },
    download_data: {
      label: "Деректерді жүктеу",
      description: "Геопорталда қолданылатын деректердің сыртқы дереккөздеріне сілтемелер.",
    },
    home_extent: {
      label: "Бастапқы қамту",
      description: "Картаны Қазақстан аумағын толық қамтитын бастапқы көрініске қайтару.",
    },
    coordinate_search: {
      label: "Координата бойынша іздеу",
      description: "Берілген географиялық координаталарға немесе UTM мәндеріне өту.",
    },
    go_to_region: {
      label: "Өңірге өту",
      description: "Қазақстан облысын тізімнен таңдап, картада оның қамтуына жылдам өту.",
    },
    geolocate_user: {
      label: "Менің орным",
      description: "Пайдаланушының ағымдағы орнын анықтап, картаны сол жерге орталау.",
    },
    report_bug: {
      label: "Қате формасы",
      description: "Платформадағы қате немесе дұрыс істемейтін функция туралы хабар жіберу.",
    },
    suggest_feature: {
      label: "Жақсарту ұсыну",
      description: "Платформа функционалдығын жақсарту идеяларымен бөлісу.",
    },
    presets_controls: {
      label: "Карта пресеттері",
      description: "Қабаттар, сүзгілер және карта қамтуы үшін дайын жұмыс сценарийлері.",
    },
    historical_wildfires_controls: {
      label: "Тарихи өрттер",
      description: "Карта фокусы, AOI және статистикасы бар өткен табиғи өрт оқиғалары.",
    },
    historical_floods_controls: {
      label: "Тарихи су тасқындары",
      description: "Қазақстандағы ірі су тасқыны оқиғалары, су басу аймақтары және статистикасы.",
    },
    layers_panel: {
      label: "Қабаттарды басқару",
      description: "Картадағы барлық белсенді қабаттардың көрінуін, тәртібін және баптауларын басқару.",
    },
    start_tutorial: {
      label: "Қадамдық нұсқаулық",
      description: "Өрт мониторингі платформасының негізгі функцияларын интерактивті үйрету.",
    },
    video_tips: {
      label: "Бейненұсқаулықты көру",
      description: "Картамен, қабаттармен және платформа құралдарымен жұмыс істеу бейнесабақтары.",
    },
  },
  en: {
    admin_boundaries: { label: "Administrative boundaries" },
    terrain: { label: "Terrain" },
    climate: { label: "Climate zones" },
    land_cover: { label: "Land cover" },
    settlements: { label: "Settlements" },
    kchs_objects: { label: "Emergency facilities" },
    fire: { label: "Fire monitoring" },
    drought: { label: "Drought" },
    water_monitoring_group: { label: "Water monitoring" },
    glacier_monitoring_group: { label: "Glacier monitoring" },
    satellite: { label: "Satellite imagery" },
    landsat_archive: { label: "Landsat archive" },
    modis_archive: { label: "MODIS archive" },
    atmosphere_archive: { label: "Atmosphere" },
    bookmarks_manager: { label: "Spatial bookmarks" },
    analysis_tools: { label: "Analysis tools" },
    data_tools: { label: "Data tools" },
    user_tools: { label: "Map navigation" },
    bug_report: { label: "Report a bug" },
    suggestion: { label: "Suggestion" },
    presets_item: { label: "Presets" },
    historical_wildfires_item: { label: "Historical wildfires" },
    historical_floods_item: { label: "Historical floods" },
    layers_panel_item: { label: "Layer management" },
    tutorial: { label: "Guide" },
    videos: { label: "Video lessons" },

    country_boundaries: { description: "Polygon layer showing the official state borders of Kazakhstan." },
    region_boundaries: { description: "Administrative boundaries of all regions and cities of national significance in Kazakhstan." },
    district_boundaries: { description: "Detailed district boundaries within Kazakhstan regions and cities." },
    protected_area_boundaries: { description: "Detailed boundaries of protected natural areas in Kazakhstan." },
    dem_pc: { description: "DSM-based digital elevation model at 30 m resolution derived from TanDEM-X radar data." },
    climate_zones: { description: "Koeppen-Geiger climate classification for Kazakhstan based on 1976-2000 data." },
    lulc_pc: { description: "Annual 10 m LULC map for 2017-2023 with 9 classes based on Sentinel-2." },
    peatlands: { description: "Peat soil layer for Kazakhstan, including dominant peat and peat within soil mosaics." },
    lulc: { description: "Global map from ArcGIS ImageServer. Unfiltered layer without year selection." },
    settlements_layer: { description: "Point layer of Kazakhstan settlements: capital, cities, towns, villages and suburbs." },
    fire_departments: { description: "Fire station locations for fire suppression and emergency response." },
    hospitals: { description: "Medical facilities that support people affected by emergencies." },
    fire_hydrants: { description: "Fire hydrant locations used as water access points during firefighting." },
    ava_ss: { description: "Emergency rescue units ready to respond to disaster consequences." },
    kaz_avia: { description: "Bases and facilities of Kazakhstan emergency aviation units used for rescue operations." },
    oso: { description: "Special social service facilities that require priority protection during emergencies." },
    ps: { description: "Official assembly points for population evacuation during emergencies." },
    fire_trains: { description: "Fire train locations used for railway and industrial fire suppression." },
    fire_pinpoints: { description: "Current satellite-detected potential fire locations and hotspots." },
    fire_risk: { description: "Forecast map showing fire danger levels across Kazakhstan." },
    fire_modelling: { description: "Mathematical fire-spread modelling results based on weather and terrain." },
    burned_areas_modis: { description: "Monthly MODIS MCD64A1 v6.1 burned-area data through Microsoft Planetary Computer." },
    lst_explorer: { description: "Day and night land surface temperature from MODIS and Landsat via Planetary Computer." },
    fuel_moisture: { description: "Fuel-moisture and vegetation-dryness proxy based on Sentinel-2 SWIR NDWI/NDMI." },
    wind_conditions: { description: "Current wind speed, gusts and direction across Kazakhstan from Open-Meteo Forecast API." },
    drought_indices: { description: "Regional drought assessment using VHI, VCI, TCI, SPEI and NDVI anomaly." },
    drought_forecast: { description: "Demonstration three-month drought-risk forecast with regional hotspots." },
    drought_imagery: { description: "Search Sentinel-2, Landsat and MODIS imagery for drought-related spectral indices." },
    water_bodies: { label: "Water bodies", description: "GeoJSON layer of Kazakhstan water bodies with filters, inventory statistics and attributes." },
    satellite_water_monitoring: { label: "Satellite water monitoring", description: "Surface water monitoring via Planetary Computer: area, drying, turbidity and eutrophication indicators." },
    glacier_inventory: { description: "GeoJSON layer of Kazakhstan glaciers with inventory filters and attribute details." },
    satellite_glacier_monitoring: { description: "Snow and ice cover monitoring via Planetary Computer using Sentinel-2 indices." },
    sentinel_explorer: { description: "Unified panel for searching and visualizing Sentinel-1, -2, -3 and -5P data by area, date and cloud cover." },
    sentinel_explorer_old: { description: "Legacy Sentinel panel based on Copernicus Data Space and Sentinel Hub WMS." },
    landsat_explorer: { description: "Unified search and visualization of Landsat 4, 5, 7, 8 and 9 imagery via Planetary Computer STAC API." },
    modis_explorer: { description: "Unified search and visualization of MODIS fire anomalies and surface reflectance imagery." },
    atmosphere_explorer: { description: "Global search and analysis of atmospheric composition via Sentinel-5P on Microsoft Planetary Computer." },
    spatial_bookmark_tool: { description: "Save and manage map positions for quick return." },
    identify_pixel: { description: "Click the map to get coordinates, terrain elevation and object attributes at a point." },
    feature_info: { description: "Click a map feature to view its attribute table." },
    download_data: { description: "Links to external sources for downloading data used in the geoportal." },
    home_extent: { description: "Reset the map view to the initial full extent of Kazakhstan." },
    coordinate_search: { description: "Go to specified geographic coordinates or UTM values." },
    go_to_region: { description: "Select a Kazakhstan region and instantly zoom to its extent." },
    geolocate_user: { description: "Detect the user's current location and center the map on it." },
    report_bug: { description: "Send a message about a bug or incorrect platform behavior." },
    suggest_feature: { description: "Share ideas for improving platform functionality." },
    presets_controls: { description: "Ready-made map scenarios for layers, filters and map extent." },
    historical_wildfires_controls: { description: "Real historical wildfire cases with map focus, AOI and available statistics." },
    historical_floods_controls: { description: "Real major flood cases in Kazakhstan with flooded areas and statistics." },
    layers_panel: { description: "Manage visibility, order and settings for all active map layers." },
    start_tutorial: { description: "Interactive training for the main fire-monitoring platform features." },
    video_tips: { description: "Video lessons for working with the map, layers and platform tools." },
  },
};

export const getLocalizedValue = (item, field, language) => {
  if (!item) return "";

  const localizedValue = localizedFields[language]?.[item.id]?.[field];
  if (localizedValue !== undefined) return localizedValue;

  return (
    item[`${field}_${language}`] ??
    item[field] ??
    item[`${field}_en`] ??
    item.label ??
    item.label_ru ??
    ""
  );
};
