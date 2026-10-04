import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..');

describe('Platform Audit Regression Suite', () => {

  describe('1. JavaScript Runtime Integrity', () => {
    it('ensures initDevTerminalBlocks defines or accesses escapeHtml safely without reference errors', () => {
      const jsPath = path.join(projectRoot, 'assets/js/blog-enhancements.js');
      expect(fs.existsSync(jsPath)).toBe(true);

      const content = fs.readFileSync(jsPath, 'utf-8');
      expect(content).toContain('function initDevTerminalBlocks()');

      // Extract the body of initDevTerminalBlocks
      const fnStart = content.indexOf('function initDevTerminalBlocks()');
      const fnBody = content.slice(fnStart, fnStart + 1500);

      expect(fnBody).toContain('escapeHtml');
      // Must contain a safe local definition or handle string escape
      expect(fnBody).toMatch(/function\s+escapeHtml/);
    });
  });

  describe('2. Image Optimization & Payload Regression Gates', () => {
    it('ensures high-resolution exam setup screenshots in passing-openshift-administartor-exam-part-1 use optimized webp format', () => {
      const enPost = path.join(projectRoot, 'content/english/blog/passing-openshift-administartor-exam-part-1.md');
      const itPost = path.join(projectRoot, 'content/italian/blog/passing-openshift-administartor-exam-part-1.md');

      const enContent = fs.readFileSync(enPost, 'utf-8');
      const itContent = fs.readFileSync(itPost, 'utf-8');

      expect(enContent).toContain('/images/post3-envsetup-1.webp');
      expect(enContent).toContain('/images/post3-essentials-2.webp');
      expect(enContent).not.toContain('/images/post3-envsetup-1.png');
      expect(enContent).not.toContain('/images/post3-essentials-2.png');

      expect(itContent).toContain('/images/post3-envsetup-1.webp');
      expect(itContent).toContain('/images/post3-essentials-2.webp');
      expect(itContent).not.toContain('/images/post3-envsetup-1.png');
      expect(itContent).not.toContain('/images/post3-essentials-2.png');
    });

    it('asserts webp image assets are compressed under 200 KB', () => {
      const files = [
        path.join(projectRoot, 'static/images/post3-envsetup-1.webp'),
        path.join(projectRoot, 'static/images/post3-essentials-2.webp')
      ];

      for (const fp of files) {
        expect(fs.existsSync(fp)).toBe(true);
        const stats = fs.statSync(fp);
        expect(stats.size).toBeLessThan(150 * 1024); // Under 150 KB
      }
    });

    it('ensures no inline content image references files larger than 2.5 MB', () => {
      const contentDir = path.join(projectRoot, 'content');
      const mdFiles = [];

      function findMd(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) findMd(full);
          else if (entry.name.endsWith('.md')) mdFiles.push(full);
        }
      }
      findMd(contentDir);

      const heavyRefs = [];
      for (const mf of mdFiles) {
        const text = fs.readFileSync(mf, 'utf-8');
        const matches = text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g);
        for (const m of matches) {
          const rawUrl = m[1].split('?')[0].split('#')[0];
          if (rawUrl.startsWith('/images/')) {
            const relImg = rawUrl.replace('/images/', '');
            const staticPath = path.join(projectRoot, 'static/images', relImg);
            const assetPath = path.join(projectRoot, 'assets/images', relImg);

            let sz = 0;
            if (fs.existsSync(staticPath)) sz = fs.statSync(staticPath).size;
            else if (fs.existsSync(assetPath)) sz = fs.statSync(assetPath).size;

            if (sz > 2.5 * 1024 * 1024) {
              heavyRefs.push({ file: path.relative(projectRoot, mf), img: rawUrl, sizeMB: (sz / (1024 * 1024)).toFixed(2) });
            }
          }
        }
      }

      expect(heavyRefs).toEqual([]);
    });
  });

  describe('3. Core Web Vitals (CLS) & Explicit Image Dimensions', () => {
    it('ensures author avatars in blog components have explicit width and height attributes', () => {
      const blogHero = fs.readFileSync(path.join(projectRoot, 'layouts/partials/components/blog-hero.html'), 'utf-8');
      const blogCard = fs.readFileSync(path.join(projectRoot, 'layouts/partials/components/blog-card.html'), 'utf-8');
      const aboutList = fs.readFileSync(path.join(projectRoot, 'layouts/about/list.html'), 'utf-8');

      // Blog hero author avatar
      expect(blogHero).toMatch(/<img[^>]*class="[^"]*rounded-full[^"]*"[^>]*width="32"\s+height="32"/);

      // Blog card author avatar
      expect(blogCard).toMatch(/<img[^>]*class="[^"]*rounded-full[^"]*"[^>]*width="24"\s+height="24"/);

      // About page lead avatar
      expect(aboutList).toMatch(/<img[^>]*profilepic_tharun[^>]*width="128"\s+height="128"/);
    });
  });

  describe('4. Accessibility & Semantic Document Outline', () => {
    it('ensures series playlist widget uses h2 instead of skipping directly to h3', () => {
      const spPath = path.join(projectRoot, 'layouts/partials/components/series-playlist.html');
      const content = fs.readFileSync(spPath, 'utf-8');

      expect(content).toContain('<h2 class="text-lg font-black tracking-tight text-slate-900 dark:text-white">');
      expect(content).not.toContain('<h3 class="text-lg font-black tracking-tight text-slate-900 dark:text-white">');
    });

    it('ensures navbar brand and search trigger have accessible labels that align with visible text', () => {
      const headerPath = path.join(projectRoot, 'layouts/partials/essentials/header.html');
      const content = fs.readFileSync(headerPath, 'utf-8');

      expect(content).toContain('aria-label="GCloudCafe — Cloud, DevOps, Architecture"');
      expect(content).toContain('aria-label="Search & Menu (Ctrl+K)"');
    });
  });

});
