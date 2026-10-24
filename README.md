# AfterRain — Post-Flood Environmental Recovery Intelligence

**When the water recedes, recovery begins.**

AfterRain is a civic decision-support prototype that helps communities coordinate environmental recovery following floods and heavy rainfall. It turns individual observations into reviewable incident groups, explainable recovery priorities, assignments, and recorded outcomes. It is designed around the difference between a **report** (one person's observation) and a **unique incident** (a recovery issue that may have several reports).

## Problem and solution

Post-flood waterlogging, debris, possible water-quality concerns, damaged infrastructure, and sewage reports arrive from multiple people and may describe the same underlying problem. AfterRain keeps each original submission, suggests related reports using transparent local rules, and gives coordinators one queue for review, task assignment, status, and resolution evidence. It supports human coordination; it does not replace emergency services, official warnings, environmental testing, professional inspection, or authority decisions.

## Key features

- Eight routed experiences: landing page, Recovery overview, dedicated Incident Intelligence register and incident detail, Report an Issue, Recovery Map, Recovery Planner, and Impact & Recovery Analytics.
- Mobile-friendly reporting form with category, title, description, location, optional coordinates/photo, observation time, anonymous choice, validation, preview, and a unique report ID.
- Rule-based report classification, explainable severity and operational priority, duplicate/related-report suggestions, coordinator confirmation/rejection, manual linking/splitting, and a status history that retains original submissions.
- Recovery task recommendations by category; team assignment; explicit status transitions; required resolution notes and completion evidence; optional verified waste quantity and unit.
- Data-driven compact dashboard metrics/charts, filters/search, a priority-first queue, conditional overview-map preview only when valid coordinates have been submitted, full Leaflet/OpenStreetMap coordinate view with no-coordinate and tile-unavailable fallbacks, timestamp-derived analytics, and formula-safe incident CSV export.
- Climate-tech field-operations styling: forest/ivory palette, Manrope/Inter/IBM Plex Mono type hierarchy, desktop operations rail, mobile bottom navigation, evidence-first incident master/detail, and concise recovery-task summaries with expandable controls.
- Ten fictional seeded reports across seven fictional incidents and more than five fictional locations; a confirmed demo scenario restore action.

## Sustainability and SDG alignment

AfterRain prioritizes safe waste/debris cleanup and material segregation, waterway protection, qualified water-quality inspection, drainage maintenance, safe sanitation escalation, efficient allocation of cleanup resources, and transparent recovery tracking. SDG 11 Sustainable Cities and Communities is primary. Related activities also connect to SDG 6 Clean Water and Sanitation, SDG 12 Responsible Consumption and Production, and SDG 13 Climate Action.

Task counts are coordination indicators—not tonnes of waste removed, litres of water saved, disease cases prevented, or emissions avoided. A waste quantity is stored only when a coordinator enters an amount and unit and marks it verified. Other tasks use completion evidence rather than invented savings.

## Architecture

The app is a React + TypeScript + Vite single-page application with a custom semantic CSS design system. React Router owns page routes; Recharts displays values calculated from the shared application data; Leaflet uses OpenStreetMap tiles without a paid key and draws only valid coordinates submitted with reports. If no matching coordinates are available, or if tiles cannot be reached, a clean location-state view replaces the basemap while the incident explorer remains usable. Lucide supplies the icon set.

- `src/domain/types.ts` defines reports, incidents, report relationships, tasks, score factors, and status-history records.
- `src/domain/engine.ts` contains deterministic classification, duplicate comparison, Haversine distance, category recommendations, description-based provisional impact/access/safety/hazard signals, photo-independent severity, score formulas, allowed status transitions, and the rule that terminal incidents cannot accept new reports.
- `src/domain/csv.ts` quotes CSV values and neutralizes formula-leading user text before spreadsheet export.
- `src/domain/selectors.ts` counts only incidents with at least one currently linked report; `src/domain/hotspots.ts` groups review-only location clusters and describes whether evidence is coordinate, place-name, mixed, pairwise, or transitive.
- `src/data/seed.ts` creates the fictional demonstration scenario; `src/data/persistence.ts` loads, validates, and saves the versioned browser store.
- `src/state/AppState.tsx` owns the shared store and every persisted action, including report creation, duplicate review, linking/splitting, assignments, status transitions, notes, and reset.
- `src/components/` contains the shared app shell, compact `IncidentQueue`, conditional Leaflet `MapPreview`, and reusable UI; `src/pages/` contains each route, including the incident register and detail workspace.
- `public/manus-routes.json` declares all page routes for the hosted preview platform.

There is no backend, account system, external service credential, or required environment variable in this MVP. **Data is stored in `localStorage` for this browser profile/device only; it is not shared between community reporters or coordinators and may be cleared by browser settings.** Images are stored as data URLs, with a 750 KB upload limit. If the browser cannot persist a write, the app displays an error and does not claim success. Use CSV export to keep an incident-data copy before resetting the demo.

## Priority and severity algorithms

All factors use a 0–100 scale. Severity is calculated separately from operational priority:

```text
severity = 0.35 × reported impact
         + 0.25 × potential environmental harm
         + 0.20 × immediate public-safety concern
         + 0.10 × infrastructure disruption
         + 0.10 × supporting evidence and verification

priority = 0.50 × severity
         + 0.20 × time sensitivity
         + 0.15 × environmental sensitivity
         + 0.15 × recurrence or persistence
```

Priority bands are High (75–100), Medium (45–74), and Lower (0–44). The prototype derives provisional factor values from category rules and transparent description signals: broader reported scope, access/road disruption, public-safety cues such as exposed wires or injury language, and potential environmental cues such as oil, chemicals, sewage, or unusual odour. These remain unverified user reports, not findings. Numeric severity does not change solely because a photo is absent or present; verification status affects the evidence factor and all unverified records remain provisional. Weights and score thresholds are central constants in `src/domain/engine.ts`. Scores are a transparent prototype heuristic, **not a validated disaster-risk model**, and never supersede official emergency guidance.

## Duplicate and related-report algorithm

Text is lowercased, normalized, stripped of punctuation, tokenized, and compared with Jaccard similarity. Category compatibility, a configurable 14-day observation window, and (when supplied for both records) Haversine distance are additional signals. Strong text similarity of 0.55 or higher with coordinates within 300 m suggests a likely duplicate; similarity of 0.35 or higher within 150 m suggests a possible duplicate. Without coordinates, similarity of 0.48 or higher is only a related-report suggestion for manual review; a matching location name is a weak supporting signal and the explanation says so. Every suggestion waits for a coordinator decision. No report is silently deleted or automatically merged. The `DUPLICATE_CONFIG` constants hold the starting thresholds.

## Fictional versus real data

The initial ten reports, seven consolidated incidents, timestamps, teams, outcomes, and place names are fictional demonstration data, clearly marked “DEMO”; they are not actual flood reports or verified environmental conditions. The app does not invent coordinates for the fictional sample locations. A map marker appears only when a submitted report contains a coordinate pair in valid ranges. New reports and workflow edits persist locally in the current browser. The app does not fetch, verify, or certify actual environmental conditions.

## Local development

Requirements: Node.js 20 or later and pnpm 11.25.0 (pinned in `package.json`).

```bash
pnpm install
pnpm dev
```

Vite serves on port 3000. Create a production bundle and run static type checking with:

```bash
pnpm check
pnpm build
pnpm preview
```

No `.env` file is required. No paid API key is required. On a first visit, the fictional scenario is seeded once. Refreshing the page loads the same browser-local store. “Restore demo data” in the sidebar asks for confirmation and replaces the current local store with the original demonstration scenario.

## Deployment

Build the static site using `pnpm install --frozen-lockfile && pnpm build`; publish the generated `dist/` directory to a static host configured to serve `index.html` as the fallback for client-side routes. The route manifest is published at `/manus-routes.json`. The managed project runtime uses port 3000 for its development preview. The deployment declaration specifies a static build; no server or managed database is necessary for this local-persistence prototype.

## Limitations and future improvements

Local storage is not a shared multi-user database and has finite capacity; coordinator changes on one device are not visible on another. The prototype uses a single browser store rather than authenticated roles or an audited multi-organization service. Map markers require user-supplied coordinates; unavailable tiles trigger a clean location-explorer fallback. Rule-based category matching, duplicate similarity, and scoring thresholds need human review and are not statistically validated. Resolution records depend on coordinator-entered notes/evidence; field verification is not independently confirmed.

Future work could add a secured shared database with role-based access, auditable organization/team boundaries, durable image storage, offline synchronization for field workers, tested/localized geospatial thresholds, and evaluation with qualified recovery practitioners—without weakening privacy, uncertainty labels, or human review.
