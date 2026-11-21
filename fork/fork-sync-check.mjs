#!/usr/bin/env node
import assert from 'assert/strict';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { doctor, legacySymlinks, writeLocalPaths } from '../fork-sync.mjs';

const temp = mkdtempSync(join(tmpdir(), 'career-ops-fork-sync-'));
let passed = 0;
try {
  const code = join(temp, 'career-ops');
  const data = join(temp, 'career-ops-data');
  mkdirSync(join(code, 'fork'), { recursive: true });
  mkdirSync(join(data, 'data'), { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: data });
  writeFileSync(join(code, 'fork', 'owned-paths.txt'), '# comment\nlocal-tool.mjs\nfixtures/\n');

  writeLocalPaths(code);
  assert.match(readFileSync(join(code, 'config', 'local-paths.txt'), 'utf8'), /local-tool\.mjs\nfixtures\//); passed++;

  const r = doctor(code, data);
  assert.equal(r.ok, true); passed++;
  assert.equal(r.localPaths, 2); passed++;
  assert.deepEqual(r.legacySymlinks, []); passed++;

  symlinkSync(join(data, 'data'), join(code, 'data'), 'dir');
  symlinkSync(temp, join(code, 'outside'), 'dir');
  assert.deepEqual(legacySymlinks(code, data), ['data']); passed++;

  assert.throws(() => doctor(code, code), /Data Root is the checkout itself/); passed++;
  assert.throws(() => doctor(code, join(temp, 'missing')), /not found/); passed++;
  console.log(`fork-sync tests: ${passed}/7 passed`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
