# Dynamic Social OpenGraph Image Generation Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated OpenGraph image generator that renders high-converting 1200×630 social preview PNGs for GCloudCafe blog posts, integrates them into Hugo's `<head>` meta tags, and runs incrementally on builds.

**Architecture:** A Node.js CLI script (`scripts/generate-og-cards.js`) parses Markdown frontmatter, calculates word-wrapped typography and category badges into a dark-themed SVG template, and rasterizes it via `@resvg/resvg-js` into `static/images/og/<slug>.png`. Hugo's `head.html` automatically selects the dynamic card for `og:image` and `twitter:image`.

**Tech Stack:** Node.js v20, `@resvg/resvg-js`, Hugo 0.124+, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-08-dynamic-og-image-generator-design.md`](file:///Ubuntu/home/thara/documents/projects/gcloudcafe/docs/superpowers/specs/2026-10-08-dynamic-og-image-generator-design.md)

## Global Constraints

- Output format: PNG 1200×630 pixels.
- Output directory: `static/images/og/<slug>.png`.
- Incremental builds: skip generation if the destination PNG exists and is newer than the Markdown source file unless `--force` is passed.
- Hugo template resolution priority in `head.html`:
  1. `.Params.og_image` (explicit manual override)
  2. `static/images/og/<slug>.png` (dynamic social card)
  3. `.Params.image` (article cover photo)
  4. `/images/og-share.png` (site fallback)
- All XML entities (`&`, `<`, `>`, `"`, `'`) must be safely escaped before SVG compilation.

## Review Focus

- Title overflow: long titles (>70 characters) must wrap cleanly across up to 3 lines without text clipping or overlapping the subtitle.
- Subtitle truncation: descriptions exceeding 2 lines must truncate cleanly with an ellipsis.
- XML entity escaping: titles with `&`, `<`, `>`, quotes, or brackets must not cause SVG parsing errors in `resvg`.
- Cache correctness: touching a markdown file must trigger card regeneration, but untouched files must be skipped.
- Static path resolution: Hugo `fileExists` checks against `static/images/og/<slug>.png`, while emitted URL is `images/og/<slug>.png`.

---

### Task 1: Add `@resvg/resvg-js` Dependency & Test Harness

**Files:**
- Modify: `package.json:26-40`
- Create: `tests/og-image-generator.test.js`

**Interfaces:**
- Produces: `@resvg/resvg-js` installed in `node_modules`.

- [ ] **Step 1: Write failing test in `tests/og-image-generator.test.js` checking `@resvg/resvg-js` availability**

```javascript
import { describe, it, expect } from 'vitest';
import { Resvg } from '@resvg/resvg-js';

describe('Resvg Rasterization Core', () => {
  it('renders a simple SVG into a 1200x630 PNG buffer', () => {
    const svg = '<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#070b16"/></svg>';
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    expect(pngBuffer).toBeInstanceOf(Buffer);
    expect(pngBuffer.length).toBeGreaterThan(100);
    // Check PNG signature: \x89PNG\r\n\x1a\n
    expect(pngBuffer.slice(0, 4).toString('hex')).toBe('89504e47');
    expect(pngData.width).toBe(1200);
    expect(pngData.height).toBe(630);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && npx vitest run tests/og-image-generator.test.js"`
Expected: FAIL with Cannot find module `@resvg/resvg-js`

- [ ] **Step 3: Install `@resvg/resvg-js` in `devDependencies`**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && npm install -D @resvg/resvg-js"`

