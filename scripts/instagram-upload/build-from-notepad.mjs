#!/usr/bin/env node
/**
 * Parse upload-metadata-notepad.txt and write .instagram.json sidecars for SHORT sections.
 *
 *   node build-from-notepad.mjs --notepad "...\upload-metadata-notepad.txt" --queue "...\instagram-uploads"
 *   node build-from-notepad.mjs --notepad ... --queue ... --sections 19,20,21,22
 *   node build-from-notepad.mjs --notepad ... --queue ... --all-short
 */
import fs from "node:fs";
import path from "node:path";
import { buildInstagramCaption } from "./write-sidecar.mjs";

function parseArgs(argv) {
  const out = { _: [], sections: null, allShort: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all-short") out.allShort = true;
    else if (a.startsWith("--") && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      const key = a.slice(2);
      if (key === "sections") {
        out.sections = argv[++i].split(",").map((s) => Number(s.trim()));
      } else {
        out[key] = argv[++i];
      }
    } else if (!a.startsWith("--")) {
      out._.push(a);
    }
  }
  return out;
}

function slugify(name) {
  return name
    .replace(/\.txt$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseNotepad(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  const sections = [];
  const blocks = normalized.split(/={80,}/);
  for (const block of blocks) {
    const header = block.match(/^\s*\[(\d+)\](?:\s+(SHORT|YOUTUBE SEGMENT))?/m);
    if (!header) continue;
    const num = Number(header[1]);
    const kind = header[2] || "FULL";
    const source = block.match(/Source transcript:\s*(.+)/)?.[1]?.trim();
    const title = block.match(/\nTITLE\n([\s\S]*?)\n\nYOUTUBE/m)?.[1]?.trim();
    const instagramHashtags = block.match(/\nINSTAGRAM HASHTAGS\n([\s\S]*?)\n\nSUMMARY/m)?.[1]?.trim();
    const summaryMatch = block.match(/\nSUMMARY\n([\s\S]*?)(?:\n={|$)/);
    const summary = summaryMatch?.[1]?.trim() || "";
    const isShort = kind === "SHORT" || /\bSHORT\b/.test(block.slice(0, 80));
    const isYoutubeOnly = kind === "YOUTUBE SEGMENT" || /\bYOUTUBE SEGMENT\b/.test(block.slice(0, 80));
    sections.push({
      num,
      kind: isShort ? "SHORT" : isYoutubeOnly ? "YOUTUBE" : "FULL",
      source,
      sourceSlug: source ? slugify(source) : "",
      title,
      instagramHashtags,
      summary,
    });
  }
  return sections;
}

function findMp4(queueDir, sourceSlug) {
  if (!sourceSlug) return null;
  const files = fs.readdirSync(queueDir).filter((n) => n.toLowerCase().endsWith(".mp4"));
  const slug = sourceSlug.toLowerCase();
  let hit = files.find((f) => f.toLowerCase().includes(slug));
  if (hit) return hit;
  // Riverside stems often truncate; try longest prefix match
  let best = null;
  let bestLen = 0;
  for (const f of files) {
    const lower = f.toLowerCase();
    for (let len = slug.length; len >= 12; len--) {
      const prefix = slug.slice(0, len);
      if (lower.includes(prefix) && len > bestLen) {
        best = f;
        bestLen = len;
      }
    }
  }
  return best;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const notepad = args.notepad;
  const queue = args.queue;
  if (!notepad || !fs.existsSync(notepad)) throw new Error("Need --notepad path to upload-metadata-notepad.txt");
  if (!queue) throw new Error("Need --queue path to instagram-uploads folder");
  fs.mkdirSync(queue, { recursive: true });

  const sections = parseNotepad(fs.readFileSync(notepad, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n"));
  let picked = sections;
  if (args.allShort) {
    picked = sections.filter((s) => s.kind === "SHORT" || (s.kind === "FULL" && s.instagramHashtags));
  } else if (args.sections?.length) {
    const want = new Set(args.sections);
    picked = sections.filter((s) => want.has(s.num));
  }

  let wrote = 0;
  let skipped = 0;
  for (const s of picked) {
    if (s.kind === "YOUTUBE") {
      console.log(`SKIP [${s.num}] YOUTUBE SEGMENT (no Instagram sidecar)`);
      skipped++;
      continue;
    }
    if (!s.instagramHashtags) {
      console.log(`SKIP [${s.num}] no INSTAGRAM HASHTAGS block`);
      skipped++;
      continue;
    }
    const mp4 = findMp4(queue, s.sourceSlug);
    if (!mp4) {
      console.log(`NO MP4 [${s.num}] source=${s.source || "?"} (drop matching export in queue)`);
      skipped++;
      continue;
    }
    const caption = buildInstagramCaption({
      title: s.title,
      summary: s.summary,
      instagramHashtags: s.instagramHashtags,
    });
    const sidecarPath = path.join(queue, mp4 + ".instagram.json");
    fs.writeFileSync(
      sidecarPath,
      JSON.stringify({ file: mp4, title: s.title, caption, notepadSection: s.num }, null, 2) + "\n",
      "utf8"
    );
    console.log(`OK [${s.num}] ${mp4}`);
    wrote++;
  }
  console.log(`Done. sidecars=${wrote} skipped=${skipped}`);
}

main();
