import { useMemo, useState } from 'react';
import { ArrowUpRight, Clock3, MapPin, MessageSquareText, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AppData, Category, Incident } from '../domain/types';
import { CategoryTag, EmptyState, PriorityBadge, StatusBadge, formatDate } from './ui';

const filters = [
  'All incidents',
  'High priority',
  'Unresolved',
  'Resolved',
  'Environmental waste',
  'Water and drainage',
  'Infrastructure damage',
  'Other',
] as const;
type Filter = (typeof filters)[number];

function matchesFilter(incident: Incident, filter: Filter): boolean {
  if (filter === 'All incidents') return true;
  if (filter === 'High priority') return incident.scores.priorityBand === 'High';
  if (filter === 'Unresolved') return incident.status !== 'Resolved' && incident.status !== 'Closed or rejected';
  if (filter === 'Resolved') return incident.status === 'Resolved';
  if (filter === 'Environmental waste') return incident.category === 'Waste and debris';
  if (filter === 'Water and drainage')
    return (
      incident.category === 'Waterlogging and drainage' ||
      incident.category === 'Possible water contamination' ||
      incident.category === 'Sewage overflow'
    );
  if (filter === 'Infrastructure damage')
    return incident.category === 'Road or infrastructure damage' || incident.category === 'Damaged public facilities';
  return incident.category === 'Other environmental recovery issue';
}

function recommendation(category: Category): string {
  if (category === 'Possible water contamination')
    return 'Request qualified water-quality inspection; keep the observation unverified.';
  if (category === 'Waterlogging and drainage')
    return 'Schedule authorized drainage inspection and clearance.';
  if (category === 'Waste and debris')
    return 'Plan safe cleanup and segregate recoverable materials.';
  if (category === 'Sewage overflow')
    return 'Escalate to the responsible sanitation authority.';
  if (category === 'Road or infrastructure damage' || category === 'Damaged public facilities')
    return 'Route to the relevant qualified maintenance team.';
  return 'Review the observation and route it to an appropriate recovery team.';
}

function mostRecentReportAt(data: AppData, incidentId: string): string | undefined {
  return data.reports
    .filter((report) => report.linkedIncidentId === incidentId)
    .map((report) => report.observedAt)
    .sort()
    .at(-1);
}

export function IncidentQueue({ data, incidents }: { data: AppData; incidents: Incident[] }) {
  const [filter, setFilter] = useState<Filter>('All incidents');
  const [query, setQuery] = useState('');
  const sorted = useMemo(() => [...incidents].sort((a, b) => b.scores.priority - a.scores.priority), [incidents]);
  const filtered = sorted.filter((incident) => {
    if (!matchesFilter(incident, filter)) return false;
    const haystack = `${incident.id} ${incident.title} ${incident.description} ${incident.category} ${incident.locationName}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="incident-queue-container">
      <div className="queue-tools">
        <label className="search-field">
          <Search size={16} className="search-icon" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search incident ID, title, description, category, or location…"
            aria-label="Search incidents"
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </label>
        <div className="queue-count-badge">
          <span>SHOWING</span>
          <strong>{filtered.length}</strong>
          <small>of {incidents.length}</small>
        </div>
      </div>

      <div className="filter-row" role="group" aria-label="Filter incidents">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            className={`filter-chip ${filter === item ? 'active' : ''}`}
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
          >
            {item}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="priority-queue-list">
          {filtered.map((incident) => {
            const recent = mostRecentReportAt(data, incident.id);
            return (
              <Link
                className={`priority-queue-card band-${incident.scores.priorityBand.toLowerCase()}`}
                key={incident.id}
                to={`/incidents/${incident.id}`}
              >
                <div className="queue-card-score-box">
                  <span className="score-pill-number">{incident.scores.priority}</span>
                  <span className="score-pill-label">PRIORITY</span>
                  <div className="score-mini-meter">
                    <div
                      className="score-mini-fill"
                      style={{ width: `${incident.scores.priority}%` }}
                    />
                  </div>
                </div>

                <div className="queue-card-main-col">
                  <div className="queue-card-top-row">
                    <div className="queue-card-id-cluster">
                      <span className="incident-id-tag">{incident.id}</span>
                      <PriorityBadge band={incident.scores.priorityBand} />
                      <CategoryTag category={incident.category} />
                      <StatusBadge status={incident.status} />
                    </div>
                    <ArrowUpRight size={16} className="queue-arrow-icon" />
                  </div>

                  <h3 className="queue-card-title">{incident.title}</h3>

                  <p className="queue-card-description">{incident.description}</p>

                  <div className="queue-card-meta-line">
                    <span className="meta-item">
                      <MapPin size={13} />
                      <strong>{incident.locationName}</strong>
                    </span>
                    <span className="meta-divider">·</span>
                    <span className="meta-item">
                      <MessageSquareText size={13} />
                      <span>
                        {incident.reportIds.length} Linked Report
                        {incident.reportIds.length === 1 ? '' : 's'}
                      </span>
                    </span>
                    <span className="meta-divider">·</span>
                    <span className="meta-item severity-chip">
                      <b>SEV</b> {incident.scores.severity}/100
                    </span>
                    {recent && (
                      <>
                        <span className="meta-divider">·</span>
                        <span className="meta-item">
                          <Clock3 size={13} />
                          <span>Reported {formatDate(recent, true)}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="queue-card-reason-callout">
                    <div className="reason-item">
                      <span className="reason-label">Scoring Basis:</span>
                      <span className="reason-text">{incident.scores.explanation}</span>
                    </div>
                    <div className="reason-item action-item">
                      <span className="reason-label">Recommended Step:</span>
                      <span className="reason-text">{recommendation(incident.category)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No incidents match this view"
          description="Adjust your search query or filter tags to discover other post-flood observations."
          action={
            <Link className="btn btn-secondary btn-sm" to="/report">
              Submit New Observation
            </Link>
          }
        />
      )}
    </div>
  );
}
