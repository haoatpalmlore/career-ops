#!/usr/bin/env node
/**
 * system-check.mjs — does this fork still work, and did an update break it?
 *
 * WHY THIS EXISTS
 * This fork diverges from santifer/career-ops and rebases onto it repeatedly.
 * Two questions need answering that nothing else answers:
 *
 *   1. Does the local behaviour still hold? The fork's guarantees live partly
 *      in scripts (checkable) and partly in rules inside modes/_custom.md
 *      (a symlink into the data layer, which an update cannot touch — but a
 *      careless edit can). Both are asserted here.
 *   2. Did an upstream merge change anything? Snapshot before, rebase,
 *      snapshot after, diff. The diff names what moved instead of leaving the
 *      operator to notice a regression weeks later.
 *
 * WHAT IT ASSERTS, IN ORDER OF WHAT IT WOULD COST TO LOSE
 *   invariants  — the rules that make evaluations honest still exist and are
 *                 wired to something that enforces them
 *   regression  — eight real past failures still fail (and the fixed one passes)
 *   self-tests  — unit behaviour of every fork script
 *   metrics     — funnel and compliance numbers, recorded for drift, never
 *                 pass/fail: a metric moving is information, not a failure
 *
 * Run: node system-check.mjs                      full run, exit 1 on failure
 *      node system-check.mjs --json
 *      node system-check.mjs --snapshot before.json
 *      node system-check.mjs --diff before.json    what changed since
 *      node system-check.mjs --self-test
 */

import { readFileSync, existsSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execFileSync } from 'child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = join(HERE, 'regression');

// Scripts owned by this fork. Upstream's own suite is test-all.mjs and is not
// re-run here — this checks what the fork added, not what it inherited.
const FORK_SCRIPTS = ['apply-log.mjs', 'verify-evaluation.mjs', 'upskill-ext.mjs', 'upskill.mjs'];

// Rules with no script of their own. If an edit removes one of these headings,
// the behaviour it describes silently stops being required.
const REQUIRED_RULES = [
  { file: 'modes/_custom.md', heading: '## Scoring Rules',
    why: 'dimension arithmetic, the +/-0.3 lift cap, and the three-way score agreement' },
  { file: 'modes/_custom.md', heading: '## The Case Against',
    why: 'the adversarial pass that runs before Block B is scored' },
  { file: 'modes/_custom.md', heading: '## Falsification',
    why: 'the testable prediction that gives a score a track record' },
  { file: 'modes/_custom.md', heading: '## Enforcement',
    why: 'points the operator at verify-evaluation.mjs; without it the rules are advisory' },
];

export function parseManifest(tsv) {
  const rows = [];
  for (const line of String(tsv || '').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const c = line.split('\t');
    if (c.length < 3) continue;
    rows.push({ id: c[0].trim(), fixture: c[1].trim(), expect: c[2].trim(),
                expectError: (c[3] || '').trim(), origin: (c[4] || '').trim(), note: (c[5] || '').trim() });
  }
  return rows;
}

