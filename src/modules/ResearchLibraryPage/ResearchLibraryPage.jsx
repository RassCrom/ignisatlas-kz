import { useDeferredValue, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Filter,
  Map,
  Search,
  Tag,
  X,
} from "lucide-react";
import { useI18n } from "src/shared/i18n/I18nProvider";
import {
  RESEARCH_LIBRARY_COPY,
  RESEARCH_MATERIALS,
  getResearchText,
} from "./researchLibraryData";
import styles from "./ResearchLibraryPage.module.scss";

const MATERIAL_TYPES = ["report", "storytelling"];
const TOPICS = ["fire", "drought", "water", "cryosphere", "land"];
const STATUSES = ["available", "draft", "planned"];

const getCopy = (language) => RESEARCH_LIBRARY_COPY[language] ?? RESEARCH_LIBRARY_COPY.kk;

const createSearchIndex = (material) =>
  [
    ...Object.values(material.title),
    ...Object.values(material.description),
    ...Object.values(material.keywords).flat(),
    material.type,
    material.topic,
    material.status,
    material.period,
  ]
    .join(" ")
    .toLowerCase();

const TypeIcon = ({ type }) => {
  if (type === "storytelling") return <Map size={18} strokeWidth={1.8} />;
  return <FileText size={18} strokeWidth={1.8} />;
};

const ResearchLibraryPage = () => {
  const { language, languages, setLanguage, t } = useI18n();
  const copy = getCopy(language);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return RESEARCH_MATERIALS.filter((material) => {
      const matchesType = type === "all" || material.type === type;
      const matchesTopic = topic === "all" || material.topic === topic;
      const matchesStatus = status === "all" || material.status === status;
      const matchesQuery = !normalizedQuery || createSearchIndex(material).includes(normalizedQuery);

      return matchesType && matchesTopic && matchesStatus && matchesQuery;
    });
  }, [deferredQuery, status, topic, type]);

  const resetFilters = () => {
    setQuery("");
    setType("all");
    setTopic("all");
    setStatus("all");
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{copy.title} - {t("common.brand")}</title>
        <meta name="description" content={copy.lead} />
      </Helmet>

      <header className={styles.header}>
        <a href="/" className={styles.brand} aria-label={t("common.homeAria")}>
          <img src="/hero-tabiat-v2.png" alt={t("common.brand")} />
          <span>{t("common.brand")}</span>
        </a>

        <nav className={styles.nav} aria-label={t("landing.navAria")}>
          <a href="/">{copy.backHome}</a>
          <a href="/map">{copy.map}</a>
        </nav>

        <div className={styles.lang} role="group" aria-label={t("common.languageSelect")}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={language === lang.code ? styles.activeLang : ""}
              onClick={() => setLanguage(lang.code)}
              aria-pressed={language === lang.code}
              title={lang.name}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1>{copy.title}</h1>
            <p>{copy.lead}</p>
          </div>

          <div className={styles.summary} aria-label={copy.results}>
            <div>
              <BarChart3 size={18} />
              <strong>{RESEARCH_MATERIALS.length}</strong>
              <span>{copy.results}</span>
            </div>
            <div>
              <FileText size={18} />
              <strong>{RESEARCH_MATERIALS.filter((item) => item.type === "report").length}</strong>
              <span>{copy.typeLabels.report}</span>
            </div>
            <div>
              <BookOpen size={18} />
              <strong>{RESEARCH_MATERIALS.filter((item) => item.type === "storytelling").length}</strong>
              <span>{copy.typeLabels.storytelling}</span>
            </div>
          </div>
        </section>

        <section className={styles.filters} aria-label={copy.filters}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              type="search"
            />
          </div>

          <div className={styles.selects}>
            <label>
              <Filter size={15} />
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="all">{copy.allTypes}</option>
                {MATERIAL_TYPES.map((value) => (
                  <option key={value} value={value}>{copy.typeLabels[value]}</option>
                ))}
              </select>
            </label>

            <label>
              <Tag size={15} />
              <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option value="all">{copy.allTopics}</option>
                {TOPICS.map((value) => (
                  <option key={value} value={value}>{copy.topicLabels[value]}</option>
                ))}
              </select>
            </label>

            <label>
              <CalendarDays size={15} />
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">{copy.allStatuses}</option>
                {STATUSES.map((value) => (
                  <option key={value} value={value}>{copy.statusLabels[value]}</option>
                ))}
              </select>
            </label>
          </div>

          <button className={styles.reset} type="button" onClick={resetFilters}>
            <X size={15} />
            {copy.reset}
          </button>
        </section>

        <div className={styles.resultCount}>
          {filteredMaterials.length} {copy.results}
        </div>

        {filteredMaterials.length > 0 ? (
          <section className={styles.grid} aria-live="polite">
            {filteredMaterials.map((material) => {
              const title = getResearchText(material.title, language);
              const description = getResearchText(material.description, language);
              const keywords = material.keywords[language] ?? material.keywords.kk;
              const isAvailable = material.status === "available" && material.href;

              return (
                <article key={material.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.icon}>
                      <TypeIcon type={material.type} />
                    </div>
                    <span className={`${styles.status} ${styles[`status_${material.status}`]}`}>
                      {copy.statusLabels[material.status]}
                    </span>
                  </div>

                  <div className={styles.meta}>
                    <span>{copy.typeLabels[material.type]}</span>
                    <span>{copy.topicLabels[material.topic]}</span>
                    <span>{material.period}</span>
                  </div>

                  <h2>{title}</h2>
                  <p>{description}</p>

                  <div className={styles.keywords}>
                    {keywords.map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </div>

                  {isAvailable ? (
                    <a className={styles.action} href={material.href}>
                      {copy.open}
                      <ArrowRight size={16} />
                    </a>
                  ) : (
                    <span className={`${styles.action} ${styles.disabledAction}`}>
                      {copy.comingSoon}
                    </span>
                  )}
                </article>
              );
            })}
          </section>
        ) : (
          <section className={styles.empty} aria-live="polite">
            <Search size={30} />
            <h2>{copy.noResults}</h2>
            <p>{copy.noResultsHint}</p>
          </section>
        )}
      </main>
    </div>
  );
};

export default ResearchLibraryPage;
