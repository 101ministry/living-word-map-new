#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, "data", "bsb-cache");
const OUT_HTML = path.join(ROOT, "data", "prayer-connect-bsb", "html");
const OUT_PDF = path.join(ROOT, "data", "prayer-connect-bsb");
const OUT_PUBLIC = path.join(ROOT, "public", "downloads", "prayer-connect");
const API = "https://bible.helloao.org/api/BSB";

const CLAUSES = pyToValue(
  fs.readFileSync(path.join(__dirname, "_bloodline_repentance_clauses.py"), "utf8"),
  "CLAUSES"
);
const CANON = pyToValue(
  fs.readFileSync(path.join(__dirname, "_bloodline_repentance_canon.py"), "utf8"),
  "CANON"
);

const BOOK_ID = {
  Genesis: "GEN",
  Exodus: "EXO",
  Leviticus: "LEV",
  Numbers: "NUM",
  Deuteronomy: "DEU",
  Joshua: "JOS",
  Judges: "JDG",
  Ruth: "RUT",
  "1 Samuel": "1SA",
  "2 Samuel": "2SA",
  "1 Kings": "1KI",
  "2 Kings": "2KI",
  "1 Chronicles": "1CH",
  "2 Chronicles": "2CH",
  Ezra: "EZR",
  Nehemiah: "NEH",
  Esther: "EST",
  Job: "JOB",
  Psalms: "PSA",
  Proverbs: "PRO",
  Ecclesiastes: "ECC",
  "Song of Solomon": "SNG",
  Isaiah: "ISA",
  Jeremiah: "JER",
  Lamentations: "LAM",
  Ezekiel: "EZK",
  Daniel: "DAN",
  Hosea: "HOS",
  Joel: "JOL",
  Amos: "AMO",
  Obadiah: "OBA",
  Jonah: "JON",
  Micah: "MIC",
  Nahum: "NAM",
  Habakkuk: "HAB",
  Zephaniah: "ZEP",
  Haggai: "HAG",
  Zechariah: "ZEC",
  Malachi: "MAL",
  Matthew: "MAT",
  Mark: "MRK",
  Luke: "LUK",
  John: "JHN",
  Acts: "ACT",
  Romans: "ROM",
  "1 Corinthians": "1CO",
  "2 Corinthians": "2CO",
  Galatians: "GAL",
  Ephesians: "EPH",
  Philippians: "PHP",
  Colossians: "COL",
  "1 Thessalonians": "1TH",
  "2 Thessalonians": "2TH",
  "1 Timothy": "1TI",
  "2 Timothy": "2TI",
  Titus: "TIT",
  Philemon: "PHM",
  Hebrews: "HEB",
  James: "JAS",
  "1 Peter": "1PE",
  "2 Peter": "2PE",
  "1 John": "1JN",
  "2 John": "2JN",
  "3 John": "3JN",
  Jude: "JUD",
  Revelation: "REV",
};

