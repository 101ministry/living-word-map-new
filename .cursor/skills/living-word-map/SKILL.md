---
name: living-word-map
description: Living Word Map web app — 666 topics, principalities graph, globe view, multilingual prayers, teaching videos. Use for public/, graph data, prayers, filters, mobile UI — not for deportation or supersessionism biblical study PDFs unless the user explicitly links them.
disable-model-invocation: true
---

# Living Word Map (app & content)

Interactive site: 26 Principalities, Roots, Fruits, **666 topics**, prayers in multiple languages.

## Scope

- `public/` — deployed static site (`app.js`, `index.html`, `styles.css`, `globe-view.js`, `prayers/`)
- `data/` — charts, Strong's anchors, translations, teaching videos, **canonical topic metadata**
- `scripts/build-*.ps1` — data and prayer generation

Local dev: `open.bat` → http://localhost:8765/index.html

## Query routing (keep chats separated)

| Chat | Use for |
|------|---------|
| **Living Word Map queries** | App, globe, deploy, topics 666, roots/fruits, prayers, teaching videos |
| **R&R Thumbnail Images** | Day-series poster/thumbnail image generation only |

Archive of past LWM questions: `data/LIVING-WORD-MAP-QUERIES.md`

## Canonical data files (repo-local — do not use Telegram Desktop paths)

| File | Purpose |
|------|---------|
| `data/TOPICS-666.txt` | All 666 topics with root/fruit/principality metadata and emoji markers |
| `data/TOPICS-666-PRESENTATION.txt` | Teaching presentation order (days 1–13) |
| `data/ROOT-SPIRITS-CHART.txt` | Chart labels 001–666 |
| `data/PRINCIPALITY-MEMBERSHIPS.txt` | Additive principality ↔ topic memberships |

After editing topic metadata, run:

```powershell
powershell -File scripts\sync-prayers-from-topics666.ps1  # root + recognize lines → COMPILED-PRAYERS
powershell -File scripts\fix-topics666-fruits.ps1       # emoji + range fixes, syncs Telegram copy
powershell -File scripts\build-data.ps1                 # → public\data.js
powershell -File scripts\build-prayers.ps1              # → public\prayers\
```

## Fruit emoji key (topics 666.txt)

| Emoji | Fruit |
|-------|-------|
| 🟩 | Occultism and Counterfeit Spirituality (one fruit, not two) |
| 🟦🟩 | False Religion and Doctrinal Error (blue/green — replaces False Religion and Occultism) |
| ⛔️ | Destructive Attitudes Against God's Image — topics **391–442** |
| ❔ | Destructive Identities Against God's Image — topics **443–573** |
| 🟧🟩⬛ | Spirit Spouse trio (Sexual Corruption / Counterfeit Spirituality / Confusing Preferences) — topics **574–666**, parent **Spirit Spouse Gods** |

**#130 Being In Witchcraft** → 🟩 Occultism and Counterfeit Spirituality, parent **Divination** (not Spirit Spouse; not #664).

## Prayers & audio

- Text: `public/prayers/{lang}.json` (from `data/translations/`)
- Audio convention: `public/audio/{lang}/core.mp3` and `public/audio/{lang}/001.mp3` … `663.mp3`
- Languages in `public/languages.json` (currently 15 codes: en, zh, hi, es, ar, fr, bn, pt, ru, ur, id, de, ja, sw, ko)

## Separate study agents (do not conflate)

| Topic | Skill |
|-------|-------|
| Deportation biblical study Part 1 | `deportation-biblical-study` |
| Supersessionism study Part 2 | `supersessionism-biblical-study` |

## Character voices

Principality `[[char]]` voice rule applies only when user invokes character/principality chat — not for routine bugfixes or CSS.
