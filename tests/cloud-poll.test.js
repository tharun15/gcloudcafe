// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';

// Pure logic functions mirroring assets/js/blog-enhancements.js poll system
function getCurrentQuarterInfo(mockDate) {
  var now = mockDate ? new Date(mockDate) : new Date();
  var year = now.getFullYear();
  var month = now.getMonth();
  var qNum = Math.floor(month / 3) + 1;
  var quarterKey = year + "-Q" + qNum;
  var quarterLabel = "Q" + qNum + " " + year;

  var nextQuarterMonth = qNum * 3;
  var nextQuarterYear = year;
  if (nextQuarterMonth > 11) {
    nextQuarterMonth = 0;
    nextQuarterYear += 1;
  }
  var resetDate = new Date(nextQuarterYear, nextQuarterMonth, 1, 0, 0, 0, 0);
  var diffMs = resetDate.getTime() - now.getTime();
  var daysLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  var hoursLeft = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  return {
    quarterKey: quarterKey,
    quarterLabel: quarterLabel,
    daysLeft: daysLeft,
    hoursLeft: hoursLeft
  };
}

function calculatePollPercentages(pollData) {
  var totalVotes = pollData.reduce(function (acc, row) { return acc + (row.votes || 0); }, 0);
  var results = {};
  pollData.forEach(function (row) {
    var votes = row.votes || 0;
    results[row.provider] = {
      votes: votes,
      percent: totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0.0"
    };
  });
  return { totalVotes: totalVotes, breakdown: results };
}

function recordVote(pollData, provider, userVotedKey, storage) {
  if (storage.getItem(userVotedKey)) {
    return { success: false, reason: "already_voted", pollData: pollData };
  }
  storage.setItem(userVotedKey, provider);
  var updated = pollData.map(function (row) {
    if (row.provider === provider) {
      return {
        ...row,
        votes: (row.votes || 0) + 1,
        today_votes: (row.today_votes || 0) + 1
      };
    }
    return row;
  });
  return { success: true, pollData: updated };
}

describe('Cloud Battle Quarterly Poll Engine', () => {
  let mockStorage;

  beforeEach(() => {
    const store = {};
    mockStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      clear: () => { for (let k in store) delete store[k]; }
    };
  });

  it('accurately derives quarterly labels and reset targets', () => {
    const q3 = getCurrentQuarterInfo('2026-09-19T06:00:00Z');
    expect(q3.quarterLabel).toBe('Q3 2026');
    expect(q3.quarterKey).toBe('2026-Q3');
    expect(q3.daysLeft).toBeGreaterThan(0);

    const q1 = getCurrentQuarterInfo('2026-01-15T00:00:00Z');
    expect(q1.quarterLabel).toBe('Q1 2026');
    expect(q1.quarterKey).toBe('2026-Q1');
  });

  it('calculates zero percentage gracefully when no votes exist', () => {
    const emptyPoll = [
      { provider: 'GCP', votes: 0 },
      { provider: 'AWS', votes: 0 },
      { provider: 'AZURE', votes: 0 },
      { provider: 'OTHERS', votes: 0 }
    ];
    const { totalVotes, breakdown } = calculatePollPercentages(emptyPoll);
    expect(totalVotes).toBe(0);
    expect(breakdown.GCP.percent).toBe('0.0');
    expect(breakdown.AWS.percent).toBe('0.0');
    expect(breakdown.AZURE.percent).toBe('0.0');
    expect(breakdown.OTHERS.percent).toBe('0.0');
  });

  it('correctly calculates proportional percentages across providers', () => {
    const activePoll = [
      { provider: 'GCP', votes: 4 },
      { provider: 'AWS', votes: 2 },
      { provider: 'AZURE', votes: 2 },
      { provider: 'OTHERS', votes: 2 }
    ];
    const { totalVotes, breakdown } = calculatePollPercentages(activePoll);
    expect(totalVotes).toBe(10);
    expect(breakdown.GCP.percent).toBe('40.0');
    expect(breakdown.AWS.percent).toBe('20.0');
    expect(breakdown.AZURE.percent).toBe('20.0');
    expect(breakdown.OTHERS.percent).toBe('20.0');
  });

  it('records vote, increments count, and prevents double voting per quarter', () => {
    const pollData = [
      { provider: 'GCP', votes: 4, today_votes: 4 },
      { provider: 'AWS', votes: 2, today_votes: 2 }
    ];
    const qKey = 'gcloudcafe_voted_provider_2026-Q3';

    // First vote
    const res1 = recordVote(pollData, 'GCP', qKey, mockStorage);
    expect(res1.success).toBe(true);
    const gcpRow = res1.pollData.find(r => r.provider === 'GCP');
    expect(gcpRow.votes).toBe(5);
    expect(mockStorage.getItem(qKey)).toBe('GCP');

    // Attempt double voting
    const res2 = recordVote(res1.pollData, 'AWS', qKey, mockStorage);
    expect(res2.success).toBe(false);
    expect(res2.reason).toBe('already_voted');
    const awsRow = res2.pollData.find(r => r.provider === 'AWS');
    expect(awsRow.votes).toBe(2); // Unchanged
  });

  it('updates DOM state correctly with active and disabled button styles', () => {
    document.body.innerHTML = `
      <div data-cloud-poll-container>
        <div data-provider-card="GCP">
          <span data-provider-percent="GCP">0%</span>
          <div data-provider-bar="GCP" style="width: 0%;"></div>
          <span data-provider-votes="GCP">0 votes</span>
          <button data-poll-vote="GCP">Vote</button>
        </div>
        <div data-provider-card="AWS">
          <span data-provider-percent="AWS">0%</span>
          <div data-provider-bar="AWS" style="width: 0%;"></div>
          <span data-provider-votes="AWS">0 votes</span>
          <button data-poll-vote="AWS">Vote</button>
        </div>
      </div>
    `;

    const poll = [
      { provider: 'GCP', votes: 5 },
      { provider: 'AWS', votes: 5 }
    ];
    const total = 10;
    const userVoted = 'GCP';

    const container = document.querySelector('[data-cloud-poll-container]');
    poll.forEach(row => {
      const pct = ((row.votes / total) * 100).toFixed(1);
      container.querySelector(`[data-provider-percent="${row.provider}"]`).textContent = pct + '%';
      container.querySelector(`[data-provider-bar="${row.provider}"]`).style.width = pct + '%';
      container.querySelector(`[data-provider-votes="${row.provider}"]`).textContent = `${row.votes} votes (${pct}%)`;

      const btn = container.querySelector(`[data-poll-vote="${row.provider}"]`);
      if (userVoted === row.provider) {
        btn.textContent = 'Voted';
        btn.disabled = true;
      } else if (userVoted) {
        btn.textContent = 'Vote';
        btn.disabled = true;
      }
    });

    expect(container.querySelector('[data-provider-percent="GCP"]').textContent).toBe('50.0%');
    expect(container.querySelector('[data-provider-bar="GCP"]').style.width).toBe('50.0%');
    expect(container.querySelector('[data-poll-vote="GCP"]').textContent).toBe('Voted');
    expect(container.querySelector('[data-poll-vote="GCP"]').disabled).toBe(true);

    expect(container.querySelector('[data-provider-percent="AWS"]').textContent).toBe('50.0%');
    expect(container.querySelector('[data-poll-vote="AWS"]').textContent).toBe('Vote');
    expect(container.querySelector('[data-poll-vote="AWS"]').disabled).toBe(true);
  });
});
