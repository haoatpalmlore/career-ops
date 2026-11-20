# Evaluation: ? (via WOW Recruitment) — Senior AI Engineer | Production AI & Agentic Systems

**Date:** 2026-08-18
**URL:** (LinkedIn posting pasted as text — no URL captured)
**Via:** WOW Recruitment (Bradley Arvanitis, Associate Director, Tech & Data)
**Archetype:** AI Platform / LLMOps (primary) × Agentic / Automation (secondary)
**Score:** 3.3/5
**Legitimacy:** High Confidence
**Work Auth:** ➖ Not needed
**PDF:** existing role-shape master — `output/cv-hao-li-senior-ai-engineer-master.pdf` (no per-role tailoring until the end employer is named)

---

## Machine Summary

```yaml
company: "?"
role: "Senior AI Engineer"
score: 3.3
legitimacy_tier: "High Confidence"
archetype: "AI Platform / LLMOps × Agentic / Automation"
final_decision: "Consider"
hard_stops: []
soft_gaps:
  - "AWS + Bedrock: cv.md states AWS familiarity only; GCP is the primary cloud. No Bedrock evidence."
  - "LangChain/LangGraph: no evidence in cv.md — orchestration experience is Gemini ADK and direct internal tool retrieval"
  - "TypeScript/Node.js listed as working proficiency, not depth"
  - "AI-title tenure ~9 months against a market sweet spot of 1-2 years"
  - "Advertised ceiling AUD 200K equals the floor of the AUD 200-260K target; base-vs-package not stated"
  - "Senior title is one rung below the Staff/Principal/Architect primary target"
top_strengths:
  - "AI evaluation and observability is the JD's headline ask and Hao's documented core: three-tier eval harness (unit/mocked >80% core-journey coverage, live staging, LLM-judge) plus TurnTracker OTel instrumentation on the agent loop"
  - "Production agentic systems shipped and running — OrbitBrain live on the App Store with an established CI/CD pipeline"
  - "Cost control as a built artefact — GCP cost kill switch (Cloud Scheduler polling + automated shutoff)"
  - "Postgres + vector search in production via Supabase HNSW retrieval"
risk_level: "Medium"
confidence: "Medium"
next_action: "Easy Apply now (it routes to the agency inbox, not an ATS, and the posting was 11 minutes old at 1 applicant), then message Bradley Arvanitis so the CV has a face. Ask only the comp-structure question and push for a call. The client name is earned at consent-to-submit, never asked for in message 1"
work_auth: "not_needed"
discard_reasons:
  - "salary_too_low"
  - "seniority_mismatch"
  - "tech_stack_mismatch"
via: "WOW Recruitment"
company_confidential: true
advertised_comp: "180K AUD/yr - 200K AUD/yr"
falsifier:
  predicts: "silence or a template rejection within 21 days of applying, with no human conversation"
  wrong_if: "Bradley replies naming the client and offers a call within 21 days"
  binding_constraint: "the AWS/Bedrock/LangGraph stack delta at the agency keyword screen"
  most_informative_unknown: "whether 180-200K is base or package including super"
risk_summary:
  legitimacy: "high_confidence"
  classification: "clear"
  culture: "not_evaluated"
  interview_redflags: "not_evaluated"
  ai_infra: "consistent"
```

---

## A) Role Summary

| Field | Value |
|---|---|
| Archetype detected | **AI Platform / LLMOps** (primary) × **Agentic / Automation** (secondary) |
| Domain | Enterprise AI governance/observability platform — "visibility and control over their rapidly growing AI ecosystems" |
| Function | Build (production agents + workflows) with a stated architecture/direction-setting component |
| Seniority | Senior IC, with "define technical direction" and "influence technical architecture and product direction" scope |
| Remote | Remote-first across Australia — full remote, no attendance requirement stated |
| Team size | Not stated. "Work directly with Product and Technology leadership" implies a flat, small org |
| Hiring entity | **WOW Recruitment** (agency). End employer undisclosed — described only as "an innovative AI company" with "established enterprise customers and strong growth momentum" |
| Culture screen | **— not evaluated.** `config/profile.yml` has no `culture_screen` block, and the end employer is undisclosed, so no company-specific evidence can be gathered. Remote-first AU is the one observable positive |
| TL;DR | The single best archetype-to-evidence match in the pipeline for Hao's eval/observability work, offered one title rung low, at a band whose ceiling is his target's floor, by an agency that will not name the employer. |

### Geo-mismatch check

Structured location field: `Australia · Remote`. JD body: "Remote-first across Australia." No contradiction — **no flag**.

### Work-authorization check

➖ **Not needed.** Role is in Australia; `config/profile.yml` → `location.visa_status` records "Australian citizen / PR — no sponsorship needed in AU." The JD says nothing about sponsorship, which is correct and expected for an AU-domestic remote role. Score-neutral, no flag line.

---

## Case Against

Written before Block B is scored, per `modes/_custom.md`. Argues from the same evidence that
Hao is **not** a fit.

