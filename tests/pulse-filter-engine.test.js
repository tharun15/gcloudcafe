// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Cloud Pulse Multi-Filter & Real-Time Search Engine', () => {
  const rootDir = path.resolve(__dirname, '..');

  const samplePulses = [
    {
      id: 'p1',
      title: 'Amazon EKS Auto Mode Simplifies Kubernetes Node Provisioning',
      content: '🎯 What Changed: AWS announced EKS Auto Mode which automates node management. 💡 Why It Matters: Eliminates manual Karpenter configuration.',
      tags: ['AWS', 'Kubernetes', 'DevOps'],
      upvotes: 42,
      downvotes: 2,
      score: 40,
      created_at: '2026-09-28T10:00:00Z',
      link_url: 'https://aws.amazon.com/eks'
    },
    {
      id: 'p2',
      title: 'Google Cloud BigQuery Introduces Continuous Data Streaming 2.0',
      content: '🎯 What Changed: BigQuery enhanced Storage Write API throughput by 40%. 💡 Why It Matters: Real-time telemetry analytics without batch latency.',
      tags: ['Google Cloud', 'BigQuery', 'Databases', 'Analytics'],
      upvotes: 25,
      downvotes: 1,
      score: 24,
      created_at: '2026-09-28T09:00:00Z',
      link_url: 'https://cloud.google.com/bigquery'
    },
    {
      id: 'p3',
      title: 'Red Hat OpenShift 4.17 Delivers Zero-Trust Microsegmentation',
      content: '🎯 What Changed: Built-in OVN-Kubernetes egress firewall and mTLS enforcement. 💡 Why It Matters: Compliance security out-of-the-box.',
      tags: ['OpenShift', 'Red Hat', 'Security', 'Kubernetes'],
      upvotes: 55,
      downvotes: 5,
      score: 50,
      created_at: '2026-09-27T18:00:00Z',
      link_url: 'https://redhat.com/openshift'
    },
    {
      id: 'p4',
      title: 'Azure OpenAI Embeddings Model Latency Cut in Half',
      content: '🎯 What Changed: Microsoft optimized inference hardware for text-embedding-3. 💡 Why It Matters: Fast RAG search in enterprise copilots.',
      tags: ['Azure', 'AI', 'LLM', 'OpenAI'],
      upvotes: 18,
      downvotes: 0,
      score: 18,
      created_at: '2026-09-28T11:00:00Z',
      link_url: 'https://azure.microsoft.com'
    },
    {
      id: 'p5',
      title: 'AWS Secrets Manager Now Enforces Post-Quantum TLS 1.3',
      content: '🎯 What Changed: AWS KMS and Secrets Manager now support ML-KEM hybrid handshakes. 💡 Why It Matters: Harvest-now-decrypt-later protection.',
      tags: ['AWS', 'Security', 'TLS'],
      upvotes: 38,
      downvotes: 2,
      score: 36,
      created_at: '2026-09-27T12:00:00Z',
      link_url: 'https://aws.amazon.com/security'
    }
  ];

  beforeEach(() => {
    delete window.gcloudcafePulseFilter;

    // Load assets/js/blog-enhancements.js
    const scriptPath = path.join(rootDir, 'assets/js/blog-enhancements.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    const fn = new Function(scriptContent);
    fn();
  });

  it('exposes window.gcloudcafePulseFilter with filterPulses and parseUrlState', () => {
    expect(window.gcloudcafePulseFilter).toBeDefined();
    expect(typeof window.gcloudcafePulseFilter.filterPulses).toBe('function');
    expect(typeof window.gcloudcafePulseFilter.parseUrlState).toBe('function');
    expect(typeof window.gcloudcafePulseFilter.buildQueryString).toBe('function');
  });

  describe('1. Provider Filtering', () => {
    it('filters by provider GCP accurately', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        provider: 'gcp'
      });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('p2');
    });

    it('filters by provider AWS returning multiple matching pulses', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        provider: 'aws'
      });
      expect(res.length).toBe(2);
      expect(res.map(p => p.id)).toEqual(expect.arrayContaining(['p1', 'p5']));
    });

    it('filters by OpenShift / Red Hat', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        provider: 'openshift'
      });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('p3');
    });

    it('returns all pulses when provider is "all"', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        provider: 'all'
      });
      expect(res.length).toBe(5);
    });
  });

  describe('2. Topic / Domain Filtering', () => {
    it('filters by topic "security"', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        domain: 'security'
      });
      expect(res.length).toBe(2);
      expect(res.map(p => p.id)).toEqual(expect.arrayContaining(['p3', 'p5']));
    });

    it('filters by topic "ai"', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        domain: 'ai'
      });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('p4');
    });

    it('filters by topic "kubernetes"', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        domain: 'kubernetes'
      });
      expect(res.length).toBe(2);
      expect(res.map(p => p.id)).toEqual(expect.arrayContaining(['p1', 'p3']));
    });
  });

  describe('3. Combined Multi-Filtering (Provider + Topic)', () => {
    it('combines provider AWS + topic Security to find precise pulse', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        provider: 'aws',
        domain: 'security'
      });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('p5');
    });

    it('returns empty array when combined filters have no mutual intersection', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        provider: 'azure',
        domain: 'security'
      });
      expect(res.length).toBe(0);
    });
  });

  describe('4. Full-Text Instant Search', () => {
    it('searches by keyword inside content or title', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        searchQuery: 'Karpenter'
      });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('p1');
    });

    it('searches across tags and acronyms (e.g. RAG, TLS, mTLS)', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        searchQuery: 'mTLS'
      });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('p3');
    });
  });

  describe('5. Sort Modes (Trending vs Recent)', () => {
    it('sorts by trending (score/upvotes descending)', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        sortBy: 'trending'
      });
      expect(res[0].id).toBe('p3'); // Score 50
      expect(res[1].id).toBe('p1'); // Score 40
      expect(res[2].id).toBe('p5'); // Score 36
    });

    it('sorts by recent (created_at timestamp descending)', () => {
      const res = window.gcloudcafePulseFilter.filterPulses(samplePulses, {
        sortBy: 'recent'
      });
      expect(res[0].id).toBe('p4'); // 11:00 AM
      expect(res[1].id).toBe('p1'); // 10:00 AM
      expect(res[2].id).toBe('p2'); // 09:00 AM
    });
  });

  describe('6. URL Query String Synchronization', () => {
    it('parses URL query params into filter state', () => {
      const search = '?provider=aws&topic=security&q=quantum&sort=recent';
      const state = window.gcloudcafePulseFilter.parseUrlState(search);
      expect(state.provider).toBe('aws');
      expect(state.domain).toBe('security');
      expect(state.searchQuery).toBe('quantum');
      expect(state.sortBy).toBe('recent');
    });

    it('builds clean URL query string ignoring default values', () => {
      const qs = window.gcloudcafePulseFilter.buildQueryString({
        provider: 'aws',
        domain: 'all',
        searchQuery: '',
        sortBy: 'trending'
      });
      expect(qs).toBe('?provider=aws');

      const qsFull = window.gcloudcafePulseFilter.buildQueryString({
        provider: 'gcp',
        domain: 'databases',
        searchQuery: 'bigquery',
        sortBy: 'recent'
      });
      expect(qsFull).toContain('provider=gcp');
      expect(qsFull).toContain('topic=databases');
      expect(qsFull).toContain('q=bigquery');
      expect(qsFull).toContain('sort=recent');
    });
  });

  describe('7. Interactive DOM Filtering & UI Controls', () => {
    beforeEach(() => {
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState(null, '', '/pulse/');
      }
      document.body.innerHTML = `
        <div id="cloud-pulse-section">
          <input id="pulse-search-input" type="text" />
          <button id="pulse-search-clear" class="hidden"></button>
          <span id="pulse-result-count"></span>
          <div id="pulse-sort-controls">
            <button data-pulse-sort="trending" class="pulse-sort-btn font-bold"></button>
            <button data-pulse-sort="recent" class="pulse-sort-btn"></button>
          </div>
          <div id="pulse-provider-chips">
            <button data-pulse-provider="all" class="pulse-filter-chip is-active"></button>
            <button data-pulse-provider="gcp" class="pulse-filter-chip"></button>
            <button data-pulse-provider="aws" class="pulse-filter-chip"></button>
            <button data-pulse-provider="azure" class="pulse-filter-chip"></button>
          </div>
          <div id="pulse-domain-chips">
            <button data-pulse-domain="all" class="pulse-filter-chip is-active"></button>
            <button data-pulse-domain="kubernetes" class="pulse-filter-chip"></button>
            <button data-pulse-domain="security" class="pulse-filter-chip"></button>
          </div>
          <div id="pulse-empty-state" class="hidden">
            <button id="pulse-reset-filters-btn"></button>
          </div>
          <div data-cloud-pulse-feed></div>
          <button data-pulse-filter="security" class="pulse-topic-pill"></button>
        </div>
      `;

      global.fetch = () => Promise.resolve({
        json: () => Promise.resolve(samplePulses)
      });

      const scriptPath = path.join(rootDir, 'assets/js/blog-enhancements.js');
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      const fn = new Function(scriptContent);
      fn();
    });

    it('renders initial cohort and updates result counter', async () => {
      await new Promise(r => setTimeout(r, 60));
      const cards = document.querySelectorAll('.cloud-pulse-card');
      expect(cards.length).toBe(5);
      const counter = document.getElementById('pulse-result-count');
      expect(counter.textContent).toContain('5 updates');
    });

    it('filters cards by provider chip click and updates active styling', async () => {
      await new Promise(r => setTimeout(r, 60));
      const gcpChip = document.querySelector('[data-pulse-provider="gcp"]');
      const allChip = document.querySelector('[data-pulse-provider="all"]');

      gcpChip.click();
      await new Promise(r => setTimeout(r, 30));

      expect(gcpChip.classList.contains('is-active')).toBe(true);
      expect(allChip.classList.contains('is-active')).toBe(false);

      const cards = document.querySelectorAll('.cloud-pulse-card');
      expect(cards.length).toBe(1);
      expect(cards[0].textContent).toContain('BigQuery');
    });

    it('filters cards by search input and displays clear button', async () => {
      await new Promise(r => setTimeout(r, 60));
      const searchInput = document.getElementById('pulse-search-input');
      const clearBtn = document.getElementById('pulse-search-clear');

      searchInput.value = 'Karpenter';
      searchInput.dispatchEvent(new Event('input'));
      await new Promise(r => setTimeout(r, 120));

      expect(clearBtn.classList.contains('hidden')).toBe(false);
      const cards = document.querySelectorAll('.cloud-pulse-card');
      expect(cards.length).toBe(1);
      expect(cards[0].textContent).toContain('Amazon EKS');

      clearBtn.click();
      await new Promise(r => setTimeout(r, 60));
      expect(searchInput.value).toBe('');
      expect(clearBtn.classList.contains('hidden')).toBe(true);
      expect(document.querySelectorAll('.cloud-pulse-card').length).toBe(5);
    });

    it('displays empty state and restores all pulses on reset button click', async () => {
      await new Promise(r => setTimeout(r, 60));
      const searchInput = document.getElementById('pulse-search-input');
      searchInput.value = 'NonexistentKeywordXYZ';
      searchInput.dispatchEvent(new Event('input'));
      await new Promise(r => setTimeout(r, 120));

      const emptyState = document.getElementById('pulse-empty-state');
      expect(emptyState.classList.contains('hidden')).toBe(false);
      expect(document.querySelectorAll('.cloud-pulse-card').length).toBe(0);

      const resetBtn = document.getElementById('pulse-reset-filters-btn');
      resetBtn.click();
      await new Promise(r => setTimeout(r, 60));

      expect(emptyState.classList.contains('hidden')).toBe(true);
      expect(document.querySelectorAll('.cloud-pulse-card').length).toBe(5);
    });

    it('switches sort order between trending and recent', async () => {
      await new Promise(r => setTimeout(r, 60));
      const recentBtn = document.querySelector('[data-pulse-sort="recent"]');
      const trendingBtn = document.querySelector('[data-pulse-sort="trending"]');

      recentBtn.click();
      await new Promise(r => setTimeout(r, 30));

      expect(recentBtn.classList.contains('font-bold')).toBe(true);
      const cards = document.querySelectorAll('.cloud-pulse-card');
      expect(cards[0].textContent).toContain('Azure OpenAI');
      expect(cards[0].textContent).toContain('LATEST');
    });

    it('filters via sidebar topic pill click and updates chip state', async () => {
      await new Promise(r => setTimeout(r, 60));
      const pill = document.querySelector('.pulse-topic-pill[data-pulse-filter="security"]');
      pill.click();
      await new Promise(r => setTimeout(r, 30));

      const secChip = document.querySelector('[data-pulse-domain="security"]');
      expect(secChip.classList.contains('is-active')).toBe(true);

      const cards = document.querySelectorAll('.cloud-pulse-card');
      expect(cards.length).toBe(2);
    });
  });
});
