(function(global) {
  'use strict';

  const SAVED_PLAN_VERSION = 2;

  const PLANNING_MODE = {
    DIRECT_FIT: 'direct-fit',
    SMOOTHED_GROWTH: 'smoothed-growth',
    MONTE_CARLO: 'monte-carlo'
  };

  function createDefaultPlanningModeState() {
    return {
      mode: PLANNING_MODE.DIRECT_FIT,
      directFit: {
        coverageTargetPct: 90,
        minIncidentsPerSite: 2,
        warningAcknowledged: false
      },
      smoothedGrowth: {
        gridResolution: 100,
        bandwidthMode: 'auto-silverman',
        bandwidthMeters: null,
        growthMultiplier: 1,
        demandThresholdPct: 1,
        useCategoryWeights: true
      },
      monteCarlo: {
        runCount: 30,
        growthMultiplier: 1,
        confidenceLevel: 0.9,
        robustCoreThresholdPct: 60,
        randomSeed: null,
        maxRuntimeSec: 60,
        visualizationMode: 'consensus-overlay'
      },
      activeResultId: null,
      cachedResults: {}
    };
  }

  function mergePlanningModeState(raw) {
    const defaults = createDefaultPlanningModeState();
    if (!raw || typeof raw !== 'object') return defaults;
    const modes = Object.keys(PLANNING_MODE).map(key => PLANNING_MODE[key]);
    const validMode = modes.indexOf(raw.mode) >= 0 ? raw.mode : defaults.mode;
    return {
      ...defaults,
      ...raw,
      mode: validMode,
      directFit: { ...defaults.directFit, ...(raw.directFit || {}) },
      smoothedGrowth: { ...defaults.smoothedGrowth, ...(raw.smoothedGrowth || {}) },
      monteCarlo: { ...defaults.monteCarlo, ...(raw.monteCarlo || {}) },
      cachedResults: raw.cachedResults && typeof raw.cachedResults === 'object' ? raw.cachedResults : {}
    };
  }

  function normalizeSavedPlanEnvelope(plan) {
    if (!plan || typeof plan !== 'object') return plan;
    return {
      ...plan,
      version: Number(plan.version || 1),
      planningModeState: mergePlanningModeState(plan.planningModeState)
    };
  }

  global.DFRPlanningModeState = {
    SAVED_PLAN_VERSION,
    PLANNING_MODE,
    createDefaultPlanningModeState,
    mergePlanningModeState,
    normalizeSavedPlanEnvelope
  };
})(typeof window !== 'undefined' ? window : globalThis);
