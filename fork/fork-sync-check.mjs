#!/usr/bin/env node
import assert from 'assert/strict';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { dataRoot, discoverOverlays, writeLocalPaths } from '../fork-sync.mjs';

const temp = mkdtempSync(join(tmpdir(), 'career-ops-fork-sync-'));
try {
  const code = join(temp, 'career-ops');
  const data = join(temp, 'career-ops-data');
  mkdirSync(join(code, 'data'), { recursive: true });
  mkdirSync(data, { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: code });
  writeFileSync(join(code, 'data', '.gitkeep'), '');
  execFileSync('git', ['add', 'data/.gitkeep'], { cwd: code });
  rmSync(join(code, 'data'), { recursive: true });
  mkdirSync(join(data, 'data'), { recursive: true });
  symlinkSync(join(data, 'data'), join(code, 'data'), 'dir');
  const overlays = discoverOverlays(code, data);
  assert.deepEqual(overlays.map(x => x.path), ['data']);
  assert.deepEqual(overlays[0].tracked, ['data/.gitkeep']);
  assert.equal(dataRoot(code, {}), data);

  mkdirSync(join(code, 'fork'), { recursive: true });
  mkdirSync(join(code, 'config'), { recursive: true });
  writeFileSync(join(code, 'fork', 'owned-paths.txt'), '# comment\nlocal-tool.mjs\nfixtures/\n');
  writeLocalPaths(code);
  assert.match(readFileSync(join(code, 'config', 'local-paths.txt'), 'utf8'), /local-tool\.mjs\nfixtures\//);

  symlinkSync(temp, join(code, 'escape'), 'dir');
  assert.throws(() => discoverOverlays(code, data), /escapes data root/);
  console.log('fork-sync tests: 6/6 passed');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
