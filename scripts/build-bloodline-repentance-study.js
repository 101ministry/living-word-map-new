#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CLAUSES = pyToValue(
  fs.readFileSync(path.join(__dirname, "_bloodline_repentance_clauses.py"), "utf8"),
  "CLAUSES"
);
const CANON = pyToValue(
  fs.readFileSync(path.join(__dirname, "_bloodline_repentance_canon.py"), "utf8"),
  "CANON"
);

const TITLE = "Why is Bloodline Repentance blessed by God according to the Bible?";
const OUT_DATA = path.join(ROOT, "data", "WHY-BLOODLINE-REPENTANCE-BLESSED.html");
const OUT_PUBLIC = path.join(ROOT, "public", "why-bloodline-repentance.html");
const OUT_PAGE1 = path.join(ROOT, "data", "WHY-BLOODLINE-REPENTANCE-BLESSED-page1.html");

const INTRO_PARAS = [
  "God blesses bloodline repentance because He already attached His mercy, His covenant, His Spirit, and the Blood of Jesus to a people and their children — not only to a private moment. The Core Prayer and Rounds 1–3 do not invent a new religion. They speak what Scripture already commands: confess, including the iniquity of the fathers; forgive as you have been forgiven; remit rather than retain; lay the life and the line on His altar; let the Blood cover the record and speak instead.",
  "Round 1 agrees “I,” then lays mother’s side and father’s side all the way back to Adam. Round 2 speaks “WE” for the 2nd–5th generations and lays the bloodline on the altar. Round 3 speaks “WE” for the 6th–20th. That movement follows the Bible’s own range: iniquity visited to the third and fourth, and mercy kept for thousands of generations of them that love Him.",
  "This study lists how each prayer line is underwritten, then lists connecting passages from Genesis through Revelation. It is a warrant list, not a claim that every verse is only about family curses. Each entry is here because it bears on representative confession, copied masters, records, children, covenant, remission, or the accuser’s case.",
];

const HOW_GOD_BLESSES = [
  ["He names mercy to children and to thousands of generations", "Ex 20:5-6; Ex 34:6-7; Deut 7:9; Ps 103:17-18; Luke 1:50"],
  ["He invites a living mouth to confess the iniquity of the fathers", "Lev 26:40-42; Neh 1:6; Neh 9:2; Ezra 9; Dan 9:4-19; Ps 106:6; Jer 14:20"],
  ["He cuts covenant with those standing here and those not here this day", "Deut 29:14-15; Acts 2:39"],
  ["He sends the Spirit for remission, and attaches the promise to children and the afar off", "John 20:21-23; Acts 2:38-40"],
  ["He Himself contends and saves the children from the mighty", "Isa 49:24-26; Isa 59:21; Col 2:14-15"],
  ["He turns fathers’ hearts to children so the land is not struck", "Mal 4:5-6; Luke 1:17"],
];

function pyToValue(src, assignName) {
  let s = src.replace(/^\s*#.*$/gm, "").replace(/\r\n/g, "\n");
  s = s.replace(new RegExp("^" + assignName + "\\s*=\\s*", "m"), "return ");
  s = s.replace(/\("((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\)/g, '["$1", "$2"]');
  s = s.replace(/\("((?:\\.|[^"\\])*)"\s*,\s*\[/g, '["$1", [');
  s = s.replace(/\]\),/g, "]],");
  s = s.replace(/\]\)\s*\]/g, "]] ]");
  // eslint-disable-next-line no-new-func
  return Function(s)();
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clauseCount() {
  return CLAUSES.reduce((n, c) => n + c.refs.length, 0);
}

function canonCount() {
  return CANON.reduce((n, pair) => n + pair[1].length, 0);
}

