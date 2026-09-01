(function () {
  const data = window.DOWNLOADS_PDFS;
  const host = document.getElementById('downloads-pdf-hub');
  if (!data || !host || !Array.isArray(data.items)) return;

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

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

  function cardLink(item) {
    const href = escapeHtml(item.href || '#');
    const download = escapeHtml(item.download || item.title || 'download.pdf');
    const title = escapeHtml(item.title || 'PDF');
    return `<a class="downloads-cal-link" href="${href}" download="${download}" title="${escapeHtml(item.summary || item.title)}">${title}</a>`;
  }

  function render() {
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const lead = first.getDay();
    const currentYm = ym(year, month);
    const canPrev = currentYm > minYm;
    const canNext = currentYm < maxYm;

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
          <button type="button" class="downloads-cal-nav" data-cal-dir="-1" ${canPrev ? '' : 'disabled'} aria-label="Previous month">‹</button>
          <h4 class="downloads-cal-title">${MONTHS[month - 1]} ${year}</h4>
          <button type="button" class="downloads-cal-nav" data-cal-dir="1" ${canNext ? '' : 'disabled'} aria-label="Next month">›</button>
        </div>
        <div class="downloads-cal-weekdays">${WEEKDAYS.map((d) => `<span>${d}</span>`).join('')}</div>
        <div class="downloads-cal-grid">${cells.join('')}</div>
        <p class="downloads-cal-legend">PDFs sit on the day the study was made. Tap a title to download.</p>
      </div>
    `;

    host.querySelectorAll('[data-cal-dir]').forEach((btn) => {
      btn.addEventListener('click', () => shiftMonth(Number(btn.getAttribute('data-cal-dir'))));
    });
  }

  render();
})();
