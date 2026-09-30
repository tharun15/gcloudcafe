import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Cloud Pulse Newsroom UX Redesign (Full-Width & Unified Command Deck)', () => {
  let singleTemplate;
  let listTemplate;

  beforeAll(() => {
    const singlePath = path.resolve(__dirname, '../layouts/pulse/single.html');
    const listPath = path.resolve(__dirname, '../layouts/pulse/list.html');
    singleTemplate = fs.readFileSync(singlePath, 'utf8');
    listTemplate = fs.readFileSync(listPath, 'utf8');
  });

  it('eliminates cramped 8-col feed and 4-col sidebar layout', () => {
    // Should NOT have split columns eating 33% of the viewport on desktop
    expect(singleTemplate).not.toContain('lg:col-span-8');
    expect(singleTemplate).not.toContain('lg:col-span-4');
    expect(listTemplate).not.toContain('lg:col-span-8');
    expect(listTemplate).not.toContain('lg:col-span-4');
  });

  it('provides high-density 3-column responsive card grid (lg:grid-cols-3)', () => {
    expect(singleTemplate).toContain('lg:grid-cols-3');
    expect(listTemplate).toContain('lg:grid-cols-3');
  });

  it('contains streamlined unified command and filter deck with search and sort', () => {
    expect(singleTemplate).toContain('id="pulse-search-input"');
    expect(singleTemplate).toContain('id="pulse-sort-controls"');
    expect(singleTemplate).toContain('data-pulse-sort="trending"');
    expect(singleTemplate).toContain('data-pulse-sort="recent"');
  });

  it('preserves all provider and domain filter rails with exact data attributes', () => {
    expect(singleTemplate).toContain('id="pulse-provider-chips"');
    expect(singleTemplate).toContain('data-pulse-provider="all"');
    expect(singleTemplate).toContain('data-pulse-provider="gcp"');
    expect(singleTemplate).toContain('data-pulse-provider="aws"');
    expect(singleTemplate).toContain('data-pulse-provider="azure"');
    expect(singleTemplate).toContain('data-pulse-provider="openshift"');

    expect(singleTemplate).toContain('id="pulse-domain-chips"');
    expect(singleTemplate).toContain('data-pulse-domain="all"');
    expect(singleTemplate).toContain('data-pulse-domain="kubernetes"');
    expect(singleTemplate).toContain('data-pulse-domain="devops"');
    expect(singleTemplate).toContain('data-pulse-domain="security"');
    expect(singleTemplate).toContain('data-pulse-domain="ai"');
    expect(singleTemplate).toContain('data-pulse-domain="databases"');
  });

  it('positions weekly architecture opinion poll in community discussion section at bottom', () => {
    expect(singleTemplate).toContain('COMMUNITY ARCHITECTURE POLL');
    expect(singleTemplate).toContain('partial "components/weekly-poll.html"');
  });
});
