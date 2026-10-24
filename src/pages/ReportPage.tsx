import { useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertTriangle, Check, ImagePlus, MapPin, ShieldAlert, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { CATEGORIES, type Category, type ReportDraft } from '../domain/types';
import { CategoryTag, PageHeading } from '../components/ui';

function localDateTimeValue(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function ReportPage() {
  const { createReport } = useAppState();
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [observedAt, setObservedAt] = useState(localDateTimeValue());
  const [active, setActive] = useState(true);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [imageName, setImageName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedReportId, setSavedReportId] = useState('');
  const [savedIncidentId, setSavedIncidentId] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [savedClassification, setSavedClassification] = useState<import('../domain/types').Classification | null>(null);

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError('');
    setImageDataUrl(undefined);
    setImageName('');
    if (!file) return;
    const supported = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supported.includes(file.type)) { setError('Choose a JPG, PNG, or WebP image.'); event.target.value = ''; return; }
    if (file.size > 750 * 1024) { setError('Image must be 750 KB or smaller so the local browser store can keep it reliably.'); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') { setImageDataUrl(reader.result); setImageName(file.name); }
      else setError('The selected image could not be previewed. Try another image.');
    };
    reader.onerror = () => setError('The selected image could not be read. Try another image.');
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!title.trim() || !description.trim() || !locationName.trim() || !observedAt) { setError('Complete the required title, description, location, and observation time fields.'); return; }
    const hasLatitude = latitude.trim() !== '';
    const hasLongitude = longitude.trim() !== '';
    if (hasLatitude !== hasLongitude) { setError('Enter both latitude and longitude, or leave both blank.'); return; }
    const lat = hasLatitude ? Number(latitude) : undefined;
    const lon = hasLongitude ? Number(longitude) : undefined;
    if (hasLatitude && (!Number.isFinite(lat) || (lat as number) < -90 || (lat as number) > 90 || !Number.isFinite(lon) || (lon as number) < -180 || (lon as number) > 180)) {
      setError('Coordinates are outside valid ranges: latitude −90 to 90, longitude −180 to 180.'); return;
    }
    const observedDate = new Date(observedAt);
    if (Number.isNaN(observedDate.getTime()) || observedDate.getTime() > Date.now()) { setError('Observation time must be a valid date and cannot be in the future.'); return; }
    const draft: ReportDraft = {
      title: title.trim(), description: description.trim(), category, locationName: locationName.trim(), observedAt: observedDate.toISOString(),
      ...(lat !== undefined && lon !== undefined ? { latitude: lat, longitude: lon } : {}),
      anonymous, ...(anonymous ? {} : { reporterName: reporterName.trim() || undefined }), active, ...(imageDataUrl ? { imageDataUrl } : {}),
    };
    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    const result = createReport(draft);
    setIsSubmitting(false);
    if (!result.ok || !result.report || !result.incident) { setError(result.error ?? 'The report was not saved. Please try again.'); return; }
    setSavedReportId(result.report.id);
    setSavedIncidentId(result.incident.id);
    setCandidateId(result.candidateIncidentId ?? '');
    setSavedClassification(result.report.classification);
  }

  if (savedReportId) {
    return <>
      <PageHeading eyebrow="COMMUNITY REPORTING / CONFIRMATION" title="Observation received" description="Your report is saved in this browser and is now part of the recovery record." />
      <section className="form-success">
        <div className="success-top"><span className="success-icon"><Check size={18} /></span><div><h2>Report saved</h2><p>Keep this report ID to follow the observation. A coordinator can review the report and any suggested relationship.</p></div></div>
        <div className="report-id-box"><span>UNIQUE REPORT ID</span><strong>{savedReportId}</strong></div>
        {candidateId && <p>A possible relationship was suggested with incident <strong>{candidateId}</strong>. The report remains intact and awaits coordinator review; no automatic merge occurred.</p>}
        {!candidateId && <p>Incident record <strong>{savedIncidentId}</strong> is now available in the incident register.</p>}
        {savedClassification && <div className="classification-result"><div><strong>Selected category</strong><CategoryTag category={savedClassification.selectedCategory} /></div><div><strong>Rule-based suggestion</strong><CategoryTag category={savedClassification.predictedCategory} /></div><p>{savedClassification.reason}</p><small>{Math.round(savedClassification.confidence * 100)}% heuristic confidence · {savedClassification.needsHumanReview ? 'Coordinator review recommended' : 'Preliminary only; coordinator review remains available'}</small></div>}
        <div className="button-row" style={{ marginTop: 15 }}><Link className="btn btn-primary" to={`/incidents/${savedIncidentId}`}>View incident <MapPin size={14} /></Link><Link className="btn btn-secondary" to="/dashboard">Open overview</Link><button className="btn btn-quiet" onClick={() => { setSavedReportId(''); setSavedIncidentId(''); setCandidateId(''); setSavedClassification(null); setTitle(''); setDescription(''); setLocationName(''); setLatitude(''); setLongitude(''); setImageDataUrl(undefined); setImageName(''); setObservedAt(localDateTimeValue()); }}>Submit another</button></div>
      </section>
    </>;
  }

  return <>
    <PageHeading eyebrow="COMMUNITY REPORTING / NEW OBSERVATION" title="Report an issue" description="Record what you observed. Precise coordinates and a photograph are optional; do not approach a hazard to collect evidence." />
    <div className="form-layout">
      <form className="form-card report-form" onSubmit={submit} noValidate>
        <section className="report-section" aria-labelledby="report-what"><div className="report-section-heading"><span>01</span><div><h2 id="report-what">What happened?</h2><p>Describe what you saw without guessing at unverified causes.</p></div></div><div className="form-grid">
          <div className="field field-full"><label htmlFor="category">Incident category <span className="required-mark">*</span></label><select id="category" value={category} onChange={(event) => setCategory(event.target.value as Category)} required>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select><span className="field-help">A rule-based check may flag the category for coordinator review; your selection is retained.</span></div>
          <div className="field field-full"><label htmlFor="title">Short title <span className="required-mark">*</span></label><input id="title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={4} maxLength={100} placeholder="e.g. Drain blocked beside the footpath" required /></div>
          <div className="field field-full"><label htmlFor="description">Detailed description <span className="required-mark">*</span></label><textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={1500} placeholder="Describe the condition and why it may need attention." required /><span className="field-help">If water quality is a concern, describe what you noticed; do not state a test result you do not have.</span></div>
        </div></section>
        <section className="report-section" aria-labelledby="report-where"><div className="report-section-heading"><span>02</span><div><h2 id="report-where">Where did it happen?</h2><p>A road, landmark, waterway, or neighborhood name is enough to start.</p></div></div><div className="form-grid">
          <div className="field field-full"><label htmlFor="location">Location name <span className="required-mark">*</span></label><input id="location" value={locationName} onChange={(event) => setLocationName(event.target.value)} maxLength={120} placeholder="Place, road, landmark, or neighborhood" required /></div>
          <div className="field"><label htmlFor="latitude">Latitude <span className="optional-label">Optional</span></label><input id="latitude" type="number" inputMode="decimal" min="-90" max="90" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="e.g. 18.5204" /><span className="field-help">−90 to 90</span></div>
          <div className="field"><label htmlFor="longitude">Longitude <span className="optional-label">Optional</span></label><input id="longitude" type="number" inputMode="decimal" min="-180" max="180" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="e.g. 73.8567" /><span className="field-help">−180 to 180; both coordinates or neither</span></div>
        </div></section>
        <section className="report-section" aria-labelledby="report-when"><div className="report-section-heading"><span>03</span><div><h2 id="report-when">When was it observed?</h2><p>Observation time helps coordinators understand recency.</p></div></div><div className="form-grid">
          <div className="field field-full"><label htmlFor="observed">Date and time observed <span className="required-mark">*</span></label><input id="observed" type="datetime-local" max={localDateTimeValue()} value={observedAt} onChange={(event) => setObservedAt(event.target.value)} required /></div>
          <div className="field field-full reporter-options"><label className="checkbox-row"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /><span>Submit anonymously</span></label>{!anonymous && <div className="field reporter-name-field"><label htmlFor="reporter">Reporter name <span className="optional-label">Optional</span></label><input id="reporter" value={reporterName} onChange={(event) => setReporterName(event.target.value)} maxLength={80} placeholder="Your name or volunteer group" /></div>}<label className="checkbox-row"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span>The problem is still active, to the best of my knowledge.</span></label></div>
        </div></section>
        <section className="report-section" aria-labelledby="report-evidence"><div className="report-section-heading"><span>04</span><div><h2 id="report-evidence">Supporting evidence</h2><p>A photograph can help, but is never required and should only be taken from a safe place.</p></div></div><div className="photo-drop"><label className="upload-label" htmlFor="photo"><ImagePlus size={17} />Choose a photo <span>Optional</span></label><input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} aria-label="Upload an optional JPG, PNG, or WebP photograph" /><span className="field-help">JPG, PNG, or WebP · maximum 750 KB · image stays in this browser's local data.</span>{imageDataUrl && <div className="photo-preview"><img src={imageDataUrl} alt="Preview of selected report evidence" /><span><strong>{imageName}</strong><br />Preview attached to this report.</span></div>}</div></section>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="report-submit-row"><span>Required fields are marked <b>*</b>. Coordinates and photos are optional.</span><button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? <><span className="spinner" />Saving report…</> : <><Upload size={14} />Submit observation</>}</button></div>
      </form>
      <aside className="report-aside">
        <div className="safety-callout"><ShieldAlert size={18} /><div><strong>Keep yourself safe</strong><p>Do not enter floodwater or approach hazardous sites to gather evidence. Report from a safe location and let authorized teams inspect conditions.</p></div></div>
        <div className="report-next-panel"><span className="eyebrow">WHAT HAPPENS NEXT</span><h2>Your report stays part of the record.</h2><div className="next-steps"><div><span>01</span><p>Rules classify and score the observation provisionally.</p></div><div><span>02</span><p>Similar reports may be suggested for coordinator review—not silently removed.</p></div><div><span>03</span><p>A recovery coordinator reviews evidence and selects the next action.</p></div></div></div>
        <div className="data-caveat"><AlertTriangle size={16} /><span>Possible contamination reports are observations only. Do not treat an unverified report as a confirmed environmental finding.</span></div>
      </aside>
    </div>
  </>;
}
