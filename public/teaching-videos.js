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

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
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
      const range = v.topicStart && v.topicEnd
        ? `<span class="teaching-video-range">#${String(v.topicStart).padStart(3, '0')}–${String(v.topicEnd).padStart(3, '0')}</span>`
        : '';
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

  function renderChapters() {
    if (!activeVideo) {
      chapterList.innerHTML = '';
      chapterMeta.textContent = '';
      return;
    }

    const chapters = activeVideo.chapters || [];
    if (!chapters.length) {
      chapterList.innerHTML = '<li class="teaching-chapter-empty">Topic timestamps for this video are being indexed. You can still watch the full teaching below.</li>';
      chapterMeta.textContent = activeVideo.title;
      return;
    }

    chapterMeta.textContent = `${activeVideo.title} · ${chapters.length} topics`;
    chapterList.innerHTML = chapters.map(ch => `
      <li>
        <button type="button" class="teaching-chapter-btn" data-topic="${ch.topicNumber}" data-start="${ch.startSeconds}">
          <span class="teaching-chapter-num">${String(ch.topicNumber).padStart(3, '0')}</span>
          <span class="teaching-chapter-name">${ch.topicName}</span>
          <span class="teaching-chapter-time">${formatTime(ch.startSeconds)}</span>
        </button>
      </li>`).join('');

    chapterList.querySelectorAll('.teaching-chapter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const topicNum = Number(btn.dataset.topic);
        const start = Number(btn.dataset.start);
        seekTo(start);
        highlightChapter(topicNum);
        if (window.LivingWordMap?.selectTopicByNumber) {
          window.LivingWordMap.selectTopicByNumber(topicNum, { scrollTeaching: false });
        }
      });
    });
  }

  function highlightChapter(topicNumber) {
    chapterList.querySelectorAll('.teaching-chapter-btn').forEach(btn => {
      btn.classList.toggle('is-active', Number(btn.dataset.topic) === topicNumber);
    });
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
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => createPlayer();
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
          if (pendingSeek != null) {
            seekTo(pendingSeek);
            pendingSeek = null;
          }
        },
      },
    });
  }

  function selectVideo(video, seekSeconds = 0) {
    activeVideo = video;
    renderPicker();
    renderChapters();

    if (!player) {
      loadYouTubeApi();
      pendingSeek = seekSeconds || null;
      return;
    }

    playerReady = false;
    player.loadVideoById({
      videoId: video.youtubeId,
      startSeconds: seekSeconds || 0,
    });
  }

  function seekTo(seconds) {
    if (!activeVideo) return;
    if (!player || !playerReady) {
      pendingSeek = seconds;
      if (!player) selectVideo(activeVideo, seconds);
      return;
    }
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

  jumpBtn?.addEventListener('click', () => {
    document.querySelector('.workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  renderPicker();
  renderChapters();
  loadYouTubeApi();

  window.TeachingVideos = {
    openTopicVideo,
    selectVideoByKey(key) {
      const v = videos.find(x => x.key === key);
      if (v) selectVideo(v);
    },
    getTopicEntry: topicEntry,
    formatTime,
  };
})();
