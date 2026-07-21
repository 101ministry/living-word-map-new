(() => {
  const data = window.GRAPH_DATA;
  if (!data) {
    document.body.innerHTML = '<p style="padding:2rem;color:#fff">Graph data not loaded. Run scripts/build-data.ps1 first.</p>';
    return;
  }

  const { principalities, roots, fruits, topics, edges, stats } = data;
  const lib = window.PrayerLibrary;
  const colors = window.ColorScheme;

  document.getElementById('topic-count').textContent = stats.topicCount;
  document.getElementById('principality-count').textContent = stats.principalityCount;
  document.getElementById('root-count').textContent = stats.rootCount;
  document.getElementById('fruit-count').textContent = stats.fruitCount;

  const lookups = {
    principality: Object.fromEntries(principalities.map(p => [p.id, p])),
    root: Object.fromEntries(roots.map(r => [r.id, r])),
    fruit: Object.fromEntries(fruits.map(f => [f.id, f])),
    topic: Object.fromEntries(topics.map(t => [`topic-${t.id}`, t])),
  };
  const principalityIds = new Set(principalities.map(p => p.id));

  const state = {
    selectedId: null,
    quoteIndex: 0,
    viewMode: 'constellation',
    show: {
      principality: true,
      root: true,
      fruit: true,
      topic: false,
      topicRoot: true,
      topicFruit: true,
      topicPrincipality: true,
      aggregateLinks: true,
    },
    highlightIds: new Set(),
    compareIds: [],
    language: 'en',
  };

  const MAX_COMPARE = 3;
  const mobileMq = window.matchMedia('(max-width: 768px)');
  const icons = window.PrincipalityIcons;
  const compareDialog = document.getElementById('compare-dialog');

  const topicAudio = document.getElementById('topic-audio');
  const coreAudio = document.getElementById('core-audio');
  const coreDialog = document.getElementById('core-prayer-dialog');

  function isMobileLayout() {
    return mobileMq.matches;
  }

  function setDetailSheetOpen(open) {
    const panel = document.getElementById('detail-panel');
    const backdrop = document.getElementById('detail-backdrop');
    if (!panel) return;
    panel.classList.toggle('is-open', open);
    if (backdrop) {
      backdrop.hidden = !open;
      backdrop.classList.toggle('is-visible', open);
      backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (isMobileLayout()) {
      requestAnimationFrame(() => syncGraphSize?.());
      setTimeout(() => syncGraphSize?.(), 280);
    }
  }

  function openDetailSheet() {
    if (isMobileLayout()) setDetailSheetOpen(true);
  }

  function closeDetailSheet() {
    setDetailSheetOpen(false);
  }

  function setupDetailPanelWheelScroll() {
    const panel = document.getElementById('detail-panel');
    if (!panel) return;

    panel.addEventListener('wheel', (event) => {
      const maxScroll = panel.scrollHeight - panel.clientHeight;
      if (maxScroll <= 1) {
        window.scrollBy({ top: event.deltaY, left: 0 });
        event.preventDefault();
        return;
      }

      const atTop = panel.scrollTop <= 0;
      const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;
      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        window.scrollBy({ top: event.deltaY, left: 0 });
        event.preventDefault();
      }
    }, { passive: false });
  }

  function setControlsDrawerOpen(open) {
    const legend = document.getElementById('legend-panel');
    const backdrop = document.getElementById('legend-backdrop');
    const btn = document.getElementById('open-controls');
    legend?.classList.toggle('is-open', open);
    if (backdrop) {
      backdrop.hidden = !open;
      backdrop.classList.toggle('is-visible', open);
      backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    btn?.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function dismissDetailSelection() {
    if (state.viewMode === 'constellation' && state.selectedId) {
      closeConstellationDetail();
      return;
    }
    state.selectedId = null;
    showEmptyDetail();
    document.getElementById('graph-hint')?.classList.remove('hidden');
    refreshGraph();
    applyGraphView();
  }

  function updateGraphHintForLayout() {
    const hint = document.getElementById('graph-hint');
    if (!hint) return;
    hint.textContent = isMobileLayout()
      ? 'Tap a Principality to explore. Pinch to zoom; drag to pan.'
      : 'Click a Principality to reveal its character. Drag the map to pan; use the slider below to zoom.';
  }

  function initMobileUi() {
    updateGraphHintForLayout();
    setupDetailPanelWheelScroll();

    document.getElementById('open-controls')?.addEventListener('click', () => {
      const legend = document.getElementById('legend-panel');
      setControlsDrawerOpen(!legend?.classList.contains('is-open'));
    });

    document.getElementById('legend-backdrop')?.addEventListener('click', () => {
      setControlsDrawerOpen(false);
    });

    document.getElementById('close-detail')?.addEventListener('click', dismissDetailSelection);

    document.getElementById('detail-backdrop')?.addEventListener('click', dismissDetailSelection);
  }

  function t(key) {
    return lib.uiString(key);
  }

  function updateLanguageStatus() {
    const statusEl = document.getElementById('language-status');
    const meta = lib.languageMeta(state.language);
    if (!statusEl || !meta) return;

    statusEl.textContent = lib.isComplete(state.language)
      ? `${meta.native} — ${t('prayerLanguageReady')}`
      : `${meta.native} — ${t('mapLanguageNote')}`;
    statusEl.classList.toggle('is-fallback', !lib.isComplete(state.language));
  }

  async function refreshLanguageUi() {
    document.getElementById('language-label').textContent = t('prayerLanguageLabel');
    document.getElementById('open-core-prayer').textContent = t('openCorePrayer');
    document.getElementById('core-prayer-title').textContent = t('corePrayerTitle');

    const prayerHeading = document.querySelector('#detail-prayer-section h3');
    if (prayerHeading) prayerHeading.textContent = t('prayerTitle');

    const topicAudioLabel = document.getElementById('topic-audio-label');
    if (topicAudioLabel && !topicAudio.src) topicAudioLabel.textContent = t('listenPrayer');

    updateLanguageStatus();

    if (state.selectedId && nodeType(state.selectedId) === 'topic') {
      await renderTopicPrayer(lookups.topic[state.selectedId]);
    }

    if (coreDialog.open) {
      await refreshCorePrayerDialog();
    }
  }

  async function refreshCorePrayerDialog() {
    const prayer = await lib.getCorePrayer(state.language);
    document.getElementById('core-prayer-title').textContent = prayer?.title || t('corePrayerTitle');
    document.getElementById('core-prayer-instruction').textContent = prayer?.instruction || t('corePrayerHint');

    const fallbackEl = document.getElementById('core-prayer-fallback');
    const textEl = document.getElementById('core-prayer-text');

    if (!prayer) {
      fallbackEl.classList.add('hidden');
      textEl.textContent = t('noPrayer');
    } else {
      if (prayer.fallback) {
        fallbackEl.textContent = t('translationComingSoon');
        fallbackEl.classList.remove('hidden');
      } else {
        fallbackEl.classList.add('hidden');
      }
      textEl.textContent = prayer.text;
    }

    const audioPath = lib.coreAudioPath(prayer?.fallback ? 'en' : state.language);
    setupAudioPlayer(coreAudio, document.getElementById('core-audio-btn'),
      document.getElementById('core-audio-label'), document.getElementById('core-audio-status'), audioPath);
  }

  function setDocumentDirection(lang) {
    document.documentElement.dir = lib.isRtl(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }

  function setupAudioPlayer(audioEl, btnEl, labelEl, statusEl, src) {
    audioEl.pause();
    audioEl.onerror = null;
    audioEl.oncanplaythrough = null;
    btnEl.disabled = true;
    labelEl.textContent = t('listenPrayer');
    statusEl.textContent = t('audioComingSoon');
    statusEl.className = 'audio-status pending';
    btnEl.querySelector('.audio-icon').textContent = '▶';

    if (!src) return;

    audioEl.src = src;
    audioEl.onerror = () => {
      btnEl.disabled = true;
      statusEl.textContent = t('audioComingSoon');
      statusEl.className = 'audio-status pending';
    };
    audioEl.oncanplaythrough = () => {
      btnEl.disabled = false;
      statusEl.textContent = '';
      statusEl.className = 'audio-status';
    };
    audioEl.load();

    btnEl.onclick = () => {
      if (audioEl.paused) {
        audioEl.play();
        btnEl.querySelector('.audio-icon').textContent = '❚❚';
      } else {
        audioEl.pause();
        btnEl.querySelector('.audio-icon').textContent = '▶';
      }
    };

    audioEl.onended = () => {
      btnEl.querySelector('.audio-icon').textContent = '▶';
    };
  }

  async function renderTopicPrayer(topic) {
    const section = document.getElementById('detail-prayer-section');
    const noteEl = document.getElementById('prayer-note');
    const fallbackEl = document.getElementById('prayer-fallback');
    const textEl = document.getElementById('prayer-text');

    section.classList.remove('hidden');
    const prayer = await lib.getTopicPrayer(topic.number, state.language);

    if (!prayer) {
      noteEl.textContent = '';
      fallbackEl.classList.add('hidden');
      textEl.textContent = t('noPrayer');
      setupAudioPlayer(topicAudio, document.getElementById('topic-audio-btn'),
        document.getElementById('topic-audio-label'), document.getElementById('topic-audio-status'), '');
      return;
    }

    noteEl.textContent = prayer.note || t('spokenNote');
    if (prayer.fallback) {
      fallbackEl.textContent = t('translationComingSoon');
      fallbackEl.classList.remove('hidden');
    } else {
      fallbackEl.classList.add('hidden');
    }
    textEl.textContent = prayer.text;

    const audioPath = lib.audioPath(topic.number, prayer.fallback ? 'en' : state.language);
    setupAudioPlayer(topicAudio, document.getElementById('topic-audio-btn'),
      document.getElementById('topic-audio-label'), document.getElementById('topic-audio-status'), audioPath);
  }

  async function openCorePrayer() {
    await refreshCorePrayerDialog();
    coreDialog.showModal();
  }

  function languageOptionLabel(lang) {
    if (!lang?.name) return lang?.native || lang?.code || '';
    if (!lang.native || lang.name === lang.native) return lang.name;
    return `${lang.name} / ${lang.native}`;
  }

  async function initLanguageSelector() {
    const catalog = await lib.init();
    state.language = lib.currentLang;
    setDocumentDirection(state.language);

    const select = document.getElementById('language-select');
    select.innerHTML = catalog.languages.map(lang => {
      const status = lang.complete ? '' : ' ◦';
      return `<option value="${lang.code}">${languageOptionLabel(lang)}${status}</option>`;
    }).join('');
    select.value = state.language;

    select.addEventListener('change', async e => {
      state.language = e.target.value;
      lib.setLanguage(state.language);
      setDocumentDirection(state.language);
      try {
        await lib.loadLanguage(state.language);
      } catch (err) {
        console.warn(err);
      }
      await refreshLanguageUi();
    });

    await refreshLanguageUi();
  }

  document.getElementById('open-core-prayer').addEventListener('click', openCorePrayer);

  function topicPrincipalityIds(topic) {
    if (topic?.principalityIds?.length) return topic.principalityIds;
    if (topic?.principalityId) return [topic.principalityId];
    return [];
  }

  function topicRootIds(topic) {
    if (topic?.rootIds?.length) return topic.rootIds;
    if (topic?.rootId) return [topic.rootId];
    return [];
  }

  function topicFruitIds(topic) {
    if (topic?.fruitIds?.length) return topic.fruitIds;
    if (topic?.fruitId) return [topic.fruitId];
    return [];
  }

  function topicMatchesRoot(topic, id) {
    return topicRootIds(topic).includes(id);
  }

  function topicMatchesFruit(topic, id) {
    return topicFruitIds(topic).includes(id);
  }

  function topicMatchesNode(topic, id) {
    return topicHasPrincipality(topic, id)
      || topicMatchesRoot(topic, id)
      || topicMatchesFruit(topic, id)
      || `topic-${topic.id}` === id;
  }

  function uniqueLookupItems(ids, lookup) {
    return [...new Set(ids)].map(id => lookup[id]).filter(Boolean);
  }

  function topicHasPrincipality(topic, id) {
    return topicPrincipalityIds(topic).includes(id);
  }

  function getTopicPrincipalities(topic) {
    return topicPrincipalityIds(topic).map(pid => lookups.principality[pid]).filter(Boolean);
  }

  function nodeType(idOrNode) {
    if (typeof idOrNode === 'object' && idOrNode != null && idOrNode.type) {
      return idOrNode.type;
    }
    const id = typeof idOrNode === 'object' && idOrNode != null ? idOrNode.id : idOrNode;
    if (id.startsWith('topic-')) return 'topic';
    if (lookups.principality[id]) return 'principality';
    if (lookups.root[id]) return 'root';
    if (lookups.fruit[id]) return 'fruit';
    return 'unknown';
  }

  function nodeLabel(id) {
    const type = nodeType(id);
    const item = lookups[type]?.[id];
    if (!item) return id;
    if (type === 'topic') return `#${item.number} ${item.name}`;
    if (type === 'principality' && icons) return icons.label(id, item.name);
    return item.name;
  }

  function nodeColorResolved(id, dimmed = false) {
    const { fill } = colors.colorForNode(id, lookups);
    if (dimmed) {
      if (fill.startsWith('rgba')) return fill.replace(/[\d.]+\)$/, '0.15)');
      return colors.withAlpha(fill, 0.15);
    }
    return fill;
  }

  function nodeSize(id) {
    const type = nodeType(id);
    const sizes = { principality: 18, root: 10, fruit: 10, topic: 3 };
    return sizes[type] || 5;
  }

  function hashId(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function graphExtent() {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    return Math.min(w, h);
  }

  function seedNightSkyLayout(nodes) {
    const extent = graphExtent();
    const principalityRing = extent * 0.48;
    const rootRing = extent * 0.30;
    const fruitRing = extent * 0.16;
    const pinPrincipalities = !state.selectedId;

    const pNodes = nodes.filter(n => n.type === 'principality');
    const rNodes = nodes.filter(n => n.type === 'root');
    const fNodes = nodes.filter(n => n.type === 'fruit');

    pNodes.forEach((node, i) => {
      const angle = (i / Math.max(pNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const jitter = ((hashId(node.id) % 1000) / 1000 - 0.5) * 0.22;
      const radius = principalityRing * (0.88 + jitter);
      node.x = Math.cos(angle + jitter * 0.35) * radius;
      node.y = Math.sin(angle + jitter * 0.35) * radius;
      if (pinPrincipalities) {
        node.fx = node.x;
        node.fy = node.y;
      } else {
        node.fx = null;
        node.fy = null;
      }
    });

    rNodes.forEach((node, i) => {
      const angle = (i / Math.max(rNodes.length, 1)) * Math.PI * 2;
      const jitter = ((hashId(node.id) % 1000) / 1000 - 0.5) * 0.35;
      const radius = rootRing * (0.9 + jitter);
      node.x = Math.cos(angle + jitter) * radius;
      node.y = Math.sin(angle + jitter) * radius;
      node.fx = null;
      node.fy = null;
    });

    fNodes.forEach((node, i) => {
      const angle = (i / Math.max(fNodes.length, 1)) * Math.PI * 2 + Math.PI / 7;
      const jitter = ((hashId(node.id) % 1000) / 1000 - 0.5) * 0.4;
      const radius = fruitRing * (0.85 + jitter);
      node.x = Math.cos(angle + jitter) * radius;
      node.y = Math.sin(angle + jitter) * radius;
      node.fx = null;
      node.fy = null;
    });
  }

  function seedExploreLayout(nodes) {
    const extent = graphExtent();
    const principalityRing = extent * 0.34;
    const rootRing = extent * 0.2;
    const fruitRing = extent * 0.11;

    const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
    const pNodes = nodes.filter(n => n.type === 'principality');
    const rNodes = nodes.filter(n => n.type === 'root');
    const fNodes = nodes.filter(n => n.type === 'fruit');

    pNodes.forEach((node, i) => {
      const angle = (i / Math.max(pNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const jitter = ((hashId(node.id) % 1000) / 1000 - 0.5) * 0.18;
      const radius = principalityRing * (0.92 + jitter);
      node.x = Math.cos(angle + jitter * 0.3) * radius;
      node.y = Math.sin(angle + jitter * 0.3) * radius;
      node.fx = null;
      node.fy = null;
    });

    rNodes.forEach((node, i) => {
      const angle = (i / Math.max(rNodes.length, 1)) * Math.PI * 2;
      const jitter = ((hashId(node.id) % 1000) / 1000 - 0.5) * 0.3;
      const radius = rootRing * (0.9 + jitter);
      node.x = Math.cos(angle + jitter) * radius;
      node.y = Math.sin(angle + jitter) * radius;
    });

    fNodes.forEach((node, i) => {
      const angle = (i / Math.max(fNodes.length, 1)) * Math.PI * 2 + Math.PI / 8;
      const jitter = ((hashId(node.id) % 1000) / 1000 - 0.5) * 0.32;
      const radius = fruitRing * (0.88 + jitter);
      node.x = Math.cos(angle + jitter) * radius;
      node.y = Math.sin(angle + jitter) * radius;
    });

    nodes.filter(n => n.type === 'topic').forEach(node => {
      const topic = lookups.topic[node.id];
      if (!topic) return;

      let anchor = null;
      for (const pid of topicPrincipalityIds(topic)) {
        if (nodeById[pid]?.x != null) {
          anchor = nodeById[pid];
          break;
        }
      }
      if (!anchor) {
        for (const rid of topicRootIds(topic)) {
          if (nodeById[rid]?.x != null) { anchor = nodeById[rid]; break; }
        }
      }
      if (!anchor) {
        for (const fid of topicFruitIds(topic)) {
          if (nodeById[fid]?.x != null) { anchor = nodeById[fid]; break; }
        }
      }

      const seed = hashId(node.id);
      const angle = (seed % 360) * (Math.PI / 180);
      const dist = 12 + (seed % 28);
      if (anchor) {
        node.x = anchor.x + Math.cos(angle) * dist;
        node.y = anchor.y + Math.sin(angle) * dist;
      } else {
        node.x = Math.cos(angle) * principalityRing * 0.55;
        node.y = Math.sin(angle) * principalityRing * 0.55;
      }
    });
  }

  function configureGraphSimulation() {
    const isConstellation = state.viewMode === 'constellation';
    Graph.d3AlphaDecay(isConstellation ? 0.018 : 0.042);
    Graph.d3VelocityDecay(isConstellation ? 0.35 : 0.52);
    Graph.warmupTicks(isConstellation ? 120 : 36);
    Graph.cooldownTicks(isConstellation ? 280 : 120);
  }

  function configureGraphForces() {
    const isConstellation = state.viewMode === 'constellation';
    const hasSelection = Boolean(state.selectedId);

    Graph.d3Force('charge', d3.forceManyBody()
      .strength(node => {
        const type = nodeType(node);
        if (isConstellation) {
          if (type === 'principality') return -900;
          if (type === 'topic') return -40;
          return -420;
        }
        if (type === 'principality') return -48;
        if (type === 'topic') return -6;
        return -32;
      })
      .distanceMax(isConstellation ? 3200 : 240));

    const linkForce = Graph.d3Force('link');
    if (linkForce) {
      linkForce
        .distance(link => {
          if (isConstellation) {
            if (link.type === 'belongs_to') return 90;
            if (link.type === 'has_root' || link.type === 'has_fruit') return 70;
            if (link.type === 'root_principality' || link.type === 'fruit_principality') {
              return hasSelection ? 160 : 240;
            }
            if (link.type === 'root_fruit') return 150;
            return 180;
          }
          if (link.type === 'belongs_to') return 20;
          if (link.type === 'has_root' || link.type === 'has_fruit') return 16;
          if (link.type === 'root_principality' || link.type === 'fruit_principality') return 52;
          if (link.type === 'root_fruit') return 38;
          return 44;
        })
        .strength(link => {
          if (isConstellation) {
            if (link.type === 'root_principality' || link.type === 'fruit_principality') return 0.08;
            if (link.type === 'root_fruit') return 0.05;
            return 0.12;
          }
          if (link.type === 'belongs_to') return 0.82;
          if (link.type === 'has_root' || link.type === 'has_fruit') return 0.72;
          if (link.type === 'root_principality' || link.type === 'fruit_principality') return 0.18;
          if (link.type === 'root_fruit') return 0.14;
          return 0.22;
        });
    }

    Graph.d3Force('center', d3.forceCenter(0, 0).strength(isConstellation ? 0 : 0.14));

    Graph.d3Force('collision', d3.forceCollide()
      .radius(node => {
        const id = asNodeId(node);
        if (isConstellation) {
          const pad = nodeType(id) === 'principality' ? 16 : (nodeType(id) === 'topic' ? 2 : 8);
          return nodeRadius(id) + pad;
        }
        const pad = nodeType(id) === 'principality' ? 10 : (nodeType(id) === 'topic' ? 1.5 : 5);
        return nodeRadius(id) + pad;
      })
      .strength(isConstellation ? 0.95 : 0.45)
      .iterations(isConstellation ? 4 : 1));
  }

  function graphPointerCoords(clientX, clientY) {
    const canvas = container.querySelector('canvas');
    const rect = (canvas || container).getBoundingClientRect();
    return Graph.screen2GraphCoords(clientX - rect.left, clientY - rect.top);
  }

  function pickPrincipalityAtScreen(clientX, clientY) {
    const coords = graphPointerCoords(clientX, clientY);
    if (!coords) return null;

    const { nodes } = Graph.graphData();
    let best = null;
    let bestDist = Infinity;

    for (const node of nodes) {
      const id = asNodeId(node);
      if (nodeType(id) !== 'principality' || node.x == null || node.y == null) continue;
      const half = nodeRadius(id) * 1.08;
      const dx = coords.x - node.x;
      const dy = coords.y - node.y;
      if (Math.abs(dx) <= half && Math.abs(dy) <= half) {
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          best = node;
        }
      }
    }
    return best;
  }

  function buildVisibleGraph() {
    const principalityNodes = [];
    const rootNodes = [];
    const fruitNodes = [];
    const topicNodes = [];
    const links = [];
    const nodeIds = new Set();

    if (state.show.principality) {
      principalities.forEach(p => {
        principalityNodes.push({ id: p.id, type: 'principality' });
        nodeIds.add(p.id);
      });
    }
    if (state.show.root) {
      roots.forEach(r => {
        if (principalityIds.has(r.id)) return;
        rootNodes.push({ id: r.id, type: 'root' });
        nodeIds.add(r.id);
      });
    }
    if (state.show.fruit) {
      fruits.forEach(f => {
        if (principalityIds.has(f.id)) return;
        fruitNodes.push({ id: f.id, type: 'fruit' });
        nodeIds.add(f.id);
      });
    }

    const topicLimit = state.viewMode === 'constellation' ? 0 : (state.show.topic ? topics.length : 0);
    const visibleTopics = state.selectedId && state.viewMode === 'constellation'
      ? topics.filter(t => topicMatchesNode(t, state.selectedId))
      : topics.slice(0, topicLimit);

    if (state.selectedId && state.viewMode === 'constellation') {
      visibleTopics.forEach(t => {
        const tid = `topic-${t.id}`;
        topicNodes.push({ id: tid, type: 'topic' });
        nodeIds.add(tid);
      });
    } else if (state.show.topic) {
      visibleTopics.forEach(t => {
        const tid = `topic-${t.id}`;
        topicNodes.push({ id: tid, type: 'topic' });
        nodeIds.add(tid);
      });
    }

    const showTopicLinks = state.show.topic || (state.selectedId && state.viewMode === 'constellation');
    const allowedLinkTypes = new Set();
    if (state.show.aggregateLinks) {
      allowedLinkTypes.add('root_principality');
      allowedLinkTypes.add('fruit_principality');
      allowedLinkTypes.add('root_fruit');
    }
    if (showTopicLinks) {
      if (state.show.topicRoot) allowedLinkTypes.add('has_root');
      if (state.show.topicFruit) allowedLinkTypes.add('has_fruit');
      if (state.show.topicPrincipality) allowedLinkTypes.add('belongs_to');
    }

    edges.forEach(e => {
      if (!allowedLinkTypes.has(e.type)) return;
      if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
        links.push({ source: e.source, target: e.target, type: e.type });
      }
    });

    if (state.selectedId && state.viewMode === 'constellation' && nodeIds.has(state.selectedId)) {
      const related = new Set([state.selectedId]);
      links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (s === state.selectedId) related.add(t);
        if (t === state.selectedId) related.add(s);
      });
      state.highlightIds = related;
    } else {
      state.highlightIds = new Set();
    }

    // Principalities last so they sit on top for click/hover (entry points on the map).
    const nodes = [...rootNodes, ...fruitNodes, ...topicNodes, ...principalityNodes];
    return { nodes, links };
  }

  const container = document.getElementById('graph');
  if (typeof ForceGraph !== 'function') {
    container.innerHTML = '<p style="padding:2rem;color:#8a8798;text-align:center;line-height:1.6">Graph could not load. Try refreshing the page, or open via <strong>open.bat</strong> in the project folder.</p>';
    initLanguageSelector().catch(err => console.error('Language catalog failed to load:', err));
    return;
  }

  function asNodeId(nodeOrId) {
    return typeof nodeOrId === 'object' && nodeOrId != null ? nodeOrId.id : nodeOrId;
  }

  function nodeFillColor(id) {
    if (state.highlightIds.size && !state.highlightIds.has(id)) return nodeColorResolved(id, true);
    if (state.selectedId === id) return '#f0ead6';
    return nodeColorResolved(id);
  }

  function nodeRadius(id) {
    const type = nodeType(id);
    const rel = type === 'principality' ? 4.8 : (type === 'topic' ? 3 : 4);
    return Math.sqrt(nodeSize(id)) * rel;
  }

  function paintPrincipalityNode(node, ctx, globalScale) {
    if (node.x == null || node.y == null) return;
    const id = asNodeId(node);
    const item = lookups.principality[id];
    const half = nodeRadius(id);
    const size = half * 2;
    const dimmed = state.highlightIds.size && !state.highlightIds.has(id) && !state.compareIds.includes(id);

    if (icons) {
      icons.draw(ctx, id, item?.name || id, node.x, node.y, size, {
        selected: state.selectedId === id,
        compare: state.compareIds.includes(id),
        dimmed,
      });
      return;
    }

    const fill = nodeFillColor(id);
    const x = node.x - half;
    const y = node.y - half;

    ctx.fillStyle = fill;
    ctx.fillRect(x, y, size, size);

    const stroke = colors.isLightColor(fill) ? 'rgba(20, 22, 30, 0.85)' : 'rgba(255, 255, 255, 0.22)';
    ctx.strokeStyle = state.selectedId === id ? '#f0ead6' : stroke;
    ctx.lineWidth = Math.max(1, 1.4 / globalScale);
    ctx.strokeRect(x, y, size, size);
  }

  const Graph = ForceGraph()(container)
    .backgroundColor('#0a0b0f')
    .nodeId('id')
    .nodeLabel(node => {
      const id = asNodeId(node);
      if (nodeType(id) === 'principality') return '';
      return nodeLabel(id);
    })
    .nodeVal(node => nodeSize(asNodeId(node)))
    .nodeRelSize(4)
    .showPointerCursor(false)
    .nodeCanvasObjectMode(node => (nodeType(node) === 'principality' ? 'after' : undefined))
    .nodeCanvasObject((node, ctx, globalScale) => {
      if (nodeType(node) === 'principality') {
        paintPrincipalityNode(node, ctx, globalScale);
      }
    })
    .nodePointerAreaPaint((node, color, ctx) => {
      if (node.x == null || node.y == null) return;
      const id = asNodeId(node);
      ctx.fillStyle = color;
      if (nodeType(id) === 'principality') {
        const half = nodeRadius(id);
        ctx.fillRect(node.x - half, node.y - half, half * 2, half * 2);
        return;
      }
      const r = Math.sqrt(nodeSize(id)) * 4;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fill();
    })
    .nodeColor(node => {
      const id = asNodeId(node);
      if (nodeType(id) === 'principality') return 'rgba(0,0,0,0.001)';
      return nodeFillColor(id);
    })
    .linkColor(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      if (state.highlightIds.size && !(state.highlightIds.has(s) && state.highlightIds.has(t))) {
        return 'rgba(255,255,255,0.03)';
      }
      if (l.type) {
        const targetId = t.startsWith('topic-') ? s : t;
        return colors.linkColor(l.type, targetId, lookups);
      }
      return 'rgba(255,255,255,0.12)';
    })
    .linkWidth(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      if (state.highlightIds.has(s) && state.highlightIds.has(t)) return 1.5;
      if (l.type === 'has_root' || l.type === 'has_fruit' || l.type === 'belongs_to') return 0.65;
      return 0.5;
    })
    .linkDirectionalParticles(0)
    .d3AlphaDecay(0.018)
    .d3VelocityDecay(0.35)
    .warmupTicks(120)
    .cooldownTicks(280)
    .enableZoomInteraction(isMobileLayout())
    .enablePanInteraction(true)
    .enablePointerInteraction(true)
    .onNodeHover(node => {
      container.style.cursor = node ? 'pointer' : 'grab';
    })
    .onNodeClick((node, event) => {
      const id = asNodeId(node);
      if (nodeType(id) === 'principality' && (event?.ctrlKey || event?.metaKey)) {
        toggleCompareId(id);
        return;
      }
      selectNode(id);
    })
    .onBackgroundClick(() => {
      if (state.viewMode === 'constellation' && state.selectedId) {
        closeConstellationDetail();
      }
    })
    .onZoom(() => syncZoomSlider());

  window.__principalityIconRefresh = () => Graph.refresh();

  principalities.forEach(p => icons?.ensure(p.id, p.name));

  const ZOOM_MS = 450;
  const VIEW_SETTLE_MS = 320;
  const ZOOM_MIN = 0.08;
  const ZOOM_MAX = 14;

  const zoomSlider = document.getElementById('graph-zoom');
  const zoomLabel = document.getElementById('graph-zoom-label');
  let sliderDrivingZoom = false;

  function sliderToZoom(sliderVal) {
    const t = Math.max(0, Math.min(100, sliderVal)) / 100;
    return ZOOM_MIN * Math.pow(ZOOM_MAX / ZOOM_MIN, t);
  }

  function zoomToSlider(zoom) {
    const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
    return 100 * Math.log(z / ZOOM_MIN) / Math.log(ZOOM_MAX / ZOOM_MIN);
  }

  function updateZoomLabel(zoom) {
    if (zoomLabel) zoomLabel.textContent = `${zoom.toFixed(2)}×`;
  }

  function syncZoomSlider(zoom = Graph.zoom()) {
    if (!zoomSlider || sliderDrivingZoom) return;
    const k = typeof zoom === 'number' ? zoom : Graph.zoom();
    zoomSlider.value = String(Math.round(zoomToSlider(k)));
    updateZoomLabel(k);
  }

  function setGraphZoom(zoom, duration = 0) {
    Graph.zoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)), duration);
    if (duration <= 0) syncZoomSlider();
    else setTimeout(() => syncZoomSlider(), duration + 40);
  }

  function nudgeGraphZoom(direction) {
    const current = Graph.zoom();
    const step = direction > 0 ? 1.18 : 1 / 1.18;
    setGraphZoom(current * step, 120);
  }

  function bindZoomSlider() {
    if (!zoomSlider) return;

    zoomSlider.addEventListener('input', () => {
      sliderDrivingZoom = true;
      setGraphZoom(sliderToZoom(Number(zoomSlider.value)), 0);
      sliderDrivingZoom = false;
    });

    document.getElementById('graph-zoom-in')?.addEventListener('click', () => nudgeGraphZoom(1));
    document.getElementById('graph-zoom-out')?.addEventListener('click', () => nudgeGraphZoom(-1));
  }

  function fitNodesToView(nodeFilter, padding, duration = ZOOM_MS) {
    if (!syncGraphSize()) return;
    if (typeof nodeFilter === 'function') {
      Graph.zoomToFit(duration, padding, nodeFilter);
    } else {
      Graph.zoomToFit(duration, padding);
    }
    setTimeout(() => syncZoomSlider(), duration > 0 ? duration + 40 : 0);
  }

  function fitConstellationRing(duration = ZOOM_MS) {
    fitNodesToView(node => nodeType(node) === 'principality', 42, duration);
  }

  function fitConstellationFull(duration = ZOOM_MS) {
    fitNodesToView(null, 76, duration);
  }

  function fitConstellationSelection(duration = ZOOM_MS) {
    if (state.highlightIds.size > 0) {
      fitNodesToView(node => state.highlightIds.has(asNodeId(node)), 56, duration);
    } else {
      fitConstellationRing(duration);
    }
  }

  function fitExploreOverview(duration = ZOOM_MS) {
    fitNodesToView(node => nodeType(node) !== 'topic', 68, duration);
  }

  function applyGraphView(duration = ZOOM_MS, delay = VIEW_SETTLE_MS) {
    const run = () => {
      if (state.viewMode === 'constellation') {
        if (state.selectedId) fitConstellationSelection(duration);
        else fitConstellationRing(duration);
      } else {
        fitExploreOverview(duration);
      }
    };
    if (delay > 0) setTimeout(run, delay);
    else run();
  }

  function closeConstellationDetail() {
    state.selectedId = null;
    showEmptyDetail();
    document.getElementById('graph-hint').classList.remove('hidden');
    refreshGraph();
    setTimeout(() => {
      fitConstellationFull(ZOOM_MS);
      setTimeout(() => fitConstellationRing(ZOOM_MS), ZOOM_MS + 80);
    }, VIEW_SETTLE_MS);
  }

  function syncGraphSize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      Graph.width(w).height(h);
      return true;
    }
    return false;
  }

  function refreshGraph() {
    syncGraphSize();
    const { nodes, links } = buildVisibleGraph();
    if (state.viewMode === 'constellation') {
      seedNightSkyLayout(nodes);
    } else if (state.show.topic) {
      seedExploreLayout(nodes);
    }
    Graph.graphData({ nodes, links });
    configureGraphSimulation();
    configureGraphForces();
  }

  container.addEventListener('mousemove', ev => {
    if (!(ev.target instanceof HTMLCanvasElement)) return;
    const tooltip = document.getElementById('graph-tooltip');
    const hit = pickPrincipalityAtScreen(ev.clientX, ev.clientY);
    if (hit) {
      container.style.cursor = 'pointer';
      const id = asNodeId(hit);
      const p = lookups.principality[id];
      if (tooltip && p) {
        const code = icons?.abbrev(id, p.name) || '';
        tooltip.innerHTML = `<span class="graph-tooltip-code">${code}</span>${p.name}`;
        tooltip.classList.remove('hidden');
        tooltip.setAttribute('aria-hidden', 'false');
        const offset = 14;
        tooltip.style.left = `${Math.min(ev.clientX + offset, window.innerWidth - tooltip.offsetWidth - 8)}px`;
        tooltip.style.top = `${Math.max(ev.clientY + offset, 8)}px`;
      }
      return;
    }
    if (tooltip) {
      tooltip.classList.add('hidden');
      tooltip.setAttribute('aria-hidden', 'true');
    }
    container.style.cursor = 'grab';
  });

  container.addEventListener('mouseleave', () => {
    const tooltip = document.getElementById('graph-tooltip');
    if (tooltip) {
      tooltip.classList.add('hidden');
      tooltip.setAttribute('aria-hidden', 'true');
    }
  });

  container.addEventListener('click', ev => {
    if (!(ev.target instanceof HTMLCanvasElement)) return;
    const principality = pickPrincipalityAtScreen(ev.clientX, ev.clientY);
    if (principality) {
      ev.stopPropagation();
      const id = asNodeId(principality);
      if (ev.ctrlKey || ev.metaKey) {
        toggleCompareId(id);
        return;
      }
      selectNode(id);
    }
  }, true);

  function getConnections(id) {
    const type = nodeType(id);
    const result = { principalities: [], roots: [], fruits: [], topics: [] };

    if (type === 'principality') {
      const pTopics = topics.filter(t => topicHasPrincipality(t, id));
      result.topics = pTopics;
      result.roots = uniqueLookupItems(pTopics.flatMap(t => topicRootIds(t)), lookups.root);
      result.fruits = uniqueLookupItems(pTopics.flatMap(t => topicFruitIds(t)), lookups.fruit);
    } else if (type === 'root') {
      const rTopics = topics.filter(t => topicMatchesRoot(t, id));
      result.topics = rTopics;
      result.principalities = uniqueLookupItems(rTopics.flatMap(t => topicPrincipalityIds(t)), lookups.principality);
      result.fruits = uniqueLookupItems(rTopics.flatMap(t => topicFruitIds(t)), lookups.fruit);
    } else if (type === 'fruit') {
      const fTopics = topics.filter(t => topicMatchesFruit(t, id));
      result.topics = fTopics;
      result.principalities = uniqueLookupItems(fTopics.flatMap(t => topicPrincipalityIds(t)), lookups.principality);
      result.roots = uniqueLookupItems(fTopics.flatMap(t => topicRootIds(t)), lookups.root);
    } else if (type === 'topic') {
      const t = lookups.topic[id];
      result.principalities = getTopicPrincipalities(t);
      result.roots = topicRootIds(t).map(rid => lookups.root[rid]).filter(Boolean);
      result.fruits = topicFruitIds(t).map(fid => lookups.fruit[fid]).filter(Boolean);
      result.topics = [t];
    }
    return result;
  }

  function renderChips(items, type) {
    if (!items.length) return '';
    const label = type.charAt(0).toUpperCase() + type.slice(1) + (items.length > 1 && type !== 'topics' ? 's' : '');
    return `<div class="connection-group"><h4>${label}</h4><div class="connection-chips">${items.map(item => {
      const nodeId = type === 'topic' ? `topic-${item.id}` : item.id;
      const style = colors.chipStyle(type, nodeId, lookups);
      const styleAttr = style.borderColor
        ? ` style="border-color:${style.borderColor};color:${style.color || 'inherit'}"`
        : '';
      return `<button type="button" class="chip ${type.replace(/s$/, '')}" data-node="${nodeId}"${styleAttr}>${type === 'topic' ? `#${item.number} ${item.name}` : item.name}</button>`;
    }).join('')}</div></div>`;
  }

  function showEmptyDetail() {
    document.getElementById('detail-empty').classList.remove('hidden');
    document.getElementById('detail-content').classList.add('hidden');
    document.getElementById('detail-prayer-section').classList.add('hidden');
    topicAudio.pause();
    closeDetailSheet();
  }

  function compareSet() {
    return new Set(state.compareIds);
  }

  function toggleCompareId(id) {
    if (!lookups.principality[id]) return;
    const idx = state.compareIds.indexOf(id);
    if (idx >= 0) {
      state.compareIds.splice(idx, 1);
    } else if (state.compareIds.length < MAX_COMPARE) {
      state.compareIds.push(id);
    }
    renderComparePanel();
    Graph.refresh();
  }

  function clearCompare() {
    if (!state.compareIds.length) return;
    state.compareIds = [];
    renderComparePanel();
    Graph.refresh();
  }

  function renderComparePanel() {
    const slotsEl = document.getElementById('compare-slots');
    const pickerEl = document.getElementById('compare-picker');
    const openBtn = document.getElementById('open-compare');
    if (!slotsEl || !pickerEl) return;

    const selected = compareSet();
    const atMax = state.compareIds.length >= MAX_COMPARE;

    slotsEl.innerHTML = state.compareIds.map(id => {
      const p = lookups.principality[id];
      const src = icons?.thumbSrc(id, p.name) || '';
      return `<div class="compare-slot">
        <img src="${src}" alt="" width="28" height="28" />
        <span>${p.name}</span>
        <button type="button" class="compare-slot-remove" data-compare-remove="${id}" aria-label="Remove ${p.name}">×</button>
      </div>`;
    }).join('');

    slotsEl.querySelectorAll('[data-compare-remove]').forEach(btn => {
      btn.addEventListener('click', () => toggleCompareId(btn.dataset.compareRemove));
    });

    const sorted = [...principalities].sort((a, b) => a.name.localeCompare(b.name));
    pickerEl.innerHTML = sorted.map(p => {
      const checked = selected.has(p.id);
      const disabled = !checked && atMax;
      return `<li><label>
        <input type="checkbox" data-compare-id="${p.id}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} />
        <span>${p.name}</span>
      </label></li>`;
    }).join('');

    pickerEl.querySelectorAll('input[data-compare-id]').forEach(input => {
      input.addEventListener('change', () => {
        const id = input.dataset.compareId;
        if (input.checked && state.compareIds.length < MAX_COMPARE && !state.compareIds.includes(id)) {
          state.compareIds.push(id);
        } else if (!input.checked) {
          state.compareIds = state.compareIds.filter(x => x !== id);
        }
        renderComparePanel();
        Graph.refresh();
      });
    });

    if (openBtn) {
      openBtn.disabled = state.compareIds.length < 2;
    }
  }

  function themeOverlap(ids) {
    const lists = ids.map(id => (lookups.principality[id]?.themes || []).map(t => t.toLowerCase()));
    const counts = new Map();
    lists.flat().forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
    return counts;
  }

  function manifestationOverlap(ids) {
    const lists = ids.map(id => (lookups.principality[id]?.manifestations || []).map(t => t.toLowerCase()));
    const counts = new Map();
    lists.flat().forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
    return counts;
  }

  function connectionSummary(id) {
    const conn = getConnections(id);
    return {
      roots: conn.roots.map(r => r.name),
      fruits: conn.fruits.map(f => f.name),
      topicCount: conn.topics.length,
    };
  }

  function renderCompareDialog() {
    const ids = state.compareIds.slice(0, MAX_COMPARE);
    const sharedEl = document.getElementById('compare-shared');
    const gridEl = document.getElementById('compare-results');
    if (!sharedEl || !gridEl || ids.length < 2) return;

    const themeCounts = themeOverlap(ids);
    const manifestationCounts = manifestationOverlap(ids);
    const sharedThemes = [...themeCounts.entries()].filter(([, n]) => n > 1).map(([t]) => t);
    const sharedManifestations = [...manifestationCounts.entries()].filter(([, n]) => n > 1).map(([t]) => t);
    const sharedRoots = ids
      .map(id => new Set(getConnections(id).roots.map(r => r.name)))
      .reduce((a, b) => new Set([...a].filter(x => b.has(x))));
    const sharedFruits = ids
      .map(id => new Set(getConnections(id).fruits.map(f => f.name)))
      .reduce((a, b) => new Set([...a].filter(x => b.has(x))));

    if (sharedThemes.length || sharedManifestations.length || sharedRoots.size || sharedFruits.size) {
      sharedEl.classList.remove('hidden');
      sharedEl.innerHTML = `<h3>Shared across selection</h3>
        ${sharedRoots.size ? `<p><strong>Roots:</strong> ${[...sharedRoots].slice(0, 8).join(', ')}</p>` : ''}
        ${sharedFruits.size ? `<p><strong>Fruits:</strong> ${[...sharedFruits].slice(0, 8).join(', ')}</p>` : ''}
        ${sharedThemes.length ? `<p><strong>Core themes:</strong> ${sharedThemes.slice(0, 8).join(', ')}</p>` : ''}
        ${sharedManifestations.length ? `<p><strong>Manifestations:</strong> ${sharedManifestations.slice(0, 10).join(', ')}${sharedManifestations.length > 10 ? '…' : ''}</p>` : ''}`;
    } else {
      sharedEl.classList.add('hidden');
      sharedEl.innerHTML = '';
    }

    gridEl.className = `compare-grid cols-${ids.length}`;
    gridEl.innerHTML = ids.map(id => {
      const p = lookups.principality[id];
      const conn = connectionSummary(id);
      const src = icons?.thumbSrc(id, p.name) || '';
      const uniqueManifestations = (p.manifestations || []).filter(t => (manifestationCounts.get(t.toLowerCase()) || 0) === 1);
      const sharedManifestationsInColumn = (p.manifestations || []).filter(t => (manifestationCounts.get(t.toLowerCase()) || 0) > 1);
      const quote = p.quotes?.[0] ? `"${p.quotes[0]}"` : 'No character voice yet.';

      const manifestationTags = [
        ...uniqueManifestations.slice(0, 24).map(t => `<li class="unique">${t}</li>`),
        ...sharedManifestationsInColumn.slice(0, 12).map(t => `<li class="shared">${t}</li>`),
      ].join('') || '<li>—</li>';

      const coreThemeTags = (p.themes || []).slice(0, 12).map(t => `<li>${t}</li>`).join('');

      return `<article class="compare-column">
        <header class="compare-column-head">
          <img src="${src}" alt="" width="52" height="52" />
          <div>
            <h3>${p.name}</h3>
            <p>${conn.topicCount} topics · ${conn.roots.length} roots · ${conn.fruits.length} fruits</p>
          </div>
        </header>
        <section>
          <h4>Character</h4>
          <p>${p.character || '—'}</p>
        </section>
        <section>
          <h4>Voice</h4>
          <blockquote>${quote}</blockquote>
        </section>
        ${coreThemeTags ? `<section><h4>Core themes</h4><ul class="compare-tag-list">${coreThemeTags}</ul></section>` : ''}
        <section>
          <h4>Manifestations</h4>
          <p class="compare-diff-note">Gold = unique · Blue = shared · Roots/fruits define topic taxonomy separately</p>
          <ul class="compare-tag-list">${manifestationTags}</ul>
        </section>
        <section>
          <h4>Distinct roots</h4>
          <p>${conn.roots.filter(n => !sharedRoots.has(n)).slice(0, 6).join(', ') || '—'}</p>
        </section>
        <section>
          <h4>Distinct fruits</h4>
          <p>${conn.fruits.filter(n => !sharedFruits.has(n)).slice(0, 6).join(', ') || '—'}</p>
        </section>
      </article>`;
    }).join('');
  }

  function openCompareDialog() {
    if (state.compareIds.length < 2) return;
    renderCompareDialog();
    compareDialog?.showModal();
  }

  async function selectNode(id) {
    const type = nodeType(id);
    const item = lookups[type]?.[id];
    if (!item && type !== 'topic') return;

    state.selectedId = id;
    state.quoteIndex = 0;
    refreshGraph();

    document.getElementById('detail-empty').classList.add('hidden');
    document.getElementById('detail-content').classList.remove('hidden');
    document.getElementById('graph-hint').classList.add('hidden');

    const typeEl = document.getElementById('detail-type');
    typeEl.textContent = type;
    typeEl.className = `detail-type ${type}`;

    document.getElementById('detail-title').textContent = type === 'topic' ? item.name : item.name;
    const connCount = getConnections(id).topics.length;
    if (type === 'topic') {
      const parts = [`Topic #${item.number}`];
      if (item.principalities?.length > 1) parts.push(`${item.principalityIds.length} principalities`);
      if (topicRootIds(item).length > 1) parts.push(`${topicRootIds(item).length} roots`);
      if (topicFruitIds(item).length > 1) parts.push(`${topicFruitIds(item).length} fruits`);
      document.getElementById('detail-meta').textContent = parts.join(' · ');
    } else if (type === 'root' || type === 'fruit') {
      const pCount = getConnections(id).principalities.length;
      document.getElementById('detail-meta').textContent =
        `${connCount} topics · spans ${pCount} ${pCount === 1 ? 'principality' : 'principalities'}`;
    } else {
      document.getElementById('detail-meta').textContent =
        `${item.topicCount ?? connCount} topics connected`;
    }

    const charSection = document.getElementById('detail-character-section');
    const quoteSection = document.getElementById('detail-quote-section');
    const themesSection = document.getElementById('detail-themes-section');
    const manifestationsSection = document.getElementById('detail-manifestations-section');

    if (type === 'principality') {
      charSection.style.display = '';
      quoteSection.style.display = '';
      themesSection.style.display = (item.themes || []).length ? '' : 'none';
      manifestationsSection.style.display = (item.manifestations || []).length ? '' : 'none';
      document.getElementById('detail-character').textContent = item.character || '';
      showQuote(item);
      document.getElementById('detail-themes').innerHTML = (item.themes || []).map(t => `<li>${t}</li>`).join('');
      document.getElementById('detail-manifestations').innerHTML = (item.manifestations || [])
        .slice(0, 40)
        .map(t => `<li>${t}</li>`)
        .join('');
    } else {
      charSection.style.display = 'none';
      quoteSection.style.display = 'none';
      themesSection.style.display = 'none';
      manifestationsSection.style.display = 'none';
    }

    const conn = getConnections(id);
    const connEl = document.getElementById('detail-connections');
    connEl.innerHTML = [
      renderChips(conn.principalities, 'principality'),
      renderChips(conn.roots, 'root'),
      renderChips(conn.fruits, 'fruit'),
    ].join('');

    connEl.querySelectorAll('.chip').forEach(btn => {
      btn.addEventListener('click', () => selectNode(btn.dataset.node));
    });

    const topicsSection = document.getElementById('detail-topics-section');
    const topicList = conn.topics;
    document.getElementById('detail-topic-count').textContent = `(${conn.topics.length})`;
    const topicsEl = document.getElementById('detail-topics');
    topicsEl.innerHTML = topicList.map(t => {
      const fruitId = topicFruitIds(t)[0];
      const rootId = topicRootIds(t)[0];
      const dotColor = fruitId ? colors.resolveFruit(fruitId) : (rootId ? colors.resolveRoot(rootId) : colors.PRINCIPALITY_COLOR);
      const hasVideo = window.VIDEO_DATA?.topicIndex?.[String(t.number)];
      const videoMark = hasVideo ? '<span class="topic-video-mark" title="Teaching video available">▶</span>' : '';
      return `<li data-node="topic-${t.id}"><span class="topic-dot" style="background:${dotColor}"></span><span class="num">${String(t.number).padStart(3, '0')}</span>${t.name}${videoMark}</li>`;
    }).join('');
    topicsSection.style.display = conn.topics.length ? '' : 'none';
    topicsEl.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => selectNode(li.dataset.node));
    });

    const prayerSection = document.getElementById('detail-prayer-section');
    const teachingSection = document.getElementById('detail-teaching-section');
    const teachingNote = document.getElementById('detail-teaching-note');
    const watchTeachingBtn = document.getElementById('detail-watch-teaching');
    if (type === 'topic') {
      await renderTopicPrayer(item);
      const videoEntry = window.VIDEO_DATA?.topicIndex?.[String(item.number)];
      if (videoEntry && teachingSection) {
        teachingSection.classList.remove('hidden');
        const dayLabel = `Day ${videoEntry.day}${videoEntry.part > 1 ? ` Part ${videoEntry.part}` : ''}`;
        const timeLabel = videoEntry.startSeconds
          ? ` at ${window.TeachingVideos?.formatTime(videoEntry.startSeconds) || ''}`
          : '';
        teachingNote.textContent = `Teaching video: ${dayLabel}${timeLabel}`;
        watchTeachingBtn.onclick = () => {
          window.TeachingVideos?.openTopicVideo(item.number);
          document.getElementById('teaching-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
      } else if (teachingSection) {
        teachingSection.classList.add('hidden');
      }
    } else {
      prayerSection.classList.add('hidden');
      topicAudio.pause();
      teachingSection?.classList.add('hidden');
    }

    applyGraphView();
    openDetailSheet();
  }

  function showQuote(principality) {
    const quotes = principality.quotes || [];
    const el = document.getElementById('detail-quote');
    const btn = document.getElementById('next-quote');
    if (!quotes.length) {
      el.textContent = 'Character voice not yet written for this principality.';
      btn.style.display = 'none';
      return;
    }
    btn.style.display = '';
    el.textContent = `"${quotes[state.quoteIndex % quotes.length]}"`;
  }

  document.getElementById('next-quote').addEventListener('click', () => {
    const p = lookups.principality[state.selectedId];
    if (!p) return;
    state.quoteIndex++;
    showQuote(p);
  });

  document.getElementById('open-compare')?.addEventListener('click', openCompareDialog);
  document.getElementById('clear-compare')?.addEventListener('click', clearCompare);

  document.getElementById('show-principalities').addEventListener('change', e => {
    state.show.principality = e.target.checked;
    refreshGraph();
  });
  document.getElementById('show-roots').addEventListener('change', e => {
    state.show.root = e.target.checked;
    refreshGraph();
  });
  document.getElementById('show-fruits').addEventListener('change', e => {
    state.show.fruit = e.target.checked;
    refreshGraph();
  });
  document.getElementById('show-topics').addEventListener('change', e => {
    state.show.topic = e.target.checked;
    if (e.target.checked) state.viewMode = 'explore';
    refreshGraph();
  });
  document.getElementById('show-topic-root-links')?.addEventListener('change', e => {
    state.show.topicRoot = e.target.checked;
    refreshGraph();
  });
  document.getElementById('show-topic-fruit-links')?.addEventListener('change', e => {
    state.show.topicFruit = e.target.checked;
    refreshGraph();
  });
  document.getElementById('show-topic-principality-links')?.addEventListener('change', e => {
    state.show.topicPrincipality = e.target.checked;
    refreshGraph();
  });
  document.getElementById('show-aggregate-links')?.addEventListener('change', e => {
    state.show.aggregateLinks = e.target.checked;
    refreshGraph();
  });

  document.getElementById('view-mode').addEventListener('change', e => {
    state.viewMode = e.target.value;
    state.selectedId = null;
    showEmptyDetail();
    document.getElementById('graph-hint').classList.remove('hidden');
    if (e.target.value === 'explore') {
      document.getElementById('show-topics').checked = true;
      state.show.topic = true;
    } else {
      document.getElementById('show-topics').checked = false;
      state.show.topic = false;
    }
    refreshGraph();
    applyGraphView();
  });

  document.getElementById('reset-view').addEventListener('click', () => {
    state.selectedId = null;
    state.viewMode = 'constellation';
    document.getElementById('view-mode').value = 'constellation';
    document.getElementById('show-topics').checked = false;
    state.show.topic = false;
    showEmptyDetail();
    document.getElementById('graph-hint').classList.remove('hidden');
    refreshGraph();
    applyGraphView(400, 400);
  });

  document.getElementById('search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;

    const match =
      principalities.find(p => p.name.toLowerCase().includes(q)) ||
      roots.find(r => r.name.toLowerCase().includes(q)) ||
      fruits.find(f => f.name.toLowerCase().includes(q)) ||
      topics.find(t => t.name.toLowerCase().includes(q) || String(t.number).includes(q));

    if (match) {
      const id = match.id !== undefined && !String(match.id).startsWith('topic-')
        ? (topics.includes(match) ? `topic-${match.id}` : match.id)
        : match.id;
      selectNode(typeof id === 'number' ? `topic-${id}` : id);
      Graph.centerAt(undefined, undefined, 600);
      Graph.zoom(2.5, 600);
    }
  });

  syncGraphSize();
  refreshGraph();
  bindZoomSlider();
  initMobileUi();
  mobileMq.addEventListener('change', () => {
    Graph.enableZoomInteraction(isMobileLayout());
    updateGraphHintForLayout();
    setControlsDrawerOpen(false);
    if (!isMobileLayout()) {
      closeDetailSheet();
    } else if (state.selectedId) {
      openDetailSheet();
    }
    syncGraphSize();
    applyGraphView(0, 0);
  });
  renderComparePanel();
  colors.renderLegend(document.getElementById('color-legend'));

  function fitGraphToView() {
    applyGraphView(400, 0);
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (state.viewMode === 'constellation' && !state.selectedId) {
        fitConstellationRing(0);
      } else if (state.viewMode === 'explore' && !state.selectedId) {
        fitExploreOverview(0);
      }
    }).observe(container);
  }
  window.addEventListener('resize', fitGraphToView);
  requestAnimationFrame(() => applyGraphView(400, 450));
  setTimeout(() => applyGraphView(400, 0), 900);

  initLanguageSelector().catch(err => {
    console.error('Language catalog failed to load:', err);
  });

  function selectTopicByNumber(number, { scrollTeaching = true } = {}) {
    const topic = topics.find(t => t.number === number);
    if (!topic) return;
    selectNode(`topic-${topic.id}`);
    if (scrollTeaching && window.TeachingVideos?.openTopicVideo(number)) {
      document.getElementById('teaching-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  window.LivingWordMap = {
    selectTopicByNumber,
    selectNode,
  };
})();
