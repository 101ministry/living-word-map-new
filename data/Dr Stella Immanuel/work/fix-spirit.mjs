import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === "audio" || name === "chunks" || name === "work") continue;
      walk(full, out);
    } else if (/\.(txt|html)$/i.test(name)) out.push(full);
  }
  return out;
}

function fix(text) {
  let n = 0;
  const next = text.replace(/\bsweet (husbands|wives|husband|wife)\b/gi, (m, word) => {
    n += 1;
    const spirit = m[0] === "S" ? "Spirit" : "spirit";
    return `${spirit} ${word.toLowerCase()}`;
  });
  return { next, n };
}

let total = 0;
for (const file of walk(root)) {
  const text = fs.readFileSync(file, "utf8");
  const { next, n } = fix(text);
  if (n) {
    fs.writeFileSync(file, next);
    total += n;
    console.log(`${n}\t${path.relative(root, file)}`);
  }
}
console.log("replacements", total);

const htmlDir = path.join(root, "html");
const pdfDir = path.join(root, "pdfs");
for (const file of fs.readdirSync(htmlDir).filter((f) => f.endsWith(".html"))) {
  const html = path.join(htmlDir, file);
  const pdf = path.join(pdfDir, file.replace(/\.html$/, ".pdf"));
  const uri = "file:///" + html.replace(/\\/g, "/");
  const result = spawnSync(
    EDGE,
    ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, uri],
    { stdio: "ignore" }
  );
  console.log(result.status === 0 ? `pdf ${file}` : `pdf fail ${file}`);
}