**1. Scale check — this is the one Block B missed.** The JD asks for someone to *"define AI
evaluation, testing, and observability frameworks"* for a platform whose customers are
enterprises with *"rapidly growing AI ecosystems"* — evaluation across many teams' models, in
many tenants, with governance and audit obligations attached. Hao's three-tier eval harness is
real, designed rather than inherited, and running in production. It runs over **one product,
built by one person, with one user journey**. Those share a vocabulary and almost nothing else:
multi-tenant eval has problems (fleet-wide regression detection, per-customer thresholds,
attribution across teams, cost allocation) that a solo harness never encounters. Block B scored
the phrase overlap at 4.4 and never asked this question.

**2. Context check.** The eval harness exists because Hao is the sole engineer and needed a
substitute for code review. That is a genuine constraint-driven design, but it is founder
autonomy, not delivery inside a team with customers who can escalate. "Work directly with
Product and Technology leadership" assumes an org; Hao has been the org.

**3. Substitution check.** A screener could reasonably prefer someone who has run evals on a
multi-tenant AI platform for two years on AWS with Bedrock and LangGraph. That person has: the
scale, the exact vendor stack, and AI tenure measured in years rather than months. Against that
CV, Hao's differentiator is depth of reasoning about eval design, which is not legible from a
CV in the six seconds it gets.

**4. Strongest honest objection.** *"You've built a very good test harness for your own app.
We need someone who has done this for other people's AI, at scale, on our stack."* Nothing in
`cv.md` or `article-digest.md` answers that. The truthful response is that the disciplines
transfer and the scale does not, and that is a real gap rather than a framing problem.

**Scoring consequence:** the scale and context gaps were not accounted for in Block B, so per
`modes/_custom.md` **Match with CV is capped at 3.5** until answered with evidence.

---

## B) Match with CV

### Stated requirements

| JD requirement | CV evidence (exact) | Status |
|---|---|---|
| 5+ years in software engineering | 2012–present across Acclimation, Oakton, AIA Australia, The Players' Tribune, SWEAT, Officeworks, Palmlore | **HAVE** (well over) |
| Experience delivering AI solutions into production | "OrbitBrain is Palmlore's flagship product — a voice-first AI thinking partner... Live on the App Store since 15 February 2026; established CI/CD pipeline with a regular backend deployment cadence" | **HAVE** |
| Experience with agentic AI | "Full-stack agentic system. Python backend (FastAPI, GCP Cloud Functions), iOS frontend, streaming Gemini Live responses"; "File-based inter-agent communication system across repositories"; "Night Shift autonomous workflow" | **HAVE** |
| RAG | "Supabase (HNSW vector retrieval)"; "Public token-cost benchmark for support-agent RAG architectures in development: github.com/halolee/support-agent-token-benchmark" | **HAVE** (benchmark repo is in development, not finished — state it that way) |
| Tool calling | "tool-schema work done with Gemini ADK"; "Deliberate architectural call to use direct internal tool retrieval over MCP for token cost management" | **HAVE** |
| LLM-based systems | Gemini Live streaming responses, Gemini ADK orchestration, LLM-judge eval tier | **HAVE** |
| **Strong background in AI evaluation, monitoring, and performance optimisation** | "Three-tier eval: unit/mocked (over 80% coverage on core user journey), live staging, LLM-judge. Operating mode: evaluate → adjust → iterate"; "TurnTracker OTel instrumentation on the agent loop drives the iterate-on-reliability cycle" | **HAVE — this is the strongest single mapping in the report** |
| Define AI evaluation, testing, and observability frameworks | Same as above, plus the framework was designed, not inherited — three tiers chosen deliberately for a solo-founder cost/coverage trade-off | **HAVE** |
| Comfortable in fast-moving, high-ownership environments | Founder/Principal Engineer, sole engineer on a shipped production stack | **HAVE** |
| Influence technical architecture and product direction | "Voice pipeline architectural decision" (three options weighed, chose collapsed pipeline); "Cloud platform decision" (GCP end-to-end after weighing AWS/Azure); Officeworks cross-team architecture across auth, cart, browse, B2B, pricing, availability, data, marketing | **HAVE** |
| Work directly with Product and Technology leadership | Officeworks: "setting technical direction alongside each specialist team" across the multi-team Digital organisation | **HAVE** |
| Solve complex customer problems at enterprise scale | Officeworks (national retailer, retail scale); AIA Australia (regulated enterprise); Oakton consulting at GE Capital and Coles | **HAVE** (as an internal-enterprise engineer, not as a vendor-side customer-facing engineer) |

### Tech stack — item by item

