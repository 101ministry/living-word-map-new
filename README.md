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
- `TOPICS-666.txt` — all 666 topics with root/fruit/principality metadata (canonical; synced to Telegram Desktop by `fix-topics666-fruits.ps1`)
- `TOPICS-666-PRESENTATION.txt` — teaching presentation order
- `PRINCIPALITY-MEMBERSHIPS.txt` — principality ↔ topic labels (additive)
- `PRINCIPALITY-STRONGS.txt` — Greek/Hebrew Strong's anchors for character voices
- `COMPILED-PRAYERS-ROUND1.txt` — prayer source text

Some build inputs (Obsidian lore, transcripts) may still live outside this repo until fully copied into `data/`.

---

## Deployment

- **Repository:** [github.com/repentance101/living-word-map](https://github.com/repentance101/living-word-map) (private)
- **Live site:** [living-word-map.norm-f37.workers.dev](https://living-word-map.norm-f37.workers.dev/)
- **Host:** Cloudflare Worker serves `public/` static assets and `POST /api/cal-booking` for Cal.com webhooks
- Push to `main` → GitHub Action runs `wrangler deploy` (requires secrets below)

### Cal.com webhook URL

```
https://living-word-map.norm-f37.workers.dev/api/cal-booking
```

Ping test should return **200** once the Worker is deployed. Real bookings email **norm@repentance101.com** when `RESEND_API_KEY` is set.

### One-time Cloudflare setup

1. **Disable** any older Cloudflare “static assets only” Git integration for this repo (avoid double deploys).
2. GitHub repo → **Settings → Secrets → Actions**:
   - `CLOUDFLARE_API_TOKEN` — Workers edit permission
   - `CLOUDFLARE_ACCOUNT_ID`
3. Worker secrets (Cloudflare dashboard or CLI):

```powershell
npm install
npx wrangler login
npx wrangler secret put RESEND_API_KEY    # from resend.com — enables booking emails
npx wrangler secret put CAL_WEBHOOK_SECRET  # optional — same string as Cal.com webhook Secret
```

4. Verify domain in [Resend](https://resend.com) for `notifications@repentance101.com` (or change `RESEND_FROM` in `wrangler.toml`).

Local Worker dev: `npm run dev` → http://localhost:8787

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
