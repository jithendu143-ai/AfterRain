export const CATEGORIES = [
  'Waste and debris',
  'Waterlogging and drainage',
  'Possible water contamination',
  'Road or infrastructure damage',
  'Sewage overflow',
  'Damaged public facilities',
  'Other environmental recovery issue',
] as const;

export type Category = (typeof CATEGORIES)[number];
export const STATUSES = [
  'Reported',
  'Under review',
  'Verified',
  'Assigned',
  'In progress',
  'Resolved',
  'Closed or rejected',
] as const;
export type IncidentStatus = (typeof STATUSES)[number];
export type PriorityBand = 'High' | 'Medium' | 'Lower';
export type VerificationStatus = 'unverified' | 'needs review' | 'verified';
export type RelationshipStatus = 'proposed' | 'confirmed' | 'rejected';
export type RelationshipKind = 'likely duplicate' | 'possible duplicate' | 'related report';
export type TaskType = 'waste_cleanup' | 'water_quality_request' | 'drainage_clearance' | 'infrastructure_inspection' | 'sanitation_escalation' | 'other';

export interface Classification {
  selectedCategory: Category;
  predictedCategory: Category;
  reason: string;
  confidence: number;
  needsHumanReview: boolean;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: Category;
  locationName: string;
  latitude?: number;
  longitude?: number;
  observedAt: string;
  createdAt: string;
  reporterName?: string;
  anonymous: boolean;
  active: boolean;
  imageDataUrl?: string;
  verificationStatus: VerificationStatus;
  linkedIncidentId: string;
  classification: Classification;
}

export interface ScoreFactors {
  reportedImpact: number;
  environmentalHarm: number;
  publicSafety: number;
  infrastructureDisruption: number;
  evidenceAndVerification: number;
  timeSensitivity: number;
  environmentalSensitivity: number;
  recurrencePersistence: number;
}

export interface IncidentScores {
  severity: number;
  priority: number;
  priorityBand: PriorityBand;
  factors: ScoreFactors;
  severityConfidence: 'Provisional' | 'Moderate' | 'Reviewed';
  explanation: string;
}

export interface Incident {
  id: string;
  title: string;
  category: Category;
  description: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  reportIds: string[];
  createdAt: string;
  updatedAt: string;
  status: IncidentStatus;
  assignedTeam?: string;
  resolutionNotes?: string;
  completionEvidence?: string;
  scores: IncidentScores;
  coordinatorNotes: string[];
}

export interface ReportRelationship {
  id: string;
  reportId: string;
  incidentId: string;
  kind: RelationshipKind;
  similarity: number;
  distanceMeters?: number;
  status: RelationshipStatus;
  rationale: string;
  reviewerNotes?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface RecoveryTask {
  id: string;
  incidentId: string;
  action: string;
  taskType: TaskType;
  assignedTeam: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  notes: string[];
  resolutionNotes?: string;
  completionEvidence?: string;
  measuredQuantity?: number;
  measuredUnit?: string;
  measurementVerified?: boolean;
}

export interface StatusEvent {
  id: string;
  entityType: 'incident' | 'report' | 'task';
  entityId: string;
  previousStatus?: string;
  newStatus: string;
  timestamp: string;
  actor: 'Reporter' | 'Coordinator' | 'System';
  note?: string;
}

export interface AppData {
  schemaVersion: 1;
  reports: Report[];
  incidents: Incident[];
  relationships: ReportRelationship[];
  tasks: RecoveryTask[];
  history: StatusEvent[];
}

export interface ReportDraft {
  title: string;
  description: string;
  category: Category;
  locationName: string;
  latitude?: number;
  longitude?: number;
  observedAt: string;
  reporterName?: string;
  anonymous: boolean;
  active: boolean;
  imageDataUrl?: string;
}

export interface DuplicateCandidate {
  incident: Incident;
  similarity: number;
  distanceMeters?: number;
  kind: RelationshipKind;
  rationale: string;
}
