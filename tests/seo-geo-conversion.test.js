import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SEO, GEO & Reader Conversion Optimization Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');

  it('verifies head.html includes hreflang alternate tags and og:locale support', () => {
    const headPath = path.join(rootDir, 'layouts/partials/essentials/head.html');
    const headContent = fs.readFileSync(headPath, 'utf-8');

    expect(headContent).toContain('rel="alternate" hreflang="{{ .Language.Lang }}"');
    expect(headContent).toContain('rel="alternate" hreflang="x-default"');
    expect(headContent).toContain('og:locale');
  });

  it('verifies generated public HTML includes valid hreflang annotations for en and x-default and canonical integrity', () => {
    const enHome = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');

    expect(enHome).toMatch(/<link\s+[^>]*rel=["']?alternate["']?[^>]*hreflang=["']?en["']?[^>]*>/i);
    expect(enHome).toMatch(/<link\s+[^>]*rel=["']?alternate["']?[^>]*hreflang=["']?x-default["']?[^>]*>/i);

    // Verify /subscribe/ points canonical to /newsletter/ and is noindex so it never triggers duplicate canonical warnings
    const subscribeHtml = fs.readFileSync(path.join(publicDir, 'subscribe/index.html'), 'utf-8');
    expect(subscribeHtml).toMatch(/<link\s+[^>]*rel=["']?canonical["']?[^>]*href=["']?https?:\/\/[^"']+\/newsletter\/["']?/i);
    expect(subscribeHtml).toMatch(/<meta\s+[^>]*name=["']?robots["']?[^>]*content=["']?noindex,\s*follow["']?/i);

    // Verify paginated blog page 2 has self-referencing canonical (/blog/page/2/)
    const page2Path = path.join(publicDir, 'blog/page/2/index.html');
    if (fs.existsSync(page2Path)) {
      const page2Html = fs.readFileSync(page2Path, 'utf-8');
      expect(page2Html).toMatch(/<link\s+[^>]*rel=["']?canonical["']?[^>]*href=["']?https?:\/\/[^"']+\/blog\/page\/2\/["']?/i);
    }
  });

  it('verifies static/llms.txt and static/llms-full.txt are populated with latest articles', () => {
    const llmsTxt = fs.readFileSync(path.join(rootDir, 'static/llms.txt'), 'utf-8');
    const llmsFullTxt = fs.readFileSync(path.join(rootDir, 'static/llms-full.txt'), 'utf-8');

    // Check key series and new articles
    expect(llmsTxt).toContain('TLS Demystified');
    expect(llmsTxt).toContain('Gemini Enterprise Agent Platform');
    expect(llmsTxt).toContain('GCP Data Engineering');
    expect(llmsTxt).not.toContain('https://gcloudcafe.com/it/');

    expect(llmsFullTxt).not.toContain('https://gcloudcafe.com/it/blog/');
    expect(llmsFullTxt).toContain('tls-demystified-part1-cryptography-keys-csr-ca-explained');
    expect(llmsFullTxt).toContain('gemini-agent-platform-express-mode-bootstrapping-offvia');
  });

  it('verifies in-article newsletter conversion card partial and shortcode exist and are integrated', () => {
    const cardPartialPath = path.join(rootDir, 'layouts/partials/components/newsletter-card.html');
    const cardShortcodePath = path.join(rootDir, 'layouts/shortcodes/newsletter-card.html');
    const singleLayoutPath = path.join(rootDir, 'layouts/blog/single.html');

    expect(fs.existsSync(cardPartialPath)).toBe(true);
    expect(fs.existsSync(cardShortcodePath)).toBe(true);

    const singleLayout = fs.readFileSync(singleLayoutPath, 'utf-8');
    expect(singleLayout).toContain('components/newsletter-card.html');

    // Check rendered post in public/
    const samplePostPath = path.join(publicDir, 'blog/tls-demystified-part1-cryptography-keys-csr-ca-explained/index.html');
    expect(fs.existsSync(samplePostPath)).toBe(true);

    const samplePostHtml = fs.readFileSync(samplePostPath, 'utf-8');
    expect(samplePostHtml).toContain('blog-newsletter-card');
  });

  it('verifies seo-schema.html supports FAQPage JSON-LD schema generation', () => {
    const schemaPath = path.join(rootDir, 'layouts/partials/seo-schema.html');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    expect(schemaContent).toContain('@type": "FAQPage"');
    expect(schemaContent).toContain('.Params.faqs');
  });
});
