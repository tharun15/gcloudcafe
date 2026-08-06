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
