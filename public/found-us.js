(() => {
  const CHOICE_KEY = 'lwm-how-found-us';
  const SEEN_KEY = 'lwm-found-us-seen';
  const SLACK =
    'https://join.slack.com/t/repentance101/shared_invite/zt-48344b3ds-vxCbNHRk4JKiR8oDwby9BA';
  const overlay = document.getElementById('found-us-overlay');
  const form = document.getElementById('found-us-form');
  const select = document.getElementById('found-us-select');
  const camp = document.getElementById('found-us-camp');
  const slack = document.getElementById('found-us-slack');
  const closeBtn = document.getElementById('found-us-close');
  if (!overlay || !form || !select) return;

  function showExtras() {
    const v = select.value;
    if (camp) camp.hidden = v !== 'camp';
    if (slack) slack.hidden = v !== 'slack';
  }

  function hide() {
    overlay.hidden = true;
  }

  function hasSeen() {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return true;
      if (localStorage.getItem(SEEN_KEY)) return true;
      if (localStorage.getItem(CHOICE_KEY)) return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  function markSeen() {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  function saveChoice(value) {
    try {
      localStorage.setItem(CHOICE_KEY, value);
    } catch {
      /* ignore */
    }
  }

  function reportChoice(value) {
    try {
      fetch('/api/found-us', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: value }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }

  function dismiss() {
    markSeen();
    hide();
  }

  function applyChoice(value) {
    if (!value) return;
    markSeen();
    reportChoice(value);
    saveChoice(value);
    if (value === 'camp') {
      location.href = 'index.html?site=map&view=camp';
      return;
    }
    if (value === 'slack') {
      window.open(SLACK, '_blank', 'noopener,noreferrer');
    }
    hide();
  }

  select.addEventListener('change', showExtras);
  closeBtn?.addEventListener('click', dismiss);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    applyChoice(select.value);
  });

  if (hasSeen() || document.documentElement.classList.contains('exp-record')) {
    hide();
    return;
  }
  overlay.hidden = false;
  showExtras();
})();
