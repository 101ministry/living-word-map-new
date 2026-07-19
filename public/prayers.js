(() => {
  function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* Brave/file:// may block storage */ }
  }

  const PACK_GLOBALS = {
    en: 'PRAYER_EN', zh: 'PRAYER_ZH', hi: 'PRAYER_HI', es: 'PRAYER_ES', ar: 'PRAYER_AR',
    fr: 'PRAYER_FR', bn: 'PRAYER_BN', pt: 'PRAYER_PT', ru: 'PRAYER_RU', ur: 'PRAYER_UR',
    id: 'PRAYER_ID', de: 'PRAYER_DE', ja: 'PRAYER_JA', sw: 'PRAYER_SW', ko: 'PRAYER_KO',
  };

  window.PrayerLibrary = {
    catalog: null,
    cache: {},
    loadedScripts: new Set(['en']),
    currentLang: safeStorageGet('lwm-language') || 'en',

    packFromWindow(code) {
      const key = PACK_GLOBALS[code];
      return key && window[key] ? window[key] : null;
    },

    loadScript(code) {
      if (this.loadedScripts.has(code)) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `prayers/${code}.js`;
        script.onload = () => {
          this.loadedScripts.add(code);
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load prayers/${code}.js`));
        document.head.appendChild(script);
      });
    },

    async init() {
      if (window.LANGUAGE_CATALOG) {
        this.catalog = window.LANGUAGE_CATALOG;
      } else {
        const res = await fetch('languages.json');
        this.catalog = await res.json();
      }
      if (this.catalog?.languages?.value && !Array.isArray(this.catalog.languages)) {
        this.catalog.languages = this.catalog.languages.value;
      }
      this.currentLang = safeStorageGet('lwm-language') || this.catalog.defaultLanguage || 'en';
      if (!this.packFromWindow('en')) {
        await this.loadScript('en');
      }
      return this.catalog;
    },

    setLanguage(code) {
      this.currentLang = code;
      safeStorageSet('lwm-language', code);
      delete this.cache[code];
    },

    isRtl(code) {
      const lang = this.catalog?.languages?.find(l => l.code === code);
      return lang?.rtl === true;
    },

    isComplete(code) {
      const lang = this.catalog?.languages?.find(l => l.code === code);
      return lang?.complete === true;
    },

    uiString(key, lang = this.currentLang) {
      const en = this.catalog?.ui?.en || {};
      const localized = this.catalog?.ui?.[lang] || {};
      return localized[key] || en[key] || key;
    },

    languageMeta(code = this.currentLang) {
      return this.catalog?.languages?.find(l => l.code === code) || null;
    },

    async loadLanguage(code) {
      if (this.cache[code]) return this.cache[code];

      let data = this.packFromWindow(code);
      if (!data) {
        await this.loadScript(code);
        data = this.packFromWindow(code);
      }
      if (!data) {
        const res = await fetch(`prayers/${code}.json`);
        if (res.ok) data = await res.json();
      }
      if (!data) throw new Error(`Prayers not found: ${code}`);

      this.cache[code] = data;
      return data;
    },

    async getTopicPrayer(topicNumber, lang = this.currentLang) {
      const num = String(topicNumber);
      const prayerNum = String(window.PRAYER_INDEX?.[num] ?? topicNumber);
      let data = await this.loadLanguage(lang);
      let prayer = data.topics?.[prayerNum] || data.topics?.[topicNumber];

      if (!prayer && lang !== 'en') {
        data = await this.loadLanguage('en');
        prayer = data.topics?.[prayerNum];
        if (prayer) {
          return { ...prayer, fallback: true, requestedLang: lang };
        }
      }
      return prayer ? { ...prayer, fallback: false, requestedLang: lang } : null;
    },

    async getCorePrayer(lang = this.currentLang) {
      let data = await this.loadLanguage(lang);
      if (data.corePrayer?.text) {
        return { ...data.corePrayer, fallback: false, requestedLang: lang };
      }
      if (lang !== 'en') {
        data = await this.loadLanguage('en');
        if (data.corePrayer?.text) {
          return { ...data.corePrayer, fallback: true, requestedLang: lang };
        }
      }
      return null;
    },

    audioPath(topicNumber, lang = this.currentLang) {
      const num = String(window.PRAYER_INDEX?.[String(topicNumber)] ?? topicNumber).padStart(3, '0');
      return `audio/${lang}/${num}.mp3`;
    },

    coreAudioPath(lang = this.currentLang) {
      return `audio/${lang}/core.mp3`;
    },
  };
})();
