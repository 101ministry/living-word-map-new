(() => {
  const LABELS = {
    camp: 'Minigame',
    globe: 'Globe',
    constellation: 'Constellation',
    explore: 'Explore All',
    compare: 'Compare Principalities',
  };

  function sel() {
    return document.getElementById('view-mode');
  }

  function toggle() {
    return document.getElementById('view-nav-toggle');
  }

  function menu() {
    return document.getElementById('view-nav-menu');
  }

  function closedLabel(value) {
    if (value === 'globe' || value === 'constellation' || value === 'explore' || value === 'camp' || value === 'compare') {
      return 'Globe Map & Minigame';
    }
    return LABELS[value] || 'Globe Map & Minigame';
  }

  function syncLabel() {
    const t = toggle();
    const s = sel();
    if (!t || !s) return;
    t.textContent = closedLabel(s.value) || s.options[s.selectedIndex]?.text || 'View';
  }

  function placeSubmenu(sub, btn) {
    const r = btn.getBoundingClientRect();
    const w = 13 * 16;
    const gap = 6;
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    sub.style.position = 'fixed';
    if (mobile) {
      sub.style.top = `${r.bottom + gap}px`;
      sub.style.left = 'auto';
      sub.style.right = '8px';
      return;
    }
    const spaceRight = window.innerWidth - r.right;
    const openLeft = spaceRight < w + 12;
    sub.style.top = `${Math.max(8, r.top)}px`;
    if (openLeft) {
      sub.style.left = 'auto';
      sub.style.right = `${Math.max(8, window.innerWidth - r.left + gap)}px`;
    } else {
      sub.style.left = `${r.right + gap}px`;
      sub.style.right = 'auto';
    }
  }

  function closeAll() {
    const m = menu();
    const t = toggle();
    if (m) m.hidden = true;
    t?.setAttribute('aria-expanded', 'false');
  }

  function pick(value) {
    window.LwmSitePages?.apply?.('map');
    const s = sel();
    if (s && [...s.options].some((o) => o.value === value)) {
      s.value = value;
    }
    window.dispatchEvent(new CustomEvent('lwm:view-mode', { detail: { value } }));
    syncLabel();
    closeAll();
  }

  function injectCamp() {
    const slot = document.getElementById('view-nav-camp-slot');
    if (!slot || slot.dataset.ready === '1') return;
    slot.hidden = false;
    slot.dataset.ready = '1';
    slot.innerHTML =
      '<button type="button" class="view-nav-item" data-view="camp">Discipleship Training Camp minigame</button>';
  }

  function bind() {
    const root = document.getElementById('view-nav');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    toggle()?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.LwmSitePages?.apply?.('map');
      const m = menu();
      if (!m) return;
      const open = m.hidden;
      if (open) {
        m.hidden = false;
        toggle()?.setAttribute('aria-expanded', 'true');
      } else closeAll();
    });

    menu()?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (!btn) return;
      pick(btn.getAttribute('data-view') || '');
    });

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) closeAll();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });

    sel()?.addEventListener('change', syncLabel);
    syncLabel();
  }

  window.ViewNav = { bind, syncLabel, injectCamp, pick, closeAll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
