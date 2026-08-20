(() => {
  const fullHost = document.getElementById('study-full-body');
  if (!fullHost) return;

  fetch('why-bloodline-repentance.html')
    .then((res) => {
      if (!res.ok) throw new Error('Could not load study');
      return res.text();
    })
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const wrap = doc.querySelector('.wrap');
      if (!wrap) throw new Error('Study markup missing');
      fullHost.innerHTML = wrap.innerHTML;
    })
    .catch((err) => {
      fullHost.innerHTML = '<p class="study-load-error">The study could not be loaded. <a href="why-bloodline-repentance.html">Open the full page</a> or download the PDF.</p>';
      console.warn(err);
    });
})();
