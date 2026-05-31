# UI Consolidation + Localization Pass

## 2026-05-30

Goal: reduce visible UI surface, add discoverable locale handling, and prepare
the tool for public release. Principle — a field belongs in the main UI only if
a typical user changes it on a typical run; everything else moves to Advanced
disclosures or Settings. **No algorithmic and no data-model changes.** The
underlying computation continues to read the same planning-mode-state values it
did before; only visible defaults and presentation changed.

## Decisions

### Hidden-field defaults — kept current values (90% / 2)
The spec's "DEFAULTS TO USE WHEN FIELDS ARE HIDDEN" listed Coverage Target 95%
and Min Incidents/Site 3, which conflicted with the verification requirement
that default-run results match prior tests. Per explicit confirmation, the
existing computation defaults were **kept (Coverage Target 90%, Min/Site 2)** so
deployments are unchanged. All other listed defaults already matched the code
(Confidence 90%, Robust Core 60%, Grid 100×100, Ignore Low-Demand 1%, Bandwidth
Auto Silverman, Distribution Hotspot Clusters, Visualization Consensus).

### Step 02 — Incident Data
- **Distribution** moved into an `Advanced` disclosure inside the Generate panel;
  default stays Hotspot Clusters. The eight options are unchanged.
- **Demand Heatmap panel removed entirely.** Replaced by a single on/off layer
  toggle mounted on the map (top-right, beside the basemap layer control). The
  heatmap now always shows incident density (`heatmapMode` stays `all`); the old
  mode/category/hour/month selects are gone. All heatmap DOM access in `app.js`
  was already null-guarded, so removing the panel required no logic changes.
- **Time Window auto-detect.** When incidents carry real timestamps (uploaded
  data or the sample dataset), the field shows a read-only summary —
  "Time Window: N weeks (auto-detected from incident data)" — with an
  **Override** link that reveals the manual dropdown. Synthetic generated data
  (no real timestamps) keeps the manual dropdown (default 1 day). The detected
  span is mapped to the smallest standard window that covers it; computation
  still reads `#kpiTimeWindow`.

### Step 03 — Compute Deployment
- **Coverage Target** and **Min Incidents/Site** moved out of the always-visible
  "Planning Realism" block into each mode's collapsed **Advanced** disclosure.
- *Minor adjustment to accommodate the moved fields:* these two are a single
  shared pair of inputs (one element ID each), so they are wrapped in
  `#planningTargetsFields` and **relocated by `setPlanningMode()` into the active
  mode's `[data-targets-slot]`** — inside `#smoothedAdvanced`,
  `#monteCarloAdvanced`, or the new `#directFitAdvanced`. This keeps a single
  source of truth (no duplicate IDs, no change to `getPlanningParams`) while
  presenting the fields under each mode's own Advanced section.
- **Direct Fit** gained a new `Advanced` disclosure (it previously had no panel).
- **Manual Radius (m)** input removed. The Smoothing Radius select now offers
  Auto Silverman or fixed presets (500/1000/1500/2000/3000 m); a fixed selection
  maps to `bandwidthMode:'manual' + bandwidthMeters:<value>`. The
  planning-mode-state schema is unchanged. Saved plans with a non-preset manual
  bandwidth are preserved — `syncPlanningModeControls()` injects a matching
  option so the stored value still shows and applies.

### Step 04 — Report & Handoff
- Classification dropdown already had multiple options (CONFIDENTIAL / RESTRICTED
  / OFFICIAL USE ONLY), so per the spec it was **left unchanged**.

### Localization
- **Settings affordance** added to the header (gear icon next to System Ready):
  a dropdown with **Units** (Metric / Imperial) and **Date format**
  (DD/MM/YYYY / MM/DD/YYYY / YYYY-MM-DD). The Units control was relocated here
  from the sidebar; Coordinate format stays in the sidebar Localization section.
- **Persistence:** settings are stored in `localStorage` under `uascDfrSettings`
  (`{unitSystem, dateFormat, coordFormat}`) and restored on load.
- **Units propagation:** display-only conversion through `formatDistance`,
  `formatArea`, the speed/radius platform inputs, station radii, and the PDF.
  Imperial threshold corrected to spec: **feet under 1 km, miles at/above 1 km**.
  Computation stays in metric (m, m/s); coordinates remain lat/lng regardless.
- **Date propagation:** `formatDate` / `formatDateTime` honour the selected
  format across the incident upload preview, incident statistics (time span /
  busiest period), and the PDF footer timestamp; changes re-render live.

