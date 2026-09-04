#!/usr/bin/env node
/**
 * Upload a local MP4 to YouTube with title / tags / description.
 *
 * Secrets live in %USERPROFILE%\.living-word-map\youtube\
 *   client_secret.json  (downloaded from Google Cloud)
 *   token.json          (written after the first browser login)
 *
 * Commands:
 *   node upload.mjs auth
 *   node upload.mjs upload --file clip.mp4 --title "..." --description-file desc.txt
 *   node upload.mjs upload --file clip.mp4 --meta clip.json
 */
import { exec } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
];
const AUTH_PORT = 8766;
const CATEGORY_EDUCATION = "27";
const HOME_DIR = path.join(os.homedir(), ".living-word-map", "youtube");
const DEFAULT_CLIENT = path.join(HOME_DIR, "client_secret.json");
const DEFAULT_TOKEN = path.join(HOME_DIR, "token.json");

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-shorts") {
      out.shorts = false;
    } else if (a === "--delete-after") {
      out.deleteAfter = true;
    } else if (a.startsWith("--") && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      out[a.slice(2)] = argv[++i];
    } else if (!a.startsWith("--")) {
      out._.push(a);
    }
  }
  if (out.shorts === undefined) out.shorts = true;
  return out;
}

async function loadGoogle() {
  const { google } = await import("googleapis");
  return google;
}

function loadClientSecrets(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing OAuth client file:\n  ${filePath}\nDownload it from Google Cloud (Desktop app) and save it there.`
    );
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const conf = raw.installed || raw.web;
  if (!conf?.client_id || !conf?.client_secret) {
    throw new Error("client_secret.json needs an installed or web client_id and client_secret.");
  }
  return conf;
}

function makeOAuthClient(google, conf, tokenPath) {
  const redirect = `http://localhost:${AUTH_PORT}`;
  const client = new google.auth.OAuth2(conf.client_id, conf.client_secret, redirect);
  if (fs.existsSync(tokenPath)) {
    client.setCredentials(JSON.parse(fs.readFileSync(tokenPath, "utf8")));
  }
  client.on("tokens", (tokens) => {
    const merged = { ...client.credentials, ...tokens };
    fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
    fs.writeFileSync(tokenPath, JSON.stringify(merged, null, 2), "utf8");
  });
  return client;
}

function saveToken(tokenPath, credentials) {
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  fs.writeFileSync(tokenPath, JSON.stringify(credentials, null, 2), "utf8");
}

async function runAuth(client, tokenPath) {
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const u = new URL(req.url, `http://localhost:${AUTH_PORT}`);
        if (u.pathname !== "/") {
          res.writeHead(404);
          res.end();
          return;
        }
        const qCode = u.searchParams.get("code");
        const err = u.searchParams.get("error");
        if (err) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end(`OAuth error: ${err}`);
          server.close();
          reject(new Error(err));
          return;
        }
        if (!qCode) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing code");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<p>YouTube login saved. You can close this tab and return to the terminal.</p>");
        server.close();
        resolve(qCode);
      } catch (e) {
        reject(e);
      }
    });
    server.listen(AUTH_PORT, "127.0.0.1", () => {
      console.log("Opening browser for Google login…");
      console.log(authUrl);
      const opener =
        process.platform === "win32"
          ? `start "" "${authUrl}"`
          : process.platform === "darwin"
            ? `open "${authUrl}"`
            : `xdg-open "${authUrl}"`;
      exec(opener);
    });
    server.on("error", reject);
  });

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  saveToken(tokenPath, tokens);
  console.log(`Saved token:\n  ${tokenPath}`);
}

