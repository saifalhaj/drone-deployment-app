#!/usr/bin/env node
/*
 * build.js — Bundle the home page and planner page into dist/.
 *
 * Output:
 *   dist/index.html
 *   dist/planner/index.html
 *   dist/data/*
 *   dist/assets/*
 *
 * CDN libraries still load from the network; local CSS/JS is inlined.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

function read(p) {
  return fs.readFileSync(path.join(ROOT, p), 'utf-8');
}

function write(outPath, html) {
  const abs = path.join(DIST, outPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html, 'utf-8');
  const size = (fs.statSync(abs).size / 1024).toFixed(1);
  console.log(`✓ Built ${path.relative(ROOT, abs)}  (${size} KB)`);
}

function inlineCss(html, href, cssPath) {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(
    new RegExp(`<link\\s+rel=["']stylesheet["']\\s+href=["']${escaped}["']\\s*/?>`, 'i'),
    `<style>\n${read(cssPath)}\n</style>`
  );
}

function inlineJs(html, src, jsPath) {
  const escaped = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(
    new RegExp(`<script\\s+src=["']${escaped}["']\\s*><\\/script>`, 'i'),
    `<script>\n${read(jsPath)}\n</script>`
  );
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

let home = read('index.html');
home = inlineCss(home, 'home.css', 'home.css');
home = inlineJs(home, 'src/about-modal.js', 'src/about-modal.js');
home = inlineJs(home, 'home.js', 'home.js');
write('index.html', home);

let planner = read('planner/index.html');
planner = inlineCss(planner, '../styles.css', 'styles.css');
planner = inlineJs(planner, '../src/about-modal.js', 'src/about-modal.js');
planner = inlineJs(planner, '../app.js', 'app.js');
write('planner/index.html', planner);

for (const dir of ['data', 'assets']) {
  const src = path.join(ROOT, dir);
  const out = path.join(DIST, dir);
  if (fs.existsSync(src)) fs.cpSync(src, out, { recursive: true });
}
