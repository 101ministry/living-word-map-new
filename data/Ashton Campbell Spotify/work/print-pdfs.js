const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const htmlDir = path.join(root, "html");
const pdfDir = path.join(root, "pdfs");
const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
fs.mkdirSync(pdfDir, { recursive: true });
const files = fs.readdirSync(htmlDir).filter((f) => f.endsWith(".html")).sort();
for (const file of files) {
  const html = path.join(htmlDir, file);
  const pdf = path.join(pdfDir, file.replace(/\.html$/, ".pdf"));
  if (fs.existsSync(pdf) && fs.statSync(pdf).size > 1000) {
    console.log("skip", file);
    continue;
  }
  const uri = "file:///" + html.replace(/\\/g, "/");
  console.log("pdf", file);
  spawnSync(edge, ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, uri], {
    stdio: "ignore",
  });
}
console.log("pdfs done", files.length);
