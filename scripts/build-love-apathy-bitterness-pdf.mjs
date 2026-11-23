import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const columns = [
  {
    mark: '✅',
    head: 'Love',
    items: [
      'PATIENT',
      'KIND',
      'NOT JEALOUS',
      'NOT BOASTFUL',
      'NOT RUDE',
      'NOT PROUD',
      'DOES NOT DEMAND ITS OWN WAY',
      'NOT IRRITABLE',
      'KEEPS NO RECORD OF WRONGS',
      'DOES NOT REJOICE FOR INJUSTICE',
      'REJOICES IN TRUTH',
      'LOVE NEVER GIVES UP',
      'LOVE NEVER LOSES FAITH',
      'LOVE ALWAYS IS HOPEFUL',
      'LOVE ENDURES TO THE END',
    ],
  },
  {
    mark: '😐',
    head: 'Apathy',
    items: [
      'Indifferent to timing or delay',
      'Emotionally uninvolved',
      "Unconcerned with others' gains or losses",
      'Non-self-promotional',
      'Socially unresponsive',
      'Lacking personal investment in status',
      'Unconcerned with preference',
      'Unbothered or unmoved',
      'Not retaining past offenses',
      'Morally disengaged',
      'Indifferent to truth claims',
      'Nonpersistent',
      'Noncommittal',
      'Without expectation',
      'Passive through',
    ],
  },
  {
    mark: '❌',
    head: 'Bitterness',
    items: [
      'CONDITIONAL FORGIVENESS',
      'REMINDERS OF FAILURE',
      'UNGODLY JUDGMENTS ABOUT OR AGAINST OTHERS',
      'EXALTING PERSONAL PREFERENCES',
      'UNGODLY JUDGMENTS ABOUT OR AGAINST GOD',
      'MANIPULATION',
      'SELF-SERVING DISCERNMENT',
      'PETTY ARGUMENTS',
      'GRUDGES',
      'HATING ACCOUNTABILITY / PERVERSION',
      'LIES',
      'CONTROL',
      'UNFORGIVENESS',
      'CONFUSION',
      'THAT WHICH WAS',
    ],
  },
];

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const cols = columns
  .map(
    (col) => `<section>
      <h2><span class="mark">${col.mark}</span> ${esc(col.head)}</h2>
      <ol>
        ${col.items.map((item) => `<li><span class="mark">${col.mark}</span> ${esc(item)}</li>`).join('')}
      </ol>
    </section>`
  )
  .join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Love &gt;&gt; Apathy &gt;&gt; Bitterness</title>
<style>
  @page { size: landscape; margin: 0.45in 0.5in; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #1c140f; font-family: "Segoe UI", Calibri, sans-serif; }
  h1 { margin: 0 0 0.35in; font-size: 22pt; font-weight: 700; letter-spacing: 0.01em; }
  .cols { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 0.42in; }
  h2 { margin: 0 0 0.16in; font-size: 13pt; }
  ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; justify-content: space-between; min-height: 6.3in; }
  li { font-size: 9.5pt; line-height: 1.25; }
  .mark { display: inline-block; width: 1.15em; }
</style>
</head>
<body>
  <h1>Love &gt;&gt; Apathy &gt;&gt; Bitterness</h1>
  <div class="cols">${cols}</div>
</body>
</html>`;

const work = join(root, 'data', '_pdf-edge-profile');
mkdirSync(work, { recursive: true });
const htmlPath = join(work, 'love-apathy-bitterness.html');
const pdfPath = join(root, 'data', 'Love-Apathy-Bitterness.pdf');
writeFileSync(htmlPath, html, 'utf8');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const run = spawnSync(
  edge,
  [
    '--headless',
    '--disable-gpu',
    `--user-data-dir=${join(work, 'edge-profile')}`,
    `--print-to-pdf=${pdfPath}`,
    '--no-pdf-header-footer',
    htmlPath,
  ],
  { stdio: 'inherit' }
);
if (run.status !== 0) process.exit(run.status || 1);

const { readFileSync } = await import('node:fs');
const bytes = readFileSync(pdfPath);
writeFileSync(join(root, 'public', 'downloads', 'love-apathy-bitterness.pdf'), bytes);
console.log(`Wrote ${bytes.length} bytes`);
