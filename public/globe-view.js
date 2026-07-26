(() => {
  /**
   * Globe Word Map — alternate view: fictional globe territories for principalities,
   * transportation metaphors for topic links (highway / fruit loop / root line).
   */
  function hash01(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return (Math.abs(h) % 10000) / 10000;
  }

  function fibonacciSphere(count) {
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / Math.max(count - 1, 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      pts.push({
        x: Math.cos(theta) * r,
        y,
        z: Math.sin(theta) * r,
      });
    }
    return pts;
  }

  function rotateY(p, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
  }

  function project(rot, cx, cy, R) {
    const denom = 1 + rot.z;
    if (denom < 0.04) return null;
    const scale = (1.55 * R) / denom;
    let x = cx + rot.x * scale;
    let y = cy - rot.y * scale;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    const maxR = R * 0.94;
    if (dist > maxR) {
      x = cx + (dx / dist) * maxR;
      y = cy + (dy / dist) * maxR;
    }
    return {
      x,
      y,
      scale: (rot.z + 1) / 2,
      facing: rot.z,
    };
  }

  function polygonCentroid(poly) {
    let x = 0;
    let y = 0;
    let area = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [x0, y0] = poly[j];
      const [x1, y1] = poly[i];
      const f = x0 * y1 - x1 * y0;
      area += f;
      x += (x0 + x1) * f;
      y += (y0 + y1) * f;
    }
    area *= 0.5;
    if (Math.abs(area) < 1e-6) return poly[0] || [0, 0];
    return [x / (6 * area), y / (6 * area)];
  }

  function wrapText(text, maxLen) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (test.length > maxLen && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function chaikinSmooth(points, iterations = 2) {
    if (points.length < 3) return points;
    let pts = points.map(p => [p[0], p[1]]);
    for (let iter = 0; iter < iterations; iter++) {
      const next = [];
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % n];
        next.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1]);
        next.push([0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]);
      }
      pts = next;
    }
    return pts;
  }

  function polygonToSmoothPath(points) {
    if (!points.length) return '';
    let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}`;
    }
    return `${d} Z`;
  }

  function wrapAngle(a) {
    let x = a;
    while (x > Math.PI) x -= Math.PI * 2;
    while (x < -Math.PI) x += Math.PI * 2;
    return x;
  }

  function rayDistToPolygon(cx, cy, angle, poly) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let best = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % poly.length];
      const ex = x2 - x1;
      const ey = y2 - y1;
      const denom = ex * dy - ey * dx;
      if (Math.abs(denom) < 1e-9) continue;
      const t = ((x1 - cx) * dy - (y1 - cy) * dx) / denom;
      const u = ((x1 - cx) * ey - (y1 - cy) * ex) / denom;
      if (t >= 0 && t <= 1 && u >= 0 && u < best) best = u;
    }
    if (Number.isFinite(best)) return best;
    return Math.max(...poly.map(([x, y]) => Math.hypot(x - cx, y - cy)));
  }

  /** Distinct fictional country silhouettes — each id picks a different profile. */
  const COUNTRY_SHAPE_PROFILES = [
    theta => 0.88 + 0.12 * Math.cos(3 * theta),
    theta => 0.52 + 0.48 * Math.abs(Math.cos(theta)),
    theta => 0.52 + 0.48 * Math.abs(Math.sin(theta)),
    theta => 0.42 + 0.58 * Math.max(0, Math.cos(theta)),
    theta => 0.42 + 0.58 * Math.max(0, -Math.cos(theta)),
    theta => 0.48 + 0.42 * Math.cos(theta - 0.4) + 0.18 * Math.cos(2 * (theta - 0.9)),
    theta => 1 - 0.38 * Math.exp(-Math.pow(wrapAngle(theta - Math.PI) / 0.55, 2)),
    theta => 0.58 + 0.42 * Math.cos(theta - 0.65),
    theta => 0.4 + 0.6 * Math.pow(Math.max(0, Math.cos(theta - 0.3)), 0.65),
    theta => 0.5 + 0.5 / (Math.abs(Math.cos(theta)) + Math.abs(Math.sin(theta)) + 0.45),
    theta => 0.54 + 0.46 * Math.cos(5 * theta),
    theta => 0.5 + 0.5 * Math.abs(Math.sin(2 * theta)),
    theta => 0.44 + 0.56 * Math.pow(Math.sin(theta), 2),
    theta => 0.46 + 0.54 * Math.abs(Math.sin(theta * 0.5)),
    (theta, id) => {
      const seg = Math.floor((theta + Math.PI) / (Math.PI / 5));
      return 0.55 + 0.45 * hash01(`${id}-fjord-${seg}`);
    },
    theta => 0.48 + 0.52 * Math.abs(Math.cos(theta - Math.PI / 4)),
    theta => 0.45 + 0.55 * Math.max(0, Math.cos(theta - 1.1)) * (0.65 + 0.35 * Math.abs(Math.sin(theta))),
    theta => 0.62 + 0.38 * Math.cos(4 * theta + 0.5),
    theta => 0.5 + 0.5 * Math.pow(Math.abs(Math.cos(theta * 0.5)), 0.8),
    theta => 0.38 + 0.62 * Math.exp(-Math.pow(wrapAngle(theta) / 1.1, 2)),
  ];

  function countryShapeFromPoly(poly, id) {
    if (!poly || poly.length < 3) return null;
    const [cx, cy] = polygonCentroid(poly);
    const dists = poly.map(([x, y]) => Math.hypot(x - cx, y - cy));
    const maxDist = Math.max(...dists);
    const minDist = Math.min(...dists);
    const shapeIdx = Math.floor(hash01(id) * COUNTRY_SHAPE_PROFILES.length);
    const profile = COUNTRY_SHAPE_PROFILES[shapeIdx];
    const rotation = hash01(`${id}-rot`) * Math.PI * 2;
    const segments = 36;
    const pts = [];

    for (let si = 0; si < segments; si++) {
      const theta = (si / segments) * Math.PI * 2;
      const localTheta = theta - rotation;
      const profileR = profile(localTheta, id);
      const r = minDist * 0.32 + (maxDist * 0.94 - minDist * 0.32) * profileR;
      const rClamped = Math.min(r, rayDistToPolygon(cx, cy, theta, poly) * 0.98);
      pts.push([cx + Math.cos(theta) * rClamped, cy + Math.sin(theta) * rClamped]);
    }

    return polygonToSmoothPath(chaikinSmooth(pts, 2));
  }

  function organicCellPath(voronoi, i, id) {
    const poly = voronoi.cellPolygon(i);
    return countryShapeFromPoly(poly, id);
  }

  function organicBlobPath(cx, cy, baseR, seed, segments = 28) {
    const fakePoly = [];
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const wobble = 0.76 + hash01(`${seed}-${i}`) * 0.42;
      fakePoly.push([
        cx + Math.cos(a) * baseR * wobble,
        cy + Math.sin(a) * baseR * wobble * 0.86,
      ]);
    }
    return countryShapeFromPoly(fakePoly, seed);
  }

  const NIGHT_SKY_TEXTURE = 'images/globe-night-sky.webp';

  function appendNightSky(defs, scene, w, h) {
    const NS = 'http://www.w3.org/2000/svg';
    const patternId = 'globe-night-sky-photo';

    const pattern = document.createElementNS(NS, 'pattern');
    pattern.setAttribute('id', patternId);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('x', '0');
    pattern.setAttribute('y', '0');
    pattern.setAttribute('width', String(w));
    pattern.setAttribute('height', String(h));

    const image = document.createElementNS(NS, 'image');
    image.setAttribute('href', NIGHT_SKY_TEXTURE);
    image.setAttribute('width', String(w));
    image.setAttribute('height', String(h));
    image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    pattern.appendChild(image);
    defs.appendChild(pattern);

    const sky = document.createElementNS(NS, 'rect');
    sky.setAttribute('width', w);
    sky.setAttribute('height', h);
    sky.setAttribute('fill', `url(#${patternId})`);
    sky.setAttribute('class', 'globe-night-sky');
    scene.appendChild(sky);

    const vignette = document.createElementNS(NS, 'rect');
    vignette.setAttribute('width', w);
    vignette.setAttribute('height', h);
    vignette.setAttribute('fill', 'url(#globe-night-vignette)');
    vignette.setAttribute('class', 'globe-night-vignette');
    vignette.setAttribute('pointer-events', 'none');
    scene.appendChild(vignette);
  }

  function parchmentWash(id) {
    const h = Math.floor(hash01(id) * 48 + 18);
    const s = 20 + Math.floor(hash01(`${id}s`) * 32);
    const l = 66 + Math.floor(hash01(`${id}l`) * 18);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  function mapRegionLabel(name) {
    const short = name.replace(/^The Principality of\s+/i, '').trim();
    const words = short.split(/\s+/);
    if (words.length <= 2) return short;
    return words.slice(0, 2).join(' ');
  }

  function topicPlaceLabel(topic) {
    const words = String(topic.name || '').trim().split(/\s+/);
    const short = words.length <= 2 ? words.join(' ') : words.slice(0, 2).join(' ');
    return shortenFruitName(short, 16);
  }

  function layoutTopicPlaces(topics, x, y, w, h) {
    const pad = 44;
    const minDist = 58;
    const bandPad = 22;
    const positions = new Map();
    const placed = [];

    const avoidZones = [
      { cx: x + w * 0.14, cy: y + h * 0.72, r: w * 0.11 },
      { cx: x + w * 0.82, cy: y + h * 0.22, r: w * 0.09 },
      { cx: x + w * 0.68, cy: y + h * 0.78, r: w * 0.08 },
    ];

    function inAvoidZone(px, py) {
      return avoidZones.some(z => Math.hypot(px - z.cx, py - z.cy) < z.r);
    }

    function clampPos(px, py) {
      return {
        x: Math.max(x + pad, Math.min(x + w - pad, px)),
        y: Math.max(y + pad + bandPad, Math.min(y + h - pad - bandPad, py)),
      };
    }

    const innerW = w - pad * 2;
    const innerH = h - pad * 2 - bandPad * 2;
    const cols = Math.max(4, Math.ceil(Math.sqrt(topics.length * (innerW / Math.max(innerH, 1)))));
    const rows = Math.ceil(topics.length / cols);
    const cellW = innerW / cols;
    const cellH = innerH / Math.max(rows, 1);

    const ordered = [...topics].sort((a, b) => hash01(`${a.id}ord`) - hash01(`${b.id}ord`));

    ordered.forEach((topic, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      let best = null;
      let bestScore = -1;

      for (let a = 0; a < 48; a++) {
        const jx = (hash01(`${topic.id}jx${a}`) - 0.5) * cellW * 0.78;
        const jy = (hash01(`${topic.id}jy${a}`) - 0.5) * cellH * 0.78;
        const px = x + pad + col * cellW + cellW * 0.5 + jx;
        const py = y + pad + bandPad + row * cellH + cellH * 0.5 + jy;
        const pos = clampPos(px, py);
        if (inAvoidZone(pos.x, pos.y)) continue;

        let minD = placed.length ? Infinity : minDist;
        for (const p of placed) {
          minD = Math.min(minD, Math.hypot(pos.x - p.x, pos.y - p.y));
        }
        if (placed.length && minD < minDist) continue;

        const edgeBonus = Math.min(pos.x - x, pos.y - y, x + w - pos.x, y + h - pos.y) / pad;
        const score = minD * (placed.length ? 1.1 : 0.6) + edgeBonus * 0.25 + hash01(`${topic.id}s${a}`) * 0.08;
        if (score > bestScore) {
          bestScore = score;
          best = pos;
        }
      }

      if (!best) {
        for (let a = 0; a < 64; a++) {
          const pos = clampPos(
            x + pad + hash01(`${topic.id}fx${a}`) * innerW,
            y + pad + bandPad + hash01(`${topic.id}fy${a}`) * innerH,
          );
          if (inAvoidZone(pos.x, pos.y)) continue;
          let minD = placed.length ? Infinity : minDist;
          for (const p of placed) {
            minD = Math.min(minD, Math.hypot(pos.x - p.x, pos.y - p.y));
          }
          if (placed.length && minD < minDist * 0.85) continue;
          best = pos;
          break;
        }
      }

      if (!best) {
        best = clampPos(
          x + pad + hash01(topic.id) * innerW,
          y + pad + bandPad + hash01(`${topic.id}y`) * innerH,
        );
      }

      placed.push(best);
      positions.set(topic.id, best);
    });

    for (let pass = 0; pass < 3; pass++) {
      for (const topic of topics) {
        const pos = positions.get(topic.id);
        if (!pos) continue;
        for (const other of topics) {
          if (other.id === topic.id) continue;
          const op = positions.get(other.id);
          if (!op) continue;
          const dx = pos.x - op.x;
          const dy = pos.y - op.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < minDist) {
            const push = (minDist - d) * 0.5;
            pos.x += (dx / d) * push;
            pos.y += (dy / d) * push;
            const clamped = clampPos(pos.x, pos.y);
            pos.x = clamped.x;
            pos.y = clamped.y;
          }
        }
      }
    }

    return positions;
  }

  function drawInkRiver(g, x, y, w, h, seed) {
    const NS = 'http://www.w3.org/2000/svg';
    const layer = document.createElementNS(NS, 'g');
    layer.setAttribute('class', 'globe-topic-terrain globe-topic-river');

    const x0 = x + w * 0.08;
    const y0 = y + h * (0.35 + hash01(`${seed}r0`) * 0.15);
    const c1x = x + w * (0.28 + hash01(`${seed}r1`) * 0.12);
    const c1y = y + h * (0.55 + hash01(`${seed}r2`) * 0.1);
    const c2x = x + w * (0.55 + hash01(`${seed}r3`) * 0.15);
    const c2y = y + h * (0.25 + hash01(`${seed}r4`) * 0.12);
    const x1 = x + w * 0.92;
    const y1 = y + h * (0.62 + hash01(`${seed}r5`) * 0.12);
    const mainD = `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;

    const water = document.createElementNS(NS, 'path');
    water.setAttribute('d', mainD);
    water.setAttribute('fill', 'none');
    water.setAttribute('class', 'globe-topic-river-water');
    layer.appendChild(water);

    const main = document.createElementNS(NS, 'path');
    main.setAttribute('d', mainD);
    main.setAttribute('class', 'globe-topic-river-ink');
    layer.appendChild(main);

    const bx = c1x + (c2x - c1x) * 0.35;
    const by = c1y + (c2y - c1y) * 0.35;
    const branchD = `M ${bx.toFixed(1)} ${by.toFixed(1)} Q ${(bx + w * 0.06).toFixed(1)} ${(by - h * 0.12).toFixed(1)}, ${(bx + w * 0.14).toFixed(1)} ${(by - h * 0.08).toFixed(1)}`;
    const branchWater = document.createElementNS(NS, 'path');
    branchWater.setAttribute('d', branchD);
    branchWater.setAttribute('fill', 'none');
    branchWater.setAttribute('class', 'globe-topic-river-water');
    layer.appendChild(branchWater);
    const branch = document.createElementNS(NS, 'path');
    branch.setAttribute('d', branchD);
    branch.setAttribute('class', 'globe-topic-river-ink');
    layer.appendChild(branch);

    const branch2D = `M ${c2x.toFixed(1)} ${c2y.toFixed(1)} Q ${(c2x - w * 0.05).toFixed(1)} ${(c2y + h * 0.1).toFixed(1)}, ${(c2x - w * 0.12).toFixed(1)} ${(c2y + h * 0.14).toFixed(1)}`;
    const branch2Water = document.createElementNS(NS, 'path');
    branch2Water.setAttribute('d', branch2D);
    branch2Water.setAttribute('fill', 'none');
    branch2Water.setAttribute('class', 'globe-topic-river-water');
    layer.appendChild(branch2Water);
    const branch2 = document.createElementNS(NS, 'path');
    branch2.setAttribute('d', branch2D);
    branch2.setAttribute('class', 'globe-topic-river-ink');
    layer.appendChild(branch2);

    g.appendChild(layer);
  }

  function drawMountainCluster(g, cx, cy, scale, seed) {
    const NS = 'http://www.w3.org/2000/svg';
    const cluster = document.createElementNS(NS, 'g');
    cluster.setAttribute('class', 'globe-topic-terrain globe-topic-mountains');
    cluster.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${scale.toFixed(2)})`);

    const peaks = [
      [-18, 14, -10, -12, -2, 14],
      [-6, 14, 2, -16, 10, 14],
      [4, 14, 12, -8, 20, 14],
    ];
    peaks.forEach((pts, i) => {
      const peak = document.createElementNS(NS, 'polygon');
      peak.setAttribute('points', pts.join(' '));
      peak.setAttribute('class', 'globe-topic-mountain-peak');
      cluster.appendChild(peak);
      for (let h = 0; h < 3; h++) {
        const hatch = document.createElementNS(NS, 'line');
        const t = 0.25 + h * 0.2 + hash01(`${seed}h${i}${h}`) * 0.08;
        const px = pts[2] + (pts[4] - pts[2]) * t * 0.5;
        const py = pts[3] + (pts[5] - pts[3]) * t;
        hatch.setAttribute('x1', px - 3);
        hatch.setAttribute('y1', py + 2);
        hatch.setAttribute('x2', px + 3);
        hatch.setAttribute('y2', py - 4);
        hatch.setAttribute('class', 'globe-topic-mountain-hatch');
        cluster.appendChild(hatch);
      }
    });

    g.appendChild(cluster);
  }

  function drawTreeCluster(g, cx, cy, scale, seed) {
    const NS = 'http://www.w3.org/2000/svg';
    const cluster = document.createElementNS(NS, 'g');
    cluster.setAttribute('class', 'globe-topic-terrain globe-topic-trees');
    cluster.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${scale.toFixed(2)})`);

    const count = 3 + Math.floor(hash01(`${seed}tc`) * 3);
    for (let i = 0; i < count; i++) {
      const tx = (hash01(`${seed}t${i}x`) - 0.5) * 16;
      const ty = (hash01(`${seed}t${i}y`) - 0.3) * 8;
      const tree = document.createElementNS(NS, 'path');
      tree.setAttribute(
        'd',
        `M ${tx.toFixed(1)} ${(ty + 6).toFixed(1)} L ${tx.toFixed(1)} ${(ty + 2).toFixed(1)} M ${(tx - 3).toFixed(1)} ${(ty + 2).toFixed(1)} L ${tx.toFixed(1)} ${(ty - 4).toFixed(1)} L ${(tx + 3).toFixed(1)} ${(ty + 2).toFixed(1)}`,
      );
      tree.setAttribute('class', 'globe-topic-tree');
      cluster.appendChild(tree);
    }

    g.appendChild(cluster);
  }

  function drawScrollBorder(g, x, y, w, h, edge) {
    const NS = 'http://www.w3.org/2000/svg';
    const bandH = 16;
    const bandY = edge === 'top' ? y + 6 : y + h - bandH - 6;
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', x + 8);
    rect.setAttribute('y', bandY);
    rect.setAttribute('width', w - 16);
    rect.setAttribute('height', bandH);
    rect.setAttribute('rx', 2);
    rect.setAttribute('class', 'globe-topic-scroll-band');
    g.appendChild(rect);

    const wave = document.createElementNS(NS, 'path');
    wave.setAttribute('class', 'globe-topic-scroll-border');
    const amp = 2.5;
    const steps = 16;
    let d = '';
    const baseY = edge === 'top' ? bandY + bandH * 0.55 : bandY + bandH * 0.45;
    d = `M ${x + 10} ${baseY.toFixed(1)}`;
    for (let i = 0; i <= steps; i++) {
      const px = x + 10 + ((w - 20) * i) / steps;
      const py = baseY + Math.sin(i * 1.1 + (edge === 'top' ? 0 : 1.4)) * amp;
      d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    wave.setAttribute('d', d);
    wave.setAttribute('fill', 'none');
    g.appendChild(wave);
  }

  function drawTopicRegionMap(g, region, principalityName, topics, principalityId) {
    const NS = 'http://www.w3.org/2000/svg';
    const { x, y, w, h } = region;
    const layer = document.createElementNS(NS, 'g');
    layer.setAttribute('class', 'globe-topic-region');

    const frame = document.createElementNS(NS, 'rect');
    frame.setAttribute('x', x);
    frame.setAttribute('y', y);
    frame.setAttribute('width', w);
    frame.setAttribute('height', h);
    frame.setAttribute('rx', 6);
    frame.setAttribute('class', 'globe-topic-region-frame');
    layer.appendChild(frame);

    const inner = document.createElementNS(NS, 'rect');
    inner.setAttribute('x', x + 5);
    inner.setAttribute('y', y + 5);
    inner.setAttribute('width', w - 10);
    inner.setAttribute('height', h - 10);
    inner.setAttribute('rx', 4);
    inner.setAttribute('class', 'globe-topic-region-parchment');
    layer.appendChild(inner);

    drawScrollBorder(layer, x, y, w, h, 'top');
    drawScrollBorder(layer, x, y, w, h, 'bottom');

    const coastFill = document.createElementNS(NS, 'path');
    coastFill.setAttribute(
      'd',
      `M ${x + w - 8} ${y + 14} Q ${x + w - 32} ${y + h * 0.4} ${x + w - 18} ${y + h * 0.58} T ${x + w - 8} ${y + h - 14} L ${x + w - 5} ${y + h - 14} L ${x + w - 5} ${y + 14} Z`,
    );
    coastFill.setAttribute('class', 'globe-topic-region-sea');
    layer.appendChild(coastFill);

    drawInkRiver(layer, x, y, w, h, principalityId || principalityName);

    drawMountainCluster(layer, x + w * 0.14, y + h * 0.72, 0.55, `${principalityId}-m1`);
    drawMountainCluster(layer, x + w * 0.82, y + h * 0.22, 0.45, `${principalityId}-m2`);
    drawMountainCluster(layer, x + w * 0.68, y + h * 0.78, 0.38, `${principalityId}-m3`);

    drawTreeCluster(layer, x + w * 0.24, y + h * 0.28, 0.9, `${principalityId}-t1`);
    drawTreeCluster(layer, x + w * 0.76, y + h * 0.58, 0.85, `${principalityId}-t2`);
    drawTreeCluster(layer, x + w * 0.48, y + h * 0.82, 0.75, `${principalityId}-t3`);
    drawTreeCluster(layer, x + w * 0.58, y + h * 0.18, 0.7, `${principalityId}-t4`);

    const forest = document.createElementNS(NS, 'ellipse');
    forest.setAttribute('cx', x + w * 0.78);
    forest.setAttribute('cy', y + h * 0.72);
    forest.setAttribute('rx', w * 0.18);
    forest.setAttribute('ry', h * 0.14);
    forest.setAttribute('class', 'globe-topic-region-forest');
    layer.appendChild(forest);

    const displayTopics = topics.slice(0, 48);
    const positions = layoutTopicPlaces(displayTopics, x, y, w, h);

    // Globe transport only: no inter-topic connector lines (relatedness is implied by
    // shared principality map). Force-graph views in app.js keep their own link layers.

    const nodes = document.createElementNS(NS, 'g');
    nodes.setAttribute('class', 'globe-topic-nodes');
    const topicIcons = window.TopicIcons;
    displayTopics.forEach(topic => {
      const pos = positions.get(topic.id);
      if (!pos) return;

      const iconType = topicIcons?.getTopicIconType(topic) ?? 'cottage';

      const node = document.createElementNS(NS, 'g');
      node.setAttribute('class', 'globe-topic-node');
      node.setAttribute('transform', `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`);

      const hit = document.createElementNS(NS, 'circle');
      hit.setAttribute('r', 28);
      hit.setAttribute('class', 'globe-topic-station globe-topic-node-hit');
      hit.setAttribute('data-topic-id', topic.id);
      hit.style.cursor = 'pointer';

      node.appendChild(hit);

      if (topicIcons?.drawTopicIcon) {
        topicIcons.drawTopicIcon(node, iconType, topic.id);
      } else {
        const icon = document.createElementNS(NS, 'path');
        icon.setAttribute('d', 'M -4 2 L 0 -4 L 4 2 Z M -3 2 V 5 H 3 V 2');
        icon.setAttribute('class', 'globe-topic-settlement-icon');
        icon.setAttribute('pointer-events', 'none');
        node.appendChild(icon);
      }

      const label = document.createElementNS(NS, 'text');
      label.setAttribute('y', 34);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'globe-topic-place-label');
      label.setAttribute('pointer-events', 'none');
      label.textContent = topicPlaceLabel(topic);

      const num = document.createElementNS(NS, 'text');
      num.setAttribute('y', -20);
      num.setAttribute('text-anchor', 'middle');
      num.setAttribute('class', 'globe-topic-place-num');
      num.setAttribute('pointer-events', 'none');
      num.textContent = String(topic.number).padStart(3, '0');

      node.appendChild(num);
      node.appendChild(label);

      nodes.appendChild(node);
    });
    layer.appendChild(nodes);

    if (topics.length > displayTopics.length) {
      const more = document.createElementNS(NS, 'text');
      more.setAttribute('x', x + w - 10);
      more.setAttribute('y', y + h - 8);
      more.setAttribute('text-anchor', 'end');
      more.setAttribute('class', 'globe-topic-region-more');
      more.textContent = `+${topics.length - displayTopics.length} places`;
      layer.appendChild(more);
    }

    g.appendChild(layer);
  }

  function splitFruitsIntoRings(count) {
    if (count <= 0) return [];
    if (count <= 4) return [count];
    if (count <= 9) {
      const inner = Math.ceil(count / 2);
      return [inner, count - inner];
    }
    const a = Math.ceil(count / 3);
    const b = Math.ceil((count - a) / 2);
    return [a, b, count - a - b].filter(n => n > 0);
  }

  function shortenFruitName(name, max = 22) {
    const n = String(name || '').trim();
    if (n.length <= max) return n;
    return `${n.slice(0, max - 1)}…`;
  }

  function fruitBannerWidth(labelText, min = 104, max = 220) {
    return Math.max(min, Math.min(max, labelText.length * 11.6 + 36));
  }

  /** Rough half-width for root metro labels (px) at 9px DM Sans. */
  function rootLabelHalfWidth(name, maxHalf = 56) {
    const n = String(name || '').trim();
    return Math.min(maxHalf, n.length * 2.65 + 6);
  }

  function layoutRootStationXs(roots, x0, x1) {
    const n = roots.length;
    if (n === 0) return [];
    if (n === 1) return [(x0 + x1) / 2];

    const half = roots.map(r => rootLabelHalfWidth(r.name));
    const gaps = [];
    for (let i = 1; i < n; i++) {
      gaps.push(Math.max(18, half[i - 1] + half[i]));
    }
    const needed = half[0] + gaps.reduce((sum, g) => sum + g, 0) + half[n - 1];
    const span = x1 - x0;

    if (needed <= span) {
      const positions = [x0 + half[0]];
      for (let i = 1; i < n; i++) positions.push(positions[i - 1] + gaps[i - 1]);
      const end = positions[n - 1] + half[n - 1];
      const shift = x0 + (span - (end - x0)) / 2 - positions[0] + half[0];
      return positions.map(p => p + shift);
    }

    return roots.map((_, i) => x0 + (span * i) / (n - 1));
  }

  function wrapRootLabelLines(name, maxChars = 16, maxLines = 2) {
    const words = String(name || '').trim().split(/\s+/);
    if (!words.length) return [''];
    const lines = [];
    let line = '';
    words.forEach(word => {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    if (lines.length <= maxLines) return lines;
    const merged = lines.slice(0, maxLines - 1);
    merged.push(`${lines.slice(maxLines - 1).join(' ').slice(0, maxChars - 1)}…`);
    return merged;
  }

  function appendRootStationLabel(parent, name, anchorX) {
    const NS = 'http://www.w3.org/2000/svg';
    const lines = wrapRootLabelLines(name);
    lines.forEach((ln, i) => {
      const tspan = document.createElementNS(NS, 'tspan');
      // Each line must re-anchor to the station x — omitting x or using 0 stacks every label at the origin.
      tspan.setAttribute('x', anchorX);
      tspan.setAttribute('dy', i === 0 ? 0 : 11);
      tspan.textContent = ln;
      parent.appendChild(tspan);
    });
  }

  function drawRainbowBanner(parent, x, y, width, label, fruitId) {
    const NS = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(NS, 'g');
    group.setAttribute('class', 'globe-fruit-banner-block');
    group.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);

    const halfW = width / 2;
    const arch = Math.min(14, width * 0.12);
    const ribbonH = 28;
    const tone = hash01(fruitId) > 0.5 ? 'gold' : 'green';
    group.setAttribute('data-tone', tone);

    const ribbon = document.createElementNS(NS, 'path');
    ribbon.setAttribute(
      'd',
      `M ${(-halfW).toFixed(1)} ${(ribbonH * 0.35).toFixed(1)}`
      + ` Q 0 ${(-arch).toFixed(1)} ${halfW.toFixed(1)} ${(ribbonH * 0.35).toFixed(1)}`
      + ` L ${(halfW - 2).toFixed(1)} ${ribbonH.toFixed(1)}`
      + ` Q 0 ${(ribbonH - arch * 0.35).toFixed(1)} ${(-halfW + 2).toFixed(1)} ${ribbonH.toFixed(1)} Z`,
    );
    ribbon.setAttribute('class', `globe-fruit-ribbon globe-fruit-ribbon-${tone}`);
    ribbon.setAttribute('pointer-events', 'none');
    group.appendChild(ribbon);

    const stroke = document.createElementNS(NS, 'path');
    stroke.setAttribute(
      'd',
      `M ${(-halfW + 1).toFixed(1)} ${(ribbonH * 0.35).toFixed(1)}`
      + ` Q 0 ${(-arch + 1).toFixed(1)} ${(halfW - 1).toFixed(1)} ${(ribbonH * 0.35).toFixed(1)}`,
    );
    stroke.setAttribute('class', 'globe-fruit-ribbon-stroke');
    stroke.setAttribute('fill', 'none');
    stroke.setAttribute('pointer-events', 'none');
    group.appendChild(stroke);

    const text = document.createElementNS(NS, 'text');
    text.setAttribute('y', ribbonH * 0.55);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'globe-fruit-banner-text');
    text.setAttribute('pointer-events', 'none');
    text.textContent = label;
    group.appendChild(text);

    parent.appendChild(group);
    return group;
  }

  function drawFruitMetroGlobe(metro, cx, cy, R, nextPathId, opts = {}) {
    const NS = 'http://www.w3.org/2000/svg';
    const bastionCount = opts.bastionCount ?? 14;
    const titleText = opts.title ?? 'Fruit metro';
    const clipScale = opts.clipScale ?? 1.08;

    const clipId = nextPathId();
    const defs = document.createElementNS(NS, 'defs');
    const clip = document.createElementNS(NS, 'clipPath');
    clip.setAttribute('id', clipId);
    const clipCircle = document.createElementNS(NS, 'circle');
    clipCircle.setAttribute('cx', cx);
    clipCircle.setAttribute('cy', cy);
    clipCircle.setAttribute('r', R * clipScale);
    clip.appendChild(clipCircle);
    defs.appendChild(clip);
    metro.appendChild(defs);

    const pad = Math.max(4, R * 0.04);
    const innerR = R - pad;

    const floor = document.createElementNS(NS, 'circle');
    floor.setAttribute('cx', cx);
    floor.setAttribute('cy', cy);
    floor.setAttribute('r', innerR);
    floor.setAttribute('class', 'globe-fruit-metro-floor');
    metro.appendChild(floor);

    const plaza = document.createElementNS(NS, 'circle');
    plaza.setAttribute('cx', cx);
    plaza.setAttribute('cy', cy);
    plaza.setAttribute('r', R * 0.11);
    plaza.setAttribute('class', 'globe-fruit-metro-plaza');
    metro.appendChild(plaza);

    const wall = document.createElementNS(NS, 'circle');
    wall.setAttribute('cx', cx);
    wall.setAttribute('cy', cy);
    wall.setAttribute('r', R);
    wall.setAttribute('class', 'globe-fruit-metro-wall');
    metro.appendChild(wall);

    for (let b = 0; b < bastionCount; b++) {
      const a = (b / bastionCount) * Math.PI * 2;
      const bx = cx + Math.cos(a) * R;
      const by = cy + Math.sin(a) * R;
      const tower = document.createElementNS(NS, 'circle');
      tower.setAttribute('cx', bx);
      tower.setAttribute('cy', by);
      tower.setAttribute('r', Math.max(2.5, R * 0.028));
      tower.setAttribute('class', 'globe-fruit-metro-bastion');
      metro.appendChild(tower);
    }

    const title = document.createElementNS(NS, 'text');
    title.setAttribute('x', cx);
    title.setAttribute('y', cy);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('dominant-baseline', 'middle');
    title.setAttribute('class', 'globe-fruit-metro-title');
    title.textContent = titleText;
    metro.appendChild(title);

    return clipId;
  }

  function singleFruitMetroRadius(fruit, maxMetroR) {
    const labelText = shortenFruitName(fruit.name, 28);
    const bannerW = Math.max(104, Math.min(220, labelText.length * 11.6 + 36));
    return {
      R: Math.max(36, Math.min(bannerW * 0.42, maxMetroR * 0.55, 76)),
      bannerW,
      labelText,
    };
  }

  function drawSingleFruitMetro(g, cx, cy, maxMetroR, fruit, nextPathId) {
    const NS = 'http://www.w3.org/2000/svg';
    const { R, bannerW, labelText } = singleFruitMetroRadius(fruit, maxMetroR);
    const metro = document.createElementNS(NS, 'g');
    metro.setAttribute('class', 'globe-fruit-metro globe-fruit-metro-single');

    drawFruitMetroGlobe(metro, cx, cy, R, nextPathId, {
      bastionCount: 8,
      title: 'Fruit',
      clipScale: 1.02,
    });

    const bannerGap = 12;
    const ribbonH = 28;
    const bannerY = cy - R - bannerGap - ribbonH * 0.45;

    const block = document.createElementNS(NS, 'g');
    block.setAttribute('class', 'globe-fruit-word-block globe-fruit-single-banner');
    const hit = document.createElementNS(NS, 'circle');
    hit.setAttribute('cx', cx);
    hit.setAttribute('cy', bannerY);
    hit.setAttribute('r', Math.max(24, bannerW * 0.22));
    hit.setAttribute('class', 'globe-station fruit globe-fruit-word-hit');
    hit.setAttribute('data-id', fruit.id);
    hit.style.cursor = 'pointer';
    block.appendChild(hit);
    drawRainbowBanner(block, cx, bannerY, bannerW, labelText, fruit.id);
    metro.appendChild(block);

    g.appendChild(metro);
    return R;
  }

  function placeFruitBlocks(ring, rotation) {
    const cx = parseFloat(ring.getAttribute('data-cx'));
    const cy = parseFloat(ring.getAttribute('data-cy'));
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;
    ring.querySelectorAll('.globe-fruit-word-block').forEach(block => {
      const mid = parseFloat(block.getAttribute('data-orbit-angle')) + rotation;
      const r = parseFloat(block.getAttribute('data-orbit-r'));
      const hx = cx + Math.cos(mid) * r;
      const hy = cy + Math.sin(mid) * r;
      block.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`);
    });
  }

  function drawLargeFruitMetro(g, cx, cy, R, fruits, nextPathId, ringRotation = 0) {
    if (fruits.length === 1) {
      return drawSingleFruitMetro(g, cx, cy, R, fruits[0], nextPathId);
    }

    const NS = 'http://www.w3.org/2000/svg';
    const metro = document.createElementNS(NS, 'g');
    metro.setAttribute('class', 'globe-fruit-metro');

    const clipId = drawFruitMetroGlobe(metro, cx, cy, R, nextPathId);

    const ring = document.createElementNS(NS, 'g');
    ring.setAttribute('class', 'globe-fruit-ring');
    ring.setAttribute('clip-path', `url(#${clipId})`);
    ring.setAttribute('data-cx', String(cx));
    ring.setAttribute('data-cy', String(cy));

    const rings = splitFruitsIntoRings(fruits.length);
    const minWordR = R * 0.24;
    const maxWordR = R * 0.86;
    let fruitIdx = 0;

    rings.forEach((slotCount, ringIdx) => {
      const t = (ringIdx + 1) / (rings.length + 0.65);
      const r = minWordR + t * (maxWordR - minWordR);
      const gap = 0.12;

      for (let i = 0; i < slotCount && fruitIdx < fruits.length; i++, fruitIdx++) {
        const fruit = fruits[fruitIdx];
        const start = (i / slotCount) * Math.PI * 2 - Math.PI / 2 + gap;
        const end = ((i + 1) / slotCount) * Math.PI * 2 - Math.PI / 2 - gap;
        const mid = (start + end) / 2;
        const labelText = shortenFruitName(fruit.name);
        const bannerW = Math.max(104, Math.min(176, labelText.length * 11.6 + 36));
        const inset = Math.min(bannerW * 0.15, r * 0.1);
        const orbitR = r - inset;

        const hit = document.createElementNS(NS, 'circle');
        hit.setAttribute('cx', 0);
        hit.setAttribute('cy', 0);
        hit.setAttribute('r', Math.max(28, R * 0.15));
        hit.setAttribute('class', 'globe-station fruit globe-fruit-word-hit');
        hit.setAttribute('data-id', fruit.id);
        hit.style.cursor = 'pointer';

        const block = document.createElementNS(NS, 'g');
        block.setAttribute('class', 'globe-fruit-word-block');
        block.setAttribute('data-orbit-angle', String(mid));
        block.setAttribute('data-orbit-r', String(orbitR));
        block.appendChild(hit);
        drawRainbowBanner(block, 0, -8, bannerW, labelText, fruit.id);
        ring.appendChild(block);
      }
    });

    placeFruitBlocks(ring, ringRotation);
    metro.appendChild(ring);
    g.appendChild(metro);
    return R;
  }

  /** Non-overlapping wrapped grid — each fruit banner is fully visible. */
  function drawFruitGrid(g, box, fruits) {
    const NS = 'http://www.w3.org/2000/svg';
    const { x, y, w } = box;
    const grid = document.createElementNS(NS, 'g');
    grid.setAttribute('class', 'globe-fruit-grid');

    const colGap = 10;
    const rowGap = 10;
    const ribbonH = 28;
    let rowX = x;
    let rowY = y;
    let rowStartX = x;
    let bottomY = y;

    fruits.forEach(fruit => {
      const labelText = shortenFruitName(fruit.name, 34);
      const bannerW = fruitBannerWidth(labelText);

      if (rowX + bannerW > x + w && rowX > rowStartX) {
        rowY += ribbonH + rowGap;
        rowX = rowStartX;
      }

      const block = document.createElementNS(NS, 'g');
      block.setAttribute('class', 'globe-fruit-word-block');
      block.setAttribute('transform', `translate(${rowX.toFixed(1)} ${rowY.toFixed(1)})`);

      const hit = document.createElementNS(NS, 'rect');
      hit.setAttribute('x', 0);
      hit.setAttribute('y', 0);
      hit.setAttribute('width', bannerW);
      hit.setAttribute('height', ribbonH + 2);
      hit.setAttribute('rx', 4);
      hit.setAttribute('class', 'globe-station fruit globe-fruit-word-hit');
      hit.setAttribute('data-id', fruit.id);
      hit.style.cursor = 'pointer';
      block.appendChild(hit);

      drawRainbowBanner(block, bannerW / 2, 0, bannerW, labelText, fruit.id);
      grid.appendChild(block);

      rowX += bannerW + colGap;
      bottomY = rowY + ribbonH;
    });

    g.appendChild(grid);
    return bottomY - y + ribbonH;
  }

  function drawTransportClose(parent, barX, regionY, regionH, onClose) {
    const NS = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(NS, 'g');
    group.setAttribute('class', 'globe-transport-close');
    group.style.cursor = 'pointer';

    const hit = document.createElementNS(NS, 'rect');
    hit.setAttribute('x', barX - 22);
    hit.setAttribute('y', regionY - 6);
    hit.setAttribute('width', 44);
    hit.setAttribute('height', regionH + 44);
    hit.setAttribute('fill', 'transparent');
    hit.setAttribute('class', 'globe-transport-close-hit');
    group.appendChild(hit);

    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', barX);
    line.setAttribute('y1', regionY);
    line.setAttribute('x2', barX);
    line.setAttribute('y2', regionY + regionH);
    line.setAttribute('class', 'globe-root-line globe-transport-close-bar');
    group.appendChild(line);

    for (const ry of [regionY, regionY + regionH]) {
      const cap = document.createElementNS(NS, 'rect');
      cap.setAttribute('x', barX - 3);
      cap.setAttribute('y', ry - 3);
      cap.setAttribute('width', 6);
      cap.setAttribute('height', 6);
      cap.setAttribute('rx', 1);
      cap.setAttribute('class', 'globe-root-terminus');
      group.appendChild(cap);
    }

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', barX);
    label.setAttribute('y', regionY + regionH + 22);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'globe-transport-close-label');
    label.textContent = 'Close';
    group.appendChild(label);

    group.addEventListener('click', onClose);
    parent.appendChild(group);
  }

  const MAG_MIN = 0.08;
  const MAG_MAX = 14;

  function clampMag(m) {
    return Math.max(MAG_MIN, Math.min(MAG_MAX, m));
  }

  function create(host, options) {
    if (!host) return null;

    const {
      principalities = [],
      colors,
      lookups,
      getConnections,
      onSelectPrincipality,
      onSelectTopic,
      onSelectNode,
      onBackgroundClick,
      onMagnificationChange,
    } = options;

    const state = {
      rotation: 0.4,
      dragging: false,
      dragMoved: false,
      panning: false,
      dragStartX: 0,
      lastX: 0,
      lastY: 0,
      pendingRegionId: null,
      phase: 'globe',
      selectedId: null,
      magnification: 1,
      panX: 0,
      panY: 0,
      fruitRotation: 0,
      fruitSpinning: false,
      fruitSpinMoved: false,
      fruitSpinLastX: 0,
      fruitMetroCenter: null,
      fruitDidSpin: false,
    };

    host.innerHTML = '';
    host.classList.add('globe-view-host');

    const caption = document.createElement('p');
    caption.className = 'globe-view-caption';
    caption.textContent = 'The Living Word — fictional chart (not Earth)';
    host.appendChild(caption);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'globe-view-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Globe word map');
    host.appendChild(svg);

    const hint = document.createElement('p');
    hint.className = 'globe-view-hint';
    hint.textContent = 'Drag to spin the chart · scroll or slider to magnify · tap a kingdom for routes.';
    host.appendChild(hint);

    let spinFrame = null;
    let clipSeq = 0;

    function scheduleGlobeRender() {
      if (spinFrame) return;
      spinFrame = requestAnimationFrame(() => {
        spinFrame = null;
        renderGlobe();
      });
    }

    const anchors = principalities.map((p, i) => {
      const pt = fibonacciSphere(principalities.length)[i];
      return { ...p, anchor: pt };
    });

    function clearSvg() {
      svg.querySelectorAll('.globe-scene').forEach(node => node.remove());
    }

    function size() {
      const rect = host.getBoundingClientRect();
      return { w: Math.max(320, rect.width), h: Math.max(280, rect.height) };
    }

    function sceneTransformAttr(w, h) {
      const cx = w / 2 + state.panX;
      const cy = h / 2 + state.panY;
      return `translate(${cx}, ${cy}) scale(${state.magnification}) translate(${-w / 2}, ${-h / 2})`;
    }

    function createTransformGroup(w, h) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'globe-scene-transform');
      g.setAttribute('transform', sceneTransformAttr(w, h));
      return g;
    }

    function getMagnification() {
      return state.magnification;
    }

    function setMagnification(m, opts = {}) {
      const next = clampMag(m);
      if (next === state.magnification) return;
      state.magnification = next;
      if (state.magnification <= 1 && state.phase === 'transport') {
        state.panX = 0;
        state.panY = 0;
      }
      if (state.phase === 'globe') renderGlobe();
      else if (state.selectedId) renderTransportMap(state.selectedId);
      if (!opts.silent) onMagnificationChange?.(state.magnification);
    }

    function renderGlobe() {
      state.phase = 'globe';
      const { w, h } = size();
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

      const scene = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      scene.setAttribute('class', 'globe-scene');

      const cx = w / 2;
      const cy = h * 0.48;
      const R = Math.min(w, h) * 0.36;

      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <radialGradient id="globe-night-vignette" cx="50%" cy="44%" r="78%">
          <stop offset="0%" stop-color="rgba(0, 0, 0, 0)"/>
          <stop offset="68%" stop-color="rgba(0, 0, 0, 0)"/>
          <stop offset="100%" stop-color="rgba(2, 4, 12, 0.55)"/>
        </radialGradient>
        <radialGradient id="globe-ocean-base" cx="36%" cy="32%" r="82%">
          <stop offset="0%" stop-color="#0f3558"/>
          <stop offset="42%" stop-color="#071a2e"/>
          <stop offset="100%" stop-color="#020810"/>
        </radialGradient>
        <radialGradient id="globe-ocean-depth" cx="50%" cy="50%" r="58%">
          <stop offset="0%" stop-color="rgba(0, 0, 0, 0)"/>
          <stop offset="74%" stop-color="rgba(0, 0, 0, 0)"/>
          <stop offset="100%" stop-color="rgba(0, 6, 14, 0.52)"/>
        </radialGradient>`;
      defs.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'title')).textContent =
        'Fictional principality chart on a night-ocean globe';
      scene.appendChild(defs);

      appendNightSky(defs, scene, w, h);

      const clipId = `globe-clip-${++clipSeq}`;
      const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPath.setAttribute('id', clipId);
      const clipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      clipCircle.setAttribute('cx', cx);
      clipCircle.setAttribute('cy', cy);
      clipCircle.setAttribute('r', R - 1);
      clipPath.appendChild(clipCircle);
      defs.appendChild(clipPath);

      const content = createTransformGroup(w, h);

      const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ocean.setAttribute('cx', cx);
      ocean.setAttribute('cy', cy);
      ocean.setAttribute('r', R);
      ocean.setAttribute('fill', 'url(#globe-ocean-base)');
      ocean.setAttribute('class', 'globe-map-ocean');
      content.appendChild(ocean);

      const oceanDepth = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      oceanDepth.setAttribute('cx', cx);
      oceanDepth.setAttribute('cy', cy);
      oceanDepth.setAttribute('r', R);
      oceanDepth.setAttribute('fill', 'url(#globe-ocean-depth)');
      oceanDepth.setAttribute('pointer-events', 'none');
      oceanDepth.setAttribute('class', 'globe-map-ocean-depth');
      content.appendChild(oceanDepth);

      const projected = anchors.map(p => {
        const rot = rotateY(p.anchor, state.rotation);
        const pr = project(rot, cx, cy, R);
        return { ...p, rot, pr };
      });

      const regionLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      regionLayer.setAttribute('class', 'globe-regions');
      regionLayer.setAttribute('clip-path', `url(#${clipId})`);
      content.appendChild(regionLayer);

      const labelLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      labelLayer.setAttribute('class', 'globe-labels');
      labelLayer.setAttribute('clip-path', `url(#${clipId})`);
      content.appendChild(labelLayer);

      const mapEntries = projected
        .filter(p => p.pr)
        .sort((a, b) => a.rot.z - b.rot.z);

      const points = [];
      const entries = [];
      mapEntries.forEach(p => {
        points.push([p.pr.x, p.pr.y]);
        entries.push(p);
      });

      const ghostCount = 36;
      for (let i = 0; i < ghostCount; i++) {
        const a = (i / ghostCount) * Math.PI * 2;
        points.push([cx + Math.cos(a) * R * 1.02, cy + Math.sin(a) * R * 1.02]);
      }

      let regionCount = 0;

      if (typeof d3 !== 'undefined' && d3.Delaunay && entries.length >= 2) {
        const delaunay = d3.Delaunay.from(points);
        const voronoi = delaunay.voronoi([cx - R, cy - R, cx + R, cy + R]);

        entries.forEach((p, i) => {
          const d = organicCellPath(voronoi, i, p.id);
          if (!d) return;

          const facing = p.pr.facing > 0 ? 0.92 : 0.48;
          const wash = parchmentWash(p.id);
          const selected = state.selectedId === p.id;

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', d);
          path.setAttribute('fill', wash);
          path.setAttribute('stroke', selected ? '#7ec8f0' : '#1a4560');
          path.setAttribute('stroke-width', selected ? '2.2' : '1.15');
          path.setAttribute('stroke-linejoin', 'round');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('opacity', String(facing + p.pr.scale * 0.06));
          path.setAttribute('class', 'globe-region globe-map-region');
          path.setAttribute('data-id', p.id);
          path.style.cursor = 'pointer';
          regionLayer.appendChild(path);
          regionCount++;

          if (p.pr.scale > 0.18) {
            const poly = voronoi.cellPolygon(i);
            const [lx, ly] = poly?.length ? polygonCentroid(poly) : [p.pr.x, p.pr.y];
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', lx);
            label.setAttribute('y', ly);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dominant-baseline', 'middle');
            label.setAttribute('class', 'globe-region-label globe-map-label');
            label.setAttribute('pointer-events', 'none');
            label.setAttribute('opacity', String(Math.min(1, facing + 0.12)));
            label.textContent = mapRegionLabel(p.name);
            labelLayer.appendChild(label);
          }
        });
      }

      if (regionCount === 0 && entries.length) {
        entries.forEach(p => {
          const blobR = Math.max(16, R * 0.058);
          const patch = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          patch.setAttribute('d', organicBlobPath(p.pr.x, p.pr.y, blobR, p.id));
          patch.setAttribute('fill', parchmentWash(p.id));
          patch.setAttribute('stroke', '#1a4560');
          patch.setAttribute('stroke-width', '1.15');
          patch.setAttribute('class', 'globe-region globe-map-region');
          patch.setAttribute('data-id', p.id);
          patch.style.cursor = 'pointer';
          regionLayer.appendChild(patch);

          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', p.pr.x);
          label.setAttribute('y', p.pr.y + blobR + 10);
          label.setAttribute('text-anchor', 'middle');
          label.setAttribute('class', 'globe-region-label globe-map-label');
          label.setAttribute('pointer-events', 'none');
          label.textContent = mapRegionLabel(p.name);
          labelLayer.appendChild(label);
        });
      } else if (entries.length === 1) {
        const p = entries[0];
        const patch = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        patch.setAttribute('d', organicBlobPath(p.pr.x, p.pr.y, R * 0.22, p.id));
        patch.setAttribute('fill', parchmentWash(p.id));
        patch.setAttribute('stroke', '#1a4560');
        patch.setAttribute('stroke-width', '1.2');
        patch.setAttribute('class', 'globe-region globe-map-region');
        patch.setAttribute('data-id', p.id);
        patch.style.cursor = 'pointer';
        regionLayer.appendChild(patch);
      }

      const frameOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      frameOuter.setAttribute('cx', cx);
      frameOuter.setAttribute('cy', cy);
      frameOuter.setAttribute('r', R + 1);
      frameOuter.setAttribute('fill', 'none');
      frameOuter.setAttribute('stroke', 'rgba(110, 170, 220, 0.42)');
      frameOuter.setAttribute('stroke-width', '2.5');
      frameOuter.setAttribute('class', 'globe-map-frame');
      content.appendChild(frameOuter);

      const frameInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      frameInner.setAttribute('cx', cx);
      frameInner.setAttribute('cy', cy);
      frameInner.setAttribute('r', R - 5);
      frameInner.setAttribute('fill', 'none');
      frameInner.setAttribute('stroke', 'rgba(70, 120, 170, 0.22)');
      frameInner.setAttribute('stroke-width', '1');
      frameInner.setAttribute('class', 'globe-map-frame-inner');
      content.appendChild(frameInner);
      scene.appendChild(content);

      const prevScene = svg.querySelector('.globe-scene');
      svg.appendChild(scene);
      if (prevScene) prevScene.remove();
    }

    function drawHighway(g, x1, y1, x2, y2) {
      const off = 4;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * off;
      const ny = (dx / len) * off;
      for (const sign of [-1, 1]) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1 + nx * sign);
        line.setAttribute('y1', y1 + ny * sign);
        line.setAttribute('x2', x2 + nx * sign);
        line.setAttribute('y2', y2 + ny * sign);
        line.setAttribute('class', 'globe-highway-lane');
        g.appendChild(line);
      }
      const dash = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      dash.setAttribute('x1', x1);
      dash.setAttribute('y1', y1);
      dash.setAttribute('x2', x2);
      dash.setAttribute('y2', y2);
      dash.setAttribute('class', 'globe-highway-center');
      g.appendChild(dash);
    }

    function updateFruitRingTransform() {
      const ring = svg.querySelector('.globe-fruit-ring');
      if (!ring) return;
      placeFruitBlocks(ring, state.fruitRotation);
    }

    function renderTransportMap(principalityId) {
      clearSvg();
      state.phase = 'transport';
      state.selectedId = principalityId;
      const p = principalities.find(x => x.id === principalityId);
      if (!p || !getConnections) return;

      const conn = getConnections(principalityId);
      const { w, h } = size();
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

      const scene = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      scene.setAttribute('class', 'globe-scene');

      const back = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      back.setAttribute('width', w);
      back.setAttribute('height', h);
      back.setAttribute('fill', '#0a0b0f');
      back.setAttribute('class', 'globe-transport-bg');
      scene.appendChild(back);

      const content = createTransformGroup(w, h);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('x', w / 2);
      title.setAttribute('y', 32);
      title.setAttribute('text-anchor', 'middle');
      title.setAttribute('class', 'globe-title');
      title.textContent = p.name.replace(/^The Principality of\s+/i, '');
      content.appendChild(title);

      const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sub.setAttribute('x', w / 2);
      sub.setAttribute('y', 52);
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('class', 'globe-subtitle');
      sub.textContent = `${conn.topics.length} topic places · fruit metro · root line`;
      content.appendChild(sub);

      const margin = 20;
      const closeColumnW = 40;
      const closeGap = 10;
      const regionH = Math.min(h * 0.48, 300);
      const regionY = 58;
      const regionW = w - margin * 2 - closeColumnW - closeGap;
      const barX = margin + regionW + closeGap + 3;
      const principalityShort = p.name.replace(/^The Principality of\s+/i, '');

      drawTopicRegionMap(content, {
        x: margin,
        y: regionY,
        w: regionW,
        h: regionH,
      }, principalityShort, conn.topics, principalityId);

      const cx = w / 2;
      const maxMetroR = Math.min(w, h) * 0.24;
      const isSingleFruit = conn.fruits.length === 1;
      let metroBottom = regionY + regionH;

      if (isSingleFruit) {
        const sizing = singleFruitMetroRadius(conn.fruits[0], maxMetroR);
        const metroR = sizing.R;
        const bannerStack = 28 + 14;
        const cy = regionY + regionH + metroR + bannerStack + 28;
        state.fruitMetroCenter = { cx, cy, single: true };
        const usedR = drawSingleFruitMetro(
          content,
          cx,
          cy,
          maxMetroR,
          conn.fruits[0],
          () => `fruit-arc-${++clipSeq}`,
        );
        metroBottom = cy + usedR;
      } else {
        state.fruitMetroCenter = null;
        const fruitAreaY = regionY + regionH + 18;
        const fruitGridH = drawFruitGrid(content, {
          x: margin,
          y: fruitAreaY,
          w: w - margin * 2,
        }, conn.fruits);
        metroBottom = fruitAreaY + fruitGridH;
      }

      const staggerRows = conn.roots.length > 3;
      const rootLabelDepth = (staggerRows ? 2 : 1) * 22 + 20;
      let rootY = metroBottom + 48;
      const maxRootY = h - 40 - rootLabelDepth;
      if (rootY > maxRootY) {
        rootY = Math.max(metroBottom + 28, maxRootY);
      }

      const rootMargin = 28;
      const rootX0 = rootMargin;
      const rootX1 = w - rootMargin;
      const rootStationXs = layoutRootStationXs(conn.roots, rootX0, rootX1);
      const rootLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      rootLine.setAttribute('x1', rootX0);
      rootLine.setAttribute('y1', rootY);
      rootLine.setAttribute('x2', rootX1);
      rootLine.setAttribute('y2', rootY);
      rootLine.setAttribute('class', 'globe-root-line');
      content.appendChild(rootLine);

      for (const rx of [rootX0, rootX1]) {
        const cap = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cap.setAttribute('x', rx - 3);
        cap.setAttribute('y', rootY - 9);
        cap.setAttribute('width', 6);
        cap.setAttribute('height', 18);
        cap.setAttribute('rx', 1);
        cap.setAttribute('class', 'globe-root-terminus');
        content.appendChild(cap);
      }

      const rootLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      rootLabel.setAttribute('x', w / 2);
      rootLabel.setAttribute('y', rootY - 16);
      rootLabel.setAttribute('text-anchor', 'middle');
      rootLabel.setAttribute('class', 'globe-layer-label');
      rootLabel.textContent = 'Root metro line';
      content.appendChild(rootLabel);

      conn.roots.forEach((r, i) => {
        const rx = rootStationXs[i] ?? (rootX0 + rootX1) / 2;
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        dot.setAttribute('x', rx - 3);
        dot.setAttribute('y', rootY - 3);
        dot.setAttribute('width', 6);
        dot.setAttribute('height', 6);
        dot.setAttribute('class', 'globe-station root');
        dot.setAttribute('data-id', r.id);
        dot.style.cursor = 'pointer';
        content.appendChild(dot);

        const labelRow = staggerRows && i % 2 === 1 ? 1 : 0;
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', rx);
        label.setAttribute('y', rootY + 18 + labelRow * 14);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('class', 'globe-station-label globe-root-station-label');
        label.setAttribute('pointer-events', 'none');
        appendRootStationLabel(label, r.name, rx);
        content.appendChild(label);
      });

      scene.appendChild(content);

      function returnToGlobe() {
        state.rotation = state.fruitRotation;
        state.selectedId = null;
        state.panX = 0;
        state.panY = 0;
        renderGlobe();
        onBackgroundClick?.();
      }

      drawTransportClose(scene, barX, regionY, regionH, returnToGlobe);

      svg.appendChild(scene);
    }

    function render(selectedId) {
      state.selectedId = selectedId || null;
      if (selectedId && nodeTypeIsPrincipality(selectedId)) {
        renderTransportMap(selectedId);
        hint.textContent = 'Topic shire · scroll or slider to magnify · use Close beside the map to return to the globe.';
      } else {
        renderGlobe();
        hint.textContent = 'Drag to spin the chart · scroll or slider to magnify · tap a kingdom for routes.';
      }
    }

    function nodeTypeIsPrincipality(id) {
      return principalities.some(p => p.id === id);
    }

    function onPointerDown(e) {
      if (state.phase === 'transport') {
        const onBlocker = e.target.closest?.('.globe-station.root, .globe-topic-station, .globe-topic-node-hit, .globe-transport-close');
        const onMetro = e.target.closest?.('.globe-fruit-metro');
        if (onMetro && !onBlocker && state.magnification <= 1 && state.fruitMetroCenter && !state.fruitMetroCenter.single) {
          state.fruitSpinning = true;
          state.fruitSpinMoved = false;
          state.fruitDidSpin = false;
          state.fruitSpinLastX = e.clientX;
          host.setPointerCapture?.(e.pointerId);
          return;
        }
        if (state.magnification > 1) {
          if (e.target.closest?.('.globe-station, .globe-topic-station, .globe-topic-node-hit, .globe-transport-close')) return;
          state.panning = true;
          state.lastX = e.clientX;
          state.lastY = e.clientY;
          host.setPointerCapture?.(e.pointerId);
          return;
        }
        return;
      }
      if (state.phase !== 'globe') return;
      const region = e.target.closest?.('.globe-region');
      state.pendingRegionId = region ? region.getAttribute('data-id') : null;
      state.dragging = true;
      state.dragMoved = false;
      state.dragStartX = e.clientX;
      state.lastX = e.clientX;
      host.setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e) {
      if (state.fruitSpinning && state.phase === 'transport') {
        const dx = e.clientX - state.fruitSpinLastX;
        if (Math.abs(dx) > 3) state.fruitSpinMoved = true;
        state.fruitSpinLastX = e.clientX;
        state.fruitRotation += dx * 0.008;
        updateFruitRingTransform();
        return;
      }
      if (state.panning && state.phase === 'transport') {
        const scale = state.magnification || 1;
        state.panX += (e.clientX - state.lastX) / scale;
        state.panY += (e.clientY - state.lastY) / scale;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        const transformG = svg.querySelector('.globe-scene-transform');
        if (transformG) {
          const { w, h } = size();
          transformG.setAttribute('transform', sceneTransformAttr(w, h));
        }
        return;
      }
      if (!state.dragging || state.phase !== 'globe') return;
      const dx = e.clientX - state.lastX;
      if (!state.dragMoved && Math.abs(e.clientX - state.dragStartX) > 3) {
        state.dragMoved = true;
        state.pendingRegionId = null;
      }
      state.lastX = e.clientX;
      state.rotation += dx * 0.008;
      scheduleGlobeRender();
    }

    function onPointerUp(e) {
      if (state.fruitSpinning) {
        state.fruitSpinning = false;
        if (state.fruitSpinMoved) state.fruitDidSpin = true;
        if (e?.pointerId != null) host.releasePointerCapture?.(e.pointerId);
        return;
      }
      if (state.panning) {
        state.panning = false;
        if (e?.pointerId != null) host.releasePointerCapture?.(e.pointerId);
        return;
      }
      if (state.pendingRegionId && !state.dragMoved) {
        const id = state.pendingRegionId;
        state.pendingRegionId = null;
        onSelectPrincipality?.(id);
        return;
      }
      state.pendingRegionId = null;
      if (!state.dragging) return;
      state.dragging = false;
      if (e?.pointerId != null) host.releasePointerCapture?.(e.pointerId);
      if (spinFrame) {
        cancelAnimationFrame(spinFrame);
        spinFrame = null;
      }
    }

    function onWheel(e) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1 / 1.12 : 1.12;
      setMagnification(state.magnification * factor);
    }

    function onClick(e) {
      if (state.fruitDidSpin) {
        state.fruitDidSpin = false;
        return;
      }
      const fruitEl = e.target.closest?.('.globe-station.fruit');
      const fruitId = fruitEl?.getAttribute('data-id');
      if (fruitId) {
        onSelectNode?.(fruitId);
        return;
      }
      const rootEl = e.target.closest?.('.globe-station.root');
      const rootId = rootEl?.getAttribute('data-id');
      if (rootId) {
        onSelectNode?.(rootId);
        return;
      }
      const topicEl = e.target.closest?.('.globe-topic-station, .globe-topic-node-hit');
      const topicId = topicEl?.getAttribute('data-topic-id');
      if (topicId) {
        onSelectTopic?.(topicId);
        return;
      }
    }

    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('selectstart', e => e.preventDefault());
    host.addEventListener('dragstart', e => e.preventDefault());
    host.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    svg.addEventListener('click', onClick);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => render(state.selectedId), 120);
    });

    return {
      render,
      getMagnification,
      setMagnification,
      show() {
        host.classList.remove('hidden');
        host.setAttribute('aria-hidden', 'false');
        render(state.selectedId);
      },
      hide() {
        state.magnification = 1;
        state.panX = 0;
        state.panY = 0;
        host.classList.add('hidden');
        host.setAttribute('aria-hidden', 'true');
      },
      destroy() {
        if (spinFrame) cancelAnimationFrame(spinFrame);
        host.removeEventListener('pointerdown', onPointerDown);
        host.removeEventListener('wheel', onWheel);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        svg.removeEventListener('click', onClick);
      },
    };
  }

  window.GlobeView = { create };
})();
