import { Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

const MapPage = lazy(() => import("src/modules/MapPage/MapPage"));
const NotFoundPage = lazy(() => import("src/shared/errors/NotFoundPage"));
const ReportPage = lazy(() => import("src/modules/ReportPage/ReportPage"));
const ResearchLibraryPage = lazy(() => import("src/modules/ResearchLibraryPage/ResearchLibraryPage"));

import MainLayout from "src/shared/components/Layout/Layout";
import LandingPage from "src/modules/LandingPage/LandingPage";
import LoadingPage from "src/shared/components/LoadingPage/LoadingPage";
import { I18nProvider } from "src/shared/i18n/I18nProvider";

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.14, ease: "easeIn" },
  },
};

const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ width: "100%", height: "100%" }}
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<LoadingPage />}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
          <Route path="/research" element={<PageWrapper><ResearchLibraryPage /></PageWrapper>} />
          <Route path="/report" element={<PageWrapper><ReportPage /></PageWrapper>} />
          <Route path="/map" element={<PageWrapper><MainLayout><MapPage /></MainLayout></PageWrapper>} />
          <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function App() {
  return (
    <HelmetProvider>
      <I18nProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </I18nProvider>
    </HelmetProvider>
  );
}

export default App;
