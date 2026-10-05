import fs from 'node:fs';
import path from 'node:path';

const outPath = 'C:\\Users\\tweed\\Downloads\\Video\\R&R\\shorts and text\\put shorts and segments here\\upload-metadata-notepad.txt';
const transcriptsDir = 'C:\\Users\\tweed\\Downloads\\Video\\R&R\\shorts and text\\put shorts and segments here\\transcripts';

// Base schedule: Item 1 was scheduled at 2026-09-12T21:05:00Z
const baseScheduleMs = Date.parse('2026-09-12T21:05:00Z');
const intervalMs = 864 * 1000; // 14m 24s

// Read all transcript JSON files to inspect text
const files = fs.readdirSync(transcriptsDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
files.sort();

console.log(`Found ${files.length} transcript cache files.`);