const ABBR = {
  Genesis: "Genesis",
  Exodus: "Exodus",
  Leviticus: "Leviticus",
  Numbers: "Numbers",
  Deuteronomy: "Deuteronomy",
  Joshua: "Joshua",
  Judges: "Judges",
  Ruth: "Ruth",
  "1 Samuel": "1 Samuel",
  "2 Samuel": "2 Samuel",
  "1 Kings": "1 Kings",
  "2 Kings": "2 Kings",
  "1 Chronicles": "1 Chronicles",
  "2 Chronicles": "2 Chronicles",
  Ezra: "Ezra",
  Nehemiah: "Nehemiah",
  Esther: "Esther",
  Job: "Job",
  Psalms: "Psalms",
  Proverbs: "Proverbs",
  Ecclesiastes: "Ecclesiastes",
  "Song of Solomon": "Song of Solomon",
  Isaiah: "Isaiah",
  Jeremiah: "Jeremiah",
  Lamentations: "Lamentations",
  Ezekiel: "Ezekiel",
  Daniel: "Daniel",
  Hosea: "Hosea",
  Joel: "Joel",
  Amos: "Amos",
  Obadiah: "Obadiah",
  Jonah: "Jonah",
  Micah: "Micah",
  Nahum: "Nahum",
  Habakkuk: "Habakkuk",
  Zephaniah: "Zephaniah",
  Haggai: "Haggai",
  Zechariah: "Zechariah",
  Malachi: "Malachi",
  Matthew: "Matthew",
  Mark: "Mark",
  Luke: "Luke",
  John: "John",
  Acts: "Acts",
  Romans: "Romans",
  "1 Corinthians": "1 Corinthians",
  "2 Corinthians": "2 Corinthians",
  Galatians: "Galatians",
  Ephesians: "Ephesians",
  Philippians: "Philippians",
  Colossians: "Colossians",
  "1 Thessalonians": "1 Thessalonians",
  "2 Thessalonians": "2 Thessalonians",
  "1 Timothy": "1 Timothy",
  "2 Timothy": "2 Timothy",
  Titus: "Titus",
  Philemon: "Philemon",
  Hebrews: "Hebrews",
  James: "James",
  "1 Peter": "1 Peter",
  "2 Peter": "2 Peter",
  "1 John": "1 John",
  "2 John": "2 John",
  "3 John": "3 John",
  Jude: "Jude",
  Revelation: "Revelation",
  Gen: "Genesis",
  Ex: "Exodus",
  Exod: "Exodus",
  Lev: "Leviticus",
  Num: "Numbers",
  Deut: "Deuteronomy",
  Josh: "Joshua",
  Judg: "Judges",
  Ruth: "Ruth",
  "1 Sam": "1 Samuel",
  "2 Sam": "2 Samuel",
  "1 Kgs": "1 Kings",
  "1 Kg": "1 Kings",
  "2 Kgs": "2 Kings",
  "2 Kg": "2 Kings",
  "1 Chr": "1 Chronicles",
  "2 Chr": "2 Chronicles",
  Ezra: "Ezra",
  Neh: "Nehemiah",
  Esth: "Esther",
  Job: "Job",
  Ps: "Psalms",
  Psa: "Psalms",
  Prov: "Proverbs",
  Eccl: "Ecclesiastes",
  Song: "Song of Solomon",
  Isa: "Isaiah",
  Jer: "Jeremiah",
  Lam: "Lamentations",
  Ezek: "Ezekiel",
  Dan: "Daniel",
  Hos: "Hosea",
  Joel: "Joel",
  Amos: "Amos",
  Obad: "Obadiah",
  Jonah: "Jonah",
  Mic: "Micah",
  Nah: "Nahum",
  Hab: "Habakkuk",
  Zeph: "Zephaniah",
  Hag: "Haggai",
  Zech: "Zechariah",
  Mal: "Malachi",
  Matt: "Matthew",
  Mk: "Mark",
  Mark: "Mark",
  Luke: "Luke",
  Lk: "Luke",
  John: "John",
  Jn: "John",
  Acts: "Acts",
  Rom: "Romans",
  "1 Cor": "1 Corinthians",
  "2 Cor": "2 Corinthians",
  Gal: "Galatians",
  Eph: "Ephesians",
  Phil: "Philippians",
  Col: "Colossians",
  "1 Thess": "1 Thessalonians",
  "2 Thess": "2 Thessalonians",
  "1 Tim": "1 Timothy",
  "2 Tim": "2 Timothy",
  Tit: "Titus",
  Titus: "Titus",
  Phlm: "Philemon",
  Heb: "Hebrews",
  Jas: "James",
  "1 Pet": "1 Peter",
  "2 Pet": "2 Peter",
  "1 John": "1 John",
  "2 John": "2 John",
  "3 John": "3 John",
  Jude: "Jude",
  Rev: "Revelation",
};

