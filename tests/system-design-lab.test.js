import { describe, it, expect } from 'vitest';

const AVAILABLE_COMPONENTS = {
  "vpc": { cost: 0 },
  "gateway": { cost: 15 },
  "cdn": { cost: 20 },
  "load_balancer": { cost: 18 },
  "storage": { cost: 10 },
  "kafka": { cost: 45 },
  "redis": { cost: 30 },
  "read_replicas": { cost: 60 }
};

function calculateTotalCost(selected) {
  let cost = 45; // Base 3-tier cost
  selected.forEach(key => {
    if (AVAILABLE_COMPONENTS[key]) cost += AVAILABLE_COMPONENTS[key].cost;
  });
  return cost;
}

function validateArchitecture(requiredComponents, selected) {
  const missing = requiredComponents.filter(req => selected.indexOf(req) === -1);
  return { success: missing.length === 0, missing };
}

describe('System Design Trade-off Lab Engine', () => {
  describe('Architecture Challenge Validation', () => {
    it('validates Challenge 1 (Read Latency) correctly when required components are added', () => {
      const required = ['redis', 'read_replicas'];
      
      const incomplete = validateArchitecture(required, ['redis']);
      expect(incomplete.success).toBe(false);
      expect(incomplete.missing).toEqual(['read_replicas']);

      const complete = validateArchitecture(required, ['redis', 'read_replicas', 'vpc']);
      expect(complete.success).toBe(true);
      expect(complete.missing).toEqual([]);
    });

    it('validates Challenge 2 (Write Spike Decoupling) correctly', () => {
      const required = ['kafka', 'load_balancer', 'vpc'];

      const resPartial = validateArchitecture(required, ['kafka', 'vpc']);
      expect(resPartial.success).toBe(false);
      expect(resPartial.missing).toEqual(['load_balancer']);

      const resComplete = validateArchitecture(required, ['kafka', 'load_balancer', 'vpc']);
      expect(resComplete.success).toBe(true);
    });
  });

  describe('Monthly Infrastructure Cost Calculator', () => {
    it('calculates base spend plus component upgrades accurately', () => {
      const selected = ['redis', 'kafka', 'vpc'];
      const total = calculateTotalCost(selected);
      // Base (45) + Redis (30) + Kafka (45) + VPC (0) = 120
      expect(total).toBe(120);
    });
  });
});
