import type { AppData, Category, DuplicateCandidate, Incident, IncidentScores, IncidentStatus, PriorityBand, Report, ReportDraft, ScoreFactors, TaskType } from './types';
import { CATEGORIES, STATUSES } from './types';

export const SEVERITY_WEIGHTS = {
  reportedImpact: 0.35,
  environmentalHarm: 0.25,
  publicSafety: 0.20,
  infrastructureDisruption: 0.10,
  evidenceAndVerification: 0.10,
} as const;

export const PRIORITY_WEIGHTS = {
  severity: 0.50,
  timeSensitivity: 0.20,
  environmentalSensitivity: 0.15,
  recurrencePersistence: 0.15,
} as const;

export const DUPLICATE_CONFIG = {
  timeWindowDays: 14,
  highSimilarity: 0.55,
  moderateSimilarity: 0.35,
  noLocationSimilarity: 0.48,
  highDistanceMeters: 300,
  moderateDistanceMeters: 150,
  locationNameWeakSimilarity: 0.28,
} as const;

export const CATEGORY_GUIDANCE: Record<Category, { action: string; team: string; evidence: string; taskType: TaskType }> = {
  'Waste and debris': {
    action: 'Organize a safe cleanup and segregate recoverable material; record a measured quantity only when a coordinator verifies it.',
    team: 'Authorized cleanup and materials-recovery team',
    evidence: 'Coordinator note and, where safe, a completion photo; add a verified amount and unit only if measured.',
    taskType: 'waste_cleanup',
  },
  'Waterlogging and drainage': {
    action: 'Schedule an authorized drainage inspection and clearance; do not enter standing or moving floodwater.',
    team: 'Drainage maintenance crew',
    evidence: 'Inspection/clearance note and safe post-work observation.',
    taskType: 'drainage_clearance',
  },
  'Possible water contamination': {
    action: 'Request appropriate water-quality testing through a qualified authority. This report is an unverified observation, not a confirmed contamination finding.',
    team: 'Qualified water-quality testing authority',
    evidence: 'Inspection or test request reference and qualified authority findings, if received.',
    taskType: 'water_quality_request',
  },
  'Road or infrastructure damage': {
    action: 'Request an inspection by the relevant authorized maintenance team and follow its access guidance.',
    team: 'Infrastructure inspection and maintenance team',
    evidence: 'Inspection note, work order, or maintenance outcome.',
    taskType: 'infrastructure_inspection',
  },
  'Sewage overflow': {
    action: 'Escalate to the responsible sanitation authority; keep people away from affected water and surfaces.',
    team: 'Responsible sanitation authority',
    evidence: 'Escalation reference and authorized cleanup/inspection note.',
    taskType: 'sanitation_escalation',
  },
  'Damaged public facilities': {
    action: 'Request a safety and maintenance inspection by the responsible public-facilities team.',
    team: 'Public-facilities maintenance team',
    evidence: 'Inspection or maintenance ticket and completion note.',
    taskType: 'infrastructure_inspection',
  },
  'Other environmental recovery issue': {
    action: 'Review the observation with a recovery coordinator and route it to the relevant qualified team.',
    team: 'Recovery coordinator — determine specialist team',
    evidence: "Coordinator review note and the receiving team's action record.",
    taskType: 'other',
  },
};

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'Waste and debris': ['waste', 'debris', 'rubbish', 'trash', 'plastic', 'litter', 'cleanup', 'garbage', 'bags'],
  'Waterlogging and drainage': ['drain', 'blocked', 'waterlogging', 'waterlogged', 'standing water', 'flooded', 'overflow', 'culvert', 'water pooling'],
  'Possible water contamination': ['contamination', 'contaminated', 'water quality', 'discolored', 'smell', 'odor', 'oil sheen', 'testing'],
  'Road or infrastructure damage': ['road', 'pothole', 'bridge', 'crack', 'infrastructure', 'washout', 'surface damage'],
  'Sewage overflow': ['sewage', 'sewer', 'wastewater', 'manhole', 'sanitation', 'septic'],
  'Damaged public facilities': ['facility', 'park', 'playground', 'public building', 'bench', 'damaged gate'],
  'Other environmental recovery issue': ['environment', 'erosion', 'tree', 'soil', 'habitat'],
};

