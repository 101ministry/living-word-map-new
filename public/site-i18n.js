(() => {
  'use strict';

  function ui(lang, key) {
    const code = String(lang || 'en').toLowerCase();
    const en = window.LANGUAGE_CATALOG?.ui?.en || {};
    const loc = window.LANGUAGE_CATALOG?.ui?.[code] || {};
    return loc[key] || en[key] || '';
  }

  function applySubtitle(lang) {
    const sub = document.getElementById('site-subtitle');
    if (!sub) return;
    const tplRaw = ui(lang, 'siteSubtitle');
    const dot = '\u00b7';
    const tpl = String(tplRaw || `{p} Principalities ${dot} {r} Roots ${dot} {f} Fruits ${dot} {t} Topics`)
      .replace(/\u00c2\u00b7/g, dot)
      .replace(/Â·/g, dot);
    const p = document.getElementById('principality-count')?.textContent?.trim() || '—';
    const r = document.getElementById('root-count')?.textContent?.trim() || '—';
    const f = document.getElementById('fruit-count')?.textContent?.trim() || '—';
    const t = document.getElementById('topic-count')?.textContent?.trim() || '—';
    const line = tpl.replace('{p}', p).replace('{r}', r).replace('{f}', f).replace('{t}', t);
    const textEl = document.getElementById('site-subtitle-text');
    if (textEl) textEl.textContent = line;
    else sub.textContent = line;
  }

  function apply(lang) {
    const code = String(lang || 'en').toLowerCase();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = ui(code, key);
      if (val) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.dataset.i18nAria;
      const val = ui(code, key);
      if (val) el.setAttribute('aria-label', val);
    });
    applySubtitle(code);
    document.documentElement.lang = code;
    window.dispatchEvent(new CustomEvent('lwm:site-i18n-applied', { detail: { language: code } }));
  }

  window.LwmSiteI18n = { apply, ui };

  window.addEventListener('lwm:language-changed', e => {
    apply(e.detail?.language || 'en');
  });
})();
