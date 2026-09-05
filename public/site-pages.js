(() => {
  'use strict';

  const VALID = new Set(['map', 'prayer-videos', 'downloads']);

  function normalize(page) {
    const raw = String(page || '').trim().toLowerCase();
    return VALID.has(raw) ? raw : 'map';
  }

  function current() {
    return normalize(document.body.dataset.sitePage || 'map');
  }

  function setActiveNav(page) {
    document.querySelectorAll('.site-nav-btn[data-site-page]').forEach(btn => {
      const on = btn.dataset.sitePage === page;
      btn.classList.toggle('is-active', on);
      if (on) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    const mapWrap = document.getElementById('view-nav');
    if (mapWrap) {
      mapWrap.classList.toggle('is-active', page === 'map');
    }
  }

  function apply(page, options = {}) {
    const next = normalize(page);
    document.body.dataset.sitePage = next;
    setActiveNav(next);

    if (next === 'map') {
      window.dispatchEvent(new CustomEvent('lwm:site-page-map'));
    }
    if (next === 'prayer-videos') {
      window.dispatchEvent(new CustomEvent('lwm:site-page-prayer'));
      window.LwmSitePages?.refreshCorePrayerPage?.();
      document.getElementById('legend-panel')?.classList.remove('is-open');
      const backdrop = document.getElementById('legend-backdrop');
      if (backdrop) {
        backdrop.hidden = true;
        backdrop.classList.remove('is-visible');
      }
      document.getElementById('open-controls')?.setAttribute('aria-expanded', 'false');
    }
    if (next !== 'map') {
      window.dispatchEvent(new CustomEvent('lwm:site-page-leave-map'));
    }
    if (next === 'downloads') {
      window.dispatchEvent(new CustomEvent('lwm:site-page-downloads'));
    }
    window.LwmSiteTheme?.apply?.();
    if (!options.replace && window.history?.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('site', next);
      window.history.replaceState({ sitePage: next }, '', url);
    }
  }

  function shouldRedirectToRepentanceHub() {
    const path = (window.location.pathname || '').split('/').pop() || '';
    if (path === 'repentance-project.html' || path === 'repentance-project') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.has('site') || params.has('view') || params.has('topic')) return false;
    const hash = (location.hash || '').slice(1);
    return hash !== 'study-full' && hash !== 'camp';
  }

  function resolveInitialPage() {
    const params = new URLSearchParams(window.location.search);
    const site = params.get('site');
    if (site) return normalize(site);
    if (params.get('watch')) return 'prayer-videos';
    if (params.get('view') || params.get('topic')) return 'map';
    if (location.hash === '#study-full') return 'downloads';
    return 'map';
  }

  function isIndexSiteShell() {
    return document.body.hasAttribute('data-site-page') || Boolean(document.getElementById('map'));
  }

  function scrollToStudyFull(behavior = 'smooth') {
    const target = document.getElementById('study-full');
    if (!target) return;
    target.scrollIntoView({ behavior, block: 'start' });
  }

  function bindStudyFullLinks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href="#study-full"], a[href$="#study-full"]');
      if (!link) return;
      event.preventDefault();
      apply('downloads');
      requestAnimationFrame(() => scrollToStudyFull());
    });
  }

  function bind() {
    if (!isIndexSiteShell()) return;

    if (shouldRedirectToRepentanceHub()) {
      window.location.replace('repentance-project.html');
      return;
    }

    document.querySelectorAll('.site-nav-btn[data-site-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.sitePage;
        if (!page) return;
        apply(page);
        if (page === 'downloads') {
          document.getElementById('downloads-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (location.hash === '#study-full') {
            requestAnimationFrame(() => scrollToStudyFull());
          }
        }
        if (page === 'prayer-videos') {
          document.getElementById('core-prayer-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (page === 'map') {
          document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    bindStudyFullLinks();

    const params = new URLSearchParams(window.location.search);
    apply(resolveInitialPage(), { replace: true });
    if (location.hash === '#study-full') {
      requestAnimationFrame(() => scrollToStudyFull('auto'));
    }
  }

  window.LwmSitePages = { apply, current, bind, normalize };
})();
