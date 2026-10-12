---
name: gcloudcafe-blog-orchestrator
description: >-
  Master blog workflow orchestrator for Gcloudcafe. Coordinates the end-to-end lifecycle
  across web-research-agent (source reconnaissance), competitor-keyword-engine (SERP & viral discovery),
  gravity-copywriter (magnetic hooks), gcloudcafe-seo-expert (intent & schema),
  gcloudcafe-blog-writer (drafting), and gcloudcafe-blog-reviewer (auditing), iteratively
  refining drafts until reaching a 9.6+/10 benchmark, verifying local Hugo rendering,
  and creating ready-to-merge GitHub PRs with LinkedIn and newsletter dispatches.
---

# Gcloudcafe Blog Orchestrator Agent

Use this skill to autonomously lead the complete, end-to-end creation, auditing, testing, and deployment of technical blog posts for **gcloudcafe.com**.

---

## 🔄 The 7-Phase Orchestration Workflow

```text
Phase 1: Deep Web Reconnaissance & Fact Grounding (web-research-agent)
   │  • Queries live web for official vendor docs (GCP, AWS, Kubernetes, CNCF, RFCs)
   │  • Validates 100% of external links via live HTTP 200 checks (zero 404s)
   │  • Compiles preliminary Research Dossier (dossier.md)
   ↓
Phase 2: SERP Competitor Reverse-Engineering & Viral Copy (competitor-keyword-engine & gravity-copywriter)
   │  • Reverse-engineers Top 3 ranking competitor articles on Google / Reddit / Dev.to
   │  • Identifies competitor blind spots & constructs Information Gain Gap Matrix
   │  • Discovers high-volume search queries and competitive developer keywords
   │  • Crafts magnetic, high-CTR headline formulas and unignorable 3-line problem hooks
   ↓
Phase 3: SEO Architecture & Structured Data (gcloudcafe-seo-expert)
   │  • Calibrates frontmatter (50-65 char SERP title, 135-160 char meta description)
   │  • Maps PAA (People Also Ask) questions and Google Featured Snippet target blocks
   │  • Formulates 3-5 search-intent faqs: with @type: "FAQPage" JSON-LD schema
   │  • Designs internal linking mesh across companion posts and series tracks
   ↓
Phase 4: Cinematic Visuals & Technical Drafting (gcloudcafe-blog-writer)
   │  • Generates 16:9 cinematic cover image using generate_image & syncs to static/ and assets/
   │  • Drafts grounded 12-step blueprint markdown with Goldmark-safe responsive HTML
   │  • Integrates light/dark Tailwind architecture diagrams and 5 Fatal Misconceptions grid
   │  • Implements reproducible, tested hands-on lab commands with expected outputs
   ↓
Phase 5: Automated Peer, Editorial & SEO Audit (gcloudcafe-blog-reviewer & content-critic)
   │  • 10-point technical grounding audit (RFC compliance, zero AI hallucinations, flag accuracy)
   │  • Anti-AI-speak review: purges corporate clichés, enforces developer cadence
   │  • Runs 10-point SEO Scorecard & GEO/LLMO citation audit
   │  • Enforces iterative refinement loop until aggregate score reaches ≥ 9.6/10.0
   ↓
Phase 6: Local Build & UI Verification
   │  • Builds site locally using Hugo engine (hugo --gc)
   │  • Verifies HTTP 200, Series Playlist widget, dark mode styling, and image assets
   │  • Runs test suite (npm test) ensuring zero broken links or layout regressions
   ↓
Phase 7: Delivery, Git & Multi-Channel Distribution (content-repurposing)
   │  • Creates feature branch and commits clean markdown + image assets
   │  • Opens GitHub Pull Request or merges directly to main
   │  • Generates high-converting LinkedIn post, Twitter/X thread, and Sunday newsletter draft
```

---

## 🛠️ Step-by-Step Execution Protocol

