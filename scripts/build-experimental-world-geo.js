/**
 * Compact Natural Earth countries + states and US counties for Experimental maps.
 * Run: node scripts/build-experimental-world-geo.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUT = path.join(__dirname, '..', 'public', 'experimental', 'geo');
const UA = 'LivingWordMap/1.0 (experimental world geo build)';

const URLS = {
  countries: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson',
  states: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson',
  counties: 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json',
};

function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    const go = (u, hops) => {
      if (hops > 6) return reject(new Error('too many redirects'));
      const lib = u.startsWith('https') ? https : http;
      lib
        .get(u, { headers: { 'User-Agent': UA, Accept: 'application/json' } }, res => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return go(new URL(res.headers.location, u).toString(), hops + 1);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`${u} -> ${res.statusCode}`));
          }
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        })
        .on('error', reject);
    };
    go(url, 0);
  });
}

function q(n) {
  return Math.round(Number(n) * 10000) / 10000;
}

function simplifyRing(ring, maxPts) {
  if (!Array.isArray(ring) || ring.length < 4) return null;
  const step = ring.length > maxPts ? Math.max(1, Math.ceil(ring.length / maxPts)) : 1;
  const out = [];
  for (let i = 0; i < ring.length; i += step) {
    const pt = ring[i];
    if (!pt || pt.length < 2) continue;
    out.push([q(pt[0]), q(pt[1])]);
  }
  const first = out[0];
  const last = out[out.length - 1];
  if (!first) return null;
  if (!last || first[0] !== last[0] || first[1] !== last[1]) out.push([first[0], first[1]]);
  return out.length >= 4 ? out : null;
}

function compactGeom(geom, maxPts) {
  if (!geom) return null;
  if (geom.type === 'Polygon') {
    const rings = (geom.coordinates || [])
      .map((ring, i) => simplifyRing(ring, i === 0 ? maxPts : Math.min(40, maxPts)))
      .filter(Boolean);
    if (!rings.length) return null;
    return { type: 'Polygon', coordinates: rings };
  }
  if (geom.type === 'MultiPolygon') {
    const polys = [];
    (geom.coordinates || []).forEach(poly => {
      const rings = (poly || [])
        .map((ring, i) => simplifyRing(ring, i === 0 ? maxPts : Math.min(40, maxPts)))
        .filter(Boolean);
      if (rings.length) polys.push(rings);
    });
    if (!polys.length) return null;
    return polys.length === 1
      ? { type: 'Polygon', coordinates: polys[0] }
      : { type: 'MultiPolygon', coordinates: polys };
  }
  if (geom.type === 'GeometryCollection') {
    const parts = (geom.geometries || []).map(g => compactGeom(g, maxPts)).filter(Boolean);
    if (!parts.length) return null;
    if (parts.length === 1) return parts[0];
    const coords = [];
    parts.forEach(p => {
      if (p.type === 'Polygon') coords.push(p.coordinates);
      else if (p.type === 'MultiPolygon') coords.push(...p.coordinates);
    });
    return { type: 'MultiPolygon', coordinates: coords };
  }
  return null;
}

function iso2OfCountry(p) {
  const raw = String(p.ISO_A2_EH || p.ISO_A2 || p.iso_a2 || '').toLowerCase();
  if (raw && raw !== '-99' && raw.length === 2) return raw;
  const a3 = String(p.ADM0_A3 || p.ISO_A3 || '').toUpperCase();
  const map = { FRA: 'fr', NOR: 'no', KOS: 'xk', SOL: 'so', SAH: 'eh', CYN: 'cy' };
  return map[a3] || '';
}

function continentOf(p) {
  return String(p.CONTINENT || p.continent || '').trim();
}

function decodeTopoPolygons(topo, objectName) {
  const obj = topo.objects[objectName];
  const arcs = topo.arcs;
  const scale = topo.transform?.scale || [1, 1];
  const translate = topo.transform?.translate || [0, 0];

  function decodeArc(idx) {
    const reverse = idx < 0;
    const arc = arcs[reverse ? ~idx : idx];
    let x = 0;
    let y = 0;
    const pts = arc.map(d => {
      x += d[0];
      y += d[1];
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
    return reverse ? pts.reverse() : pts;
  }

  function stitch(ringArcs) {
    const ring = [];
    ringArcs.forEach(idx => {
      const pts = decodeArc(idx);
      if (!ring.length) ring.push(...pts);
      else ring.push(...pts.slice(1));
    });
    return ring;
  }

  return (obj.geometries || [])
    .filter(g => g.type === 'Polygon' || g.type === 'MultiPolygon')
    .map(g => {
      let coordinates;
      if (g.type === 'Polygon') coordinates = g.arcs.map(stitch);
      else coordinates = g.arcs.map(poly => poly.map(stitch));
      return {
        id: String(g.id || ''),
        properties: g.properties || {},
        geometry: { type: g.type, coordinates },
      };
    });
}

function writeJson(file, obj) {
  const dest = path.join(OUT, file);
  fs.writeFileSync(dest, JSON.stringify(obj));
  const kb = Math.round(fs.statSync(dest).size / 1024);
  console.log(`wrote ${file} (${kb} KB, ${obj.features.length} features)`);
}

async function buildCountries(raw) {
  const gj = JSON.parse(raw.toString('utf8'));
  const features = [];
  for (const f of gj.features || []) {
    const p = f.properties || {};
    const iso2 = iso2OfCountry(p);
    const name = String(p.NAME_EN || p.NAME || p.name || '').trim();
    if (!name) continue;
    const geom = compactGeom(f.geometry, 120);
    if (!geom) continue;
    features.push({
      type: 'Feature',
      properties: {
        name,
        iso2,
        iso3: String(p.ADM0_A3 || p.ISO_A3 || '').toLowerCase(),
        continent: continentOf(p) || 'Unknown',
      },
      geometry: geom,
    });
  }
  writeJson('world-countries.json', { type: 'FeatureCollection', source: 'naturalearth-50m', features });
}

async function buildStates(raw) {
  const gj = JSON.parse(raw.toString('utf8'));
  const features = [];
  for (const f of gj.features || []) {
    const p = f.properties || {};
    const name = String(p.name || p.NAME || '').trim();
    if (!name) continue;
    const iso2 = String(p.iso_a2 || p.ISO_A2 || '').toLowerCase();
    const geom = compactGeom(f.geometry, 60);
    if (!geom) continue;
    features.push({
      type: 'Feature',
      properties: {
        name,
        iso2: iso2 && iso2 !== '-99' ? iso2 : iso2OfCountry(p),
        postal: String(p.postal || p.abbrev || '').toUpperCase(),
        kind: String(p.type || p.type_en || 'state').toLowerCase(),
        country: String(p.admin || p.ADMIN || ''),
      },
      geometry: geom,
    });
  }
  writeJson('world-states.json', { type: 'FeatureCollection', source: 'naturalearth-50m-admin1', features });
}

async function buildCounties(raw) {
  const topo = JSON.parse(raw.toString('utf8'));
  const decoded = decodeTopoPolygons(topo, 'counties');
  const features = [];
  for (const f of decoded) {
    const fips = String(f.id || f.properties?.id || '').padStart(5, '0');
    const name = String(f.properties.name || f.properties.NAME || '').trim();
    if (!fips || fips.length < 5) continue;
    const geom = compactGeom(f.geometry, 50);
    if (!geom) continue;
    features.push({
      type: 'Feature',
      properties: {
        name: name || fips,
        fips,
        statefp: fips.slice(0, 2),
        kind: 'county',
        iso2: 'us',
      },
      geometry: geom,
    });
  }
  writeJson('us-counties.json', { type: 'FeatureCollection', source: 'us-atlas-10m', features });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log('Downloading countries…');
  const countries = await fetchBuf(URLS.countries);
  await buildCountries(countries);
  console.log('Downloading states…');
  const states = await fetchBuf(URLS.states);
  await buildStates(states);
  console.log('Downloading US counties…');
  const counties = await fetchBuf(URLS.counties);
  await buildCounties(counties);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
