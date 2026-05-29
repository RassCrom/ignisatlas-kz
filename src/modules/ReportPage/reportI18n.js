import { useMemo } from "react";
import { useI18n } from "src/shared/i18n/I18nProvider";

const kk = {
  header: {
    badge: "Esep",
    navAria: "Esep bolimderi",
    mobileNavAria: "Mobil esep bolimderi",
  },
  footer: {
    tagline: "Analitikalyq esep · Qazaqstandagy ort belsendiligi · 2001-2024",
    navAria: "Esep bolimderi",
  },
  hero: {
    title: "Qazaqstandagy ort belsendiliginin kenistik-uakyttyq taldauy",
    subtitle:
      "NASA FIRMS gharysh derekteri negizinde 2001-2024 jyldardagy MODIS jane VIIRS termaldy anomaliyalarin keshendi zertteu.",
    stats: {
      modis: "MODIS nuqtalary (2001-2024)",
      viirs: "VIIRS nuqtalary (2012-2024)",
      territoryValue: "2.72 mln",
      territory: "km2 aumak",
    },
  },
  abstract: {
    title: "Negizgi qorytyndy",
    p1:
      "Zertteu NASA FIRMS termaldy anomaliyalar arhiwine suyenedi: MODIS onimi (shamamen 1 km, 2001-2024) jane VIIRS (375 m, 2012-2024). Aldyn ala ondeu oqiga turi men senimdilik dengeyi boiynsha suzgileudi jane metrlik koordinata juiesine qaita proeksiyalaudy qamtydy.",
    p2:
      "Ort tygyzdygynyn en jogary mani Qazaqstannyn soltustik dala onirlerine tiesili. Eki fazaly mausymsal uldgi anyqtaldy: koktemgi pik (auylsharuashylyq pali) jane jazgy pik (klimat faktorlary). Anomaliyalardyn 80%-dan astamy 0-500 m biiktikte. Qazaqstan Ortalyq Aziyada ort tygyzdygy boiynsha alda.",
  },
  common: {
    density: "Tygzydyq",
    count: "Sany",
    bothSensors: "Eki sensor",
    modis: "MODIS",
    viirs: "VIIRS",
    max: "Maks.",
    min: "Min.",
    period: "Kezeng",
    confidence: "Senimdilik",
    sensor: "Sensor",
    low: "Tomen",
    high: "Joqary",
    medium: "Ortasha",
    allLevels: "Barlyq dengeiler",
    loadingFireData: "Ort derekteri jukteledi...",
    source: "Derekkozi",
  },
  regions: {
    title: "Kenistik taraluy",
    subtitle: "Qazaqstannyn 20 akimshilik birlikteri boiynsha termaldy anomaliyalar tygyzdygy",
    densityOption: "Tygzydyq (nuqta/km2)",
    absoluteOption: "Absoliuttik san",
    maxModis: "Maks. MODIS tygyzdygy (SQO)",
    maxViirs: "Maks. VIIRS tygyzdygy (Shymkent)",
    minDensity: "Min. tygyzdyq (Mangystau)",
    names: [
      "Soltustik Qazaqstan", "Qostanai", "Aqmola", "Batys Qazaqstan", "Pavlodar",
      "Aqtobe", "Abai", "Almaty oblysy", "Shymkent", "Qaragandy", "Qyzylorda",
      "Astana", "Jambyl", "Jetisu", "Ulytau", "Shygys Qazaqstan", "Turkistan",
      "Atyrau", "Almaty qalasy", "Mangystau",
    ],
    shorts: [
      "SQO", "QOS", "AQM", "BQO", "PVL", "AQT", "ABA", "ALMo", "SHYM", "QRG",
      "QZO", "AST", "JAM", "JET", "ULY", "SHQO", "TUR", "ATR", "ALMg", "MAN",
    ],
  },
  temporal: {
    title: "Uaqyttyq dinamika",
    subtitle: "Ort belsendiliginin jyldyq jane mausymsal trendteri",
    yearly: "Jyldyq",
    seasonal: "Mausymdyq",
    monthly: "Ailyq",
    yearlyTitle: "Jyldyq dinamika (2001-2024)",
    yearlySubtitle: "2017 jyly VIIRS pikimen (~246 myn nuqta) birge tomen qarai trend korinedi.",
    seasonalTitle: "Mausymdyq taralu (MODIS)",
    seasonalSubtitle: "Jaz - pik (397 965), qys - minimum (5 575). Sauirdegi koterilis - auylsharuashylyq pali.",
    monthlyTitle: "Ailyq taralu (MODIS)",
    monthlySubtitle: "Belsendilik pigi - sauir jane qyrkuiek. Qys aylary - minimum.",
    seasons: ["Qys", "Koktem", "Jaz", "Kuz"],
    months: ["Qan", "Aqp", "Nau", "Sau", "Mam", "Mau", "Shi", "Tam", "Qyr", "Qaz", "Qar", "Jel"],
  },
  elevation: {
    title: "Biiktik zonalygy",
    subtitle: "Termaldy anomaliyalardyn 80%-dan astamy 0-500 m biiktikte.",
    chartTitle: "Biiktik beldeuleri boiynsha normallangan tygyzdyq",
    meters: "m",
  },
  landCover: {
    title: "Jer jabyndysy",
    subtitle: "ESA WorldCover 2021 klastary boiynsha taralu",
    chartTitle: "Jabyndy turleri boiynsha normallangan tygyzdyq",
    chartSubtitle: "VIIRS: salyngan aumaktar ushin ote jogary tygyzdyq (4.444)",
    types: ["Suly-batpaq jerler", "Egis alqaptary", "Shabyndyqtar", "Salyngan aumak", "Butalar", "Ormandar", "Su aydyndary", "Sirek osimdik"],
  },
  infrastructure: {
    title: "Infrakurylymga jaqyndyq",
    subtitle: "MODIS: maksimum 1-10 km; VIIRS: maksimum eldi mekenderde",
    chartTitle: "Qashyqtyq zonalary boiynsha tygyzdyq",
    distances: ["0 m", "500 m", "1 km", "2 km", "5 km", "10 km", ">10 km"],
    insightTitle: "Negizgi baqylau: ",
    insight:
      "VIIRS 375 m ajyratymdylygy arqyly eldi mekender ishinde rv = 2.497 manin tirkese, MODIS iri osimdik ortteri basym 10 km zonasinda rm = 0.515 maksimumyna jetedi.",
  },
  comparison: {
    title: "Elderaralyq salystyru",
    subtitle: "Qazaqstan - Ortalyq Aziyadagy jetekshi el, korshi elderden 4-16 ese jogary.",
    chartTitle: "Normallangan tygyzdyq (MODIS, nuqta / mln km2)",
    countries: [
      "Brazilia", "Avstralia", "Argentina", "India", "Resei", "Qazaqstan", "AQSH", "Qytai",
      "Kanada", "Ozbekstan", "Turkmenstan", "Qyrgyzstan", "Mongolia", "Aljir", "Tajikstan",
    ],
  },
  fireMap: {
    title: "Ort kartasy 2001-2024",
    subtitle:
      "NASA FIRMS (MODIS + VIIRS) derekteri boiynsha termaldy anomaliyalar kartasy. Kenistik taraludy zertteu ushin suzgiler men uaqyt aralygyn paidalanynyz.",
    densityPoints: "Tygzydyq / nuqtalar",
    note:
      "Derekkozi: NASA FIRMS - Fire Information for Resource Management System. Derek faili:",
    vector: "vektor",
  },
  conclusions: {
    title: "Qorytyndylar",
    items: [
      ["Dala onirleri - qauip zonalary", "SQO, Qostanai jane Aqmola oblystary eki sensor korsetkishteri boiynsha turaqty turde alda."],
      ["Eki fazaly mausymsaldyq", "Koktemgi pik (sauir) - auylsharuashylyq pali, jazgy pik - klimat faktorlary."],
      ["Tomen biiktikte shogyrlandy", "Anomaliyalardyn 80%-dan astamy 0-500 m biiktikte, qarqyndy sharuashylyq paidalanu zonalarynda."],
      ["MODIS jane VIIRS aiyrmashylygy", "VIIRS shagyn onerkasiptik jylu kozderin, MODIS iri osimdik ortterin jaqsyraq tirkedi."],
      ["Ortalyq Aziyadagy jetekshi oryn", "Qazaqstandagy ort tygyzdygy korshi elder korsetkishterinen 4-16 ese jogary."],
    ],
    sources: "Derekkozder: NASA FIRMS · ESA WorldCover 2021 · OpenStreetMap · NASADEM · HDX",
    period: "Zertteu kezeni: 2001-2024 · MODIS (MCD14ML) · VIIRS (VNP14IMGTDL/VJ114IMGTDL)",
  },
};