| Stack item | Status | Evidence / delta |
|---|---|---|
| Python | **HAVE** | "Python, FastAPI, GCP Cloud Functions" — primary backend language |
| PostgreSQL | **HAVE** | "Supabase (Postgres + vector)" |
| Vector Search | **HAVE** | "Supabase (HNSW vector retrieval)" |
| TypeScript / Node.js | **PARTIAL** | cv.md lists "JavaScript / TypeScript (working)" — working proficiency, not depth |
| AWS | **GAP** | cv.md: "GCP (primary...), AWS and Azure familiarity." The GCP commitment was a documented architectural decision made *after* weighing AWS market share — so the reasoning is there, the operating hours are not |
| Bedrock | **GAP** | No evidence anywhere in cv.md or article-digest. Model-serving experience is Gemini Live / Gemini ADK |
| LangChain / LangGraph | **GAP** | No evidence in cv.md. Orchestration was built on Gemini ADK plus direct internal tool retrieval — a deliberate call against a framework layer, for token cost |
| Modern LLM ecosystems | **HAVE** | Claude Code (daily), Gemini Live/ADK, Hermes (in progress), MCP consumer-side |

**The stack delta in one line:** Hao's production AI work is GCP/Gemini/ADK-shaped; this role is AWS/Bedrock/LangGraph-shaped. Every *concept* transfers (agents, RAG, tool calling, evals, vector retrieval, observability, cost control) and no *vendor* does.

### Gaps and mitigation

**1. AWS + Bedrock — the primary gap.**
- Hard blocker? No, but it is the most likely screen-out at an agency filter, because it is a keyword check rather than a judgement call.
- Adjacent experience: yes — the GCP commitment is documented in cv.md as a *decision* taken after weighing AWS market share and Azure enterprise compatibility. That is evidence of cloud-platform judgement, not evidence of AWS operating hours. Do not blur the two.
- Portfolio coverage: none currently.
- Mitigation: state the exact overlap and nothing beyond it. The honest and sufficient framing is that the production disciplines being hired for — eval harness design, agent-loop observability, cost guardrails, vector retrieval — were built on a different managed-model platform. Do not claim Bedrock. See `feedback_ai_enabled_engineer_language_ramp` for the ramp framing; it covers language and platform, not an explicit *current*-fluency demand, and this JD does not demand current AWS fluency in its "what we're looking for" list — AWS appears only under Tech Stack.

**2. LangChain / LangGraph.**
- Hard blocker? No. This is the softest of the three gaps.
- Adjacent experience: the orchestration work exists; the framework does not. cv.md records a deliberate architectural call to use direct internal tool retrieval over MCP for token cost management — which is a *stronger* signal for a role that lists "performance optimisation" than framework familiarity would be.
- Mitigation: lead with the cost/latency reasoning behind the orchestration choice. An employer hiring for evaluation and cost discipline should read "I chose direct tool retrieval over a framework layer, for measured token cost" as the answer to their question, not as a gap.

**3. AI-title tenure (~9 months).**
- The recurring structural constraint — see `project_tomorrow_ai_yoe_filter`. Against "5+ years in software engineering" this JD does *not* demand AI-specific years, which is favourable; the requirement line is engineering years, and Hao has 14.
- Mitigation: the eval/observability depth is the offset. Per `reference_au_ai_market_signals_lindie_graham`, eval expertise is under-appreciated and under-supplied in the AU market, and visible work is weighted heavily. This is the role where that offset is most likely to land.

**4. Undisclosed end employer.**
- Not a candidate gap — an information gap that blocks work. Without the employer, company research, culture screening, product-specific tailoring, and Glassdoor/comp verification are all impossible, and the CV cannot be tailored beyond role-shape.
- Mitigation: ask Bradley. This is a normal, expected question to an agency recruiter and costs nothing.

---

## C) Level and Strategy

**Level in the JD:** Senior IC. **Hao's natural level for this archetype:** Staff / Principal / Architect (`config/profile.yml` → `target_roles.primary`; `modes/_profile.md` archetype table places AI Platform / LLMOps at Staff/Senior).

This is a **one-rung down-level on title, with scope that partly compensates**: "define technical direction rather than just implementing requirements", "influence both technical architecture and product direction", "greenfield opportunity with significant technical ownership", direct access to Product and Technology leadership. The work described is Staff-shaped; the label is Senior.

Per `modes/_profile.md` → Career Direction, title compounds and base does not, and title is worth more than roughly $20K of base for the next hop. That makes the title the lever here, not the money — the same play recorded on Deloitte #184.

**Selling senior without lying:**
- Lead with the framework, not the tool: "I designed a three-tier eval harness — unit/mocked, live staging, LLM-judge — and instrumented the agent loop with OpenTelemetry." That is the JD's second bullet, answered with a built artefact.
- Cost as a first-class concern: the GCP kill switch is a shipped cost guardrail, and the MCP-vs-direct-retrieval call was made on token cost. This role names "cost" as one of the four enterprise AI challenges it exists to solve.
- Architecture decisions with the reasoning intact: the voice pipeline (three options weighed, chose collapsed pipeline, shipped with a known latency constraint and telemetry to iterate) demonstrates the decision-making the "define technical direction" line is buying.
- Enterprise scale from the Officeworks side: cross-team architecture across auth, cart, browse, B2B, pricing, availability, data and marketing, under CAB/CR change management. "Enterprise scale" in this JD means the customers are enterprises — Hao's evidence is having *been* the enterprise engineer, which is adjacent but real.

