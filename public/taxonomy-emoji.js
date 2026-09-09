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
    // Strip a leading emoji or mojibake (UTF-8 misread as Latin-1, e.g. ðŸŸ£ for 🟣).
    const plain = text.replace(/^[^A-Za-z]+/, '').replace(/\s+/g, ' ').trim();
    if (!plain) return text;
    const emoji = ROOT_EMOJI[rootKey(plain)];
    if (emoji) return `${emoji} ${plain}`;
    if (ROOT_EMOJI_RE.test(text)) return text;
    return plain;
  }

  window.LwmTaxonomyEmoji = { formatRootDisplay };
})();
