import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import type { Incident } from '../domain/types';
import { validCoordinates } from '../domain/engine';

function colorFor(band: Incident['scores']['priorityBand']) {
  return band === 'High' ? '#D49A43' : band === 'Medium' ? '#91A58D' : '#244F40';
}

function FitReportedPoints({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [18, 18], maxZoom: 12 });
    else if (points.length === 1) map.setView(points[0], 12);
  }, [map, points]);
  return null;
}

export function MapPreview({ incidents }: { incidents: Incident[] }) {
  const located = useMemo(() => incidents.filter((incident) => validCoordinates(incident.latitude, incident.longitude)), [incidents]);
  const points = useMemo(() => located.map((incident) => [incident.latitude!, incident.longitude!] as [number, number]), [located]);
  const center: [number, number] = points[0] ?? [20, 0];
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const signature = located.map((incident) => incident.id).join('|');

  useEffect(() => setTilesUnavailable(false), [signature]);

  return <div className="dashboard-map-preview">
    <div className="dashboard-map-caption"><span>{located.length} geolocated incident{located.length === 1 ? '' : 's'}</span><small>Submitted coordinates only</small></div>
    <div className="dashboard-map-frame">
      <MapContainer center={center} zoom={12} zoomControl={false} scrollWheelZoom={false} doubleClickZoom={false} dragging={false} attributionControl>
        <FitReportedPoints points={points} />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTilesUnavailable(true) }} />
        {located.map((incident) => <CircleMarker key={incident.id} center={[incident.latitude!, incident.longitude!]} radius={incident.scores.priorityBand === 'High' ? 8 : 6} pathOptions={{ color: colorFor(incident.scores.priorityBand), fillColor: colorFor(incident.scores.priorityBand), fillOpacity: 0.82, weight: 2 }}><Popup><strong>{incident.title}</strong><br />{incident.locationName}<br /><Link to={`/incidents/${incident.id}`}>Open incident</Link></Popup></CircleMarker>)}
      </MapContainer>
      {tilesUnavailable && <div className="dashboard-map-error" role="status"><strong>Map tiles unavailable</strong><span>Submitted coordinates remain unchanged.</span><Link to="/map">Open location explorer</Link></div>}
    </div>
  </div>;
}
