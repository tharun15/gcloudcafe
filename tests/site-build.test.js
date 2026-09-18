import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Hugo Site Build & HTML Integrity Tests', () => {
  const publicDir = path.resolve(process.cwd(), 'public');

  it('verifies public directory exists and contains index.html', () => {
    const indexPath = path.join(publicDir, 'index.html');
    const exists = fs.existsSync(indexPath);
    expect(exists).toBe(true);

    if (exists) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('<title>');
      expect(content.toLowerCase()).toContain('gcloudcafe');

      // Verify Header Quick-Pill and Antenna Live Icon
      expect(content).toContain('fa-tower-broadcast');
      expect(content).toContain('Pulse');

      // Verify 1-Tap Homepage Navigation Switcher Bar
      expect(content).toContain('Live Pulse');
      expect(content).toContain('Topics');
    }
  });

  it('verifies EX280 Part 3 blog post renders series playlist and feedback widget', () => {
    const postPath = path.join(publicDir, 'blog', 'ex280-tips-part3', 'index.html');
    if (fs.existsSync(postPath)) {
      const html = fs.readFileSync(postPath, 'utf-8');
      
      // Verify Series Playlist
      expect(html).toContain('Series Playlist');
      expect(html).toContain('Part 3 of 5');

      // Verify Feedback Widget
      expect(html).toContain('data-post-feedback');
      expect(html).toContain('data-reaction-btn');

      // Verify Comments Section
      expect(html).toContain('comments-section');
      expect(html).toContain('Community Discussion');

      // Verify No Duplicate Image Tags in Header
      const matches = (html.match(/images\/post7-dp-tips3\.png/g) || []);
      // Should appear in header image and meta og:image / twitter:image tags
      expect(matches.length).toBeLessThanOrEqual(6);

      // Verify LinkedIn Open Graph & SEO Schema
      expect(html).toContain('property="og:site_name" content="GCloud Cafe"');
      expect(html).toContain('property="og:type" content="article"');
      expect(html).toContain('property="og:image"');
      expect(html).toContain('TechArticle');
    }
  });

  it('verifies subscribe / newsletter page renders live subscription form', () => {
    const newsletterPath = path.join(publicDir, 'newsletter', 'index.html');
    const subscribePath = path.join(publicDir, 'subscribe', 'index.html');

    expect(fs.existsSync(newsletterPath)).toBe(true);
    expect(fs.existsSync(subscribePath)).toBe(true);

    const html = fs.readFileSync(newsletterPath, 'utf-8');
    expect(html).toContain('data-supabase-subscribe');
    expect(html).toContain('data-newsletter-status');
    expect(html).toContain('Get the digest');
    expect(html).toContain('Engineering insights, twice a month');
  });
});
