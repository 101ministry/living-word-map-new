(() => {
  'use strict';

  const STORAGE_KEY = 'lwm-theme';

  function readPreference() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value === 'light' || value === 'dark') return value;
    } catch {
      /* ignore */
    }
    return 'dark';
  }

  function writePreference(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }

  function isGlobeView() {
    if (document.documentElement.classList.contains('is-globe-view')) return true;
    if (document.documentElement.dataset.viewMode === 'globe') return true;
    try {
      const params = new URLSearchParams(window.location.search);
      const path = (window.location.pathname || '').split('/').pop() || 'index.html';
      const onIndex = path === 'index.html' || path === '';
      const site = params.get('site');
      return onIndex && (!site || site === 'map') && params.get('view') === 'globe';
    } catch {
      return false;
    }
  }

  function colorSchemeFor(theme) {
    return theme === 'light' ? 'light' : 'dark';
  }

  function effectiveTheme() {
    if (isGlobeView()) return 'dark';
    if (readPreference() === 'light') return 'light';
    return 'dusk';
  }

  function updateToggle(preference) {
    const light = preference === 'light';
    document.querySelectorAll('.site-theme-toggle').forEach(btn => {
      btn.setAttribute('aria-pressed', light ? 'true' : 'false');
      btn.setAttribute('aria-label', light ? 'Switch to dusk theme' : 'Switch to light theme');
      btn.title = light
        ? 'Dusk mode (Globe stays dark)'
        : 'Light mode';
      btn.textContent = light ? '☀' : '☾';
    });
  }

  function makeToggleButton(id) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = id;
    btn.className = 'site-theme-toggle';
    btn.addEventListener('click', () => {
      writePreference(readPreference() === 'light' ? 'dark' : 'light');
      apply();
    });
    return btn;
  }

  function findLanguageAnchor() {
    const headerLang = document.getElementById('language-select')?.closest('.language-control');
    if (headerLang) return headerLang;
    const roundSelect =
      document.getElementById('round1-lang') ||
      document.getElementById('round2-lang') ||
      document.getElementById('round3-lang');
    return roundSelect?.closest('label') || roundSelect || null;
  }

  function placeBuilderToggle() {
    const header = document.querySelector('.exp-header');
    if (!header || header.querySelector('.site-theme-toggle')) return;
    const btn = makeToggleButton('site-theme-toggle-builder');
    btn.classList.add('site-theme-toggle-builder');
    const langLabel = header.querySelector('label[for="exp-lang"]');
    if (langLabel) {
      langLabel.parentNode.insertBefore(btn, langLabel);
      return;
    }
    const meta = header.querySelector('.round2-header-meta');
    if (meta) meta.insertBefore(btn, meta.firstChild);
    else header.appendChild(btn);
  }

  function ensureToggle() {
    placeBuilderToggle();
    if (document.getElementById('site-theme-toggle')) return;
    const btn = makeToggleButton('site-theme-toggle');

    const anchor = findLanguageAnchor();
    if (anchor) {
      const wrap = document.createElement('div');
      wrap.className = 'site-theme-lang';
      anchor.parentNode.insertBefore(wrap, anchor);
      wrap.appendChild(btn);
      wrap.appendChild(anchor);
      return;
    }

    const host = document.querySelector('.header-controls, .round2-header-meta, .teaching-header, .round2-header');
    if (host) {
      host.insertBefore(btn, host.firstChild);
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'site-theme-floating';
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  function apply() {
    const preference = readPreference();
    const theme = effectiveTheme();
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = colorSchemeFor(theme);
    updateToggle(preference);
    window.dispatchEvent(new CustomEvent('lwm:theme-changed', { detail: { theme, preference } }));
  }

  function bootFromHead() {
    const preference = readPreference();
    document.documentElement.dataset.themePreference = preference;
    try {
      const path = (window.location.pathname || '').split('/').pop() || 'index.html';
      const params = new URLSearchParams(window.location.search);
      const site = params.get('site');
      const view = params.get('view') || '';
      const onIndex = path === 'index.html' || path === '';
      const onGlobe = onIndex && (!site || site === 'map') && view === 'globe';
      let theme = 'dusk';
      if (onGlobe) theme = 'dark';
      else if (preference === 'light') theme = 'light';
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = colorSchemeFor(theme);
    } catch {
      document.documentElement.dataset.theme = preference === 'light' ? 'light' : 'dusk';
      document.documentElement.style.colorScheme = colorSchemeFor(document.documentElement.dataset.theme);
    }
  }

  function bind() {
    ensureToggle();
    apply();
    window.addEventListener('lwm:view-mode', apply);
    window.addEventListener('lwm:site-page-map', apply);
    window.addEventListener('lwm:site-page-leave-map', apply);
    window.addEventListener('lwm:site-page-prayer', apply);
    window.addEventListener('lwm:site-page-downloads', apply);
  }

  window.LwmSiteTheme = { apply, readPreference, bind };

  bootFromHead();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