### Public-release additions
- **First-use onboarding modal** (shown only when no stored settings): Welcome
  copy plus the same Units + Date Format choices and a Continue button that saves
  and dismisses. It never reappears unless storage is cleared.
- **Sample dataset.** A "Load sample dataset" link in Step 02 loads a fake
  "Sample City" operational area with ~250 hotspot-clustered incidents over a
  30-day timestamp span, plus a persistent banner
  ("Sample data loaded — for evaluation only", with Clear).
  *Sizing note:* the spec suggested ~500 incidents, but the smoothed/KDE
  optimizer scales super-linearly and 500 incidents froze the UI for 30 s+,
  defeating the "try it end-to-end" purpose. ~250 incidents over a ~280 km²
  footprint computes in ~1–4 s in every mode while still exercising the full
  pipeline; the Generate flow remains available for larger sets.
- **Attribution / licensing** added to the About modal: map tiles
  (© OpenStreetMap, © CARTO), a "Built with" section linking Leaflet, jsPDF,
  html2canvas, SheetJS, and JSZip, and a tool-license line
  ("© UASC, Dubai Police, 2026"). An About (ⓘ) trigger was added to the header,
  since the existing About modal had no opener in the planner.

## Localization scaffolding (future Arabic)
A `t(key, fallback)` lookup and an English `I18N` registry are in place.
`t()` resolves the active language, then English, then the inline fallback,
then the key — so untranslated strings render correctly today. Adding Arabic is
a content task: add an `I18N.ar` table keyed by the same string keys; no further
engineering refactor is required. New and touched user-facing strings use
`t('key', 'English')`; remaining static strings fall back automatically.

## Verification (headless, in-browser)
- Deployments compute in all three modes (Direct Fit, Smoothed Demand, Monte
  Carlo) with no errors; the optimizer and defaults are untouched, so results are
  consistent with prior runs (a 250-incident Smoothed run reproduced ~10 sites /
  ~91% coverage as before).
- Advanced disclosures expand/collapse and hold the moved Coverage Target /
  Min-Incidents fields in every mode.
- Map heatmap toggle adds/removes the density layer correctly.
- Time-window auto-detect shows "4 weeks" for the sample's real timestamps and
  falls back to the manual dropdown for synthetic data; Override reveals it.
- Settings persist to localStorage and propagate: Imperial shows ft under 1 km
  and mi at/above 1 km (e.g. radius 900 m → "2950 ft", spread ~13 km → "8.0 mi");
  date format switches DD/MM/YYYY ↔ YYYY-MM-DD live.
- Onboarding modal appears once on a fresh load, saves preferences, and does not
  reappear afterwards.
- "Load sample dataset" loads Sample City, shows the banner, and computes
  end-to-end.
- A saved plan with non-default hidden values (coverage 82%, min 5, fixed
  bandwidth 1500 m, confidence 95%) reloads with those values applied and the
  fields correctly relocated into the active mode's Advanced disclosure.
- About modal shows the library attributions and the license note.
- `node --check` passes for `app.js` and `src/planning/planning-mode-state.js`;
  no console errors during any flow.

## 2026-05-31 — Cleanup follow-ups

Three follow-up cleanups before public release.

### 1. "Occurrence" → "Priority Weight"
The per-category weight field (data key `category.weight`, unchanged) was
relabeled from "Occurrence" — which read like observed frequency — to
**"Priority Weight"** to convey that it configures algorithmic priority.
- `app.js` `renderCategoriesList()`: label + tooltip ("Relative priority for
  this category in the algorithm. Higher values mean the optimizer prioritizes
  covering these incidents first.").
- `planner/index.html`: the Generate help text now says "the **Priority Weight**
  field" (and corrected a stale "Hotspot Clusters" → "Mixed Urban Demand"
  default mention). No data-model change.

### 2. About modal de-duplicated (single source of truth)
The modal was duplicated in `index.html` and `planner/index.html`. Extracted to
**`src/about-modal.js`** (Option B — JS-injected), which both pages load and
which injects `#aboutModal` into the DOM on execution. This works in dev (raw
files) and in the bundle. `build.js` now inlines `about-modal.js` into both
dist outputs. Each page sets the page-3 logo (paths differ): the planner uses
its embedded base64 logo; `home.js` sets `assets/uasc-logo.png`. About content
now lives in exactly one place; verified both pages render identical content
(heading, 4 steps, attribution) and `dist/index.html` + `dist/planner/index.html`
build cleanly with the modal inlined.

