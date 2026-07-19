# Living Word Map

Interactive graph of **26 Principalities**, **Roots**, **Fruits**, and **666 topics** — with character voices, manifestations, and multi-language prayers.

**Open the map:** [https://living-word-map.norm-f37.workers.dev/](https://living-word-map.norm-f37.workers.dev/)

---

## Features

- **Constellation view** — Principalities on an outer ring; click to explore
- **Explore All** — full graph of roots, fruits, topics, and connections
- **Detail panel** — character, voice quotes, core themes, manifestations, linked topics
- **Compare** — side-by-side view of up to 3 Principalities
- **Prayers** — Core Prayer of Freedom and per-topic prayers (multiple languages)
- **Search & filters** — find nodes by name; toggle layers on/off

---

## Local development

**Requirements:** Windows, PowerShell, modern browser (Brave works well over `http://localhost`).

| Command | What it does |
|---------|----------------|
| `open.bat` | Rebuilds data + prayers, starts server, opens browser |
| `restart-server.bat` | Restarts server only (no rebuild) |

Local URL: **http://localhost:8765/index.html**

Leave the minimized **Living Word Map Server** window running while you use the site.

---

## Project layout

| Path | Purpose |
|------|---------|
| `public/` | Static site — **this folder is deployed to the web** |
| `data/` | Source charts, principality memberships, Strong's anchors |
| `scripts/` | PowerShell build, serve, and report scripts |
| `.cursor/rules/` | Cursor agent rules (character voice development) |

---

## Rebuilding data

```powershell
powershell -File scripts\build-data.ps1    # → public\data.js
powershell -File scripts\build-prayers.ps1 # → public\prayers\
```

**Source files in `data/`:**

- `ROOT-SPIRITS-CHART.txt` — roots & fruits taxonomy
- `PRINCIPALITY-MEMBERSHIPS.txt` — principality ↔ topic labels (additive)
- `PRINCIPALITY-STRONGS.txt` — Greek/Hebrew Strong's anchors for character voices
- `COMPILED-PRAYERS-ROUND1.txt` — prayer source text

Some build inputs (Obsidian lore, transcripts, `topics 666.txt`) may still live outside this repo until fully copied into `data/`.

---

## Deployment

- **Repository:** [github.com/repentance101/living-word-map](https://github.com/repentance101/living-word-map) (private)
- **Live site:** [living-word-map.norm-f37.workers.dev](https://living-word-map.norm-f37.workers.dev/)
- **Host:** Cloudflare — output directory `public`, no build command (pre-built artifacts in repo)
- Push to `main` → redeploy automatically

---

## Work in progress

- Strong's-based character voices from `PRINCIPALITY-STRONGS.txt` (build pipeline pending)
- In-app conversational character mode — not yet; voices are pre-written statements today
- Topic/principality coverage gaps — run `scripts\report-principalities.ps1` for a current report

---

## Reports (optional)

```powershell
powershell -File scripts\report-principalities.ps1 -Detail
powershell -File scripts\report-voices.ps1
```
