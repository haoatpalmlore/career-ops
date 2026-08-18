#!/usr/bin/env node
/**
 * apply-log.mjs — the denominator. Every application, evaluated or not.
 *
 * WHY THIS EXISTS
 * `data/applications.md` only holds applications that went through an
 * evaluation, because getting a row in requires a report number and a
 * merge-tracker run. That is heavy enough that most real applications never
 * land there. On 2026-08-18 the tracker held 32 applications against a real
 * funnel of 200+ — so every rate the system computed (34% answered, 6%
 * advanced) was measured over a non-random 16% sample of the better-targeted
 * applications. Rates over a biased sample are worse than no rates: they
 * flatter, and they hide that the fit score does not predict a reply.
 *
 * This log is deliberately dumb and cheap. One line, three required fields,
 * no evaluation needed. If logging an application takes longer than sending
 * one, the log decays and we are back to guessing.
 *
 * WHAT IT CAPTURES, AND WHY THOSE FIELDS
 * The point is not record-keeping, it is making the scoring system
 * *correctable*. We record the features that plausibly drive whether an
 * application gets read, alongside the outcome, so weights can eventually be
 * measured instead of asserted:
 *   channel — inbound / referral / agency / portal / easyapply.
 *             Both advances on record (Deloitte #184 inbound, Forever New
 *             #155 cold retail portal) differ from the nine rejections on
 *             direction, not on fit score.
 *   hook    — the checkable credential a screener can accept in place of AI
 *             tenure: retail domain, leadership level, other domain, or none.
 *   gates   — count of hard requirements in the JD that are not met
 *             (quantified year screens, must-have stacks). HotDoc's Rails
 *             gate and iterate's "7+ years Node.js" are the pattern.
 *   score   — the fit score, when one exists. Recorded so its predictive
 *             validity can be TESTED, never assumed.
 *
 * ROW IMMUTABILITY
 * Rows are append-only. The single exception is the outcome pair
 * (outcome, outcome_date), updated in place by `outcome` — the same
 * concession set-status.mjs makes for the tracker. Nothing else is rewritten.
 *
 * SILENCE IS DERIVED, NOT TYPED
 * Nobody goes back to mark an application "silent". A row still `pending`
 * more than --silence-after days (default 30) after the apply date is counted
 * as silent in every summary. That keeps the denominator honest for free.
 *
 * Run: node apply-log.mjs add --company <name> --role <title> --channel <ch>
 *                            [--hook retail|level|domain|none] [--gates N]
 *                            [--score X.X] [--tracker <num>] [--date YYYY-MM-DD]
 *                            [--note "..."]
 *      node apply-log.mjs outcome --company <name> [--role <title>] --set <outcome>
 *                                 [--date YYYY-MM-DD]
 *      node apply-log.mjs backfill [--commit]     seed from data/applications.md
 *      node apply-log.mjs                          (JSON)
 *      node apply-log.mjs --summary                (funnel, true denominator)
 *      node apply-log.mjs --validate               (does any feature predict?)
 *      node apply-log.mjs --self-test
 */

