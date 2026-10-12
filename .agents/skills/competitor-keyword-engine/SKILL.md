---
name: competitor-keyword-engine
description: "Autonomous keyword research, SERP competitor analysis, and viral topic discovery engine for Gcloudcafe. Scrapes and analyzes top-ranking competitor pages, identifies technical content gaps, extracts high-intent search queries, and constructs a battle-tested Information Gain blueprint for drafting outranking technical articles."
---

# Competitor Keyword Engine (`competitor-keyword-engine`)

Autonomous research, search intent mapping, and competitor intelligence engine designed to discover high-value cloud, DevOps, and Kubernetes opportunities, reverse-engineer top-ranking search competitors, and deliver outranking content blueprints for Gcloudcafe.

---

## Core Mission & Philosophy

Google's modern ranking algorithms (Helpful Content System, Information Gain scores) penalize generic AI rewrites. To rank #1 on competitive technical keywords (e.g. *Red Hat EX280*, *CKA*, *GCP Cloud Architect*, *TLS 1.3*, *Kubernetes Networking*), Gcloudcafe must:
1. **Never copy competitor structure**: Identify their blind spots, outdated syntax, and superficial explanations.
2. **Inject Maximum Information Gain**: Provide production-tested commands, architecture diagrams, benchmark numbers, and step-by-step terminal verification.
3. **Target "Striking Distance" Opportunities**: Capture high-volume search impressions with exact-match search intent.

---

## 4-Step Operational Workflow

```
┌─────────────────────────────────┐
│ 1. Seed Topic & SERP Discovery  │ ➔ Search Google / Dev / Reddit for target query
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 2. Competitor Breakdown & Audit │ ➔ Reverse-engineer Top 3 ranking competitor pages
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 3. Information Gain Gap Matrix  │ ➔ Uncover missing edge cases, errors, and configs
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ 4. Outranking Content Blueprint │ ➔ Deliver structured dossier to gcloudcafe-blog-writer
└─────────────────────────────────┘
```

---

### Step 1: SERP & Keyword Reconnaissance

Before drafting any article, execute targeted search queries to extract top-ranking competitor URLs:
1. Search queries:
   - `[target keyword]`
   - `[target keyword] tutorial step by step`
   - `[target keyword] common errors troubleshooting`
   - `site:reddit.com/r/devops [target keyword]`
2. Collect the top 3 organic ranking URLs (excluding official vendor documentation like `kubernetes.io` or `cloud.google.com`, which serve as factual ground truth).

---

### Step 2: Competitor Anatomy Audit

For each of the top 3 ranking articles, audit:
1. **Headline & Hook Style**: How do they frame the problem? (Generic tutorial vs. battle-tested runbook).
2. **Content Depth & Word Count**: Average length, reading time, and technical depth.
3. **Heading Hierarchy (H2 / H3)**: Map out their structural flow.
4. **Code Quality**: Are their code snippets runnable, or are they pseudocode with placeholders (`<YOUR_KEY>`, `TODO`)?
5. **Freshness & Version Accuracy**: Are they using deprecated Kubernetes APIs (`v1beta1`), older OpenShift versions, or obsolete TLS 1.2 ciphers?

---

### Step 3: Information Gain & Gap Matrix

Compile an **Information Gain Gap Matrix** to ensure Gcloudcafe's post provides undeniable superiority:

| Competitor Weakness | Gcloudcafe Counter-Strategy |
| :--- | :--- |
| Superficial definitions without real terminal output | Full runnable `kubectl` / `oc` / `gcloud` commands with expected terminal outputs |
| No troubleshooting / failure modes | Dedicated **"Troubleshooting & 3 AM Production Gotchas"** section |
| Text-heavy wall of words | ASCII or Mermaid diagrams visualizing packet flow / architecture |
| Generic advice | Grounded analogies, production failure stories, and honest trade-offs |
| Missing search queries | Integrated **FAQ section** targeting Google *People Also Ask* queries |

---

### Step 4: Outranking Content Blueprint Specification

Generate a structured dossier `dossier.md` containing:
1. **Target Keyword Profile**:
   - Primary Keyword (e.g. `ex280 exam objectives`)
   - Secondary / LSI Keywords (e.g. `do280 exam tasks`, `openshift administrator practice lab`)
   - Search Intent: (Informational, Practical, Exam Prep, Runbook)
2. **Compelling High-CTR Title Options**:
   - Option A: Problem / Solution (*"Mastering EX280 Exam Objectives: The No-Fluff Technical Guide"*)
   - Option B: Curiosity / Story (*"How I Tackled the Hardest Tasks on the Red Hat EX280 Exam"*)
3. **Semantic Heading Outline (H2 / H3)** with clear Information Gain directives for each section.
4. **Mandatory Hands-On Lab Script**: Exact CLI commands and YAML configurations to verify locally.
5. **FAQ Block**: 3–5 targeted questions formatted for Google `FAQPage` JSON-LD schema.

---

## Quality Gate Checklist

- [ ] Has at least 3 competitor pages been analyzed for weaknesses?
- [ ] Are official vendor specs (RFCs, Red Hat docs, GCP docs) cited as authoritative references?
- [ ] Does the outline include at least 1 visual diagram (Mermaid/ASCII)?
- [ ] Does the blueprint include a Google-compliant FAQ section?
- [ ] Does it pass directly to `gcloudcafe-blog-writer` or `gcloudcafe-blog-orchestrator`?
