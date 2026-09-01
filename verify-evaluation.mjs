#!/usr/bin/env node
/**
 * verify-evaluation.mjs — structural validator for evaluation reports.
 *
 * WHY THIS EXISTS
 * AGENTS.md: "Reinforcement-without-enforcement decays." Two rules were added
 * to modes/_custom.md after #185 shipped a 3.9 that its own dimension inputs
 * could not support:
 *
 *   Case Against  — argue, from the same evidence, that the candidate is NOT a
 *                   fit, BEFORE Block B is scored. The evaluation architecture
 *                   (the Adaptive Framing table in _profile.md) is built to
 *                   find a match and has no path that outputs "no analogue".
 *   Falsification — attach a testable, time-bounded prediction so the score can
 *                   later be shown to have been wrong. Nothing the system had
 *                   ever produced was falsifiable.
 *
 * A rule the agent is merely asked to follow gets followed until it is
 * inconvenient. This checks. It is deliberately structural, not semantic: it
 * cannot tell whether a Case Against is *good*, only whether one exists, is
 * non-vacuous, and whether the published arithmetic reconciles. That is enough
 * to stop the specific failures observed.
 *
 * LEGACY REPORTS ARE EXPECTED TO FAIL. --all sweeps reports/ and reports a
 * compliance rate; a low rate on historical reports is the correct signal.
 *
 * Run: node verify-evaluation.mjs reports/185-....md
 *      node verify-evaluation.mjs --all [--json]
 *      node verify-evaluation.mjs --self-test
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { isMainModule } from './lib/is-main-module.mjs';
import { getCareerOpsRoot } from './path-resolver.mjs';

const CAREER_OPS = dirname(fileURLToPath(import.meta.url));
// reports/ is user layer, so it follows the Data Root rather than the
// codebase root (AGENTS.md, Path Resolution Override & Precedence).
const REPORTS_DIR = join(getCareerOpsRoot(), 'reports');

// Hedges that make a prediction untestable. A falsifier containing one of
// these is not a prediction, it is a disclaimer.
const HEDGES = /\b(may|might|could|possibly|potentially|if conditions|depending on|hopefully|likely to be favourable)\b/i;
// A Case Against that only restates the gaps table is vacuous. These are the
// four checks _custom.md requires; at minimum the scale question must appear.
const SCALE_CUES = /\b(scale|scaled|enterprise|multi[- ]tenant|fleet|team of|headcount|volume|solo|one[- ]person|single[- ]handed)\b/i;

// NOTE: deliberately NOT using the `m` flag. With `m`, the trailing `$` in the
// terminator matches end-of-LINE, so every section truncated to its first line
// and the last section in a file returned empty. `(?:^|\n)` handles the
// heading anchor instead, leaving `$` as true end-of-string.
export function extractSection(md, heading) {
  const re = new RegExp(`(?:^|\\n)#{1,3}\\s*${heading}\\b[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`, 'i');
  const m = String(md || '').match(re);
  return m ? m[1].trim() : null;
}

export function extractMachineSummary(md) {
  const m = String(md || '').match(/##\s*Machine Summary\s*\n+```ya?ml\n([\s\S]*?)```/i);
  return m ? m[1] : null;
}

/** Shallow read of the falsifier map. Not a YAML parser — a two-level reader. */
export function parseFalsifier(yamlText) {
  const block = String(yamlText || '').split(/^falsifier:\s*$/m)[1];
  if (block === undefined) return null;
  const out = {};
  for (const line of block.split('\n')) {
    if (/^\S/.test(line) && line.trim()) break; // dedented -> next top-level key
    const m = line.match(/^\s+([a-z_]+):\s*"?(.*?)"?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return Object.keys(out).length ? out : null;
}

/** Pull "| Dimension | Score |" rows out of a Score Breakdown table. */
export function parseScoreBreakdown(section) {
  if (!section) return null;
  const dims = {};
  let global = null;
  for (const line of section.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const c = line.split('|').map(x => x.replace(/\*\*/g, '').trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
    if (c.length < 2) continue;
    const name = c[0].toLowerCase();
    if (/^-+$/.test(name) || name === 'dimension') continue;
    // Strip out-of-N notation FIRST: "3.4/5" must read 3.4, not 5. Then last
    // numeric token wins, so a revision like "~~2.5~~ -> 3.4" reads as 3.4.
    const cell = String(c[1]).replace(/\s*\/\s*5\b/g, '');
    const nums = cell.match(/-?\d+(?:\.\d+)?/g);
    if (!nums) continue;
    const val = parseFloat(nums[nums.length - 1]);
    if (name.startsWith('global')) global = val;
    else if (name.includes('red flag')) dims.redFlags = -Math.abs(val);
    else dims[name] = val;
  }
  const scored = Object.entries(dims).filter(([k]) => k !== 'redFlags').map(([, v]) => v);
  if (!scored.length || global === null) return null;
  const mean = scored.reduce((a, b) => a + b, 0) / scored.length;
  const baseline = mean + (dims.redFlags || 0);
  return { dims, global, mean, baseline, lift: global - baseline, count: scored.length };
}

export function verify(md, name = 'report') {
  const issues = [];
  const pass = [];

  const ms = extractMachineSummary(md);
  if (!ms) issues.push({ level: 'error', msg: 'no ## Machine Summary YAML fence' });

  // --- Score Breakdown + arithmetic ---
  const sb = extractSection(md, 'Score Breakdown');
  if (!sb) {
    issues.push({ level: 'error', msg: 'no ## Score Breakdown section — the score is not reconstructible' });
  } else {
    const b = parseScoreBreakdown(sb);
    if (!b) issues.push({ level: 'error', msg: 'Score Breakdown present but no dimension/Global rows parsed' });
    else {
      pass.push(`Score Breakdown: ${b.count} dimensions, baseline ${b.baseline.toFixed(2)}, global ${b.global}`);
      if (Math.abs(b.lift) > 0.301) {
        issues.push({ level: 'error', msg: `holistic lift ${b.lift >= 0 ? '+' : ''}${b.lift.toFixed(2)} exceeds the +/-0.3 cap (baseline ${b.baseline.toFixed(2)} -> global ${b.global})` });
      }
      const headerScore = (md.match(/^\*\*Score:\*\*\s*([\d.]+)\/5/m) || [])[1];
      if (headerScore && Math.abs(parseFloat(headerScore) - b.global) > 1e-9) {
        issues.push({ level: 'error', msg: `header Score ${headerScore} disagrees with Score Breakdown Global ${b.global}` });
      }
      const msScore = ms && (ms.match(/^score:\s*([\d.]+)/m) || [])[1];
      if (msScore && Math.abs(parseFloat(msScore) - b.global) > 1e-9) {
        issues.push({ level: 'error', msg: `Machine Summary score ${msScore} disagrees with Global ${b.global}` });
      }
    }
  }

  // --- Case Against ---
  const ca = extractSection(md, 'Case Against');
  if (!ca) {
    issues.push({ level: 'error', msg: 'no ## Case Against section (mandatory per modes/_custom.md)' });
  } else if (ca.length < 200) {
    issues.push({ level: 'error', msg: `Case Against is ${ca.length} chars — too short to have done the four checks` });
  } else if (!SCALE_CUES.test(ca)) {
    issues.push({ level: 'error', msg: 'Case Against never mentions scale or context — the #185 failure mode is unchecked' });
  } else {
    pass.push(`Case Against: ${ca.length} chars, scale/context addressed`);
  }

  // --- Falsifier ---
  const f = ms ? parseFalsifier(ms) : null;
  if (!f) {
    issues.push({ level: 'error', msg: 'no falsifier: map in Machine Summary (mandatory per modes/_custom.md)' });
  } else {
    for (const k of ['predicts', 'wrong_if', 'binding_constraint', 'most_informative_unknown']) {
      if (!f[k] || f[k].length < 8) issues.push({ level: 'error', msg: `falsifier.${k} missing or empty` });
    }
    if (f.predicts && HEDGES.test(f.predicts)) {
      issues.push({ level: 'error', msg: `falsifier.predicts is hedged ("${f.predicts}") — must be observable and time-bounded` });
    }
    if (f.predicts && !/\b\d+\s*(day|days|week|weeks|month|months)\b/i.test(f.predicts)) {
      issues.push({ level: 'warn', msg: 'falsifier.predicts has no explicit time bound' });
    }
    if (f.binding_constraint && /[,;]|\band\b/i.test(f.binding_constraint)) {
      issues.push({ level: 'warn', msg: 'falsifier.binding_constraint looks like a list — it must name ONE thing' });
    }
    if (!issues.some(i => i.msg.startsWith('falsifier'))) pass.push('Falsifier: all four fields concrete');
  }

  const errors = issues.filter(i => i.level === 'error');
  return { name, ok: errors.length === 0, errors: errors.length,
           warnings: issues.filter(i => i.level === 'warn').length, issues, pass };
}

// --- CLI -----------------------------------------------------------------

function printOne(r) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
  for (const p of r.pass) console.log(`   ok   ${p}`);
  for (const i of r.issues) console.log(`   ${i.level === 'error' ? 'ERR ' : 'warn'}  ${i.msg}`);
}

function selfTest() {
  const t = []; const ok = (n, c) => t.push({ n, pass: !!c });
  const good = [
    '# Evaluation: Acme', '', '**Score:** 3.6/5', '', '## Machine Summary', '', '```yaml',
    'score: 3.6', 'falsifier:', '  predicts: "recruiter reply within 21 days"',
    '  wrong_if: "silent past 21 days"', '  binding_constraint: "AWS stack delta at screen"',
    '  most_informative_unknown: "is the band base or package"', 'via: null', '```', '',
    '## Case Against', '', 'The eval harness was built at solo-founder scale on a one-person product, '
    + 'while the role defines evaluation across enterprise multi-tenant customer fleets. A screener '
    + 'could reasonably prefer someone who has run evals at that scale. Strongest objection: the '
    + 'artefact is real but the scale is not comparable, and nothing in scope closes that.', '',
    '## Score Breakdown', '', '| Dimension | Score | Reasoning |', '|---|---|---|',
    '| Match with CV | 4.4 | x |', '| North Star alignment | 4.0 | x |', '| Comp | 2.5 | x |',
    '| Cultural signals | 3.5 | x |', '| Red flags | -0.3 | x |', '| **Global** | **3.6** | x |',
  ].join('\n');
  const g = verify(good, 'good');
  ok('valid report passes', g.ok);
  ok('parses breakdown', g.pass.some(p => p.startsWith('Score Breakdown')));

  const b = parseScoreBreakdown(extractSection(good, 'Score Breakdown'));
  ok('mean of four dims', Math.abs(b.mean - 3.6) < 1e-9);
  ok('baseline subtracts red flags', Math.abs(b.baseline - 3.3) < 1e-9);
  ok('lift computed', Math.abs(b.lift - 0.3) < 1e-9);
  ok('red flags forced negative', b.dims.redFlags === -0.3);
  {
    // Regression: reports write "3.5/5" and a naive last-numeric-wins parser
    // read the denominator. Caught on report #185 by this validator itself.
    const outOfFive = good
      .replace('| Match with CV | 4.4 |', '| Match with CV | 3.5/5 (capped) |')
      .replace('| **Global** | **3.6** |', '| **Global** | **3.3/5** |')
      .replace('score: 3.6', 'score: 3.3').replace('**Score:** 3.6/5', '**Score:** 3.3/5');
    const b5 = parseScoreBreakdown(extractSection(outOfFive, 'Score Breakdown'));
    // Capping Match at 3.5 drops the baseline to 3.075, so 3.4 would be a
    // +0.325 lift and must fail. 3.3 is the highest legal one-decimal global.
    ok('X/5 notation parses as X', b5 && b5.dims['match with cv'] === 3.5 && b5.global === 3.3);
    ok('report using X/5 throughout passes', verify(outOfFive, 'x').ok);
  }

  ok('missing Case Against fails', !verify(good.replace('## Case Against', '## Something Else'), 'x').ok);
  ok('missing breakdown fails', !verify(good.replace('## Score Breakdown', '## Notes'), 'x').ok);
  ok('missing falsifier fails', !verify(good.replace('falsifier:', 'other:'), 'x').ok);

  const hedged = good.replace('recruiter reply within 21 days', 'may progress if conditions are favourable');
  ok('hedged prediction fails', !verify(hedged, 'x').ok);

  const overLift = good.replace('| **Global** | **3.6** |', '| **Global** | **3.9** |').replace('score: 3.6', 'score: 3.9').replace('**Score:** 3.6/5', '**Score:** 3.9/5');
  const ol = verify(overLift, 'x');
  ok('lift over 0.3 fails (the #185 case)', !ol.ok && ol.issues.some(i => /exceeds the \+\/-0\.3 cap/.test(i.msg)));

  const mismatch = good.replace('**Score:** 3.6/5', '**Score:** 4.1/5');
  ok('header/global mismatch fails', !verify(mismatch, 'x').ok);

  const shallow = good.replace(/## Case Against\n\n[\s\S]*?\n\n## Score/, '## Case Against\n\nNo real gaps.\n\n## Score');
  ok('vacuous Case Against fails', !verify(shallow, 'x').ok);

  const noScale = good.replace(/The eval harness[\s\S]*?closes that\./, 'The candidate lacks a formal certification and has not used the exact framework named in the posting, which a reviewer may weigh against them when comparing applicants on paper.');
  ok('Case Against without scale check fails', !verify(noScale, 'x').ok);

  ok('list binding_constraint warns', verify(good.replace('"AWS stack delta at screen"', '"AWS delta, and comp, and title"'), 'x').warnings > 0);

  const fail = t.filter(x => !x.pass);
  for (const x of t) console.log(`${x.pass ? 'PASS' : 'FAIL'}  ${x.n}`);
  console.log(`\n${t.length - fail.length}/${t.length} passed`);
  process.exit(fail.length ? 1 : 0);
}

if (isMainModule(import.meta.url)) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) selfTest();
  else if (argv.includes('--all')) {
    const files = readdirSync(REPORTS_DIR).filter(f => f.endsWith('.md')).sort();
    const results = files.map(f => verify(readFileSync(join(REPORTS_DIR, f), 'utf8'), f));
    const okN = results.filter(r => r.ok).length;
    if (argv.includes('--json')) {
      console.log(JSON.stringify({ total: results.length, compliant: okN, results }, null, 2));
    } else {
      for (const r of results.filter(r => r.ok)) console.log(`PASS  ${r.name}`);
      console.log(`\n${okN}/${results.length} reports compliant (${(100 * okN / results.length).toFixed(1)}%)`);
      console.log('Legacy reports predate the Case Against / Falsification rules; a low rate here is');
      console.log('the correct signal, not a bug. New evaluations must pass.');
    }
    process.exit(0);
  } else {
    const f = argv.find(a => !a.startsWith('--'));
    if (!f) { console.error('usage: node verify-evaluation.mjs <report.md> | --all | --self-test'); process.exit(1); }
    const path = existsSync(f) ? f : join(REPORTS_DIR, f);
    if (!existsSync(path)) { console.error(`not found: ${f}`); process.exit(1); }
    const r = verify(readFileSync(path, 'utf8'), basename(path));
    printOne(r);
    process.exit(r.ok ? 0 : 1);
  }
}
