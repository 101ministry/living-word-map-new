import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AUDIO = path.join(ROOT, "audio");
const TRANSCRIPTS = path.join(ROOT, "transcripts");
const HTML_DIR = path.join(ROOT, "html");
const PDFS = path.join(ROOT, "pdfs");
const CHUNKS = path.join(__dirname, "chunks");
const PARTIALS = path.join(__dirname, "partials");
const MANIFEST = path.join(__dirname, "manifest.json");
const ACCOUNT_ID = "220cb2fa91515cffc104e3fb0b452146";
const MODEL = "@cf/openai/whisper-large-v3-turbo";
const WASTER_SRC = path.resolve(
  ROOT,
  "..",
  "waster-spirit-transcript",
  "transcript.txt"
);

function slugify(title, index) {
  const s = String(title)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/-$/, "")
    .toLowerCase();
  return `${String(index + 1).padStart(2, "0")}-${s || "episode"}`;
}

function readWranglerToken() {
  const tomlPath = path.join(
    process.env.APPDATA,
    "xdg.config",
    ".wrangler",
    "config",
    "default.toml"
  );
  const text = fs.readFileSync(tomlPath, "utf8");
  const m = text.match(/oauth_token\s*=\s*"([^"]+)"/);
  if (!m) throw new Error("oauth_token not found in wrangler config");
  return m[1];
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (d) => hash.update(d));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, windowsHide: true });
    let err = "";
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed (${code}): ${err.slice(-400)}`));
    });
  });
}

async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) return;
  const res = await fetch(url, {
    headers: { "User-Agent": "iTunes/12.11.3" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Download failed ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function transcribeFile(token, filePath) {
  const buf = fs.readFileSync(filePath);
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;
  const jsonBody = {
    audio: buf.toString("base64"),
    task: "transcribe",
    language: "en",
    vad_filter: true,
    initial_prompt:
      "God's Design podcast by Ashton Campbell. Biblical teaching, prayer, repentance, Jesus Christ, Holy Spirit, faith.",
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jsonBody),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON (${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok || parsed.success === false) {
    throw new Error(parsed.errors?.[0]?.message || parsed.error || `HTTP ${res.status}`);
  }
  const result = parsed.result ?? parsed;
  if (typeof result?.text === "string") return result.text;
  if (Array.isArray(result?.segments)) {
    return result.segments.map((s) => s.text || "").join(" ").trim();
  }
  return "";
}

function isQuotaError(err) {
  const msg = String(err?.message || err);
  return /10,000 neurons|daily free allocation/i.test(msg);
}

function isNonRetryableError(err) {
  const msg = String(err?.message || err);
  return isQuotaError(err) || /authentication error/i.test(msg);
}

function markQuotaAndStop(manifest, row, err) {
  const stamp = new Date().toISOString();
  fs.writeFileSync(
    path.join(__dirname, "quota-hit.json"),
    JSON.stringify({ at: stamp, slug: row?.slug || null, error: String(err?.message || err) }, null, 2)
  );
  if (row) {
    row.status = "quota";
    row.error = String(err?.message || err);
    upsert(manifest, row);
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  }
  console.error("AGENT_QUOTA_HIT — stop until the next calendar day. Free Cloudflare only.");
  process.exit(2);
}

function collapseHallucination(text) {
  return text.replace(/((?:.{12,80})(?:\s+\1){4,})/g, "$1");
}

function wrapHtml(ep, bodyHtml) {
  const safeTitle = escapeHtml(ep.title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle} — Transcript</title>
  <style>
    @page { margin: 0.85in 0.9in 0.95in 0.9in; }
    body { font-family: "Palatino Linotype", Palatino, Georgia, serif; color:#1a1714; font-size:11.5pt; line-height:1.55; max-width:40rem; margin:0 auto; }
    h1 { font-size:20pt; margin:0 0 0.2rem; }
    .subtitle { font-style:italic; color:#4a4038; margin:0 0 1rem; }
    .meta { font-family: Calibri, "Segoe UI", sans-serif; font-size:9.5pt; color:#5c534b; border-top:1px solid #c9bfb4; border-bottom:1px solid #c9bfb4; padding:0.7rem 0; margin:0 0 1.2rem; }
    .meta p { margin:0.15rem 0; }
    p { margin:0 0 0.75rem; }
    .note { font-family: Calibri, "Segoe UI", sans-serif; font-size:9.5pt; color:#5c534b; font-style:italic; }
    .footer-note { font-family: Calibri, "Segoe UI", sans-serif; font-size:9pt; color:#6a6159; margin-top:1.4rem; border-top:1px solid #c9bfb4; padding-top:0.7rem; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <p class="subtitle">Transcript of the God’s Design podcast episode</p>
  <div class="meta">
    <p><strong>Host:</strong> Ashton Campbell</p>
    <p><strong>Released:</strong> ${escapeHtml(ep.pubDate)} &nbsp;·&nbsp; <strong>Length:</strong> ${escapeHtml(ep.duration)}</p>
    <p><strong>Source:</strong> ${escapeHtml(ep.link || "")}</p>
  </div>
  <p class="note">Automatic transcript. Not a word-perfect manuscript.</p>
  ${bodyHtml}
  <p class="footer-note">God’s Design · ${safeTitle} · Ashton Campbell</p>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(text) {
  const cleaned = collapseHallucination(text).replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/(?<=\.)\s+(?=[A-Z])/);
  const paras = [];
  let buf = "";
  for (const sent of parts) {
    buf = buf ? `${buf} ${sent}` : sent;
    if (buf.length > 450) {
      paras.push(buf);
      buf = "";
    }
  }
  if (buf) paras.push(buf);
  return paras.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
}

async function transcribeEpisode(token, slug, audioPath) {
  const outTxt = path.join(TRANSCRIPTS, `${slug}.txt`);
  if (fs.existsSync(outTxt) && fs.statSync(outTxt).size > 200) {
    return fs.readFileSync(outTxt, "utf8");
  }
  if (slug.includes("dealing-with-the-waster-spirit") && fs.existsSync(WASTER_SRC)) {
    const existing = fs.readFileSync(WASTER_SRC, "utf8");
    fs.writeFileSync(outTxt, existing);
    return existing;
  }
  const chunkDir = path.join(CHUNKS, slug);
  fs.mkdirSync(chunkDir, { recursive: true });
  const existingChunks = fs.readdirSync(chunkDir).filter((f) => f.endsWith(".mp3"));
  if (existingChunks.length === 0) {
    await run("ffmpeg", [
      "-y",
      "-i",
      audioPath,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "48k",
      "-f",
      "segment",
      "-segment_time",
      "240",
      "-reset_timestamps",
      "1",
      path.join(chunkDir, "chunk-%03d.mp3"),
    ]);
  }
  const files = fs.readdirSync(chunkDir).filter((f) => f.endsWith(".mp3")).sort();
  const partialDir = path.join(PARTIALS, slug);
  fs.mkdirSync(partialDir, { recursive: true });
  const parts = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const txtPath = path.join(partialDir, file.replace(".mp3", ".txt"));
    if (fs.existsSync(txtPath)) {
      parts.push(fs.readFileSync(txtPath, "utf8"));
      console.log(`    [${i + 1}/${files.length}] skip ${file}`);
      continue;
    }
    console.log(`    [${i + 1}/${files.length}] ${file}`);
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const t = (await transcribeFile(token, path.join(chunkDir, file))).trim();
        fs.writeFileSync(txtPath, t);
        parts.push(t);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        console.error(`      attempt ${attempt}: ${err.message}`);
        if (isNonRetryableError(err)) throw err;
        await new Promise((r) => setTimeout(r, 2500 * attempt));
      }
    }
    if (lastErr) throw lastErr;
  }
  const full = collapseHallucination(parts.filter(Boolean).join("\n\n"));
  fs.writeFileSync(outTxt, full);
  return full;
}

const episodes = JSON.parse(
  fs.readFileSync(path.join(__dirname, "episodes-rss.json"), "utf8").replace(/^\uFEFF/, "")
);
for (const dir of [AUDIO, TRANSCRIPTS, HTML_DIR, PDFS, CHUNKS, PARTIALS]) {
  fs.mkdirSync(dir, { recursive: true });
}

const token = readWranglerToken();
let manifest = [];
if (fs.existsSync(MANIFEST)) {
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch {
    manifest = [];
  }
}
const hashToSlug = new Map();
for (const row of manifest) {
  if (row.sha256 && row.slug && !row.duplicateOf) hashToSlug.set(row.sha256, row.slug);
}

const mode = process.argv[2] || "all";

if (mode === "download" || mode === "all") {
  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    const slug = slugify(ep.title, i);
    const audioPath = path.join(AUDIO, `${slug}.bin`);
    console.log(`[${i + 1}/${episodes.length}] download ${slug}`);
    try {
      await download(ep.enclosureUrl, audioPath);
      console.log(`  ${fs.statSync(audioPath).size} bytes`);
    } catch (err) {
      console.error(`  FAIL: ${err.message}`);
    }
  }
}

if (mode === "transcribe" || mode === "all") {
  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    const slug = slugify(ep.title, i);
    const audioPath = path.join(AUDIO, `${slug}.bin`);
    let row = manifest.find((m) => m.slug === slug) || { slug, title: ep.title, pubDate: ep.pubDate, duration: ep.duration, link: ep.link };
    console.log(`[${i + 1}/${episodes.length}] transcribe ${slug}`);
    if (!fs.existsSync(audioPath)) {
      row.status = "missing-audio";
      upsert(manifest, row);
      continue;
    }
    const hash = await sha256File(audioPath);
    row.sha256 = hash;
    row.bytes = fs.statSync(audioPath).size;
    const prior = hashToSlug.get(hash);
    if (prior && prior !== slug) {
      row.duplicateOf = prior;
      row.status = "duplicate";
      console.log(`  duplicate of ${prior} — skip`);
      const priorTxt = path.join(TRANSCRIPTS, `${prior}.txt`);
      const note = `DUPLICATE AUDIO of ${prior} (${episodes.find((e, idx) => slugify(e.title, idx) === prior)?.title || prior}).\nOriginal title on this listing: ${ep.title}\n`;
      fs.writeFileSync(path.join(TRANSCRIPTS, `${slug}.DUPLICATE.txt`), note);
      upsert(manifest, row);
      fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
      continue;
    }
    hashToSlug.set(hash, slug);
    try {
      const text = await transcribeEpisode(token, slug, audioPath);
      const html = wrapHtml(ep, paragraphs(text));
      fs.writeFileSync(path.join(HTML_DIR, `${slug}.html`), html);
      row.status = "transcribed";
      row.chars = text.length;
      console.log(`  ${text.length} chars`);
    } catch (err) {
      if (isQuotaError(err)) markQuotaAndStop(manifest, row, err);
      row.status = "error";
      row.error = err.message;
      console.error(`  FAIL: ${err.message}`);
    }
    upsert(manifest, row);
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  }
}

function upsert(list, row) {
  const i = list.findIndex((x) => x.slug === row.slug);
  if (i >= 0) list[i] = { ...list[i], ...row };
  else list.push(row);
}

console.log("Done.");
