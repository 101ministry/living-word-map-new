(() => {
  const landingHost = document.getElementById('study-page1');
  const fullHost = document.getElementById('study-full-body');
  if (!landingHost && !fullHost) return;

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

  fetch('why-bloodline-repentance.html')
    .then((res) => {
      if (!res.ok) throw new Error('Could not load study');
      return res.text();
    })
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const wrap = doc.querySelector('.wrap');
      if (!wrap) throw new Error('Study markup missing');

      if (fullHost) {
        fullHost.innerHTML = wrap.innerHTML;
      }

      if (landingHost) {
        const clone = wrap.cloneNode(true);
        stripAfterContents(clone);
        landingHost.innerHTML = clone.innerHTML;
      }
    })
    .catch((err) => {
      if (landingHost) {
        landingHost.innerHTML = '<p class="study-load-error">The study could not be loaded. Use the PDF download.</p>';
      }
      if (fullHost) {
        fullHost.innerHTML = '<p class="study-load-error">The study could not be loaded. <a href="why-bloodline-repentance.html">Open the full page</a> or download the PDF.</p>';
      }
      console.warn(err);
    });
})();