const BASE_FACTORS: Record<Category, Omit<ScoreFactors, 'timeSensitivity' | 'recurrencePersistence'>> = {
  'Waste and debris': { reportedImpact: 48, environmentalHarm: 68, publicSafety: 43, infrastructureDisruption: 38, evidenceAndVerification: 28, environmentalSensitivity: 72 },
  'Waterlogging and drainage': { reportedImpact: 69, environmentalHarm: 70, publicSafety: 62, infrastructureDisruption: 70, evidenceAndVerification: 28, environmentalSensitivity: 77 },
  'Possible water contamination': { reportedImpact: 42, environmentalHarm: 88, publicSafety: 58, infrastructureDisruption: 22, evidenceAndVerification: 20, environmentalSensitivity: 92 },
  'Road or infrastructure damage': { reportedImpact: 58, environmentalHarm: 38, publicSafety: 76, infrastructureDisruption: 82, evidenceAndVerification: 28, environmentalSensitivity: 40 },
  'Sewage overflow': { reportedImpact: 78, environmentalHarm: 86, publicSafety: 80, infrastructureDisruption: 65, evidenceAndVerification: 30, environmentalSensitivity: 88 },
  'Damaged public facilities': { reportedImpact: 34, environmentalHarm: 30, publicSafety: 34, infrastructureDisruption: 37, evidenceAndVerification: 28, environmentalSensitivity: 32 },
  'Other environmental recovery issue': { reportedImpact: 38, environmentalHarm: 42, publicSafety: 36, infrastructureDisruption: 30, evidenceAndVerification: 25, environmentalSensitivity: 42 },
};

const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  Reported: ['Under review', 'Closed or rejected'],
  'Under review': ['Verified', 'Assigned', 'Closed or rejected'],
  Verified: ['Under review', 'Assigned', 'Closed or rejected'],
  Assigned: ['In progress', 'Verified', 'Closed or rejected'],
  'In progress': ['Assigned', 'Resolved'],
  Resolved: ['Closed or rejected'],
  'Closed or rejected': [],
};

export function canTransition(from: IncidentStatus, to: IncidentStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: IncidentStatus): IncidentStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}

export function canReceiveReports(status: IncidentStatus): boolean {
  return status !== 'Resolved' && status !== 'Closed or rejected';
}

