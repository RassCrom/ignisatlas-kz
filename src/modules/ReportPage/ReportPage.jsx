import { useState, useEffect, lazy, Suspense } from "react";
import Nav from "./components/Nav";
import { navItems } from "./components/navItems";
import Hero from "./sections/Hero/Hero";
import Abstract from "./sections/Abstract/Abstract";
import Regions from "./sections/Regions/Regions";
import Temporal from "./sections/Temporal/Temporal";
import Elevation from "./sections/Elevation/Elevation";
import LandCover from "./sections/LandCover/LandCover";
import Infrastructure from "./sections/Infrastructure/Infrastructure";
import Comparison from "./sections/Comparison/Comparison";
import Conclusions from "./sections/Conclusions/Conclusions";
import ReportFooter from "./components/ReportFooter";
import styles from "./ReportPage.module.scss";

const FireMap = lazy(() => import("./sections/FireMap/FireMap"));

const ReportPage = () => {
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {

    const handleScroll = () => {
      const sections = navItems.map((n) => document.getElementById(n.id)).filter(Boolean);
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].getBoundingClientRect().top < 200) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.report}>
      <Nav activeSection={activeSection} />
      <Hero />
      <Abstract />
      <Regions />
      <Temporal />
      <Elevation />
      <LandCover />
      <Infrastructure />
      <Comparison />
      <Suspense fallback={null}>
        <FireMap />
      </Suspense>
      <Conclusions />
      <ReportFooter />
    </div>
  );
};

export default ReportPage;
