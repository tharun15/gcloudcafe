// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Bookmarks Storage & Management Engine', () => {
  let mockStorage;
  let store;
  const rootDir = path.resolve(__dirname, '..');

  beforeEach(() => {
    store = {};
    mockStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, val) => { store[key] = String(val); }),
      removeItem: vi.fn((key) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; })
    };

    // Reset DOM
    document.body.innerHTML = `
      <div id="bookmarks-header-count" class="hidden">0</div>
      <button data-bookmarks-badge class="hidden">0</button>
      <button id="bookmarks-drawer-trigger" data-bookmarks-drawer-trigger></button>
      <div id="bookmarks-drawer-count">0 articles</div>
      <button id="bookmarks-clear-all" style="display:none"></button>
      
      <div id="bookmarks-drawer" class="pointer-events-none opacity-0">
        <div id="bookmarks-drawer-backdrop"></div>
        <div id="bookmarks-drawer-panel" class="translate-x-full">
          <button data-bookmarks-drawer-close></button>
          <div id="bookmarks-drawer-list"></div>
          <div id="bookmarks-empty-state" class="hidden"></div>
        </div>
      </div>

      <button data-bookmark-btn data-article-url="/blog/gcp-storage/" data-article-title="GCP Storage" data-article-category="Cloud" data-article-readtime="5 min">
        <i class="fa-regular fa-bookmark"></i>
        <span data-bookmark-btn-text>Save for later</span>
      </button>
    `;

    // Load assets/js/blog-enhancements.js to populate window.gcloudcafeBookmarks
    const scriptPath = path.join(rootDir, 'assets/js/blog-enhancements.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    // Run script in global context
    const fn = new Function(scriptContent);
    fn();
  });

  it('exposes window.gcloudcafeBookmarks with all required methods', () => {
    expect(window.gcloudcafeBookmarks).toBeDefined();
    expect(typeof window.gcloudcafeBookmarks.getBookmarks).toBe('function');
    expect(typeof window.gcloudcafeBookmarks.isArticleBookmarked).toBe('function');
    expect(typeof window.gcloudcafeBookmarks.toggleBookmark).toBe('function');
    expect(typeof window.gcloudcafeBookmarks.removeBookmark).toBe('function');
    expect(typeof window.gcloudcafeBookmarks.clearAllBookmarks).toBe('function');
  });

  describe('Core Data & Storage Operations', () => {
    it('returns empty array when nothing stored or corrupt JSON', () => {
      const bm = window.gcloudcafeBookmarks;
      expect(bm.getBookmarks(mockStorage)).toEqual([]);

      mockStorage.setItem('gcloudcafe_saved_bookmarks', 'invalid-json{{{');
      expect(bm.getBookmarks(mockStorage)).toEqual([]);

      mockStorage.setItem('gcloudcafe_saved_bookmarks', '{"not":"an array"}');
      expect(bm.getBookmarks(mockStorage)).toEqual([]);
    });

    it('toggles a bookmark ON when not present', () => {
      const bm = window.gcloudcafeBookmarks;
      const article = {
        url: '/blog/gcp-data-engineering-storage-building-blocks/',
        title: 'GCP Data Engineering: Cloud Storage Building Blocks',
        category: 'Cloud Architecture',
        readTime: '8 min read'
      };

      const res = bm.toggleBookmark(article, mockStorage);
      expect(res.isSaved).toBe(true);
      expect(res.count).toBe(1);
      expect(res.bookmarks.length).toBe(1);
      expect(res.bookmarks[0].title).toBe(article.title);
      expect(res.bookmarks[0].url).toBe(article.url);
      expect(res.bookmarks[0].savedAt).toBeTypeOf('number');

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'gcloudcafe_saved_bookmarks',
        expect.stringContaining(article.title)
      );
    });

    it('toggles a bookmark OFF when already present (clean toggle)', () => {
      const bm = window.gcloudcafeBookmarks;
      const article = {
        url: '/blog/gcp-data-engineering-storage-building-blocks/',
        title: 'GCP Data Engineering: Cloud Storage Building Blocks',
        category: 'Cloud Architecture',
        readTime: '8 min read'
      };

      bm.toggleBookmark(article, mockStorage);
      expect(bm.isArticleBookmarked(article.url, mockStorage)).toBe(true);

      const res = bm.toggleBookmark(article, mockStorage);
      expect(res.isSaved).toBe(false);
      expect(res.count).toBe(0);
      expect(res.bookmarks).toEqual([]);
      expect(bm.isArticleBookmarked(article.url, mockStorage)).toBe(false);
    });

    it('normalizes URLs with or without trailing slash for isArticleBookmarked', () => {
      const bm = window.gcloudcafeBookmarks;
      const article = {
        url: '/blog/kubernetes-tls-certs/',
        title: 'Kubernetes TLS Certs'
      };

      bm.toggleBookmark(article, mockStorage);
      expect(bm.isArticleBookmarked('/blog/kubernetes-tls-certs/', mockStorage)).toBe(true);
      expect(bm.isArticleBookmarked('/blog/kubernetes-tls-certs', mockStorage)).toBe(true);
      expect(bm.isArticleBookmarked('/blog/other-post/', mockStorage)).toBe(false);
    });

    it('removes a specific bookmark by URL', () => {
      const bm = window.gcloudcafeBookmarks;
      bm.toggleBookmark({ url: '/blog/post-1/', title: 'Post 1' }, mockStorage);
      bm.toggleBookmark({ url: '/blog/post-2/', title: 'Post 2' }, mockStorage);

      expect(bm.getBookmarks(mockStorage).length).toBe(2);

      const res = bm.removeBookmark('/blog/post-1/', mockStorage);
      expect(res.count).toBe(1);
      expect(res.bookmarks[0].url).toBe('/blog/post-2/');
      expect(bm.isArticleBookmarked('/blog/post-1/', mockStorage)).toBe(false);
    });

    it('clears all bookmarks', () => {
      const bm = window.gcloudcafeBookmarks;
      bm.toggleBookmark({ url: '/blog/post-1/', title: 'Post 1' }, mockStorage);
      bm.toggleBookmark({ url: '/blog/post-2/', title: 'Post 2' }, mockStorage);

      const cleared = bm.clearAllBookmarks(mockStorage);
      expect(cleared).toEqual([]);
      expect(bm.getBookmarks(mockStorage)).toEqual([]);
      expect(mockStorage.setItem).toHaveBeenCalledWith('gcloudcafe_saved_bookmarks', '[]');
    });

    it('sanitizes HTML tags in titles and categories to prevent XSS', () => {
      const bm = window.gcloudcafeBookmarks;
      const malicious = {
        url: '/blog/xss-test/',
        title: '<script>alert("xss")</script>Secure Title',
        category: '<b onmouseover="alert(1)">Security</b>',
        readTime: '5 min'
      };

      const res = bm.toggleBookmark(malicious, mockStorage);
      expect(res.bookmarks[0].title).not.toContain('<script>');
      expect(res.bookmarks[0].title).toContain('&lt;script&gt;');
      expect(res.bookmarks[0].category).not.toContain('<b');
    });
  });

  describe('UI Synchronization & Badges', () => {
    it('updates header badge count and hides when zero', () => {
      const bm = window.gcloudcafeBookmarks;
      const badge = document.getElementById('bookmarks-header-count');

      bm.updateBadges(0);
      expect(badge.textContent).toBe('0');
      expect(badge.classList.contains('hidden')).toBe(true);

      bm.updateBadges(3);
      expect(badge.textContent).toBe('3');
      expect(badge.classList.contains('hidden')).toBe(false);
    });

    it('renders empty state in drawer when no bookmarks exist', () => {
      const bm = window.gcloudcafeBookmarks;
      bm.renderDrawerBookmarks([], mockStorage);

      const list = document.getElementById('bookmarks-drawer-list');
      const emptyState = document.getElementById('bookmarks-empty-state');

      expect(list.children.length).toBe(0);
      expect(emptyState.classList.contains('hidden')).toBe(false);
    });

    it('renders article cards in drawer when bookmarks exist', () => {
      const bm = window.gcloudcafeBookmarks;
      const articles = [
        {
          url: '/blog/gcp-storage/',
          title: 'GCP Storage Patterns',
          category: 'Architecture',
          readTime: '7 min read',
          savedAt: Date.now()
        }
      ];

      bm.renderDrawerBookmarks(articles, mockStorage);

      const list = document.getElementById('bookmarks-drawer-list');
      const emptyState = document.getElementById('bookmarks-empty-state');

      expect(emptyState.classList.contains('hidden')).toBe(true);
      expect(list.children.length).toBe(1);
      expect(list.innerHTML).toContain('GCP Storage Patterns');
      expect(list.innerHTML).toContain('/blog/gcp-storage/');
    });
  });

  describe('Template & Layout Integrity', () => {
    it('verifies bookmarks drawer partial exists and is accessible', () => {
      const drawerFile = path.join(rootDir, 'layouts/partials/components/bookmarks-drawer.html');
      expect(fs.existsSync(drawerFile)).toBe(true);
      const content = fs.readFileSync(drawerFile, 'utf8');
      expect(content).toContain('id="bookmarks-drawer"');
      expect(content).toContain('id="bookmarks-drawer-list"');
      expect(content).toContain('id="bookmarks-empty-state"');
      expect(content).toContain('role="dialog"');
      expect(content).toContain('aria-modal="true"');
    });

    it('verifies bookmarks trigger is integrated in header.html', () => {
      const headerFile = path.join(rootDir, 'layouts/partials/essentials/header.html');
      const content = fs.readFileSync(headerFile, 'utf8');
      expect(content).toContain('data-bookmarks-drawer-trigger');
      expect(content).toContain('id="bookmarks-header-count"');
    });

    it('verifies bookmarks drawer is mounted in baseof.html', () => {
      const baseofFile = path.join(rootDir, 'layouts/_default/baseof.html');
      const content = fs.readFileSync(baseofFile, 'utf8');
      expect(content).toContain('bookmarks-drawer.html');
    });

    it('verifies bookmark toggle buttons exist in blog-card.html and single.html', () => {
      const cardFile = path.join(rootDir, 'layouts/partials/components/blog-card.html');
      const cardContent = fs.readFileSync(cardFile, 'utf8');
      expect(cardContent).toContain('data-bookmark-btn');
      expect(cardContent).toContain('data-article-url');

      const singleFile = path.join(rootDir, 'layouts/blog/single.html');
      const singleContent = fs.readFileSync(singleFile, 'utf8');
      expect(singleContent).toContain('data-bookmark-btn');
      expect(singleContent).toContain('Save for later');
    });
  });
});