function readMetaFile(metaPath) {
  const raw = fs.readFileSync(metaPath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function privacyFromMeta(meta) {
  const privacy = (meta?.privacy || "").toLowerCase();
  return ["private", "unlisted", "public"].includes(privacy) ? privacy : null;
}

function readMetaPrivacy(metaPath) {
  if (!metaPath || !fs.existsSync(metaPath)) return null;
  return privacyFromMeta(readMetaFile(metaPath));
}

function resolvePrivacy({ metaPath, cliPrivacy, fallback = "private" }) {
  return readMetaPrivacy(metaPath) || (cliPrivacy || fallback).toLowerCase();
}
  return (hashtagLine || "")
    .split(/\s+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 15);
}

function loadMeta(args) {
  let title = args.title || "";
  let description = args.description || "";
  let hashtags = args.hashtags || "";

  if (args.meta) {
    const meta = readMetaFile(args.meta);
    title = title || meta.title || "";
    hashtags = hashtags || meta.hashtags || "";
    description = description || meta.summary || meta.description || "";
  }
  if (args["description-file"]) {
    description = fs.readFileSync(args["description-file"], "utf8").replace(/^\uFEFF/, "");
  }
  if (args["title-file"]) {
    title = fs.readFileSync(args["title-file"], "utf8").replace(/^\uFEFF/, "").trim();
  }

  title = title.trim();
  description = description.replace(/\r\n/g, "\n").trim();
  hashtags = hashtags.trim();

  if (args.shorts !== false && title && !/#Shorts\b/i.test(title)) {
    const withShorts = `${title} #Shorts`;
    if (withShorts.length <= 100) title = withShorts;
    else if (!/#Shorts\b/i.test(description)) {
      description = `${description}\n\n#Shorts`.trim();
    }
  }

  if (!title) throw new Error("Need --title, --title-file, or --meta with a title.");
  if (title.length > 100) {
    console.warn(`Title is ${title.length} chars; YouTube max is 100. Truncating.`);
    title = title.slice(0, 100);
  }
  if (!description) throw new Error("Need --description, --description-file, or --meta with a summary.");

  return { title, description, tags: hashtagsToTags(hashtags) };
}

async function uploadVideo(google, client, args) {
  const filePath = args.file;
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Missing video file: ${filePath || "(none)"}`);
  }

  const { title, description, tags } = loadMeta(args);
  const privacy = resolvePrivacy({ metaPath: args.meta, cliPrivacy: args.privacy, fallback: "private" });
  if (!["private", "unlisted", "public"].includes(privacy)) {
    throw new Error("privacy must be private, unlisted, or public");
  }

  const youtube = google.youtube({ version: "v3", auth: client });
  const abs = path.resolve(filePath);
  console.log(`Uploading (${privacy}): ${abs}`);
  console.log(`Title: ${title}`);

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title,
        description,
        tags,
        categoryId: args.category || CATEGORY_EDUCATION,
        defaultLanguage: "en",
        defaultAudioLanguage: "en",
      },
      status: {
        privacyStatus: privacy,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(abs),
    },
  });

  const id = res.data.id;
  console.log(`Uploaded: https://youtu.be/${id}`);
  console.log(`Studio:   https://studio.youtube.com/video/${id}/edit`);
  return id;
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

function isQuotaError(err) {
  const text = `${err?.message || ""} ${JSON.stringify(err?.errors || err?.response?.data || "")}`;
  return /quota|dailyLimitExceeded|rateLimitExceeded/i.test(text);
}

function normalizeSlug(name) {
  return String(name)
    .toLowerCase()
    .replace(/^riverside_/, "")
    .replace(/_norm_m \(repentance1(_\d+)?$/i, "")
    .replace(/\.(mp4|txt|json)$/i, "")
    .replace(/\s*\(\d+\)$/, "")
    .replace(/-\d+$/, "")
    .replace(/'/g, "")
    .replace(/[_\s,.\-]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-s-/g, "s-")
    .replace(/-s$/, "s")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 1 = base file; 2 = (1) txt or repentance1_2 mp4; etc. */
function fileVariant(stem) {
  const mp4Match = String(stem).match(/repentance1_(\d+)$/i);
  if (mp4Match) return Number(mp4Match[1]);
  const parenMatch = String(stem).match(/\s*\((\d+)\)$/);
  if (parenMatch) return Number(parenMatch[1]) + 1;
  const dashMatch = String(stem).match(/-(\d+)$/);
  if (dashMatch) return Number(dashMatch[1]);
  return 1;
}

function slugsMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 18 && b.startsWith(a)) return true;
  if (b.length >= 18 && a.startsWith(b)) return true;
  return false;
}

function listTxtNames(absDir) {
  return fs.readdirSync(absDir).filter((n) => n.toLowerCase().endsWith(".txt"));
}

/** Pick the transcript that belongs to this exact video variant. */
function matchTranscriptForVideo(mp4Name, txtNames) {
  const mp4Stem = mp4Name.replace(/\.mp4$/i, "");
  const mp4Slug = normalizeSlug(mp4Stem);
  const mp4Var = fileVariant(mp4Stem);
  const candidates = txtNames
    .map((name) => {
      const stem = name.replace(/\.txt$/i, "");
      return { name, slug: normalizeSlug(stem), variant: fileVariant(stem) };
    })
    .filter((c) => slugsMatch(mp4Slug, c.slug));

  if (!candidates.length) return null;

  const exact = candidates.filter((c) => c.variant === mp4Var);
  if (exact.length === 1) return exact[0].name;
  if (exact.length > 1) return exact.sort((a, b) => a.name.localeCompare(b.name))[0].name;

  if (candidates.length === 1) return candidates[0].name;

  if (mp4Var === 1) {
    const base = candidates.filter((c) => c.variant === 1);
    if (base.length === 1) return base[0].name;
  }

  return null;
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
  const meta = mp4 + ".json";
  if (unlinkQuiet(mp4)) removed.push(mp4Name);
  if (unlinkQuiet(meta)) removed.push(path.basename(meta));
  const txt = matchTranscriptForVideo(mp4Name, listTxtNames(absDir));
  if (txt && unlinkQuiet(path.join(absDir, txt))) removed.push(txt);
  if (removed.length) console.log(`Removed from queue: ${removed.join(" | ")}`);
}

async function uploadDir(google, client, args) {
  const dir = args.dir;
  if (!dir || !fs.existsSync(dir)) throw new Error(`Missing --dir folder: ${dir || "(none)"}`);
  const absDir = path.resolve(dir);
  const logPath = path.join(absDir, "_upload-log.jsonl");
  const done = new Set(readLog(logPath).filter((r) => r.ok && r.file).map((r) => r.file));
  const files = fs
    .readdirSync(absDir)
    .filter((n) => n.toLowerCase().endsWith(".mp4"))
    .sort((a, b) => a.localeCompare(b));

  const limit = args.limit ? Number(args.limit) : Infinity;
  let pending = 0;

  console.log(`Folder: ${absDir}`);
  console.log(`Videos: ${files.length}  already uploaded: ${done.size}`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const name of files) {
    if (done.has(name)) {
      skipped++;
      console.log(`SKIP ${name}`);
      continue;
    }
    if (pending >= limit) {
      console.log(`LIMIT ${limit} reached. Remaining files will wait.`);
      break;
    }
    pending++;
    const file = path.join(absDir, name);
    const meta = file + ".json";
    if (!fs.existsSync(meta)) {
      failed++;
      appendLog(logPath, { ok: false, file: name, error: "missing sidecar json", at: new Date().toISOString() });
      console.error(`NO META ${name}`);
      continue;
    }
    try {
      const id = await uploadVideo(google, client, {
        file,
        meta,
        privacy: args.privacy,
        shorts: args.shorts,
      });
      ok++;
      appendLog(logPath, { ok: true, file: name, id, url: `https://youtu.be/${id}`, at: new Date().toISOString() });
      if (args.deleteAfter) deleteAfterUpload(absDir, name);
    } catch (err) {
      failed++;
      const message = err?.message || String(err);
      appendLog(logPath, { ok: false, file: name, error: message, at: new Date().toISOString() });
      console.error(`FAIL ${name}: ${message}`);
      if (isQuotaError(err)) {
        console.error("YouTube daily quota hit. Stopped. Re-run this command tomorrow to continue.");
        break;
      }
    }
  }
  console.log(`Done. uploaded=${ok} skipped=${skipped} failed=${failed}`);
  console.log(`Log: ${logPath}`);
}

async function publishLog(google, client, args) {
  const dir = args.dir;
  if (!dir || !fs.existsSync(dir)) throw new Error(`Missing --dir folder: ${dir || "(none)"}`);
  const logPath = path.join(path.resolve(dir), "_upload-log.jsonl");
  const privacy = (args.privacy || "public").toLowerCase();
  const rows = readLog(logPath).filter((r) => r.ok && r.id);
  if (!rows.length) throw new Error(`No successful uploads in ${logPath}`);
  const youtube = google.youtube({ version: "v3", auth: client });
  let ok = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      await youtube.videos.update({
        part: ["status"],
        requestBody: {
          id: row.id,
          status: {
            privacyStatus: privacy,
            selfDeclaredMadeForKids: false,
          },
        },
      });
      ok++;
      console.log(`PUBLIC https://youtu.be/${row.id}  ${row.file}`);
    } catch (err) {
      failed++;
      console.error(`FAIL ${row.id}: ${err?.message || err}`);
      if (isQuotaError(err)) {
        console.error("YouTube quota hit while publishing. Stopped.");
        break;
      }
    }
  }
  console.log(`Publish done. updated=${ok} failed=${failed} privacy=${privacy}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || "help";
  const clientPath = args["client-secret"] || DEFAULT_CLIENT;
  const tokenPath = args.token || DEFAULT_TOKEN;

  if (cmd === "help" || cmd === "-h" || cmd === "--help") {
    console.log(`YouTube Shorts uploader (OAuth)

Secrets folder:
  ${HOME_DIR}

  1) Google Cloud → enable YouTube Data API v3
  2) OAuth consent (External) → add yourself as a test user
  3) Credentials → OAuth client ID → Desktop app
  4) Download JSON → save as:
       ${DEFAULT_CLIENT}

