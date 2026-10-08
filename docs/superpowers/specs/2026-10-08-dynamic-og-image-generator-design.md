# Technical Design Specification: Dynamic Social OpenGraph Image Generation Engine

- **Date**: 2026-10-08
- **Author**: Antigravity & Tharun Vempati
- **Status**: Approved / In Implementation
- **Target Branch**: `feat/dynamic-og-image-generator`

---

## 1. Executive Summary & Purpose

### 1.1 Objective
Build an automated, high-converting OpenGraph (OG) image generation engine for GCloudCafe. When links are shared across LinkedIn, Twitter/X, Slack, Reddit, and Discord, social platforms will display custom 1200×630 cards designed to maximize click-through rate (CTR), replacing generic or raw landscape covers.

### 1.2 Non-Negotiable Requirements
1. **Fully Automated**: Runs automatically during local builds and CI/CD pipelines without manual Canva/Figma intervention.
2. **Default for Future Posts**: Automatically detects any new or modified Markdown articles and generates matching OG cards without manual frontmatter configuration.
3. **Practitioner Aesthetics**: Styled with GCloudCafe's signature dark engineering aesthetic (`#070b16` / `#0f172a`), subtle neon accent glows, category pill badges, prominent wrapped typography, reading time, author branding, and logo watermark.
4. **Fast & Cache-Aware**: Incremental generation based on file modification timestamps (`mtime`) so builds remain sub-second when cards are already cached.
5. **Hugo Head Parity**: Updates `layouts/partials/essentials/head.html` to automatically prioritize generated OG cards.

---

## 2. Visual Architecture & Card Layout (1200 × 630 px)

The generated card will follow a structured grid system:
- **Canvas**: 1200px width × 630px height at 72–96 DPI.
- **Background**: `#070b16` dark slate with top-right cyan/sky radial glow (`rgba(14, 165, 233, 0.12)`) and bottom-left amber/red radial glow (`rgba(239, 68, 68, 0.08)`).
- **Borders**: Refined 1px card border (`rgba(51, 65, 85, 0.6)`).
- **Topic Badge**: High-contrast pill badge with category-specific borders (GCP, K8s, AWS, Security).
- **Headline**: Bold `#f8fafc` text with computed word-wrapping (up to 3 lines, 52–56px font).
- **Subtitle / Value Hook**: `#94a3b8` text with word-wrapping (up to 2 lines, 24–26px font).
- **Footer**: Tharun Vempati author branding, publishing date, estimated read time, and `gcloudcafe.com` logo watermark.

---

## 3. Subsystem Architecture

### 3.1 Components
1. **Generator Script (`scripts/generate-og-cards.js`)**:
   - Parses Markdown frontmatter.
   - Normalizes and XML-escapes text (`&`, `<`, `>`, `"`, `'`).
   - Wraps text into SVG `<tspan>` elements.
   - Uses `@resvg/resvg-js` to rasterize SVG into `static/images/og/<slug>.png`.
2. **Incremental Cache Engine**:
   - Compares `mtime` of Markdown source with output PNG.
   - Skips generation if PNG exists and is newer than source.
   - Supports `--force` flag.
3. **Hugo Template Integration (`layouts/partials/essentials/head.html`)**:
   - Checks priority order:
     1. `.Params.og_image` (explicit manual override)
     2. `static/images/og/<slug>.png` (auto-generated dynamic social card)
     3. `.Params.image` (fallback cover photo)
     4. Default fallback: `/images/og-share.png`
4. **Pipeline Hooks**:
   - `package.json`:
     - `"og:generate": "node scripts/generate-og-cards.js"`
     - `"build": "npm run og:generate && hugo --gc --minify --forceSyncStatic"`

---

## 4. Verification Plan
1. Unit tests in `tests/og-image-generator.test.js`.
2. Generate cards for all existing articles in `content/english/blog/*.md`.
3. Run `hugo` build and verify `head.html` meta tags point to the new dynamic cards.
4. Verify image dimensions (1200×630) and visual rendering via DevTools.
