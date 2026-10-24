import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock3, FileText, MapPin, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { canReceiveReports, CATEGORY_GUIDANCE, nextStatuses, SEVERITY_WEIGHTS, PRIORITY_WEIGHTS } from '../domain/engine';
import type { IncidentStatus } from '../domain/types';
import { getTrackedIncidents } from '../domain/selectors';
import { CategoryTag, EmptyState, PageHeading, PriorityBadge, SectionCard, StatusBadge, formatDate } from '../components/ui';

const factorLabels: Record<string, string> = {
  reportedImpact: 'Reported impact', environmentalHarm: 'Potential environmental harm', publicSafety: 'Immediate public-safety concern', infrastructureDisruption: 'Infrastructure disruption', evidenceAndVerification: 'Supporting evidence / verification', timeSensitivity: 'Time sensitivity', environmentalSensitivity: 'Environmental sensitivity', recurrencePersistence: 'Recurrence / persistence',
};

export function IncidentPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, reviewRelationship, linkReport, addSeparateIncident, assignIncident, setIncidentStatus, addIncidentNote } = useAppState();
  const incident = data.incidents.find((item) => item.id === id);
  const incidentOptions = useMemo(() => [...getTrackedIncidents(data)].sort((a, b) => b.scores.priority - a.scores.priority), [data]);
  const [team, setTeam] = useState(incident?.assignedTeam ?? (incident ? CATEGORY_GUIDANCE[incident.category].team : ''));
  const [note, setNote] = useState('');
  const [linkId, setLinkId] = useState('');
  const [nextStatus, setNextStatus] = useState<IncidentStatus | ''>('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionEvidence, setResolutionEvidence] = useState('');
  const [message, setMessage] = useState('');
  const reports = useMemo(() => incident ? incident.reportIds.map((reportId) => data.reports.find((item) => item.id === reportId)).filter((item): item is NonNullable<typeof item> => Boolean(item)) : [], [data.reports, incident]);
  const timeline = useMemo(() => incident ? data.history.filter((item) => item.entityId === incident.id || reports.some((report) => report.id === item.entityId)).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [], [data.history, incident, reports]);
  if (!incident) return <><PageHeading eyebrow="INCIDENT INTELLIGENCE" title="Incident not found" description="This ID may have changed after a report was separated. The original report remains available in the incident register." /><EmptyState title="No incident matches this link" description="Return to the incident register to open a current incident record." action={<Link className="btn btn-primary" to="/incidents">Back to incident intelligence</Link>} /></>;

  const factors = incident.scores.factors;
  const severityFactorNames = ['reportedImpact', 'environmentalHarm', 'publicSafety', 'infrastructureDisruption', 'evidenceAndVerification'] as const;
  const priorityFactorNames = ['timeSensitivity', 'environmentalSensitivity', 'recurrencePersistence'] as const;
  const guidance = CATEGORY_GUIDANCE[incident.category];
  const relations = data.relationships.filter((relationship) => relationship.incidentId === incident.id);
  const pendingRelationships = relations.filter((relationship) => relationship.status === 'proposed');
  const resolvedRecords = data.tasks.filter((task) => task.incidentId === incident.id && task.status === 'Resolved' && (task.resolutionNotes || task.completionEvidence));
  const assignable = incident.status === 'Under review' || incident.status === 'Verified' || incident.status === 'Assigned' || incident.status === 'In progress';
  const mayReceiveReports = canReceiveReports(incident.status);

  function showResult(result: { ok: boolean; error?: string }, success: string) { setMessage(result.ok ? success : result.error ?? 'The requested update could not be saved.'); }
  function applyTransition() {
    if (!incident || !nextStatus) return;
    const result = setIncidentStatus(incident.id, nextStatus, nextStatus === 'Resolved' ? { notes: resolutionNotes, evidence: resolutionEvidence } : undefined);
    showResult(result, `Status updated to ${nextStatus}.`);
    if (result.ok) setNextStatus('');
  }

  return <>
    <PageHeading eyebrow="INCIDENT INTELLIGENCE / SELECTED RECORD" title={incident.title} description="Review source observations, explainable score factors, possible relationships, and the evidence behind recovery decisions." action={<Link className="btn btn-secondary" to="/incidents"><ArrowLeft size={14} />All incidents</Link>} />
    <div className="incident-workspace">
      <aside className="incident-index-panel" aria-label="Select an incident">
        <div className="incident-index-heading"><span className="eyebrow">PRIORITY REGISTER</span><strong>{incidentOptions.length} incidents</strong></div>
        <div className="incident-index-list">{incidentOptions.map((item) => <Link key={item.id} to={`/incidents/${item.id}`} className={`incident-index-row ${item.id === incident.id ? 'selected' : ''}`} aria-current={item.id === incident.id ? 'page' : undefined}><span className={`index-score band-${item.scores.priorityBand.toLowerCase()}`}>{item.scores.priority}</span><span className="incident-index-copy"><small>{item.id} · {item.scores.priorityBand.toUpperCase()}</small><strong>{item.title}</strong><span>{item.locationName}</span></span></Link>)}</div>
        <Link className="incident-register-link" to="/incidents">Open full incident register <ArrowLeft size={12} /></Link>
      </aside>
      <div className="incident-detail-grid">
      <div className="detail-main">
        <section className="detail-hero">
          <div className="detail-hero-top"><span className="incident-id">{incident.id}</span><PriorityBadge band={incident.scores.priorityBand} /></div>
          <h1>{incident.title}</h1><p>{incident.description}</p>
          <div className="detail-meta"><span><CategoryTag category={incident.category} /></span><span><StatusBadge status={incident.status} /></span><span><MapPin size={13} />{incident.locationName}</span><span><MessageSquare size={13} />{reports.length} linked report{reports.length === 1 ? '' : 's'}{pendingRelationships.length ? ` · ${pendingRelationships.length} suggestion awaiting review` : ''}</span><span><Clock3 size={13} />Updated {formatDate(incident.updatedAt, true)}</span></div>
          {reports.length === 0 && <div className="field-help">No reports are currently linked to this retained history record. It is excluded from unique-incident totals and the active recovery queue.</div>}
          <div className="detail-score-grid"><div className="score-tile"><div className="score-tile-head"><span>Severity</span><span>{incident.scores.severityConfidence}</span></div><div className="score-tile-value">{incident.scores.severity}<small>/100</small></div></div><div className="score-tile"><div className="score-tile-head"><span>Operational priority</span><PriorityBadge band={incident.scores.priorityBand} /></div><div className="score-tile-value">{incident.scores.priority}<small>/100</small></div></div></div>
        </section>
        <SectionCard title="Why this incident ranks here" subtitle={incident.scores.explanation}>
          <div className="factor-heading">Severity · 0–100 <span>35% impact · 25% environmental harm · 20% safety · 10% infrastructure · 10% evidence</span></div>
          <div className="factor-list">{severityFactorNames.map((key) => <div className="factor-row" key={key}><span>{factorLabels[key]} <span className="factor-weight">{Math.round(SEVERITY_WEIGHTS[key] * 100)}%</span></span><div className="factor-track"><div className="factor-fill" style={{ width: `${factors[key]}%` }} /></div><strong>{factors[key]}</strong></div>)}</div>
          <div className="factor-heading factor-heading-second">Operational priority <span>50% severity · 20% time · 15% environmental sensitivity · 15% recurrence</span></div>
          <div className="factor-list">{priorityFactorNames.map((key) => <div className="factor-row" key={key}><span>{factorLabels[key]} <span className="factor-weight">{Math.round(PRIORITY_WEIGHTS[key] * 100)}%</span></span><div className="factor-track"><div className="factor-fill" style={{ width: `${factors[key]}%` }} /></div><strong>{factors[key]}</strong></div>)}</div>
          <div className="method-note">Prototype decision-support heuristic—not a validated disaster-risk model and not a substitute for emergency guidance, professional inspection, or environmental testing. Missing evidence lowers confidence; absence of a photograph does not mean an incident is harmless.</div>
        </SectionCard>
        <SectionCard title="Original community reports" subtitle="Each linked submission and observation timestamp is preserved; suggested matches remain separate until a coordinator confirms them.">
          {reports.map((report) => {
            const relation = relations.find((item) => item.reportId === report.id);
            return <article className="report-evidence" key={report.id}>
              <div className="report-evidence-meta"><span>{report.id}</span><span>{formatDate(report.observedAt, true)} observed</span><span>{report.verificationStatus}</span></div>
              <h3>{report.title}</h3><p>{report.description}</p>
              <div className="report-evidence-meta" style={{ marginTop: 8 }}><span>{report.anonymous ? 'Anonymous reporter' : report.reporterName || 'Reporter name not provided'}</span><span>{report.locationName}</span></div>
              <div className="classification-result"><div><strong>Selected</strong><CategoryTag category={report.classification.selectedCategory} /></div><div><strong>Rule suggestion</strong><CategoryTag category={report.classification.predictedCategory} /></div><p>{report.classification.reason}</p><small>{Math.round(report.classification.confidence * 100)}% heuristic confidence · {report.classification.needsHumanReview ? 'human review flagged' : 'preliminary; not a verified finding'}</small></div>
              {report.imageDataUrl && <img src={report.imageDataUrl} alt={`Evidence submitted for ${report.title}`} />}
              {relation && <div className="relationship-context"><span>{relation.kind} · {relation.status}</span><p>{relation.rationale}</p>{relation.reviewerNotes && <small>Coordinator note: {relation.reviewerNotes}</small>}</div>}
              {incident.reportIds.length > 1 && <div className="relationship-actions"><button className="btn btn-quiet btn-sm" onClick={() => { const result = addSeparateIncident(report.id, 'Coordinator determined this observation is a separate issue.'); showResult(result, 'Separate incident created; original report preserved.'); if (result.ok && result.incident) navigate(`/incidents/${result.incident.id}`); }}>Create a separate incident</button></div>}
            </article>;
          })}
          {pendingRelationships.map((relationship) => {
            const report = data.reports.find((item) => item.id === relationship.reportId);
            if (!report) return null;
            return <article className="report-evidence proposed-report" key={relationship.id}>
              <div className="report-evidence-meta"><span>{report.id}</span><span>{formatDate(report.observedAt, true)} observed</span><span>Not linked · review required</span></div>
              <h3>Suggested related report: {report.title}</h3><p>{report.description}</p>
              <div className="relationship-card"><span className="review-kind">{relationship.kind} · not included in incident count yet</span><p>{relationship.rationale}</p>
                <div className="classification-result"><div><strong>Selected</strong><CategoryTag category={report.classification.selectedCategory} /></div><div><strong>Rule suggestion</strong><CategoryTag category={report.classification.predictedCategory} /></div><p>{report.classification.reason}</p><small>{Math.round(report.classification.confidence * 100)}% heuristic confidence · coordinator review remains necessary</small></div>
                {report.imageDataUrl && <img src={report.imageDataUrl} alt={`Evidence submitted for ${report.title}`} />}
                {!mayReceiveReports && <small className="field-help">This incident is resolved or closed. Confirmation is disabled; rejecting will preserve the report as a separate incident.</small>}
                <div className="relationship-actions"><button className="btn btn-primary btn-sm" disabled={!mayReceiveReports} title={!mayReceiveReports ? 'Resolved or closed incidents cannot accept new reports.' : undefined} onClick={() => showResult(reviewRelationship(relationship.id, 'confirmed', 'Confirmed from incident intelligence.'), 'Relationship confirmed; originals remain preserved.')}>Confirm relationship</button><button className="btn btn-secondary btn-sm" onClick={() => { const result = reviewRelationship(relationship.id, 'rejected', 'Rejected from incident intelligence; new incident created.'); showResult(result, 'Suggestion rejected; a separate incident was created.'); if (result.ok && result.incident) navigate(`/incidents/${result.incident.id}`); }}>Reject & separate</button></div>
              </div>
            </article>;
          })}
          {reports.length === 0 && pendingRelationships.length === 0 && <p className="field-help">This archived incident has no currently linked community reports.</p>}
          {!mayReceiveReports && <p className="field-help">Resolved or closed incidents do not accept new observations. Link a report to an open incident or keep it separate.</p>}
          {mayReceiveReports && data.reports.length > reports.length && <div className="manual-link-row"><label className="field-label" htmlFor="link-report">Link another report to this incident</label><div className="link-control"><select id="link-report" value={linkId} onChange={(event) => setLinkId(event.target.value)}><option value="">Choose a report…</option>{data.reports.filter((item) => item.linkedIncidentId !== incident.id).map((report) => <option key={report.id} value={report.id}>{report.id} · {report.title}</option>)}</select><button className="btn btn-secondary btn-sm" disabled={!linkId} onClick={() => { const result = linkReport(linkId, incident.id, 'Coordinator manually linked report after review.'); showResult(result, 'Report linked; source submission and timestamp were retained.'); if (result.ok) setLinkId(''); }}>Link report</button></div></div>}
        </SectionCard>
        <SectionCard title="Observation and status timeline" subtitle="Report timestamps and coordinator changes remain in the incident record.">
          {timeline.length ? <div className="timeline">{timeline.map((event) => <div className="timeline-item" key={event.id}><span className="timeline-dot" /><div><h3>{event.newStatus}{event.previousStatus && event.previousStatus !== event.newStatus ? ` · ${event.previousStatus} → ${event.newStatus}` : ''}</h3>{event.note && <p>{event.note}</p>}<time>{formatDate(event.timestamp, true)} · {event.actor}</time></div></div>)}</div> : <p className="field-help">No status events recorded yet.</p>}
        </SectionCard>
        {(incident.resolutionNotes || incident.completionEvidence || resolvedRecords.length > 0) && <SectionCard title="Resolution record" subtitle="Completion notes and evidence remain available after status changes.">
          {(incident.resolutionNotes || incident.completionEvidence) && <div className="resolve-record">{incident.resolutionNotes && <p><span>Resolution notes</span>{incident.resolutionNotes}</p>}{incident.completionEvidence && <p><span>Incident completion evidence</span>{incident.completionEvidence}</p>}</div>}
          {resolvedRecords.map((task) => <div className="resolve-record" key={task.id}><strong>{task.action}</strong>{task.resolutionNotes && <p><span>Task notes</span>{task.resolutionNotes}</p>}{task.completionEvidence && <p><span>Evidence</span>{task.completionEvidence}</p>}{task.measuredQuantity !== undefined && task.measurementVerified && <p><span>Verified measured quantity</span>{task.measuredQuantity} {task.measuredUnit}</p>}</div>)}
        </SectionCard>}
      </div>
      <aside className="detail-side">
        <SectionCard title="Recommended recovery action" subtitle="Category-based rule · human decision required."><div className="recommendation-box"><div className="recommendation-icon"><ShieldCheck size={17} /></div><p>{guidance.action}</p></div><div className="planner-info"><span>Appropriate team</span><p>{guidance.team}</p></div><div className="planner-info"><span>Expected completion evidence</span><p>{guidance.evidence}</p></div>{incident.category === 'Possible water contamination' && <div className="data-caveat" style={{ marginTop: 10 }}><ShieldCheck size={15} /><span>This is an unverified observation. No contamination is confirmed by this report.</span></div>}</SectionCard>
        <SectionCard title="Assign recovery team" subtitle="Assignment records a recovery task and who owns the next step.">
          <div className="field"><label htmlFor="team-name">Team / qualified authority</label><input id="team-name" value={team} onChange={(event) => setTeam(event.target.value)} placeholder="Enter responsible team" /></div>
          {!assignable && <p className="field-help" style={{ marginTop: 8 }}>Move this incident through review before assignment. Available transitions are explicit below.</p>}
          <button className="btn btn-primary" style={{ marginTop: 10 }} disabled={!assignable} onClick={() => showResult(assignIncident(incident.id, team), 'Recovery task assigned and saved.')}><Users size={14} />Assign task</button>
          {incident.assignedTeam && <div className="assigned-line"><span>Current assignment</span><strong>{incident.assignedTeam}</strong></div>}
        </SectionCard>
        <SectionCard title="Update status" subtitle="Only permitted transitions are available.">
          <div className="field"><label htmlFor="status-next">Next status</label><select id="status-next" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as IncidentStatus | '')}><option value="">Choose an allowed status…</option>{nextStatuses(incident.status).map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
          {nextStatus === 'Resolved' && <div className="resolve-panel"><div className="field"><label htmlFor="resolution-notes">Resolution notes</label><textarea id="resolution-notes" value={resolutionNotes} onChange={(event) => setResolutionNotes(event.target.value)} placeholder="What work was completed?" /></div><div className="field"><label htmlFor="resolution-evidence">Completion evidence</label><textarea id="resolution-evidence" value={resolutionEvidence} onChange={(event) => setResolutionEvidence(event.target.value)} placeholder="What evidence supports completion?" /></div></div>}
          <button className="btn btn-secondary" style={{ marginTop: 10 }} disabled={!nextStatus} onClick={applyTransition}><Check size={14} />Save status update</button>
        </SectionCard>
        <SectionCard title="Coordinator notes" subtitle="Add a dated note to the incident timeline.">
          <div className="field"><label htmlFor="coord-note">New note</label><textarea id="coord-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Inspection request, access note, or decision rationale…" /></div><button className="btn btn-secondary" style={{ marginTop: 9 }} onClick={() => { const result = addIncidentNote(incident.id, note); showResult(result, 'Coordinator note saved.'); if (result.ok) setNote(''); }}>Add note</button>
          {incident.coordinatorNotes.map((item, index) => <div className="coordinator-note" key={`${index}-${item}`}><FileText size={13} /><span>{item}</span></div>)}
        </SectionCard>
        {message && <div className={message.includes('saved') || message.includes('created') || message.includes('confirmed') || message.includes('linked') ? 'inline-success' : 'form-error'} role="status">{message}</div>}
      </aside>
      </div>
    </div>
  </>;
}
