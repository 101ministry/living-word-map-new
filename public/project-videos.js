(() => {
  'use strict';

  const SET_META = [
    { id: 1, name: 'You and your bloodline', short: 'You' },
    { id: 2, name: "Spouse's bloodline", short: 'Spouse' },
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

  const LOCAL_ACCT = 'lwm-video-accounts-v1';
  const LOCAL_SESS = 'lwm-video-session-v1';

  const els = {
    form: document.getElementById('pv-auth-form'),
    fields: document.getElementById('pv-auth-fields'),
    signedWrap: document.getElementById('pv-signed-wrap'),
    signedLine: document.getElementById('pv-signed-line'),
    lead: document.getElementById('pv-auth-lead'),
    status: document.getElementById('pv-status'),
    logout: document.getElementById('pv-logout'),
    view: document.getElementById('pv-view'),
    crumb: document.getElementById('pv-crumb'),
    sectionLead: document.getElementById('pv-section-lead'),
  };

  const state = {
    name: '',
    remote: false,
    catalog: null,
    setId: null,
    videoN: null,
  };

  function accountKey(name) {
    return String(name || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  function bytesToB64(bytes) {
    let bin = '';
    bytes.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin);
  }

  async function hashPassword(name, password) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(String(password || '')),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(`lwm-video-v1:${accountKey(name)}`),
        iterations: 120000,
        hash: 'SHA-256',
      },
      key,
      256,
    );
    return bytesToB64(new Uint8Array(bits));
  }

  function lockedCatalog() {
    return SET_META.map((set) => ({
      id: set.id,
      name: set.name,
      short: set.short,
      locked: true,
      videos: Array.from({ length: 34 }, (_, i) => ({
        n: i + 1,
        title: `Video ${String(i + 1).padStart(2, '0')}`,
        role: i === 33 && set.id < 11 ? 'next-set' : 'video',
        nextSet: i === 33 && set.id < 11 ? set.id + 1 : null,
        youtubeId: null,
      })),
    }));
  }

  const YOUTUBE_IDS = {
    '1-1': 'v4wEVDFUqD4',
    '1-2': 'MiCbASoOMjE',
    '1-3': '_rBrRF3sexg',
    '1-4': 'W1LEVjlKo08',
    '1-5': 'mgw-W3harTI',
    '1-6': '6ZWSKaOfxjk',
    '1-7': 'M8EKE2MUbkc',
    '1-8': 'KSqcJEYjGvc',
    '1-9': 'vV1b8xfFPqg',
    '1-10': 'GgyzJiULZP8',
    '1-11': '5jOEOVpsKn0',
    '1-12': 'Sj9tzlt2MKQ',
    '1-13': 'MocVZ4nufmM',
    '1-14': 'AEOXKvUj8yo',
    '1-15': 'GNKGbUyUbjo',
    '1-16': 'PiMwpcBgP_E',
    '1-17': 'L5u8JRXbOvY',
    '1-18': '5ncAiLk9fdQ',
  };

  function namedCatalog() {
    return SET_META.map((set) => ({
      id: set.id,
      name: set.name,
      short: set.short,
      locked: false,
      videos: Array.from({ length: 34 }, (_, i) => {
        const n = i + 1;
        const isBridge = n === 34 && set.id < 11;
        const youtubeId = YOUTUBE_IDS[`${set.id}-${n}`] || null;
        const round = set.id === 1 && n >= 1 && n <= 18 ? 1 : null;
        return {
          n,
          round,
          title: isBridge
            ? `Continue to Set ${set.id + 1}`
            : round
              ? `Set ${set.id} · Round ${round} · Video ${String(n).padStart(2, '0')}`
              : `Set ${set.id} · Video ${String(n).padStart(2, '0')}`,
          role: isBridge ? 'next-set' : 'video',
          nextSet: isBridge ? set.id + 1 : null,
          youtubeId,
        };
      }),
    }));
  }

  function readLocalAccounts() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_ACCT) || '{}') || {};
    } catch {
      return {};
    }
  }

  function writeLocalAccounts(map) {
    localStorage.setItem(LOCAL_ACCT, JSON.stringify(map));
  }

  function setStatus(msg) {
    if (els.status) els.status.textContent = msg || '';
  }

  function parseHash() {
    const raw = (location.hash || '').replace(/^#/, '');
    const params = new URLSearchParams(raw.includes('=') ? raw : '');
    const setId = Number(params.get('set') || 0) || null;
    const videoN = Number(params.get('video') || 0) || null;
    state.setId = setId >= 1 && setId <= 11 ? setId : null;
    state.videoN = videoN >= 1 && videoN <= 34 ? videoN : null;
  }

  function writeHash() {
    const params = new URLSearchParams();
    if (state.setId) params.set('set', String(state.setId));
    if (state.setId && state.videoN) params.set('video', String(state.videoN));
    const next = params.toString();
    const hash = next ? `#${next}` : '';
    if (location.hash !== hash) history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
  }

  function goSets() {
    state.setId = null;
    state.videoN = null;
    writeHash();
    render();
  }

  function goSet(id) {
    state.setId = id;
    state.videoN = null;
    writeHash();
    render();
  }

  function goVideo(setId, n) {
    const set = (state.catalog || []).find((s) => s.id === setId);
    const vid = set?.videos?.find((v) => v.n === n);
    if (vid?.role === 'next-set' && vid.nextSet) {
      goSet(vid.nextSet);
      return;
    }
    state.setId = setId;
    state.videoN = n;
    writeHash();
    render();
  }

  async function remoteMe() {
    try {
      const res = await fetch('/api/project-videos/me', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.name ? { name: data.name, remote: true } : null;
    } catch {
      return null;
    }
  }

  async function remoteLogin(name, passwordHash) {
    const res = await fetch('/api/project-videos/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, passwordHash }),
    });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) return { ok: false, reason: 'local' };
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, reason: 'auth' };
    if (!res.ok || !data.ok) return { ok: false, reason: 'local' };
    return { ok: true, remote: true };
  }

  async function remoteLogout() {
    try {
      await fetch('/api/project-videos/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
  }

  async function remoteCatalog() {
    try {
      const res = await fetch('/api/project-videos/catalog', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data?.sets) ? data.sets : null;
    } catch {
      return null;
    }
  }

  function localLogin(name, passwordHash) {
    const key = accountKey(name);
    const map = readLocalAccounts();
    if (map[key] && map[key] !== passwordHash) return { ok: false, reason: 'auth' };
    if (!map[key]) map[key] = passwordHash;
    writeLocalAccounts(map);
    localStorage.setItem(LOCAL_SESS, JSON.stringify({ name: name.trim() }));
    return { ok: true, remote: false };
  }

  function localSession() {
    try {
      const rec = JSON.parse(localStorage.getItem(LOCAL_SESS) || 'null');
      return rec?.name ? { name: rec.name, remote: false } : null;
    } catch {
      return null;
    }
  }

  function applyAuth(session) {
    state.name = session?.name || '';
    state.remote = !!session?.remote;
    const in_ = !!state.name;
    els.fields.hidden = in_;
    els.signedWrap.hidden = !in_;
    if (els.form.querySelector('[name=username]')) {
      els.form.querySelector('[name=username]').required = !in_;
    }
    if (els.form.querySelector('[name=password]')) {
      els.form.querySelector('[name=password]').required = !in_;
    }
    els.signedLine.textContent = in_ ? `Signed in as ${state.name}` : '';
    els.lead.textContent = in_
      ? 'Sets below are open. Video 34 in sets 1–10 continues into the next set.'
      : 'First visit creates your login. Return with the same name and password to open the sets.';
  }

  async function refreshCatalog() {
    if (!state.name) {
      state.catalog = lockedCatalog();
      return;
    }
    if (state.remote) {
      const remote = await remoteCatalog();
      if (remote) {
        state.catalog = remote;
        return;
      }
    }
    state.catalog = namedCatalog();
  }

  function renderCrumb() {
    if (!state.setId) {
      els.crumb.hidden = true;
      els.crumb.innerHTML = '';
      return;
    }
    const set = (state.catalog || []).find((s) => s.id === state.setId);
    const setLabel = `Set ${state.setId}${set?.name && state.name ? ` · ${set.name}` : ''}`;
    els.crumb.hidden = false;
    const bits = [`<button type="button" data-pv="home">All sets</button>`];
    if (state.videoN) {
      bits.push(`<button type="button" data-pv="set">${escapeHtml(setLabel)}</button>`);
      bits.push(`<span>Video ${String(state.videoN).padStart(2, '0')}</span>`);
    } else {
      bits.push(`<span>${escapeHtml(setLabel)}</span>`);
    }
    els.crumb.innerHTML = bits.join('');
    els.crumb.querySelector('[data-pv=home]')?.addEventListener('click', goSets);
    els.crumb.querySelector('[data-pv=set]')?.addEventListener('click', () => goSet(state.setId));
  }

  function renderSectionLead() {
    if (!els.sectionLead) return;
    if (!state.setId) {
      els.sectionLead.textContent = state.name
        ? 'Choose a set. Each holds 33 videos; video 34 in sets 1–10 opens the next set.'
        : 'Placeholder sets. Each thumbnail is that set’s picture. Sign in above to open the real video slots.';
      return;
    }
    if (state.videoN) {
      els.sectionLead.textContent = '';
      return;
    }
    const next = state.setId < 11 ? ` Video 34 opens Set ${state.setId + 1}.` : ' This is the last set.';
    els.sectionLead.textContent = `Set ${state.setId} of 11 · 33 videos.${next}`;
  }

  function setArt(id) {
    const arts = {
      1: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#14121a"/><circle cx="80" cy="28" r="10" fill="#e2d0b4"/><path d="M62 82c2-22 10-32 18-32s16 10 18 32" fill="#d4af37"/><path d="M70 58h20" stroke="#7a3b32" stroke-width="3" stroke-linecap="round"/></svg>`,
      2: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#14121a"/><circle cx="64" cy="30" r="9" fill="#e2d0b4"/><circle cx="96" cy="30" r="9" fill="#e8dcc8"/><path d="M50 82c2-20 8-28 14-28s12 8 14 28" fill="#d4af37"/><path d="M82 82c2-20 8-28 14-28s12 8 14 28" fill="#c9a227"/><path d="M78 56h6" stroke="#f0ead6" stroke-width="2"/></svg>`,
      3: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#1a1620"/><path d="M28 78V46h104v32" fill="#e2d0b4"/><path d="M22 48l58-28 58 28" fill="#7a3b32"/><rect x="72" y="56" width="16" height="22" fill="#d4af37"/><rect x="40" y="52" width="14" height="12" fill="#8ec4e6"/><rect x="106" y="52" width="14" height="12" fill="#8ec4e6"/></svg>`,
      4: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#16141c"/><rect x="0" y="70" width="160" height="8" fill="#3a342c"/><g fill="#e2d0b4"><rect x="12" y="48" width="28" height="22"/><rect x="50" y="42" width="30" height="28"/><rect x="90" y="46" width="26" height="24"/><rect x="124" y="50" width="24" height="20"/></g><g fill="#7a3b32"><path d="M10 48l16-10 16 10"/><path d="M48 42l17-12 17 12"/><path d="M88 46l15-10 15 10"/><path d="M122 50l14-8 14 8"/></g></svg>`,
      5: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#121018"/><g fill="#c4b496"><rect x="10" y="38" width="18" height="44"/><rect x="32" y="22" width="22" height="60"/><rect x="58" y="30" width="16" height="52"/><rect x="78" y="14" width="26" height="68"/><rect x="108" y="28" width="20" height="54"/><rect x="132" y="40" width="18" height="42"/></g><g fill="#d4af37" opacity=".7"><rect x="36" y="28" width="4" height="6"/><rect x="86" y="22" width="4" height="6"/><rect x="114" y="34" width="4" height="6"/></g></svg>`,
      6: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#141820"/><path d="M24 22h112v50H24z" fill="none" stroke="#8a7a62" stroke-width="2"/><path d="M48 30l28-4 36 10-8 28-40 8z" fill="rgba(212,175,55,.2)" stroke="#d4af37" stroke-width="2" stroke-dasharray="4 3"/></svg>`,
      7: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#141820"/><path d="M30 24l48-8 54 18-10 40-52 10-40-16z" fill="rgba(226,208,180,.18)" stroke="#e2d0b4" stroke-width="2"/><path d="M70 28l22 6-4 22-24 6z" fill="rgba(212,175,55,.35)" stroke="#d4af37" stroke-width="1.5"/></svg>`,
      8: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#12161c"/><path d="M22 48c8-18 28-28 52-26 18 2 28 10 40 8 16-2 28 8 26 20-2 14-16 22-38 24-22 2-42-6-56-4-14 2-28-4-24-22z" fill="#3d5c48" stroke="#d4af37" stroke-width="1.5"/></svg>`,
      9: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#10141c"/><ellipse cx="80" cy="45" rx="40" ry="38" fill="#1c2838" stroke="#d4af37" stroke-width="2"/><g stroke="#c9a227" stroke-width="1.4" opacity=".85"><path d="M80 7v76"/><path d="M58 10c-10 10-16 22-16 35s6 25 16 35"/><path d="M102 10c10 10 16 22 16 35s-6 25-16 35"/><path d="M42 45h76"/></g></svg>`,
      10: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#10141c"/><path d="M18 58c10-22 32-36 62-34 22 2 40 14 58 8 8 10 10 24 4 36-18 8-40 6-62 10-24 4-46-2-62-20z" fill="#35543f" stroke="#d4af37" stroke-width="1.5"/><path d="M40 48c12-8 28-6 40-14" fill="none" stroke="#e2d0b4" stroke-width="1" opacity=".5"/></svg>`,
      11: `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#0c1018"/><circle cx="80" cy="45" r="34" fill="#1a3048" stroke="#d4af37" stroke-width="2"/><ellipse cx="80" cy="45" rx="14" ry="34" fill="none" stroke="#c9a227" stroke-width="1"/><path d="M46 45h68" stroke="#c9a227" stroke-width="1"/><path d="M52 28c10 4 28 6 56-2" fill="none" stroke="#6d8f6a" stroke-width="4"/><path d="M50 58c16-6 30 4 58 0" fill="none" stroke="#6d8f6a" stroke-width="5"/></svg>`,
    };
    return arts[id] || '';
  }

  function renderSets() {
    const sets = state.catalog || lockedCatalog();
    const locked = !state.name;
    els.view.className = 'pv-grid';
    els.view.innerHTML = sets
      .map(
        (set) => `
      <button type="button" class="pv-thumb${locked ? ' is-locked' : ''}" data-set="${set.id}">
        <div class="pv-thumb-art">${setArt(set.id)}</div>
        <div class="pv-thumb-body">
          <span class="pv-thumb-kicker">Set ${set.id} of 11</span>
          <span class="pv-thumb-title">${escapeHtml(set.name)}</span>
          <span class="pv-thumb-note">${set.id < 11 ? '33 videos · 34 opens next set' : '33 videos · last set'}</span>
        </div>
      </button>`,
      )
      .join('');
    els.view.querySelectorAll('[data-set]').forEach((btn) => {
      btn.addEventListener('click', () => goSet(Number(btn.dataset.set)));
    });
  }

  function renderSet(setId) {
    const set = (state.catalog || []).find((s) => s.id === setId);
    if (!set) {
      goSets();
      return;
    }
    els.view.className = 'pv-grid';
    els.view.innerHTML = set.videos
      .map((vid) => {
        const bridge = vid.role === 'next-set';
        const locked = !state.name;
        const ready = !locked && !!vid.youtubeId;
        const label = bridge
          ? `Next · Set ${vid.nextSet}`
          : vid.round
            ? `Round ${vid.round} · Video ${String(vid.n).padStart(2, '0')}`
            : `Video ${String(vid.n).padStart(2, '0')}`;
        const title = locked && !bridge ? `Placeholder ${String(vid.n).padStart(2, '0')}` : vid.title;
        const art = ready
          ? `<img src="https://i.ytimg.com/vi/${encodeURIComponent(vid.youtubeId)}/hqdefault.jpg" alt="">`
          : bridge
            ? '→'
            : String(vid.n);
        return `
      <button type="button" class="pv-thumb${bridge ? ' is-bridge' : ''}${locked ? ' is-locked' : ''}${ready ? ' is-ready' : ''}" data-video="${vid.n}">
        <div class="pv-thumb-art">${art}</div>
        <div class="pv-thumb-body">
          <span class="pv-thumb-kicker">${label}</span>
          <span class="pv-thumb-title">${escapeHtml(title)}</span>
        </div>
      </button>`;
      })
      .join('');
    els.view.querySelectorAll('[data-video]').forEach((btn) => {
      btn.addEventListener('click', () => goVideo(setId, Number(btn.dataset.video)));
    });
  }

  function renderPlayer(setId, videoN) {
    const set = (state.catalog || []).find((s) => s.id === setId);
    const vid = set?.videos?.find((v) => v.n === videoN);
    if (!vid) {
      goSet(setId);
      return;
    }
    els.view.className = 'pv-player-wrap';
    if (vid.youtubeId) {
      const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid.youtubeId)}?rel=0`;
      els.view.innerHTML = `
        <div class="pv-stage"><iframe src="${src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${escapeHtml(vid.title)}"></iframe></div>
        <p class="pv-placeholder-copy"><strong>${escapeHtml(vid.title)}</strong>Set ${setId} · ${escapeHtml(set.name)}${vid.round ? ` · Round ${vid.round}` : ''}</p>`;
      return;
    }
    els.view.innerHTML = `
      <div class="pv-stage">
        <div class="pv-placeholder-copy">
          <strong>${escapeHtml(vid.title)}</strong>
          ${
            state.name
              ? 'This slot is ready for the Unlisted teaching upload. After the video ID is attached, it plays here for signed-in viewers.'
              : 'Create a username and password above. After you sign in, this placeholder is replaced with the real video for this slot.'
          }
        </div>
      </div>`;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render() {
    renderCrumb();
    renderSectionLead();
    if (!state.setId) renderSets();
    else if (!state.videoN) renderSet(state.setId);
    else renderPlayer(state.setId, state.videoN);
  }

  els.form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.name) return;
    const fd = new FormData(els.form);
    const name = String(fd.get('username') || '').trim();
    const password = String(fd.get('password') || '');
    if (name.length < 2) {
      setStatus('Username needs at least two characters.');
      return;
    }
    if (password.length < 6) {
      setStatus('Password needs at least six characters.');
      return;
    }
    setStatus('Opening…');
    const passwordHash = await hashPassword(name, password);
    let result;
    try {
      result = await remoteLogin(name, passwordHash);
    } catch {
      result = { ok: false, reason: 'local' };
    }
    if (result.reason === 'auth') {
      setStatus('That username already has a different password.');
      return;
    }
    if (!result.ok) result = localLogin(name, passwordHash);
    if (!result.ok) {
      setStatus('That username already has a different password.');
      return;
    }
    applyAuth({ name, remote: !!result.remote });
    setStatus(result.remote ? 'Signed in. Placeholders now show the real set pages.' : 'Signed in on this device. Placeholders now show the real set pages.');
    els.form.reset();
    await refreshCatalog();
    parseHash();
    render();
  });

  els.logout?.addEventListener('click', async () => {
    if (state.remote) await remoteLogout();
    try {
      localStorage.removeItem(LOCAL_SESS);
    } catch {
      /* ignore */
    }
    applyAuth(null);
    setStatus('Signed out. Placeholders are showing again.');
    await refreshCatalog();
    goSets();
  });

  window.addEventListener('hashchange', () => {
    parseHash();
    render();
  });

  (async function init() {
    let session = await remoteMe();
    if (!session) session = localSession();
    applyAuth(session);
    await refreshCatalog();
    parseHash();
    render();
  })();
})();
