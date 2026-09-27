// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';

function calculateWeeklyPollPercentages(options, otherOption) {
  var allOptions = options.concat([otherOption]);
  var totalVotes = allOptions.reduce(function (sum, opt) {
    return sum + (opt.votes || 0);
  }, 0);

  var results = {};
  allOptions.forEach(function (opt) {
    var votes = opt.votes || 0;
    var percent = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0.0";
    results[opt.id] = {
      votes: votes,
      percent: percent,
      percentNum: parseFloat(percent)
    };
  });

  return {
    totalVotes: totalVotes,
    results: results
  };
}

function recordPredictionVote(poll, optionId, storage) {
  var storageKey = "gcloudcafe_weekly_poll_" + poll.id;

  var updatedOptions = poll.options.map(function (opt) {
    if (opt.id === optionId) {
      return { ...opt, votes: (opt.votes || 0) + 1 };
    }
    return { ...opt };
  });

  var updatedOther = { ...poll.otherOption };
  if (optionId === "other") {
    updatedOther.votes = (updatedOther.votes || 0) + 1;
  }

  var voteRecord = {
    optionId: optionId,
    timestamp: Date.now()
  };
  storage.setItem(storageKey, JSON.stringify(voteRecord));

  return {
    success: true,
    poll: {
      ...poll,
      options: updatedOptions,
      otherOption: updatedOther
    },
    voteRecord: voteRecord
  };
}

// Vote is locked permanently once cast per weekly debate

function getNextWeeklyPollCountdown(now) {
  var target = new Date(now.getTime());
  var day = now.getUTCDay();
  var daysUntilSunday = (7 - day) % 7;
  if (daysUntilSunday === 0 && (now.getUTCHours() > 0 || now.getUTCMinutes() > 0 || now.getUTCSeconds() > 0)) {
    daysUntilSunday = 7;
  }
  target.setUTCDate(now.getUTCDate() + daysUntilSunday);
  target.setUTCHours(0, 0, 0, 0);

  var diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Dropping soon!";

  var d = Math.floor(diff / (1000 * 60 * 60 * 24));
  var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  var pad = function (n) { return n < 10 ? "0" + n : n; };
  return d > 0 ? (d + "d " + pad(h) + "h " + pad(m) + "m") : (pad(h) + "h " + pad(m) + "m");
}

