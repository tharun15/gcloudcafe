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
    it('switches saved articles button to mobile header and hides theme toggle on mobile header', () => {
      expect(headerHtml).toMatch(/data-bookmarks-drawer-trigger[\s\S]*?min-h-\[44px\] min-w-\[44px\] h-11 w-11 sm:h-10 sm:w-10/);
      expect(headerHtml).toContain('components/theme-switcher" (dict "Class" "hidden sm:inline-flex items-center"');
    });

    it('places full-row theme toggle inside the mobile drawer for easy appearance switching', () => {
      expect(headerHtml).toContain('FullRow" true');
      expect(headerHtml).toContain('ID" "mobile-theme-switcher"');
      expect(themeHtml).toContain('Dark / Light Mode');
      expect(themeHtml).toContain('Tap anywhere to switch theme');
    });

    it('preserves full bookmarks drawer access inside the mobile drawer menu', () => {
      expect(headerHtml).toContain('data-bookmarks-drawer-trigger');
      expect(headerHtml).toContain('Saved Articles');
    });

    it('eliminates redundant breadcrumbs on homepage to save vertical space across all viewports', () => {
      expect(indexHtml).not.toContain('aria-label="Breadcrumb"');
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
  describe('5. Technical Deep Dives (Trending Companions) Mobile Fitting & Thumbnails', () => {
    const scssContent = fs.readFileSync(path.join(rootDir, 'assets/scss/mobile-improvements.scss'), 'utf8');

    it('ensures companion thumbnails have valid locked Tailwind classes and companion-thumb class', () => {
      expect(heroHtml).toContain('companion-thumb');
      expect(heroHtml).toContain('w-24 sm:w-28 h-20 sm:h-20');
      expect(heroHtml).not.toContain('w-22');
      expect(heroHtml).not.toContain('h-18');
    });

    it('ensures companion picture and img are locked to cover without blowing up container', () => {
      expect(heroHtml).toContain('.companion-thumb picture');
      expect(heroHtml).toContain('.companion-thumb img');
    });

    it('verifies companion-thumb CSS rules exist in mobile-improvements.scss', () => {
      expect(scssContent).toContain('.companion-thumb');
      expect(scssContent).toContain('min-width: 96px !important;');
      expect(scssContent).toContain('max-width: 96px !important;');
      expect(scssContent).toContain('flex-shrink: 0 !important;');
    });

    it('ensures companion text container uses flex-1 min-w-0 to fit seamlessly on mobile', () => {
      expect(heroHtml).toContain('flex-1 min-w-0 h-full py-0.5');
    });
  });
});
