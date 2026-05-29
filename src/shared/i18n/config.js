export const DEFAULT_LANGUAGE = "kk";

export const LANGUAGE_STORAGE_KEY = "fires-kz-language";

export const LANGUAGES = [
  { code: "kk", label: "KZ", name: "Qazaqsha", htmlLang: "kk-Latn-KZ", locale: "kk-KZ" },
  { code: "ru", label: "RU", name: "Русский", htmlLang: "ru-KZ", locale: "ru-RU" },
  { code: "en", label: "EN", name: "English", htmlLang: "en", locale: "en-US" },
];

export const LANGUAGE_CODES = LANGUAGES.map(({ code }) => code);

export const translations = {
  kk: {
    common: {
      brand: "Tabiat Kuzeti",
      brandRunes: "𐰔𐰀 𐰅𐰘𐰜𐰍",
      homeAria: "Tabiat Kuzeti - basty betke",
      openMenu: "Madi ashý",
      closeMenu: "Madi jabý",
      expand: "Ashý",
      collapse: "Jıý",
      languageSelect: "Til tandau",
    },
    meta: {
      title: "Tabiat Kuzeti - Qazaqstandaghy tabighi ortany gharysh arqyly monitorıngteu",
      description:
        "Tabiat Kuzeti - Qazaqstandaghy ort, qurg'aqshylyq, muzdyqtar jane su resurstaryn ashyq gharysh derekteri arqyly baqylau platphormasy.",
      keywords:
        "Tabiat Kuzeti, Qazaqstan ortter, gharysh monitorıngi, GIS karta, ekologııalyq monitorıng, Sentinel, Landsat, NASA FIRMS",
      ogTitle: "Tabiat Kuzeti - Qazaqstandaghy ekologııalyq monitorıng",
      ogDescription:
        "Naqty ýaqytta ort oshaqtaryn, tarıhı ortterdi jane tabighi ortany baqylaýga arnalgan interaktivti GIS portal.",
      twitterTitle: "Tabiat Kuzeti - ortter men ekologııany monitorıngteu",
      twitterDescription:
        "Qazaqstandaghy tabighi ortany gharysh suretteri jane ashyq derekter negizinde baqylau.",
      alternateName: ["Tabiat Kuzeti", "Nature Watch Kazakhstan"],
      appDescription:
        "Qazaqstan Respublikasynyng tabighi ortasyn, ort qaupin jane ekologııalyq korsetkishterin gharysh derekteri arqyly baqylaityn interaktivti GIS karta.",
    },
    landing: {
      navAria: "Negizgi navigatsııa",
      mobileNavAria: "Mobil'di madi",
      nav: [
        { label: "Mumkindikter", href: "#features" },
        { label: "Derekter", href: "#data" },
        { label: "Kimge arnalgan", href: "#audience" },
        { label: "Tehnologııalar", href: "#tech" },
      ],
      hero: {
        tagline: "Qazaqstandaghy tabighi ortany gharysh arqyly monitorıngteu",
        subtitle: "NASA · ESA Copernicus · Sentinel · Landsat · 2001-2024",
        openGeoportal: "Geoportaldy ashý",
        analytics: "Analıtıka",
      },
      features: {
        eyebrow: "MUMKINDIKTER",
        title: "Platphorma mumkindikteri",
        lead: "Ort, qurg'aqshylyq, muzdyqtar jane su resurstaryn bir jerde monitorıngteuge arnalgan quraldar.",
        cards: [
          {
            title: "Ort monitoringi",
            description:
              "MODIS jane VIIRS jylylyq anomaliıalary, Qazaqstan boıynsha oshaq tyghyzdygy kartasy. Baqylau arhiwi 2001 jyldan bastalady.",
          },
          {
            title: "Qurg'aqshylyqty baqylau",
            description:
              "Sentinel jane Landsat negizindegi NDVI jane VHI indeksleri. Topyraq ylg'aldylygy tapsyshylygy men osimdik stressin bagalau.",
          },
          {
            title: "Muzdyqtar monitoringi",
            description:
              "Sentinel-2 suretteri boıynsha Qazaqstan muzdyqtary audanynyng dinamikasy jane qardyn jyl saıyn ozgeruin baqylau.",
          },
          {
            title: "Su resurstary",
            description:
              "Ozen, kol jane su qoimalaryn monitorıngteu. Su jabyndysyn bagalau ushin NDWI jane MNDWI spektrlik indeksleri.",
          },
          {
            title: "Gharysh suretteri",
            description:
              "Sentinel-2 jane Landsat suretteri, NDVI, NBR, RGB, NIR spektrlik indekslerine auysý. Kopjyldyq suretter arhiwi.",
          },
          {
            title: "Taldau quraldary",
            description:
              "Piksel inspektory, audan men qashyqtyqty olsheu, kenistik belgiler. Dal taldauga arnalgan quraldar jiyny.",
          },
        ],
      },
      data: {
        eyebrow: "DEREKTER",
        title: "Derekter jane qamtu",
        lead:
          "Platphorma NASA, ESA jane Microsoft ashyq gharysh derekterin paidalanady - jylylyq anomaliıalardan Zher betinin kop spektrli suretterine deıin.",
        coverage: "Qazaqstannyng barlyq aumaghy",
        stats: [
          { value: 4, suffix: "", label: "monitorıng bagyty" },
          { value: 2001, suffix: "", label: "baqylau arhiwining bastaluy" },
          { value: 25, suffix: "+", label: "jyl tarıhı derekter" },
          { value: 5, suffix: "", label: "gharysh platphormasy" },
        ],
      },
      audience: {
        eyebrow: "KIMGE",
        title: "Platphorma kimge arnalgan",
        lead: "Tabiat Kuzeti gharysh derekterimen jumys isteuding ar turli senarıılerin eskerip jasaldy.",
        cards: [
          {
            title: "Azamattar jane jurnalister",
            description:
              "Oz oniringizdegi ekologııalyq jagdaıdy baqylangyz: ortter, qurg'aqshylyq, su qoimalarynyng jaı-kuıi. Interaktivti karta tirkeusiz jumys isteıdi.",
            badge: "Azamattar",
          },
          {
            title: "Ghalymdar jane zertteushiler",
            description:
              "Tort monitorıng bagyty boıynsha kopjyldyq gharysh derekteri arhiwi. Klimattyq zertteulerge, jarııalymdarga jane model'deuge daıyn negiz.",
            badge: "Gylym",
          },
          {
            title: "Qashyqtyqtan zondtau mamandary",
            description:
              "Spektrlik indeksler, piksel inspektory jane audan olsheu - Sentinel jane Landsat kop spektrli suretterimen jumysqa arnalgan quraldar.",
            badge: "QZ",
          },
        ],
      },
      tech: {
        eyebrow: "TEHNOLOGIIALAR",
        title: "Derek kozderi",
        lead: "Platphorma zherdi baqylau bagdarlamalary men jetekshi gharysh agenttikterining derekterine qurylgan.",
      },
      research: {
        eyebrow: "ZERTTEULER",
        title: "Zertteuler",
        lead: "Tabiat Kuzeti derekteri negizindegi analıtıkalyq materialdar.",
        available: "Qoljetimdi",
        reportTitle: "Analıtıkalyq esep",
        reportDesc:
          "2001-2024 jyldardagy MODIS/VIIRS derekteri negizinde Qazaqstandaghy ortter dinamikasyn tolyq taldau.",
        readReport: "Esepti oqý",
        inProgress: "Jasaluda",
        storyTitle: "Qazaqstan ortterining tarıhy",
        storyDesc:
          "Elde songy 24 jylda ort jagdaıy qalai ozgergenin korsetetin interaktivti vizualdy baıandau.",
        soon: "Jaqynda",
        library: "Barlyq materialdar",
        feature1: "2001-2024 ort dinamikasy",
        feature2: "Ashyq derekter · reproduktivti",
      },
      footer: {
        navAria: "Bolimder boıynsha navigatsııa",
        tagline: "Qazaqstandaghy tabighi ortany gharysh arqyly monitorıngteu",
        copyright: "Ashyq joba.",
        dataSources: "Derekter: NASA FIRMS · ESA Copernicus · Microsoft Planetary Computer",
      },
    },
    map: {
      sidebarAria: "Karta basqarulary",
      sidebarTabsAria: "Karta paneli qoiynshalary",
      help: {
        buttonTooltip: "Anyqtama",
        openAria: "Anyqtamany ashý",
        closeAria: "Jabý",
        dialogAria: "Geoportal anyqtamasy",
        title: "Anyqtama",
        intro: "Tabiat Kuzeti - Qazaqstannyng tabighi ortasyn gharysh arqyly monitorıngteu geoportaly.",
        footer: "Derekter: NASA FIRMS · ESA Copernicus · Microsoft Planetary Computer",
        sections: [
          {
            title: "Kartada zhuru",
            items: [
              "Sol jaq batyrma + tartu - kartany jylzhytu",
              "Tyshqan dongelegi / eki ret basu - jaqyndatu",
              "Ong jaq batyrma - kontekstik madi",
              "Obektige basu - tolyq aqparat",
            ],
          },
          {
            title: "Perne taqtasy",
            items: ["+ / - - jaqyndatu / alystatu", "Bagyttar - panel' qoiynshasyn auystyru", "Home / End - birinshi / songy qoiynsha", "Esc - panel'di jabý"],
          },
          {
            title: "Qabattar paneli",
            items: ["Qabattar - bazalyq qabattardy basqaru", "Qabattardy basqaru - korinu jane tartip"],
          },
          {
            title: "Tabighi qubylystar monitoringi",
            items: ["FIRMS ystyq nuqtalary (MODIS / VIIRS)", "Ort qaupi, model'deu jane jan'an audandar", "Qurg'aqshylyq, torf, atmosfera", "Su nysandary jane tasqyndar"],
          },
          {
            title: "Gharysh suretteri",
            items: ["Sentinel-2, Landsat 8/9, MODIS True Color", "LST - zher beti temperaturasy", "Sýret izdeu ushin AOI jane kun tandangyz"],
          },
          {
            title: "Presetter",
            items: ["Jyl dam senarııler: ortter, qauip, infrakurylym", "Su monitoringi, qurg'aqshylyq, ekologııa", "Taza karta - barlyq qabatty tazalau"],
          },
        ],
      },
      sidebarTabs: {
        natural: "Tabighi qubylystar monitoringi",
        satellite: "Gharysh suretteri",
        wildfires: "Tarıhı ortter",
        floods: "Tarıhı tasqyndar",
        layers: "Qabattar",
        layerManagement: "Qabattardy basqaru",
        tools: "Quraldar",
        presets: "Presetter",
      },
      controls: {
        loading: "Juktelude...",
        noData: "Derekter joq",
        opacity: "Moldirlik",
        refreshLayer: "Qabat derekterin jangartu",
        zoomIn: "Jaqyndatu",
        zoomOut: "Alystatu",
        homeView: "Bastapqy korinis",
        addToMap: "Kartagha qosý",
        removeFromMap: "Kartadan alyp tastau",
      },
      basemap: {
        open: "Podlozhkalardy ashy",
        close: "Podlozhkalardy jabu",
        title: "Karta podlozhkasy",
        options: "Podlozhka nұсқалары",
        loading: "Podlozhka auystyryluda...",
        raster: "Rastrly",
        vector: "Vektorly",
      },
    },
  },
  ru: {
    common: {
      brand: "Tabiat Kuzeti",
      brandRunes: "𐰔𐰀 𐰅𐰘𐰜𐰍",
      homeAria: "Tabiat Kuzeti - на главную",
      openMenu: "Открыть меню",
      closeMenu: "Закрыть меню",
      expand: "Развернуть",
      collapse: "Свернуть",
      languageSelect: "Выбор языка",
    },
    meta: {
      title: "Tabiat Kuzeti - спутниковый мониторинг окружающей среды в Казахстане",
      description:
        "Интерактивная ГИС-платформа Tabiat Kuzeti для мониторинга пожаров, засух, ледников и водных ресурсов Казахстана на основе открытых спутниковых данных.",
      keywords:
        "Tabiat Kuzeti, пожары в Казахстане, спутниковый мониторинг, ГИС карта, экологический мониторинг, Sentinel, Landsat, NASA FIRMS",
      ogTitle: "Tabiat Kuzeti - экологический мониторинг Казахстана",
      ogDescription:
        "Интерактивный ГИС-портал для отслеживания очагов возгорания, исторических пожаров и состояния окружающей среды.",
      twitterTitle: "Tabiat Kuzeti - мониторинг пожаров и экологии",
      twitterDescription: "Интерактивная карта и анализ природных данных Казахстана.",
      alternateName: ["Tabiat Kuzeti", "Nature Watch Kazakhstan", "Табиат Кузети"],
      appDescription:
        "Интерактивная ГИС-карта и система спутникового мониторинга природных явлений и экологических показателей в Республике Казахстан.",
    },
    landing: {
      navAria: "Основная навигация",
      mobileNavAria: "Мобильное меню",
      nav: [
        { label: "Возможности", href: "#features" },
        { label: "Данные", href: "#data" },
        { label: "Для кого", href: "#audience" },
        { label: "Технологии", href: "#tech" },
      ],
      hero: {
        tagline: "Спутниковый мониторинг окружающей среды в Казахстане",
        subtitle: "NASA · ESA Copernicus · Sentinel · Landsat · 2001-2024",
        openGeoportal: "Открыть геопортал",
        analytics: "Аналитика",
      },
      features: {
        eyebrow: "ВОЗМОЖНОСТИ",
        title: "Возможности платформы",
        lead: "Инструменты для мониторинга пожаров, засух, ледников и водных ресурсов в одном месте.",
        cards: [
          {
            title: "Мониторинг пожаров",
            description:
              "Тепловые аномалии MODIS и VIIRS, карта плотности очагов по всей территории Казахстана. Архив наблюдений с 2001 года.",
          },
          {
            title: "Мониторинг засух",
            description:
              "Индексы NDVI и VHI на основе Sentinel и Landsat. Оценка дефицита влажности почвы и растительного стресса.",
          },
          {
            title: "Мониторинг ледников",
            description:
              "Динамика площади ледников Казахстана по снимкам Sentinel-2 и отслеживание ежегодных изменений снежного покрова.",
          },
          {
            title: "Водные ресурсы",
            description:
              "Мониторинг рек, озер и водохранилищ. Спектральные индексы NDWI и MNDWI для оценки водного покрытия.",
          },
          {
            title: "Спутниковые снимки",
            description:
              "Sentinel-2 и Landsat с переключением спектральных индексов - NDVI, NBR, RGB, NIR. Многолетний архив снимков.",
          },
          {
            title: "Инструменты анализа",
            description:
              "Инспектор пикселей, измерение площадей и расстояний, пространственные закладки. Набор инструментов для точного анализа.",
          },
        ],
      },
      data: {
        eyebrow: "ДАННЫЕ",
        title: "Данные и покрытие",
        lead:
          "Платформа использует открытые спутниковые данные NASA, ESA и Microsoft - от тепловых аномалий до многоспектральных снимков поверхности Земли.",
        coverage: "Вся территория Казахстана",
        stats: [
          { value: 4, suffix: "", label: "направления мониторинга" },
          { value: 2001, suffix: "", label: "начало архива наблюдений" },
          { value: 25, suffix: "+", label: "лет исторических данных" },
          { value: 5, suffix: "", label: "спутниковых платформ" },
        ],
      },
      audience: {
        eyebrow: "ДЛЯ КОГО",
        title: "Для кого создана платформа",
        lead: "Tabiat Kuzeti проектировался с учетом разных сценариев работы со спутниковыми данными.",
        cards: [
          {
            title: "Граждане и журналисты",
            description:
              "Следите за экологической обстановкой в своем регионе: пожары, засухи, состояние водоемов. Интерактивная карта работает без регистрации.",
            badge: "Граждане",
          },
          {
            title: "Ученые и исследователи",
            description:
              "Многолетний архив спутниковых данных по четырем направлениям мониторинга. Готовая база для климатических исследований, публикаций и моделирования.",
            badge: "Наука",
          },
          {
            title: "Специалисты ДЗЗ",
            description:
              "Спектральные индексы, инспектор пикселей, измерение площадей - полный набор инструментов для работы со снимками Sentinel и Landsat.",
            badge: "ДЗЗ",
          },
        ],
      },
      tech: {
        eyebrow: "ТЕХНОЛОГИИ",
        title: "Источники данных",
        lead: "Платформа построена на данных ведущих космических агентств и программ наблюдения Земли.",
      },
      research: {
        eyebrow: "ИССЛЕДОВАНИЯ",
        title: "Исследования",
        lead: "Аналитические материалы на основе данных Tabiat Kuzeti.",
        available: "Доступен",
        reportTitle: "Аналитический отчет",
        reportDesc:
          "Подробный анализ динамики пожаров в Казахстане на основе данных MODIS/VIIRS за 2001-2024 гг.",
        readReport: "Читать отчет",
        inProgress: "В разработке",
        storyTitle: "История пожаров Казахстана",
        storyDesc:
          "Интерактивное визуальное повествование о том, как менялась пожарная обстановка в стране за 24 года.",
        soon: "Скоро",
        library: "Все материалы",
        feature1: "Динамика пожаров 2001-2024",
        feature2: "Открытые данные · воспроизводимо",
      },
      footer: {
        navAria: "Навигация по разделам",
        tagline: "Спутниковый мониторинг окружающей среды в Казахстане",
        copyright: "Открытый проект.",
        dataSources: "Данные: NASA FIRMS · ESA Copernicus · Microsoft Planetary Computer",
      },
    },
    map: {
      sidebarAria: "Управление картой",
      sidebarTabsAria: "Вкладки панели карты",
      help: {
        buttonTooltip: "Справка",
        openAria: "Открыть справку",
        closeAria: "Закрыть",
        dialogAria: "Справка по геопорталу",
        title: "Справка",
        intro: "Tabiat Kuzeti - спутниковый геопортал мониторинга природных явлений Казахстана.",
        footer: "Данные: NASA FIRMS · ESA Copernicus · Microsoft Planetary Computer",
        sections: [
          {
            title: "Навигация по карте",
            items: ["ЛКМ + перетаскивание - перемещение карты", "Колесо мыши / двойной клик - приближение", "ПКМ - контекстное меню", "Клик по объекту - детальная информация"],
          },
          {
            title: "Клавиши",
            items: ["+ / - - приближение / отдаление", "Стрелки - переключение вкладок панели", "Home / End - первая / последняя вкладка", "Esc - закрыть панель"],
          },
          {
            title: "Панель слоев",
            items: ["Слои - управление базовыми слоями", "Управление слоями - видимость и порядок"],
          },
          {
            title: "Мониторинг природных явлений",
            items: ["Горячие точки FIRMS (MODIS / VIIRS)", "Пожарный риск, моделирование, горелые площади", "Засуха, торфяники, атмосфера", "Водные объекты и паводки"],
          },
          {
            title: "Космические снимки",
            items: ["Sentinel-2, Landsat 8/9, MODIS True Color", "LST - температура поверхности", "Выберите AOI и дату для поиска снимков"],
          },
          {
            title: "Пресеты",
            items: ["Быстрые сценарии: пожары, риск, инфраструктура", "Водный мониторинг, засуха, экология", "Чистая карта - сброс всех слоев"],
          },
        ],
      },
      sidebarTabs: {
        natural: "Мониторинг природных явлений",
        satellite: "Космические снимки",
        wildfires: "Исторические пожары",
        floods: "Исторические паводки",
        layers: "Слои",
        layerManagement: "Управление слоями",
        tools: "Инструменты",
        presets: "Пресеты",
      },
      controls: {
        loading: "Загрузка...",
        noData: "Нет данных",
        opacity: "Прозрачность",
        refreshLayer: "Обновить данные слоя",
        zoomIn: "Приблизить",
        zoomOut: "Отдалить",
        homeView: "На главный вид",
        addToMap: "Добавить на карту",
        removeFromMap: "Удалить с карты",
      },
      basemap: {
        open: "Открыть подложки",
        close: "Закрыть подложки",
        title: "Подложка карты",
        options: "Варианты подложки",
        loading: "Смена подложки...",
        raster: "Растровые",
        vector: "Векторные",
      },
    },
  },
  en: {
    common: {
      brand: "Tabiat Kuzeti",
      brandRunes: "𐰔𐰀 𐰅𐰘𐰜𐰍",
      homeAria: "Tabiat Kuzeti - home",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      expand: "Expand",
      collapse: "Collapse",
      languageSelect: "Language selection",
    },
    meta: {
      title: "Tabiat Kuzeti - satellite environmental monitoring in Kazakhstan",
      description:
        "Interactive GIS platform for monitoring fires, drought, glaciers and water resources in Kazakhstan with open satellite data.",
      keywords:
        "Tabiat Kuzeti, Kazakhstan fires, satellite monitoring, GIS map, environmental monitoring, Sentinel, Landsat, NASA FIRMS",
      ogTitle: "Tabiat Kuzeti - environmental monitoring in Kazakhstan",
      ogDescription:
        "Interactive GIS portal for real-time fire detection, historical wildfire analysis and environmental monitoring.",
      twitterTitle: "Tabiat Kuzeti - fire and environmental monitoring",
      twitterDescription: "Interactive map and analysis of Kazakhstan's natural environment.",
      alternateName: ["Tabiat Kuzeti", "Nature Watch Kazakhstan"],
      appDescription:
        "Interactive GIS map and satellite monitoring system for natural phenomena and environmental indicators in Kazakhstan.",
    },
    landing: {
      navAria: "Main navigation",
      mobileNavAria: "Mobile menu",
      nav: [
        { label: "Features", href: "#features" },
        { label: "Data", href: "#data" },
        { label: "Audience", href: "#audience" },
        { label: "Technology", href: "#tech" },
      ],
      hero: {
        tagline: "Satellite environmental monitoring in Kazakhstan",
        subtitle: "NASA · ESA Copernicus · Sentinel · Landsat · 2001-2024",
        openGeoportal: "Open geoportal",
        analytics: "Analytics",
      },
      features: {
        eyebrow: "FEATURES",
        title: "Platform features",
        lead: "Tools for monitoring fires, drought, glaciers and water resources in one place.",
        cards: [
          {
            title: "Fire monitoring",
            description:
              "MODIS and VIIRS thermal anomalies, hotspot density maps across Kazakhstan and an observation archive starting in 2001.",
          },
          {
            title: "Drought monitoring",
            description:
              "NDVI and VHI indices based on Sentinel and Landsat data for estimating soil moisture deficit and vegetation stress.",
          },
          {
            title: "Glacier monitoring",
            description:
              "Sentinel-2 based tracking of Kazakhstan glacier area dynamics and annual snow-cover change.",
          },
          {
            title: "Water resources",
            description:
              "Monitoring rivers, lakes and reservoirs with NDWI and MNDWI spectral indices for water-cover assessment.",
          },
          {
            title: "Satellite imagery",
            description:
              "Sentinel-2 and Landsat imagery with spectral index switching: NDVI, NBR, RGB and NIR, plus a multi-year archive.",
          },
          {
            title: "Analysis tools",
            description:
              "Pixel inspector, area and distance measurements, spatial bookmarks and tools for precise geospatial analysis.",
          },
        ],
      },
      data: {
        eyebrow: "DATA",
        title: "Data and coverage",
        lead:
          "The platform uses open satellite data from NASA, ESA and Microsoft, from thermal anomalies to multispectral Earth surface imagery.",
        coverage: "All Kazakhstan territory",
        stats: [
          { value: 4, suffix: "", label: "monitoring domains" },
          { value: 2001, suffix: "", label: "observation archive start" },
          { value: 25, suffix: "+", label: "years of historical data" },
          { value: 5, suffix: "", label: "satellite platforms" },
        ],
      },
      audience: {
        eyebrow: "AUDIENCE",
        title: "Who the platform is for",
        lead: "Tabiat Kuzeti is designed for different workflows with satellite data.",
        cards: [
          {
            title: "Citizens and journalists",
            description:
              "Track environmental conditions in your region: fires, drought and water-body status. The interactive map works without registration.",
            badge: "Public",
          },
          {
            title: "Scientists and researchers",
            description:
              "A multi-year satellite data archive across four monitoring domains, ready for climate studies, publications and modelling.",
            badge: "Science",
          },
          {
            title: "Remote-sensing specialists",
            description:
              "Spectral indices, pixel inspection and area measurement for working with multispectral Sentinel and Landsat imagery.",
            badge: "RS",
          },
        ],
      },
      tech: {
        eyebrow: "TECHNOLOGY",
        title: "Data sources",
        lead: "The platform is built on data from leading space agencies and Earth observation programs.",
      },
      research: {
        eyebrow: "RESEARCH",
        title: "Research",
        lead: "Analytical materials based on Tabiat Kuzeti data.",
        available: "Available",
        reportTitle: "Analytical report",
        reportDesc:
          "A detailed analysis of wildfire dynamics in Kazakhstan based on MODIS/VIIRS data for 2001-2024.",
        readReport: "Read report",
        inProgress: "In progress",
        storyTitle: "Kazakhstan wildfire history",
        storyDesc:
          "An interactive visual story showing how the fire situation changed across the country over 24 years.",
        soon: "Soon",
        library: "All materials",
        feature1: "Fire dynamics 2001–2024",
        feature2: "Open data · reproducible",
      },
      footer: {
        navAria: "Section navigation",
        tagline: "Satellite environmental monitoring in Kazakhstan",
        copyright: "Open project.",
        dataSources: "Data: NASA FIRMS · ESA Copernicus · Microsoft Planetary Computer",
      },
    },
    map: {
      sidebarAria: "Map controls",
      sidebarTabsAria: "Map sidebar tabs",
      help: {
        buttonTooltip: "Help",
        openAria: "Open help",
        closeAria: "Close",
        dialogAria: "Geoportal help",
        title: "Help",
        intro: "Tabiat Kuzeti is a satellite geoportal for monitoring natural phenomena in Kazakhstan.",
        footer: "Data: NASA FIRMS · ESA Copernicus · Microsoft Planetary Computer",
        sections: [
          {
            title: "Map navigation",
            items: ["Left button + drag - pan the map", "Mouse wheel / double click - zoom in", "Right click - context menu", "Click an object - detailed information"],
          },
          {
            title: "Keyboard",
            items: ["+ / - - zoom in / out", "Arrow keys - switch panel tabs", "Home / End - first / last tab", "Esc - close panel"],
          },
          {
            title: "Layers panel",
            items: ["Layers - manage base layers", "Layer management - visibility and order"],
          },
          {
            title: "Natural phenomena monitoring",
            items: ["FIRMS hotspots (MODIS / VIIRS)", "Fire risk, modelling and burned areas", "Drought, peatlands and atmosphere", "Water bodies and floods"],
          },
          {
            title: "Satellite imagery",
            items: ["Sentinel-2, Landsat 8/9, MODIS True Color", "LST - land surface temperature", "Select an AOI and date to search imagery"],
          },
          {
            title: "Presets",
            items: ["Fast scenarios: fires, risk, infrastructure", "Water monitoring, drought, ecology", "Clean map - reset all layers"],
          },
        ],
      },
      sidebarTabs: {
        natural: "Natural phenomena monitoring",
        satellite: "Satellite imagery",
        wildfires: "Historical wildfires",
        floods: "Historical floods",
        layers: "Layers",
        layerManagement: "Layer management",
        tools: "Tools",
        presets: "Presets",
      },
      controls: {
        loading: "Loading...",
        noData: "No data available",
        opacity: "Opacity",
        refreshLayer: "Refresh layer data",
        zoomIn: "Zoom in",
        zoomOut: "Zoom out",
        homeView: "Home view",
        addToMap: "Add to map",
        removeFromMap: "Remove from map",
      },
      basemap: {
        open: "Open basemaps",
        close: "Close basemaps",
        title: "Map basemap",
        options: "Basemap options",
        loading: "Changing basemap...",
        raster: "Raster",
        vector: "Vector",
      },
    },
  },
};
