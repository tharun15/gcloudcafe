import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Window } from 'happy-dom';

describe('Series Page Masterclass Curriculum Hub', () => {
  let templateContent;

  beforeAll(() => {
    const templatePath = path.resolve(__dirname, '../layouts/series/list.html');
    templateContent = fs.readFileSync(templatePath, 'utf8');
  });

  it('eliminates hardcoded spotlight series key in template', () => {
    // Should NOT have hardcoded $featuredSeriesKey := "TLS & mTLS..."
    expect(templateContent).not.toContain('{{ $featuredSeriesKey := "TLS & mTLS Architecture for DevOps Engineers" }}');
    // Should dynamically determine $featuredSeriesKey
    expect(templateContent).toContain('.Params.featured');
    expect(templateContent).toContain('$featuredSeriesKey');
  });

  it('removes jarring inline red button styles', () => {
    expect(templateContent).not.toContain('style="background-color: #dc2626 !important; color: #ffffff !important;"');
  });

  it('contains structured syllabus flow and step badges', () => {
    expect(templateContent).toContain('Curriculum Syllabus &amp; Learning Flow:');
    expect(templateContent).toContain('printf "%02d" (add $idx 1)');
    expect(templateContent).toContain('Production Lab');
    expect(templateContent).toContain('Core Architecture');
  });

  it('includes interactive domain filter buttons and client-side filtering script', () => {
    expect(templateContent).toContain('data-series-filter="all"');
    expect(templateContent).toContain('data-series-filter="google-cloud"');
    expect(templateContent).toContain('data-series-filter="security"');
    expect(templateContent).toContain('data-series-filter="devops"');
    expect(templateContent).toContain('series-filter-btn');
    expect(templateContent).toContain('data-domains');
  });

  it('renders series cards with curriculum lesson drawers and clean typography', () => {
    expect(templateContent).toContain('series-card-drawer');
    expect(templateContent).toContain('Syllabus &amp; Lessons');
    expect(templateContent).toContain('Start Track');
  });
});
