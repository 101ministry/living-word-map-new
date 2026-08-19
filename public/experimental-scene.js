(() => {
  'use strict';

  let canvas;
  let ctx;
  let captionEl;
  let profile = null;
  let focusSet = 1;
  let focusRound = 1;
  let fractions = { 1: 0, 2: 0, 3: 0 };
  let setFractions = {};
  let crewSize = 1;
  let width = 640;
  let height = 480;
  let running = false;
  const walkers = [];
  const GEO = () => window.ExperimentalGeo;
  let adminBoundary = null;
  let placeStack = null;
  let boundaryToken = 0;
  const portraits = {
    man: new Image(),
    woman: new Image(),
    couple: new Image(),
  };
  const portraitReady = { man: false, woman: false, couple: false };
  const PART_FOLDERS = [
    '01-skeleton',
    '02-muscles',
    '03-male-adult',
    '04-male-female-skeletons',
    '05-male-female-anatomical',
    '06-male-female-adults',
  ];
  const partImages = {};
  const partReady = {};
  const TILE_COLS = 6;
  const TILE_ROWS = 37;
  const TILE_COUNT = TILE_COLS * TILE_ROWS;
  let layerCanvas = null;
  let layerCtx = null;
  let lastAim = { x: 320, y: 240 };

  function loadPortraits() {
    const files = {
      man: 'experimental/characters/man.png',
      woman: 'experimental/characters/woman.png',
      couple: 'experimental/characters/couple.png',
    };
    Object.keys(files).forEach((key) => {
      const img = portraits[key];
      img.decoding = 'async';
      img.onload = () => {
        portraitReady[key] = true;
        draw();
      };
      img.onerror = () => {
        portraitReady[key] = false;
      };
      img.src = files[key];
    });
  }

  function loadPartImages() {
    PART_FOLDERS.forEach(folder => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        partReady[folder] = true;
        draw();
      };
      img.onerror = () => {
        partReady[folder] = false;
      };
      img.src = `experimental/parts/${folder}/full.jpg`;
      partImages[folder] = img;
    });
  }

  function portraitRect(kind, cx, cy, targetH) {
    const img = portraits[kind];
    if (!portraitReady[kind] || !img.naturalWidth) return null;
    const h = targetH;
    const w = (img.naturalWidth / img.naturalHeight) * h;
    const maxW = width * 0.94;
    const scale = w > maxW ? maxW / w : 1;
    const dw = w * scale;
    const dh = h * scale;
    return { x: cx - dw / 2, y: cy - dh * 0.58, w: dw, h: dh };
  }

  function drawPortrait(kind, cx, cy, targetH, alpha) {
    const box = portraitRect(kind, cx, cy, targetH);
    if (!box) return null;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(portraits[kind], box.x, box.y, box.w, box.h);
    ctx.restore();
    return box;
  }

  function joint(box, xy) {
    return { x: box.x + xy[0] * box.w, y: box.y + xy[1] * box.h };
  }

  function soloAnatomy(woman) {
    const inset = woman ? 0.03 : 0;
    return {
      woman: !!woman,
      skullR: woman ? 0.105 : 0.118,
      tilt: 0.22,
      joints: {
        skull: [0.5, 0.27],
        neck: [0.5, 0.4],
        c7: [0.5, 0.455],
        chest: [0.5, 0.56],
        spine: [0.5, 0.66],
        pelvis: [0.5, 0.78],
        lShoulder: [0.29 + inset, 0.495],
        rShoulder: [0.71 - inset, 0.495],
        lElbow: [0.2 + inset, 0.685],
        rElbow: [0.8 - inset, 0.685],
        lWrist: [0.4, 0.785],
        rWrist: [0.6, 0.785],
        hands: [0.5, 0.8],
      },
    };
  }

  function coupleAnatomy(side) {
    const left = side === 'left';
    const x0 = left ? 0.02 : 0.5;
    const flip = left ? 1 : -1;
    const cx = left ? 0.3 : 0.7;
    return {
      woman: !left,
      skullR: left ? 0.1 : 0.092,
      tilt: 0.2,
      joints: {
        skull: [cx, 0.3],
        neck: [cx, 0.4],
        c7: [cx, 0.455],
        chest: [cx + flip * 0.01, 0.55],
        spine: [cx + flip * 0.02, 0.65],
        pelvis: [cx + flip * 0.03, 0.77],
        lShoulder: [x0 + 0.12, 0.49],
        rShoulder: [x0 + 0.36, 0.49],
        lElbow: [x0 + 0.08, 0.68],
        rElbow: [x0 + 0.4, 0.68],
        lWrist: [0.44, 0.78],
        rWrist: [0.56, 0.78],
        hands: [0.5, 0.8],
      },
    };
  }

  function drawSkullAt(p, r, tilt, on) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(tilt);
    ctx.strokeStyle = on ? 'rgba(243,234,214,0.95)' : 'rgba(210,224,238,0.32)';
    ctx.lineWidth = on ? Math.max(1.8, r * 0.055) : Math.max(1.1, r * 0.04);
    ctx.setLineDash(on ? [] : [5, 6]);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.08, r * 0.78, r, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, r * 0.55, r * 0.42, r * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawRibcage(chest, w, h, on) {
    ctx.save();
    ctx.strokeStyle = on ? 'rgba(236, 224, 198, 0.92)' : 'rgba(210,224,238,0.32)';
    ctx.lineWidth = on ? Math.max(1.6, w * 0.055) : Math.max(1.1, w * 0.04);
    ctx.setLineDash(on ? [] : [4, 5]);
    ctx.beginPath();
    ctx.ellipse(chest.x, chest.y, w, h, 0.05, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const y = chest.y - h * 0.42 + i * (h * 0.26);
      const rw = w * (0.7 + i * 0.08);
      ctx.beginPath();
      ctx.ellipse(chest.x, y, rw, h * 0.18, 0, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawSeatedAnatomy(box, spec, f1, f2) {
    const p = name => joint(box, spec.joints[name]);
    const minSide = Math.min(box.w, box.h);
    const skullR = spec.skullR * minSide;
    const bw = Math.max(3.2, minSide * 0.013);
    const shown = f1 <= 0 ? 0 : Math.ceil(f1 * 11);
    const on = i => shown > i;

    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();

    drawSkullAt(p('skull'), skullR, spec.tilt, on(0));
    bone(p('skull').x, p('skull').y + skullR * 0.7, p('neck').x, p('neck').y, bw * 0.85, '#f3ead6', on(1));
    bone(p('neck').x, p('neck').y, p('c7').x, p('c7').y, bw, '#f3ead6', on(1));
    bone(p('lShoulder').x, p('lShoulder').y, p('c7').x, p('c7').y, bw * 0.85, '#f3ead6', on(2));
    bone(p('rShoulder').x, p('rShoulder').y, p('c7').x, p('c7').y, bw * 0.85, '#f3ead6', on(2));
    bone(p('c7').x, p('c7').y, p('chest').x, p('chest').y, bw * 1.15, '#f3ead6', on(3));
    bone(p('chest').x, p('chest').y, p('spine').x, p('spine').y, bw * 1.1, '#f3ead6', on(3));
    bone(p('spine').x, p('spine').y, p('pelvis').x, p('pelvis').y, bw * 1.2, '#f3ead6', on(3));
    drawRibcage(p('chest'), minSide * (spec.woman ? 0.11 : 0.13), minSide * 0.1, on(4));
    ctx.strokeStyle = on(5) ? '#e6d8be' : 'rgba(210,224,238,0.32)';
    ctx.lineWidth = on(5) ? Math.max(1.8, bw * 0.7) : Math.max(1.2, bw * 0.45);
    ctx.setLineDash(on(5) ? [] : [4, 5]);
    ctx.beginPath();
    ctx.ellipse(p('pelvis').x, p('pelvis').y, minSide * 0.07, minSide * 0.028, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    bone(p('lShoulder').x, p('lShoulder').y, p('lElbow').x, p('lElbow').y, bw * 1.05, '#f3ead6', on(6));
    bone(p('rShoulder').x, p('rShoulder').y, p('rElbow').x, p('rElbow').y, bw * 1.05, '#f3ead6', on(7));
    bone(p('lElbow').x, p('lElbow').y, p('lWrist').x, p('lWrist').y, bw * 0.9, '#f3ead6', on(8));
    bone(p('rElbow').x, p('rElbow').y, p('rWrist').x, p('rWrist').y, bw * 0.9, '#f3ead6', on(9));
    bone(p('lWrist').x, p('lWrist').y, p('hands').x, p('hands').y, bw * 0.7, '#f3ead6', on(10));
    bone(p('rWrist').x, p('rWrist').y, p('hands').x, p('hands').y, bw * 0.7, '#f3ead6', on(10));
    ctx.strokeStyle = on(10) ? '#f3ead6' : 'rgba(210,224,238,0.32)';
    ctx.lineWidth = on(10) ? Math.max(1.8, bw * 0.7) : Math.max(1.2, bw * 0.45);
    ctx.setLineDash(on(10) ? [] : [4, 5]);
    ctx.beginPath();
    ctx.arc(p('hands').x, p('hands').y, bw * 1.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (f2 > 0) {
      const mShow = Math.ceil(f2 * 7);
      const segs = [
        [p('neck'), p('chest'), bw * 2.2],
        [p('lShoulder'), p('lElbow'), bw * 2.4],
        [p('rShoulder'), p('rElbow'), bw * 2.4],
        [p('lElbow'), p('lWrist'), bw * 1.8],
        [p('rElbow'), p('rWrist'), bw * 1.8],
        [p('chest'), p('spine'), bw * 2.8],
        [p('spine'), p('pelvis'), bw * 2.2],
      ];
      segs.forEach((seg, i) => {
        if (i < mShow) muscle(seg[0].x, seg[0].y, seg[1].x, seg[1].y, seg[2], true);
      });
    }
    ctx.restore();
  }

  function css(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch {
      return fallback;
    }
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp01(n) {
    return Math.max(0, Math.min(1, Number(n) || 0));
  }

  function roundFrac() {
    return clamp01(fractions[focusRound] || 0);
  }

  function priorFrac(round) {
    return clamp01(fractions[round] || 0);
  }

  function hash01(str) {
    return GEO()?.hash01(str) || 0.5;
  }

  function organic(seed, cx, cy, rx, ry, segs) {
    const pts = [];
    const n = segs || 36;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const k = 0.72 + 0.28 * hash01(`${seed}-${i}`);
      pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
    }
    return pts;
  }

  function fillPoly(pts, fill, stroke, lineW) {
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineW || 2;
      ctx.stroke();
    }
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function bone(x1, y1, x2, y2, width, color, on) {
    if (!on) {
      ctx.strokeStyle = 'rgba(210, 224, 238, 0.18)';
      ctx.lineWidth = Math.max(1.5, width * 0.7);
      ctx.setLineDash([4, 5]);
    } else {
      ctx.strokeStyle = color || '#f0e6d0';
      ctx.lineWidth = width;
      ctx.setLineDash([]);
      ctx.shadowColor = 'rgba(240, 220, 170, 0.35)';
      ctx.shadowBlur = 8;
    }
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.fillStyle = on ? (color || '#f0e6d0') : 'rgba(210, 224, 238, 0.2)';
    ctx.arc(x1, y1, width * 0.55, 0, Math.PI * 2);
    ctx.arc(x2, y2, width * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function muscle(x1, y1, x2, y2, width, on) {
    if (!on) return;
    ctx.strokeStyle = '#c45c5c';
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function seatedFigure(ox, oy, scale, gender, f1, f2, f3, ghost, overlayOnly) {
    const s = scale;
    const woman = gender === 'woman';
    const bones = [
      [0, -86, 0, -64],
      [0, -64, 0, -36],
      [0, -36, 0, -8],
      [-26, -60, -32, -18],
      [26, -60, 32, -18],
      [-32, -18, -8, 2],
      [32, -18, 8, 2],
      [0, -8, -16, 28],
      [0, -8, 16, 28],
      [-16, 28, -18, 62],
      [16, 28, 18, 62],
    ];
    const n = bones.length;
    const shown = f1 <= 0 ? 0 : Math.ceil(f1 * n);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);

    if (!overlayOnly) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 58, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    bones.forEach((b, i) => {
      bone(b[0], b[1], b[2], b[3], 5.5, '#f3ead6', ghost || i < shown);
    });
    ctx.beginPath();
    ctx.fillStyle = ghost || shown > 0 ? '#f3ead6' : 'rgba(243,234,214,0.2)';
    ctx.arc(0, -92, woman ? 13 : 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (f2 > 0) {
      const mShow = Math.ceil(f2 * 8);
      const m = [
        [0, -70, 0, -20],
        [-22, -58, -30, -16],
        [22, -58, 30, -16],
        [-30, -16, -8, 2],
        [30, -16, 8, 2],
        [-12, -6, -16, 30],
        [12, -6, 16, 30],
        [0, -40, 0, -8],
      ];
      m.forEach((seg, i) => {
        if (i < mShow) muscle(seg[0], seg[1], seg[2], seg[3], 9);
      });
    }

    if (!overlayOnly && f3 > 0.08) {
      const a = Math.min(1, f3 * 1.15);
      ctx.globalAlpha = a;
      ctx.fillStyle = woman ? '#7a5688' : '#35507a';
      roundRect(-22, -58, 44, 48, 10);
      ctx.fill();
      ctx.fillStyle = woman ? '#d7b59a' : '#c4a07a';
      ctx.beginPath();
      ctx.arc(0, -92, woman ? 13 : 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = woman ? '#3a2218' : '#1c140e';
      ctx.beginPath();
      ctx.ellipse(0, -98, woman ? 14 : 12, woman ? 10 : 6, 0, 0, Math.PI * 2);
      ctx.fill();
      if (woman) {
        ctx.beginPath();
        ctx.ellipse(-10, -82, 5, 14, 0.4, 0, Math.PI * 2);
        ctx.ellipse(10, -82, 5, 14, -0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = woman ? '#d7b59a' : '#c4a07a';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-20, -42);
      ctx.lineTo(-8, 6);
      ctx.moveTo(20, -42);
      ctx.lineTo(8, 6);
      ctx.stroke();
      ctx.fillStyle = woman ? '#5a3c66' : '#2a3c5c';
      roundRect(-20, -8, 16, 58, 6);
      roundRect(4, -8, 16, 58, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawTable(cx, cy) {
    ctx.fillStyle = '#6b4428';
    roundRect(cx - 110, cy - 8, 220, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#c4a574';
    roundRect(cx - 108, cy - 14, 216, 10, 3);
    ctx.fill();
    ctx.fillStyle = '#5a381f';
    ctx.fillRect(cx - 92, cy + 8, 10, 52);
    ctx.fillRect(cx + 82, cy + 8, 10, 52);
  }

  function drawBible(cx, cy, open) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#2a1b12';
    roundRect(-28, -6, 56, 14, 2);
    ctx.fill();
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-24, -8, 48, 3);
    if (open) {
      ctx.fillStyle = '#f7f1e4';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-26, -22);
      ctx.lineTo(-26, -8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(26, -22);
      ctx.lineTo(26, -8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHouse(x, y, w, stories, addition, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    const h = 28 + stories * 22;
    ctx.fillStyle = '#e2d0b4';
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = '#7a3b32';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 6, y - h);
    ctx.lineTo(x, y - h - 18);
    ctx.lineTo(x + w / 2 + 6, y - h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(x - 6, y - 22, 12, 22);
    ctx.fillStyle = '#8ec4e6';
    ctx.fillRect(x - w / 2 + 8, y - h + 10, 12, 10);
    ctx.fillRect(x + w / 2 - 20, y - h + 10, 12, 10);
    if (addition) {
      ctx.fillStyle = '#d7c4a6';
      ctx.fillRect(x + w / 2 - 4, y - h * 0.7, w * 0.45, h * 0.7);
      ctx.fillStyle = '#7a3b32';
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 6, y - h * 0.7);
      ctx.lineTo(x + w / 2 + w * 0.22, y - h * 0.7 - 12);
      ctx.lineTo(x + w / 2 + w * 0.45, y - h * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPersonMini(x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 4, y - 10, 8, 14);
  }

  function ringsOf(gj) {
    if (!gj) return [];
    if (gj.type === 'Polygon') return [gj.coordinates];
    if (gj.type === 'MultiPolygon') return gj.coordinates;
    if (gj.type === 'Feature') return ringsOf(gj.geometry);
    if (gj.type === 'FeatureCollection') {
      const out = [];
      (gj.features || []).forEach(f => out.push(...ringsOf(f)));
      return out;
    }
    return [];
  }

  function simplifyRing(ring, maxPts) {
    if (!ring || ring.length <= maxPts) return ring || [];
    const step = Math.ceil(ring.length / maxPts);
    const out = ring.filter((_, i) => i % step === 0);
    const last = ring[ring.length - 1];
    const prev = out[out.length - 1];
    if (!prev || prev[0] !== last[0] || prev[1] !== last[1]) out.push(last);
    return out;
  }

  function wrapLon(lon, center) {
    let x = Number(lon);
    if (!Number.isFinite(x) || !Number.isFinite(center)) return x;
    while (x - center > 180) x -= 360;
    while (center - x > 180) x += 360;
    return x;
  }

  function geoBounds(gj, centerLon) {
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = 90;
    let maxLat = -90;
    const center = Number.isFinite(centerLon) ? centerLon : null;
    ringsOf(gj).forEach(poly => {
      (poly || []).forEach(ring => {
        (ring || []).forEach(pt => {
          const lon = center == null ? pt[0] : wrapLon(pt[0], center);
          const lat = pt[1];
          if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
      });
    });
    if (minLon === Infinity) return { minLon: -1, maxLon: 1, minLat: -1, maxLat: 1 };
    if (center == null && maxLon - minLon > 180) minLon = maxLon - 360;
    return { minLon, maxLon, minLat, maxLat };
  }

  function projectAdmin(lon, lat, b, pad, scaleMul) {
    const bw = Math.max(0.02, b.maxLon - b.minLon);
    const bh = Math.max(0.02, b.maxLat - b.minLat);
    const innerW = width - pad * 2;
    const innerH = height - pad * 2 - 24;
    const s = Math.min(innerW / bw, innerH / bh) * (scaleMul || 1);
    const cx = (b.minLon + b.maxLon) / 2;
    const cy = (b.minLat + b.maxLat) / 2;
    const xLon = wrapLon(lon, cx);
    return {
      x: width / 2 + (xLon - cx) * s,
      y: height / 2 - 6 - (lat - cy) * s,
    };
  }

  function pathAdmin(gj, b, pad, scaleMul, maxPts) {
    ctx.beginPath();
    ringsOf(gj).forEach(poly => {
      (poly || []).forEach(ring => {
        const pts = simplifyRing(ring, maxPts || 420);
        pts.forEach((pt, i) => {
          const p = projectAdmin(pt[0], pt[1], b, pad, scaleMul);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
      });
    });
  }

  function fillAdmin(gj, fill, stroke, lineW, scaleMul) {
    if (!gj) return false;
    const b = geoBounds(gj);
    if (!(b.maxLon > b.minLon) || !(b.maxLat > b.minLat)) return false;
    pathAdmin(gj, b, 40, scaleMul);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill('evenodd');
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineW || 2.5;
      ctx.stroke();
    }
    return true;
  }

  function fillGeom(gj, b, fill, stroke, lineW, pad, maxPts) {
    if (!gj || !b) return false;
    pathAdmin(gj, b, pad == null ? 36 : pad, 1, maxPts);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill('evenodd');
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineW || 2;
      ctx.stroke();
    }
    return true;
  }

  function boundOf(layer) {
    return layer?.geojson ? geoBounds(layer.geojson) : null;
  }

  function mergeBounds(list) {
    const ok = (list || []).filter(b => b && b.maxLon > b.minLon && b.maxLat > b.minLat);
    if (!ok.length) return null;
    return {
      minLon: Math.min(...ok.map(b => b.minLon)),
      maxLon: Math.max(...ok.map(b => b.maxLon)),
      minLat: Math.min(...ok.map(b => b.minLat)),
      maxLat: Math.max(...ok.map(b => b.maxLat)),
    };
  }

  function padBounds(b, frac) {
    if (!b) return b;
    const f = frac || 0.08;
    const dw = (b.maxLon - b.minLon) * f;
    const dh = (b.maxLat - b.minLat) * f;
    return {
      minLon: b.minLon - dw,
      maxLon: b.maxLon + dw,
      minLat: b.minLat - dh,
      maxLat: b.maxLat + dh,
    };
  }

  function lotsInGeom(gj, count, viewB, pad) {
    const pin = GEO()?.pointInGeometry;
    if (!gj || !pin) return [];
    const gb = geoBounds(gj);
    const b = viewB || gb;
    const sample = viewB || gb;
    const seed = profile?.city || 'home';
    const out = [];
    for (let i = 0; out.length < count && i < count * 90; i++) {
      const lon = sample.minLon + hash01(`${seed}-x-${i}`) * (sample.maxLon - sample.minLon);
      const lat = sample.minLat + hash01(`${seed}-y-${i}`) * (sample.maxLat - sample.minLat);
      if (!pin(gj, lon, lat)) continue;
      out.push({ lon, lat, p: projectAdmin(lon, lat, b, pad == null ? 28 : pad, 1) });
    }
    return out;
  }

  function projectOrtho(lon, lat, clon, clat, cx, cy, r) {
    const rad = d => (d * Math.PI) / 180;
    const lam = rad(lon);
    const phi = rad(lat);
    const lam0 = rad(clon);
    const phi0 = rad(clat);
    const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lam - lam0);
    if (cosc < 0.05) return null;
    return {
      x: cx + r * Math.cos(phi) * Math.sin(lam - lam0),
      y: cy - r * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lam - lam0)),
    };
  }

  function drawOrthoFeature(gj, clon, clat, cx, cy, r, fill, stroke, lw) {
    ringsOf(gj).forEach(poly => {
      (poly || []).forEach(ring => {
        ctx.beginPath();
        let started = false;
        simplifyRing(ring, 80).forEach(pt => {
          const p = projectOrtho(pt[0], pt[1], clon, clat, cx, cy, r);
          if (!p) {
            started = false;
            return;
          }
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else ctx.lineTo(p.x, p.y);
        });
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lw || 0.7;
          ctx.stroke();
        }
      });
    });
  }

  function longestExterior(gj) {
    let best = [];
    ringsOf(gj).forEach(poly => {
      const ring = poly?.[0] || [];
      if (ring.length > best.length) best = ring;
    });
    return best;
  }

  function evenAlongRing(gj, count) {
    const b = geoBounds(gj);
    const ring = simplifyRing(longestExterior(gj), 240);
    const pts = ring.map(pt => projectAdmin(pt[0], pt[1], b, 40, 1));
    if (pts.length < 2) return pts;
    const dist = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      dist.push(total);
    }
    if (total < 8) return pts;
    const out = [];
    const n = Math.max(3, count);
    for (let k = 0; k < n; k++) {
      const target = (k / n) * total;
      let i = 1;
      while (i < dist.length && dist[i] < target) i += 1;
      const a = pts[i - 1];
      const c = pts[i] || pts[0];
      const span = dist[i] - dist[i - 1] || 1;
      const t = (target - dist[i - 1]) / span;
      out.push({ x: lerp(a.x, c.x, t), y: lerp(a.y, c.y, t) });
    }
    return out;
  }

  function kindLabel(kind) {
    const map = {
      state: 'State',
      county: 'County',
      parish: 'Parish',
      province: 'Province',
      region: 'Region',
      municipality: 'Municipality',
      district: 'District',
      country: 'Country',
    };
    return map[kind] || 'State / county';
  }

  function anatomyFrame(couple) {
    const h = height * 0.86;
    const ratio = couple ? 4 / 3 : 3 / 4;
    const w = Math.min(width * 0.92, h * ratio);
    return { x: (width - w) / 2, y: height * 0.05, w, h };
  }

  function wrapCentered(text, maxW, font) {
    ctx.font = font;
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawBodyPrompt(empty) {
    const msg = empty
      ? 'Complete the prayer to see the first piece land.'
      : 'Complete this prayer to see the next prayer land.';
    const font = empty
      ? '600 28px "Cormorant Garamond", Georgia, serif'
      : '600 22px "Cormorant Garamond", Georgia, serif';
    const lines = wrapCentered(msg, width * 0.78, font);
    ctx.fillStyle = '#f3ead6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lineH = empty ? 32 : 30;
    const y0 = empty ? 36 : height - 36 - (lines.length - 1) * lineH * 0.5;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, width * 0.5, y0 + i * lineH);
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    if (captionEl) captionEl.textContent = msg;
  }

  function tilesShown(frac) {
    const f = clamp01(frac);
    if (f <= 0) return 0;
    return Math.min(TILE_COUNT, Math.ceil(f * TILE_COUNT));
  }

  function tileRect(box, i) {
    const col = i % TILE_COLS;
    const row = Math.floor(i / TILE_COLS);
    const tw = box.w / TILE_COLS;
    const th = box.h / TILE_ROWS;
    return { x: box.x + col * tw, y: box.y + row * th, w: tw, h: th, col, row };
  }

  function setAimFromTile(box, shown) {
    if (shown <= 0) {
      lastAim = { x: width * 0.5, y: height * 0.55 };
      return;
    }
    const t = tileRect(box, shown - 1);
    lastAim = { x: t.x + t.w / 2, y: t.y + t.h / 2 };
  }

  function fitImageBox(img) {
    const maxW = width * 0.98;
    const maxH = height * 0.92;
    const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    return { x: (width - w) / 2, y: (height - h) / 2, w, h };
  }

  function drawImageGhost(img, box) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.drawImage(img, box.x, box.y, box.w, box.h);
    ctx.restore();
  }

  function drawImageTiles(img, box, shown) {
    if (!img.naturalWidth || shown <= 0) return;
    const sw = img.naturalWidth / TILE_COLS;
    const sh = img.naturalHeight / TILE_ROWS;
    for (let i = 0; i < shown; i++) {
      const t = tileRect(box, i);
      ctx.drawImage(img, t.col * sw, t.row * sh, sw, sh, t.x, t.y, t.w, t.h);
    }
  }

  function ensureLayer() {
    if (!layerCanvas) {
      layerCanvas = document.createElement('canvas');
      layerCtx = layerCanvas.getContext('2d');
    }
    if (layerCanvas.width !== width || layerCanvas.height !== height) {
      layerCanvas.width = width;
      layerCanvas.height = height;
    }
    return layerCtx;
  }

  function captureScene(fn) {
    const scratch = ensureLayer();
    const saved = ctx;
    ctx = scratch;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    fn();
    ctx = saved;
    return layerCanvas;
  }

  function revealCanvasTiles(source, shown) {
    const box = { x: 0, y: 0, w: width, h: height };
    for (let i = 0; i < shown; i++) {
      const t = tileRect(box, i);
      ctx.drawImage(source, t.x, t.y, t.w, t.h, t.x, t.y, t.w, t.h);
    }
    setAimFromTile(box, shown);
  }

  function finishPrompt(frac) {
    const shown = tilesShown(frac);
    const roundYes = Math.round((fractions[focusRound] || 0) * 666);
    if (shown <= 0) drawBodyPrompt(true);
    else if (roundYes < 666) drawBodyPrompt(false);
  }

  function drawTiledScene(frac, drawGhost, drawFinished) {
    if (drawGhost) drawGhost();
    const shown = tilesShown(frac);
    if (shown <= 0) {
      lastAim = { x: width * 0.5, y: height * 0.52 };
      finishPrompt(frac);
      return;
    }
    revealCanvasTiles(captureScene(drawFinished), shown);
    finishPrompt(frac);
  }

  function sceneBg(color) {
    ctx.fillStyle = color || '#2a3b52';
    ctx.fillRect(0, 0, width, height);
  }

  function bodyPartFolder() {
    const couple = focusSet === 2 && !!profile?.married;
    if (couple) {
      if (focusRound === 1) return '04-male-female-skeletons';
      if (focusRound === 2) return '05-male-female-anatomical';
      return '06-male-female-adults';
    }
    if (focusRound === 1) return '01-skeleton';
    if (focusRound === 2) return '02-muscles';
    return '03-male-adult';
  }

  function bodyPartImage() {
    const folder = bodyPartFolder();
    const img = partImages[folder];
    if (partReady[folder] && img?.naturalWidth) return img;
    if (focusRound === 3 && profile?.gender === 'woman' && !(focusSet === 2 && profile?.married) && portraitReady.woman) {
      return portraits.woman;
    }
    return null;
  }

  function drawSetBody() {
    const img = bodyPartImage();
    const frac = priorFrac(focusRound);
    if (!img) {
      const couple = focusSet === 2 && !!profile?.married;
      const box = anatomyFrame(couple);
      if (couple) {
        drawSeatedAnatomy(box, coupleAnatomy('left'), frac, 0);
        drawSeatedAnatomy(box, coupleAnatomy('right'), frac, 0);
      } else {
        drawSeatedAnatomy(box, soloAnatomy(profile?.gender === 'woman'), frac, 0);
      }
      finishPrompt(frac);
      return;
    }
    const box = fitImageBox(img);
    drawImageGhost(img, box);
    const shown = tilesShown(frac);
    setAimFromTile(box, shown);
    drawImageTiles(img, box, shown);
    finishPrompt(frac);
  }

  function strokeLabel(text, x, y) {
    ctx.fillStyle = 'rgba(243,234,214,0.7)';
    ctx.font = '600 13px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
  }

  function houseLots() {
    const cy = height * 0.62;
    return [
      [width * 0.22, cy],
      [width * 0.5, cy],
      [width * 0.78, cy],
      [width * 0.35, cy + 70],
      [width * 0.65, cy + 70],
    ];
  }

  function drawHousePlan(cx, cy, w, h, dashed) {
    ctx.setLineDash(dashed ? [5, 5] : []);
    ctx.strokeStyle = dashed ? 'rgba(210,224,238,0.4)' : 'rgba(236,224,198,0.95)';
    ctx.lineWidth = dashed ? 1.3 : 2;
    ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx, cy + h / 2);
    ctx.moveTo(cx - w / 2, cy);
    ctx.lineTo(cx + w / 2, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy - h / 2);
    ctx.lineTo(cx, cy - h / 2 - h * 0.45);
    ctx.lineTo(cx + w / 2, cy - h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawHouseFrame(cx, cy, w) {
    const h = 150;
    ctx.strokeStyle = '#c4a574';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - w / 2, cy - h, w, h);
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 - 8, cy - h);
    ctx.lineTo(cx, cy - h - 58);
    ctx.lineTo(cx + w / 2 + 8, cy - h);
    ctx.closePath();
    ctx.stroke();
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - w / 2 + (i * w) / 5, cy - h);
      ctx.lineTo(cx - w / 2 + (i * w) / 5, cy);
      ctx.stroke();
    }
  }

  function drawUtilityLines(solid) {
    const y = height * 0.78;
    const lines = [
      ['#4aa3d9', y],
      ['#d4af37', y + 10],
      ['#8a5a3a', y + 20],
    ];
    ctx.setLineDash(solid ? [] : [7, 6]);
    ctx.lineWidth = solid ? 3 : 1.6;
    lines.forEach(pair => {
      ctx.strokeStyle = pair[0];
      ctx.beginPath();
      ctx.moveTo(28, pair[1]);
      ctx.bezierCurveTo(width * 0.3, pair[1] - 18, width * 0.6, pair[1] + 16, width - 28, pair[1]);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  function drawSetNeighborhood() {
    const frac = priorFrac(focusRound);
    const cx = width * 0.5;
    const cy = height * 0.7;
    const w = Math.min(240, width * 0.48);
    drawTiledScene(
      frac,
      () => {
        sceneBg('#243044');
        if (focusRound === 1) drawHousePlan(cx, cy - 20, w, 140, true);
        else drawHouseFrame(cx, cy, w);
        strokeLabel(focusRound === 1 ? 'House blueprint' : 'House frame', cx, 28);
      },
      () => {
        sceneBg('#2a3b52');
        if (focusRound === 1) {
          drawHousePlan(cx, cy - 20, w, 140, false);
          strokeLabel('House blueprint', cx, 28);
        } else if (focusRound === 2) {
          ctx.fillStyle = '#35553b';
          ctx.fillRect(0, cy, width, height);
          drawHouseFrame(cx, cy, w);
        } else {
          ctx.fillStyle = '#35553b';
          ctx.fillRect(0, cy - 8, width, height);
          ctx.fillStyle = '#4a6a48';
          ctx.fillRect(0, cy - 8, width, 16);
          drawHouse(cx, cy, w * 0.85, 2, true, 1);
        }
      },
    );
  }

  function homeLon() {
    const lon = Number(placeStack?.lon || profile?.lon);
    return Number.isFinite(lon) ? lon : 0;
  }

  function homeDot(b, pad) {
    const lat = Number(placeStack?.lat || profile?.lat);
    const lon = Number(placeStack?.lon || profile?.lon);
    if (!b || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return projectAdmin(lon, lat, b, pad == null ? 36 : pad, 1);
  }

  function drawHomeMarker(p, label, onDark) {
    if (!p) return;
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = onDark ? '#f3ead6' : '#3d2a18';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (label) {
      ctx.fillStyle = onDark ? '#f3ead6' : '#3d2a18';
      ctx.font = '600 13px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(label, p.x + 9, p.y - 8);
    }
  }

  function metroGeom() {
    return placeStack?.city?.geojson || placeStack?.county?.geojson || placeStack?.state?.geojson || null;
  }

  function homeWindow(deg) {
    const lat = Number(placeStack?.lat || profile?.lat);
    const lon = Number(placeStack?.lon || profile?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) return null;
    const dlat = deg || 0.12;
    const dlon = dlat / Math.max(0.25, Math.cos((lat * Math.PI) / 180));
    return {
      minLon: lon - dlon,
      maxLon: lon + dlon,
      minLat: lat - dlat,
      maxLat: lat + dlat,
    };
  }

  function viewBounds(gj, homeDeg) {
    if (homeDeg) {
      const w = homeWindow(homeDeg);
      if (w) return padBounds(w, 0.04);
    }
    return gj ? padBounds(geoBounds(gj), 0.08) : null;
  }

  function sameGeom(a, b) {
    return !!(a?.geojson && b?.geojson && a.geojson === b.geojson);
  }

  function drawSetMetro() {
    const frac = priorFrac(focusRound);
    const gj = metroGeom();
    const zoom = placeStack?.city || placeStack?.county ? 0.08 : 0.14;
    drawTiledScene(
      frac,
      () => {
        sceneBg('#1f2a36');
        if (gj) {
          const b = viewBounds(gj, zoom);
          ctx.setLineDash([5, 5]);
          fillGeom(gj, b, 'rgba(80,110,90,0.15)', 'rgba(210,224,238,0.55)', 1.6, 28);
          ctx.setLineDash([]);
          lotsInGeom(gj, 12, b, 28).forEach(lot => {
            drawHousePlan(lot.p.x, lot.p.y, 22, 16, true);
          });
        }
        strokeLabel((profile?.city || 'Neighborhood') + ' streets', width * 0.5, 26);
      },
      () => {
        sceneBg('#243044');
        const gj2 = metroGeom();
        if (!gj2) {
          strokeLabel('Locating ' + (profile?.city || 'this neighborhood'), width * 0.5, height * 0.5);
          return;
        }
        const b = viewBounds(gj2, zoom);
        fillGeom(gj2, b, 'rgba(70,100,80,0.35)', '#9ec2a8', 2, 28);
        const lots = lotsInGeom(gj2, 14, b, 28);
        if (lots.length >= 2) {
          ctx.setLineDash(focusRound === 1 ? [6, 5] : []);
          ctx.strokeStyle = focusRound === 1 ? 'rgba(74,163,217,0.7)' : '#4aa3d9';
          ctx.lineWidth = 2;
          ctx.beginPath();
          lots.forEach((lot, i) => {
            if (i === 0) ctx.moveTo(lot.p.x, lot.p.y);
            else ctx.lineTo(lot.p.x, lot.p.y);
          });
          ctx.stroke();
          ctx.strokeStyle = focusRound === 1 ? 'rgba(212,175,55,0.7)' : '#d4af37';
          ctx.beginPath();
          lots.forEach((lot, i) => {
            const p = lots[(i + 3) % lots.length].p;
            if (i === 0) ctx.moveTo(lot.p.x, lot.p.y + 5);
            else ctx.lineTo(p.x, p.y + 5);
          });
          ctx.stroke();
          ctx.strokeStyle = focusRound === 1 ? 'rgba(138,90,58,0.7)' : '#8a5a3a';
          ctx.beginPath();
          lots.forEach((lot, i) => {
            if (i === 0) ctx.moveTo(lot.p.x, lot.p.y + 10);
            else ctx.lineTo(lot.p.x, lot.p.y + 10);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        }
        lots.forEach((lot, i) => {
          if (focusRound === 1) drawHousePlan(lot.p.x, lot.p.y, 24, 16, false);
          else if (focusRound === 2) drawHouseFrame(lot.p.x, lot.p.y + 18, 28);
          else drawHouse(lot.p.x, lot.p.y + 10, 26, 1, i % 3 === 0, 1);
        });
        drawHomeMarker(homeDot(b, 28), profile?.city, true);
        strokeLabel(profile?.city || 'Neighborhood', width * 0.5, 26);
      },
    );
  }

  function drawSetCity() {
    const frac = priorFrac(focusRound);
    const city = placeStack?.city;
    const county = placeStack?.county;
    const gj = city?.geojson || county?.geojson || placeStack?.state?.geojson;
    drawTiledScene(
      frac,
      () => {
        sceneBg('#1e2834');
        if (gj) {
          const b = padBounds(geoBounds(gj), 0.08);
          ctx.setLineDash([5, 5]);
          fillGeom(gj, b, 'rgba(80,110,90,0.12)', 'rgba(210,224,238,0.5)', 1.8, 32);
          ctx.setLineDash([]);
        }
        strokeLabel(profile?.city || 'City', width * 0.5, 26);
      },
      () => {
        sceneBg('#243044');
        if (!gj) {
          strokeLabel('Locating ' + (profile?.city || 'this city'), width * 0.5, height * 0.5);
          return;
        }
        const b = padBounds(geoBounds(gj), 0.08);
        if (county?.geojson && city?.geojson && !sameGeom(county, city)) {
          fillGeom(county.geojson, b, 'rgba(90,110,90,0.18)', '#6a7a58', 1.2, 32);
        }
        fillGeom(gj, b, focusRound === 1 ? 'rgba(96,122,72,0.28)' : 'rgba(80,130,70,0.55)', '#d4af37', 2.4, 32);
        if (focusRound >= 2) {
          lotsInGeom(gj, 8, b, 32).forEach(lot => {
            ctx.fillStyle = '#c9a227';
            ctx.beginPath();
            ctx.arc(lot.p.x, lot.p.y, 3, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        drawHomeMarker(homeDot(b, 32), profile?.city, true);
        strokeLabel(city?.name || profile?.city || 'City', width * 0.5, 26);
      },
    );
  }

  function drawAdminMap(focusLayer, backdrop, highlight, label) {
    const frac = priorFrac(focusRound);
    drawTiledScene(
      frac,
      () => {
        sceneBg('#cbb992');
        const gj = focusLayer?.geojson;
        if (gj) {
          const b = padBounds(geoBounds(gj), 0.08);
          ctx.setLineDash([6, 5]);
          fillGeom(gj, b, 'rgba(96,122,72,0.1)', '#3d4f32', 1.6, 36);
          ctx.setLineDash([]);
        }
        strokeLabel(label, width * 0.5, 26);
      },
      () => {
        sceneBg('#cbb992');
        const main = focusLayer?.geojson || backdrop?.geojson || highlight?.geojson;
        if (!main) {
          strokeLabel('Locating ' + label, width * 0.5, height * 0.5);
          return;
        }
        const b = padBounds(mergeBounds([boundOf(backdrop), boundOf(focusLayer), boundOf(highlight)]) || geoBounds(main), 0.1);
        if (backdrop?.geojson) fillGeom(backdrop.geojson, b, 'rgba(150,160,130,0.25)', '#6a7a58', 1.4, 36);
        if (focusLayer?.geojson) fillGeom(focusLayer.geojson, b, 'rgba(80,130,70,0.55)', '#3d4f32', 2.4, 36);
        else fillGeom(main, b, 'rgba(80,130,70,0.55)', '#3d4f32', 2.4, 36);
        if (highlight?.geojson && !sameGeom(highlight, focusLayer)) {
          fillGeom(highlight.geojson, b, 'rgba(212,175,55,0.45)', '#d4af37', 2, 36);
        }
        drawHomeMarker(homeDot(b, 36), profile?.city, false);
        strokeLabel(focusLayer.name || label, width * 0.5, 26);
      },
    );
  }

  function drawSetMap() {
    if (focusSet === 6) {
      const county = placeStack?.county || placeStack?.city;
      const city = placeStack?.city;
      drawAdminMap(county, placeStack?.state || placeStack?.country, sameGeom(county, city) ? null : city, county?.name || 'County');
      return;
    }
    if (focusSet === 7) {
      drawAdminMap(
        placeStack?.state || placeStack?.country,
        placeStack?.country,
        placeStack?.county || placeStack?.city,
        placeStack?.state?.name || 'State',
      );
      return;
    }
    drawAdminMap(placeStack?.country, null, placeStack?.state, placeStack?.country?.name || profile?.country || 'Country');
  }

  function continentFeatures() {
    const cont = placeStack?.continent || profile?.continent || '';
    return (placeStack?.world?.features || []).filter(f => f.properties?.continent === cont);
  }

  function drawTzBand(b, pad) {
    const lon = Number(placeStack?.lon || profile?.lon);
    if (!b || !Number.isFinite(lon)) return;
    const a = projectAdmin(lon - 7.5, b.maxLat, b, pad, 1);
    const c = projectAdmin(lon + 7.5, b.minLat, b, pad, 1);
    ctx.fillStyle = 'rgba(212,175,55,0.18)';
    ctx.fillRect(Math.min(a.x, c.x), Math.min(a.y, c.y), Math.abs(c.x - a.x), Math.abs(c.y - a.y));
  }

  function drawFlatCountries(feats, highlightIso, label, withTz) {
    const frac = priorFrac(focusRound);
    const usable = (feats || []).filter(f => f.properties?.continent !== 'Antarctica');
    const center = homeLon();
    drawTiledScene(
      frac,
      () => {
        sceneBg('#1a2430');
        const bounds = mergeBounds(usable.map(f => geoBounds(f.geometry, center)));
        if (bounds) {
          const b = padBounds(bounds, 0.06);
          ctx.setLineDash([4, 4]);
          usable.forEach(f => fillGeom(f.geometry, b, 'rgba(80,110,90,0.08)', 'rgba(210,224,238,0.35)', 1, 28, 80));
          ctx.setLineDash([]);
        }
        strokeLabel(label, width * 0.5, 26);
      },
      () => {
        sceneBg('#1a2430');
        const bounds = mergeBounds(usable.map(f => geoBounds(f.geometry, center)));
        if (!bounds) {
          strokeLabel(label, width * 0.5, height * 0.5);
          return;
        }
        const b = padBounds(bounds, 0.08);
        if (withTz) drawTzBand(b, 28);
        const rest = usable.filter(f => f.properties?.iso2 !== highlightIso);
        const hl = usable.filter(f => f.properties?.iso2 === highlightIso);
        rest.forEach(f => fillGeom(f.geometry, b, 'rgba(90,140,100,0.4)', 'rgba(180,200,190,0.45)', 1, 28, 90));
        hl.forEach(f => fillGeom(f.geometry, b, 'rgba(212,175,55,0.62)', '#d4af37', 2.2, 28, 180));
        drawHomeMarker(homeDot(b, 28), profile?.city, true);
        strokeLabel(label, width * 0.5, 26);
      },
    );
  }

  function drawSetGlobe() {
    const cc = placeStack?.cc || String(profile?.countryCode || '').toLowerCase();
    const feats = placeStack?.world?.features || [];
    if (focusSet === 9) {
      drawFlatCountries(feats, cc, 'World time zones', true);
      return;
    }
    if (focusSet === 10) {
      const ocean = continentFeatures();
      drawFlatCountries(ocean.length ? ocean : feats, cc, placeStack?.continent || profile?.continent || 'Continent', false);
      return;
    }
    const frac = priorFrac(focusRound);
    const lat = Number(placeStack?.lat || profile?.lat) || -25;
    const lon = Number(placeStack?.lon || profile?.lon) || 135;
    drawTiledScene(
      frac,
      () => {
        sceneBg('#1a2430');
        const cx = width * 0.5;
        const cy = height * 0.48;
        const r = Math.min(width, height) * 0.34;
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(210,224,238,0.4)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        strokeLabel('World', cx, 26);
      },
      () => {
        sceneBg('#1a2430');
        const cx = width * 0.5;
        const cy = height * 0.48;
        const r = Math.min(width, height) * 0.34;
        const grd = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.15, cx, cy, r);
        grd.addColorStop(0, '#4f7fa3');
        grd.addColorStop(1, '#163047');
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        const rest = feats.filter(f => f.properties?.iso2 !== cc);
        const hl = feats.filter(f => f.properties?.iso2 === cc);
        rest.forEach(f => {
          drawOrthoFeature(f.geometry, lon, lat, cx, cy, r, 'rgba(110,150,80,0.55)', 'rgba(20,40,30,0.35)', 0.6);
        });
        hl.forEach(f => {
          drawOrthoFeature(f.geometry, lon, lat, cx, cy, r, 'rgba(212,175,55,0.85)', '#f3ead6', 1.5);
        });
        const home = projectOrtho(lon, lat, lon, lat, cx, cy, r);
        if (home) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(home.x, home.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#3d2a18';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = 'rgba(220,230,240,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        const city = profile?.city || '';
        const land = placeStack?.country?.name || profile?.country || '';
        strokeLabel(city && land ? `${city}, ${land}` : 'World', cx, cy + r + 26);
      },
    );
  }

  function drawWalkers() {
    walkers.forEach(w => {
      const x = lerp(w.x0, w.x1, w.t);
      const y = lerp(w.y0, w.y1, w.t) - Math.sin(w.t * Math.PI) * 16;
      drawPersonMini(x, y, '#d4af37');
      ctx.fillStyle = '#e8d9b0';
      ctx.fillRect(x + 6, y - 12, 8, 8);
    });
  }

  function placeCaption() {
    const names = [
      profile?.city,
      placeStack?.county?.name,
      placeStack?.state?.name || profile?.state,
      placeStack?.country?.name || profile?.country,
    ];
    const out = [];
    names.forEach(n => {
      const t = String(n || '').trim();
      if (!t) return;
      if (out.some(x => x.toLowerCase() === t.toLowerCase())) return;
      out.push(t);
    });
    return out.join(', ');
  }

  function titleForSet() {
    const setInfo = GEO()?.SETS?.[focusSet - 1];
    const loc = placeCaption();
    const layer =
      focusSet <= 2
        ? focusRound === 1
          ? 'Skeleton'
          : focusRound === 2
            ? 'Muscles and tendons'
            : 'Seated in prayer'
        : focusSet === 3
          ? focusRound === 1
            ? 'House blueprint'
            : focusRound === 2
              ? 'House frame'
              : 'House'
          : focusSet === 4
            ? focusRound === 1
              ? 'Utility blueprint'
              : focusRound === 2
                ? 'Neighborhood frame'
                : 'Neighborhood'
            : focusSet === 5
              ? focusRound === 1
                ? 'City outline'
                : focusRound === 2
                  ? 'City rising'
                  : 'City'
              : setInfo?.name || '';
    return loc ? `${loc} \u00b7 ${layer}` : layer;
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#2a3b52';
    ctx.fillRect(0, 0, width, height);
    const emptyStart = focusRound === 1 && priorFrac(1) <= 0;
    if (!emptyStart) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(0, (i * height) / 8, width, 1);
      }
    }

    if (focusSet <= 2) drawSetBody();
    else if (focusSet === 3) drawSetNeighborhood();
    else if (focusSet === 4) drawSetMetro();
    else if (focusSet === 5) drawSetCity();
    else if (focusSet <= 8) drawSetMap();
    else drawSetGlobe();

    if (!emptyStart) drawWalkers();

    const crew = Math.max(0, Math.round((fractions[focusRound] || 0) * 666) || crewSize - 1);
    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    if (captionEl) captionEl.textContent = titleForSet();
    void crew;
  }

  function tick() {
    walkers.forEach(w => {
      w.t += 0.018;
    });
    for (let i = walkers.length - 1; i >= 0; i--) {
      if (walkers[i].t >= 1) walkers.splice(i, 1);
    }
    draw();
    if (running) requestAnimationFrame(tick);
  }

  function resize() {
    if (!canvas) return;
    const host = canvas.parentElement || canvas;
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(280, Math.floor(rect.width || 640));
    height = Math.max(220, Math.floor(rect.height || 400));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function init(canvasEl, cap) {
    canvas = canvasEl;
    captionEl = cap;
    ctx = canvas.getContext('2d');
    if (!ctx) {
      if (captionEl) captionEl.textContent = 'This browser cannot draw the construction view.';
      return;
    }
    running = true;
    loadPortraits();
    loadPartImages();
    resize();
    window.addEventListener('resize', resize);
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      new ResizeObserver(resize).observe(canvas.parentElement);
    }
    requestAnimationFrame(() => {
      resize();
      tick();
    });
  }

  function setProfile(next) {
    profile = next;
    adminBoundary = null;
    placeStack = null;
    const token = ++boundaryToken;
    draw();
    if (captionEl) captionEl.textContent = titleForSet();
    const geo = GEO();
    if (profile && typeof geo?.fetchPlaceStack === 'function') {
      const applyStack = stack => {
        if (token !== boundaryToken) return;
        placeStack = stack;
        adminBoundary = stack?.county || stack?.state || stack?.city || null;
        draw();
        if (captionEl) captionEl.textContent = titleForSet();
      };
      geo
        .fetchPlaceStack(profile, applyStack)
        .then(applyStack)
        .catch(() => {});
    } else if (profile && typeof geo?.fetchAdminBoundary === 'function') {
      geo
        .fetchAdminBoundary(profile)
        .then(b => {
          if (token !== boundaryToken) return;
          adminBoundary = b;
          draw();
          if (captionEl) captionEl.textContent = titleForSet();
        })
        .catch(() => {});
    }
  }

  function setFocus(setId, round) {
    focusSet = Number(setId) || 1;
    focusRound = Number(round) || 1;
    draw();
    if (captionEl) captionEl.textContent = titleForSet();
  }

  function syncProgress(opts) {
    fractions = opts.fractionsByRound || fractions;
    setFractions = opts.setFractions || setFractions;
    crewSize = Math.max(1, opts.crewSize || 1);
    if (opts.set) focusSet = Number(opts.set) || focusSet;
    if (opts.round) focusRound = Number(opts.round) || focusRound;
    draw();
    if (captionEl) captionEl.textContent = titleForSet();
  }

  function onTopicYes() {
    walkers.push({
      x0: 24 + Math.random() * 40,
      y0: height * 0.72 + Math.random() * 40,
      x1: lastAim.x,
      y1: lastAim.y,
      t: 0,
    });
  }

  function onSectionComplete() {
    crewSize += 1;
  }

  window.ExperimentalScene = {
    init,
    setProfile,
    setFocus,
    syncProgress,
    onTopicYes,
    onSectionComplete,
    resize,
  };
})();
