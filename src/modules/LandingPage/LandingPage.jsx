import { MotionConfig } from "framer-motion";
import styles from "./LandingPage.module.scss";
import Header from "./Sections/Header/Header";
import Hero from "./Sections/Hero/Hero";
import Features from "./Sections/Features/Features";
import DataCoverage from "./Sections/DataCoverage/DataCoverage";
import Audience from "./Sections/Audience/Audience";
import TechStack from "./Sections/TechStack/TechStack";
import Research from "./Sections/Research/Research";
import Footer from "./Sections/Footer/Footer";

const LandingPage = () => (
  <MotionConfig reducedMotion="user">
    <div className={styles.landing}>
        <Header />
        <Hero />
        <main className={styles.main}>
            <Features />
            <DataCoverage />
            <Audience />
            <TechStack />
            <Research />
        </main>
        <Footer />
    </div>
  </MotionConfig>
);

export default LandingPage;
