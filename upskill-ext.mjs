#!/usr/bin/env node
/**
 * upskill-ext.mjs — local extensions to the upstream roadmap pipeline.
 *
 * WHY THIS FILE EXISTS SEPARATELY
 * This fork diverges from santifer/career-ops and has to survive
 * `git rebase upstream/main` indefinitely. New files never conflict; edits to
 * an upstream file conflict on every touch of the same region. These functions
 * started as ~200 inline lines inside upskill.mjs, which made upskill.mjs the
 * single largest rebase hazard in the fork. Extracting them here leaves a
 * handful of call-site lines in the upstream file and moves all the local
 * logic somewhere upstream will never write.
 *
 * Rule for future changes: anything that can live in a new file, does.
 * See LOCAL-CHANGES.md for the full divergence manifest.
 *
 * Pure functions only — no I/O, no process state. upskill.mjs re-exports them
 * so existing importers keep working.
 */

/**
 * How much should a report's gaps count toward the roadmap?
 *
 * The original weight was `5.0 - score`, which gives the LOUDEST voice to the
 * roles scored WORST. Those are mostly roles rejected for being the wrong
 * archetype entirely, so the roadmap ended up optimising for jobs the
 * candidate would never take — React ranked #1 off five low-scoring
 * full-stack evaluations. Relevance gates that: a gap only earns roadmap
 * weight in proportion to how close its role sits to the target archetypes.
 *
 * primary -> 1.0, strong/secondary -> 0.6, everything else -> 0.15 (not zero:
 * a skill demanded across many off-target roles is still weak evidence).
 */
export function archetypeRelevance(reportArchetype, targets) {
  if (!reportArchetype) return 0.15;
  const hay = String(reportArchetype).toLowerCase();
  let best = 0.15;
  for (const t of targets) {
    const name = String(t.name || '').toLowerCase();
    if (!name) continue;
    const tokens = name.split(/[^a-z]+/).filter(w => w.length > 3);
    const hit = hay.includes(name) || (tokens.length > 0 && tokens.every(w => hay.includes(w)));
    if (!hit) continue;
    const fit = String(t.fit || '').toLowerCase();
    const w = fit === 'primary' ? 1.0 : (fit === 'secondary' || fit === 'strong') ? 0.6 : 0.3;
    if (w > best) best = w;
  }
  return best;
}

/** Read archetype names + fit levels from config/profile.yml (shallow YAML). */
export function parseTargetArchetypes(yamlText) {
  const out = [];
  const block = String(yamlText || '').split(/^\s*archetypes:\s*$/m)[1];
  if (!block) return out;
  let cur = null;
  for (const line of block.split('\n')) {
    if (/^\s{0,2}\S/.test(line) && !/^\s*-\s/.test(line) && cur) break;
    const nm = line.match(/^\s*-\s*name:\s*"?([^"#]+?)"?\s*(?:#.*)?$/);
    if (nm) { cur = { name: nm[1].trim(), fit: '' }; out.push(cur); continue; }
    const ft = line.match(/^\s*fit:\s*"?([a-z]+)"?/i);
    if (ft && cur) cur.fit = ft[1].toLowerCase();
  }
  return out;
}

/**
 * Collapse a free-text requirement to a comparison key.
 *
 * data/role-requirements.tsv held 147 GAP rows whose top entry appeared 3
 * times, because "executive engagement at cto vp level" and "executive
 * engagement at cto   vp level" were stored as different strings. Without a
 * key the file cannot roll up, and a gap ledger that cannot roll up cannot
 * produce a roadmap. Lowercase, strip punctuation and filler, collapse
 * whitespace, drop a few known synonyms to one form.
 */
const REQ_SYNONYMS = [
  [/\bpre[- ]?sales\b/g, 'presales'],
  [/\bcustomer[- ]facing\b/g, 'customerfacing'],
  [/\bsolutions? (?:architect|engineer)\b/g, 'sa'],
  [/\b(?:cto|vp|c[- ]?level|executive)\b/g, 'exec'],
  [/\btitle shape(?: on cv)?\b/g, 'titleshape'],
  [/\bat scale\b/g, ''],
];
const REQ_STOP = new Set(['a','an','the','and','or','of','in','on','at','to','for','with','experience','level','strong','proven','deep']);

export function normalizeRequirement(raw) {
  let s = String(raw || '').toLowerCase();
  s = s.replace(/[^a-z0-9 ]+/g, ' ');
  for (const [re, to] of REQ_SYNONYMS) s = s.replace(re, to);
  const words = s.split(/\s+/).filter(w => w && !REQ_STOP.has(w));
  return [...new Set(words)].sort().join(' ').trim();
}

/** Roll up role-requirements.tsv GAP/PARTIAL rows into a ranked cluster list. */
export function rollupRequirements(tsvText) {
  const byKey = new Map();
  for (const line of String(tsvText || '').split('\n')) {
    const t = line.replace(/\r$/, '');
    if (!t.trim() || t.startsWith('#')) continue;
    const c = t.split('\t').map(x => x.trim());
    if (c.length < 6) continue;
    const [rep, company, role, bucket, requirement, status] = c;
    const st = status.toUpperCase();
    if (st !== 'GAP' && st !== 'PARTIAL') continue;
    const key = normalizeRequirement(requirement);
    if (!key) continue;
    if (!byKey.has(key)) byKey.set(key, { key, bucket, variants: new Set(), reports: new Set(), gap: 0, partial: 0 });
    const e = byKey.get(key);
    e.variants.add(requirement);
    if (rep) e.reports.add(rep);
    if (st === 'GAP') e.gap += 1; else e.partial += 1;
  }
  return [...byKey.values()]
    .map(e => ({ key: e.key, bucket: e.bucket, label: [...e.variants][0],
                 variants: e.variants.size, roles: e.reports.size,
                 gap: e.gap, partial: e.partial, total: e.gap + e.partial }))
    .sort((a, b) => b.total - a.total || b.gap - a.gap);
}


// --- CLI + self-test ------------------------------------------------------
// Kept here rather than in upskill.mjs so the upstream file carries only
// integration seams. `--requirements` ranks the clustered gap ledger.

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));

