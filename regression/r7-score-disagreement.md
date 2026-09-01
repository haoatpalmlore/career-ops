# Evaluation: Acme — Engineer

**Date:** 2026-08-18
**Score:** 4.1/5

## Machine Summary

```yaml
company: "Acme"
score: 3.3
falsifier:
  predicts: "recruiter reply within 21 days"
  wrong_if: "silent past 21 days"
  binding_constraint: "AWS stack delta at the keyword screen"
  most_informative_unknown: "whether the band is base or package"
```

## Case Against

The eval harness was built at solo-founder scale on a one-person product, while the role
defines evaluation across enterprise multi-tenant customer fleets. A screener could
reasonably prefer someone who has run evals at that scale on the named stack. Strongest
objection: the artefact is real and the scale is not comparable, and nothing in scope
closes that gap.

## Score Breakdown

| Dimension | Score | Reasoning |
|---|---|---|
| Match with CV | 3.5/5 (capped) | Capped by the Case Against scale gap. |
| North Star alignment | 4.0/5 | On-archetype at a rung below target. |
| Comp | 2.5/5 | Ceiling at the target floor. |
| Cultural signals | 3.5/5 | Remote strong, rest unreadable. |
| Red flags | -0.3 | Undisclosed employer, stack delta. |
| **Global** | **3.3/5** | Baseline 3.075, lift +0.225. |
