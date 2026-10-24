import type { ReactNode } from 'react';
import { ArrowUpRight, Clock3, MapPin, MessageSquareText, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category, Incident, IncidentStatus, PriorityBand } from '../domain/types';

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div className="page-heading-content">
        {eyebrow && (
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'green',
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  tone?: 'green' | 'amber' | 'red' | 'ink';
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-hint">{hint}</div>
    </article>
  );
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const tone =
    status === 'Resolved'
      ? 'status-resolved'
      : status === 'Closed or rejected'
      ? 'status-closed'
      : status === 'In progress'
      ? 'status-progress'
      : status === 'Assigned'
      ? 'status-assigned'
      : status === 'Verified'
      ? 'status-verified'
      : status === 'Under review'
      ? 'status-review'
      : 'status-reported';

  return (
    <span className={`status-badge ${tone}`}>
      <span className="status-dot" aria-hidden="true" />
      <span className="status-text">{status}</span>
    </span>
  );
}

export function PriorityBadge({ band }: { band: PriorityBand }) {
  return (
    <span className={`priority-badge priority-${band.toLowerCase()}`}>
      {band === 'High' && <span className="priority-bang" aria-hidden="true">!</span>}
      <span className="priority-text">{band} Priority</span>
    </span>
  );
}

export function CategoryTag({ category }: { category: Category }) {
  const kind = category.includes('Waste')
    ? 'waste'
    : category.includes('Water') || category.includes('Sewage')
    ? 'water'
    : category.includes('Road') || category.includes('facilities')
    ? 'infrastructure'
    : 'other';

  return (
    <span className={`category-tag category-${kind}`}>
      <span className="category-dot" />
      <span>{category}</span>
    </span>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`section-card ${className}`}>
      <div className="section-card-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-mark" aria-hidden="true">
        <Sparkles size={20} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export function IncidentCard({
  incident,
  reportCount,
  mostRecentReportAt,
  compact = false,
}: {
  incident: Incident;
  reportCount?: number;
  mostRecentReportAt?: string;
  compact?: boolean;
}) {
  return (
    <Link
      className={`incident-card ${compact ? 'incident-card-compact' : ''}`}
      to={`/incidents/${incident.id}`}
    >
      <div className="incident-card-top">
        <span className="incident-id">{incident.id}</span>
        <PriorityBadge band={incident.scores.priorityBand} />
      </div>
      <div className="incident-card-title-row">
        <h3>{incident.title}</h3>
        <ArrowUpRight size={16} aria-hidden="true" className="title-arrow" />
      </div>
      <div className="incident-card-tags">
        <CategoryTag category={incident.category} />
        <StatusBadge status={incident.status} />
      </div>
      <p className="incident-card-description">{incident.description}</p>
      <div className="incident-card-meta">
        <span>
          <MapPin size={13} />
          {incident.locationName}
        </span>
        <span>
          <MessageSquareText size={13} />
          {reportCount ?? incident.reportIds.length} report
          {(reportCount ?? incident.reportIds.length) === 1 ? '' : 's'}
        </span>
        <span>
          <Clock3 size={13} />
          {formatDate(mostRecentReportAt ?? incident.updatedAt)}
        </span>
      </div>
      <div className="incident-card-scores">
        <div className="score-stat">
          <span>Severity</span>
          <strong>
            {incident.scores.severity}
            <small>/100</small>
          </strong>
        </div>
        <div className="score-stat">
          <span>Priority</span>
          <strong>
            {incident.scores.priority}
            <small>/100</small>
          </strong>
        </div>
        <div className="score-confidence">{incident.scores.severityConfidence} Score</div>
      </div>
      {!compact && (
        <div className="incident-card-reason">
          <strong>Decision Basis:</strong>
          <span>{incident.scores.explanation}</span>
        </div>
      )}
      <div className="incident-card-action">
        <strong>Recommended Protocol:</strong>
        <span>
          {incident.category === 'Possible water contamination'
            ? 'Request qualified water-quality inspection; keep the observation unverified.'
            : incident.category === 'Waterlogging and drainage'
            ? 'Schedule authorized drainage inspection and clearance.'
            : incident.category === 'Waste and debris'
            ? 'Plan a safe cleanup and segregate recoverable materials.'
            : incident.category === 'Sewage overflow'
            ? 'Escalate to the responsible sanitation authority.'
            : 'Route to the relevant qualified maintenance or recovery team.'}
        </span>
      </div>
    </Link>
  );
}

export function ScoreNote({ children }: { children: ReactNode }) {
  return (
    <details className="score-note">
      <summary>How scores work</summary>
      <div>{children}</div>
    </details>
  );
}

export function formatDate(value: string, withTime = false): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat(
    'en',
    withTime
      ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric' }
  ).format(date);
}

export function StatusLabel({ status }: { status: IncidentStatus }) {
  return <span className="status-label">{status}</span>;
}