function css() {
  return `
:root {
  --ink: #1c1410;
  --muted: #5c4a3a;
  --rule: #c4a574;
  --paper: #f7f0e4;
  --card: #efe4d0;
  --accent: #6b3a22;
  --link: #4a2c14;
}
@page { size: letter; margin: 0.65in 0.7in; }
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: var(--paper); color: var(--ink);
  font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
  font-size: 10.5pt; line-height: 1.45;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.site-nav {
  position: sticky; top: 0; z-index: 20;
  display: flex; flex-wrap: wrap; gap: 0.6rem 1rem; align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1.1rem;
  background: #2a1810; color: #f4ead8;
  font-family: "DM Sans", "Segoe UI", sans-serif; font-size: 13px;
}
.site-nav a { color: #f4ead8; text-decoration: none; border-bottom: 1px solid rgba(244,234,216,.35); }
.site-nav a:hover { border-bottom-color: #f4ead8; }
.wrap { max-width: 48rem; margin: 0 auto; padding: 1.4rem 1.1rem 3rem; }
h1 {
  font-size: 1.55rem; line-height: 1.25; margin: 0 0 0.35rem;
  color: var(--accent); border-bottom: 3px solid var(--rule); padding-bottom: 0.4rem;
}
.subtitle { color: var(--muted); font-style: italic; margin: 0 0 1rem; }
.intro, .bless-box {
  background: var(--card); border-left: 4px solid var(--accent);
  padding: 0.75rem 0.95rem; margin: 0 0 1.1rem;
}
.intro p { margin: 0 0 0.7rem; }
.intro p:last-child { margin-bottom: 0; }
.counts { font-size: 0.9rem; color: var(--muted); margin: 0 0 1.2rem; }
h2 {
  font-size: 1.18rem; color: var(--accent); margin: 1.6rem 0 0.45rem;
  border-bottom: 1px solid var(--rule); padding-bottom: 0.2rem;
  page-break-after: avoid;
}
h3 { font-size: 1.02rem; margin: 1.05rem 0 0.3rem; color: #3d2418; page-break-after: avoid; }
.clause-meta { font-size: 0.82rem; color: var(--muted); margin: 0 0 0.35rem; font-style: italic; }
.why { margin: 0 0 0.45rem; }
table { width: 100%; border-collapse: collapse; margin: 0 0 0.9rem; font-size: 9.6pt; }
th, td { border: 1px solid #d4c0a0; padding: 0.28rem 0.4rem; vertical-align: top; text-align: left; }
th { background: #e4d3b4; font-size: 8.5pt; letter-spacing: 0.03em; }
tr:nth-child(even) td { background: #f3ead8; }
td.ref { white-space: nowrap; font-weight: 700; width: 28%; color: #3d2418; }
.toc { columns: 2; column-gap: 1.4rem; font-size: 0.92rem; margin: 0 0 1.2rem; }
.toc a { color: var(--link); text-decoration: none; }
.toc a:hover { text-decoration: underline; }
.toc div { break-inside: avoid; margin: 0.12rem 0; }
.note { font-size: 0.85rem; color: var(--muted); margin-top: 1.6rem; padding-top: 0.6rem; border-top: 1px solid var(--rule); }
ul.bless { margin: 0.3rem 0 0; padding-left: 1.15rem; }
ul.bless li { margin: 0.28rem 0; }
@media print {
  .site-nav { display: none !important; }
  .wrap { padding: 0; max-width: none; }
  a { color: inherit; text-decoration: none; }
  tr { page-break-inside: avoid; }
  h2, h3 { page-break-after: avoid; }
}
@media screen and (max-width: 720px) {
  .toc { columns: 1; }
  td.ref { white-space: normal; }
}
`.trim();
}

