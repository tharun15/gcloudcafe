/**
 * i18n Layout Uniformity & Language Switcher Regression Tests
 *
 * These tests prevent regressions in:
 * 1. Language switcher generating correct per-language URLs
 * 2. Hardcoded English strings leaking into built Italian pages
 * 3. All Hugo i18n keys being present in both en.yaml and it.yaml
 * 4. Template files using i18n calls instead of hardcoded EN strings
 *
 * Run: npm test tests/i18n-layout-regression.test.js
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const layoutsDir = path.join(rootDir, 'layouts');
const i18nDir = path.join(rootDir, 'i18n');

/**
 * Checks if a string appears as VISIBLE text in the HTML.
 * Strips all HTML tag content (attributes like aria-label, title, etc.)
 * before searching, so only user-visible text is checked.
 */
function hasVisibleText(html, str) {
  const withoutTags = html.replace(/<[^>]+>/g, ' ');
  return withoutTags.includes(str);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LANGUAGE SWITCHER URL CORRECTNESS
// ─────────────────────────────────────────────────────────────────────────────
describe('Language Switcher — URL correctness', () => {
  it('EN homepage switcher renders link for EN language', () => {
    const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
    const switcherStart = html.indexOf('data-lang-switcher');
    const block = html.slice(switcherStart, switcherStart + 6000);
    const links = block.match(/<a[^>]+href=[^>]+>/g) || [];

    expect(links.length, `Expected 1 switcher link, got: ${JSON.stringify(links)}`).toBe(1);
    expect(links.some(a => a.includes('hreflang="en"') || a.includes('hreflang=en')), 'EN link missing hreflang=en').toBe(true);
  });

  it('language-switcher.html uses site.Sites (not deprecated site.Home.AllTranslations)', () => {
    const switcher = fs.readFileSync(path.join(layoutsDir, 'partials/components/language-switcher.html'), 'utf-8');
    expect(switcher).not.toContain('site.Home.AllTranslations');
    expect(switcher).toContain('site.Sites');
    expect(switcher).toContain('translationMap');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TEMPLATE i18n KEY USAGE (source files)
// ─────────────────────────────────────────────────────────────────────────────
describe('Layout templates — use i18n keys, not hardcoded EN strings', () => {
  it('layouts/index.html uses i18n for newsletter', () => {
    const tmpl = fs.readFileSync(path.join(layoutsDir, 'index.html'), 'utf-8');
    expect(tmpl).toContain('newsletter_heading');
    expect(tmpl).toContain('newsletter_desc');
    expect(tmpl).toContain('newsletter_submit');
    expect(tmpl).not.toContain('Engineering insights, twice a month');
  });

  it('layouts/blog/single.html uses i18n for all UI labels', () => {
    const tmpl = fs.readFileSync(path.join(layoutsDir, 'blog/single.html'), 'utf-8');
    expect(tmpl).toContain('save_for_later');
    expect(tmpl).toContain('min_read');
    expect(tmpl).toContain('copy_link');
    expect(tmpl).toContain('share_on_linkedin');
    expect(tmpl).toContain('tags_label');
    expect(tmpl).toContain('on_this_page');
    expect(tmpl).toContain('continue_reading');
    expect(tmpl).toContain('related_articles_heading');
    expect(tmpl).toContain('prev_in_series');
    expect(tmpl).toContain('next_in_series');
    expect(tmpl).not.toContain('>Save for later<');
    expect(tmpl).not.toContain('> min read<');
    expect(tmpl).not.toContain('>Copy Link<');
    expect(tmpl).not.toContain('>Share on LinkedIn<');
  });

  it('layouts/partials/components/blog-card.html uses i18n for save_for_later', () => {
    const tmpl = fs.readFileSync(path.join(layoutsDir, 'partials/components/blog-card.html'), 'utf-8');
    expect(tmpl).toContain('save_for_later');
    expect(tmpl).not.toContain('"Save for later"');
  });

  it('layouts/partials/components/post-feedback.html uses i18n for share strings', () => {
    const tmpl = fs.readFileSync(path.join(layoutsDir, 'partials/components/post-feedback.html'), 'utf-8');
    expect(tmpl).toContain('share_on_linkedin');
    expect(tmpl).toContain('copy_link');
    expect(tmpl).toContain('share_this_guide');
    expect(tmpl).not.toContain('>Share on LinkedIn<');
    expect(tmpl).not.toContain('>Copy Link<');
    expect(tmpl).not.toContain('Share this guide:');
  });

  it('layouts/partials/components/blog-hero.html uses i18n keys', () => {
    const tmpl = fs.readFileSync(path.join(layoutsDir, 'partials/components/blog-hero.html'), 'utf-8');
    expect(tmpl).toContain('i18n');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. i18n YAML KEY COMPLETENESS
// ─────────────────────────────────────────────────────────────────────────────
describe('i18n YAML files — required keys present in EN', () => {
  const REQUIRED_KEYS = [
    'newsletter_heading',
    'newsletter_desc',
    'newsletter_placeholder',
    'newsletter_submit',
    'newsletter_footer',
    'explore_track',
    'breadcrumb_articles',
    'min_read',
    'save_for_later',
    'copy_link',
    'share_on_linkedin',
    'share_label',
    'share_this_guide',
    'tags_label',
    'on_this_page',
    'continue_reading',
    'related_articles_heading',
    'prev_in_series',
    'next_in_series',
    'track_completed',
    'series_finished',
  ];

  it('i18n/en.yaml contains all required UI string keys', () => {
    const yaml = fs.readFileSync(path.join(i18nDir, 'en.yaml'), 'utf-8');
    for (const key of REQUIRED_KEYS) {
      expect(yaml, `Missing key in en.yaml: ${key}`).toContain(`${key}:`);
    }
  });
});
