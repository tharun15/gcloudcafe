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
});
