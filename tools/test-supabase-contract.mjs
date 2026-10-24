#!/usr/bin/env node
/**
 * Backend Contract Verification for Supabase Story Leaderboard
 * -----------------------------------------------------------
 * Verifies backend schema, RPC definitions, RLS rules, and client contract
 * without creating mock/junk users on production.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrations = path.join(root, 'supabase', 'migrations');
const migrationPath = path.join(migrations, '20261018230000_story_leaderboard.sql');
const fixesPath = path.join(migrations, '20261024000000_story_leaderboard_fixes.sql');
const clientLeaderboardPath = path.join(root, 'app', 'src', 'platform', 'leaderboard.ts');

console.log('--- Verifying Supabase Backend Contracts ---\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// 1. Migration File Presence
assert(fs.existsSync(migrationPath), 'Migration 20261018230000_story_leaderboard.sql exists');

assert(fs.existsSync(fixesPath), 'Migration 20261024000000_story_leaderboard_fixes.sql exists');

// Every migration in order: a later one may replace a function or drop a policy
const sql = fs.readdirSync(migrations).filter((n) => n.endsWith('.sql')).sort()
  .map((n) => fs.readFileSync(path.join(migrations, n), 'utf8')).join('\n');
const fixes = fs.readFileSync(fixesPath, 'utf8');

// 2. Table Definitions
assert(/create table public\.storyline_pages/i.test(sql), 'Table storyline_pages is defined');
assert(/create table public\.user_profiles/i.test(sql), 'Table user_profiles is defined');
assert(!/create table public\.user_profiles[\s\S]*?\bemail\b/i.test(sql), 'Privacy check: user_profiles does NOT store email addresses');
assert(/create table public\.story_page_records/i.test(sql), 'Table story_page_records is defined');
assert(/primary key \(user_id, page_id\)/i.test(sql), 'story_page_records has composite primary key (user_id, page_id)');

// 3. RLS Security Policies
assert(/alter table public\.story_page_records enable row level security/i.test(sql), 'story_page_records enables Row Level Security (RLS)');
assert(/drop policy if exists "Users can insert their own scores"/i.test(fixes) && /drop policy if exists "Users can update their own scores"/i.test(fixes),
  'Players cannot write score rows directly (own-row write policies dropped)');
assert(/revoke all on public\.story_page_records from anon, authenticated/i.test(fixes),
  'story_page_records: only select is granted; writes go through record_story_score');

// 4. RPC Functions & Validation Limits
assert(/create or replace function public\.record_story_score/i.test(sql), 'RPC record_story_score is defined (NOT record_story_victory)');
assert(/p_score\s*>\s*v_max/i.test(fixes) && /max_score/i.test(fixes), 'RPC validates the score against the page cap (storyline_pages.max_score)');
assert(/p_time\s*<\s*0/i.test(sql), 'RPC validates time is non-negative');
assert(/create or replace function public\.get_leaderboard/i.test(sql), 'RPC get_leaderboard is defined');
assert(/limit greatest\(1,\s*least\(coalesce\(p_limit,\s*100\),\s*100\)\)/i.test(sql), 'RPC get_leaderboard enforces Top 100 limit');
assert(/order by\s+us\.total_score desc,\s*us\.pages_cleared desc,\s*us\.last_updated asc/i.test(sql), 'RPC get_leaderboard stable tie-breaking: score DESC -> pages DESC -> last_updated ASC');
assert(/create or replace function public\.get_user_leaderboard_rank/i.test(sql), 'RPC get_user_leaderboard_rank is defined for accurate global ranking outside Top 100');

// 5. Client Contracts
assert(fs.existsSync(clientLeaderboardPath), 'Client platform leaderboard.ts exists');
const clientTs = fs.readFileSync(clientLeaderboardPath, 'utf8');
assert(/record_story_score/.test(clientTs), 'Client calls record_story_score');
assert(!/record_story_victory/.test(clientTs), 'Client does not reference outdated record_story_victory');
assert(/currentUserId && typeof currentUserId === 'string'/.test(clientTs), 'Guest user handling: guest does not make rank RPC request');
assert(/catch \(err\)/.test(clientTs) && /Bạn vẫn có thể chơi ngoại tuyến/.test(clientTs), 'Offline & error handling: network errors caught gracefully without unhandled rejection');

console.log(`\nBackend Contract Verification Summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
