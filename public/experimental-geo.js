(() => {
  'use strict';

  const SETS = [
    { id: 1, name: 'You and your bloodline', short: 'You' },
    { id: 2, name: "Spouse's bloodline", short: 'Spouse', requiresMarried: true },
    { id: 3, name: 'House', short: 'House' },
    { id: 4, name: 'Neighborhood / metro', short: 'Metro' },
    { id: 5, name: 'City / metropolis', short: 'City' },
    { id: 6, name: 'County / parish / province', short: 'County' },
    { id: 7, name: 'State', short: 'State' },
    { id: 8, name: 'Country', short: 'Country' },
    { id: 9, name: 'Time zone, all countries', short: 'TZ world' },
    { id: 10, name: 'Continent', short: 'Continent' },
    { id: 11, name: 'World', short: 'World' },
  ];

  const CC_CONTINENT = {
    us: 'North America', ca: 'North America', mx: 'North America', gt: 'North America',
    bz: 'North America', sv: 'North America', hn: 'North America', ni: 'North America',
    cr: 'North America', pa: 'North America', cu: 'North America', jm: 'North America',
    ht: 'North America', do: 'North America', pr: 'North America', bs: 'North America',
    br: 'South America', ar: 'South America', cl: 'South America', co: 'South America',
    pe: 'South America', ve: 'South America', ec: 'South America', bo: 'South America',
    py: 'South America', uy: 'South America', gy: 'South America', sr: 'South America',
    gb: 'Europe', ie: 'Europe', fr: 'Europe', de: 'Europe', es: 'Europe', it: 'Europe',
    pt: 'Europe', nl: 'Europe', be: 'Europe', ch: 'Europe', at: 'Europe', pl: 'Europe',
    se: 'Europe', no: 'Europe', dk: 'Europe', fi: 'Europe', gr: 'Europe', cz: 'Europe',
    hu: 'Europe', ro: 'Europe', ua: 'Europe', ru: 'Europe',
    cn: 'Asia', jp: 'Asia', kr: 'Asia', in: 'Asia', id: 'Asia', th: 'Asia', vn: 'Asia',
    ph: 'Asia', my: 'Asia', sg: 'Asia', pk: 'Asia', bd: 'Asia', lk: 'Asia', np: 'Asia',
    sa: 'Asia', ae: 'Asia', il: 'Asia', tr: 'Asia', iq: 'Asia', ir: 'Asia',
    ng: 'Africa', za: 'Africa', eg: 'Africa', ke: 'Africa', et: 'Africa', gh: 'Africa',
    tz: 'Africa', ug: 'Africa', ma: 'Africa', dz: 'Africa', tn: 'Africa',
    cd: 'Africa', cg: 'Africa', na: 'Africa', rw: 'Africa', cm: 'Africa',
    ao: 'Africa', mz: 'Africa', zw: 'Africa', bw: 'Africa', mw: 'Africa',
    zm: 'Africa', sn: 'Africa', ci: 'Africa', lr: 'Africa', sl: 'Africa',
    au: 'Oceania', nz: 'Oceania', fj: 'Oceania', pg: 'Oceania',
  };

  const CASE_LOAD = [
    { id: 'us-nc', label: 'United States · North Carolina', city: 'Raleigh', state: 'North Carolina', country: 'United States', continent: 'North America', countryCode: 'us', lat: 35.78, lon: -78.64 },
    { id: 'pr-sj', label: 'Puerto Rico · San Juan', city: 'San Juan', state: 'Puerto Rico', country: 'Puerto Rico', continent: 'North America', countryCode: 'pr', lat: 18.45, lon: -66.07 },
    { id: 'gb-kent', label: 'England · Kent', city: 'Maidstone', state: 'Kent', country: 'United Kingdom', continent: 'Europe', countryCode: 'gb', lat: 51.27, lon: 0.52 },
    { id: 'ug-kampala', label: 'Uganda · Kampala', city: 'Kampala', state: 'Central Region', country: 'Uganda', continent: 'Africa', countryCode: 'ug', lat: 0.35, lon: 32.58 },
    { id: 'cd-kinshasa', label: 'DR Congo · Kinshasa', city: 'Kinshasa', state: 'Kinshasa', country: 'Democratic Republic of the Congo', continent: 'Africa', countryCode: 'cd', lat: -4.32, lon: 15.31 },
    { id: 'za-gauteng', label: 'South Africa · Gauteng', city: 'Johannesburg', state: 'Gauteng', country: 'South Africa', continent: 'Africa', countryCode: 'za', lat: -26.2, lon: 28.04 },
    { id: 'ng-lagos', label: 'Nigeria · Lagos', city: 'Lagos', state: 'Lagos', country: 'Nigeria', continent: 'Africa', countryCode: 'ng', lat: 6.52, lon: 3.38 },
    { id: 'na-khomas', label: 'Namibia · Khomas', city: 'Windhoek', state: 'Khomas', country: 'Namibia', continent: 'Africa', countryCode: 'na', lat: -22.56, lon: 17.08 },
    { id: 'au-brisbane', label: 'Australia · Brisbane', city: 'Brisbane', county: 'City of Brisbane', state: 'Queensland', country: 'Australia', continent: 'Oceania', countryCode: 'au', lat: -27.47, lon: 153.03 },
    { id: 'ca-on', label: 'Canada · Ontario', city: 'Toronto', state: 'Ontario', country: 'Canada', continent: 'North America', countryCode: 'ca', lat: 43.65, lon: -79.38 },
  ];

  const US_STATES = {
    alabama: { abbr: 'AL', lat: 32.8, lon: -86.8, neighbors: ['tennessee', 'georgia', 'florida', 'mississippi'] },
    alaska: { abbr: 'AK', lat: 64.2, lon: -153.5, neighbors: [] },
    arizona: { abbr: 'AZ', lat: 34.3, lon: -111.7, neighbors: ['california', 'nevada', 'utah', 'colorado', 'new mexico'] },
    arkansas: { abbr: 'AR', lat: 34.9, lon: -92.4, neighbors: ['missouri', 'tennessee', 'mississippi', 'louisiana', 'texas', 'oklahoma'] },
    california: { abbr: 'CA', lat: 37.2, lon: -119.5, neighbors: ['oregon', 'nevada', 'arizona'] },
    colorado: { abbr: 'CO', lat: 39.0, lon: -105.5, neighbors: ['wyoming', 'nebraska', 'kansas', 'oklahoma', 'new mexico', 'utah', 'arizona'] },
    connecticut: { abbr: 'CT', lat: 41.6, lon: -72.7, neighbors: ['new york', 'massachusetts', 'rhode island'] },
    delaware: { abbr: 'DE', lat: 39.0, lon: -75.5, neighbors: ['maryland', 'pennsylvania', 'new jersey'] },
    florida: { abbr: 'FL', lat: 28.1, lon: -82.4, neighbors: ['georgia', 'alabama'] },
    georgia: { abbr: 'GA', lat: 32.7, lon: -83.4, neighbors: ['north carolina', 'south carolina', 'florida', 'alabama', 'tennessee'] },
    hawaii: { abbr: 'HI', lat: 20.8, lon: -156.3, neighbors: [] },
    idaho: { abbr: 'ID', lat: 44.4, lon: -114.6, neighbors: ['montana', 'wyoming', 'utah', 'nevada', 'oregon', 'washington'] },
    illinois: { abbr: 'IL', lat: 40.0, lon: -89.2, neighbors: ['wisconsin', 'indiana', 'kentucky', 'missouri', 'iowa'] },
    indiana: { abbr: 'IN', lat: 39.9, lon: -86.3, neighbors: ['michigan', 'ohio', 'kentucky', 'illinois'] },
    iowa: { abbr: 'IA', lat: 42.0, lon: -93.5, neighbors: ['minnesota', 'wisconsin', 'illinois', 'missouri', 'nebraska', 'south dakota'] },
    kansas: { abbr: 'KS', lat: 38.5, lon: -98.3, neighbors: ['nebraska', 'missouri', 'oklahoma', 'colorado'] },
    kentucky: { abbr: 'KY', lat: 37.5, lon: -85.3, neighbors: ['illinois', 'indiana', 'ohio', 'west virginia', 'virginia', 'tennessee', 'missouri'] },
    louisiana: { abbr: 'LA', lat: 31.0, lon: -92.0, neighbors: ['texas', 'arkansas', 'mississippi'] },
    maine: { abbr: 'ME', lat: 45.3, lon: -69.2, neighbors: ['new hampshire'] },
    maryland: { abbr: 'MD', lat: 39.1, lon: -76.8, neighbors: ['virginia', 'west virginia', 'pennsylvania', 'delaware'] },
    massachusetts: { abbr: 'MA', lat: 42.2, lon: -71.5, neighbors: ['new york', 'vermont', 'new hampshire', 'rhode island', 'connecticut'] },
    michigan: { abbr: 'MI', lat: 44.3, lon: -85.4, neighbors: ['ohio', 'indiana', 'wisconsin'] },
    minnesota: { abbr: 'MN', lat: 46.3, lon: -94.3, neighbors: ['wisconsin', 'iowa', 'south dakota', 'north dakota'] },
    mississippi: { abbr: 'MS', lat: 32.7, lon: -89.7, neighbors: ['tennessee', 'alabama', 'louisiana', 'arkansas'] },
    missouri: { abbr: 'MO', lat: 38.4, lon: -92.5, neighbors: ['iowa', 'illinois', 'kentucky', 'tennessee', 'arkansas', 'oklahoma', 'kansas', 'nebraska'] },
    montana: { abbr: 'MT', lat: 47.1, lon: -109.6, neighbors: ['north dakota', 'south dakota', 'wyoming', 'idaho'] },
    nebraska: { abbr: 'NE', lat: 41.5, lon: -99.9, neighbors: ['south dakota', 'iowa', 'missouri', 'kansas', 'colorado', 'wyoming'] },
    nevada: { abbr: 'NV', lat: 39.3, lon: -116.6, neighbors: ['oregon', 'idaho', 'utah', 'arizona', 'california'] },
    'new hampshire': { abbr: 'NH', lat: 43.7, lon: -71.6, neighbors: ['maine', 'massachusetts', 'vermont'] },
    'new jersey': { abbr: 'NJ', lat: 40.2, lon: -74.6, neighbors: ['new york', 'pennsylvania', 'delaware'] },
    'new mexico': { abbr: 'NM', lat: 34.4, lon: -106.1, neighbors: ['colorado', 'oklahoma', 'texas', 'arizona'] },
    'new york': { abbr: 'NY', lat: 43.0, lon: -75.5, neighbors: ['pennsylvania', 'new jersey', 'connecticut', 'massachusetts', 'vermont'] },
    'north carolina': { abbr: 'NC', lat: 35.6, lon: -79.4, neighbors: ['virginia', 'tennessee', 'georgia', 'south carolina'] },
    'north dakota': { abbr: 'ND', lat: 47.5, lon: -100.3, neighbors: ['minnesota', 'south dakota', 'montana'] },
    ohio: { abbr: 'OH', lat: 40.3, lon: -82.8, neighbors: ['michigan', 'pennsylvania', 'west virginia', 'kentucky', 'indiana'] },
    oklahoma: { abbr: 'OK', lat: 35.6, lon: -97.5, neighbors: ['kansas', 'missouri', 'arkansas', 'texas', 'new mexico', 'colorado'] },
    oregon: { abbr: 'OR', lat: 43.9, lon: -120.6, neighbors: ['washington', 'idaho', 'nevada', 'california'] },
    pennsylvania: { abbr: 'PA', lat: 40.9, lon: -77.8, neighbors: ['new york', 'new jersey', 'delaware', 'maryland', 'west virginia', 'ohio'] },
    'rhode island': { abbr: 'RI', lat: 41.7, lon: -71.5, neighbors: ['connecticut', 'massachusetts'] },
    'south carolina': { abbr: 'SC', lat: 33.9, lon: -80.9, neighbors: ['north carolina', 'georgia'] },
    'south dakota': { abbr: 'SD', lat: 44.4, lon: -100.2, neighbors: ['north dakota', 'minnesota', 'iowa', 'nebraska', 'wyoming', 'montana'] },
    tennessee: { abbr: 'TN', lat: 35.9, lon: -86.3, neighbors: ['kentucky', 'virginia', 'north carolina', 'georgia', 'alabama', 'mississippi', 'arkansas', 'missouri'] },
    texas: { abbr: 'TX', lat: 31.5, lon: -99.3, neighbors: ['new mexico', 'oklahoma', 'arkansas', 'louisiana'] },
    utah: { abbr: 'UT', lat: 39.3, lon: -111.7, neighbors: ['idaho', 'wyoming', 'colorado', 'new mexico', 'arizona', 'nevada'] },
    vermont: { abbr: 'VT', lat: 44.1, lon: -72.7, neighbors: ['new york', 'new hampshire', 'massachusetts'] },
    virginia: { abbr: 'VA', lat: 37.5, lon: -78.6, neighbors: ['maryland', 'west virginia', 'kentucky', 'tennessee', 'north carolina'] },
    washington: { abbr: 'WA', lat: 47.4, lon: -120.5, neighbors: ['oregon', 'idaho'] },
    'west virginia': { abbr: 'WV', lat: 38.6, lon: -80.6, neighbors: ['pennsylvania', 'maryland', 'virginia', 'kentucky', 'ohio'] },
    wisconsin: { abbr: 'WI', lat: 44.3, lon: -89.8, neighbors: ['minnesota', 'iowa', 'illinois', 'michigan'] },
    wyoming: { abbr: 'WY', lat: 43.0, lon: -107.6, neighbors: ['montana', 'south dakota', 'nebraska', 'colorado', 'utah', 'idaho'] },
    'district of columbia': { abbr: 'DC', lat: 38.9, lon: -77.0, neighbors: ['maryland', 'virginia'] },
  };

  const US_ABBR_FIPS = {
    AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09', DE: '10', DC: '11',
    FL: '12', GA: '13', HI: '15', ID: '16', IL: '17', IN: '18', IA: '19', KS: '20', KY: '21',
    LA: '22', ME: '23', MD: '24', MA: '25', MI: '26', MN: '27', MS: '28', MO: '29', MT: '30',
    NE: '31', NV: '32', NH: '33', NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38', OH: '39',
    OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46', TN: '47', TX: '48', UT: '49',
    VT: '50', VA: '51', WA: '53', WV: '54', WI: '55', WY: '56', PR: '72',
  };

  function hash01(str) {
    let h = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return (Math.abs(h) % 10000) / 10000;
  }

  function normName(s) {
    return String(s || '')
      .trim()
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/\s+/g, ' ');
  }

  function lookupState(name) {
    const n = normName(name);
    if (US_STATES[n]) return { key: n, ...US_STATES[n] };
    const byAbbr = Object.entries(US_STATES).find(([, v]) => v.abbr.toLowerCase() === n);
    if (byAbbr) return { key: byAbbr[0], ...byAbbr[1] };
    return null;
  }

  function milesBetween(lat1, lon1, lat2, lon2) {
    const r = 3958.8;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dLat = p2 - p1;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
    return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  function nearbyRegion(stateName, lat, lon, radiusMiles = 400) {
    const home = lookupState(stateName);
    const out = [];
    const seen = new Set();
    function add(key, meta, reason) {
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ key, name: titleCase(key), ...meta, reason });
    }
    if (home) {
      add(home.key, home, 'home');
      home.neighbors.forEach(n => {
        const st = US_STATES[n];
        if (st) add(n, st, 'neighbor');
      });
    }
    Object.entries(US_STATES).forEach(([key, st]) => {
      const d = milesBetween(lat, lon, st.lat, st.lon);
      if (d <= radiusMiles) add(key, st, d < 1 ? 'home' : 'radius');
    });
    if (!out.length) {
      out.push({
        key: 'home',
        name: stateName || 'Region',
        lat,
        lon,
        abbr: '',
        neighbors: [],
        reason: 'home',
      });
    }
    return out;
  }

  function inferCountryCode(country, state) {
    const n = normName(country);
    if (lookupState(state) || /united states|^usa$|^u\.s\.a?$/.test(n)) return 'us';
    if (/puerto rico/.test(n) || /puerto rico/.test(normName(state))) return 'pr';
    if (/^england$|united kingdom|^uk$|^britain$|great britain/.test(n)) return 'gb';
    if (n === 'uganda') return 'ug';
    if (/democratic republic of the congo|^drc$|congo-kinshasa|zaire/.test(n)) return 'cd';
    if (/republic of the congo|congo-brazzaville/.test(n)) return 'cg';
    if (n === 'congo' || /congo/.test(n)) return 'cd';
    if (/south africa/.test(n)) return 'za';
    if (n === 'nigeria') return 'ng';
    if (n === 'namibia') return 'na';
    if (n === 'canada') return 'ca';
    return '';
  }

  function titleCase(s) {
    return String(s || '')
      .split(' ')
      .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');
  }

  function inferContinent(countryCode, fallback) {
    const cc = String(countryCode || '').toLowerCase();
    return CC_CONTINENT[cc] || fallback || 'North America';
  }

  function inferTimezoneHours(lon) {
    if (!Number.isFinite(lon)) return 0;
    return Math.round(lon / 15);
  }

  function organicRing(seed, rx, rz, segments = 36) {
    const pts = [];
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const n = 0.68 + 0.32 * (0.55 + 0.45 * Math.sin(t * 3 + hash01(seed) * 6) * 0.5 + 0.5 * hash01(`${seed}-${i}`));
      pts.push([Math.cos(t) * rx * n, Math.sin(t) * rz * n]);
    }
    return pts;
  }

  function project(lon, lat, originLon, originLat, scale) {
    const s = scale || 1;
    return {
      x: (lon - originLon) * s,
      z: (originLat - lat) * s,
    };
  }

  async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function namesMatch(a, b) {
    const x = normName(a);
    const y = normName(b);
    if (!x || !y) return false;
    return x === y || x.includes(y) || y.includes(x);
  }

  async function geocodeViaOpenMeteo(city, state, country) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`;
    const data = await fetchJson(url);
    const results = Array.isArray(data?.results) ? data.results : [];
    if (!results.length) return null;
    const ranked = results
      .map(r => {
        let score = 0;
        if (namesMatch(r.name, city)) score += 3;
        if (namesMatch(r.admin1, state)) score += 4;
        if (namesMatch(r.country, country)) score += 2;
        if (String(r.country_code || '').toLowerCase() === 'us' && /united states|usa|u\.s\.a?/.test(normName(country))) {
          score += 2;
        }
        return { r, score };
      })
      .sort((a, b) => b.score - a.score);
    const best = ranked[0].r;
    if (!Number.isFinite(best.latitude) || !Number.isFinite(best.longitude)) return null;
    return {
      lat: best.latitude,
      lon: best.longitude,
      city: best.name || city,
      state: best.admin1 || state,
      country: best.country || country,
      countryCode: String(best.country_code || '').toLowerCase(),
      boundingbox: null,
      source: 'open-meteo',
      timezone: best.timezone || '',
    };
  }

  function profileFromFields(fields, hit) {
    const city = String(fields.city || '').trim();
    const county = String(fields.county || '').trim();
    const state = String(fields.state || '').trim();
    const country = String(fields.country || '').trim();
    const us = lookupState(state) || lookupState(county);
    const lat = Number.isFinite(hit?.lat) ? hit.lat : us?.lat || 0;
    const lon = Number.isFinite(hit?.lon) ? hit.lon : us?.lon || 0;
    const countryCode = hit?.countryCode || inferCountryCode(country, state || county) || (us ? 'us' : '');
    return {
      name: String(fields.personName || fields.name || '').trim(),
      gender: fields.gender === 'woman' ? 'woman' : 'man',
      married: fields.married === 'yes',
      spouseName: fields.married === 'yes' ? String(fields.spouseName || '').trim() : '',
      city,
      county,
      state,
      country,
      continent: fields.continent || inferContinent(countryCode, 'North America'),
      countryCode,
      lat,
      lon,
      tzOffsetHours: inferTimezoneHours(lon),
      geocoded: Boolean(hit && Number.isFinite(hit.lat)),
      boundingbox: hit?.boundingbox || null,
      source: hit?.source || (us ? 'state-centroid' : 'typed'),
    };
  }

  async function geocodeProfile(fields) {
    const city = String(fields.city || '').trim();
    const county = String(fields.county || '').trim();
    const state = String(fields.state || '').trim();
    const country = String(fields.country || '').trim();
    const q = [city, county, state, country].filter(Boolean).join(', ');
    let hit = null;
    try {
      hit = await geocodeViaWorker(q);
    } catch { /* local static server has no Worker */ }
    if (!hit) {
      try {
        hit = await geocodeViaOpenMeteo(city, state || county, country);
      } catch { /* ignore */ }
    }
    if (!hit) {
      try {
        hit = await geocodeViaPhoton(q);
      } catch { /* ignore */ }
    }
    return profileFromFields(fields, hit);
  }

  async function geocodeViaWorker(q) {
    const data = await fetchJson(`/api/geocode?q=${encodeURIComponent(q)}`);
    if (!data?.found || !Number.isFinite(data.lat)) return null;
    return {
      lat: data.lat,
      lon: data.lon,
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      countryCode: data.countryCode || '',
      boundingbox: data.boundingbox || null,
      source: 'nominatim',
    };
  }

  async function geocodeViaPhoton(q) {
    const data = await fetchJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`);
    const feat = data?.features?.[0];
    if (!feat) return null;
    const [lon, lat] = feat.geometry?.coordinates || [];
    const p = feat.properties || {};
    return {
      lat: Number(lat),
      lon: Number(lon),
      city: p.city || p.name || '',
      state: p.state || p.county || '',
      country: p.country || '',
      countryCode: String(p.countrycode || '').toLowerCase(),
      boundingbox: null,
      source: 'photon',
    };
  }

  const COUNTY_FIRST = new Set([
    'gb', 'uk', 'ie', 'mt', 'lu', 'is', 'ee', 'lv', 'lt', 'si', 'cy',
    'al', 'mk', 'me', 'ad', 'mc', 'sm', 'va', 'li', 'sg', 'mv',
  ]);
  const CITY_STATES = new Set(['sg', 'mc', 'va', 'sm', 'li', 'hk', 'mo']);
  const SKIP_ADMIN = new Set([
    'city', 'town', 'village', 'hamlet', 'suburb', 'neighbourhood', 'neighborhood',
    'road', 'house', 'postcode', 'quarter', 'residential', 'city_district',
    'isolated_dwelling', 'retail', 'industrial',
  ]);
  const GB_NATIONS = new Set(['england', 'scotland', 'wales', 'northern ireland']);

  function hasAreaGeom(gj) {
    return gj && (gj.type === 'Polygon' || gj.type === 'MultiPolygon');
  }

  function adminKind(hit) {
    const t = String(hit?.addresstype || hit?.type || '').toLowerCase();
    const addr = hit?.address || {};
    if (t === 'parish' || addr.parish) return 'parish';
    if (t === 'county' || addr.county) return 'county';
    if (t === 'state' || addr.state) return 'state';
    if (t === 'province' || addr.province) return 'province';
    if (t === 'region' || addr.region) return 'region';
    if (t === 'municipality' || addr.municipality) return 'municipality';
    if (t === 'district' || addr.district || t === 'state_district') return 'district';
    if (t === 'country') return 'country';
    return t || 'region';
  }

  function adminName(hit, kind) {
    const addr = hit?.address || {};
    if (kind === 'parish') return addr.parish || hit.name || '';
    if (kind === 'county') return addr.county || hit.name || '';
    if (kind === 'province') return addr.province || hit.name || '';
    if (kind === 'region') return addr.region || addr.state || hit.name || '';
    if (kind === 'municipality') return addr.municipality || hit.name || '';
    if (kind === 'district') return addr.county || addr.state_district || hit.name || '';
    return addr.state || addr.province || addr.region || addr.county || hit.name || '';
  }

  function tooFineAdmin(hit) {
    const rank = Number(hit?.place_rank) || 0;
    if (rank > 16) return true;
    const t = String(hit?.addresstype || '').toLowerCase();
    if (hit?.class === 'boundary' && rank <= 16) return false;
    return SKIP_ADMIN.has(t);
  }

  function tooCoarseAdmin(hit, cc, typedState) {
    const t = String(hit?.addresstype || '').toLowerCase();
    const name = hit?.name || '';
    if (t === 'country' && !CITY_STATES.has(cc)) return true;
    if ((cc === 'gb' || cc === 'uk') && GB_NATIONS.has(normName(name)) && !namesMatch(name, typedState)) {
      return true;
    }
    if (cc === 'ie' && t === 'state_district') return true;
    return false;
  }

  function scoreAdminHit(hit, cc, typedState) {
    if (!hasAreaGeom(hit?.geojson)) return -100;
    if (tooFineAdmin(hit)) return -20;
    if (tooCoarseAdmin(hit, cc, typedState)) return -15;
    const kind = adminKind(hit);
    let score = 1;
    if (['state', 'province', 'region', 'county', 'parish'].includes(kind)) score += 6;
    if (kind === 'municipality' && COUNTY_FIRST.has(cc)) score += 4;
    if (namesMatch(hit.name, typedState) || namesMatch(adminName(hit, kind), typedState)) score += 5;
    return score;
  }

  function normalizeBoundary(hit, source) {
    const kind = adminKind(hit);
    return {
      name: adminName(hit, kind) || hit?.name || '',
      kind,
      geojson: hit.geojson,
      source,
    };
  }

  async function nominatimProxy(params) {
    const qs = new URLSearchParams(params);
    return fetchJson(`/api/nominatim?${qs.toString()}`);
  }

  async function searchAdminHits(q, extra) {
    const params = { mode: 'search', polygon: '1', ...(extra || {}) };
    if (q) params.q = q;
    const data = await nominatimProxy(params);
    return Array.isArray(data) ? data : [];
  }

  async function reverseAdmin(lat, lon, zoom) {
    const data = await nominatimProxy({
      mode: 'reverse',
      lat: String(lat),
      lon: String(lon),
      zoom: String(zoom),
      polygon: '1',
    });
    return data && data.geojson ? data : null;
  }

  function pickAdminHit(hits, cc, typedState) {
    let best = null;
    let bestScore = 0;
    (hits || []).forEach(hit => {
      const s = scoreAdminHit(hit, cc, typedState);
      if (s > bestScore) {
        bestScore = s;
        best = hit;
      }
    });
    return best;
  }

  function pointInRing(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function pointInGeometry(gj, lon, lat) {
    if (!hasAreaGeom(gj)) return false;
    const polys = gj.type === 'Polygon' ? [gj.coordinates] : gj.coordinates;
    return polys.some(poly => {
      if (!poly?.[0] || !pointInRing(lon, lat, poly[0])) return false;
      for (let r = 1; r < poly.length; r++) {
        if (pointInRing(lon, lat, poly[r])) return false;
      }
      return true;
    });
  }

  async function usStatesFallback(state, lat, lon) {
    const data = await fetchJson('experimental/geo/us-states.json');
    const features = Array.isArray(data?.features) ? data.features : [];
    const meta = lookupState(state);
    const want = meta?.key || normName(state);
    let feat = features.find(f => normName(f.properties?.name) === want);
    if (!feat && Number.isFinite(lat) && Number.isFinite(lon)) {
      feat = features.find(f => pointInGeometry(f.geometry, lon, lat));
    }
    if (!feat?.geometry) return null;
    return {
      name: feat.properties?.name || titleCase(want),
      kind: 'state',
      geojson: feat.geometry,
      source: 'us-states',
    };
  }

  let adminPacks = {};

  async function loadAdminPack(cc) {
    const code = String(cc || '').toLowerCase();
    if (!code) return null;
    if (Object.prototype.hasOwnProperty.call(adminPacks, code)) return adminPacks[code];
    try {
      adminPacks[code] = await fetchJson(`experimental/geo/admin/${code}.json`);
    } catch {
      adminPacks[code] = null;
    }
    return adminPacks[code];
  }

  function matchAdminFeature(pack, state, lat, lon) {
    const feats = pack?.features || [];
    if (!feats.length) return null;
    let feat = feats.find(f => namesMatch(f.properties?.name, state));
    if (!feat && Number.isFinite(lat) && Number.isFinite(lon)) {
      feat = feats.find(f => pointInGeometry(f.geometry, lon, lat));
    }
    return feat || null;
  }

  async function localAdminBoundary(profile) {
    const units = [profile?.state, profile?.county].map(s => String(s || '').trim()).filter(Boolean);
    const country = String(profile?.country || '').trim();
    const first = units[0] || '';
    const cc = String(profile?.countryCode || inferCountryCode(country, first) || (lookupState(first) ? 'us' : '')).toLowerCase();
    const pack = await loadAdminPack(cc);
    for (const unit of units) {
      const feat = matchAdminFeature(pack, unit, Number(profile?.lat), Number(profile?.lon));
      if (feat?.geometry) {
        return {
          name: feat.properties?.name || unit,
          kind: feat.properties?.kind || pack.kind || 'region',
          geojson: feat.geometry,
          source: 'local-admin',
        };
      }
    }
    return null;
  }

  async function fetchAdminBoundary(profile) {
    if (!profile) return null;
    const state = String(profile.state || '').trim();
    const county = String(profile.county || '').trim();
    const country = String(profile.country || '').trim();
    const unit = state || county;
    const cc = String(profile.countryCode || inferCountryCode(country, unit) || (lookupState(unit) ? 'us' : '')).toLowerCase();
    const lat = Number(profile.lat);
    const lon = Number(profile.lon);

    try {
      const local = await localAdminBoundary(profile);
      if (local) return local;
    } catch { /* missing country file is fine */ }

    const queries = [];
    [county, state].filter(Boolean).forEach(part => {
      if (country) queries.push(`${part}, ${country}`);
      else queries.push(part);
    });
    if (state && country && !/county|parish|canton|province|region|oblast|prefecture/i.test(state)) {
      queries.push(`County ${state}, ${country}`);
      queries.push(`${state} Parish, ${country}`);
    }

    for (const q of queries.slice(0, 2)) {
      try {
        const hit = pickAdminHit(await searchAdminHits(q), cc, unit);
        if (hit) return normalizeBoundary(hit, 'nominatim-search');
      } catch { /* local proxy or worker may be down */ }
    }

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const zoom = COUNTY_FIRST.has(cc) ? 9 : 5;
      try {
        let hit = await reverseAdmin(lat, lon, zoom);
        if (hit && tooCoarseAdmin(hit, cc, unit)) {
          hit = await reverseAdmin(lat, lon, 9);
        }
        if (hit && tooFineAdmin(hit)) {
          hit = await reverseAdmin(lat, lon, COUNTY_FIRST.has(cc) ? 9 : 5);
        }
        if (hit && hasAreaGeom(hit.geojson) && !tooFineAdmin(hit) && !tooCoarseAdmin(hit, cc, unit)) {
          return normalizeBoundary(hit, 'nominatim-reverse');
        }
      } catch { /* ignore */ }
    }

    if (cc === 'us' || lookupState(state) || lookupState(county)) {
      try {
        return await usStatesFallback(state || county, lat, lon);
      } catch { /* ignore */ }
    }
    return null;
  }

  let worldCountries = null;
  let worldStates = null;
  let usCounties = null;

  async function loadWorldCountries() {
    if (worldCountries) return worldCountries;
    try {
      worldCountries = await fetchJson('experimental/geo/world-countries.json');
    } catch {
      worldCountries = { type: 'FeatureCollection', features: [] };
    }
    return worldCountries;
  }

  async function loadWorldStates() {
    if (worldStates) return worldStates;
    try {
      worldStates = await fetchJson('experimental/geo/world-states.json');
    } catch {
      worldStates = { type: 'FeatureCollection', features: [] };
    }
    return worldStates;
  }

  async function loadUsCounties() {
    if (usCounties) return usCounties;
    try {
      usCounties = await fetchJson('experimental/geo/us-counties.json');
    } catch {
      usCounties = { type: 'FeatureCollection', features: [] };
    }
    return usCounties;
  }

  function wrapBound(name, kind, geojson, source) {
    if (!hasAreaGeom(geojson)) return null;
    return { name: name || '', kind: kind || 'region', geojson, source };
  }

  function bboxPolygon(bb) {
    if (!bb || bb.length < 4) return null;
    const south = Number(bb[0]);
    const north = Number(bb[1]);
    const west = Number(bb[2]);
    const east = Number(bb[3]);
    if (![south, north, west, east].every(Number.isFinite)) return null;
    if (north - south < 0.002 && east - west < 0.002) return null;
    return {
      type: 'Polygon',
      coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
    };
  }

  function countryFeature(world, cc, countryName) {
    const feats = world?.features || [];
    const code = String(cc || '').toLowerCase();
    let feat = feats.find(f => f.properties?.iso2 === code);
    if (!feat && countryName) feat = feats.find(f => namesMatch(f.properties?.name, countryName));
    return feat || null;
  }

  function isoFromCountryName(world, country) {
    const feat = countryFeature(world, '', country);
    return feat?.properties?.iso2 || '';
  }

  function matchWorldState(worldAdm, cc, state, lat, lon) {
    const feats = worldAdm?.features || [];
    if (!feats.length) return null;
    const code = String(cc || '').toLowerCase();
    const pool = code ? feats.filter(f => f.properties?.iso2 === code) : feats;
    const postal = String(state || '').trim().toUpperCase();
    let feat = pool.find(f => namesMatch(f.properties?.name, state) || (postal && f.properties?.postal === postal));
    if (!feat && Number.isFinite(lat) && Number.isFinite(lon)) {
      feat = pool.find(f => pointInGeometry(f.geometry, lon, lat));
    }
    if (!feat && state) feat = feats.find(f => namesMatch(f.properties?.name, state));
    return feat || null;
  }

  function matchUsCounty(counties, profile, lat, lon) {
    const feats = counties?.features || [];
    if (!feats.length) return null;
    const want = String(profile?.county || profile?.city || '').replace(/\s+county$/i, '').trim();
    const st = lookupState(profile?.state);
    const fips = st?.abbr ? US_ABBR_FIPS[st.abbr] : '';
    let pool = feats;
    if (fips) pool = feats.filter(f => f.properties?.statefp === fips);
    let candidates = want ? pool.filter(f => namesMatch(f.properties?.name, want)) : [];
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const hit = (candidates.length ? candidates : pool).find(f => pointInGeometry(f.geometry, lon, lat));
      if (hit) return wrapBound(hit.properties.name, 'county', hit.geometry, 'us-counties');
    }
    if (candidates.length === 1) {
      const hit = candidates[0];
      return wrapBound(hit.properties.name, 'county', hit.geometry, 'us-counties');
    }
    return null;
  }

  function pickCityHit(hits) {
    const want = new Set(['city', 'town', 'municipality', 'suburb', 'city_district', 'administrative', 'county']);
    return (hits || []).find(h => {
      if (!hasAreaGeom(h?.geojson)) return false;
      const t = String(h.addresstype || h.type || '').toLowerCase();
      const rank = Number(h.place_rank) || 0;
      if (want.has(t) && t !== 'country' && t !== 'state') return true;
      return rank >= 12 && rank <= 18 && t !== 'country' && t !== 'state';
    }) || null;
  }

  async function searchCityPolygon(profile, stateName) {
    const city = String(profile?.city || '').trim();
    const country = String(profile?.country || '').trim();
    if (!city) return null;
    const attempts = [
      (() => {
        const extra = { city, country };
        if (stateName) extra.state = stateName;
        if (profile?.county) extra.county = String(profile.county);
        return extra;
      })(),
      { q: [city, stateName, country].filter(Boolean).join(', ') },
      { q: [city, country].filter(Boolean).join(', ') },
      { q: `${city} City, ${[stateName, country].filter(Boolean).join(', ')}` },
    ];
    for (const extra of attempts) {
      try {
        const hits = extra.q ? await searchAdminHits(extra.q) : await searchAdminHits('', extra);
        const hit = pickCityHit(hits);
        if (hit) return wrapBound(hit.name || city, 'city', hit.geojson, 'nominatim-city');
      } catch { /* keep trying */ }
    }
    return null;
  }

  async function searchCountyPolygon(profile, cc, stateName) {
    const county = String(profile?.county || '').trim();
    const country = String(profile?.country || '').trim();
    const city = String(profile?.city || '').trim();
    const queries = [];
    if (county) {
      queries.push(`${county} County, ${stateName || ''}, ${country}`.replace(/, ,/g, ','));
      queries.push(`${county} Parish, ${stateName || ''}, ${country}`.replace(/, ,/g, ','));
      queries.push(`${county}, ${stateName || ''}, ${country}`.replace(/, ,/g, ','));
    }
    if (city && (!county || namesMatch(county, city))) {
      queries.push(`${city} City, ${stateName || ''}, ${country}`.replace(/, ,/g, ','));
    }
    for (const q of queries) {
      try {
        const hit = pickAdminHit(await searchAdminHits(q), cc, county || city);
        if (hit) return normalizeBoundary(hit, 'nominatim-search');
        const cityHit = pickCityHit(await searchAdminHits(q));
        if (cityHit) return wrapBound(cityHit.name || county || city, 'county', cityHit.geojson, 'nominatim-search');
      } catch { /* keep trying */ }
    }
    return null;
  }

  function wrapStateFeat(feat, pack) {
    if (!feat?.geometry) return null;
    return wrapBound(
      feat.properties?.name,
      feat.properties?.kind || pack?.kind || 'state',
      feat.geometry,
      pack ? 'local-admin' : 'world-states',
    );
  }

  async function fetchPlaceStack(profile, onPartial) {
    if (!profile) return null;
    let lat = Number(profile.lat);
    let lon = Number(profile.lon);
    const country = String(profile.country || '').trim();
    const city = String(profile.city || '').trim();
    let cc = String(profile.countryCode || inferCountryCode(country, profile.state) || '').toLowerCase();
    let bbox = profile.boundingbox || null;
    const usCountiesPromise = cc === 'us' || lookupState(profile.state) ? loadUsCounties() : Promise.resolve(null);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0 && city)) {
      try {
        const q = [city, profile.county, profile.state, country].filter(Boolean).join(', ');
        const hit = await geocodeViaWorker(q);
        if (hit && Number.isFinite(hit.lat)) {
          lat = hit.lat;
          lon = hit.lon;
          if (hit.countryCode) cc = String(hit.countryCode).toLowerCase();
          if (hit.boundingbox) bbox = hit.boundingbox;
        }
      } catch { /* ignore */ }
    }

    const [world, worldAdm] = await Promise.all([loadWorldCountries(), loadWorldStates()]);
    const countryFeat = countryFeature(world, cc, country);
    if (!cc && countryFeat) cc = countryFeat.properties.iso2;
    if (!cc) cc = isoFromCountryName(world, country);

    const pack = await loadAdminPack(cc);
    let stateFeat = matchAdminFeature(pack, profile.state, lat, lon);
    if (!stateFeat) stateFeat = matchWorldState(worldAdm, cc, profile.state, lat, lon);
    if (!stateFeat) stateFeat = matchAdminFeature(pack, profile.county, lat, lon);

    const stack = {
      lat,
      lon,
      cc,
      continent: profile.continent || countryFeat?.properties?.continent || inferContinent(cc, 'North America'),
      city: null,
      county: null,
      state: wrapStateFeat(stateFeat, pack && stateFeat && (pack.features || []).includes(stateFeat) ? pack : null),
      country: countryFeat
        ? wrapBound(countryFeat.properties.name, 'country', countryFeat.geometry, 'world-countries')
        : null,
      world,
    };
    if (!stack.state && stack.country && CITY_STATES.has(cc)) {
      stack.state = { ...stack.country, kind: 'state' };
    }
    if (typeof onPartial === 'function') onPartial(stack);

    let countyBound = null;
    try {
      const packed = await usCountiesPromise;
      if (packed) countyBound = matchUsCounty(packed, profile, lat, lon);
    } catch { /* ignore */ }

    const [cityBound, countyRev, cityRev] = await Promise.all([
      searchCityPolygon(profile, stateFeat?.properties?.name || profile.state),
      Number.isFinite(lat) && Number.isFinite(lon) ? reverseAdmin(lat, lon, 10).catch(() => null) : Promise.resolve(null),
      Number.isFinite(lat) && Number.isFinite(lon) ? reverseAdmin(lat, lon, 12).catch(() => null) : Promise.resolve(null),
    ]);

    if (!countyBound && countyRev && hasAreaGeom(countyRev.geojson) && !tooCoarseAdmin(countyRev, cc, profile.state)) {
      const t = String(countyRev.addresstype || '').toLowerCase();
      if (!['country', 'state', 'province'].includes(t) || COUNTY_FIRST.has(cc)) {
        countyBound = normalizeBoundary(countyRev, 'nominatim-reverse');
      }
    }
    if (!countyBound) {
      try {
        countyBound = await searchCountyPolygon(profile, cc, stateFeat?.properties?.name || profile.state);
      } catch { /* ignore */ }
    }

    let cityLayer = cityBound;
    if (!cityLayer && cityRev && hasAreaGeom(cityRev.geojson) && !tooCoarseAdmin(cityRev, cc, profile.state)) {
      const t = String(cityRev.addresstype || '').toLowerCase();
      if (!['country', 'state', 'province'].includes(t)) {
        cityLayer = wrapBound(cityRev.name || city, 'city', cityRev.geojson, 'nominatim-reverse');
      }
    }
    if (!cityLayer && bbox) cityLayer = wrapBound(city || 'City', 'city', bboxPolygon(bbox), 'geocode-bbox');
    if (!countyBound && cityLayer) countyBound = { ...cityLayer, kind: cityLayer.kind || 'municipality' };
    if (!cityLayer && countyBound) cityLayer = { ...countyBound, kind: 'city' };

    stack.city = cityLayer;
    stack.county = countyBound;
    return stack;
  }

  window.ExperimentalGeo = {
    SETS,
    CASE_LOAD,
    US_STATES,
    hash01,
    lookupState,
    nearbyRegion,
    titleCase,
    inferContinent,
    inferCountryCode,
    inferTimezoneHours,
    organicRing,
    project,
    geocodeProfile,
    profileFromFields,
    milesBetween,
    fetchAdminBoundary,
    fetchPlaceStack,
    pointInGeometry,
  };
})();
