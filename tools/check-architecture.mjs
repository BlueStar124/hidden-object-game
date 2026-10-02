#!/usr/bin/env node
/**
 * Checks that the layers of app/src depend one way (app/AGENTS.md, "Project layout"):
 *
 *   core ← content ← game ← screens;  board draws what game tells it (from the content's
 *   paintings);  platform and ui are leaves.
 *
 * core and content stay plain TypeScript: no package imports at all (no React Native, no Skia).
 *
 * Run from app/:  npm run check:architecture   (no dependencies)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(repoRoot, 'app', 'src');

// What each layer may import from the others (screens may import anything)
const ALLOWED = {
  core: ['core'],
  content: ['core', 'content'],
  game: ['core', 'content', 'platform', 'game'],
  board: ['core', 'content', 'platform', 'ui', 'generated', 'board'], // content: the paintings
  platform: ['core', 'platform', 'generated'],
  ui: ['core', 'ui', 'generated'],
  generated: ['core', 'board', 'generated'], // written by tools/generate-assets.mjs
  screens: null,
};
const NO_PACKAGES = new Set(['core', 'content']);

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

// Blanks out comments, keeping line numbers
function withoutComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function* importsOf(code) {
  const pattern = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;
  for (const match of code.matchAll(pattern)) {
    yield { specifier: match[1], line: code.slice(0, match.index).split('\n').length };
  }
}

const violations = [];
const files = sourceFiles(srcRoot);

for (const file of files) {
  const layer = path.relative(srcRoot, file).split(path.sep)[0];
  if (!(layer in ALLOWED)) {
    violations.push(`${path.relative(repoRoot, file)}: not in a known layer (${Object.keys(ALLOWED).join(', ')})`);
    continue;
  }
  const allowed = ALLOWED[layer];
  for (const { specifier, line } of importsOf(withoutComments(fs.readFileSync(file, 'utf8')))) {
    const where = `${path.relative(repoRoot, file)}:${line}`;
    if (!specifier.startsWith('.')) {
      if (NO_PACKAGES.has(layer)) violations.push(`${where}: ${layer} imports the package '${specifier}'`);
      continue;
    }
    const target = path.relative(srcRoot, path.resolve(path.dirname(file), specifier));
    if (target.startsWith('..')) continue; // assets outside src (paintings, sounds)
    const targetLayer = target.split(path.sep)[0];
    if (allowed && !allowed.includes(targetLayer)) {
      violations.push(`${where}: ${layer} imports ${targetLayer} ('${specifier}')`);
    }
  }
}

if (violations.length) {
  console.error(`Architecture check failed — ${violations.length} import(s) against the layers:`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log(`Architecture check passed: ${files.length} files in app/src follow the layers.`);
