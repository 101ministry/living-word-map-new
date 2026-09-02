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

  function isIndexShell() {
    return Boolean(document.getElementById('map') || document.body?.hasAttribute('data-site-page'));
  }

  function isMapPage() {
    if (!isIndexShell()) return false;
    const sitePage = document.body?.dataset?.sitePage || 'map';
    return sitePage === 'map';
  }

  function colorSchemeFor(theme) {
    return theme === 'light' ? 'light' : 'dark';
  }

  function effectiveTheme() {
    if (readPreference() !== 'light') return 'dark';
    return isMapPage() ? 'dusk' : 'light';
  }

  function updateToggle(preference) {
    const btn = document.getElementById('site-theme-toggle');
    if (!btn) return;
    const light = preference === 'light';
    btn.setAttribute('aria-pressed', light ? 'true' : 'false');
    btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    btn.title = light
      ? 'Dark mode'
      : 'Light mode (Globe Map uses a dusk brightness)';
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
    if (preference !== 'light') {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.colorScheme = 'dark';
      return;
    }
    try {
      const path = (window.location.pathname || '').split('/').pop() || 'index.html';
      const params = new URLSearchParams(window.location.search);
      const site = params.get('site');
      const onIndex = path === 'index.html' || path === '';
      const onMap = onIndex && (!site || site === 'map');
      const theme = onMap ? 'dusk' : 'light';
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = colorSchemeFor(theme);
    } catch {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.style.colorScheme = 'light';
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
