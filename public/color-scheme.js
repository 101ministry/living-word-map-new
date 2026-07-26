(() => {
  /** Root = text / foreground palette (brighter on dark UI) */
  const ROOT_FAMILIES = [
    { id: 'pride-and-self-exaltation', label: 'Pride and Self-Exaltation', color: '#E53935', aliases: ['self-exaltation', 'loneliness-and-self-exaltation'] },
    { id: 'fear-and-insecurity', label: 'Fear and Insecurity', color: '#FB8C00', aliases: ['fear-and-insecurity'] },
    { id: 'unbelief-and-distrust-of-god', label: 'Unbelief and Distrust of God', color: '#FDD835', aliases: ['unbelief', 'distrust-of-god'] },
    { id: 'bitterness-and-unforgiveness', label: 'Bitterness and Unforgiveness', color: '#43A047', aliases: ['bitterness', 'unforgiveness'] },
    { id: 'control-and-rebellion', label: 'Control and Rebellion', color: '#1E88E5', aliases: ['control-and-rebellion', 'rebellion'] },
    { id: 'deception-and-falsehood', label: 'Deception and Falsehood', color: '#8E24AA', aliases: ['deception', 'falsehood'] },
    { id: 'shame-and-false-identity', label: 'Shame and False Identity', color: '#EC407A', aliases: ['shame', 'false-identity'] },
    { id: 'loneliness-and-emotional-brokenness', label: 'Loneliness and Emotional Brokenness', color: '#8D6E63', aliases: ['loneliness', 'emotional-brokenness'] },
    { id: 'addiction-and-bondage', label: 'Addiction and Bondage', color: '#ECEFF1', aliases: ['addiction', 'bondage'] },
    { id: 'covetousness-and-materialism', label: 'Covetousness and Materialism', color: '#757575', aliases: ['covetousness', 'materialism'] },
    { id: 'idolatry-and-self-worship', label: 'Idolatry and Self-Worship', color: '#FFD54F', aliases: ['idolatry', 'self-worship'] },
  ];

  /** Fruit = background palette (deeper / earthier) */
  const FRUIT_FAMILIES = [
    { id: 'anger-and-violence', label: 'Anger and Violence', color: '#B71C1C', aliases: ['because-of-anger-and-violence'] },
    { id: 'division-and-relational-destruction', label: 'Division and Relational Destruction', color: '#E65100', aliases: ['physical-division-and-relational-destruction', 'relational-destruction'] },
    { id: 'sexual-corruption', label: 'Sexual Corruption', color: '#F9A825', aliases: ['sexual'] },
    { id: 'occultism-and-counterfeit-spirituality', label: 'Occultism and Counterfeit Spirituality', color: '#2E7D32', aliases: ['occultism', 'counterfeit-spirituality', 'because-of-occultism'] },
    { id: 'false-religion-and-doctrinal-error', label: 'False Religion and Doctrinal Error', color: '#1565C0', aliases: ['false-religion', 'doctrinal-error', 'because-of-false-religion', 'false-religion-and-occultism'] },
    { id: 'destructive-attitudes-against-god-s-image', label: "Destructive Attitudes Against God's Image", color: '#C62828', aliases: ['destructive-attitudes', 'against-gods-image-attitudes'] },
    { id: 'destructive-identities-against-god-s-image', label: "Destructive Identities Against God's Image", color: '#AD1457', aliases: ['destructive-identities', 'familiar-spirits-fruit'] },
    { id: 'mental-oppression-and-confusion', label: 'Mental Oppression and Confusion', color: '#6A1B9A', aliases: ['mental-oppression', 'because-of-mental-oppression'] },
    { id: 'death-and-self-destruction', label: 'Death and Self-Destruction', color: '#4E342E', aliases: ['death-and-social-destruction', 'self-destruction'] },
    { id: 'physical-weakness-and-infirmity', label: 'Physical Weakness and Infirmity', color: '#90A4AE', aliases: ['physical-weakness', 'infirmity'] },
    { id: 'neglect-and-lack-of-stewardship', label: 'Neglect and Lack of Stewardship', color: '#263238', aliases: ['neglect', 'lack-of-stewardship'] },
    { id: 'abuse-and-exploitation-of-others', label: 'Abuse and Exploitation of Others', color: '#CFD8DC', aliases: ['abuse-and-exploitation', 'exploitation-of-others'] },
    { id: 'anti-christ-spirit-or-separation-from-god', label: 'Anti-Christ Spirit / Separation From God', color: '#546E7A', aliases: ['anti-christ', 'separation-from-god'] },
  ];

  const PRINCIPALITY_COLOR = '#C9A227';
  const TOPIC_DEFAULT = '#5A6270';

  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: l * 100 };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) {
      const v = l * 255;
      return { r: v, g: v, b: v };
    }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
      r: hue2rgb(p, q, h + 1 / 3) * 255,
      g: hue2rgb(p, q, h) * 255,
      b: hue2rgb(p, q, h - 1 / 3) * 255,
    };
  }

  /** Shift lightness/saturation/hue slightly so extra fruits in the same family stay distinct */
  function varyColor(hex, seed, { hue = 6, sat = 8, light = 7 } = {}) {
    const { r, g, b } = hexToRgb(hex);
    const hsl = rgbToHsl(r, g, b);
    const h = hashString(String(seed));
    hsl.h = (hsl.h + ((h % 7) - 3) * hue + 360) % 360;
    hsl.s = Math.max(12, Math.min(92, hsl.s + ((h >> 3) % 5 - 2) * sat));
    hsl.l = Math.max(14, Math.min(88, hsl.l + ((h >> 6) % 5 - 2) * light));
    const out = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(out.r, out.g, out.b);
  }

  function withAlpha(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function matchFamilyByName(name, families) {
    if (!name) return null;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return matchFamily(slug, families);
  }

  function resolveRootByName(name) {
    const family = matchFamilyByName(name, ROOT_FAMILIES);
    if (family) return family.color;
    return resolveRoot(slugifyName(name));
  }

  function resolveFruitByName(name) {
    const family = matchFamilyByName(name, FRUIT_FAMILIES);
    if (family) return family.color;
    return resolveFruit(slugifyName(name));
  }

  function slugifyName(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function linkColor(type, targetId, lookups) {
    if (type === 'has_root') {
      const item = lookups?.root?.[targetId];
      return withAlpha(resolveRoot(item || targetId), 0.9);
    }
    if (type === 'has_fruit') {
      const item = lookups?.fruit?.[targetId];
      return withAlpha(resolveFruit(item || targetId), 0.88);
    }
    if (type === 'belongs_to') {
      return withAlpha(PRINCIPALITY_COLOR, 0.85);
    }
    return 'rgba(255,255,255,0.12)';
  }

  function matchFamily(slug, families) {
    if (!slug) return null;
    const s = slug.toLowerCase();
    let best = null;
    for (const family of families) {
      const keys = [family.id, ...(family.aliases || [])];
      for (const key of keys) {
        if (s === key || s.includes(key)) {
          if (!best || key.length > best.key.length) {
            best = { family, key };
          }
        }
      }
    }
    return best?.family ?? null;
  }

  function resolveRoot(item) {
    const slug = typeof item === 'string' ? item : item?.id;
    const family = matchFamily(slug, ROOT_FAMILIES);
    if (!family) {
      return varyColor('#78909C', slug || 'unknown-root', { hue: 12, sat: 10, light: 5 });
    }
    if (slug === family.id) return family.color;
    return varyColor(family.color, slug, { hue: 4, sat: 5, light: 4 });
  }

  function resolveFruit(item) {
    const slug = typeof item === 'string' ? item : item?.id;
    const family = matchFamily(slug, FRUIT_FAMILIES);
    if (!family) {
      return varyColor('#455A64', slug || 'unknown-fruit', { hue: 14, sat: 12, light: 6 });
    }
    if (slug === family.id) return family.color;
    return varyColor(family.color, slug, { hue: 8, sat: 10, light: 8 });
  }

  function isLightColor(hex) {
    let r; let g; let b;
    if (typeof hex === 'string' && hex.startsWith('rgba')) {
      const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return false;
      r = +m[1]; g = +m[2]; b = +m[3];
    } else {
      ({ r, g, b } = hexToRgb(hex));
    }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62;
  }

  function nodeStroke(hex) {
    return isLightColor(hex) ? 'rgba(20, 22, 30, 0.85)' : 'rgba(255, 255, 255, 0.18)';
  }

  function colorForNode(id, lookups) {
    if (lookups.principality[id]) {
      return { fill: PRINCIPALITY_COLOR, stroke: 'rgba(255, 255, 255, 0.22)' };
    }
    if (lookups.root[id]) {
      const fill = resolveRoot(lookups.root[id]);
      return { fill, stroke: nodeStroke(fill) };
    }
    if (lookups.fruit[id]) {
      const fill = resolveFruit(lookups.fruit[id]);
      return { fill, stroke: nodeStroke(fill) };
    }
    if (lookups.topic[id]) {
      const t = lookups.topic[id];
      const fillId = t.fruitIds?.[0] || t.fruitId || t.rootIds?.[0] || t.rootId;
      const fill = t.fruitIds?.length || t.fruitId
        ? resolveFruit(t.fruitIds?.[0] || t.fruitId)
        : (t.rootIds?.length || t.rootId ? resolveRoot(t.rootIds?.[0] || t.rootId) : TOPIC_DEFAULT);
      return { fill: withAlpha(fill, 0.85), stroke: nodeStroke(fill) };
    }
    return { fill: TOPIC_DEFAULT, stroke: 'rgba(255,255,255,0.15)' };
  }

  function chipStyle(type, id, lookups) {
    if (type === 'principality' || type === 'principalitys') {
      return {
        borderColor: withAlpha(PRINCIPALITY_COLOR, 0.55),
        backgroundColor: withAlpha(PRINCIPALITY_COLOR, 0.14),
      };
    }
    const key = type.replace(/s$/, '');
    const nodeId = key === 'topic' ? id : id;
    const item = lookups[key]?.[nodeId];
    if (key === 'root' && item) {
      const c = resolveRoot(item);
      return { borderColor: withAlpha(c, 0.65), backgroundColor: withAlpha(c, 0.16) };
    }
    if (key === 'fruit' && item) {
      const c = resolveFruit(item);
      return { borderColor: withAlpha(c, 0.7), backgroundColor: withAlpha(c, 0.18) };
    }
    if (key === 'topic' && item) {
      const fruitId = item.fruitIds?.[0] || item.fruitId;
      const rootId = item.rootIds?.[0] || item.rootId;
      const c = fruitId ? resolveFruit(fruitId) : resolveRoot(rootId);
      return { borderColor: withAlpha(c, 0.55), backgroundColor: withAlpha(c || TOPIC_DEFAULT, 0.12) };
    }
    return {};
  }

  function renderLegend(container) {
    if (!container) return;
    const rootRows = ROOT_FAMILIES.map(f =>
      `<li><span class="swatch" style="background:${f.color}"></span><span class="legend-label">${f.label}</span></li>`
    ).join('');
    const fruitRows = FRUIT_FAMILIES.map(f =>
      `<li><span class="swatch fruit-swatch" style="background:${f.color}"></span><span class="legend-label">${f.label}</span></li>`
    ).join('');
    container.innerHTML = `
      <h2>Root colors <span class="legend-hint">text</span></h2>
      <ul class="color-key">${rootRows}</ul>
      <h2>Fruit colors <span class="legend-hint">background</span></h2>
      <ul class="color-key">${fruitRows}</ul>
    `;
  }

  window.ColorScheme = {
    ROOT_FAMILIES,
    FRUIT_FAMILIES,
    PRINCIPALITY_COLOR,
    resolveRoot,
    resolveFruit,
    resolveRootByName,
    resolveFruitByName,
    linkColor,
    varyColor,
    withAlpha,
    isLightColor,
    colorForNode,
    chipStyle,
    renderLegend,
  };
})();