### 3. Dead CSS cleanup
Audit finding correction: the suspected "second .actions-bar block referencing
undefined `--bg-1`/`--cyan`" was a **false alarm** — those variables ARE defined
(second `:root` block, ~lines 994–1025), and the only other `.actions-bar` rules
are functional step-visibility (`display`) rules. The live action-bar styling is
the single block (with the recent flex-wrap overlap fix). No undefined-variable
references exist; nothing removed there.

Removed genuinely-unused class rules (verified 0 references across `app.js`,
`home.js`, `planner/index.html`, `index.html`, and `src/about-modal.js`):
- `.stat-cell-wide` (orphaned when the wide stats cell was dropped)
- `.cat-mix-display` (orphaned when the per-card mix footer was removed)
- Legacy KPI block: `.kpi-panel` (+`::before`), `.kpi-header` (+`.priority`,
  `.title`), `.kpi-sub`, `.kpi-row` (+`.field`), `.kpi-derived` (+`-line`,
  `-value`, `.kpi-target`, `strong`)
- `.panel.primary` (+`.panel-header`), `.step-tag.primary-tag`
- `.help-inline`, `.chart-desc`
- `.about-btn` (both theme copies, incl. `:hover`) — header uses
  `.header-icon-btn` now
- `.about-callout` (+`strong`), `.about-warn`
- `.category-card` (removed from a grouped selector; `.marginal-chart` kept)
- Legacy compute UI: `.compute-results`, `.compute-kpi-grid`, `.compute-kpi`
  (+`span`/`strong`/`.accent`/`.ok`/`i`), `.compute-category-grid`,
  `.compute-category` (+`.critical`/`.amber`/`span`/`strong`)
- Legacy top-sites UI: `.top-sites`, `.top-sites-list`, `.top-site-row`,
  `.top-site-rank`, `.top-site-main` (+`strong`/`span`), `.top-site-meta`
  (+`strong`/`span`)

Conservatively KEPT (flagged by the automated scan but actually in use — the
scan ran before/around the About de-dup and did not see `src/about-modal.js`):
`.about-attribution` / `.attribution-libs` / `.attribution-tiles` /
`.attribution-license` (shared modal), `.advanced-targets-slot` and
`.auto-detected-line` (Step 02/03 markup), plus all state/modifier and
`leaflet-*` classes. CSS brace balance verified (463/463).

### Verification
- All three planning modes compute and render (Smoothed, Direct Fit; Monte Carlo
  runs to completion with its progress panel — 30 runs is inherently slow but not
  changed here).
- "Priority Weight" appears everywhere "Occurrence" did; no "Occurrence" left.
- About modal renders identically on landing and planner from the single source.
- `node --check` clean for `app.js`, `home.js`, `src/about-modal.js`; `node
  build.js` produces both dist outputs; no console errors; shadowing scan clean.

## 2026-05-31 — Sample mission: discoverability + deep link

1. Relabeled "Load sample dataset" → **"Load Sample Mission"** (a mission =
   area + zones + categories + incidents, not just data). Updated the banner
   ("Sample mission loaded — for evaluation only"), footer/status strings, and
   i18n entries. Internal names (`loadSampleDataset`, `sampleDataLoaded`,
   `#loadSampleBtn`, `#sampleDataBanner`) left as-is (no value in churn).
2. Moved the in-planner affordance from Step 01 to the top of Mission & Toolkit
   (above Objective), with a deliberately QUIET treatment: small "Just
   exploring?" eyebrow, one-line description, and an outlined `btn-ghost`
   content-width button (`.sample-mini`, ~80px footprint) so the panel heading
   stays the focus. The old filled `.sample-callout` styles were removed.
3. Landing-page hero CTAs: primary **"TRY WITH SAMPLE MISSION →"** (filled,
   → `planner/?sample=1`) and outlined **"OPEN PLANNER"** (→ `planner/`), beside
   the existing Load Saved Plan / Why This Tool buttons. Used the directory form
   (`planner/?sample=1`) rather than `planner/index.html?sample=1` because clean-
   URL static servers (incl. the local `serve` dev server) 301-redirect the
   explicit-file form and drop the query string; the directory form preserves it
   in dev and production.
