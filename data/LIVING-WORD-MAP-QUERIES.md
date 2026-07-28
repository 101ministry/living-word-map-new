# Living Word Map — query log

Archived from mixed chats so **Living Word Map** work stays in this repo and out of the **R&R thumbnail / series screenshot** chat.

Use the **Living Word Map queries** Cursor chat (or this file + `living-word-map` skill) for app, data, globe, deploy, and taxonomy questions.  
Use the **R&R Thumbnail Images** chat only for Day-series poster/thumbnail image generation.

---

## 2026-07-26 — Globe view (implemented & deployed)

| Date | Query | Status |
|------|-------|--------|
| Jul 26 | Restart local server to reveal globe map (`scripts/serve.ps1`, port 8765) | Done |
| Jul 26 | Country transport: fruits must not overlap; fully visible fruit grid | Done |
| Jul 26 | Replace blank-space close with vertical blue bar + “Close” beside topic map (fixed, not panned) | Done |
| Jul 26 | Each principality country on globe should have a distinct silhouette | Done |
| Jul 26 | Night-sky background; ocean between countries = deep blue-black (IP-safe, not iStock) | Done |
| Jul 26 | **Globe only:** tap fruit metro → detail moves to center; teaching videos + chapters on right; nav “← Country map” / “← Globe view” | Done |
| Jul 26 | Push globe view to live (`main` → Cloudflare) | Done — commit `00417c2` |
| Jul 26 | **Mobile:** disable left legend panel in Globe View; re-enable when returning to Constellation | Done (local; not yet pushed at archive time) |

---

## 2026-07-26 — App distribution (informational)

| Date | Query | Status |
|------|-------|--------|
| Jul 26 | Options to publish live site to Google Play / Apple App Store (PWA, Capacitor, etc.) | Answered — no code change |

---

## 2026-07-28 — Taxonomy audit

| Date | Query | Status |
|------|-------|--------|
| Jul 28 | Full list of **Roots** and **Fruits** in the map (user found fewer named than expected) | Answered — **11 Roots**, **17 Fruits** in `public/data.js` (~11 canonical fruit families in color legend). See summary below. |

### Roots (11)

1. addiction and bondage  
2. bitterness and unforgiveness  
3. control and rebellion  
4. covetousness and materialism  
5. deception and falsehood  
6. fear and insecurity  
7. idolatry and person-worship  
8. loneliness and emotional brokenness  
9. pride and self-exaltation  
10. shame and false identity  
11. unbelief and distrust of God  

### Fruits (17 in graph)

1. Abuse and Exploitation of Others  
2. Anger and Violence  
3. Anti-Christ Spirit / Separation From God  
4. Anti-Christ Spirit or Separation from God *(duplicate label — merge candidate)*  
5. Confusing Preferences with Stewardship  
6. Counterfeit Spirituality  
7. Death and Self-Destruction  
8. Destructive Attitudes Against God's Image  
9. Division and Relational Destruction  
10. False Religion and Doctrinal Error  
11. False Religion and Occultism *(legacy — merge candidate)*  
12. Human and Hybrid DNA  
13. Mental Oppression and Confusion  
14. Neglect and Lack of Stewardship  
15. Occultism and Counterfeit Spirituality  
16. Physical Weakness and Infirmity  
17. Sexual Corruption  

---

## Related work in other chats (already in repo)

Topic fruit emoji / range fixes (#130, #391–442, #443–573, #574–666) were handled in a separate **Living Word Map queries** session — see `data/TOPICS-666.txt`, `scripts/fix-topics666-fruits.ps1`, and `.cursor/skills/living-word-map/SKILL.md`.

---

## Not in scope for this log (thumbnail chat only)

- R&R Day-series poster / card-table image generation  
- Reference-image series style matching  
- Save path: `C:\Users\tweed\Downloads\Documents\redemption\series screenshots` (`day 1.png` … `day 19.png`)
