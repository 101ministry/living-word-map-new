(() => {
  const overlay = document.getElementById('ask-overlay');
  const card = overlay?.querySelector('.ask-overlay-card');
  const form = document.getElementById('ask-overlay-form');
  const input = document.getElementById('ask-overlay-input');
  if (!overlay || !form || !input) return;

  const MAX_TOPICS = 5;
  const GENERIC_STARTER_NUMBERS = [574, 130, 8, 75, 1];
  const COUNTDOWN_SEC = 30;
  const COUNTDOWN_DELAY_MS = 10000;
  const BLINK_COUNT = 5;

  const STOP = new Set([
    'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'from',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'can',
    'could', 'would', 'should', 'will', 'my', 'me', 'i', 'we', 'you', 'it', 'this',
    'that', 'these', 'those', 'what', 'why', 'how', 'when', 'where', 'who', 'which',
    'about', 'please', 'help', 'question', 'ask', 'wondering', 'keep', 'keeps',
    'running', 'happening', 'something', 'someone', 'people', 'person', 'life',
  ]);

  const WEAK = new Set([
    'bloodline', 'repentance', 'blood', 'spirit', 'spirits', 'spiritual',
    'generational', 'family', 'curse', 'curses', 'iniquity',
  ]);

  const SYNONYMS = {
    angry: ['anger', 'rage', 'wrath'],
    anger: ['rage', 'wrath'],
    mad: ['anger', 'rage'],
    hate: ['hatred'],
    jealous: ['jealousy'],
    scared: ['fear', 'anxiety'],
    afraid: ['fear'],
    anxious: ['anxiety', 'fear'],
    panic: ['anxiety', 'fear', 'phobias'],
    depressed: ['depression', 'despair', 'hopelessness'],
    depression: ['despair', 'hopelessness', 'sadness'],
    suicide: ['suicidal', 'suicide'],
    suicidal: ['suicide'],
    lonely: ['loneliness'],
    porn: ['pornography'],
    porno: ['pornography'],
    pornography: ['lust'],
    addicted: ['addiction', 'bondage'],
    addiction: ['bondage'],
    cheating: ['adultery'],
    affair: ['adultery'],
    divorced: ['divorce'],
    gay: ['homosexuality', 'lesbianism'],
    homosexual: ['homosexuality'],
    lesbian: ['lesbianism'],
    occult: ['witchcraft', 'divination', 'wicca'],
    witch: ['witchcraft', 'wicca'],
    ouija: ['ouija'],
    tarot: ['tarot'],
    horoscope: ['horoscopes', 'astrology'],
    astrology: ['horoscopes'],
    freemason: ['freemasonry'],
    masonic: ['freemasonry'],
    ancestor: ['unsaved', 'family', 'relatives'],
    ancestors: ['unsaved', 'family', 'relatives'],
    generational: ['unsaved', 'family', 'relatives'],
    hex: ['witchcraft', 'hexes'],
    vex: ['witchcraft', 'vexes'],
    masturbate: ['masturbation'],
    obese: ['overweight'],
    fat: ['obese', 'overweight'],
    ugly: ['ugly'],
    pride: ['proud', 'haughtiness', 'arrogance'],
    proud: ['pride', 'arrogance'],
    control: ['controlling', 'manipulation'],
    controlling: ['control', 'domineering'],
    lie: ['lying', 'lies', 'deception'],
    lying: ['lies', 'deception'],
    doubt: ['unbelief'],
    unbelief: ['doubt'],
  };

  const state = {
    question: '',
    matches: [],
    videos: [],
    generic: false,
    countdownTimer: null,
    countdownDelayTimer: null,
    countdownRemaining: COUNTDOWN_SEC,
    answerVisibleAt: 0,
    countdownToken: 0,
    blinkTimer: null,
    blinkHandler: null,
  };

  function graphData() {
    return window.GRAPH_DATA || null;
  }

  function topicIndex() {
    return window.VIDEO_DATA?.topicIndex || {};
  }

  function videos() {
    return window.VIDEO_DATA?.videos || [];
  }

  function lookupById(list, id) {
    return list.find(item => item.id === id) || null;
  }

  function topicRootIds(topic) {
    if (topic?.rootIds?.length) return topic.rootIds;
    if (topic?.rootId) return [topic.rootId];
    return [];
  }

  function topicFruitIds(topic) {
    if (topic?.fruitIds?.length) return topic.fruitIds;
    if (topic?.fruitId) return [topic.fruitId];
    return [];
  }

  function topicPrincipalityIds(topic) {
    if (topic?.principalityIds?.length) return topic.principalityIds;
    if (topic?.principalityId) return [topic.principalityId];
    return [];
  }

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function tokenize(text) {
    return normalize(text).split(/\s+/).filter(tok => tok.length >= 3 && !STOP.has(tok));
  }

  function expandTokens(tokens) {
    const out = new Set(tokens);
    tokens.forEach(tok => {
      (SYNONYMS[tok] || []).forEach(alias => out.add(alias));
    });
    return [...out];
  }

  function phrasesFrom(tokens) {
    const phrases = [];
    for (let n = 3; n >= 2; n--) {
      for (let i = 0; i + n <= tokens.length; i++) {
        phrases.push(tokens.slice(i, i + n).join(' '));
      }
    }
    return phrases;
  }

  function formatTime(seconds) {
    if (window.TeachingVideos?.formatTime) return window.TeachingVideos.formatTime(seconds);
    const s = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function videoLabel(entry) {
    if (!entry) return '';
    const part = entry.part > 1 ? ` Part ${entry.part}` : '';
    const time = entry.startSeconds ? ` · ${formatTime(entry.startSeconds)}` : '';
    return `Day ${entry.day}${part}${time}`;
  }

  let records = null;

  function buildRecords() {
    const data = graphData();
    if (!data?.topics) return [];
    const { topics, roots = [], fruits = [], principalities = [] } = data;
    return topics.map(topic => {
      const rootNames = topicRootIds(topic).map(id => lookupById(roots, id)?.name).filter(Boolean);
      const fruitNames = topicFruitIds(topic).map(id => lookupById(fruits, id)?.name).filter(Boolean);
      const prinNames = topicPrincipalityIds(topic).map(id => lookupById(principalities, id)?.name).filter(Boolean);
      const nameNorm = normalize(topic.name);
      return {
        topic,
        nameNorm,
        nameTokens: new Set(tokenize(topic.name)),
        rootNorm: normalize(rootNames.join(' ')),
        fruitNorm: normalize(fruitNames.join(' ')),
        prinNorm: normalize(prinNames.join(' ')),
        haystack: normalize([topic.name, ...rootNames, ...fruitNames, ...prinNames].join(' ')),
      };
    });
  }

  function getRecords() {
    if (!records) records = buildRecords();
    return records;
  }

  function scoreRecord(record, tokens, phrases, queryNorm) {
    let score = 0;
    if (queryNorm.length >= 8 && record.haystack.includes(queryNorm)) score += 90;
    phrases.forEach(phrase => {
      if (record.nameNorm.includes(phrase)) score += 55 + phrase.length;
      else if (record.haystack.includes(phrase)) score += 22;
    });
    tokens.forEach(tok => {
      const weak = WEAK.has(tok) ? 0.25 : 1;
      if (record.nameTokens.has(tok)) score += 42 * weak;
      else if ([...record.nameTokens].some(word => word.startsWith(tok) || tok.startsWith(word))) {
        score += 16 * weak;
      }
      if (record.rootNorm.includes(tok)) score += 12 * weak;
      if (record.fruitNorm.includes(tok)) score += 12 * weak;
      if (record.prinNorm.includes(tok)) score += 10 * weak;
    });
    return score;
  }

  function topicByNumber(number) {
    return graphData()?.topics?.find(t => t.number === number) || null;
  }

  function matchQuestion(question) {
    const queryNorm = normalize(question);
    const rawTokens = tokenize(question);
    const tokens = expandTokens(rawTokens);
    const phrases = phrasesFrom(rawTokens);
    const scored = getRecords()
      .map(record => ({ record, score: scoreRecord(record, tokens, phrases, queryNorm) }))
      .filter(row => row.score >= 18)
      .sort((a, b) => b.score - a.score);

    const strong = scored.filter(row => row.score >= 28);
    const generic = !rawTokens.some(tok => !WEAK.has(tok)) || strong.length === 0;

    let matchedTopics;
    if (generic) {
      const starters = GENERIC_STARTER_NUMBERS
        .map(topicByNumber)
        .filter(Boolean);
      const extras = scored.slice(0, MAX_TOPICS).map(row => row.record.topic);
      const seen = new Set();
      matchedTopics = [...starters, ...extras].filter(topic => {
        if (seen.has(topic.number)) return false;
        seen.add(topic.number);
        return true;
      }).slice(0, MAX_TOPICS);
    } else {
      matchedTopics = strong.slice(0, MAX_TOPICS).map(row => row.record.topic);
    }

    const videoMap = new Map();
    matchedTopics.forEach(topic => {
      const entry = topicIndex()[String(topic.number)];
      if (!entry?.videoKey && !entry?.youtubeId) return;
      const key = entry.videoKey || `${entry.youtubeId}-${entry.day}`;
      if (videoMap.has(key)) return;
      const video = videos().find(v => v.key === entry.videoKey) || null;
      videoMap.set(key, { ...entry, topicNumber: topic.number, topicName: topic.name, video });
    });

    if (generic && videoMap.size === 0) {
      ['day-1-part-1', 'day-9-part-1'].forEach(key => {
        const video = videos().find(v => v.key === key);
        if (video) {
          videoMap.set(key, {
            videoKey: key,
            day: video.day,
            part: video.part,
            youtubeId: video.youtubeId,
            startSeconds: 0,
            topicNumber: video.topicStart,
            topicName: video.title,
            video,
          });
        }
      });
    }

    return {
      generic,
      topics: matchedTopics,
      videos: [...videoMap.values()],
    };
  }

  function isConstellationView() {
    const value = document.getElementById('view-mode')?.value || 'constellation';
    return value === 'constellation' || value === 'ask';
  }

  function formatCountdown(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    return `${String(s).padStart(2, '0')} seconds`;
  }

  function stopBlink() {
    if (state.blinkTimer) {
      clearTimeout(state.blinkTimer);
      state.blinkTimer = null;
    }
    const box = document.getElementById('ask-countdown-box');
    if (box && state.blinkHandler) {
      box.removeEventListener('animationend', state.blinkHandler);
      state.blinkHandler = null;
    }
    box?.classList.remove('is-blinking', 'is-blink-off');
  }

  function stopCountdown() {
    if (state.countdownTimer) {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
    }
  }

  function stopCountdownDelay() {
    if (state.countdownDelayTimer) {
      clearTimeout(state.countdownDelayTimer);
      state.countdownDelayTimer = null;
    }
  }

  function hideCountdownBox() {
    stopCountdown();
    stopCountdownDelay();
    stopBlink();
    state.countdownRemaining = COUNTDOWN_SEC;
    const countdownBox = document.getElementById('ask-countdown-box');
    const display = document.getElementById('ask-countdown');
    if (countdownBox) countdownBox.hidden = true;
    if (display) display.textContent = formatCountdown(COUNTDOWN_SEC);
  }

  function hidePostAnswer() {
    hideCountdownBox();
    state.answerVisibleAt = 0;
    state.countdownToken += 1;
    const status = document.getElementById('ask-share-status');
    if (status) status.textContent = '';
  }

  function blinkThenClose(token) {
    const box = document.getElementById('ask-countdown-box');
    if (overlay.hidden || token !== state.countdownToken) return;
    if (!box) {
      closeOverlay();
      return;
    }
    stopBlink();
    const finish = () => {
      if (overlay.hidden || token !== state.countdownToken) return;
      closeOverlay();
    };
    state.blinkHandler = event => {
      if (event.target !== box) return;
      if (event.elapsedTime < 1.45 * BLINK_COUNT - 0.3) return;
      finish();
    };
    box.addEventListener('animationend', state.blinkHandler);
    box.classList.add('is-blinking');
    state.blinkTimer = setTimeout(finish, 1450 * BLINK_COUNT + 250);
  }

  function startCountdown() {
    if (overlay.hidden) return;
    if (!state.answerVisibleAt) return;
    if (Date.now() - state.answerVisibleAt < COUNTDOWN_DELAY_MS - 250) return;
    const countdownBox = document.getElementById('ask-countdown-box');
    const display = document.getElementById('ask-countdown');
    const token = state.countdownToken;
    stopCountdown();
    stopBlink();
    state.countdownRemaining = COUNTDOWN_SEC;
    if (display) display.textContent = formatCountdown(state.countdownRemaining);
    if (countdownBox) countdownBox.hidden = false;
    state.countdownTimer = setInterval(() => {
      if (state.countdownRemaining > 0) state.countdownRemaining -= 1;
      if (display) display.textContent = formatCountdown(state.countdownRemaining);
      if (state.countdownRemaining <= 0) {
        stopCountdown();
        blinkThenClose(token);
      }
    }, 1000);
  }

  function showShareSection() {
    const status = document.getElementById('ask-share-status');
    if (status) status.textContent = '';
  }

  function scheduleCountdownAfterAnswer() {
    hideCountdownBox();
    const token = ++state.countdownToken;
    const shownAt = state.answerVisibleAt;
    state.countdownDelayTimer = setTimeout(() => {
      if (token !== state.countdownToken) return;
      if (shownAt !== state.answerVisibleAt) return;
      startCountdown();
    }, COUNTDOWN_DELAY_MS);
  }

  function hideDiscussInvite() {
    document.getElementById('detail-discuss-invite')?.classList.add('hidden');
  }

  function hideAnswerPanel() {
    document.getElementById('ask-answer-panel')?.classList.add('hidden');
    hideDiscussInvite();
  }

  function showDiscussInvite() {
    const invite = document.getElementById('detail-discuss-invite');
    const panel = document.getElementById('ask-answer-panel');
    invite?.classList.remove('hidden');
    if (panel) panel.classList.remove('hidden');
  }

  function restoreViewSelect() {
    const viewMode = document.getElementById('view-mode');
    if (viewMode && (viewMode.value === 'ask' || viewMode.value === 'compare')) {
      viewMode.value = 'constellation';
    }
  }

  function openOverlay(reset = false) {
    restoreViewSelect();
    if (reset) {
      hidePostAnswer();
      state.question = '';
      state.matches = [];
      state.videos = [];
      state.generic = false;
      input.value = '';
      hideAnswerPanel();
    }
    overlay.hidden = false;
    requestAnimationFrame(() => input.focus());
  }

  function closeOverlay() {
    hideCountdownBox();
    overlay.hidden = true;
    restoreViewSelect();
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderAnswers() {
    const panel = document.getElementById('ask-answer-panel');
    const echo = document.getElementById('ask-answer-echo');
    const note = document.getElementById('ask-answer-note');
    const topicsEl = document.getElementById('ask-answer-topics');
    const videosEl = document.getElementById('ask-answer-videos');
    if (!panel || !topicsEl || !videosEl) return false;

    echo.textContent = `“${state.question}”`;
    note.textContent = state.generic
      ? 'This sounds like a general Bloodline Repentance question. Start with these topics and teachings — every topic on the map is a bloodline issue.'
      : 'These topics and teachings are the closest match.';

    topicsEl.innerHTML = state.matches.length
      ? state.matches.map(topic => `
          <button type="button" class="ask-result-btn" data-topic="${topic.number}">
            <span class="ask-result-name">${escapeHtml(topic.name)}</span>
          </button>`).join('')
      : '<p class="ask-result-empty">No matching topic yet. Try another wording, or browse the constellation.</p>';

    videosEl.innerHTML = state.videos.length
      ? state.videos.map(entry => `
          <button type="button" class="ask-result-btn" data-video-topic="${entry.topicNumber}" data-video-key="${escapeHtml(entry.videoKey || '')}">
            <span class="ask-result-meta">${escapeHtml(videoLabel(entry))}</span>
            <span class="ask-result-name">${escapeHtml(entry.topicName || entry.video?.title || 'Teaching video')}</span>
          </button>`).join('')
      : '<p class="ask-result-empty">No teaching timestamp is indexed for these topics yet. The topic still has the prayer.</p>';

    topicsEl.querySelectorAll('[data-topic]').forEach(btn => {
      btn.addEventListener('click', () => {
        const number = Number(btn.dataset.topic);
        window.LivingWordMap?.selectTopicByNumber?.(number, { scrollTeaching: false });
      });
    });

    videosEl.querySelectorAll('[data-video-topic]').forEach(btn => {
      btn.addEventListener('click', () => {
        const number = Number(btn.dataset.videoTopic);
        window.LivingWordMap?.selectTopicByNumber?.(number, { scrollTeaching: false });
        const opened = window.TeachingVideos?.openTopicVideo?.(number);
        if (!opened && btn.dataset.videoKey) {
          window.TeachingVideos?.selectVideoByKey?.(btn.dataset.videoKey);
        }
        document.getElementById('teaching-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    document.getElementById('detail-empty')?.classList.add('hidden');
    panel.hidden = false;
    panel.classList.remove('hidden');
    showDiscussInvite();
    window.LivingWordMap?.openDetailSheet?.();
    state.answerVisibleAt = Date.now();
    return true;
  }

  function sharePayload() {
    const topicLines = state.matches
      .map(t => `#${String(t.number).padStart(3, '0')} ${t.name}`)
      .join('\n');
    const url = window.location.href.split('#')[0];
    const text = [
      'Bloodline Repentance — Living Word Map',
      state.question ? `Question: ${state.question}` : '',
      topicLines ? `Topics:\n${topicLines}` : '',
      url,
    ].filter(Boolean).join('\n\n');
    return { title: 'Bloodline Repentance — Living Word Map', text, url };
  }

  async function shareAnswer() {
    const payload = sharePayload();
    const status = document.getElementById('ask-share-status');
    if (navigator.share) {
      try {
        await navigator.share(payload);
        status.textContent = 'Share sheet opened.';
        return;
      } catch (err) {
        if (err?.name === 'AbortError') {
          status.textContent = '';
          return;
        }
      }
    }
    await copyAnswer();
  }

  async function copyAnswer() {
    const payload = sharePayload();
    const status = document.getElementById('ask-share-status');
    try {
      await navigator.clipboard.writeText(payload.text);
      status.textContent = 'Copied. Paste it to a friend.';
      closeOverlay();
    } catch {
      status.textContent = 'Copy failed. Select and copy the text from the address bar instead.';
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) {
      input.focus();
      return;
    }
    const result = matchQuestion(question);
    state.question = question;
    state.matches = result.topics;
    state.videos = result.videos;
    state.generic = result.generic;
    const shown = renderAnswers();
    if (!shown) return;
    showShareSection();
    scheduleCountdownAfterAnswer();
  });

  document.getElementById('ask-overlay-close')?.addEventListener('click', closeOverlay);
  document.getElementById('ask-share-btn')?.addEventListener('click', () => {
    shareAnswer();
  });
  document.getElementById('ask-share-copy')?.addEventListener('click', () => {
    copyAnswer();
  });

  card?.addEventListener('pointerdown', event => event.stopPropagation());
  overlay.addEventListener('pointerdown', event => {
    if (event.target === overlay) event.stopPropagation();
  });

  document.getElementById('view-mode')?.addEventListener('change', () => {
    const value = document.getElementById('view-mode')?.value;
    if (value !== 'constellation' && value !== 'ask') closeOverlay();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !overlay.hidden) closeOverlay();
  });

  function parchmentIsOpen() {
    return document.getElementById('pdf-landing')?.classList.contains('is-open');
  }

  if (isConstellationView() && !parchmentIsOpen()) openOverlay(true);

  window.AskOverlay = { open: openOverlay, close: closeOverlay };
})();
