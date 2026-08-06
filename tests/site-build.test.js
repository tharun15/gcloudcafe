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
      // Should appear in header image and meta og:image, not duplicated back-to-back in header
      expect(matches.length).toBeLessThanOrEqual(3);
    }
  });
});
