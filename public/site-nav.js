(() => {
  'use strict';

  const LANG_KEYS = ['lwm-language', 'lwm-round-prayer-lang'];

  function syncLanguageStorage(code) {
    const lang = String(code || 'en').toLowerCase();
    LANG_KEYS.forEach(key => {
      try {
        localStorage.setItem(key, lang);
      } catch { /* ignore */ }
    });
  }

  function populateLanguageSelect(select, current, options = {}) {
    if (!select) return;
    if (select.dataset.ready === '1' && !options.force) return;
    const catalog = window.LANGUAGE_CATALOG;
    const langs = Array.isArray(catalog?.languages) ? catalog.languages : [{ code: 'en', name: 'English', native: 'English' }];
    select.innerHTML = '';
    langs.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang.code;
      const native = lang.native || lang.name || lang.code;
      const name = lang.name || lang.code;
      opt.textContent = native === name ? native : `${native} (${name})`;
      select.appendChild(opt);
    });
    select.value = current || catalog?.defaultLanguage || 'en';
    select.dataset.ready = '1';
  }

  function readStoredLanguage() {
    for (const key of LANG_KEYS) {
      try {
        const v = localStorage.getItem(key);
        if (v) return v;
      } catch { /* ignore */ }
    }
    return window.LANGUAGE_CATALOG?.defaultLanguage || 'en';
  }

  function updateLanguageStatus(select) {
    const statusEl = document.getElementById('language-status');
    if (!statusEl || !select) return;
    const catalog = window.LANGUAGE_CATALOG;
    const meta = catalog?.languages?.find(l => l.code === select.value);
    const ui = catalog?.ui?.[select.value] || catalog?.ui?.en || {};
    if (!meta) {
      statusEl.textContent = '';
      return;
    }
    const complete = window.PrayerLibrary?.isComplete?.(select.value) !== false;
    statusEl.textContent = complete
      ? `${meta.native || meta.name} — ${ui.prayerLanguageReady || 'Prayers loaded'}`
      : `${meta.native || meta.name} — ${ui.mapLanguageNote || 'Map labels stay in English.'}`;
    statusEl.classList.toggle('is-fallback', !complete);
  }

  async function bindLanguage() {
    const select = document.getElementById('language-select');
    if (!select || select.dataset.bound === '1') return;
    if (document.getElementById('map')) return;
    select.dataset.bound = '1';

    const current = readStoredLanguage();
    populateLanguageSelect(select, current);
    updateLanguageStatus(select);

    if (window.PrayerLibrary?.init) {
      try {
        await window.PrayerLibrary.init();
        populateLanguageSelect(select, readStoredLanguage(), { force: true });
        updateLanguageStatus(select);
      } catch (err) {
        console.warn('Prayer library init failed:', err);
      }
    }

    select.addEventListener('change', async () => {
      syncLanguageStorage(select.value);
      if (window.PrayerLibrary?.setLanguage) {
        window.PrayerLibrary.setLanguage(select.value);
      }
      try {
        await window.PrayerLibrary?.loadLanguage?.(select.value);
      } catch (err) {
        console.warn(err);
      }
      updateLanguageStatus(select);
      window.dispatchEvent(new CustomEvent('lwm:language-changed', { detail: { language: select.value } }));
    });
  }

  function markSiteNavPath() {
    const path = (window.location.pathname || '').split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav-btn[data-site-href]').forEach(link => {
      const href = link.getAttribute('href') || '';
      const target = href.split('/').pop();
      const here =
        (path === 'repentance-project.html' && target === 'repentance-project.html') ||
        (path === 'index.html' && target === 'index.html' && link.dataset.sitePage === new URLSearchParams(location.search).get('site')) ||
        (path === '' && target === 'repentance-project.html');
      link.classList.toggle('is-active', here);
      if (here) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function bind() {
    bindLanguage();
    markSiteNavPath();
    if (document.body.hasAttribute('data-site-page') || document.getElementById('map')) {
      window.LwmSitePages?.bind?.();
    }
  }

  window.LwmSiteNav = { bind, syncLanguageStorage, readStoredLanguage, populateLanguageSelect };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
