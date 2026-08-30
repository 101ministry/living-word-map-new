(() => {
  const DATA_URL = 'discipleship-trainer/student-cards.json';
  const FOCUS_MAX = 7;
  const DECOY_COUNT = 3;
  const TRUE_COUNT = 3;
  const RETURN_AFTER_TURNS = 3;

  const GOLD_POOL = [
    { id: 'name-before-god', label: 'Name the fruit before God, not as who they are' },
    { id: 'word-names', label: 'Let Scripture name it, not their story' },
    { id: 'yield-jesus', label: 'Yield this to Jesus as Lord' },
    { id: 'covering-not-throne', label: 'Cover them; do not take the throne' },
    { id: 'refuse-fight', label: 'Refuse the doctrine fight; stay with the question' },
    { id: 'blood-not-opinion', label: 'Point them to the blood, not your opinion' },
    { id: 'repent-fruit', label: 'Call them to repent of the fruit, not the wound-story' },
    { id: 'slow-cover', label: 'Slow down. Covering first, chart later' },
    { id: 'not-source', label: 'Do not become their source' },
    { id: 'light-no-show', label: 'Bring it to the light without a shame-show' },
    { id: 'agree-god', label: 'Ask them to agree with God about what this is' },
    { id: 'submit-word', label: 'Submit the question to the Word, not the room' },
    { id: 'confess-not-debate', label: 'Invite confession; do not debate the fruit' },
    { id: 'jesus-answers', label: 'Jesus answers this; you are not the oracle' },
    { id: 'hold-line', label: 'Hold the line: this is sin to be named, not a style' },
  ];

  const RED_POOL = [
    { id: 'win-arg', label: 'Win the argument so they respect you', hardness: 1 },
    { id: 'please-stay', label: 'Bless it so they stay in the chair', willingness: 1 },
    { id: 'expose-room', label: 'Expose them in front of the others', hardness: 1 },
    { id: 'side-feelings', label: 'Side with their feelings over the Word', hardness: 1 },
    { id: 'exception', label: 'Treat their case as the exception to Scripture', hardness: 1 },
    { id: 'family-right', label: 'Honor the family pattern as wisdom', hardness: 1 },
    { id: 'no-yoke', label: 'Do not put a yoke on them; they have been through enough', willingness: 1 },
    { id: 'identity', label: 'Protect their identity; do not call it fruit', hardness: 1 },
    { id: 'later', label: 'Leave the fruit unnamed so they do not shut down', willingness: 1 },
    { id: 'you-fix', label: 'Promise you can fix this if they stay loyal', willingness: 1 },
    { id: 'chart-dump', label: 'Dump the whole chart so they know you are right', hardness: 1 },
    { id: 'soften-sin', label: 'Soften it: this is only a struggle, not sin', hardness: 1 },
  ];

  const EXTRA_PROBLEMS = [
    'Now they will not sit under anyone else in the room.',
    'They started a side conversation that the fruit is “just how our family is.”',
    'Two others are repeating their question as if it were doctrine.',
    'They came back with a new shield: “You missed what God is actually doing.”',
  ];

  function isLocalDevHost() {
    const h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function clipPhrase(text, n) {
    const t = String(text || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!t) return '';
    if (t.length <= n) return t;
    const cut = t.slice(0, n);
    const sp = cut.lastIndexOf(' ');
    return `${sp > 16 ? cut.slice(0, sp) : cut}…`;
  }

  function personalReds(student) {
    const fruit = (student.trueFruits || student.presentFruit || [])[0] || 'this fruit';
    const root = (student.generationalPack || [])[0];
    const stance = student.debateVsConfess;
    const out = [
      {
        id: 'echo-them',
        label: `Agree with how they see it: ${clipPhrase(student.perspective, 42)}`,
        willingness: 1,
      },
      {
        id: 'keep-fruit',
        label: `Let ${fruit} stand as just how they are`,
        hardness: 1,
      },
      {
        id: 'life-except',
        label: `Their situation is different: ${clipPhrase(student.lifeSituation, 36)}`,
        hardness: 1,
      },
    ];
    if (root) {
      out.push({
        id: 'keep-root',
        label: `Keep ${root} in the room as family wisdom`,
        hardness: 1,
      });
    }
    if (stance === 'debate') {
      out.push({
        id: 'win-their-q',
        label: 'Win the point they walked in with',
        hardness: 1,
      });
    } else if (stance === 'confess') {
      out.push({
        id: 'already-sorry',
        label: 'Skip naming it; they already sound sorry enough',
        willingness: 1,
      });
    } else {
      out.push({
        id: 'half-in',
        label: 'Meet them halfway and leave the fruit unnamed',
        willingness: 1,
      });
    }
    return out;
  }

  function buildAnswerDeck(student) {
    const gold = shuffle(GOLD_POOL)
      .slice(0, TRUE_COUNT)
      .map((g, i) => ({
        id: `g-${g.id}-${i}`,
        label: g.label,
        trap: false,
        hardness: -1,
      }));
    const seen = new Set();
    const redSource = [...personalReds(student), ...RED_POOL].filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    const red = shuffle(redSource)
      .slice(0, TRUE_COUNT)
      .map((r, i) => ({
        id: `r-${r.id}-${i}`,
        label: r.label,
        trap: true,
        hardness: r.hardness,
        willingness: r.willingness,
      }));
    const goldFirst = Math.random() < 0.5;
    const deck = [];
    for (let i = 0; i < TRUE_COUNT; i += 1) {
      if (goldFirst) {
        deck.push(gold[i], red[i]);
      } else {
        deck.push(red[i], gold[i]);
      }
    }
    return deck;
  }

  function clamp(n) {
    return Math.max(1, Math.min(5, n));
  }

  function meter(n) {
    const v = Number(n) || 1;
    return '●'.repeat(v) + '○'.repeat(5 - v);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function graphTopics() {
    return window.GRAPH_DATA?.topics || [];
  }

  function graphRoots() {
    return window.GRAPH_DATA?.roots || [];
  }

  function matchTopic(title) {
    const want = String(title || '').toLowerCase().trim();
    if (!want) return null;
    const topics = graphTopics();
    const exact = topics.find((t) => String(t.name || '').toLowerCase() === want);
    if (exact) return { number: exact.number, name: exact.name, rootIds: exact.rootIds || (exact.rootId ? [exact.rootId] : []) };
    const loose = topics.find((t) => {
      const n = String(t.name || '').toLowerCase();
      return n.includes(want) || want.includes(n);
    });
    return loose
      ? {
          number: loose.number,
          name: loose.name,
          rootIds: loose.rootIds || (loose.rootId ? [loose.rootId] : []),
        }
      : null;
  }

  function searchTopics(q) {
    const want = String(q || '').toLowerCase().trim();
    if (want.length < 2) return [];
    return graphTopics()
      .filter((t) => String(t.name || '').toLowerCase().includes(want))
      .slice(0, 8)
      .map((t) => ({ number: t.number, name: t.name }));
  }

  function rootsFromTitles(titles) {
    const names = [];
    const seen = new Set();
    for (const title of titles || []) {
      const t = matchTopic(title);
      const ids = t?.rootIds || [];
      for (const id of ids) {
        const root = graphRoots().find((r) => r.id === id);
        const label = root?.name;
        if (label && !seen.has(label)) {
          seen.add(label);
          names.push(label);
        }
      }
    }
    return names;
  }

  function decoyTitles(truth) {
    const locked = new Set((truth || []).map(norm));
    const pool = graphTopics()
      .map((t) => t.name)
      .filter((n) => n && !locked.has(norm(n)));
    return shuffle(pool).slice(0, DECOY_COUNT);
  }

  function titlesMatch(a, b) {
    const x = norm(a);
    const y = norm(b);
    if (!x || !y) return false;
    return x === y || x.includes(y) || y.includes(x);
  }

  function padTrueFruits(truth) {
    const unique = [];
    for (const t of truth || []) {
      if (t && !unique.some((u) => titlesMatch(u, t))) unique.push(t);
    }
    if (unique.length >= TRUE_COUNT) return unique.slice(0, TRUE_COUNT);
    const need = TRUE_COUNT - unique.length;
    const extras = decoyTitles(unique).slice(0, need);
    return [...unique, ...extras];
  }

  function mixSix(trueFruits) {
    const decoys = decoyTitles(trueFruits).slice(0, DECOY_COUNT);
    return shuffle([...trueFruits, ...decoys]).slice(0, TRUE_COUNT + DECOY_COUNT);
  }

  function isTrueFruit(student, title) {
    return (student.trueFruits || []).some((t) => titlesMatch(t, title));
  }

  function namedAllTrue(student, titles) {
    const truth = student.trueFruits || [];
    if (truth.length < TRUE_COUNT) return false;
    return truth.every((t) => (titles || []).some((n) => titlesMatch(t, n)));
  }

  function prepareStudent(raw) {
    const trueFruits = padTrueFruits(raw.presentFruit || []);
    return {
      ...raw,
      trueFruits,
      possibleFruits: mixSix(trueFruits),
      extraProblems: [],
      status: 'present',
      faction: false,
    };
  }

  const Camp = {
    isLocalDevHost,
    pack: null,
    bench: [],
    classroom: [],
    selectedName: null,
    focusNames: [],
    roundNames: [],
    size: 40,
    sessions: {},
    prayerPreview: null,
    roomLog: [],
    loyalty: 0,
    splits: 0,
    turn: 0,
    cases: [],
    caseSeq: 0,

    session(name) {
      if (!this.sessions[name]) {
        this.sessions[name] = {
          picks: [],
          assigned: [],
          answers: [],
          answerDeck: null,
          lastAnswer: null,
          released: false,
          returnKind: null,
          goldFlash: null,
          prayerNote: null,
          heldFruits: [],
          awayOnTurn: 0,
          clipboardId: null,
        };
      }
      return this.sessions[name];
    },

    injectViewOption() {
      const sel = document.getElementById('view-mode');
      if (!sel || sel.querySelector('option[value="camp"]')) {
        window.ViewNav?.injectCamp?.();
        return;
      }
      const opt = document.createElement('option');
      opt.value = 'camp';
      opt.textContent = 'Discipleship Training Camp minigame';
      const after = sel.querySelector('option[value="experimental"]');
      if (after && after.nextSibling) sel.insertBefore(opt, after.nextSibling);
      else if (after) after.after(opt);
      else sel.insertBefore(opt, sel.firstChild);
      window.ViewNav?.injectCamp?.();
      const nav = document.getElementById('mobile-nav')?.querySelector('.mobile-nav-list');
      if (nav && !document.getElementById('nav-camp')) {
        const li = document.createElement('li');
        li.innerHTML = '<button type="button" id="nav-camp" class="mobile-nav-link">Discipleship Training Camp minigame</button>';
        nav.appendChild(li);
        document.getElementById('nav-camp')?.addEventListener('click', () => {
          sel.value = 'camp';
          sel.dispatchEvent(new Event('change'));
        });
      }
    },

    show() {
      const el = document.getElementById('camp-view');
      if (!el) return;
      el.classList.remove('hidden');
      el.setAttribute('aria-hidden', 'false');
      this.draw();
    },

    hide() {
      const el = document.getElementById('camp-view');
      if (!el) return;
      el.classList.add('hidden');
      el.setAttribute('aria-hidden', 'true');
    },

    async load() {
      if (this.pack) return this.pack;
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error('Could not load student cards');
      this.pack = await res.json();
      const def = this.pack.drawRules?.classroomSize?.default || 40;
      this.size = Math.min(50, Math.max(20, def));
      const sizeEl = document.getElementById('camp-size');
      if (sizeEl) sizeEl.value = String(this.size);
      return this.pack;
    },

    redrawClassroom() {
      if (!this.pack) {
        this.draw();
        return;
      }
      const roster = shuffle(this.pack.students || []);
      const start = Math.min(this.size, Math.max(8, Math.min(20, this.size)));
      this.classroom = roster.slice(0, start).map(prepareStudent);
      this.bench = roster.slice(start).map(prepareStudent);
      this.sessions = {};
      this.prayerPreview = null;
      this.roomLog = [];
      this.loyalty = 0;
      this.splits = 0;
      this.turn = 0;
      this.cases = [];
      this.caseSeq = 0;
      this.selectedName = this.classroom[0]?.displayName || null;
      this.roundNames = this.classroom.slice(0, FOCUS_MAX).map((s) => s.displayName);
      this.focusNames = this.roundNames.slice();
      this.render();
    },

    studentByName(name) {
      return this.classroom.find((s) => s.displayName === name);
    },

    ensureLine() {
      this.focusNames = this.roundNames.filter((n) => {
        const s = this.studentByName(n);
        return s && s.status === 'present';
      });
    },

    inRound(name) {
      return this.roundNames.includes(name);
    },

    hasTried(name) {
      return this.cases.some((c) => c.name === name);
    },

    coveringList(sess) {
      return (sess.answers || []).map((a) => ({ label: a.label, trap: !!a.trap }));
    },

    caseNote(sess) {
      return `Incomplete case. ${sess.picks.length} of ${TRUE_COUNT} fruits · ${(sess.answers || []).length} of ${TRUE_COUNT} answers · ${sess.assigned.length} of ${TRUE_COUNT} prayers.`;
    },

    deckFor(student) {
      const sess = this.session(student.displayName);
      if (!sess.answerDeck?.length) sess.answerDeck = buildAnswerDeck(student);
      return sess.answerDeck;
    },

    fruitsReady(student, sess) {
      if (sess.seenReturn) {
        return (sess.picks || []).some((p) => isTrueFruit(student, p));
      }
      return (sess.picks || []).length >= TRUE_COUNT;
    },

    prayersNeeded(student, sess) {
      if (!sess.seenReturn) return TRUE_COUNT;
      const left = (student.possibleFruits || []).filter((t) => isTrueFruit(student, t)).length;
      return Math.max(1, left);
    },

    readyForPrayers(sess, student) {
      if (!student) return false;
      return this.fruitsReady(student, sess) && (sess.answers || []).length >= TRUE_COUNT;
    },

    pinClipboard(student, prayerBody) {
      const sess = this.session(student.displayName);
      const fruits = sess.picks.slice();
      const prayers = sess.assigned.map((a) => `#${String(a.number).padStart(3, '0')} ${a.name}`);
      const covering = this.coveringList(sess);
      const note = this.caseNote(sess);
      if (!sess.clipboardId) {
        this.caseSeq += 1;
        sess.clipboardId = this.caseSeq;
        this.cases.push({
          id: sess.clipboardId,
          name: student.displayName,
          fruits,
          prayers,
          prayerTexts: [],
          covering,
          shade: 'incomplete',
          note,
          arriveAt: Date.now(),
          resolved: false,
        });
      } else {
        const card = this.cases.find((c) => c.id === sess.clipboardId);
        if (card && !card.resolved) {
          card.fruits = fruits;
          card.prayers = prayers;
          card.covering = covering;
          card.note = note;
          card.arriveAt = Date.now();
        }
      }
      if (prayerBody?.label) {
        const card = this.cases.find((c) => c.id === sess.clipboardId);
        if (card) {
          card.prayerTexts = card.prayerTexts || [];
          if (!card.prayerTexts.some((p) => p.label === prayerBody.label)) {
            card.prayerTexts.push(prayerBody);
          }
          card.covering = covering;
          card.note = note;
        }
      }
    },

    resolveClipboard(student) {
      const sess = this.session(student.displayName);
      const card = this.cases.find((c) => c.id === sess.clipboardId);
      if (!card) return;
      card.fruits = sess.picks.slice();
      card.prayers = sess.assigned.map((a) => `#${String(a.number).padStart(3, '0')} ${a.name}`);
      card.covering = this.coveringList(sess);
      if (sess.returnKind === 'worse') {
        card.shade = 'miss';
        card.note = 'That didn’t work.';
      } else if (sess.returnKind === 'praise' && namedAllTrue(student, sess.picks)) {
        card.shade = 'gold';
        card.note = 'Praise report.';
      } else {
        card.shade = 'incomplete';
        card.note = 'Incomplete case.';
      }
      card.resolved = true;
      card.arriveAt = Date.now();
      sess.clipboardId = null;
    },

    renderClipboard() {
      const board = document.getElementById('camp-clipboard');
      if (!board) return;
      if (!this.cases.length) {
        board.innerHTML = '<p class="camp-clipboard-title">Tried</p><p class="camp-clipboard-empty">Assign a prayer and a slip lands here.</p>';
        return;
      }
      const now = Date.now();
      board.innerHTML =
        '<p class="camp-clipboard-title">Tried</p>' +
        this.cases
          .map((c) => {
            const shade = ` is-${c.shade}`;
            const arrive = now - (c.arriveAt || 0) < 900 ? ' is-arrive' : '';
            const fruits = (c.fruits || []).map((t) => `<li>${escapeHtml(t)}</li>`).join('');
            const prayers = (c.prayers || []).map((t) => `<li>${escapeHtml(t)}</li>`).join('');
            const results = c.resolved
              ? (c.prayerTexts || [])
                  .map((p) => {
                    const title = p.kicker || p.label || '';
                    const line = p.hit
                      ? 'They prayed it and the fruit actually quieted.'
                      : 'They prayed it anyway. The words came out, but they talked as if a different fruit were the issue.';
                    return `<div class="camp-clip-result"><p class="camp-clip-kicker">${escapeHtml(title)}</p><p class="camp-clip-outcome${p.hit ? ' is-hit' : ''}">${escapeHtml(line)}</p></div>`;
                  })
                  .join('')
              : '';
            return `<button type="button" class="camp-clip${shade}${arrive}" data-clip-name="${escapeHtml(c.name)}">
              <span class="camp-clip-name">${escapeHtml(c.name)}</span>
              <span class="camp-clip-note">${escapeHtml(c.note)}</span>
              ${
                (Array.isArray(c.covering) ? c.covering : c.covering ? [c.covering] : [])
                  .map((cov) => `<span class="camp-clip-cover${cov.trap ? ' is-trap' : ' is-gold'}">${escapeHtml(cov.label)}</span>`)
                  .join('')
              }
              <ul class="camp-clip-list">${fruits}</ul>
              <ul class="camp-clip-list">${prayers}</ul>
              ${results}
            </button>`;
          })
          .join('');
    },

    toggleFocus(name) {
      if (!this.inRound(name)) return;
      const i = this.focusNames.indexOf(name);
      if (i >= 0) this.focusNames.splice(i, 1);
      else if (this.focusNames.length < FOCUS_MAX) this.focusNames.push(name);
      this.render();
    },

    togglePick(student, title) {
      const sess = this.session(student.displayName);
      if (sess.picks.some((p) => titlesMatch(p, title))) return;
      if (sess.seenReturn) {
        const namedTrue = sess.picks.some((p) => isTrueFruit(student, p));
        if (namedTrue && !isTrueFruit(student, title)) return;
      } else if (sess.picks.length >= TRUE_COUNT) return;
      sess.picks.push(title);
      if (sess.seenReturn && isTrueFruit(student, title)) {
        sess.picks = sess.picks.filter((p) => isTrueFruit(student, p));
        student.possibleFruits = (student.possibleFruits || []).filter((t) => isTrueFruit(student, t));
      } else if (!sess.seenReturn && sess.picks.length >= TRUE_COUNT) {
        sess.heldFruits = (student.possibleFruits || []).filter((t) => !sess.picks.some((p) => titlesMatch(p, t)));
      }
      sess.goldFlash = isTrueFruit(student, title) ? title : null;
      this.pinClipboard(student);
      this.render();
      if (sess.goldFlash) {
        window.setTimeout(() => {
          if (this.session(student.displayName).goldFlash === title) {
            this.session(student.displayName).goldFlash = null;
            this.render();
          }
        }, 900);
      }
    },

    discernmentHits(student, sess) {
      const truth = student.trueFruits || [];
      const named = [...(sess.picks || []), ...(sess.assigned || []).map((a) => a.name)];
      return truth.filter((t) => named.some((n) => titlesMatch(t, n)));
    },

    isAccurate(student, sess) {
      const truth = student.trueFruits || [];
      if (!truth.length || !sess.picks.length) return false;
      const hits = this.discernmentHits(student, sess).length;
      const misses = sess.picks.filter((p) => !truth.some((t) => titlesMatch(t, p))).length;
      return hits >= 2 && misses <= hits;
    },

    arriveTwo(sourceName) {
      const incoming = this.bench.splice(0, 2);
      if (!incoming.length) {
        this.roomLog.unshift(`The room is full. No more walked in after ${sourceName}.`);
        return;
      }
      this.classroom.push(...incoming);
      this.roomLog.unshift(`${incoming.map((s) => s.displayName).join(' and ')} sat down in the hall seats. This round stays ${FOCUS_MAX}.`);
    },

    spreadFaction(student) {
      const others = this.classroom.filter((s) => s.displayName !== student.displayName && s.status === 'present');
      shuffle(others)
        .slice(0, 2)
        .forEach((s) => {
          s.faction = true;
          s.willingnessTowardAdministrator = clamp(s.willingnessTowardAdministrator - 1);
        });
      this.splits += 1;
    },

    releaseStudent(student) {
      const sess = this.session(student.displayName);
      if (sess.released) return;
      if (!this.fruitsReady(student, sess) || sess.assigned.length < this.prayersNeeded(student, sess) || (sess.answers || []).length < TRUE_COUNT) return;
      if (!sess.heldFruits.length) {
        sess.heldFruits = (student.possibleFruits || []).filter((t) => !sess.picks.some((p) => titlesMatch(p, t)));
      }
      sess.released = true;
      const accurate = this.isAccurate(student, sess);
      sess.returnKind = accurate ? 'praise' : 'worse';
      student.status = 'away';
      this.turn += 1;
      sess.awayOnTurn = this.turn;
      if (accurate) this.loyalty += 1;
      else {
        this.spreadFaction(student);
        student.extraProblems.push(shuffle(EXTRA_PROBLEMS)[0]);
        student.humilitySubmissionHardness = clamp(student.humilitySubmissionHardness + 1);
      }
      this.arriveTwo(student.displayName);
      this.roomLog.unshift(
        accurate
          ? `${student.displayName} left the chair. The other three fruits wait ${RETURN_AFTER_TURNS} turns.`
          : `${student.displayName} left unconvinced. The room felt it. They return in ${RETURN_AFTER_TURNS} turns.`
      );
      this.advanceReturns();
      this.ensureLine();
    },

    bringBack(student) {
      const sess = this.session(student.displayName);
      if (student.status !== 'away') return;
      this.resolveClipboard(student);
      sess.seenReturn = true;
      sess.picks = [];
      sess.assigned = [];
      sess.answers = [];
      sess.answerDeck = buildAnswerDeck(student);
      sess.lastAnswer = null;
      sess.released = false;
      sess.prayerNote = null;
      sess.awayOnTurn = 0;
      student.possibleFruits = (sess.heldFruits || []).slice();
      if (!student.possibleFruits.length) student.possibleFruits = mixSix(student.trueFruits);
      student.status = 'present';
      if (sess.returnKind === 'praise') {
        student.humilitySubmissionHardness = clamp(student.humilitySubmissionHardness - 1);
        student.willingnessTowardAdministrator = clamp(student.willingnessTowardAdministrator + 1);
      } else {
        student.humilitySubmissionHardness = clamp(student.humilitySubmissionHardness + 1);
      }
      this.roomLog.unshift(`${student.displayName} sat back down. The three names that waited came with them.`);
      const curStudent = this.studentByName(this.selectedName);
      if (!current || (curStudent && current.assigned.length >= this.prayersNeeded(curStudent, current))) {
        this.selectedName = student.displayName;
      }
    },

    advanceReturns() {
      this.classroom.forEach((s) => {
        const sess = this.session(s.displayName);
        if (s.status === 'away' && sess.awayOnTurn && this.turn >= sess.awayOnTurn + RETURN_AFTER_TURNS) {
          this.bringBack(s);
        }
      });
    },

    applyAnswer(student, answer) {
      const sess = this.session(student.displayName);
      if (sess.answers.some((a) => a.id === answer.id)) return;
      if (sess.answers.length >= TRUE_COUNT) return;
      if (typeof answer.hardness === 'number') {
        student.humilitySubmissionHardness = clamp(student.humilitySubmissionHardness + answer.hardness);
      }
      if (typeof answer.willingness === 'number') {
        student.willingnessTowardAdministrator = clamp(student.willingnessTowardAdministrator + answer.willingness);
      }
      sess.answers.push({ id: answer.id, label: answer.label, trap: !!answer.trap });
      sess.lastAnswer = sess.answers[sess.answers.length - 1];
      this.pinClipboard(student);
      this.render();
    },

    selectNextInLine(exceptName) {
      this.ensureLine();
      const open = (n) => {
        if (!n || n === exceptName || !this.inRound(n)) return null;
        const s = this.studentByName(n);
        if (!s || s.status !== 'present') return null;
        if (this.session(n).assigned.length >= this.prayersNeeded(s, this.session(n))) return null;
        return n;
      };
      for (const n of this.roundNames) {
        const hit = open(n);
        if (hit) {
          this.selectedName = hit;
          return;
        }
      }
      this.roomLog.unshift(`This round is ${FOCUS_MAX}. Wait for someone in the line to come back.`);
    },

    async assignTopic(student, topic) {
      if (!topic?.number) return;
      if (!this.inRound(student.displayName)) return;
      const sess = this.session(student.displayName);
      if (!this.readyForPrayers(sess, student)) return;
      if (sess.assigned.some((a) => a.number === topic.number)) return;
      if (sess.assigned.length >= this.prayersNeeded(student, sess)) return;
      sess.assigned.push({ number: topic.number, name: topic.name });
      const hit = isTrueFruit(student, topic.name);
      sess.prayerNote = hit
        ? 'They prayed it and the fruit actually quieted.'
        : 'They prayed it anyway. The words came out, but they talked as if a different fruit were the issue.';
      const preview = await this.showPrayer(topic.number, topic.name, hit);
      this.pinClipboard(student, {
        kicker: `Prayer #${String(topic.number).padStart(3, '0')} · ${topic.name}`,
        label: `#${String(topic.number).padStart(3, '0')} ${topic.name}`,
        text: preview.text,
        hit: !!hit,
      });
      this.releaseStudent(student);
      if (sess.assigned.length >= this.prayersNeeded(student, sess)) this.selectNextInLine(student.displayName);
      this.render();
    },

    async showPrayer(number, name, hit) {
      let text = '';
      try {
        const prayer = await window.PrayerLibrary?.getTopicPrayer?.(number);
        text = prayer?.text || '';
      } catch {
        text = '';
      }
      return {
        number,
        name,
        hit: !!hit,
        text: text || 'No prayer text loaded for this topic yet. The assignment still stands.',
      };
    },

    render() {
      const seats = document.getElementById('camp-seats');
      const inspect = document.getElementById('camp-inspect');
      const meta = document.getElementById('camp-meta');
      const focus = document.getElementById('camp-focus');
      if (!seats || !inspect) return;
      this.renderClipboard();
      if (meta) {
        meta.textContent = `Round of ${this.roundNames.length} · ${this.classroom.length} in the room · ${this.bench.length} in the hall · turn ${this.turn} · loyalty ${this.loyalty} · splits ${this.splits}`;
      }
      if (focus) {
        const chips = this.focusNames.map((n) => `<span class="camp-chip">${escapeHtml(n)}</span>`).join('');
        const log = this.roomLog[0] ? `<span class="camp-muted">${escapeHtml(this.roomLog[0])}</span>` : '';
        focus.innerHTML = `${chips} ${log}`;
      }
      seats.innerHTML = this.classroom
        .map((s) => {
          const sess = this.session(s.displayName);
          const on = s.displayName === this.selectedName ? ' is-selected' : '';
          const work = this.focusNames.includes(s.displayName) ? ' is-focus' : '';
          const ret = s.status === 'returning' ? ' is-return' : '';
          const split = s.faction ? ' is-split' : '';
          const away = s.status === 'away' ? ' is-away' : '';
          let badge = '';
          if (s.status === 'returning' && sess.returnKind === 'praise') badge = 'Praise';
          else if (s.status === 'returning') badge = 'More problems';
          else if (s.status === 'away') badge = 'Out of the chair';
          else if (s.faction) badge = 'Split';
          return `<button type="button" class="camp-seat${on}${work}${ret}${split}${away}" data-name="${escapeHtml(s.displayName)}">
            <span class="camp-seat-name">${escapeHtml(s.displayName)}</span>
            ${badge ? `<span class="camp-seat-badge">${badge}</span>` : ''}
            <span class="camp-seat-q">${escapeHtml(s.openingQuestion)}</span>
          </button>`;
        })
        .join('');
      const s = this.studentByName(this.selectedName);
      if (!s) {
        inspect.innerHTML = '<p class="camp-muted">Draw a classroom to begin.</p>';
        return;
      }
      const working = this.focusNames.includes(s.displayName);
      const sess = this.session(s.displayName);
      const derivedGen = rootsFromTitles(sess.picks);
      const pickSet = sess.picks;
      const namedTrue = pickSet.some((p) => isTrueFruit(s, p));
      const shownFruits =
        sess.seenReturn && namedTrue
          ? (s.possibleFruits || []).filter((title) => isTrueFruit(s, title))
          : !sess.seenReturn && pickSet.length >= TRUE_COUNT
            ? (s.possibleFruits || []).filter((title) => pickSet.some((p) => titlesMatch(p, title)))
            : s.possibleFruits || [];
      const fruitBtns = shownFruits
        .map((title) => {
          const on = pickSet.some((p) => titlesMatch(p, title));
          const gold = sess.goldFlash && titlesMatch(sess.goldFlash, title);
          return `<button type="button" class="camp-fruit-btn${on ? ' is-picked' : ''}${gold ? ' is-gold-hit' : ''}" data-pick="${escapeHtml(title)}">${escapeHtml(title)}</button>`;
        })
        .join('');
      const assignSource = pickSet.length ? pickSet : [];
      const assignBtns = assignSource
        .map((title) => {
          const t = matchTopic(title);
          if (!t) return '';
          const on = sess.assigned.some((a) => a.number === t.number);
          return `<button type="button" class="camp-assign-btn${on ? ' is-assigned' : ''}" data-assign="${t.number}" data-name="${escapeHtml(t.name)}">#${String(t.number).padStart(3, '0')} ${escapeHtml(t.name)}</button>`;
        })
        .join('');
      const pickedIds = new Set((sess.answers || []).map((a) => a.id));
      const answerBtns = this.deckFor(s)
        .map((a) => {
          const on = pickedIds.has(a.id);
          const mark = on ? ` is-used${a.trap ? ' is-trap' : ' is-gold'}` : '';
          return `<button type="button" class="camp-answer-btn${mark}" data-answer="${escapeHtml(a.id)}">${escapeHtml(a.label)}</button>`;
        })
        .join('');
      const prayersOpen = this.readyForPrayers(sess, s);
      const genBlock = derivedGen.length
        ? `<ul class="camp-list">${derivedGen.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
        : '<p class="camp-muted">Nothing here until you name a fruit. The pack follows your discernment, not the answer key.</p>';
      let report = '';
      if (sess.seenReturn && sess.returnKind === 'praise') {
        report = `<div class="camp-report is-praise"><p class="camp-label">Praise report</p><p>${escapeHtml(s.displayName)} came back. What you named actually moved. They are not making you their source.</p></div>`;
      } else if (sess.seenReturn && sess.returnKind === 'worse') {
        report = `<div class="camp-report is-worse"><p class="camp-label">They came back with more</p><p>That didn’t work. ${escapeHtml(s.extraProblems.join(' ') || 'The fruit spread. Others in the room took their side.')}</p></div>`;
      }

      inspect.innerHTML = `
        ${report}
        <h2>${escapeHtml(s.displayName)}${s.faction ? ' · split in the room' : ''}</h2>
        <p class="camp-question">${escapeHtml(s.openingQuestion)}</p>
        <p class="camp-perspective">${escapeHtml(s.perspective)}</p>
        <p class="camp-label">Possible fruits — discern which apply</p>
        <p class="camp-muted">${
          sess.seenReturn
            ? 'These three waited with them. Incorrect names stay until you pick what is actually on them. Then the other two leave. Gold still only shows on a true name.'
            : 'Six names. Three are on them. You name three; those stay named. The other three wait with them until they return after three turns. This round is seven people — it will not keep pulling new names. Click is the only tell: gold around the box if you named what is real. Nothing if you did not.'
        }</p>
        <div class="camp-assign-row">${fruitBtns}</div>
        <p class="camp-label">Generational pack (from what you named)</p>
        ${genBlock}
        <p class="camp-label">Life situation</p>
        <p>${escapeHtml(s.lifeSituation)}</p>
        ${s.extraProblems.length ? `<p class="camp-muted">${escapeHtml(s.extraProblems.join(' '))}</p>` : ''}
        <p class="camp-meters">Willingness toward you ${meter(s.willingnessTowardAdministrator)} · Humility / submission hardness ${meter(s.humilitySubmissionHardness)}</p>
        <p class="camp-muted">${escapeHtml(s.debateVsConfess)}</p>
        <div class="camp-inspect-actions">
          <button type="button" class="btn-accent" id="camp-work-btn">${working ? 'Stop working with' : 'Work with'} ${escapeHtml(s.displayName)}</button>
        </div>
        <p class="camp-label">Answer their question</p>
        <p class="camp-muted">Pick three covering moves. Some agree with the Word. Some agree with this person. Gold and red stay hidden until you pick, and the mix changes with each person. You cannot unpick. Prayer topics stay closed until three fruits and three answers are named.</p>
        <div class="camp-answer-row">${answerBtns}</div>
        ${
          prayersOpen
            ? `<p class="camp-label">Assign prayer topics</p>
        <p class="camp-muted">Assign all three named fruits. The slip stays yellow until three prayers are on the clipboard. Search if you named something else.</p>
        <div class="camp-assign-row">${assignBtns || '<span class="camp-muted">Name a fruit first.</span>'}</div>
        <div class="camp-search-row">
          <input id="camp-topic-search" type="search" maxlength="80" placeholder="Search unique topic title…" autocomplete="off" />
          <div id="camp-topic-hits" class="camp-assign-row"></div>
        </div>`
            : `<p class="camp-label">Assign prayer topics</p>
        <p class="camp-muted">Name three fruits and three answers first. Then the prayer topics open.</p>`
        }
      `;
    },

    async draw() {
      try {
        await this.load();
        if (!this.classroom.length) this.redrawClassroom();
        else this.render();
      } catch (err) {
        const inspect = document.getElementById('camp-inspect');
        if (inspect) inspect.textContent = String(err.message || err);
      }
    },

    bind() {
      const view = document.getElementById('camp-view');
      view?.addEventListener(
        'wheel',
        (event) => {
          event.stopPropagation();
        },
        { capture: true, passive: true }
      );
      document.getElementById('camp-redraw')?.addEventListener('click', () => this.redrawClassroom());
      document.getElementById('camp-size')?.addEventListener('change', (e) => {
        this.size = Number(e.target.value) || 40;
        this.redrawClassroom();
      });
      document.getElementById('camp-clipboard')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-clip-name]');
        if (!btn) return;
        this.selectedName = btn.getAttribute('data-clip-name');
        this.prayerPreview = null;
        this.render();
      });
      document.getElementById('camp-seats')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.camp-seat');
        if (!btn) return;
        const name = btn.getAttribute('data-name');
        this.selectedName = name;
        this.prayerPreview = null;
        this.render();
      });
      document.getElementById('camp-inspect')?.addEventListener('click', (e) => {
        const student = this.studentByName(this.selectedName);
        if (!student) return;
        if (e.target.closest('#camp-work-btn')) {
          this.toggleFocus(student.displayName);
          return;
        }
        const pickBtn = e.target.closest('[data-pick]');
        if (pickBtn) {
          this.togglePick(student, pickBtn.getAttribute('data-pick'));
          return;
        }
        const answerBtn = e.target.closest('[data-answer]');
        if (answerBtn) {
          const answer = this.deckFor(student).find((a) => a.id === answerBtn.getAttribute('data-answer'));
          if (answer) this.applyAnswer(student, answer);
          return;
        }
        const assignBtn = e.target.closest('[data-assign]');
        if (assignBtn) {
          this.assignTopic(student, {
            number: Number(assignBtn.getAttribute('data-assign')),
            name: assignBtn.getAttribute('data-name'),
          });
        }
      });
      document.getElementById('camp-inspect')?.addEventListener('input', (e) => {
        if (e.target.id !== 'camp-topic-search') return;
        const hits = document.getElementById('camp-topic-hits');
        if (!hits) return;
        const found = searchTopics(e.target.value);
        hits.innerHTML = found
          .map(
            (t) =>
              `<button type="button" class="camp-assign-btn" data-assign="${t.number}" data-name="${escapeHtml(t.name)}">#${String(t.number).padStart(3, '0')} ${escapeHtml(t.name)}</button>`
          )
          .join('');
      });
    },
  };

  window.DiscipleshipCamp = Camp;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Camp.bind());
  } else {
    Camp.bind();
  }
})();
