(() => {
  const data = window.VIDEO_DATA;
  if (!data?.videos?.length) return;

  const playerHost = document.getElementById('teaching-player');
  const videoPicker = document.getElementById('teaching-video-picker');
  const chapterList = document.getElementById('teaching-chapters');
  const chapterMeta = document.getElementById('teaching-chapter-meta');
  const seriesTitle = document.getElementById('teaching-series-title');
  const jumpBtn = document.getElementById('teaching-jump-map');

  if (!playerHost || !videoPicker || !chapterList) return;

  seriesTitle && (seriesTitle.textContent = data.series || 'Teaching Videos');

  const videos = data.videos.slice().sort((a, b) => a.day - b.day || a.part - b.part);
  const topicIndex = data.topicIndex || {};
  let activeVideo = videos[0] || null;
  let player = null;
  let playerReady = false;
  let pendingSeek = null;

  let lastPollTime = 0;
  let verifiedWatchSeconds = 0;
  let lastPlaybackWallMs = null;
  let watchPollId = null;

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function chapterNumLabel(ch) {
    if (!ch.isBonus) return String(ch.topicNumber).padStart(3, '0');
    const name = String(ch.topicName || '');
    if (/^TRIGGER WARNING:/i.test(name)) return 'WARN';
    if (/^TECHNICAL /i.test(name)) return 'NOTE';
    return 'BONUS';
  }

  function numberedChapters(video) {
    return (video?.chapters || []).filter((ch) => ch.topicNumber != null && !ch.isBonus);
  }

  function videoTopicRange(v) {
    const numbered = numberedChapters(v);
    const start = v.topicStart || numbered[0]?.topicNumber;
    const end = v.topicEnd || numbered[numbered.length - 1]?.topicNumber;
    if (!start || !end) return '';
    return `<span class="teaching-video-range">#${String(start).padStart(3, '0')}–${String(end).padStart(3, '0')}</span>`;
  }

  function videoLabel(v) {
    if (v.part > 1) return `Day ${v.day} (Part ${v.part})`;
    return `Day ${v.day}`;
  }

  function topicEntry(topicNumber) {
    const key = String(topicNumber);
    return topicIndex[key] || topicIndex[topicNumber] || null;
  }

  function renderPicker() {
    videoPicker.innerHTML = videos.map(v => {
      const range = videoTopicRange(v);
      const active = activeVideo && v.key === activeVideo.key ? ' is-active' : '';
      return `<button type="button" class="teaching-video-btn${active}" data-key="${v.key}">${videoLabel(v)}${range}</button>`;
    }).join('');

    videoPicker.querySelectorAll('.teaching-video-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = videos.find(x => x.key === btn.dataset.key);
        if (v) selectVideo(v);
      });
    });
  }

  function formatVideoDescription(desc) {
    if (!desc) return '';
    const toughUrl = 'https://repentance101ministry.com/channels/tough-questions';
    const escaped = String(desc)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const linked = escaped.replace(
      toughUrl,
      `<a href="${toughUrl}" target="_blank" rel="noopener noreferrer">Tough Questions</a>`
    );
    return `<p class="teaching-video-description">${linked}</p>`;
  }

  function setChapterMeta(el, video, chapterCount) {
    if (!el || !video) return;
    const head = chapterCount
      ? `${video.title} · ${chapterCount} topics`
      : (video.title || '');
    el.innerHTML = head + formatVideoDescription(video.description);
  }

  function renderChapters() {
    if (!activeVideo) {
      chapterList.innerHTML = '';
      chapterMeta.textContent = '';
      return;
    }

    const chapters = activeVideo.chapters || [];
    const topicCount = numberedChapters(activeVideo).length;
    if (!chapters.length) {
      chapterList.innerHTML = '<li class="teaching-chapter-empty">Topic timestamps for this video are being indexed. You can still watch the full teaching below.</li>';
      setChapterMeta(chapterMeta, activeVideo, topicCount);
      return;
    }

    setChapterMeta(chapterMeta, activeVideo, topicCount);
    chapterList.innerHTML = chapters.map(ch => {
      const numLabel = chapterNumLabel(ch);
      const topicAttr = ch.isBonus ? '' : ` data-topic="${ch.topicNumber}"`;
      return `
      <li>
        <button type="button" class="teaching-chapter-btn${ch.isBonus ? ' is-bonus' : ''}"${topicAttr} data-start="${ch.startSeconds}">
          <span class="teaching-chapter-num">${numLabel}</span>
          <span class="teaching-chapter-name">${ch.topicName}</span>
          <span class="teaching-chapter-time">${formatTime(ch.startSeconds)}</span>
        </button>
      </li>`;
    }).join('');

    chapterList.querySelectorAll('.teaching-chapter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const topicNum = btn.dataset.topic ? Number(btn.dataset.topic) : null;
        const start = Number(btn.dataset.start);
        seekTo(start);
        if (topicNum) highlightChapter(topicNum);
        if (topicNum && window.LivingWordMap?.selectTopicByNumber) {
          window.LivingWordMap.selectTopicByNumber(topicNum, { scrollTeaching: false });
        }
      });
    });
  }

  function highlightChapter(topicNumber) {
    chapterList.querySelectorAll('.teaching-chapter-btn').forEach(btn => {
      const on = Number(btn.dataset.topic) === Number(topicNumber);
      btn.classList.toggle('is-active', on);
      if (on) btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  function getActivePlayer() {
    const railVisible = globeRail && !globeRail.classList.contains('hidden');
    if (railVisible && globePlayer?.getCurrentTime) return globePlayer;
    return player;
  }

  function isPlayerMuted(p) {
    if (!p?.isMuted) return false;
    try {
      return p.isMuted() || p.getVolume?.() === 0;
    } catch {
      return false;
    }
  }

  function dispatchWatchProgress() {
    const p = getActivePlayer();
    const muted = isPlayerMuted(p);
    window.dispatchEvent(new CustomEvent('lwm:watch-progress', {
      detail: {
        currentTime: lastPollTime,
        verifiedWatchSeconds,
        isMuted: muted,
        videoKey: (globeRail && !globeRail.classList.contains('hidden') ? globeActiveVideo : activeVideo)?.key,
      },
    }));
  }

  function setPlaybackAnchor(startSeconds = 0) {
    lastPollTime = Math.max(0, startSeconds);
  }

  function resetVerifiedWatch() {
    verifiedWatchSeconds = 0;
    lastPlaybackWallMs = null;
    dispatchWatchProgress();
  }

  function resetWatchProgress(startSeconds = 0) {
    setPlaybackAnchor(startSeconds);
    resetVerifiedWatch();
  }

  function noteSeek(seconds) {
    lastPollTime = Math.max(0, seconds);
    lastPlaybackWallMs = null;
    dispatchWatchProgress();
  }

  function stopWatchPoll() {
    if (watchPollId) {
      clearInterval(watchPollId);
      watchPollId = null;
    }
  }

  function tickWatchProgress() {
    const p = getActivePlayer();
    if (!p?.getCurrentTime) return;

    const now = p.getCurrentTime();
    const state = p.getPlayerState?.();
    const playing = state === YT.PlayerState.PLAYING;
    const muted = isPlayerMuted(p);
    const wallNow = Date.now();

    if (playing && !muted) {
      if (lastPlaybackWallMs != null) {
        const wallDelta = (wallNow - lastPlaybackWallMs) / 1000;
        if (wallDelta > 0 && wallDelta <= 3) {
          verifiedWatchSeconds += wallDelta;
        }
      }
      lastPlaybackWallMs = wallNow;
    } else {
      lastPlaybackWallMs = null;
    }

    lastPollTime = now;
    dispatchWatchProgress();
  }

  function startWatchPoll() {
    stopWatchPoll();
    watchPollId = setInterval(tickWatchProgress, 500);
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      startWatchPoll();
    } else if (
      event.data === YT.PlayerState.PAUSED
      || event.data === YT.PlayerState.ENDED
      || event.data === YT.PlayerState.BUFFERING
    ) {
      tickWatchProgress();
      if (event.data !== YT.PlayerState.BUFFERING) stopWatchPoll();
    }
  }

  function ensurePlayer() {
    if (player || !activeVideo) return;
    playerHost.innerHTML = '';
    const frame = document.createElement('div');
    frame.id = 'youtube-player';
    playerHost.appendChild(frame);
  }

  function loadYouTubeApi() {
    if (window.YT?.Player) {
      createPlayer();
      createGlobePlayer();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    const prior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prior === 'function') prior();
      createPlayer();
      createGlobePlayer();
    };
  }

  function createPlayer() {
    if (!activeVideo || player) return;
    ensurePlayer();
    player = new YT.Player('youtube-player', {
      videoId: activeVideo.youtubeId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          playerReady = true;
          setPlaybackAnchor(pendingSeek ?? 0);
          if (pendingSeek != null) {
            seekTo(pendingSeek);
            pendingSeek = null;
          } else {
            dispatchWatchProgress();
          }
        },
        onStateChange: onPlayerStateChange,
      },
    });
  }

  function selectVideo(video, seekSeconds = 0) {
    const startAt = seekSeconds || 0;
    activeVideo = video;
    renderPicker();
    renderChapters();

    if (!player) {
      loadYouTubeApi();
      pendingSeek = startAt || null;
      return;
    }

    playerReady = false;
    setPlaybackAnchor(startAt);
    lastPlaybackWallMs = null;
    player.loadVideoById({
      videoId: video.youtubeId,
      startSeconds: startAt,
    });
  }

  function seekTo(seconds) {
    if (!activeVideo) return;
    if (!player || !playerReady) {
      pendingSeek = seconds;
      if (!player) selectVideo(activeVideo, seconds);
      return;
    }
    noteSeek(Math.max(0, seconds));
    player.seekTo(Math.max(0, seconds), true);
    player.playVideo();
    document.getElementById('teaching-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function openTopicVideo(topicNumber) {
    const entry = topicEntry(topicNumber);
    if (!entry) return false;
    const video = videos.find(v => v.key === entry.videoKey || v.youtubeId === entry.youtubeId);
    if (!video) return false;

    if (!activeVideo || activeVideo.key !== video.key) {
      selectVideo(video, entry.startSeconds || 0);
    } else {
      seekTo(entry.startSeconds || 0);
    }
    highlightChapter(topicNumber);
    return true;
  }

  function openTopicOnPrayerPage(topicNumber) {
    const n = Number(topicNumber);
    if (!Number.isFinite(n) || !topicEntry(n)) return false;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('site', 'prayer-videos');
      url.searchParams.set('watch', String(n));
      window.history.replaceState({ sitePage: 'prayer-videos' }, '', url);
    } catch { /* ignore */ }
    window.LwmSitePages?.apply?.('prayer-videos', { replace: true });
    const go = () => {
      openTopicVideo(n);
      document.getElementById('teaching-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    requestAnimationFrame(() => {
      window.setTimeout(go, 40);
    });
    return true;
  }

  jumpBtn?.addEventListener('click', () => {
    window.LwmSitePages?.apply?.('map');
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  renderPicker();
  renderChapters();
  loadYouTubeApi();

  const globeRail = document.getElementById('globe-video-rail');

  // Globe view fruit-focus rail (right column)
  const globePlayerHost = document.getElementById('globe-teaching-player');
  const globeVideoPicker = document.getElementById('globe-teaching-video-picker');
  const globeChapterList = document.getElementById('globe-teaching-chapters');
  const globeChapterMeta = document.getElementById('globe-teaching-chapter-meta');
  const globeRailTitle = document.getElementById('globe-video-rail-title');
  const globeRailMeta = document.getElementById('globe-video-rail-meta');

  let globeTopicSet = null;
  let globeVideoPool = videos;
  let globeActiveVideo = null;
  let globePlayer = null;
  let globePlayerReady = false;
  let globePendingSeek = null;

  function filteredChapters(video) {
    const chapters = video?.chapters || [];
    if (!globeTopicSet) return chapters;
    return chapters.filter(ch => globeTopicSet.has(String(ch.topicNumber)));
  }

  function videosForGlobeFruit(topicNumbers) {
    const set = new Set(topicNumbers.map(String));
    return videos.filter(v => filteredChaptersForSet(v, set).length > 0);
  }

  function filteredChaptersForSet(video, set) {
    return (video?.chapters || []).filter(ch => set.has(String(ch.topicNumber)));
  }

  function renderGlobePicker() {
    if (!globeVideoPicker) return;
    globeVideoPicker.innerHTML = globeVideoPool.map(v => {
      const chapters = filteredChapters(v);
      const range = chapters.length
        ? `<span class="teaching-video-range">${chapters.length} topic${chapters.length === 1 ? '' : 's'}</span>`
        : '';
      const active = globeActiveVideo && v.key === globeActiveVideo.key ? ' is-active' : '';
      return `<button type="button" class="teaching-video-btn${active}" data-key="${v.key}">${videoLabel(v)}${range}</button>`;
    }).join('');

    globeVideoPicker.querySelectorAll('.teaching-video-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = globeVideoPool.find(x => x.key === btn.dataset.key);
        if (v) selectGlobeVideo(v);
      });
    });
  }

  function renderGlobeChapters() {
    if (!globeChapterList) return;
    if (!globeActiveVideo) {
      globeChapterList.innerHTML = '';
      if (globeChapterMeta) globeChapterMeta.textContent = '';
      return;
    }

    const chapters = filteredChapters(globeActiveVideo);
    if (!chapters.length) {
      globeChapterList.innerHTML = '<li class="teaching-chapter-empty">No indexed timestamps for this fruit yet.</li>';
      setChapterMeta(globeChapterMeta, globeActiveVideo, 0);
      return;
    }

    setChapterMeta(globeChapterMeta, globeActiveVideo, chapters.length);

    globeChapterList.innerHTML = chapters.map(ch => `
      <li>
        <button type="button" class="teaching-chapter-btn" data-topic="${ch.topicNumber}" data-start="${ch.startSeconds}">
          <span class="teaching-chapter-num">${String(ch.topicNumber).padStart(3, '0')}</span>
          <span class="teaching-chapter-name">${ch.topicName}</span>
          <span class="teaching-chapter-time">${formatTime(ch.startSeconds)}</span>
        </button>
      </li>`).join('');

    globeChapterList.querySelectorAll('.teaching-chapter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const topicNum = Number(btn.dataset.topic);
        const start = Number(btn.dataset.start);
        seekGlobeTo(start);
        highlightGlobeChapter(topicNum);
        if (window.LivingWordMap?.selectTopicByNumber) {
          window.LivingWordMap.selectTopicByNumber(topicNum, { scrollTeaching: false });
        }
      });
    });
  }

  function highlightGlobeChapter(topicNumber) {
    globeChapterList?.querySelectorAll('.teaching-chapter-btn').forEach(btn => {
      btn.classList.toggle('is-active', Number(btn.dataset.topic) === topicNumber);
    });
  }

  function ensureGlobePlayer() {
    if (globePlayer || !globeActiveVideo || !globePlayerHost) return;
    globePlayerHost.innerHTML = '';
    const frame = document.createElement('div');
    frame.id = 'globe-youtube-player';
    globePlayerHost.appendChild(frame);
  }

  function createGlobePlayer() {
    if (!globeActiveVideo || globePlayer || !globePlayerHost) return;
    ensureGlobePlayer();
    globePlayer = new YT.Player('globe-youtube-player', {
      videoId: globeActiveVideo.youtubeId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          globePlayerReady = true;
          if (globePendingSeek != null) {
            seekGlobeTo(globePendingSeek);
            globePendingSeek = null;
          }
        },
        onStateChange: onPlayerStateChange,
      },
    });
  }

  function loadGlobeYouTubeApi() {
    loadYouTubeApi();
  }

  function selectGlobeVideo(video, seekSeconds = 0) {
    const startAt = seekSeconds || 0;
    globeActiveVideo = video;
    renderGlobePicker();
    renderGlobeChapters();

    if (!globePlayer) {
      loadGlobeYouTubeApi();
      globePendingSeek = startAt || null;
      return;
    }

    globePlayerReady = false;
    setPlaybackAnchor(startAt);
    lastPlaybackWallMs = null;
    globePlayer.loadVideoById({
      videoId: video.youtubeId,
      startSeconds: startAt,
    });
  }

  function seekGlobeTo(seconds) {
    if (!globeActiveVideo) return;
    if (!globePlayer || !globePlayerReady) {
      globePendingSeek = seconds;
      if (!globePlayer) selectGlobeVideo(globeActiveVideo, seconds);
      return;
    }
    noteSeek(Math.max(0, seconds));
    globePlayer.seekTo(Math.max(0, seconds), true);
    globePlayer.playVideo();
  }

  function showFruitRail(fruitName, topicNumbers) {
    if (!globeRail) return;
    globeTopicSet = new Set(topicNumbers.map(String));
    globeVideoPool = videosForGlobeFruit(topicNumbers);
    if (!globeVideoPool.length) globeVideoPool = videos;
    globeActiveVideo = globeVideoPool[0] || null;
    if (globeRailTitle) globeRailTitle.textContent = fruitName;
    if (globeRailMeta) {
      const videoCount = globeVideoPool.length;
      globeRailMeta.textContent = `${topicNumbers.length} topics · ${videoCount} video${videoCount === 1 ? '' : 's'}`;
    }
    globeRail.classList.remove('hidden');
    renderGlobePicker();
    renderGlobeChapters();
    if (globeActiveVideo) selectGlobeVideo(globeActiveVideo);
  }

  function hideGlobeRail() {
    globeRail?.classList.add('hidden');
    globeTopicSet = null;
    globeVideoPool = videos;
    globeActiveVideo = null;
    if (globePlayer?.stopVideo) {
      try { globePlayer.stopVideo(); } catch { /* player may be torn down */ }
    }
  }

  function openTopicVideoInRail(topicNumber) {
    const entry = topicEntry(topicNumber);
    if (!entry || !globeTopicSet?.has(String(topicNumber))) return false;
    const video = globeVideoPool.find(v => v.key === entry.videoKey || v.youtubeId === entry.youtubeId)
      || videos.find(v => v.key === entry.videoKey || v.youtubeId === entry.youtubeId);
    if (!video) return false;

    if (!globeActiveVideo || globeActiveVideo.key !== video.key) {
      selectGlobeVideo(video, entry.startSeconds || 0);
    } else {
      seekGlobeTo(entry.startSeconds || 0);
    }
    highlightGlobeChapter(topicNumber);
    return true;
  }

  function getActiveVideoInfo() {
    const railVisible = globeRail && !globeRail.classList.contains('hidden');
    const video = railVisible ? globeActiveVideo : activeVideo;
    if (!video?.youtubeId) return null;
    return {
      key: video.key,
      title: video.title,
      youtubeId: video.youtubeId,
      url: `https://www.youtube.com/watch?v=${video.youtubeId}`,
    };
  }

  window.TeachingVideos = {
    openTopicVideo,
    openTopicOnPrayerPage,
    openTopicVideoInRail,
    selectVideoByKey(key) {
      const v = videos.find(x => x.key === key);
      if (v) selectVideo(v);
    },
    showFruitRail,
    hideGlobeRail,
    getTopicEntry: topicEntry,
    formatTime,
    getWatchProgress() {
      const p = getActivePlayer();
      return {
        currentTime: lastPollTime,
        verifiedWatchSeconds,
        isMuted: isPlayerMuted(p),
      };
    },
    resetWatchProgress,
    resetVerifiedWatch,
    getActiveVideo: getActiveVideoInfo,
  };

  const watchParam = Number(new URLSearchParams(window.location.search).get('watch'));
  if (Number.isFinite(watchParam) && watchParam > 0 && topicEntry(watchParam)) {
    const cue = () => openTopicVideo(watchParam);
    if (document.body.dataset.sitePage === 'prayer-videos') {
      window.setTimeout(cue, 80);
    } else {
      window.addEventListener('lwm:site-page-prayer', cue, { once: true });
    }
  }
})();
