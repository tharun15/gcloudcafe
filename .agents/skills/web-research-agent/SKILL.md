---
name: web-research-agent
description: >-
  Autonomous research and data augmentation agent for technical blogging. Searches the web
  before drafting to map keywords, analyze current industry trends, and gather at least 3 authoritative,
  verified primary sources. Builds a preliminary Research Dossier (dossier.md), validates all external
  URLs with live HTTP 200 checks, and prevents outdated information, hallucinations, or dead links.
---

# Web Research & Data Augmentation Agent (`web-research-agent`)

Use this skill **before writing any technical blog post, case study, or whitepaper**. It enforces a strict "Research First, Write Second" policy, preventing outdated documentation, fabricated URLs, and generic AI assumptions.

---

## ⚡ Non-Negotiable Core Directives

1. **Mandatory Research Dossier:** Never start drafting an article without first compiling a structured **Research Dossier** (`dossier.md` or artifact).
2. **Minimum 3 Authoritative Primary Sources:**
   - Official product documentation (e.g., Google Cloud, AWS, Kubernetes, CNCF).
   - Upstream GitHub repositories, official SDK reference manuals, or IETF RFC specs.
   - Official engineering release blogs, keynote announcements, or changelogs.
   - **Banned Sources:** Generic scraping blogs, outdated forum answers, SEO farm listicles, and unverified AI summaries.
3. **Strict Live URL Verification:** Every single URL gathered during research MUST be verified via live HTTP request (curl, urllib, or python) before being documented or added to drafts. **Zero 404s permitted.**
4. **Current Era Grounding:** Explicitly verify current API versions, model releases, SDK package names (e.g., distinguishing between legacy `google-cloud-aiplatform` vs modern `google-genai` / `google-adk`), and current console naming conventions.

---

## 🔍 The 4-Phase Research Workflow

### Phase 1: Keyword & Intent Mapping
- **Primary Keyword:** The exact technical search term developers and architects search for (e.g., `"Gemini Enterprise Agent Platform Express Mode"`).
- **Secondary Intent Clusters:** Practical questions practitioners ask (e.g., *"How to authenticate Express Mode with Python"*, *"Express Mode API Key vs ADC"*, *"Agent Studio vs Google ADK"*).
- **Competitor Gap Analysis:** What are existing articles missing? (Usually missing: real production gotchas, reproducible Python code, architecture diagrams, and cost/security boundaries).

### Phase 2: Autonomous Multi-Angle Web Searching
Execute distinct targeted search queries across multiple angles:
1. **Official Release & Documentation:** `site:cloud.google.com <feature> documentation`
2. **Upstream Code & SDKs:** `site:github.com <repo> <library_name> examples`
3. **Engineering Specs & Whitepapers:** `<topic> architecture specification RFC filetype:pdf OR inurl:docs`
4. **Community Real-World Gotchas:** `<technology> "limitations" OR "pricing" OR "gotchas" OR "troubleshooting"`

### Phase 3: Live Link Verification Protocol
For every source discovered:
```python
import urllib.request

def verify_source(url: str) -> bool:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception:
        return False
```
If a URL returns 404, 403, or redirects to a generic home page, search for the official canonical replacement or discard the link immediately.

### Phase 4: Compiling the Research Dossier (`dossier.md`)
Assemble the findings into the following standardized structure:

```markdown
# 🔬 Research Dossier: [Topic Name]

## 1. Executive Summary & Verified Terminology
- **Exact Official Product Name:** [e.g., Gemini Enterprise Agent Platform]
- **Current Release Status:** [GA / Public Preview / Sandbox]
- **Primary SDK / Package:** [e.g., `google-adk`, `google-genai`]

## 2. Authoritative Primary Sources (100% HTTP 200 Verified)
1. [Source 1 Title](URL) - Status: [200 OK] - Core Takeaway: [...]
2. [Source 2 Title](URL) - Status: [200 OK] - Core Takeaway: [...]
3. [Source 3 Title](URL) - Status: [200 OK] - Core Takeaway: [...]

## 3. Architecture & Operational Facts
- Real-world limitations & quotas
- Authentication mechanics (IAM, OAuth2, API Keys)
- Pricing, tier differentiators, and deployment targets

## 4. Grounded Code & Syntax Verifications
- Confirmed method signatures and import statements
- Tested sample payload or CLI commands

## 5. Unique Angle for Gcloudcafe
- What unique production perspective or case study (e.g. Offvia) will we demonstrate that no other article covers?
```

---

## 🎯 Output Contract
When this skill completes, hand over the finalized **Research Dossier** to `gcloudcafe-blog-writer` or `gcloudcafe-blog-orchestrator`.
