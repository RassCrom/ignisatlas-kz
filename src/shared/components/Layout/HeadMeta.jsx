import { Helmet } from "react-helmet-async";
import { useI18n } from "src/shared/i18n/I18nProvider";

const HeadMeta = () => {
  const { languageConfig, t } = useI18n();
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://fires.kz";
  const canonicalUrl = typeof window !== "undefined" ? window.location.href : "https://fires.kz/map/";
  const logoUrl = `${currentOrigin}/temp_logo.png`;

  return (
    <Helmet>
      <html lang={languageConfig.htmlLang} />
      <title>{t("meta.title")}</title>
      <link rel="canonical" href={canonicalUrl} />

      <meta name="description" content={t("meta.description")} />
      <meta name="keywords" content={t("meta.keywords")} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content={`${t("common.brand")} Team`} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={t("common.brand")} />
      <meta property="og:title" content={t("meta.ogTitle")} />
      <meta property="og:description" content={t("meta.ogDescription")} />
      <meta property="og:image" content={logoUrl} />
      <meta property="og:locale" content={languageConfig.locale.replace("-", "_")} />
      <meta property="og:locale:alternate" content="kk_KZ" />
      <meta property="og:locale:alternate" content="ru_RU" />
      <meta property="og:locale:alternate" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t("meta.twitterTitle")} />
      <meta name="twitter:description" content={t("meta.twitterDescription")} />
      <meta name="twitter:image" content={logoUrl} />

      <link rel="preconnect" href="https://tile.openstreetmap.org" />
      <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
      <link rel="preconnect" href="https://api.open-meteo.com" />
      <link rel="dns-prefetch" href="https://api.open-meteo.com" />
      <link rel="preconnect" href="https://api.openweathermap.org" />
      <link rel="dns-prefetch" href="https://api.openweathermap.org" />

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: t("common.brand"),
          alternateName: t("meta.alternateName", []),
          description: t("meta.appDescription"),
          applicationCategory: "GISMappingApplication",
          operatingSystem: "All",
          url: currentOrigin,
          image: logoUrl,
          copyrightYear: new Date().getFullYear(),
          inLanguage: languageConfig.htmlLang,
          spatialCoverage: {
            "@type": "Place",
            name: "Kazakhstan",
            address: {
              "@type": "PostalAddress",
              addressCountry: "KZ",
            },
          },
          creator: {
            "@type": "Organization",
            name: `${t("common.brand")} Team`,
            url: currentOrigin,
          },
        })}
      </script>
    </Helmet>
  );
};

export default HeadMeta;
