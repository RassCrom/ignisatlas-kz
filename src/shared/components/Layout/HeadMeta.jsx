import { Helmet } from "react-helmet-async";

const HeadMeta = () => {
  const baseUrl = "http://localhost:5174/"
  const logoExtens = "logo.webp";
  const logoUrl = `${baseUrl}${logoExtens}`;

  return (
    <Helmet>
      <title>Real-Time Fire Monitoring in Kazakhstan | fires.kz</title>
      <link rel="canonical" href={baseUrl} />
      <meta name="description" content="Track, analyze and monitor wildfires in Kazakhstan in real-time using OpenLayers GIS technology. Stay updated with live fire data and explore archive data." />
      <meta name="keywords" content="Kazakhstan, wildfires, fire monitoring, GIS, real-time data, geoportal, OpenLayers, analysis, archive data" />
      <meta name="robots" content="index, follow" />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={baseUrl} />
      <meta property="og:title" content="Real-Time Fire Monitoring and analysis of past wildfires in Kazakhstan" />
      <meta property="og:description" content="Live wildfire monitoring in Kazakhstan with GIS maps. Track fire locations in real-time. Analyze historical wildfires in Kazakhstan." />
      <meta property="og:image" content={logoUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Real-Time Fire Monitoring and analysis of historical wildfires in Kazakhstan" />
      <meta name="twitter:description" content="Stay updated with real-time wildfire monitoring in Kazakhstan and explore historical wildfire events." />
      <meta name="twitter:image" content={logoUrl} />

      <link rel="preload" as="image" href={`/${logoExtens}`} />
      <link rel="preconnect" href="https://tile.openstreetmap.org" />
      <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Kazakhstan Fire Monitoring Map",
          "description": "Interactive GIS map for real-time fire monitoring and analysis of historical wildfires",
          "applicationCategory": "MappingService",
          "operatingSystem": "Web",
          "url": {baseUrl},
          "copyrightYear": new Date().getFullYear(),
          "spatialCoverage": "Kazakhstan",
          "creator": {
            "@type": "Organization",
            "name": "fires.kz",
            "url": {baseUrl}
          }
        })}
      </script>
    </Helmet>
  );
};

export default HeadMeta;