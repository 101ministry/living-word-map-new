import { buildProjectVideoCatalog } from './project-videos-catalog.js';

const PROJECT_VIDEOS_PATH = '/api/project-videos';
const VIDEO_ACCT_PREFIX = 'video-acct:';
const VIDEO_SESS_PREFIX = 'video-sess:';
const VIDEO_COOKIE = 'lwm_video_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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

function accountKey(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    }
  });
  return out;
}

function videoSessionCookieHeader(token, maxAgeSec, secure) {
  let value = `${VIDEO_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
  if (secure) value += '; Secure';
  return value;
}

function clearVideoSessionCookie(secure) {
  let value = `${VIDEO_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  if (secure) value += '; Secure';
  return value;
}

async function randomSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function readVideoSession(request, env) {
  const kv = env.EXPERIMENTAL_KV;
  if (!kv) return null;
  const token = parseCookies(request)[VIDEO_COOKIE];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  let rec = null;
  try {
    rec = await kv.get(`${VIDEO_SESS_PREFIX}${token}`, { type: 'json' });
  } catch {
    rec = null;
  }
  if (!rec?.accountKey) return null;
  if (rec.expiresAt && rec.expiresAt < Date.now()) return null;
  return { token, ...rec };
}

export function isProjectVideosRequest(url) {
  return url.pathname === PROJECT_VIDEOS_PATH || url.pathname.startsWith(`${PROJECT_VIDEOS_PATH}/`);
}

export async function handleProjectVideos(request, env, url) {
  const kv = env.EXPERIMENTAL_KV;
  const secure = url.protocol === 'https:';
  const sub = url.pathname.slice(PROJECT_VIDEOS_PATH.length).replace(/^\//, '');

  if (sub === 'me' && request.method === 'GET') {
    const session = await readVideoSession(request, env);
    if (!session) return jsonResponse({ error: 'auth' }, 401);
    return jsonResponse({ ok: true, name: session.name || '' });
  }

  if (sub === 'logout' && request.method === 'POST') {
    const session = await readVideoSession(request, env);
    if (session?.token && kv) await kv.delete(`${VIDEO_SESS_PREFIX}${session.token}`);
    return jsonResponse({ ok: true }, 200, { 'Set-Cookie': clearVideoSessionCookie(secure) });
  }

  if (sub === 'catalog' && request.method === 'GET') {
    return jsonResponse({ ok: true, sets: buildProjectVideoCatalog() });
  }

  if (sub === 'login' && request.method === 'POST') {
    if (!kv) return jsonResponse({ ok: false, error: 'not-configured' }, 501);
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }
    const name = String(body?.name || '').trim();
    const passwordHash = String(body?.passwordHash || '');
    if (name.length < 2 || !passwordHash) {
      return jsonResponse({ error: 'Missing name or password' }, 400);
    }
    const acctKey = accountKey(name);
    const rec = await kv.get(`${VIDEO_ACCT_PREFIX}${acctKey}`, { type: 'json' });
    if (rec && rec.passwordHash !== passwordHash) {
      return jsonResponse({ error: 'auth' }, 401);
    }
    if (!rec) {
      await kv.put(
        `${VIDEO_ACCT_PREFIX}${acctKey}`,
        JSON.stringify({ passwordHash, createdAt: Date.now() }),
      );
    }
    const token = await randomSessionToken();
    const expiresAt = Date.now() + SESSION_TTL_MS;
    await kv.put(
      `${VIDEO_SESS_PREFIX}${token}`,
      JSON.stringify({ accountKey: acctKey, name, createdAt: Date.now(), expiresAt }),
    );
    return jsonResponse(
      { ok: true },
      200,
      { 'Set-Cookie': videoSessionCookieHeader(token, Math.floor(SESSION_TTL_MS / 1000), secure) },
    );
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}