4. Planner deep link: on init, `?sample=1` auto-loads the sample mission, skips
   onboarding (intent already expressed), persists default settings so onboarding
   won't resurface, shows the banner, and strips the param via
   `history.replaceState` so a reload doesn't re-trigger. `?sample=0`/other →
   ignored; load failure → caught, logged, empty planner. Verified end-to-end via
   the real landing CTA click: sample loads, onboarding skipped, banner shown,
   URL cleaned to `/planner/`, and a subsequent reload does not re-trigger.

## 2026-05-31 — Categories rework, banner dismiss, MC explainer, Dubai sample

1. **Incident Categories section.** Renamed "Incident KPIs" → "Incident
   Categories". Relabeled the weight field "Priority Weight" → "Category Mix (%)"
   — the UI now shows/accepts a percentage (0–100, one decimal) while the data
   model keeps `category.weight` as a decimal (0–1); conversion happens at the
   input/output boundary (`formatMixPct`, and `weight = pct/100` on input).
   Default names are now Critical / Urgent / Routine / Category D…  Adding or
   removing a category even-splits the mix across non-manually-edited categories
   (`redistributeMix`, last absorbs rounding), tracked by a `userSetMix` flag set
   on first edit; loaded plans mark their categories user-set so add/remove won't
   clobber them. An inline sum indicator (`#categoryMixSum`) reads green at 100%,
   amber otherwise. Backward compatible: a saved `weight: 0.2` displays "20".
   `getPriorityMix` is unchanged (still normalizes), so generation proportions
   are preserved (verified ~20/30/50 from a 20/30/50 config).

2. **Dismissible sample banner.** Replaced the banner's "Clear" button with a
   small × dismiss that fades the banner out, hides it for the session, and sets
   `localStorage.sampleMissionBannerDismissed`. Loading a mission (or reset)
   clears the flag and re-shows the banner. Wiring deferred to DOMContentLoaded
   because the banner markup follows the app.js script tag.

3. **Monte Carlo empty robust-core explainer.** When zero locations meet the
   robustness threshold, the headline now reads "No locations met the N%
   robustness threshold" and an amber-bordered panel explains the two likely
   causes (dataset too small — quotes the current incident count vs the 100/area
   recommendation; demand too dispersed — points to the Advanced threshold) and
   notes the map shows top-frequency candidates as alternatives.

4. **Sample mission → Dubai.** The sample now loads a representative real-Dubai
   urban area (~80 km², Downtown / Business Bay / Bur Dubai) with a mixed-urban
   synthetic incident pattern. Banner: "Sample mission: Dubai (representative
   urban deployment) — for evaluation only"; the Step-01 card and footer make the
   real-geography / synthetic-incident distinction explicit. No "Sample City"
   references remain.

Verified headless: section header, Category Mix input/storage, Urgent/Routine
defaults, even-split + userSetMix preservation, green/amber sum, decimal→percent
reload, generation proportions, banner dismiss + flag + re-show, MC explainer
panel, Dubai area + text. node --check (app.js, about-modal.js) + build clean;
no console errors; shadowing scan clean.

## 2026-05-31 — Sample mission uses the real Dubai administrative boundary

The sample operational area is now the real Dubai administrative boundary
instead of a hand-drawn rectangle:

- **Bundled boundary.** Extracted the Dubai feature from geoBoundaries gbOpen
  ARE ADM1 (ODbL / OpenStreetMap — open license; the tool already shows OSM
  attribution), decimated the largest ring 4807 → 602 vertices, and bundled it
  at `assets/sample-boundaries/dubai.geojson` (~49 KB, copied to dist by the
  build). The sample loader reads this same-origin file, so it never depends on
  the external boundary API — verified it loads in ~480 ms with no network and
  no fallback warning. The general Boundary tab still uses the live API.
- **Same code path / fallback.** `buildSampleAreaLayer()` parses the bundled
  GeoJSON through the existing `chooseLargestRing` → `L.polygon` path (exactly
  what the Boundary "Use Selection" button does). If the file is somehow
  unreadable it falls back to a coarse Dubai-shaped polygon with a console
  warning.
- **Clustered demand preserved.** Incidents are no longer sampled across the
  area bounds (which would scatter them across all ~3600 km² of Dubai). A new
  `generateSampleIncidents()` draws ~250 synthetic incidents from fixed
  urban-core cluster centres (Downtown / Business Bay / Bur Dubai / Deira /
  Al Karama) with ~15% scattered residential, each validated inside the active
  area. Result: operational area = full Dubai (3601 km²), incident spread ≈
  20 km in the urban core.
- **Copy.** Banner → "Sample mission: Dubai administrative area (synthetic
  urban incidents) — for evaluation only"; the Step-01 card and footer match.
