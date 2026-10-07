import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Google AdSense Program Policy Compliance & Trust Pages Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');

  it('verifies English and Italian trust & policy markdown files exist', () => {
    const requiredFiles = [
      'content/english/pages/privacy-policy.md',
      'content/english/pages/terms-of-service.md',
      'content/english/pages/cookie-policy.md',
      'content/english/pages/disclaimer.md',
      'content/italian/pages/privacy-policy.md',
      'content/italian/pages/terms-of-service.md',
      'content/italian/pages/cookie-policy.md',
      'content/italian/pages/disclaimer.md',
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(rootDir, relPath);
      expect(fs.existsSync(fullPath), `Missing ${relPath}`).toBe(true);
    }
  });

  it('verifies Italian pages _index.md prevents empty container rendering', () => {
    const itIndex = fs.readFileSync(path.join(rootDir, 'content/italian/pages/_index.md'), 'utf-8');
    expect(itIndex).toContain('render: never');
    expect(itIndex).toContain('list: never');
  });

  it('verifies public builds all English and Italian legal policy pages', () => {
    const publicPages = [
      'privacy-policy/index.html',
      'terms-of-service/index.html',
      'cookie-policy/index.html',
      'disclaimer/index.html',
      'it/privacy-policy/index.html',
      'it/terms-of-service/index.html',
      'it/cookie-policy/index.html',
      'it/disclaimer/index.html',
    ];

    for (const relPath of publicPages) {
      const fullPath = path.join(publicDir, relPath);
      expect(fs.existsSync(fullPath), `Missing public page ${relPath}`).toBe(true);
      const html = fs.readFileSync(fullPath, 'utf-8');
      expect(html.length).toBeGreaterThan(1000);
    }
  });

  it('verifies ads.txt exists and contains valid Google AdSense authorized seller record', () => {
    const adsTxtPath = path.join(rootDir, 'static/ads.txt');
    expect(fs.existsSync(adsTxtPath)).toBe(true);
    const content = fs.readFileSync(adsTxtPath, 'utf-8');
    expect(content).toMatch(/google\.com,\s*pub-2923963189049867,\s*DIRECT,\s*f08c47fec0942fa0/);
  });

  it('verifies robots.txt explicitly allows Mediapartners-Google crawler and Googlebot', () => {
    const robotsPath = path.join(rootDir, 'static/robots.txt');
    expect(fs.existsSync(robotsPath)).toBe(true);
    const content = fs.readFileSync(robotsPath, 'utf-8');
    expect(content).toContain('User-agent: Mediapartners-Google');
    expect(content).toContain('User-agent: Googlebot');
  });

  it('verifies AdSense script is present on public pages but gated from 404 and admin pages', () => {
    const pubSnippet = 'ca-pub-2923963189049867';

    // Present on home and article pages
    const homeHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
    expect(homeHtml).toContain(pubSnippet);

    const itHomeHtml = fs.readFileSync(path.join(publicDir, 'it/index.html'), 'utf-8');
    expect(itHomeHtml).toContain(pubSnippet);

    // Gated from 404 page
    const notFoundHtml = fs.readFileSync(path.join(publicDir, '404.html'), 'utf-8');
    expect(notFoundHtml).not.toContain(pubSnippet);

    // Gated from admin pages if rendered
    const adminPath = path.join(publicDir, 'admin-articles/index.html');
    if (fs.existsSync(adminPath)) {
      const adminHtml = fs.readFileSync(adminPath, 'utf-8');
      expect(adminHtml).not.toContain(pubSnippet);
    }
  });

  it('verifies zero broken internal links across the entire public HTML build', () => {
    const htmlFiles = [];
    function scan(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) scan(full);
        else if (entry.name.endsWith('.html')) htmlFiles.push(full);
      }
    }
    scan(publicDir);

    const allPaths = new Set();
    function indexDir(dir, prefix) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        allPaths.add(rel);
        if (entry.isDirectory()) indexDir(path.join(dir, entry.name), rel);
      }
    }
    indexDir(publicDir, '');

    const broken = [];
    const linkRegex = /href=(?:"([^"#?\s>]+)"|'([^'#?\s>]+)'|([^"'#?\s>]+))/gi;

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        let url = match[1] || match[2] || match[3];
        if (!url) continue;
        if (
          url.startsWith('http://') ||
          url.startsWith('https://') ||
          url.startsWith('mailto:') ||
          url.startsWith('tel:') ||
          url.startsWith('javascript:') ||
          url.startsWith('data:')
        ) continue;

        url = url.split('#')[0].split('?')[0];
        if (!url || url === '/') continue;

        let target = url.startsWith('/') ? url.slice(1) : url;
        if (target.endsWith('/')) target = target.slice(0, -1);

        const exists =
          allPaths.has(target) ||
          allPaths.has(`${target}/index.html`) ||
          allPaths.has(`${target}.html`);

        if (!exists) {
          broken.push(`${path.relative(publicDir, file)} -> ${url}`);
        }
      }
    }

    expect(broken, `Found broken links: ${JSON.stringify(broken, null, 2)}`).toHaveLength(0);
  });
});
