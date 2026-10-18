import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const scanDirs = [
  path.join(root, 'app', 'src'),
  path.join(root, 'app', 'test'),
  path.join(root, 'tools'),
  path.join(root, 'supabase'),
];

function shouldExclude(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  if (norm.includes('node_modules')) return true;
  if (norm.includes('/dist') || norm.includes('dist-screens')) return true;
  if (norm.includes('src/generated/')) return true;
  if (norm.endsWith('.json')) return true;
  if (norm.endsWith('.webp') || norm.endsWith('.jpg') || norm.endsWith('.png') || norm.endsWith('.wav')) return true;
  if (norm.includes('scratch/')) return true;
  return false;
}

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (shouldExclude(rel)) continue;
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (/\.(ts|tsx|js|mjs|cjs|sql|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = scanDirs.flatMap(collectFiles);
const counts = allFiles.map((file) => {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n').length;
  return { file: rel, lines };
});

counts.sort((a, b) => b.lines - a.lines);

console.log(`Total hand-written code files scanned: ${counts.length}`);
const over200 = counts.filter((c) => c.lines > 200);
console.log(`Files > 200 lines: ${over200.length}\n`);

console.log('| STT | File | Số dòng |');
console.log('|---|---|---|');
over200.forEach((c, idx) => {
  console.log(`| ${idx + 1} | \`${c.file}\` | ${c.lines} |`);
});