/** A check is a {name, ok, detail}. Nothing here throws; a thrown error is a failed check. */
function runSelfTests() {
  return FORK_SCRIPTS.map(s => {
    if (!existsSync(join(HERE, s))) return { name: s, ok: false, detail: 'script missing' };
    try {
      const out = execFileSync('node', [join(HERE, s), '--self-test'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      // Exit 0 is NOT sufficient. If the --self-test seam is dropped during a
      // rebase, the script falls through to its default path, prints its normal
      // output and exits 0 — a false pass in precisely the scenario this harness
      // exists to catch. Demand a pass marker in the output.
      // Two accepted markers: the fork's "N/N passed" and upstream's
      // "<name> self-test OK". A fall-through prints neither (it prints the
      // script's normal output), so both a dropped seam and a silent partial
      // failure are still caught.
      const m = out.match(/(\d+)\/(\d+) passed/);
      const upstreamMarker = /self-test OK/.test(out);
      if (!m && !upstreamMarker) {
        return { name: s, ok: false,
                 detail: `exited 0 but printed no self-test marker — is the --self-test seam still wired? got: ${out.trim().split('\n').pop().slice(0, 50)}` };
      }
      if (m && m[1] !== m[2]) return { name: s, ok: false, detail: `${m[1]}/${m[2]} assertions passed` };
      return { name: s, ok: true, detail: m ? `${m[1]}/${m[2]} assertions` : 'self-test OK (upstream format)' };
    } catch (e) {
      return { name: s, ok: false, detail: String(e.stderr || e.stdout || e.message).trim().split('\n').pop().slice(0, 120) };
    }
  });
}

async function runRegression() {
  const manifestPath = join(REG, 'MANIFEST.tsv');
  if (!existsSync(manifestPath)) return [{ name: 'corpus', ok: false, detail: 'regression/MANIFEST.tsv missing' }];
  let verify;
  try {
    ({ verify } = await import('./verify-evaluation.mjs'));
  } catch (e) {
    // The harness must report a missing/broken fork file, not die on it —
    // otherwise it goes silent exactly when something disappeared.
    return [{ name: 'corpus', ok: false, detail: `cannot load verify-evaluation.mjs: ${String(e.message).split('\n')[0].slice(0, 100)}` }];
  }
  return parseManifest(readFileSync(manifestPath, 'utf8')).map(row => {
    const p = join(REG, row.fixture);
    if (!existsSync(p)) return { name: row.id, ok: false, detail: `fixture missing: ${row.fixture}` };
    const r = verify(readFileSync(p, 'utf8'), row.fixture);
    const got = r.ok ? 'pass' : 'fail';
    const errs = r.issues.filter(i => i.level === 'error').map(i => i.msg);
    if (got !== row.expect) {
      return { name: row.id, ok: false, detail: `expected ${row.expect}, got ${got}`, caught: (errs[0] || '').slice(0, 90) };
    }
    // A fixture that fails for the wrong reason is not pinning its rule. r1
    // trips three separate errors; without this, deleting the Score Breakdown
    // rule leaves r1 failing on the other two and the corpus still reports ok.
    if (row.expectError && !errs.some(m => m.includes(row.expectError))) {
      return { name: row.id, ok: false,
               detail: `fails, but not on its own rule — expected an error containing "${row.expectError}", got: ${errs.join(' | ').slice(0, 90)}` };
    }
    return { name: row.id, ok: true, detail: `${got} as expected — ${row.origin}`, caught: (errs[0] || '').slice(0, 90) };
  });
}

function runInvariants() {
  const out = [];
  for (const r of REQUIRED_RULES) {
    const p = join(HERE, r.file);
    if (process.env.CI && !existsSync(p)) {
      out.push({ name: `${r.file} ${r.heading}`, ok: true, detail: 'user-layer file absent in clean CI checkout; verified on installed overlay by fork-sync doctor' });
      continue;
    }
    const present = existsSync(p) && readFileSync(p, 'utf8').includes(r.heading);
    out.push({ name: `${r.file} ${r.heading}`, ok: present, detail: present ? r.why : `MISSING — lost: ${r.why}` });
  }
  // Divergence surface: new files cannot conflict on rebase, edits to upstream
  // files can. An allowlist rather than a count, so a NEW upstream file being
  // touched fails even if the total stays flat, and each entry has to earn its
  // place in writing.
  const EXPECTED_MODIFIED = {
    'upskill.mjs': 'integration seams for archetype weighting — the five named in LOCAL-CHANGES.md',
    'update-system.mjs': 'USER_PATHS registration; fork files must be never-touch, not upstream-fetched',
    '.github/workflows/test.yml': 'canonical tag bootstrap and fork-specific CI gate',
    '.github/workflows/signature-ci.yml': 'signature-only validator skips ordinary fork integration PRs',
    'AGENTS.md': 'fork-safe GitHub CLI repository targeting contract, justified in LOCAL-CHANGES.md',
    'test-all.mjs': 'symlink-safe gitignore assertions for the external-data overlay',
    'tests/helpers.mjs': 'documented CodeQL suppression for the executable-allowlisted argv-only test runner',
    'generate-pdf.mjs': 'manifest paths accept both code and managed data-overlay namespaces',
    'verify-pipeline.mjs': 'tracker overrides isolate sibling user-layer files in fixtures',
  };
  try {
    const base = execFileSync('git', ['merge-base', 'upstream/main', 'HEAD'], { cwd: HERE, encoding: 'utf8' }).trim();
    const changed = execFileSync('git', ['diff', '--name-only', base], { cwd: HERE, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const modified = changed.filter(f => {
      try { execFileSync('git', ['cat-file', '-e', `${base}:${f}`], { cwd: HERE, stdio: 'ignore' }); return true; }
      catch { return false; }
    });
    const unexpected = modified.filter(f => !(f in EXPECTED_MODIFIED));
    out.push({ name: 'rebase conflict surface', ok: unexpected.length === 0,
               detail: unexpected.length
                 ? `unexpected upstream file(s) modified: ${unexpected.join(', ')} — justify in LOCAL-CHANGES.md and add to EXPECTED_MODIFIED`
                 : `${modified.length} upstream file(s), all expected: ${modified.join(', ')}` });
  } catch (e) {
    // Distinguish "there is no upstream to compare against" (genuinely not
    // applicable) from "the comparison broke" (a guard that cannot run must not
    // report a pass).
    const msg = String(e.stderr || e.message || '');
    const noUpstream = /unknown revision|not a valid object name|no such ref|ambiguous argument 'upstream/i.test(msg);
    out.push({ name: 'rebase conflict surface', ok: noUpstream,
               detail: noUpstream ? 'no upstream remote — not applicable'
                                  : `could not evaluate: ${msg.split('\n')[0].slice(0, 90)}` });
  }

  // Upstream owns a coverage guard asserting every tracked file is claimed by
  // SYSTEM_PATHS or USER_PATHS. This harness originally skipped upstream's
  // suite entirely, so five unregistered fork files reached code review. Run
  // the one upstream check that this fork can actually break.
  try {
    execFileSync('node', [join(HERE, 'validate-system-paths-coverage.mjs')], { cwd: HERE, stdio: 'pipe' });
    out.push({ name: 'SYSTEM_PATHS/USER_PATHS coverage', ok: true, detail: 'every tracked file is claimed' });
  } catch (e) {
    out.push({ name: 'SYSTEM_PATHS/USER_PATHS coverage', ok: false,
               detail: String(e.stdout || e.stderr || e.message).trim().split('\n').slice(0, 3).join(' / ') });
  }
  return out;
}

function runMetrics() {
  const m = {};
  const sh = (args) => { try { return execFileSync('node', args, { cwd: HERE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };
  const log = sh([join(HERE, 'apply-log.mjs')]);
  if (log) { try { const j = JSON.parse(log); m.logged = j.funnel.total; m.decided = j.funnel.decided; m.answered = j.funnel.answered; m.advanced = j.funnel.advanced; } catch {} }
  const cal = sh([join(HERE, 'apply-log.mjs'), '--calibration']);
  if (cal) { try { const j = JSON.parse(cal); m.falsifiers = j.reportsWithFalsifier; m.predictionsResolved = j.decided; m.predictionAccuracy = j.accuracy; } catch {} }
  try {
    const files = readdirSync(join(HERE, 'reports')).filter(f => f.endsWith('.md'));
    m.reports = files.length;
  } catch {}
  return m;
}

export async function collect() {
  const invariants = runInvariants();
  const regression = await runRegression();
  const selftests = runSelfTests();
  const metrics = runMetrics();
  const groups = { invariants, regression, selftests };
  const failed = Object.values(groups).flat().filter(c => !c.ok);
  return { groups, metrics, failed: failed.length, ok: failed.length === 0 };
}

/** Compare two snapshots. Metric drift is reported, never failed. */
export function diffSnapshots(before, after) {
  const changes = [];
  for (const g of ['invariants', 'regression', 'selftests']) {
    const b = new Map((before.groups?.[g] || []).map(c => [c.name, c.ok]));
    const a = new Map((after.groups?.[g] || []).map(c => [c.name, c.ok]));
    for (const [name, aok] of a) {
      if (!b.has(name)) { changes.push({ kind: 'added', group: g, name, detail: aok ? 'new check, passing' : 'new check, FAILING' }); continue; }
      if (b.get(name) !== aok) changes.push({ kind: aok ? 'fixed' : 'broken', group: g, name });
    }
    for (const name of b.keys()) if (!a.has(name)) changes.push({ kind: 'removed', group: g, name, detail: 'check disappeared — was it deleted by the update?' });
  }
  const drift = [];
  for (const k of new Set([...Object.keys(before.metrics || {}), ...Object.keys(after.metrics || {})])) {
    const bv = before.metrics?.[k], av = after.metrics?.[k];
    if (bv !== av) drift.push({ metric: k, from: bv ?? null, to: av ?? null });
  }
  const broken = changes.filter(c => c.kind === 'broken' || c.kind === 'removed');
  return { changes, drift, broken: broken.length, ok: broken.length === 0 };
}

// --- CLI -----------------------------------------------------------------

function printReport(r) {
  const line = (c) => `  ${c.ok ? 'ok  ' : 'FAIL'}  ${c.name.padEnd(46)} ${c.detail || ''}`;
  console.log('=== invariants — the rules that make evaluations honest ===');
  r.groups.invariants.forEach(c => console.log(line(c)));
  console.log('\n=== regression — real past failures, still failing ===');
  r.groups.regression.forEach(c => console.log(line(c)));
  console.log('\n=== self-tests — fork scripts ===');
  r.groups.selftests.forEach(c => console.log(line(c)));
  console.log('\n=== metrics — recorded for drift, never pass/fail ===');
  for (const [k, v] of Object.entries(r.metrics)) console.log(`        ${k.padEnd(46)} ${v === null ? 'n/a' : v}`);
  console.log(`\n${r.ok ? 'PASS' : 'FAIL'} — ${r.failed} failing check(s)`);
}

function selfTest() {
  const t = []; const ok = (n, c) => t.push({ n, pass: !!c });
  const man = parseManifest('# c\nr1\tfix.md\tfail\terr\torigin\tnote\nr2\tb.md\tpass\te2\to2\tn2\n\nbad');
  ok('parseManifest skips comments and blanks', man.length === 2);
  ok('parseManifest reads fields', man[0].id === 'r1' && man[0].expect === 'fail' && man[0].origin === 'origin');
  const before = { groups: { invariants: [{ name: 'a', ok: true }, { name: 'gone', ok: true }], regression: [], selftests: [] }, metrics: { logged: 32 } };
  const after = { groups: { invariants: [{ name: 'a', ok: false }, { name: 'new', ok: true }], regression: [], selftests: [] }, metrics: { logged: 35 } };
  const d = diffSnapshots(before, after);
  ok('diff detects broken', d.changes.some(c => c.kind === 'broken' && c.name === 'a'));
  ok('diff detects removed', d.changes.some(c => c.kind === 'removed' && c.name === 'gone'));
  ok('diff detects added', d.changes.some(c => c.kind === 'added' && c.name === 'new'));
  ok('diff reports metric drift', d.drift.some(x => x.metric === 'logged' && x.from === 32 && x.to === 35));
  ok('metric drift alone is not a failure', diffSnapshots({ groups: {}, metrics: { logged: 1 } }, { groups: {}, metrics: { logged: 9 } }).ok === true);
  ok('broken check fails the diff', d.ok === false);
  {
    const rows = parseManifest('r1\tf.md\tfail\tno ## Score Breakdown\torigin\tnote');
    ok('parseManifest reads expectError column', rows[0].expectError === 'no ## Score Breakdown' && rows[0].origin === 'origin');
  }
  const fail = t.filter(x => !x.pass);
  for (const x of t) console.log(`${x.pass ? 'PASS' : 'FAIL'}  ${x.n}`);
  console.log(`\n${t.length - fail.length}/${t.length} passed`);
  process.exit(fail.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) selfTest();
  else {
    const diffIdx = argv.indexOf('--diff');
    if (diffIdx !== -1) {
      const p = argv[diffIdx + 1];
      if (!p || !existsSync(p)) { console.error('usage: node system-check.mjs --diff <before.json>'); process.exit(1); }
      const before = JSON.parse(readFileSync(p, 'utf8'));
      const after = await collect();
      const d = diffSnapshots(before, after);
      if (argv.includes('--json')) console.log(JSON.stringify(d, null, 2));
      else {
        console.log(`=== changes since ${p} ===`);
        if (!d.changes.length) console.log('  no check changed state');
        for (const c of d.changes) console.log(`  ${c.kind.toUpperCase().padEnd(8)} ${c.group}/${c.name} ${c.detail || ''}`);
        console.log('\n=== metric drift (informational) ===');
        if (!d.drift.length) console.log('  none');
        for (const x of d.drift) console.log(`  ${x.metric.padEnd(24)} ${x.from} -> ${x.to}`);
        console.log(`\n${d.ok ? 'PASS' : 'FAIL'} — ${d.broken} check(s) broken or removed`);
      }
      process.exit(d.ok ? 0 : 1);
    }
    const r = await collect();
    const snapIdx = argv.indexOf('--snapshot');
    if (snapIdx !== -1) {
      const next = argv[snapIdx + 1];
      const p = (next && !next.startsWith('--')) ? next : 'system-snapshot.json';
      writeFileSync(p, JSON.stringify(r, null, 2));
      console.log(`snapshot written: ${p}  (${r.ok ? 'PASS' : 'FAIL'}, ${r.failed} failing)`);
      process.exit(0);
    }
    if (argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
    else printReport(r);
    process.exit(r.ok ? 0 : 1);
  }
}
