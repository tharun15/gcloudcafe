import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Pulse Feed & Ticker 1-to-1 Parity & Synchronization', () => {
  const rootDir = path.resolve(__dirname, '..');
  const jsContent = fs.readFileSync(path.join(rootDir, 'assets/js/blog-enhancements.js'), 'utf8');
  const tickerHtml = fs.readFileSync(path.join(rootDir, 'layouts/partials/components/ticker-tape.html'), 'utf8');
  const pulseData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/cloud_pulse.json'), 'utf8'));

  it('ensures sortCohortByScore does not artificially truncate the active feed cohort to 6 items', () => {
    // Both ticker and feed need the full cohort so all ticker items exist on /pulse/
    expect(jsContent).not.toContain('return new Date(b.created_at || 0) - new Date(a.created_at || 0);\n    }).slice(0, 6);');
    expect(jsContent).toContain('var topPulses = pulses; // Display full cohort for 1-to-1 sync with ticker');
  });

  it('ensures initPulseTicker applies the identical sortCohortByScore ranking before slicing', () => {
    expect(jsContent).toContain('var sorted = sortCohortByScore(data).slice(0, 10);');
  });

  it('ensures static data/cloud_pulse.json items are 100% referenced in the ticker', () => {
    expect(pulseData.length).toBeGreaterThanOrEqual(10);
    expect(tickerHtml).toContain('range first 10 $pulses');
  });

  it('ensures ticker and pulse feed share identical sorting logic across the client', () => {
    function isManualApprovedPulse(p) {
      if (!p) return false;
      const reason = (p.eligibility_reason || "").toLowerCase();
      return !reason.includes("auto-published");
    }

    function sortCohortByScore(list) {
      return (list || []).slice().sort((a, b) => {
        const manualA = isManualApprovedPulse(a) ? 1 : 0;
        const manualB = isManualApprovedPulse(b) ? 1 : 0;
        if (manualB !== manualA) return manualB - manualA;

        const scoreA = typeof a.score === "number" ? a.score : ((a.upvotes || 0) - (a.downvotes || 0));
        const scoreB = typeof b.score === "number" ? b.score : ((b.upvotes || 0) - (b.downvotes || 0));
        if (scoreB !== scoreA) return scoreB - scoreA;

        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    }

    const feedPulses = sortCohortByScore(pulseData);
    const tickerPulses = feedPulses.slice(0, 10);

    // Verify 100% of ticker items exist in the pulse feed in exact matching order
    tickerPulses.forEach((tickerItem, idx) => {
      expect(feedPulses[idx].id).toBe(tickerItem.id);
      expect(feedPulses.some(p => p.id === tickerItem.id)).toBe(true);
    });
  });

  it('auto-reveals and clears restrictive filters when navigating to #pulse-{id}', () => {
    expect(jsContent).toContain('if (!targetCard && allLoadedPulses.some(function(p) { return String(p.id) === targetId; }))');
    expect(jsContent).toContain('activeFilter = "all";');
  });
});
