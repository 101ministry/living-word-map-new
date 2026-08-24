#!/usr/bin/env node
/** Build ISO 3166-1 alpha-2 country code table for Experimental.
 * Reference requested by product: SUNY International Country Codes
 * https://www.suny.edu/media/suny/content-assets/documents/international-student/InternationalCountryCodes.pdf
 * (That PDF reprints ISO 3166-1 alpha-2 abbreviations.)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const world = JSON.parse(
  fs.readFileSync(path.join(root, 'public/experimental/geo/world-countries.json'), 'utf8'),
);

const regions = world.features
  .map(f => ({
    name: f.properties.name,
    iso2: String(f.properties.iso2 || '').toUpperCase(),
    iso3: String(f.properties.iso3 || '').toUpperCase(),
    continent: f.properties.continent || '',
  }))
  .filter(r => r.iso2)
  .sort((a, b) => a.name.localeCompare(b.name));

const aliases = {
  'united states of america': 'US',
  'united states': 'US',
  usa: 'US',
  'u.s.a': 'US',
  'u.s': 'US',
  america: 'US',
  uk: 'GB',
  'u.k': 'GB',
  'united kingdom': 'GB',
  'great britain': 'GB',
  britain: 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'northern ireland': 'GB',
  russia: 'RU',
  'russian federation': 'RU',
  'south korea': 'KR',
  'korea republic of': 'KR',
  'republic of korea': 'KR',
  'north korea': 'KP',
  "korea democratic people's republic of": 'KP',
  vietnam: 'VN',
  'viet nam': 'VN',
  syria: 'SY',
  'syrian arab republic': 'SY',
  iran: 'IR',
  'iran islamic republic of': 'IR',
  tanzania: 'TZ',
  'united republic of tanzania': 'TZ',
  venezuela: 'VE',
  bolivia: 'BO',
  laos: 'LA',
  moldova: 'MD',
  brunei: 'BN',
  'cape verde': 'CV',
  'ivory coast': 'CI',
  "cote d'ivoire": 'CI',
  'cote divoire': 'CI',
  'czech republic': 'CZ',
  czechia: 'CZ',
  swaziland: 'SZ',
  eswatini: 'SZ',
  'east timor': 'TL',
  'timor-leste': 'TL',
  'timor leste': 'TL',
  macedonia: 'MK',
  'north macedonia': 'MK',
  palestine: 'PS',
  'palestinian territories': 'PS',
  congo: 'CD',
  'congo kinshasa': 'CD',
  drc: 'CD',
  'democratic republic of the congo': 'CD',
  'democratic republic of congo': 'CD',
  'congo brazzaville': 'CG',
  'republic of the congo': 'CG',
  holland: 'NL',
  netherlands: 'NL',
  burma: 'MM',
  myanmar: 'MM',
  'holy see': 'VA',
  vatican: 'VA',
  'vatican city': 'VA',
};

const preferredIso2Name = {
  AU: 'Australia',
  CY: 'Cyprus',
  SO: 'Somalia',
};

const byIso2 = new Map();
for (const r of regions) {
  const prev = byIso2.get(r.iso2);
  if (!prev) {
    byIso2.set(r.iso2, r);
    continue;
  }
  const want = preferredIso2Name[r.iso2];
  if (want && r.name === want) byIso2.set(r.iso2, r);
  else if (want && prev.name === want) continue;
  else if (/islands|territories|somaliland|turkish republic/i.test(prev.name) && !/islands|territories|somaliland|turkish republic/i.test(r.name)) {
    byIso2.set(r.iso2, r);
  }
}
const deduped = [...byIso2.values()].sort((a, b) => a.name.localeCompare(b.name));

const out = {
  source: 'ISO 3166-1 alpha-2 (same abbreviation standard as SUNY International Country Codes)',
  sourceUrl:
    'https://www.suny.edu/media/suny/content-assets/documents/international-student/InternationalCountryCodes.pdf',
  sourceNote:
    'SUNY International Country Codes uses ISO 3166-1 alpha-2 abbreviations. The SUNY PDF was not fetchable here (HTTP 403); this file lists the same alpha-2 codes from Experimental world-countries (Natural Earth).',
  regions: deduped,
  aliases,
};

const dest = path.join(root, 'public/experimental/geo/country-codes.json');
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`Wrote ${deduped.length} countries + ${Object.keys(aliases).length} aliases → ${dest}`);