import { readFileSync, existsSync, appendFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const CAREER_OPS = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = join(CAREER_OPS, 'data/application-log.tsv');
const TRACKER_PATH = join(CAREER_OPS, 'data/applications.md');
const REPORTS_DIR = join(CAREER_OPS, 'reports');

export const CHANNELS = ['inbound', 'referral', 'agency', 'portal', 'easyapply'];
export const HOOKS = ['retail', 'level', 'domain', 'none'];
export const OUTCOMES = ['pending', 'silent', 'rejected', 'responded', 'interview', 'offer', 'hired'];
export const ANSWERED = new Set(['rejected', 'responded', 'interview', 'offer', 'hired']);
export const ADVANCED = new Set(['responded', 'interview', 'offer', 'hired']);

const COLS = ['date', 'company', 'role', 'channel', 'hook', 'gates', 'score', 'tracker', 'outcome', 'outcome_date', 'note'];

const HEADER_COMMENT = [
  '# application-log.tsv - EVERY application, evaluated or not (user layer).',
  '# This is the denominator. data/applications.md is the evaluated subset of it.',
  '# {date}\\t{company}\\t{role}\\t{channel}\\t{hook}\\t{gates|-}\\t{score|-}\\t{tracker#|-}\\t{outcome}\\t{outcome_date|-}\\t{note}',
  '# channel: inbound|referral|agency|portal|easyapply   hook: retail|level|domain|none',
  '# gates: count of unmet hard requirements   outcome: pending|silent|rejected|responded|interview|offer|hired',
  '# Rows are append-only. Only outcome/outcome_date are ever updated in place.',
].join('\n');

// --- parsing -------------------------------------------------------------

export function parseNum(raw) {
  const s = String(raw ?? '').trim();
  if (!s || s === '-' || s === '?') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseLog(content) {
  const rows = [];
  const malformed = [];
  for (const line of String(content || '').split('\n')) {
    const t = line.replace(/\r$/, '');
    if (!t.trim() || t.trim().startsWith('#')) continue;
    const c = t.split('\t').map(x => x.trim());
    if (c.length < 4 || !/^\d{4}-\d{2}-\d{2}$/.test(c[0]) || !c[1]) { malformed.push(t); continue; }
    const row = {};
    COLS.forEach((k, i) => { row[k] = c[i] ?? ''; });
    row.gates = parseNum(row.gates);
    row.score = parseNum(row.score);
    row.outcome = OUTCOMES.includes(row.outcome) ? row.outcome : 'pending';
    rows.push(row);
  }
  return { rows, malformed };
}

// Silence is derived, never typed. A pending row older than `days` is silent.
export function resolveOutcome(row, today, days = 30) {
  if (row.outcome !== 'pending') return row.outcome;
  const age = Math.floor((Date.parse(today) - Date.parse(row.date)) / 86400000);
  return Number.isFinite(age) && age > days ? 'silent' : 'pending';
}

export function funnel(rows, today, days = 30) {
  const resolved = rows.map(r => ({ ...r, resolved: resolveOutcome(r, today, days) }));
  const decided = resolved.filter(r => r.resolved !== 'pending');
  const answered = decided.filter(r => ANSWERED.has(r.resolved));
  const advanced = decided.filter(r => ADVANCED.has(r.resolved));
  return {
    total: rows.length,
    pending: resolved.length - decided.length,
    decided: decided.length,
    answered: answered.length,
    advanced: advanced.length,
    answeredRate: decided.length ? answered.length / decided.length : null,
    advancedRate: decided.length ? advanced.length / decided.length : null,
    resolved,
  };
}

// --- the point of the whole exercise ------------------------------------
// For one feature, does knowing it change the advance rate? Returns per-value
// counts plus a spread. A flat spread means the feature carries no signal.
export function separation(resolved, keyFn) {
  const decided = resolved.filter(r => r.resolved !== 'pending');
  const groups = new Map();
  for (const r of decided) {
    const k = keyFn(r);
    if (k === null || k === undefined || k === '') continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const out = [];
  for (const [k, v] of groups) {
    const ans = v.filter(r => ANSWERED.has(r.resolved)).length;
    const adv = v.filter(r => ADVANCED.has(r.resolved)).length;
    out.push({ value: k, n: v.length, answered: ans, advanced: adv,
               answeredRate: ans / v.length, advancedRate: adv / v.length,
               thin: v.length < 10 });
  }
  out.sort((a, b) => b.advancedRate - a.advancedRate || b.n - a.n);
  const rates = out.filter(o => !o.thin).map(o => o.advancedRate);
  const spread = rates.length >= 2 ? Math.max(...rates) - Math.min(...rates) : null;
  return { groups: out, spread, thinOnly: rates.length < 2 };
}

export function scoreBucket(r) {
  if (r.score === null) return null;
  if (r.score >= 4.5) return '4.5+';
  if (r.score >= 4.0) return '4.0-4.4';
  if (r.score >= 3.5) return '3.5-3.9';
  return '<3.5';
}

// --- tracker backfill ----------------------------------------------------
// Seeds the log from data/applications.md so it is not empty on day one.
// Channel is inferred conservatively: a Via entry means agency, everything
// else is marked `portal` and MUST be corrected by hand where it was really
// inbound or a referral. Guessing inbound would manufacture the exact signal
// this tool exists to measure.
const STATUS_TO_OUTCOME = {
  Applied: 'pending', Responded: 'responded', Interview: 'interview',
  Offer: 'offer', Hired: 'hired', Rejected: 'rejected',
};

export function parseTracker(content) {
  const out = [];
  for (const line of String(content || '').split('\n')) {
    if (!line.startsWith('| ')) continue;
    const c = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(x => x.trim());
    if (c.length < 9 || !/^\d+$/.test(c[0])) continue;
    const hasVia = c.length >= 10;
    const [num, date, company] = c;
    const via = hasVia ? c[3] : '—';
    const role = hasVia ? c[4] : c[3];
    const scoreCell = hasVia ? c[5] : c[4];
    const status = hasVia ? c[6] : c[5];
    if (!(status in STATUS_TO_OUTCOME)) continue;
    const m = /^([0-9.]+)\/5$/.exec(scoreCell);
    out.push({
      date, company, role, tracker: num,
      channel: (via && !['—', '-', ''].includes(via)) ? 'agency' : 'portal',
      score: m ? m[1] : '-',
      outcome: STATUS_TO_OUTCOME[status],
    });
  }
  return out;
}

// --- calibration: did the predictions hold? -----------------------------
// A score with no testable claim attached is an opinion with a decimal point.
// modes/_custom.md now requires every evaluation to carry a falsifier map.
// This joins those predictions to the outcomes in application-log.tsv so the
// evaluations accumulate a track record instead of disappearing.
//
// The join is by company name, which is imprecise when the same company is
// evaluated twice. Ambiguous joins are reported as such rather than guessed:
// a wrong join would silently corrupt the only accuracy signal that exists.

export function extractFalsifier(md) {
  const ms = String(md || '').match(/##\s*Machine Summary\s*\n+```ya?ml\n([\s\S]*?)```/i);
  if (!ms) return null;
  const block = ms[1].split(/^falsifier:\s*$/m)[1];
  if (block === undefined) return null;
  const out = {};
  for (const line of block.split('\n')) {
    if (/^\S/.test(line) && line.trim()) break;
    const m = line.match(/^\s+([a-z_]+):\s*"?(.*?)"?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  const co = (ms[1].match(/^company:\s*"?(.*?)"?\s*$/m) || [])[1] || null;
  const sc = parseFloat((ms[1].match(/^score:\s*([\d.]+)/m) || [])[1]);
  return Object.keys(out).length ? { company: co, score: Number.isFinite(sc) ? sc : null, ...out } : null;
}

/**
 * A prediction HELD if the application advanced, BROKE if it went silent or was
 * rejected, and is PENDING otherwise. Deliberately crude: the point is a
 * scoreboard that cannot be argued with, not a nuanced verdict.
 */
export function judgePrediction(outcome) {
  if (ADVANCED.has(outcome)) return 'held';
  if (outcome === 'silent' || outcome === 'rejected') return 'broke';
  return 'pending';
}

const coKey = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function calibrate(reportFalsifiers, resolvedRows) {
  // Prefer joining on the tracker number. Agency-mediated reports carry "?" as
  // the company (#1596), so a name join would collapse every confidential
  // employer into one bucket and report them all as ambiguous.
  const byTracker = new Map();
  const byCo = new Map();
  for (const r of resolvedRows) {
    if (r.tracker && r.tracker !== '-') {
      if (!byTracker.has(String(r.tracker))) byTracker.set(String(r.tracker), []);
      byTracker.get(String(r.tracker)).push(r);
    }
    const k = coKey(r.company);
    if (!k) continue;
    if (!byCo.has(k)) byCo.set(k, []);
    byCo.get(k).push(r);
  }
  const judged = [];
  for (const f of reportFalsifiers) {
    const repNum = (String(f.report || '').match(/^(\d+)/) || [])[1];
    const k = coKey(f.company);
    const hits = (repNum && byTracker.get(repNum)) || byCo.get(k) || [];
    if (hits.length === 0) { judged.push({ ...f, join: 'no-application', verdict: 'unapplied' }); continue; }
    if (hits.length > 1) { judged.push({ ...f, join: 'ambiguous', verdict: 'unjoinable', candidates: hits.length }); continue; }
    judged.push({ ...f, join: 'ok', outcome: hits[0].resolved, verdict: judgePrediction(hits[0].resolved) });
  }
  const held = judged.filter(j => j.verdict === 'held').length;
  const broke = judged.filter(j => j.verdict === 'broke').length;
  return { judged, held, broke, decided: held + broke,
           accuracy: (held + broke) ? held / (held + broke) : null };
}

// --- writing -------------------------------------------------------------

function ensureLog() {
  if (existsSync(LOG_PATH)) return;
  mkdirSync(dirname(LOG_PATH), { recursive: true });
  writeFileSync(LOG_PATH, HEADER_COMMENT + '\n', 'utf8');
}

export function toLine(r) {
  return COLS.map(k => {
    const v = r[k];
    return (v === null || v === undefined || v === '') ? '-' : String(v).replace(/\t/g, ' ');
  }).join('\t');
}

function readLog() {
  return existsSync(LOG_PATH) ? readFileSync(LOG_PATH, 'utf8') : '';
}

// --- CLI -----------------------------------------------------------------

function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) o[k] = true;
      else { o[k] = next; i++; }
    } else o._.push(a);
  }
  return o;
}

const pct = x => x === null ? ' n/a ' : (100 * x).toFixed(1).padStart(5) + '%';

function cmdAdd(a) {
  for (const req of ['company', 'role', 'channel']) {
    if (!a[req] || a[req] === true) { console.error(`error: --${req} is required`); process.exit(1); }
  }
  if (!CHANNELS.includes(a.channel)) {
    console.error(`error: --channel must be one of ${CHANNELS.join('|')}`); process.exit(1);
  }
  if (a.hook && a.hook !== true && !HOOKS.includes(a.hook)) {
    console.error(`error: --hook must be one of ${HOOKS.join('|')}`); process.exit(1);
  }
  const row = {
    date: (a.date && a.date !== true) ? a.date : new Date().toISOString().slice(0, 10),
    company: a.company, role: a.role, channel: a.channel,
    hook: (a.hook && a.hook !== true) ? a.hook : 'none',
    gates: (a.gates && a.gates !== true) ? a.gates : '-',
    score: (a.score && a.score !== true) ? a.score : '-',
    tracker: (a.tracker && a.tracker !== true) ? a.tracker : '-',
    outcome: 'pending', outcome_date: '-',
    note: (a.note && a.note !== true) ? a.note : '-',
  };
  ensureLog();
  appendFileSync(LOG_PATH, toLine(row) + '\n', 'utf8');
  console.log(JSON.stringify({ ok: true, added: row }, null, 2));
}

function cmdOutcome(a) {
  if (!a.company || a.company === true) { console.error('error: --company is required'); process.exit(1); }
  if (!a.set || !OUTCOMES.includes(a.set)) {
    console.error(`error: --set must be one of ${OUTCOMES.join('|')}`); process.exit(1);
  }
  const raw = readLog();
  const lines = raw.split('\n');
  const wantCo = a.company.toLowerCase();
  const wantRole = (a.role && a.role !== true) ? a.role.toLowerCase() : null;
  let hitIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i];
    if (!t.trim() || t.trim().startsWith('#')) continue;
    const c = t.split('\t');
    if (c.length < 4) continue;
    if (c[1].trim().toLowerCase() !== wantCo) continue;
    if (wantRole && !c[2].trim().toLowerCase().includes(wantRole)) continue;
    hitIdx = i; break;
  }
  if (hitIdx < 0) { console.error(`error: no log row for company "${a.company}"${wantRole ? ` + role "${a.role}"` : ''}`); process.exit(1); }
  const c = lines[hitIdx].split('\t');
  while (c.length < COLS.length) c.push('-');
  c[8] = a.set;
  c[9] = (a.date && a.date !== true) ? a.date : new Date().toISOString().slice(0, 10);
  lines[hitIdx] = c.join('\t');
  writeFileSync(LOG_PATH, lines.join('\n'), 'utf8');
  console.log(JSON.stringify({ ok: true, updated: { company: c[1], role: c[2], outcome: c[8], outcome_date: c[9] } }, null, 2));
}

