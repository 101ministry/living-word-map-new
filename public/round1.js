(() => {
  'use strict';

  function showFatalError(message) {
    const banner = document.createElement('div');
    banner.setAttribute('role', 'alert');
    banner.style.cssText = 'padding:1.25rem 1.5rem;margin:1rem;background:#3d1f1f;border:1px solid #8b3a3a;color:#f0d4d4;font:500 0.95rem/1.5 system-ui,sans-serif;border-radius:8px;';
    banner.textContent = message;
    const app = document.getElementById('round1-app');
    if (app) app.prepend(banner);
    else document.body.prepend(banner);
  }

  const DATA = window.ROUND1_DATA;
  if (!DATA) {
    showFatalError('Round 1 data failed to load. Run scripts/build-round1-web.ps1, then hard-refresh this page.');
    return;
  }
  if (!Array.isArray(DATA.sections) || !DATA.sections.length) {
    showFatalError('Round 1 data is empty or malformed. Re-run scripts/build-round1-web.ps1.');
    return;
  }
  if (!DATA.topics?.['1']?.round1Text) {
    showFatalError('Round 1 prayer text missing from data. Re-run scripts/build-round1-web.ps1, then hard-refresh.');
    return;
  }

  const CATALOG = window.LANGUAGE_CATALOG || {
    languages: [{ code: 'en', name: 'English', native: 'English' }],
    ui: {},
    defaultLanguage: 'en',
  };
  const STORAGE_KEY = 'lwm-round1-progress-v1';
  const LANG_STORAGE_KEY = 'lwm-round-prayer-lang';
  const CAL_MS = (DATA.calReturnMinutes || 2) * 60 * 1000;
  const CAL_CONSECUTIVE_NOS = 4;
  /** User code "sp" maps to existing Spanish "es". */
  const LANG_ALIASES = { sp: 'es' };

  const els = {
    phaseLabel: document.getElementById('round1-phase-label'),
    progress: document.getElementById('round1-progress'),
    phasePrayers: document.getElementById('phase-prayers'),
    sidebarSections: document.getElementById('round1-sidebar-sections'),
    topicNum: document.getElementById('round1-topic-num'),
    topicTitle: document.getElementById('round1-topic-title'),
    topicMeta: document.getElementById('round1-topic-meta'),
    prayerNote: document.getElementById('round1-prayer-note'),
    prayerText: document.getElementById('round1-prayer-text'),
    prayerScroll: document.getElementById('round1-prayer-scroll'),
    langSelect: document.getElementById('round1-lang'),
    langLabel: document.getElementById('round1-lang-label'),
    heartDialog: document.getElementById('round1-heart-dialog'),
    heartDismiss: document.getElementById('round1-heart-dismiss'),
    heartTitle: document.getElementById('round1-heart-title'),
    heartSub: document.getElementById('round1-heart-sub'),
    heartYes: document.getElementById('round1-heart-yes'),
    heartNo: document.getElementById('round1-heart-no'),
  };

  const prayerPackCache = Object.create(null);
  let activePack = null;
  const state = loadState();

  let pendingHeartCheck = false;
  let pendingNavigation = null;
  let calDepartedAt = null;
  let calDepartedSectionFirstTopic = null;
  let awaitingCalReturn = false;

  function normalizeLang(code) {
    const raw = String(code || 'en').toLowerCase();
    return LANG_ALIASES[raw] || raw;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = { ...defaultState(), ...parsed, heartAnswered: parsed.heartAnswered || [] };
        merged.currentTopic = clampTopic(merged.currentTopic);
        merged.phase = 'prayers';
        merged.language = normalizeLang(
          merged.language || localStorage.getItem(LANG_STORAGE_KEY) || CATALOG.defaultLanguage || 'en'
        );
        return merged;
      }
    } catch { /* ignore */ }
    return defaultState();
  }

  function defaultState() {
    let language = 'en';
    try {
      language = normalizeLang(localStorage.getItem(LANG_STORAGE_KEY) || CATALOG.defaultLanguage || 'en');
    } catch { /* ignore */ }
    return {
      phase: 'prayers',
      currentTopic: 1,
      visited: [],
      heartYes: [],
      heartAnswered: [],
      consecutiveNo: 0,
      language,
    };
  }

  function clampTopic(n) {
    const num = Number(n);
    if (!Number.isFinite(num) || num < 1) return 1;
    if (num > DATA.topicCount) return DATA.topicCount;
    return num;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(LANG_STORAGE_KEY, state.language);
    } catch { /* ignore */ }
  }

  function topicData(num) {
    return DATA.topics[String(clampTopic(num))];
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
    if (els.heartYes) els.heartYes.textContent = ui('heartYes', 'Yes');
    if (els.heartNo) els.heartNo.textContent = ui('heartNo', 'No');
    const rtl = !!(CATALOG.languages || []).find(l => l.code === state.language)?.rtl;
    document.documentElement.lang = state.language;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }

  function populateLanguageSelect() {
    if (!els.langSelect) return;
    const langs = Array.isArray(CATALOG.languages) ? CATALOG.languages : [];
    els.langSelect.innerHTML = '';
    langs.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = lang.native ? `${lang.native} (${lang.name})` : (lang.name || lang.code);
      els.langSelect.appendChild(opt);
    });
    if (![...els.langSelect.options].some(o => o.value === state.language)) {
      state.language = 'en';
    }
    els.langSelect.value = state.language;
  }

  async function loadPrayerPack(lang) {
    const code = normalizeLang(lang);
    if (code === 'en') {
      activePack = null;
      return null;
    }
    if (prayerPackCache[code]) {
      activePack = prayerPackCache[code];
      return activePack;
    }
    const res = await fetch(`prayers/${code}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load prayers/${code}.json (${res.status})`);
    const pack = await res.json();
    prayerPackCache[code] = pack;
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
      await loadPrayerPack(next);
    } catch (err) {
      console.error(err);
      showFatalError(`Could not load ${next} prayers. Falling back to English.`);
      state.language = 'en';
      activePack = null;
      if (els.langSelect) els.langSelect.value = 'en';
      applyUiChrome();
    }
    renderCurrentTopic();
  }

  function firstTopicOfSection(sectionId) {
    const sec = DATA.sections.find(s => s.id === sectionId);
    if (!sec?.topics?.length) return 1;
    return Math.min(...sec.topics.map(t => t.number));
  }

  function isSectionComplete(sectionId) {
    const sec = DATA.sections.find(s => s.id === sectionId);
    if (!sec?.topics?.length) return false;
    return sec.topics.every(t => state.heartYes.includes(t.number));
  }

  function updatePrincipalityCheck(el, sectionId) {
    if (!el) return;
    const complete = isSectionComplete(sectionId);
    el.classList.toggle('done', complete);
    el.textContent = complete ? '✅' : '☐';
  }

  function buildSidebar(onDone) {
    els.sidebarSections.innerHTML = '';
    const sections = DATA.sections;
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
          pName.textContent = section.name;
          pHead.appendChild(pName);
          secEl.appendChild(pHead);

          sorted = [...section.topics].sort((a, b) => a.number - b.number);
          topicIdx = 0;
        }

        while (topicIdx < sorted.length && count < BATCH) {
          const item = sorted[topicIdx++];
          const row = document.createElement('div');
          row.className = 'round2-sidebar-topic';
          row.dataset.topic = String(item.number);
          if (state.heartAnswered.includes(item.number)) row.classList.add('visited');
          if (state.heartYes.includes(item.number)) row.classList.add('done');
          if (item.number === state.currentTopic) row.classList.add('active');

          row.innerHTML = `
            <span class="round2-topic-check">${state.heartYes.includes(item.number) ? '✅' : '☐'}</span>
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

  function startPrayers() {
    state.phase = 'prayers';
    saveState();
    pendingNavigation = null;
    closeHeartDialog();
    renderCurrentTopic();
    buildSidebar();
  }

  function refreshSidebarMarks() {
    document.querySelectorAll('.round2-sidebar-topic').forEach(row => {
      const num = Number(row.dataset.topic);
      row.classList.toggle('visited', state.heartAnswered.includes(num));
      row.classList.toggle('done', state.heartYes.includes(num));
      const check = row.querySelector('.round2-topic-check');
      if (check) check.textContent = state.heartYes.includes(num) ? '✅' : '☐';
      row.classList.toggle('active', num === state.currentTopic);
    });
    DATA.sections.forEach(section => {
      const secEl = document.querySelector(`.round2-sidebar-section[data-section-id="${section.id}"]`);
      const pc = secEl?.querySelector('.round2-principality-check');
      updatePrincipalityCheck(pc, section.id);
    });
  }

  function renderCurrentTopic() {
    const num = clampTopic(state.currentTopic);
    state.currentTopic = num;
    const t = topicData(num);

    if (!t) {
      els.topicNum.textContent = pad(num);
      els.topicTitle.textContent = 'Topic not found';
      els.topicMeta.textContent = '';
      els.prayerText.textContent = 'Prayer text missing for this topic. Re-run scripts/build-round1-web.ps1.';
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
    els.prayerText.textContent = prayerTextForTopic(t.number) || '(No Round 1 prayer text.)';
    const progressTpl = ui('topicProgress', 'Topic {n} / {total}');
    els.progress.textContent = progressTpl
      .replace('{n}', String(t.number))
      .replace('{total}', String(DATA.topicCount));

    document.querySelectorAll('.round2-sidebar-topic').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.topic) === state.currentTopic);
    });

    if (els.prayerScroll) {
      els.prayerScroll.scrollTop = 0;
    }
  }

  function showHeartDialogForNavigation(targetNum) {
    if (state.phase !== 'prayers') return;

    pendingNavigation = clampTopic(targetNum);
    pendingHeartCheck = true;
    if (!els.heartDialog.open) {
      els.heartDialog.showModal();
    }
  }

  function requestTopicChange(targetNum) {
    const target = clampTopic(targetNum);
    const current = clampTopic(state.currentTopic);

    if (target === current) {
      document.querySelector(`.round2-sidebar-topic[data-topic="${target}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }

    if (state.heartAnswered.includes(current)) {
      goToTopic(target);
      return;
    }

    showHeartDialogForNavigation(target);
  }

  function updateSidebarTopic(num) {
    const row = document.querySelector(`.round2-sidebar-topic[data-topic="${num}"]`);
    if (!row) return;
    row.classList.add('visited');
    if (state.heartYes.includes(num)) {
      row.classList.add('done');
      const check = row.querySelector('.round2-topic-check');
      if (check) check.textContent = '✅';
    }
    const t = topicData(num);
    if (t?.sectionId) {
      const secEl = document.querySelector(`.round2-sidebar-section[data-section-id="${t.sectionId}"]`);
      updatePrincipalityCheck(secEl?.querySelector('.round2-principality-check'), t.sectionId);
    }
  }

  function goToTopic(num) {
    state.currentTopic = clampTopic(num);
    saveState();
    renderCurrentTopic();
    refreshSidebarMarks();
    document.querySelector(`.round2-sidebar-topic[data-topic="${state.currentTopic}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function closeHeartDialog() {
    if (els.heartDialog?.open) els.heartDialog.close();
  }

  function dismissHeartDialogOnly() {
    if (els.heartDialog?.open) els.heartDialog.close();
  }

  function advanceAfterHeart(yes) {
    const destination = pendingNavigation;
    pendingNavigation = null;
    pendingHeartCheck = false;
    if (els.heartDialog?.open) els.heartDialog.close();

    const current = clampTopic(state.currentTopic);

    if (!state.heartAnswered.includes(current)) {
      state.heartAnswered.push(current);
    }
    if (!state.visited.includes(current)) {
      state.visited.push(current);
    }

    let openCalSilently = false;
    if (yes) {
      if (!state.heartYes.includes(current)) state.heartYes.push(current);
      state.consecutiveNo = 0;
    } else {
      state.consecutiveNo += 1;
      if (state.consecutiveNo >= CAL_CONSECUTIVE_NOS) {
        openCalSilently = true;
        const t = topicData(current);
        calDepartedSectionFirstTopic = t?.sectionId
          ? firstTopicOfSection(t.sectionId)
          : current;
        state.consecutiveNo = 0;
      }
    }

    saveState();
    updateSidebarTopic(current);

    window.setTimeout(() => {
      if (destination) {
        goToTopic(destination);
      }

      if (openCalSilently && DATA.calLink) {
        calDepartedAt = Date.now();
        awaitingCalReturn = true;
        window.open(DATA.calLink, '_blank', 'noopener,noreferrer');
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

  els.heartYes.addEventListener('click', () => advanceAfterHeart(true));
  els.heartNo.addEventListener('click', () => advanceAfterHeart(false));
  els.heartDismiss.addEventListener('click', () => dismissHeartDialogOnly());

  els.heartDialog.addEventListener('cancel', e => {
    e.preventDefault();
  });

  els.heartDialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dismissHeartDialogOnly();
    }
  });

  if (els.langSelect) {
    els.langSelect.addEventListener('change', () => {
      setLanguage(els.langSelect.value);
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') handleCalReturn();
  });
  window.addEventListener('focus', () => handleCalReturn());

  (async () => {
    try {
      populateLanguageSelect();
      applyUiChrome();
      await loadPrayerPack(state.language);
      startPrayers();
    } catch (err) {
      showFatalError(`Round 1 failed to initialize: ${err.message}`);
      console.error(err);
    }
  })();
})();
