import { useState } from 'react';
import { Check, ChevronDown, ClipboardCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { getTrackedIncidents } from '../domain/selectors';
import { CATEGORY_GUIDANCE, nextStatuses } from '../domain/engine';
import type { Incident, IncidentStatus } from '../domain/types';
import { CategoryTag, EmptyState, PageHeading, PriorityBadge, StatusBadge } from '../components/ui';

function RecoveryCard({ incident }: { incident: Incident }) {
  const { data, assignIncident, setIncidentStatus, addTaskNote } = useAppState();
  const [team, setTeam] = useState(incident.assignedTeam ?? CATEGORY_GUIDANCE[incident.category].team);
  const [nextStatus, setNextStatus] = useState<IncidentStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [measurementVerified, setMeasurementVerified] = useState(false);
  const [taskNote, setTaskNote] = useState('');
  const [message, setMessage] = useState('');
  const task = data.tasks.find((item) => item.incidentId === incident.id && item.status !== 'Resolved');
  const resolvedTask = data.tasks.find((item) => item.incidentId === incident.id && item.status === 'Resolved' && (item.resolutionNotes || item.completionEvidence));
  const guidance = CATEGORY_GUIDANCE[incident.category];
  const allowed = nextStatuses(incident.status);
  const canAssign = incident.status === 'Assigned' || incident.status === 'In progress' || incident.status === 'Under review' || incident.status === 'Verified';

  function assign() {
    const result = assignIncident(incident.id, team);
    setMessage(result.ok ? 'Task assignment saved.' : result.error ?? 'Assignment was not saved.');
  }
  function updateStatus() {
    if (!nextStatus) return;
    const result = setIncidentStatus(incident.id, nextStatus, nextStatus === 'Resolved' ? {
      notes,
      evidence,
      ...(quantity.trim() ? { measuredQuantity: Number(quantity), measuredUnit: unit, measurementVerified } : {}),
    } : undefined);
    setMessage(result.ok ? `Status updated to ${nextStatus}.` : result.error ?? 'Status update was not saved.');
    if (result.ok) { setNextStatus(''); setNotes(''); setEvidence(''); setQuantity(''); setUnit(''); setMeasurementVerified(false); }
  }

  return <article className="planner-card">
    <div className="planner-card-head"><div><span className="incident-id">{incident.id}</span><h2>{incident.title}</h2><div className="incident-card-tags"><CategoryTag category={incident.category} /><StatusBadge status={incident.status} /><PriorityBadge band={incident.scores.priorityBand} /></div></div><Link className="btn btn-secondary btn-sm" to={`/incidents/${incident.id}`}>Open detail</Link></div>
    <p className="planner-problem">{incident.description}</p>
    <div className="planner-columns"><div className="planner-info"><span>Why attention matters</span><p>{incident.scores.explanation}</p></div><div className="planner-info"><span>Recommended next action</span><p>{guidance.action}</p></div><div className="planner-info"><span>Expected completion evidence</span><p>{guidance.evidence}</p></div></div>
    <div className="planner-overview-meta"><span><strong>Required skill / team</strong>{guidance.team}{incident.assignedTeam && incident.assignedTeam !== guidance.team ? ` · Assigned: ${incident.assignedTeam}` : incident.assignedTeam ? ` · Assigned: ${incident.assignedTeam}` : ''}</span><span><strong>Current status</strong>{incident.status}</span><span><strong>Priority</strong>{incident.scores.priority}/100 · {incident.scores.priorityBand}</span></div>
    {(incident.resolutionNotes || incident.completionEvidence || resolvedTask) && <div className="resolve-record"><strong>Recorded completion evidence</strong>{incident.resolutionNotes && <p><span>Resolution notes</span>{incident.resolutionNotes}</p>}{incident.completionEvidence && <p><span>Evidence</span>{incident.completionEvidence}</p>}{resolvedTask?.measuredQuantity !== undefined && resolvedTask.measurementVerified && <p><span>Verified measured quantity</span>{resolvedTask.measuredQuantity} {resolvedTask.measuredUnit}</p>}</div>}
    <details className="planner-controls-details">
      <summary><span>Manage recovery task</span><small>{incident.assignedTeam ? `Assigned to ${incident.assignedTeam}` : 'Assignment pending'} · {allowed.length} allowed transition{allowed.length === 1 ? '' : 's'}</small><ChevronDown size={14} /></summary>
      <div className="planner-controls-content">
        <div className="planner-action-row"><div className="field"><label htmlFor={`team-${incident.id}`}>Assign team</label><input id={`team-${incident.id}`} value={team} onChange={(event) => setTeam(event.target.value)} /></div><button className="btn btn-primary btn-sm" disabled={!canAssign} onClick={assign}><Users size={13} />{incident.assignedTeam ? 'Update assignment' : 'Assign task'}</button>{!canAssign && <span className="field-help">Move through review before assignment.</span>}</div>
        <div className="planner-action-row"><div className="field"><label htmlFor={`status-${incident.id}`}>Allowed next status</label><select id={`status-${incident.id}`} value={nextStatus} onChange={(event) => setNextStatus(event.target.value as IncidentStatus | '')}><option value="">Choose an allowed transition…</option>{allowed.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><button className="btn btn-secondary btn-sm" disabled={!nextStatus} onClick={updateStatus}><Check size={13} />Save transition</button>{allowed.length === 0 && <span className="field-help">No further status transition is available.</span>}</div>
        {nextStatus === 'Resolved' && <div className="resolve-panel"><div className="resolve-grid"><div className="field"><label htmlFor={`notes-${incident.id}`}>Resolution notes *</label><textarea id={`notes-${incident.id}`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Describe the completed work" /></div><div className="field"><label htmlFor={`evidence-${incident.id}`}>Completion evidence *</label><textarea id={`evidence-${incident.id}`} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="What supports this resolution?" /></div></div>{incident.category === 'Waste and debris' && <div className="resolve-grid"><div className="field"><label htmlFor={`quantity-${incident.id}`}>Measured quantity <span className="field-help">optional; verified only</span></label><input id={`quantity-${incident.id}`} type="number" min="0" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Leave blank if not measured" /></div><div className="field"><label htmlFor={`unit-${incident.id}`}>Unit</label><input id={`unit-${incident.id}`} value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="e.g. kg, bags" /></div><label className="checkbox-row"><input type="checkbox" checked={measurementVerified} onChange={(event) => setMeasurementVerified(event.target.checked)} /><span>Coordinator verified this measured quantity and unit</span></label></div>}</div>}
        {task && <div className="task-note-row"><div className="field"><label htmlFor={`task-note-${incident.id}`}>Task note</label><input id={`task-note-${incident.id}`} value={taskNote} onChange={(event) => setTaskNote(event.target.value)} placeholder="Add an inspection, coordination, or access note" /></div><button className="btn btn-quiet btn-sm" onClick={() => { const result = addTaskNote(task.id, taskNote); setMessage(result.ok ? 'Task note saved.' : result.error ?? 'Note not saved.'); if (result.ok) setTaskNote(''); }}>Add note</button></div>}
      </div>
    </details>
    {message && <div className={message.toLowerCase().includes('not saved') || message.includes('before') ? 'form-error' : 'inline-success'} role="status">{message}</div>}
  </article>;
}

export function PlannerPage() {
  const { data } = useAppState();
  const incidents = [...getTrackedIncidents(data)].sort((a, b) => b.scores.priority - a.scores.priority);
  const active = incidents.filter((incident) => incident.status !== 'Resolved' && incident.status !== 'Closed or rejected');
  const completed = incidents.filter((incident) => incident.status === 'Resolved' || incident.status === 'Closed or rejected');
  return <>
    <PageHeading eyebrow="COORDINATED FIELD WORK" title="Recovery planner" description="Turn the priority queue into specific, assigned work—with an explicit evidence step before resolution." action={<span className="planner-task-count"><ClipboardCheck size={15} />{data.tasks.length} recorded tasks</span>} />
    <div className="planner-intro-callout"><strong>Category-specific recommendations are starting points.</strong><span>Coordinators should follow official emergency guidance and qualified inspection procedures; AfterRain does not certify hazards or replace those authorities.</span></div>
    {active.length ? <><div className="planner-list-summary"><strong>{active.length}</strong> open incident plans <span>·</span> <strong>{completed.length}</strong> completed or closed records</div><div className="planner-list">{active.map((incident) => <RecoveryCard key={incident.id} incident={incident} />)}</div></> : <EmptyState title="No open recovery tasks" description="New reports create incidents in the priority queue." action={<Link className="btn btn-primary" to="/report">Submit a report</Link>} />}
    <h2 className="resolved-heading">Completed recovery records</h2>
    {completed.length ? <div className="planner-list">{completed.map((incident) => <RecoveryCard key={incident.id} incident={incident} />)}</div> : <p className="field-help">No incident has been resolved or closed yet.</p>}
  </>;
}
