(() => {
  const parchment = document.getElementById('pdf-landing');
  const closeBtn = document.getElementById('pdf-landing-close');
  const enterBtn = document.getElementById('pdf-landing-enter');
  const fullHost = document.getElementById('study-full-body');
  let lockedScrollY = 0;

  function isParchmentOpen() {
    return Boolean(parchment?.classList.contains('is-open'));
  }

  function syncHeaderHeight() {
    const header = document.querySelector('.header');
    if (!header) return;
    document.documentElement.style.setProperty('--lwm-header-height', `${header.offsetHeight}px`);
  }

  function lockBackground() {
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('parchment-lock');
    document.body.classList.add('parchment-lock');
    document.body.style.top = `-${lockedScrollY}px`;
  }

  function unlockBackground() {
    document.documentElement.classList.remove('parchment-lock');
    document.body.classList.remove('parchment-lock');
    document.body.style.top = '';
    window.scrollTo(0, lockedScrollY);
  }

  function closeParchment(options = {}) {
    if (!parchment) return;
    const wasOpen = isParchmentOpen();
    parchment.classList.remove('is-open');
    parchment.setAttribute('aria-hidden', 'true');
    unlockBackground();
    if (wasOpen && options.showAsk === true) {
      if (document.querySelector('.graph-panel.is-camp')) return;
      const mode = document.getElementById('view-mode')?.value;
      if (mode === 'camp') return;
      requestAnimationFrame(() => window.AskOverlay?.open?.(true));
    }
  }

  function openParchment() {
    if (!parchment) return;
    parchment.classList.add('is-open');
    parchment.setAttribute('aria-hidden', 'false');
    syncHeaderHeight();
    lockBackground();
  }

  function isInsideLandingScroller(target) {
    return Boolean(target instanceof Element && target.closest('.landing-work'));
  }

  function preventBackgroundScroll(event) {
    if (!isParchmentOpen()) return;
    if (document.documentElement.classList.contains('camp-isolated')) return;
    if (isInsideLandingScroller(event.target)) return;
    event.preventDefault();
  }

  function goToFullStudy(event) {
    event.preventDefault();
    closeParchment({ showAsk: false });
    requestAnimationFrame(() => {
      document.getElementById('study-full')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  closeBtn?.addEventListener('click', closeParchment);
  enterBtn?.addEventListener('click', closeParchment);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isParchmentOpen()) {
      event.preventDefault();
      closeParchment();
    }
  });
  document.addEventListener('wheel', preventBackgroundScroll, { passive: false });
  document.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
  parchment?.querySelector('a[href="#study-full"]')?.addEventListener('click', goToFullStudy);
  document.querySelector('.header-study-link')?.addEventListener('click', (event) => {
    if (!isParchmentOpen()) return;
    goToFullStudy(event);
  });
  window.addEventListener('resize', syncHeaderHeight);
  syncHeaderHeight();
  {
    const view = new URLSearchParams(location.search).get('view')
      || document.getElementById('view-mode')?.value
      || 'constellation';
    const mapView = view === 'globe' || view === 'constellation' || view === 'explore'
      || view === 'camp' || view === 'compare';
    if (mapView || location.hash === '#study-full') {
      closeParchment({ showAsk: false });
    } else if (isParchmentOpen()) {
      lockBackground();
    }
  }

  window.ParchmentLanding = { close: closeParchment, open: openParchment, isOpen: isParchmentOpen };

  const pageHost = document.getElementById('parchment-page1');

  function stripAfterContents(root) {
    const start = root.querySelector('#contents');
    if (!start) return;
    let node = start;
    while (node) {
      const next = node.nextSibling;
      node.remove();
      node = next;
    }
  }

  if (!fullHost && !pageHost) return;

  fetch('why-bloodline-repentance.html')
    .then((res) => {
      if (!res.ok) throw new Error('Could not load study');
      return res.text();
    })
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const wrap = doc.querySelector('.wrap');
      if (!wrap) throw new Error('Study markup missing');
      if (fullHost) fullHost.innerHTML = wrap.innerHTML;
      if (pageHost) {
        const clone = wrap.cloneNode(true);
        stripAfterContents(clone);
        pageHost.innerHTML = clone.innerHTML;
      }
    })
    .catch((err) => {
      if (fullHost) {
        fullHost.innerHTML = '<p class="study-load-error">The study could not be loaded. <a href="why-bloodline-repentance.html">Open the full page</a> or download the PDF.</p>';
      }
      if (pageHost) {
        pageHost.innerHTML = '<p class="study-load-error">Page 1 could not be loaded. Use the PDF download.</p>';
      }
      console.warn(err);
    });
})();
