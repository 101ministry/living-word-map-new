/**
 * Living Word Map — Cloudflare Worker
 * Serves static assets from public/, Cal.com webhooks at POST /api/cal-booking,
 * Nominatim proxies at GET /api/geocode and GET /api/nominatim.
 */

const WEBHOOK_PATH = '/api/cal-booking';
const GEOCODE_PATH = '/api/geocode';
const NOMINATIM_PATH = '/api/nominatim';
const ACCOUNT_PATH = '/api/experimental-account';
const AUTH_PATH = '/api/experimental-auth';
const PRESENCE_PATH = '/api/experimental-presence';
const FOUND_US_PATH = '/api/found-us';
const HEART_ACCOUNTABILITY_PATH = '/api/experimental-heart-accountability';
const MAP_TILE_PATH = '/api/map-tile';
const FOUND_US_KV_KEY = 'found-us-v1';
const HEART_ACCOUNTABILITY_KV_KEY = 'heart-accountability-v1';
const HEART_ACCOUNTABILITY_MIN = 50;
const HEART_ACCOUNTABILITY_MAX = 1000;
const HEART_ACCOUNTABILITY_EVERY = 10;
const FOUND_US_CHOICES = ['friend', 'church', 'norman', 'camp', 'slack'];
const FOUND_US_LABELS = {
  friend: 'A friend told me',
  church: 'Someone from church',
  norman: 'Norman told me',
  camp: 'I heard about the Discipleship Training Camp',
  slack: 'Invitation to join Slack Messaging',
};
const PRESENCE_KV_KEY = 'presence-v1';
const ALLOWLIST_KV_KEY = 'allowlist-v1';
const INVITES_KV_KEY = 'invites-v1';
const SESSION_KV_PREFIX = 'sess:';
const SESSION_COOKIE = 'lwm_exp_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DOWNLOADS_PREFIX = '/audio/accelerated-discipleship/';
const NOMINATIM_UA = 'LivingWordMap/1.0 (experimental prayer builder; https://map.repentance101.com/)';

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(sendFoundUsWeekly(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === WEBHOOK_PATH || url.pathname === `${WEBHOOK_PATH}/`) {
      if (request.method === 'POST') {
        return handleCalWebhook(request, env, ctx);
      }
      if (request.method === 'GET') {
        return jsonResponse({ ok: true, endpoint: WEBHOOK_PATH, method: 'POST' });
      }
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (url.pathname === GEOCODE_PATH || url.pathname === `${GEOCODE_PATH}/`) {
      if (request.method === 'GET') {
        return handleGeocode(request);
      }
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (url.pathname === NOMINATIM_PATH || url.pathname === `${NOMINATIM_PATH}/`) {
      if (request.method === 'GET') {
        return handleNominatim(request);
      }
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (url.pathname === MAP_TILE_PATH || url.pathname === `${MAP_TILE_PATH}/`) {
      if (request.method === 'GET') {
        return handleMapTile(request);
      }
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (url.pathname === ACCOUNT_PATH || url.pathname === `${ACCOUNT_PATH}/`) {
      if (request.method === 'POST') {
        return handleExperimentalAccount(request, env);
      }
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (url.pathname === AUTH_PATH || url.pathname.startsWith(`${AUTH_PATH}/`)) {
      return handleExperimentalAuth(request, env, url);
    }

    if (url.pathname === PRESENCE_PATH || url.pathname === `${PRESENCE_PATH}/`) {
      if (request.method === 'GET' || request.method === 'POST') {
        return handleExperimentalPresence(request, env);
      }
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (url.pathname === FOUND_US_PATH || url.pathname === `${FOUND_US_PATH}/`) {
      if (request.method === 'POST') {
        return handleFoundUsPost(request, env);
      }
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (
      url.pathname === HEART_ACCOUNTABILITY_PATH ||
      url.pathname === `${HEART_ACCOUNTABILITY_PATH}/`
    ) {
      if (request.method === 'POST') {
        return handleHeartAccountabilityPost(request, env, ctx);
      }
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (url.pathname.startsWith(DOWNLOADS_PREFIX)) {
      return handleDownloadsAudio(request, env);
    }

    const landingRedirect = maybeRepentanceProjectLanding(url);
    if (landingRedirect) return landingRedirect;

    return env.ASSETS.fetch(request);
  },
};

/** Root `/` opens Repentance Project; map and other sections use index.html?site=… */
function maybeRepentanceProjectLanding(url) {
  const path = url.pathname;
  if (path !== '/' && path !== '') return null;
  if (url.searchParams.has('site') || url.searchParams.has('view') || url.searchParams.has('topic')) {
    return null;
  }
  const target = new URL('/repentance-project.html', url.origin);
  url.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  return Response.redirect(target.toString(), 302);
}

async function handleDownloadsAudio(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  if (!env.DOWNLOADS) {
    return new Response('Downloads storage is not configured', { status: 503 });
  }

  const url = new URL(request.url);
  const key = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!/^audio\/accelerated-discipleship\/[A-Za-z0-9._-]+\.mp3$/.test(key)) {
    return new Response('Not found', { status: 404 });
  }

  const object = await env.DOWNLOADS.get(key, {
    range: request.headers,
    onlyIf: request.headers,
  });

  if (object === null) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=86400');
  headers.set('Content-Type', 'audio/mpeg');

  const rawName = url.searchParams.get('filename') || key.split('/').pop() || 'audio.mp3';
  const safeName = rawName.replace(/[\r\n"]/g, '').slice(0, 180);
  if (url.searchParams.has('download')) {
    headers.set('Content-Disposition', `attachment; filename="${safeName}"`);
  } else {
    headers.set('Content-Disposition', 'inline');
  }

  const ranged = Boolean(object.range);
  if (ranged && object.size != null && object.range.offset != null && object.range.end != null) {
    headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.end}/${object.size}`);
  }

  const status = object.body ? (ranged ? 206 : 200) : 304;
  if (request.method === 'HEAD') {
    return new Response(null, { status, headers });
  }
  return new Response(object.body, { status, headers });
}

async function handleCalWebhook(request, env, ctx) {
  const bodyText = await request.text();

  if (env.CAL_WEBHOOK_SECRET) {
    const valid = await verifyCalSignature(request, env.CAL_WEBHOOK_SECRET, bodyText);
    if (!valid) {
      return jsonResponse({ error: 'Invalid signature' }, 401);
    }
  }

  let data = null;
  try {
    data = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const trigger = data?.triggerEvent || data?.type || 'UNKNOWN';
  const isPing = trigger === 'PING' || trigger === 'PING_WEBHOOK' || trigger === 'WEBHOOK_PING';

  if (!isPing && env.RESEND_API_KEY) {
    ctx.waitUntil(sendBookingEmail(env, data, bodyText));
  }

  return jsonResponse({
    ok: true,
    trigger,
    ping: isPing,
    emailQueued: !isPing && Boolean(env.RESEND_API_KEY),
  });
}

async function verifyCalSignature(request, secret, bodyText) {
  const headerSig = request.headers.get('X-Cal-Signature-256');
  if (!headerSig) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(bodyText));
  const computed = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');

  return timingSafeEqual(computed, headerSig.toLowerCase());
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function extractBookingFields(data) {
  const trigger = data?.triggerEvent || data?.type || 'Cal event';
  const payload = data?.payload && typeof data.payload === 'object' ? data.payload : data;
  const attendees = Array.isArray(payload?.attendees) ? payload.attendees : [];
  const organizer = payload?.organizer || {};
  const responses = payload?.responses || payload?.customInputs || {};

  const guest = attendees[0] || {};
  const location =
    payload?.location ||
    payload?.videoCallData?.url ||
    payload?.metadata?.videoCallUrl ||
    '';

  return {
    trigger,
    title: payload?.title || payload?.eventTitle || 'Cal.com booking',
    startTime: payload?.startTime || payload?.start || '',
    endTime: payload?.endTime || payload?.end || '',
    notes: payload?.additionalNotes || payload?.description || '',
    location,
    organizerName: organizer.name || '',
    organizerEmail: organizer.email || '',
    guestName: guest.name || '',
    guestEmail: guest.email || '',
    uid: payload?.uid || payload?.bookingId || '',
    responses,
  };
}

function formatEmailText(fields, rawJson) {
  const lines = [
    `Cal.com webhook: ${fields.trigger}`,
    '',
    `What: ${fields.title}`,
    fields.startTime ? `When: ${fields.startTime}${fields.endTime ? ` → ${fields.endTime}` : ''}` : null,
    fields.organizerName || fields.organizerEmail
      ? `Host: ${fields.organizerName}${fields.organizerEmail ? ` (${fields.organizerEmail})` : ''}`
      : null,
    fields.guestName || fields.guestEmail
      ? `Guest: ${fields.guestName}${fields.guestEmail ? ` (${fields.guestEmail})` : ''}`
      : null,
    fields.location ? `Where: ${fields.location}` : null,
    fields.notes ? `Notes: ${fields.notes}` : null,
    fields.uid ? `Booking ID: ${fields.uid}` : null,
  ].filter(Boolean);

  const responseKeys = Object.keys(fields.responses || {});
  if (responseKeys.length) {
    lines.push('', 'Custom responses:');
    for (const key of responseKeys) {
      const val = fields.responses[key];
      const text = typeof val === 'object' ? JSON.stringify(val) : String(val);
      lines.push(`  ${key}: ${text}`);
    }
  }

  lines.push('', '--- raw payload ---', rawJson);
  return lines.join('\n');
}

async function sendBookingEmail(env, data, rawJson) {
  const fields = extractBookingFields(data);
  const to = env.NOTIFY_EMAIL || 'repentance101ministry.admin@gmail.com';
  const from = env.RESEND_FROM || 'Living Word Map <notifications@repentance101.com>';
  const subject = `[LWM] ${fields.trigger}: ${fields.guestName || fields.title}`;
  const text = formatEmailText(fields, rawJson);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: fields.guestEmail || undefined,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Resend error', res.status, errText);
  }
}

function emptyFoundUsBucket() {
  return { friend: 0, church: 0, norman: 0, camp: 0, slack: 0 };
}

function normalizeFoundUsStore(raw) {
  const all = emptyFoundUsBucket();
  const week = emptyFoundUsBucket();
  const srcAll = raw?.all && typeof raw.all === 'object' ? raw.all : {};
  const srcWeek = raw?.week && typeof raw.week === 'object' ? raw.week : {};
  for (const key of FOUND_US_CHOICES) {
    all[key] = Math.max(0, Number(srcAll[key]) || 0);
    week[key] = Math.max(0, Number(srcWeek[key]) || 0);
  }
  return {
    all,
    week,
    weekStartedAt: Number(raw?.weekStartedAt) || Date.now(),
  };
}

async function loadFoundUsStore(env) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) return null;
  let raw = null;
  try {
    raw = await kv.get(FOUND_US_KV_KEY, { type: 'json' });
  } catch {
    raw = null;
  }
  return normalizeFoundUsStore(raw);
}

function formatFoundUsLines(bucket) {
  return FOUND_US_CHOICES.map(
    (key) => `${FOUND_US_LABELS[key]}: ${bucket[key] || 0}`,
  ).join('\n');
}

function foundUsWeekTotal(bucket) {
  return FOUND_US_CHOICES.reduce((sum, key) => sum + (bucket[key] || 0), 0);
}

async function handleFoundUsPost(request, env) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) {
    return jsonResponse({ error: 'Storage is not configured' }, 503);
  }
  let body = null;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }
  const choice = String(body?.choice || '').toLowerCase();
  if (!FOUND_US_CHOICES.includes(choice)) {
    return jsonResponse({ error: 'Unknown choice' }, 400);
  }
  const store = await loadFoundUsStore(env);
  store.all[choice] += 1;
  store.week[choice] += 1;
  await kv.put(FOUND_US_KV_KEY, JSON.stringify(store));
  return jsonResponse({ ok: true });
}

async function loadHeartAccountabilityStore(env) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) return { entries: [] };
  try {
    const raw = await kv.get(HEART_ACCOUNTABILITY_KV_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.entries)) return { entries: [] };
    return parsed;
  } catch {
    return { entries: [] };
  }
}

async function handleHeartAccountabilityPost(request, env, ctx) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) {
    return jsonResponse({ error: 'Storage is not configured' }, 503);
  }
  const session = await readSession(request, env);
  if (!session) {
    return jsonResponse({ error: 'auth' }, 401);
  }
  let body = null;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }
  const text = String(body?.text || '').trim();
  if (text.length < HEART_ACCOUNTABILITY_MIN || text.length > HEART_ACCOUNTABILITY_MAX) {
    return jsonResponse({ error: 'Invalid text length' }, 400);
  }
  const milestone = Number(body?.milestone);
  if (
    !Number.isFinite(milestone) ||
    milestone < HEART_ACCOUNTABILITY_EVERY ||
    milestone % HEART_ACCOUNTABILITY_EVERY !== 0
  ) {
    return jsonResponse({ error: 'Invalid milestone' }, 400);
  }
  const entry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    accountKey: session.accountKey || '',
    displayName: session.name || '',
    milestone,
    text,
    shareAnonymously: !!body?.shareAnonymously,
    set: Math.max(1, Math.min(11, Number(body?.set) || 1)),
    round: Math.max(1, Math.min(3, Number(body?.round) || 1)),
    topic: Math.max(1, Math.min(666, Number(body?.topic) || 1)),
  };
  const store = await loadHeartAccountabilityStore(env);
  store.entries.push(entry);
  await kv.put(HEART_ACCOUNTABILITY_KV_KEY, JSON.stringify(store));
  if (ctx) {
    ctx.waitUntil(sendHeartAccountabilityEmail(env, entry));
  } else {
    await sendHeartAccountabilityEmail(env, entry);
  }
  return jsonResponse({ ok: true });
}

async function sendHeartAccountabilityEmail(env, entry) {
  if (!env.RESEND_API_KEY) {
    console.error('heart-accountability: RESEND_API_KEY is not set');
    return;
  }
  const to = env.NOTIFY_EMAIL || 'repentance101ministry.admin@gmail.com';
  const from = env.RESEND_FROM || 'Living Word Map <notifications@repentance101.com>';
  const who = entry.displayName || 'participant';
  const subject = `[LWM] Heart accountability · ${entry.milestone} Yes in a row — ${who}`;
  const text = [
    'Repentance Project 2026 — Heart change accountability',
    '',
    `Milestone: ${entry.milestone} consecutive Yes answers`,
    `Submitted: ${entry.at}`,
    `Participant: ${entry.displayName || '(no name on file)'}`,
    `Account key: ${entry.accountKey || '(unknown)'}`,
    `Set ${entry.set} · Round ${entry.round} · Topic ${String(entry.topic).padStart(3, '0')}`,
    `Agreed to anonymous sharing: ${entry.shareAnonymously ? 'Yes' : 'No'}`,
    '',
    '--- answer ---',
    entry.text,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('heart-accountability Resend error', res.status, errText);
  }
}

async function sendFoundUsWeekly(env) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) return;
  const store = await loadFoundUsStore(env);
  if (!env.RESEND_API_KEY) {
    console.error('found-us weekly: RESEND_API_KEY is not set');
    return;
  }
  const to = env.NOTIFY_EMAIL || 'repentance101ministry.admin@gmail.com';
  const from = env.RESEND_FROM || 'Living Word Map <notifications@repentance101.com>';
  const started = new Date(store.weekStartedAt).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const weekTotal = foundUsWeekTotal(store.week);
  const allTotal = foundUsWeekTotal(store.all);
  const text = [
    `Repentance Project 2026 — How did you find us?`,
    ``,
    `This week (${started} to ${today}): ${weekTotal} responses`,
    formatFoundUsLines(store.week),
    ``,
    `All time: ${allTotal} responses`,
    formatFoundUsLines(store.all),
    ``,
    `This is the automated Monday report from map.repentance101.com.`,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[LWM] How did you find us? — ${weekTotal} this week`,
      text,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('found-us weekly Resend error', res.status, errText);
    return;
  }
  store.week = emptyFoundUsBucket();
  store.weekStartedAt = Date.now();
  await kv.put(FOUND_US_KV_KEY, JSON.stringify(store));
}

async function nominatimGet(url) {
  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': NOMINATIM_UA,
    },
  });
  if (!res.ok) {
    return { ok: false, status: res.status, data: null };
  }
  try {
    return { ok: true, status: res.status, data: await res.json() };
  } catch {
    return { ok: false, status: 502, data: null };
  }
}

async function handleNominatim(request) {
  const url = new URL(request.url);
  const mode = String(url.searchParams.get('mode') || '').toLowerCase();
  const wantPolygon = url.searchParams.get('polygon') === '1';
  const nominatim = new URL(
    mode === 'reverse'
      ? 'https://nominatim.openstreetmap.org/reverse'
      : 'https://nominatim.openstreetmap.org/search',
  );

  if (mode === 'reverse') {
    const lat = Number(url.searchParams.get('lat'));
    const lon = Number(url.searchParams.get('lon'));
    const zoom = Math.max(3, Math.min(12, Number(url.searchParams.get('zoom')) || 5));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return jsonResponse({ error: 'Missing lat/lon' }, 400);
    }
    nominatim.searchParams.set('lat', String(lat));
    nominatim.searchParams.set('lon', String(lon));
    nominatim.searchParams.set('zoom', String(zoom));
  } else if (mode === 'search') {
    const q = String(url.searchParams.get('q') || '').trim();
    const city = String(url.searchParams.get('city') || '').trim();
    const state = String(url.searchParams.get('state') || '').trim();
    const county = String(url.searchParams.get('county') || '').trim();
    const country = String(url.searchParams.get('country') || '').trim();
    const structured = Boolean(city || state || country);
    if (!structured && (q.length < 2 || q.length > 200)) {
      return jsonResponse({ error: 'Missing q' }, 400);
    }
    if (structured) {
      if (city) nominatim.searchParams.set('city', city);
      if (county) nominatim.searchParams.set('county', county);
      if (state) nominatim.searchParams.set('state', state);
      if (country) nominatim.searchParams.set('country', country);
    } else {
      nominatim.searchParams.set('q', q);
    }
    nominatim.searchParams.set('limit', '8');
  } else {
    return jsonResponse({ error: 'mode must be search or reverse' }, 400);
  }

  nominatim.searchParams.set('format', 'json');
  nominatim.searchParams.set('addressdetails', '1');
  if (wantPolygon) {
    nominatim.searchParams.set('polygon_geojson', '1');
    nominatim.searchParams.set('polygon_threshold', '0.002');
  }

  const got = await nominatimGet(nominatim);
  if (!got.ok) {
    return jsonResponse({ error: 'Nominatim upstream failed', status: got.status }, 502);
  }
  return jsonResponse(got.data);
}

async function handleGeocode(request) {
  const url = new URL(request.url);
  const q = String(url.searchParams.get('q') || '').trim();
  if (q.length < 2) {
    return jsonResponse({ error: 'Missing q' }, 400);
  }

  const nominatim = new URL('https://nominatim.openstreetmap.org/search');
  nominatim.searchParams.set('q', q);
  nominatim.searchParams.set('format', 'json');
  nominatim.searchParams.set('addressdetails', '1');
  nominatim.searchParams.set('limit', '1');

  const got = await nominatimGet(nominatim);
  if (!got.ok) {
    return jsonResponse({ error: 'Geocode upstream failed', status: got.status }, 502);
  }

  const results = Array.isArray(got.data) ? got.data : [];

  const hit = Array.isArray(results) ? results[0] : null;
  if (!hit) {
    return jsonResponse({ ok: true, found: false });
  }

  const address = hit.address || {};
  const bbox = Array.isArray(hit.boundingbox) ? hit.boundingbox.map(Number) : null;

  return jsonResponse({
    ok: true,
    found: true,
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    displayName: hit.display_name || '',
    city: address.city || address.town || address.village || address.hamlet || '',
    state: address.state || address.region || address.province || '',
    country: address.country || '',
    countryCode: String(address.country_code || '').toLowerCase(),
    boundingbox: bbox,
  });
}

function accountKey(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  header.split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    }
  });
  return out;
}

