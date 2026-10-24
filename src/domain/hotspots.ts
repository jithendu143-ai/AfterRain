import type { AppData, Category, Incident } from './types';
import { haversineMeters, jaccardSimilarity, normalizeText, validCoordinates } from './engine';
import { getTrackedIncidents } from './selectors';

export const HOTSPOT_CONFIG = { proximityMeters: 500, locationNameSimilarity: 0.75 } as const;

export interface EnvironmentalHotspot {
  id: string;
  incidentIds: string[];
  locations: string[];
  categories: Category[];
  firstObservedAt: string;
  lastObservedAt: string;
  evidence: 'submitted-coordinate proximity' | 'matching location names' | 'mixed proximity and place-name links';
  coordinateLinks: number;
  placeNameLinks: number;
  everyPairWithinDistance: boolean;
  needsCoordinatorReview: true;
}

function pointsFor(incident: Incident, data: AppData): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  if (validCoordinates(incident.latitude, incident.longitude)) points.push([incident.latitude, incident.longitude!]);
  for (const reportId of incident.reportIds) {
    const report = data.reports.find((item) => item.id === reportId);
    if (report && validCoordinates(report.latitude, report.longitude)) points.push([report.latitude, report.longitude!]);
  }
  return points;
}

function placeNameMatch(a: string, b: string): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (left && left === right) return true;
  const leftTerms = left.split(' ').filter((term) => term.length > 2);
  const rightTerms = right.split(' ').filter((term) => term.length > 2);
  return leftTerms.length >= 2 && rightTerms.length >= 2 && jaccardSimilarity(left, right) >= HOTSPOT_CONFIG.locationNameSimilarity;
}

export function detectEnvironmentalHotspots(data: AppData): EnvironmentalHotspot[] {
  const incidents = getTrackedIncidents(data).filter((incident) => incident.status !== 'Closed or rejected');
  const adjacency = new Map<string, Set<string>>();
  const coordinateEdges = new Set<string>();
  const placeNameEdges = new Set<string>();
  for (const incident of incidents) adjacency.set(incident.id, new Set());
  for (let i = 0; i < incidents.length; i += 1) {
    for (let j = i + 1; j < incidents.length; j += 1) {
      const left = incidents[i];
      const right = incidents[j];
      const leftPoints = pointsFor(left, data);
      const rightPoints = pointsFor(right, data);
      let coordinateNearby = false;
      for (const [lat1, lon1] of leftPoints) {
        for (const [lat2, lon2] of rightPoints) {
          if (haversineMeters(lat1, lon1, lat2, lon2) <= HOTSPOT_CONFIG.proximityMeters) coordinateNearby = true;
        }
      }
      const placeMatch = placeNameMatch(left.locationName, right.locationName);
      if (coordinateNearby || placeMatch) {
        adjacency.get(left.id)?.add(right.id);
        adjacency.get(right.id)?.add(left.id);
        if (coordinateNearby) coordinateEdges.add([left.id, right.id].sort().join('::'));
        if (placeMatch) placeNameEdges.add([left.id, right.id].sort().join('::'));
      }
    }
  }
  const byId = new Map(incidents.map((incident) => [incident.id, incident]));
  const visited = new Set<string>();
  const hotspots: EnvironmentalHotspot[] = [];
  for (const incident of incidents) {
    if (visited.has(incident.id) || !(adjacency.get(incident.id)?.size)) continue;
    const stack = [incident.id];
    const clusterIds: string[] = [];
    while (stack.length) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      clusterIds.push(current);
      for (const neighbor of adjacency.get(current) ?? []) if (!visited.has(neighbor)) stack.push(neighbor);
    }
    if (clusterIds.length < 2) continue;
    const clusterIncidents = clusterIds.map((id) => byId.get(id)).filter((item): item is Incident => Boolean(item));
    const dates = clusterIncidents.flatMap((item) => item.reportIds.map((reportId) => data.reports.find((report) => report.id === reportId)?.observedAt ?? item.createdAt)).sort();
    const pairs = clusterIds.flatMap((left, index) => clusterIds.slice(index + 1).map((right) => [left, right].sort().join('::')));
    const coordinateLinks = pairs.filter((pair) => coordinateEdges.has(pair)).length;
    const placeNameLinks = pairs.filter((pair) => placeNameEdges.has(pair)).length;
    hotspots.push({
      id: `HOT-${clusterIds.slice().sort().join('-')}`,
      incidentIds: clusterIds,
      locations: [...new Set(clusterIncidents.map((item) => item.locationName))],
      categories: [...new Set(clusterIncidents.map((item) => item.category))],
      firstObservedAt: dates[0] ?? clusterIncidents[0].createdAt,
      lastObservedAt: dates.at(-1) ?? clusterIncidents[0].updatedAt,
      evidence: coordinateLinks && placeNameLinks ? 'mixed proximity and place-name links' : coordinateLinks ? 'submitted-coordinate proximity' : 'matching location names',
      coordinateLinks,
      placeNameLinks,
      everyPairWithinDistance: coordinateLinks === pairs.length,
      needsCoordinatorReview: true,
    });
  }
  return hotspots.sort((a, b) => b.incidentIds.length - a.incidentIds.length || b.lastObservedAt.localeCompare(a.lastObservedAt));
}