**If they down-level or the band holds at 180-200K:**
- The band's ceiling (200K) is the floor of the AUD 200-260K target, and 180K *is* the walk-away. Whether this clears the floor at all depends entirely on base-vs-package, which the posting does not state.
- Do not floor-anchor (`feedback_salary_anchor_high`). Anchor at or above the advertised ceiling: 200K base plus super, i.e. ~224K package.
- If the band is immovable, the trade to seek is the title — "Senior AI Engineer" → "Lead" or "Staff", or a written 6-month review with defined promotion criteria. A Senior title at 200K starts a clock Hao is already running; a Lead/Staff title at the same money starts a better one.

---

## D) Comp and Demand

**Company type:** **Recruiter / staffing listing** — the posting entity is WOW Recruitment, an Australian agency that [launched a Tech & Data division](https://www.wowrecruitment.com.au/wow-recruitment-launches-tech-division) covering AI, data, cloud, security and transformation. The end employer is undisclosed and could not be identified from public sources within this evaluation's research budget (4 of 5 queries used; two attempts to identify the employer from its own description both failed).

**Compensation reliability:** **Low to medium.** Per the taxonomy, an advertised range on a third-party posting may reflect the client's budget rather than the terms of an actual offer. The end employer's own type is `Unknown`, which defaults its reliability to `Low` until evidence improves it.

**Component split:**

| Component | Reading |
|---|---|
| Advertised range | **180K AUD/yr - 200K AUD/yr** (verbatim, LinkedIn structured field) |
| Likely guaranteed base | Unresolvable. Australian job ads commonly quote base excluding the 12% superannuation guarantee, but agency listings vary and this one does not say. If the figure is a *package*, base is roughly 161-179K |
| Variable / conditional cash | None stated. No bonus, commission, or sign-on mentioned |
| Expected stable cash | 180-200K if base; ~161-179K if the range is package-inclusive |
| Non-cash benefits | None stated. No equity mentioned — notable for a company described as a growth-stage AI startup |

| Source | Figure | Notes |
|---|---|---|
| Advertised (JD) | 180K AUD/yr - 200K AUD/yr | JD (LinkedIn structured salary field) |
| [aitalentondemand.com.au](https://www.aitalentondemand.com.au/article/ai-engineer-salary-australia-2026) | AUD 165-200K base for senior AI engineers with 6+ years | National, base — add 12% super for package |
| [bigwavedigital.com.au](https://bigwavedigital.com.au/ai-engineer-salary-guide-australia-2026/) | AUD 230K+ for leads, principals, and scarce generative-AI specialists, often with sign-on and equity | Sydney premium; Sydney-Melbourne gap now within 3-5% |
| [lightningventures.com.au](https://www.lightningventures.com.au/talent/guides/ai-engineer-salary-guide-australia/) | LLM/RAG/fine-tuning work commands a premium over classical ML | Engineers who deploy, monitor and scale — not just build — are paid more |

**Read:** the band sits squarely in the *Senior* market, not the *specialist* market. The 2026 AU guides put exactly the profile this JD asks for — someone who can deploy, monitor, evaluate and scale LLM systems — at the top of that band or above it, with leads and scarce generative-AI specialists at 230K+. The role's own requirements (define the eval and observability frameworks, influence architecture, work with leadership) describe the 230K tier; the band is priced for the 180K tier. That gap is the single most negotiable thing in this posting.

**Demand:** strong and under-supplied. `reference_au_ai_market_signals_lindie_graham` records that production AI engineers are rare in AU and eval expertise is under-appreciated — this posting asks for both explicitly.

**HR verification questions — sequenced by what the recruiter can answer without giving up leverage.**

An agency's client name is its commercial asset: naming it early lets the candidate go direct and lets rival agencies find the mandate. Asking for it in a first message reads as exactly that risk. It is also unnecessary, because the reveal has a natural forcing point (see below). Sequence accordingly:

*Ask in message 1 (costs him nothing, and he needs the answer too):*
1. Is 180-200K the **base salary**, or the total package including the 12% superannuation guarantee?

*Ask on the call (scope and process, still no confidentiality cost):*
2. What stage is the business at, and how big is the engineering team today?
3. Is the evaluation/observability framework greenfield, or is there something already running to inherit?
4. Is the Senior title fixed, or is there a Lead/Staff band above it that this scope could map to?
5. Is there equity, and if so what is the grant range and vesting schedule at this level?
6. Do you have a live brief with them, or are you building a shortlist first? Has anyone interviewed yet? *(Un-deflectable process question. A recruiter holding a real mandate answers instantly and specifically. Vagueness here is the tell for a market-map or talent-pool ad — and it costs him no confidentiality to answer, so vagueness is signal rather than discretion.)*

*Arrives on its own — do not ask for it:*
7. The end employer's identity. A recruiter needs the candidate's permission before submitting their details to a named client, so the name surfaces at consent-to-submit. The candidate's move is not to ask, it is to withhold blanket consent: "happy for you to put me forward, just tell me who it is first."

**Precedent in this tracker.** #165 (Taylor Tech, Charmaine Thum, 1st-degree, exclusive search) recorded "which company" as one of three diagnostic questions **deliberately held for the call**. #132/#135 (Logical Resources) is the one confirmed reveal: Liam Young named NTT on 2026-07-28, through a warm referral chain and around the point a CV was sent — and the *same agency on the same day* never confirmed the client behind #132. #183 (iterate) recommended asking directly, but Michael Boyd is 1st-degree. Bradley is 2nd-degree and cold, the weakest of the four positions, so the #165 pattern governs.

---

## E) Customization Plan

**No tailored CV generated for this evaluation, deliberately.** Tailoring against an undisclosed employer means guessing at the product, and the only keyword signal available (AWS/Bedrock/LangGraph) is precisely where the CV cannot honestly move. The existing role-shape master is the correct drop-in:

`output/cv-hao-li-senior-ai-engineer-master.pdf` — built 2026-08-11 for exactly this role shape.

> ⚠️ Note: `modes/_custom.md` records the master's payload at `career-ops-data/cv-masters/senior-ai-engineer.json`, but that path does not resolve in the working tree right now — only the rendered PDF is present. Worth checking the data-layer symlinks (`node verify-data-symlinks.mjs`) before the next master regeneration.

**Top 5 CV changes — hold until the employer is named:**

| # | Section | Current status | Proposed change | Why |
|---|---|---|---|---|
| 1 | Professional Summary | Leads with founder + 13 years + retail/regulated/consumer breadth | Move "evaluation and observability" into the first sentence | The JD's differentiating ask is the eval framework, and the summary is often the only part read |
| 2 | Core Capabilities | "Agent Observability & Evals" sits second in the table | Promote to first row | Matches the JD's own ordering of what it wants |
| 3 | Core Capabilities → RAG | RAG appears only via the in-development benchmark repo and HNSW retrieval | Surface "Supabase HNSW vector retrieval" as its own line | "RAG" and "Vector Search" are both named in the JD; the evidence exists but is buried in a Skills line |
| 4 | Technical Skills → Cloud | "GCP (primary), AWS and Azure familiarity" | Leave exactly as written | The honest statement is the right one. Do not inflate AWS to match the stack list |
| 5 | Palmlore bullets | Cost kill switch is the second bullet | Keep, and keep the reasoning | "Cost" is one of four enterprise AI challenges the JD names; a shipped kill switch answers it with an artefact |

**Top 5 LinkedIn changes:** none. The 2026-08-11 overhaul already made the profile AI-dominant above the fold, and the "Founder · AI Engineer · Storyteller" headline reads correctly against this exact role title. No change warranted for one agency-mediated posting.

---

## F) Interview Plan

| # | JD requirement | STAR+R story | S | T | A | R | Reflection |
|---|---|---|---|---|---|---|---|
| 1 | Define AI evaluation, testing, observability frameworks | **Three-tier eval harness** | Solo founder shipping an agentic backend substantially built through agent workflows; no second engineer to review | Verify agent-generated code before shipping, without a team | Built three tiers — unit/mocked, live staging, LLM-judge — each catching a different failure class | Over 80% coverage on the core user journey; operating mode became evaluate → adjust → iterate | The tiers exist because each catches what the others miss; a single LLM-judge tier would have been cheaper to build and would have missed deterministic regressions |
| 2 | AI monitoring and observability | **TurnTracker OTel instrumentation** | Agent loop behaviour was not visible in production | Make the reliability cycle measurable | Instrumented the agent loop with OpenTelemetry | Telemetry now drives the iterate-on-reliability cycle rather than intuition | Instrumenting the loop before optimising it meant the latency constraint could be shipped knowingly rather than discovered later |
| 3 | Performance optimisation / cost | **GCP cost kill switch** | Agentic experimentation carries runaway-cost risk | Enable aggressive experimentation without exposure | Separate admin project with Cloud Scheduler polling and automated shutoff triggers | Experimentation could proceed without a cost ceiling being a blocker | Building the guardrail first changed what was affordable to try — the constraint was removed rather than managed |
| 4 | Performance optimisation / architecture judgement | **MCP vs direct tool retrieval** | Token cost dominates a solo-founder agentic budget | Choose an orchestration approach | Chose direct internal tool retrieval over MCP, on token cost | Deliberate architectural call, documented as such | The framework layer was the default choice and the wrong one for this cost profile; defaults deserve a measurement |
| 5 | Build and deploy production-grade AI agents | **Voice pipeline decision** | Three viable options — open-source stitch, ElevenLabs/partners, collapsed Gemini Flash native voice + ADK | Ship a voice-first product on schedule | Weighed all three, chose the collapsed pipeline | Shipped on schedule with a known latency constraint and telemetry in place | Shipping with a known constraint and the instrumentation to fix it beat blocking on optimisation |
| 6 | Agentic AI / orchestration | **Night Shift autonomous workflow** | Solo founder; work stops when sleep starts | Extend the working day | Claude Code executes planned tasks overnight against the backend repo, results surfaced for morning review | Second orchestration surface; review happens with full context | Started as a prototype and was productionised only once it earned its keep — the same gate should apply to any agent in production |
| 7 | Agent safety / enterprise governance | **Permission allowlist and the shared-worktree post-mortem** | Destructive operations reachable by agents | Gate them | Allowlist in place since the start of the setup; a tripped gate on a `git reset --hard` proposal triggered a post-mortem | Traced to two agents sharing one working tree; fixed with an upstream branch check and worktree isolation | The gate caught the symptom; the post-mortem found the cause. Governance that only blocks is worth less than governance that explains |
| 8 | Solve complex customer problems at enterprise scale | **Officeworks price-monitoring notification system** | National retailer, multi-team Digital org | Deliver real-time price-monitoring notifications | Architected end-to-end across client apps, pricing and availability services, and a push pipeline with throttling and batch processing | Shipped; scope grew over three years from loyalty integration to the full end-to-end system | The architecture that survived was the inherited one extended, not a rebuild — recognising sound inherited design is a skill in itself |
| 9 | Enterprise governance and risk | **Bitrise CI/CD under CAB/CR** | Enterprise change management vs mobile delivery cadence | Remove delivery friction without breaking release discipline | Stood up Bitrise with SSO, aligned with CAB/CR and on-duty rotation | Friction removed team-wide, enterprise discipline preserved | Building with the regulatory shape rather than against it is faster than fighting it — the same argument this company is presumably making to its enterprise buyers |
| 10 | Working with Product and Technology leadership | **Officeworks cross-team architecture** | Scope spanning auth, cart, browse, B2B, pricing, availability, data, marketing | Set technical direction without owning those teams | Trusted documentation plus direct collaboration with each team's lead | Standards established for architecture, auth patterns, on-duty and release practice; handover doc became the continuity reference | Documentation that people actually reach for is the durable form of influence |

**Recommended case study:** the **three-tier eval harness plus TurnTracker OTel instrumentation**, presented as one system. It is the JD's second responsibility bullet and its fourth requirement bullet, answered by something built and running. Present the tier boundaries as cost/coverage trade-offs — this company sells cost and governance visibility, so the reasoning is the point, not the tooling.

**Red-flag questions to expect:**

- *"How much of your AI work is under an employer versus your own product?"* — Answer plainly: OrbitBrain since November 2025, live on the App Store since February 2026. Do not pad it. The 13 years of engineering underneath is what the "5+ years in software engineering" line is asking for, and it is met several times over.
- *"You're GCP and Gemini — we're AWS and Bedrock."* — State the overlap item by item and stop. The disciplines transfer; the vendor does not. Do not claim Bedrock.
- *"No LangChain or LangGraph?"* — The orchestration exists; the framework does not. The direct-tool-retrieval decision was made on measured token cost, which is the more useful answer for a role that lists performance optimisation.
- *"Why leave founder work?"* — Per `modes/_profile.md`: OrbitBrain stays; looking for a role where the same production discipline applies at larger scale, with a team.
- *"Do you have reports?"* — No, and this is an IC role. Officeworks tech lead for three years, coached a backend engineer to senior caliber, set direction across specialist teams without owning them.

---

## G) Posting Legitimacy

**Assessment: High Confidence**

| Signal | Finding | Weight |
|---|---|---|
| Posting freshness | "11 minutes ago", 1 applicant | **Positive** — as fresh as a posting gets |
| Apply path | Easy Apply active; named job poster with a public LinkedIn profile and published direct contact | **Positive** |
| Named human | Bradley Arvanitis, Associate Director, WOW Recruitment — 2nd-degree connection, verifiable public profile, verifiable employer | **Positive** |
| Response commitment | "Company review time is typically 1 week" | **Positive** |
| Tech specificity | Eight named stack items (Python, TypeScript/Node.js, AWS, PostgreSQL, Vector Search, Bedrock, LangChain/LangGraph, modern LLM ecosystems) | **Positive** |
| Requirements realism | "5+ years software engineering" plus AI production experience — internally consistent, no contradictions, no impossible tenure demands against young technology | **Positive** |
| Salary transparency | Band published on the posting | **Positive** |
| Scope clarity | Five specific responsibilities, five specific requirements, four specific "why join" points | **Positive** |
| End employer named | No — "an innovative AI company" | **Concerning** (see note below) |
| Reposting pattern | No WOW Recruitment entries in `data/scan-history.tsv`; no matching cluster from `company-history.mjs` (`postingChurn: none-detected`) | **Neutral** — no history either way |
| Layoffs / hiring freeze | Cannot be checked — the employer is undisclosed | **Neutral** (unknown, not negative) |
| Role-company fit | An AI governance/observability platform hiring someone to build agents and define eval frameworks is internally coherent | **Positive** |

**Context note added on review — the mandate may be softer than the posting implies.** WOW Recruitment [launched its Tech & Data division recently](https://www.wowrecruitment.com.au/wow-recruitment-launches-tech-division), and Bradley's own headline describes building the desk. A new division has two reasons to run a well-specified ad with a published band: a real exclusive mandate, or building a candidate database in a lane it has just entered. Nothing here distinguishes the two from outside, and the "Promoted by hirer" plus Easy Apply combination fits either. This does not move the tier (named human with published contact details, specific eight-item stack, published band, 11 minutes old), but it does mean the candidate should test for a live brief on the call rather than assume one. The diagnostic is question 6 in Block D: whether a brief exists and whether anyone has interviewed. It costs the recruiter no confidentiality, so a vague answer is signal rather than discretion.

**Context notes on the one concerning signal:** an undisclosed end employer is standard agency practice, not a ghost-job indicator. Agencies withhold client names to protect the exclusivity of their mandate and because clients often do not want a search public. It does mean the candidate carries the research burden until the recruiter reveals it, which is the practical cost here — not a legitimacy problem.

**6. Employment classification:** ✅ No contractor-status language. The posting says "Full-time", names no invoicing, consulting, or services-agreement arrangement, and lacks the corroborating omissions the check requires. Not flagged.

**7. AI-buzzword vs. infrastructure mismatch:** ✅ Not flagged. Only one of the three signal classes is arguably present (no team size given). The role scope matches the seniority, the stack is concrete and coherent for the stated product, and the industry is AI-native software rather than a legacy-heavy vertical. The check requires 2+ classes.

**8. Benefits terminology country mismatch:** ✅ Not flagged. The posting names no benefits at all, so there is nothing to mismatch.

**9. Platform vs employer location tag:** — Not evaluated. Only the LinkedIn side is available; there is no employer job page to compare, and no shared requisition ID.

**10. Agency licensing:** — Not evaluated. This posting **is** agency-mediated (condition 1 met), but `templates/agency-licensing.yml` has no row for Australia — only `CA-ON`. Per the rule, no row means "no verified regime data", not "no regime", so the signal is skipped silently rather than guessed at.

**11. Immigration-status requirement overreach:** — Not evaluated. `templates/immigration-status-requirements.yml` has no entry for Australia; the posting also makes no status demand.

**12. Jurisdiction-prohibited content:** — Not evaluated. No Australian entry in `templates/jurisdiction-prohibited-content.yml`; nothing in the posting text resembles prohibited content in any case.

### Prior-contact FYI

`node company-history.mjs --company "WOW Recruitment"` → `responsiveness: no-history`. No note required.

---

## Risk Summary

| Signal | Status |
|--------|--------|
| Posting legitimacy | ✅ High Confidence |
| Employment classification | ✅ clear |
| Culture screen | — not evaluated (no `culture_screen` in profile.yml; end employer undisclosed) |
| Interview red flags | — no interview sessions yet |
| AI claims vs. infrastructure | ✅ consistent |

---

## Cover Letter Draft

> Draft generated at evaluation time. Complete via `/career-ops cover 185-confidential-wow-recruitment` to fill in angles, confirm research, and generate the PDF.
> **Hold this draft until the end employer is named** — the "why this company" section cannot be written against "an innovative AI company", and sending a cover letter that dodges the company is worse than sending none.

---

**Opening** *(placeholder — refine once the employer is known)*
I am writing about the Senior AI Engineer role covering production AI and agentic systems. The two things it leads with, defining evaluation frameworks and running agents in production, are what I have spent the past year building.

**Profile introduction**
I am the founder and principal engineer on OrbitBrain, a voice-first agentic product live on the App Store, backed by 13 years of senior and lead engineering across retail, regulated enterprise, and consumer scale. My production AI work has been built on GCP with Gemini Live and the Gemini ADK, with Postgres and HNSW vector retrieval through Supabase. I make architectural decisions under cost, time, and ambiguity constraints, and instrument them for iteration.

**Key achievements** *(selected from cv.md — exact wording preserved)*
- **Agent Observability & Evals,** TurnTracker OTel instrumentation on the agent loop, with a three-tier eval harness: unit/mocked at over 80% coverage on the core user journey, live staging, and LLM-judge.
- **GCP cost kill switch,** a separate admin project with Cloud Scheduler polling and automated shutoff triggers, designed to enable aggressive experimentation without runaway-cost risk in an agentic stack.
- **Full-stack agentic system,** Python backend on FastAPI and GCP Cloud Functions, iOS frontend, streaming Gemini Live responses.
- **End-to-end systems ownership at Officeworks,** a real-time price-monitoring notification system spanning client applications, pricing and availability services, and a push-notification pipeline with throttling and batch processing.

**Problems I will solve** *(placeholder — requires the employer's identity)*
> To be completed once the end employer is known: what does their platform actually do, and which part of it does this role own first?

**Closing**
I am happy to discuss further at your convenience.

---

**Gaps flagged:**
- **Employer unknown** — blocks the "why this company" section entirely. Do not send until resolved.
- **Stack delta** — AWS, Bedrock, and LangChain/LangGraph are named in the JD's Tech Stack and are not in cv.md. The draft above states the GCP/Gemini stack plainly rather than working around it. Keep it that way; per `feedback_cold_cover_state_have_silent_on_dont`, state what is there and stay silent on what is not — no pre-emptive gap disclosure.
- **Title/comp** — do not raise either in a cover letter (`feedback_cover_letter_no_level_ask`). Both belong in the conversation with Bradley.

**JD keywords to mirror** *(extracted for ATS and human read)*
production-grade AI agents · AI evaluation · testing and observability frameworks · agentic AI · RAG · tool calling · LLM-based systems · AI monitoring · performance optimisation · enterprise scale · technical architecture · Python · PostgreSQL · vector search · high-ownership

---
*Run `/career-ops cover 185-confidential-wow-recruitment` to complete angles, confirm company research, and generate the PDF — after the employer is named.*

---

---

## Score Breakdown

| Dimension | Score | Reasoning |
|---|---|---|
| Match with CV | 3.5/5 (capped) | Raw phrase overlap is high: all five "what we're looking for" bullets are clean HAVEs and the headline differentiator maps to the strongest attributed block in `cv.md`. Two things pull it down. The Tech Stack line is 3 HAVE / 1 PARTIAL / 3 GAP of 8. And **the Case Against found an unaccounted scale gap** — solo-product eval harness versus enterprise multi-tenant eval — so the dimension is capped at 3.5 per `modes/_custom.md`. Before the cap this scored 4.4, which was phrase matching, not fit. |
| North Star alignment | 4.0/5 | AI Platform / LLMOps × Agentic are both STRONG-tier in `_profile.md`. Held to 4.0 because Senior is one rung below the Staff/Principal/Architect primary target, the title does not compound the AI clock, and the barbell rule puts pure "AI Engineer" at an AI-native employer in the CONVERT-LATER lane. |
| Comp | 2.5/5 | 180-200K: the ceiling **is** the floor of the 200-260K target, and 180K **is** the walk-away exactly. Base-vs-package unstated, so a package read puts base near 161-179K, below the walk-away. No equity mentioned. Recruiter listing, so Low reliability. 2026 AU guides put this exact profile at the top of that band or into the 230K+ tier. |
| Cultural signals | 3.5/5 | Remote-first across Australia scores **5.0** on the remote dimension per `_profile.md` location policy, the highest available. Everything else is blank: undisclosed employer, no team size, no stage, no `culture_screen` configured, no evidence either way. A maximum remote score averaged against an unreadable culture. |
| Red flags | −0.3 | Undisclosed employer blocking diligence; agency gatekeeper on a newly-launched desk; a Senior title that does not compound; comp ceiling at the target floor; a three-item stack delta. None severe individually. |
| **Global** | **3.3/5** | Holistic, not arithmetic. Dimensions now mean(3.5, 4.0, 2.5, 3.5) = 3.375; less the -0.3 red-flag adjustment the baseline is **3.075**. Lift **+0.225** (3.4 would be +0.325 and breaks the +/-0.3 cap; `verify-evaluation.mjs` rejected it), justified on full AU-remote scarcity and a named 2nd-degree recruiter on an 11-minute-old posting — deliberately *not* on the eval/observability match, which the Case Against showed to be scale-mismatched. |

**Classification: Building Toward — but the channel is already half-open.**

The barbell CONVERT-LATER rule classifies this lane warm-intro-only, and the critic-mode default on a detected gap is Building Toward. Both apply. What softens it: the channel here is a named 2nd-degree recruiter with published contact details rather than an ATS, and the posting was 11 minutes old at 1 applicant. Per `feedback_speed_to_apply_on_fresh_roles` that is the fast lane, and per `project_jdp_principal_seek_expiry` recruiter-mediated is not the direct-portal channel the cold-apply failure data covers.

**Corrections (2026-08-18):** first published **3.9/5** with no Score Breakdown section, so the number was not reconstructible from the report. The dimension scores above are the ones actually used at evaluation time; the arithmetic they support is 3.3-3.6, not 3.9. Corrected to 3.6. A later `## Case Against` pass found an unaccounted scale gap and capped Match with CV at 3.5, taking it to **3.3** — now below the 3.5 band, which strengthens rather than changes the recommendation: no tailored cover, engage through the recruiter, let the comp answer decide.

## Keywords extracted

production AI, agentic systems, AI agents, AI evaluation, evaluation frameworks, testing frameworks, observability, AI monitoring, performance optimisation, RAG, tool calling, LLM-based systems, agentic AI, enterprise AI, AI governance, technical architecture, product direction, greenfield, Python, TypeScript, Node.js, AWS, PostgreSQL, vector search, Bedrock, LangChain, LangGraph, remote-first
