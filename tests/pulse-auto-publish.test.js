import { describe, it, expect } from 'vitest';
const {
  isManualApproval,
  validateAndEnforceAnalogy,
  calculateInactivityHours,
  createSmartFallbackHook
} = require('../scripts/auto-publish-cloud-pulse.js');

describe('Cloud Pulse 12-Hour Fallback & Inactivity Detection', () => {
  it('correctly identifies manual admin approval vs auto-published posts', () => {
    const manualPost1 = {
      id: 'p1',
      title: 'Manual GCP Update',
      eligibility_reason: 'Official GCP Release: Ingested & AI synthesized for Admin Approval Queue.'
    };
    const manualPost2 = {
      id: 'p2',
      title: 'Manual Admin Post',
      eligibility_reason: '[Manual Approved] Verified and published by newsroom admin.'
    };
    const autoPost = {
      id: 'p3',
      title: 'Auto Published Fallback',
      eligibility_reason: '[Auto-Published] Published automatically after 12.5h without manual admin curation.'
    };

    expect(isManualApproval(manualPost1)).toBe(true);
    expect(isManualApproval(manualPost2)).toBe(true);
    expect(isManualApproval(autoPost)).toBe(false);
    expect(isManualApproval(null)).toBe(false);
  });

  it('skips auto-publishing when an admin approved a post within the last 12 hours', () => {
    const now = new Date('2026-09-20T12:00:00Z').getTime();
    const approvedPulses = [
      {
        id: 'p1',
        title: 'Recent Manual Post',
        updated_at: '2026-09-20T08:00:00Z', // 4 hours ago (< 12h)
        eligibility_reason: '[Manual Approved] Curated by admin.'
      }
    ];

    const elapsed = calculateInactivityHours(approvedPulses, now);
    expect(elapsed).toBe(4);
    expect(elapsed < 12).toBe(true);
  });

  it('triggers auto-publishing when >= 12 hours have elapsed without manual approval', () => {
    const now = new Date('2026-09-20T12:00:00Z').getTime();
    const approvedPulses = [
      {
        id: 'p1',
        title: 'Older Post',
        updated_at: '2026-09-19T22:00:00Z', // 14 hours ago (>= 12h)
        eligibility_reason: 'Official AWS Release: Ingested & AI synthesized for Admin Approval Queue.'
      }
    ];

    const elapsed = calculateInactivityHours(approvedPulses, now);
    expect(elapsed).toBe(14);
    expect(elapsed >= 12).toBe(true);
  });

  it('ignores auto-published posts when calculating last manual admin approval', () => {
    const now = new Date('2026-09-20T12:00:00Z').getTime();
    const approvedPulses = [
      {
        id: 'auto-1',
        title: 'Auto Published 1 hour ago',
        updated_at: '2026-09-20T11:00:00Z',
        eligibility_reason: '[Auto-Published] Published automatically after 12h without manual admin curation.'
      },
      {
        id: 'manual-1',
        title: 'Manual Post 16 hours ago',
        updated_at: '2026-09-19T20:00:00Z',
        eligibility_reason: 'Official Kubernetes Release: Ingested & AI synthesized for Admin Approval Queue.'
      }
    ];

    const elapsed = calculateInactivityHours(approvedPulses, now);
    expect(elapsed).toBe(16); // Measured from manual-1, not auto-1!
    expect(elapsed >= 12).toBe(true);
  });
});

describe('Strict Cloud Pulse Analogy Verification Engine', () => {
  it('validates compliant candidate matching strict 2-part analogy', () => {
    const validTitle = 'Kubernetes v1.37: Node Lifecycle Conditions';
    const validContent = '🎯 What Changed: Kubernetes v1.37 introduces Node Lifecycle Conditions, providing a standardized API.\n\n💡 Why It Matters: This simplifies node management and automation, enabling more robust scheduling decisions.';

    const result = validateAndEnforceAnalogy(validTitle, validContent);
    expect(result.isValid).toBe(true);
    expect(result.formattedContent).toContain('🎯 What Changed:');
    expect(result.formattedContent).toContain('💡 Why It Matters:');
  });

  it('accepts Engineering Impact variation for Why It Matters', () => {
    const title = 'GCP HPC Slurm Security Fix';
    const content = '🎯 What Changed: Google Cloud addressed CVE-2026-65107 on Slurm clusters.\n💡 Engineering Impact: Enhances security for HPC and AI workloads utilizing Slurm on GCP.';

    const result = validateAndEnforceAnalogy(title, content);
    expect(result.isValid).toBe(true);
    expect(result.formattedContent).toContain('🎯 What Changed:');
    expect(result.formattedContent).toContain('💡 Engineering Impact:');
  });

  it('automatically synthesizes and strips raw HTML from unformatted candidates into strict analogy', () => {
    const title = 'AWS Lambda S3 Direct Read';
    const rawContent = '<p>AWS Lambda now supports direct read configuration for Amazon S3 Files. <a href="https://aws.amazon.com">Read more</a>. This enables engineers to optimize performance and reduce cost.</p>';

    const result = validateAndEnforceAnalogy(title, rawContent);
    expect(result.isValid).toBe(true);
    expect(result.synthesized).toBe(true);
    expect(result.formattedContent).toContain('🎯 What Changed:');
    expect(result.formattedContent).toContain('💡 Why It Matters:');
    expect(result.formattedContent).not.toContain('<p>');
    expect(result.formattedContent).not.toContain('<a');
  });
});