function cmdBackfill(a) {
  if (!existsSync(TRACKER_PATH)) { console.error('error: data/applications.md not found'); process.exit(1); }
  const seeds = parseTracker(readFileSync(TRACKER_PATH, 'utf8'));
  const { rows: existing } = parseLog(readLog());
  const seen = new Set(existing.map(r => `${r.company}|${r.role}`.toLowerCase()));
  const fresh = seeds.filter(s => !seen.has(`${s.company}|${s.role}`.toLowerCase()));
  if (!a.commit) {
    console.log(JSON.stringify({ dryRun: true, wouldAdd: fresh.length, alreadyPresent: seeds.length - fresh.length,
      note: 'channel inferred as agency (Via set) or portal (everything else). Correct inbound/referral rows by hand — guessing them would manufacture the signal this tool measures.',
      sample: fresh.slice(0, 5) }, null, 2));
    return;
  }
  ensureLog();
  for (const s of fresh) {
    appendFileSync(LOG_PATH, toLine({ ...s, hook: 'none', gates: '-', outcome_date: '-', note: 'backfilled from tracker' }) + '\n', 'utf8');
  }
  console.log(JSON.stringify({ ok: true, added: fresh.length }, null, 2));
}

function cmdCalibration(a) {
  if (!existsSync(REPORTS_DIR)) { console.error('no reports/ directory'); process.exit(1); }
  const falsifiers = [];
  for (const f of readdirSync(REPORTS_DIR).filter(x => x.endsWith('.md')).sort()) {
    const fx = extractFalsifier(readFileSync(join(REPORTS_DIR, f), 'utf8'));
    if (fx) falsifiers.push({ report: f, ...fx });
  }
  const { rows } = parseLog(readLog());
  const today = (a.today && a.today !== true) ? a.today : new Date().toISOString().slice(0, 10);
  const days = a['silence-after'] && a['silence-after'] !== true ? Number(a['silence-after']) : 30;
  const { resolved } = funnel(rows, today, days);
  const c = calibrate(falsifiers, resolved);

  if (!a.summary) { console.log(JSON.stringify({ reportsWithFalsifier: falsifiers.length, ...c }, null, 2)); return; }
  console.log('=== prediction track record ===');
  console.log(`  reports carrying a falsifier   ${falsifiers.length}`);
  if (falsifiers.length === 0) {
    console.log('\n  No evaluation has ever made a testable prediction.');
    console.log('  Nothing can be scored until new evaluations carry a falsifier: map.');
    console.log('  See modes/_custom.md -> Falsification.');
    return;
  }
  console.log(`  predictions resolved           ${c.decided}  (held ${c.held}, broke ${c.broke})`);
  console.log(`  accuracy                       ${c.accuracy === null ? 'n/a - nothing resolved yet' : (100 * c.accuracy).toFixed(1) + '%'}`);
  const un = c.judged.filter(j => j.verdict === 'unjoinable').length;
  const na = c.judged.filter(j => j.verdict === 'unapplied').length;
  if (un) console.log(`  ! ambiguous joins              ${un}  (company evaluated more than once - not guessed)`);
  if (na) console.log(`  not yet applied to             ${na}`);
  console.log('');
  for (const j of c.judged) {
    const tag = { held: 'HELD  ', broke: 'BROKE ', pending: 'wait  ', unapplied: '-     ', unjoinable: '?     ' }[j.verdict];
    console.log(`  ${tag} ${String(j.score ?? '-').padEnd(4)} ${String(j.company || '?').slice(0, 22).padEnd(23)} ${String(j.predicts || '').slice(0, 60)}`);
  }
}

