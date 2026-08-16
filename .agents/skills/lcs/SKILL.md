---
name: lcs
description: >-
  Lists and catalogs all custom skills, plugins, and workflows installed in Antigravity.
  Trigger immediately whenever the user types '/lcs', 'lcs', 'list custom skills',
  or asks what custom skills are available.
---

# Antigravity Custom Skills Catalog (`/lcs`)

Use this skill to inspect, enumerate, and present an interactive catalog of all custom skills, plugins, and workflows available in the environment.

---

## ⚡ Execution Instructions

When `/lcs` is invoked:
1. Scan the global custom directory (`~/.gemini/config/skills/`, `~/.gemini/config/plugins/`) and workspace directory (`.agents/skills/`).
2. Present the skills in a categorized, high-contrast markdown table.
3. Provide example triggers and copy-pasteable commands for each skill.

---

## 📋 Current Custom Skills Inventory

### 🌟 Gcloudcafe Technical Publishing Suite

| Command / Skill | Category | Description | How to Invoke |
| :--- | :--- | :--- | :--- |
| **`gcloudcafe-blog-orchestrator`** | *Master Lifecycle* | End-to-end autonomous coordination across SEO planning, drafting, reviewing, Hugo testing, git branching, PR creation, and LinkedIn post generation. | *"Run blog orchestrator for topic X"* |
| **`gcloudcafe-seo-expert`** | *SEO & GEO/LLMO* | Keyword discovery, search intent mapping, high-CTR frontmatter, featured snippet 40-word definition blocks, internal link graphs, and 10-point SEO audits. | *"Run SEO expert analysis for topic X"* |
| **`gcloudcafe-blog-writer`** | *Technical Authoring* | Researches and drafts factually grounded 12-step engineering articles with zero AI hallucinations, Goldmark-safe Tailwind diagrams, and tested labs. | *"Write blog draft on topic X"* |
| **`gcloudcafe-blog-reviewer`** | *Auditing & QA* | Uncompromising 10-point senior peer reviewer scoring drafts out of 10.0 for factual accuracy, human tone, HTML safety, and production edge cases. | *"Audit this draft against 10-point rubric"* |
| **`gcloudcafe-technical-blogging`** | *Design Standards* | Blueprint standards, Goldmark formatting rules, responsive Tailwind color palettes, and interactive component specs. | *"Reference blogging guide standards"* |

---

### 🛠️ Developer & System Tooling

| Command / Skill | Category | Description | How to Invoke |
| :--- | :--- | :--- | :--- |
| **`lcs`** (or `/lcs`) | *System Catalog* | Displays the live catalog of all installed custom skills, plugins, and invocation shortcuts. | `"/lcs"` or *"list custom skills"* |
| **`agy-customizations`** | *Configuration* | Guide and reference for Antigravity rules, skills, plugins, hooks, and MCP servers. | *"How do Antigravity customizations work?"* |
| **`antigravity-guide`** | *Documentation* | Comprehensive guide, quick reference, and sitemap for Google Antigravity CLI, IDE, 2.0, and SDK. | *"Explain Antigravity IDE features"* |
| **`modern-web-guidance`** | *Frontend* | Modern HTML, Vanilla CSS, Web APIs, and client-side best practices. | *"Modern web standards for layout X"* |
| **`chrome-extensions`** | *Browser Ext* | Manifest V3 extension development, permissions, service workers, and Web Store publishing. | *"Build a Chrome extension for X"* |
| **`gemini-interactions-api`** | *AI API* | Code generation and agent workflows using the Gemini Interactions API (Python & TypeScript). | *"Implement Gemini chat with Interactions API"* |
| **`gemini-live-api-dev`** | *Real-Time AI* | WebSocket bidirectional streaming, audio/video streaming, and VAD session management. | *"Setup Gemini Live API streaming"* |
