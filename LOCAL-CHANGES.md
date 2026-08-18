# Local changes — divergence from `santifer/career-ops`

This fork adds an evidence layer to the evaluation pipeline. It rebases onto upstream
indefinitely, so every change here is shaped to survive that. **Rule: anything that can
live in a new file, does.** New files never conflict; edits to an upstream file conflict
on every touch of the same region.

Run `node system-check.mjs` to assert all of this still holds.

## Inventory

| File | Kind | Rebase risk | What it is |
|---|---|---|---|
| `apply-log.mjs` | **new** | none | The application denominator, plus `--validate` (does any feature predict?) and `--calibration` (did predictions hold?). |
| `verify-evaluation.mjs` | **new** | none | Structural validator: breakdown arithmetic, lift cap, score agreement, Case Against, falsifier. |
| `upskill-ext.mjs` | **new** | none | Archetype relevance weighting and requirement clustering, lifted out of `upskill.mjs` specifically to shrink the conflict surface. |
| `system-check.mjs` | **new** | none | Self-evaluation and before/after-update diffing. |
| `tests/regression/` | **new** | none | Eight fixtures, each a real failure this system made. |
| `upskill.mjs` | **modified** | **the only real one** | `+42 -5` against merge-base — integration seams only (thread `archetype` through, accept a relevance function, delegate `--requirements`). Was `+195` before the extraction. |
| `modes/_custom.md` | symlink | **none** | Scoring Rules, The Case Against, Falsification, Enforcement. Lives in the data layer, outside the repo — an update cannot reach it. |
| `data/application-log.tsv` | symlink | none | User layer. |

## Why the rules are not in `modes/oferta.md`

`modes/oferta.md` and `batch/batch-prompt.md` are in-repo system-layer files that upstream
rewrites. Rules placed there are lost on the next update. `modes/_custom.md` is a symlink
into the data layer and is the documented home for procedural house rules — see the Data
Contract in `AGENTS.md`. Everything behavioural therefore lives there, and the enforcement
lives in new `.mjs` files.

The cost of this choice: an upstream change to the report format could leave the rules
describing a shape that no longer exists. `system-check.mjs` catches that — the regression
corpus is written against real report files, so a format change breaks `r3` immediately.

## Updating from upstream

```bash
node system-check.mjs --snapshot /tmp/before.json   # 1. record the current state
git fetch upstream && git rebase upstream/main      # 2. update
node system-check.mjs --diff /tmp/before.json       # 3. what moved?
```

Step 3 reports checks that broke, checks that disappeared, and metric drift separately.
A broken or removed check fails the run; metric drift never does — the funnel moving is
information, not a regression.

Expect conflicts only in `upskill.mjs`, and only in these places:
`parseReportGaps` return value · `aggregateGaps` signature · the `analyze()` call site ·
the `--requirements` CLI delegation · the self-test block. Take upstream's version of the
surrounding code and reapply those five seams.

## What is deliberately not enforced

- **Logging every application.** `apply-log.mjs add` is one cheap command and nothing
  compels it. The previous tracker decayed to 16% coverage precisely because recording an
  application was optional. This is the known weak point.
- **Whether a Case Against is any *good*.** The validator checks it exists, is substantial,
  and addresses scale. It cannot check whether the argument is honest.
- **Whether the archetype weighting is *correct*.** Only calibration data settles that, and
  there is not enough yet — `--validate` currently returns INSUFFICIENT DATA by design.