function report(a) {
  const { rows, malformed } = parseLog(readLog());
  const today = (a.today && a.today !== true) ? a.today : new Date().toISOString().slice(0, 10);
  const days = a['silence-after'] && a['silence-after'] !== true ? Number(a['silence-after']) : 30;
  const f = funnel(rows, today, days);
  const feats = {
    score: separation(f.resolved, scoreBucket),
    channel: separation(f.resolved, r => r.channel),
    hook: separation(f.resolved, r => r.hook),
    gates: separation(f.resolved, r => r.gates === null ? null : (r.gates >= 2 ? '2+' : String(r.gates))),
  };

  if (!a.summary && !a.validate) {
    console.log(JSON.stringify({ today, silenceAfterDays: days, funnel: { ...f, resolved: undefined }, features: feats, malformed }, null, 2));
    return;
  }
  if (a.summary) {
    console.log('=== application funnel (true denominator) ===');
    console.log(`  logged            ${f.total}`);
    console.log(`  still pending     ${f.pending}  (applied within ${days}d, no outcome yet)`);
    console.log(`  decided           ${f.decided}`);
    console.log(`  answered          ${f.answered}  ${pct(f.answeredRate)} of decided`);
    console.log(`  advanced          ${f.advanced}  ${pct(f.advancedRate)} of decided`);
    if (malformed.length) console.log(`  ! malformed rows  ${malformed.length}`);
  }
  if (a.validate) {
    console.log('\n=== does any feature predict advancing? ===');
    console.log('(buckets under n=10 are marked thin and excluded from spread)\n');
    for (const [name, s] of Object.entries(feats)) {
      const verdict = s.thinOnly ? 'INSUFFICIENT DATA'
        : s.spread >= 0.15 ? `SIGNAL (spread ${(100 * s.spread).toFixed(1)}pp)`
        : `NO SIGNAL (spread ${(100 * s.spread).toFixed(1)}pp)`;
      console.log(`${name.toUpperCase().padEnd(9)} ${verdict}`);
      for (const g of s.groups) {
        console.log(`  ${String(g.value).padEnd(10)} n=${String(g.n).padStart(3)}  answered ${pct(g.answeredRate)}  advanced ${pct(g.advancedRate)}${g.thin ? '   (thin)' : ''}`);
      }
      console.log('');
    }
    console.log('Read this as: a feature with NO SIGNAL must not drive the score.');
    console.log('The fit score is listed first on purpose - it is the claim under test.');
  }
}

