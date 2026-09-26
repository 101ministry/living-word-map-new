(() => {
  'use strict';

  const SET_META = [
    { id: 1, name: 'You and your bloodline', short: 'You' },
    { id: 2, name: 'Start each topic with "On behalf of my spouse\'s bloodline"', short: 'Spouse' },
    { id: 3, name: 'Start each topic with "On behalf of the people in my house"', short: 'House' },
    { id: 4, name: 'Start each topic with "On behalf of every person in my neighborhood and metro"', short: 'Metro' },
    { id: 5, name: 'Start each topic with "On behalf of every person in my city or metropolis"', short: 'City' },
    { id: 6, name: 'Start each topic with "On behalf of every person in my county or parish"', short: 'County' },
    { id: 7, name: 'Start each topic with "On behalf of every person in my state"', short: 'State' },
    { id: 8, name: 'Start each topic with "On behalf of every person in my country"', short: 'Country' },
    { id: 9, name: 'Start each topic with "On behalf of every person in my timezone of countries"', short: 'TZ world' },
    { id: 10, name: 'Start each topic with "On behalf of every person in my continent"', short: 'Continent' },
    { id: 11, name: 'Start each topic with "On behalf of every person in the world"', short: 'World' },
  ];

  const LOCAL_ACCT = 'lwm-video-accounts-v1';
  const LOCAL_SESS = 'lwm-video-session-v1';

  const els = {
    form: document.getElementById('pv-auth-form'),
    fields: document.getElementById('pv-auth-fields'),
    signedWrap: document.getElementById('pv-signed-wrap'),
    signedLine: document.getElementById('pv-signed-line'),
    lead: document.getElementById('pv-auth-lead'),
    status: document.getElementById('pv-status'),
    logout: document.getElementById('pv-logout'),
    view: document.getElementById('pv-view'),
    crumb: document.getElementById('pv-crumb'),
    sectionLead: document.getElementById('pv-section-lead'),
  };

  const state = {
    name: '',
    remote: false,
    catalog: null,
    setId: null,
    videoN: null,
  };

  function accountKey(name) {
    return String(name || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  function bytesToB64(bytes) {
    let bin = '';
    bytes.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin);
  }

  async function hashPassword(name, password) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(String(password || '')),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(`lwm-video-v1:${accountKey(name)}`),
        iterations: 120000,
        hash: 'SHA-256',
      },
      key,
      256,
    );
    return bytesToB64(new Uint8Array(bits));
  }

  function slotCount(setId) {
    return setId <= 3 ? 100 : 34;
  }

  function roundOf(n) {
    if (n >= 1 && n <= 34) return 1;
    if (n >= 35 && n <= 66) return 2;
    if (n >= 67 && n <= 100) return 3;
    return null;
  }

  function lockedCatalog() {
    return SET_META.map((set) => {
      const slots = slotCount(set.id);
      return {
        id: set.id,
        name: set.name,
        short: set.short,
        locked: true,
        videos: Array.from({ length: slots }, (_, i) => {
          const n = i + 1;
          const isBridge = set.id < 11 && n === slots && slots === 34;
          return {
            n,
            round: roundOf(n),
            title: `Video ${String(n).padStart(2, '0')}`,
            role: isBridge ? 'next-set' : 'video',
            nextSet: isBridge ? set.id + 1 : null,
            youtubeId: null,
          };
        }),
      };
    });
  }

  const YOUTUBE_IDS = {
    '1-1': 'v4wEVDFUqD4',
    '1-2': 'MiCbASoOMjE',
    '1-3': '_rBrRF3sexg',
    '1-4': 'W1LEVjlKo08',
    '1-5': 'mgw-W3harTI',
    '1-6': '6ZWSKaOfxjk',
    '1-7': 'M8EKE2MUbkc',
    '1-8': 'KSqcJEYjGvc',
    '1-9': 'vV1b8xfFPqg',
    '1-10': 'GgyzJiULZP8',
    '1-11': '5jOEOVpsKn0',
    '1-12': 'Sj9tzlt2MKQ',
    '1-13': 'MocVZ4nufmM',
    '1-14': 'AEOXKvUj8yo',
    '1-15': 'GNKGbUyUbjo',
    '1-16': 'PiMwpcBgP_E',
    '1-17': 'L5u8JRXbOvY',
    '1-18': '5ncAiLk9fdQ',
    '1-19': 'GiUW3A8roII',
    '1-20': 'mjKW1I0xRhw',
    '1-21': 'TY9aW4hKJF0',
    '1-22': 'yzAIYf6WX5s',
    '1-23': 'Enh_lw0zEUc',
    '1-24': 'SXV-JEfTXbA',
    '1-25': 'ig3wrFFGpzw',
    '1-26': 'HUDihpWJAkE',
    '1-27': 'LG1LNdmXfy4',
    '1-28': 'Uw3L4c8_NE8',
    '1-29': 'PJtVJBLMbFQ',
    '1-30': 'KD2K-5q2QgY',
    '1-31': '1ATfVJLQ9_o',
    '1-32': 'B65mkcnyWG0',
    '1-33': 'wu2HzKyk93o',
    '1-34': 'Mr1oULT7fT0',
    '1-35': 'khHlnPG86ns',
    '1-36': '4qjewE4c9nE',
    '1-37': 'w_p4Jloj1F8',
    '1-38': 'oPS7fIvWBNA',
    '1-39': 'yt4FF0_UMHU',
    '1-40': 'cBEuc34UcTU',
    '1-41': '_Xh6LPTHNbM',
    '1-42': 'tuMBM016eBc',
    '1-43': 'RDxAQCMCAFY',
    '1-44': '3sR7qfu3DOA',
    '1-45': 'PW8ai91oOm0',
    '1-46': 'HzqY_Uf8YVw',
    '1-47': 'ipUYW_M2xUc',
    '1-48': 'YdRKP8qrDGo',
    '1-49': 'JWgIuFMmzWM',
    '1-50': 'rrLo4V6ZmPo',
    '1-51': 'jdljeQaVVYw',
    '1-52': 'iZYHdJ0RzQI',
    '1-53': 'h_IU3e4stss',
    '1-54': 'XOEXybHHJ1M',
    '1-55': 'qg7T0M4L_WA',
    '1-56': '51MW3xs1IY4',
    '1-57': 'y9sd2l2Rq-c',
    '1-58': 'XrMwrcPO04I',
    '1-59': 'jJUYttcM0Xg',
    '1-60': 'q-lhpBMHMro',
    '1-61': 'Jqj3CAnXOic',
    '1-62': 'y8O8KnoavEE',
    '1-63': 'qZSo_044eqY',
    '1-64': 'T4wpqDuL_TQ',
    '1-65': 'HjVWG3hgBu8',
    '1-66': 'EcOLcp3cwhs',
    '1-67': 'Ns5yrd9zatM',
    '1-68': 'TGlkeIn8ebk',
    '1-69': '_KoCwoSWUQ0',
    '1-70': 'Bun7iqFabVI',
    '1-71': 'EMB-mUFDT88',
    '1-72': 'i_v_da1nLYE',
    '1-73': 'qvHZAwkgWhk',
    '1-74': 'u3Jr3cpTFa0',
    '1-75': '9-BWo4PKkLA',
    '1-76': 'xdZJKR31eWY',
    '1-77': 'Bs8i6DqBISs',
    '1-78': 'ilkzUebq-XU',
    '1-79': 'JZkLrAHQ6eY',
    '1-80': '3SkiBwrV5yY',
    '1-81': '5-pOgdX7SBQ',
    '1-82': 'dtPRCVvXesg',
    '1-83': 'wL6_fomtNvE',
    '1-84': 'de_xWkzcR68',
    '1-85': '920-oIh8MNY',
    '1-86': 'LDBUgU1EvnM',
    '1-87': 'uAHwOw0sXwM',
    '1-88': 'CTIdaQtxgmU',
    '1-89': '1EB6m0pd7Rg',
    '1-90': '1Sdi7tK994c',
    '1-91': '2fuVcQuomXs',
    '1-92': 'J412dFY9Gpc',
    '1-93': '2r9OMazS3Tc',
    '1-94': 'HC7YL8lN5rw',
    '1-95': 'tiqONk3NXcc',
    '1-96': 'Jc7o_s3CgcU',
    '1-97': 'W2WDMoyOGfo',
    '1-98': 'th_sAGsLXQY',
    '1-99': 'qfB6UFx08RQ',
    '1-100': 'WBOV3nD43lU',
    '2-1': 'xRE8IqQaQ44',
    '2-2': 'ZWvwSE14wNo',
    '2-3': 'bd5w7fWfxLk',
    '2-4': '8zeBP0VXj70',
    '2-5': '6vvDA-0uEoI',
    '2-6': 'x_0CnoPmgF4',
    '2-7': 'zXyMd7k56lU',
    '2-8': 'ndr5serQ5_E',
    '2-9': 'SXopUKx5o_o',
    '2-10': 'Xhh4QNWJCHA',
    '2-11': '26c0umCVpOM',
    '2-12': 'qFJRGesZrEU',
    '2-13': 'pemEmVBlqFI',
    '2-14': 'pZge5VudrFw',
    '2-15': 'GgsgVd_kebc',
    '2-16': '_29bGTj20e8',
    '2-17': 'k4aH4LIGuFk',
    '2-18': 'u5tJXazWYhI',
    '2-19': 'eVLW3njC3fY',
    '2-20': 'vC3yEDwxGQg',
    '2-21': 'KHfTePNBslY',
    '2-22': 'rQ770HmQHpw',
    '2-23': 'EVKprx9Y1_I',
    '2-24': '7woan5QZPeM',
    '2-25': 'YG9x-onZr08',
    '2-26': 'pR9xEcmlWk0',
    '2-27': '6JozP7qHqvM',
    '2-28': 'mvsFr6VL8J4',
    '2-29': 'E69opIhBmbE',
    '2-30': 'hkfie20NgiU',
    '2-31': 'bTuC5bsyS8E',
    '2-32': 'ltYR0DTZErE',
    '2-33': 'D6anB3lrCB0',
    '2-34': 'OeZath2H6-o',
    '2-35': 'R_ZBbMVfeGQ',
    '2-36': '5sLQ70rR_Qw',
    '2-37': 'Z9puiVoJL_4',
    '2-38': 'dHz-FW2rmTk',
    '2-39': 'aJksnEWbKPU',
    '2-40': 'G6Q2K9sof4I',
    '2-41': 'B6gdXXT7mH0',
    '2-42': 'I1iiKcWiGwU',
    '2-43': 'HB70LFO6l3w',
    '2-44': 'Ge1Wuq9bGyk',
    '2-45': 'iugya6sQrKU',
    '2-46': 'srRiEUEVECU',
    '2-47': 'YSxJVDYZ23o',
    '2-48': 'yRi1-h0TobU',
    '2-49': 'pNIVzbNLHOA',
    '2-50': 'HxjdxDRk318',
    '2-51': 'N4tpICD_r8g',
    '2-52': '8m3hEp_WK48',
    '2-53': 'OuUxx-IX5nQ',
    '2-54': 'XBaHXffKJ2Y',
    '2-55': 'N4cHiju-26o',
    '2-56': 'lajYPnqomJg',
    '2-57': 'FLQWiPtAUA0',
    '2-58': '0J7-_Q7vq8k',
    '2-59': 'Gp53WOqOriM',
    '2-60': 'HoRHMoi77LQ',
    '2-61': 'dWtPhmr9U38',
    '2-62': '0hgqw-o1404',
    '2-63': 'dOX3L6k9mQU',
    '2-64': 'IYXCAxgKsD4',
    '2-65': 'VzUPqubcjvs',
    '2-66': 'JsCHV1KVGyU',
    '2-67': 'Hr4eO39PJhk',
    '2-68': 'n7DiCOfnuME',
    '2-69': 'fbKBMA_Xtjs',
    '2-70': 'KvnPax9eeh4',
    '2-71': 'bzWvK6fbw6U',
    '2-72': 'jreYLWmtDQE',
    '2-73': '132qGupuAXE',
    '2-74': 'gtFY3mfq2uk',
    '2-75': 'fFba7s-1es0',
    '2-76': 'cVkEKIHdOAI',
    '2-77': 'x920SLPGVU0',
    '2-78': 'vEqD7Vg4T4s',
    '2-79': 'Pq1UTNcR5O0',
    '2-80': 'XRIevu1LMLM',
    '2-81': 'dUbM8DHpg8M',
    '2-82': '3OwDDurJfDk',
    '2-83': 'es3zi0jQCbg',
    '2-84': 'oH9S8MZuC0o',
    '2-85': 'BvpW0Oer-7E',
    '2-86': 'fXgsyNsdzX4',
    '2-87': 'PbCgyxBGse8',
    '2-88': 'ijZykkJFzOI',
    '2-89': 'VVdHKUVzq8U',
    '2-90': '4egHjJntTWk',
    '2-91': 'hcrEh27oojw',
    '2-92': '9PoSvMFadvk',
    '2-93': 'MGze7-80x-w',
    '2-94': '2jnS2HAK6vo',
    '2-95': '5VXstuImjCY',
    '2-96': 'Olvn1kjNbzg',
    '2-97': '4kR-rMnfIVc',
    '2-98': 'HTxrfVxhSP4',
    '2-99': 'aL4p_NAtnoY',
    '2-100': '6q3BAL7Iqp4',
    '3-1': 'jy4hFczEgaA',
    '3-2': 'WHoC5butpb0',
    '3-3': '7RftD1C6vJ0',
    '3-4': 'nRr8Y6SPT4c',
    '3-5': '6tK0OZJys8Y',
    '3-6': '7mEr2weQJtQ',
    '3-7': 'dUoRcgqWLJg',
    '3-8': '9x7b0kXZqs4',
    '3-9': '0-Nvrugm2sI',
    '3-10': '9aa6yNp02T4',
    '3-11': 'y13ZIkWPIjo',
    '3-12': 'gNspvkX_oiw',
    '3-13': '6xicay8_ZG0',
    '3-14': 'DEOHvwBjKDk',
    '3-15': 'Kwza-rgX67c',
    '3-16': 'R0nwBPDiqsw',
    '3-17': 'BitDZQIIqO8',
    '3-18': 'cqzSe_npyZ8',
    '3-19': 'iSJf6_LL0VM',
    '3-20': 'b8PHk294mjk',
    '3-21': 'ju9VpeI4TIw',
    '3-22': '5jxLgJkzh20',
    '3-23': 'G0pesMBHLQU',
    '3-24': 'i83_eVFp3vM',
    '3-25': 'ft-l8biP9yU',
    '3-26': 'LRX9TgARm6k',
    '3-27': 'BML_4tguh_A',
    '3-28': '52FQzdJ2aZ8',
    '3-29': 'bnkYhW9oqqo',
    '3-30': 'ZPRH9pc_Kls',
    '3-31': 'bAaadoRAgdw',
    '3-32': 'IBgHy_Uz8YQ',
    '3-33': 'Vivgoos_tDM',
    '3-34': 'gDHHAQnHxOY',
    '3-35': 'Da3v-7ZVSA4',
    '3-36': 'Y5wZzhSsjsc',
    '3-37': 'yT8LWMBzM84',
    '3-38': 'm3q5WH2zpOc',
    '3-39': 'esCP47DKJm0',
    '3-40': 'vQBfwUhROrQ',
    '3-41': 'y7fX8RQIF4o',
    '3-42': 'PoIj2A9TeWU',
    '3-43': 'R6qcI3EXXhI',
    '3-44': 'yEASm4CYqtA',
    '3-45': '4g1L8qA-o5o',
    '3-46': 'itulPtjjUAo',
    '3-47': 'Y35AJDM9xBU',
    '3-48': 'xiBqxGlfEDc',
    '3-49': 'pdTORbUjias',
    '3-50': 'GTCT08RXIFU',
    '3-51': 'W4jl-hDqxHk',
    '3-52': 'cu2-ctjkxx8',
    '3-53': 't5jHnOEAKY0',
    '3-54': 'xQLqkQQDc34',
    '3-55': 'FxIhE6ar4MU',
    '3-56': 'PQ3CDA_spxI',
    '3-57': '1r9AYZwV35Q',
    '3-58': 'YeSQaB3cCkE',
    '3-59': '9eNjzQBWctY',
    '3-60': 'NAONZu9tlzo',
    '3-61': 't-wRraGBYx8',
    '3-62': 'V_-sDqci8R0',
    '3-63': '_OW-k_pmO4c',
    '3-64': '8K2IBiR3o0c',
    '3-65': 'f3nt8Y2g5yg',
    '3-66': '7lrfcFkogXg',
    '3-67': 'y0vkQBuHyyc',
    '3-68': 'a8BLLgHTX2o',
    '3-69': '3TUHIdtrDHg',
    '3-70': 'xfHGO3Hsjbg',
    '3-71': 'gEferZay6d8',
    '3-72': 'YXOAKGbMFeI',
    '3-73': 'itdr8uFmyBo',
    '3-74': '8MeU1XEIC_o',
    '3-75': 'sKXnG9J9Wa0',
    '3-76': 'nJpzFSPv9Iw',
    '3-77': '1oW2f6cInmo',
    '3-78': 'Jl-vXBUNyso',
    '3-79': 'AbvWv1do1Is',
    '3-80': 'KCqsWlGfKkQ',
    '3-81': 'KNOIJS4e2Y0',
    '3-82': 'EguC_9gUsTA',
    '3-83': 'PA-BHoBLZQI',
    '3-84': 'IMRhBJDtri0',
    '3-85': '4N5EL7Ljag8',
    '3-86': '9a-IYeMaIOs',
    '3-87': 'g0goBJFocsg',
    '3-88': 'ndQIuq1zFhs',
    '3-89': 'LdoIOWzMj9M',
    '3-90': 'JmUbGro9g9Y',
    '3-91': 'KuxbiknJxoE',
    '3-92': '7pmxgbkC3S0',
    '3-93': 'Kr9veMSJvAc',
    '3-94': 'xiPhd0yRcPE',
    '3-95': 'd-u5gxj5ZVo',
    '3-96': 'u9TMe_ZZlYU',
    '3-97': '84PiG1HYsmI',
    '3-98': 'XBkrbtvXLpU',
    '3-99': 'ZMLgDoCi3u8',
    '3-100': '9HfdkzNojIA',
  };

  function namedCatalog() {
    return SET_META.map((set) => {
      const slots = slotCount(set.id);
      return {
        id: set.id,
        name: set.name,
        short: set.short,
        locked: false,
        videos: Array.from({ length: slots }, (_, i) => {
          const n = i + 1;
          const isBridge = set.id < 11 && n === slots && slots === 34;
          const youtubeId = YOUTUBE_IDS[`${set.id}-${n}`] || null;
          const round = roundOf(n);
          return {
            n,
            round,
            title: isBridge
              ? `Continue to Set ${set.id + 1}`
              : `Set ${set.id} · Round ${round} · Video ${String(n).padStart(2, '0')}`,
            role: isBridge ? 'next-set' : 'video',
            nextSet: isBridge ? set.id + 1 : null,
            youtubeId,
          };
        }),
      };
    });
  }

  function readLocalAccounts() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_ACCT) || '{}') || {};
    } catch {
      return {};
    }
  }

  function writeLocalAccounts(map) {
    localStorage.setItem(LOCAL_ACCT, JSON.stringify(map));
  }

  function setStatus(msg) {
    if (els.status) els.status.textContent = msg || '';
  }

  function parseHash() {
    const raw = (location.hash || '').replace(/^#/, '');
    const params = new URLSearchParams(raw.includes('=') ? raw : '');
    const setId = Number(params.get('set') || 0) || null;
    const videoN = Number(params.get('video') || 0) || null;
    state.setId = setId >= 1 && setId <= 11 ? setId : null;
    state.videoN = videoN >= 1 && videoN <= 100 ? videoN : null;
  }

  function writeHash() {
    const params = new URLSearchParams();
    if (state.setId) params.set('set', String(state.setId));
    if (state.setId && state.videoN) params.set('video', String(state.videoN));
    const next = params.toString();
    const hash = next ? `#${next}` : '';
    if (location.hash !== hash) history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
  }

  function goSets() {
    state.setId = null;
    state.videoN = null;
    writeHash();
    render();
  }

  function goSet(id) {
    state.setId = id;
    state.videoN = null;
    writeHash();
    render();
  }

  function goVideo(setId, n) {
    const set = (state.catalog || []).find((s) => s.id === setId);
    const vid = set?.videos?.find((v) => v.n === n);
    if (vid?.role === 'next-set' && vid.nextSet) {
      goSet(vid.nextSet);
      return;
    }
    state.setId = setId;
    state.videoN = n;
    writeHash();
    render();
  }

  async function remoteMe() {
    try {
      const res = await fetch('/api/project-videos/me', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.name ? { name: data.name, remote: true } : null;
    } catch {
      return null;
    }
  }

  async function remoteLogin(name, passwordHash) {
    const res = await fetch('/api/project-videos/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, passwordHash }),
    });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) return { ok: false, reason: 'local' };
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, reason: 'auth' };
    if (!res.ok || !data.ok) return { ok: false, reason: 'local' };
    return { ok: true, remote: true };
  }

  async function remoteLogout() {
    try {
      await fetch('/api/project-videos/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
  }

  async function remoteCatalog() {
    try {
      const res = await fetch('/api/project-videos/catalog', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data?.sets) ? data.sets : null;
    } catch {
      return null;
    }
  }

  function localLogin(name, passwordHash) {
    const key = accountKey(name);
    const map = readLocalAccounts();
    if (map[key] && map[key] !== passwordHash) return { ok: false, reason: 'auth' };
    if (!map[key]) map[key] = passwordHash;
    writeLocalAccounts(map);
    localStorage.setItem(LOCAL_SESS, JSON.stringify({ name: name.trim() }));
    return { ok: true, remote: false };
  }

  function localSession() {
    try {
      const rec = JSON.parse(localStorage.getItem(LOCAL_SESS) || 'null');
      return rec?.name ? { name: rec.name, remote: false } : null;
    } catch {
      return null;
    }
  }

  function applyAuth(session) {
    state.name = session?.name || '';
    state.remote = !!session?.remote;
    const in_ = !!state.name;
    els.fields.hidden = in_;
    els.signedWrap.hidden = !in_;
    if (els.form.querySelector('[name=username]')) {
      els.form.querySelector('[name=username]').required = !in_;
    }
    if (els.form.querySelector('[name=password]')) {
      els.form.querySelector('[name=password]').required = !in_;
    }
    els.signedLine.textContent = in_ ? `Signed in as ${state.name}` : '';
    els.lead.textContent = 'Sets below are open. Sets 1–3 are complete through video 100 in each set.';
  }

  async function refreshCatalog() {
    const remote = await remoteCatalog();
    if (remote) {
      state.catalog = remote;
      return;
    }
    state.catalog = namedCatalog();
  }

  function renderCrumb() {
    if (!state.setId) {
      els.crumb.hidden = true;
      els.crumb.innerHTML = '';
      return;
    }
    const set = (state.catalog || []).find((s) => s.id === state.setId);
    const setLabel = `Set ${state.setId}${set?.name && state.name ? ` · ${set.name}` : ''}`;
    els.crumb.hidden = false;
    const bits = [`<button type="button" data-pv="home">All sets</button>`];
    if (state.videoN) {
      bits.push(`<button type="button" data-pv="set">${escapeHtml(setLabel)}</button>`);
      bits.push(`<span>Video ${String(state.videoN).padStart(2, '0')}</span>`);
    } else {
      bits.push(`<span>${escapeHtml(setLabel)}</span>`);
    }
    els.crumb.innerHTML = bits.join('');
    els.crumb.querySelector('[data-pv=home]')?.addEventListener('click', goSets);
    els.crumb.querySelector('[data-pv=set]')?.addEventListener('click', () => goSet(state.setId));
  }

  function renderSectionLead() {
    if (!els.sectionLead) return;
    if (!state.setId) {
      els.sectionLead.textContent =
        'Choose a set. Set 1 is videos 1–100. Set 2 is 101–200. Set 3 is 201–300 (each shown as 1–100 in that set).';
      return;
    }
    if (state.videoN) {
      els.sectionLead.textContent = '';
      return;
    }
    const next =
      state.setId <= 3
        ? ' Round 1 is videos 1–34. Round 2 is 35–66. Round 3 is 67–100.'
        : state.setId < 11
          ? ` Video 34 opens Set ${state.setId + 1}.`
          : ' This is the last set.';
    els.sectionLead.textContent = `Set ${state.setId} of 11.${next}`;
  }

  function setArt(id, name) {
    const n = String(id).padStart(2, '0');
    const alt = escapeHtml(name || `Set ${id}`);
    return `<img src="project-videos/set-${n}.jpg" alt="${alt}">`;
  }

  function renderSets() {
    const sets = state.catalog || lockedCatalog();
    const locked = false;
    els.view.className = 'pv-grid';
    els.view.innerHTML = sets
      .map(
        (set) => `
      <button type="button" class="pv-thumb${locked ? ' is-locked' : ''}" data-set="${set.id}">
        <div class="pv-thumb-art pv-thumb-art--set">${setArt(set.id, set.name)}</div>
        <div class="pv-thumb-body">
          <span class="pv-thumb-kicker">Set ${set.id} of 11</span>
          <span class="pv-thumb-title">${escapeHtml(set.id === 1 ? set.name : `Set ${set.id} · ${set.name}`)}</span>
          <span class="pv-thumb-note">${set.id <= 3 ? '100 videos · three rounds' : set.id < 11 ? '33 videos · 34 opens next set' : '33 videos · last set'}</span>
        </div>
      </button>`,
      )
      .join('');
    els.view.querySelectorAll('[data-set]').forEach((btn) => {
      btn.addEventListener('click', () => goSet(Number(btn.dataset.set)));
    });
  }

  function renderSet(setId) {
    const set = (state.catalog || []).find((s) => s.id === setId);
    if (!set) {
      goSets();
      return;
    }
    els.view.className = 'pv-grid';
    els.view.innerHTML = set.videos
      .map((vid) => {
        const bridge = vid.role === 'next-set';
        const locked = false;
        const ready = !locked && !!vid.youtubeId;
        const label = bridge
          ? `Next · Set ${vid.nextSet}`
          : vid.round
            ? `Round ${vid.round} · Video ${String(vid.n).padStart(2, '0')}`
            : `Video ${String(vid.n).padStart(2, '0')}`;
        const title = locked && !bridge ? `Placeholder ${String(vid.n).padStart(2, '0')}` : vid.title;
        const art = ready
          ? `<img src="https://i.ytimg.com/vi/${encodeURIComponent(vid.youtubeId)}/hqdefault.jpg" alt="">`
          : bridge
            ? '→'
            : String(vid.n);
        return `
      <button type="button" class="pv-thumb${bridge ? ' is-bridge' : ''}${locked ? ' is-locked' : ''}${ready ? ' is-ready' : ''}" data-video="${vid.n}">
        <div class="pv-thumb-art">${art}</div>
        <div class="pv-thumb-body">
          <span class="pv-thumb-kicker">${label}</span>
          <span class="pv-thumb-title">${escapeHtml(title)}</span>
        </div>
      </button>`;
      })
      .join('');
    els.view.querySelectorAll('[data-video]').forEach((btn) => {
      btn.addEventListener('click', () => goVideo(setId, Number(btn.dataset.video)));
    });
  }

  function renderPlayer(setId, videoN) {
    const set = (state.catalog || []).find((s) => s.id === setId);
    const vid = set?.videos?.find((v) => v.n === videoN);
    if (!vid) {
      goSet(setId);
      return;
    }
    els.view.className = 'pv-player-wrap';
    if (vid.youtubeId) {
      const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid.youtubeId)}?rel=0`;
      els.view.innerHTML = `
        <div class="pv-stage"><iframe src="${src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${escapeHtml(vid.title)}"></iframe></div>
        <p class="pv-placeholder-copy"><strong>${escapeHtml(vid.title)}</strong>Set ${setId} · ${escapeHtml(set.name)}${vid.round ? ` · Round ${vid.round}` : ''}</p>`;
      return;
    }
    els.view.innerHTML = `
      <div class="pv-stage">
        <div class="pv-placeholder-copy">
          <strong>${escapeHtml(vid.title)}</strong>
          This slot is ready for the Unlisted teaching upload. After the video ID is attached, it plays here.
        </div>
      </div>`;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render() {
    renderCrumb();
    renderSectionLead();
    if (!state.setId) renderSets();
    else if (!state.videoN) renderSet(state.setId);
    else renderPlayer(state.setId, state.videoN);
  }

  els.form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.name) return;
    const fd = new FormData(els.form);
    const name = String(fd.get('username') || '').trim();
    const password = String(fd.get('password') || '');
    if (name.length < 2) {
      setStatus('Username needs at least two characters.');
      return;
    }
    if (password.length < 6) {
      setStatus('Password needs at least six characters.');
      return;
    }
    setStatus('Opening…');
    const passwordHash = await hashPassword(name, password);
    let result;
    try {
      result = await remoteLogin(name, passwordHash);
    } catch {
      result = { ok: false, reason: 'local' };
    }
    if (result.reason === 'auth') {
      setStatus('That username already has a different password.');
      return;
    }
    if (!result.ok) result = localLogin(name, passwordHash);
    if (!result.ok) {
      setStatus('That username already has a different password.');
      return;
    }
    applyAuth({ name, remote: !!result.remote });
    setStatus(result.remote ? 'Signed in. Placeholders now show the real set pages.' : 'Signed in on this device. Placeholders now show the real set pages.');
    els.form.reset();
    await refreshCatalog();
    parseHash();
    render();
  });

  els.logout?.addEventListener('click', async () => {
    if (state.remote) await remoteLogout();
    try {
      localStorage.removeItem(LOCAL_SESS);
    } catch {
      /* ignore */
    }
    applyAuth(null);
    setStatus('Signed out. Placeholders are showing again.');
    await refreshCatalog();
    goSets();
  });

  window.addEventListener('hashchange', () => {
    parseHash();
    render();
  });

  (async function init() {
    applyAuth({ name: 'open', remote: false });
    if (els.form) els.form.hidden = true;
    if (els.signedWrap) els.signedWrap.hidden = true;
    await refreshCatalog();
    parseHash();
    render();
  })();
})();
