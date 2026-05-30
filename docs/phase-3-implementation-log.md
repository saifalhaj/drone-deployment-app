# Phase 3 Implementation Log

## 2026-05-29 - Start

- Shadowing pre-check: no local `const`/`let` shadows of top-level function/const names found on `main` before Phase 3 work.
- Visualization decision: proceed with shared Monte Carlo visualization primitives and explicit view modes. Production consensus, probability markers, View Run, and Compare To Consensus should all route through the same renderer entry point rather than separate default code paths.
- Design guardrail: high Monte Carlo load values must be labeled as robust-core load and explained as a signal that additional units beyond robust core reduce load.

## 2026-05-29 - Implementation Notes

- Decision: `renderMonteCarloVisualization()` is the shared renderer for aggregate consensus, probability markers, View Run, and Compare To Consensus. Debug states pass explicit view options instead of owning a separate map-rendering path.
- Tradeoff: if no station bin reaches the robust-core threshold, the aggregate map falls back to top-frequency primary markers labeled as top-frequency rather than robust-core sites, so the map is not blank but does not overstate consensus.
- Refactor beyond strict Phase 3 scope: Monte Carlo JSON export now separates default `result_meta` from optional `run_details`; the latter is included only when the Appendix JSON snapshot checkbox is selected.
- PDF tradeoff: Monte Carlo reports always include the second Sensitivity Analysis page. Direct Fit and Smoothed Demand remain single-page.
- Load-context guardrail: Monte Carlo UI and PDF label load as robust-core load and add explanatory text when it exceeds 100%.

## 2026-05-29 - Verification Notes

- Realistic-scale headless Edge test: 1000 incidents, N=30, fitted absolute timestamps, seed `424242`.
- Monte Carlo runtime: app-reported `2.9s`; harness wall-clock `3093ms`.
- PDF generation runtime: harness wall-clock `3035ms`; downloaded `UASC_DFR_Plan_2026-05-29.pdf`; size `963131` bytes.
- PDF structure check: 2 pages detected; text contains `Sensitivity Analysis` and the robust-core load explanation.
- Visualization check: consensus overlay rendered marker icons; probability marker mode rendered marker icons after toggling. Both completed without browser exceptions.
- High-load guardrail check: run produced robust-core load context text in UI because load exceeded 100%.

## 2026-05-30 - Overhead Consolidation

- Change: dispatch overhead is now a single global value (`planningModeState.globalOverhead`, default 15s) instead of a per-category `overheadSec` field. Overhead reflects platform tech (dock open, sensor warmup, climb) and organizational protocol (approvals, comms, safety checks, ATC callouts) — none of which depend on incident category, so effective fly-time per category is `categoryKPI - globalOverhead`.
- UI: added "Dispatch Overhead (s)" to the Mission and Toolkit panel; removed the per-category overhead input from Step 02 cards (KPI retained). New global field reads/writes through `getGlobalOverheadSec()`.
- Exports: JSON `mission_profile.dispatch_overhead_seconds` and the PDF mission-profile strip now record the global overhead; per-category `overhead_seconds` dropped from JSON (derived `effective_fly_time_seconds` retained).
- Migration: loading a v1/v2 plan that carried per-category overhead and no explicit `globalOverhead` adopts the maximum per-category overhead as the new single global value (most conservative). A one-line `[DFR migration]` notice is logged to the console at load time. Newly saved plans use the v2 schema with a single `globalOverhead` at the planning-mode-state level.
