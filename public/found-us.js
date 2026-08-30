(() => {
  const KEY = 'lwm-how-found-us';
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

  function save(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
  }

  function applyChoice(value) {
    if (!value) return;
    save(value);
    if (value === 'camp') {
      location.href = 'index.html?view=camp';
      return;
    }
    if (value === 'slack') {
      window.open(SLACK, '_blank', 'noopener,noreferrer');
    }
    hide();
  }

  select.addEventListener('change', showExtras);
  closeBtn?.addEventListener('click', hide);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    applyChoice(select.value);
  });

  let seen = '';
  try {
    seen = localStorage.getItem(KEY) || '';
  } catch {
    seen = '';
  }
  if (seen || document.documentElement.classList.contains('exp-record')) {
    hide();
    return;
  }
  overlay.hidden = false;
  showExtras();
})();