describe('Manual Approval Higher Precedence Ranking', () => {
  function isManualApprovedPulse(p) {
    if (!p) return false;
    const reason = (p.eligibility_reason || "").toLowerCase();
    return !reason.includes("auto-published");
  }

  function sortCohortByScore(list) {
    return (list || []).slice().sort((a, b) => {
      // Priority 1: Manual approvals always take higher precedence over auto-published posts
      const manualA = isManualApprovedPulse(a) ? 1 : 0;
      const manualB = isManualApprovedPulse(b) ? 1 : 0;
      if (manualB !== manualA) return manualB - manualA;

      // Priority 2: Community vote score
      const scoreA = typeof a.score === "number" ? a.score : ((a.upvotes || 0) - (a.downvotes || 0));
      const scoreB = typeof b.score === "number" ? b.score : ((b.upvotes || 0) - (b.downvotes || 0));
      if (scoreB !== scoreA) return scoreB - scoreA;

      // Priority 3: Recency
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }).slice(0, 6);
  }

  it('guarantees manual approved posts strictly outrank auto-published posts regardless of recency', () => {
    const posts = [
      {
        id: 'auto-new',
        title: 'Brand New Auto Post',
        score: 5,
        created_at: '2026-09-20T12:00:00Z',
        eligibility_reason: '[Auto-Published] Published automatically after 12h.'
      },
      {
        id: 'manual-older',
        title: 'Older Manually Approved Post',
        score: 1,
        created_at: '2026-09-18T10:00:00Z',
        eligibility_reason: '[Manual Approved] Verified by admin.'
      }
    ];

    const sorted = sortCohortByScore(posts);
    expect(sorted[0].id).toBe('manual-older');
    expect(sorted[1].id).toBe('auto-new');
  });

  it('sorts within the manual tier by score and recency', () => {
    const posts = [
      {
        id: 'manual-low',
        title: 'Manual Low Score',
        score: 1,
        created_at: '2026-09-19T10:00:00Z',
        eligibility_reason: 'Official Release: Ingested & AI synthesized for Admin Approval Queue.'
      },
      {
        id: 'manual-high',
        title: 'Manual High Score',
        score: 10,
        created_at: '2026-09-19T08:00:00Z',
        eligibility_reason: '[Manual Approved] Curated.'
      },
      {
        id: 'auto-post',
        title: 'Auto Fallback Post',
        score: 20,
        created_at: '2026-09-20T11:00:00Z',
        eligibility_reason: '[Auto-Published] Published automatically.'
      }
    ];

    const sorted = sortCohortByScore(posts);
    expect(sorted[0].id).toBe('manual-high');
    expect(sorted[1].id).toBe('manual-low');
    expect(sorted[2].id).toBe('auto-post');
  });
});

describe('Pulse Admin Unpublish Management Flow', () => {
  it('transitions published post status to rejected on unpublish', () => {
    const livePost = {
      id: 'live-1',
      title: 'Live Article',
      status: 'approved',
      updated_at: '2026-09-15T00:00:00Z'
    };

    function simulateUnpublish(post) {
      return {
        ...post,
        status: 'rejected',
        updated_at: new Date().toISOString()
      };
    }

    const unpublished = simulateUnpublish(livePost);
    expect(unpublished.status).toBe('rejected');
    expect(new Date(unpublished.updated_at).getTime()).toBeGreaterThan(new Date(livePost.updated_at).getTime());

    // Public feed filter: only status === 'approved' are displayed
    const publicCohort = [unpublished].filter(p => p.status === 'approved');
    expect(publicCohort).toHaveLength(0);
  });
});
