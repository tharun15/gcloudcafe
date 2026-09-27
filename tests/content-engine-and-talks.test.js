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
    expect(html).toContain('id="reset-content-ideas-btn"');
    expect(html).toContain('id="content-ideas-grid"');
    expect(html).toContain('id="vault-content-grid"');
    expect(html).toContain('Housekeeping: Top 5 Active');
    expect(html).toContain('Generate 1 Fresh Topic');
  });

  it('verifies Talk & Speaker Hub view includes conference venue selector, CFP proposals grid, and permanent vault', () => {
    const html = fs.readFileSync(adminLayoutPath, 'utf-8');

    expect(html).toContain('id="section-talk-ideas"');
    expect(html).toContain('id="talk-venue-select"');
    expect(html).toContain('id="generate-talk-ideas-btn"');
    expect(html).toContain('id="reset-talk-ideas-btn"');
    expect(html).toContain('id="talk-ideas-grid"');
    expect(html).toContain('id="vault-talks-grid"');
    expect(html).toContain('Conference, Meetup &amp; Webinar Talk Proposals');
    expect(html).toContain('Generate 1 Fresh Talk');
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

  it('verifies automatic state reload upon switching tabs and dashboard unlocking', () => {
    const js = fs.readFileSync(jsEnhancementsPath, 'utf-8');

    // switchAdminTab must automatically re-render both active and vault grids
    expect(js).toContain('activeTab === tabContentEngineBtn');
    expect(js).toContain('activeTab === tabTalksBtn');
    expect(js).toContain('renderContentIdeas()');
    expect(js).toContain('renderTalkIdeas()');
    expect(js).toContain('renderPermanentContentVault()');
    expect(js).toContain('renderPermanentTalksVault()');
  });

  it('verifies 1-at-a-time FIFO rotation logic without replacing all 5 proposals', () => {
    const js = fs.readFileSync(jsEnhancementsPath, 'utf-8');

    // Talks generation pushes 1 single talk to top and slices to 5 (FIFO rotation)
    expect(js).toContain('existingTalks.unshift(newSingleTalk)');
    expect(js).toContain('saveEphemeralTalks(existingTalks.slice(0, 5))');

    // Content engine generation pushes 1 single topic to top and slices to 5
    expect(js).toContain('existingList.unshift(newSingleItem)');
    expect(js).toContain('saveEphemeralContentIdeas(existingList.slice(0, 5))');
  });

  it('verifies author-centric categories and grounding research references', () => {
    const js = fs.readFileSync(jsEnhancementsPath, 'utf-8');

    // Categorization from frustrated engineer perspective
    expect(js).toContain('🌲 Evergreen Architectural Core');
    expect(js).toContain('🔥 Latest Viral & Trending');
    expect(js).toContain('🧪 Production War Story / Runbook');
    expect(js).toContain('🎯 High CFP Acceptance Rate');
    expect(js).toContain('whyReviewersAccept');
    expect(js).toContain('slidesOutline');

    // Grounding links (arXiv, NIST, RFC, KEP)
    expect(js).toContain('groundingRefs');
    expect(js).toContain('NIST FIPS 203');
    expect(js).toContain('IETF RFC 8446');
    expect(js).toContain('KEP-1907');
    expect(js).toContain('arXiv:2403.05530');
    expect(js).toContain('fa-book-bookmark');
  });
});
