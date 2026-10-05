import fs from 'node:fs';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const notepadPath = 'C:\\Users\\tweed\\Downloads\\Video\\R&R\\shorts and text\\put shorts and segments here\\upload-metadata-notepad.txt';
const outDir = 'C:\\Users\\tweed\\Downloads\\Video\\R&R\\shorts and text\\put shorts and segments here\\transcripts';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const lines = fs.readFileSync(notepadPath, 'utf8').split(/\r?\n/);

const items = [];
let isSegment = false;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  if (trimmed === 'SEGMENTS') {
    isSegment = true;
    continue;
  }
  const m = trimmed.match(/riverside\.com\/editor\/([^/]+)\/([^/?]+)\/preview\?[^#]*review-token=([^&#\s]+)/);
  if (m) {
    items.push({
      index: items.length + 1,
      raw: trimmed,
      hasStar: trimmed.startsWith('*'),
      isSegment,
      projectId: m[1],
      editId: m[2],
      token: m[3],
      url: trimmed.replace(/^\*\s*/, ''),
    });
  }
}

console.log(`Loaded ${items.length} items (${items.filter(i => !i.isSegment).length} shorts, ${items.filter(i => i.isSegment).length} segments).`);

function wordsFromSentence(sentence) {
  const words = [];
  for (const w of sentence.words || []) {
    if (Array.isArray(w)) {
      if (w.length >= 4 && w[3] === 'noise') continue;
      const text = String(w[0] ?? '').trim();
      if (text) words.push(text);
    } else if (w && typeof w === 'object' && w.text) {
      if (w.type === 'noise') continue;
      const text = String(w.text).trim();
      if (text) words.push(text);
    }
  }
  return words.join(' ').trim();
}

function transcriptToText(data) {
  const lines = [];
  for (const sp of data.speakers || []) {
    const speaker = sp.name || 'Norm M (Repentance101)';
    for (const s of sp.sentences || []) {
      const text = wordsFromSentence(s);
      if (!text) continue;
      lines.push(text);
    }
  }
  return lines.join(' ').trim();
}

async function fetchOne(item) {
  const outPath = path.join(outDir, `${item.index.toString().padStart(2, '0')}_${item.editId}.json`);
  if (fs.existsSync(outPath)) {
    return JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  const res = await fetch(`https://riverside.com/api/v4/clip/${item.editId}/transcription`, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      'x-review-token': item.token,
      'x-clip-review-share-token': item.token,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = transcriptToText(data);
  const result = {
    index: item.index,
    editId: item.editId,
    projectId: item.projectId,
    isSegment: item.isSegment,
    hasStar: item.hasStar,
    url: item.url,
    text,
    rawSpeakers: data.speakers,
  };

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  return result;
}

async function main() {
  let ok = 0;
  let fail = 0;
  for (const item of items) {
    process.stdout.write(`[${item.index}/${items.length}] ${item.isSegment ? 'SEG' : 'SHT'} ${item.editId} ... `);
    try {
      const res = await fetchOne(item);
      console.log(`OK (${res.text.length} chars)`);
      ok++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      fail++;
    }
    // slight delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\nFinished: ${ok} OK, ${fail} FAILED`);
}

main().catch(console.error);