function selfTest() {
  const t = [];
  const ok = (n, c) => t.push({ n, pass: !!c });
  ok('parseNum blank -> null', parseNum('-') === null && parseNum('') === null);
  ok('parseNum numeric', parseNum('4.5') === 4.5);
  const { rows, malformed } = parseLog(
    '# comment\n2026-01-01\tAcme\tEng\tportal\tnone\t1\t4.2\t-\trejected\t2026-01-09\tx\n' +
    'garbage line\n2026-02-01\tBeta\tEng\tinbound\tlevel\t0\t3.8\t-\tpending\t-\t-\n');
  ok('parseLog reads 2 rows', rows.length === 2);
  ok('parseLog flags malformed', malformed.length === 1);
  ok('parseLog coerces numbers', rows[0].score === 4.2 && rows[0].gates === 1);
  ok('pending + old -> silent', resolveOutcome({ outcome: 'pending', date: '2026-01-01' }, '2026-03-01', 30) === 'silent');
  ok('pending + recent stays pending', resolveOutcome({ outcome: 'pending', date: '2026-02-25' }, '2026-03-01', 30) === 'pending');
  ok('explicit outcome untouched', resolveOutcome({ outcome: 'rejected', date: '2026-01-01' }, '2026-03-01', 30) === 'rejected');
  const f = funnel(rows, '2026-03-15', 30);
  ok('funnel counts decided', f.decided === 2 && f.answered === 1 && f.advanced === 0);
  ok('scoreBucket boundaries', scoreBucket({ score: 4.5 }) === '4.5+' && scoreBucket({ score: 4.4 }) === '4.0-4.4' && scoreBucket({ score: null }) === null);
  const sep = separation(f.resolved, r => r.channel);
  ok('separation groups', sep.groups.length === 2);
  ok('separation thin flagged', sep.groups.every(g => g.thin));
  ok('separation thinOnly', sep.thinOnly === true);
  const tr = parseTracker('| 5 | 2026-01-01 | Acme | Hays | Eng | 4.2/5 | Rejected | ❌ | [5](r.md) | n |\n| 6 | 2026-01-02 | Beta | — | Dev | 4.0/5 | Applied | ❌ | [6](r.md) | n |\n| 7 | 2026-01-03 | Gam | — | Dev | 3.0/5 | Evaluated | ❌ | [7](r.md) | n |');
  ok('parseTracker skips Evaluated', tr.length === 2);
  ok('parseTracker via -> agency', tr[0].channel === 'agency' && tr[1].channel === 'portal');
  ok('parseTracker maps status', tr[0].outcome === 'rejected' && tr[1].outcome === 'pending');
  ok('toLine blanks -> dash', toLine({ date: '2026-01-01', company: 'A' }).split('\t')[2] === '-');
  ok('judgePrediction held', judgePrediction('interview') === 'held' && judgePrediction('offer') === 'held');
  ok('judgePrediction broke', judgePrediction('silent') === 'broke' && judgePrediction('rejected') === 'broke');
  ok('judgePrediction pending', judgePrediction('pending') === 'pending');
  const fx = extractFalsifier('## Machine Summary\n\n```yaml\ncompany: "Acme"\nscore: 3.6\nfalsifier:\n  predicts: "reply in 21 days"\n  wrong_if: "silence"\nvia: null\n```\n');
  ok('extractFalsifier reads map', fx && fx.predicts === 'reply in 21 days' && fx.company === 'Acme' && fx.score === 3.6);
  ok('extractFalsifier stops at dedent', fx && fx.via === undefined);
  ok('extractFalsifier null without map', extractFalsifier('## Machine Summary\n\n```yaml\nscore: 4\n```') === null);
  const cal = calibrate(
    [{ company: 'Acme', predicts: 'x' }, { company: 'Beta', predicts: 'y' }, { company: 'Zeta', predicts: 'z' }],
    [{ company: 'Acme', resolved: 'interview' }, { company: 'Beta', resolved: 'silent' },
     { company: 'Beta', resolved: 'rejected' }]);
  ok('calibrate counts held/broke', cal.held === 1 && cal.broke === 0);
  ok('calibrate refuses ambiguous join', cal.judged.some(j => j.verdict === 'unjoinable'));
  ok('calibrate marks unapplied', cal.judged.some(j => j.verdict === 'unapplied'));
  {
    // Confidential employers all carry "?" as company; a name join would fuse
    // them. The tracker number must win when present.
    const c2 = calibrate(
      [{ report: '185-x.md', company: '?', predicts: 'p' }, { report: '190-y.md', company: '?', predicts: 'p' }],
      [{ company: '?', tracker: '185', resolved: 'interview' }, { company: '?', tracker: '190', resolved: 'silent' }]);
    ok('calibrate joins confidential rows by tracker#', c2.held === 1 && c2.broke === 1);
  }

  const fail = t.filter(x => !x.pass);
  for (const x of t) console.log(`${x.pass ? 'PASS' : 'FAIL'}  ${x.n}`);
  console.log(`\n${t.length - fail.length}/${t.length} passed`);
  process.exit(fail.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = args(process.argv.slice(2));
  if (a['self-test']) selfTest();
  else if (a._[0] === 'add') cmdAdd(a);
  else if (a._[0] === 'outcome') cmdOutcome(a);
  else if (a._[0] === 'backfill') cmdBackfill(a);
  else if (a.calibration) cmdCalibration(a);
  else report(a);
}
