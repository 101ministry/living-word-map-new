import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CHUNKS = path.join(ROOT, "chunks");
const PARTIALS = path.join(ROOT, "partials");
const TRANSCRIPTS = path.join(ROOT, "transcripts");
const HTML_DIR = path.join(ROOT, "html");
const PDFS = path.join(ROOT, "pdfs");
const ACCOUNT_ID = "220cb2fa91515cffc104e3fb0b452146";
const MODEL = "@cf/openai/whisper-large-v3-turbo";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const EPISODES = [
  {
    id: "CJrJG9xymts",
    title: "Deliverance From Spirit Husbands and Spirit Wives (Incubus and Succubus) Part one",
    duration: "58 min",
    date: "March 2, 2013",
    url: "https://www.youtube.com/watch?v=CJrJG9xymts",
  },
  {
    id: "ECXgUl4rNAQ",
    title: "Deliverance from Spirit Husbands and Wives part two. Fire prayers",
    duration: "57 min",
    date: "March 5, 2013",
    url: "https://www.youtube.com/watch?v=ECXgUl4rNAQ",
  },
  {
    id: "nKMRFfGoc1I",
    title: "Week Two! Evil spiritual marriage prayer!",
    duration: "53 min",
    date: "November 23, 2018",
    url: "https://www.youtube.com/watch?v=nKMRFfGoc1I",
  },
];

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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function collapseHallucination(text) {
  return text.replace(/((?:.{12,80})(?:\s+\1){4,})/g, "$1");
}

