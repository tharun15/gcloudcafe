/* dynamic-enhancements.js
   Modern App-Like UX, View Transitions & Accessibility Enhancements
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
    // Avoid DOM mutations on initial load to prevent layout shifts
  }

  /* ── 2. FLOATING READING ISLAND (Progress & Navigation) ── */
  function initReadingIsland() {
    var island = document.getElementById("reading-island");
    if (!island) return; // only on article pages

    var pctEl = document.getElementById("island-pct");
    var topBtn = document.getElementById("island-scroll-top");

    if (topBtn) {
      topBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      });
    }

    function updateIsland() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docH =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      var pct = docH > 0 ? Math.round((scrollTop / docH) * 100) : 0;
      pct = Math.min(100, Math.max(0, pct));

      if (pctEl) pctEl.textContent = pct + "%";

      if (scrollTop > 250) {
        island.classList.remove("opacity-0", "translate-y-4", "pointer-events-none");
        island.classList.add("opacity-100", "translate-y-0", "pointer-events-auto");
      } else {
        island.classList.add("opacity-0", "translate-y-4", "pointer-events-none");
        island.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
      }
    }

    window.addEventListener("scroll", updateIsland, { passive: true });
    updateIsland();
  }

  /* ── 3. INTERACTIVE MULTI-TAB CODE BLOCKS ── */
  function initCodeTabs() {
    var tabContainers = document.querySelectorAll("[data-code-tabs]");
    if (!tabContainers.length) return;

    tabContainers.forEach(function (container) {
      var nav = container.querySelector(".code-tabs-nav");
      var panels = container.querySelectorAll(".code-tab-panel");
      if (!nav || !panels.length) return;

      nav.innerHTML = "";

      panels.forEach(function (panel, idx) {
        var tabName = panel.getAttribute("data-tab-name") || "Tab " + (idx + 1);
        var tabIcon = panel.getAttribute("data-tab-icon") || "fa-solid fa-terminal";

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "code-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border " + 
          (idx === 0 
            ? "bg-primary/20 text-primary border-primary/40 shadow-xs active" 
            : "bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-white/5");
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
        btn.setAttribute("tabindex", idx === 0 ? "0" : "-1");
        btn.innerHTML = '<i class="' + tabIcon + ' text-[10px]"></i> ' + tabName;

        btn.addEventListener("click", function () {
          nav.querySelectorAll(".code-tab-btn").forEach(function (b) {
            b.className = "code-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-white/5";
            b.setAttribute("aria-selected", "false");
            b.setAttribute("tabindex", "-1");
          });
          panels.forEach(function (p) {
            p.classList.add("hidden");
            p.classList.remove("block");
          });

          btn.className = "code-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border bg-primary/20 text-primary border-primary/40 shadow-xs active";
          btn.setAttribute("aria-selected", "true");
          btn.setAttribute("tabindex", "0");
          panel.classList.remove("hidden");
          panel.classList.add("block");
        });

        nav.appendChild(btn);

        if (idx === 0) {
          panel.classList.remove("hidden");
          panel.classList.add("block");
        } else {
          panel.classList.add("hidden");
          panel.classList.remove("block");
        }
      });
    });
  }

  /* ── 4. ACCESSIBLE KEYBOARD CHIPS ── */
  function initAccessibleChips() {
    var chips = document.querySelectorAll(".blog-chip");
    if (!chips.length) return;

    chips.forEach(function (chip) {
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

  /* ── 5. THEME SWITCH ANNOUNCER ── */
  function initThemeAnnouncer() {
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

  /* ── 6. COPY TOAST ── */
  function initCopyToast() {
    var toast = document.createElement("div");
    toast.id = "copy-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = "Copied to clipboard!";
    document.body.appendChild(toast);

    document.addEventListener("gcloudcafe:code-copied", function () {
      toast.classList.add("show");
      setTimeout(function () {
        toast.classList.remove("show");
      }, 2200);
    });
  }

  /* ── 7. CODE BLOCK: keyboard-triggered copy (Ctrl/Cmd+C on focus) ── */
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

  /* ── 8. BACK-TO-TOP FOCUS MANAGEMENT ── */
  function initScrollToTopFocus() {
    var btn = document.getElementById("scroll-to-top");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var heading = document.querySelector("h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    });
  }

  /* ── BOOTSTRAP ── */
  function init() {
    initScrollReveal();
    initReadingIsland();
    initCodeTabs();
    initAccessibleChips();
    initThemeAnnouncer();
    initCopyToast();
    initKeyboardCopy();
    initScrollToTopFocus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
