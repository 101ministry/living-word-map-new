(() => {
  'use strict';

  function showFatalError(message) {
    const banner = document.createElement('div');
    banner.setAttribute('role', 'alert');
    banner.style.cssText = 'padding:1.25rem 1.5rem;margin:1rem;background:#3d1f1f;border:1px solid #8b3a3a;color:#f0d4d4;font:500 0.95rem/1.5 system-ui,sans-serif;border-radius:8px;';
    banner.textContent = message;
    const app = document.getElementById('round2-app');
    if (app) app.prepend(banner);
    else document.body.prepend(banner);
  }

  const DATA = window.ROUND2_DATA;
  if (!DATA) {
    showFatalError('Round 2 data failed to load. Run scripts/build-round2-web.ps1, then hard-refresh this page.');
    return;
  }
  if (!Array.isArray(DATA.sections) || !DATA.sections.length) {
    showFatalError('Round 2 data is empty or malformed. Re-run scripts/build-round2-web.ps1.');
    return;
  }
  if (!DATA.topics?.['1']?.round2Text) {
    showFatalError('Round 2 prayer text missing from data. Re-run scripts/build-round2-web.ps1, then hard-refresh.');
    return;
  }

  const STORAGE_KEY = 'lwm-round2-progress-v1';
  const CAL_MS = (DATA.calReturnMinutes || 2) * 60 * 1000;
  const CAL_CONSECUTIVE_NOS = 4;

  const els = {
    phaseLabel: document.getElementById('round2-phase-label'),
    progress: document.getElementById('round2-progress'),
    phaseOverview: document.getElementById('phase-overview'),
    phaseRound2: document.getElementById('phase-round2'),
    gate: document.getElementById('round2-gate'),
    gateYes: document.getElementById('round2-gate-yes'),
    gateNo: document.getElementById('round2-gate-no'),
    overviewSections: document.getElementById('round2-overview-sections'),
    sidebarSections: document.getElementById('round2-sidebar-sections'),
    topicNum: document.getElementById('round2-topic-num'),
    topicTitle: document.getElementById('round2-topic-title'),
    topicMeta: document.getElementById('round2-topic-meta'),
    topicVideoWrap: document.getElementById('round2-topic-video-wrap'),
    topicVideoLink: document.getElementById('round2-topic-video'),
    prayerText: document.getElementById('round2-prayer-text'),
    prayerScroll: document.getElementById('round2-prayer-scroll'),
    heartDialog: document.getElementById('round2-heart-dialog'),
    heartDismiss: document.getElementById('round2-heart-dismiss'),
    heartYes: document.getElementById('round2-heart-yes'),
    heartNo: document.getElementById('round2-heart-no'),
  };

  const state = loadState();
  const entryFromMap = new URLSearchParams(window.location.search).get('from') === 'map';
  if (entryFromMap) {
    state.phase = 'overview';
    saveState();
  }

  let pendingHeartCheck = false;
  let pendingNavigation = null;
  let calDepartedAt = null;
  let calDepartedSectionFirstTopic = null;
  let awaitingCalReturn = false;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = { ...defaultState(), ...parsed, heartAnswered: parsed.heartAnswered || [] };
        merged.currentTopic = clampTopic(merged.currentTopic);
        return merged;
      }
    } catch { /* ignore */ }
    return defaultState();
  }

  function defaultState() {
    return {
      phase: 'overview',
      currentTopic: 1,
      visited: [],
      heartYes: [],
      heartAnswered: [],
      consecutiveNo: 0,
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
    } catch { /* ignore */ }
  }

  function topicData(num) {
    return DATA.topics[String(clampTopic(num))];
  }

  function pad(n) {
    return String(n).padStart(3, '0');
  }

  function topicVideoEntry(num) {
    return window.VIDEO_DATA?.topicIndex?.[String(num)] || null;
  }

  function topicYoutubeUrl(num) {
    const entry = topicVideoEntry(num);
    if (!entry?.youtubeId) return null;
    const base = `https://www.youtube.com/watch?v=${entry.youtubeId}`;
    const start = Number(entry.startSeconds);
    if (Number.isFinite(start) && start > 0) {
      return `${base}&t=${Math.floor(start)}s`;
    }
    return base;
  }

  function topicVideoLabel(entry) {
    if (!entry?.day) return 'Watch on YouTube';
    const part = entry.part > 1 ? ` Part ${entry.part}` : '';
    return `Watch on YouTube (Day ${entry.day}${part})`;
  }

  function renderTopicVideoLink(num, wrapEl, linkEl) {
    if (!wrapEl || !linkEl) return;
    const entry = topicVideoEntry(num);
    const url = topicYoutubeUrl(num);
    if (url) {
      linkEl.href = url;
      linkEl.textContent = topicVideoLabel(entry);
      wrapEl.classList.remove('hidden');
    } else {
      wrapEl.classList.add('hidden');
      linkEl.removeAttribute('href');
    }
  }

  function firstTopicOfSection(sectionId) {
    const sec = DATA.sections.find(s => s.id === sectionId);
    if (!sec?.topics?.length) return 1;
    return Math.min(...sec.topics.map(t => t.number));
  }

  function isSectionComplete(sectionId) {
    const sec = DATA.sections.find(s => s.id === sectionId);
    if (!sec) return false;
    return sec.topics.every(t => state.heartAnswered.includes(t.number));
  }

  function createOverviewCard(t) {
    const card = document.createElement('div');
    card.className = 'round2-overview-card';
    const videoUrl = topicYoutubeUrl(t.number);
    const videoEntry = topicVideoEntry(t.number);
    const videoLinkHtml = videoUrl
      ? `<a class="round2-overview-video-link" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(topicVideoLabel(videoEntry))}</a>`
      : '';
    card.innerHTML = `
      <span class="round2-overview-num">${pad(t.number)}</span>
      <div>
        <p class="round2-overview-title">${escapeHtml(t.label)}</p>
        ${videoLinkHtml}
        ${t.round1Preview ? `<p class="round2-overview-snippet">${escapeHtml(t.round1Preview)}</p>` : ''}
        <div class="round2-snapshot-tags">
          ${t.root ? `<span class="round2-tag root">Root: ${escapeHtml(t.root)}</span>` : ''}
          ${t.fruitDisplay ? `<span class="round2-tag fruit">Fruit: ${escapeHtml(t.fruitDisplay)}</span>` : ''}
        </div>
      </div>`;
    return card;
  }

  /** Render overview cards in batches so 666 nodes do not block the main thread. */
  function buildOverview(onDone) {
    els.overviewSections.innerHTML = '';
    const sections = DATA.sections;
    let sectionIdx = 0;
    let topicIdx = 0;
    let wrap = null;
    let sorted = null;
    const BATCH = 30;

    function renderBatch() {
      let count = 0;
      while (sectionIdx < sections.length && count < BATCH) {
        const section = sections[sectionIdx];
        if (!wrap) {
          wrap = document.createElement('div');
          wrap.className = 'round2-overview-section';
          const h = document.createElement('h3');
          h.textContent = section.name;
          wrap.appendChild(h);
          sorted = [...section.topics].sort((a, b) => a.number - b.number);
          topicIdx = 0;
        }

        while (topicIdx < sorted.length && count < BATCH) {
          const item = sorted[topicIdx++];
          const t = topicData(item.number);
          if (t) {
            wrap.appendChild(createOverviewCard(t));
            count += 1;
          }
        }

        if (topicIdx >= sorted.length) {
          els.overviewSections.appendChild(wrap);
          wrap = null;
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
          pCheck.className = 'round2-principality-check' + (isSectionComplete(section.id) ? ' done' : '');
          pCheck.textContent = '✅';
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

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setPhase(phase) {
    state.phase = phase;
    saveState();
    const isOverview = phase === 'overview';
    const isRound2 = phase === 'round2';
    els.phaseOverview.classList.toggle('hidden', !isOverview);
    els.phaseRound2.classList.toggle('hidden', !isRound2);
    els.phaseLabel.textContent = isOverview ? 'Round 1 overview' : 'Round 2 · generational prayer';
    document.body.classList.toggle('round2-active', isRound2);
    if (isOverview) {
      els.progress.textContent = `${DATA.topicCount} topics · Round 1 review`;
    }
    if (isRound2) {
      pendingNavigation = null;
      closeHeartDialog();
      renderCurrentTopic();
      buildSidebar();
    }
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
      if (pc) pc.classList.toggle('done', isSectionComplete(section.id));
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
      els.topicVideoWrap?.classList.add('hidden');
      els.topicVideoLink?.removeAttribute('href');
      els.prayerText.textContent = 'Prayer text missing for this topic. Re-run scripts/build-round2-web.ps1.';
      return;
    }

    els.topicNum.textContent = pad(t.number);
    els.topicTitle.textContent = t.label;
    const metaParts = [];
    if (t.root) metaParts.push(`Root: ${t.root}`);
    if (t.fruitDisplay) metaParts.push(`Fruit: ${t.fruitDisplay}`);
    if (t.principality) metaParts.push(`Principality: ${t.principality}`);
    els.topicMeta.textContent = metaParts.join(' · ');
    renderTopicVideoLink(t.number, els.topicVideoWrap, els.topicVideoLink);
    els.prayerText.textContent = t.round2Text || '(No Round 2 prayer text.)';
    els.progress.textContent = `Topic ${t.number} / ${DATA.topicCount}`;

    document.querySelectorAll('.round2-sidebar-topic').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.topic) === state.currentTopic);
    });

    if (els.prayerScroll) {
      els.prayerScroll.scrollTop = 0;
    }
  }

  function showHeartDialogForNavigation(targetNum) {
    if (state.phase !== 'round2') return;

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
      if (secEl && isSectionComplete(t.sectionId)) {
        const pc = secEl.querySelector('.round2-principality-check');
        if (pc) pc.classList.add('done');
      }
    }
  }

  function goToTopic(num) {
    state.currentTopic = clampTopic(num);
    saveState();
    renderCurrentTopic();
    refreshSidebarMarks();
    const row = document.querySelector(`.round2-sidebar-topic[data-topic="${state.currentTopic}"]`);
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function closeHeartDialog() {
    if (els.heartDialog.open) els.heartDialog.close();
  }

  /** Close dialog without answering; navigation stays blocked until Yes/No. */
  function dismissHeartDialogOnly() {
    if (els.heartDialog.open) els.heartDialog.close();
  }

  function advanceAfterHeart(yes) {
    const destination = pendingNavigation;
    pendingNavigation = null;
    pendingHeartCheck = false;
    if (els.heartDialog.open) els.heartDialog.close();

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

      if (openCalSilently) {
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

  // Events
  els.gateYes.addEventListener('click', () => setPhase('round2'));
  els.gateNo.addEventListener('click', () => { window.location.href = 'index.html'; });

  els.heartYes.addEventListener('click', () => advanceAfterHeart(true));
  els.heartNo.addEventListener('click', () => advanceAfterHeart(false));
  els.heartDismiss.addEventListener('click', () => dismissHeartDialogOnly());

  // Block backdrop click from closing; Escape is handled via keydown below.
  els.heartDialog.addEventListener('cancel', e => {
    e.preventDefault();
  });

  els.heartDialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dismissHeartDialogOnly();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') handleCalReturn();
  });
  window.addEventListener('focus', () => handleCalReturn());

  // Init — show overview + gate immediately; resume Round 2 only on return visits.
  try {
    if (state.phase === 'round2' && !entryFromMap) {
      setPhase('round2');
    } else {
      setPhase('overview');
      buildOverview();
    }
  } catch (err) {
    showFatalError(`Round 2 failed to initialize: ${err.message}`);
    console.error(err);
  }
})();