function sessionCookieHeader(token, maxAgeSec, secure) {
  let value = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
  if (secure) value += '; Secure';
  return value;
}

function clearSessionCookie(secure) {
  let value = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  if (secure) value += '; Secure';
  return value;
}

async function randomSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getAllowlist(env) {
  if (env.EXPERIMENTAL_ALLOWLIST) {
    try {
      const parsed = JSON.parse(env.EXPERIMENTAL_ALLOWLIST);
      if (Array.isArray(parsed)) return { enabled: true, names: parsed };
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      /* fall through */
    }
  }
  try {
    const kvList = await env.EXPERIMENTAL_KV?.get(ALLOWLIST_KV_KEY, { type: 'json' });
    if (kvList && typeof kvList === 'object') return kvList;
  } catch {
    /* ignore */
  }
  return { enabled: true, names: [] };
}

function isAllowlisted(name, allowlist) {
  if (!allowlist?.enabled) return false;
  const key = accountKey(name);
  const names = Array.isArray(allowlist.names) ? allowlist.names : [];
  return names.some(n => accountKey(n) === key);
}

function normalizeInviteCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function isValidInviteFormat(code) {
  return /^LWM-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/.test(code);
}

async function getInvitesStore(env) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) return { codes: {} };
  try {
    const store = await kv.get(INVITES_KV_KEY, { type: 'json' });
    if (store?.codes && typeof store.codes === 'object') return store;
  } catch {
    /* ignore */
  }
  return { codes: {} };
}

