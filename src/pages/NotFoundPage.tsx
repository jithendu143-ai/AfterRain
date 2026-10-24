import { Link } from 'react-router-dom';
import { PageHeading } from '../components/ui';

export function NotFoundPage() {
  return <div className="not-found"><PageHeading eyebrow="AFTERRAIN WORKSPACE" title="This page is not here" description="The link may be outdated. Your saved reports and incident records have not been changed." /><Link className="btn btn-primary" to="/dashboard">Return to recovery dashboard</Link></div>;
}
