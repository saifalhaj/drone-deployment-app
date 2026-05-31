/*
 * spatial-index.js — Reusable uniform-grid spatial hash for 2D radius queries.
 *
 * Used by the planner (app.js) to accelerate the two hot loops that otherwise
 * scale as O(points × cells):
 *   1. KDE demand-surface construction (buildDemandGrid) — each grid cell needs
 *      the incidents within 3×bandwidth. Points are inserted in the SAME planar
 *      meter-space metric the KDE uses (demandDistanceMeters), so queryRadius is
 *      exact and the resulting demand surface is byte-for-byte identical to the
 *      former brute-force loop — just faster.
 *   2. Greedy candidate evaluation — each candidate station needs the demand
 *      cells within its coverage radius. The greedy uses haversine, which differs
 *      slightly from the planar metric, so it uses queryRadius as a BROAD PHASE
 *      (with an inflated radius guaranteeing a superset) and keeps the exact
 *      haversine check as the narrow phase. Output is therefore unchanged.
 *
 * Build cost is O(n); a radius query touches only the buckets overlapping the
 * query box, so density-bounded neighbourhoods make queries effectively O(1).
 *
 * Loaded as a plain <script> before app.js (planner/index.html); build.js inlines
 * it into dist. Exposes window.DFRSpatialIndex.
 */
(function (global) {
  'use strict';

  // cellSize should be roughly the typical query radius: too small inflates the
  // bucket sweep, too large degrades each bucket toward a linear scan. Callers
  // pass the dominant query radius.
  function SpatialGrid(cellSize) {
    this.cellSize = (typeof cellSize === 'number' && cellSize > 0) ? cellSize : 1;
    this.buckets = new Map();
    this.count = 0;
  }

  SpatialGrid.prototype._bucketKey = function (cx, cy) {
    return cx + ':' + cy;
  };

  // Insert a point at planar coordinates (x, y) carrying an arbitrary payload.
  SpatialGrid.prototype.insert = function (x, y, payload) {
    var cx = Math.floor(x / this.cellSize);
    var cy = Math.floor(y / this.cellSize);
    var key = cx + ':' + cy;
    var arr = this.buckets.get(key);
    if (!arr) { arr = []; this.buckets.set(key, arr); }
    arr.push({ x: x, y: y, p: payload });
    this.count++;
  };

  // Bulk build from an array of items via accessor functions returning x, y.
  SpatialGrid.fromPoints = function (items, getX, getY, cellSize) {
    var grid = new SpatialGrid(cellSize);
    for (var i = 0; i < items.length; i++) {
      grid.insert(getX(items[i], i), getY(items[i], i), items[i]);
    }
    return grid;
  };

  // Exact radius query: returns payloads whose stored point lies within `radius`
  // of (x, y) under Euclidean distance in the stored metric. No false negatives,
  // no false positives — suitable when the caller's distance metric matches the
  // coordinates the points were inserted with.
  SpatialGrid.prototype.queryRadius = function (x, y, radius) {
    var out = [];
    var r2 = radius * radius;
    var cs = this.cellSize;
    var minCx = Math.floor((x - radius) / cs);
    var maxCx = Math.floor((x + radius) / cs);
    var minCy = Math.floor((y - radius) / cs);
    var maxCy = Math.floor((y + radius) / cs);
    for (var cx = minCx; cx <= maxCx; cx++) {
      for (var cy = minCy; cy <= maxCy; cy++) {
        var arr = this.buckets.get(cx + ':' + cy);
        if (!arr) continue;
        for (var i = 0; i < arr.length; i++) {
          var e = arr[i];
          var dx = e.x - x, dy = e.y - y;
          if (dx * dx + dy * dy <= r2) out.push(e.p);
        }
      }
    }
    return out;
  };

  // Broad-phase query: returns payloads in every bucket overlapping the query
  // box of half-width `radius`, WITHOUT the exact distance filter. The result is
  // a guaranteed superset of the true in-radius set (plus some nearby extras),
  // for callers whose real metric differs from the stored coordinates (e.g.
  // haversine vs planar) and that apply their own exact narrow-phase check.
  SpatialGrid.prototype.queryCandidates = function (x, y, radius) {
    var out = [];
    var cs = this.cellSize;
    var minCx = Math.floor((x - radius) / cs);
    var maxCx = Math.floor((x + radius) / cs);
    var minCy = Math.floor((y - radius) / cs);
    var maxCy = Math.floor((y + radius) / cs);
    for (var cx = minCx; cx <= maxCx; cx++) {
      for (var cy = minCy; cy <= maxCy; cy++) {
        var arr = this.buckets.get(cx + ':' + cy);
        if (!arr) continue;
        for (var i = 0; i < arr.length; i++) out.push(arr[i].p);
      }
    }
    return out;
  };

  global.DFRSpatialIndex = { SpatialGrid: SpatialGrid };

})(typeof window !== 'undefined' ? window : this);
