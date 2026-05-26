import { Helmet } from "react-helmet-async";

const HeadMeta = () => {
  // Dynamically obtain current origins for canonical and OpenGraph fully-qualified absolute URLs
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://fires.kz";
  const canonicalUrl = typeof window !== "undefined" ? window.location.href : "https://fires.kz/map/";
  const logoUrl = `${currentOrigin}/temp_logo.png`;

  return (
    <Helmet>
      {/* Primary Page Title */}
      <title>Tabiat Küzeti — Спутниковый мониторинг лесных пожаров в Казахстане</title>
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Standard Meta Tags */}
      <meta
        name="description"
        content="Интерактивная ГИС-платформа Tabiat Küzeti для мониторинга лесных, степных пожаров и экологического состояния в Казахстане в реальном времени. Космомониторинг, архивные данные и прогнозирование рисков."
      />
      <meta
        name="keywords"
        content="Табиат Күзеті, Tabiat Kuzeti, лесные пожары в Казахстане, спутниковый мониторинг пожаров, космомониторинг пожаров, лесничество Казахстана, ГИС карта пожаров, экологическая безопасность Казахстан, OpenLayers GIS, лесные пожары онлайн, экологический мониторинг, мониторинг экологии"
      />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Tabiat Küzeti Team" />

      {/* Open Graph / Facebook (Kazakhstan's corporate and social media networks) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Tabiat Küzeti" />
      <meta
        property="og:title"
        content="Tabiat Küzeti — Спутниковый экологический мониторинг пожаров в Казахстане"
      />
      <meta
        property="og:description"
        content="Интерактивный ГИС-портал для отслеживания очагов возгорания в реальном времени, анализа исторических пожаров и защиты лесного фонда Республики Казахстан."
      />
      <meta property="og:image" content={logoUrl} />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:locale:alternate" content="kk_KZ" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Tabiat Küzeti — Спутниковый мониторинг пожаров и экологии Казахстана"
      />
      <meta
        name="twitter:description"
        content="Интерактивная карта и анализ лесных пожаров в Казахстане в реальном времени. Берегите природу вместе с нами!"
      />
      <meta name="twitter:image" content={logoUrl} />

      {/* Performance Prefetching & Preconnecting */}
      <link rel="preconnect" href="https://tile.openstreetmap.org" />
      <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
      <link rel="preconnect" href="https://api.open-meteo.com" />
      <link rel="dns-prefetch" href="https://api.open-meteo.com" />
      <link rel="preconnect" href="https://api.openweathermap.org" />
      <link rel="dns-prefetch" href="https://api.openweathermap.org" />

      {/* Structured Schema.org Markup for Rich Results (SEO) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Tabiat Küzeti",
          "alternateName": ["Tabiat Kuzeti", "Nature Watch Kazakhstan", "Табиат Күзеті"],
          "description": "Интерактивная ГИС-карта и система спутникового космического мониторинга лесных пожаров и экологических показателей в Республике Казахстан.",
          "applicationCategory": "GISMappingApplication",
          "operatingSystem": "All",
          "url": currentOrigin,
          "image": logoUrl,
          "copyrightYear": new Date().getFullYear(),
          "spatialCoverage": {
            "@type": "Place",
            "name": "Kazakhstan",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "KZ"
            }
          },
          "creator": {
            "@type": "Organization",
            "name": "Tabiat Küzeti Team",
            "url": currentOrigin
          }
        })}
      </script>
    </Helmet>
  );
};

export default HeadMeta;
