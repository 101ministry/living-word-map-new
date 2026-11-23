(() => {
  const COLORS = ['#c9a227', '#8d6e63', '#6b8cae', '#9b6b8c', '#5c7a45', '#a85a3a', '#6e5b8a', '#3d6b6b', '#8a5a4a', '#4a6741', '#6a5344'];
  const canvas = document.getElementById('wheel');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('wheel-spin');
  const backBtn = document.getElementById('wheel-back');
  const stepEl = document.getElementById('wheel-step');
  const topicEl = document.getElementById('wheel-topic');
  const rootEl = document.getElementById('wheel-root-name');
  const noteEl = document.getElementById('wheel-teaching');
  const logEl = document.getElementById('wheel-log');

  let groups = [];
  let entries = [];
  let history = [];
  let mode = 'roots';
  let activeRoot = '';
  let rotation = 0;
  let spinning = false;

  function topicsFor(root) {
    return groups.find(group => group.root === root)?.topics || [];
  }

  function doneNames(root) {
    return history.filter(item => item.kind === 'TOPIC' && item.root === root).map(item => item.name);
  }

  function rootComplete(root) {
    const all = topicsFor(root);
    if (!all.length) return false;
    const done = new Set(doneNames(root));
    return all.every(name => done.has(name));
  }

  function remainingTopics(root) {
    const done = new Set(doneNames(root));
    return topicsFor(root).filter(name => !done.has(name));
  }

  function renderLog() {
    const latestOpen = new Map();
    history.forEach((item, index) => {
      if (item.kind === 'TOPIC' && !rootComplete(item.root)) latestOpen.set(item.root, index);
    });
    logEl.innerHTML = history.map((item, index) => {
      if (item.kind === 'ROOT') {
        return `<li class="is-root">${item.root}</li>`;
      }
      const done = rootComplete(item.root) || latestOpen.get(item.root) !== index;
      return `<li class="${done ? 'is-done' : ''}">${item.name}</li>`;
    }).join('');
    logEl.scrollTop = logEl.scrollHeight;
  }

  async function record(kind, root, name) {
    history.push({ kind, root, name: name || '' });
    renderLog();
    try {
      const res = await fetch('/api/topic-wheel-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, root, name: name || '' }),
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      noteEl.textContent = 'This spin is on the panel, but it was not saved to data/TOPIC-WHEEL-LOG.txt. Restart the local server and spin again if the file must keep it.';
    }
  }

  function draw() {
    const size = canvas.width;
    const radius = size / 2 - 8;
    const cx = size / 2;
    const cy = size / 2;
    ctx.clearRect(0, 0, size, size);
    if (!entries.length) return;
    const slice = (Math.PI * 2) / entries.length;
    const showLabels = entries.length <= 40;
    entries.forEach((item, i) => {
      const start = -Math.PI / 2 + rotation + i * slice;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      const selected = mode === 'roots' && history.some(row => row.kind === 'ROOT' && row.root === item.root);
      ctx.strokeStyle = selected ? '#f0ead6' : 'rgba(10,11,15,0.35)';
      ctx.lineWidth = selected ? 6 : 1;
      ctx.stroke();
      if (showLabels) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + slice / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#1a1408';
        ctx.font = mode === 'roots' ? '600 16px "DM Sans", sans-serif' : '14px "DM Sans", sans-serif';
        const text = mode === 'roots' ? item.root : item.name;
        ctx.fillText(text.length > 32 ? `${text.slice(0, 30)}…` : text, radius - 16, 6);
        ctx.restore();
      }
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#f0ead6';
    ctx.fill();
  }

  function showRoots() {
    mode = 'roots';
    activeRoot = '';
    rotation = 0;
    entries = groups.map(group => ({ root: group.root }));
    stepEl.textContent = 'Root wheel';
    backBtn.hidden = true;
    spinBtn.textContent = 'Spin';
    topicEl.textContent = 'Spin for a root';
    rootEl.textContent = 'A selected root keeps a light ring.';
    noteEl.textContent = 'Chosen topics stay in this list. The order is also saved in data/TOPIC-WHEEL-LOG.txt.';
    renderLog();
    draw();
  }

  function showTopics(root) {
    const left = remainingTopics(root);
    if (!left.length) {
      showRoots();
      return;
    }
    mode = 'topics';
    activeRoot = root;
    rotation = 0;
    entries = left.map(name => ({ root, name }));
    stepEl.textContent = root;
    backBtn.hidden = false;
    spinBtn.textContent = 'Spin topics';
    topicEl.textContent = root;
    rootEl.textContent = `${left.length} topics left`;
    noteEl.textContent = 'The topic that just landed stays unmarked. Earlier topics for this root are crossed out and leave the wheel.';
    renderLog();
    draw();
  }

  function winnerIndex(angle) {
    const slice = (Math.PI * 2) / entries.length;
    let local = (-Math.PI / 2 - angle) % (Math.PI * 2);
    if (local < 0) local += Math.PI * 2;
    return Math.floor(local / slice) % entries.length;
  }

  function spin() {
    if (spinning || !entries.length) return;
    spinning = true;
    spinBtn.disabled = true;
    const slice = (Math.PI * 2) / entries.length;
    const pick = Math.floor(Math.random() * entries.length);
    const turns = Math.PI * 2 * (5 + Math.random() * 2);
    const current = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = -(pick + 0.5) * slice - current;
    while (delta < turns) delta += Math.PI * 2;
    const from = rotation;
    const to = rotation + delta;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / 4200);
      const ease = 1 - Math.pow(1 - t, 3);
      rotation = from + (to - from) * ease;
      draw();
      if (t < 1) {
        requestAnimationFrame(frame);
        return;
      }
      rotation = to;
      const landed = entries[winnerIndex(rotation)];
      spinning = false;
      spinBtn.disabled = false;
      if (mode === 'roots') {
        record('ROOT', landed.root).then(() => showTopics(landed.root));
        return;
      }
      record('TOPIC', landed.root, landed.name).then(() => {
        if (rootComplete(landed.root)) showRoots();
        else showTopics(landed.root);
      });
    }
    requestAnimationFrame(frame);
  }

  function parseLog(text) {
    return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
      const parts = line.split('\t');
      if (parts.length < 3) return null;
      return { kind: parts[1], root: parts[2], name: parts[3] || '' };
    }).filter(Boolean);
  }

  Promise.all([
    fetch('attitudes-identities-topics.json').then(res => res.json()),
    fetch('/api/topic-wheel-log').then(res => (res.ok ? res.text() : '')).catch(() => ''),
  ]).then(([data, logText]) => {
    const order = [];
    const map = new Map();
    data.forEach(item => {
      if (!map.has(item.root)) {
        map.set(item.root, []);
        order.push(item.root);
      }
      map.get(item.root).push(item.name);
    });
    groups = order.map(root => ({ root, topics: map.get(root) }));
    history = parseLog(logText || '');
    showRoots();
  }).catch(() => {
    topicEl.textContent = 'The topic list did not load.';
  });

  spinBtn.addEventListener('click', spin);
  backBtn.addEventListener('click', () => {
    if (!spinning) showRoots();
  });
})();