async function saveInvitesStore(env, store) {
  await env.EXPERIMENTAL_KV.put(INVITES_KV_KEY, JSON.stringify(store));
}

/**
 * Returning accounts, allowlist bypass, or a valid unused invite (same account re-entry) pass.
 * New accounts must supply an unused invite code.
 */
async function validateInviteForLogin(env, inviteRaw, acctKey, name, acctExists) {
  if (acctExists) return { ok: true };
  if (isAllowlisted(name, await getAllowlist(env))) return { ok: true };

  const inviteCode = normalizeInviteCode(inviteRaw);
  if (!inviteCode) {
    return {
      ok: false,
      error: 'invite',
      message: 'Invite code required for first-time entry. Ask in Slack for a code.',
    };
  }
  if (!isValidInviteFormat(inviteCode)) {
    return { ok: false, error: 'invite', message: 'Invite code format looks wrong (LWM-XXXX-XXXX).' };
  }

  const store = await getInvitesStore(env);
  const rec = store.codes?.[inviteCode];
  if (!rec) {
    return { ok: false, error: 'invite', message: 'That invite code is not recognized.' };
  }
  if (rec.used) {
    if (rec.accountKey === acctKey) return { ok: true };
    return { ok: false, error: 'invite', message: 'This invite code was already used.' };
  }
  return { ok: true, redeem: inviteCode };
}

