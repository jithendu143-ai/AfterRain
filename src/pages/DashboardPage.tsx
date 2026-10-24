import { lazy, Suspense, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Layers,
  MapPin,
  SearchCheck,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import type { Category } from '../domain/types';
import { detectEnvironmentalHotspots } from '../domain/hotspots';
import { canReceiveReports, validCoordinates } from '../domain/engine';
import { getTrackedIncidents } from '../domain/selectors';
import { IncidentQueue } from '../components/IncidentQueue';
import { PageHeading, formatDate } from '../components/ui';

const chartColors = ['#059669', '#10B981', '#D97706', '#0284C7', '#6366F1', '#8B5CF6', '#EC4899'];
const DashboardMapPreview = lazy(() =>
  import('../components/MapPreview').then((module) => ({ default: module.MapPreview }))
);

export function DashboardPage() {
  const { data, reviewRelationship } = useAppState();
  const [reviewMessage, setReviewMessage] = useState('');
  const trackedIncidents = useMemo(() => getTrackedIncidents(data), [data]);
  const trackedIds = useMemo(() => new Set(trackedIncidents.map((incident) => incident.id)), [trackedIncidents]);
  const high = trackedIncidents.filter((incident) => incident.scores.priorityBand === 'High').length;
  const unresolved = trackedIncidents.filter(
    (incident) => incident.status !== 'Resolved' && incident.status !== 'Closed or rejected'
  ).length;
  const openTasks = data.tasks.filter(
    (task) => trackedIds.has(task.incidentId) && task.status !== 'Resolved' && task.status !== 'Closed or rejected'
  ).length;
  const completed = data.tasks.filter((task) => task.status === 'Resolved').length;
  const totalTasks = data.tasks.length;
  const progress = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
  const pending = data.relationships.filter((relationship) => relationship.status === 'proposed');
  const hotspots = detectEnvironmentalHotspots(data);

  const categoryData = useMemo(() => {
    const counts = new Map<Category, number>();
    trackedIncidents.forEach((incident) =>
      counts.set(incident.category, (counts.get(incident.category) ?? 0) + 1)
    );
    return [...counts.entries()].map(([name, value]) => ({
      name: name.replace(' and ', ' & ').replace('Possible ', ''),
      value,
    }));
  }, [trackedIncidents]);

  const statusData = useMemo(() => {
    const counts = new Map<string, number>();
    trackedIncidents.forEach((incident) => counts.set(incident.status, (counts.get(incident.status) ?? 0) + 1));
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  }, [trackedIncidents]);

  const locations = useMemo(() => {
    const groups = new Map<string, number>();
    trackedIncidents.forEach((incident) =>
      groups.set(incident.locationName, (groups.get(incident.locationName) ?? 0) + 1)
    );
    return [...groups.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
  }, [trackedIncidents]);

  const coordinateIncidents = useMemo(
    () => trackedIncidents.filter((incident) => validCoordinates(incident.latitude, incident.longitude)),
    [trackedIncidents]
  );

  function decide(relationshipId: string, decision: 'confirmed' | 'rejected') {
    const result = reviewRelationship(
      relationshipId,
      decision,
      `Coordinator ${decision === 'confirmed' ? 'confirmed' : 'rejected'} from Recovery overview.`
    );
    setReviewMessage(
      result.ok
        ? decision === 'confirmed'
          ? 'Relationship confirmed; source reports remain preserved.'
          : 'Suggestion separated into a new incident; source report remains preserved.'
        : result.error ?? 'The relationship decision was not saved.'
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="RECOVERY OPERATIONS · OVERVIEW"
        title="Recovery Command Overview"
        description="Monitor verified field incidents, resolve triage bottlenecks, and maintain continuous accountability as floodwaters recede."
        action={
          <Link className="btn btn-primary btn-glow" to="/report">
            <ClipboardList size={15} />
            <span>File New Observation</span>
          </Link>
        }
      />

      <div className="demo-data-note">
        <span className="demo-chip-dot" />
        <span className="demo-note-main">
          <strong>Interactive Demo Environment</strong> · Seeded post-flood incident scenario
        </span>
        <span className="local-data-note-inline">
          Local browser persistence active · Updates persist immediately
        </span>
      </div>

      {/* Modern KPI Cards Grid */}
      <section className="overview-metrics" aria-label="Recovery overview metrics">
        <article className="overview-metric-card metric-card-reports">
          <div className="metric-header">
            <span className="metric-title">Field Reports</span>
            <div className="metric-icon-badge badge-green">
              <ClipboardList size={18} />
            </div>
          </div>
          <strong className="metric-stat">{data.reports.length}</strong>
          <small className="metric-subtext">Original citizen observations</small>
        </article>

        <article className="overview-metric-card metric-card-incidents">
          <div className="metric-header">
            <span className="metric-title">Unique Incidents</span>
            <div className="metric-icon-badge badge-teal">
              <Layers size={18} />
            </div>
          </div>
          <strong className="metric-stat">{trackedIncidents.length}</strong>
          <small className="metric-subtext">Grouped multi-report clusters</small>
        </article>

        <article className="overview-metric-card metric-card-high">
          <div className="metric-header">
            <span className="metric-title">High Priority</span>
            <div className="metric-icon-badge badge-amber">
              <ShieldAlert size={18} />
            </div>
          </div>
          <strong className="metric-stat">{high}</strong>
          <small className="metric-subtext">Requires priority dispatch</small>
        </article>

        <article className="overview-metric-card metric-card-tasks">
          <div className="metric-header">
            <span className="metric-title">Active Tasks</span>
            <div className="metric-icon-badge badge-blue">
              <TrendingUp size={18} />
            </div>
          </div>
          <strong className="metric-stat">{openTasks}</strong>
          <small className="metric-subtext">Assigned to field teams</small>
        </article>

        <article className="overview-metric-card metric-card-resolved">
          <div className="metric-header">
            <span className="metric-title">Tasks Closed</span>
            <div className="metric-icon-badge badge-emerald">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <strong className="metric-stat">{completed}</strong>
          <small className="metric-subtext">Verified with completion proof</small>
        </article>
      </section>

      {/* Dashboard Two-Column Workspace */}
      <div className="recovery-overview-grid">
        {/* Left Column: Priority Incident Queue */}
        <section className="priority-workspace" id="priority-queue" aria-label="Priority incident queue">
          <div className="workspace-section-head">
            <div>
              <span className="eyebrow">ACTIVE TRIAGE QUEUE</span>
              <h2>Operational Incident Register</h2>
              <p>Ranked deterministically by 5-factor severity &amp; urgency heuristic.</p>
            </div>
            <Link className="text-link" to="/incidents">
              <span>Full Intelligence Register</span>
              <SearchCheck size={14} />
            </Link>
          </div>

          <IncidentQueue data={data} incidents={trackedIncidents} />

          <details className="score-note overview-score-note">
            <summary>Examine Transparent Scoring Algorithm</summary>
            <div>
              <strong>Severity Formula (0–100):</strong> 35% reported impact + 25% potential environmental harm +
              20% immediate public-safety concern + 10% infrastructure disruption + 10% supporting evidence /
              verification.
              <br />
              <strong>Operational Priority Formula (0–100):</strong> 50% severity + 20% time sensitivity + 15%
              environmental sensitivity + 15% recurrence / persistence.
              <br />
              <em>
                Designed as explainable civic decision support; never supersedes emergency response (911/112) or
                certified scientific water-quality lab tests.
              </em>
            </div>
          </details>
        </section>

        {/* Right Column: Support & Environmental Intelligence */}
        <aside className="recovery-support" aria-label="Recovery status and environmental overview">
          {/* Deduplication Review Section */}
          <section className="support-section">
            <div className="support-heading">
              <div>
                <span className="eyebrow">COORDINATOR REVIEW</span>
                <h2>Candidate Relationships</h2>
              </div>
              {pending.length > 0 && <span className="attention-count">{pending.length} Pending</span>}
            </div>

            {pending.length ? (
              <div className="pending-list">
                {pending.map((relationship) => {
                  const report = data.reports.find((item) => item.id === relationship.reportId);
                  const incident = data.incidents.find((item) => item.id === relationship.incidentId);
                  if (!report || !incident) return null;
                  return (
                    <article className="pending-item" key={relationship.id}>
                      <div className="pending-item-top">
                        <span className="review-kind">{relationship.kind}</span>
                        <Link className="incident-id" to={`/incidents/${incident.id}`}>
                          {incident.id}
                        </Link>
                      </div>
                      <strong>{report.title}</strong>
                      <p>{relationship.rationale}</p>
                      {!canReceiveReports(incident.status) && (
                        <small className="field-help">
                          Target is resolved or closed; keep this observation separate.
                        </small>
                      )}
                      <div className="review-card-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={!canReceiveReports(incident.status)}
                          title={
                            !canReceiveReports(incident.status)
                              ? 'Resolved or closed incidents cannot accept new reports.'
                              : undefined
                          }
                          onClick={() => decide(relationship.id, 'confirmed')}
                        >
                          Confirm Link
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => decide(relationship.id, 'rejected')}
                        >
                          Separate
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="support-empty">No pending candidate relationships. Suggestions appear when incoming reports match known locations or text.</p>
            )}
            {reviewMessage && (
              <p className="support-feedback" role="status">
                {reviewMessage}
              </p>
            )}
          </section>

          {/* Spatial Coordinates Map / Location Explorer */}
          <section className="support-section">
            <div className="support-heading">
              <div>
                <span className="eyebrow">GEOGRAPHIC CONTEXT</span>
                <h2>Incident Coordinates</h2>
              </div>
              <Link className="icon-link" to="/map" aria-label="Open recovery map">
                <MapPin size={15} />
              </Link>
            </div>

            {coordinateIncidents.length ? (
              <Suspense
                fallback={
                  <div className="mini-map-loading" role="status">
                    Loading submitted coordinates…
                  </div>
                }
              >
                <DashboardMapPreview incidents={coordinateIncidents} />
              </Suspense>
            ) : locations.length ? (
              <div className="location-list">
                {locations.map(([name, count]) => (
                  <div className="location-row" key={name}>
                    <span>
                      <MapPin size={13} />
                      {name}
                    </span>
                    <strong>
                      {count} incident{count === 1 ? '' : 's'}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="support-empty">Locations will appear when incidents are reported.</p>
            )}
            <p className="support-footnote">
              {coordinateIncidents.length
                ? 'Displaying valid submitted coordinates only. No synthetic or interpolated GPS pins.'
                : 'Place names are qualitative. Map pins render only when reporters provide coordinates.'}
            </p>
          </section>

          {/* Category Distribution Chart */}
          <section className="support-section support-viz-section">
            <div className="support-heading">
              <div>
                <span className="eyebrow">CLASSIFICATION BREAKDOWN</span>
                <h2>Incident Categories</h2>
              </div>
            </div>

            {categoryData.length ? (
              <div className="compact-chart">
                <ResponsiveContainer width="100%" height={135}>
                  <BarChart data={categoryData} margin={{ top: 6, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: 8,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                        fontSize: 11,
                        background: '#FFFFFF',
                      }}
                    />
                    <Bar dataKey="value" name="Incidents" radius={[4, 4, 0, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="category-key">
                  {categoryData.map((entry, index) => (
                    <span key={entry.name}>
                      <i style={{ background: chartColors[index % chartColors.length] }} />
                      <span className="cat-key-name">{entry.name}</span>
                      <b>{entry.value}</b>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="support-empty">No categories recorded yet.</p>
            )}
          </section>

          {/* Status & Recovery Progress */}
          <section className="support-section status-progress-section">
            <div className="support-heading">
              <div>
                <span className="eyebrow">RECOVERY MOMENTUM</span>
                <h2>Workflow Status</h2>
              </div>
            </div>

            <div className="unresolved-count">
              <span>Unresolved Incidents</span>
              <strong>{unresolved}</strong>
            </div>

            {statusData.length ? (
              <div className="status-distribution">
                {statusData.map((item, index) => (
                  <div className="status-distribution-row" key={item.name}>
                    <span>
                      <i style={{ background: chartColors[index % chartColors.length] }} />
                      {item.name}
                    </span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="support-empty">Status information will appear here.</p>
            )}

            <div className="task-progress-summary">
              <div className="progress-label-row">
                <span>Task Resolution Rate</span>
                <strong>
                  {completed} / {totalTasks} ({progress}%)
                </strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <small>Counts represent verified coordination actions, not synthetic environmental savings.</small>
            </div>
          </section>

          {/* Environmental Hotspots */}
          <section className="support-section hotspot-support">
            <div className="support-heading">
              <div>
                <span className="eyebrow">MULTI-INCIDENT SIGNAL</span>
                <h2>Potential Hotspots</h2>
              </div>
              <AlertTriangle size={15} className="hotspot-alert-icon" />
            </div>

            {hotspots.length ? (
              hotspots.map((cluster) => (
                <div className="compact-hotspot" key={cluster.id}>
                  <strong>{cluster.incidentIds.length} Linked Incidents</strong>
                  <span>{cluster.categories.join(' · ')}</span>
                  <small>
                    {formatDate(cluster.firstObservedAt)} — {formatDate(cluster.lastObservedAt)} ·{' '}
                    {cluster.coordinateLinks ? `${cluster.coordinateLinks} coordinate links` : 'place-name signal'}
                  </small>
                  <div className="hotspot-links">
                    {cluster.incidentIds.map((incidentId) => (
                      <Link key={incidentId} to={`/incidents/${incidentId}`}>
                        {incidentId}
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="support-empty">No multi-incident location clusters detected. Spatial proximity alone cannot prove shared cause.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
