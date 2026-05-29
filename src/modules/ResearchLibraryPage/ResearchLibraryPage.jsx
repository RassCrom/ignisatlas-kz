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
import Footer from "../LandingPage/Sections/Footer/Footer";
import Header from "../LandingPage/Sections/Header/Header";
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
  const { language, t } = useI18n();
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

  const hasActiveFilters = query || type !== "all" || topic !== "all" || status !== "all";

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{copy.title} - {t("common.brand")}</title>
        <meta name="description" content={copy.lead} />
      </Helmet>

      {/* Reuse the Landing page Header component */}
      <Header />

      <main className={styles.main}>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.hero__eyebrow}>
              <span className={styles.eyebrow__dot} aria-hidden="true" />
              <span className={styles.eyebrow__label}>{copy.eyebrow ?? "RESEARCH"}</span>
            </div>
            <h1>{copy.title}</h1>
            <p>{copy.lead}</p>
          </div>

          <div className={styles.summary} aria-label={copy.results}>
            <div className={styles.summaryCard}>
              <BarChart3 size={18} className={styles.summaryCard__icon} />
              <strong>{RESEARCH_MATERIALS.length}</strong>
              <span>{copy.results}</span>
            </div>
            <div className={styles.summaryCard}>
              <FileText size={18} className={styles.summaryCard__icon} />
              <strong>{RESEARCH_MATERIALS.filter((item) => item.type === "report").length}</strong>
              <span>{copy.typeLabels.report}</span>
            </div>
            <div className={styles.summaryCard}>
              <BookOpen size={18} className={styles.summaryCard__icon} />
              <strong>{RESEARCH_MATERIALS.filter((item) => item.type === "storytelling").length}</strong>
              <span>{copy.typeLabels.storytelling}</span>
            </div>
          </div>
        </section>

        {/* ── Filters ── */}
        <section className={styles.filters} aria-label={copy.filters}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchBox__icon} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              type="search"
              aria-label={copy.searchPlaceholder}
            />
            {query && (
              <button
                className={styles.searchBox__clear}
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.selects}>
            <label className={styles.selectLabel}>
              <Filter size={14} className={styles.selectLabel__icon} />
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="all">{copy.allTypes}</option>
                {MATERIAL_TYPES.map((value) => (
                  <option key={value} value={value}>{copy.typeLabels[value]}</option>
                ))}
              </select>
            </label>

            <label className={styles.selectLabel}>
              <Tag size={14} className={styles.selectLabel__icon} />
              <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option value="all">{copy.allTopics}</option>
                {TOPICS.map((value) => (
                  <option key={value} value={value}>{copy.topicLabels[value]}</option>
                ))}
              </select>
            </label>

            <label className={styles.selectLabel}>
              <CalendarDays size={14} className={styles.selectLabel__icon} />
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">{copy.allStatuses}</option>
                {STATUSES.map((value) => (
                  <option key={value} value={value}>{copy.statusLabels[value]}</option>
                ))}
              </select>
            </label>
          </div>

          <button
            className={`${styles.reset} ${hasActiveFilters ? styles["reset--active"] : ""}`}
            type="button"
            onClick={resetFilters}
            aria-label={copy.reset}
          >
            <X size={14} />
            {copy.reset}
          </button>
        </section>

        {/* ── Result count ── */}
        <div className={styles.resultCount} aria-live="polite" aria-atomic="true">
          <span className={styles.resultCount__number}>{filteredMaterials.length}</span>
          {" "}{copy.results}
        </div>

        {/* ── Cards grid ── */}
        {filteredMaterials.length > 0 ? (
          <section className={styles.grid} aria-live="polite">
            {filteredMaterials.map((material) => {
              const title = getResearchText(material.title, language);
              const description = getResearchText(material.description, language);
              const keywords = material.keywords[language] ?? material.keywords.kk;
              const isAvailable = material.status === "available" && material.href;

              return (
                <article key={material.id} className={styles.card}>
                  {/* Card glow for available items */}
                  {isAvailable && <div className={styles.card__glow} aria-hidden="true" />}

                  <div className={styles.cardTop}>
                    <div className={`${styles.icon} ${isAvailable ? styles["icon--active"] : ""}`}>
                      <TypeIcon type={material.type} />
                    </div>
                    <span className={`${styles.status} ${styles[`status_${material.status}`]}`}>
                      {material.status === "available" && (
                        <span className={styles.status__dot} aria-hidden="true" />
                      )}
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
                      <ArrowRight size={15} strokeWidth={2} />
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
            <div className={styles.empty__icon}>
              <Search size={28} strokeWidth={1.5} />
            </div>
            <h2>{copy.noResults}</h2>
            <p>{copy.noResultsHint}</p>
            <button className={styles.empty__reset} type="button" onClick={resetFilters}>
              {copy.reset}
            </button>
          </section>
        )}
      </main>

      {/* Reuse the Landing page Footer */}
      <Footer />
    </div>
  );
};

export default ResearchLibraryPage;
