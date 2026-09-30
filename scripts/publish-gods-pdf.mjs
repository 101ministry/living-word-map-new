import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "data", "Are We Protecting the Gods of Bible.pdf");
const dest = path.join(root, "public", "downloads", "are-we-protecting-the-gods-of-the-bible.pdf");
const jsPath = path.join(root, "public", "downloads-pdfs.js");

const item = {
  title: "Are We Protecting the Gods of Bible?",
  summary:
    "Named gods of Scripture, the cult acts still sheltered as culture, and the fraternal temple blessing that hides shrine sex.",
  href: "downloads/are-we-protecting-the-gods-of-the-bible.pdf",
  download: "Are We Protecting the Gods of Bible.pdf",
  made: "2026-10-05",
};

if (!fs.existsSync(src)) {
  console.error("Missing source PDF:", src);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log("Copied", dest);

let js = fs.readFileSync(jsPath, "utf8");
const match = js.match(/window\.DOWNLOADS_PDFS\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
if (!match) {
  console.error("Could not parse downloads-pdfs.js");
  process.exit(1);
}
const data = Function('"use strict"; return (' + match[1] + ")")();
if (!Array.isArray(data.items)) {
  console.error("downloads-pdfs.js has no items array");
  process.exit(1);
}
const exists = data.items.some((row) =>
  String(row.href || "").includes("are-we-protecting-the-gods-of-the-bible.pdf")
);
if (!exists) {
  data.items.push(item);
  data.items.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "en"));
}
const out = "window.DOWNLOADS_PDFS = " + JSON.stringify(data, null, 2) + ";\n";
fs.writeFileSync(jsPath, out);
console.log(exists ? "Catalog already had the study." : "Added study to teaching PDF catalog.");
