import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stitch = 'C:\\Users\\tweed\\Downloads\\Documents\\redemption\\prayer\\stitched';
const grouped = 'C:\\Users\\tweed\\Downloads\\Telegram Desktop\\grouped by 20s list of topics.txt';
const topics666 = path.join(root, 'data', 'TOPICS-666.txt');
const outDir = path.join(root, 'public');

function topicTitles() {
  const map = {};
  if (fs.existsSync(grouped)) {
    for (const line of fs.readFileSync(grouped, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(\d{1,3})\.\s*(.+?)\s*$/);
      if (!m) continue;
      let t = m[2].trim();
      const cut = t.match(/^(.*?)\s{2,}\d+\./);
      if (cut) t = cut[1].trim();
      t = t.replace(/\s+Day\s+\d+\s*$/, '');
      map[Number(m[1])] = t;
    }
  }
  const max = Math.max(0, ...Object.keys(map).map(Number));
  if (max >= 666) return map;
  for (const line of fs.readFileSync(topics666, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(\d{3})\.\s*(.+)$/);
    if (!m) continue;
    const n = Number(m[1]);
    if (n <= max || n > 666) continue;
    map[n] = m[2].split(', from a root')[0].trim();
  }
  return map;
}

const titles = topicTitles();
const missing = [];
for (let n = 1; n <= 666; n++) {
  if (!titles[n]) missing.push(n);
}
if (missing.length) throw new Error('Missing titles: ' + missing.join(', '));

function filesFor(round) {
  const prefix = `round${round}-`;
  return fs.readdirSync(stitch)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.mp3') && !name.includes('-play.'))
    .map((name) => {
      const m = name.match(new RegExp(`^round${round}-(\\d{3})-(.+)\\.mp3$`));
      if (!m) return null;
      return { name, num: Number(m[1]) };
    })
    .filter(Boolean)
    .sort((a, b) => a.num - b.num);
}

for (const round of [1, 2, 3]) {
  const files = filesFor(round);
  if (files.length !== 666) throw new Error(`Round ${round} has ${files.length} mp3s`);
  const pieces = files.map((f) => {
    const id = String(f.num).padStart(3, '0');
    const title = titles[f.num];
    return {
      id,
      title,
      file: f.name,
      downloadName: `${id} ${title}.mp3`.replace(/[<>:"/\\|?*]/g, ' ').replace(/\s+/g, ' ').trim(),
    };
  });
  const payload = {
    title: `Repentance Project — Round ${round}`,
    audioPrefix: `audio/repentance-project/round-${round}`,
    playInOrder: true,
    pieces,
  };
  const dest = path.join(outDir, `downloads-playlist-rp-r${round}.js`);
  fs.writeFileSync(dest, `window.DOWNLOADS_PLAYLIST_RP_R${round} = ${JSON.stringify(payload)};\n`);
  console.log('wrote', dest, pieces.length);
}
