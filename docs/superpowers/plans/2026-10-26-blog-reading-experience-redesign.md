# Blog Reading Experience Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the GCloudCafe article reading experience into an immersive, distraction-free engineering environment featuring an asymmetric layout with optimal 68–72 character line measure, a silent right-rail Table of Contents, and aspect-ratio-bounded Mermaid architecture diagrams with fullscreen lightbox capability.

**Architecture:** 
1. Redesign Hugo's `render-codeblock-mermaid.html` to bound diagrams at `max-height: 480px` (preventing vertical height explosion), wrap in an engineered card with header utility actions, and provide a native lightbox modal for full-scale vector inspection.
2. Refactor `assets/scss/custom.scss` to strip the `.toc-container` card border, background, and drop-shadow, replacing it with a silent borderless rail with a sky-cyan active scroll tracker, and enforce `max-w-[720px]` central reading measure on `.blog-article-content`.
3. Update `layouts/blog/single.html` grid and container widths (`max-w-7xl`, generous `gap-12 lg:gap-16` gutter) so reading text is centered and spacious without sidebar crowding.
4. Update custom blog writing skills (`mermaid-architecture-spec.md` and `gcloudcafe-technical-blogging`) to codify the new architectural and diagram standards.

**Tech Stack:** Hugo templating, Tailwind CSS / SCSS (`custom.scss`), Mermaid.js v10, Vanilla JavaScript ES6 (IntersectionObserver, Dialog/Modal, Clipboard API).

**Spec:** `docs/superpowers/specs/2026-10-26-blog-reading-experience-redesign.md`

## Global Constraints

- **Goldmark Safety**: Never indent Markdown content inside raw HTML blocks.
- **Brand Identity**: Preserve GCloudCafe dark engineering palette (`#0b1120`, `#070b16`), sky-cyan (`#38bdf8`) accents, and monospace tags. No generic Medium clone styling.
- **Zero Regressions**: Existing article features (reading progress bar, series navigation, bookmark button, LinkedIn sharing, author bio) must remain fully functional.
- **Performance**: Zero heavy external dependencies; use native CSS and lightweight vanilla JS.

## Review Focus

1. **Tall Vertical Diagrams**: Vertical flowcharts (such as 8-step agent harnesses) must never exceed 480px height on the page, remaining fully glanceable without scrolling.
2. **Diagram Expand Modal**: Clicking "Expand" must present the SVG in a crisp, high-resolution modal overlay with responsive zoom/scroll and close via Esc or backdrop click.
3. **Silent TOC Visibility**: TOC must sit quietly in the right margin without a background box or harsh borders, with the active heading clearly accented in sky-cyan.
4. **Mobile Responsiveness**: On viewports < 1024px, the silent rail must gracefully collapse/hide and the reading column must occupy full available width without horizontal overflow.
5. **Hugo Build Verification**: Zero Hugo compilation errors or template parse warnings during `hugo --buildDrafts`.

---

### Task 1: Aspect-Ratio-Aware Mermaid Engine & Lightbox Modal

**Files:**
- Modify: `layouts/_default/_markup/render-codeblock-mermaid.html`

**Interfaces:**
- Consumes: Hugo `.Inner` codeblock content (Mermaid syntax).
- Produces: HTML container `.mermaid-card` with header bar (`.mermaid-header`), responsive diagram viewport (`.mermaid-viewport`), fullscreen modal overlay (`.mermaid-lightbox`), and copy syntax script.

- [ ] **Step 1: Inspect current render-codeblock-mermaid.html**
Verify existing structure and script initialization.

- [ ] **Step 2: Update render-codeblock-mermaid.html template**
Update template to:
  1. Generate a unique ID per diagram instance (`diagram-{{ md5 .Inner }}`).
  2. Render an engineered card container with subtle border (`border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl overflow-hidden my-8`).
  3. Include a diagram header bar with:
     - Left: Monospace kicker `span class="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"` with diagram icon.
     - Right: Action buttons: "Copy" (`fa-regular fa-copy`) and "Expand" (`fa-solid fa-expand`).
  4. Constrain diagram viewport:
     ```css
     .mermaid-viewport {
       display: flex;
       justify-content: center;
       align-items: center;
       max-height: 480px;
       width: 100%;
       overflow: hidden;
       padding: 1.5rem 1rem;
     }
     .mermaid-viewport svg {
       max-height: 450px !important;
       width: auto !important;
       max-width: 100% !important;
       height: auto !important;
       object-fit: contain;
     }
     ```
  5. Add modal dialog overlay `#mermaid-modal` (reusable or per diagram) triggered by the Expand button, rendering the SVG scaled for deep inspection with a close button and Escape key support.
  6. Retain existing Mermaid v10 CDN dynamic loader and theme initialization.

- [ ] **Step 3: Test diagram rendering on local Hugo server**
Verify `http://localhost:1313/blog/beyond-the-prompt-inside-the-ai-agent-harness/` renders the 8-step agent execution loop within the 480px height limit, and test the Expand and Copy buttons.

- [ ] **Step 4: Commit Task 1 changes**
```bash
git add layouts/_default/_markup/render-codeblock-mermaid.html
git commit -m "feat(blog): bound mermaid diagrams to 480px viewport with fullscreen lightbox"
```

---

### Task 2: Silent Table of Contents (TOC) & SCSS Polish

**Files:**
- Modify: `assets/scss/custom.scss`