Commands:
  node upload.mjs auth
  node upload.mjs upload --file clip.mp4 --title "Title" --hashtags "#A #B" --description-file desc.txt
  node upload.mjs upload --file clip.mp4 --meta clip.json --privacy private
  node upload.mjs upload-dir --dir "C:\\path\\to\\shorts" --privacy private
  node upload.mjs upload-dir --dir "C:\\path\\to\\uploads" --privacy public --limit 1 --delete-after

JSON --meta:
  { "title": "...", "hashtags": "#A #B", "summary": "paragraph\\n\\nshared tags", "privacy": "private" }

Sidecar "privacy" overrides --privacy when set (private, unlisted, or public).
Queue without a privacy field uses --privacy from the command (scheduler uses public for legacy queue).
New batches should set "privacy": "private" in every sidecar.

Default privacy is private. Default adds #Shorts to the title when it fits.
Use --no-shorts to skip that. Use --privacy unlisted or public when ready.
Use --delete-after with upload-dir to remove the video, sidecar, and matching transcript after a successful upload.
`);
    return;
  }

  const google = await loadGoogle();
  const conf = loadClientSecrets(clientPath);
  const client = makeOAuthClient(google, conf, tokenPath);

  if (cmd === "auth") {
    await runAuth(client, tokenPath);
    return;
  }

  if (cmd === "upload") {
    if (!client.credentials?.refresh_token && !client.credentials?.access_token) {
      await runAuth(client, tokenPath);
    }
    await uploadVideo(google, client, args);
    return;
  }

  if (cmd === "upload-dir") {
    if (!client.credentials?.refresh_token && !client.credentials?.access_token) {
      await runAuth(client, tokenPath);
    }
    await uploadDir(google, client, args);
    return;
  }

  if (cmd === "publish-log") {
    if (!client.credentials?.refresh_token && !client.credentials?.access_token) {
      await runAuth(client, tokenPath);
    }
    await publishLog(google, client, args);
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
