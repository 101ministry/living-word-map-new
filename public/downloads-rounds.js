(() => {
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function audioUrl(data, piece, download) {
    const prefix = data.audioPrefix;
    const path = `/${prefix}/${piece.file}`;
    if (!download) return path;
    const name = encodeURIComponent(piece.downloadName || piece.file);
    return `${path}?download=1&filename=${name}`;
  }

  function bindRound(section) {
    const key = section.dataset.playlist;
    const data = window[key];
    const listEl = section.querySelector('.downloads-list');
    const audio = section.querySelector('.downloads-audio');
    const nowPlaying = section.querySelector('.downloads-now-playing');
    const playAllBtn = section.querySelector('.downloads-play-all');
    if (!data?.pieces?.length || !listEl || !audio) return;

    const pieces = data.pieces;
    let activeIndex = -1;

    function setActive(index) {
      activeIndex = index;
      listEl.querySelectorAll('.downloads-row').forEach((row, i) => {
        row.classList.toggle('is-active', i === index);
      });
      const piece = pieces[index];
      if (nowPlaying) {
        nowPlaying.textContent = piece
          ? `Playing ${piece.id} — ${piece.title}`
          : 'Play in order, or download any topic to your device.';
      }
    }

    function playIndex(index) {
      const piece = pieces[index];
      if (!piece) return;
      setActive(index);
      audio.src = audioUrl(data, piece, false);
      audio.play().catch(() => {});
    }

    listEl.innerHTML = pieces.map((piece, index) => `
    <li class="downloads-row" data-index="${index}">
      <span class="downloads-num">${esc(piece.id)}</span>
      <div class="downloads-meta">
        <strong>${esc(piece.title)}</strong>
      </div>
      <div class="downloads-actions">
        <button type="button" class="downloads-play-btn" data-play="${index}">Play</button>
        <a class="downloads-save-btn" href="${audioUrl(data, piece, true)}" download="${esc(piece.downloadName || piece.file)}">Download</a>
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
  }

  document.querySelectorAll('.downloads-round').forEach(bindRound);
})();
