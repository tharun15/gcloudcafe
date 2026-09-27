import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Content Engine & Conference Talk Speaker Hub Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const adminLayoutPath = path.join(rootDir, 'layouts/community-admin/single.html');
  const jsEnhancementsPath = path.join(rootDir, 'assets/js/blog-enhancements.js');

  it('verifies community-admin template includes Content Engine and Talk Hub tabs', () => {
    const html = fs.readFileSync(adminLayoutPath, 'utf-8');

    expect(html).toContain('tab-content-engine-btn');
    expect(html).toContain('tab-talks-btn');
    expect(html).toContain('Content Engine');
    expect(html).toContain('Talk &amp; Speaker Hub');
  });

  it('verifies Content Engine view includes niche selector, Top 5 active grid, and permanent vault', () => {
    const html = fs.readFileSync(adminLayoutPath, 'utf-8');

    expect(html).toContain('id="section-content-engine"');
    expect(html).toContain('id="content-engine-niche-select"');
    expect(html).toContain('id="generate-content-ideas-btn"');
    expect(html).toContain('id="content-ideas-grid"');
    expect(html).toContain('id="vault-content-grid"');
    expect(html).toContain('Housekeeping: Top 5 Active');
  });

  it('verifies Talk & Speaker Hub view includes conference venue selector, CFP proposals grid, and permanent vault', () => {
    const html = fs.readFileSync(adminLayoutPath, 'utf-8');

    expect(html).toContain('id="section-talk-ideas"');
    expect(html).toContain('id="talk-venue-select"');
    expect(html).toContain('id="generate-talk-ideas-btn"');
    expect(html).toContain('id="talk-ideas-grid"');
    expect(html).toContain('id="vault-talks-grid"');
    expect(html).toContain('Conference, Meetup &amp; Webinar Talk Proposals');
  });

  it('verifies blog-enhancements.js implements Top 5 housekeeping and permanent vault operations', () => {
    const js = fs.readFileSync(jsEnhancementsPath, 'utf-8');

    expect(js).toContain('gcloudcafe_ephemeral_content_ideas');
    expect(js).toContain('gcloudcafe_permanent_content_ideas');
    expect(js).toContain('gcloudcafe_ephemeral_talk_ideas');
    expect(js).toContain('gcloudcafe_permanent_talk_ideas');
    expect(js).toContain('slice(0, 5)');
    expect(js).toContain('switchAdminTab');
    expect(js).toContain('data-save-content-id');
    expect(js).toContain('data-save-talk-id');
    expect(js).toContain('data-delete-vault-id');
  });
});
