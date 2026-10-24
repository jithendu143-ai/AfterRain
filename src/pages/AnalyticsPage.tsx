import { useMemo } from 'react';
import { AlertTriangle, Download, FileSpreadsheet, Hourglass, ListChecks, Waves } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppState } from '../state/AppState';
import { getTrackedIncidents } from '../domain/selectors';
import { quoteCsvCell } from '../domain/csv';
import { MetricCard, PageHeading, SectionCard } from '../components/ui';

function averageDuration(events: { entityId: string; newStatus: string; timestamp: string }[], startStatus: string, endStatus: string): number | null {
  const durations: number[] = [];
  const entities = new Set(events.filter((event) => event.newStatus === endStatus).map((event) => event.entityId));
  for (const id of entities) {
    const matching = events.filter((event) => event.entityId === id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const start = matching.find((event) => event.newStatus === startStatus);
    const end = matching.find((event) => event.newStatus === endStatus && (!start || new Date(event.timestamp) >= new Date(start.timestamp)));
    if (start && end) durations.push((new Date(end.timestamp).getTime() - new Date(start.timestamp).getTime()) / 3600000);
  }
  return durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null;
}

function durationLabel(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = hours / 24;
  return `${days < 10 ? days.toFixed(1) : Math.round(days)} d`;
}

function exportCsv(data: ReturnType<typeof useAppState>['data']) {
  const headers = ['incident_id', 'title', 'category', 'location', 'status', 'severity_score', 'priority_score', 'priority_band', 'linked_reports', 'assigned_team', 'created_at', 'updated_at', 'resolution_notes'];
  const rows = getTrackedIncidents(data).map((incident) => [incident.id, incident.title, incident.category, incident.locationName, incident.status, incident.scores.severity, incident.scores.priority, incident.scores.priorityBand, incident.reportIds.length, incident.assignedTeam ?? '', incident.createdAt, incident.updatedAt, incident.resolutionNotes ?? ''].map(quoteCsvCell).join(','));
  const content = `\uFEFF${headers.join(',')}\r\n${rows.join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `afterrain-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AnalyticsPage() {
  const { data } = useAppState();
  const trackedIncidents = getTrackedIncidents(data);
  const trackedIds = new Set(trackedIncidents.map((incident) => incident.id));
  const duplicateCount = data.relationships.filter((relationship) => relationship.status === 'confirmed' && relationship.kind !== 'related report' && data.reports.some((report) => report.id === relationship.reportId && report.linkedIncidentId === relationship.incidentId)).length;
  const verified = new Set(data.history.filter((event) => event.entityType === 'incident' && event.newStatus === 'Verified' && trackedIds.has(event.entityId)).map((event) => event.entityId));
  const resolvedTasks = data.tasks.filter((task) => task.status === 'Resolved');
  const wasteCompleted = resolvedTasks.filter((task) => task.taskType === 'waste_cleanup').length;
  const waterRequests = data.tasks.filter((task) => task.taskType === 'water_quality_request').length;
  const assignmentTime = averageDuration(data.history.filter((event) => event.entityType === 'incident'), 'Reported', 'Assigned');
  const resolutionTime = averageDuration(data.history.filter((event) => event.entityType === 'incident'), 'Assigned', 'Resolved');
  const chartData = useMemo(() => {
    const created = new Map<string, number>();
    const resolved = new Map<string, number>();
    trackedIncidents.forEach((incident) => { const key = incident.createdAt.slice(0, 10); created.set(key, (created.get(key) ?? 0) + 1); });
    data.history.filter((event) => event.entityType === 'incident' && event.newStatus === 'Resolved' && trackedIds.has(event.entityId)).forEach((event) => { const key = event.timestamp.slice(0, 10); resolved.set(key, (resolved.get(key) ?? 0) + 1); });
    const keys = [...new Set([...created.keys(), ...resolved.keys()])].sort();
    if (keys.length < 7) {
      const end = keys.length ? new Date(`${keys[keys.length - 1]}T12:00:00`) : new Date();
      const start = keys.length ? new Date(`${keys[0]}T12:00:00`) : new Date(end);
      while (Math.floor((end.getTime() - start.getTime()) / 86400000) < 6) start.setDate(start.getDate() - 1);
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) keys.push(date.toISOString().slice(0, 10));
    }
    return [...new Set(keys)].sort().map((key) => ({ date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${key}T12:00:00`)), created: created.get(key) ?? 0, resolved: resolved.get(key) ?? 0 }));
  }, [data.history, data.incidents, trackedIncidents, trackedIds]);

  return <>
    <PageHeading eyebrow="MEASURE THE RECOVERY PROCESS" title="Impact & recovery analytics" description="Operational counts and elapsed times are calculated from saved reports, tasks, and status history—not estimated environmental savings." action={<button className="btn btn-primary" onClick={() => exportCsv(data)}><Download size={14} />Export incident CSV</button>} />
    <div className="analytics-grid"><MetricCard label="Reports submitted" value={data.reports.length} hint="Individual observations" icon={<FileSpreadsheet size={15} />} tone="ink" /><MetricCard label="Unique incidents" value={trackedIncidents.length} hint="Current coordinator-linked records" icon={<Waves size={15} />} tone="green" /><MetricCard label="Duplicate reports linked" value={duplicateCount} hint="Coordinator-confirmed current links" icon={<ListChecks size={15} />} tone="amber" /><MetricCard label="Incidents verified" value={verified.size} hint="Coordinator status history" icon={<AlertTriangle size={15} />} tone="green" /></div>
    <div className="analytics-layout">
      <SectionCard title="Incidents created and resolved over time" subtitle="Counts by date from incident creation and resolved status timestamps."><div className="chart-wrap chart-tall"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 9, right: 10, left: -18, bottom: 5 }}><CartesianGrid stroke="#edf0e9" vertical={false} /><XAxis dataKey="date" tick={{ fill: '#879188', fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: '#879188', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: '1px solid #e2e5dc', borderRadius: 6, fontSize: 10 }} /><Line type="monotone" dataKey="created" name="Incidents created" stroke="#527b60" strokeWidth={2} dot={{ r: 3, fill: '#527b60' }} /><Line type="monotone" dataKey="resolved" name="Incidents resolved" stroke="#c19343" strokeWidth={2} dot={{ r: 3, fill: '#c19343' }} /></LineChart></ResponsiveContainer></div><div className="chart-legend"><span><i />Incidents created</span><span><i className="amber" />Incidents resolved</span></div></SectionCard>
      <div className="dashboard-side-stack analytics-side">
        <SectionCard title="Recovery work recorded" subtitle="Counts of task records; not measured environmental outcomes."><div className="analytics-list"><div className="analytics-row"><span>Recovery tasks completed</span><strong>{resolvedTasks.length}</strong></div><div className="analytics-row"><span>Waste-cleanup tasks completed</span><strong>{wasteCompleted}</strong></div><div className="analytics-row"><span>Water-quality inspection requests</span><strong>{waterRequests}</strong></div><div className="analytics-row"><span>All recovery tasks in store</span><strong>{data.tasks.length}</strong></div></div></SectionCard>
        <SectionCard title="Average elapsed time" subtitle="Only calculated from matching status timestamps."><div className="analytics-list"><div className="analytics-row"><span><Hourglass size={13} /> Report to assignment</span><strong>{durationLabel(assignmentTime)}</strong></div><div className="analytics-row"><span><Hourglass size={13} /> Assignment to resolution</span><strong>{durationLabel(resolutionTime)}</strong></div></div><p className="field-help">A dash means there are not yet enough matching event timestamps to compute this statistic.</p></SectionCard>
      </div>
    </div>
    <div className="data-caveat analytics-caveat"><AlertTriangle size={16} /><span>Reports and completed tasks are coordination indicators only. AfterRain does not infer tonnes of waste removed, litres of water saved, illness prevented, or emissions avoided unless a coordinator enters measured and verified outcomes.</span></div>
  </>;
}