function pyToValue(src, assignName) {
  let s = src.replace(/^\s*#.*$/gm, "").replace(/\r\n/g, "\n");
  s = s.replace(new RegExp("^" + assignName + "\\s*=\\s*", "m"), "return ");
  s = s.replace(/\("((?:\\.|[^"\\])*)"\s*,\s*"((?:\\.|[^"\\])*)"\)/g, '["$1", "$2"]');
  s = s.replace(/\("((?:\\.|[^"\\])*)"\s*,\s*\[/g, '["$1", [');
  s = s.replace(/\]\),/g, "]],");
  s = s.replace(/\]\)\s*\]/g, "]] ]");
  return Function(s)();
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function splitBookRest(label) {
  const raw = String(label).trim();
  const names = Object.keys(ABBR).sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (raw === name || raw.startsWith(name + " ")) {
      const rest = raw.slice(name.length).trim();
      if (!rest) throw new Error("Missing verse in: " + label);
      return { book: ABBR[name], rest };
    }
  }
  throw new Error("Cannot parse ref: " + label);
}

function parseRanges(rest) {
  const chunks = rest.split(";").map((c) => c.trim()).filter(Boolean);
  const ranges = [];
  let lastChap = null;
  for (const chunk of chunks) {
    const parts = chunk.split(",").map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (/^\d+:\d+(-\d+)?$/.test(part)) {
        const [ch, vs] = part.split(":");
        lastChap = Number(ch);
        const [a, b] = vs.split("-").map(Number);
        ranges.push({ chapter: lastChap, from: a, to: b || a });
      } else if (/^\d+-\d+$/.test(part) && lastChap) {
        const [a, b] = part.split("-").map(Number);
        ranges.push({ chapter: lastChap, from: a, to: b });
      } else if (/^\d+-\d+$/.test(part) && !lastChap) {
        const [a, b] = part.split("-").map(Number);
        ranges.push({ chapter: 1, from: a, to: b });
      } else if (/^\d+$/.test(part) && lastChap) {
        const v = Number(part);
        ranges.push({ chapter: lastChap, from: v, to: v });
      } else if (/^\d+$/.test(part) && !lastChap) {
        const v = Number(part);
        ranges.push({ chapter: 1, from: v, to: v });
      } else {
        throw new Error("Cannot parse range part: " + part + " in " + rest);
      }
    }
  }
  return ranges;
}

function parseRef(label) {
  const { book, rest } = splitBookRest(label);
  return { label, book, id: BOOK_ID[book], ranges: parseRanges(rest) };
}

async function fetchChapter(bookId, chapter) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `${bookId}-${chapter}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  const url = `${API}/${bookId}/${chapter}.simple.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch failed " + res.status + " " + url);
  const json = await res.json();
  const verses = {};
  for (const item of json.chapter.content || []) {
    if (item.type === "verse") verses[String(item.number)] = String(item.text || "").trim();
  }
  const packed = { bookId, chapter, verses };
  fs.writeFileSync(file, JSON.stringify(packed));
  return packed;
}

async function versesForRef(ref) {
  const blocks = [];
  for (const r of ref.ranges) {
    const ch = await fetchChapter(ref.id, r.chapter);
    const lines = [];
    for (let v = r.from; v <= r.to; v++) {
      const t = ch.verses[String(v)];
      if (!t) {
        process.stderr.write(`skip missing ${ref.book} ${r.chapter}:${v} (${ref.label})\n`);
        continue;
      }
      lines.push({ n: v, text: t });
    }
    if (!lines.length) throw new Error(`No verses for ${ref.label} at ch ${r.chapter}`);
    blocks.push({ chapter: r.chapter, lines });
  }
  return blocks;
}

