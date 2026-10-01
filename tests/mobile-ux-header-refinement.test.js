// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mobile View & Header Refinement Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const headerHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/essentials/header.html'), 'utf8');
  const themeHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/components/theme-switcher.html'), 'utf8');
  const heroHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/components/blog-hero.html'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'layouts/index.html'), 'utf8');

  describe('1. Header Vertical Dimensions & Air', () => {
    it('provides enhanced vertical clearance for mobile navigation (h-[68px] sm:h-18)', () => {
      expect(headerHtml).toContain('h-[68px]');
      expect(headerHtml).toContain('sm:h-18');
    });
  });

  describe('2. WCAG 2.5.5 Touch Target Compliance (Minimum 44x44px)', () => {
    it('ensures quick search trigger satisfies 44x44px minimum touch size', () => {
      expect(headerHtml).toContain('min-h-[44px]');
      expect(headerHtml).toContain('min-w-[44px]');
      expect(headerHtml).toContain('h-11 w-11 sm:h-10 sm:w-44');
    });

    it('ensures theme switcher trigger satisfies 44x44px minimum touch size on mobile', () => {
      expect(themeHtml).toContain('min-h-[44px]');
      expect(themeHtml).toContain('min-w-[44px]');
      expect(themeHtml).toContain('h-11 w-11');
    });

    it('ensures mobile menu toggle button satisfies 44x44px minimum touch size', () => {
      expect(headerHtml).toContain('id="mobile-menu-toggle-btn"');
      expect(headerHtml).toContain('min-h-[44px] min-w-[44px] h-11 w-11');
    });

    it('ensures mobile drawer items have 44px+ hit targets for easy tapping', () => {
      expect(headerHtml).toContain('min-h-[48px]');
      expect(headerHtml).toContain('min-h-[44px]');
    });
  });

  describe('3. Decluttering Mobile Header & Screen', () => {
    it('hides redundant bookmark button on mobile header to prevent cramped controls', () => {
      expect(headerHtml).toMatch(/data-bookmarks-drawer-trigger[\s\S]*?hidden sm:inline-flex/);
    });

    it('preserves full bookmarks drawer access inside the mobile drawer menu', () => {
      expect(headerHtml).toContain('data-bookmarks-drawer-trigger');
      expect(headerHtml).toContain('Saved Articles');
    });

    it('hides redundant breadcrumbs on mobile homepage to save vertical space', () => {
      expect(indexHtml).toContain('pt-6 pb-4 hidden sm:block');
    });

    it('refines spotlight hero card padding and limits tags on mobile', () => {
      expect(heroHtml).toContain('p-4 sm:p-6 lg:p-7');
      expect(heroHtml).toContain('hidden sm:inline-flex');
    });
  });

  describe('4. Mobile Menu Toggle Script & Accessibility', () => {
    it('includes proper ARIA attributes on mobile menu toggle button', () => {
      expect(headerHtml).toContain('aria-label="Toggle Navigation Menu"');
      expect(headerHtml).toContain('aria-expanded="false"');
      expect(headerHtml).toContain('aria-controls="mobile-nav-drawer"');
    });

    it('includes client-side toggle script for menu icon and Escape key support', () => {
      expect(headerHtml).toContain('mobile-menu-toggle-btn');
      expect(headerHtml).toContain('mobile-nav-drawer');
      expect(headerHtml).toContain('fa-bars');
      expect(headerHtml).toContain('fa-xmark');
      expect(headerHtml).toContain('Escape');
    });
  });
});
