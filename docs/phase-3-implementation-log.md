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
