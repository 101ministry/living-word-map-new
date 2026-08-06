/**
 * Living Word Map — Cloudflare Worker
 * Serves static assets from public/ and handles Cal.com webhooks at POST /api/cal-booking
 */

const WEBHOOK_PATH = '/api/cal-booking';

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

    return env.ASSETS.fetch(request);
  },
};

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

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
