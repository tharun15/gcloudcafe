import { describe, it, expect } from 'vitest';

// Calculate total reactions from Supabase data rows
function calculateTotalReactions(data) {
  if (!Array.isArray(data) || data.length === 0) return 0;
  var total = 0;
  data.forEach(function (row) {
    total += (parseInt(row.helpful_count) || 0) + 
             (parseInt(row.insightful_count) || 0) + 
             (parseInt(row.awesome_count) || 0) + 
             (parseInt(row.brewtiful_count) || 0);
  });
  return total;
}

function parseContentRangeCount(headerValue, fallbackLength) {
  if (headerValue) {
    var match = headerValue.match(/\/(\d+)/);
    if (match && match[1]) return parseInt(match[1], 10);
  }
  return fallbackLength || 0;
}

function getFeedbackStatusText(totalValue) {
  var t = typeof totalValue === 'number' ? totalValue : 0;
  return {
    countText: t + (t === 1 ? " VOTE" : " VOTES"),
    statusText: t > 0 ? "● LIVE FEEDBACK" : "╯ NO VOTES YET"
  };
}

describe('Database Telemetry Stats Suite', () => {
  it('aggregates reamction votes correctly from multiple post rows', () => {
    const rows = [
      { helpful_count: 2, insightful_count: 1, awesome_count: 3, brewtiful_count: 0 },
      { helpful_count: 4, insightful_count: 5, awesome_count: 1, brewtiful_count: 6 }
    ];

    const total = calculateTotalReactions(rows);
    expect(total).toBe(22);

    const statData = getFeedbackStatusText(total);
    expect(statData.countText).toBe('22 VOTES');
    expect(statData.statusText).toBe('● LIVE FEEDBACK');
  });

  it('parses comment counts from HTTP Content-Range header', () => {
    expect(parseContentRangeCount('0-0/42', 1)).toBe(42);
    expect(parseContentRangeCount('items 0-0/1', 1)).toBe(1);
    expect(parseContentRangeCount('', 5)).toBe(5);
  });

  it('handles empty and database failure responses gracefully', () => {
    expect(calculateTotalReactions([])).toBe(0);
    expect(calculateTotalReactions(null)).toBe(0);

    const statData = getFeedbackStatusText(0);
    expect(statData.countText).toBe('0 VOTES');
    expect(statData.statusText).toBe('╯ NO VOTES YET');
  });
});