export function runRequirementsCli(argv, aggregateGaps) {
  const REQ_FILE = join(HERE, 'data/role-requirements.tsv');
  if (!existsSync(REQ_FILE)) {
    console.error('No data/role-requirements.tsv found. Run critic-mode evaluations first.');
    process.exit(1);
  }
  const clusters = rollupRequirements(readFileSync(REQ_FILE, 'utf-8'));
  if (argv.includes('--summary')) {
    console.log('=== recurring gaps, clustered (data/role-requirements.tsv) ===');
    console.log('total  gap  part  roles  bucket      requirement (representative wording)');
    for (const c of clusters.slice(0, 20)) {
      console.log(
        String(c.total).padStart(5) + String(c.gap).padStart(5) + String(c.partial).padStart(6) +
        String(c.roles).padStart(7) + '  ' + String(c.bucket || '-').padEnd(11) + ' ' +
        c.label + (c.variants > 1 ? `  [${c.variants} wordings]` : ''));
  }
  } else {
    console.log(JSON.stringify({ schema_version: 1, clusters }, null, 2));
  }
  process.exit(0);
}

export function selfTest() {
  const failures = [];
  const fail = m => failures.push(m);

  const targets = parseTargetArchetypes([
    'target_roles:', '  archetypes:',
    '    - name: "AI Solutions Architect"', '      level: "Staff"', '      fit: "primary"',
    '    - name: "AI Platform / LLMOps Engineer"', '      fit: "secondary"',
  ].join('\n'));
  if (targets.length !== 2) fail(`parseTargetArchetypes expected 2, got ${targets.length}`);
  if (targets[0] && targets[0].fit !== 'primary') fail('parseTargetArchetypes lost fit level');

  if (archetypeRelevance('AI Solutions Architect', targets) !== 1.0) fail('primary should weigh 1.0');
  if (archetypeRelevance('AI Platform / LLMOps Engineer', targets) !== 0.6) fail('secondary should weigh 0.6');
  if (archetypeRelevance('Frontend Engineer', targets) !== 0.15) fail('off-target should weigh 0.15');
  if (archetypeRelevance(null, targets) !== 0.15) fail('missing archetype should weigh 0.15');
  if (archetypeRelevance('AI Solutions Architect', []) !== 0.15) fail('no targets should weigh 0.15');

  if (normalizeRequirement('Executive engagement at CTO / VP level') !==
      normalizeRequirement('executive engagement at cto   vp level')) {
    fail('normalizeRequirement should collapse punctuation/whitespace variants');
  }
  if (normalizeRequirement('Enterprise pre-sales / customer facing at scale') !==
      normalizeRequirement('enterprise presales customerfacing')) {
    fail('normalizeRequirement should collapse pre-sales/customer-facing synonyms');
  }
  if (normalizeRequirement('   ') !== '') fail('normalizeRequirement should return empty for blanks');

  const roll = rollupRequirements([
    '10\tAcme\tSA\tSOFT\tEnterprise pre-sales / customer facing\tGAP\tBuilding\t-',
    '11\tBeta\tSA\tSOFT\tenterprise presales customerfacing\tGAP\tBuilding\t-',
    '12\tGam\tSA\tTECHNICAL\tKubernetes\tHAVE\tReady\t-',
    '13\tDel\tSA\tSOFT\tExecutive engagement\tPARTIAL\tBuilding\t-',
  ].join('\n'));
  const presales = roll.find(c => c.total === 2);
  if (!presales) fail('rollupRequirements should cluster the two pre-sales wordings');
  if (presales && (presales.roles !== 2 || presales.variants !== 2)) fail('cluster counts wrong');
  if (roll.some(c => c.key.includes('kubernetes'))) fail('rollupRequirements must skip HAVE rows');
  if (!roll.some(c => c.partial === 1)) fail('rollupRequirements should keep PARTIAL rows');

  if (failures.length > 0) {
    console.error(`upskill-ext self-test failed: ${failures.join('; ')}`);
    process.exit(1);
  }
  console.log(`upskill-ext self-test OK (${11} assertions: archetype relevance, requirement clustering)`);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) selfTest();
  else if (process.argv.includes('--requirements')) runRequirementsCli(process.argv.slice(2));
  else console.log('usage: node upskill-ext.mjs --requirements [--summary] | --self-test');
}
