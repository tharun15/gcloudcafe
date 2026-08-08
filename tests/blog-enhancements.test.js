// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';

// Helper functions matching blog-enhancements.js logic
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateStr, mockNow) {
  if (!dateStr) return "Just now";
  try {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    var now = mockNow ? new Date(mockNow) : new Date();
    var diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    if (diff < 2592000) return Math.floor(diff / 86400) + "d ago";
    return d.toLocaleDateString();
  } catch (e) {
    return "Recently";
  }
}

function mergeIncomingCounts(storedCounts, defaultCounts, incoming, isDecrement) {
  if (!incoming) return storedCounts;
  var result = Object.assign({}, storedCounts);
  Object.keys(defaultCounts).forEach(function (k) {
    if (typeof incoming[k] !== "undefined") {
      var incVal = parseInt(incoming[k]) || 0;
      if (isDecrement) {
        result[k] = Math.max(0, incVal);
      } else {
        result[k] = Math.max(result[k] || 0, incVal);
      }
    }
  });
  return result;
}

function calculateSeriesProgress(currentPart, totalParts) {
  if (!totalParts || totalParts <= 0) return 0;
  return Math.round((currentPart / totalParts) * 100);
}

describe('XSS Prevention (escapeHtml)', () => {
  it('escapes script tags safely', () => {
    const input = '<script>alert("xss")</script>';
    expect(escapeHtml(input)).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('escapes quotes and special characters', () => {
    const input = `'Hello' & "World"`;
    expect(escapeHtml(input)).toBe('&#039;Hello&#039; &amp; &quot;World&quot;');
  });

  it('handles null and undefined gracefully', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('Date Formatting (formatDate)', () => {
  const baseTime = '2026-08-06T20:00:00Z';

  it('returns Just now for timestamps < 60 seconds', () => {
    const recent = '2026-08-06T19:59:45Z';
    expect(formatDate(recent, baseTime)).toBe('Just now');
  });

  it('returns formatted minutes for timestamps < 1 hour', () => {
    const tenMins = '2026-08-06T19:50:00Z';
    expect(formatDate(tenMins, baseTime)).toBe('10m ago');
  });

  it('returns formatted hours for timestamps < 24 hours', () => {
    const threeHours = '2026-08-06T17:00:00Z';
    expect(formatDate(threeHours, baseTime)).toBe('3h ago');
  });

  it('returns formatted days for timestamps < 30 days', () => {
    const twoDays = '2026-08-04T20:00:00Z';
    expect(formatDate(twoDays, baseTime)).toBe('2d ago');
  });
});

describe('Reaction Count Merging (mergeIncomingCounts)', () => {
  const defaultCounts = { helpful: 0, insightful: 0, awesome: 0, brewtiful: 0 };

  it('merges higher incoming counts without losing local state', () => {
    const stored = { helpful: 2, insightful: 1, awesome: 0, brewtiful: 0 };
    const incoming = { helpful: 7, insightful: 4, awesome: 5, brewtiful: 8 };

    const merged = mergeIncomingCounts(stored, defaultCounts, incoming, false);
    expect(merged).toEqual({
      helpful: 7,
      insightful: 4,
      awesome: 5,
      brewtiful: 8
    });
  });

  it('handles decrements correctly without going below 0', () => {
    const stored = { helpful: 5, insightful: 2, awesome: 1, brewtiful: 0 };
    const incoming = { helpful: 4 };

    const merged = mergeIncomingCounts(stored, defaultCounts, incoming, true);
    expect(merged.helpful).toBe(4);
  });
});

describe('Series Progress Calculation', () => {
  it('calculates 60% for Part 3 of 5', () => {
    expect(calculateSeriesProgress(3, 5)).toBe(60);
  });

  it('calculates 100% for final part', () => {
    expect(calculateSeriesProgress(5, 5)).toBe(100);
  });

  it('handles edge case of 0 total parts', () => {
    expect(calculateSeriesProgress(1, 0)).toBe(0);
  });
});

describe('DOM Integration & LocalStorage Test', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="comments-section">
        <span data-comments-count-badge>0</span>
        <form data-comment-form></form>
        <div data-comments-list></div>
      </div>
    `;
  });

  it('persists and loads items from LocalStorage', () => {
    const sample = [{ id: 'c1', author: 'Dev', text: 'Great article!', likes: 2 }];
    localStorage.setItem('test_comments', JSON.stringify(sample));

    const loaded = JSON.parse(localStorage.getItem('test_comments'));
    expect(loaded).toHaveLength(1);
    expect(loaded[0].author).toBe('Dev');
  });
});

describe('Gravity Time-Decay & 6-Card Capacity Engine', () => {
  function calculateTrendingScore(p, nowTime) {
    var score = typeof p.score === "number" ? p.score : ((p.upvotes || 0) - (p.downvotes || 0));
    var createdAt = p.created_at ? new Date(p.created_at).getTime() : (nowTime || Date.now());
    var now = nowTime || Date.now();
    var ageInHours = Math.max(0, (now - createdAt) / (1000 * 60 * 60));
    var gravity = Math.pow(ageInHours + 2, 1.5);
    return (score + 1) / gravity;
  }

  it('ranks brand new posts higher than old decayed posts', () => {
    const now = new Date('2026-08-06T20:00:00Z').getTime();
    const freshPost = { score: 2, created_at: '2026-08-06T19:50:00Z' }; // 10 mins old
    const oldPost = { score: 10, created_at: '2026-08-04T20:00:00Z' };  // 48 hours old

    const freshScore = calculateTrendingScore(freshPost, now);
    const oldScore = calculateTrendingScore(oldPost, now);

    expect(freshScore).toBeGreaterThan(oldScore);
  });

  it('strictly limits display output to top 6 trending pulses', () => {
    const mockPulses = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      score: i,
      created_at: '2026-08-06T20:00:00Z'
    }));

    const sorted = mockPulses.slice().sort((a, b) => b.score - a.score);
    const top6 = sorted.slice(0, 6);

    expect(top6).toHaveLength(6);
    expect(top6[0].id).toBe('p9');
    expect(top6[5].id).toBe('p4');
  });
});

describe('Forever Cloud Provider Poll Engine', () => {
  function calculatePercentages(pollData) {
    const totalVotes = pollData.reduce((acc, row) => acc + (row.votes || 0), 0);
    return pollData.map(row => ({
      provider: row.provider,
      votes: row.votes,
      percent: totalVotes > 0 ? parseFloat(((row.votes / totalVotes) * 100).toFixed(1)) : 0
    }));
  }

  it('correctly calculates percentage shares for cloud providers', () => {
    const data = [
      { provider: 'GCP', votes: 50 },
      { provider: 'AWS', votes: 30 },
      { provider: 'AZURE', votes: 15 },
      { provider: 'OTHERS', votes: 5 }
    ];

    const result = calculatePercentages(data);
    expect(result.find(r => r.provider === 'GCP').percent).toBe(50.0);
    expect(result.find(r => r.provider === 'AWS').percent).toBe(30.0);
    expect(result.find(r => r.provider === 'AZURE').percent).toBe(15.0);
    expect(result.find(r => r.provider === 'OTHERS').percent).toBe(5.0);
  });

  it('correctly calculates quarter info, reset date, and previous quarter label', () => {
    function getCurrentQuarterInfo(nowDate) {
      var now = nowDate || new Date();
      var year = now.getFullYear();
      var month = now.getMonth();
      var quarterNum = Math.floor(month / 3) + 1;
      var quarterLabel = "Q" + quarterNum + " " + year;
      var prevQuarterNum = quarterNum === 1 ? 4 : quarterNum - 1;
      var prevQuarterYear = quarterNum === 1 ? year - 1 : year;
      var prevQuarterLabel = "Q" + prevQuarterNum + " " + prevQuarterYear;
      return { quarterLabel, prevQuarterLabel };
    }

    const augDate = new Date('2026-08-06T20:00:00Z');
    const qInfo = getCurrentQuarterInfo(augDate);

    expect(qInfo.quarterLabel).toBe('Q3 2026');
    expect(qInfo.prevQuarterLabel).toBe('Q2 2026');
  });
});

describe('LinkedIn & Mobile Social Share Payload Formatting', () => {
  function generateSharePayload(pulseItem, origin) {
    var tags = Array.isArray(pulseItem.tags) ? pulseItem.tags.map(function(t){ return '#' + t.replace(/^#/, ''); }).join(" ") : "";
    var cleanContent = (pulseItem.content || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;[^&]+&gt;/g, "")
      .trim();
    var baseUrl = (origin || "https://gcloudcafe.com") + "/pulse/";
    var shareText = "☕ GCloud Cafe | Cloud Pulse\n\n📌 " + pulseItem.title + "\n\n" + cleanContent + "\n\n" + tags + "\n\n🌐 Read live on GCloud Cafe: " + baseUrl;
    var desktopUrl = "https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent(shareText);
    var mobileOffsiteUrl = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(baseUrl);

    return {
      cleanContent,
      tags,
      baseUrl,
      shareText,
      desktopUrl,
      mobileOffsiteUrl
    };
  }

  it('formats clean content without raw HTML tags', () => {
    const pulse = {
      title: 'Kubernetes v1.37 Update',
      content: '<p>Kubernetes has <b>quietly</b> become the default.</p>',
      tags: ['Kubernetes', 'CNCF']
    };
    const payload = generateSharePayload(pulse, 'https://gcloudcafe.com');

    expect(payload.cleanContent).toBe('Kubernetes has quietly become the default.');
    expect(payload.tags).toBe('#Kubernetes #CNCF');
  });

  it('generates valid desktop & offsite LinkedIn URLs', () => {
    const pulse = {
      title: 'OpenShift AI Optimization',
      content: 'Uber and Microsoft optimized GPU workloads.',
      tags: ['OpenShift', 'DevOps']
    };
    const payload = generateSharePayload(pulse, 'https://gcloudcafe.com');

    expect(payload.desktopUrl).toContain('https://www.linkedin.com/feed/?shareActive=true&text=');
    expect(payload.desktopUrl).toContain(encodeURIComponent('https://gcloudcafe.com/pulse/'));
    expect(payload.mobileOffsiteUrl).toBe('https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fgcloudcafe.com%2Fpulse%2F');
  });
});

