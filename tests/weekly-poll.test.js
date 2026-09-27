// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';

// Pure logic functions mirroring assets/js/blog-enhancements.js weekly opinion poll
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

function recordStandardVote(poll, optionId, storage) {
  var storageKey = "gcloudcafe_weekly_poll_" + poll.id;
  var existingVote = storage.getItem(storageKey);
  if (existingVote) {
    return { success: false, reason: "already_voted" };
  }

  var updatedOptions = poll.options.map(function (opt) {
    if (opt.id === optionId) {
      return { ...opt, votes: (opt.votes || 0) + 1 };
    }
    return { ...opt };
  });

  var voteRecord = {
    optionId: optionId,
    timestamp: Date.now()
  };
  storage.setItem(storageKey, JSON.stringify(voteRecord));

  return {
    success: true,
    poll: { ...poll, options: updatedOptions },
    voteRecord: voteRecord
  };
}

function submitCustomTakeVote(poll, takeText, role, storage) {
  var storageKey = "gcloudcafe_weekly_poll_" + poll.id;
  var takesStorageKey = "gcloudcafe_weekly_takes_" + poll.id;

  var trimmed = (takeText || "").trim();
  if (trimmed.length < 3) {
    return { success: false, reason: "too_short" };
  }
  if (trimmed.length > 140) {
    return { success: false, reason: "too_long" };
  }

  var existingVote = storage.getItem(storageKey);
  if (existingVote) {
    return { success: false, reason: "already_voted" };
  }

  var updatedOther = {
    ...poll.otherOption,
    votes: (poll.otherOption.votes || 0) + 1
  };

  var newTake = {
    id: "take-user-" + Date.now(),
    author: role || "Cloud Architect",
    text: trimmed,
    timeAgo: "Just now",
    isUser: true
  };

  var savedTakesRaw = storage.getItem(takesStorageKey);
  var savedTakes = savedTakesRaw ? JSON.parse(savedTakesRaw) : [];
  savedTakes.unshift(newTake);
  storage.setItem(takesStorageKey, JSON.stringify(savedTakes));

  var voteRecord = {
    optionId: "other",
    customTake: trimmed,
    role: role,
    timestamp: Date.now()
  };
  storage.setItem(storageKey, JSON.stringify(voteRecord));

  var updatedCustomTakes = [newTake].concat(poll.customTakes || []);

  return {
    success: true,
    poll: {
      ...poll,
      otherOption: updatedOther,
      customTakes: updatedCustomTakes
    },
    newTake: newTake,
    voteRecord: voteRecord
  };
}

function changeVote(pollId, storage) {
  var storageKey = "gcloudcafe_weekly_poll_" + pollId;
  storage.removeItem(storageKey);
  return { success: true };
}

describe('Weekly Architecture Opinion Poll Engine', () => {
  let mockStorage;
  let samplePoll;

  beforeEach(() => {
    const store = {};
    mockStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { for (let k in store) delete store[k]; }
    };

    samplePoll = {
      id: "week-2026-39",
      weekNumber: 39,
      year: 2026,
      category: "AI Infrastructure",
      question: "By 2027, where will enterprise LLM workloads run?",
      options: [
        { id: "opt-1", text: "Hyperscaler APIs", votes: 50 },
        { id: "opt-2", text: "Self-hosted K8s", votes: 30 },
        { id: "opt-3", text: "Private Bare Metal", votes: 15 },
        { id: "opt-4", text: "Edge SLMs", votes: 5 }
      ],
      otherOption: {
        id: "other",
        text: "Other / Different perspective",
        votes: 0
      },
      customTakes: [
        { id: "seed-1", author: "Lead SRE", text: "Hybrid tiering is best", timeAgo: "1d ago" }
      ]
    };
  });

  it('calculates proportional percentages including the open-ended other option', () => {
    const { totalVotes, results } = calculateWeeklyPollPercentages(samplePoll.options, samplePoll.otherOption);
    expect(totalVotes).toBe(100);
    expect(results['opt-1'].percent).toBe('50.0');
    expect(results['opt-2'].percent).toBe('30.0');
    expect(results['opt-3'].percent).toBe('15.0');
    expect(results['opt-4'].percent).toBe('5.0');
    expect(results['other'].percent).toBe('0.0');
  });

  it('records a 1-click standard vote and increments the correct option count', () => {
    const res = recordStandardVote(samplePoll, 'opt-2', mockStorage);
    expect(res.success).toBe(true);
    expect(res.poll.options.find(o => o.id === 'opt-2').votes).toBe(31);

    const stored = JSON.parse(mockStorage.getItem('gcloudcafe_weekly_poll_week-2026-39'));
    expect(stored.optionId).toBe('opt-2');

    // Attempt double voting
    const resDouble = recordStandardVote(res.poll, 'opt-1', mockStorage);
    expect(resDouble.success).toBe(false);
    expect(resDouble.reason).toBe('already_voted');
  });

  it('validates open-ended custom take length (rejects empty / < 3 chars)', () => {
    const tooShortRes = submitCustomTakeVote(samplePoll, 'no', 'Cloud Architect', mockStorage);
    expect(tooShortRes.success).toBe(false);
    expect(tooShortRes.reason).toBe('too_short');

    const emptyRes = submitCustomTakeVote(samplePoll, '   ', 'Cloud Architect', mockStorage);
    expect(emptyRes.success).toBe(false);
    expect(emptyRes.reason).toBe('too_short');
  });

  it('validates open-ended custom take maximum length (> 140 chars)', () => {
    const longText = 'A'.repeat(141);
    const tooLongRes = submitCustomTakeVote(samplePoll, longText, 'Cloud Architect', mockStorage);
    expect(tooLongRes.success).toBe(false);
    expect(tooLongRes.reason).toBe('too_long');
  });

  it('records a valid open-ended custom take, increments other votes, and adds to community takes', () => {
    const customText = 'Hybrid tiering: small local SLMs for routing, cloud for deep reasoning.';
    const res = submitCustomTakeVote(samplePoll, customText, 'Principal SRE', mockStorage);

    expect(res.success).toBe(true);
    expect(res.poll.otherOption.votes).toBe(1);
    expect(res.newTake.text).toBe(customText);
    expect(res.newTake.author).toBe('Principal SRE');
    expect(res.poll.customTakes[0].text).toBe(customText);

    // Stored vote check
    const storedVote = JSON.parse(mockStorage.getItem('gcloudcafe_weekly_poll_week-2026-39'));
    expect(storedVote.optionId).toBe('other');
    expect(storedVote.customTake).toBe(customText);

    // Stored takes list check
    const storedTakes = JSON.parse(mockStorage.getItem('gcloudcafe_weekly_takes_week-2026-39'));
    expect(storedTakes.length).toBe(1);
    expect(storedTakes[0].text).toBe(customText);
  });

  it('allows user to change their vote cleanly', () => {
    recordStandardVote(samplePoll, 'opt-1', mockStorage);
    expect(mockStorage.getItem('gcloudcafe_weekly_poll_week-2026-39')).not.toBeNull();

    const changeRes = changeVote('week-2026-39', mockStorage);
    expect(changeRes.success).toBe(true);
    expect(mockStorage.getItem('gcloudcafe_weekly_poll_week-2026-39')).toBeNull();

    // Now they can vote again
    const secondVote = recordStandardVote(samplePoll, 'opt-3', mockStorage);
    expect(secondVote.success).toBe(true);
    const stored = JSON.parse(mockStorage.getItem('gcloudcafe_weekly_poll_week-2026-39'));
    expect(stored.optionId).toBe('opt-3');
  });
});
