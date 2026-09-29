import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('UI/UX Pro Max Design Standards & WCAG 2.2 Verification', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('Issue 1 (Brand Harmony): ensures category tabs and pathway cards use cohesive sky-blue tokens rather than harsh red', () => {
    const indexHtml = fs.readFileSync(path.join(rootDir, 'layouts/index.html'), 'utf8');
    
    // Category tabs
    expect(indexHtml).toContain('category-tab-active');
    expect(indexHtml).not.toContain('border-red-600 dark:border-red-500');
    expect(indexHtml).toContain('text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400');

    // Pathway cards
    expect(indexHtml).not.toContain('hover:border-red-500/60');
    expect(indexHtml).toContain('hover:border-sky-500/60 dark:hover:border-sky-400/60');
    expect(indexHtml).toContain('group-hover:text-sky-600 dark:group-hover:text-sky-400');

    // Newsletter section
    expect(indexHtml).not.toContain('bg-red-600 hover:bg-red-700');
    expect(indexHtml).toContain('bg-sky-600 hover:bg-sky-700');
  });

  it('Issue 2 (Typography): enforces text-wrap: balance and optical tracking (-0.02em) on article headings', () => {
    const customScss = fs.readFileSync(path.join(rootDir, 'assets/scss/custom.scss'), 'utf8');
    expect(customScss).toContain('text-wrap: balance;');
    expect(customScss).toContain('letter-spacing: -0.02em;');
  });

  it('Issue 3 (Accessibility): ensures WCAG 2.2 focus-visible appearance with high-contrast sky ring in dark mode', () => {
    const mobileScss = fs.readFileSync(path.join(rootDir, 'assets/scss/mobile-improvements.scss'), 'utf8');
    expect(mobileScss).toContain(':focus-visible');
    expect(mobileScss).toContain('.dark button:focus-visible');
    expect(mobileScss).toContain('outline: 2px solid #38bdf8');
    expect(mobileScss).toContain('outline-offset: 2px');
  });

  it('Issue 4 (Form Ergonomics): pulse search and filter inputs use sky focus ring tokens', () => {
    const pulseHtml = fs.readFileSync(path.join(rootDir, 'layouts/pulse/single.html'), 'utf8');
    expect(pulseHtml).not.toContain('focus:ring-red-500');
    expect(pulseHtml).toContain('focus:ring-sky-500 focus:border-sky-500');
    expect(pulseHtml).toContain('hover:border-sky-500');
  });
});
