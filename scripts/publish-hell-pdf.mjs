import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "data", "How Did Jesus Know About Hell.pdf");
const dest = path.join(root, "public", "downloads", "how-did-jesus-know-about-hell.pdf");
const jsPath = path.join(root, "public", "downloads-pdfs.js");

const item = {
  title: "How Did Jesus Know About Hell?",
  summary:
    "What Scripture records about hell, and Repentance101's stance that Jesus went there: three days, 259,200 seconds, and love for the Father afterward.",
  href: "downloads/how-did-jesus-know-about-hell.pdf",
  download: "How Did Jesus Know About Hell.pdf",
  made: "2026-09-23",
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
const exists = data.items.some((row) => String(row.href || "").includes("how-did-jesus-know-about-hell.pdf"));
if (!exists) {
  data.items.push(item);
  data.items.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "en"));
}
const out =
  "window.DOWNLOADS_PDFS = " +
  JSON.stringify(data, null, 2).replace(/\n/g, "\n") +
  ";\n";
fs.writeFileSync(jsPath, out);
console.log(exists ? "Catalog already had the study." : "Added study to teaching PDF catalog.");
