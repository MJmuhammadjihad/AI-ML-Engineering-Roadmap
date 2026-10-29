# Market evidence and decision framework

Research access date: 28 October 2026. Target: a beginner studying six hours per study day, aiming at a global AI/ML engineering market.

## What was actually researched

Public GitHub repository search and direct retrieval of primary documentation and author-maintained research repositories. Ten useful primary sources were retrieved and read. METR's published data was inspected to verify its sample count (246 issues, 16 developers). No regression was rerun. BLS retrieval was denied by the network proxy (403); WEF, Stanford HAI and employer domains are outside the enforced allowlist. Official AI Index GitHub sources were investigated and found to expose old material, not sufficient to establish current statistics. No current job-posting sample was obtained.

Therefore this evidence supports engineering curriculum choices and a research process. It does not support a claim of comprehensive current global hiring analysis. Do not present GitHub feature lists, project stars, course syllabi, or tool adoption as job-opening counts. Do not display precise future demand, salary, hiring probability, or a guaranteed completion-to-employment date.

## Strong curriculum decisions supported by observed engineering practice

- Build software that someone can run and inspect: readable design, tests, review, documentation, version control. E06.
- Make ML claims that survive scrutiny: baseline, appropriate split, no leakage, reproducible preprocessing, validation and held-out tests. E04.
- Treat experiments as decisions under uncertainty: hypothesis, comparisons, logging, diagnostics, compute budget. E05.
- Learn to operate the model as a system: data contracts, pipelines, serving, observability and rollback. E09, with its age explicitly noted.
- For LLM products, evaluate the task and failure modes before selecting a prompt, retrieval system, fine-tune or agent. E02, E03.
- For tools and agents, learn authorization, input/output validation, bounded execution and trace-based diagnosis. E08.
- For infrastructure specialization, understand memory, batching, latency, throughput, quantization and distribution. E07.
- Use AI as an instrument whose effects are measured; do not mistake assistance for unaided mastery. E01. The reported early-2025 slowdown must not be generalized to all users or current tools.

## Global-market interpretation

A globally applicable core is not a single global job market. Hiring requirements vary by country, legal work eligibility, time zone, English communication, company size, domain, role and seniority. U.S. occupation forecasts cannot be applied directly to Bangladesh, Europe, India, or global remote entry-level roles. A broad occupational growth projection does not imply an abundance of junior openings. Large research labs are not representative of all employers.

Use a monthly sample of public job advertisements that you are actually eligible to apply for. Start with 30 distinct roles across at least 10 employers, covering the regions and contract types relevant to you. This is a practical audit sample, not a statistical population estimate. Record URL, capture date, role family, seniority, geography/remote restrictions, degree requirement, required skills, preferred skills, years of experience and evidence requested. Deduplicate repostings and staffing-agency duplicates. Report the denominator and avoid claiming prevalence beyond the sample. Separate junior-accessible roles from senior-only roles. Revise the next elective or portfolio project from repeated requirements; keep the mathematical/software core stable.

## Scenarios for 2027–2030: authored analysis, not forecasts

1. If models become cheaper and more capable, writing a wrapper becomes easier. A sensible hedge is stronger problem definition, domain knowledge, proprietary or well-governed data, evaluation and integration. This is conditional reasoning; it does not predict net jobs.
2. If latency, compute and infrastructure costs dominate a product, serving and systems skills gain value for that product. A sensible hedge is one project with measured quality–cost–latency tradeoffs.
3. If organizations increase accountability requirements, data provenance, privacy, auditing, security and human review become important constraints. Learn these as engineering requirements without assuming a particular future law or country.
4. If entry-level tasks are increasingly automated, observable competence on ambiguous tasks may matter more. A sensible hedge is original projects, debugging, collaboration, a clear design narrative and work on a real user's problem. This does not establish that junior jobs disappear.
5. If model progress slows or certain architectures lose popularity, statistics, optimization, data engineering, software design, experimentation and communication remain useful across tool changes. These are transferable capabilities, not employment guarantees.

## Practical role choices

- Applied ML engineer: prioritize Python, SQL, data validation, leakage-safe evaluation, tabular baselines, feature pipelines, APIs, serving and monitoring. Portfolio: a useful decision system with a reproducible baseline and error analysis.
- AI product engineer: add accessible web interfaces, HTTP/API design, authentication, retrieval, LLM evaluation, structured output and bounded tools. Portfolio: a product that beats a simpler alternative on a measured task.
- ML systems engineer: add operating systems, networking, databases, profiling, concurrency, hardware memory, inference serving and distributed computation. Portfolio: a reproducible performance benchmark with a quality constraint.
- Research engineer: add mathematical depth, paper reading, clean implementations, ablations, training diagnostics and experiment reproducibility. Portfolio: a faithful paper reproduction with an honest negative result and a small extension. Research scientist roles may require graduate research; a roadmap is not an equivalent credential.

A beginner should build a common core and one substantial project before choosing a specialization. These role mappings are curriculum synthesis from system responsibilities, not a measured frequency table of 2026 job advertisements.
