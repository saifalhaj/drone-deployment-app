#!/usr/bin/env node
/*
 * build.js — Bundle index.html + styles.css + app.js into one HTML file
 * suitable for distribution.
 *
 * Usage:
 *   node build.js
 *
 * Output:
 *   dist/dfr_deployment_planner.html  (single-file, no external deps except CDN libs)
 *
 * What it does:
 *   1. Reads index.html
 *   2. Replaces <link href="styles.css"> with the inlined CSS in a <style> block
 *   3. Replaces <script src="app.js"> with the inlined JS in an inline <script>
 *   4. Writes the result to dist/
 *
 * What it does NOT do:
 *   - Minify (the output is readable on purpose — useful for ops/audit)
 *   - Bundle CDN libraries (Leaflet/jsPDF/etc still load from CDN as before)
 *   - Run any kind of transpilation or framework processing
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const OUT  = path.join(DIST, 'dfr_deployment_planner.html');

function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf-8'); }

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

let html = read('index.html');
const css = read('styles.css');
const js  = read('app.js');

// Replace the stylesheet link with an inline <style> block
html = html.replace(
  /<link\s+rel=["']stylesheet["']\s+href=["']styles\.css["']\s*\/?>/i,
  `<style>\n${css}\n</style>`
);

// Replace the script src with an inline <script> block.
// The app.js already includes its own IIFE wrapper.
html = html.replace(
  /<script\s+src=["']app\.js["']\s*><\/script>/i,
  `<script>\n${js}\n</script>`
);

fs.writeFileSync(OUT, html, 'utf-8');

const dataSrc = path.join(ROOT, 'data');
const dataOut = path.join(DIST, 'data');
if (fs.existsSync(dataSrc)) {
  fs.cpSync(dataSrc, dataOut, { recursive: true });
}

const size = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`✓ Built ${path.relative(ROOT, OUT)}  (${size} KB)`);
