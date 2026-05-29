# Phase 2 Implementation Log

## 2026-05-29 - Start

- Shadowing pre-check: no local `const`/`let` shadows of top-level function/const names found on `main` before Phase 2 work.
- Design choices confirmed from approved Revision 1: raw synthetic incidents per Monte Carlo run, bandwidth-derived station aggregation bins, 60% robust-core threshold, 90% confidence interval default, uniform temporal fallback when absolute timestamps are absent.
- Design gap noted: Phase 2 asks for View Run / Compare To Consensus even though consensus overlay visualization is Phase 3. Implementation will keep these as debug-only temporary map states rather than the production probability/consensus visualization.

## 2026-05-29 - Implementation Notes

- Decision: Monte Carlo uses raw synthetic incidents for every run, then aggregates station bins afterward. This follows the approved recommendation and keeps uncertainty visible.
- Decision: View Run and Compare To Consensus are implemented as temporary debug map states. The normal Monte Carlo result does not render the Phase 3 probability-weighted/consensus overlay.
- Refactor beyond strict Phase 2 scope: `buildNetworkLoadSummary` now accepts an optional station list so per-run summaries can be computed without replacing global `stations`.
- Refactor beyond strict Phase 2 scope: saved-plan incident JSON now preserves `timestamp` because the Monte Carlo temporal model needs absolute timestamps after reload. This fixed a bug found during verification where reloaded plans incorrectly used the uniform temporal fallback.
- Tradeoff: debug run records retain full synthetic incidents only for best KPI, worst KPI, highest unit count, and whichever run the user inspects. Non-retained runs reconstruct synthetic incidents from their seed when inspected.
- Tradeoff: headless verification uses file URL loading with CDN dependencies instead of the local static server because background server processes were not staying alive in this sandbox.

## 2026-05-29 - Runtime Measurements

- Dataset: 80 incidents, 3 spatial clusters, 720-hour profile, fitted absolute timestamps, headless Edge.
- Monte Carlo N=10 fitted timestamp run: app-reported runtime `0.1s`; harness elapsed `507ms`; temporal model `fitted-hour-dow`; no browser exceptions.
- Monte Carlo N=10 absent timestamp run: app-reported runtime `0.1s`; harness elapsed `514ms`; temporal model `uniform-fallback`; warning dialog shown and accepted; no browser exceptions.
- Monte Carlo N=30 fitted timestamp run: app-reported runtime `0.2s`; clean harness elapsed `261ms`; temporal model `fitted-hour-dow`; no browser exceptions.
- Debuggability check: View Run, Compare To Consensus, and Return To Consensus completed in headless Edge with no browser exceptions.
