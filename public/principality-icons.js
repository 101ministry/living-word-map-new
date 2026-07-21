(() => {
  const ABBREV_BY_ID = {
    'jealousy': 'JE',
    'slothfulness': 'SL',
    'haughtiness': 'HA',
    'lies': 'LI',
    'bondage': 'BN',
    'idolatry': 'ID',
    'error': 'ER',
    'fear': 'FR',
    'divination': 'DV',
    'heaviness': 'HV',
    'anti-christ': 'AC',
    'deaf-dumb': 'DD',
    'perversion': 'PE',
    'whoredom': 'WH',
    'infirmity': 'IF',
    'shedding-of-innocent-blood': 'SB',
    'treachery-against-others': 'TR',
    'using-and-abusing-others-emotionally-physically-spiritually-and-verbally': 'UA',
    'trading-floor-transactions-with-demons': 'TF',
    'gluttony': 'GL',
    'self-righteousness': 'SR',
    'sexual-perversion': 'SP',
    'rebellion': 'RB',
    'destructive-attitudes-against-god-s-image': 'DA',
    'destructive-identities-against-god': 'DI',
    'spirit-spouse-gods': 'SS',
  };

  function hashHue(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h) % 360;
  }

  function initials(name) {
    if (!name) return '?';
    const words = name.replace(/^The Principality of\s+/i, '').trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length > 1 ? 1 : 0][0]).toUpperCase();
  }

  function getAbbrev(id, name) {
    if (id && ABBREV_BY_ID[id]) return ABBREV_BY_ID[id];
    return initials(name);
  }

  function svgDataUrl(id, name) {
    const hue = hashHue(id);
    const label = getAbbrev(id, name);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue},42%,22%)"/>
          <stop offset="100%" stop-color="hsl(${hue},36%,12%)"/>
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="10" fill="url(#g)"/>
      <rect x="4" y="4" width="120" height="120" rx="8" fill="none" stroke="#c9a227" stroke-width="4"/>
      <text x="64" y="72" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="#f0ead6">${label}</text>
    </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  const cache = new Map();

  window.PrincipalityIcons = {
    customPaths(id) {
      const aliases = {
        'destructive-attitudes-against-god-s-image': [
          'images/principalities/destructive-attitudes-against-gods-image.svg',
        ],
      };
      const extra = aliases[id] || [];
      return [
        ...extra,
        `images/principalities/${id}.png`,
        `images/principalities/${id}.webp`,
        `images/principalities/${id}.svg`,
      ];
    },

    ensure(id, name, onReady) {
      const key = `p:${id}`;
      if (cache.has(key)) {
        const entry = cache.get(key);
        if (entry.ready) onReady?.(entry.img);
        return entry;
      }

      const entry = { img: new Image(), ready: false, id, name };
      cache.set(key, entry);
      entry.img.decoding = 'async';
      const paths = [...this.customPaths(id), svgDataUrl(id, name)];
      let pathIndex = 0;

      entry.img.onload = () => {
        entry.ready = true;
        onReady?.(entry.img);
        if (window.__principalityIconRefresh) window.__principalityIconRefresh();
      };
      entry.img.onerror = () => {
        pathIndex += 1;
        if (pathIndex < paths.length) {
          entry.img.src = paths[pathIndex];
        }
      };
      entry.img.src = paths[0];
      return entry;
    },

    draw(ctx, id, name, x, y, size, { selected = false, compare = false, dimmed = false } = {}) {
      const entry = this.ensure(id, name);
      const half = size / 2;
      const px = x - half;
      const py = y - half;

      ctx.save();
      if (dimmed) ctx.globalAlpha = 0.22;

      if (entry.ready) {
        ctx.drawImage(entry.img, px, py, size, size);
      } else {
        ctx.fillStyle = `hsl(${hashHue(id)}, 30%, 18%)`;
        ctx.fillRect(px, py, size, size);
        ctx.strokeStyle = '#c9a227';
        ctx.lineWidth = Math.max(1.5, size * 0.04);
        ctx.strokeRect(px, py, size, size);
        ctx.fillStyle = '#f0ead6';
        ctx.font = `${Math.max(10, size * 0.28)}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getAbbrev(id, name), x, y + size * 0.04);
      }

      if (compare) {
        ctx.strokeStyle = '#6b8cae';
        ctx.lineWidth = Math.max(2, size * 0.06);
        ctx.strokeRect(px - 2, py - 2, size + 4, size + 4);
      }
      if (selected) {
        ctx.strokeStyle = '#f0ead6';
        ctx.lineWidth = Math.max(2, size * 0.05);
        ctx.strokeRect(px - 1, py - 1, size + 2, size + 2);
      }

      ctx.restore();
      return entry.ready;
    },

    thumbSrc(id, name) {
      return svgDataUrl(id, name);
    },

    abbrev(id, name) {
      return getAbbrev(id, name);
    },

    label(id, name) {
      const code = getAbbrev(id, name);
      return name ? `${code} — ${name}` : code;
    },
  };
})();
