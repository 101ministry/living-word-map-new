(() => {
  'use strict';

  const ROOT_EMOJI = {
    'loneliness and emotional brokenness': '🟤',
    'deception and falsehood': '🟣',
    'idolatry and person-worship': '⭕',
    'idolatry and person worship': '⭕',
    'idolatry and self-worship': '⭕',
    'pride and self-exaltation': '🔴',
    'pride and self exaltation': '🔴',
    'control and rebellion': '🔵',
    'bitterness and unforgiveness': '🟢',
    'addiction and bondage': '⚪',
    'unbelief and distrust of god': '🟡',
    'shame and false identity': '🩷',
    'covetousness and materialism': '⚫',
    'fear and insecurity': '🟠',
  };

  const ROOT_EMOJI_RE = /🟤|🟣|⭕|🔴|🔵|🟢|⚪|🟡|🩷|⚫|🟠/;

  function rootKey(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/person worship/g, 'person-worship')
      .replace(/self exaltation/g, 'self-exaltation')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatRootDisplay(raw) {
    const text = String(raw || '').trim();
    if (!text) return '';
    if (ROOT_EMOJI_RE.test(text)) return text;
    const key = rootKey(text);
    const emoji = ROOT_EMOJI[key];
    return emoji ? `${emoji} ${text}` : text;
  }

  window.LwmTaxonomyEmoji = { formatRootDisplay };
})();
