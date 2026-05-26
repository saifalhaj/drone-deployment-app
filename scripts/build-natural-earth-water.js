const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SOURCES = [
  {
    type: 'ocean',
    file: 'C:\\Users\\saif\\Desktop\\oceans\\ne_10m_ocean.shp',
    tolerance: 0.015,
    minArea: 0.0005
  },
  {
    type: 'lake',
    file: 'C:\\Users\\saif\\Desktop\\lakes\\ne_10m_lakes.shp',
    tolerance: 0.004,
    minArea: 0.00002
  }
];

function readShp(file) {
  const buf = fs.readFileSync(file);
  const features = [];
  let offset = 100;
  while (offset + 8 <= buf.length) {
    const contentWords = buf.readInt32BE(offset + 4);
    offset += 8;
    const end = offset + contentWords * 2;
    if (end > buf.length) break;
    const shapeType = buf.readInt32LE(offset);
    if (shapeType === 5 || shapeType === 15) {
      const numParts = buf.readInt32LE(offset + 36);
      const numPoints = buf.readInt32LE(offset + 40);
      const parts = [];
      let pOffset = offset + 44;
      for (let i = 0; i < numParts; i++) {
        parts.push(buf.readInt32LE(pOffset + i * 4));
      }
      const pointsOffset = pOffset + numParts * 4;
      const rings = [];
      for (let part = 0; part < numParts; part++) {
        const start = parts[part];
        const stop = part + 1 < numParts ? parts[part + 1] : numPoints;
        const ring = [];
        for (let i = start; i < stop; i++) {
          const ptOffset = pointsOffset + i * 16;
          ring.push([buf.readDoubleLE(ptOffset), buf.readDoubleLE(ptOffset + 8)]);
        }
        rings.push(ring);
      }
      features.push(rings);
    }
    offset = end;
  }
  return features;
}

function sqDist(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function sqSegDist(p, a, b) {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
  let maxSqDist = sqTolerance;
  let index = -1;
  for (let i = first + 1; i < last; i++) {
    const sq = sqSegDist(points[i], points[first], points[last]);
    if (sq > maxSqDist) {
      index = i;
      maxSqDist = sq;
    }
  }
  if (index !== -1) {
    if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
    simplified.push(points[index]);
    if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
  }
}

function simplify(points, tolerance) {
  if (points.length <= 4) return points;
  const open = points.slice();
  const first = open[0];
  const last = open[open.length - 1];
  if (sqDist(first, last) === 0) open.pop();
  const simplified = [open[0]];
  simplifyDPStep(open, 0, open.length - 1, tolerance * tolerance, simplified);
  simplified.push(open[open.length - 1]);
  simplified.push(simplified[0]);
  return simplified;
}

function ringArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(area / 2);
}

function signedArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] * ring[i][1]) - (ring[i][0] * ring[j][1]);
  }
  return area / 2;
}

function pointInRing(point, ring) {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function representativePoint(ring) {
  return ring[0];
}

function roundRing(ring) {
  return ring.map(([lng, lat]) => [
    Number(lng.toFixed(5)),
    Number(lat.toFixed(5))
  ]);
}

function build() {
  const features = [];
  const summary = [];
  for (const source of SOURCES) {
    const shapes = readShp(source.file);
    let kept = 0;
    let points = 0;
    for (const shape of shapes) {
      const rings = shape
        .map(ring => roundRing(simplify(ring, source.tolerance)))
        .filter(ring => ring.length >= 4 && ringArea(ring) >= source.minArea)
        .map(ring => ({ ring, signedArea: signedArea(ring), area: ringArea(ring) }));
      if (rings.length === 0) continue;

      const exteriors = rings
        .filter(r => r.signedArea < 0)
        .sort((a, b) => b.area - a.area);
      const holes = rings.filter(r => r.signedArea >= 0);

      // ESRI shapefiles use clockwise outer rings and counter-clockwise holes.
      // If a layer has no holes/exterior orientation distinction after
      // simplification, keep the rings as independent polygons.
      const polygons = exteriors.length > 0
        ? exteriors.map(ext => [ext.ring])
        : rings.map(r => [r.ring]);

      if (exteriors.length > 0) {
        for (const hole of holes) {
          const owner = polygons.find(poly => pointInRing(representativePoint(hole.ring), poly[0]));
          if (owner) owner.push(hole.ring);
        }
      }

      for (const coordinates of polygons) {
        const pointCount = coordinates.reduce((sum, ring) => sum + ring.length, 0);
        if (pointCount < 4) continue;
      kept++;
        points += pointCount;
      features.push({
        type: 'Feature',
        properties: { source: 'Natural Earth 1:10m', kind: source.type },
          geometry: { type: 'Polygon', coordinates }
      });
    }
    }
    summary.push({ type: source.type, inputShapes: shapes.length, outputFeatures: kept, points });
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const collection = {
    type: 'FeatureCollection',
    name: 'natural_earth_water_exclusions',
    properties: {
      source: 'Natural Earth 1:10m ocean and lakes',
      generated: new Date().toISOString(),
      note: 'Rivers centerlines are not included because they are line features, not water polygons.'
    },
    features
  };
  const out = path.join(DATA_DIR, 'natural-earth-water.geojson');
  fs.writeFileSync(out, JSON.stringify(collection));
  console.log(JSON.stringify({ out, features: features.length, summary }, null, 2));
}

build();
