// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Fixes: Dark Mode Persistence, Question of the Week, and Header Subscribe Removal', () => {
  const rootDir = path.resolve(__dirname, '..');

  describe('1. Dark Mode Theme Persistence', () => {
    it('ensures head.html executes instant inline theme initialization to restore saved theme', () => {
      const headHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/essentials/head.html'), 'utf8');
      expect(headHtml).toContain('localStorage.getItem("theme")');
      expect(headHtml).toContain('document.documentElement.classList.add("dark")');
      expect(headHtml).toContain('document.documentElement.classList.remove("dark")');
    });

    it('ensures theme-switcher.html applies theme on load and syncs across inputs and storage events', () => {
      const switcherHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/components/theme-switcher.html'), 'utf8');
      expect(switcherHtml).toContain('applyThemeFromStorage');
      expect(switcherHtml).toContain('syncThemeToggle');
      expect(switcherHtml).toContain('window.addEventListener("storage"');
    });

    it('validates theme resolution logic with localStorage dark preference', () => {
      localStorage.setItem('theme', 'dark');
      const savedTheme = localStorage.getItem('theme');
      let isDark = false;
      if (savedTheme === 'dark') isDark = true;
      else if (savedTheme === 'light') isDark = false;

      document.documentElement.classList.toggle('dark', isDark);
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Navigate / switch to light
      localStorage.setItem('theme', 'light');
      const nextTheme = localStorage.getItem('theme');
      isDark = nextTheme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('2. Question Section Renaming & Prediction Removal', () => {
    it('verifies week 39 poll badge is Question of the Week and contains no prediction references', () => {
      const dataRaw = fs.readFileSync(path.join(rootDir, 'data/weekly_polls.json'), 'utf8');
      const staticRaw = fs.readFileSync(path.join(rootDir, 'static/data/weekly_polls.json'), 'utf8');

      [dataRaw, staticRaw].forEach(raw => {
        const polls = JSON.parse(raw);
        const week39 = polls.find(p => p.id === 'week-2026-39' || p.weekNumber === 39);
        expect(week39).toBeDefined();
        expect(week39.badge).toBe('Question of the Week');

        // Ensure "prediction" does not appear in badges or descriptions
        polls.forEach(p => {
          expect(p.badge?.toLowerCase()).not.toContain('prediction');
          p.options?.forEach(opt => {
            expect(opt.description?.toLowerCase()).not.toContain('prediction');
          });
          if (p.otherOption) {
            expect(p.otherOption.description?.toLowerCase()).not.toContain('prediction');
          }
        });
      });
    });

    it('verifies weekly-poll.html defaults badge to Question of the Week and removes prediction', () => {
      const pollHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/components/weekly-poll.html'), 'utf8');
      expect(pollHtml).toContain('Question of the Week');
      expect(pollHtml.toLowerCase()).not.toContain('prediction');
    });

    it('verifies blog-enhancements.js renders Results and Your Choice instead of Your Prediction', () => {
      const jsContent = fs.readFileSync(path.join(rootDir, 'assets/js/blog-enhancements.js'), 'utf8');
      expect(jsContent).toContain('Results');
      expect(jsContent).toContain('Your Choice');
      expect(jsContent).not.toContain('Your Prediction');
      expect(jsContent).not.toContain('prediction recorded');
    });
  });

  describe('3. Header Subscribe Cleanup & Bottom Page Retention', () => {
    it('ensures header.html does not contain desktop or mobile subscribe buttons', () => {
      const headerHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/essentials/header.html'), 'utf8');
      expect(headerHtml).not.toContain('<!-- Subscribe Button (Desktop/Tablet) -->');
      expect(headerHtml).not.toContain('<!-- Mobile Subscribe CTA -->');
      expect(headerHtml).not.toContain('Subscribe to Cloud Pulse');
      expect(headerHtml).not.toContain('<span>Subscribe</span>');
    });

    it('ensures homepage retains newsletter subscription form near the bottom of the page', () => {
      const indexHtml = fs.readFileSync(path.join(rootDir, 'layouts/index.html'), 'utf8');
      expect(indexHtml).toContain('data-supabase-subscribe');
      expect(indexHtml).toContain('Engineering insights, twice a month');
      expect(indexHtml).toContain('Subscribe');
    });
  });
});
