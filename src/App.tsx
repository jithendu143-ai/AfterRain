import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';

const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage').then((module) => ({ default: module.IncidentsPage })));
const ReportPage = lazy(() => import('./pages/ReportPage').then((module) => ({ default: module.ReportPage })));
const IncidentPage = lazy(() => import('./pages/IncidentPage').then((module) => ({ default: module.IncidentPage })));
const MapPage = lazy(() => import('./pages/MapPage').then((module) => ({ default: module.MapPage })));
const PlannerPage = lazy(() => import('./pages/PlannerPage').then((module) => ({ default: module.PlannerPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

function PageLoader() {
  return <div className="page-loading" role="status"><span className="spinner" />Loading recovery workspace…</div>;
}

export function App() {
  return <Suspense fallback={<PageLoader />}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route element={<AppShell />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/incidents" element={<IncidentsPage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/incidents/:id" element={<IncidentPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate replace to="/not-found" />} />
    </Route>
  </Routes></Suspense>;
}
