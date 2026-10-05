import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ACCOUNT_ID = "220cb2fa91515cffc104e3fb0b452146";
const MODEL = "@cf/openai/whisper-large-v3-turbo";
const FALLBACK_MODEL = "@cf/openai/whisper";

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

async function transcribeFile(token, filePath, model = MODEL) {
  const buf = fs.readFileSync(filePath);
  const audioB64 = buf.toString("base64");
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${model}`;

  const jsonBody = {
    audio: audioB64,
    task: "transcribe",
    language: "en",
    vad_filter: true,
    initial_prompt:
      "Dealing with the Waster Spirit. Biblical teaching by Ashton Campbell on Isaiah, repentance, curses, and spiritual warfare.",
  };

  let res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jsonBody),
  });
  let text = await res.text();
  if (!res.ok) {
    // Try raw binary for the original whisper model / some gateways
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      body: buf,
    });
    text = await res.text();
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 400)}`);
  }
  if (!res.ok || parsed.success === false) {
    const err = parsed.errors?.[0]?.message || parsed.error || text.slice(0, 400);
    const e = new Error(`HTTP ${res.status}: ${err}`);
    e.status = res.status;
    e.body = parsed;
    throw e;
  }
  return parsed.result ?? parsed;
}

function extractText(result) {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result.text === "string") return result.text;
  if (Array.isArray(result.segments)) {
    return result.segments.map((s) => s.text || "").join(" ").trim();
  }
  if (typeof result.transcription === "string") return result.transcription;
  return JSON.stringify(result);
}

const mode = process.argv[2] || "test";
const token = readWranglerToken();

if (mode === "test") {
  const testFile = path.join(__dirname, "test-15s.mp3");
  console.log("Testing 15s clip with", MODEL);
  try {
    const result = await transcribeFile(token, testFile, MODEL);
    console.log("OK keys:", Object.keys(result || {}));
    console.log("TEXT:", extractText(result).slice(0, 800));
    fs.writeFileSync(path.join(__dirname, "test-15s.json"), JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("large-v3-turbo failed:", err.message);
    console.log("Trying fallback", FALLBACK_MODEL);
    const result = await transcribeFile(token, testFile, FALLBACK_MODEL);
    console.log("OK keys:", Object.keys(result || {}));
    console.log("TEXT:", extractText(result).slice(0, 800));
    fs.writeFileSync(path.join(__dirname, "test-15s.json"), JSON.stringify(result, null, 2));
  }
} else if (mode === "all") {
  const chunksDir = path.join(__dirname, "chunks");
  const outDir = path.join(__dirname, "partials");
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs
    .readdirSync(chunksDir)
    .filter((f) => f.endsWith(".mp3"))
    .sort();
  const model = process.argv[3] || MODEL;
  const parts = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const partialPath = path.join(outDir, file.replace(".mp3", ".json"));
    const txtPath = path.join(outDir, file.replace(".mp3", ".txt"));
    if (fs.existsSync(txtPath)) {
      const existing = fs.readFileSync(txtPath, "utf8");
      console.log(`[${i + 1}/${files.length}] skip ${file} (${existing.length} chars)`);
      parts.push(existing);
      continue;
    }
    console.log(`[${i + 1}/${files.length}] transcribing ${file}...`);
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await transcribeFile(token, path.join(chunksDir, file), model);
        fs.writeFileSync(partialPath, JSON.stringify(result, null, 2));
        const t = extractText(result).trim();
        fs.writeFileSync(txtPath, t);
        console.log(`  -> ${t.length} chars`);
        parts.push(t);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        console.error(`  attempt ${attempt} failed:`, err.message);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    if (lastErr) throw lastErr;
  }
  const full = parts.filter(Boolean).join("\n\n");
  fs.writeFileSync(path.join(__dirname, "transcript.txt"), full);
  console.log("Wrote transcript.txt,", full.length, "chars");
} else {
  console.error("Usage: node transcribe.mjs [test|all] [model]");
  process.exit(1);
}
