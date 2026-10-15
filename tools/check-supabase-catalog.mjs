import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// TypeScript from the app's own install: this check runs in app/ (`npm run check`, CI) before the
// repo root's packages are installed
const ts = createRequire(path.join(root, 'app', 'package.json'))('typescript');
const migrations = path.join(root, 'supabase', 'migrations');

function pageIds(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return pageIds(file);
    if (!entry.name.endsWith('.json')) return [];
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data.objects) && typeof data.id === 'string' ? [data.id] : [];
  });
}

function spriteIds() {
  const file = path.join(root, 'app', 'src', 'core', 'model.ts');
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const alias = source.statements.find((node) => ts.isTypeAliasDeclaration(node) && node.name.text === 'SpriteType');
  if (!alias || !ts.isUnionTypeNode(alias.type)) throw new Error('SpriteType must be a string union');
  return alias.type.types.map((node) => {
    if (!ts.isLiteralTypeNode(node) || !ts.isStringLiteral(node.literal)) throw new Error('Unexpected SpriteType member');
    return node.literal.text;
  }).filter((id) => id !== 'seal'); // The seal is painted into the page, not a movable sprite.
}

function catalogIds(sql, table) {
  const inserts = [...sql.matchAll(new RegExp(`insert into public\\.${table} \\(id\\) values([\\s\\S]*?);`, 'gi'))];
  return inserts.flatMap(([, values]) => [...values.matchAll(/\('([^']+)'\)/g)].map(([, id]) => id));
}

function assertEqual(label, expected, actual) {
  const wanted = new Set(expected);
  const stored = new Set(actual);
  const missing = [...wanted].filter((id) => !stored.has(id));
  const extra = [...stored].filter((id) => !wanted.has(id));
  if (missing.length || extra.length || actual.length !== stored.size) {
    throw new Error(`${label}: missing [${missing.join(', ')}], extra [${extra.join(', ')}], duplicates ${actual.length - stored.size}`);
  }
  process.stdout.write(`${label}: ${wanted.size} IDs match\n`);
}

const sql = fs.readdirSync(migrations)
  .filter((name) => name.endsWith('.sql')).sort()
  .map((name) => fs.readFileSync(path.join(migrations, name), 'utf8')).join('\n');

assertEqual('Challenge pages', pageIds(path.join(root, 'app', 'src', 'content', 'countries')), catalogIds(sql, 'challenge_pages'));
assertEqual('Challenge sprites', spriteIds(), catalogIds(sql, 'challenge_sprites'));

// The web app's Content-Security-Policy (vercel.json) must let it reach the Supabase project of
// app/.env: otherwise the browser blocks sign-in and sync on the deployed site, while the game still runs
const supabaseUrl = /EXPO_PUBLIC_SUPABASE_URL=(\S+)/.exec(fs.readFileSync(path.join(root, 'app', '.env'), 'utf8'))?.[1];
if (supabaseUrl) {
  const origin = new URL(supabaseUrl).origin;
  const csp = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))
    .headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
  const connect = /connect-src ([^;]*)/.exec(csp)?.[1].split(/\s+/) ?? [];
  if (csp && !connect.includes(origin)) throw new Error(`vercel.json: connect-src does not allow ${origin} (sign-in and sync would be blocked on the web)`);
  console.log(`Web CSP allows ${origin}`);
}
