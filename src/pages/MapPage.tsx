import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { MapPinned } from 'lucide-react';
import { useAppState } from '../state/AppState';
import { CATEGORIES, STATUSES } from '../domain/types';
import { validCoordinates } from '../domain/engine';
import { getTrackedIncidents } from '../domain/selectors';
import { CategoryTag, PageHeading, PriorityBadge, StatusBadge } from '../components/ui';

export function MapPage() {
  const { data } = useAppState();
  const incidents = useMemo(() => getTrackedIncidents(data), [data]);
  const [category, setCategory] = useState('All categories');
  const [status, setStatus] = useState('All statuses');
  const [basemapUnavailable, setBasemapUnavailable] = useState(false);
  const withCoordinates = useMemo(() => incidents.filter((incident) => validCoordinates(incident.latitude, incident.longitude)), [incidents]);
  const filtered = withCoordinates.filter((incident) => (category === 'All categories' || incident.category === category) && (status === 'All statuses' || incident.status === status));
  const visibleIncidents = incidents.filter((incident) => (category === 'All categories' || incident.category === category) && (status === 'All statuses' || incident.status === status)).sort((a, b) => b.scores.priority - a.scores.priority);
  const center: [number, number] = filtered.length ? [filtered[0].latitude!, filtered[0].longitude!] : [20, 0];
  const colorFor = (band: string) => band === 'High' ? '#D49A43' : band === 'Medium' ? '#91A58D' : '#244F40';

  useEffect(() => setBasemapUnavailable(false), [category, status]);

  return <>
    <PageHeading eyebrow="LOCATION-BASED EXPLORER" title="Recovery map" description="Map markers appear only when a report includes valid coordinates. Fictional sample locations are not assigned invented pins." />
    <div className="map-legend"><span><i />High priority</span><span><i className="medium" />Medium priority</span><span><i className="lower" />Lower priority</span><span>{filtered.length} geolocated incident{filtered.length === 1 ? '' : 's'}</span></div>
    <div className="map-layout">
      <section className="section-card map-card">
        <div className="section-card-head"><div><h2>Submitted coordinates</h2><p>{filtered.length ? 'OpenStreetMap basemap · no paid map key required.' : 'No matching incident has supplied coordinates; no sample pins are invented.'}</p></div></div>
        <div className="map-frame">
          {!filtered.length ? <div className="map-placeholder" role="status"><span className="map-placeholder-icon"><MapPinned size={21} /></span><div><strong>No matching incident includes coordinates</strong><p>Location names remain available in the explorer. A precise pin is optional for reports and is shown only when supplied.</p></div></div> : basemapUnavailable ? <div className="map-placeholder map-placeholder-warning" role="status"><span className="map-placeholder-icon"><MapPinned size={21} /></span><div><strong>OpenStreetMap tiles are unavailable in this session</strong><p>Submitted coordinates are unchanged. Use the filtered incident explorer to review location names and open records.</p><Link to="/incidents">Open incident intelligence</Link></div></div> : <MapContainer center={center} zoom={filtered.length ? 12 : 2} scrollWheelZoom={true} zoomControl={true} attributionControl={true}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setBasemapUnavailable(true) }} />
            {filtered.map((incident) => <CircleMarker key={incident.id} center={[incident.latitude!, incident.longitude!]} radius={incident.scores.priorityBand === 'High' ? 10 : 8} pathOptions={{ color: colorFor(incident.scores.priorityBand), fillColor: colorFor(incident.scores.priorityBand), fillOpacity: 0.78, weight: 2 }}><Popup><strong>{incident.title}</strong><br />{incident.id} · {incident.scores.priorityBand} priority<br />{incident.locationName}<br /><Link to={`/incidents/${incident.id}`}>Open incident details</Link></Popup></CircleMarker>)}
          </MapContainer>}
        </div>
      </section>
      <section className="section-card map-explorer-card">
        <div className="section-card-head"><div><h2>Incident explorer</h2><p>Filter by category and current status. All locations remain browseable without a pin.</p></div><MapPinned size={16} color="#6d8a73" /></div>
        <div className="map-filter-row"><select aria-label="Filter map by category" value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter map by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></div>
        {visibleIncidents.length ? <div className="map-list">{visibleIncidents.map((incident) => <Link key={incident.id} to={`/incidents/${incident.id}`} className="map-record"><span>{incident.id} · {incident.reportIds.length} linked report{incident.reportIds.length === 1 ? '' : 's'}</span><strong>{incident.title}</strong><span>{incident.locationName}{validCoordinates(incident.latitude, incident.longitude) ? ` · ${incident.latitude?.toFixed(4)}, ${incident.longitude?.toFixed(4)}` : ' · no coordinates supplied'}</span><div className="incident-card-tags" style={{ marginTop: 8 }}><CategoryTag category={incident.category} /><StatusBadge status={incident.status} /><PriorityBadge band={incident.scores.priorityBand} /></div></Link>)}</div> : <p className="support-empty map-list-empty">No incidents match the selected category and status filters.</p>}
      </section>
    </div>
  </>;
}