function css() {
  return `
:root { --ink:#1c1410; --muted:#5c4a3a; --rule:#c4a574; --paper:#f7f0e4; --card:#efe4d0; --accent:#6b3a22; }
@page { size: letter; margin: 0.7in 0.75in; }
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0; background: var(--paper); color: var(--ink);
  font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
  font-size: 11pt; line-height: 1.5;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.wrap { max-width: 46rem; margin: 0 auto; }
.kicker { font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin: 0 0 0.25rem; }
h1 { font-size: 1.28rem; line-height: 1.28; color: var(--accent); margin: 0 0 0.4rem; border-bottom: 2px solid var(--rule); padding-bottom: 0.35rem; }
.meta { font-style: italic; color: var(--muted); margin: 0 0 0.55rem; font-size: 0.92rem; }
.why { background: var(--card); border-left: 4px solid var(--accent); padding: 0.65rem 0.85rem; margin: 0 0 1.1rem; }
h2 { font-size: 1.05rem; color: #3d2418; margin: 1.15rem 0 0.35rem; page-break-after: avoid; }
.connection { font-size: 0.9rem; color: var(--muted); font-style: italic; margin: 0 0 0.4rem; }
.verse { margin: 0 0 0.35rem; }
.vn { font-weight: 700; font-size: 0.78rem; color: var(--accent); margin-right: 0.28rem; }
.foot { margin-top: 1.4rem; font-size: 0.78rem; color: var(--muted); border-top: 1px solid var(--rule); padding-top: 0.5rem; }
`;
}

