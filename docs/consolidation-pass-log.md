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
