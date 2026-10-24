# AfterRain — implementation plan

## Scope and implementation approach

Continue the existing responsive AfterRain application in place. Preserve its typed domain model, browser-local saved data, reports, incidents, relationships, score/deduplication logic, charts, filters, map, task workflows, validation, status history, and CSV export. The redesign improves the actual product UI rather than replacing it with a static or presentation-style website. The product remains a prototype—not emergency guidance, environmental testing, or professional inspection—and does not require a paid AI key, paid map key, login, or managed database.

Use the existing React, TypeScript, Vite, React Router, Lucide, Recharts, Leaflet/OpenStreetMap, and localStorage architecture. Keep browser-saved data intact across route and style work; continue seeding only when no saved AfterRain data exists. Preserve confirmed reset-to-demo behavior and real storage errors. Map only valid submitted coordinates; show place-name summaries where coordinates are absent. Continue constraining image uploads to supported raster formats and the current browser-storage limit.

## Shared domain and intelligence

Do not alter the underlying report/incident/task model or decision algorithms unless a UI integration requires a narrow compatibility change. Keep stable IDs and typed records for reports, incidents, proposed/confirmed/rejected report relationships, recovery tasks, and timestamped status history. Maintain deterministic category suggestions, normalized token similarity, Haversine distance only for valid report-supplied coordinates, weak location-name matching, human-reviewed grouping, weighted preliminary severity and priority, explainable reason text, provisional confidence, and explicit status transitions. Never delete a report or automatically confirm a match. Preserve coordinator-only task/resolution evidence and all environmental uncertainty safeguards.

## Page and route structure

- `/` — concise editorial landing with product name/tagline, a two-column hero, abstract non-geographic terrain/ripple graphic combined with a compact real-from-local-store incident preview, dashboard/report entry points, a connected Report → Prioritize → Recover sequence, sustainability focus, and SDG alignment. Clearly label fictional seed data and do not imply map precision.
- `/dashboard` — compact Recovery overview; current reports, unique linked incidents, high-priority incidents, open tasks, completed tasks; searchable/filterable priority queue; actual-data category/status summaries, task progress, pending relationship review, hotspots, and location summary when no map coordinates exist.
- `/incidents` — dedicated Incident Intelligence list for all currently linked incidents with queue/search/filter controls and direct links to existing incident detail routes.
- `/report` — preserve every existing field, validation rule, optional coordinate/photo flow, image preview, save/error/success feedback, unique report ID, classification information, and safety notice; regroup the form into “What happened?”, “Where?”, “When?”, and “Supporting evidence.”
- `/incidents/:id` — keep all original report evidence, score factors/explanations, proposed/confirmed relationships, link/split/review actions, status history, recommendations, assignment, notes, and evidence-gated resolution. On desktop add a compact incident selector alongside the existing selected-incident workspace; collapse to a mobile-friendly selector/list.
- `/map` — preserve Leaflet/OpenStreetMap markers only for valid submitted coordinates, priority colors, category/status filters, marker-to-detail links, and the location explorer for unpinned records.
- `/planner` — preserve priority-ordered tasks, category recommendations, team assignment, notes, permitted status transitions, required resolution notes/evidence, and verified-measurement guardrails.
- `/analytics` — preserve actual-data counts, current relationship links, timestamp-derived duration metrics, created/resolved trends, evidence caveats, and valid CSV download.

## Design system and interaction

Adopt the supplied climate-tech/environmental-publication visual direction: sophisticated, earthy, atmospheric, data-rich, modern, precise, calm, tactile, and purposeful. Use the specified palette: deep forest `#173D32`, rich green `#244F40`, sage `#DCE8D9`, ivory `#F7F6F0`, white `#FFFFFF`, charcoal `#242B28`, muted grey-green `#78847B`, amber `#D49A43`, and muted red `#C85D51`. Use green only for primary/emphasized states; rely on neutral paper/white surfaces and restrained borders/shadows.

Typography uses Manrope or similar for headings, Inter for body/interface copy, and IBM Plex Mono for IDs and numerical metrics, each with accessible system fallbacks. Use the existing droplet/ripple mark and refine its color/wordmark treatment. Keep Lucide stroke weights and icon sizes consistent. Desktop uses a quiet fixed/sticky 230–250px sidebar and a left-aligned workspace with 28–36px page padding; on narrow screens use a compact bottom navigation and stack operations into readable forms/lists. Avoid repeated oversized cards, slide-like feature grids, overlarge content gaps, excessive pills, decorative green overload, false geographic precision, and long explanatory paragraphs inside data cards.

