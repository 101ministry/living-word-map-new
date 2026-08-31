(() => {
  'use strict';

  function showFatalError(message) {
    const banner = document.createElement('div');
    banner.setAttribute('role', 'alert');
    banner.style.cssText =
      'padding:1.25rem 1.5rem;margin:1rem;background:#3d1f1f;border:1px solid #8b3a3a;color:#f0d4d4;font:500 0.95rem/1.5 system-ui,sans-serif;border-radius:8px;';
    banner.textContent = message;
    const app = document.getElementById('exp-app');
    if (app) app.prepend(banner);
    else document.body.prepend(banner);
  }

  const DATA1 = window.ROUND1_DATA;
  const DATA2 = window.ROUND2_DATA;
  const DATA3 = window.ROUND3_DATA;
  const GEO = window.ExperimentalGeo;
  const SCENE = window.ExperimentalScene;

  if (!DATA1 || !Array.isArray(DATA1.sections) || !DATA1.topics?.['1']?.round1Text) {
    showFatalError('Round 1 data failed to load. Re-run the round 1 build, then hard-refresh.');
    return;
  }
  if (!DATA2?.topics?.['1']?.round2Text) {
    showFatalError('Round 2 data failed to load. Re-run the round 2 build, then hard-refresh.');
    return;
  }
  if (!DATA3?.topics?.['1']?.round3Text) {
    showFatalError('Round 3 data failed to load. Re-run the round 3 build, then hard-refresh.');
    return;
  }
  if (!GEO || !SCENE) {
    showFatalError('Repentance Project 2026 builder scripts failed to load.');
    return;
  }

  const CATALOG = window.LANGUAGE_CATALOG || {
    languages: [{ code: 'en', name: 'English', native: 'English' }],
    ui: {},
    defaultLanguage: 'en',
  };
  const STORAGE_KEY = 'lwm-experimental-v1';
  const ACCOUNTS_KEY = 'lwm-experimental-accounts-v1';
  const LANG_STORAGE_KEY = 'lwm-round-prayer-lang';
  const RECORD_MODE = /(?:\?|&)(?:record=1|mode=record)(?:&|$)/.test(location.search);
  const CAL_MS = (DATA1.calReturnMinutes || 2) * 60 * 1000;
  const CAL_CONSECUTIVE_NOS = 4;
  const LANG_ALIASES = { sp: 'es' };
  const TOPIC_COUNT = DATA1.topicCount || 666;
  const HUB_PAGE = document.body.classList.contains('site-repentance-hub');
  const hubSection = document.getElementById('repentance-hub-section');
  const siteShell = document.getElementById('app');

  function syncHubVisibility(mode) {
    if (!HUB_PAGE) return;
    const inBuilder = mode === 'app';
    if (hubSection) hubSection.hidden = inBuilder;
    if (siteShell) siteShell.hidden = inBuilder;
    document.body.classList.toggle('repentance-in-builder', inBuilder);
  }

  function exitToHub() {
    els.app.hidden = true;
    els.gate.hidden = true;
    syncHubVisibility('hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const els = {
    gate: document.getElementById('exp-gate'),
    app: document.getElementById('exp-app'),
    form: document.getElementById('exp-profile-form'),
    geoStatus: document.getElementById('exp-geo-status'),
    submit: document.getElementById('exp-profile-submit'),
    phaseLabel: document.getElementById('exp-phase-label'),
    progress: document.getElementById('exp-progress'),
    sidebarSections: document.getElementById('exp-sidebar-sections'),
    topicNum: document.getElementById('exp-topic-num'),
    topicTitle: document.getElementById('exp-topic-title'),
    topicMeta: document.getElementById('exp-topic-meta'),
    prayerNote: document.getElementById('exp-prayer-note'),
    prayerText: document.getElementById('exp-prayer-text'),
    prayerScroll: document.getElementById('exp-prayer-scroll'),
    langSelect: document.getElementById('exp-lang'),
    langLabel: document.getElementById('exp-lang-label'),
    setSelect: document.getElementById('exp-set'),
    roundSelect: document.getElementById('exp-round'),
    caseSelect: document.getElementById('exp-case'),
    caseName: document.getElementById('exp-case-name'),
    caseGate: document.getElementById('exp-case-gate'),
    people: document.getElementById('exp-people'),
    editProfile: document.getElementById('exp-edit-profile'),
    reset: document.getElementById('exp-profile-reset'),
    heartDialog: document.getElementById('exp-heart-dialog'),
    heartDismiss: document.getElementById('exp-heart-dismiss'),
    heartTitle: document.getElementById('exp-heart-title'),
    heartSub: document.getElementById('exp-heart-sub'),
    heartYes: document.getElementById('exp-heart-yes'),
    heartNo: document.getElementById('exp-heart-no'),
    advanceDialog: document.getElementById('exp-advance-dialog'),
    advanceTitle: document.getElementById('exp-advance-title'),
    advanceSub: document.getElementById('exp-advance-sub'),
    advanceGo: document.getElementById('exp-advance-go'),
    canvas: document.getElementById('exp-canvas'),
    caption: document.getElementById('exp-scene-caption'),
    hud: document.getElementById('exp-hud'),
    hudCount: document.getElementById('exp-hud-count'),
    hudSection: document.getElementById('exp-hud-section'),
    nextTopic: document.getElementById('exp-next-topic'),
    peoplePrivacy: document.getElementById('exp-people-privacy'),
  };

  const prayerPackCache = Object.create(null);
  let activePack = null;
  const state = loadState();
  let sceneReady = false;
  let pendingHeartCheck = false;
  let pendingNavigation = null;
  let calDepartedAt = null;
  let calDepartedSectionFirstTopic = null;
  let awaitingCalReturn = false;
  let pendingAdvance = null;

  function normalizeLang(code) {
    const raw = String(code || 'en').toLowerCase();
    return LANG_ALIASES[raw] || raw;
  }

  function progressKey(set, round) {
    return `${set}:${round}`;
  }

  function emptyRound() {
    return { heartYes: [], heartAnswered: [], consecutiveNo: 0 };
  }

  function defaultState() {
    let language = 'en';
    try {
      language = normalizeLang(localStorage.getItem(LANG_STORAGE_KEY) || CATALOG.defaultLanguage || 'en');
    } catch { /* ignore */ }
    return {
      profile: null,
      passwordHash: '',
      language,
      currentSet: 1,
      currentRound: 1,
      currentTopic: 1,
      progress: {},
      shareProgress: undefined,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      const merged = { ...base, ...parsed, progress: parsed.progress || {} };
      merged.currentSet = clampSet(merged.currentSet, merged.profile);
      merged.currentRound = clampRound(merged.currentRound);
      merged.currentTopic = clampTopic(merged.currentTopic);
      merged.language = normalizeLang(merged.language || base.language);
      if (typeof merged.shareProgress !== 'boolean') merged.shareProgress = undefined;
      return merged;
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(LANG_STORAGE_KEY, state.language);
    } catch { /* ignore */ }
    persistAccount();
    if (!RECORD_MODE && state.profile && els.app && !els.app.hidden) {
      publishPresence();
    }
  }

  function normalizePersonName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ');
  }

  function normalizeInviteCode(raw) {
    return String(raw || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
  }

  function inviteCodeFromQuery() {
    try {
      return normalizeInviteCode(new URLSearchParams(location.search).get('invite'));
    } catch {
      return '';
    }
  }

  function accountKey(name) {
    return normalizePersonName(name).toLowerCase();
  }

  function loadAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function bytesToB64(bytes) {
    let bin = '';
    bytes.forEach(b => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin);
  }

  async function hashPassword(name, password) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(String(password || '')), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(`lwm-exp-v1:${accountKey(name)}`),
        iterations: 120000,
        hash: 'SHA-256',
      },
      key,
      256,
    );
    return bytesToB64(new Uint8Array(bits));
  }

  function snapshotFromState() {
    return {
      profile: state.profile,
      progress: state.progress,
      language: state.language,
      currentSet: state.currentSet,
      currentRound: state.currentRound,
      currentTopic: state.currentTopic,
      shareProgress: state.shareProgress,
    };
  }

  function applySnapshot(snap) {
    if (!snap) return;
    state.profile = snap.profile || null;
    state.progress = snap.progress || {};
    if (snap.language) state.language = normalizeLang(snap.language);
    state.currentSet = clampSet(snap.currentSet || 1, state.profile);
    state.currentRound = clampRound(snap.currentRound || 1);
    state.currentTopic = clampTopic(snap.currentTopic || 1);
    if (typeof snap.shareProgress === 'boolean') state.shareProgress = snap.shareProgress;
  }

  async function ensureSession() {
    if (RECORD_MODE) return true;
    try {
      const res = await fetch('/api/experimental-auth/me', { credentials: 'include' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function loginSession(name, passwordHash, shareProgress, inviteCode) {
    try {
      const body = { name, passwordHash, shareProgress: !!shareProgress };
      const code = normalizeInviteCode(inviteCode);
      if (code) body.inviteCode = code;
      const res = await fetch('/api/experimental-auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        const err = data.error || 'invite';
        return {
          ok: false,
          reason: err,
          message:
            data.message ||
            (err === 'allowlist'
              ? 'This name is not on the participant list.'
              : 'Invite code required or invalid.'),
        };
      }
      if (res.status === 401) return { ok: false, reason: 'auth' };
      if (!res.ok) return { ok: false, reason: 'network' };
      const data = await res.json();
      return { ok: true, shareProgress: !!data.shareProgress };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }

  function applyPresenceResponse(data, mine) {
    const regions = sanitizePresenceRegions(data?.regions || [], mine);
    const participants = Array.isArray(data?.participants)
      ? data.participants.filter(p => p && p.regionKey && p.regionName)
      : [];
    if (typeof SCENE.setPeopleRegions === 'function') SCENE.setPeopleRegions(regions);
    if (typeof SCENE.setPeopleParticipants === 'function') SCENE.setPeopleParticipants(participants);
  }

  let accountApiReady = true;

  async function refreshPeopleMap() {
    const mine = await resolvePublicRegion();
    if (RECORD_MODE) {
      if (typeof SCENE.setPeopleRegions === 'function') {
        SCENE.setPeopleRegions(sanitizePresenceRegions([], mine));
      }
      if (typeof SCENE.setPeopleParticipants === 'function') SCENE.setPeopleParticipants([]);
      return mine;
    }
    try {
      const res = await fetch('/api/experimental-presence', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        applyPresenceResponse(data, mine);
      } else if (typeof SCENE.setPeopleRegions === 'function') {
        SCENE.setPeopleRegions(sanitizePresenceRegions([], mine));
      }
    } catch {
      if (typeof SCENE.setPeopleRegions === 'function') {
        SCENE.setPeopleRegions(sanitizePresenceRegions([], mine));
      }
    }
    return mine;
  }

  async function publishPresence() {
    const mine = await refreshPeopleMap();
    if (RECORD_MODE || !mine || !state.passwordHash) return;
    try {
      const res = await fetch('/api/experimental-presence', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: mine.key,
          name: mine.name,
          iso2: mine.iso2,
          grain: mine.grain,
          progress: state.shareProgress
            ? {
                set: state.currentSet,
                round: state.currentRound,
                topic: state.currentTopic,
              }
            : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        applyPresenceResponse(data, mine);
      }
    } catch { /* stay on the local highlight */ }
  }

  function sanitizePresenceRegions(list, mine) {
    const regions = Array.isArray(list) ? list.filter(r => r && r.key && r.name).map(r => ({
      key: String(r.key),
      name: String(r.name),
      iso2: String(r.iso2 || ''),
      grain: String(r.grain || ''),
      count: Math.max(1, Number(r.count) || 1),
    })) : [];
    if (mine && !regions.some(r => r.key === mine.key)) {
      regions.push({ key: mine.key, name: mine.name, iso2: mine.iso2, grain: mine.grain, count: 1 });
    }
    return regions;
  }

  async function resolvePublicRegion() {
    if (!state.profile || typeof GEO.publicRegionFromProfile !== 'function') return null;
    let worldAdm = null;
    try {
      await Promise.all([
        typeof GEO.loadCountryCodes === 'function' ? GEO.loadCountryCodes() : null,
        GEO.loadWorldStates(),
      ]);
      worldAdm = await GEO.loadWorldStates();
    } catch { /* name-only fallback */ }
    return GEO.publicRegionFromProfile(state.profile, worldAdm);
  }

  function setPeopleMode(on) {
    const next = !!on;
    document.body.classList.toggle('exp-people-on', next);
    if (els.people) {
      els.people.classList.toggle('is-on', next);
      els.people.setAttribute('aria-pressed', next ? 'true' : 'false');
    }
    if (typeof SCENE.setPeopleView === 'function') SCENE.setPeopleView(next);
    if (next) refreshPeopleMap();
  }

  async function persistAccount() {
    const name = normalizePersonName(state.profile?.name);
    if (!name || !state.passwordHash) return;
    const rec = { passwordHash: state.passwordHash, snapshot: snapshotFromState(), updatedAt: Date.now() };
    try {
      const map = loadAccounts();
      map[accountKey(name)] = rec;
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
    } catch { /* ignore */ }
    try {
      if (!accountApiReady) return;
      const res = await fetch('/api/experimental-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', name, passwordHash: state.passwordHash, snapshot: rec.snapshot }),
      });
      if (res.status === 501) accountApiReady = false;
    } catch { /* local or no account store */ }
  }

  async function loadRemoteAccount(name, passwordHash) {
    if (!accountApiReady) return { ok: false, reason: 'missing' };
    const res = await fetch('/api/experimental-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'load', name, passwordHash }),
    });
    if (res.status === 501) {
      accountApiReady = false;
      return { ok: false, reason: 'missing' };
    }
    if (res.status === 401) return { ok: false, reason: 'auth' };
    if (!res.ok) return { ok: false, reason: 'missing' };
    const data = await res.json();
    if (data.found && data.snapshot) return { ok: true, snapshot: data.snapshot };
    if (data.error === 'auth') return { ok: false, reason: 'auth' };
    return { ok: false, reason: 'missing' };
  }

  async function loadAccount(name, passwordHash) {
    try {
      const remote = await loadRemoteAccount(name, passwordHash);
      if (remote.ok || remote.reason === 'auth') return remote;
    } catch { /* fall through to this browser */ }
    const rec = loadAccounts()[accountKey(name)];
    if (!rec) return { ok: false, reason: 'missing' };
    if (rec.passwordHash !== passwordHash) return { ok: false, reason: 'auth' };
    return { ok: true, snapshot: rec.snapshot };
  }

  function updateCaseName() {
    if (els.caseName) els.caseName.value = normalizePersonName(state.profile?.name);
  }

  function toggleSpouseField() {
    const wrap = document.getElementById('exp-spouse-wrap');
    if (!wrap) return;
    wrap.hidden = els.form?.married?.value !== 'yes';
    syncRequiredFields();
  }

  function syncRequiredFields() {
    if (!els.form) return;
    const live = !RECORD_MODE;
    const marriedYes = els.form.married?.value === 'yes';
    if (els.form.personName) els.form.personName.required = live;
    if (els.form.password) els.form.password.required = live && !state.passwordHash;
    if (els.form.spouseName) els.form.spouseName.required = live && marriedYes;
    ['city', 'county', 'state', 'country', 'continent'].forEach(name => {
      if (els.form[name]) els.form[name].required = true;
    });
    els.form.querySelectorAll('input[name="shareProgress"]').forEach(radio => {
      radio.required = live;
    });
  }

  function resetProfileForm() {
    if (!els.form) return;
    els.form.reset();
    if (els.caseGate) els.caseGate.value = '';
    const invitePrefill = inviteCodeFromQuery();
    if (invitePrefill && els.form.inviteCode) els.form.inviteCode.value = invitePrefill;
    toggleSpouseField();
    syncRequiredFields();
    if (els.geoStatus) {
      els.geoStatus.textContent = '';
      els.geoStatus.classList.remove('is-ok', 'is-warn', 'is-error');
    }
  }

  function clampTopic(n) {
    const num = Number(n);
    if (!Number.isFinite(num) || num < 1) return 1;
    if (num > TOPIC_COUNT) return TOPIC_COUNT;
    return num;
  }

  function clampRound(n) {
    const num = Number(n);
    if (num < 1) return 1;
    if (num > 3) return 3;
    return num;
  }

  function isMarried() {
    return !!state.profile?.married;
  }

  function setMeta(id) {
    return GEO.SETS.find(s => s.id === id) || GEO.SETS[0];
  }

  function allowedSets() {
    return GEO.SETS.filter(s => !s.requiresMarried || isMarried());
  }

  function clampSet(n, profile) {
    const married = !!profile?.married;
    const allowed = GEO.SETS.filter(s => !s.requiresMarried || married).map(s => s.id);
    const num = Number(n);
    if (allowed.includes(num)) return num;
    return allowed[0] || 1;
  }

  function nextSetId(from) {
    const ids = allowedSets().map(s => s.id);
    const idx = ids.indexOf(from);
    if (idx < 0) return ids[0];
    return ids[Math.min(ids.length - 1, idx + 1)];
  }

  function roundProgress(set, round) {
    const key = progressKey(set, round);
    if (!state.progress[key]) state.progress[key] = emptyRound();
    return state.progress[key];
  }

  function currentProgress() {
    return roundProgress(state.currentSet, state.currentRound);
  }

  function roundComplete(set, round) {
    return roundProgress(set, round).heartYes.length >= TOPIC_COUNT;
  }

  function setComplete(set) {
    return roundComplete(set, 1) && roundComplete(set, 2) && roundComplete(set, 3);
  }

  function setUnlocked(setId) {
    return allowedSets().some(s => s.id === setId);
  }

  function roundUnlocked(setId, round) {
    if (!setUnlocked(setId)) return false;
    const r = Number(round);
    return r >= 1 && r <= 3;
  }

  function dataForRound(round) {
    if (round === 2) return DATA2;
    if (round === 3) return DATA3;
    return DATA1;
  }

  function topicData(num) {
    const data = dataForRound(state.currentRound);
    return data.topics[String(clampTopic(num))] || DATA1.topics[String(clampTopic(num))];
  }

  function pad(n) {
    return String(n).padStart(3, '0');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ui(key, fallback) {
    const pack = CATALOG.ui?.[state.language] || CATALOG.ui?.en || {};
    return pack[key] || CATALOG.ui?.en?.[key] || fallback || key;
  }

  function applyUiChrome() {
    if (els.langLabel) els.langLabel.textContent = ui('languageLabel', 'Language');
    if (els.heartTitle) els.heartTitle.textContent = ui('heartTitle', 'Did anything change in your heart?');
    if (els.heartSub) {
      els.heartSub.textContent = ui(
        'heartSub',
        'When you choose the next topic in the list, answer here first. You can scroll back through the prayer behind this box before you respond.'
      );
    }
    if (els.heartYes) els.heartYes.textContent = ui('heartYes', 'Yes, my heart changed');
    if (els.heartNo) els.heartNo.textContent = ui('heartNo', 'No');
    const rtl = !!(CATALOG.languages || []).find(l => l.code === state.language)?.rtl;
    document.documentElement.lang = state.language;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('exp-record', RECORD_MODE);
    document.body.classList.toggle('exp-record', RECORD_MODE);
    if (els.submit) els.submit.textContent = RECORD_MODE ? 'Enter Repentance Project 2026' : 'Enter Prayer Builder';
    updateCaseName();
  }

  function populateLanguageSelect() {
    if (!els.langSelect) return;
    const langs = Array.isArray(CATALOG.languages) ? CATALOG.languages : [];
    els.langSelect.innerHTML = '';
    langs.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = lang.native ? `${lang.native} (${lang.name})` : lang.name || lang.code;
      els.langSelect.appendChild(opt);
    });
    if (![...els.langSelect.options].some(o => o.value === state.language)) {
      state.language = 'en';
    }
    els.langSelect.value = state.language;
  }

  function populateSetSelect() {
    if (!els.setSelect) return;
    els.setSelect.innerHTML = '';
    allowedSets().forEach(s => {
      const opt = document.createElement('option');
      opt.value = String(s.id);
      const locked = !setUnlocked(s.id);
      opt.textContent = `${s.id}. ${s.short}`;
      opt.disabled = locked && s.id !== state.currentSet;
      els.setSelect.appendChild(opt);
    });
    els.setSelect.value = String(state.currentSet);
    if (els.roundSelect) {
      [...els.roundSelect.options].forEach(opt => {
        const r = Number(opt.value);
        opt.disabled = !roundUnlocked(state.currentSet, r) && r !== state.currentRound;
      });
      els.roundSelect.value = String(state.currentRound);
    }
  }

  function caseIdForProfile(profile) {
    if (!profile || !Array.isArray(GEO.CASE_LOAD)) return '';
    const hit = GEO.CASE_LOAD.find(c => c.city === profile.city && c.state === profile.state);
    return hit?.id || '';
  }

  function populateCaseSelects() {
    const cases = GEO.CASE_LOAD || [];
    const current = caseIdForProfile(state.profile);
    function fill(sel, includeBlank) {
      if (!sel) return;
      const keep = sel.value;
      sel.innerHTML = '';
      if (includeBlank) {
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = 'Custom location…';
        sel.appendChild(blank);
      }
      cases.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.label;
        sel.appendChild(opt);
      });
      sel.value = current || keep || '';
    }
    fill(els.caseGate, true);
    fill(els.caseSelect, true);
  }

  function fillFieldsFromCase(c) {
    if (!els.form || !c) return;
    els.form.city.value = c.city;
    els.form.state.value = c.state;
    els.form.country.value = c.country;
    els.form.continent.value = c.continent;
  }

  async function applyCaseLoad(id, opts) {
    const c = (GEO.CASE_LOAD || []).find(x => x.id === id);
    if (!c) return;
    fillFieldsFromCase(c);
    const gender = state.profile?.gender || els.form?.gender?.value || 'man';
    const married = state.profile ? (state.profile.married ? 'yes' : 'no') : (els.form?.married?.value || 'no');
    const profile = GEO.profileFromFields(
      {
        personName: state.profile?.name || '',
        gender,
        married,
        spouseName: state.profile?.spouseName || '',
        city: c.city,
        county: state.profile?.county || '',
        state: c.state,
        country: c.country,
        continent: c.continent,
      },
      {
        lat: c.lat,
        lon: c.lon,
        countryCode: c.countryCode,
        city: c.city,
        state: c.state,
        country: c.country,
        source: 'case-load',
      },
    );
    state.profile = profile;
    saveState();
    if (els.caseSelect) els.caseSelect.value = id;
    if (els.caseGate) els.caseGate.value = id;
    if (!els.app.hidden) {
      SCENE.setProfile(profile);
      if (opts?.jump !== false) {
        await goToSetRound(7, state.currentRound || 3, 1);
        applyFill('showcase');
      }
    }
  }

  function packUrl(lang, round) {
    if (round === 2) return `prayers/${lang}-round2.json`;
    if (round === 3) return `prayers/${lang}-round3.json`;
    return `prayers/${lang}.json`;
  }

  async function loadPrayerPack(lang, round) {
    const code = normalizeLang(lang);
    if (code === 'en') {
      activePack = null;
      return null;
    }
    const key = `${code}:${round}`;
    if (prayerPackCache[key] !== undefined) {
      activePack = prayerPackCache[key];
      return activePack;
    }
    const res = await fetch(packUrl(code, round), { cache: 'no-cache' });
    if (!res.ok) {
      prayerPackCache[key] = null;
      activePack = null;
      return null;
    }
    const pack = await res.json();
    prayerPackCache[key] = pack;
    activePack = pack;
    return pack;
  }

  function prayerTextForTopic(num) {
    const t = topicData(num);
    if (!t) return '';
    if (activePack?.topics) {
      const entry = activePack.topics[String(num)] || activePack.topics[pad(num)];
      if (entry?.text) return entry.text;
    }
    if (state.currentRound === 2) return t.round2Text || '';
    if (state.currentRound === 3) return t.round3Text || '';
    return t.round1Text || '';
  }

  function prayerNoteForTopic(num) {
    if (activePack?.topics) {
      const entry = activePack.topics[String(num)] || activePack.topics[pad(num)];
      if (entry?.note) return entry.note;
    }
    return 'PLEASE NOTE: THESE PRAYERS ARE TO BE SPOKEN, NOT SIMPLY READ SILENTLY.';
  }

  async function setLanguage(code) {
    const next = normalizeLang(code);
    state.language = next;
    saveState();
    applyUiChrome();
    try {
      await loadPrayerPack(next, state.currentRound);
    } catch (err) {
      console.error(err);
      activePack = null;
    }
    renderCurrentTopic();
  }

  function firstTopicOfSection(sectionId) {
    const sec = DATA1.sections.find(s => s.id === sectionId);
    if (!sec?.topics?.length) return 1;
    return Math.min(...sec.topics.map(t => t.number));
  }

  function isSectionComplete(sectionId) {
    const sec = DATA1.sections.find(s => s.id === sectionId);
    if (!sec?.topics?.length) return false;
    const yes = currentProgress().heartYes;
    return sec.topics.every(t => yes.includes(t.number));
  }

  function completedSectionCount(set, round) {
    const yes = roundProgress(set, round).heartYes;
    return DATA1.sections.filter(sec => sec.topics.every(t => yes.includes(t.number))).length;
  }

  function orderedTopicNumbers() {
    const out = [];
    DATA1.sections.forEach(section => {
      [...section.topics]
        .sort((a, b) => a.number - b.number)
        .forEach(t => out.push(t.number));
    });
    return out;
  }

  const TOPIC_ORDER = orderedTopicNumbers();

  function seedRound(set, round, count) {
    const n = Math.max(0, Math.min(TOPIC_COUNT, Math.round(Number(count) || 0)));
    const chosen = TOPIC_ORDER.slice(0, n);
    const prog = roundProgress(set, round);
    prog.heartYes = chosen.slice();
    prog.heartAnswered = chosen.slice();
    prog.consecutiveNo = 0;
    return n;
  }

  function applyFill(kind) {
    const set = state.currentSet;
    const round = state.currentRound;
    let filled = 0;
    if (kind === 'empty') {
      for (let r = 1; r <= 3; r++) seedRound(set, r, 0);
      filled = 0;
    } else if (kind === 'done') {
      for (let r = 1; r < round; r++) seedRound(set, r, TOPIC_COUNT);
      filled = seedRound(set, round, TOPIC_COUNT);
    } else if (kind === 'late') {
      for (let r = 1; r < round; r++) seedRound(set, r, TOPIC_COUNT);
      filled = seedRound(set, round, Math.round(TOPIC_COUNT * 0.82));
    } else if (/^\d+$/.test(String(kind))) {
      for (let r = 1; r < round; r++) seedRound(set, r, TOPIC_COUNT);
      filled = seedRound(set, round, Math.round(TOPIC_COUNT * (Number(kind) / 100)));
    } else {
      for (let r = 1; r < round; r++) seedRound(set, r, TOPIC_COUNT);
      filled = seedRound(set, round, Math.round(TOPIC_COUNT * 0.48));
    }
    const next = filled >= TOPIC_COUNT ? TOPIC_COUNT : filled + 1;
    state.currentTopic = next;
    saveState();
    renderCurrentTopic();
    buildSidebar(() => updateBuilderHud(false));
    syncScene();
  }

  function sectionBuilderCount(sectionId) {
    const sec = DATA1.sections.find(s => s.id === sectionId);
    if (!sec) return 0;
    const yes = currentProgress().heartYes;
    return sec.topics.filter(t => yes.includes(t.number)).length;
  }

  function bumpEl(el) {
    if (!el) return;
    el.classList.remove('exp-builders-bump');
    void el.offsetWidth;
    el.classList.add('exp-builders-bump');
  }

  function updateSectionBuilderLabel(sectionId, bump) {
    const el = document.querySelector(
      `#exp-sidebar-sections .round2-sidebar-section[data-section-id="${sectionId}"] .exp-section-builders`
    );
    if (!el) return;
    const n = sectionBuilderCount(sectionId);
    const prev = Number(el.dataset.count || 0);
    el.dataset.count = String(n);
    el.textContent = n === 1 ? '1 builder' : `${n} builders`;
    if (bump && n > prev) bumpEl(el);
  }

  function updateBuilderHud(bump) {
    const total = currentProgress().heartYes.length;
    if (els.hudCount) {
      const prev = Number(els.hudCount.dataset.count || 0);
      els.hudCount.dataset.count = String(total);
      els.hudCount.textContent = String(total);
      if (bump && total > prev) bumpEl(els.hudCount);
    }
    const t = topicData(state.currentTopic);
    const sectionId = t?.sectionId;
    const sec = DATA1.sections.find(s => s.id === sectionId);
    const inSection = sectionId ? sectionBuilderCount(sectionId) : 0;
    if (els.hudSection) {
      els.hudSection.textContent = sec
        ? `${sec.name} · ${inSection} builder${inSection === 1 ? '' : 's'}`
        : '';
    }
    DATA1.sections.forEach(section => updateSectionBuilderLabel(section.id, bump && section.id === sectionId));
  }

  function crewSizeNow() {
    return Math.max(1, currentProgress().heartYes.length);
  }

  function fractionsForSet(setId) {
    return {
      1: roundProgress(setId, 1).heartYes.length / TOPIC_COUNT,
      2: roundProgress(setId, 2).heartYes.length / TOPIC_COUNT,
      3: roundProgress(setId, 3).heartYes.length / TOPIC_COUNT,
    };
  }

  function allSetFractions() {
    const out = {};
    GEO.SETS.forEach(s => {
      out[s.id] = fractionsForSet(s.id);
    });
    return out;
  }

  function syncScene() {
    if (!sceneReady) return;
    SCENE.setFocus(state.currentSet, state.currentRound);
    SCENE.syncProgress({
      set: state.currentSet,
      round: state.currentRound,
      fractionsByRound: fractionsForSet(state.currentSet),
      setFractions: allSetFractions(),
      crewSize: crewSizeNow(),
    });
  }

  function updatePrincipalityCheck(el, sectionId) {
    if (!el) return;
    const complete = isSectionComplete(sectionId);
    el.classList.toggle('done', complete);
    el.textContent = complete ? '✅' : '☐';
  }

  function buildSidebar(onDone) {
    els.sidebarSections.innerHTML = '';
    const sections = DATA1.sections;
    const prog = currentProgress();
    let sectionIdx = 0;
    let topicIdx = 0;
    let secEl = null;
    let sorted = null;
    const BATCH = 40;

    function renderBatch() {
      let count = 0;
      while (sectionIdx < sections.length && count < BATCH) {
        const section = sections[sectionIdx];
        if (!secEl) {
          secEl = document.createElement('div');
          secEl.className = 'round2-sidebar-section';
          secEl.dataset.sectionId = section.id;

          const pHead = document.createElement('div');
          pHead.className = 'round2-sidebar-principality';
          const pCheck = document.createElement('span');
          pCheck.className = 'round2-principality-check';
          updatePrincipalityCheck(pCheck, section.id);
          pHead.appendChild(pCheck);
          const pName = document.createElement('span');
          pName.className = 'exp-section-name';
          pName.textContent = section.name;
          pHead.appendChild(pName);
          const pBuild = document.createElement('span');
          pBuild.className = 'exp-section-builders';
          const built = sectionBuilderCount(section.id);
          pBuild.dataset.count = String(built);
          pBuild.textContent = built === 1 ? '1 builder' : `${built} builders`;
          pHead.appendChild(pBuild);
          secEl.appendChild(pHead);

          sorted = [...section.topics].sort((a, b) => a.number - b.number);
          topicIdx = 0;
        }

        while (topicIdx < sorted.length && count < BATCH) {
          const item = sorted[topicIdx++];
          const row = document.createElement('div');
          row.className = 'round2-sidebar-topic';
          row.dataset.topic = String(item.number);
          if (prog.heartAnswered.includes(item.number)) row.classList.add('visited');
          if (prog.heartYes.includes(item.number)) row.classList.add('done');
          if (item.number === state.currentTopic) row.classList.add('active');
          row.innerHTML = `
            <span class="round2-topic-check">${prog.heartYes.includes(item.number) ? '✅' : '☐'}</span>
            <span class="round2-sidebar-topic-num">${pad(item.number)}</span>
            <span class="round2-sidebar-topic-label">${escapeHtml(item.label)}</span>`;
          row.addEventListener('click', () => requestTopicChange(item.number));
          secEl.appendChild(row);
          count += 1;
        }

        if (topicIdx >= sorted.length) {
          els.sidebarSections.appendChild(secEl);
          secEl = null;
          sectionIdx += 1;
        }
      }

      if (sectionIdx < sections.length) {
        requestAnimationFrame(renderBatch);
      } else if (typeof onDone === 'function') {
        onDone();
      }
    }

    requestAnimationFrame(renderBatch);
  }

  function refreshSidebarMarks() {
    const prog = currentProgress();
    document.querySelectorAll('#exp-sidebar-sections .round2-sidebar-topic').forEach(row => {
      const num = Number(row.dataset.topic);
      row.classList.toggle('visited', prog.heartAnswered.includes(num));
      row.classList.toggle('done', prog.heartYes.includes(num));
      const check = row.querySelector('.round2-topic-check');
      if (check) check.textContent = prog.heartYes.includes(num) ? '✅' : '☐';
      row.classList.toggle('active', num === state.currentTopic);
    });
    DATA1.sections.forEach(section => {
      const secEl = document.querySelector(`#exp-sidebar-sections .round2-sidebar-section[data-section-id="${section.id}"]`);
      const pc = secEl?.querySelector('.round2-principality-check');
      updatePrincipalityCheck(pc, section.id);
      updateSectionBuilderLabel(section.id, false);
    });
  }

  function updatePhaseLabel() {
    const s = setMeta(state.currentSet);
    els.phaseLabel.textContent = `Set ${state.currentSet} of 11 · ${s.name} · Round ${state.currentRound}`;
  }

  function renderCurrentTopic() {
    const num = clampTopic(state.currentTopic);
    state.currentTopic = num;
    const t = topicData(num);
    updatePhaseLabel();

    if (!t) {
      els.topicNum.textContent = pad(num);
      els.topicTitle.textContent = 'Topic not found';
      els.topicMeta.textContent = '';
      els.prayerText.textContent = 'Prayer text missing for this topic.';
      return;
    }

    els.topicNum.textContent = pad(t.number);
    els.topicTitle.textContent = t.label;
    const metaParts = [];
    if (t.root) metaParts.push(`Root: ${t.root}`);
    if (t.fruitDisplay) metaParts.push(`Fruit: ${t.fruitDisplay}`);
    if (t.principality) metaParts.push(`Principality: ${t.principality}`);
    els.topicMeta.textContent = metaParts.join(' · ');
    if (els.prayerNote) els.prayerNote.textContent = prayerNoteForTopic(t.number);
    const fallback = state.currentRound === 2 ? '(No Round 2 prayer text.)' : state.currentRound === 3 ? '(No Round 3 prayer text.)' : '(No Round 1 prayer text.)';
    els.prayerText.textContent = prayerTextForTopic(t.number) || fallback;
    const yes = currentProgress().heartYes.length;
    els.progress.textContent = `Topic ${t.number} / ${TOPIC_COUNT} · ${yes} built`;

    document.querySelectorAll('#exp-sidebar-sections .round2-sidebar-topic').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.topic) === state.currentTopic);
    });
    if (els.prayerScroll) els.prayerScroll.scrollTop = 0;
    updateBuilderHud(false);
  }

  function showHeartDialogForNavigation(targetNum) {
    pendingNavigation = clampTopic(targetNum);
    pendingHeartCheck = true;
    if (!els.heartDialog.open) els.heartDialog.showModal();
  }

  function requestTopicChange(targetNum) {
    const target = clampTopic(targetNum);
    const current = clampTopic(state.currentTopic);
    if (target === current) {
      document.querySelector(`#exp-sidebar-sections .round2-sidebar-topic[data-topic="${target}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (currentProgress().heartAnswered.includes(current)) {
      goToTopic(target);
      return;
    }
    showHeartDialogForNavigation(target);
  }

  function updateSidebarTopic(num) {
    const prog = currentProgress();
    const row = document.querySelector(`#exp-sidebar-sections .round2-sidebar-topic[data-topic="${num}"]`);
    if (!row) return;
    row.classList.add('visited');
    if (prog.heartYes.includes(num)) {
      row.classList.add('done');
      const check = row.querySelector('.round2-topic-check');
      if (check) check.textContent = '✅';
    }
    const t = topicData(num);
    if (t?.sectionId) {
      const secEl = document.querySelector(`#exp-sidebar-sections .round2-sidebar-section[data-section-id="${t.sectionId}"]`);
      updatePrincipalityCheck(secEl?.querySelector('.round2-principality-check'), t.sectionId);
      updateSectionBuilderLabel(t.sectionId, true);
    }
  }

  function goToTopic(num) {
    state.currentTopic = clampTopic(num);
    saveState();
    renderCurrentTopic();
    refreshSidebarMarks();
    document.querySelector(`#exp-sidebar-sections .round2-sidebar-topic[data-topic="${state.currentTopic}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function closeHeartDialog() {
    if (els.heartDialog?.open) els.heartDialog.close();
  }

  function maybeOfferAdvance() {
    if (!roundComplete(state.currentSet, state.currentRound)) return;
    if (state.currentRound < 3) {
      pendingAdvance = { set: state.currentSet, round: state.currentRound + 1 };
      els.advanceTitle.textContent = `Round ${state.currentRound} complete`;
      els.advanceSub.textContent = `Begin Round ${state.currentRound + 1} of Set ${state.currentSet}.`;
      if (!els.advanceDialog.open) els.advanceDialog.showModal();
      return;
    }
    const nxt = nextSetId(state.currentSet);
    if (nxt === state.currentSet) {
      pendingAdvance = null;
      els.advanceTitle.textContent = 'All eleven sets complete';
      els.advanceSub.textContent = 'The mansion covers your country. North of the globe, your home still glows.';
      if (!els.advanceDialog.open) els.advanceDialog.showModal();
      return;
    }
    pendingAdvance = { set: nxt, round: 1 };
    els.advanceTitle.textContent = `Set ${state.currentSet} complete`;
    els.advanceSub.textContent = `Begin Set ${nxt} of 11 · ${setMeta(nxt).name}.`;
    if (!els.advanceDialog.open) els.advanceDialog.showModal();
  }

  async function goToSetRound(setId, round, topic) {
    state.currentSet = clampSet(setId, state.profile);
    state.currentRound = clampRound(round);
    state.currentTopic = clampTopic(topic || 1);
    saveState();
    populateSetSelect();
    await loadPrayerPack(state.language, state.currentRound);
    renderCurrentTopic();
    buildSidebar(() => updateBuilderHud(false));
    syncScene();
  }

  function readQuery() {
    try {
      const params = new URLSearchParams(location.search);
      return {
        set: Number(params.get('set')),
        round: Number(params.get('round')),
        fill: params.get('fill'),
        caseId: params.get('case'),
      };
    } catch {
      return { set: NaN, round: NaN, fill: null, caseId: null };
    }
  }

  function advanceAfterHeart(yes) {
    const destination = pendingNavigation;
    pendingNavigation = null;
    pendingHeartCheck = false;
    closeHeartDialog();

    const current = clampTopic(state.currentTopic);
    const prog = currentProgress();
    const sectionId = topicData(current)?.sectionId;
    const sectionWasComplete = sectionId ? isSectionComplete(sectionId) : true;

    if (!prog.heartAnswered.includes(current)) prog.heartAnswered.push(current);

    let landed = false;
    let openCalSilently = false;
    if (yes) {
      const already = prog.heartYes.includes(current);
      if (!already) prog.heartYes.push(current);
      prog.consecutiveNo = 0;
      if (!already) landed = true;
      if (sectionId && !sectionWasComplete && isSectionComplete(sectionId)) {
        SCENE.onSectionComplete();
      }
    } else {
      prog.consecutiveNo += 1;
      if (prog.consecutiveNo >= CAL_CONSECUTIVE_NOS) {
        openCalSilently = true;
        const t = topicData(current);
        calDepartedSectionFirstTopic = t?.sectionId ? firstTopicOfSection(t.sectionId) : current;
        prog.consecutiveNo = 0;
      }
    }

    saveState();
    updateSidebarTopic(current);
    renderCurrentTopic();
    updateBuilderHud(true);
    syncScene();
    if (landed) SCENE.onTopicYes();

    window.setTimeout(() => {
      if (destination) goToTopic(destination);
      if (yes) maybeOfferAdvance();
      if (openCalSilently && DATA1.calLink) {
        calDepartedAt = Date.now();
        awaitingCalReturn = true;
        window.open(DATA1.calLink, '_blank', 'noopener,noreferrer');
      }
    }, 50);
  }

  function handleCalReturn() {
    if (!awaitingCalReturn || !calDepartedAt) return;
    awaitingCalReturn = false;
    const elapsed = Date.now() - calDepartedAt;
    calDepartedAt = null;
    if (elapsed < CAL_MS) {
      const resetTo = calDepartedSectionFirstTopic || state.currentTopic;
      calDepartedSectionFirstTopic = null;
      saveState();
      goToTopic(resetTo);
      return;
    }
    calDepartedSectionFirstTopic = null;
    saveState();
  }

  function fillProfileForm(profile) {
    if (!els.form || !profile) return;
    if (els.form.personName) els.form.personName.value = profile.name || '';
    els.form.gender.value = profile.gender === 'woman' ? 'woman' : 'man';
    els.form.married.value = profile.married ? 'yes' : 'no';
    if (els.form.spouseName) els.form.spouseName.value = profile.spouseName || '';
    els.form.city.value = profile.city || '';
    if (els.form.county) els.form.county.value = profile.county || '';
    els.form.state.value = profile.state || '';
    els.form.country.value = profile.country || '';
    els.form.continent.value = profile.continent || '';
    if (els.form.password) els.form.password.value = '';
    if (typeof state.shareProgress === 'boolean') {
      const shareVal = state.shareProgress ? 'yes' : 'no';
      els.form.querySelectorAll('input[name="shareProgress"]').forEach(radio => {
        radio.checked = radio.value === shareVal;
      });
    }
    toggleSpouseField();
    syncRequiredFields();
  }

  function showGate(editing) {
    els.gate.hidden = false;
    els.app.hidden = true;
    populateCaseSelects();
    if (editing && state.profile) fillProfileForm(state.profile);
    else if (!editing) resetProfileForm();
    if (els.form?.password) {
      els.form.password.placeholder =
        editing && state.passwordHash
          ? 'Leave blank to keep your password'
          : 'To open this case on another device';
    }
    syncRequiredFields();
    syncHubVisibility('gate');
  }

  function showApp() {
    els.gate.hidden = true;
    els.app.hidden = false;
    syncHubVisibility('app');
  }

  async function enterApp() {
    showApp();
    const q = readQuery();
    if (RECORD_MODE && q.caseId) await applyCaseLoad(q.caseId, { jump: false });
    if (Number.isFinite(q.set) && q.set >= 1) state.currentSet = clampSet(q.set, state.profile);
    else if (RECORD_MODE && q.caseId) state.currentSet = clampSet(7, state.profile);
    if (Number.isFinite(q.round) && q.round >= 1) state.currentRound = clampRound(q.round);
    populateLanguageSelect();
    populateSetSelect();
    populateCaseSelects();
    applyUiChrome();
    await loadPrayerPack(state.language, state.currentRound);
    if (!sceneReady) {
      SCENE.init(els.canvas, els.caption, null);
      sceneReady = true;
    }
    SCENE.setProfile(state.profile);
    publishPresence();
    updateCaseName();
    if (typeof SCENE.resize === 'function') {
      requestAnimationFrame(() => SCENE.resize());
    }
    if (RECORD_MODE && q.fill) {
      applyFill(q.fill);
      return;
    }
    if (RECORD_MODE && q.caseId) {
      applyFill('showcase');
      return;
    }
    renderCurrentTopic();
    buildSidebar(() => updateBuilderHud(false));
    syncScene();
  }

  els.form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(els.form);
    const personName = normalizePersonName(fd.get('personName'));
    const password = String(fd.get('password') || '');
    const shareChoice = fd.get('shareProgress');
    const fields = {
      personName,
      gender: fd.get('gender'),
      married: fd.get('married'),
      spouseName: fd.get('spouseName'),
      city: fd.get('city'),
      county: fd.get('county'),
      state: fd.get('state'),
      country: fd.get('country'),
      continent: fd.get('continent'),
    };
    els.geoStatus.classList.remove('is-ok', 'is-warn', 'is-error');
    const missing = [];
    if (!RECORD_MODE) {
      if (!personName) missing.push('Name');
      if (!fields.gender) missing.push('Gender');
      if (!fields.married) missing.push('Married?');
      if (fields.married === 'yes' && !String(fields.spouseName || '').trim()) missing.push("Spouse's name");
      if (!password && !state.passwordHash) missing.push('Password');
      if (shareChoice !== 'yes' && shareChoice !== 'no') missing.push('People map sharing choice');
    }
    if (!String(fields.city || '').trim()) missing.push('City');
    if (!String(fields.county || '').trim()) missing.push('County / parish / province');
    if (!String(fields.state || '').trim()) missing.push('State');
    if (!String(fields.country || '').trim()) missing.push('Country');
    if (!String(fields.continent || '').trim()) missing.push('Continent');
    if (missing.length) {
      els.geoStatus.classList.add('is-error');
      els.geoStatus.textContent = `All boxes are required. Fill in: ${missing.join(', ')}.`;
      return;
    }
    els.submit.disabled = true;
    els.geoStatus.textContent = 'Placing your map…';
    let passwordHash = state.passwordHash || '';
    let isReturningAccount = false;
    const inviteCodeInput = normalizeInviteCode(fd.get('inviteCode'));
    try {
      if (!RECORD_MODE && password) {
        passwordHash = await hashPassword(personName, password);
        const existing = await loadAccount(personName, passwordHash);
        if (existing.reason === 'auth') {
          els.geoStatus.classList.add('is-error');
          els.geoStatus.textContent = 'That name already has a different password.';
          els.submit.disabled = false;
          return;
        }
        if (existing.ok) {
          applySnapshot(existing.snapshot);
          isReturningAccount = true;
          passwordHash = passwordHash;
        } else if (accountKey(personName) !== accountKey(state.profile?.name)) {
          state.progress = {};
          state.currentSet = 1;
          state.currentRound = 1;
          state.currentTopic = 1;
        }
      } else if (!RECORD_MODE && state.passwordHash && accountKey(personName) === accountKey(state.profile?.name)) {
        isReturningAccount = true;
      }
    } catch (err) {
      console.error(err);
      els.geoStatus.classList.add('is-error');
      els.geoStatus.textContent = 'Could not check the password. Try again.';
      els.submit.disabled = false;
      return;
    }
    if (!RECORD_MODE && !isReturningAccount && !inviteCodeInput) {
      els.geoStatus.classList.add('is-error');
      els.geoStatus.textContent = 'Invite code required for first-time entry. Check Slack for your code.';
      els.submit.disabled = false;
      return;
    }
    let profile;
    try {
      const preset = (GEO.CASE_LOAD || []).find(
        c => c.city === fields.city && c.state === fields.state && c.country === fields.country,
      );
      if (preset) {
        profile = GEO.profileFromFields(fields, {
          lat: preset.lat,
          lon: preset.lon,
          countryCode: preset.countryCode,
          city: preset.city,
          state: preset.state,
          country: preset.country,
          source: 'case-load',
        });
      } else {
        profile = await GEO.geocodeProfile(fields);
      }
    } catch (err) {
      console.error(err);
      profile = GEO.profileFromFields(fields, null);
    }
    if (!RECORD_MODE && personName) profile.name = personName;
    state.profile = profile;
    state.passwordHash = passwordHash;
    if (shareChoice === 'yes' || shareChoice === 'no') {
      state.shareProgress = shareChoice === 'yes';
    }
    state.currentSet = clampSet(state.currentSet || 1, profile);
    saveState();
    if (profile.geocoded) {
      els.geoStatus.classList.add('is-ok');
      els.geoStatus.textContent = `Using ${profile.city}, ${profile.state}, ${profile.country}.`;
    } else {
      els.geoStatus.classList.add('is-warn');
      els.geoStatus.textContent = `Using your entries: ${profile.city}, ${profile.state}, ${profile.country}. Map is schematic.`;
    }
    if (!RECORD_MODE && personName && passwordHash) {
      els.geoStatus.textContent = 'Opening your session…';
      const login = await loginSession(personName, passwordHash, state.shareProgress, inviteCodeInput);
      if (!login.ok) {
        els.geoStatus.classList.remove('is-ok', 'is-warn');
        els.geoStatus.classList.add('is-error');
        if (login.reason === 'allowlist') {
          els.geoStatus.textContent = login.message || 'This name is not on the participant list.';
        } else if (login.reason === 'invite') {
          els.geoStatus.textContent = login.message || 'Invite code required or invalid.';
        } else if (login.reason === 'auth') {
          els.geoStatus.textContent = 'That name already has a different password.';
        } else {
          els.geoStatus.textContent = 'Could not open your session. Try again.';
        }
        els.submit.disabled = false;
        return;
      }
      state.shareProgress = login.shareProgress;
    }
    try {
      await enterApp();
    } catch (err) {
      console.error(err);
      els.geoStatus.classList.remove('is-ok', 'is-warn');
      els.geoStatus.classList.add('is-error');
      els.geoStatus.textContent = `Opened with your location, but the builder failed: ${err.message}`;
    } finally {
      els.submit.disabled = false;
    }
  });

  els.heartYes.addEventListener('click', () => advanceAfterHeart(true));
  els.heartNo.addEventListener('click', () => advanceAfterHeart(false));
  els.heartDismiss.addEventListener('click', () => {
    if (els.heartDialog?.open) els.heartDialog.close();
  });
  els.heartDialog.addEventListener('cancel', e => e.preventDefault());
  els.heartDialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (els.heartDialog?.open) els.heartDialog.close();
    }
  });

  els.advanceGo.addEventListener('click', () => {
    if (els.advanceDialog?.open) els.advanceDialog.close();
    if (pendingAdvance) {
      const next = pendingAdvance;
      pendingAdvance = null;
      goToSetRound(next.set, next.round, 1);
    }
  });

  els.langSelect.addEventListener('change', () => setLanguage(els.langSelect.value));
  els.setSelect.addEventListener('change', async () => {
    const id = Number(els.setSelect.value);
    if (!setUnlocked(id)) {
      els.setSelect.value = String(state.currentSet);
      return;
    }
    const round = 1;
    await goToSetRound(id, round, 1);
  });
  els.roundSelect.addEventListener('change', async () => {
    const r = Number(els.roundSelect.value);
    if (!roundUnlocked(state.currentSet, r)) {
      els.roundSelect.value = String(state.currentRound);
      return;
    }
    await goToSetRound(state.currentSet, r, 1);
  });
  if (els.caseSelect) {
    els.caseSelect.addEventListener('change', async () => {
      if (!els.caseSelect.value) return;
      await applyCaseLoad(els.caseSelect.value);
    });
  }
  if (els.caseGate) {
    els.caseGate.addEventListener('change', () => {
      const c = (GEO.CASE_LOAD || []).find(x => x.id === els.caseGate.value);
      if (c) fillFieldsFromCase(c);
    });
  }
  if (els.reset) {
    els.reset.addEventListener('click', () => resetProfileForm());
  }
  if (els.form) {
    els.form.querySelectorAll('input[name="married"]').forEach(radio => {
      radio.addEventListener('change', toggleSpouseField);
    });
  }
  if (els.people) {
    els.people.addEventListener('click', () => {
      const on = !(typeof SCENE.isPeopleView === 'function' && SCENE.isPeopleView());
      setPeopleMode(on);
    });
  }
  els.editProfile?.addEventListener('click', () => showGate(true));
  if (els.nextTopic) {
    els.nextTopic.addEventListener('click', () => {
      requestTopicChange(state.currentTopic + 1);
    });
  }
  document.querySelectorAll('.exp-fill-btn').forEach(btn => {
    btn.addEventListener('click', () => applyFill(btn.dataset.fill));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') handleCalReturn();
  });
  window.addEventListener('focus', () => handleCalReturn());

  if (HUB_PAGE) {
    document.querySelectorAll('[data-exp-hub-back]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        if (els.app && !els.app.hidden) exitToHub();
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  (async () => {
    try {
      populateLanguageSelect();
      populateCaseSelects();
      applyUiChrome();
      syncRequiredFields();
      if (!state.profile) {
        showGate(false);
        return;
      }
      if (!RECORD_MODE && !(await ensureSession())) {
        showGate(true);
        if (els.geoStatus) {
          els.geoStatus.classList.add('is-warn');
          els.geoStatus.textContent = 'Sign in again with your name and password to continue.';
        }
        return;
      }
      await enterApp();
    } catch (err) {
      showFatalError(`Repentance Project 2026 builder failed to initialize: ${err.message}`);
      console.error(err);
    }
  })();
})();
