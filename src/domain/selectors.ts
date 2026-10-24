import type { AppData, Incident } from './types';

/** Incidents with at least one report whose current, explicit link points back to that incident. */
export function getTrackedIncidents(data: AppData): Incident[] {
  const linkedIncidentByReport = new Map(data.reports.map((report) => [report.id, report.linkedIncidentId]));
  return data.incidents.filter((incident) => incident.reportIds.some((reportId) => linkedIncidentByReport.get(reportId) === incident.id));
}
