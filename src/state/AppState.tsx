import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { loadInitialData, saveAppData } from '../data/persistence';
import { createSeedData } from '../data/seed';
import { CATEGORY_GUIDANCE, canReceiveReports, canTransition, classifyReport, createIncidentFromReport, findDuplicateCandidate, recalculateIncident, validCoordinates } from '../domain/engine';
import { createId } from '../domain/ids';
import type { AppData, Incident, IncidentStatus, RecoveryTask, Report, ReportDraft, ReportRelationship, StatusEvent } from '../domain/types';

interface ActionResult {
  ok: boolean;
  error?: string;
  report?: Report;
  incident?: Incident;
  candidateIncidentId?: string;
}

interface ResolutionDetails {
  notes: string;
  evidence: string;
  measuredQuantity?: number;
  measuredUnit?: string;
  measurementVerified?: boolean;
}

interface AppStateValue {
  data: AppData;
  storageError?: string;
  isDemoData: boolean;
  createReport: (draft: ReportDraft) => ActionResult;
  reviewRelationship: (relationshipId: string, decision: 'confirmed' | 'rejected', reviewerNotes?: string) => ActionResult;
  linkReport: (reportId: string, incidentId: string, reviewerNotes?: string) => ActionResult;
  addSeparateIncident: (reportId: string, reviewerNotes?: string) => ActionResult;
  assignIncident: (incidentId: string, team: string) => ActionResult;
  setIncidentStatus: (incidentId: string, status: IncidentStatus, resolution?: ResolutionDetails) => ActionResult;
  addIncidentNote: (incidentId: string, note: string) => ActionResult;
  addTaskNote: (taskId: string, note: string) => ActionResult;
  resetDemoData: () => ActionResult;
}

const AppStateContext = createContext<AppStateValue | null>(null);
const storedInitial = loadInitialData();
const proposedLinkKeys = new Set(storedInitial.data.relationships.filter((relationship) => relationship.status === 'proposed').map((relationship) => `${relationship.incidentId}::${relationship.reportId}`));
const hydratedReports = storedInitial.data.reports.map((report) => proposedLinkKeys.has(`${report.linkedIncidentId}::${report.id}`) ? { ...report, linkedIncidentId: '' } : report);
const hydratedIncidents = storedInitial.data.incidents.map((incident) => ({ ...incident, reportIds: incident.reportIds.filter((reportId) => !proposedLinkKeys.has(`${incident.id}::${reportId}`)) }));
const hydrationTime = new Date();
const initial = {
  ...storedInitial,
  data: {
    ...storedInitial.data,
    reports: hydratedReports,
    incidents: hydratedIncidents.map((incident) => recalculateIncident(incident, hydratedReports, storedInitial.data.relationships, hydrationTime)),
  },
};

function statusEvent(entityType: StatusEvent['entityType'], entityId: string, newStatus: string, previousStatus?: string, note?: string): StatusEvent {
  return {
    id: createId('EVT'), entityType, entityId, newStatus, timestamp: new Date().toISOString(), actor: 'Coordinator',
    ...(previousStatus ? { previousStatus } : {}), ...(note ? { note } : {}),
  };
}

