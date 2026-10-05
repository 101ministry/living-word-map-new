#!/usr/bin/env node
/**
 * Create and inspect tracking short links on map.repentance101.com/go/{slug}
 * (stored in EXPERIMENTAL_KV). No Rebrandly website required.
 *
 *   node scripts/short-link.mjs create --slug camp --url "https://example.com" [--title "..."]
 *     [--source ig] [--medium social] [--campaign rr2026] [--content bio] [--term ...]
 *   node scripts/short-link.mjs list
 *   node scripts/short-link.mjs stats --slug camp
 *   node scripts/short-link.mjs dest --slug camp --url "https://new.example.com"
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const INDEX_KEY = 'short:index';
const LINK_PREFIX = 'short:link:';
const PUBLIC_ORIGIN = 'https://map.repentance101.com';

function usage(code = 1) {
  console.error(`Usage:
  node scripts/short-link.mjs create --slug SLUG --url https://... [--title TEXT]
      [--source S] [--medium M] [--campaign C] [--content X] [--term T]
  node scripts/short-link.mjs list
  node scripts/short-link.mjs stats --slug SLUG
  node scripts/short-link.mjs dest --slug SLUG --url https://...`);
  process.exit(code);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      out[key] = val;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function wranglerKv(args) {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(cmd, ['wrangler', 'kv', 'key', ...args, '--binding', 'EXPERIMENTAL_KV'], {
    encoding: 'utf8',
    cwd: join(import.meta.dirname, '..'),
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `wrangler exited ${result.status}`).trim());
  }
  return (result.stdout || '').trim();
}

function kvGet(key) {
  const out = wranglerKv(['get', key]);
  if (!out || out === 'null' || /Value not found/i.test(out)) return null;
  try {
    return JSON.parse(out);
  } catch {
    return out;
  }
}

function kvPut(key, value) {
  const dir = mkdtempSync(join(tmpdir(), 'lwm-short-'));
  const file = join(dir, 'value.json');
  try {
    writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
    wranglerKv(['put', key, '--path', file]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function assertSlug(slug) {
  if (!slug || !/^[a-z0-9][a-z0-9-]{0,62}$/i.test(slug)) {
    throw new Error('Slug must be 1–63 chars: letters, numbers, hyphens (start with a letter or number).');
  }
  return slug.toLowerCase();
}

function assertHttpsUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new Error('Destination must be a full URL (https://...).');
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new Error('Destination must be http(s).');
  }
  return u.toString();
}

function shortUrl(slug) {
  return `${PUBLIC_ORIGIN}/go/${slug}`;
}

function printLink(link) {
  const slug = link.slug;
  console.log(shortUrl(slug));
  console.log(`  dest:    ${link.dest}`);
  if (link.title) console.log(`  title:   ${link.title}`);
  if (link.utm && Object.values(link.utm).some(Boolean)) {
    console.log(`  utm:     ${JSON.stringify(link.utm)}`);
  }
  console.log(`  clicks:  ${Number(link.clicks) || 0}`);
  if (link.lastClickAt) console.log(`  last:    ${link.lastClickAt}`);
  if (link.createdAt) console.log(`  created: ${link.createdAt}`);
}

async function cmdCreate(args) {
  const slug = assertSlug(args.slug);
  const dest = assertHttpsUrl(args.url);
  const existing = kvGet(`${LINK_PREFIX}${slug}`);
  if (existing && typeof existing === 'object' && existing.dest && !args.force) {
    throw new Error(`Slug "${slug}" already exists (${shortUrl(slug)}). Pass --force to replace (resets click count).`);
  }
  const utm = {
    source: args.source || '',
    medium: args.medium || '',
    campaign: args.campaign || '',
    content: args.content || '',
    term: args.term || '',
  };
  const link = {
    slug,
    dest,
    title: args.title ? String(args.title) : '',
    utm,
    createdAt: existing?.createdAt || new Date().toISOString(),
    clicks: args.force ? 0 : Number(existing?.clicks) || 0,
    lastClickAt: args.force ? '' : existing?.lastClickAt || '',
    recent: args.force ? [] : Array.isArray(existing?.recent) ? existing.recent : [],
  };
  kvPut(`${LINK_PREFIX}${slug}`, link);
  const indexRaw = kvGet(INDEX_KEY);
  const index = Array.isArray(indexRaw) ? indexRaw : [];
  if (!index.includes(slug)) {
    index.push(slug);
    index.sort();
    kvPut(INDEX_KEY, index);
  }
  printLink(link);
}

function cmdList() {
  const index = kvGet(INDEX_KEY);
  const slugs = Array.isArray(index) ? index : [];
  if (!slugs.length) {
    console.log('No short links yet.');
    return;
  }
  for (const slug of slugs) {
    const link = kvGet(`${LINK_PREFIX}${slug}`);
    if (!link || typeof link !== 'object') {
      console.log(`${shortUrl(slug)}  (missing record)`);
      continue;
    }
    const clicks = Number(link.clicks) || 0;
    const title = link.title ? `  ${link.title}` : '';
    console.log(`${shortUrl(slug)}  ${clicks} clicks${title}`);
  }
}

function cmdStats(args) {
  const slug = assertSlug(args.slug);
  const link = kvGet(`${LINK_PREFIX}${slug}`);
  if (!link || typeof link !== 'object' || !link.dest) {
    throw new Error(`No short link named "${slug}".`);
  }
  printLink(link);
  const recent = Array.isArray(link.recent) ? link.recent : [];
  if (!recent.length) return;
  console.log('  recent clicks:');
  for (const row of recent.slice(-20)) {
    const where = [row.country, row.region, row.city].filter(Boolean).join('/');
    const ref = row.referrer ? ` ref=${row.referrer}` : '';
    console.log(`    ${row.t}  ${where || '—'}${ref}`);
  }
}

function cmdDest(args) {
  const slug = assertSlug(args.slug);
  const dest = assertHttpsUrl(args.url);
  const link = kvGet(`${LINK_PREFIX}${slug}`);
  if (!link || typeof link !== 'object' || !link.dest) {
    throw new Error(`No short link named "${slug}". Create it first.`);
  }
  link.dest = dest;
  kvPut(`${LINK_PREFIX}${slug}`, link);
  printLink(link);
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
try {
  if (cmd === 'create') {
    if (!args.slug || !args.url) usage();
    await cmdCreate(args);
  } else if (cmd === 'list') {
    cmdList();
  } else if (cmd === 'stats') {
    if (!args.slug) usage();
    cmdStats(args);
  } else if (cmd === 'dest') {
    if (!args.slug || !args.url) usage();
    cmdDest(args);
  } else {
    usage(cmd === 'help' || args.help ? 0 : 1);
  }
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