function render() {
  const nClause = clauseCount();
  const nCanon = canonCount();
  const parts = [];
  parts.push("<!DOCTYPE html>");
  parts.push('<html lang="en">');
  parts.push("<head>");
  parts.push('<meta charset="UTF-8" />');
  parts.push('<meta name="viewport" content="width=device-width, initial-scale=1" />');
  parts.push(`<title>${esc(TITLE)}</title>`);
  parts.push('<link rel="icon" href="favicon.ico" />');
  parts.push(`<style>${css()}</style>`);
  parts.push("</head>");
  parts.push("<body>");
  parts.push('<nav class="site-nav">');
  parts.push('<a href="index.html">← Living Word Map</a>');
  parts.push(`<span>${esc(TITLE)}</span>`);
  parts.push('<a href="why-bloodline-repentance.pdf" download>Download PDF</a>');
  parts.push("</nav>");
  parts.push('<div class="wrap">');
  parts.push(`<h1>${esc(TITLE)}</h1>`);
  parts.push('<p class="subtitle">Scripture warrant for the Core Prayer and Rounds 1–3 — how God attaches mercy to a line, not only to a moment.</p>');
  parts.push('<div class="intro">');
  for (const p of INTRO_PARAS) parts.push(`<p>${esc(p)}</p>`);
  parts.push("</div>");
  parts.push('<div class="bless-box">');
  parts.push('<h2 style="margin-top:0;border:0;padding:0;">How God blesses it</h2>');
  parts.push('<ul class="bless">');
  for (const [label, refs] of HOW_GOD_BLESSES) {
    parts.push(`<li><strong>${esc(label)}.</strong> ${esc(refs)}</li>`);
  }
  parts.push("</ul></div>");
  parts.push(
    `<p class="counts">${CLAUSES.length} prayer lines · ${nClause} supporting references · ${CANON.length} books · ${nCanon} Genesis–Revelation entries. The two lists overlap on purpose: the first shows the prayer; the second walks the canon.</p>`
  );

  parts.push('<h2 id="contents">Contents</h2>');
  parts.push('<div class="toc">');
  parts.push('<div><a href="#prayers">I. How the prayers connect</a></div>');
  for (const c of CLAUSES) {
    const label = c.clause.length > 72 ? c.clause.slice(0, 72) + "…" : c.clause;
    parts.push(`<div><a href="#${esc(c.id)}">${esc(label)}</a></div>`);
  }
  parts.push('<div><a href="#canon">II. Genesis to Revelation</a></div>');
  for (const [book] of CANON) {
    const slug = book.toLowerCase().replace(/ /g, "-");
    parts.push(`<div><a href="#book-${esc(slug)}">${esc(book)}</a></div>`);
  }
  parts.push("</div>");

  parts.push('<h2 id="prayers">I. How the prayers connect</h2>');
  parts.push("<p>Each block is a line (or cluster of lines) from the spoken prayers. The references are the biblical reason that line is not extra-biblical.</p>");
  for (const c of CLAUSES) {
    parts.push(`<h3 id="${esc(c.id)}">${esc(c.clause)}</h3>`);
    parts.push(`<p class="clause-meta">${esc(c.rounds)}</p>`);
    parts.push(`<p class="why">${esc(c.why)}</p>`);
    parts.push("<table><thead><tr><th>Reference</th><th>Connection</th></tr></thead><tbody>");
    for (const [ref, note] of c.refs) {
      parts.push(`<tr><td class="ref">${esc(ref)}</td><td>${esc(note)}</td></tr>`);
    }
    parts.push("</tbody></table>");
  }

  parts.push('<h2 id="canon">II. Genesis to Revelation</h2>');
  parts.push("<p>Canonical order. Each entry is a passage that underwrites bloodline repentance: covenant with seed, visitation and mercy to generations, representative confession, household salvation, records in blood, remit/retain, the accuser, or the Blood that speaks.</p>");
  for (const [book, refs] of CANON) {
    const slug = book.toLowerCase().replace(/ /g, "-");
    parts.push(`<h3 id="book-${esc(slug)}">${esc(book)}</h3>`);
    parts.push("<table><thead><tr><th>Reference</th><th>Connection</th></tr></thead><tbody>");
    for (const [ref, note] of refs) {
      parts.push(`<tr><td class="ref">${esc(book)} ${esc(ref)}</td><td>${esc(note)}</td></tr>`);
    }
    parts.push("</tbody></table>");
  }

  parts.push('<p class="note">Living Word Map · Repentance Project. Prayer templates: data/en-core-prayer.txt, Round 1–3 compiled prayers. Rebuild: scripts/build-bloodline-repentance-study.ps1. Scripture cited from the Authorized Version wording familiar to the prayers; open the full chapter for context.</p>');
  parts.push("</div></body></html>");
  return parts.join("\n");
}

