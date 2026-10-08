import { describe, it, expect } from 'vitest';
import { Resvg } from '@resvg/resvg-js';
import {
  escapeXml,
  wrapText,
  getCategoryTheme,
  buildOgSvg
} from '../scripts/lib/og-card-template.js';

describe('Resvg Rasterization Core', () => {
  it('renders a simple SVG into a 1200x630 PNG buffer', () => {
    const svg = '<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#070b16"/></svg>';
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    expect(pngBuffer).toBeInstanceOf(Buffer);
    expect(pngBuffer.length).toBeGreaterThan(100);
    expect(pngBuffer.subarray(0, 4).toString('hex')).toBe('89504e47');
    expect(pngData.width).toBe(1200);
    expect(pngData.height).toBe(630);
  });
});

describe('OG Template Helpers', () => {
  it('escapes XML characters correctly', () => {
    expect(escapeXml('A & B < C > D "quote" \'single\'')).toBe('A &amp; B &lt; C &gt; D &quot;quote&quot; &apos;single&apos;');
    expect(escapeXml(null)).toBe('');
  });

  it('wraps long titles cleanly into multiple lines with max line constraint', () => {
    const title = 'Data Engineering on GCP (Part 5): Medallion Architecture with Dataform and dbt in Modern Production Cloud Environments';
    const lines = wrapText(title, 36, 3);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines[0]).toBe('Data Engineering on GCP (Part 5):');
    expect(lines.some(l => l.endsWith('...'))).toBe(true);
  });

  it('detects category theme from tags or categories', () => {
    const gcpTheme = getCategoryTheme(['GCP', 'Data Engineering'], ['Google Cloud']);
    expect(gcpTheme.label).toBe('GOOGLE CLOUD · DATA ENGINEERING');
    expect(gcpTheme.accentColor).toBe('#38bdf8'); // sky-400

    const k8sTheme = getCategoryTheme(['K8s', 'Security'], ['Kubernetes']);
    expect(k8sTheme.label).toBe('KUBERNETES');
    expect(k8sTheme.accentColor).toBe('#22d3ee'); // cyan-400

    const awsTheme = getCategoryTheme(['AWS', 'Lambda'], ['Architecture']);
    expect(awsTheme.label).toBe('AWS');
    expect(awsTheme.accentColor).toBe('#fbbf24'); // amber-400
  });

  it('generates valid 1200x630 SVG with embedded metadata that resvg compiles', () => {
    const svg = buildOgSvg({
      title: 'Kubernetes v1.37 Hardens Storage',
      description: 'Zero-trust pod controls, emptyDir volume mount security, and runtime constraints.',
      date: 'Oct 08, 2026',
      readingTime: '8 min read',
      tags: ['K8s', 'Security'],
      categories: ['Kubernetes'],
      author: 'Tharun Vempati'
    });

    expect(svg).toContain('<svg width="1200" height="630"');
    expect(svg).toContain('Kubernetes v1.37 Hardens Storage');
    expect(svg).toContain('Tharun Vempati');
    expect(svg).toContain('8 min read');
    expect(svg).toContain('gcloudcafe.com');

    // Test that resvg can render this SVG without syntax errors
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png = resvg.render().asPng();
    expect(png.length).toBeGreaterThan(1000);
  });
});
