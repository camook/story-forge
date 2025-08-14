import React, { Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";

const TimePanel = React.lazy(() => import("./components/TimePanel").then(m => ({ default: m.TimePanel })));

export function App() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="site-header">
        <div className="container">
          <div className="brand">
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d="M3 5h18v2H3V5zm2 4h14v2H5V9zm-2 4h18v2H3v-2zm2 4h10v2H5v-2z" />
            </svg>
            <strong>Story Forge</strong>
          </div>
        </div>
      </header>
      <main id="main" className="container" role="main">
        <ErrorBoundary>
          <Suspense fallback={<div className="panel" aria-live="polite">Loading module…</div>}>
            <TimePanel />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="container" role="contentinfo">
        <p className="muted">Built with React + Hono on Cloudflare Workers</p>
      </footer>
    </>
  );
}
