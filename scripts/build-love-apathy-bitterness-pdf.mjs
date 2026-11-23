import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const columns = [
  {
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

const W = 792;
const H = 612;
const margin = 36;
const gap = 28;
const colW = (W - margin * 2 - gap * 2) / 3;

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function widthOf(text, size) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += c < 32 || c > 126 ? 0.5 : 0.5;
  }
  return w * size;
}

function wrap(text, size, max) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (widthOf(next, size) <= max && line) line = next;
    else if (!line) line = word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const ops = [];
function text(x, y, size, str, font = 'F1') {
  ops.push(`BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${esc(str)}) Tj ET`);
}

ops.push('0.15 0.12 0.1 rg');
text(margin, H - 42, 18, 'Love  >>  Apathy  >>  Bitterness', 'F2');
ops.push('0.45 0.38 0.28 RG 0.8 w');
ops.push(`${margin} ${H - 52} m ${W - margin} ${H - 52} l S`);

const top = H - 86;
const bottom = 32;
const slot = (top - bottom) / columns[0].items.length;

columns.forEach((col, i) => {
  const x = margin + i * (colW + gap);
  ops.push('0.22 0.16 0.12 rg');
  text(x, top + 8, 12, col.head, 'F2');
  col.items.forEach((item, n) => {
    const lines = wrap(item, 9, colW - 4);
    const y0 = top - n * slot - 6;
    ops.push('0.12 0.1 0.08 rg');
    lines.forEach((line, li) => text(x, y0 - li * 11, 9, line));
  });
});

const stream = ops.join('\n');
const objects = [];
function add(body) {
  objects.push(body);
  return objects.length;
}

add('<< /Type /Catalog /Pages 2 0 R >>');
add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>');
add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += '0000000000 65535 f \n';
for (let i = 1; i <= objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

const bytes = Buffer.from(pdf, 'latin1');
const dests = [
  join(root, 'data', 'Love-Apathy-Bitterness.pdf'),
  join(root, 'public', 'downloads', 'love-apathy-bitterness.pdf'),
];
for (const dest of dests) writeFileSync(dest, bytes);
console.log(`Wrote ${bytes.length} bytes`);