**Interfaces:**
- Consumes: `.toc-container`, `.toc-title`, `.toc-link`, `.is-active`, `.blog-article-content`.
- Produces: Silent borderless TOC rail styles, sky-cyan active scroll tracker, and constrained 68–72ch reading measure.

- [ ] **Step 1: Refactor .toc-container SCSS**
Update lines 424–460 of `assets/scss/custom.scss`:
  1. Remove `bg-white dark:bg-[#0c1220]`, solid outer border, and `shadow-sm`.
  2. Set `background: transparent; border: none; box-shadow: none; padding: 0.5rem 0 0.5rem 0.75rem;`.
  3. Add a subtle vertical spine guide: `border-left: 1px solid rgba(148, 163, 184, 0.2);`.
  4. Style `.toc-title`: `font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2 border-none pb-0`.
  5. Style `.toc-link`: `text-xs font-normal text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 py-1 px-2.5 transition-colors duration-150 block no-underline`.
  6. Style `.toc-link.is-active`: `font-semibold text-sky-600 dark:text-sky-400 border-l-2 border-sky-500 dark:border-sky-400 -ml-[13px] pl-2.5 bg-transparent shadow-none`.
  7. Add `scrollbar-none` or subtle 3px scrollbar for overflowing TOC on long posts.

- [ ] **Step 2: Enforce reading measure on .blog-article-content**
Ensure `.blog-article-content` has `max-width: 720px; line-height: 1.8; font-size: 1.0625rem; margin-left: 0; margin-right: auto;`.

- [ ] **Step 3: Verify SCSS compilation**
Run Hugo build or inspect live server to ensure no SCSS syntax errors.

- [ ] **Step 4: Commit Task 2 changes**
```bash
git add assets/scss/custom.scss
git commit -m "style(blog): implement silent borderless TOC rail and 720px reading measure"
```

---

### Task 3: Layout & Asymmetric Grid Refactor (`layouts/blog/single.html`)

**Files:**
- Modify: `layouts/blog/single.html`

**Interfaces:**
- Consumes: Hugo page context, `.Content`, `.TableOfContents`.
- Produces: Refactored grid structure with `max-w-7xl` container, centered/spacious article column, and dedicated right rail.

- [ ] **Step 1: Update container and grid structure**
In `layouts/blog/single.html`:
  1. Update container to `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (or update section container class).
  2. In the article + sidebar row:
     - Change `<div class="row gx-0 lg:gx-5 min-w-0 max-w-full">` to an asymmetric grid:
       `<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start min-w-0 max-w-full">`
     - Article column: `<article class="single-post lg:col-span-8 xl:col-span-8 min-w-0 max-w-full">`
     - Aside column: `<aside class="hidden lg:block lg:col-span-4 xl:col-span-4 sticky top-28">`
  3. Ensure the article header, author presence box, and newsletter lead magnet seamlessly fit within the new grid width.

- [ ] **Step 2: Test layout across screen sizes**
Inspect layout at 1920px, 1440px, 1024px, 768px, and 375px viewports. Confirm no horizontal scrolling and verify the silent TOC floats cleanly on the right.

- [ ] **Step 3: Commit Task 3 changes**
```bash
git add layouts/blog/single.html
git commit -m "feat(blog): refactor article layout to asymmetric 12-col grid with generous gutters"
```

---

### Task 4: Skill Knowledge & Architecture Standards Update

**Files:**
- Modify: `C:/Users/Thara/.gemini/config/skills/architecture-articles/references/mermaid-architecture-spec.md`
- Modify: `C:/Users/Thara/.gemini/config/skills/gcloudcafe-technical-blogging/SKILL.md`

**Interfaces:**
- Consumes: Spec requirements for diagram bounding and reading rhythm.
- Produces: Updated guidance for future technical blog generation.

- [ ] **Step 1: Update mermaid-architecture-spec.md**
Add rules for:
  - Diagram aspect ratio discipline (bounding vertical depth to 4–5 tiers, preferring horizontal pipelines or side-by-side subgraphs for bifurcated planes).
  - Highlighting the new automatic 480px viewport constraint and fullscreen lightbox.

- [ ] **Step 2: Update gcloudcafe-technical-blogging skill**
Add section on reading experience ergonomics:
  - 68–72 character line measure.
  - Zero noisy cards in the TOC rail.
  - Viewport-bounded diagrams with glanceability criteria.

- [ ] **Step 3: Commit Task 4 changes**
```bash
git add docs/superpowers/
git commit -m "docs(skills): update architecture blogging standards with reading experience rules"
```

---

### Task 5: End-to-End Verification & Pull Request

**Files:**
- Full repository test and verification

- [ ] **Step 1: Hugo build test**
Run `wsl -d Ubuntu -- bash -c "cd ~/documents/projects/gcloudcafe && hugo --buildDrafts --gc"` and verify exit code 0 with zero warnings.

- [ ] **Step 2: Browser subagent inspection**
Launch browser subagent to capture desktop and mobile screenshots of `http://localhost:1313/blog/beyond-the-prompt-inside-the-ai-agent-harness/`.
Verify:
  - Reading column is comfortable and easy to follow.
  - Right TOC is silent, subtle, and tracks active sections on scroll.
  - Mermaid diagram fits on screen within 480px height.
  - Expand button opens fullscreen lightbox cleanly.

- [ ] **Step 3: Push branch and create Pull Request**
Push `feat/reading-experience-redesign` to origin and create GitHub PR with summary and before/after comparisons.