function renderPage1() {
  const nClause = clauseCount();
  const nCanon = canonCount();
  const parts = [];
  parts.push("<!DOCTYPE html>");
  parts.push('<html lang="en">');
  parts.push("<head>");
  parts.push('<meta charset="UTF-8" />');
  parts.push(`<title>${esc(TITLE)} — page 1</title>`);
  parts.push(`<style>
html, body {
  margin: 0; padding: 0;
  width: 816px; height: 1056px;
  overflow: hidden;
  background: #f7f0e4; color: #1c1410;
  font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
  font-size: 12.5px; line-height: 1.4;
}
.wrap { padding: 48px 52px 40px; }
h1 {
  font-size: 26px; line-height: 1.2; margin: 0 0 8px;
  color: #6b3a22; border-bottom: 3px solid #c4a574; padding-bottom: 8px;
}
.subtitle { color: #5c4a3a; font-style: italic; margin: 0 0 16px; }
.intro, .bless-box {
  background: #efe4d0; border-left: 4px solid #6b3a22;
  padding: 10px 14px; margin: 0 0 14px;
}
.intro p { margin: 0 0 10px; }
.intro p:last-child { margin-bottom: 0; }
h2 { font-size: 18px; color: #6b3a22; margin: 0 0 8px; }
ul.bless { margin: 6px 0 0; padding-left: 18px; }
ul.bless li { margin: 5px 0; }
.counts { font-size: 12px; color: #5c4a3a; margin: 0; }
.kicker { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b3a22; margin: 0 0 10px; }
</style>`);
  parts.push("</head><body><div class=\"wrap\">");
  parts.push('<p class="kicker">Living Word Map · page 1</p>');
  parts.push(`<h1>${esc(TITLE)}</h1>`);
  parts.push('<p class="subtitle">Scripture warrant for the Core Prayer and Rounds 1–3 — how God attaches mercy to a line, not only to a moment.</p>');
  parts.push('<div class="intro">');
  for (const p of INTRO_PARAS) parts.push(`<p>${esc(p)}</p>`);
  parts.push("</div>");
  parts.push('<div class="bless-box">');
  parts.push("<h2>How God blesses it</h2>");
  parts.push('<ul class="bless">');
  for (const [label, refs] of HOW_GOD_BLESSES) {
    parts.push(`<li><strong>${esc(label)}.</strong> ${esc(refs)}</li>`);
  }
  parts.push("</ul></div>");
  parts.push(
    `<p class="counts">${CLAUSES.length} prayer lines · ${nClause} supporting references · ${CANON.length} books · ${nCanon} Genesis–Revelation entries. Download the PDF or scroll below Downloads to read the rest.</p>`
  );
  parts.push("</div></body></html>");
  return parts.join("\n");
}

const htmlText = render();
fs.mkdirSync(path.dirname(OUT_DATA), { recursive: true });
fs.writeFileSync(OUT_DATA, htmlText, "utf8");
fs.mkdirSync(path.dirname(OUT_PUBLIC), { recursive: true });
fs.copyFileSync(OUT_DATA, OUT_PUBLIC);
fs.writeFileSync(OUT_PAGE1, renderPage1(), "utf8");
console.log("Wrote", OUT_DATA);
console.log("Copied", OUT_PUBLIC);
console.log("Wrote page 1", OUT_PAGE1);
console.log(
  `Clauses ${CLAUSES.length} / clause refs ${clauseCount()} / books ${CANON.length} / canon entries ${canonCount()}`
);
