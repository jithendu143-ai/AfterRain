import { calculateScores, classifyReport } from '../domain/engine';
import type { AppData, Category, Incident, Report, ReportRelationship, RecoveryTask, StatusEvent } from '../domain/types';

const isoDaysAgo = (days: number, hours = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, 15, 0, 0);
  return date.toISOString();
};

function report(
  id: string,
  title: string,
  description: string,
  category: Category,
  locationName: string,
  daysAgo: number,
  options: Partial<Pick<Report, 'verificationStatus' | 'active' | 'anonymous' | 'reporterName' | 'imageDataUrl' | 'latitude' | 'longitude'>> = {}
): Report {
  const observedAt = isoDaysAgo(daysAgo, 8 + (daysAgo % 7));
  const createdAt = isoDaysAgo(Math.max(0, daysAgo - 0.1), 10);
  return {
    id,
    title,
    description,
    category,
    locationName,
    latitude: options.latitude,
    longitude: options.longitude,
    observedAt,
    createdAt,
    anonymous: options.anonymous ?? false,
    ...(options.anonymous ? {} : { reporterName: options.reporterName ?? 'Kerala community volunteer' }),
    active: options.active ?? true,
    verificationStatus: options.verificationStatus ?? 'unverified',
    linkedIncidentId: '',
    classification: classifyReport(category, title, description),
    ...(options.imageDataUrl ? { imageDataUrl: options.imageDataUrl } : {}),
  };
}

function event(
  id: string,
  entityType: StatusEvent['entityType'],
  entityId: string,
  newStatus: string,
  daysAgo: number,
  previousStatus?: string,
  note?: string
): StatusEvent {
  return {
    id,
    entityType,
    entityId,
    newStatus,
    timestamp: isoDaysAgo(daysAgo, 12),
    actor: 'Coordinator',
    ...(previousStatus ? { previousStatus } : {}),
    ...(note ? { note } : {}),
  };
}

function task(
  id: string,
  incidentId: string,
  action: string,
  taskType: RecoveryTask['taskType'],
  assignedTeam: string,
  status: RecoveryTask['status'],
  createdDaysAgo: number,
  details: Partial<RecoveryTask> = {}
): RecoveryTask {
  const createdAt = isoDaysAgo(createdDaysAgo, 13);
  return {
    id,
    incidentId,
    action,
    taskType,
    assignedTeam,
    status,
    createdAt,
    updatedAt: details.updatedAt ?? createdAt,
    notes: details.notes ?? [],
    ...details,
  };
}

