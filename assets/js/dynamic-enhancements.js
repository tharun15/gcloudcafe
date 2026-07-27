/* dynamic-enhancements.js
   Accessibility & dynamic UX enhancements — dynamicEdit branch
   Zero external dependencies. Respects prefers-reduced-motion.
   ---------------------------------------------------------------------- */
(function () {
  "use strict";

  var reducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Utility: announce to screen readers ── */
  function announce(msg) {
    var el = document.getElementById("a11y-announce");
    if (!el) return;
    el.textContent = "";
    requestAnimationFrame(function () {
      el.textContent = msg;
    });
  }

  /* ── 1. SCROLL-REVEAL via IntersectionObserver ── */
  function initScrollReveal() {
    if (reducedMotion) return; // skip animations entirely
    if (!window.IntersectionObserver) return;

    var targets = document.querySelectorAll(
      ".blog-card, .blog-sidebar-block, .blog-hero, .section h2, .about-stat-card, .about-service-card"
    );
    if (!targets.length) return;

    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      // stagger sibling cards in a grid
      if (el.classList.contains("blog-card")) {
        el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
      }
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ── 2. READING RING (SVG progress on article pages) ── */
  function initReadingRing() {
    var bar = document.getElementById("reading-progress-bar");
    if (!bar) return; // only on article pages

    // Inject ring HTML
    var wrapper = document.createElement("div");
    wrapper.id = "reading-ring-wrapper";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.innerHTML =
      '<svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">' +
      '<circle class="ring-track" cx="13" cy="13" r="11.5"/>' +
      '<circle class="ring-fill" id="ring-fill" cx="13" cy="13" r="11.5"/>' +
      "</svg>" +
      '<span class="ring-pct" id="ring-pct">0%</span>';
    document.body.appendChild(wrapper);

    var fill = document.getElementById("ring-fill");
    var pctEl = document.getElementById("ring-pct");
    var circumference = 72; // 2π × r ≈ 2π × 11.5

    function updateRing() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docH =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      var pct = docH > 0 ? Math.round((scrollTop / docH) * 100) : 0;
      pct = Math.min(100, pct);

      if (fill) {
        fill.style.strokeDashoffset =
          circumference - (circumference * pct) / 100;
      }
      if (pctEl) pctEl.textContent = pct + "%";

      if (scrollTop > 400) {
        wrapper.classList.add("visible");
      } else {
        wrapper.classList.remove("visible");
      }
    }

    window.addEventListener("scroll", updateRing, { passive: true });
    updateRing();
  }

  /* ── 3. ACCESSIBLE KEYBOARD CHIPS ── */
  function initAccessibleChips() {
    var chips = document.querySelectorAll(".blog-chip");
    if (!chips.length) return;

    chips.forEach(function (chip) {
      // Only treat non-anchor chips as buttons
      if (chip.tagName.toLowerCase() === "a") return;

      chip.setAttribute("role", "button");
      chip.setAttribute("tabindex", "0");

      chip.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          chip.click();
        }
      });

      chip.addEventListener("click", function () {
        var pressed = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", String(!pressed));
        chip.classList.toggle("is-active", !pressed);
      });
    });
  }

  /* ── 4. THEME SWITCH ANNOUNCER ── */
  function initThemeAnnouncer() {
    // MutationObserver watches for class changes on <html>
    var html = document.documentElement;
    var prev = html.classList.contains("dark") ? "dark" : "light";

    var mo = new MutationObserver(function () {
      var curr = html.classList.contains("dark") ? "dark" : "light";
      if (curr !== prev) {
        announce("Switched to " + curr + " mode");
        prev = curr;
      }
    });

    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
  }

  /* ── 5. COPY TOAST (replace inline feedback with a global toast) ── */
  function initCopyToast() {
    var toast = document.createElement("div");
    toast.id = "copy-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = "Copied to clipboard!";
    document.body.appendChild(toast);

    // Patch all copy buttons created by blog-enhancements.js
    // We intercept via a custom event on the document
    document.addEventListener("gcloudcafe:code-copied", function () {
      showToast(toast);
    });
  }

  function showToast(toast) {
    toast.classList.add("show");
    setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  /* ── 6. CODE BLOCK: keyboard-triggered copy (Ctrl/Cmd+C on focus) ── */
  function initKeyboardCopy() {
    document.addEventListener("keydown", function (e) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "c") return;
      var focused = document.activeElement;
      if (!focused) return;
      var wrapper = focused.closest
        ? focused.closest(".code-block-wrapper")
        : null;
      if (!wrapper) return;
      var btn = wrapper.querySelector(".copy-code-btn");
      if (btn) btn.click();
    });
  }

  /* ── 7. BACK-TO-TOP FOCUS MANAGEMENT ── */
  function initScrollToTopFocus() {
    var btn = document.getElementById("scroll-to-top");
    if (!btn) return;

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      // After scrolling, move focus to the skip link or the first heading
      var target =
        document.querySelector(".skip-to-content") ||
        document.querySelector("h1, [role='heading']");
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  }

  /* ── 8. LANDMARK ROLE VERIFICATION (developer helper in dev mode) ── */
  function initLandmarkCheck() {
    // Only fires in dev — checks for missing nav labels
    if (window.location.hostname !== "localhost") return;
    var navs = document.querySelectorAll("nav");
    navs.forEach(function (nav) {
      if (!nav.getAttribute("aria-label") && !nav.getAttribute("aria-labelledby")) {
        console.warn("[a11y] <nav> missing aria-label:", nav);
      }
    });
  }

  /* ── 9. SCROLL-PERCENTAGE in article header ── */
  function initReadingPercentageInHeader() {
    var bar = document.getElementById("reading-progress-bar");
    if (!bar) return;

    // Inject a visually hidden % counter into the article header meta list
    var metaList = document.querySelector(".blog-meta-list");
    if (!metaList) return;

    var li = document.createElement("li");
    li.id = "reading-pct-meta";
    li.setAttribute("aria-label", "Reading progress");
    li.innerHTML =
      '<i class="fa-solid fa-gauge-simple-high text-primary"></i>' +
      '<span id="reading-pct-value">0% read</span>';
    metaList.appendChild(li);

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docH =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      var pct = docH > 0 ? Math.round((scrollTop / docH) * 100) : 0;
      var el = document.getElementById("reading-pct-value");
      if (el) el.textContent = Math.min(100, pct) + "% read";
    }

    window.addEventListener("scroll", update, { passive: true });
  }

  /* ── Init ── */
  function init() {
    initScrollReveal();
    initReadingRing();
    initAccessibleChips();
    initThemeAnnouncer();
    initCopyToast();
    initKeyboardCopy();
    initScrollToTopFocus();
    initLandmarkCheck();
    initReadingPercentageInHeader();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
