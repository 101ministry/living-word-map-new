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

  let byRoot = [];
  let entries = [];
  let mode = 'roots';
  let activeRoot = '';
  let rotation = 0;
  let spinning = false;

  function labelOf(item) {
    return mode === 'roots' ? item.root : item.name;
  }

  function showRoots() {
    mode = 'roots';
    activeRoot = '';
    rotation = 0;
    entries = byRoot.map(group => ({ root: group.root, name: group.root }));
    stepEl.textContent = 'Root wheel';
    backBtn.hidden = true;
    spinBtn.textContent = 'Spin';
    topicEl.textContent = 'Spin for a root';
    rootEl.textContent = '';
    noteEl.textContent = 'The next wheel lists every topic under the root that lands.';
    draw();
  }

  function showTopics(root) {
    const group = byRoot.find(item => item.root === root);
    if (!group) return;
    mode = 'topics';
    activeRoot = root;
    rotation = 0;
    entries = group.topics.map(name => ({ root, name }));
    stepEl.textContent = root;
    backBtn.hidden = false;
    spinBtn.textContent = 'Spin topics';
    topicEl.textContent = root;
    rootEl.textContent = `${entries.length} topics`;
    noteEl.textContent = 'Spin this wheel to choose the topic whose new teaching starts here.';
    draw();
  }

  function draw() {
    const size = canvas.width;
    const r = size / 2 - 8;
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
      ctx.arc(cx, cy, r, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(10,11,15,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (showLabels) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + slice / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#1a1408';
        ctx.font = mode === 'roots' ? '600 18px "DM Sans", sans-serif' : '14px "DM Sans", sans-serif';
        const text = labelOf(item);
        const label = text.length > 32 ? `${text.slice(0, 30)}…` : text;
        ctx.fillText(label, r - 16, 6);
        ctx.restore();
      }
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#f0ead6';
    ctx.fill();
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
    const current = rotation % (Math.PI * 2);
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
      spinning = false;
      spinBtn.disabled = false;
      const landed = entries[winnerIndex(rotation)];
      if (mode === 'roots') {
        showTopics(landed.root);
        return;
      }
      topicEl.textContent = landed.name;
      rootEl.textContent = landed.root;
      noteEl.textContent = 'This new teaching has not been added yet. It will not use the videos already on the Video page.';
    }
    requestAnimationFrame(frame);
  }

  fetch('attitudes-identities-topics.json')
    .then(res => res.json())
    .then(data => {
      const order = [];
      const groups = new Map();
      data.forEach(item => {
        if (!groups.has(item.root)) {
          groups.set(item.root, []);
          order.push(item.root);
        }
        groups.get(item.root).push(item.name);
      });
      byRoot = order.map(root => ({ root, topics: groups.get(root) }));
      showRoots();
    })
    .catch(() => {
      topicEl.textContent = 'The topic list did not load.';
    });

  spinBtn.addEventListener('click', spin);
  backBtn.addEventListener('click', () => {
    if (!spinning) showRoots();
  });
})();
