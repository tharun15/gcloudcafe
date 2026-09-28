// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Cloud Decision Calculator & Comparison Engine', () => {
  const rootDir = path.resolve(__dirname, '..');

  beforeEach(() => {
    delete window.gcloudcafeCalculator;

    // Load assets/js/blog-enhancements.js
    const scriptPath = path.join(rootDir, 'assets/js/blog-enhancements.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    const fn = new Function(scriptContent);
    fn();
  });

  it('exposes window.gcloudcafeCalculator with core calculation methods', () => {
    expect(window.gcloudcafeCalculator).toBeDefined();
    expect(typeof window.gcloudcafeCalculator.calculateStorageTier).toBe('function');
    expect(typeof window.gcloudcafeCalculator.calculateDatabase).toBe('function');
    expect(typeof window.gcloudcafeCalculator.calculateCompute).toBe('function');
  });

  describe('1. Cloud Storage Tier Calculator', () => {
    it('recommends Standard storage for daily frequent access workloads with zero retrieval penalties', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateStorageTier({
        volumeGb: 1000,
        accessFrequency: 'daily',
        retrievalPercent: 50
      });

      expect(res.recommendedTier).toBe('Standard');
      expect(res.matchPercent).toBeGreaterThanOrEqual(90);
      expect(res.costs.Standard.totalCost).toBe(20.00); // 1000 * 0.020 + 0
      expect(res.costs.Nearline.totalCost).toBe(15.00); // 1000 * 0.010 + 500 * 0.01
      expect(res.reason).toContain('Standard');
    });

    it('recommends Nearline storage for monthly access with moderate retrieval', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateStorageTier({
        volumeGb: 5000,
        accessFrequency: 'monthly',
        retrievalPercent: 10
      });

      expect(res.recommendedTier).toBe('Nearline');
      expect(res.costs.Nearline.totalCost).toBe(55.00); // 5000*0.010 + 500*0.01
      expect(res.costs.Standard.totalCost).toBe(100.00); // 5000*0.020
      expect(res.caveats).toContain('30-day');
    });

    it('recommends Coldline for quarterly archival data', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateStorageTier({
        volumeGb: 10000,
        accessFrequency: 'quarterly',
        retrievalPercent: 5
      });

      expect(res.recommendedTier).toBe('Coldline');
      expect(res.caveats).toContain('90-day');
    });

    it('recommends Archive for rare once-a-year disaster recovery data', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateStorageTier({
        volumeGb: 50000,
        accessFrequency: 'rare',
        retrievalPercent: 2
      });

      expect(res.recommendedTier).toBe('Archive');
      expect(res.caveats).toContain('365-day');
    });

    it('handles edge cases like 0 GB volume or negative numbers gracefully', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateStorageTier({
        volumeGb: 0,
        accessFrequency: 'daily'
      });

      expect(res.recommendedTier).toBe('Standard');
      expect(res.costs.Standard.totalCost).toBe(0);
    });
  });

  describe('2. Cloud Database Architectural Selection Matrix', () => {
    it('recommends BigQuery for analytical OLAP workloads regardless of scale', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateDatabase({
        workloadType: 'olap-analytics',
        scale: 'massive',
        latency: 'seconds-olap',
        consistency: 'strong'
      });

      expect(res.recommendedEngine).toBe('BigQuery');
      expect(res.matchPercent).toBeGreaterThanOrEqual(95);
      expect(res.primaryStrength).toContain('analytical');
    });

    it('recommends Cloud Spanner for globally distributed high-scale relational transactions', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateDatabase({
        workloadType: 'global-distributed',
        scale: 'massive',
        latency: 'single-digit-ms',
        consistency: 'strong'
      });

      expect(res.recommendedEngine).toBe('Cloud Spanner');
      expect(res.matchPercent).toBeGreaterThanOrEqual(95);
      expect(res.runnerUp).toBe('Cloud SQL');
    });

    it('recommends Cloud SQL for standard relational OLTP under 30TB', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateDatabase({
        workloadType: 'oltp-relational',
        scale: 'small',
        latency: 'single-digit-ms',
        consistency: 'strong'
      });

      expect(res.recommendedEngine).toBe('Cloud SQL');
      expect(res.tradeOffs).toBeDefined();
    });

    it('recommends Cloud Bigtable for high-throughput NoSQL key-value lookups', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateDatabase({
        workloadType: 'nosql-kv',
        scale: 'massive',
        latency: 'single-digit-ms',
        consistency: 'strong'
      });

      expect(res.recommendedEngine).toBe('Cloud Bigtable');
    });

    it('recommends Firestore for document workloads with real-time sync', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateDatabase({
        workloadType: 'document',
        scale: 'small',
        latency: 'single-digit-ms',
        consistency: 'strong'
      });

      expect(res.recommendedEngine).toBe('Firestore');
    });
  });

  describe('3. Cloud Compute / Container Platform Selection Matrix', () => {
    it('recommends Cloud Run for stateless containerized APIs wanting zero ops', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateCompute({
        workloadNature: 'stateless-container',
        opsModel: 'zero-ops'
      });

      expect(res.recommendedPlatform).toBe('Cloud Run');
      expect(res.matchPercent).toBeGreaterThanOrEqual(95);
    });

    it('recommends GKE for complex orchestration or multi-service clusters', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateCompute({
        workloadNature: 'complex-orchestration',
        opsModel: 'managed-k8s'
      });

      expect(res.recommendedPlatform).toBe('Google Kubernetes Engine (GKE)');
    });

    it('recommends Compute Engine for legacy VMs or full OS kernel control', () => {
      const calc = window.gcloudcafeCalculator;
      const res = calc.calculateCompute({
        workloadNature: 'traditional-vm',
        opsModel: 'full-control'
      });

      expect(res.recommendedPlatform).toBe('Compute Engine');
    });
  });
});