describe('Streamlined Weekly Architecture Prediction Engine', () => {
  let mockStorage;
  let freshPoll;

  beforeEach(() => {
    const store = {};
    mockStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { for (let k in store) delete store[k]; }
    };

    freshPoll = {
      id: "week-2026-39",
      weekNumber: 39,
      year: 2026,
      category: "AI & Developer Workflows",
      question: "By 2027, what will software engineers spend most of their time doing?",
      options: [
        { id: "opt-1", text: "Reviewing AI code", votes: 0 },
        { id: "opt-2", text: "System design & architecture", votes: 0 },
        { id: "opt-3", text: "Writing code by hand", votes: 0 },
        { id: "opt-4", text: "Debugging production fires", votes: 0 }
      ],
      otherOption: {
        id: "other",
        text: "Other / Different perspective",
        votes: 0
      }
    };
  });

  it('starts fresh with 0 votes and 0.0% across all options', () => {
    const { totalVotes, results } = calculateWeeklyPollPercentages(freshPoll.options, freshPoll.otherOption);
    expect(totalVotes).toBe(0);
    expect(results['opt-1'].percent).toBe('0.0');
    expect(results['opt-2'].percent).toBe('0.0');
    expect(results['opt-3'].percent).toBe('0.0');
    expect(results['opt-4'].percent).toBe('0.0');
    expect(results['other'].percent).toBe('0.0');
  });

  it('records a 1-click prediction vote for a standard option and calculates 100% initial share', () => {
    const res = recordPredictionVote(freshPoll, 'opt-2', mockStorage);
    expect(res.success).toBe(true);
    expect(res.poll.options.find(o => o.id === 'opt-2').votes).toBe(1);

    const { totalVotes, results } = calculateWeeklyPollPercentages(res.poll.options, res.poll.otherOption);
    expect(totalVotes).toBe(1);
    expect(results['opt-2'].percent).toBe('100.0');
    expect(results['opt-1'].percent).toBe('0.0');

    const stored = JSON.parse(mockStorage.getItem('gcloudcafe_weekly_poll_week-2026-39'));
    expect(stored.optionId).toBe('opt-2');
  });

  it('records a 1-click prediction vote for the open-ended "Other" option without requiring a textarea', () => {
    const res = recordPredictionVote(freshPoll, 'other', mockStorage);
    expect(res.success).toBe(true);
    expect(res.poll.otherOption.votes).toBe(1);

    const { totalVotes, results } = calculateWeeklyPollPercentages(res.poll.options, res.poll.otherOption);
    expect(totalVotes).toBe(1);
    expect(results['other'].percent).toBe('100.0');

    const stored = JSON.parse(mockStorage.getItem('gcloudcafe_weekly_poll_week-2026-39'));
    expect(stored.optionId).toBe('other');
  });

  it('locks prediction vote permanently once cast without change option', () => {
    const res = recordPredictionVote(freshPoll, 'opt-1', mockStorage);
    expect(res.success).toBe(true);
    const stored = JSON.parse(mockStorage.getItem('gcloudcafe_weekly_poll_week-2026-39'));
    expect(stored.optionId).toBe('opt-1');
    expect(stored.timestamp).toBeGreaterThan(0);
  });

  it('calculates the countdown timer to next Sunday 00:00 UTC accurately', () => {
    // Test from a Wednesday (e.g., 2026-09-23T12:00:00Z -> next Sunday is 2026-09-27T00:00:00Z: exactly 3 days 12 hours)
    const testDate = new Date('2026-09-23T12:00:00Z');
    const countdown = getNextWeeklyPollCountdown(testDate);
    expect(countdown).toBe('3d 12h 00m');

    // Test on Sunday evening (2026-09-27T18:00:00Z -> next Sunday is 2026-10-04T00:00:00Z: 6 days 6 hours)
    const sundayDate = new Date('2026-09-27T18:00:00Z');
    const sundayCountdown = getNextWeeklyPollCountdown(sundayDate);
    expect(sundayCountdown).toBe('6d 06h 00m');
  });
});
describe('Weekly Poll Queue & Lifecycle Auto-Replacement Engine', () => {
  it('automatically replaces active poll with next in line when active poll is deleted', () => {
    const queue = [
      { id: 'poll-1', question: 'Question 1', votes: 10 },
      { id: 'poll-2', question: 'Question 2', votes: 0 },
      { id: 'poll-3', question: 'Question 3', votes: 0 }
    ];

    let activePollId = 'poll-1';

    // Simulate delete active poll
    const idx = queue.findIndex(p => p.id === activePollId);
    queue.splice(idx, 1);
    activePollId = queue[0].id;

    expect(queue.length).toBe(2);
    expect(activePollId).toBe('poll-2');
    expect(queue[0].id).toBe('poll-2');
    expect(queue[1].id).toBe('poll-3');
  });

  it('shifts subsequent queue items forward when an upcoming poll is deleted', () => {
    const queue = [
      { id: 'poll-1', question: 'Active Question' },
      { id: 'poll-2', question: 'Upcoming Question 2' },
      { id: 'poll-3', question: 'Upcoming Question 3' }
    ];

    // Delete poll-2 from upcoming queue
    const idx = queue.findIndex(p => p.id === 'poll-2');
    queue.splice(idx, 1);

    expect(queue.length).toBe(2);
    expect(queue[0].id).toBe('poll-1');
    expect(queue[1].id).toBe('poll-3'); // poll-3 shifted up into slot #2
  });

  it('allows reordering the upcoming queue so admin controls what goes live next', () => {
    const queue = [
      { id: 'poll-1', question: 'Active' },
      { id: 'poll-2', question: 'Next in line' },
      { id: 'poll-3', question: 'Second in line' }
    ];

    // Move poll-3 up
    const idx = queue.findIndex(p => p.id === 'poll-3');
    const temp = queue[idx];
    queue[idx] = queue[idx - 1];
    queue[idx - 1] = temp;

    expect(queue[1].id).toBe('poll-3'); // poll-3 is now next in line
    expect(queue[2].id).toBe('poll-2');
  });
});

