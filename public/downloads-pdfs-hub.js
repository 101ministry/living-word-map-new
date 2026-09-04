(function () {
  const data = window.DOWNLOADS_PDFS;
  const host = document.getElementById('downloads-pdf-hub');
  if (!data || !host || !Array.isArray(data.items)) return;

  function readLang() {
    try {
      return localStorage.getItem('lwm-language') || localStorage.getItem('lwm-round-prayer-lang') || 'en';
    } catch {
      return 'en';
    }
  }

  function ui(key) {
    return window.LwmSiteI18n?.ui?.(readLang(), key) || '';
  }

  function monthTitle(y, m, lang) {
    const loc = String(lang || 'en').toLowerCase() === 'de' ? 'de-DE' : 'en-US';
    return new Date(y, m - 1, 1).toLocaleString(loc, { month: 'long', year: 'numeric' });
  }

  function weekdayLabels(lang) {
    const loc = String(lang || 'en').toLowerCase() === 'de' ? 'de-DE' : 'en-US';
    const fmt = new Intl.DateTimeFormat(loc, { weekday: 'short' });
    const base = new Date(2026, 0, 4);
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseMade(item) {
    const raw = String(item.made || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const [y, m, d] = raw.split('-').map(Number);
    return { y, m, d, key: raw };
  }

  const items = data.items.map((item) => ({ ...item, when: parseMade(item) })).filter((item) => item.when);
  if (!items.length) return;

  const byDay = new Map();
  items.forEach((item) => {
    const list = byDay.get(item.when.key) || [];
    list.push(item);
    byDay.set(item.when.key, list);
  });

  const latest = items.reduce((a, b) => (a.when.key > b.when.key ? a : b));
  const monthCounts = new Map();
  items.forEach((item) => {
    const key = item.when.key.slice(0, 7);
    monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
  });
  let startYm = latest.when.key.slice(0, 7);
  let startCount = 0;
  monthCounts.forEach((count, key) => {
    if (count > startCount) {
      startCount = count;
      startYm = key;
    }
  });
  let year = Number(startYm.slice(0, 4));
  let month = Number(startYm.slice(5, 7));

  const minKey = items.reduce((min, item) => (item.when.key < min ? item.when.key : min), items[0].when.key);
  const maxKey = latest.when.key;
  const minYm = minKey.slice(0, 7);
  const maxYm = maxKey.slice(0, 7);

  const applet = document.getElementById('downloads-pdf-applet');
  const appletTitle = document.getElementById('downloads-pdf-applet-title');
  const appletSummary = document.getElementById('downloads-pdf-applet-summary');
  const appletDl = document.getElementById('downloads-pdf-applet-dl');
  const appletFrame = document.getElementById('downloads-pdf-applet-frame');
  const appletClose = document.getElementById('downloads-pdf-applet-close');
  const appletPending = document.getElementById('downloads-pdf-applet-pending');
  const appletPendingText = document.getElementById('downloads-pdf-applet-pending-text');
  const appletCancel = document.getElementById('downloads-pdf-applet-cancel');
  const appletBar = applet?.querySelector('.downloads-pdf-applet-bar');
  const DOWNLOAD_DELAY_MS = 10000;
  let pendingDownload = null;

  function ym(y, m) {
    return `${y}-${String(m).padStart(2, '0')}`;
  }

  function dayKey(y, m, d) {
    return `${ym(y, m)}-${String(d).padStart(2, '0')}`;
  }

  function shiftMonth(delta) {
    const dt = new Date(year, month - 1 + delta, 1);
    year = dt.getFullYear();
    month = dt.getMonth() + 1;
    render();
  }

  function linkLabel(item) {
    const title = item.title || 'PDF';
    const summary = String(item.summary || '').trim();
    return summary ? `${title} - ${summary}` : title;
  }

  function cardLink(item) {
    const href = escapeHtml(item.href || '#');
    const download = escapeHtml(item.download || item.title || 'download.pdf');
    const title = escapeHtml(item.title || 'PDF');
    const summary = escapeHtml(item.summary || '');
    const label = escapeHtml(linkLabel(item));
    return (
      `<a class="downloads-cal-link" href="${href}" download="${download}" ` +
      `data-pdf-href="${href}" data-pdf-download="${download}" data-pdf-title="${title}" data-pdf-summary="${summary}">` +
      `${label}</a>`
    );
  }

  function secondsLeft(endsAt) {
    return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  }

  function setPendingCopy(text) {
    if (appletPendingText) appletPendingText.textContent = text;
  }

  function clearPendingDownload(message) {
    if (pendingDownload?.timer) window.clearTimeout(pendingDownload.timer);
    if (pendingDownload?.tick) window.clearInterval(pendingDownload.tick);
    pendingDownload = null;
    if (message) {
      setPendingCopy(message);
      if (appletCancel) appletCancel.hidden = true;
      if (appletPending) appletPending.hidden = false;
      return;
    }
    if (appletPending) appletPending.hidden = true;
    if (appletCancel) appletCancel.hidden = false;
  }

  function triggerPdfDownload(item) {
    if (!item?.href) return;
    const a = document.createElement('a');
    a.href = item.href;
    a.setAttribute('download', item.download || item.title || 'download.pdf');
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function schedulePdfDownload(item) {
    clearPendingDownload();
    const endsAt = Date.now() + DOWNLOAD_DELAY_MS;
    if (appletPending) appletPending.hidden = false;
    if (appletCancel) appletCancel.hidden = false;
    setPendingCopy(`Download starts in ${secondsLeft(endsAt)} seconds. Cancel if the window loaded.`);
    const tick = window.setInterval(() => {
      if (!pendingDownload) return;
      const left = secondsLeft(pendingDownload.endsAt);
      if (left <= 0) return;
      setPendingCopy(`Download starts in ${left} second${left === 1 ? '' : 's'}. Cancel if the window loaded.`);
    }, 250);
    const timer = window.setTimeout(() => {
      const current = pendingDownload?.item;
      clearPendingDownload('Download started. You can keep reading in this window.');
      if (current) triggerPdfDownload(current);
    }, DOWNLOAD_DELAY_MS);
    pendingDownload = { timer, tick, item, endsAt };
  }

  function closePdfApplet() {
    clearPendingDownload();
    if (!applet) return;
    applet.hidden = true;
    applet.classList.remove('is-open');
    if (appletFrame) appletFrame.src = 'about:blank';
  }

  function openPdfApplet(item) {
    if (!applet || !item?.href) {
      window.location.assign(item?.href || '#');
      return;
    }
    if (appletTitle) appletTitle.textContent = item.title || 'PDF';
    if (appletSummary) {
      appletSummary.textContent = item.summary || '';
      appletSummary.hidden = !item.summary;
    }
    if (appletDl) {
      appletDl.href = item.href;
      appletDl.setAttribute('download', item.download || item.title || 'download.pdf');
    }
    if (appletFrame) appletFrame.src = item.href;
    applet.hidden = false;
    applet.classList.add('is-open');
    schedulePdfDownload(item);
  }

  function bindAppletDrag() {
    if (!applet || !appletBar || appletBar.dataset.dragBound === '1') return;
    appletBar.dataset.dragBound = '1';
    appletBar.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('a, button')) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = applet.getBoundingClientRect();
      appletBar.setPointerCapture(e.pointerId);
      const move = (ev) => {
        applet.style.left = `${Math.max(8, rect.left + ev.clientX - startX)}px`;
        applet.style.top = `${Math.max(8, rect.top + ev.clientY - startY)}px`;
        applet.style.right = 'auto';
        applet.style.bottom = 'auto';
      };
      const up = () => {
        appletBar.removeEventListener('pointermove', move);
        appletBar.removeEventListener('pointerup', up);
      };
      appletBar.addEventListener('pointermove', move);
      appletBar.addEventListener('pointerup', up);
    });
  }

  function render() {
    const lang = readLang();
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const lead = first.getDay();
    const currentYm = ym(year, month);
    const canPrev = currentYm > minYm;
    const canNext = currentYm < maxYm;
    const legend =
      ui('downloadsCalLegend') ||
      'PDFs sit on the day the study was made. Tap a title to open it. Download starts in 10 seconds unless you cancel.';
    const prevLabel = ui('downloadsCalPrev') || 'Previous month';
    const nextLabel = ui('downloadsCalNext') || 'Next month';

    const cells = [];
    for (let i = 0; i < lead; i += 1) {
      cells.push('<div class="downloads-cal-day is-empty" aria-hidden="true"></div>');
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = dayKey(year, month, day);
      const dayItems = byDay.get(key) || [];
      const links = dayItems.map(cardLink).join('');
      const has = dayItems.length > 0;
      cells.push(
        `<div class="downloads-cal-day${has ? ' has-pdfs' : ''}">` +
          `<span class="downloads-cal-num">${day}</span>` +
          (has ? `<div class="downloads-cal-links">${links}</div>` : '') +
        '</div>'
      );
    }

    host.innerHTML = `
      <div class="downloads-cal">
        <div class="downloads-cal-toolbar">
          <button type="button" class="downloads-cal-nav" data-cal-dir="-1" ${canPrev ? '' : 'disabled'} aria-label="${escapeHtml(prevLabel)}">‹</button>
          <h4 class="downloads-cal-title">${escapeHtml(monthTitle(year, month, lang))}</h4>
          <button type="button" class="downloads-cal-nav" data-cal-dir="1" ${canNext ? '' : 'disabled'} aria-label="${escapeHtml(nextLabel)}">›</button>
        </div>
        <div class="downloads-cal-weekdays">${weekdayLabels(lang).map((d) => `<span>${escapeHtml(d)}</span>`).join('')}</div>
        <div class="downloads-cal-grid">${cells.join('')}</div>
        <p class="downloads-cal-legend">${escapeHtml(legend)}</p>
      </div>
    `;

    host.querySelectorAll('[data-cal-dir]').forEach((btn) => {
      btn.addEventListener('click', () => shiftMonth(Number(btn.getAttribute('data-cal-dir'))));
    });
  }

  host.addEventListener('click', (e) => {
    const link = e.target.closest('a.downloads-cal-link');
    if (!link || !host.contains(link)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    openPdfApplet({
      href: link.getAttribute('data-pdf-href') || link.getAttribute('href'),
      download: link.getAttribute('data-pdf-download') || '',
      title: link.getAttribute('data-pdf-title') || link.textContent,
      summary: link.getAttribute('data-pdf-summary') || '',
    });
  });

  appletClose?.addEventListener('click', closePdfApplet);
  appletCancel?.addEventListener('click', () => {
    clearPendingDownload('Download canceled. Use Download if you still want the file.');
  });
  appletDl?.addEventListener('click', () => {
    clearPendingDownload('Using Download now.');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && applet && !applet.hidden) closePdfApplet();
  });
  bindAppletDrag();

  window.addEventListener('lwm:language-changed', render);
  window.addEventListener('lwm:site-i18n-applied', render);
  render();
})();
