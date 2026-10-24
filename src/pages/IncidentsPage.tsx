import { ArrowUpRight, SearchCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { getTrackedIncidents } from '../domain/selectors';
import { IncidentQueue } from '../components/IncidentQueue';
import { PageHeading } from '../components/ui';

export function IncidentsPage() {
  const { data } = useAppState();
  const incidents = getTrackedIncidents(data);
  const proposed = data.relationships.filter((relationship) => relationship.status === 'proposed').length;
  return <>
    <PageHeading eyebrow="RECOVERY OPERATIONS / INCIDENTS" title="Incident intelligence" description="Review the linked incident register, compare source observations, and open a record to inspect its evidence and recovery decisions." action={<Link className="btn btn-primary" to="/dashboard#priority-queue"><SearchCheck size={15} />Review priority queue</Link>} />
    <div className="register-summary"><span><strong>{incidents.length}</strong> linked incidents</span><span><strong>{data.reports.length}</strong> individual reports</span><span><strong>{proposed}</strong> proposed relationships awaiting review</span><Link to="/dashboard#priority-queue">Open priority overview <ArrowUpRight size={13} /></Link></div>
    <section className="register-panel" aria-label="Incident intelligence register"><div className="register-heading"><div><span className="eyebrow">COORDINATOR REGISTER</span><h2>Current incident records</h2></div><span className="sort-caption">Sorted by operational priority · highest first</span></div><IncidentQueue data={data} incidents={incidents} /></section>
  </>;
}