async function redeemInvite(env, inviteCode, acctKey, name) {
  const store = await getInvitesStore(env);
  const rec = store.codes?.[inviteCode];
  if (!rec || rec.used) return;
  store.codes[inviteCode] = {
    ...rec,
    used: true,
    accountKey: acctKey,
    name,
    usedAt: Date.now(),
  };
  await saveInvitesStore(env, store);
}

async function readSession(request, env) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) return null;
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  let rec = null;
  try {
    rec = await kv.get(`${SESSION_KV_PREFIX}${token}`, { type: 'json' });
  } catch {
    rec = null;
  }
  if (!rec?.accountKey) return null;
  if (rec.expiresAt && rec.expiresAt < Date.now()) return null;
  return { token, ...rec };
}

function normalizeProgress(raw, shareProgress) {
  if (!shareProgress) return null;
  if (!raw || typeof raw !== 'object') return null;
  return {
    set: Math.max(1, Math.min(11, Number(raw.set) || 1)),
    round: Math.max(1, Math.min(3, Number(raw.round) || 1)),
    topic: Math.max(1, Math.min(666, Number(raw.topic) || 1)),
  };
}

function purgePresenceForAccount(store, acctKey) {
  if (!store?.tokens || typeof store.tokens !== 'object') return;
  for (const [tok, rec] of Object.entries(store.tokens)) {
    if (rec?.accountKey === acctKey) delete store.tokens[tok];
  }
}

