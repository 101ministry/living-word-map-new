(function () {
  const data = window.DOWNLOADS_PDFS;
  const host = document.getElementById('downloads-pdf-hub');
  if (!data || !host || !Array.isArray(data.items)) return;

  host.innerHTML = data.items.map((item) => {
    const href = item.href || '#';
    const download = item.download || item.title || 'download.pdf';
    const title = item.title || 'PDF';
    const summary = item.summary || '';
    return `<a class="downloads-hub-card downloads-pdf-card" href="${href}" download="${download.replace(/"/g, '&quot;')}">
  <strong>${title}</strong>
  <span>${summary}</span>
</a>`;
  }).join('');
})();