function pageShell(title, body) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${css()}</style></head>
<body><div class="wrap">${body}
<p class="foot">Scripture quotations are from the Berean Standard Bible (BSB), © 2016, 2020 by Bible Hub and Berean Bible. Used by permission. All rights reserved worldwide. https://berean.bible/</p>
</div></body></html>`;
}

function renderPassages(title, kicker, meta, why, passages) {
  let html = `<p class="kicker">${esc(kicker)}</p><h1>${esc(title)}</h1>`;
  if (meta) html += `<p class="meta">${esc(meta)}</p>`;
  if (why) html += `<p class="why">${esc(why)}</p>`;
  for (const p of passages) {
    html += `<h2>${esc(p.label)}</h2>`;
    if (p.connection) html += `<p class="connection">${esc(p.connection)}</p>`;
    for (const block of p.blocks) {
      for (const line of block.lines) {
        html += `<p class="verse"><span class="vn">${block.chapter}:${line.n}</span>${esc(line.text)}</p>`;
      }
    }
  }
  return html;
}

function slug(n, name) {
  const s = String(name)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `day-${String(n).padStart(2, "0")}-${s}`;
}

function findBrowser() {
  const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const edgeA = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const edgeB = "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe";
  if (fs.existsSync(chrome)) return chrome;
  if (fs.existsSync(edgeA)) return edgeA;
  if (fs.existsSync(edgeB)) return edgeB;
  return null;
}

function printPdf(htmlPath, pdfPath) {
  const browser = findBrowser();
  if (!browser) throw new Error("Chrome/Edge not found");
  const fileUri = "file:///" + htmlPath.replace(/\\/g, "/");
  if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
  const r = spawnSync(
    browser,
    ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, fileUri],
    { timeout: 120000 }
  );
  if (r.error) throw r.error;
  if (!fs.existsSync(pdfPath)) throw new Error("PDF missing: " + pdfPath);
}

async function buildDay(day, kind, title, kicker, meta, why, refPairs) {
  const passages = [];
  for (const [label, connection] of refPairs) {
    const parsed = parseRef(label);
    const blocks = await versesForRef(parsed);
    passages.push({ label, connection, blocks });
  }
  const body = renderPassages(title, kicker, meta, why, passages);
  const base = slug(day, kind === "clause" && day === 1 ? "how-the-prayers-connect" : title);
  fs.mkdirSync(OUT_HTML, { recursive: true });
  fs.mkdirSync(OUT_PDF, { recursive: true });
  fs.mkdirSync(OUT_PUBLIC, { recursive: true });
  const htmlPath = path.join(OUT_HTML, base + ".html");
  const pdfName = `Day-${String(day).padStart(2, "0")}.pdf`;
  const pdfPath = path.join(OUT_PDF, pdfName);
  fs.writeFileSync(htmlPath, pageShell(title, body));
  if (process.env.SKIP_PDF === "1") {
    return { day, title, pdfName, file: path.basename(pdfPath), html: htmlPath };
  }
  printPdf(htmlPath, pdfPath);
  fs.copyFileSync(pdfPath, path.join(OUT_PUBLIC, path.basename(pdfPath)));
  return { day, title, pdfName, file: path.basename(pdfPath) };
}

function indexHtml(days) {
  const rows = days
    .map(
      (d) =>
        `<tr><td>Day ${d.day}</td><td>${esc(d.title)}</td><td><a href="${esc(d.file)}">${esc(d.file)}</a></td></tr>`
    )
    .join("");
  return pageShell(
    "How the Prayers Connect — BSB Day Series",
    `<p class="kicker">Repentance 101</p>
     <h1>How the Prayers Connect</h1>
     <p class="why">Each day writes out, in the Berean Standard Bible, the Scriptures that underwrite one prayer heading — then one day for each book of the Bible from the same study. These prayers are to be spoken, not simply read silently.</p>
     <p class="meta">“Repent, for the kingdom of heaven is at hand.” — Matthew 4:17 (BSB)</p>
     <table style="width:100%;border-collapse:collapse;font-size:10pt">
     <tr><th style="text-align:left;border-bottom:1px solid #c4a574;padding:0.25rem">Day</th>
         <th style="text-align:left;border-bottom:1px solid #c4a574;padding:0.25rem">Title</th>
         <th style="text-align:left;border-bottom:1px solid #c4a574;padding:0.25rem">PDF</th></tr>
     ${rows}
     </table>`
  );
}

async function main() {
  const only = process.argv[2] ? Number(process.argv[2]) : 0;
  const days = [];
  const totalClause = CLAUSES.length;
  const kickerClause = (n) => `How the prayers connect · Day ${n} of ${totalClause + CANON.length}`;

  for (let i = 0; i < CLAUSES.length; i++) {
    const day = i + 1;
    if (only && day !== only) continue;
    const c = CLAUSES[i];
    const title = day === 1 ? "I. How the prayers connect" : c.clause;
    const why =
      day === 1
        ? "Each block is a line (or cluster of lines) from the spoken prayers. The references are the biblical reason that line is not extra-biblical. " +
          c.why
        : c.why;
    const meta = day === 1 ? c.clause + " · " + c.rounds : c.rounds;
    process.stderr.write(`Day ${day} ${title.slice(0, 60)}\n`);
    days.push(await buildDay(day, "clause", title, kickerClause(day), meta, why, c.refs));
  }

  for (let i = 0; i < CANON.length; i++) {
    const day = CLAUSES.length + i + 1;
    if (only && day !== only) continue;
    const [book, refs] = CANON[i];
    process.stderr.write(`Day ${day} ${book}\n`);
    const prefixed = refs.map(([r, why]) => [`${book} ${r}`, why]);
    days.push(
      await buildDay(
        day,
        "book",
        book,
        `Genesis to Revelation · Day ${day} of ${totalClause + CANON.length}`,
        "Passages that underwrite bloodline repentance as the prayers practice it.",
        null,
        prefixed
      )
    );
  }

  if (!only) {
    const idxHtml = path.join(OUT_HTML, "index.html");
    fs.writeFileSync(idxHtml, indexHtml(days));
    const idxPdf = path.join(OUT_PDF, "How-the-Prayers-Connect-BSB-Day-Series.pdf");
    printPdf(idxHtml, idxPdf);
    fs.copyFileSync(idxPdf, path.join(OUT_PUBLIC, path.basename(idxPdf)));
    fs.writeFileSync(path.join(OUT_PDF, "manifest.json"), JSON.stringify(days, null, 2));
    fs.copyFileSync(idxHtml, path.join(ROOT, "public", "prayer-connect-days.html"));
  }
  console.log("Wrote", days.length, "day PDFs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
