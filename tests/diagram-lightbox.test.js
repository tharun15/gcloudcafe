// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Interactive Architecture Diagram Lightbox Engine', () => {
  const rootDir = path.resolve(__dirname, '..');

  const setupDOM = () => {
    document.body.innerHTML = `
      <!-- Diagram Lightbox Modal -->
      <div id="diagram-lightbox" class="fixed inset-0 z-[100] opacity-0 pointer-events-none transition-opacity duration-200" aria-modal="true" role="dialog" aria-hidden="true">
        <div id="diagram-lightbox-backdrop" class="absolute inset-0 bg-slate-950/85 backdrop-blur-md"></div>
        <div class="relative z-10 flex flex-col h-full w-full">
          <!-- Lightbox Header -->
          <header class="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <i class="fa-solid fa-diagram-project mr-1.5"></i> Architecture Diagram
              </span>
              <h3 id="diagram-lightbox-title" class="text-sm font-semibold text-slate-100 truncate max-w-md"></h3>
            </div>
            <!-- Toolbar Controls -->
            <div class="flex items-center gap-2">
              <span id="diagram-zoom-level" class="text-xs font-mono text-slate-400 px-2 py-1 bg-slate-800/60 rounded">100%</span>
              <button id="lightbox-zoom-out" type="button" aria-label="Zoom Out" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
                <i class="fa-solid fa-magnifying-glass-minus"></i>
              </button>
              <button id="lightbox-zoom-in" type="button" aria-label="Zoom In" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
                <i class="fa-solid fa-magnifying-glass-plus"></i>
              </button>
              <button id="lightbox-reset-zoom" type="button" aria-label="Reset Zoom" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
              <button id="lightbox-close-btn" type="button" aria-label="Close Lightbox" class="p-2 ml-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </header>
          <!-- Lightbox Viewport -->
          <div id="diagram-lightbox-viewport" class="flex-1 overflow-hidden relative flex items-center justify-center p-4">
            <div id="diagram-lightbox-canvas" class="transition-transform duration-100 origin-center">
              <div id="diagram-lightbox-content"></div>
            </div>
          </div>
          <!-- Lightbox Footer / Hint -->
          <footer class="px-6 py-2.5 text-center text-xs text-slate-500 border-t border-slate-800/50 bg-slate-900/40">
            Use <kbd class="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[11px]">+</kbd> / <kbd class="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[11px]">-</kbd> to zoom, click and drag to pan, or <kbd class="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[11px]">ESC</kbd> to close.
          </footer>
        </div>
      </div>

      <!-- Sample Blog Content with Architecture Diagram & Mermaid SVG -->
      <article class="blog-article-content">
        <figure>
          <img id="test-arch-img" src="/images/cloud-storage-tiers.png" alt="GCP Cloud Storage Architecture & Lifecycle Flow" class="rounded-xl shadow-md" />
          <figcaption>Figure 1: Cloud Storage tiered lifecycle routing</figcaption>
        </figure>

        <div class="mermaid" id="test-mermaid-container">
          <svg id="test-mermaid-svg" viewBox="0 0 800 400" aria-label="Event-Driven Microservices Flow">
            <g><text>PubSub ➔ Cloud Run ➔ BigQuery</text></g>
          </svg>
        </div>
      </article>
    `;
  };

  const loadScript = () => {
    const scriptPath = path.join(rootDir, 'assets/js/blog-enhancements.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const fn = new Function(scriptContent);
    fn();
  };

  beforeEach(() => {
    delete window.gcloudcafeLightbox;
    setupDOM();
    loadScript();
  });

  describe('1. Engine Initialization & API Surface', () => {
    it('exposes window.gcloudcafeLightbox with control methods', () => {
      expect(window.gcloudcafeLightbox).toBeDefined();
      expect(typeof window.gcloudcafeLightbox.open).toBe('function');
      expect(typeof window.gcloudcafeLightbox.close).toBe('function');
      expect(typeof window.gcloudcafeLightbox.zoomIn).toBe('function');
      expect(typeof window.gcloudcafeLightbox.zoomOut).toBe('function');
      expect(typeof window.gcloudcafeLightbox.resetZoom).toBe('function');
      expect(typeof window.gcloudcafeLightbox.getScale).toBe('function');
    });

    it('attaches click listeners to article images and SVGs', () => {
      const img = document.getElementById('test-arch-img');
      const lightbox = document.getElementById('diagram-lightbox');
      const title = document.getElementById('diagram-lightbox-title');

      img.click();

      expect(lightbox.classList.contains('pointer-events-none')).toBe(false);
      expect(lightbox.classList.contains('opacity-100')).toBe(true);
      expect(title.textContent).toContain('Cloud Storage');
    });

    it('opens Mermaid diagrams into lightbox on click', () => {
      const svg = document.getElementById('test-mermaid-svg');
      const lightbox = document.getElementById('diagram-lightbox');
      const content = document.getElementById('diagram-lightbox-content');

      svg.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(lightbox.classList.contains('pointer-events-none')).toBe(false);
      expect(content.querySelector('svg')).not.toBeNull();
    });
  });

  describe('2. Zoom Engine & Scale Clamping', () => {
    it('starts at 100% scale and scales up with zoomIn', () => {
      const img = document.getElementById('test-arch-img');
      img.click();

      expect(window.gcloudcafeLightbox.getScale()).toBe(1.0);

      window.gcloudcafeLightbox.zoomIn();
      expect(window.gcloudcafeLightbox.getScale()).toBe(1.25);

      const zoomLabel = document.getElementById('diagram-zoom-level');
      expect(zoomLabel.textContent).toBe('125%');
    });

    it('clamps zoom out at 1.0 (100%) and zoom in at 4.0 (400%)', () => {
      const img = document.getElementById('test-arch-img');
      img.click();

      // Attempt zoom out below 1.0
      window.gcloudcafeLightbox.zoomOut();
      expect(window.gcloudcafeLightbox.getScale()).toBe(1.0);

      // Zoom in to maximum 4.0
      for (let i = 0; i < 20; i++) {
        window.gcloudcafeLightbox.zoomIn();
      }
      expect(window.gcloudcafeLightbox.getScale()).toBe(4.0);
    });

    it('resets zoom to 1.0 when resetZoom is triggered', () => {
      const img = document.getElementById('test-arch-img');
      img.click();

      window.gcloudcafeLightbox.zoomIn();
      window.gcloudcafeLightbox.zoomIn();
      expect(window.gcloudcafeLightbox.getScale()).toBe(1.5);

      window.gcloudcafeLightbox.resetZoom();
      expect(window.gcloudcafeLightbox.getScale()).toBe(1.0);
      const zoomLabel = document.getElementById('diagram-zoom-level');
      expect(zoomLabel.textContent).toBe('100%');
    });
  });

  describe('3. Toolbar Button Interactions', () => {
    it('zooms in when #lightbox-zoom-in button is clicked', () => {
      const img = document.getElementById('test-arch-img');
      img.click();

      const btnZoomIn = document.getElementById('lightbox-zoom-in');
      btnZoomIn.click();

      expect(window.gcloudcafeLightbox.getScale()).toBe(1.25);
    });

    it('zooms out when #lightbox-zoom-out button is clicked', () => {
      const img = document.getElementById('test-arch-img');
      img.click();

      window.gcloudcafeLightbox.zoomIn();
      expect(window.gcloudcafeLightbox.getScale()).toBe(1.25);

      const btnZoomOut = document.getElementById('lightbox-zoom-out');
      btnZoomOut.click();

      expect(window.gcloudcafeLightbox.getScale()).toBe(1.0);
    });

    it('resets zoom when #lightbox-reset-zoom button is clicked', () => {
      const img = document.getElementById('test-arch-img');
      img.click();

      window.gcloudcafeLightbox.zoomIn();
      window.gcloudcafeLightbox.zoomIn();

      const btnReset = document.getElementById('lightbox-reset-zoom');
      btnReset.click();

      expect(window.gcloudcafeLightbox.getScale()).toBe(1.0);
    });
  });

  describe('4. Dismissal & Keyboard Controls', () => {
    it('closes on close button click', () => {
      const img = document.getElementById('test-arch-img');
      const lightbox = document.getElementById('diagram-lightbox');
      const closeBtn = document.getElementById('lightbox-close-btn');

      img.click();
      expect(lightbox.classList.contains('pointer-events-none')).toBe(false);

      closeBtn.click();
      expect(lightbox.classList.contains('pointer-events-none')).toBe(true);
      expect(window.gcloudcafeLightbox.getScale()).toBe(1.0);
    });

    it('closes on backdrop click', () => {
      const img = document.getElementById('test-arch-img');
      const lightbox = document.getElementById('diagram-lightbox');
      const backdrop = document.getElementById('diagram-lightbox-backdrop');

      img.click();
      expect(lightbox.classList.contains('pointer-events-none')).toBe(false);

      backdrop.click();
      expect(lightbox.classList.contains('pointer-events-none')).toBe(true);
    });

    it('handles keyboard shortcuts (ESC, +, -, 0)', () => {
      const img = document.getElementById('test-arch-img');
      const lightbox = document.getElementById('diagram-lightbox');
      img.click();

      // Zoom In via keyboard '+'
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
      expect(window.gcloudcafeLightbox.getScale()).toBe(1.25);

      // Reset via keyboard '0'
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '0' }));
      expect(window.gcloudcafeLightbox.getScale()).toBe(1.0);

      // Close via keyboard 'Escape'
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(lightbox.classList.contains('pointer-events-none')).toBe(true);
    });
  });
});