export function createSeedData(): AppData {
  const reports: Report[] = [
    report(
      'RPT-KL-1001',
      'Stone culvert blocked along Aluva Bypass Road',
      'Post-monsoon floodwater is backing up beside the road shoulder. The roadside stone drainage thodu is choked with mud, fallen coconut palm fronds, and plastic debris from the Periyar surge.',
      'Waterlogging and drainage',
      'Aluva Manappuram Road, Periyar Basin (DEMO)',
      4,
      { reporterName: 'Anand Nair', imageDataUrl: '/images/before.jpg', latitude: 10.1076, longitude: 76.3516 }
    ),
    report(
      'RPT-KL-1002',
      'Aluva bypass canal still holding flood runoff',
      'The blocked roadside thodu at Aluva Manappuram is still retaining stagnant floodwater. Silt and palm leaves are completely covering the stone culvert entrance.',
      'Waterlogging and drainage',
      'Aluva Manappuram Road, Periyar Basin (DEMO)',
      3,
      { reporterName: 'Reshmi Menon', latitude: 10.1082, longitude: 76.3522 }
    ),
    report(
      'RPT-KL-1003',
      'Stagnant water remains near Aluva Manappuram thodu',
      'Standing water remains beside the same arterial stone canal; drainage capacity is severely impeded and secondary flooding is threatening nearby houses.',
      'Waterlogging and drainage',
      'Aluva Manappuram Road, Periyar Basin (DEMO)',
      1,
      { anonymous: true, latitude: 10.1070, longitude: 76.3510 }
    ),
    report(
      'RPT-KL-1004',
      'Flood plastics and branches along Chalakudy river walkway',
      'Plastic packaging, bottles, and washed storm branches have accumulated along the river embankment near the public walkway. Coordinated collection needed.',
      'Waste and debris',
      'Chalakudy River Walkway, Thrissur (DEMO)',
      2,
      { reporterName: 'Faisal Rahman', imageDataUrl: '/images/debris.jpg', latitude: 10.3070, longitude: 76.3330 }
    ),
    report(
      'RPT-KL-1005',
      'Additional flood debris along Chalakudy riverbank',
      'Further plastic waste and sodden bamboo stems are caught along the same riverbank slope by the walking track following water recession.',
      'Waste and debris',
      'Chalakudy River Walkway, Thrissur (DEMO)',
      1,
      { anonymous: true, latitude: 10.3078, longitude: 76.3338 }
    ),
    report(
      'RPT-KL-1006',
      'Turbidity and sheen noticed in Paravur open ring well',
      'A resident observed unusual water turbidity and a light sheen in a domestic ring well after floodwaters entered the courtyard. No sample has been analyzed; requesting qualified water-quality inspection.',
      'Possible water contamination',
      'North Paravur Aquifer Zone, Ernakulam (DEMO)',
      1,
      { reporterName: 'Dr. Jacob Varghese', imageDataUrl: '/images/water-test.jpg', latitude: 10.1480, longitude: 76.2280 }
    ),
    report(
      'RPT-KL-1007',
      'Road shoulder washed away on Edappally Canal bridge',
      'Monsoon flood runoff washed out a portion of the road shoulder and culvert embankment near the Edappally canal bridge. Inspection requested for vehicular safety.',
      'Road or infrastructure damage',
      'Edappally Canal Bridge, Ernakulam (DEMO)',
      5,
      { reporterName: 'Aswathi K.', latitude: 10.0261, longitude: 76.3085 }
    ),
    report(
      'RPT-KL-1008',
      'Sewage-like runoff near Kalamassery metro underpass',
      'Water with a strong sewage odor is visible pooling near the Kalamassery underpass drain. Public cautioned to avoid contact pending sanitation authority review.',
      'Sewage overflow',
      'Kalamassery Metro Underpass, Ernakulam (DEMO)',
      0,
      { anonymous: true, verificationStatus: 'needs review', latitude: 10.0520, longitude: 76.3260 }
    ),
    report(
      'RPT-KL-1009',
      'Haritha Karma Sena completed flood plastic segregation',
      'Flood plastics, scrap timber, and packaging safely collected and segregated into circular recycling streams at the Kalamassery Panchayat recovery yard.',
      'Waste and debris',
      'Kalamassery Grama Panchayat Depot (DEMO)',
      8,
      { reporterName: 'Lakshmi Amma', verificationStatus: 'verified', active: false, imageDataUrl: '/images/after.jpg', latitude: 10.0540, longitude: 76.3290 }
    ),
    report(
      'RPT-KL-1010',
      'Flood warning gauge board loose on Meppadi road',
      'A community flood-level gauge marker near the Meppadi bridge was loosened by torrential monsoon runoff; requires routine maintenance inspection.',
      'Damaged public facilities',
      'Meppadi Hillside Road, Wayanad (DEMO)',
      12,
      { reporterName: 'Sujith Kumar', verificationStatus: 'verified', active: false, latitude: 11.5510, longitude: 76.1260 }
    ),
  ];

  const incidents: Incident[] = [
    {
      id: 'INC-KL-001',
      title: 'Blocked stone canal culvert at Aluva Manappuram',
      category: 'Waterlogging and drainage',
      description: 'Flood runoff is stagnating beside an arterial stone canal choked by monsoon silt and coconut palm fronds.',
      locationName: 'Aluva Manappuram Road, Periyar Basin (DEMO)',
      latitude: 10.1076,
      longitude: 76.3516,
      reportIds: ['RPT-KL-1001', 'RPT-KL-1002', 'RPT-KL-1003'],
      createdAt: reports[0].createdAt,
      updatedAt: isoDaysAgo(0, 12),
      status: 'In progress',
      assignedTeam: 'Aluva Municipal Drainage & Fire Rescue',
      scores: {} as Incident['scores'],
      coordinatorNotes: ['Three separately submitted field observations retained and linked for transparent triage.'],
    },
    {
      id: 'INC-KL-002',
      title: 'Accumulated debris along Chalakudy riverbank',
      category: 'Waste and debris',
      description: 'Plastic packaging and flood branches have accumulated along the public walkway edge of the Chalakudy River.',
      locationName: 'Chalakudy River Walkway, Thrissur (DEMO)',
      latitude: 10.3070,
      longitude: 76.3330,
      reportIds: ['RPT-KL-1004', 'RPT-KL-1005'],
      createdAt: reports[3].createdAt,
      updatedAt: isoDaysAgo(0, 11),
      status: 'Assigned',
      assignedTeam: 'Chalakudy River Conservation Squad',
      scores: {} as Incident['scores'],
      coordinatorNotes: ['Safe access protocol and circular material segregation agreed before volunteer dispatch.'],
    },
    {
      id: 'INC-KL-003',
      title: 'Unverified domestic well turbidity observation',
      category: 'Possible water contamination',
      description: 'Resident observed unusual water sheen and turbidity in a domestic ring well; professional multi-probe test requested.',
      locationName: 'North Paravur Aquifer Zone, Ernakulam (DEMO)',
      latitude: 10.1480,
      longitude: 76.2280,
      reportIds: ['RPT-KL-1006'],
      createdAt: reports[5].createdAt,
      updatedAt: reports[5].createdAt,
      status: 'Under review',
      assignedTeam: 'Suchitwa Mission Water Quality Unit',
      scores: {} as Incident['scores'],
      coordinatorNotes: ['Observation is retained as unverified field alert; qualified laboratory or field testing requested.'],
    },
    {
      id: 'INC-KL-004',
      title: 'Eroded road shoulder near Edappally Canal bridge',
      category: 'Road or infrastructure damage',
      description: 'Section of the road shoulder eroded by canal runoff; inspection required by PWD maintenance division.',
      locationName: 'Edappally Canal Bridge, Ernakulam (DEMO)',
      latitude: 10.0261,
      longitude: 76.3085,
      reportIds: ['RPT-KL-1007'],
      createdAt: reports[6].createdAt,
      updatedAt: reports[6].createdAt,
      status: 'Reported',
      assignedTeam: 'PWD Roads Division, Ernakulam',
      scores: {} as Incident['scores'],
      coordinatorNotes: [],
    },
    {
      id: 'INC-KL-005',
      title: 'Suspected sewage-like runoff at Kalamassery underpass',
      category: 'Sewage overflow',
      description: 'Strong sewage odor and standing runoff reported near the underpass drain; official sanitation check pending.',
      locationName: 'Kalamassery Metro Underpass, Ernakulam (DEMO)',
      latitude: 10.0520,
      longitude: 76.3260,
      reportIds: ['RPT-KL-1008'],
      createdAt: reports[7].createdAt,
      updatedAt: reports[7].createdAt,
      status: 'Assigned',
      assignedTeam: 'Kalamassery Municipality Sanitation Liaison',
      scores: {} as Incident['scores'],
      coordinatorNotes: ['Assigned for municipal sanitation review; keep public away from affected pooled water.'],
    },
    {
      id: 'INC-KL-006',
      title: 'Documented Haritha Karma Sena flood waste segregation',
      category: 'Waste and debris',
      description: 'Organized community waste sorting completed and verified with photographic evidence by the local coordinator.',
      locationName: 'Kalamassery Grama Panchayat Depot (DEMO)',
      latitude: 10.0540,
      longitude: 76.3290,
      reportIds: ['RPT-KL-1009'],
      createdAt: reports[8].createdAt,
      updatedAt: isoDaysAgo(6, 12),
      status: 'Resolved',
      assignedTeam: 'Haritha Karma Sena Unit #4',
      resolutionNotes: 'Post-flood plastic bottles, scrap cardboard, and timber successfully sorted for circular processing.',
      completionEvidence: 'Panchayat coordinator verification logged with photographic evidence.',
      scores: {} as Incident['scores'],
      coordinatorNotes: [],
    },
    {
      id: 'INC-KL-007',
      title: 'Routine flood gauge maintenance at Meppadi',
      category: 'Damaged public facilities',
      description: 'Loose flood gauge marker requires scheduled maintenance inspection on Meppadi hillside road.',
      locationName: 'Meppadi Hillside Road, Wayanad (DEMO)',
      latitude: 11.5510,
      longitude: 76.1260,
      reportIds: ['RPT-KL-1010'],
      createdAt: reports[9].createdAt,
      updatedAt: reports[9].createdAt,
      status: 'Reported',
      assignedTeam: 'Wayanad Slope Management Cell',
      scores: {} as Incident['scores'],
      coordinatorNotes: [],
    },
  ];

  for (const incident of incidents) {
    for (const reportId of incident.reportIds) {
      const linked = reports.find((item) => item.id === reportId);
      if (linked) linked.linkedIncidentId = incident.id;
    }
  }

  const relationships: ReportRelationship[] = [
    {
      id: 'REL-KL-001',
      reportId: 'RPT-KL-1002',
      incidentId: 'INC-KL-001',
      kind: 'likely duplicate',
      similarity: 0.74,
      status: 'confirmed',
      rationale: 'Matching category, closely related text, and proximate coordinates along Aluva Manappuram bypass.',
      createdAt: isoDaysAgo(3, 14),
      decidedAt: isoDaysAgo(3, 16),
      reviewerNotes: 'Retained as a separate original report; linked for consolidated operational dispatch.',
    },
    {
      id: 'REL-KL-002',
      reportId: 'RPT-KL-1003',
      incidentId: 'INC-KL-001',
      kind: 'likely duplicate',
      similarity: 0.67,
      status: 'confirmed',
      rationale: 'Matching category and recurring drainage obstruction at the same Aluva canal culvert location.',
      createdAt: isoDaysAgo(1, 11),
      decidedAt: isoDaysAgo(1, 13),
      reviewerNotes: 'Separate citizen observation retained in the chronological ledger.',
    },
    {
      id: 'REL-KL-003',
      reportId: 'RPT-KL-1005',
      incidentId: 'INC-KL-002',
      kind: 'possible duplicate',
      similarity: 0.62,
      status: 'confirmed',
      rationale: 'Related plastic debris report along the same Chalakudy riverbank stretch; coordinator confirmed grouping.',
      createdAt: isoDaysAgo(1, 10),
      decidedAt: isoDaysAgo(1, 13),
      reviewerNotes: 'Two distinct community observations, unified into one safe-cleanup mission.',
    },
  ];

  const tasks: RecoveryTask[] = [
    task(
      'TASK-KL-001',
      'INC-KL-001',
      'Deploy mechanical excavator & drainage squad to unblock Aluva stone culvert.',
      'drainage_clearance',
      'Aluva Municipal Drainage & Fire Rescue',
      'In progress',
      2,
      { notes: ['Inspection completed; clearance initiated from downstream outlet to avoid flash surges.'] }
    ),
    task(
      'TASK-KL-002',
      'INC-KL-002',
      'Organize safe riverbank cleanup and circular waste segregation along Chalakudy.',
      'waste_cleanup',
      'Chalakudy River Conservation Squad',
      'Assigned',
      1,
      { notes: ['Ensure life jackets and protective gear for all volunteers along the river edge.'] }
    ),
    task(
      'TASK-KL-003',
      'INC-KL-003',
      'Conduct multi-parameter digital probe & laboratory water safety screening in Paravur.',
      'water_quality_request',
      'Suchitwa Mission Water Quality Unit',
      'Under review',
      0,
      { notes: ['Verify turbidity, electrical conductivity, and test for bacteriological contamination.'] }
    ),
    task(
      'TASK-KL-004',
      'INC-KL-005',
      'Escalate Kalamassery underpass sewage seepage to municipal health authority.',
      'sanitation_escalation',
      'Kalamassery Municipality Sanitation Liaison',
      'Assigned',
      0,
      { notes: ['Deploy safety barrier tape; coordinate pump-out with municipal suction vehicle.'] }
    ),
    task(
      'TASK-KL-005',
      'INC-KL-006',
      'Complete plastic sorting and circular transfer to Clean Kerala Company.',
      'waste_cleanup',
      'Haritha Karma Sena Unit #4',
      'Resolved',
      7,
      {
        updatedAt: isoDaysAgo(6, 12),
        notes: ['Coordinator logged 94% diversion rate with photographic evidence.'],
        resolutionNotes: '16 cubic meters of segregated flood plastic and timber diverted from water bodies.',
        completionEvidence: 'Panchayat coordinator verification logged with photo proof.',
      }
    ),
  ];

  const history: StatusEvent[] = [
    event('EVT-KL-001', 'incident', 'INC-KL-001', 'Reported', 4),
    event('EVT-KL-002', 'incident', 'INC-KL-001', 'Under review', 3, 'Reported', 'Duplicate candidates reviewed; originals retained in the ledger.'),
    event('EVT-KL-003', 'incident', 'INC-KL-001', 'Verified', 2, 'Under review', 'Coordinator verified stone culvert choke for emergency clearance.'),
    event('EVT-KL-004', 'incident', 'INC-KL-001', 'Assigned', 2, 'Verified', 'Assigned to Aluva Municipal Drainage & Fire Rescue.'),
    event('EVT-KL-005', 'incident', 'INC-KL-001', 'In progress', 1, 'Assigned', 'Excavation and culvert clearance operations underway.'),
    event('EVT-KL-006', 'incident', 'INC-KL-002', 'Reported', 2),
    event('EVT-KL-007', 'incident', 'INC-KL-002', 'Under review', 1, 'Reported'),
    event('EVT-KL-008', 'incident', 'INC-KL-002', 'Assigned', 1, 'Under review', 'Assigned to Chalakudy River Conservation Squad.'),
    event('EVT-KL-009', 'incident', 'INC-KL-003', 'Reported', 1),
    event('EVT-KL-010', 'incident', 'INC-KL-003', 'Under review', 0, 'Reported', 'Qualified inspection requested through Suchitwa Mission; observation flagged unverified.'),
    event('EVT-KL-011', 'incident', 'INC-KL-004', 'Reported', 5),
    event('EVT-KL-012', 'incident', 'INC-KL-005', 'Reported', 0),
    event('EVT-KL-013', 'incident', 'INC-KL-005', 'Under review', 0, 'Reported', 'Routed for urgent municipal sanitation review.'),
    event('EVT-KL-020', 'incident', 'INC-KL-005', 'Assigned', 0, 'Under review', 'Assigned to Kalamassery Municipality Sanitation Liaison.'),
    event('EVT-KL-014', 'incident', 'INC-KL-006', 'Reported', 8),
    event('EVT-KL-015', 'incident', 'INC-KL-006', 'Under review', 7, 'Reported'),
    event('EVT-KL-016', 'incident', 'INC-KL-006', 'Assigned', 7, 'Under review', 'Assigned to Haritha Karma Sena Unit #4.'),
    event('EVT-KL-017', 'incident', 'INC-KL-006', 'In progress', 7, 'Assigned'),
    event('EVT-KL-018', 'incident', 'INC-KL-006', 'Resolved', 6, 'In progress', 'Completion verification recorded with photographic evidence.'),
    event('EVT-KL-019', 'incident', 'INC-KL-007', 'Reported', 12),
  ];

  for (const incident of incidents) {
    incident.scores = calculateScores(incident, reports, relationships);
  }

  return { schemaVersion: 1, reports, incidents, relationships, tasks, history };
}