- [ ] **Step 4: Run test to verify it passes**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && npx vitest run tests/og-image-generator.test.js"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tests/og-image-generator.test.js
git commit -m "chore(deps): add @resvg/resvg-js for dynamic social card generation"
```

---

### Task 2: Build SVG Template & Typography Wrapping Engine

**Files:**
- Create: `scripts/lib/og-card-template.js`
- Modify: `tests/og-image-generator.test.js`

**Interfaces:**
- Produces:
  - `escapeXml(str: string) -> string`
  - `wrapText(text: string, maxCharsPerLine: number, maxLines: number) -> string[]`
  - `getCategoryTheme(tags: string[], categories: string[]) -> { label: string, accentColor: string, borderColor: string, bgGradient: string }`
  - `buildOgSvg(meta: OgCardMetadata) -> string`

- [ ] **Step 1: Add failing unit tests for text wrapping, XML escaping, and category theme in `tests/og-image-generator.test.js`**

```javascript
describe('OG Template Helpers', () => {
  it('escapes XML characters', () => {
    expect(escapeXml('A & B < C > D "quote" \'single\'')).toBe('A &amp; B &lt; C &gt; D &quot;quote&quot; &apos;single&apos;');
  });

  it('wraps long titles cleanly into multiple lines with max line constraint', () => {
    const title = 'Data Engineering on GCP (Part 5): Medallion Architecture with Dataform and dbt in Modern Production Cloud';
    const lines = wrapText(title, 38, 3);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines[0]).toBe('Data Engineering on GCP (Part 5):');
  });

  it('detects category theme from tags or categories', () => {
    const gcpTheme = getCategoryTheme(['GCP', 'Data Engineering'], ['Google Cloud']);
    expect(gcpTheme.label).toBe('GOOGLE CLOUD · DATA ENGINEERING');
    expect(gcpTheme.accentColor).toContain('#38bdf8'); // sky-400
  });

  it('generates valid 1200x630 SVG with embedded metadata', () => {
    const svg = buildOgSvg({
      title: 'Kubernetes v1.37 Hardens Storage',
      description: 'Zero-trust pod controls and emptyDir volume mounts.',
      date: '2026-10-08',
      readingTime: '8 min read',
      tags: ['K8s', 'Security'],
      categories: ['Kubernetes'],
      author: 'Tharun Vempati'
    });
    expect(svg).toContain('<svg width="1200" height="630"');
    expect(svg).toContain('Kubernetes v1.37 Hardens Storage');
    expect(svg).toContain('Tharun Vempati');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && npx vitest run tests/og-image-generator.test.js"`
Expected: FAIL (`buildOgSvg is not defined`)

- [ ] **Step 3: Implement `scripts/lib/og-card-template.js`**

Implement helper functions and the high-impact dark engineering SVG template:
- 1200×630 canvas with rounded inner border.
- Subtle background mesh glow with radial gradients.
- Category pill badge at top.
- Wrapped title in Inter/system-ui bold font (`#f8fafc`).
- Wrapped subtitle in Slate 300 (`#94a3b8`).
- Footer row with Tharun Vempati author avatar/badge, date, read time, and GCloudCafe brand mark.

- [ ] **Step 4: Run test to verify it passes**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && npx vitest run tests/og-image-generator.test.js"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/og-card-template.js tests/og-image-generator.test.js
git commit -m "feat(og): implement dark engineering SVG template and typography engine"
```

---

### Task 3: Build Incremental Batch Processor & CLI Script

**Files:**
- Create: `scripts/generate-og-cards.js`
- Modify: `package.json:7-25`
- Modify: `tests/og-image-generator.test.js`

**Interfaces:**
- Produces:
  - `parseFrontmatter(content: string) -> object`
  - `generateCardForFile(filePath: string, options: object) -> boolean`
  - `batchGenerateOgCards(options: object) -> { generated: number, skipped: number, errors: number }`
  - CLI execution via `node scripts/generate-og-cards.js [--force]`

- [ ] **Step 1: Add failing test for frontmatter parsing and batch processor in `tests/og-image-generator.test.js`**

```javascript
describe('OG Card Batch Generator', () => {
  it('parses markdown frontmatter correctly', () => {
    const raw = `---
title: "Sample Article Title"
description: "Sample Description"
tags: ["GCP", "BigQuery"]
date: 2026-10-08
author: tharun-vempati
---
Content body here...`;
    const meta = parseFrontmatter(raw);
    expect(meta.title).toBe('Sample Article Title');
    expect(meta.description).toBe('Sample Description');
    expect(meta.tags).toEqual(['GCP', 'BigQuery']);
  });

  it('skips regeneration if target PNG is newer than markdown file', () => {
    // Tests incremental cache check
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && npx vitest run tests/og-image-generator.test.js"`
Expected: FAIL (`parseFrontmatter is not defined`)

- [ ] **Step 3: Implement `scripts/generate-og-cards.js`**

- Reads files from `content/english/blog/*.md` (and `content/italian/blog/*.md` with localized output).
- Extracts title, description, tags, categories, author, date, and computes estimated read time from word count.
- Checks if `static/images/og/<slug>.png` exists:
  - If `mtime(png) >= mtime(md)` and not `--force`, skip.
  - Otherwise, render SVG via `buildOgSvg()` and rasterize via `Resvg.render().asPng()` into `static/images/og/<slug>.png`.
- Adds `"og:generate": "node scripts/generate-og-cards.js"` to `package.json` scripts.
- Updates `"build": "npm run og:generate && hugo --gc --minify --forceSyncStatic"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && npx vitest run tests/og-image-generator.test.js"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-og-cards.js package.json tests/og-image-generator.test.js
git commit -m "feat(og): implement incremental batch card generator and npm build hooks"
```

---

### Task 4: Update Hugo OpenGraph Metadata in `head.html`

**Files:**
- Modify: `layouts/partials/essentials/head.html:130-160`
- Modify: `tests/og-image-generator.test.js`

**Interfaces:**
- Consumes: `static/images/og/<slug>.png` generated in Task 3.
- Produces: Updated `<meta property="og:image">` and `<meta name="twitter:image">` pointing to dynamic cards.

- [ ] **Step 1: Add test verifying Hugo head template prioritizes dynamic OG card if present**

Test checks rendered HTML from Hugo to confirm:
- If `static/images/og/<slug>.png` exists, `og:image` is `https://gcloudcafe.com/images/og/<slug>.png`.
- If explicit `og_image` frontmatter is given, it takes precedence.
- If no card exists, falls back to `.Params.image` or `/images/og-share.png`.

- [ ] **Step 2: Run test to verify current state**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && npx vitest run tests/og-image-generator.test.js"`
Expected: FAIL on dynamic card resolution in head template.

- [ ] **Step 3: Update `layouts/partials/essentials/head.html`**

Update lines 130–160 to check:
```html
{{ $imageURL := "" }}
{{ $imageExt := "png" }}
{{ $slug := .File.BaseFileName }}
{{ $dynamicOgRel := printf "images/og/%s.png" $slug }}
{{ $dynamicOgStatic := printf "static/%s" $dynamicOgRel }}

{{ with .Params.og_image }}
  {{ $imageURL = . | absURL }}
  {{ $imageExt = path.Ext . | strings.TrimPrefix "." }}
{{ else if fileExists $dynamicOgStatic }}
  {{ $imageURL = $dynamicOgRel | absURL }}
  {{ $imageExt = "png" }}
{{ else with .Params.image }}
  {{ $imageURL = . | absURL }}
  {{ $imageExt = path.Ext . | strings.TrimPrefix "." }}
{{ else }}
  {{ $imageURL = "images/og-share.png" | absURL }}
{{ end }}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && npx vitest run tests/og-image-generator.test.js"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add layouts/partials/essentials/head.html tests/og-image-generator.test.js
git commit -m "feat(seo): dynamically resolve generated og cards in head meta tags"
```

---

### Task 5: Batch Generate Cards & End-to-End Verification

**Files:**
- Generate: `static/images/og/*.png`
- Verify: Hugo build, test suite, and browser rendering.

- [ ] **Step 1: Execute batch generator for all blog articles**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && node scripts/generate-og-cards.js --force"`
Expected: Generates 20+ PNG cards in `static/images/og/`. Verify PNG files exist and are ~50–150 KB each.

- [ ] **Step 2: Run Hugo build**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && hugo --gc --minify"`
Expected: SUCCESS with 210 pages built.

- [ ] **Step 3: Run full Vitest suite**

Run: `wsl -e bash -c "cd /home/thara/documents/projects/gcloudcafe && npm test"`
Expected: PASS across all 29 test files.

- [ ] **Step 4: Live visual inspection in Chrome DevTools**

Navigate to `http://localhost:1313/images/og/gcp-data-engineering-transformations-dataform-dbt.png` and verify in browser that the card renders with ultra-crisp typography, gradients, and correct metadata.

- [ ] **Step 5: Commit generated cards and final changes**

```bash
git add static/images/og/
git commit -m "feat(og): batch generate social share cards for all active articles"
```
