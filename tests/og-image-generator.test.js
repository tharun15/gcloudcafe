import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import {
  escapeXml,
  wrapText,
  getCategoryTheme,
  buildOgSvg
} from '../scripts/lib/og-card-template.js';
import {
  parseFrontmatter,
  calculateReadingTime,
  generateCardForFile,
  batchGenerateOgCards
} from '../scripts/generate-og-cards.js';

describe('Resvg Rasterization Core', () => {
  it('renders a simple SVG into a 1200x630 PNG buffer', () => {
    const svg = '<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#070b16"/></svg>';
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    expect(pngBuffer).toBeInstanceOf(Buffer);
    expect(pngBuffer.length).toBeGreaterThan(100);
    expect(pngBuffer.subarray(0, 4).toString('hex')).toBe('89504e47');
    expect(pngData.width).toBe(1200);
    expect(pngData.height).toBe(630);
  });
});

describe('OG Template Helpers', () => {
  it('escapes XML characters correctly', () => {
    expect(escapeXml('A & B < C > D "quote" \'single\'')).toBe('A &amp; B &lt; C &gt; D &quot;quote&quot; &apos;single&apos;');
    expect(escapeXml(null)).toBe('');
  });

  it('wraps long titles cleanly into multiple lines with max line constraint', () => {
    const title = 'Data Engineering on GCP (Part 5): Medallion Architecture with Dataform and dbt in Modern Production Cloud Environments';
    const lines = wrapText(title, 36, 3);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines[0]).toBe('Data Engineering on GCP (Part 5):');
    expect(lines.some(l => l.endsWith('...'))).toBe(true);
  });

  it('detects category theme from tags or categories', () => {
    const gcpTheme = getCategoryTheme(['GCP', 'Data Engineering'], ['Google Cloud']);
    expect(gcpTheme.label).toBe('GOOGLE CLOUD · DATA ENGINEERING');
    expect(gcpTheme.accentColor).toBe('#38bdf8'); // sky-400

    const k8sTheme = getCategoryTheme(['K8s', 'Security'], ['Kubernetes']);
    expect(k8sTheme.label).toBe('KUBERNETES');
    expect(k8sTheme.accentColor).toBe('#22d3ee'); // cyan-400

    const awsTheme = getCategoryTheme(['AWS', 'Lambda'], ['Architecture']);
    expect(awsTheme.label).toBe('AWS');
    expect(awsTheme.accentColor).toBe('#fbbf24'); // amber-400
  });

  it('generates valid 1200x630 SVG with embedded metadata that resvg compiles', () => {
    const svg = buildOgSvg({
      title: 'Kubernetes v1.37 Hardens Storage',
      description: 'Zero-trust pod controls, emptyDir volume mount security, and runtime constraints.',
      date: 'Oct 08, 2026',
      readingTime: '8 min read',
      tags: ['K8s', 'Security'],
      categories: ['Kubernetes'],
      author: 'Tharun Vempati'
    });

    expect(svg).toContain('<svg width="1200" height="630"');
    expect(svg).toContain('Kubernetes v1.37 Hardens Storage');
    expect(svg).toContain('Tharun Vempati');
    expect(svg).toContain('8 min read');
    expect(svg).toContain('gcloudcafe.com');

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png = resvg.render().asPng();
    expect(png.length).toBeGreaterThan(1000);
  });
});

describe('OG Card Batch Generator', () => {
  it('parses markdown frontmatter correctly', () => {
    const raw = `---
title: "Sample Article Title"
meta_title: "Custom Meta Title"
description: "Sample Description"
tags: ["GCP", "BigQuery"]
categories: ["Google Cloud"]
date: 2026-10-08
author: tharun-vempati
---
Content body with some text here...`;

    const meta = parseFrontmatter(raw);
    expect(meta.title).toBe('Sample Article Title');
    expect(meta.description).toBe('Sample Description');
    expect(meta.tags).toEqual(['GCP', 'BigQuery']);
    expect(meta.categories).toEqual(['Google Cloud']);
    expect(meta.author).toBe('Tharun Vempati');
    expect(meta.date).toBe('Oct 08, 2026');
  });

  it('calculates reading time from word count', () => {
    const shortText = 'word '.repeat(300);
    expect(calculateReadingTime(shortText)).toBe('2 min read');

    const longText = 'word '.repeat(2200);
    expect(calculateReadingTime(longText)).toBe('11 min read');
  });

  it('generates card for single file and caches appropriately', () => {
    const testMdDir = path.resolve(__dirname, '../dist/test-content');
    const testOutDir = path.resolve(__dirname, '../dist/test-og');
    fs.mkdirSync(testMdDir, { recursive: true });
    fs.mkdirSync(testOutDir, { recursive: true });

    const mdFile = path.join(testMdDir, 'test-article.md');
    fs.writeFileSync(mdFile, `---
title: "Test Incremental Card Generation"
description: "Verifying that incremental caching works properly."
tags: ["GCP"]
date: 2026-10-08
author: tharun-vempati
---
Body text.`);

    // First run generates file
    const res1 = generateCardForFile(mdFile, { outputDir: testOutDir, force: false });
    expect(res1.generated).toBe(true);

    const expectedPng = path.join(testOutDir, 'test-article.png');
    expect(fs.existsSync(expectedPng)).toBe(true);
    const pngBuffer = fs.readFileSync(expectedPng);
    expect(pngBuffer.subarray(0, 4).toString('hex')).toBe('89504e47');

    // Second run without force should skip (incremental)
    const res2 = generateCardForFile(mdFile, { outputDir: testOutDir, force: false });
    expect(res2.skipped).toBe(true);

    // Third run with force should regenerate
    const res3 = generateCardForFile(mdFile, { outputDir: testOutDir, force: true });
    expect(res3.generated).toBe(true);

    // Cleanup
    fs.rmSync(testMdDir, { recursive: true, force: true });
    fs.rmSync(testOutDir, { recursive: true, force: true });
  });

  it('ensures Hugo head.html template contains dynamic OG card logic', () => {
    const headPath = path.resolve(__dirname, '../layouts/partials/essentials/head.html');
    const headContent = fs.readFileSync(headPath, 'utf8');

    expect(headContent).toContain('dynamicOgRel := printf "images/og/%s.png" $slug');
    expect(headContent).toContain('fileExists $dynamicOgStatic');
    expect(headContent).toContain('if .Params.og_image');
  });
});
