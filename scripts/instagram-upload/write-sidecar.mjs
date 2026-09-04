#!/usr/bin/env node
/**
 * Build {clip}.instagram.json sidecar for Meta Graph API upload.
 *
 *   node write-sidecar.mjs --file clip.mp4 --summary "..." --instagram-hashtags " #Tag1 #Tag2"
 *   node write-sidecar.mjs --file clip.mp4 --summary-file summary.txt --instagram-hashtags " #Tag1"
 *   node write-sidecar.mjs --file clip.mp4 --title "My Title" --summary "..." --instagram-hashtags " #Tag1"
 *
 * Caption order: optional title, summary body, Instagram hashtags, shared footer.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FOOTER =
  "#RepentanceProject #PrayerTopics #LivingWordMap #RR2026 #Deliverance #SpiritualWarfare #Principalities #Repentance https://map.repentance101.com";

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--") && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      out[a.slice(2)] = argv[++i];
    } else if (!a.startsWith("--")) {
      out._.push(a);
    }
  }
  return out;
}

function splitSummaryAndFooter(summaryRaw) {
  const text = summaryRaw.replace(/\r\n/g, "\n").trim();
  const footerIdx = text.indexOf(FOOTER);
  if (footerIdx >= 0) {
    const body = text.slice(0, footerIdx).trim();
    const footer = text.slice(footerIdx).trim();
    return { body, footer };
  }
  const parts = text.split(/\n\s*\n/);
  const last = parts[parts.length - 1] || "";
  if (last.startsWith("#RepentanceProject")) {
    return {
      body: parts.slice(0, -1).join("\n\n").trim(),
      footer: last.trim(),
    };
  }
  return { body: text, footer: FOOTER };
}

export function buildInstagramCaption({ title, summary, instagramHashtags }) {
  const { body, footer } = splitSummaryAndFooter(summary);
  const tags = (instagramHashtags || "").trim();
  const chunks = [];
  if (title?.trim()) chunks.push(title.trim());
  if (body) chunks.push(body);
  if (tags) chunks.push(tags);
  chunks.push(footer);
  return chunks.join("\n\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = args.file;
  if (!file) throw new Error("Need --file clip.mp4");

  let summary = args.summary || "";
  if (args["summary-file"]) {
    summary = fs.readFileSync(args["summary-file"], "utf8").replace(/^\uFEFF/, "");
  }
  if (!summary.trim()) throw new Error("Need --summary or --summary-file");

  const caption = buildInstagramCaption({
    title: args.title,
    summary,
    instagramHashtags: args["instagram-hashtags"] || args.instagramHashtags,
  });

  const outPath = args.out || file + ".instagram.json";
  const sidecar = {
    file: path.basename(file),
    caption,
  };
  if (args.title) sidecar.title = args.title;

  fs.writeFileSync(outPath, JSON.stringify(sidecar, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath} (${caption.length} chars)`);
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
