import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  BarChart3,
  ClipboardPlus,
  Home,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  RotateCcw,
  SearchCheck,
  ShieldAlert,
  Waves,
} from 'lucide-react';
import { useAppState } from '../state/AppState';
import { getTrackedIncidents } from '../domain/selectors';

const navigation = [
  { to: '/dashboard', label: 'Overview', accessibleLabel: 'Recovery overview', icon: LayoutDashboard },
  { to: '/incidents', label: 'Incidents', accessibleLabel: 'Incident intelligence', icon: SearchCheck },
  { to: '/report', label: 'Report Issue', accessibleLabel: 'Report an issue', icon: ClipboardPlus },
  { to: '/planner', label: 'Planner', accessibleLabel: 'Recovery planner', icon: ListChecks },
  { to: '/map', label: 'Recovery Map', accessibleLabel: 'Recovery map', icon: MapPinned },
  { to: '/analytics', label: 'Analytics', accessibleLabel: 'Impact analytics', icon: BarChart3 },
];

export function AfterRainMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className="brand-mark"
    >
      <defs>
        <linearGradient id="dropGrad" x1="22" y1="4" x2="22" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" />
          <stop offset="0.5" stopColor="#0B4031" />
          <stop offset="1" stopColor="#062319" />
        </linearGradient>
        <linearGradient id="rippleGrad" x1="6" y1="36" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="0.5" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
      {/* Drop body */}
      <path
        d="M22 4.5C18.4 11.3 9 19.7 9 27.1a13 13 0 0 0 26 0C35 19.7 25.6 11.3 22 4.5Z"
        fill="url(#dropGrad)"
      />
      {/* Water shine curve */}
      <path
        d="M14.5 27.2c0 4.2 3.4 7.6 7.5 7.6"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
      {/* Left ripple */}
      <path
        d="M5.8 35.8c3.7 2.6 8.1 3.9 12.8 3.9"
        stroke="url(#rippleGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Right ripple */}
      <path
        d="M25.8 39.1c4.5-.9 8.6-3.2 11.4-6.8"
        stroke="url(#rippleGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function resetScenario(resetDemoData: () => { ok: boolean; error?: string }) {
  if (
    !window.confirm(
      'Restore the original fictional AfterRain demonstration dataset? This replaces the current data saved in this browser. Export any data you want to keep first.'
    )
  )
    return;
  const result = resetDemoData();
  if (!result.ok) window.alert(result.error ?? 'The demo dataset could not be saved.');
}

export function AppShell() {
  const { data, storageError, resetDemoData } = useAppState();
  const location = useLocation();
  const trackedCount = getTrackedIncidents(data).length;
  const current = location.pathname.startsWith('/incidents/')
    ? 'Incident Intelligence'
    : navigation.find((item) => item.to === location.pathname)?.accessibleLabel ?? 'AfterRain';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand-wrapper">
          <NavLink to="/" className="brand-lockup" aria-label="AfterRain home">
            <div className="brand-icon-aura">
              <AfterRainMark size={38} />
            </div>
            <div className="brand-text">
              <strong>AfterRain</strong>
              <small>KERALA CIVIC ECO-LEDGER</small>
            </div>
          </NavLink>
        </div>

        <div className="sidebar-section-label">OPERATIONS WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ to, label, accessibleLabel, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to !== '/incidents'}
              aria-label={accessibleLabel}
              className={({ isActive }) =>
                `nav-link ${
                  isActive || (to === '/incidents' && location.pathname.startsWith('/incidents/'))
                    ? 'active'
                    : ''
                }`
              }
            >
              <Icon size={18} strokeWidth={2} className="nav-icon" />
              <span className="nav-text">{label}</span>
              {to === '/incidents' && (
                <span className="nav-count" aria-label={`${trackedCount} linked incidents`}>
                  {trackedCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/" className="sidebar-home-link">
            <Home size={14} />
            <span>Return to Landing Page</span>
          </Link>

          <div className="side-safety">
            <div className="side-safety-head">
              <ShieldAlert size={14} className="safety-icon" />
              <strong>Ethical Guardrail</strong>
            </div>
            <span>Decision support only. Does not replace emergency dispatch or laboratory testing.</span>
          </div>

          <button
            type="button"
            className="sidebar-reset"
            onClick={() => resetScenario(resetDemoData)}
          >
            <RotateCcw size={14} />
            <span>Restore Demo Dataset</span>
          </button>

          <div className="local-data-note">
            <span className="local-dot" />
            <span>Stored in device localStorage</span>
          </div>

          <div className="sdg-strip" title="United Nations Sustainable Development Goals Alignment">
            <span className="sdg-pill sdg-11-pill">SDG 11</span>
            <span className="sdg-pill">SDG 6</span>
            <span className="sdg-pill">SDG 12</span>
            <span className="sdg-pill">SDG 13</span>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand">
            <NavLink to="/" aria-label="AfterRain home" className="mobile-brand-link">
              <AfterRainMark size={28} />
              <strong>AfterRain</strong>
            </NavLink>
          </div>

          <div className="topbar-breadcrumb">
            <Waves size={16} className="breadcrumb-wave" />
            <span className="breadcrumb-current">{current}</span>
          </div>

          <div className="topbar-right">
            <div className="demo-chip">
              <span className="demo-chip-dot" />
              <span>LIVE LOCAL PROTOCOL</span>
            </div>

            <NavLink to="/report" className="topbar-report-btn">
              <ClipboardPlus size={15} />
              <span>File Observation</span>
            </NavLink>
          </div>
        </header>

        {storageError && (
          <div className="storage-alert" role="alert">
            <ShieldAlert size={18} />
            <span>{storageError}</span>
          </div>
        )}

        <main className="page-content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <div className="footer-left">
            <span>AfterRain — Post-Flood Environmental Recovery Intelligence</span>
            <span className="footer-sep">·</span>
            <span>Human-Reviewed Decision Support</span>
          </div>
          <div className="footer-right">
            <span className="sdg-tag">SDG 11 Primary</span>
            <span className="sdg-tag">SDG 6</span>
            <span className="sdg-tag">SDG 12</span>
            <span className="sdg-tag">SDG 13</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function LandingBrand() {
  return (
    <NavLink to="/" className="landing-brand">
      <AfterRainMark size={40} />
      <span>AfterRain</span>
    </NavLink>
  );
}
