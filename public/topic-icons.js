(() => {
  const NS = 'http://www.w3.org/2000/svg';

  function hash01(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return (Math.abs(h) % 10000) / 10000;
  }

  const TYPE_RULES = [
    { type: 'castle', re: /\b(castle|fortress|citadel|stronghold|battlement)\b/i },
    { type: 'tower', re: /\b(tower|watchtower|beacon|spire|belfry)\b/i },
    { type: 'windmill', re: /\b(windmill|mill)\b/i },
    { type: 'bridge', re: /\b(bridge|crossing|ford|passage)\b/i },
    { type: 'church', re: /\b(church|chapel|temple|sanctuary|shrine|altar)\b/i },
    { type: 'cave', re: /\b(cave|cavern|grotto|pit|abyss|depth)\b/i },
    { type: 'market', re: /\b(market|bazaar|trade|merchant|shop|store)\b/i },
    { type: 'well', re: /\b(well|spring|fountain|water)\b/i },
    { type: 'forest-grove', re: /\b(forest|grove|wood|tree|thicket|garden)\b/i },
    { type: 'cottage', re: /\b(cottage|house|home|dwelling|habitation|domicile)\b/i },
  ];

  function getTopicIconType(topic) {
    const name = String(topic?.name || '');
    for (const rule of TYPE_RULES) {
      if (rule.re.test(name)) return rule.type;
    }
    const types = ['cottage', 'tower', 'castle', 'windmill', 'well', 'market', 'church', 'cave', 'bridge', 'forest-grove'];
    return types[Math.floor(hash01(topic.id) * types.length)];
  }

  function iconVariant(topicId, type) {
    const counts = {
      castle: 3, tower: 3, cottage: 3, windmill: 2, bridge: 2, church: 2,
      'forest-grove': 2, cave: 2, market: 2, well: 2, generic: 2,
    };
    const n = counts[type] || 2;
    return Math.floor(hash01(`${topicId}-${type}`) * n);
  }

  function pathEl(d, cls) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', cls);
    p.setAttribute('pointer-events', 'none');
    return p;
  }

  function lineEl(x1, y1, x2, y2, cls) {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', x1);
    l.setAttribute('y1', y1);
    l.setAttribute('x2', x2);
    l.setAttribute('y2', y2);
    l.setAttribute('class', cls);
    l.setAttribute('pointer-events', 'none');
    return l;
  }

  const ICON_PATHS = {
    castle: [
      'M -5 4 L -5 -1 L -3 -1 L -3 -4 L -1 -4 L -1 -1 L 1 -1 L 1 -4 L 3 -4 L 3 -1 L 5 -1 L 5 4 Z M -2 1 L -2 3 M 0 1 L 0 3 M 2 1 L 2 3',
      'M -6 4 L -6 -2 L -4 -2 L -4 -5 L -2 -5 L -2 -2 L 2 -2 L 2 -5 L 4 -5 L 4 -2 L 6 -2 L 6 4 Z M -4 -2 L -4 0 M 4 -2 L 4 0',
      'M -4 4 L -4 0 L -2 0 L -2 -3 L 0 -5 L 2 -3 L 2 0 L 4 0 L 4 4 Z M -1 1 L 1 1 M -1 3 L 1 3',
    ],
    tower: [
      'M -2 4 L -2 -3 L 0 -5 L 2 -3 L 2 4 Z M -1 -1 L 1 -1 M -1 1 L 1 1 M 0 -5 L 0 -6',
      'M -3 4 L -3 -2 L -1 -2 L -1 -4 L 1 -4 L 1 -2 L 3 -2 L 3 4 Z M 0 -4 L 0 -5',
      'M -1.5 4 L -1.5 -4 L 1.5 -4 L 1.5 4 Z M -0.5 -2 L 0.5 -2 M -0.5 0 L 0.5 0 M 0 -4 L 0 -5.5 L -1.5 -4 M 0 -5.5 L 1.5 -4',
    ],
    cottage: [
      'M -4 3 L -4 0 L 0 -3 L 4 0 L 4 3 Z M -1 3 L -1 1 L 1 1 L 1 3',
      'M -5 3 L -5 0 L -2 -1 L 0 -4 L 2 -1 L 5 0 L 5 3 Z M -1 3 L -1 0.5 L 1 0.5 L 1 3',
      'M -3.5 3 L -3.5 0.5 L 0 -2.5 L 3.5 0.5 L 3.5 3 Z M -0.8 3 L -0.8 1.5 L 0.8 1.5 L 0.8 3',
    ],
    windmill: [
      'M -1 4 L -1 -1 L 1 -1 L 1 4 Z M 0 -1 L 0 -4 M 0 -4 L -3 -2 M 0 -4 L 3 -2 M 0 -4 L -2 1 M 0 -4 L 2 1',
      'M -1.5 4 L -1.5 0 L 1.5 0 L 1.5 4 Z M 0 0 L 0 -3.5 M 0 -3.5 L -2.5 -1 M 0 -3.5 L 2.5 -1 M 0 -3.5 L -1.5 2 M 0 -3.5 L 1.5 2',
    ],
    bridge: [
      'M -5 2 L -5 0 Q 0 -3 5 0 L 5 2 M -3 2 L -3 0.5 M 0 2 L 0 -0.5 M 3 2 L 3 0.5',
      'M -5 1.5 L -5 0.5 L -2 0 L 0 -2 L 2 0 L 5 0.5 L 5 1.5 M -4 1.5 L -4 0.8 M 4 1.5 L 4 0.8',
    ],
    church: [
      'M -3 4 L -3 0 L 3 0 L 3 4 Z M -0.5 0 L -0.5 -3 L 0.5 -3 L 0.5 0 M -1.5 -1.5 L 1.5 -1.5 M 0 -3 L 0 -5',
      'M -4 4 L -4 -1 L -1 -1 L -1 -3 L 1 -3 L 1 -1 L 4 -1 L 4 4 Z M 0 -3 L 0 -5 M -1 -4 L 1 -4',
    ],
    'forest-grove': [
      'M -4 3 L -3 -1 L -1 1 L 0 -3 L 1 1 L 3 -1 L 4 3 M -2 3 L -2 1 M 2 3 L 2 1',
      'M -3 3 L -2.5 -0.5 L -1 1 L 0 -2.5 L 1 1 L 2.5 -0.5 L 3 3 M 0 3 L 0 0.5',
    ],
    cave: [
      'M -4 3 Q -4 -1 0 -2 Q 4 -1 4 3 Z M -1 1 Q 0 -0.5 1 1',
      'M -3.5 3 Q -4 0 0 -1.5 Q 4 0 3.5 3 M -0.5 0.5 Q 0 -0.5 0.5 0.5',
    ],
    market: [
      'M -4 3 L -4 0 L 4 0 L 4 3 Z M -4 0 L 0 -2 L 4 0 M -2 3 L -2 1 M 0 3 L 0 1 M 2 3 L 2 1',
      'M -5 3 L -5 0.5 L -2 0.5 L 0 -1.5 L 2 0.5 L 5 0.5 L 5 3 Z M -3 3 L -3 1.5 M 1 3 L 1 1.5',
    ],
    well: [
      'M -2.5 3 L -2.5 0.5 Q 0 -0.5 2.5 0.5 L 2.5 3 Z M -1 3 L -1 1.5 M 1 3 L 1 1.5 M 0 0.5 L 0 -1.5',
      'M -3 3 L -3 1 Q 0 0 3 1 L 3 3 Z M 0 1 L 0 -2 M -1 -1.5 L 1 -1.5',
    ],
    generic: [
      'M -3.5 3 L -3.5 0.5 L 0 -2 L 3.5 0.5 L 3.5 3 Z',
      'M 0 -3.5 C -2 -1.5 -2.5 0.5 -1.5 3 L 1.5 3 C 2.5 0.5 2 -1.5 0 -3.5 M -1 0.5 L 1 0.5',
    ],
  };

  function drawTopicIcon(g, type, topicId) {
    const iconG = document.createElementNS(NS, 'g');
    iconG.setAttribute('class', 'globe-topic-icon');
    iconG.setAttribute('transform', 'scale(2.75)');
    const variant = iconVariant(topicId || 'x', type);
    const paths = ICON_PATHS[type] || ICON_PATHS.cottage;
    const d = paths[variant % paths.length];
    iconG.appendChild(pathEl(d, 'globe-topic-settlement-icon'));
    if (type === 'castle' && variant === 0) {
      iconG.appendChild(lineEl(-2, 1, -2, 3, 'globe-topic-icon-detail'));
      iconG.appendChild(lineEl(2, 1, 2, 3, 'globe-topic-icon-detail'));
    }
    g.appendChild(iconG);
    return iconG;
  }

  window.TopicIcons = {
    getTopicIconType,
    drawTopicIcon,
    hash01,
  };
})();
