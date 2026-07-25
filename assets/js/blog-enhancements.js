/* blog-enhancements.js — reading progress, copy-code, scroll-to-top */
(function () {
  "use strict";

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
      var wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      var btn = document.createElement("button");
      btn.className = "copy-code-btn blog-focus-ring";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
      wrapper.appendChild(btn);

      btn.addEventListener("click", function () {
        var code = pre.querySelector("code") || pre;
        var text = code.innerText || code.textContent || "";
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
    } catch (err) {
      /* execCommand is deprecated; clipboard write is already the preferred path.
         Silently ignore failures here — the user will simply see no "Copied!" feedback. */
    }
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

  /* ── Init ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    initReadingProgress();
    initCopyCode();
    initScrollToTop();
  }
})();
