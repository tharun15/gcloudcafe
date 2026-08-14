import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

describe('GitHub Actions Workflow Integrity & Syntax Suite', () => {
  const workflowsDir = path.resolve(process.cwd(), '.github', 'workflows');

  it('validates all YAML workflow files parse without syntax errors', () => {
    const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    expect(files.length).toBeGreaterThanOrEqual(3);

    files.forEach(file => {
      const filePath = path.join(workflowsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(() => {
        yaml.parse(content);
      }).not.toThrow();
    });
  });

  it('validates main.yml contains pull_request triggers and properly indented permissions', () => {
    const mainPath = path.join(workflowsDir, 'main.yml');
    const content = fs.readFileSync(mainPath, 'utf-8');
    const parsed = yaml.parse(content);

    expect(parsed.on).toBeDefined();
    expect(parsed.on.push).toBeDefined();
    expect(parsed.on.pull_request).toBeDefined();
    expect(parsed.on.push.branches).toContain('main');
    expect(parsed.on.pull_request.branches).toContain('main');

    expect(parsed.permissions).toBeDefined();
    expect(parsed.permissions.contents).toBe('read');
    expect(parsed.permissions.pages).toBe('write');
    expect(parsed.permissions['id-token']).toBe('write');

    expect(parsed.jobs.deploy).toBeDefined();
    expect(parsed.jobs.deploy.if).toContain('github.event_name == \'push\'');
  });

  it('validates cloud-pulse-ingest.yml has schedule and workflow_dispatch', () => {
    const pulsePath = path.join(workflowsDir, 'cloud-pulse-ingest.yml');
    const content = fs.readFileSync(pulsePath, 'utf-8');
    const parsed = yaml.parse(content);

    expect(parsed.on).toBeDefined();
    expect(parsed.on.schedule).toBeDefined();
    expect(parsed.on.workflow_dispatch).toBeDefined();
    expect(parsed.jobs['scrape-and-ingest']).toBeDefined();
  });
});
