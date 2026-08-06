(() => {
  const GRID = 8;
  const SIZE = GRID * GRID;
  const CENTER = (GRID - 1) / 2;
  const HOOK_BONUS = 30;
  const BLOCK_VARIANTS = [1, 2, 3];

  const gridEl = document.getElementById('corner-breaker-grid');
  const levelEl = document.getElementById('corner-breaker-level');
  const blocksEl = document.getElementById('corner-breaker-blocks-left');
  const powerEl = document.getElementById('corner-breaker-power');
  const coinsEl = document.getElementById('corner-breaker-coins');
  const dripEl = document.getElementById('corner-breaker-drip');
  const watchEl = document.getElementById('corner-breaker-watch');
  const messageEl = document.getElementById('corner-breaker-message');
  const muteHintEl = document.getElementById('corner-breaker-mute-hint');
  const copyScoreBtn = document.getElementById('corner-breaker-copy-score');
  const locationDialog = document.getElementById('corner-breaker-location-dialog');
  const locationForm = document.getElementById('corner-breaker-location-form');
  const locationInput = document.getElementById('corner-breaker-location-input');
  const locationCloseBtn = document.getElementById('corner-breaker-location-close');
  const locationDeclineBtn = document.getElementById('corner-breaker-location-decline');
  const hookPanel = document.getElementById('corner-breaker-hook-panel');
  const hookInput = document.getElementById('corner-breaker-hook-input');
  const hookSubmitBtn = document.getElementById('corner-breaker-hook-submit');

  if (!gridEl) return;

  let grid = [];
  let level = 1;
  let coins = 0;
  let blocksLeft = 0;
  let mode = 'corner';
  let lastVerifiedSeconds = 0;
  let clickDamage = 1;
  let advancingLevel = false;
  let hookBonusApplied = false;
  let locationPromptShown = false;

  /**
   * Block values: pick 1, 2, or 3, then multiply by 5 for each level above 1.
   * L1 → 1/2/3, L2 → 5/10/15, L3 → 25/50/75, L5 → 625/1250/1875 …
   */
  function blockHealthForLevel(currentLevel) {
    const variant = BLOCK_VARIANTS[Math.floor(Math.random() * BLOCK_VARIANTS.length)];
    const multiplier = Math.pow(5, currentLevel - 1);
    return variant * multiplier;
  }

  /**
   * Click power: L1 = 1, then 2^level for each level after (L2 = 4, L3 = 8, L4 = 16 …).
   * Answering a dialog hook adds +30 on top.
   */
  function baseClickPower(currentLevel) {
    if (currentLevel === 1) return 1;
    return Math.pow(2, currentLevel);
  }

  function applyClickPowerForLevel() {
    clickDamage = baseClickPower(level) + (hookBonusApplied ? HOOK_BONUS : 0);
    updatePowerDisplay();
  }

  function isBroken(row, col) {
    if (row < 0 || row >= GRID || col < 0 || col >= GRID) return true;
    const block = grid[row * GRID + col];
    return !block || block.health <= 0;
  }

  function canBreakCorner(row, col) {
    const pairs = [
      [isBroken(row - 1, col), isBroken(row, col - 1)],
      [isBroken(row, col - 1), isBroken(row + 1, col)],
      [isBroken(row + 1, col), isBroken(row, col + 1)],
      [isBroken(row - 1, col), isBroken(row, col + 1)],
    ];
    return pairs.some(([a, b]) => a && b);
  }

  function ringDist(row, col) {
    return Math.max(Math.abs(row - CENTER), Math.abs(col - CENTER));
  }

  function ringIndex(row, col) {
    return Math.round(ringDist(row, col) - 0.5);
  }

  function isCenterCell(row, col) {
    return ringDist(row, col) <= 0.5;
  }

  /** Ring corner (O): both axes sit on the same ring square, e.g. (2,2) on ring 1. */
  function isRingCorner(row, col) {
    const rd = ringDist(row, col);
    if (rd <= 0.5) return false;
    const dr = Math.abs(row - CENTER);
    const dc = Math.abs(col - CENTER);
    return Math.abs(dr - rd) < 0.01 && Math.abs(dc - rd) < 0.01;
  }

  /** Edge cell (X): one step closer to center along the shared side. */
  function inwardNeighbor(row, col) {
    const here = ringDist(row, col);
    let best = null;
    let bestDist = here;
    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];
    for (const [nr, nc] of neighbors) {
      if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) continue;
      const d = ringDist(nr, nc);
      if (d < bestDist) {
        bestDist = d;
        best = [nr, nc];
      }
    }
    return best;
  }

  /** O cells unlock when both adjacent X neighbors on the same ring are cleared. */
  function sameRingEdgeNeighbors(row, col) {
    const ri = ringIndex(row, col);
    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];
    return neighbors.filter(([nr, nc]) => {
      if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) return false;
      return ringIndex(nr, nc) === ri && !isRingCorner(nr, nc);
    });
  }

  function canBreakCenter(row, col) {
    if (isCenterCell(row, col)) return true;

    if (isRingCorner(row, col)) {
      const edges = sameRingEdgeNeighbors(row, col);
      return edges.length >= 2 && edges.every(([r, c]) => isBroken(r, c));
    }

    const inward = inwardNeighbor(row, col);
    return inward ? isBroken(inward[0], inward[1]) : false;
  }

  function canBreakBlock(block) {
    if (!block || block.health <= 0) return false;
    return mode === 'corner'
      ? canBreakCorner(block.row, block.col)
      : canBreakCenter(block.row, block.col);
  }

  function formatCoins(n) {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e4) return `${Math.floor(n).toLocaleString()}`;
    return String(Math.floor(n));
  }

  function formatBlockValue(n) {
    if (n >= 10000) return `${(n / 1000).toFixed(0)}k`;
    return n.toLocaleString();
  }

  function updatePowerDisplay() {
    if (powerEl) powerEl.textContent = String(clickDamage);
  }

  function idleDripRate() {
    if (level < 4) return 0;
    return Math.pow(10, level - 4);
  }

  function healthClass(block) {
    const h = block.health;
    if (h >= 100) return 'health-high';
    if (h >= 10) return 'health-high';
    if (h >= 7) return 'health-3';
    if (h >= 4) return 'health-2';
    return 'health-1';
  }

  function renderBlockFace(block) {
    const el = document.getElementById(`corner-block-${block.id}`);
    if (!el || block.health <= 0) return;
    el.textContent = formatBlockValue(block.health);
    el.className = `corner-breaker-block ${healthClass(block)}`;
  }

  function dismissLocationDialog() {
    locationDialog?.close();
    locationInput && (locationInput.value = '');
    updateHookPanelVisibility();
  }

  function updateHookPanelVisibility() {
    if (!hookPanel) return;
    const show = level >= 3 && !hookBonusApplied;
    hookPanel.classList.toggle('hidden', !show);
  }

  function submitLocationHook(answer) {
    const trimmed = answer?.trim();
    if (!trimmed || hookBonusApplied) return false;
    hookBonusApplied = true;
    applyClickPowerForLevel();
    messageEl.textContent = `+${HOOK_BONUS} click power (${clickDamage} total) — thanks for watching from ${trimmed}!`;
    if (hookInput) hookInput.value = '';
    if (locationInput) locationInput.value = '';
    updateHookPanelVisibility();
    if (locationDialog?.open) locationDialog.close();
    return true;
  }

  function promptLocationIfNeeded(currentLevel) {
    if (currentLevel !== 3 || locationPromptShown || !locationDialog || !locationForm) {
      updateHookPanelVisibility();
      return;
    }
    locationPromptShown = true;
    locationDialog.showModal();
    locationInput?.focus();
    updateHookPanelVisibility();
  }

  locationForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitLocationHook(locationInput?.value);
  });

  locationCloseBtn?.addEventListener('click', () => {
    messageEl.textContent = '';
    dismissLocationDialog();
  });

  locationDeclineBtn?.addEventListener('click', () => {
    messageEl.textContent = '';
    dismissLocationDialog();
  });

  locationDialog?.addEventListener('cancel', () => {
    messageEl.textContent = '';
    dismissLocationDialog();
  });

  hookSubmitBtn?.addEventListener('click', () => {
    if (!submitLocationHook(hookInput?.value)) {
      messageEl.textContent = 'Enter your state or country to claim the bonus.';
      hookInput?.focus();
    }
  });

  hookInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      hookSubmitBtn?.click();
    }
  });

  function startLevel(currentLevel) {
    level = currentLevel;
    mode = currentLevel <= 3 ? 'corner' : 'center';
    levelEl.textContent = String(level);
    dripEl.textContent = idleDripRate() ? `${formatCoins(idleDripRate())}/s` : '—';
    applyClickPowerForLevel();
    grid = [];
    gridEl.innerHTML = '';
    blocksLeft = 0;

    for (let i = 0; i < SIZE; i++) {
      const row = Math.floor(i / GRID);
      const col = i % GRID;
      const health = blockHealthForLevel(currentLevel);
      const block = { id: i, row, col, health, maxHealth: health };
      grid.push(block);
      blocksLeft++;
      gridEl.appendChild(createBlockButton(block));
    }

    blocksEl.textContent = String(blocksLeft);
    messageEl.textContent = currentLevel <= 3
      ? `Level ${currentLevel} — break from the corners inward.`
      : `Level ${currentLevel} — break from the center outward.`;
    refreshBreakableStates();
    promptLocationIfNeeded(currentLevel);
    updateHookPanelVisibility();
  }

  function createBlockButton(block) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `corner-breaker-block ${healthClass(block)}`;
    btn.id = `corner-block-${block.id}`;
    btn.textContent = formatBlockValue(block.health);
    btn.dataset.row = block.row;
    btn.dataset.col = block.col;
    btn.addEventListener('click', () => tryBreakBlock(block.id, clickDamage));
    return btn;
  }

  function refreshBreakableStates() {
    grid.forEach(block => {
      const el = document.getElementById(`corner-block-${block.id}`);
      if (!el || block.health <= 0) return;
      const ok = canBreakBlock(block);
      el.disabled = !ok;
      el.title = ok
        ? ''
        : mode === 'corner'
          ? 'Clear the corner path first'
          : 'Clear the center path first';
    });
  }

  function applyDamage(block, amount) {
    if (!block || block.health <= 0 || amount <= 0) return;
    const el = document.getElementById(`corner-block-${block.id}`);
    if (!el) return;

    block.health -= amount;

    if (block.health <= 0) {
      block.health = 0;
      el.classList.add('breaking');
      el.disabled = true;
      blocksLeft--;
      blocksEl.textContent = String(blocksLeft);
      coins += 5 * level;
      coinsEl.textContent = formatCoins(coins);
      setTimeout(() => {
        el.classList.add('is-broken');
      }, 320);

      if (blocksLeft === 0 && !advancingLevel) {
        advancingLevel = true;
        messageEl.textContent = `Level ${level} cleared! Starting level ${level + 1}…`;
        setTimeout(() => {
          advancingLevel = false;
          startLevel(level + 1);
        }, 1400);
      } else {
        refreshBreakableStates();
      }
      return;
    }

    renderBlockFace(block);
    coins += Math.max(1, Math.floor(amount / 2));
    coinsEl.textContent = formatCoins(coins);
  }

  function tryBreakBlock(blockId, amount) {
    const block = grid[blockId];
    if (!canBreakBlock(block)) {
      messageEl.textContent = mode === 'corner'
        ? 'That block is not exposed from a corner yet.'
        : 'That block is not exposed from the center yet.';
      return;
    }
    applyDamage(block, amount);
    if (block.health > 0) refreshBreakableStates();
  }

  function buildShareText() {
    const watch = window.TeachingVideos?.getWatchProgress?.();
    const video = window.TeachingVideos?.getActiveVideo?.();
    const siteUrl = `${window.location.origin}${window.location.pathname}`;
    const watched = watch?.verifiedWatchSeconds
      ? ` — ${Math.floor(watch.verifiedWatchSeconds)}s watch time`
      : '';
    const lines = [
      `My Corner Breaker score: ${formatCoins(coins)} — Level ${level}${watched}`,
      `Play while you watch: ${siteUrl}`,
    ];
    if (video?.url) {
      lines.push(`Video: ${video.url}`);
    }
    return lines.join('\n');
  }

  async function copyScoreToClipboard() {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  copyScoreBtn?.addEventListener('click', async () => {
    const copied = await copyScoreToClipboard();
    const video = window.TeachingVideos?.getActiveVideo?.();

    if (copied) {
      messageEl.textContent = 'Score copied! Paste it in the YouTube comments.';
      copyScoreBtn.textContent = 'Copied!';
      copyScoreBtn.classList.add('is-copied');
      setTimeout(() => {
        copyScoreBtn.textContent = 'Copy score';
        copyScoreBtn.classList.remove('is-copied');
      }, 2200);
    } else {
      messageEl.textContent = buildShareText();
    }

    if (video?.url) {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  });

  function setMuteHintVisible(muted) {
    if (!muteHintEl) return;
    muteHintEl.classList.toggle('hidden', !muted);
  }

  function onVerifiedWatch(verifiedSeconds, isMuted) {
    setMuteHintVisible(!!isMuted);

    if (isMuted) {
      watchEl.textContent = `${Math.floor(verifiedSeconds)}s`;
      return;
    }

    const delta = verifiedSeconds - lastVerifiedSeconds;
    if (delta <= 0) return;
    lastVerifiedSeconds = verifiedSeconds;

    watchEl.textContent = `${Math.floor(verifiedSeconds)}s`;

    if (level < 4) return;

    const drip = idleDripRate();
    if (drip > 0) {
      coins += drip * delta;
      coinsEl.textContent = formatCoins(coins);
    }

    let ticks = Math.floor(delta);
    while (ticks-- > 0 && blocksLeft > 0 && !advancingLevel) {
      for (const block of grid) {
        if (block.health > 0) applyDamage(block, 1);
        if (blocksLeft === 0 || advancingLevel) break;
      }
    }

    if (blocksLeft > 0 && !advancingLevel) {
      refreshBreakableStates();
    }
  }

  window.addEventListener('lwm:watch-progress', (e) => {
    const { verifiedWatchSeconds, isMuted } = e.detail || {};
    if (typeof verifiedWatchSeconds === 'number') {
      onVerifiedWatch(verifiedWatchSeconds, isMuted);
    }
  });

  window.CornerBreaker = {
    getScoreSnapshot() {
      return {
        coins: Math.floor(coins),
        level,
        clickDamage,
        shareText: buildShareText(),
      };
    },
    reset() {
      lastVerifiedSeconds = 0;
      coins = 0;
      hookBonusApplied = false;
      locationPromptShown = false;
      coinsEl.textContent = '0';
      watchEl.textContent = '0s';
      startLevel(1);
      updateHookPanelVisibility();
    },
  };

  startLevel(1);
})();
