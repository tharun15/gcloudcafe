import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Social Icons & Fonts Regression Suite', () => {
  it('validates data/social.json uses valid FontAwesome 6 brands classes', () => {
    const socialPath = path.resolve(process.cwd(), 'data', 'social.json');
    expect(fs.existsSync(socialPath)).toBe(true);

    const socialData = JSON.parse(fs.readFileSync(socialPath, 'utf-8'));
    expect(Array.isArray(socialData.main)).toBe(true);
    expect(socialData.main.length).toBeGreaterThanOrEqual(2);

    socialData.main.forEach(item => {
      expect(item.name).toBeDefined();
      expect(item.link).toMatch(/^https?:\/\//);
      expect(item.icon).toMatch(/^fa-brands\s+fa-[^\s]+$|fa/);
    });
  });

  it('validates FontAwesome 6 is self-hosted with font-display swap', () => {
    const scssPath = path.resolve(process.cwd(), 'assets', 'scss', 'fontawesome.scss');
    expect(fs.existsSync(scssPath)).toBe(true);

    const content = fs.readFileSync(scssPath, 'utf-8');
    expect(content).toContain('font-display:swap');
    expect(content).toContain('/fonts/fa-');
  });

  it('validates style.html does not percent-encode Google Fonts family params', () => {
    const stylePath = path.resolve(process.cwd(), 'layouts', 'partials', 'essentials', 'style.html');
    const content = fs.readFileSync(stylePath, 'utf-8');

    expect(content).toContain('safeURL');
    expect(content).not.toContain('fonts.googleapis.com/css2?family=%');
  });
});
