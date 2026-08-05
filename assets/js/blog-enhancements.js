/* blog-enhancements.js — reading progress, copy-code, scroll-to-top, header hide/show, search shortcut, active TOC */
(function () {
  "use strict";

  /* ── Auto-hide Header on Scroll ── */
  function initHeaderScroll() {
    var header = document.querySelector(".header");
    if (!header) return;

    var lastScrollY = window.scrollY || window.pageYOffset;
    var ticking = false;
    var SCROLL_THRESHOLD = 80;

    function onScroll() {
      var navToggle = document.getElementById("nav-toggle");
      if (navToggle && navToggle.checked) return;

      if (!ticking) {
        window.requestAnimationFrame(function () {
          var currentScrollY = window.scrollY || window.pageYOffset;
          if (currentScrollY > SCROLL_THRESHOLD) {
            if (currentScrollY > lastScrollY) {
              header.classList.add("header--hidden");
            } else {
              header.classList.remove("header--hidden");
            }
          } else {
            header.classList.remove("header--hidden");
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── Reading Progress Bar ── */
  function initReadingProgress() {
    var bar = document.getElementById("reading-progress-bar");
    if (!bar) return;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(100, pct) + "%";
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ── Copy-to-Clipboard for Code Blocks ── */
  function initCopyCode() {
    var blocks = document.querySelectorAll("pre");
    if (!blocks.length) return;

    blocks.forEach(function (pre) {
      if (pre.parentNode.classList.contains("code-block-wrapper")) return;

      var wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentNode.insertBefore(wrapper, pre);

      var code = pre.querySelector("code");
      var lang = "CODE";
      if (code) {
        var match = code.className.match(/(?:lang|language)-(\w+)/);
        if (match && match[1]) {
          lang = match[1].toUpperCase();
        }
      }

      var header = document.createElement("div");
      header.className = "code-block-header";
      header.innerHTML = '<span class="lang-tag">' + lang + '</span>';

      var btn = document.createElement("button");
      btn.className = "copy-code-btn blog-focus-ring";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
      header.appendChild(btn);

      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      btn.addEventListener("click", function () {
        var text = (code || pre).innerText || (code || pre).textContent || "";
        if (!navigator.clipboard) {
          fallbackCopy(text, btn);
          return;
        }
        navigator.clipboard.writeText(text).then(function () {
          showCopied(btn);
        });
      });
    });
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showCopied(btn);
    } catch (err) {}
    document.body.removeChild(ta);
  }

  function showCopied(btn) {
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    btn.classList.add("copied");
    setTimeout(function () {
      btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
      btn.classList.remove("copied");
    }, 2000);
  }

  /* ── Scroll-to-Top Button ── */
  function initScrollToTop() {
    var btn = document.getElementById("scroll-to-top");
    if (!btn) return;

    function toggle() {
      if ((window.scrollY || document.documentElement.scrollTop) > 400) {
        btn.classList.add("visible");
      } else {
        btn.classList.remove("visible");
      }
    }

    window.addEventListener("scroll", toggle, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    toggle();
  }

  /* ── Active Table of Contents Tracking ── */
  function initActiveTocTracking() {
    var tocLinks = document.querySelectorAll(".toc-link");
    if (!tocLinks.length) return;

    var headings = [];
    tocLinks.forEach(function (link) {
      var href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        var el = document.getElementById(href.substring(1));
        if (el) headings.push({ el: el, link: link });
      }
    });

    if (!headings.length) return;

    function onScroll() {
      var scrollPos = (window.scrollY || document.documentElement.scrollTop) + 120;
      var activeLink = null;

      for (var i = 0; i < headings.length; i++) {
        if (headings[i].el.offsetTop <= scrollPos) {
          activeLink = headings[i].link;
        } else {
          break;
        }
      }

      tocLinks.forEach(function (link) {
        if (link === activeLink) {
          link.classList.add("is-active");
        } else {
          link.classList.remove("is-active");
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── Keyboard Search Shortcut (Ctrl+K / Cmd+K) ── */
  function initSearchShortcut() {
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        var searchTrigger = document.querySelector("[data-target='search-modal'], [data-search-trigger], .search-trigger, [data-target='#search-modal']");
        if (searchTrigger) {
          e.preventDefault();
          searchTrigger.click();
        }
      }
    });
  }

  /* ── Init ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    initHeaderScroll();
    initReadingProgress();
    initCopyCode();
    initScrollToTop();
    initActiveTocTracking();
    initSearchShortcut();
  }
})();
