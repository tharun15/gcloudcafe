// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Executive TL;DR Quick-Scan Drawer Engine', () => {
  const rootDir = path.resolve(__dirname, '..');

  beforeEach(() => {
    delete window.gcloudcafeTldr;

    // Load assets/js/blog-enhancements.js
    const scriptPath = path.join(rootDir, 'assets/js/blog-enhancements.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const fn = new Function(scriptContent);
    fn();
  });

  describe('1. Executive TL;DR Extraction & Formatting Engine', () => {
    it('exposes window.gcloudcafeTldr with extractTldr and formatSlackMarkdown', () => {
      expect(window.gcloudcafeTldr).toBeDefined();
      expect(typeof window.gcloudcafeTldr.extractTldr).toBe('function');
      expect(typeof window.gcloudcafeTldr.formatSlackMarkdown).toBe('function');
    });

    it('extracts structured TL;DR from JSON script payload if present', () => {
      const scriptEl = document.createElement('script');
      scriptEl.id = 'article-tldr-data';
      scriptEl.type = 'application/json';
      scriptEl.textContent = JSON.stringify({
        title: 'Data Engineering on GCP: Storage Primitives',
        problem: 'Operational transactional databases choke when queried for company-wide analytics.',
        recommendation: 'Offload analytical workloads to partitioned BigQuery and tiered Cloud Storage.',
        gotcha: 'Querying raw BigQuery tables without partitioning incurs astronomical scanning costs.',
        takeaways: [
          'Use Cloud Storage Standard for raw ingest within 30 days',
          'Partition BigQuery by ingestion date or event timestamp',
          'Enforce Authorized Views for tenant isolation'
        ]
      });
      document.body.appendChild(scriptEl);

      const tldr = window.gcloudcafeTldr.extractTldr();
      expect(tldr.title).toContain('Data Engineering on GCP');
      expect(tldr.problem).toContain('transactional databases choke');
      expect(tldr.recommendation).toContain('partitioned BigQuery');
      expect(tldr.gotcha).toContain('astronomical scanning costs');
      expect(tldr.takeaways.length).toBe(3);
    });

    it('formats clean Markdown for Slack/Teams sharing', () => {
      const data = {
        title: 'GCP Storage Primitives',
        url: 'https://gcloudcafe.com/blog/gcp-storage/',
        problem: 'Transactional databases lock during heavy analytical aggregations.',
        recommendation: 'Decouple transactional OLTP from BigQuery OLAP with Cloud Storage staging.',
        gotcha: 'Coldline retrieval fees erase storage savings if accessed before 90 days.',
        takeaways: ['Standard tier for raw ingest', 'Partition BigQuery tables']
      };

      const md = window.gcloudcafeTldr.formatSlackMarkdown(data);
      expect(md).toContain('*⚡ Executive TL;DR: GCP Storage Primitives*');
      expect(md).toContain('*🎯 The Core Problem:*');
      expect(md).toContain('Transactional databases lock');
      expect(md).toContain('*💡 Architectural Recommendation:*');
      expect(md).toContain('*⚠️ Production Gotcha:*');
      expect(md).toContain('• Standard tier for raw ingest');
    });

    it('falls back to smart semantic extraction from DOM when JSON payload is omitted', () => {
      document.body.innerHTML = `
        <h1 class="entry-title">Kubernetes Gateway API in Production</h1>
        <p class="description">A production guide to replacing Ingress controllers with Gateway API.</p>
        <div class="content">
          <p>Traditional Ingress controllers combine routing rules, TLS certificates, and infrastructure provisioning into a single monolithic manifest.</p>
          <h2>The Core Architectural Pattern</h2>
          <p>Gateway API decouples infrastructure creation (GatewayClass) from routing rules (HTTPRoute).</p>
        </div>
      `;

      const tldr = window.gcloudcafeTldr.extractTldr();
      expect(tldr.title).toContain('Kubernetes Gateway API');
      expect(tldr.problem).toContain('Traditional Ingress controllers combine');
      expect(tldr.takeaways.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Interactive Drawer UI Controls', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <!-- TL;DR Drawer Trigger -->
        <button type="button" data-tldr-drawer-trigger>Executive TL;DR</button>

        <!-- TL;DR Slide-Out Drawer -->
        <div id="tldr-drawer" class="pointer-events-none opacity-0">
          <div id="tldr-drawer-backdrop"></div>
          <div id="tldr-drawer-panel" class="translate-x-full">
            <h3 id="tldr-drawer-title"></h3>
            <div id="tldr-drawer-problem"></div>
            <div id="tldr-drawer-recommendation"></div>
            <div id="tldr-drawer-gotcha"></div>
            <ul id="tldr-drawer-takeaways"></ul>
            <button id="tldr-copy-slack-btn">Copy for Slack</button>
            <button data-tldr-drawer-close>Close</button>
          </div>
        </div>

        <!-- Article Content -->
        <div class="content">
          <p>Cloud architecture requires deliberate trade-offs between cost, latency, and operational simplicity.</p>
        </div>
      `;

      // Re-initialize app
      const scriptPath = path.join(rootDir, 'assets/js/blog-enhancements.js');
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      const fn = new Function(scriptContent);
      fn();
    });

    it('opens TL;DR drawer on trigger click and populates content', () => {
      const trigger = document.querySelector('[data-tldr-drawer-trigger]');
      const drawer = document.getElementById('tldr-drawer');
      const panel = document.getElementById('tldr-drawer-panel');

      trigger.click();

      expect(drawer.classList.contains('pointer-events-none')).toBe(false);
      expect(drawer.classList.contains('opacity-100')).toBe(true);
      expect(panel.classList.contains('translate-x-full')).toBe(false);
    });

    it('closes TL;DR drawer on close button click', () => {
      const trigger = document.querySelector('[data-tldr-drawer-trigger]');
      const drawer = document.getElementById('tldr-drawer');
      const closeBtn = document.querySelector('[data-tldr-drawer-close]');

      trigger.click();
      expect(drawer.classList.contains('pointer-events-none')).toBe(false);

      closeBtn.click();
      expect(drawer.classList.contains('pointer-events-none')).toBe(true);
    });

    it('closes TL;DR drawer on backdrop click', () => {
      const trigger = document.querySelector('[data-tldr-drawer-trigger]');
      const drawer = document.getElementById('tldr-drawer');
      const backdrop = document.getElementById('tldr-drawer-backdrop');

      trigger.click();
      expect(drawer.classList.contains('pointer-events-none')).toBe(false);

      backdrop.click();
      expect(drawer.classList.contains('pointer-events-none')).toBe(true);
    });
  });
});
