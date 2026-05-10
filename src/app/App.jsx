import { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

const MapPage = lazy(() => import("src/modules/MapPage/MapPage"));
const NotFoundPage = lazy(() => import("src/shared/errors/NotFoundPage"));

import MainLayout from "src/shared/components/Layout/Layout";
import LandingPage from "src/modules/LandingPage/LandingPage";
import LoadingPage from "src/shared/components/LoadingPage/LoadingPage";
import ReportPage from "../modules/ReportPage/ReportPage";

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/map" element={<MainLayout> <MapPage /> </MainLayout>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </HelmetProvider>
  );
}

export default App;