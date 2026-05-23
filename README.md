# DFR Deployment Planner

Drone First Response (DFR) deployment planning tool for the Unmanned Aerial Systems Center, Dubai Police. Browser-based, no backend, no framework.

## What this tool does

Given an operational area, a set of historical incidents, and a fleet of DroneBox platforms, it computes where to place stations and how many drones per station to meet response-time KPI targets. Output is a map visualization, a deployment schedule with coordinates, and a one-page PDF report defensible to leadership and procurement.

See the in-app **About** modal (ⓘ in the header) for the non-technical explanation.

## Project structure

```
dfr-planner/
├── index.html        Markup — header, sidebar panels, map container, modals
├── styles.css        All styling (dark theme by default)
├── app.js            All logic — wrapped in one IIFE
├── build.js          Bundles the three files back into one for distribution
├── package.json      Just for the build script — no runtime dependencies
├── .gitignore
├── .gitattributes    Forces LF line endings across Windows/Mac/Linux
└── .vscode/
    ├── extensions.json   Recommended extensions
    └── settings.json     Editor settings (tabs, EOL, formatters)
```

External libraries (Leaflet, jsPDF, html2canvas, SheetJS, JSZip) load from CDN — they are NOT bundled. The CDN `<script>` tags are in `index.html`.

## How the code is organized

`app.js` is one large IIFE. Sections inside are marked with banner comments:

```
// ============ INCIDENT FILE PARSING ============
// ============ OPTIMIZATION (Greedy Max Coverage) ============
// ============ DRONE PLATFORM CATALOG ============
// ============ PDF REPORT GENERATION ============
```

Use **VS Code → Outline panel** (or `Ctrl+Shift+O` / `Cmd+Shift+O`) to jump between sections, or `Ctrl+F` for the banner you want.

## Running locally

Three options, easiest first:

**1. Live Server (recommended).** Install the **Live Server** extension (`ritwickdey.liveserver` — already in the recommended list). Right-click `index.html` → **Open with Live Server**. The page opens in your default browser at `http://localhost:5500/`, and auto-reloads on file save.

**2. `npx serve`.** If you have Node installed, just run `npx serve .` in the project folder. Open `http://localhost:3000/`. No reload on save — refresh manually.

**3. Open the file directly.** Double-click `index.html` (or drag into a browser). It mostly works, but some browsers refuse to fetch local files via `file://` — you'll get cryptic errors instead of CSS/JS loading. Don't bother. Use option 1.

## Building the single-file distributable

When you want to share the tool as one HTML file (email, USB stick, embedded in a SharePoint page), bundle it:

```bash
node build.js
```

Output goes to `dist/dfr_deployment_planner.html` — same single-file format you started from. CDN libraries still load from the network, but everything else is inlined.

## Workflow with Claude Code

1. Open this folder in VS Code: **File → Open Folder**
2. Install the recommended extensions when VS Code prompts you (Claude Code + Live Server)
3. Start Live Server (right-click `index.html` → Open with Live Server)
4. Open the Claude Code panel and ask it to make changes. Claude Code will edit `app.js` / `styles.css` / `index.html` directly. Save the file, and the browser tab auto-reloads.

For larger changes, ask Claude Code to explain what it plans to do before making the edit. Review the diff in VS Code's source control panel before committing.

## Source control

Initialize git the first time:

```bash
git init
git add -A
git commit -m "Initial commit: split from single-file"
```

After that, commit small, focused changes. Branch when trying anything experimental.

## Testing changes

There's no automated test suite. Manual sanity check before committing anything substantive:

1. Reload the page
2. Draw an operational area (a simple rectangle is fine)
3. Generate ~100 incidents
4. Compute Deployment
5. Verify the map shows stations and coverage circles
6. Open browser console (F12) — there should be no red errors

For algorithmic changes (the optimizer or simulation), also generate the PDF report and verify the marginal-value curves look reasonable.

## Things not in this repo (yet)

- Automated tests
- Continuous integration
- Linting / formatting CI hooks
- Live DroneBox flight-log calibration

Each is worth adding when the project crosses the threshold where it's no longer "one person iterating quickly." Right now the simplicity is a feature.