function buildRelationship(reportId: string, incidentId: string, kind: ReportRelationship['kind'], similarity: number, rationale: string, status: ReportRelationship['status'], reviewerNotes?: string): ReportRelationship {
  const createdAt = new Date().toISOString();
  return { id: createId('REL'), reportId, incidentId, kind, similarity, status, rationale, createdAt, ...(reviewerNotes ? { reviewerNotes } : {}), ...(status !== 'proposed' ? { decidedAt: createdAt } : {}) };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initial.data);
  const dataRef = useRef(initial.data);
  const [storageError, setStorageError] = useState<string | undefined>(initial.storageError);
  const [isDemoData, setIsDemoData] = useState(initial.seeded);

  const commit = useCallback((next: AppData): ActionResult => {
    const error = saveAppData(next);
    if (error) {
      setStorageError(error);
      return { ok: false, error };
    }
    dataRef.current = next;
    setData(next);
    setStorageError(undefined);
    setIsDemoData(false);
    return { ok: true };
  }, []);

  const createReport = useCallback((draft: ReportDraft): ActionResult => {
    const current = dataRef.current;
    const now = new Date();
    const createdAt = now.toISOString();
    const id = createId('RPT');
    const classification = classifyReport(draft.category, draft.title, draft.description);
    const matchingDraft = { ...draft, category: classification.predictedCategory };
    const candidate = findDuplicateCandidate(matchingDraft, current, now);
    const incidentId = candidate?.incident.id ?? createId('INC');
    const report: Report = {
      ...draft,
      id,
      createdAt,
      linkedIncidentId: candidate ? '' : incidentId,
      verificationStatus: classification.needsHumanReview ? 'needs review' : 'unverified',
      classification,
    };
    const next: AppData = {
      ...current,
      reports: [...current.reports, report],
      incidents: [...current.incidents],
      relationships: [...current.relationships],
      tasks: [...current.tasks],
      history: [...current.history, statusEvent('report', id, 'Submitted', undefined, 'New community observation received.')],
    };
    let incident: Incident;
    if (candidate) {
      const relationship = buildRelationship(id, incidentId, candidate.kind, candidate.similarity, candidate.rationale, 'proposed');
      next.relationships.push(relationship);
      incident = candidate.incident;
    } else {
      incident = createIncidentFromReport(report, incidentId, 'Reported', now);
      next.incidents.push(incident);
      next.history.push(statusEvent('incident', incidentId, 'Reported', undefined, 'Incident created from a new report.'));
    }
    const result = commit(next);
    return result.ok ? { ok: true, report, incident, ...(candidate ? { candidateIncidentId: incidentId } : {}) } : result;
  }, [commit]);

  const reviewRelationship = useCallback((relationshipId: string, decision: 'confirmed' | 'rejected', reviewerNotes = ''): ActionResult => {
    const current = dataRef.current;
    const relationship = current.relationships.find((item) => item.id === relationshipId);
    if (!relationship || relationship.status !== 'proposed') return { ok: false, error: 'This relationship is no longer awaiting review.' };
    const report = current.reports.find((item) => item.id === relationship.reportId);
    const oldIncident = current.incidents.find((item) => item.id === relationship.incidentId);
    if (!report || !oldIncident) return { ok: false, error: 'The report or incident for this relationship could not be found.' };
    if (decision === 'confirmed' && !canReceiveReports(oldIncident.status)) return { ok: false, error: 'This incident is resolved or closed and cannot accept another report. Reject the suggestion to keep the observation separate, or choose an open incident.' };
    const now = new Date();
    const decidedAt = now.toISOString();
    const updatedRelationship = { ...relationship, status: decision, reviewerNotes: reviewerNotes.trim() || undefined, decidedAt };
    const next: AppData = { ...current, reports: [...current.reports], incidents: [...current.incidents], relationships: current.relationships.map((item) => item.id === relationshipId ? updatedRelationship : item), tasks: [...current.tasks], history: [...current.history] };
    if (decision === 'confirmed') {
      const linkedReport = { ...report, linkedIncidentId: oldIncident.id };
      next.reports = next.reports.map((item) => item.id === report.id ? linkedReport : item);
      const submittedCoordinates = !validCoordinates(oldIncident.latitude, oldIncident.longitude) && validCoordinates(linkedReport.latitude, linkedReport.longitude)
        ? { latitude: linkedReport.latitude, longitude: linkedReport.longitude! }
        : {};
      const reportIds = oldIncident.reportIds.includes(report.id) ? oldIncident.reportIds : [...oldIncident.reportIds, report.id];
      const updatedIncident = recalculateIncident({ ...oldIncident, ...submittedCoordinates, reportIds, updatedAt: now.toISOString() }, next.reports, next.relationships, now);
      next.incidents = next.incidents.map((item) => item.id === oldIncident.id ? updatedIncident : item);
      const result = commit(next);
      return result.ok ? { ok: true, report: linkedReport, incident: updatedIncident } : result;
    }
    const newIncidentId = createId('INC');
    const separateReport = { ...report, linkedIncidentId: newIncidentId };
    const oldUpdated = recalculateIncident({ ...oldIncident, reportIds: oldIncident.reportIds.filter((id) => id !== report.id) }, next.reports.map((item) => item.id === report.id ? separateReport : item), next.relationships, now);
    const newIncident = createIncidentFromReport(separateReport, newIncidentId, 'Reported', now);
    next.reports = next.reports.map((item) => item.id === report.id ? separateReport : item);
    next.incidents = next.incidents.map((item) => item.id === oldIncident.id ? oldUpdated : item).concat(newIncident);
    next.history.push(statusEvent('incident', newIncidentId, 'Reported', undefined, 'A proposed relationship was rejected; the original report is preserved as a separate incident.'));
    const result = commit(next);
    return result.ok ? { ok: true, report: separateReport, incident: newIncident } : result;
  }, [commit]);

  const linkReport = useCallback((reportId: string, incidentId: string, reviewerNotes = ''): ActionResult => {
    const current = dataRef.current;
    const report = current.reports.find((item) => item.id === reportId);
    const target = current.incidents.find((item) => item.id === incidentId);
    if (!report || !target) return { ok: false, error: 'Choose an existing report and incident before linking.' };
    if (!canReceiveReports(target.status)) return { ok: false, error: 'This incident is resolved or closed and cannot accept another report. Choose an open incident or create a separate incident.' };
    if (report.linkedIncidentId === incidentId) return { ok: false, error: 'This report is already associated with that incident.' };
    const oldId = report.linkedIncidentId;
    const now = new Date();
    const movedReport = { ...report, linkedIncidentId: incidentId };
    const next: AppData = { ...current, reports: current.reports.map((item) => item.id === reportId ? movedReport : item), incidents: [...current.incidents], relationships: [...current.relationships], tasks: [...current.tasks], history: [...current.history] };
    next.relationships = next.relationships.map((item) => item.reportId === reportId && item.incidentId !== incidentId && item.status !== 'rejected'
      ? { ...item, status: 'rejected', reviewerNotes: 'Superseded by a coordinator-reviewed link to a different incident.', decidedAt: now.toISOString() }
      : item);
    const existingTargetLink = next.relationships.find((item) => item.reportId === reportId && item.incidentId === incidentId && item.status !== 'rejected');
    if (existingTargetLink) {
      next.relationships = next.relationships.map((item) => item.id === existingTargetLink.id ? { ...item, status: 'confirmed', reviewerNotes: reviewerNotes.trim() || 'Coordinator confirmed this target incident.', decidedAt: now.toISOString() } : item);
    } else {
      next.relationships.push(buildRelationship(reportId, incidentId, 'related report', 0, 'Coordinator linked this original report to an existing incident.', 'confirmed', reviewerNotes));
    }
    const oldIncident = current.incidents.find((item) => item.id === oldId);
    if (oldId && oldIncident && oldIncident.reportIds.filter((id) => id !== reportId).length === 0) {
      next.history.push(statusEvent('incident', oldId, 'Closed or rejected', oldIncident.status, `All original reports were explicitly linked to incident ${incidentId}; this empty record is retained for history.`));
    }
    next.incidents = next.incidents.map((incident) => {
      if (oldId && incident.id === oldId) {
        const remainingReportIds = incident.reportIds.filter((id) => id !== reportId);
        const archived = remainingReportIds.length === 0
          ? { ...incident, reportIds: remainingReportIds, status: 'Closed or rejected' as const, updatedAt: now.toISOString(), coordinatorNotes: [...incident.coordinatorNotes, `All original reports were linked to ${incidentId}; record retained for history.`] }
          : { ...incident, reportIds: remainingReportIds };
        return recalculateIncident(archived, next.reports, next.relationships, now);
      }
      if (incident.id === incidentId) {
        const submittedCoordinates = !validCoordinates(incident.latitude, incident.longitude) && validCoordinates(movedReport.latitude, movedReport.longitude)
          ? { latitude: movedReport.latitude, longitude: movedReport.longitude! }
          : {};
        return recalculateIncident({ ...incident, ...submittedCoordinates, reportIds: [...incident.reportIds, reportId] }, next.reports, next.relationships, now);
      }
      return incident;
    });
    const result = commit(next);
    return result.ok ? { ok: true, report: movedReport, incident: next.incidents.find((item) => item.id === incidentId) } : result;
  }, [commit]);

  const addSeparateIncident = useCallback((reportId: string, reviewerNotes = ''): ActionResult => {
    const current = dataRef.current;
    const report = current.reports.find((item) => item.id === reportId);
    if (!report) return { ok: false, error: 'The original report could not be found.' };
    const oldIncidentId = report.linkedIncidentId;
    const oldIncident = current.incidents.find((item) => item.id === oldIncidentId);
    if (!oldIncident) return { ok: false, error: 'The current incident could not be found.' };
    if (oldIncident.reportIds.length <= 1) return { ok: false, error: 'This incident has only one linked report; it does not need to be split.' };
    const now = new Date();
    const newId = createId('INC');
    const separated = { ...report, linkedIncidentId: newId };
    const next: AppData = { ...current, reports: current.reports.map((item) => item.id === reportId ? separated : item), incidents: [...current.incidents], relationships: current.relationships.map((item) => item.reportId === reportId && item.incidentId === oldIncidentId ? { ...item, status: 'rejected', reviewerNotes: reviewerNotes || 'Coordinator created a separate incident.', decidedAt: now.toISOString() } : item), tasks: [...current.tasks], history: [...current.history] };
    const updatedOld = recalculateIncident({ ...oldIncident, reportIds: oldIncident.reportIds.filter((id) => id !== reportId) }, next.reports, next.relationships, now);
    const newIncident = createIncidentFromReport(separated, newId, 'Reported', now);
    next.incidents = next.incidents.map((item) => item.id === oldIncidentId ? updatedOld : item).concat(newIncident);
    next.history.push(statusEvent('incident', newId, 'Reported', undefined, 'Coordinator split this original report into a separate incident.'));
    const result = commit(next);
    return result.ok ? { ok: true, report: separated, incident: newIncident } : result;
  }, [commit]);

  const assignIncident = useCallback((incidentId: string, team: string): ActionResult => {
    const current = dataRef.current;
    const incident = current.incidents.find((item) => item.id === incidentId);
    const chosenTeam = team.trim();
    if (!incident) return { ok: false, error: 'Incident not found.' };
    if (!chosenTeam) return { ok: false, error: 'Enter a recovery team before assigning this task.' };
    if (incident.status !== 'Assigned' && incident.status !== 'In progress' && !canTransition(incident.status, 'Assigned')) {
      return { ok: false, error: `Move this incident from ${incident.status} through the review workflow before assigning a task.` };
    }
    const now = new Date();
    const createdAt = now.toISOString();
    const guidance = CATEGORY_GUIDANCE[incident.category];
    const currentTask = current.tasks.find((task) => task.incidentId === incidentId && task.status !== 'Resolved');
    const taskRecord: RecoveryTask = currentTask
      ? { ...currentTask, assignedTeam: chosenTeam, status: incident.status === 'In progress' ? 'In progress' : 'Assigned', updatedAt: createdAt }
      : { id: createId('TASK'), incidentId, action: guidance.action, taskType: guidance.taskType, assignedTeam: chosenTeam, status: 'Assigned', createdAt, updatedAt: createdAt, notes: [] };
    const nextStatus: IncidentStatus = incident.status === 'Assigned' || incident.status === 'In progress' ? incident.status : 'Assigned';
    const updatedIncident: Incident = { ...incident, assignedTeam: chosenTeam, status: nextStatus, updatedAt: createdAt };
    const next: AppData = { ...current, reports: [...current.reports], incidents: current.incidents.map((item) => item.id === incidentId ? updatedIncident : item), relationships: [...current.relationships], tasks: currentTask ? current.tasks.map((item) => item.id === currentTask.id ? taskRecord : item) : [...current.tasks, taskRecord], history: [...current.history] };
    if (incident.status !== nextStatus) next.history.push(statusEvent('incident', incidentId, nextStatus, incident.status, `Assigned to ${chosenTeam}.`));
    next.history.push(statusEvent('task', taskRecord.id, taskRecord.status, currentTask?.status, `Assigned to ${chosenTeam}.`));
    const result = commit(next);
    return result.ok ? { ok: true, incident: updatedIncident } : result;
  }, [commit]);

  const setIncidentStatus = useCallback((incidentId: string, status: IncidentStatus, resolution?: ResolutionDetails): ActionResult => {
    const current = dataRef.current;
    const incident = current.incidents.find((item) => item.id === incidentId);
    if (!incident) return { ok: false, error: 'Incident not found.' };
    if (status === incident.status) return { ok: false, error: 'The incident already has that status.' };
    if (!canTransition(incident.status, status)) return { ok: false, error: `That transition is not available from ${incident.status}.` };
    if (status === 'Resolved') {
      if (!current.tasks.some((task) => task.incidentId === incidentId)) return { ok: false, error: 'Record or assign a recovery task before resolving this incident.' };
      if (!resolution?.notes.trim() || !resolution.evidence.trim()) return { ok: false, error: 'Resolution notes and expected completion evidence are required before marking this task resolved.' };
      if (resolution.measuredQuantity !== undefined) {
        if (incident.category !== 'Waste and debris') return { ok: false, error: 'Measured waste quantities may only be recorded on waste and debris recovery tasks.' };
        if (!Number.isFinite(resolution.measuredQuantity) || resolution.measuredQuantity < 0) return { ok: false, error: 'Measured quantity must be a finite, non-negative number.' };
        if (!resolution.measurementVerified || !resolution.measuredUnit?.trim()) return { ok: false, error: 'Waste quantity needs a verified amount and unit. Leave quantity blank if it was not measured.' };
      }
    }
    const now = new Date();
    let updatedIncident: Incident = {
      ...incident,
      status,
      updatedAt: now.toISOString(),
      ...(status === 'Resolved' && resolution ? { resolutionNotes: resolution.notes.trim(), completionEvidence: resolution.evidence.trim() } : {}),
    };
    const acceptedRelations = new Set(current.relationships.filter((relationship) => relationship.incidentId === incidentId && relationship.status === 'confirmed').map((relationship) => relationship.reportId));
    const hasReviewableRelation = new Set(current.relationships.filter((relationship) => relationship.incidentId === incidentId).map((relationship) => relationship.reportId));
    const reports = current.reports.map((report) => {
      const isAccepted = !hasReviewableRelation.has(report.id) || acceptedRelations.has(report.id);
      return incident.reportIds.includes(report.id) && status === 'Verified' && isAccepted ? { ...report, verificationStatus: 'verified' as const } : report;
    });
    const relationships = [...current.relationships];
    updatedIncident = recalculateIncident(updatedIncident, reports, relationships, now);
    const updatedTasks = current.tasks.map((task) => {
      if (task.incidentId !== incidentId || (task.status === 'Resolved' && status !== 'Resolved')) return task;
      return {
        ...task,
        status,
        updatedAt: now.toISOString(),
        ...(status === 'Resolved' && resolution ? { resolutionNotes: resolution.notes.trim(), completionEvidence: resolution.evidence.trim(), measuredQuantity: resolution.measuredQuantity, measuredUnit: resolution.measuredUnit?.trim(), measurementVerified: resolution.measurementVerified ?? false } : {}),
      };
    });
    const taskEvents = updatedTasks.flatMap((task) => {
      const previous = current.tasks.find((item) => item.id === task.id);
      return previous && previous.status !== task.status ? [statusEvent('task', task.id, task.status, previous.status, status === 'Resolved' ? resolution?.evidence.trim() : undefined)] : [];
    });
    const next: AppData = {
      ...current,
      reports,
      incidents: current.incidents.map((item) => item.id === incidentId ? updatedIncident : item),
      relationships,
      tasks: updatedTasks,
      history: [...current.history, statusEvent('incident', incidentId, status, incident.status, status === 'Resolved' ? resolution?.notes.trim() : undefined), ...taskEvents],
    };
    const result = commit(next);
    return result.ok ? { ok: true, incident: updatedIncident } : result;
  }, [commit]);

  const addIncidentNote = useCallback((incidentId: string, note: string): ActionResult => {
    const current = dataRef.current;
    const incident = current.incidents.find((item) => item.id === incidentId);
    const text = note.trim();
    if (!incident) return { ok: false, error: 'Incident not found.' };
    if (!text) return { ok: false, error: 'Enter a note before saving.' };
    const now = new Date().toISOString();
    const updated = { ...incident, coordinatorNotes: [...incident.coordinatorNotes, text], updatedAt: now };
    const next: AppData = { ...current, incidents: current.incidents.map((item) => item.id === incidentId ? updated : item), history: [...current.history, statusEvent('incident', incidentId, incident.status, incident.status, text)] };
    const result = commit(next);
    return result.ok ? { ok: true, incident: updated } : result;
  }, [commit]);

  const addTaskNote = useCallback((taskId: string, note: string): ActionResult => {
    const current = dataRef.current;
    const task = current.tasks.find((item) => item.id === taskId);
    const text = note.trim();
    if (!task) return { ok: false, error: 'Recovery task not found.' };
    if (!text) return { ok: false, error: 'Enter a note before saving.' };
    const updated = { ...task, notes: [...task.notes, text], updatedAt: new Date().toISOString() };
    const next: AppData = { ...current, tasks: current.tasks.map((item) => item.id === taskId ? updated : item), history: [...current.history, statusEvent('task', taskId, task.status, task.status, text)] };
    const result = commit(next);
    return result.ok ? { ok: true } : result;
  }, [commit]);

  const resetDemoData = useCallback((): ActionResult => {
    const fresh = createSeedData();
    const result = commit(fresh);
    if (result.ok) setIsDemoData(true);
    return result;
  }, [commit]);

  const value: AppStateValue = { data, storageError, isDemoData, createReport, reviewRelationship, linkReport, addSeparateIncident, assignIncident, setIncidentStatus, addIncidentNote, addTaskNote, resetDemoData };
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside AppProvider.');
  return context;
}