export function normalizeText(value: string): string {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

const STOP_WORDS = new Set(['the', 'and', 'near', 'at', 'by', 'with', 'there', 'this', 'that', 'from', 'after', 'again', 'still', 'reported', 'area', 'issue', 'water', 'some', 'very', 'has', 'have', 'was', 'were', 'for', 'into', 'along']);

function tokens(value: string): Set<string> {
  return new Set(normalizeText(value).split(' ').filter((token) => token.length > 2 && !STOP_WORDS.has(token)));
}

export function jaccardSimilarity(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const deltaLat = rad(lat2 - lat1);
  const deltaLon = rad(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function validCoordinates(latitude?: number, longitude?: number): latitude is number {
  return latitude !== undefined && longitude !== undefined && Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function categoryRelated(a: Category, b: Category): boolean {
  if (a === b) return true;
  const water = new Set<Category>(['Waterlogging and drainage', 'Possible water contamination', 'Sewage overflow']);
  const material = new Set<Category>(['Waste and debris', 'Other environmental recovery issue']);
  const infrastructure = new Set<Category>(['Road or infrastructure damage', 'Damaged public facilities']);
  return (water.has(a) && water.has(b)) || (material.has(a) && material.has(b)) || (infrastructure.has(a) && infrastructure.has(b));
}

function categoriesCompatible(a: Category, b: Category, text: string): boolean {
  if (categoryRelated(a, b)) return true;
  const wasteDrainPair = (a === 'Waste and debris' && b === 'Waterlogging and drainage') || (b === 'Waste and debris' && a === 'Waterlogging and drainage');
  return wasteDrainPair && /\b(drain|drainage|culvert|grate|blocked|blockage)\b/iu.test(text) && /\b(waste|debris|plastic|leaves|litter|rubbish|trash|branches)\b/iu.test(text);
}

export function classifyReport(selected: Category, title: string, description: string) {
  const text = normalizeText(`${title} ${description}`);
  const matches = CATEGORIES.map((category) => ({
    category,
    count: CATEGORY_KEYWORDS[category].reduce((total, keyword) => total + (text.includes(normalizeText(keyword)) ? 1 : 0), 0),
  })).sort((a, b) => b.count - a.count);
  const best = matches[0];
  const selectedCount = matches.find((match) => match.category === selected)?.count ?? 0;
  const strongConflict = best.count > selectedCount && best.count >= 2 && best.category !== selected;
  const hasKeywordSupport = selectedCount > 0;
  const predictedCategory = strongConflict ? best.category : selected;
  const needsHumanReview = strongConflict || (!hasKeywordSupport && description.trim().length < 45);
  const confidence = strongConflict ? 0.52 : hasKeywordSupport ? Math.min(0.94, 0.73 + selectedCount * 0.06) : 0.58;
  const reason = strongConflict
    ? `The selected category is ${selected}, while rule matches also suggest ${best.category}; keep the reporter's selection and review it.`
    : hasKeywordSupport
      ? `The selected category is supported by ${selectedCount} matching description/title rule${selectedCount === 1 ? '' : 's'}.`
      : 'No strong category phrase was found; the reporter-selected category is retained for human review.';
  return { selectedCategory: selected, predictedCategory, reason, confidence, needsHumanReview };
}

function deriveReportFactors(report: Pick<Report, 'category' | 'description' | 'title' | 'active' | 'verificationStatus' | 'observedAt'>): Omit<ScoreFactors, 'timeSensitivity' | 'recurrencePersistence'> {
  const base = { ...BASE_FACTORS[report.category] };
  const text = normalizeText(`${report.title} ${report.description}`);
  const persistenceWords = ['persistent', 'still', 'again', 'ongoing', 'several days', 'keeps', 'repeated'];
  const mentionsPersistence = persistenceWords.some((word) => text.includes(word));
  if (mentionsPersistence) {
    base.reportedImpact = Math.min(100, base.reportedImpact + 7);
    base.infrastructureDisruption = Math.min(100, base.infrastructureDisruption + 5);
  }
  if (/\b(multiple|many|several|dozens|families|residents|community|neighborhood|neighbourhood|school|clinic|hospital|public)\b/u.test(text)) {
    base.reportedImpact = Math.min(100, base.reportedImpact + 11);
  }
  if (/\b(blocked|closed|closure|impassable|inaccessible|cut off|washed out|access route|road damage|bridge damage)\b/u.test(text)) {
    base.infrastructureDisruption = Math.min(100, base.infrastructureDisruption + 14);
    base.reportedImpact = Math.min(100, base.reportedImpact + 5);
  }
  if (/\b(injuries|injury|injured|trapped|electrocution|live wires?|exposed wires?|sparking|collapse|collapsed|unstable|unsafe|fallen power line)\b/u.test(text)) {
    base.publicSafety = Math.min(100, base.publicSafety + 18);
    base.reportedImpact = Math.min(100, base.reportedImpact + 5);
  }
  if (/\b(oil sheen|oil|fuel|chemical|sewage|wastewater|dead fish|unusual smell|odor|odour|discolou?red|contaminated|contamination|spilled)\b/u.test(text)) {
    base.environmentalHarm = Math.min(100, base.environmentalHarm + 14);
  }
  if (!report.active) base.reportedImpact = Math.max(10, base.reportedImpact - 12);
  if (report.verificationStatus === 'verified') base.evidenceAndVerification = 92;
  else if (report.verificationStatus === 'needs review') base.evidenceAndVerification = 42;
  else base.evidenceAndVerification = 50;
  return base;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function timeFactor(dateString: string, nowMs: number): number {
  const ageHours = Math.max(0, (nowMs - new Date(dateString).getTime()) / 3600000);
  if (ageHours <= 24) return 86;
  if (ageHours <= 72) return 72;
  if (ageHours <= 168) return 55;
  return 35;
}

function rounded(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function reasonFor(category: Category, band: PriorityBand, factors: ScoreFactors, count: number, location: string): string {
  if (category === 'Possible water contamination') {
    return 'A potential water-quality concern was reported and needs qualified inspection; it remains unverified.';
  }
  if (count > 1 && category === 'Waterlogging and drainage') {
    return `Multiple reports describe a drainage issue near ${location}; persistence raises the need for an authorized inspection.`;
  }
  if (count > 1 && category === 'Waste and debris') {
    return `More than one report identifies debris near ${location}; coordinated safe cleanup and segregation may be more efficient.`;
  }
  const drivers: string[] = [];
  if (factors.reportedImpact >= 65) drivers.push('reported impact or scope cues');
  if (factors.publicSafety >= 70) drivers.push('public-safety factor');
  if (factors.environmentalHarm >= 80) drivers.push('potential environmental-harm factor, unverified');
  if (factors.infrastructureDisruption >= 70) drivers.push('infrastructure or access disruption factor');
  if (factors.environmentalSensitivity >= 75) drivers.push('environmental sensitivity');
  if (factors.timeSensitivity >= 80) drivers.push('recent observation');
  if (factors.recurrencePersistence >= 65) drivers.push('repeated or persistent reports');
  const basis = drivers.length ? drivers.slice(0, 2).join(' and ') : 'the current category-specific impact factors';
  return `${band} priority reflects ${basis} in the submitted reports; confirm provisional factors during review.`;
}

export function calculateScores(incident: Pick<Incident, 'id' | 'category' | 'locationName' | 'reportIds'>, reports: Report[], relationships: AppData['relationships'], now = new Date()): IncidentScores {
  const relatedReports = incident.reportIds.map((id) => reports.find((report) => report.id === id)).filter((report): report is Report => Boolean(report));
  const acceptedIds = new Set(relationships.filter((relationship) => relationship.incidentId === incident.id && relationship.status === 'confirmed').map((relationship) => relationship.reportId));
  const trustedReports = relatedReports.filter((report) => report.id === relatedReports[0]?.id || acceptedIds.has(report.id) || !relationships.some((relationship) => relationship.reportId === report.id && relationship.incidentId === incident.id));
  const members = trustedReports.length ? trustedReports : relatedReports.slice(0, 1);
  const factorRows = members.map(deriveReportFactors);
  const latest = members.map((report) => report.observedAt).sort().at(-1) ?? now.toISOString();
  const recurringSignal = Math.min(98, 24 + Math.max(0, members.length - 1) * 23 + (members.some((report) => /persistent|ongoing|again|still/iu.test(report.description)) ? 12 : 0));
  const factors: ScoreFactors = {
    reportedImpact: rounded(average(factorRows.map((row) => row.reportedImpact))),
    environmentalHarm: rounded(average(factorRows.map((row) => row.environmentalHarm))),
    publicSafety: rounded(average(factorRows.map((row) => row.publicSafety))),
    infrastructureDisruption: rounded(average(factorRows.map((row) => row.infrastructureDisruption))),
    evidenceAndVerification: rounded(average(factorRows.map((row) => row.evidenceAndVerification))),
    timeSensitivity: timeFactor(latest, now.getTime()),
    environmentalSensitivity: BASE_FACTORS[incident.category].environmentalSensitivity,
    recurrencePersistence: recurringSignal,
  };
  const severity = rounded(
    factors.reportedImpact * SEVERITY_WEIGHTS.reportedImpact +
    factors.environmentalHarm * SEVERITY_WEIGHTS.environmentalHarm +
    factors.publicSafety * SEVERITY_WEIGHTS.publicSafety +
    factors.infrastructureDisruption * SEVERITY_WEIGHTS.infrastructureDisruption +
    factors.evidenceAndVerification * SEVERITY_WEIGHTS.evidenceAndVerification,
  );
  const priority = rounded(
    severity * PRIORITY_WEIGHTS.severity +
    factors.timeSensitivity * PRIORITY_WEIGHTS.timeSensitivity +
    factors.environmentalSensitivity * PRIORITY_WEIGHTS.environmentalSensitivity +
    factors.recurrencePersistence * PRIORITY_WEIGHTS.recurrencePersistence,
  );
  const priorityBand: PriorityBand = priority >= 75 ? 'High' : priority >= 45 ? 'Medium' : 'Lower';
  const severityConfidence: IncidentScores['severityConfidence'] = members.every((report) => report.verificationStatus === 'verified')
    ? 'Reviewed'
    : members.some((report) => report.classification.needsHumanReview || report.verificationStatus !== 'verified')
      ? 'Provisional'
      : 'Moderate';
  return { severity, priority, priorityBand, factors, severityConfidence, explanation: reasonFor(incident.category, priorityBand, factors, members.length, incident.locationName) };
}

function reportText(report: Pick<Report, 'title' | 'description'>): string {
  return `${report.title} ${report.description}`;
}

export function findDuplicateCandidate(draft: ReportDraft, data: AppData, now = new Date()): DuplicateCandidate | undefined {
  const candidates: DuplicateCandidate[] = [];
  const draftText = `${draft.title} ${draft.description}`;
  const parsedDraftTime = new Date(draft.observedAt).getTime();
  const draftTime = Number.isFinite(parsedDraftTime) ? parsedDraftTime : now.getTime();
  const normalizedLocation = normalizeText(draft.locationName);
  for (const incident of data.incidents) {
    if (!incident.reportIds.length || !canReceiveReports(incident.status)) continue;
    const incidentReports = incident.reportIds.map((id) => data.reports.find((report) => report.id === id)).filter((report): report is Report => Boolean(report));
    const confirmed = new Set(data.relationships.filter((relationship) => relationship.incidentId === incident.id && relationship.status === 'confirmed').map((relationship) => relationship.reportId));
    const activeReports = incidentReports.filter((report) => report.id === incidentReports[0]?.id || confirmed.has(report.id) || !data.relationships.some((relationship) => relationship.reportId === report.id && relationship.incidentId === incident.id));
    if (!activeReports.length) continue;
    const withinWindow = activeReports.some((report) => Math.abs(draftTime - new Date(report.observedAt).getTime()) <= DUPLICATE_CONFIG.timeWindowDays * 86400000);
    if (!withinWindow || !categoriesCompatible(draft.category, incident.category, draftText)) continue;
    const similarity = Math.max(...activeReports.map((report) => jaccardSimilarity(draftText, reportText(report))));
    let distanceMeters: number | undefined;
    if (validCoordinates(draft.latitude, draft.longitude) && validCoordinates(incident.latitude, incident.longitude)) {
      distanceMeters = haversineMeters(draft.latitude, draft.longitude!, incident.latitude, incident.longitude!);
    }
    const sameLocationName = normalizedLocation.length > 0 && normalizedLocation === normalizeText(incident.locationName);
    let kind: DuplicateCandidate['kind'] | undefined;
    let rationale = '';
    if (distanceMeters !== undefined && similarity >= DUPLICATE_CONFIG.highSimilarity && distanceMeters <= DUPLICATE_CONFIG.highDistanceMeters) {
      kind = 'likely duplicate';
      rationale = `Strong text similarity (${Math.round(similarity * 100)}%) and submitted coordinates within ${Math.round(distanceMeters)} m; coordinator confirmation required.`;
    } else if (distanceMeters !== undefined && similarity >= DUPLICATE_CONFIG.moderateSimilarity && distanceMeters <= DUPLICATE_CONFIG.moderateDistanceMeters) {
      kind = 'possible duplicate';
      rationale = `Moderate text similarity (${Math.round(similarity * 100)}%) and coordinates within ${Math.round(distanceMeters)} m; review the evidence before linking.`;
    } else if (distanceMeters === undefined && similarity >= DUPLICATE_CONFIG.noLocationSimilarity) {
      kind = 'related report';
      rationale = `Text similarity is ${Math.round(similarity * 100)}%, but coordinates are unavailable; this is a manual-review suggestion, not an automatic merge.`;
    } else if (distanceMeters === undefined && sameLocationName && similarity >= DUPLICATE_CONFIG.locationNameWeakSimilarity) {
      kind = 'possible duplicate';
      rationale = `The location name matches and text similarity is ${Math.round(similarity * 100)}%, but place-name matching is weak evidence without coordinates.`;
    }
    if (kind) candidates.push({ incident, similarity, distanceMeters, kind, rationale });
  }
  return candidates.sort((a, b) => b.similarity - a.similarity)[0];
}

export function createIncidentFromReport(report: Report, id: string, status: IncidentStatus = 'Reported', now = new Date()): Incident {
  const incident: Incident = {
    id,
    title: report.title,
    category: report.category,
    description: report.description,
    locationName: report.locationName,
    ...(validCoordinates(report.latitude, report.longitude) ? { latitude: report.latitude, longitude: report.longitude } : {}),
    reportIds: [report.id],
    createdAt: report.createdAt,
    updatedAt: now.toISOString(),
    status,
    scores: { severity: 0, priority: 0, priorityBand: 'Lower', factors: { reportedImpact: 0, environmentalHarm: 0, publicSafety: 0, infrastructureDisruption: 0, evidenceAndVerification: 0, timeSensitivity: 0, environmentalSensitivity: 0, recurrencePersistence: 0 }, severityConfidence: 'Provisional', explanation: '' },
    coordinatorNotes: [],
  };
  incident.scores = calculateScores(incident, [report], [], now);
  return incident;
}

export function recalculateIncident(incident: Incident, reports: Report[], relationships: AppData['relationships'], now = new Date()): Incident {
  return { ...incident, updatedAt: now.toISOString(), scores: calculateScores(incident, reports, relationships, now) };
}

export function getReportCount(incident: Incident): number {
  return incident.reportIds.length;
}

export function getPriorityReason(incident: Incident): string {
  return incident.scores.explanation;
}

export function validateStatusValue(value: string): value is IncidentStatus {
  return (STATUSES as readonly string[]).includes(value);
}
