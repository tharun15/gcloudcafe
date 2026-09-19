import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Import newsletter module methods
const {
  getWeeklyBlogPosts,
  getWeeklyMicroPulses,
  getActiveSubscribers,
  generateDigestSummary,
  generateEmailHtml,
  runWeeklyDigest
} = require('../scripts/weekly-newsletter-digest.js');

describe('Weekly Newsletter Engine & Dispatcher Suite', () => {
  it('parses frontmatter and loads weekly blog posts correctly', () => {
    // In our repository, there are published posts in content/english/blog
    const posts = getWeeklyBlogPosts(365); // Check over year to ensure parser works on real posts
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);

    const firstPost = posts[0];
    expect(firstPost.title).toBeDefined();
    expect(typeof firstPost.title).toBe('string');
    expect(firstPost.url).toContain('/blog/');
    expect(firstPost.date instanceof Date).toBe(true);
  });

  it('generates deterministic digest summary when AI is not configured', async () => {
    const mockPosts = [
      {
        title: 'Understanding Kubernetes Gateway API',
        description: 'Deep dive into Gateway API vs Ingress controllers.',
        url: 'https://gcloudcafe.com/blog/k8s-gateway-api/'
      }
    ];
    const mockPulses = [
      {
        title: 'BigQuery launches continuous queries',
        summary: 'Process real-time streaming data directly in SQL.',
        source: 'Google Cloud Release Notes'
      }
    ];

    const summary = await generateDigestSummary(mockPosts, mockPulses);
    expect(summary).toBeDefined();
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(50);
  });

  it('generates valid ByteDepth-branded responsive HTML email', () => {
    const mockPosts = [
      {
        title: 'Mastering TLS 1.3 Handshake in Distributed Systems',
        description: 'Zero-RTT, forward secrecy, and session resumption demystified.',
        url: 'https://gcloudcafe.com/blog/tls-13-handshake/',
        categories: ['Security', 'Networking'],
        author: 'Engineering Team',
        date: new Date()
      }
    ];

    const mockPulses = [
      {
        title: 'Anthropic releases Claude 3.7 Sonnet hybrid reasoning',
        summary: 'New model delivers frontier performance for complex architecture planning.',
        source: 'AI Architecture Weekly',
        url: 'https://anthropic.com',
        severity: 'high'
      }
    ];

    const html = generateEmailHtml(
      mockPosts,
      mockPulses,
      'This week in Cloud Architecture: TLS 1.3 zero-RTT deployments and Claude 3.7 benchmarks.',
      'user@example.com'
    );

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('GCloudCafe');
    expect(html).toContain('BYTEDEPTH DIGEST');
    expect(html).toContain('Mastering TLS 1.3 Handshake');
    expect(html).toContain('Anthropic releases Claude 3.7');
    expect(html).toContain('Unsubscribe');
    expect(html).toContain('max-width: 600px');
  });

  it('executes dry-run without errors and writes preview files', async () => {
    const result = await runWeeklyDigest({ dryRun: true });
    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.subscribersCount).toBeGreaterThanOrEqual(1);

    const previewPath = path.resolve(process.cwd(), 'dist', 'weekly-newsletter-preview.html');
    expect(fs.existsSync(previewPath)).toBe(true);
    const content = fs.readFileSync(previewPath, 'utf-8');
    expect(content).toContain('BYTEDEPTH DIGEST');
  });
});
