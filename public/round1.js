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

  const STORAGE_KEY = 'lwm-round1-progress-v1';

  const els = {
    phaseLabel: document.getElementById('round1-phase-label'),
    progress: document.getElementById('round1-progress'),
    phaseOverview: document.getElementById('phase-overview'),
    phasePrayers: document.getElementById('phase-prayers'),
    gateYes: document.getElementById('round1-gate-yes'),
    gateNo: document.getElementById('round1-gate-no'),
    overviewSections: document.getElementById('round1-overview-sections'),
    sidebarSections: document.getElementById('round1-sidebar-sections'),
    topicNum: document.getElementById('round1-topic-num'),
    topicTitle: document.getElementById('round1-topic-title'),
    topicMeta: document.getElementById('round1-topic-meta'),
    topicVideoWrap: document.getElementById('round1-topic-video-wrap'),
    topicVideoLink: document.getElementById('round1-topic-video'),
    prayerText: document.getElementById('round1-prayer-text'),
    prayerScroll: document.getElementById('round1-prayer-scroll'),
  };

  const state = loadState();
  const entryFromMap = new URLSearchParams(window.location.search).get('from') === 'map';
  if (entryFromMap) {
    state.phase = 'overview';
    saveState();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = { ...defaultState(), ...parsed };
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

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
          pHead.className = 'round2-sidebar-principality round1-sidebar-principality';
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
          row.className = 'round2-sidebar-topic round1-sidebar-topic';
          row.dataset.topic = String(item.number);
          if (item.number === state.currentTopic) row.classList.add('active');

          row.innerHTML = `
            <span class="round2-sidebar-topic-num">${pad(item.number)}</span>
            <span class="round2-sidebar-topic-label">${escapeHtml(item.label)}</span>`;
          row.addEventListener('click', () => goToTopic(item.number));
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

  function setPhase(phase) {
    state.phase = phase;
    saveState();
    const isOverview = phase === 'overview';
    const isPrayers = phase === 'prayers';
    els.phaseOverview.classList.toggle('hidden', !isOverview);
    els.phasePrayers.classList.toggle('hidden', !isPrayers);
    els.phaseLabel.textContent = isOverview ? 'Topic overview' : 'Round 1 · personal confession';
    document.body.classList.toggle('round2-active', isPrayers);
    if (isOverview) {
      els.progress.textContent = `${DATA.topicCount} topics · review`;
    }
    if (isPrayers) {
      renderCurrentTopic();
      buildSidebar();
    }
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
    renderTopicVideoLink(t.number, els.topicVideoWrap, els.topicVideoLink);
    els.prayerText.textContent = t.round1Text || '(No Round 1 prayer text.)';
    els.progress.textContent = `Topic ${t.number} / ${DATA.topicCount}`;

    document.querySelectorAll('.round2-sidebar-topic').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.topic) === state.currentTopic);
    });

    if (els.prayerScroll) {
      els.prayerScroll.scrollTop = 0;
    }
  }

  function goToTopic(num) {
    state.currentTopic = clampTopic(num);
    saveState();
    renderCurrentTopic();
    document.querySelector(`.round2-sidebar-topic[data-topic="${state.currentTopic}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  els.gateYes.addEventListener('click', () => setPhase('prayers'));
  els.gateNo.addEventListener('click', () => { window.location.href = 'index.html'; });

  try {
    if (state.phase === 'prayers' && !entryFromMap) {
      setPhase('prayers');
    } else {
      setPhase('overview');
      buildOverview();
    }
  } catch (err) {
    showFatalError(`Round 1 failed to initialize: ${err.message}`);
    console.error(err);
  }
})();