async function handleExperimentalAuth(request, env, url) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) return jsonResponse({ ok: false, error: 'not-configured' }, 501);

  const secure = url.protocol === 'https:';
  const sub = url.pathname.slice(AUTH_PATH.length).replace(/^\//, '');

  if (sub === 'me' && request.method === 'GET') {
    const session = await readSession(request, env);
    if (!session) return jsonResponse({ error: 'auth' }, 401);
    return jsonResponse({
      ok: true,
      name: session.name || '',
      accountKey: session.accountKey,
      shareProgress: !!session.shareProgress,
    });
  }

  if (sub === 'logout' && request.method === 'POST') {
    const session = await readSession(request, env);
    if (session?.token) {
      await kv.delete(`${SESSION_KV_PREFIX}${session.token}`);
      let store = { tokens: {} };
      try {
        store = (await kv.get(PRESENCE_KV_KEY, { type: 'json' })) || { tokens: {} };
      } catch {
        store = { tokens: {} };
      }
      if (store.tokens?.[session.token]) {
        delete store.tokens[session.token];
        await kv.put(PRESENCE_KV_KEY, JSON.stringify(store));
      }
    }
    return jsonResponse({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(secure) });
  }

  if (sub === 'login' && request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const name = String(body?.name || '').trim();
    const passwordHash = String(body?.passwordHash || '');
    const shareProgress = body?.shareProgress === true;
    const inviteCode = body?.inviteCode;
    if (!name || !passwordHash) {
      return jsonResponse({ error: 'Missing name or password' }, 400);
    }

    const acctKey = accountKey(name);
    const acctRec = await kv.get(`acct:${acctKey}`, { type: 'json' });
    if (acctRec && acctRec.passwordHash !== passwordHash) {
      return jsonResponse({ error: 'auth' }, 401);
    }

    const inviteCheck = await validateInviteForLogin(env, inviteCode, acctKey, name, !!acctRec);
    if (!inviteCheck.ok) {
      return jsonResponse(
        { error: inviteCheck.error || 'invite', message: inviteCheck.message || 'Invite required.' },
        403,
      );
    }

    const token = await randomSessionToken();
    const expiresAt = Date.now() + SESSION_TTL_MS;
    await kv.put(
      `${SESSION_KV_PREFIX}${token}`,
      JSON.stringify({
        accountKey: acctKey,
        name,
        shareProgress,
        passwordHash,
        createdAt: Date.now(),
        expiresAt,
      }),
    );

    if (inviteCheck.redeem) {
      await redeemInvite(env, inviteCheck.redeem, acctKey, name);
    }

    let store = { tokens: {} };
    try {
      store = (await kv.get(PRESENCE_KV_KEY, { type: 'json' })) || { tokens: {} };
    } catch {
      store = { tokens: {} };
    }
    if (!store.tokens || typeof store.tokens !== 'object') store.tokens = {};
    purgePresenceForAccount(store, acctKey);
    await kv.put(PRESENCE_KV_KEY, JSON.stringify(store));

    return jsonResponse(
      { ok: true, shareProgress },
      200,
      { 'Set-Cookie': sessionCookieHeader(token, Math.floor(SESSION_TTL_MS / 1000), secure) },
    );
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

async function handleExperimentalAccount(request, env) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) {
    return jsonResponse({ ok: false, error: 'not-configured' }, 501);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const name = String(body?.name || '').trim();
  const passwordHash = String(body?.passwordHash || '');
  const action = String(body?.action || '');
  if (!name || !passwordHash || (action !== 'save' && action !== 'load')) {
    return jsonResponse({ error: 'Missing name, password, or action' }, 400);
  }

  const key = `acct:${accountKey(name)}`;
  let rec = null;
  try {
    rec = await kv.get(key, { type: 'json' });
  } catch {
    rec = null;
  }

  if (action === 'load') {
    if (!rec) return jsonResponse({ ok: true, found: false });
    if (rec.passwordHash !== passwordHash) return jsonResponse({ error: 'auth' }, 401);
    return jsonResponse({ ok: true, found: true, snapshot: rec.snapshot || null });
  }

  if (rec && rec.passwordHash !== passwordHash) {
    return jsonResponse({ error: 'auth' }, 401);
  }

  await kv.put(
    key,
    JSON.stringify({
      passwordHash,
      snapshot: body.snapshot || rec?.snapshot || null,
      updatedAt: Date.now(),
    }),
  );
  return jsonResponse({ ok: true, saved: true });
}

function aggregatePresenceEntries(entries) {
  const counts = new Map();
  for (const rec of entries) {
    const key = String(rec?.key || '');
    if (!key) continue;
    const cur = counts.get(key) || {
      key,
      name: String(rec.name || ''),
      iso2: String(rec.iso2 || ''),
      grain: String(rec.grain || ''),
      count: 0,
    };
    cur.count += 1;
    counts.set(key, cur);
  }
  return [...counts.values()];
}

function presenceEntries(store) {
  const tokens = store?.tokens && typeof store.tokens === 'object' ? store.tokens : {};
  return Object.values(tokens).filter(rec => rec && rec.key);
}

function filterPresenceForViewer(store, viewerSession) {
  const all = presenceEntries(store);
  const viewerKey = viewerSession.accountKey;
  const viewerShares = !!viewerSession.shareProgress;
  const mine = all.find(rec => rec.accountKey === viewerKey);

  if (!viewerShares) {
    const regions = mine
      ? [
          {
            key: mine.key,
            name: mine.name,
            iso2: mine.iso2,
            grain: mine.grain,
            count: 1,
          },
        ]
      : [];
    return { regions, participants: [], shareProgress: false };
  }

  const consenting = all.filter(rec => rec.shareProgress);
  const regions = aggregatePresenceEntries(consenting);
  const participants = consenting.map(rec => ({
    regionKey: rec.key,
    regionName: rec.name,
    iso2: rec.iso2,
    grain: rec.grain,
    progress: rec.progress || null,
  }));
  return { regions, participants, shareProgress: true };
}

async function handleExperimentalPresence(request, env) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) {
    if (request.method === 'GET') return jsonResponse({ ok: true, regions: [], participants: [], localOnly: true });
    return jsonResponse({ ok: false, error: 'not-configured' }, 501);
  }

  const session = await readSession(request, env);
  if (!session) return jsonResponse({ error: 'auth' }, 401);

  let store = { tokens: {} };
  try {
    store = (await kv.get(PRESENCE_KV_KEY, { type: 'json' })) || { tokens: {} };
  } catch {
    store = { tokens: {} };
  }
  if (!store.tokens || typeof store.tokens !== 'object') store.tokens = {};

  if (request.method === 'GET') {
    const filtered = filterPresenceForViewer(store, session);
    return jsonResponse({ ok: true, ...filtered });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (body?.city != null || body?.lat != null || body?.lon != null || body?.county != null) {
    return jsonResponse({ error: 'city is not shared' }, 400);
  }

  const key = String(body?.key || '');
  const name = String(body?.name || '').trim();
  const iso2 = String(body?.iso2 || '').toLowerCase();
  const grain = String(body?.grain || '').toLowerCase();
  if (
    !/^[a-z]{2}:(state|nation|country):[a-z0-9-]{1,64}$/.test(key) ||
    !/^[a-z]{2}$/.test(iso2) ||
    !/^(state|nation|country)$/.test(grain) ||
    !name ||
    name.length > 64
  ) {
    return jsonResponse({ error: 'Invalid presence' }, 400);
  }

  const shareProgress = !!session.shareProgress;
  const progress = normalizeProgress(body?.progress, shareProgress);

  store.tokens[session.token] = {
    key,
    name,
    iso2,
    grain,
    accountKey: session.accountKey,
    shareProgress,
    progress,
    updatedAt: Date.now(),
  };
  await kv.put(PRESENCE_KV_KEY, JSON.stringify(store));

  const filtered = filterPresenceForViewer(store, session);
  return jsonResponse({ ok: true, saved: true, ...filtered });
}

async function handleMapTile(request) {
  const url = new URL(request.url);
  const z = Number(url.searchParams.get('z'));
  const x = Number(url.searchParams.get('x'));
  const y = Number(url.searchParams.get('y'));
  if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y) || z < 0 || z > 16 || x < 0 || y < 0) {
    return jsonResponse({ error: 'Bad tile' }, 400);
  }
  const max = 2 ** z;
  if (x >= max || y >= max) {
    return jsonResponse({ error: 'Bad tile' }, 400);
  }
  const upstream = `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png`;
  const got = await fetch(upstream, {
    headers: { 'User-Agent': NOMINATIM_UA, Accept: 'image/png' },
  });
  if (!got.ok) {
    return jsonResponse({ error: 'Tile upstream failed', status: got.status }, 502);
  }
  return new Response(got.body, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

function jsonResponse(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}