function paragraphs(text) {
  const cleaned = collapseHallucination(text).replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/(?<=[.!?])\s+(?=[A-Z“"])/);
  const paras = [];
  let buf = "";
  for (const sent of parts) {
    buf = buf ? `${buf} ${sent}` : sent;
    if (buf.length > 480) {
      paras.push(buf);
      buf = "";
    }
  }
  if (buf) paras.push(buf);
  return paras;
}

function paraHtml(text) {
  return paragraphs(text)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");
}

function pageShell(title, subtitle, metaHtml, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 0.85in 0.9in 0.95in 0.9in; }
    body { font-family: "Palatino Linotype", Palatino, Georgia, serif; color:#1a1714; font-size:11.5pt; line-height:1.55; max-width:40rem; margin:0 auto; }
    h1 { font-size:20pt; margin:0 0 0.2rem; }
    h2 { font-size:15pt; margin:1.6rem 0 0.3rem; page-break-after: avoid; }
    .subtitle { font-style:italic; color:#4a4038; margin:0 0 1rem; }
    .meta { font-family: Calibri, "Segoe UI", sans-serif; font-size:9.5pt; color:#5c534b; border-top:1px solid #c9bfb4; border-bottom:1px solid #c9bfb4; padding:0.7rem 0; margin:0 0 1.2rem; }
    .meta p { margin:0.15rem 0; }
    p { margin:0 0 0.75rem; }
    .note { font-family: Calibri, "Segoe UI", sans-serif; font-size:9.5pt; color:#5c534b; font-style:italic; }
    .footer-note { font-family: Calibri, "Segoe UI", sans-serif; font-size:9pt; color:#6a6159; margin-top:1.4rem; border-top:1px solid #c9bfb4; padding-top:0.7rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="subtitle">${escapeHtml(subtitle)}</p>
  <div class="meta">${metaHtml}</div>
  <p class="note">Speech transcribed from the teaching audio. This is not YouTube’s caption track, and it is not a word-perfect manuscript.</p>
  ${bodyHtml}
  <p class="footer-note">Dr. Stella Immanuel · Fire Power Ministries</p>
</body>
</html>`;
}

function isQuotaError(err) {
  return /10,000 neurons|daily free allocation/i.test(String(err?.message || err));
}

async function transcribeFile(token, filePath, vad = true) {
  const buf = fs.readFileSync(filePath);
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio: buf.toString("base64"),
      task: "transcribe",
      language: "en",
      vad_filter: vad,
      initial_prompt:
        "Biblical teaching and deliverance prayer by Dr. Stella Immanuel of Fire Power Ministries. Spirit husbands, spirit wives, incubus, succubus, Jesus Christ, Holy Spirit.",
    }),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON (${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok || parsed.success === false) {
    const err = new Error(parsed.errors?.[0]?.message || parsed.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const result = parsed.result ?? parsed;
  if (typeof result?.text === "string") return result.text;
  if (Array.isArray(result?.segments)) {
    return result.segments.map((s) => s.text || "").join(" ").trim();
  }
  return "";
}

async function transcribeEpisode(token, ep) {
  const chunkDir = path.join(CHUNKS, ep.id);
  const partialDir = path.join(PARTIALS, ep.id);
  fs.mkdirSync(partialDir, { recursive: true });
  const files = fs.readdirSync(chunkDir).filter((f) => f.endsWith(".mp3")).sort();
  if (!files.length) throw new Error(`No chunks for ${ep.id}`);
  const parts = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const txtPath = path.join(partialDir, file.replace(/\.mp3$/, ".txt"));
    if (fs.existsSync(txtPath) && fs.statSync(txtPath).size > 0) {
      parts.push(fs.readFileSync(txtPath, "utf8"));
      console.log(`  [${i + 1}/${files.length}] skip ${file}`);
      continue;
    }
    console.log(`  [${i + 1}/${files.length}] ${file}`);
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
        console.error(`    attempt ${attempt}: ${err.message}`);
        if (isQuotaError(err)) throw err;
        await new Promise((r) => setTimeout(r, 2500 * attempt));
      }
    }
    if (lastErr) throw lastErr;
  }
  return collapseHallucination(parts.filter(Boolean).join("\n\n")).trim();
}

function printPdf(htmlPath, pdfPath) {
  const uri = "file:///" + htmlPath.replace(/\\/g, "/");
  const result = spawnSync(
    EDGE,
    ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, uri],
    { stdio: "ignore" }
  );
  if (result.status !== 0 || !fs.existsSync(pdfPath)) {
    throw new Error(`PDF failed for ${path.basename(htmlPath)}`);
  }
}

const THIN = [
  ["ECXgUl4rNAQ", "chunk-002"],
  ["ECXgUl4rNAQ", "chunk-003"],
  ["ECXgUl4rNAQ", "chunk-004"],
  ["ECXgUl4rNAQ", "chunk-007"],
  ["ECXgUl4rNAQ", "chunk-008"],
  ["nKMRFfGoc1I", "chunk-003"],
];

async function repairThin(token) {
  const { spawn } = await import("node:child_process");
  function run(cmd, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { windowsHide: true });
      let err = "";
      child.stderr.on("data", (d) => {
        err += d.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(err.slice(-300)));
      });
    });
  }
  for (const [id, chunk] of THIN) {
    const src = path.join(CHUNKS, id, `${chunk}.mp3`);
    const txtPath = path.join(PARTIALS, id, `${chunk}.txt`);
    const old = fs.readFileSync(txtPath, "utf8");
    const tmp = path.join(PARTIALS, "_retry", id, chunk);
    fs.mkdirSync(tmp, { recursive: true });
    await run("ffmpeg", [
      "-y",
      "-i",
      src,
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
      "60",
      "-reset_timestamps",
      "1",
      path.join(tmp, "s-%02d.mp3"),
    ]);
    const slices = fs.readdirSync(tmp).filter((f) => f.endsWith(".mp3")).sort();
    const bits = [];
    for (const slice of slices) {
      const slicePath = path.join(tmp, slice);
      if (fs.statSync(slicePath).size < 8000) {
        console.log(`  ${id} ${chunk} ${slice} skip tiny`);
        continue;
      }
      try {
        const t = (await transcribeFile(token, slicePath, false)).trim();
        bits.push(t);
        console.log(`  ${id} ${chunk} ${slice} ${t.length}`);
      } catch (err) {
        console.error(`  ${id} ${chunk} ${slice} FAIL ${err.message}`);
      }
    }
    const next = collapseHallucination(bits.filter(Boolean).join(" ")).trim();
    console.log(`${id} ${chunk}: ${old.length} -> ${next.length}`);
    if (next.length > old.length * 1.25) {
      fs.writeFileSync(txtPath, next);
      console.log("  replaced");
    } else {
      console.log("  kept original");
    }
  }
}

if (process.argv[2] === "repair") {
  const token = readWranglerToken();
  await repairThin(token);
  console.log("repair done");
  process.exit(0);
}

for (const dir of [TRANSCRIPTS, HTML_DIR, PDFS, PARTIALS]) {
  fs.mkdirSync(dir, { recursive: true });
}

const token = readWranglerToken();
const collected = [];

for (const ep of EPISODES) {
  const outTxt = path.join(TRANSCRIPTS, `${ep.id}.txt`);
  console.log(`transcribe ${ep.id}`);
  let text;
  if (fs.existsSync(outTxt) && fs.statSync(outTxt).size > 400) {
    text = fs.readFileSync(outTxt, "utf8");
    console.log(`  existing ${text.length} chars`);
  } else {
    text = await transcribeEpisode(token, ep);
    fs.writeFileSync(outTxt, text);
    console.log(`  ${text.length} chars`);
  }
  const meta = `<p><strong>Speaker:</strong> Dr. Stella Immanuel</p>
    <p><strong>Ministry:</strong> Fire Power Ministries</p>
    <p><strong>Published:</strong> ${escapeHtml(ep.date)} &nbsp;·&nbsp; <strong>Length:</strong> ${escapeHtml(ep.duration)}</p>
    <p><strong>Source audio:</strong> ${escapeHtml(ep.url)}</p>`;
  const html = pageShell(ep.title, "Transcript of the spoken teaching", meta, paraHtml(text));
  const htmlPath = path.join(HTML_DIR, `${ep.id}.html`);
  fs.writeFileSync(htmlPath, html);
  printPdf(htmlPath, path.join(PDFS, `${ep.id}.pdf`));
  collected.push({ ep, text });
}

const combinedBody = collected
  .map(({ ep, text }) => {
    return `<h2>${escapeHtml(ep.title)}</h2>
<div class="meta">
  <p><strong>Published:</strong> ${escapeHtml(ep.date)} &nbsp;·&nbsp; <strong>Length:</strong> ${escapeHtml(ep.duration)}</p>
  <p><strong>Source audio:</strong> ${escapeHtml(ep.url)}</p>
</div>
${paraHtml(text)}`;
  })
  .join("\n");

const combinedTitle = "Deliverance from Spirit Husbands and Spirit Wives";
const combinedMeta = `<p><strong>Speaker:</strong> Dr. Stella Immanuel</p>
  <p><strong>Ministry:</strong> Fire Power Ministries</p>
  <p><strong>Contents:</strong> three teachings, transcribed from the spoken audio</p>`;
const combinedHtml = pageShell(
  combinedTitle,
  "Three teachings, transcribed from the audio",
  combinedMeta,
  combinedBody
);
const combinedHtmlPath = path.join(HTML_DIR, "spirit-husbands-and-wives.html");
fs.writeFileSync(combinedHtmlPath, combinedHtml);
fs.writeFileSync(
  path.join(TRANSCRIPTS, "spirit-husbands-and-wives.txt"),
  collected
    .map(({ ep, text }) => `${ep.title}\n${ep.date}\n${ep.url}\n\n${text}`)
    .join("\n\n\n")
);
printPdf(combinedHtmlPath, path.join(PDFS, "spirit-husbands-and-wives.pdf"));
console.log("Done.");
