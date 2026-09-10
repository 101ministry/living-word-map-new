(function (root) {
  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function replacePhrase(text, phrase, label) {
    if (!phrase) return text;
    return text.replace(new RegExp(escapeRe(phrase), 'gi'), label);
  }

  function slotReplace(text, phrase, label) {
    const pe = escapeRe(phrase);
    let out = text;
    out = out.replace(
      new RegExp(`(guilty of (?:allowing scenarios of )?)(${pe})( from a root)`, 'gi'),
      `$1${label}$3`
    );
    out = out.replace(
      new RegExp(`(I recognize that )(${pe})( with the root)`, 'gi'),
      `$1${label}$3`
    );
    out = out.replace(
      new RegExp(`(no longer want to serve )(${pe})`, 'gi'),
      `$1${label}`
    );
    return out;
  }

  function alignPrayerTopicToTitle(text, label) {
    if (!text || !label) return text || '';
    const m = String(text).match(/guilty of (?:allowing scenarios of )?(.+?) from a root/i);
    if (!m) return text;
    const phrase = m[1].trim();
    if (!phrase) return text;
    const variants = [phrase];
    const stripped = phrase.replace(/^(interacting with(?: the spirit of)?|familiar identity of)\s+/i, '').trim();
    if (stripped && stripped.toLowerCase() !== phrase.toLowerCase()) variants.push(stripped);
    if (label.toLowerCase() !== phrase.toLowerCase()) variants.push(label.toLowerCase());
    variants.sort((a, b) => b.length - a.length);
    let out = text;
    const seen = new Set();
    variants.forEach(p => {
      const key = p.toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      if (p.length >= 10 || /\s/.test(p)) out = replacePhrase(out, p, label);
      else out = slotReplace(out, p, label);
    });
    return out;
  }

  function honorificFatherYou(text) {
    return String(text || '')
      .replace(/Father, I ask that you\b/g, 'Father, I ask that You')
      .replace(/I thank you for\b/g, 'I thank You for')
      .replace(/\bdiscipline you have put\b/g, 'discipline You have put');
  }

  function isEnglishLang(code) {
    const lang = String(code || 'en').toLowerCase();
    return lang === 'en' || lang.startsWith('en-');
  }

  root.LwmAlignPrayerTopicTitle = alignPrayerTopicToTitle;
  root.LwmAlignPrayerTopicTitleIfEnglish = function (text, label, lang) {
    if (!isEnglishLang(lang)) return text || '';
    return honorificFatherYou(alignPrayerTopicToTitle(text, label));
  };
})(typeof window !== 'undefined' ? window : globalThis);
