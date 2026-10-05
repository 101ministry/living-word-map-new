import fs from 'node:fs';

const dir = 'C:\\Users\\tweed\\Downloads\\Documents\\redemption\\prayer\\Shells';
const daysPath = `${dir}\\REPENTANCE-2026-SETS-1-11-DAYS.txt`;
const descPath = `${dir}\\REPENTANCE-2026-SETS-1-11-YOUTUBE-DESCRIPTIONS.txt`;
const outPath = `${dir}\\REPENTANCE-2026-SETS-1-11-DAYS-WITH-DESCRIPTIONS.txt`;

const daysText = fs.readFileSync(daysPath, 'utf8');
const descText = fs.readFileSync(descPath, 'utf8');

const roundKey = (set, round) => `${set}-${round}`;
const roundPastes = new Map();
const roundIntroEnd = descText.indexOf('========== Day 1 (1-20) ==========');
const intro = descText.slice(0, roundIntroEnd);
const pasteRe = /----- PASTE -----\r?\n([\s\S]*?)----- END -----/g;
let m;
while ((m = pasteRe.exec(intro))) {
  const body = m[1].trimEnd();
  const title = body.split(/\r?\n/)[0] || '';
  const tm = title.match(/Set (\d+) \([^)]+\) - Round (\d+)/);
  if (!tm) continue;
  roundPastes.set(roundKey(Number(tm[1]), Number(tm[2])), body.trim() + '\n');
}
if (roundPastes.size !== 33) {
  throw new Error(`expected 33 round pastes, got ${roundPastes.size}`);
}

const dayRe = /^========== Day (\d+) \(([^)]+)\) ==========[ \t]*$/gm;
const headers = [...daysText.matchAll(dayRe)];
const chunks = [];
for (let i = 0; i < headers.length; i++) {
  const header = headers[i][0];
  const dayNum = Number(headers[i][1]);
  const start = headers[i].index + headers[i][0].length;
  const end = i + 1 < headers.length ? headers[i + 1].index : daysText.length;
  const body = daysText.slice(start, end).replace(/^\r?\n/, '').replace(/\s+$/, '') + '\n';
  const pairs = [];
  let setId = null;
  for (const line of body.split(/\r?\n/)) {
    const sm = line.match(/^Set (\d+) -/);
    if (sm) {
      setId = Number(sm[1]);
      continue;
    }
    const rm = line.match(/^Round (\d+)\s*$/);
    if (rm && setId) {
      const k = roundKey(setId, Number(rm[1]));
      if (!pairs.includes(k)) pairs.push(k);
    }
  }
  if (!pairs.length) throw new Error(`no set/round on day ${dayNum}`);
  const descs = pairs.map((k) => {
    const p = roundPastes.get(k);
    if (!p) throw new Error(`missing round paste ${k} for day ${dayNum}`);
    return p;
  });
  chunks.push(`${header}\n\n${body}\n\n${descs.join('\n')}`);
}

const out =
  'Repentance 2026 — days list with matching round YouTube descriptions.\n\n' +
  chunks.join('\n');
fs.writeFileSync(outPath, out, 'utf8');
fs.copyFileSync(outPath, 'C:\\Users\\tweed\\living-word-map\\data\\REPENTANCE-2026-SETS-1-11-DAYS-WITH-DESCRIPTIONS.txt');
console.log('days', chunks.length, 'bytes', out.length);