The dashboard is the most operationally dense view: allocate roughly two-thirds to a compact priority-first incident queue and one-third to supporting status/category/recovery/location information. Use restrained risk indicators rather than full-card alerts. The landing page may be more expressive, but every section must support the product; use connected steps rather than three oversized feature cards. Detail pages use concise headings, aligned content, readable charts, and evidence labels that distinguish automated suggestions from coordinator-confirmed information.

Use visible keyboard focus, sufficient contrast, clear form errors/loading/save feedback, helpful empty states, subtle quick hover transitions, and reduced-motion support. Preserve all interactive behavior; never introduce decorative controls without a working action. Use no additional UI dependency unless current components cannot safely support a requirement.

## Project structure

- `src/domain/` — shared types, deterministic scoring/classification/deduplication, status transitions, selectors, and review-only hotspot grouping.
- `src/data/` — fictional scenario factory, localStorage hydration/save/reset, and data normalization.
- `src/state/` — shared persisted actions across all routes.
- `src/components/` — app shell/navigation, accessible controls, compact incident row/master-detail support, score explanations, and shared badges/cards.
- `src/pages/` — landing, dashboard, incident list, reporting, incident detail, map, planner, analytics, and not-found screens.
- `src/styles.css` — shared palette/type/spacing tokens, responsive semantic UI styling, and restrained motion rules.
- `public/manus-routes.json` — static manifest synchronized with all user-facing routes, including `/incidents` and `/incidents/:id`.
- `README.md` and `TODO.md` — setup, architecture, algorithms, sustainability/SDGs, data and limitations, and acceptance outcomes.

## Runtime and delivery

Retain the pinned React/Vite TypeScript toolchain, host-managed TypeScript diagnostics, configured preview port 3000, existing development startup command, route manifest, and declared static build. Preserve the project branding URL in root `app.config.ts`. No secrets or new server/database services are needed. Verify the application after restarting the existing Preview process with the synchronized environment, and check its major pages in desktop and mobile layouts. Save intended source to canonical `main`; publication remains separate and will not be represented as complete unless successfully published.

## Design direction

- **Design Movement:** Climate-tech operations desk crossed with environmental field-journal editorial design.
- **Core Principles:** Make operational priority immediately scannable; distinguish reports, grouped incidents, and task outcomes; show evidence and uncertainty honestly; keep the surface tactile but calm.
- **Color Philosophy:** Warm ivory and layered whites keep long coordination sessions easy on the eye; deep forest carries brand authority; muted sage supports secondary state; amber signals attention; muted red is reserved for critical status. Green is an accent, never wallpaper.
- **Layout Paradigm:** A narrow persistent desktop navigation rail and left-aligned work canvas; the dashboard uses an asymmetric queue/support split; incident intelligence adds a master/detail layout; the landing page uses an asymmetric editorial hero, compact product snapshot, connected workflow line, and a restrained SDG finish. On mobile the rail becomes a compact bottom bar.
- **Signature Elements:** A refined droplet-with-ripple mark; abstract contour paths that are explicitly non-geographic; tabular/monospace incident IDs and compact priority markers paired with words.
- **Interaction Philosophy:** The UI distinguishes automated suggestion from coordinator decision, keeps source observations visible, and makes errors/next actions understandable without heavy warning panels. Every existing control remains live.
- **Animation:** Quick, subtle hover and state transitions; no parallax or constant decorative movement; honor `prefers-reduced-motion`; maintain readable focus states.
- **Typography System:** Manrope headings, Inter body/interface, IBM Plex Mono IDs and numerals, with accessible system fallbacks. Keep headings compact outside the landing hero; use tabular numerals and explicit label hierarchy.
- **Brand Essence:** The calm, evidence-aware coordination layer helping flood-affected communities move from observation to verifiable environmental recovery. Personality: grounded, precise, reassuring.
- **Brand Voice:** Direct, calm, action-oriented, transparent about uncertainty. Examples: “When the water recedes, recovery begins.” “Reported nearby; verification still needed.”
- **Wordmark & Logo:** Preserve and refine the original minimal raindrop/ripple vector mark beside a carefully spaced AfterRain wordmark; avoid generic leaves or extra decorative stock imagery.
- **Signature Brand Color:** Deep forest `#173D32`, paired with warm ivory `#F7F6F0` and charcoal `#242B28`.
