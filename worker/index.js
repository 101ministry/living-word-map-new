/**
 * Living Word Map — Cloudflare Worker
 * Serves static assets from public/, Cal.com webhooks at POST /api/cal-booking,
 * Nominatim proxies at GET /api/geocode and GET /api/nominatim.
 */

const WEBHOOK_PATH = '/api/cal-booking';
const GEOCODE_PATH = '/api/geocode';
const NOMINATIM_PATH = '/api/nominatim';
const ACCOUNT_PATH = '/api/experimental-account';
const MAP_TILE_PATH = '/api/map-tile';
const DOWNLOADS_PREFIX = '/audio/accelerated-discipleship/';
const NOMINATIM_UA = 'LivingWordMap/1.0 (experimental prayer builder; https://living-word-map.norm-f37.workers.dev/)';

export default {
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

    if (url.pathname.startsWith(DOWNLOADS_PREFIX)) {
      return handleDownloadsAudio(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

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
  const to = env.NOTIFY_EMAIL || 'norm@repentance101.com';
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

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
