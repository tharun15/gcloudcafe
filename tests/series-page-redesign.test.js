import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Series Page Masterclass Curriculum Hub', () => {
  let templateContent;

  beforeAll(() => {
    const templatePath = path.resolve(__dirname, '../layouts/series/list.html');
    templateContent = fs.readFileSync(templatePath, 'utf8');
  });

  it('eliminates hardcoded spotlight series key in template', () => {
    expect(templateContent).not.toContain('{{ $featuredSeriesKey := "TLS & mTLS Architecture for DevOps Engineers" }}');
    expect(templateContent).toContain('.Params.featured');
    expect(templateContent).toContain('$featuredSeriesKey');
  });

  it('eliminates cramped 3/4-column card squeeze in favor of spacious 2-column masterclass explorer', () => {
    expect(templateContent).not.toContain('2xl:grid-cols-4');
    expect(templateContent).toContain('lg:grid-cols-2');
    expect(templateContent).toContain('pulse-hero-backdrop');
  });

  it('removes jarring inline red button styles', () => {
    expect(templateContent).not.toContain('style="background-color: #dc2626 !important; color: #ffffff !important;"');
  });

  it('contains structured syllabus flow, always-visible inline roadmap, and step badges', () => {
    expect(templateContent).toContain('data-series-inline-list');
    expect(templateContent).toContain('printf "%02d" $partNum');
    expect(templateContent).toContain('Production Lab');
    expect(templateContent).toContain('Core Architecture');
  });

  it('includes unified command deck with live search, expand-all toggle, and domain filters', () => {
    expect(templateContent).toContain('id="series-search-input"');
    expect(templateContent).toContain('id="series-expand-all-btn"');
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
