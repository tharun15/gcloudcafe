/**
 * Mobile & Professional Enhancements
 * Adds smart features to improve mobile experience and user engagement
 */

(function() {
  'use strict';

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    fixViewportHeight();
    initMobileMenu();
    initFormValidation();
    initKeyboardNavigation();
    calculateReadingTime();
    generateTableOfContents();
    lazyLoadImages();
    initBackToTop();
    updateActiveLink();
    fixThemeSwitcherOverlap();
  }

  /**
   * Fix 100vh on mobile browsers
   */
  function fixViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');

    window.addEventListener('resize', () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', vh + 'px');
    });
  }

  /**
   * Mobile menu toggle
   */
  function initMobileMenu() {
    const toggle = document.querySelector('[data-mobile-menu-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });

    // Close on link click
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
      });
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        menu.classList.remove('open');
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    // Fix theme switcher overlap with breadcrumb
    function fixThemeSwitcherOverlap() {
      const themeSwitcher = document.querySelector('.theme-switcher');
      const breadcrumbs = document.querySelectorAll('.breadcrumb');

      if (!themeSwitcher || breadcrumbs.length === 0) return;

      // Ensure theme switcher doesn't interfere with breadcrumb clicks
      breadcrumbs.forEach(breadcrumb => {
        breadcrumb.addEventListener('click', (e) => {
          // Stop propagation to prevent theme switcher from being triggered
          e.stopPropagation();

          // If the click is on a link, let it proceed normally
          if (e.target.tagName === 'A') {
            return;
          }

          // For other breadcrumb elements, ensure they don't trigger theme switcher
          e.preventDefault();
        });
      });
    }

    // Initialize the fix
    fixThemeSwitcherOverlap();
  }

  /**
   * Calculate and display reading time
   */
  function calculateReadingTime() {
    const readingTimeEl = document.querySelector('[data-reading-time]');
    const content = document.querySelector('[data-reading-content]');

    if (!readingTimeEl || !content) return;

    const text = content.innerText;
    const wordCount = text.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200); // 200 words per minute

    readingTimeEl.textContent = `${readingTimeMinutes} min read`;
  }

  /**
   * Generate table of contents
   */
  function generateTableOfContents() {
    const tocContainer = document.querySelector('[data-toc-container]');
    const content = document.querySelector('[data-reading-content]');

    if (!tocContainer || !content) return;

    const headings = content.querySelectorAll('h2, h3, h4');
    if (headings.length === 0) return;

    const ul = document.createElement('ul');

    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = `heading-${index}`;
      }

      const li = document.createElement('li');
      const level = parseInt(heading.tagName[1]);
      li.style.marginLeft = `${(level - 2) * 1.5}rem`;

      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;

      li.appendChild(link);
      ul.appendChild(li);
    });

    tocContainer.innerHTML = '';
    tocContainer.appendChild(ul);

    // Make TOC sticky on scroll
    makeTocSticky(tocContainer);
  }

  /**
   * Make TOC sticky
   */
  function makeTocSticky(tocContainer) {
    if (window.innerWidth < 1024) return;

    window.addEventListener('scroll', () => {
      const rect = tocContainer.getBoundingClientRect();
      if (rect.top <= 100) {
        tocContainer.classList.add('sticky');
      } else {
        tocContainer.classList.remove('sticky');
      }
    });
  }

  /**
   * Lazy load images
   */
  function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      });

      images.forEach(img => observer.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.dataset.src;
      });
    }
  }

  /**
   * Back to top button
   */
  function initBackToTop() {
    const backToTopBtn = document.querySelector('[data-back-to-top]');

    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.display = 'block';
      } else {
        backToTopBtn.style.display = 'none';
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /**
   * Update active navigation link
   */
  function updateActiveLink() {
    const links = document.querySelectorAll('nav a');

    if (links.length === 0) return;

    window.addEventListener('scroll', () => {
      links.forEach(link => {
        link.classList.remove('active');

        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const section = document.querySelector(href);
          if (section) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
              link.classList.add('active');
            }
          }
        }
      });
    });
  }

  /**
   * Form validation
   */
  function initFormValidation() {
    const forms = document.querySelectorAll('[data-validate-form]');

    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
          if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
          } else {
            input.classList.remove('error');
          }
        });

        if (!isValid) {
          e.preventDefault();
        }
      });

      form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('blur', () => {
          if (!input.value.trim() && input.hasAttribute('required')) {
            input.classList.add('error');
          } else {
            input.classList.remove('error');
          }
        });
      });
    });
  }

  /**
   * Keyboard navigation
   */
  function initKeyboardNavigation() {
    const focusableElements = document.querySelectorAll(
      'a, button, input, select, textarea'
    );

    if (focusableElements.length === 0) return;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
        const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;

        if (nextIndex < 0) {
          focusableElements[focusableElements.length - 1].focus();
          e.preventDefault();
        } else if (nextIndex >= focusableElements.length) {
          focusableElements[0].focus();
          e.preventDefault();
        }
      }
    });
  }

  /**
   * Fix theme switcher overlap with breadcrumb
   */
  function fixThemeSwitcherOverlap() {
    const themeSwitcher = document.querySelector('.theme-switcher');
    const breadcrumbs = document.querySelectorAll('.breadcrumb');

    if (!themeSwitcher || breadcrumbs.length === 0) return;

    // Ensure theme switcher doesn't interfere with breadcrumb clicks
    breadcrumbs.forEach(breadcrumb => {
      breadcrumb.addEventListener('click', (e) => {
        // Stop propagation to prevent theme switcher from being triggered
        e.stopPropagation();

        // If the click is on a link, let it proceed normally
        if (e.target.tagName === 'A') {
          return;
        }

        // For other breadcrumb elements, ensure they don't trigger theme switcher
        e.preventDefault();
      });
    });
  }

  // Export for external use
  if (typeof window !== 'undefined') {
    window.gcloudcafe = {
      calculateReadingTime,
      generateTableOfContents,
      lazyLoadImages,
      initBackToTop,
      updateActiveLink,
      initMobileMenu,
      initFormValidation,
      initKeyboardNavigation,
      fixViewportHeight,
      fixThemeSwitcherOverlap
    };
  }
})();
