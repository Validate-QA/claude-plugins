#!/usr/bin/env node
// OPT-IN. Not enabled by the plugin. See README.md ("Optional hook").
// Claude Code Stop hook: when Claude is about to finish a turn that left uncommitted
// changes to app files, ask it once to run /vq-test. Once per distinct set of changes.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let input = {};
try { input = JSON.parse(await new Promise((r) => { let s = ''; process.stdin.on('data', (c) => (s += c)); process.stdin.on('end', () => r(s || '{}')); })); } catch { /* no input */ }
if (input.stop_hook_active) process.exit(0); // already continuing because of a Stop hook

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
let changed;
try { changed = git('status', '--porcelain').split('\n').filter(Boolean).map((l) => l.slice(3)); } catch { process.exit(0); } // not a git repo
const app = changed.filter((f) => !/\.(md|mdx|txt)$/i.test(f) && !/^(docs?|\.github|\.claude)\//.test(f));
if (app.length === 0) process.exit(0);

const seenDir = join(tmpdir(), 'validate-qa-stop-hook');
const key = createHash('sha256').update(app.join('\n') + git('diff', '--', ...app)).digest('hex').slice(0, 16);
const marker = join(seenDir, key);
if (existsSync(marker)) process.exit(0);
mkdirSync(seenDir, { recursive: true });
writeFileSync(marker, '');

process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: 'App files changed in this session. Run /vq-test to run the Validate.QA tests that cover them and report the result. If no Validate.QA project is connected, say so and stop.',
}));
