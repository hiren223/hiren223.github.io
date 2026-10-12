import { Toaster } from "@/components/ui/sonner";
import { AppReady, Preloader } from "@/components/portfolio/Preloader";
import React, { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router";
import "./index.css";

const Landing = lazy(() => import("./pages/Landing.tsx"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function RouteLoading() {
  return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
}

function RouteSyncer() {
  const location = useLocation();
  const navigate = useNavigate();
  React.useEffect(() => {
    const stored = sessionStorage.getItem("gh-pages-redirect");
    if (!stored) return;
    sessionStorage.removeItem("gh-pages-redirect");
    if (stored !== location.pathname + location.search) navigate(stored, { replace: true });
  }, [location.pathname, location.search, navigate]);
  return null;
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6"><p>Something went wrong while loading the portfolio. Please refresh the page.</p></div>;
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <RouteSyncer />
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AppReady />
        </Suspense>
      </BrowserRouter>
      <Toaster />
      <Preloader />
    </RootErrorBoundary>
  </StrictMode>,
);