const en = {
  header: {
    badge: "Report",
    navAria: "Report sections",
    mobileNavAria: "Mobile report sections",
  },
  footer: {
    tagline: "Analytical report · Kazakhstan fire activity · 2001-2024",
    navAria: "Report sections",
  },
  hero: {
    title: "Spatio-temporal analysis of fire activity in Kazakhstan",
    subtitle:
      "A comprehensive study of MODIS and VIIRS thermal anomalies for 2001-2024 using NASA FIRMS satellite data.",
    stats: {
      modis: "MODIS points (2001-2024)",
      viirs: "VIIRS points (2012-2024)",
      territoryValue: "2.72M",
      territory: "km2 of territory",
    },
  },
  abstract: {
    title: "Executive Summary",
    p1:
      "The study is based on NASA FIRMS thermal anomaly archives: MODIS (about 1 km, 2001-2024) and VIIRS (375 m, 2012-2024). Preprocessing included event-type and confidence filtering, plus reprojection into a metric coordinate system.",
    p2:
      "The highest fire density occurs in the steppe regions of northern Kazakhstan. A two-phase seasonal pattern was identified: a spring peak driven by agricultural burning and a summer peak driven by climate factors. More than 80% of anomalies occur at 0-500 m elevation. Kazakhstan leads Central Asia in fire density.",
  },
  common: {
    density: "Density",
    count: "Count",
    bothSensors: "Both sensors",
    modis: "MODIS",
    viirs: "VIIRS",
    max: "Max",
    min: "Min",
    period: "Period",
    confidence: "Confidence",
    sensor: "Sensor",
    low: "Low",
    high: "High",
    medium: "Medium",
    allLevels: "All levels",
    loadingFireData: "Loading fire data...",
    source: "Source",
  },
  regions: {
    title: "Spatial Distribution",
    subtitle: "Thermal anomaly density across 20 administrative units of Kazakhstan",
    densityOption: "Density (points/km2)",
    absoluteOption: "Absolute count",
    maxModis: "Max MODIS density (NKO)",
    maxViirs: "Max VIIRS density (Shymkent)",
    minDensity: "Min density (Mangystau)",
    names: [
      "North Kazakhstan", "Kostanay", "Akmola", "West Kazakhstan", "Pavlodar",
      "Aktobe", "Abai", "Almaty region", "Shymkent", "Karagandy", "Kyzylorda",
      "Astana", "Jambyl", "Jetisu", "Ulytau", "East Kazakhstan", "Turkistan",
      "Atyrau", "Almaty city", "Mangystau",
    ],
    shorts: [
      "NKO", "KOS", "AKM", "WKO", "PVL", "AKT", "ABA", "ALMr", "SHY", "KRG",
      "KZO", "AST", "JAM", "JET", "ULY", "EKO", "TUR", "ATR", "ALMc", "MAN",
    ],
  },
  temporal: {
    title: "Temporal Dynamics",
    subtitle: "Annual and seasonal trends in fire activity",
    yearly: "Annual",
    seasonal: "Seasonal",
    monthly: "Monthly",
    yearlyTitle: "Annual dynamics (2001-2024)",
    yearlySubtitle: "A downward trend is visible, with a VIIRS peak in 2017 (~246K points).",
    seasonalTitle: "Seasonal distribution (MODIS)",
    seasonalSubtitle: "Summer is the peak (397,965), winter is the minimum (5,575). The April spike reflects agricultural burning.",
    monthlyTitle: "Monthly distribution (MODIS)",
    monthlySubtitle: "Activity peaks in April and September. Winter months are the minimum.",
    seasons: ["Winter", "Spring", "Summer", "Autumn"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  elevation: {
    title: "Elevation Zoning",
    subtitle: "More than 80% of thermal anomalies occur at 0-500 m above sea level.",
    chartTitle: "Normalized density by elevation belt",
    meters: "m",
  },
  landCover: {
    title: "Land Cover",
    subtitle: "Distribution by ESA WorldCover 2021 classes",
    chartTitle: "Normalized density by land-cover type",
    chartSubtitle: "VIIRS: unusually high density in built-up areas (4.444)",
    types: ["Wetlands", "Cropland", "Grassland", "Built-up", "Shrubland", "Forests", "Water bodies", "Sparse vegetation"],
  },
  infrastructure: {
    title: "Proximity to Infrastructure",
    subtitle: "MODIS peaks at 1-10 km; VIIRS peaks inside settlements",
    chartTitle: "Density by distance zone",
    distances: ["0 m", "500 m", "1 km", "2 km", "5 km", "10 km", ">10 km"],
    insightTitle: "Key observation: ",
    insight:
      "VIIRS records rv = 2.497 directly inside settlements at 375 m resolution, while MODIS reaches its maximum rm = 0.515 at 10 km, a zone dominated by large vegetation fires.",
  },
  comparison: {
    title: "International Comparison",
    subtitle: "Kazakhstan leads Central Asia, exceeding neighboring countries by 4-16 times.",
    chartTitle: "Normalized density (MODIS, points / million km2)",
    countries: [
      "Brazil", "Australia", "Argentina", "India", "Russia", "Kazakhstan", "USA", "China",
      "Canada", "Uzbekistan", "Turkmenistan", "Kyrgyzstan", "Mongolia", "Algeria", "Tajikistan",
    ],
  },
  fireMap: {
    title: "Fire Map 2001-2024",
    subtitle:
      "Interactive map of thermal anomalies based on NASA FIRMS data (MODIS + VIIRS). Use filters and the time range to explore spatial distribution.",
    densityPoints: "Density / points",
    note:
      "Source: NASA FIRMS - Fire Information for Resource Management System. Data file:",
    vector: "vector",
  },
  conclusions: {
    title: "Conclusions",
    items: [
      ["Steppe regions are risk zones", "North Kazakhstan, Kostanay and Akmola regions consistently lead across both satellite sensors."],
      ["Two-phase seasonality", "The spring peak in April is linked to agricultural burning; the summer peak is linked to climate factors."],
      ["Concentration at low elevations", "More than 80% of anomalies occur at 0-500 m in zones of intensive land use."],
      ["MODIS and VIIRS differ", "VIIRS captures compact industrial heat sources, while MODIS captures larger vegetation fires."],
      ["Central Asian leader", "Fire density in Kazakhstan is 4-16 times higher than in neighboring states."],
    ],
    sources: "Data sources: NASA FIRMS · ESA WorldCover 2021 · OpenStreetMap · NASADEM · HDX",
    period: "Study period: 2001-2024 · MODIS (MCD14ML) · VIIRS (VNP14IMGTDL/VJ114IMGTDL)",
  },
};

export const reportTranslations = { kk, en };

export const getReportLanguage = (language) => (language === "en" ? "en" : "kk");

export const useReportI18n = () => {
  const { language } = useI18n();
  const reportLanguage = getReportLanguage(language);

  return useMemo(
    () => ({
      language: reportLanguage,
      text: reportTranslations[reportLanguage],
    }),
    [reportLanguage]
  );
};
