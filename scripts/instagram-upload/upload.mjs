#!/usr/bin/env node
/**
 * Instagram Reels uploader via Meta Graph API (resumable upload).
 *
 * Secrets: %USERPROFILE%\.living-word-map\instagram\config.json
 *   { "accessToken": "...", "igUserId": "...", "graphVersion": "v21.0" }
 *
 * One-time Meta setup:
 *   1) developers.facebook.com → App → Instagram product
 *   2) Connect IG Business/Creator account to a Facebook Page
 *   3) Generate User token with: instagram_basic, instagram_content_publish,
 *      pages_show_list, pages_read_engagement
 *   4) node upload.mjs discover --token "EAA..."  (saves igUserId + token)
 *
 * Commands:
 *   node upload.mjs discover --token "EAA..."
 *   node upload.mjs upload --file clip.mp4 --meta clip.instagram.json
 *   node upload.mjs upload-dir --dir "...\instagram-uploads" --limit 1 --delete-after
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOME_DIR = path.join(os.homedir(), ".living-word-map", "instagram");
const DEFAULT_CONFIG = path.join(HOME_DIR, "config.json");
const DEFAULT_GRAPH = "v21.0";
const CAPTION_MAX = 2200;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--delete-after") out.deleteAfter = true;
    else if (a.startsWith("--") && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      out[a.slice(2)] = argv[++i];
    } else if (!a.startsWith("--")) {
      out._.push(a);
    }
  }
  return out;
}

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Missing config:\n  ${configPath}\nRun: node upload.mjs discover --token "YOUR_LONG_LIVED_TOKEN"`
    );
  }
  const raw = JSON.parse(fs.readFileSync(configPath, "utf8").replace(/^\uFEFF/, ""));
  if (!raw.accessToken || !raw.igUserId) {
    throw new Error("config.json needs accessToken and igUserId. Run discover first.");
  }
  return {
    accessToken: raw.accessToken,
    igUserId: String(raw.igUserId),
    graphVersion: raw.graphVersion || DEFAULT_GRAPH,
  };
}

function saveConfig(configPath, data) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function graphJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 400)}`);
  }
  if (!res.ok || data.error) {
    const msg = data.error?.message || text.slice(0, 400);
    const code = data.error?.code ? ` [${data.error.code}]` : "";
    throw new Error(`${msg}${code}`);
  }
  return data;
}

async function discoverIgUserId(accessToken, graphVersion) {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/me/accounts`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("fields", "id,name,instagram_business_account{id,username}");
  const data = await graphJson(url);
  const pages = data.data || [];
  const withIg = pages.filter((p) => p.instagram_business_account?.id);
  if (!withIg.length) {
    throw new Error(
      "No Facebook Page with a linked Instagram Business/Creator account found for this token."
    );
  }
  return withIg.map((p) => ({
    pageId: p.id,
    pageName: p.name,
    igUserId: p.instagram_business_account.id,
    igUsername: p.instagram_business_account.username || "",
  }));
}

async function cmdDiscover(args) {
  const token = args.token || args.accessToken;
  if (!token) throw new Error("Need --token with a long-lived User access token.");
  const graphVersion = args["graph-version"] || DEFAULT_GRAPH;
  const configPath = args.config || DEFAULT_CONFIG;

  const matches = await discoverIgUserId(token, graphVersion);
  console.log("Linked Instagram accounts:");
  for (const m of matches) {
    console.log(`  @${m.igUsername || "?"}  igUserId=${m.igUserId}  (page: ${m.pageName})`);
  }

  const pick = matches[0];
  saveConfig(configPath, {
    accessToken: token,
    igUserId: pick.igUserId,
    igUsername: pick.igUsername,
    pageId: pick.pageId,
    graphVersion,
  });
  console.log(`\nSaved:\n  ${configPath}`);
  console.log(`Using @${pick.igUsername || pick.igUserId}`);
}

function readMetaFile(metaPath) {
  const raw = fs.readFileSync(metaPath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function loadCaption(args) {
  let caption = args.caption || "";
  if (args.meta) {
    const meta = readMetaFile(args.meta);
    caption = caption || meta.caption || meta.summary || "";
  }
  if (args["caption-file"]) {
    caption = fs.readFileSync(args["caption-file"], "utf8").replace(/^\uFEFF/, "");
  }
  caption = caption.replace(/\r\n/g, "\n").trim();
  if (!caption) throw new Error("Need --caption, --caption-file, or --meta with caption/summary.");
  if (caption.length > CAPTION_MAX) {
    console.warn(`Caption is ${caption.length} chars; Instagram max is ${CAPTION_MAX}. Truncating.`);
    caption = caption.slice(0, CAPTION_MAX);
  }
  return caption;
}

async function createResumableContainer(config, caption) {
  const url = new URL(
    `https://graph.facebook.com/${config.graphVersion}/${config.igUserId}/media`
  );
  url.searchParams.set("access_token", config.accessToken);
  url.searchParams.set("media_type", "REELS");
  url.searchParams.set("upload_type", "resumable");
  url.searchParams.set("caption", caption);
  return graphJson(url, { method: "POST" });
}

async function uploadBinary(config, containerId, filePath) {
  const abs = path.resolve(filePath);
  const stat = fs.statSync(abs);
  const url = `https://rupload.facebook.com/ig-api-upload/${config.graphVersion}/${containerId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${config.accessToken}`,
      offset: "0",
      file_size: String(stat.size),
      "Content-Type": "application/octet-stream",
    },
    body: fs.readFileSync(abs),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(`rupload failed (${res.status}): ${text.slice(0, 400)}`);
    return { success: true };
  }
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || text.slice(0, 400));
  }
  return data;
}

async function waitForContainer(config, containerId, maxWaitMs = 300_000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const url = new URL(`https://graph.facebook.com/${config.graphVersion}/${containerId}`);
    url.searchParams.set("access_token", config.accessToken);
    url.searchParams.set("fields", "status_code,status");
    const data = await graphJson(url);
    const code = data.status_code;
    if (code === "FINISHED") return data;
    if (code === "ERROR" || code === "EXPIRED") {
      throw new Error(`Container ${code}: ${data.status || ""}`);
    }
    console.log(`  processing… status_code=${code || "?"}`);
    await sleep(5000);
  }
  throw new Error("Timeout waiting for Instagram video processing.");
}

async function publishContainer(config, containerId) {
  const url = new URL(
    `https://graph.facebook.com/${config.graphVersion}/${config.igUserId}/media_publish`
  );
  url.searchParams.set("access_token", config.accessToken);
  url.searchParams.set("creation_id", containerId);
  return graphJson(url, { method: "POST" });
}

async function uploadReel(config, args) {
  const filePath = args.file;
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Missing video file: ${filePath || "(none)"}`);
  }
  const caption = loadCaption(args);
  const abs = path.resolve(filePath);
  console.log(`Uploading Reel: ${abs}`);
  console.log(`Caption length: ${caption.length}`);

  const container = await createResumableContainer(config, caption);
  const containerId = container.id;
  if (!containerId) throw new Error("No container id returned from Meta.");
  console.log(`Container: ${containerId}`);

  await uploadBinary(config, containerId, abs);
  console.log("Binary uploaded; waiting for processing…");
  await waitForContainer(config, containerId);

  const published = await publishContainer(config, containerId);
  const mediaId = published.id;
  console.log(`Published media id: ${mediaId}`);
  if (config.igUsername) {
    console.log(`Profile: https://www.instagram.com/${config.igUsername}/`);
  }
  return mediaId;
}

function readLog(logPath) {
  if (!fs.existsSync(logPath)) return [];
  return fs
    .readFileSync(logPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function appendLog(logPath, row) {
  fs.appendFileSync(logPath, JSON.stringify(row) + "\n", "utf8");
}

function unlinkQuiet(filePath) {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function deleteAfterUpload(absDir, mp4Name) {
  const removed = [];
  const mp4 = path.join(absDir, mp4Name);
  const meta = mp4 + ".instagram.json";
  if (unlinkQuiet(mp4)) removed.push(mp4Name);
  if (unlinkQuiet(meta)) removed.push(path.basename(meta));
  if (removed.length) console.log(`Removed from queue: ${removed.join(" | ")}`);
}

async function uploadDir(config, args) {
  const dir = args.dir;
  if (!dir || !fs.existsSync(dir)) throw new Error(`Missing --dir folder: ${dir || "(none)"}`);
  const absDir = path.resolve(dir);
  const logPath = path.join(absDir, "_instagram-upload-log.jsonl");
  const done = new Set(readLog(logPath).filter((r) => r.ok && r.file).map((r) => r.file));
  const files = fs
    .readdirSync(absDir)
    .filter((n) => n.toLowerCase().endsWith(".mp4"))
    .sort((a, b) => a.localeCompare(b));

  const limit = args.limit ? Number(args.limit) : Infinity;
  let pending = 0;
  let ok = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Folder: ${absDir}`);
  console.log(`Videos: ${files.length}  already uploaded: ${done.size}`);

  for (const name of files) {
    if (done.has(name)) {
      skipped++;
      console.log(`SKIP ${name}`);
      continue;
    }
    if (pending >= limit) {
      console.log(`LIMIT ${limit} reached. Remaining files wait for next run.`);
      break;
    }
    pending++;
    const file = path.join(absDir, name);
    const meta = file + ".instagram.json";
    if (!fs.existsSync(meta)) {
      failed++;
      appendLog(logPath, {
        ok: false,
        file: name,
        error: "missing .instagram.json sidecar",
        at: new Date().toISOString(),
      });
      console.error(`NO META ${name} (expected ${path.basename(meta)})`);
      continue;
    }
    try {
      const id = await uploadReel(config, { file, meta });
      ok++;
      appendLog(logPath, { ok: true, file: name, id, at: new Date().toISOString() });
      if (args.deleteAfter) deleteAfterUpload(absDir, name);
    } catch (err) {
      failed++;
      const message = err?.message || String(err);
      appendLog(logPath, { ok: false, file: name, error: message, at: new Date().toISOString() });
      console.error(`FAIL ${name}: ${message}`);
    }
  }
  console.log(`Done. uploaded=${ok} skipped=${skipped} failed=${failed}`);
  console.log(`Log: ${logPath}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || "help";
  const configPath = args.config || DEFAULT_CONFIG;

  if (cmd === "help" || cmd === "-h" || cmd === "--help") {
    console.log(`Instagram Reels uploader (Meta Graph API)

Config: ${DEFAULT_CONFIG}

Setup:
  1) Meta App with Instagram API + permissions listed in upload.mjs header
  2) node upload.mjs discover --token "LONG_LIVED_USER_TOKEN"
  3) Drop MP4 + matching clip.instagram.json into the queue folder
  4) node upload.mjs upload-dir --dir "path\\to\\instagram-uploads" --limit 1

Sidecar (.instagram.json):
  { "file": "clip.mp4", "caption": "Summary paragraph\\n\\n #Tag1 #Tag2\\n\\n#RepentanceProject ..." }

Commands:
  node upload.mjs discover --token "EAA..."
  node upload.mjs upload --file clip.mp4 --meta clip.instagram.json
  node upload.mjs upload-dir --dir "..." --limit 1 --delete-after
`);
    return;
  }

  if (cmd === "discover") {
    await cmdDiscover(args);
    return;
  }

  const config = loadConfig(configPath);

  if (cmd === "upload") {
    await uploadReel(config, args);
    return;
  }

  if (cmd === "upload-dir") {
    await uploadDir(config, args);
    return;
  }

  throw new Error(`Unknown command: ${cmd}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
