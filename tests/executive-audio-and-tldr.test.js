// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Executive Audio Reader & TL;DR Quick-Scan Engine', () => {
  const rootDir = path.resolve(__dirname, '..');

  // SpeechSynthesis Mock
  let mockUtteranceInstance = null;
  let mockSpeechSynthesis = {
    speaking: false,
    paused: false,
    speak: vi.fn((utterance) => {
      mockSpeechSynthesis.speaking = true;
      mockSpeechSynthesis.paused = false;
      mockUtteranceInstance = utterance;
      if (utterance.onstart) utterance.onstart();
    }),
    pause: vi.fn(() => {
      mockSpeechSynthesis.speaking = true;
      mockSpeechSynthesis.paused = true;
      if (mockUtteranceInstance && mockUtteranceInstance.onpause) {
        mockUtteranceInstance.onpause();
      }
    }),
    resume: vi.fn(() => {
      mockSpeechSynthesis.speaking = true;
      mockSpeechSynthesis.paused = false;
      if (mockUtteranceInstance && mockUtteranceInstance.onresume) {
        mockUtteranceInstance.onresume();
      }
    }),
    cancel: vi.fn(() => {
      mockSpeechSynthesis.speaking = false;
      mockSpeechSynthesis.paused = false;
      if (mockUtteranceInstance && mockUtteranceInstance.onend) {
        mockUtteranceInstance.onend();
      }
    }),
    getVoices: vi.fn(() => [
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Microsoft David', lang: 'en-US' }
    ])
  };

  class MockSpeechSynthesisUtterance {
    constructor(text) {
      this.text = text || '';
      this.rate = 1.0;
      this.pitch = 1.0;
      this.lang = 'en-US';
      this.onstart = null;
      this.onend = null;
      this.onpause = null;
      this.onresume = null;
      this.onerror = null;
      this.onboundary = null;
    }
  }

  beforeEach(() => {
    // Inject Mock Speech APIs into window
    window.speechSynthesis = mockSpeechSynthesis;
    window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    vi.clearAllMocks();

    delete window.gcloudcafeAudioReader;
    delete window.gcloudcafeTldr;

    // Load assets/js/blog-enhancements.js
    const scriptPath = path.join(rootDir, 'assets/js/blog-enhancements.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const fn = new Function(scriptContent);
    fn();
  });

  describe('1. Clean Text Extraction for Audio Reader', () => {
    it('extracts prose while stripping code blocks, terminals, and tables', () => {
      const container = document.createElement('div');
      container.className = 'content';
      container.innerHTML = `
        <p>Google Cloud Storage provides four distinct storage classes.</p>
        <div class="dev-terminal-wrapper">
          <pre><code class="language-bash">gsutil mb -c coldline gs://my-bucket</code></pre>
        </div>
        <p>Choosing Nearline vs Coldline depends on access frequency and retrieval fees.</p>
        <table>
          <tr><th>Class</th><th>Price</th></tr>
          <tr><td>Standard</td><td>$0.02</td></tr>
        </table>
        <p>Always verify retention commitments before migrating archives.</p>
      `;

      expect(window.gcloudcafeAudioReader).toBeDefined();
      const clean = window.gcloudcafeAudioReader.extractCleanText(container);

      expect(clean).toContain('Google Cloud Storage provides four distinct storage classes.');
      expect(clean).toContain('Choosing Nearline vs Coldline depends on access frequency');
      expect(clean).toContain('Always verify retention commitments before migrating archives.');
      // Code blocks and tables must be stripped
      expect(clean).not.toContain('gsutil mb -c coldline');
      expect(clean).not.toContain('$0.02');
    });

    it('handles empty or null containers gracefully', () => {
      expect(window.gcloudcafeAudioReader.extractCleanText(null)).toBe('');
      const emptyDiv = document.createElement('div');
      expect(window.gcloudcafeAudioReader.extractCleanText(emptyDiv)).toBe('');
    });
  });

  describe('2. Audio Reader Playback Engine & State Machine', () => {
    it('initializes in idle stopped state', () => {
      const state = window.gcloudcafeAudioReader.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.rate).toBe(1.0);
    });

    it('plays text and transitions to isPlaying state', () => {
      const text = 'Welcome to GCloudCafe architecture deep dives.';
      window.gcloudcafeAudioReader.play(text);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const state = window.gcloudcafeAudioReader.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    it('pauses and resumes playback accurately', () => {
      window.gcloudcafeAudioReader.play('Sample text for playback control.');
      window.gcloudcafeAudioReader.pause();

      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
      let state = window.gcloudcafeAudioReader.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.isPaused).toBe(true);

      window.gcloudcafeAudioReader.resume();
      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
      state = window.gcloudcafeAudioReader.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    it('stops playback and resets state on cancel', () => {
      window.gcloudcafeAudioReader.play('Testing stop.');
      window.gcloudcafeAudioReader.stop();

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      const state = window.gcloudcafeAudioReader.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    it('adjusts playback speed rate (1x, 1.25x, 1.5x, 2x)', () => {
      window.gcloudcafeAudioReader.setRate(1.5);
      expect(window.gcloudcafeAudioReader.getState().rate).toBe(1.5);

      window.gcloudcafeAudioReader.setRate(2.0);
      expect(window.gcloudcafeAudioReader.getState().rate).toBe(2.0);
    });
  });

  describe('3. Executive TL;DR Extraction & Formatting Engine', () => {
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

  describe('4. Interactive UI Controls (Drawer & Audio Bar Integration)', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <!-- TL;DR Drawer Trigger -->
        <button type="button" data-tldr-drawer-trigger>Executive TL;DR</button>

        <!-- Listen Button -->
        <button type="button" data-listen-article-btn>Listen to Article</button>

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
            <button id="tldr-listen-btn">Listen to Summary</button>
            <button data-tldr-drawer-close>Close</button>
          </div>
        </div>

        <!-- Floating Audio Player Bar -->
        <div id="article-audio-bar" class="hidden">
          <span id="audio-bar-title"></span>
          <button id="audio-play-pause-btn"><i class="fa-solid fa-play"></i></button>
          <div id="audio-progress-bar"><div id="audio-progress-fill" style="width: 0%;"></div></div>
          <button data-audio-rate="1">1x</button>
          <button data-audio-rate="1.5">1.5x</button>
          <button data-audio-rate="2">2x</button>
          <button id="audio-bar-close"><i class="fa-solid fa-xmark"></i></button>
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

    it('activates floating audio bar and starts playback on Listen click', () => {
      const listenBtn = document.querySelector('[data-listen-article-btn]');
      const audioBar = document.getElementById('article-audio-bar');

      listenBtn.click();

      expect(audioBar.classList.contains('hidden')).toBe(false);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(window.gcloudcafeAudioReader.getState().isPlaying).toBe(true);
    });

    it('toggles play/pause from audio bar', () => {
      const listenBtn = document.querySelector('[data-listen-article-btn]');
      listenBtn.click();

      const playPauseBtn = document.getElementById('audio-play-pause-btn');
      playPauseBtn.click(); // Pause
      expect(window.gcloudcafeAudioReader.getState().isPaused).toBe(true);

      playPauseBtn.click(); // Resume
      expect(window.gcloudcafeAudioReader.getState().isPaused).toBe(false);
    });

    it('switches speed rate when audio rate buttons are clicked', () => {
      const rateBtn15 = document.querySelector('[data-audio-rate="1.5"]');
      rateBtn15.click();
      expect(window.gcloudcafeAudioReader.getState().rate).toBe(1.5);
    });

    it('closes audio bar and stops speech on close click', () => {
      const listenBtn = document.querySelector('[data-listen-article-btn]');
      listenBtn.click();

      const closeAudioBtn = document.getElementById('audio-bar-close');
      const audioBar = document.getElementById('article-audio-bar');

      closeAudioBtn.click();
      expect(audioBar.classList.contains('hidden')).toBe(true);
      expect(window.gcloudcafeAudioReader.getState().isPlaying).toBe(false);
    });
  });
});
