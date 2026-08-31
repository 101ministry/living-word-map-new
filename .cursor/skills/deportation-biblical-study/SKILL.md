---
name: deportation-biblical-study
description: Biblical study on deportation, exile, expulsion, sojourners, and covenant separation — PDF/podcast/BLB commentary work. Use when the user asks about deportation from a biblical perspective, Parts 1–3 deportation study (single PDF), sojourner vs nations of the land, or files DEPORTATION-* — not for Living Word Map graph/UI or 666 topical prayers unless explicitly linked.
disable-model-invocation: true
---

# Deportation Biblical Study (separate from Living Word Map)

This skill scopes **Parts 1–3: biblical perspective on deportation** (one PDF). Do not mix in word-map graph mechanics, principality voices, or 666 prayer translation unless the user explicitly connects them.

## Series numbering (all six parts)

| Part | Artifact | Notes |
|------|----------|-------|
| **1–3** | `data/DEPORTATION-BIBLICAL-STUDY.pdf` | Single portrait PDF — three internal sections (see below) |
| **4** | `data/SUPERSESSIONISM-BIBLICAL-STUDY.pdf` | Supersessionism — skill `supersessionism-biblical-study` |
| **5** | `data/DEPORTATION-STATUTES-COMPARATIVE-STUDY.pdf` | 30-country statutes comparison |
| **6** | `data/CARM-PART6-STUDY.pdf` | CARM religions, discipleship, slavery, Midianites |

## Primary artifacts (Parts 1–3 + related)

| File | Purpose |
|------|---------|
| `data/DEPORTATION-BIBLICAL-STUDY.pdf` | Parts 1–3 portrait study PDF (ESV paragraph context) |
| `data/DEPORTATION-BIBLICAL-STUDY.html` | HTML source for PDF |
| `data/DEPORTATION-BIBLICAL-PODCAST.txt` | Two-host podcast script |
| `data/DEPORTATION-BLB-INDEX.txt` | Passage index with BLB links |
| `data/BIBLE-TEACHERS-GOVERNMENT-OBEDIENCE.txt` | Appendix A: Rom 13 civil obedience (A/B/unclear) |
| `data/DEPORTATION-STATUTES-COMPARATIVE-STUDY.pdf` | **Part 5** — 30 countries vs biblical statutes |
| `data/DEPORTATION-STATUTES-COUNTRIES.json` | Part 5 country data (religion, statutes, axis scores) |
| `scripts/build-deportation-statutes-comparative.ps1` | Regenerate Part 5 HTML + PDF |
| `data/CARM-PART6-STUDY.pdf` | **Part 6** — CARM religions, discipleship, slavery, Midianites |
| `data/CARM-PART6-MANIFEST.json` | Part 6 URL manifest and section structure |
| `scripts/build-carm-part6-study-pdf.ps1` | Regenerate Part 6 HTML + PDF |

Rebuild:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/build-deportation-study-pdf.ps1"
```

## Study structure (Parts 1–3 inside one PDF)

1. **Part 1 — Law of the land** — governing authority, obedience (Gen 9, Exo 18–23, Deut, etc.)
2. **Part 2 — Love of Christ / neighbor** — Lev 19:33–34, Matthew 25, Romans 12–13, 1 John 4
3. **Part 3 — Deportation, expulsion, exile, covenant separation** — Gen 3, Deut 28, Ezra 10, OT distinction

## OT framework (critical)

Distinguish **sojourner (`ger`)** — landless resident under Israel's law, mercy commanded — from **nations of the land** — established territories with their own gods; Israel was to drive out Canaanite worship, not erase the ger category.

Gods/cults table and gold "OT distinction" boxes belong in Parts 1–3, not in Part 4 (supersessionism).

## Commentary conventions

- **ESV** in paragraph context; target verses in **bold**
- **Blue Letter Bible**: MacArthur intro (select books), Chuck Smith C2000 (every entry), Matthew Henry (selective excerpts)
- C2000 URL quirks: Exodus folder = `Exd`; some chapters use block-start chapter numbers (see `$script:C2000Block` in build script)
- Fix mojibake with `Normalize-UnicodeText()` — use `.Replace()`, not regex that strips spaces

## Related but separate

- **Supersessionism Part 4** → use skill `supersessionism-biblical-study` and `scripts/build-supersessionism-study-pdf.ps1` (landscape, side-by-side lists)
- **Living Word Map app** → use skill `living-word-map`

## Agent behavior

- Stay on deportation / exile / sojourner / covenant separation / governing authority unless user widens scope
- Prefer editing deportation artifacts and build script over unrelated `public/` changes
- Do not apply Principality character-voice (`[[char]]`) rule unless user invokes character mode