- `loadSampleDataset()` is now async (awaits the bundled fetch); its callers
  (button + ?sample=1 deep link) handle the promise with a catch.

Verified: Dubai-shaped area (not a rectangle), 250 clustered incidents, banner
copy, <3 s load with no external call, and all three planning modes compute
(Smoothed 35 sites / 88%, Direct Fit 22 / 90%, Monte Carlo completes — and its
empty robust-core explainer shows at the default threshold). node --check +
build clean; no console errors/warnings; shadowing scan clean.

## 2026-05-31 — Step 03: analytical-approach hierarchy + compute loading overlay

PART A — Analytical Approach restructure:
- Replaced the flat "Planning Mode" 3-tab control with a primary two-tab toggle
  (ANALYTICAL APPROACH: Retrospective / Prospective, Prospective default) and,
  under Prospective, a nested METHOD toggle (Smoothed Demand / Monte Carlo).
  Per-tab descriptions show only for the active tab; the old per-panel mode
  briefs were removed.
- UI maps to the unchanged planning-mode-state identifiers: Retrospective →
  direct-fit, Prospective+Smoothed → smoothed-growth, Prospective+Monte Carlo →
  monte-carlo. New `syncApproachUI(mode)` drives the toggles/descriptions/panel
  visibility from the mode; `setPlanningMode` calls it. A `prospectiveMethod`
  UI var remembers the last Prospective method so toggling to Retrospective and
  back restores it. Saved plans reload straight into the right toggle state via
  the existing mode identifier (no migration). Header copy updated; nested
  toggle styled with a left accent rail + slightly smaller tabs.
- About modal page 2 reframed to present the three modes as Retrospective
  (Direct Fit) / Prospective (Smoothed Demand) / Prospective (Monte Carlo).

