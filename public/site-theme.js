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
    const btn = document.getElementById('site-theme-toggle');
    if (!btn) return;
    const light = preference === 'light';
    btn.setAttribute('aria-pressed', light ? 'true' : 'false');
    btn.setAttribute('aria-label', light ? 'Switch to dusk theme' : 'Switch to light theme');
    btn.title = light
      ? 'Dusk mode (Globe stays dark)'
      : 'Light mode';
    btn.textContent = light ? '☀' : '☾';
  }

  function ensureToggle() {
    if (document.getElementById('site-theme-toggle')) return;
    let host = document.querySelector('.header-controls');
    let floating = false;
    if (!host) host = document.querySelector('.round2-header-meta');
    if (!host) host = document.querySelector('.round2-header');
    if (!host) {
      const wrap = document.createElement('div');
      wrap.className = 'site-theme-floating';
      document.body.appendChild(wrap);
      host = wrap;
      floating = true;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'site-theme-toggle';
    btn.className = 'site-theme-toggle btn-icon';
    btn.addEventListener('click', () => {
      writePreference(readPreference() === 'light' ? 'dark' : 'light');
      apply();
    });
    if (floating) host.appendChild(btn);
    else {
      const reset = host.querySelector('#reset-view');
      if (reset) host.insertBefore(btn, reset);
      else host.appendChild(btn);
    }
  }

  function apply() {
    const preference = readPreference();
    const theme = effectiveTheme();
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = colorSchemeFor(theme);
    updateToggle(preference);
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
