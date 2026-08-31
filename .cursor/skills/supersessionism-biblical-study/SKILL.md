---
name: supersessionism-biblical-study
description: Part 4 biblical study — supersessionism / replacement theology vs scriptures showing Gentiles grafted into Israel (Romans 11, covenant passages). Use for SUPERSESSIONISM-* files, replacement vs grafting passage lists, or landscape study PDFs — not for deportation Parts 1–3 or word-map UI.
disable-model-invocation: true
---

# Supersessionism Biblical Study (Part 4)

Separate from deportation Parts 1–3 (`DEPORTATION-BIBLICAL-STUDY.pdf`) and from Living Word Map graph/prayers.

## Artifacts

| File | Purpose |
|------|---------|
| `data/SUPERSESSIONISM-BIBLICAL-STUDY.pdf` | Landscape PDF — replacement passages first, then grafting |
| `data/SUPERSESSIONISM-BIBLICAL-STUDY.html` | HTML source |
| `scripts/build-supersessionism-study-pdf.ps1` | Fetches full ESV via api.midvash.com, builds PDF |

Rebuild:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/build-supersessionism-study-pdf.ps1"
```

## Layout

- Side-by-side index at top (~19 replacement vs ~45+ grafting passages)
- **Section A**: all replacement-theology passages (full ESV + commentary)
- **Section B**: all grafting/covenant passages (full ESV + commentary)
- `@page { size: landscape; }`

## Key argument

Replacement list is shorter and mostly inferential; grafting/covenant list is longer and more explicit (Romans 11 anchor).