PART B — Compute loading overlay:
- Added a map-area overlay (#computeOverlay inside #map): dim + centered dark
  card with a CSS spinner, mode-specific text, and (Monte Carlo only) a progress
  bar. Shown synchronously on Compute, then the synchronous Smoothed/Direct Fit
  computation is deferred 50 ms so the overlay paints before the freeze. Monte
  Carlo hooks the existing per-run progress callback to update "Running
  synthetic future X of N…" + the bar. Overlay hides on completion. The Compute
  button is disabled during computation. On error the overlay hides, the Compute
  button re-enables, and the failure is surfaced in the sidebar status (status3)
  instead of an alert. The overlay lives on the always-visible map, so it
  persists across step navigation while a run is in flight.

Verified headless: default Prospective+Smoothed; Retrospective shows Direct Fit
+ warning and hides Method; switching back restores the prior method (Smoothed
or Monte Carlo); saved plans for all three modes reload into the correct
toggles; overlay appears immediately on Compute in every mode with the right
text (Smoothed/Direct Fit no bar, Monte Carlo dynamic text + bar 60→100%) and
hides on completion; button disabled during compute; About page 2 reframed.
node --check + build clean; no console errors; shadowing scan clean.

## 2026-05-31 — Sample preset (Optimus / 20-80 / 1200), layer preservation, neutral "stopped early"

1. **Sample mission preset.** `loadSampleDataset()` now presets a realistic Dubai
   scenario on top of the real Dubai boundary: platform → Optimus
   (`optimus-amrobotics`, applies its 55 km/h speed, 5 km radius, 6 min cycle);
   incident categories replaced with exactly Critical 20% + Urgent 80% (no
   Routine), marked user-set; and 1200 synthetic incidents (up from 250) via the
   existing mixed-urban distribution within the Dubai area. The fixed urban-core
   generator was removed. Generation proportions follow the 20/80 mix as before.
2. **Preserve input layers after compute.** `renderIncidents()` early-returned
   when the heatmap was on, clearing the incident pins. Removed that early return
   so the incident pins are always drawn and the demand heatmap overlays them;
   station markers (DOM) stay on top. Incidents + heatmap now remain visible
   alongside the computed stations/coverage in all three modes (the heatmap
   toggle is now additive rather than replacing the pins).
3. **"Stopped early" status neutral, not red.** The informational "Target stopped
   early: …" message (shared by Smoothed Demand and Direct Fit) changed from
   `var(--incident)` red to `var(--text-muted)` neutral gray; wording unchanged.
   Genuine error/invalid-state reds (compute-failed status, Monte Carlo failure,
   fleet shortfall, the MC data-quality caveat) are untouched. Monte Carlo has no
   separate "stopped early" message.

Runtime at 1200 incidents (real Dubai area): Smoothed Demand ~9.4 s (under the
10 s threshold; the loading overlay covers the wait), Direct Fit ~0.7 s.

Verified headless: sample presets Optimus + Critical 20 / Urgent 80 + 1200
incidents; Smoothed/Direct Fit compute (25 / 130 stations) with the overlay and
hide it on completion; heatmap toggle preserves the 1200 incidents; "stopped
early" renders in neutral gray (rgb(136,147,162)) in both Smoothed and Direct
Fit. node --check + build clean; no console errors; shadowing scan clean.

---

## Pass — Public-release feature set (six items): 2026-05-31

Six coordinated additions, each committed separately and verified headless.

### Item 3 — Spatial index for KDE at scale
New `src/spatial-index.js` (uniform grid hash). `buildDemandGrid` indexes
incidents in the same planar meter-space metric as `demandDistanceMeters`, so a
radius query returns exactly the in-cutoff set — byte-identical demand surface.
`greedyWeightedDemandCoverage` uses the index as a broad phase (no-fly-free case)
with the exact haversine narrow-phase kept. Verified equivalence on a fixed
incident set (identical active cells, stations, coverage; max cell-weight delta
4e-14 = fp summation-order). Smoothed pipeline total runtime: 1000→261ms,
2500→294ms, 5000→332ms, 7500→336ms, 10000→396ms (brute-force 5000 was 15.4 s →
51× faster). Targets (<5 s@5000, <15 s@10000) easily met. Adds verification-only
`window.__dfrBenchmarkSmoothed`.

### Item 1 — Existing-deployment comparison + locked stations
Step 01 "Existing Deployment" control (None / Place on map / Upload CSV) with
per-station editor rows (name, units, platform, Lock, remove) and amber map
markers; outside-area / no-fly flags. Locked stations are seeded into both
greedy routines (forced in, pre-cover their demand, greedy fills the rest).
Comparison after compute: map colours (current amber / recommended cyan / kept
green), Current-vs-Recommended metric table (stations, units, coverage %, KPI %,
load %) via one shared geographic+loss-model evaluator, and Keep/Add/Remove
delta. JSON gains `existing_deployment` / `recommended_deployment` / `comparison`;
Excel gains a comparison sheet; PDF gains a dedicated comparison page. Scope
note: fleet-mode Direct Fit (heterogeneous) does not seed locked stations.

### Item 2 — Methods page in the About modal
Fourth About page "Methods": greedy max-coverage (1−1/e bound), smoothed demand
(KDE + Silverman), Monte Carlo (robust core + percentile CIs), time-aware
concurrency simulation, assumptions/limitations, with brief citations. Page
count made dynamic in both wiring sites (no hardcoded 3).

### Item 5 — Excel (.xlsx) deployment-schedule export
"Export Excel" in Step 04 (SheetJS). "Recommended" sheet: header + per-station
rows + NETWORK summary row. Optional "Current vs Recommended" sheet when a
comparison exists. Filename `dfr-deployment-{OpID}-{YYYYMMDD-HHMM}.xlsx`.

### Item 6 — Terms of Use + copyright
Landing footer "© UASC, Dubai Police, 2026. All rights reserved." + Terms modal
(who-may-use, planning-grade caveat, no-warranty, data-handling, contact).
Data-handling wording reflects an actual egress audit (no analytics/telemetry;
uploads stay in-browser; only map tiles + optional boundary lookup leave the
browser). Contact email is a flagged PLACEHOLDER pending the authoritative UASC
inbox. About final page already carries the copyright line.

### Item 4 — Arabic translation (Level 1, LTR) + i18n machinery
Language selector in the Settings gear (English / العربية), persisted in
localStorage, restored on load and across pages. DOM translator substitutes
Arabic for exact English source strings on leaf nodes + placeholders, restoring
English on switch-back; misses fall back to English. Layout stays LTR
(`dir=ltr`); Arabic renders RTL within elements. `src/i18n-ar.js` is headed
"ARABIC TRANSLATIONS — PENDING UASC AUTHORITATIVE REVIEW" and is an initial
draft (nav, buttons, step titles, settings, metrics, About/Methods, Terms).
Level-1 limits: mixed text+element nodes and JS-built dynamic strings stay
English.

All items: `node --check` (app.js, home.js, src/*), `node build.js`, and
shadowing scan clean; headless verification passed; no console errors.