### Step 1: Deep Web Research (Invoke `web-research-agent`)
- Search official documentation and upstream repositories:
  - Official RFCs (IETF), Kubernetes upstream docs, Google Cloud / AWS docs, or Linux man pages.
  - Exclude generic content farms or unverified blogs.
- Run live HTTP verification on all primary source links (`HTTP 200 OK`).
- Produce a structured **Research Dossier** (`dossier.md`) capturing architectural primitives, current API versions, and production constraints.

### Step 2: Competitor Reconnaissance & Viral Hook Framing (Invoke `competitor-keyword-engine` & `gravity-copywriter`)
- Search Google and Reddit (`site:reddit.com/r/devops [topic]`) for top 3 organic competitors.
- Audit competitor strengths and weaknesses (outdated versions, pseudocode, missing edge cases).
- Construct the **Information Gain Gap Matrix** to ensure Gcloudcafe delivers superior depth.
- Extract the most competitive, high-volume search queries and technical problem terms.
- Craft high-CTR, viral headline options and a gripping 3-line problem hook using high-stakes specificity.

### Step 3: SEO & Intent Blueprint (Invoke `gcloudcafe-seo-expert`)
- Front-load primary keyword in `title` (50–65 characters) and calibrate `meta_title`.
- Write high-clickability `description` (135–160 characters).
- Define 3–5 high-intent `faqs:` with actionable answers to generate valid `FAQPage` JSON-LD schema.
- Map internal links to related companion articles and series tracks.

### Step 4: Asset Generation & Drafting (Invoke `gcloudcafe-blog-writer`)
- Generate high-resolution 16:9 cinematic cover image using `generate_image`.
- Save image to `assets/images/[slug].jpg` and `static/images/[slug].jpg`.
- Draft article following the strict **12-Step Universal Blueprint**:
  1. Relatable Production Hook (3-line unignorable opening)
  2. Intuitive Real-World Analogy
  3. Core Multi-Engine Architecture Breakdown
  4. Light/Dark Adaptive Tailwind Comparison Diagram (Goldmark-safe, zero indent)
  5. 🚨 5 Fatal Misconceptions Grid (responsive 2-column)
  6. Lifecycle Pipeline ASCII Diagram
  7. Parameter Cheat Sheet Table
  8. Public vs Private / Managed vs Self-Hosted Architecture
  9. Hierarchical Topology / Resource Model
  10. ⚠️ Common Production Gotchas & Incident War Stories
  11. Tested Hands-On Lab Commands (real flags, expected outputs)
  12. Authoritative Standards + Summary + Next Part Bridge

### Step 5: Multi-Layer Peer Review & Refinement Loop (Invoke `gcloudcafe-blog-reviewer` & `content-critic`)
- **Technical Grounding:** Verify every CLI flag, API field, and architectural claim against official specs.
- **Anti-AI Editorial Pass:** Purge robotic buzzwords (*delve, tapestry, crucial, seamlessly, testament*).
- **Hugo Goldmark Audit:** Ensure no 4-space internal indentation inside HTML tags.
- **SEO & Schema Audit:** Confirm single H1, valid FAQ schema, and 40–50 word snippet answer blocks.
- **Benchmark Loop:** If score is `< 9.6/10.0`, apply surgical corrections and re-score.

### Step 6: Local Build & UI Verification
- Build and verify site locally:
  ```bash
  wsl -d Ubuntu -e bash -lic "cd /home/thara/documents/projects/gcloudcafe && hugo --gc && npm test"
  ```
- Verify HTTP 200, Series Playlist widget, Hero Banner, and image assets.

### Step 7: Ship & Multi-Channel Distribution (Invoke `content-repurposing`)
- Create git branch `blogpost/[slug]` or merge to `main`.
- Generate ready-to-share distribution assets:
  - High-CTR LinkedIn technical post / carousel outline.
  - Viral Twitter/X engineering thread.
  - Sunday Newsletter inclusion block.
