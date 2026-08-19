(() => {
  const data = window.DOWNLOADS_PLAYLIST;
  const listEl = document.getElementById('downloads-list');
  const audio = document.getElementById('downloads-audio');
  const nowPlaying = document.getElementById('downloads-now-playing');
  const playAllBtn = document.getElementById('downloads-play-all');
  const picker = document.querySelector('.downloads-series-picker');
  const panels = {
    accelerated: document.getElementById('downloads-series-accelerated'),
    'bold-love': document.getElementById('downloads-series-bold-love'),
  };

  function selectSeries(series) {
    const buttons = picker?.querySelectorAll('.downloads-series-btn') || [];
    buttons.forEach((btn) => {
      const active = btn.dataset.series === series;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    Object.entries(panels).forEach(([key, panel]) => {
      if (!panel) return;
      const show = key === series;
      panel.classList.toggle('hidden', !show);
      panel.hidden = !show;
    });
    if (series !== 'accelerated' && audio && !audio.paused) {
      audio.pause();
    }
  }

  picker?.addEventListener('click', (event) => {
    const btn = event.target.closest('.downloads-series-btn');
    if (!btn?.dataset.series) return;
    selectSeries(btn.dataset.series);
  });

  if (!data?.pieces?.length || !listEl || !audio) return;

  const pieces = data.pieces;
  let activeIndex = -1;

  function audioUrl(piece, download) {
    const path = `/audio/accelerated-discipleship/${piece.file}`;
    if (!download) return path;
    const name = encodeURIComponent(piece.downloadName || piece.file);
    return `${path}?download=1&filename=${name}`;
  }

  function setActive(index) {
    activeIndex = index;
    listEl.querySelectorAll('.downloads-row').forEach((row, i) => {
      row.classList.toggle('is-active', i === index);
    });
    const piece = pieces[index];
    if (nowPlaying) {
      nowPlaying.textContent = piece
        ? `Playing ${piece.id} — ${piece.title}`
        : 'Play in order, or download any section to your device.';
    }
  }

  function playIndex(index) {
    const piece = pieces[index];
    if (!piece) return;
    selectSeries('accelerated');
    setActive(index);
    audio.src = audioUrl(piece, false);
    audio.play().catch(() => {});
  }

  function formatSource(piece) {
    if (!piece.sourceFile) return 'Spoken label from the complete recording';
    return piece.sourceFile.replace(/\+/g, ' ').replace(/\.mp3$/i, '');
  }

  listEl.innerHTML = pieces.map((piece, index) => `
    <li class="downloads-row" data-index="${index}">
      <span class="downloads-num">${piece.id}</span>
      <div class="downloads-meta">
        <strong>${piece.title}</strong>
        <span class="downloads-source">${formatSource(piece)}</span>
      </div>
      <div class="downloads-actions">
        <button type="button" class="downloads-play-btn" data-play="${index}">Play</button>
        <a class="downloads-save-btn" href="${audioUrl(piece, true)}" download="${piece.downloadName || piece.file}">Download</a>
      </div>
    </li>
  `).join('');

  listEl.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-play]');
    if (!btn) return;
    playIndex(Number(btn.dataset.play));
  });

  playAllBtn?.addEventListener('click', () => playIndex(0));

  audio.addEventListener('ended', () => {
    if (activeIndex >= 0 && activeIndex < pieces.length - 1) {
      playIndex(activeIndex + 1);
    }
  });
})();
