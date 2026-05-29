# Planning Module Scaffold

Phase 0 keeps the app's runtime behavior unchanged while defining where planning-mode logic should move as implementation begins.

Planned module boundaries:

- `planning-mode-state.js`: mode IDs, default settings, saved-plan migration helpers.
- `demand-grid.js`: KDE grid construction and demand-cell normalization.
- `optimizer-adapter.js`: wrappers that translate planning-mode demand into existing optimizer inputs.
- `monte-carlo.js`: synthetic future sampling, run orchestration, and aggregation.

These modules are not loaded by `planner/index.html` yet. The current browser app still runs through `app.js`; future phases can move pure functions into this folder and wire them into the build deliberately.
