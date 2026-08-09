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

function validateArchitecture(requiredComponents, selected) {
  const missing = requiredComponents.filter(req => selected.indexOf(req) === -1);
  return { success: missing.length === 0, missing };
}

describe('System Design Trade-off Lab Engine', () => {
  describe('Data Engineering & Solution Unlock Validation', () => {
    it('validates Data Engineering Pipeline challenge correctly', () => {
      const required = ['kafka', 'storage', 'gateway', 'vpc'];

      const partial = validateArchitecture(required, ['kafka', 'vpc']);
      expect(partial.success).toBe(false);
      expect(partial.missing).toEqual(['storage', 'gateway']);

      const complete = validateArchitecture(required, ['kafka', 'storage', 'gateway', 'vpc']);
      expect(complete.success).toBe(true);
      expect(complete.missing).toEqual([]);
    });

    it('tracks 3 failed validation attempts to trigger solution unlock', () => {
      let failedAttempts = 0;
      const required = ['redis', 'read_replicas'];

      for (let i = 0; i < 3; i++) {
        const res = validateArchitecture(required, ['redis']);
        if (!res.success) failedAttempts++;
      }

      expect(failedAttempts).toBe(3);
      expect(failedAttempts >= 3).toBe(true);
    });
  });
});
