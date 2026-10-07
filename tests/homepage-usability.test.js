import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Homepage & Site-Wide Usability Heuristics & Accessibility Suite', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('Issue 3: ensures blog-card hashtags use accessible font size >= 12px (text-xs)', () => {
    const cardHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/components/blog-card.html'), 'utf8');
    expect(cardHtml).not.toContain('text-[10px]');
    expect(cardHtml).toContain('text-xs font-mono');
  });

  it('Issue 4: eliminates long all-caps text in Browse all topics heading and site-wide headings', () => {
    const indexHtml = fs.readFileSync(path.join(rootDir, 'layouts/index.html'), 'utf8');
    expect(indexHtml).not.toContain('BROWSE ALL TOPICS');
    expect(indexHtml).toContain('Browse all topics');

    const newsletterHtml = fs.readFileSync(path.join(rootDir, 'layouts/newsletter/list.html'), 'utf8');
    expect(newsletterHtml).not.toContain('SAMPLE EDITIONS FROM THE ARCHIVE');
    expect(newsletterHtml).toContain('Sample editions from the archive');

    const aboutHtml = fs.readFileSync(path.join(rootDir, 'layouts/about/list.html'), 'utf8');
    expect(aboutHtml).not.toContain('BEHIND THE PUBLICATION');
    expect(aboutHtml).toContain('Behind the publication');
  });

  it('Issue 8: eliminates redundant breadcrumbs on top-level pages to save vertical space while preserving rich breadcrumbs on deep articles', () => {
    const indexHtml = fs.readFileSync(path.join(rootDir, 'layouts/index.html'), 'utf8');
    expect(indexHtml).not.toContain('aria-label="Breadcrumb"');

    const blogListHtml = fs.readFileSync(path.join(rootDir, 'layouts/blog/list.html'), 'utf8');
    expect(blogListHtml).not.toContain('aria-label="Breadcrumb"');

    const aboutHtml = fs.readFileSync(path.join(rootDir, 'layouts/about/list.html'), 'utf8');
    expect(aboutHtml).not.toContain('aria-label="Breadcrumb"');

    const seriesHtml = fs.readFileSync(path.join(rootDir, 'layouts/series/list.html'), 'utf8');
    expect(seriesHtml).not.toContain('aria-label="Breadcrumb"');

    const blogSingleHtml = fs.readFileSync(path.join(rootDir, 'layouts/blog/single.html'), 'utf8');
    expect(blogSingleHtml).toContain('aria-label="breadcrumb"');
    expect(blogSingleHtml).toContain('text-sm font-medium');
  });

  it('Issue 9: optimizes Browse All Topics grid padding, text size, and removes inline styles', () => {
    const indexHtml = fs.readFileSync(path.join(rootDir, 'layouts/index.html'), 'utf8');
    expect(indexHtml).not.toContain('style="border: 1px solid #e2e8f0;"');
    expect(indexHtml).toContain('text-sm sm:text-base font-semibold');
    expect(indexHtml).toContain('px-4 py-3 sm:py-3.5');
  });

  it('Issue 6: aligns header search button with multi-purpose Search & Menu overlay', () => {
    const headerHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/essentials/header.html'), 'utf8');
    expect(headerHtml).toContain('aria-label="Search & Menu (Ctrl+K)"');
    expect(headerHtml).toContain('Search &amp; Menu');
  });

  it('maintains ticker-tape directly below header per user preference with pause on hover', () => {
    const baseofHtml = fs.readFileSync(path.join(rootDir, 'layouts/_default/baseof.html'), 'utf8');
    const headerIndex = baseofHtml.indexOf('essentials/header.html');
    const tickerIndex = baseofHtml.indexOf('components/ticker-tape.html');
    const mainIndex = baseofHtml.indexOf('<main id="main-content"');

    expect(tickerIndex).toBeGreaterThan(headerIndex);
    expect(tickerIndex).toBeLessThan(mainIndex);
  });

  it('renders a creative, non-danger data-first presentation for the Featured hero story', () => {
    const heroHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/components/blog-hero.html'), 'utf8');
    expect(heroHtml).not.toContain('bg-red-600');
    expect(heroHtml).not.toContain('bg-red-500');
    expect(heroHtml).toMatch(/border-amber|spotlight/i);
    expect(heroHtml).toContain('featured-post-title');
  });

  it('Issue 5: ensures search overlay has full viewport scrim and deep drop shadow in custom.scss', () => {
    const scss = fs.readFileSync(path.join(rootDir, 'assets/scss/custom.scss'), 'utf8');
    expect(scss).toContain('.search-modal-overlay');
    expect(scss).toContain('backdrop-filter: blur(8px)');
    expect(scss).toContain('box-shadow: 0 25px 60px -15px');
  });

  it('Issue 2: establishes unified button classes (btn-primary, btn-secondary, btn-ghost)', () => {
    const scss = fs.readFileSync(path.join(rootDir, 'assets/scss/custom.scss'), 'utf8');
    expect(scss).toContain('.btn-primary');
    expect(scss).toContain('.btn-secondary');
    expect(scss).toContain('.btn-ghost');
  });
});
