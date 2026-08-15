---
name: gcloudcafe-blog-orchestrator
description: >-
  Master blog workflow orchestrator for Gcloudcafe. Coordinates the end-to-end lifecycle
  between gcloudcafe-blog-writer (drafting) and gcloudcafe-blog-reviewer (auditing), iteratively
  refining drafts until reaching a 9.6+/10 benchmark, verifying local Hugo rendering, and creating
  ready-to-merge GitHub PRs with LinkedIn social posts.
---

# Gcloudcafe Blog Orchestrator Agent

Use this skill to autonomously lead the complete, end-to-end creation, auditing, testing, and deployment of technical blog posts for **gcloudcafe.com**.

---

## 🔄 The 5-Phase Orchestration Workflow

```text
Phase 1: Research & Drafting (Writer Skill)
   │  • Generates cover image (16:9) & syncs to assets/ and static/
   │  • Drafts grounded 12-step markdown with Goldmark-safe HTML
   ↓
Phase 2: Automated Peer Review (Reviewer Skill)
   │  • Runs 10-point audit rubric (Grounding, Tone, HTML, Labs)
   │  • Calculates score out of 10.0 and generates surgical diffs
   ↓
Phase 3: Iterative Refinement Loop
   │  • Applies reviewer corrections automatically
   │  • Repeats until article achieves 9.6+/10.0 score
   ↓
Phase 4: Local Build & UI Verification
   │  • Spins up local Hugo server (port 1313)
   │  • Verifies HTTP 200, Series Playlist widget, Hero Banner & images
   ↓
Phase 5: Delivery & Social Outreach
      • Creates git branch & commits all assets
      • Opens GitHub Pull Request
      • Generates sleek, developer-focused LinkedIn post
```

---

## 🛠️ Step-by-Step Execution Protocol

### Step 1: Initialize & Plan
- Determine topic, target audience, slug, series name, and part number.
- Generate high-resolution 16:9 cinematic cover image using `generate_image`.
- Copy image to both `assets/images/[slug].jpg` and `static/images/[slug].jpg`.

### Step 2: Draft the Article (Invoke `gcloudcafe-blog-writer`)
- Enforce strict technical grounding (RFCs, official cloud docs, tested CLI commands).
- Structure across the **12-Step Blueprint**:
  1. Relatable Hook
  2. Intuitive Real-World Analogy
  3. Core Multi-Engine Architecture
  4. Light/Dark Adaptive Tailwind Comparison Diagram
  5. 🚨 5 Fatal Misconceptions Grid
  6. Lifecycle Pipeline ASCII Diagram
  7. Parameter Cheat Sheet Table
  8. Public vs Private / Managed vs Self-Hosted Architecture
  9. Hierarchical Topology / Trust Routing
  10. ⚠️ Common Production Gotchas
  11. Tested Hands-On Lab Commands
  12. Authoritative Standards + Summary + Next Part Bridge

### Step 3: Run the Audit (Invoke `gcloudcafe-blog-reviewer`)
- Execute the 10-point audit rubric.
- Check for zero AI hallucinations, zero Goldmark indentation bugs, and natural human tone.
- If score is `< 9.6/10`, apply required surgical fixes immediately and re-score.

### Step 4: Verify on Hugo Dev Server
- Verify rendering via background command:
  ```bash
  wsl bash -c "cd /home/thara/documents/projects/gcloudcafe && fuser -k 1313/tcp; nohup hugo server -D -p 1313 --bind 0.0.0.0 > /tmp/hugo.log 2>&1 & sleep 2 && curl -I http://localhost:1313/blog/[slug]/"
  ```
- Confirm HTTP 200, series playlist linking, and image rendering.

### Step 5: Ship & Generate Social Post
- Create feature branch: `blogpost/[slug]`.
- Commit markdown, image assets, and series linking metadata.
- Open GitHub Pull Request using `gh pr create`.
- Output sleek, high-engagement LinkedIn post ready to copy.
