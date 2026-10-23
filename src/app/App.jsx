import { Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router, useLocation, useRoutes } from "react-router-dom";
import "./App.css";

const MapPage = lazy(() => import("src/modules/MapPage/MapPage"));
const NotFoundPage = lazy(() => import("src/shared/errors/NotFoundPage"));
const ReportPage = lazy(() => import("src/modules/ReportPage/ReportPage"));
const ResearchLibraryPage = lazy(() => import("src/modules/ResearchLibraryPage/ResearchLibraryPage"));

import MainLayout from "src/shared/components/Layout/Layout";
import LandingPage from "src/modules/LandingPage/LandingPage";
import LoadingPage from "src/shared/components/LoadingPage/LoadingPage";
import { splitLocalePath } from "src/i18n/paths";
import { createAppRoutes } from "./routes";

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

function LegacyMap() {
  return (
    <MainLayout>
      <MapPage />
    </MainLayout>
  );
}

// The old pages the locale-prefixed routes still serve (see routes.jsx).
const PAGES = {
  Landing: LandingPage,
  LegacyMap,
  Report: ReportPage,
  Research: ResearchLibraryPage,
  NotFound: NotFoundPage,
  // Dev-only feasibility page (/:lang/dev/globe-spike). import.meta.env.DEV is a literal `false` in
  // the production build, so the branch and the deck.gl code behind it are dropped from the bundle.
  ...(import.meta.env.DEV ? { GlobeSpike: lazy(() => import("src/dev/GlobeSpike")) } : {}),
};

const ROUTES = createAppRoutes(PAGES);

function PageRoutes({ location }) {
  const routes = useRoutes(ROUTES, location);
  return <PageWrapper>{routes}</PageWrapper>;
}

function AnimatedRoutes() {
  const location = useLocation();
  // The page changes with the path after the language prefix. Switching only the language
  // ('/ru/map/legacy' -> '/en/map/legacy') keeps the same key, so the page is re-rendered in place
  // instead of being faded out and mounted again (which would reload the map).
  const pageKey = splitLocalePath(location.pathname).rest;
  return (
    <Suspense fallback={<LoadingPage />}>
      <AnimatePresence mode="wait" initial={false}>
        <PageRoutes location={location} key={pageKey} />
      </AnimatePresence>
    </Suspense>
  );
}

// I18nProvider and LocaleProvider need the router, so LocaleLayout mounts them per language route.
function App() {
  return (
    <HelmetProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </HelmetProvider>
  );
}

export default App;
