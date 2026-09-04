#!/usr/bin/env node
/**
 * Fetch Riverside Share-for-Review transcripts from a links .txt file.
 *
 * Usage:
 *   node fetch-riverside-transcripts.mjs --links path/to/links.txt [--dir intake-folder] [--out manifest.json]
 *
 * Links file: one Riverside preview URL per line (# comments and blank lines ok).
 * Writes kebab-case .txt transcripts next to the links file (or --dir).
 * Also writes manifest.json mapping clipId -> txt path for pairing with exported MP4s.
 */
import fs from "node:fs";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function parseArgs(argv) {
  const out = { links: null, dir: null, manifest: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--links" && argv[i + 1]) out.links = argv[++i];
    else if (a === "--dir" && argv[i + 1]) out.dir = argv[++i];
    else if (a === "--out" && argv[i + 1]) out.manifest = argv[++i];
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function parsePreviewUrl(url) {
  const m = String(url).match(
    /riverside\.com\/editor\/([^/?#]+)\/([^/?#]+)\/preview\?[^#]*review-token=([^&#]+)/i
  );
  if (!m) return null;
  return { editId: m[1], clipId: m[2], token: m[3], url: url.trim() };
}

function readLinks(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function wordsFromSentence(sentence) {
  const words = [];
  for (const w of sentence.words || []) {
    if (Array.isArray(w)) {
      if (w.length >= 4 && w[3] === "noise") continue;
      const text = String(w[0] ?? "").trim();
      if (text) words.push(text);
    } else if (w && typeof w === "object" && w.text) {
      if (w.type === "noise") continue;
      const text = String(w.text).trim();
      if (text) words.push(text);
    }
  }
  return words.join(" ").trim();
}

function transcriptToText(data) {
  const lines = [];
  for (const sp of data.speakers || []) {
    const speaker = sp.name || "Speaker";
    for (const s of sp.sentences || []) {
      const text = wordsFromSentence(s);
      if (!text) continue;
      const start = s.start ?? s.startTime ?? (Array.isArray(s.words?.[0]) ? s.words[0][1] : 0);
      lines.push(`${speaker} (${formatTime(start)})`);
      lines.push(text);
      lines.push("");
    }
  }
  return lines.join("\n").trim() + "\n";
}

function slugFromTitle(title) {
  return String(title || "clip")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function fetchTranscription(clipId, token) {
  const res = await fetch(`https://riverside.com/api/v4/clip/${clipId}/transcription`, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      "x-review-token": token,
      "x-clip-review-share-token": token,
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for clip ${clipId}`);
  }
  return res.json();
}

async function fetchClipTitle(clipId, token) {
  for (const path of [`api/v4/clip/${clipId}`, `api/v4/clips/${clipId}`]) {
    try {
      const res = await fetch(`https://riverside.com/${path}`, {
        headers: {
          "User-Agent": UA,
          Accept: "application/json",
          "x-review-token": token,
          "x-clip-review-share-token": token,
        },
      });
      if (!res.ok) continue;
      const j = await res.json();
      const title = j?.title || j?.name || j?.clip?.title || j?.data?.title;
      if (title) return String(title);
    } catch {
      /* try next */
    }
  }
  return null;
}

function uniquePath(dir, baseName) {
  let candidate = path.join(dir, baseName);
  if (!fs.existsSync(candidate)) return candidate;
  const stem = baseName.replace(/\.txt$/i, "");
  for (let i = 1; i < 100; i++) {
    candidate = path.join(dir, `${stem} (${i}).txt`);
    if (!fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Could not find free name for ${baseName}`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.links) {
    console.log(`Usage: node fetch-riverside-transcripts.mjs --links links.txt [--dir output-dir] [--out manifest.json]`);
    process.exit(args.help ? 0 : 1);
  }

  const linksPath = path.resolve(args.links);
  const outDir = path.resolve(args.dir || path.dirname(linksPath));
  const manifestPath = path.resolve(args.manifest || path.join(outDir, "_riverside-links-manifest.json"));

  if (!fs.existsSync(linksPath)) {
    console.error(`Missing links file: ${linksPath}`);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const urls = readLinks(linksPath);
  const manifest = { linksFile: linksPath, fetchedAt: new Date().toISOString(), clips: [] };
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const parsed = parsePreviewUrl(url);
    if (!parsed) {
      console.error(`[${i + 1}] skip invalid URL: ${url.slice(0, 80)}`);
      fail++;
      continue;
    }
    process.stdout.write(`[${i + 1}/${urls.length}] ${parsed.clipId.slice(0, 12)}… `);
    try {
      const [data, title] = await Promise.all([
        fetchTranscription(parsed.clipId, parsed.token),
        fetchClipTitle(parsed.clipId, parsed.token),
      ]);
      const text = transcriptToText(data);
      const slug = slugFromTitle(title) || `clip-${parsed.clipId.slice(0, 8)}`;
      const txtPath = uniquePath(outDir, `${slug}.txt`);
      fs.writeFileSync(txtPath, text, "utf8");
      manifest.clips.push({
        index: i + 1,
        url,
        clipId: parsed.clipId,
        editId: parsed.editId,
        title: title || null,
        txt: path.basename(txtPath),
        txtPath,
      });
      console.log(`ok -> ${path.basename(txtPath)}${title ? ` (${title.slice(0, 50)})` : ""}`);
      ok++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      manifest.clips.push({
        index: i + 1,
        url,
        clipId: parsed.clipId,
        editId: parsed.editId,
        error: err.message,
      });
      fail++;
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nDone: ${ok} ok, ${fail} failed. Manifest: ${manifestPath}`);
  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
