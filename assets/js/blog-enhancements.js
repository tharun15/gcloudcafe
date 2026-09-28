/* blog-enhancements.js — reading progress, copy-code, scroll-to-top, header hide/show, search shortcut, active TOC */
(function () {
  "use strict";

  /* ── Auto-hide Header on Scroll ── */
  function initHeaderScroll() {
    var header = document.querySelector(".header");
    if (!header) return;

    function updateHeaderHeight() {
      if (header) {
        var h = header.offsetHeight || 76;
        document.documentElement.style.setProperty("--header-height", h + "px");
      }
    }
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight, { passive: true });

    var lastScrollY = window.scrollY || window.pageYOffset;
    var ticking = false;
    var SCROLL_THRESHOLD = 20;

    function onScroll() {
      var navToggle = document.getElementById("nav-toggle");
      if (navToggle && navToggle.checked) return;

      if (!ticking) {
        window.requestAnimationFrame(function () {
          var currentScrollY = window.scrollY || window.pageYOffset;
          if (currentScrollY > SCROLL_THRESHOLD) {
            if (currentScrollY > lastScrollY) {
              header.classList.add("header--hidden");
              document.body.classList.add("header-hidden");
            } else {
              header.classList.remove("header--hidden");
              document.body.classList.remove("header-hidden");
            }
          } else {
            header.classList.remove("header--hidden");
            document.body.classList.remove("header-hidden");
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
      var article = document.querySelector(".single-post, article, .content");
      if (article) {
        var articleRect = article.getBoundingClientRect();
        var articleTop = articleRect.top + window.scrollY;
        var articleHeight = article.offsetHeight;
        var windowHeight = window.innerHeight;
        var scrollTop = window.scrollY;

        var start = articleTop - 100;
        var end = articleTop + articleHeight - windowHeight;
        if (end <= start) end = start + 1;

        var progress = (scrollTop - start) / (end - start);
        var pct = Math.max(0, Math.min(100, progress * 100));
        bar.style.width = pct + "%";
      } else {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var docHeight =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = Math.min(100, pct) + "%";
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ── Developer-Grade Code Blocks with Icons, Tabs, and Glowing Copy ── */
  function initCopyCode() {
    var blocks = document.querySelectorAll("pre");
    if (!blocks.length) return;

    blocks.forEach(function (pre) {
      if (pre.parentNode.classList.contains("code-block-wrapper")) return;

      var wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentNode.insertBefore(wrapper, pre);

      var code = pre.querySelector("code");
      var rawText = (code || pre).innerText || (code || pre).textContent || "";
      var lines = rawText.trim().split("\n");
      var firstLine = (lines[0] || "").trim();

      var lang = "CODE";
      if (code) {
        var match = code.className.match(/(?:lang|language)-(\w+)/);
        if (match && match[1]) {
          lang = match[1].toUpperCase();
        }
      }

      // Check for filename in first line comment: # file.ext, // file.ext, -- file.sql
      var filename = "";
      var fileMatch = firstLine.match(/^(?:#|\/\/|--|\/\*|<!--)\s*([a-zA-Z0-9_.\-\/]+\.[a-zA-Z0-9]+)\s*(?:\*\/|-->)?$/);
      if (fileMatch && fileMatch[1]) {
        filename = fileMatch[1];
      }

      // Tech Icons map
      var iconClass = "fa-solid fa-code";
      var iconColor = "text-sky-400";
      var langLower = (lang + " " + filename).toLowerCase();
      if (langLower.includes("bash") || langLower.includes("sh") || langLower.includes("shell") || langLower.includes("zsh")) {
        iconClass = "fa-solid fa-terminal";
        iconColor = "text-emerald-400";
      } else if (langLower.includes("yaml") || langLower.includes("yml")) {
        iconClass = "fa-solid fa-file-code";
        iconColor = "text-amber-400";
      } else if (langLower.includes("docker")) {
        iconClass = "fa-brands fa-docker";
        iconColor = "text-sky-400";
      } else if (langLower.includes("python") || langLower.includes("py")) {
        iconClass = "fa-brands fa-python";
        iconColor = "text-amber-400";
      } else if (langLower.includes("go")) {
        iconClass = "fa-brands fa-golang";
        iconColor = "text-cyan-400";
      } else if (langLower.includes("terraform") || langLower.includes("hcl") || langLower.includes("tf")) {
        iconClass = "fa-solid fa-cubes";
        iconColor = "text-purple-400";
      } else if (langLower.includes("sql")) {
        iconClass = "fa-solid fa-database";
        iconColor = "text-rose-400";
      } else if (langLower.includes("json")) {
        iconClass = "fa-solid fa-brackets-curly";
        iconColor = "text-yellow-400";
      }

      // Multi-tab / Multi-CLI support inside code snippet
      // Matches: # [kubectl] or # [gcloud] or # [AWS CLI] or # --- TabName ---
      var tabDelimiterRegex = /^[ \t]*(?:#|\/\/|--)\s*(?:\[|---?\s*)([A-Za-z0-9_.\-\s/]+?)(?:\]|\s*---?)[ \t]*$/;
      var tabs = [];
      var currentTabName = "";
      var currentTabLines = [];

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var tabMatch = line.match(tabDelimiterRegex);
        if (tabMatch && tabMatch[1] && tabMatch[1].trim().length > 0 && !line.includes(".yaml") && !line.includes(".tf") && !line.includes(".json") && !line.includes(".sh")) {
          if (currentTabName && currentTabLines.length > 0) {
            tabs.push({ name: currentTabName, text: currentTabLines.join("\n") });
            currentTabLines = [];
          }
          currentTabName = tabMatch[1].trim();
        } else {
          currentTabLines.push(line);
        }
      }
      if (currentTabName && currentTabLines.length > 0) {
        tabs.push({ name: currentTabName, text: currentTabLines.join("\n") });
      }

      var header = document.createElement("div");
      header.className = "code-block-header";

      var displayLabel = filename || lang;
      var badgeHtml = '<span class="lang-tag"><i class="' + iconClass + ' ' + iconColor + ' mr-1 text-[11px]"></i> ' + escapeHtml(displayLabel) + '</span>';
      var lineCountHtml = '<span class="line-count-tag ml-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">' + lines.length + (lines.length === 1 ? ' line' : ' lines') + '</span>';

      header.innerHTML = '<div class="flex items-center">' + badgeHtml + lineCountHtml + '</div>';

      var btn = document.createElement("button");
      btn.className = "copy-code-btn blog-focus-ring";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
      header.appendChild(btn);

      wrapper.appendChild(header);

      var activeCopyText = rawText;
      if (tabs.length >= 2) {
        var tabBar = document.createElement("div");
        tabBar.className = "code-block-tabs";
        
        tabs.forEach(function (tab, tIdx) {
          var tabBtn = document.createElement("button");
          tabBtn.type = "button";
          tabBtn.className = "code-tab-btn" + (tIdx === 0 ? " is-active" : "");
          tabBtn.textContent = tab.name;
          tabBtn.addEventListener("click", function () {
            tabBar.querySelectorAll(".code-tab-btn").forEach(function(b) { b.classList.remove("is-active"); });
            tabBtn.classList.add("is-active");
            if (code) {
              code.textContent = tab.text;
            } else {
              pre.textContent = tab.text;
            }
            activeCopyText = tab.text;
            var newLines = tab.text.trim().split("\n");
            var lineTag = header.querySelector(".line-count-tag");
            if (lineTag) lineTag.textContent = newLines.length + (newLines.length === 1 ? ' line' : ' lines');
          });
          tabBar.appendChild(tabBtn);
        });

        wrapper.appendChild(tabBar);
        activeCopyText = tabs[0].text;
        if (code) {
          code.textContent = tabs[0].text;
        } else {
          pre.textContent = tabs[0].text;
        }
        var firstTabLines = tabs[0].text.trim().split("\n");
        var lineTag = header.querySelector(".line-count-tag");
        if (lineTag) lineTag.textContent = firstTabLines.length + (firstTabLines.length === 1 ? ' line' : ' lines');
      }

      wrapper.appendChild(pre);

      btn.addEventListener("click", function () {
        var text = activeCopyText;
        if (!navigator.clipboard) {
          fallbackCopy(text, btn);
          return;
        }
        navigator.clipboard.writeText(text).then(function () {
          showCopied(btn);
        }).catch(function () {
          fallbackCopy(text, btn);
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

  /* ── Active Table of Contents Tracking (IntersectionObserver with Smooth Offset & Auto-Scroll) ── */
  function initActiveTocTracking() {
    var tocLinks = document.querySelectorAll(".toc-container a, #TableOfContents a, .toc-link");
    if (!tocLinks.length) return;

    var headingsMap = new Map();
    var container = document.querySelector(".toc-container");

    tocLinks.forEach(function (link) {
      link.classList.add("toc-link");
      var href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        var targetId = decodeURIComponent(href.substring(1));
        var el = document.getElementById(targetId);
        if (el) {
          headingsMap.set(el, link);
        }
      }

      // Smooth scroll with offset for fixed header
      link.addEventListener("click", function (e) {
        var targetHref = link.getAttribute("href");
        if (targetHref && targetHref.startsWith("#")) {
          var targetElem = document.getElementById(decodeURIComponent(targetHref.substring(1)));
          if (targetElem) {
            e.preventDefault();
            var headerOffset = 95;
            var elementPosition = targetElem.getBoundingClientRect().top;
            var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
            if (history.pushState) {
              history.pushState(null, null, targetHref);
            }
          }
        }
      });
    });

    if (headingsMap.size === 0) return;

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var activeLink = headingsMap.get(entry.target);
            if (activeLink) {
              tocLinks.forEach(function (l) { l.classList.remove("is-active"); });
              activeLink.classList.add("is-active");
              // Auto-scroll TOC container so active link is always visible
              if (container) {
                var containerRect = container.getBoundingClientRect();
                var linkRect = activeLink.getBoundingClientRect();
                if (linkRect.top < containerRect.top + 40 || linkRect.bottom > containerRect.bottom - 40) {
                  activeLink.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              }
            }
          }
        });
      }, { rootMargin: "0px 0px -65% 0px", threshold: 0 });

      headingsMap.forEach(function (_, el) {
        observer.observe(el);
      });
    }
  }

  /* ── Keyboard Search Shortcut & Supercharged Command Center (Ctrl+K / Cmd+K) ── */
  function initCommandPalette() {
    var searchModal = document.getElementById("search-modal") || document.querySelector(".search-modal");
    var searchInput = document.querySelector("[data-search-input]");
    var commandView = document.getElementById("command-palette-default");
    var activeCommandIdx = 0;

    function getCommandItems() {
      if (!commandView) return [];
      return Array.from(commandView.querySelectorAll("[data-command-item]"));
    }

    function updateActiveCommand(index) {
      var items = getCommandItems();
      if (!items.length) return;
      if (index < 0) index = 0;
      if (index >= items.length) index = items.length - 1;
      activeCommandIdx = index;
      items.forEach(function (el, idx) {
        el.classList.toggle("is-selected", idx === activeCommandIdx);
      });
      if (items[activeCommandIdx]) {
        items[activeCommandIdx].scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    function openSearchPalette() {
      var searchTrigger = document.querySelector("[data-target='search-modal'], [data-search-trigger], .search-trigger, [data-target='#search-modal']");
      if (searchTrigger) {
        searchTrigger.click();
      } else if (searchModal) {
        searchModal.classList.add("show");
        searchModal.setAttribute("aria-hidden", "false");
        document.body.style.overflowY = "hidden";
      }
      setTimeout(function () {
        updateActiveCommand(0);
        if (commandView && (!searchInput || !searchInput.value.trim())) {
          commandView.style.display = "";
        }
        var targetInput = searchInput || document.querySelector("[data-search-input]") || document.getElementById("search-modal-input");
        if (targetInput) {
          targetInput.focus();
          targetInput.select();
        }
      }, 50);
    }

    function closeSearchPalette() {
      var closeBtn = document.querySelector("[data-target='close-search-modal']");
      if (closeBtn) {
        closeBtn.click();
      } else if (searchModal) {
        searchModal.classList.remove("show");
        searchModal.setAttribute("aria-hidden", "true");
        document.body.style.overflowY = "";
      }
    }

    // Toggle Modal on Ctrl+K / Cmd+K
    // Use capture phase and stopImmediatePropagation to ensure deterministic toggling and eliminate double-toggle cancellation with theme search.js
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopImmediatePropagation();
        var isModalOpen = searchModal && searchModal.classList.contains("show");
        if (isModalOpen) {
          closeSearchPalette();
        } else {
          openSearchPalette();
        }
      } else if (e.key === "Escape") {
        var isModalOpen = searchModal && searchModal.classList.contains("show");
        if (isModalOpen) {
          closeSearchPalette();
        }
      }
    }, true);

    if (!searchModal) return;

    // Open event hook (when opened via header search button or hotkey)
    var searchTriggers = document.querySelectorAll("[data-target='search-modal'], [data-search-trigger]");
    searchTriggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTimeout(function () {
          updateActiveCommand(0);
          if (commandView && (!searchInput || !searchInput.value.trim())) {
            commandView.style.display = "";
          }
          var targetInput = searchInput || document.querySelector("[data-search-input]") || document.getElementById("search-modal-input");
          if (targetInput) {
            targetInput.focus();
            targetInput.select();
          }
        }, 50);
      });
    });

    // Command Action Execution
    document.addEventListener("click", function (e) {
      var actionBtn = e.target.closest("[data-command-action]");
      if (!actionBtn) return;
      var action = actionBtn.getAttribute("data-command-action");
      if (action === "toggle-theme") {
        e.preventDefault();
        var htmlEl = document.documentElement;
        var isDark = htmlEl.classList.toggle("dark");
        try {
          localStorage.setItem("theme", isDark ? "dark" : "light");
        } catch (err) {}
        var tsInputs = document.querySelectorAll("[data-theme-switcher], #theme-switcher");
        tsInputs.forEach(function (inp) { inp.checked = isDark; });

        // Update action title visually
        var titleEl = actionBtn.querySelector(".command-item-title");
        if (titleEl) {
          titleEl.textContent = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
        }
        // Smoothly close command palette
        setTimeout(function () {
          var closeBtn = document.querySelector("[data-target='close-search-modal']");
          if (closeBtn) closeBtn.click();
        }, 220);
      } else if (action === "open-proposal") {
        e.preventDefault();
        var closeBtn = document.querySelector("[data-target='close-search-modal']");
        if (closeBtn) closeBtn.click();
        var proposalModal = document.getElementById("author-proposal-modal");
        if (proposalModal) {
          var openBtn = document.getElementById("open-proposal-modal-btn");
          if (openBtn) openBtn.click();
        } else {
          window.location.href = "/authors/#author-proposal-modal";
        }
      }
    });

    // Sync active state on mouse hover
    if (commandView) {
      commandView.addEventListener("mouseover", function (e) {
        var item = e.target.closest("[data-command-item]");
        if (!item) return;
        var items = getCommandItems();
        var idx = items.indexOf(item);
        if (idx !== -1) {
          activeCommandIdx = idx;
          items.forEach(function (el, i) {
            el.classList.toggle("is-selected", i === activeCommandIdx);
          });
        }
      });
    }

    // Keyboard Arrow navigation & Enter execution inside command palette
    if (searchInput) {
      // Toggle command view visibility based on input value
      searchInput.addEventListener("input", function () {
        var val = searchInput.value.trim();
        if (commandView) {
          if (val.length > 0) {
            commandView.style.display = "none";
          } else {
            commandView.style.display = "";
            updateActiveCommand(0);
          }
        }
      });

      searchInput.addEventListener("keydown", function (e) {
        var isModalOpen = searchModal.classList.contains("show");
        if (!isModalOpen) return;

        var val = searchInput.value.trim();
        if (val === "" && commandView && commandView.style.display !== "none") {
          var items = getCommandItems();
          if (!items.length) return;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            var nextIdx = (activeCommandIdx + 1) % items.length;
            updateActiveCommand(nextIdx);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            var prevIdx = (activeCommandIdx - 1 + items.length) % items.length;
            updateActiveCommand(prevIdx);
          } else if (e.key === "Enter") {
            e.preventDefault();
            var currentItem = items[activeCommandIdx];
            if (currentItem) {
              currentItem.click();
            }
          }
        }
      });
    }
  }
  function initPostEngagement() {
    var widget = document.querySelector("[data-post-feedback]");
    if (!widget) return;

    var rawPath = widget.dataset.postFeedback || window.location.pathname;
    var permalink = (rawPath.replace(/\/+$/, "") + "/").toLowerCase();
    var storageKeyUser = "gcloudcafe:reaction:" + permalink;
    var storageKeyCounts = "gcloudcafe:counts:" + permalink;
    var channelName = "gcloudcafe_reactions_" + permalink;

    var slug = permalink.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9_-]/gi, "_");
    var counterNamespace = "gcloudcafe_reactions";

    var defaultCounts = {
      helpful: 0,
      insightful: 0,
      awesome: 0,
      brewtiful: 0
    };

    var storedCounts = Object.assign({}, defaultCounts);

    function mergeIncomingCounts(incoming, isDecrement) {
      if (!incoming) return;
      Object.keys(defaultCounts).forEach(function (k) {
        if (typeof incoming[k] !== "undefined") {
          var incVal = parseInt(incoming[k]) || 0;
          if (isDecrement) {
            storedCounts[k] = Math.max(0, incVal);
          } else {
            storedCounts[k] = Math.max(storedCounts[k] || 0, incVal);
          }
        }
      });
      try {
        localStorage.setItem(storageKeyCounts, JSON.stringify(storedCounts));
      } catch (e) {}
      updateCountsUI();
    }

    // Load initial counts from localStorage cache or default
    try {
      var cachedCounts = localStorage.getItem(storageKeyCounts);
      if (cachedCounts) {
        mergeIncomingCounts(JSON.parse(cachedCounts), false);
      }
    } catch (e) {}

    // Initialize BroadcastChannel for instant cross-tab / cross-window sync
    var broadcastChannel = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        broadcastChannel = new BroadcastChannel(channelName);
        broadcastChannel.onmessage = function (event) {
          if (event && event.data && event.data.counts) {
            mergeIncomingCounts(event.data.counts, event.data.isDecrement || false);
          }
        };
      } catch (e) {}
    }

    // Listen to localStorage 'storage' event as fallback for cross-window sync
    window.addEventListener("storage", function (e) {
      if (e.key === storageKeyCounts && e.newValue) {
        try {
          mergeIncomingCounts(JSON.parse(e.newValue), false);
        } catch (err) {}
      }
      if (e.key === storageKeyUser) {
        try {
          activeReaction = localStorage.getItem(storageKeyUser) || "";
          updateCountsUI();
        } catch (err) {}
      }
    });

    function saveAndBroadcastCounts(isDecrement) {
      try {
        localStorage.setItem(storageKeyCounts, JSON.stringify(storedCounts));
      } catch (e) {}
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({ counts: storedCounts, isDecrement: !!isDecrement });
        } catch (e) {}
      }
    }

    // Initialize Supabase Client dynamically
    var supabase = null;
    function getSupabase() {
      if (supabase) return supabase;
      var url = widget.dataset.supabaseUrl;
      var key = widget.dataset.supabaseKey;
      if ((!url || !key) && window.SUPABASE_CONFIG) {
        url = window.SUPABASE_CONFIG.url;
        key = window.SUPABASE_CONFIG.anonKey;
      }
      if (url && key && window.supabase) {
        supabase = window.supabase.createClient(url, key);
      }
      return supabase;
    }

    var activeReaction = "";
    try {
      activeReaction = localStorage.getItem(storageKeyUser) || "";
    } catch (e) {}

    var reactionBtns = widget.querySelectorAll("[data-reaction-btn]");

    function updateCountsUI() {
      reactionBtns.forEach(function (btn) {
        var type = btn.dataset.reactionBtn;
        var countSpan = btn.querySelector("[data-reaction-count]");
        
        var count = Math.max(0, storedCounts[type] || 0);

        if (countSpan) countSpan.textContent = count;

        if (activeReaction === type) {
          btn.classList.add("border-primary", "bg-primary/10", "text-primary");
          btn.setAttribute("aria-pressed", "true");
        } else {
          btn.classList.remove("border-primary", "bg-primary/10", "text-primary");
          btn.setAttribute("aria-pressed", "false");
        }
      });
    }

    // Fetch updated live counts from cloud persistence (Supabase & CounterAPI)
    function fetchCloudCounts(retryCount) {
      retryCount = retryCount || 0;

      // 1. Supabase Fetch (queries all path variations: /blog/slug/, blog/slug, slug, etc.)
      var client = getSupabase();
      if (client) {
        var cleanSlug = permalink.split('/').filter(Boolean).pop() || "";
        var possiblePaths = Array.from(new Set([
          permalink,
          rawPath,
          permalink.replace(/\/+$/, ""),
          permalink.replace(/^\/+/, ""),
          permalink.replace(/^\/+|\/+$/g, ""),
          cleanSlug,
          "/blog/" + cleanSlug + "/",
          "blog/" + cleanSlug
        ])).filter(Boolean);

        client
          .from('post_reactions')
          .select('helpful_count, insightful_count, awesome_count, brewtiful_count')
          .in('post_path', possiblePaths)
          .then(function (response) {
            if (response && response.data && response.data.length > 0) {
              response.data.forEach(function (row) {
                var dbCounts = {
                  helpful: parseInt(row.helpful_count) || 0,
                  insightful: parseInt(row.insightful_count) || 0,
                  awesome: parseInt(row.awesome_count) || 0,
                  brewtiful: parseInt(row.brewtiful_count) || 0
                };
                mergeIncomingCounts(dbCounts, false);
              });
              saveAndBroadcastCounts(false);
            }
          })
          .catch(function () {});
      }

      // Cloud counts managed primarily via Supabase tables and realtime channels
    }

    function setupRealtime() {
      var client = getSupabase();
      if (client && !widget.dataset.subscribed) {
        widget.dataset.subscribed = "true";
        try {
          client
            .channel('public:post_reactions:' + permalink)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions', filter: 'post_path=eq.' + permalink }, function (payload) {
              if (payload && payload.new) {
                var dbCounts = {
                  helpful: parseInt(payload.new.helpful_count) || 0,
                  insightful: parseInt(payload.new.insightful_count) || 0,
                  awesome: parseInt(payload.new.awesome_count) || 0,
                  brewtiful: parseInt(payload.new.brewtiful_count) || 0
                };
                mergeIncomingCounts(dbCounts, false);
                saveAndBroadcastCounts(false);
              }
            })
            .subscribe();
        } catch (e) {}
      }
    }

    function sendIncrement(type) {
      // Increment handled via Supabase RPC

      // 2. Supabase Increment
      var client = getSupabase();
      if (client) {
        client
          .rpc('increment_reaction', { p_post_path: permalink, p_reaction_type: type })
          .then(function () { fetchCloudCounts(); })
          .catch(function () {});
      }
    }

    function sendDecrement(type) {
      // Decrement handled via Supabase RPC

      // 2. Supabase Decrement
      var client = getSupabase();
      if (client) {
        client
          .rpc('decrement_reaction', { p_post_path: permalink, p_reaction_type: type })
          .then(function () { fetchCloudCounts(); })
          .catch(function () {});
      }
    }

    // Load initial counts from local cache first, then fetch live from Cloud persistence
    updateCountsUI();
    fetchCloudCounts();
    setTimeout(setupRealtime, 1000);

    // Re-sync when switching back to browser tab
    window.addEventListener("focus", fetchCloudCounts);

    reactionBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var type = btn.dataset.reactionBtn;
        var oldReaction = activeReaction;

        if (activeReaction === type) {
          // Deselect current reaction
          activeReaction = "";
          try {
            localStorage.removeItem(storageKeyUser);
          } catch (e) {}

          // Optimistically update counts locally
          storedCounts[type] = Math.max(0, (storedCounts[type] || 0) - 1);
          saveAndBroadcastCounts(true);
          updateCountsUI();

          // Persist decrement to Cloud Database
          sendDecrement(type);
        } else {
          // Select new reaction (and remove previous reaction if any)
          activeReaction = type;
          spawnEmojiParticle(btn);
          try {
            localStorage.setItem(storageKeyUser, activeReaction);
          } catch (e) {}

          // Optimistically update counts locally
          if (oldReaction && storedCounts[oldReaction]) {
            storedCounts[oldReaction] = Math.max(0, storedCounts[oldReaction] - 1);
          }
          storedCounts[type] = (storedCounts[type] || 0) + 1;
          saveAndBroadcastCounts(false);
          updateCountsUI();

          // Persist to Cloud Database
          if (oldReaction) {
            sendDecrement(oldReaction);
          }
          sendIncrement(type);
        }
      });
    });
  }

    /* Copy permalink toast */
    var copyBtns = document.querySelectorAll("[data-copy-permalink]");
    copyBtns.forEach(function (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var url = copyBtn.dataset.copyPermalink || window.location.href;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () {
            showToast("Link copied to clipboard! 📋");
          });
        } else {
          showToast("Link copied to clipboard! 📋");
        }
      });
    });

  function spawnEmojiParticle(btn) {
    var emoji = btn.querySelector("span") ? btn.querySelector("span").textContent : "✨";
    var particle = document.createElement("span");
    particle.textContent = emoji;
    particle.style.cssText = "position:absolute;pointer-events:none;font-size:18px;z-index:999;transition:all 0.8s ease-out;opacity:1;";
    
    var rect = btn.getBoundingClientRect();
    particle.style.left = (rect.left + rect.width / 2) + "px";
    particle.style.top = (rect.top + window.scrollY) + "px";
    document.body.appendChild(particle);

    requestAnimationFrame(function () {
      particle.style.transform = "translateY(-40px) scale(1.4)";
      particle.style.opacity = "0";
    });

    setTimeout(function () {
      if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, 850);
  }

  function showToast(message) {
    var existing = document.getElementById("gcloudcafe-toast");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var toast = document.createElement("div");
    toast.id = "gcloudcafe-toast";
    toast.style.cssText = "position:fixed;bottom:24px;right:24px;background:#0f172a;color:#fff;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);z-index:9999;transition:all 0.3s ease;opacity:0;transform:translateY(10px);";
    toast.innerHTML = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2500);
  }

  /* ── Shared Date Formatter ── */
  function formatDate(dateStr) {
    if (!dateStr) return "Just now";
    try {
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      var diff = Math.floor((new Date() - d) / 1000);
      if (diff < 60) return "Just now";
      if (diff < 3600) return Math.floor(diff / 60) + "m ago";
      if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
      if (diff < 2592000) return Math.floor(diff / 86400) + "d ago";
      return d.toLocaleDateString();
    } catch (e) {
      return "Recently";
    }
  }

  /* ── Interactive Community Comments System (Supabase Backend) ── */
  function initCommentsSystem() {
    var section = document.getElementById("comments-section");
    if (!section) return;

    var rawPath = window.location.pathname;
    var permalink = (rawPath.replace(/\/+$/, "") + "/").toLowerCase();
    var cleanSlug = permalink.split('/').filter(Boolean).pop() || "";
    var possiblePaths = Array.from(new Set([
      permalink,
      rawPath,
      permalink.replace(/\/+$/, ""),
      permalink.replace(/^\/+/, ""),
      permalink.replace(/^\/+|\/+$/g, ""),
      cleanSlug,
      "/blog/" + cleanSlug + "/",
      "blog/" + cleanSlug
    ])).filter(Boolean);

    var storageKey = "gcloudcafe:comments:" + permalink;

    var comments = [];
    try {
      var raw = localStorage.getItem(storageKey);
      if (raw) {
        comments = JSON.parse(raw);
      }
    } catch (e) {}

    var form = section.querySelector("[data-comment-form]");
    var list = section.querySelector("[data-comments-list]");
    var countBadge = section.querySelector("[data-comments-count-badge]");

    // Initialize Supabase Client
    var supabase = null;
    if (window.SUPABASE_CONFIG && window.supabase) {
      supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    }

    function fetchSupabaseComments() {
      if (!supabase) return;

      supabase
        .from('post_comments')
        .select('*')
        .in('post_path', possiblePaths)
        .order('created_at', { ascending: false })
        .then(function (res) {
          if (res && res.data && res.data.length > 0) {
            comments = res.data.map(function (row) {
              return {
                id: row.id,
                author: row.author || "Cloud Practitioner",
                text: row.content || row.text || "",
                date: formatDate(row.created_at),
                likes: row.likes || 0
              };
            });
            saveComments();
            renderComments();
          }
        })
        .catch(function () {});
    }

    function renderComments() {
      if (countBadge) countBadge.textContent = comments.length;
      if (!list) return;

      if (comments.length === 0) {
        list.innerHTML = '<p class="text-sm text-text/70 dark:text-darkmode-text/70 italic py-4">No comments yet. Be the first to start the discussion!</p>';
        return;
      }

      var html = "";
      comments.forEach(function (c, idx) {
        var initial = (c.author || "C").charAt(0).toUpperCase();
        html += '<div class="blog-article-shell border border-border/60 dark:border-darkmode-border/60 p-4 sm:p-5 rounded-2xl bg-body dark:bg-darkmode-body shadow-xs flex gap-3 sm:gap-4 items-start">' +
          '<div class="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">' + initial + '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center justify-between mb-1">' +
              '<h4 class="text-sm font-bold text-dark dark:text-darkmode-dark">' + escapeHtml(c.author || "Cloud Practitioner") + '</h4>' +
              '<span class="text-[11px] text-text/90 dark:text-darkmode-text/90">' + escapeHtml(c.date || "Just now") + '</span>' +
            '</div>' +
            '<p class="text-sm text-text/90 dark:text-darkmode-text/90 leading-relaxed mb-3">' + escapeHtml(c.text) + '</p>' +
            '<button type="button" data-like-comment="' + idx + '" class="inline-flex items-center gap-1.5 text-xs font-semibold text-text/70 dark:text-darkmode-text/70 hover:text-primary transition-colors cursor-pointer">' +
              '<i class="fa-regular fa-thumbs-up"></i> <span>' + (c.likes || 0) + '</span>' +
            '</button>' +
          '</div>' +
        '</div>';
      });

      list.innerHTML = html;

      /* Attach comment like listeners */
      var likeBtns = list.querySelectorAll("[data-like-comment]");
      likeBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var index = parseInt(btn.dataset.likeComment, 10);
          if (!isNaN(index) && comments[index]) {
            comments[index].likes = (comments[index].likes || 0) + 1;
            saveComments();
            renderComments();

            if (supabase && comments[index].id) {
              supabase
                .from('post_comments')
                .update({ likes: comments[index].likes })
                .eq('id', comments[index].id)
                .then(function(){}).catch(function(){});
            }
          }
        });
      });
    }

    function saveComments() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(comments));
      } catch (e) {}
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var authorInput = document.getElementById("comment-author-input");
        var textInput = document.getElementById("comment-text-input");

        var author = authorInput ? authorInput.value.trim() : "";
        var text = textInput ? textInput.value.trim() : "";

        if (!text) return;

        var newComment = {
          id: "c_" + Date.now(),
          author: author || "Cloud Practitioner",
          text: text,
          date: "Just now",
          likes: 0
        };

        comments.unshift(newComment);
        saveComments();
        renderComments();

        if (textInput) textInput.value = "";
        showToast("Comment posted! 🚀");

        if (supabase) {
          supabase
            .from('post_comments')
            .insert([{
              post_path: permalink,
              author: author || "Cloud Practitioner",
              content: text,
              likes: 0
            }])
            .then(function (res) {
              if (res.error) {
                console.warn("Supabase comment insert note:", res.error.message);
              } else {
                fetchSupabaseComments();
              }
            });
        }
      });
    }

    renderComments();
    fetchSupabaseComments();
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ── Supabase Newsletter Signup ── */
  function initNewsletterSignup() {
    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    var forms = document.querySelectorAll("form[data-supabase-subscribe]");

    forms.forEach(function (form) {
      if (form.getAttribute("data-newsletter-bound") === "true") return;
      form.setAttribute("data-newsletter-bound", "true");

      var status = form.querySelector("[data-newsletter-status]");
      if (!status) {
        var note = form.nextElementSibling;
        if (note && note.hasAttribute("data-newsletter-status")) {
          status = note;
        } else {
          status = document.createElement("p");
          status.className = "text-xs mt-2 font-mono text-slate-500 dark:text-slate-400";
          form.appendChild(status);
        }
      }

      var input = form.querySelector("input[type='email']");
      var submitBtn = form.querySelector("button[type='submit']");
      var originalBtnText = submitBtn ? submitBtn.innerText : "Subscribe";

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!input || !input.value.trim()) return;

        var emailValue = input.value.trim().toLowerCase();
        status.innerHTML = '<span class="text-slate-600 dark:text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Subscribing...</span>';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = "Subscribing...";
        }

        fetch(config.url + "/rest/v1/newsletter_subscribers", {
          method: "POST",
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({ email: emailValue })
        })
        .then(function (res) {
          return res.json().then(function (data) {
            return { status: res.status, ok: res.ok, data: data };
          }).catch(function () {
            return { status: res.status, ok: res.ok, data: null };
          });
        })
        .then(function (result) {
          if (submitBtn) submitBtn.disabled = false;

          if (result.ok || result.status === 201) {
            status.innerHTML = '<span class="text-emerald-600 dark:text-emerald-400 font-semibold"><i class="fa-solid fa-circle-check mr-1.5"></i>Thank you for subscribing! Welcome aboard.</span>';
            input.value = "";
            if (submitBtn) {
              submitBtn.innerText = "Subscribed ✓";
              setTimeout(function () {
                submitBtn.innerText = originalBtnText;
              }, 4000);
            }
          } else if (result.status === 409 || (result.data && result.data.code === "23505")) {
            status.innerHTML = '<span class="text-sky-600 dark:text-sky-400 font-semibold"><i class="fa-solid fa-circle-info mr-1.5"></i>You are already subscribed! Thank you.</span>';
            if (submitBtn) submitBtn.innerText = originalBtnText;
          } else {
            status.innerHTML = '<span class="text-red-500 font-semibold"><i class="fa-solid fa-circle-exclamation mr-1.5"></i>Subscription failed. Please try again.</span>';
            if (submitBtn) submitBtn.innerText = originalBtnText;
          }
        })
        .catch(function (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
          }
          status.innerHTML = '<span class="text-red-500 font-semibold"><i class="fa-solid fa-circle-exclamation mr-1.5"></i>Network error. Please try again later.</span>';
        });
      });
    });
  }

  /* ── Dynamic Database Telemetry Stats (Grounded in Real Data) ── */
  function initTelemetryStats() {
    var statElem = document.querySelector("[data-stat-feedback]");
    var posElem = document.querySelector("[data-stat-positive]");
    var commentsElem = document.querySelector("[data-stat-comments]");
    if (!statElem && !commentsElem) return;

    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    var headers = {
      "apikey": config.anonKey,
      "Authorization": "Bearer " + config.anonKey
    };

    // 1. Fetch total real reactions from Supabase database
    fetch(config.url + "/rest/v1/post_reactions?select=helpful_count,insightful_count,awesome_count,brewtiful_count", {
      headers: headers
    })
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (data) {
        if (Array.isArray(data) && data.length > 0) {
          var total = 0;
          data.forEach(function (row) {
            total += (parseInt(row.helpful_count) || 0) +
                     (parseInt(row.insightful_count) || 0) +
                     (parseInt(row.awesome_count) || 0) +
                     (parseInt(row.brewtiful_count) || 0);
          });
          if (statElem) statElem.textContent = total + (total === 1 ? " VOTE" : " VOTES");
          if (posElem) posElem.textContent = total > 0 ? "● LIVE FEEDBACK" : "● NO VOTES YET";
        } else {
          if (statElem) statElem.textContent = "0 VOTES";
          if (posElem) posElem.textContent = "● LIVE FEEDBACK";
        }
      })
      .catch(function () {
        if (statElem) statElem.textContent = "0 VOTES";
        if (posElem) posElem.textContent = "● LIVE FEEDBACK";
      });

    // 2. Fetch total real comments from Supabase database
    fetch(config.url + "/rest/v1/post_comments?select=id", {
      headers: Object.assign({}, headers, { "Range-Unit": "items", "Range": "0-0", "Prefer": "count=exact" })
    })
      .then(function (res) {
        var contentRange = res.headers.get("content-range") || "";
        var totalMatch = contentRange.match(/\/(\d+)/);
        if (totalMatch && totalMatch[1]) {
          return parseInt(totalMatch[1], 10);
        }
        return res.ok ? res.json().then(function(d) { return Array.isArray(d) ? d.length : 0; }) : 0;
      })
      .then(function (count) {
        var c = typeof count === "number" ? count : 0;
        if (commentsElem) commentsElem.textContent = c + (c === 1 ? " COMMENT" : " COMMENTS");
      })
      .catch(function () {
        if (commentsElem && commentsElem.textContent === "ACTIVE") {
          // Keep clean SSR fallback
        }
      });
  }


  /* ── 13. Brand Tagline Terminal Typewriter (Cloud -> DevOps -> Security -> Unified) ── */
  function initTaglineTypewriter() {
    var el = document.querySelector("[data-typewriter-tagline]");
    if (!el) return;

    function getSequence() {
      var isMobile = window.innerWidth < 640;
      if (isMobile) {
        return [
          { text: "Cloud", hold: 1200 },
          { text: "DevOps", hold: 1200 },
          { text: "Security", hold: 1200 },
          { text: "AI", hold: 1200 }
        ];
      }
      return [
        { text: "Cloud", hold: 1100 },
        { text: "DevOps", hold: 1100 },
        { text: "Security", hold: 1100 },
        { text: "AI", hold: 1100 },
        { text: "Cloud · DevOps · Security · AI", hold: 10000 }
      ];
    }

    var sequence = getSequence();
    var seqIndex = 0;
    var displayed = el.textContent.trim();
    var typingSpeed = 75;
    var deletingSpeed = 40;

    window.addEventListener("resize", function () {
      sequence = getSequence();
      if (seqIndex >= sequence.length) seqIndex = 0;
    });

    function typeForward(targetText, onComplete) {
      if (displayed.length < targetText.length) {
        displayed = targetText.slice(0, displayed.length + 1);
        el.textContent = displayed;
        setTimeout(function () {
          typeForward(targetText, onComplete);
        }, typingSpeed);
      } else {
        onComplete();
      }
    }

    function backspace(onComplete) {
      if (displayed.length > 0) {
        displayed = displayed.slice(0, -1);
        el.textContent = displayed;
        setTimeout(function () {
          backspace(onComplete);
        }, deletingSpeed);
      } else {
        setTimeout(onComplete, 300);
      }
    }

    function runStep() {
      sequence = getSequence();
      var item = sequence[seqIndex % sequence.length];
      typeForward(item.text, function () {
        setTimeout(function () {
          backspace(function () {
            seqIndex = (seqIndex + 1) % sequence.length;
            runStep();
          });
        }, item.hold);
      });
    }

    // Allow initial SSR text to be read for 1.8s, then begin cycle
    setTimeout(function () {
      backspace(function () {
        seqIndex = 0;
        runStep();
      });
    }, 1800);
  }

  /* ── Init ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ── 14. Homepage In-Place Article Expansion (ByteDepth Seamless Loader) ── */
  function initLoadMoreArticles() {
    var btn = document.getElementById("btn-load-more-articles");
    var container = document.getElementById("view-all-articles-container");
    if (!btn || !container) return;

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var textSpan = btn.querySelector(".btn-text");
      var loadingSpan = btn.querySelector(".btn-loading");

      // Enter loading state
      if (textSpan) textSpan.classList.add("hidden");
      if (loadingSpan) loadingSpan.classList.remove("hidden");
      btn.classList.add("opacity-90", "cursor-wait");

      // Smooth simulated loading effect matching Figma interactive prototype
      setTimeout(function () {
        var extraCards = document.querySelectorAll("[data-extra-article='true']");
        var totalLoaded = extraCards.length;

        extraCards.forEach(function (card, index) {
          card.style.display = "flex";
          // Staggered reveal for smooth entrance
          setTimeout(function () {
            card.classList.remove("opacity-0", "translate-y-4");
            card.classList.add("opacity-100", "translate-y-0");
          }, 30 + index * 60);
        });

        // After all cards animate in, show friendly completion indicator
        setTimeout(function () {
          btn.innerHTML = '<span class="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold"><span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>All ' + (9 + totalLoaded) + ' articles loaded</span>';
          btn.classList.remove("cursor-wait", "hover:border-slate-400", "dark:hover:border-slate-600", "hover:bg-slate-50", "dark:hover:bg-slate-800/80");
          btn.classList.add("border-emerald-500/30", "bg-emerald-500/10", "pointer-events-none");

          // Gently fade out the button after a couple seconds
          setTimeout(function () {
            container.style.transition = "opacity 0.6s ease, transform 0.6s ease, height 0.6s ease, margin 0.6s ease";
            container.style.opacity = "0";
            container.style.transform = "scale(0.96)";
            setTimeout(function () {
              container.style.display = "none";
            }, 600);
          }, 2200);
        }, totalLoaded * 60 + 200);
      }, 350);
    });
  }

  function init() {
    initCloudDecisionCalculators();
    initHeaderScroll();
    initReadingProgress();
    initCopyCode();
    initScrollToTop();
    initActiveTocTracking();
    initCommandPalette();
    initPostEngagement();
    initCommentsSystem();
    initNewsletterSignup();
    initTelemetryStats();
    initCloudPulseSystem();
    initPulseAdminApprovalSystem();
    initPulseTicker();
    initTaglineTypewriter();
    initLoadMoreArticles();
  }

  /* ── 9. Cloud Pulse Micro-News & Upvote System ── */
  function getAccurateProviderAttribution(tags, linkUrl, title) {
    var tagsArr = Array.isArray(tags) ? tags : (typeof tags === "string" ? tags.split(",") : []);
    var combined = (tagsArr.join(" ") + " " + (linkUrl || "") + " " + (title || "")).toLowerCase();
    
    if (combined.includes("openshift") || combined.includes("redhat") || combined.includes("red hat")) {
      return "Red Hat / OpenShift";
    }
    if (combined.includes("google") || combined.includes("gcp") || combined.includes("googlecloud") || combined.includes("vertex")) {
      return "Google Cloud";
    }
    if (combined.includes("aws") || combined.includes("amazon") || combined.includes("bedrock") || combined.includes("s3")) {
      return "Amazon Web Services (AWS)";
    }
    if (combined.includes("azure") || combined.includes("microsoft")) {
      return "Microsoft Azure";
    }
    if (combined.includes("kubernetes") || combined.includes("k8s") || combined.includes("cncf")) {
      return "CNCF / Kubernetes";
    }
    if (tagsArr.length > 0) {
      return tagsArr[0].replace(/^#/, "").trim().replace(/([a-z])([A-Z])/g, "$1 $2");
    }
    return "Official Vendor Release";
  }

  function formatPulseLinkedInPost(title, content, tags, linkUrl) {
    var tagsArr = Array.isArray(tags) ? tags : (typeof tags === "string" ? tags.split(",") : []);
    var cleanTags = tagsArr.map(function (t) {
      var tr = t.trim();
      return tr.startsWith("#") ? tr : "#" + tr;
    }).filter(function (t) { return t.length > 1; });

    var defaultTags = ["#CloudNews", "#DevOps", "#GCloudCafe"];
    var uniqueTags = Array.from(new Set(cleanTags.concat(defaultTags)));
    var hashtagsText = uniqueTags.join(" ");

    var cleanContent = (content || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;[^&]+&gt;/g, "")
      .trim();

    var formattedBody = cleanContent;
    if (cleanContent.includes("🎯") && cleanContent.includes("💡")) {
      formattedBody = cleanContent;
    } else if (cleanContent.toLowerCase().includes("why it matters:")) {
      var parts = cleanContent.split(/Why it matters:\s*/i);
      var tldrPart = parts[0].replace(/🎯\s*(?:What Changed:)?/i, "").trim();
      var impactPart = (parts[1] || "").trim();
      formattedBody = "🎯 What Changed:\n" + tldrPart + "\n\n💡 Why It Matters:\n" + impactPart;
    } else if (cleanContent.includes(". ") && cleanContent.length > 50) {
      var firstDot = cleanContent.indexOf(". ");
      var sentence1 = cleanContent.substring(0, firstDot + 1).trim();
      var sentence2 = cleanContent.substring(firstDot + 2).trim();
      formattedBody = "🎯 What Changed:\n" + sentence1 + "\n\n💡 Why It Matters:\n" + sentence2;
    }

    var sourceLabel = getAccurateProviderAttribution(cleanTags, linkUrl, title);
    var pulseTargetUrl = (typeof window !== "undefined" && window.location ? window.location.origin : "https://gcloudcafe.com") + "/pulse/";

    return "☕ GCloud Cafe | Cloud Pulse (Independent Engineering Analysis)\n\n"
      + "📌 " + (title || "[Headline]") + "\n\n"
      + formattedBody + "\n\n"
      + "📖 Source: " + sourceLabel + (linkUrl ? "\n🔗 " + linkUrl : "") + "\n\n"
      + hashtagsText + "\n\n"
      + "—\n"
      + "💡 Daily Cloud & DevOps Engineering Insights 👇\n"
      + "🌐 " + pulseTargetUrl;
  }

  /* ── Shared Cloud Pulse Sorting & Synchronization Helper ── */
  function isManualApprovedPulse(p) {
    if (!p) return false;
    var reason = (p.eligibility_reason || "").toLowerCase();
    return !reason.includes("auto-published");
  }

  function sortCohortByScore(list) {
    return (list || []).slice().sort(function(a, b) {
      // Priority 1: Manual approvals always take higher precedence over auto-published posts
      var manualA = isManualApprovedPulse(a) ? 1 : 0;
      var manualB = isManualApprovedPulse(b) ? 1 : 0;
      if (manualB !== manualA) return manualB - manualA;

      // Priority 2: Community vote score
      var scoreA = typeof a.score === "number" ? a.score : ((a.upvotes || 0) - (a.downvotes || 0));
      var scoreB = typeof b.score === "number" ? b.score : ((b.upvotes || 0) - (b.downvotes || 0));
      if (scoreB !== scoreA) return scoreB - scoreA;

      // Priority 3: Recency
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }

  function initCloudPulseSystem() {
    var feedContainer = document.querySelector("[data-cloud-pulse-feed]");
    if (!feedContainer) return;

    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    var supabase = null;
    if (window.supabase && typeof window.supabase.createClient === "function") {
      supabase = window.supabase.createClient(config.url, config.anonKey);
    }

    var allLoadedPulses = [];
    var activeFilter = "all";
    var activeSearchQuery = "";

    function applyViewTransition(updateFn) {
      if (typeof document !== "undefined" && document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.startViewTransition(updateFn);
      } else {
        updateFn();
      }
    }

    function updateResultCounter(count) {
      var counterEl = document.getElementById("pulse-result-count");
      if (counterEl) {
        var total = allLoadedPulses.length;
        if (count === total) {
          counterEl.textContent = "Showing " + total + " updates";
        } else {
          counterEl.textContent = "Showing " + count + " of " + total + " updates";
        }
      }
    }

    function filterAndRenderPulses() {
      var filtered = allLoadedPulses;
      if (activeFilter !== "all") {
        filtered = allLoadedPulses.filter(function(p) {
          var tagsStr = (Array.isArray(p.tags) ? p.tags.join(" ") : "") + " " + (p.title || "") + " " + (p.content || "");
          var lower = tagsStr.toLowerCase();
          if (activeFilter === "kubernetes") return lower.includes("k8s") || lower.includes("kube") || lower.includes("cncf") || lower.includes("gateway") || lower.includes("kyaml");
          if (activeFilter === "gcp") return lower.includes("gcp") || lower.includes("google") || lower.includes("bigquery");
          if (activeFilter === "aws") return lower.includes("aws") || lower.includes("amazon") || lower.includes("rosa");
          if (activeFilter === "azure") return lower.includes("azure") || lower.includes("microsoft");
          if (activeFilter === "openshift") return lower.includes("openshift") || lower.includes("redhat") || lower.includes("red hat") || lower.includes("rosa") || lower.includes("odc");
          if (activeFilter === "devops") return lower.includes("devops") || lower.includes("ci/cd") || lower.includes("gitops") || lower.includes("terraform");
          if (activeFilter === "security") return lower.includes("security") || lower.includes("tls") || lower.includes("cve") || lower.includes("cert");
          if (activeFilter === "ai") return lower.includes("ai") || lower.includes("llm") || lower.includes("genai") || lower.includes("model");
          return true;
        });
      }

      if (activeSearchQuery && activeSearchQuery.trim().length > 0) {
        var q = activeSearchQuery.trim().toLowerCase();
        filtered = filtered.filter(function(p) {
          var corpus = ((p.title || "") + " " + (p.content || "") + " " + (Array.isArray(p.tags) ? p.tags.join(" ") : "")).toLowerCase();
          return corpus.includes(q);
        });
      }

      applyViewTransition(function() {
        updateResultCounter(filtered.length);
        renderPulses(filtered);
      });
    }

    function updatePulseChipUI(chip, isActive) {
      var activeClasses = ["is-active", "bg-primary", "text-white", "border-transparent", "shadow-xs"];
      var inactiveClasses = ["bg-theme-light", "dark:bg-darkmode-theme-light", "text-text/80", "dark:text-darkmode-text/80", "border-border/60", "dark:border-darkmode-border/60"];
      
      if (isActive) {
        inactiveClasses.forEach(function(cls) { chip.classList.remove(cls); });
        activeClasses.forEach(function(cls) { chip.classList.add(cls); });
      } else {
        activeClasses.forEach(function(cls) { chip.classList.remove(cls); });
        inactiveClasses.forEach(function(cls) { chip.classList.add(cls); });
      }
    }

    function setupFilterChips() {
      var chips = document.querySelectorAll("[data-pulse-filter]");
      chips.forEach(function(chip) {
        chip.addEventListener("click", function(e) {
          e.preventDefault();
          chips.forEach(function(c) {
            updatePulseChipUI(c, false);
          });
          updatePulseChipUI(chip, true);
          activeFilter = chip.getAttribute("data-pulse-filter") || "all";
          filterAndRenderPulses();
        });
      });
    }

    function setupPulseSearch() {
      var searchInput = document.getElementById("pulse-search-input");
      var clearBtn = document.getElementById("pulse-search-clear");
      if (!searchInput) return;

      searchInput.addEventListener("input", function() {
        activeSearchQuery = searchInput.value || "";
        if (clearBtn) {
          if (activeSearchQuery.trim().length > 0) {
            clearBtn.classList.remove("hidden");
          } else {
            clearBtn.classList.add("hidden");
          }
        }
        filterAndRenderPulses();
      });

      if (clearBtn) {
        clearBtn.addEventListener("click", function() {
          searchInput.value = "";
          activeSearchQuery = "";
          clearBtn.classList.add("hidden");
          searchInput.focus();
          filterAndRenderPulses();
        });
      }

      // Keyboard shortcut: Ctrl+/ or Cmd+/ or '/'
      document.addEventListener("keydown", function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "/") {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        } else if (e.key === "/" && document.activeElement !== searchInput && !["INPUT", "TEXTAREA", "SELECT"].includes((document.activeElement || {}).tagName)) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      });
    }

    function fallbackPulseCopy(text, cb) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        if (cb) cb();
      } catch (err) {
        console.error("Clipboard copy failed", err);
      }
      document.body.removeChild(ta);
    }

    function copyPulseSlackMarkdown(text, btnEl) {
      function showSuccess() {
        if (!btnEl) return;
        var origHtml = btnEl.innerHTML;
        btnEl.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> <span>Copied to Clipboard!</span>';
        setTimeout(function() {
          btnEl.innerHTML = origHtml;
        }, 2200);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showSuccess).catch(function() {
          fallbackPulseCopy(text, showSuccess);
        });
      } else {
        fallbackPulseCopy(text, showSuccess);
      }
    }

    function openPulseFocusModal(pulse, rankBadge) {
      var modal = document.getElementById("pulse-focus-modal");
      if (!modal) return;

      var badgesContainer = document.getElementById("pulse-focus-badges");
      var titleEl = document.getElementById("pulse-focus-title");
      var contentEl = document.getElementById("pulse-focus-content");
      var tagsContainer = document.getElementById("pulse-focus-tags");
      var sourceLinkEl = document.getElementById("pulse-focus-sourcelink");
      var copySlackBtn = document.getElementById("pulse-focus-copy-slack");
      var shareLinkedinLink = document.getElementById("pulse-focus-share-linkedin");

      if (badgesContainer) {
        var dateHtml = '<span class="font-mono text-xs text-slate-500 dark:text-slate-400">' + formatDate(pulse.created_at) + '</span>';
        badgesContainer.innerHTML = (rankBadge || "") + dateHtml;
      }

      if (titleEl) {
        titleEl.textContent = pulse.title || "";
      }

      var cleanContent = (pulse.content || "")
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;[^&]+&gt;/g, "")
        .trim();

      if (contentEl) {
        contentEl.innerHTML = formatPulseContentToHtml(cleanContent);
      }

      if (tagsContainer) {
        var tagsHtml = "";
        if (Array.isArray(pulse.tags)) {
          pulse.tags.forEach(function(tag) {
            tagsHtml += '<span class="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">' + escapeHtml(tag) + '</span> ';
          });
        }
        tagsContainer.innerHTML = tagsHtml;
      }

      if (sourceLinkEl) {
        if (pulse.link_url) {
          sourceLinkEl.innerHTML = '<a href="' + escapeHtml(pulse.link_url) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-red-600 dark:text-red-500 hover:underline"><i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Vendor Docs / Advisory</a>';
        } else {
          sourceLinkEl.innerHTML = "";
        }
      }

      // Generate Slack/Teams formatted markdown
      var whatChangedMatch = cleanContent.match(/(?:🎯\s*(?:\*\*)?What Changed(?:\*\*)?:?)([\s\S]*?)(?:💡|$)/i);
      var impactMatch = cleanContent.match(/(?:💡\s*(?:\*\*)?(?:Why It Matters|Engineering Impact|Impact)(?:\*\*)?:?)([\s\S]+)$/i);
      var whatChanged = whatChangedMatch ? whatChangedMatch[1].trim() : cleanContent;
      var impact = impactMatch ? impactMatch[1].trim() : "";

      var slackText = "*⚡ Cloud Pulse: " + (pulse.title || "") + "*\n\n" +
        (whatChanged ? "*🎯 What Changed:*\n" + whatChanged + "\n\n" : "") +
        (impact ? "*💡 Why It Matters:*\n" + impact + "\n\n" : "") +
        (pulse.link_url ? "🔗 *Source:* " + pulse.link_url + "\n" : "") +
        (Array.isArray(pulse.tags) ? "🏷️ " + pulse.tags.join(" ") : "");

      if (copySlackBtn) {
        copySlackBtn.onclick = function() {
          copyPulseSlackMarkdown(slackText, copySlackBtn);
        };
      }

      if (shareLinkedinLink) {
        var liText = formatPulseLinkedInPost(pulse.title, cleanContent, pulse.tags, pulse.link_url);
        shareLinkedinLink.href = "https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent(liText);
      }

      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }

    function closePulseFocusModal() {
      var modal = document.getElementById("pulse-focus-modal");
      if (!modal) return;
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    }

    function setupPulseFocusModal() {
      var modal = document.getElementById("pulse-focus-modal");
      if (!modal) return;

      var closeBtn = document.getElementById("pulse-focus-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", closePulseFocusModal);
      }

      modal.addEventListener("click", function(e) {
        if (e.target === modal) {
          closePulseFocusModal();
        }
      });

      document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
          closePulseFocusModal();
        }
      });
    }

    function isManualApprovedPulse(p) {
      if (!p) return false;
      var reason = (p.eligibility_reason || "").toLowerCase();
      return !reason.includes("auto-published");
    }

    function sortCohortByScore(list) {
      return (list || []).slice().sort(function(a, b) {
        // Priority 1: Manual approvals always take higher precedence over auto-published posts
        var manualA = isManualApprovedPulse(a) ? 1 : 0;
        var manualB = isManualApprovedPulse(b) ? 1 : 0;
        if (manualB !== manualA) return manualB - manualA;

        // Priority 2: Community vote score
        var scoreA = typeof a.score === "number" ? a.score : ((a.upvotes || 0) - (a.downvotes || 0));
        var scoreB = typeof b.score === "number" ? b.score : ((b.upvotes || 0) - (b.downvotes || 0));
        if (scoreB !== scoreA) return scoreB - scoreA;

        // Priority 3: Recency
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }).slice(0, 6);
    }

    function fetchPulses() {
      setupFilterChips();
      setupPulseSearch();
      setupPulseFocusModal();
      // Fetch latest 6 approved articles (the active competing cohort)
      var queryUrl = config.url + "/rest/v1/cloud_pulses?status=eq.approved&order=created_at.desc&limit=30";
      
      fetch(queryUrl, {
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey
        }
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (Array.isArray(data) && data.length > 0) {
          allLoadedPulses = sortCohortByScore(data);
          filterAndRenderPulses();
        } else if (supabase) {
          supabase.from("cloud_pulses").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(30).then(function(sRes) {
            if (sRes && Array.isArray(sRes.data) && sRes.data.length > 0) {
              allLoadedPulses = sortCohortByScore(sRes.data);
              filterAndRenderPulses();
            } else {
              renderPulses([]);
            }
          }).catch(function() {
            renderPulses([]);
          });
        } else {
          renderPulses([]);
        }
      })
      .catch(function (err) {
        console.error("Cloud Pulse fetch error:", err);
        if (supabase) {
          supabase.from("cloud_pulses").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(24).then(function(sRes) {
            if (sRes && sRes.data && sRes.data.length > 0) {
              allLoadedPulses = sortCohortByScore(sRes.data);
              filterAndRenderPulses();
            } else {
              renderPulses([]);
            }
          }).catch(function() {
            renderPulses([]);
          });
        } else {
          renderPulses([]);
        }
      });
    }

    
    function formatPulseContentToHtml(rawText) {
      var text = (rawText || "").trim();
      if (!text) return "";
      
      var whatChanged = "";
      var impact = "";
      
      var impactMatch = text.match(/(?:💡\s*(?:\*\*)?(?:Why It Matters|Engineering Impact|Impact)(?:\*\*)?:?)([\s\S]+)$/i);
      if (impactMatch) {
        impact = impactMatch[1].trim();
        var beforeImpact = text.substring(0, impactMatch.index).trim();
        var whatChangedMatch = beforeImpact.match(/(?:🎯\s*(?:\*\*)?What Changed(?:\*\*)?:?)([\s\S]+)$/i);
        if (whatChangedMatch) {
          whatChanged = whatChangedMatch[1].trim();
        } else {
          whatChanged = beforeImpact.replace(/^🎯\s*/, "").trim();
        }
      } else {
        var whatChangedMatch = text.match(/(?:🎯\s*(?:\*\*)?What Changed(?:\*\*)?:?)([\s\S]+)$/i);
        if (whatChangedMatch) {
          whatChanged = whatChangedMatch[1].trim();
        } else {
          whatChanged = text;
        }
      }

      var out = '<div class="space-y-3 my-1">';
      if (whatChanged) {
        out += '<div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">' +
                 '<div class="flex items-center gap-1.5 mb-2">' +
                   '<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">' +
                     '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>' +
                     '<span>What Changed</span>' +
                   '</span>' +
                 '</div>' +
                 '<p class="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed font-normal mb-0">' +
                   escapeHtml(whatChanged) +
                 '</p>' +
               '</div>';
      }
      if (impact) {
        out += '<div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">' +
                 '<div class="flex items-center gap-1.5 mb-2">' +
                   '<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">' +
                     '<i class="fa-regular fa-lightbulb text-[10px] text-amber-500"></i>' +
                     '<span>Why It Matters</span>' +
                   '</span>' +
                 '</div>' +
                 '<p class="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal mb-0">' +
                   escapeHtml(impact) +
                 '</p>' +
               '</div>';
      }
      if (!whatChanged && !impact) {
        out += '<div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-normal leading-relaxed">' +
                 escapeHtml(text) +
               '</div>';
      }
      out += '</div>';
      return out;
    }

function renderPulses(pulses) {
      if (!pulses || pulses.length === 0) {
        var queryText = activeSearchQuery ? ' matching "' + escapeHtml(activeSearchQuery) + '"' : '';
        feedContainer.innerHTML = '<div class="col-span-full text-center py-12 px-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">' +
          '<div class="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">' +
            '<i class="fa-solid fa-magnifying-glass text-base"></i>' +
          '</div>' +
          '<h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1">No pulse updates found' + queryText + '</h3>' +
          '<p class="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">Try clearing your search query or selecting "All Updates" to view the latest cloud intelligence.</p>' +
          '<button id="pulse-reset-filters-btn" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-all border-0 shadow-xs">' +
            '<i class="fa-solid fa-rotate-left text-[10px]"></i> Reset Filters' +
          '</button>' +
        '</div>';

        var resetBtn = document.getElementById("pulse-reset-filters-btn");
        if (resetBtn) {
          resetBtn.addEventListener("click", function() {
            var searchInput = document.getElementById("pulse-search-input");
            if (searchInput) searchInput.value = "";
            var clearBtn = document.getElementById("pulse-search-clear");
            if (clearBtn) clearBtn.classList.add("hidden");
            activeSearchQuery = "";
            activeFilter = "all";
            var chips = document.querySelectorAll("[data-pulse-filter]");
            chips.forEach(function(c) {
              updatePulseChipUI(c, c.getAttribute("data-pulse-filter") === "all");
            });
            filterAndRenderPulses();
          });
        }
        updateResultCounter(0);
        return;
      }

      // Pre-sorted & calculated by Supabase Postgres View (cloud_pulses_trending)
      var topPulses = pulses; // Display full cohort for 1-to-1 sync with ticker and comprehensive filtering

      var html = "";
      topPulses.forEach(function (p, idx) {
        var rankBadge = idx === 0 ? '<span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">🔥 #1 TRENDING</span>'
                      : idx === 1 ? '<span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">#2 TOP PULSE</span>'
                      : idx === 2 ? '<span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-800/30">#3 TOP PULSE</span>'
                      : '<span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">#' + (idx + 1) + '</span>';

        var tagsHtml = "";
        if (Array.isArray(p.tags)) {
          p.tags.forEach(function (tag) {
            tagsHtml += '<span class="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">' + escapeHtml(tag) + '</span> ';
          });
        }

        var userVote = localStorage.getItem("pulse_voted_" + p.id);
        var upActiveClass = userVote === "up" ? "pulse-vote-btn is-upvoted" : "pulse-vote-btn";
        var downActiveClass = userVote === "down" ? "pulse-vote-btn pulse-vote-btn-down is-downvoted" : "pulse-vote-btn pulse-vote-btn-down";

        var titleHtml = escapeHtml(p.title);
        var eventLinkHtml = "";
        if (p.link_url) {
          titleHtml = '<a href="' + escapeHtml(p.link_url) + '" target="_blank" rel="noopener noreferrer" class="hover:underline flex items-center gap-1.5 no-underline hover:text-primary">' + titleHtml + ' <i class="fa-solid fa-arrow-up-right-from-square text-xs text-primary"></i></a>';
          eventLinkHtml = '<div class="mb-5"><a href="' + escapeHtml(p.link_url) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs sm:text-sm font-bold no-underline transition-all"><i class="fa-solid fa-link text-xs"></i> Official Event / Page <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a></div>';
        }

        var hashtagsText = Array.isArray(p.tags) ? p.tags.map(function(t){ return t.startsWith('#') ? t : '#' + t; }).join(" ") : "";
        var cleanContentText = (p.content || "")
          .replace(/<[^>]+>/g, "")
          .replace(/&lt;[^&]+&gt;/g, "")
          .trim();

        // Derive source label from tags (e.g. #GoogleCloud → "Google Cloud", #AWS → "AWS")
        var sourceLabel = "";
        if (Array.isArray(p.tags) && p.tags.length > 0) {
          sourceLabel = p.tags[0].replace(/^#/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
        }

        var pulseTargetUrl = window.location.origin + "/pulse/";
        var originalUrl = p.link_url || pulseTargetUrl;

        var shareText = formatPulseLinkedInPost(p.title, cleanContentText, p.tags, p.link_url);

        var linkedinShareUrl = "https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent(shareText);

        var linkedinBtnHtml = '<a href="' + linkedinShareUrl + '" data-pulse-share-title="' + escapeHtml(p.title) + '" data-pulse-share-text="' + escapeHtml(shareText) + '" data-pulse-share-url="' + escapeHtml(originalUrl) + '" target="_blank" rel="noopener noreferrer" class="pulse-share-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#0a66c2]/10 hover:bg-[#0a66c2] text-[#0a66c2] hover:text-white transition-all no-underline shrink-0" title="Share pulse on LinkedIn">' +
          '<i class="fa-brands fa-linkedin text-sm"></i> Share' +
        '</a>';

        var inspectBtnHtml = '<button type="button" data-pulse-inspect="' + escapeHtml(p.id) + '" class="pulse-inspect-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border-0 cursor-pointer shrink-0" title="Inspect full update & share">' +
          '<i class="fa-solid fa-expand text-[10px]"></i> Inspect' +
        '</button>';

        var cardTransitionName = 'pulse-card-' + escapeHtml(String(p.id).replace(/[^a-zA-Z0-9_-]/g, ''));
        html += '<div id="pulse-' + escapeHtml(p.id) + '" data-pulse-id="' + escapeHtml(p.id) + '" style="view-transition-name: ' + cardTransitionName + ';" class="cloud-pulse-card scroll-mt-28 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700 group">' +
          '<div>' +
            '<div class="flex items-center justify-between gap-2 mb-3">' +
              rankBadge +
              '<span class="font-mono text-xs text-slate-500 dark:text-slate-400">' + formatDate(p.created_at) + '</span>' +
            '</div>' +
            '<h4 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 leading-snug group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors cursor-pointer" data-pulse-inspect="' + escapeHtml(p.id) + '">' + titleHtml + '</h4>' +
            '<div class="mb-4 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">' + 
              formatPulseContentToHtml(cleanContentText) + 
            '</div>' +
            eventLinkHtml +
          '</div>' +

          '<div class="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">' +
            '<div class="flex flex-wrap gap-1.5 min-w-0">' + tagsHtml + '</div>' +

            '<div class="flex items-center gap-2 shrink-0 ml-auto">' +
              inspectBtnHtml +
              linkedinBtnHtml +
              '<div class="pulse-vote-pill inline-flex items-center flex-row flex-nowrap shrink-0 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 gap-0.5 shadow-xs">' +
                '<button data-pulse-upvote="' + p.id + '" data-upvotes="' + (p.upvotes || 0) + '" data-downvotes="' + (p.downvotes || 0) + '" class="' + upActiveClass + ' inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono text-xs font-bold transition-all border-none bg-transparent cursor-pointer" title="Upvote pulse" aria-label="Upvote this cloud pulse">' +
                  '<i class="fa-solid fa-arrow-up text-[11px]"></i> <span>' + (p.score >= 0 ? '+' + p.score : p.score) + '</span>' +
                '</button>' +
                '<div class="pulse-vote-divider w-[1px] h-3.5 bg-slate-300 dark:bg-slate-600 shrink-0"></div>' +
                '<button data-pulse-downvote="' + p.id + '" data-upvotes="' + (p.upvotes || 0) + '" data-downvotes="' + (p.downvotes || 0) + '" class="' + downActiveClass + ' inline-flex items-center justify-center w-6 h-6 rounded font-mono text-xs font-bold transition-all border-none bg-transparent cursor-pointer shrink-0" title="Downvote pulse" aria-label="Downvote this cloud pulse">' +
                  '<i class="fa-solid fa-arrow-down text-[11px]"></i>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      });

      feedContainer.innerHTML = html;
      bindVoteEvents(topPulses);

      function scrollToTargetPulse() {
        if (window.location.hash && window.location.hash.startsWith("#pulse-")) {
          var targetId = window.location.hash.replace("#pulse-", "");
          var targetCard = document.getElementById("pulse-" + targetId);

          // If target pulse exists in cohort but is currently hidden by an active filter or search query, reset filter
          if (!targetCard && allLoadedPulses.some(function(p) { return String(p.id) === targetId; })) {
            activeFilter = "all";
            activeSearchQuery = "";
            var searchInput = document.getElementById("pulse-search-input");
            if (searchInput) searchInput.value = "";
            var clearBtn = document.getElementById("pulse-search-clear");
            if (clearBtn) clearBtn.classList.add("hidden");
            var chips = document.querySelectorAll("[data-pulse-filter]");
            chips.forEach(function(c) {
              updatePulseChipUI(c, c.getAttribute("data-pulse-filter") === "all");
            });
            filterAndRenderPulses();
            targetCard = document.getElementById("pulse-" + targetId);
          }

          if (targetCard) {
            targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
            targetCard.classList.add("ring-2", "ring-primary", "shadow-xl");
            setTimeout(function() {
              targetCard.classList.remove("ring-2", "ring-primary", "shadow-xl");
            }, 3500);
          }
        }
      }
      setTimeout(scrollToTargetPulse, 200);
      window.addEventListener("hashchange", scrollToTargetPulse);
    }

    var currentPulses = [];

    function bindVoteEvents(pulsesMap) {
      currentPulses = pulsesMap || [];
      if (feedContainer.getAttribute("data-vote-bound") === "true") return;
      feedContainer.setAttribute("data-vote-bound", "true");

      feedContainer.addEventListener("click", function (e) {
        var inspectTarget = e.target.closest("[data-pulse-inspect]");
        if (inspectTarget) {
          e.preventDefault();
          var inspectId = inspectTarget.getAttribute("data-pulse-inspect");
          var pulseItem = allLoadedPulses.find(function(item) { return String(item.id) === String(inspectId); });
          if (pulseItem) {
            var pulseIdx = allLoadedPulses.findIndex(function(item) { return String(item.id) === String(inspectId); });
            var inspectRankBadge = pulseIdx === 0 ? '<span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">🔥 #1 TRENDING</span>'
                                  : pulseIdx === 1 ? '<span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">#2 TOP PULSE</span>'
                                  : pulseIdx === 2 ? '<span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-800/30">#3 TOP PULSE</span>'
                                  : '<span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">#' + (pulseIdx + 1) + '</span>';
            openPulseFocusModal(pulseItem, inspectRankBadge);
          }
          return;
        }

        var upTarget = e.target.closest("[data-pulse-upvote]");
        var downTarget = e.target.closest("[data-pulse-downvote]");
        var shareTarget = e.target.closest(".pulse-share-btn");

        if (shareTarget && navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          e.preventDefault();
          var shareTitle = shareTarget.getAttribute("data-pulse-share-title");
          var shareText = shareTarget.getAttribute("data-pulse-share-text");
          var shareUrl = shareTarget.getAttribute("data-pulse-share-url");
          navigator.share({
            title: shareTitle,
            text: shareTitle + "\n\n" + shareText,
            url: shareUrl
          }).catch(function () {});
        } else if (upTarget) {
          e.preventDefault();
          var id = upTarget.getAttribute("data-pulse-upvote");
          castVote(id, "up", currentPulses);
        } else if (downTarget) {
          e.preventDefault();
          var id = downTarget.getAttribute("data-pulse-downvote");
          castVote(id, "down", currentPulses);
        }
      });
    }

    function castVote(id, clickedType, pulsesList) {
      var currentVote = localStorage.getItem("pulse_voted_" + id);
      var item = pulsesList.find(function (p) { return p.id === id; });
      if (!item) return;

      var origScore = typeof item.score === "number" ? item.score : ((item.upvotes || 0) - (item.downvotes || 0));
      var newScore = origScore;
      var newVote = currentVote;

      if (clickedType === "up") {
        if (currentVote === "up") {
          return; // Already upvoted -> locked
        } else if (currentVote === "down") {
          // Downvoted -> Neutral (+1 step)
          newScore = origScore + 1;
          newVote = null;
        } else {
          // Neutral -> Upvoted (+1 step)
          newScore = origScore + 1;
          newVote = "up";
        }
      } else if (clickedType === "down") {
        if (currentVote === "down") {
          return; // Already downvoted -> locked
        } else if (currentVote === "up") {
          // Upvoted -> Neutral (-1 step)
          newScore = origScore - 1;
          newVote = null;
        } else {
          // Neutral -> Downvoted (-1 step)
          newScore = origScore - 1;
          newVote = "down";
        }
      }

      item.score = newScore;

      // Update LocalStorage
      if (newVote) {
        localStorage.setItem("pulse_voted_" + id, newVote);
      } else {
        localStorage.removeItem("pulse_voted_" + id);
      }

      // Optimistic UI update with Google Stock Ticker animation
      var upBtn = feedContainer.querySelector('[data-pulse-upvote="' + id + '"]');
      var downBtn = feedContainer.querySelector('[data-pulse-downvote="' + id + '"]');
      var scoreSpan = upBtn ? upBtn.querySelector('span') : null;

      if (upBtn && downBtn) {
        if (newVote === "up") {
          upBtn.className = "pulse-vote-btn is-upvoted";
          downBtn.className = "pulse-vote-btn pulse-vote-btn-down";
        } else if (newVote === "down") {
          upBtn.className = "pulse-vote-btn";
          downBtn.className = "pulse-vote-btn pulse-vote-btn-down is-downvoted";
        } else {
          upBtn.className = "pulse-vote-btn";
          downBtn.className = "pulse-vote-btn pulse-vote-btn-down";
        }

        if (scoreSpan) {
          scoreSpan.textContent = (newScore >= 0 ? '+' + newScore : newScore);
          var animClass = clickedType === "up" ? "stock-ticker-up" : "stock-ticker-down";
          scoreSpan.classList.remove("stock-ticker-up", "stock-ticker-down");
          requestAnimationFrame(function() {
            scoreSpan.classList.add(animClass);
          });
          setTimeout(function() {
            scoreSpan.classList.remove(animClass);
          }, 450);
        }
      }

      // Sync background payload to Supabase without triggering full DOM rebuild
      var payload = { score: newScore };
      if (supabase) {
        supabase.from("cloud_pulses").update(payload).eq("id", id).then().catch();
      } else {
        fetch(config.url + "/rest/v1/cloud_pulses?id=eq." + id, {
          method: "PATCH",
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }
    }

    // Admin Modal & Secret Access Triggers
    var adminModal = document.getElementById("pulse-admin-modal");
    var openBtn = document.querySelector("[data-open-pulse-admin]");
    var closeBtn = document.querySelector("[data-close-pulse-admin]");
    var adminForm = document.querySelector("[data-pulse-admin-form]");
    var statusElem = document.querySelector("[data-pulse-admin-status]");

    if (openBtn && adminModal) {
      openBtn.addEventListener("click", function () {
        adminModal.classList.remove("hidden");
      });
    }

    // Secret URL Hash (#admin) or Keyboard Shortcut (Ctrl+Shift+P) trigger
    if (adminModal) {
      if (window.location.hash === "#admin") {
        adminModal.classList.remove("hidden");
      }

      window.addEventListener("keydown", function (e) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "P" || e.key === "p")) {
          e.preventDefault();
          adminModal.classList.toggle("hidden");
        }
      });
    }

    if (closeBtn && adminModal) {
      closeBtn.addEventListener("click", function () {
        adminModal.classList.add("hidden");
      });
    }

    if (adminModal) {
      adminModal.addEventListener("click", function (e) {
        if (e.target === adminModal) adminModal.classList.add("hidden");
      });
    }

    if (adminForm) {
      adminForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var formData = new FormData(adminForm);
        var passcode = (formData.get("passcode") || "").trim();
        var title = (formData.get("title") || "").trim();
        var content = (formData.get("content") || "").trim();
        var linkUrl = (formData.get("link_url") || "").trim();
        var tagsRaw = (formData.get("tags") || "").trim();

        if (passcode !== "1526" && passcode !== "admin") {
          if (statusElem) {
            statusElem.textContent = "Invalid passcode!";
            statusElem.className = "text-xs font-semibold mr-auto text-rose-500";
          }
          return;
        }

        var tagsArr = tagsRaw.split(",").map(function (t) {
          var trimmed = t.trim();
          return trimmed.startsWith("#") ? trimmed : "#" + trimmed;
        }).filter(function (t) { return t.length > 1; });

        if (statusElem) {
          statusElem.textContent = "Publishing pulse...";
          statusElem.className = "text-xs font-semibold mr-auto text-primary animate-pulse";
        }

        var payload = {
          title: title,
          content: content,
          tags: tagsArr,
          upvotes: 1,
          downvotes: 0,
          score: 1,
          author: "Tharun Vempati"
        };

        if (linkUrl) {
          payload.link_url = linkUrl;
        }

        fetch(config.url + "/rest/v1/cloud_pulses", {
          method: "POST",
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify(payload)
        })
        .then(function (res) {
          if (res.ok) {
            if (statusElem) {
              statusElem.textContent = "Published live! 🎉";
              statusElem.className = "text-xs font-semibold mr-auto text-emerald-500";
            }
            adminForm.reset();
            setTimeout(function () {
              if (adminModal) adminModal.classList.add("hidden");
              if (statusElem) statusElem.textContent = "";
              if (window.location.pathname.indexOf("pulse-admin") !== -1) {
                window.location.href = "/pulse/";
              } else {
                fetchPulses();
              }
            }, 1000);
          } else {
            if (statusElem) {
              statusElem.textContent = "Failed to publish.";
              statusElem.className = "text-xs font-semibold mr-auto text-rose-500";
            }
          }
        })
        .catch(function () {
          if (statusElem) {
            statusElem.textContent = "Network error.";
            statusElem.className = "text-xs font-semibold mr-auto text-rose-500";
          }
        });
      });
    }

    // Initial fetch
    fetchPulses();
  }

  /* ── 9b. Live Pulse Micro-Blog Marquee Ticker ── */
  function initPulseTicker() {
    var marquee = document.querySelector("[data-pulse-ticker-marquee]");
    if (!marquee) return;

    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    function getTagMeta(tags) {
      var raw = (Array.isArray(tags) && tags[0]) ? tags[0].replace(/^#/, "").toUpperCase() : "CLOUD";
      if (raw === "GOOGLECLOUD" || raw === "GCP") return { label: "GCP", cls: "ticker-tag-gcp" };
      if (raw === "KUBERNETES" || raw === "K8S" || raw === "CNCF") return { label: "K8S", cls: "ticker-tag-k8s" };
      if (raw === "AWS") return { label: "AWS", cls: "ticker-tag-aws" };
      if (raw === "OPENSHIFT" || raw === "REDHAT") return { label: "OPENSHIFT", cls: "ticker-tag-redhat" };
      if (raw === "SECURITY" || raw === "TLS") return { label: "SECURITY", cls: "ticker-tag-security" };
      return { label: raw, cls: "ticker-tag-default" };
    }

    var queryUrl = config.url + "/rest/v1/cloud_pulses?status=eq.approved&order=created_at.desc&limit=30";
    fetch(queryUrl, {
      headers: {
        "apikey": config.anonKey,
        "Authorization": "Bearer " + config.anonKey
      }
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!Array.isArray(data) || data.length === 0) return;

      // Maintain strict 1-to-1 parity with Pulse newsroom feed by using identical ranking
      var sorted = sortCohortByScore(data).slice(0, 10);
      var itemsHtml = "";
      sorted.forEach(function(item) {
        var tagMeta = getTagMeta(item.tags);
        var safeTitle = escapeHtml(item.title || "Cloud Pulse Update");
        var pulsePostLink = "/pulse/#pulse-" + encodeURIComponent(item.id || "");
        itemsHtml += '<a href="' + pulsePostLink + '" class="ticker-item group/item inline-flex items-center gap-2 px-3.5 py-1 whitespace-nowrap transition-colors hover:bg-slate-800/60 no-underline">'
          + '<span class="ticker-tag ' + tagMeta.cls + '">$' + escapeHtml(tagMeta.label) + '</span>'
          + '<span class="ticker-title font-sans font-medium text-[12px] text-slate-200 group-hover/item:text-cyan-300 transition-colors">' + safeTitle + '</span>'
          + '<span class="ticker-divider text-slate-700 select-none ml-2">/</span>'
          + '</a>';
      });

      // Seamless duplicate loop for 60fps marquee
      marquee.innerHTML = itemsHtml + itemsHtml;
    })
    .catch(function(err) {
      // Fallback is already rendered in static HTML
    });
  }

  /* ── Newsroom Candidate Approval Dashboard & Gemini AI Studio ── */
  function initPulseAdminApprovalSystem() {
    var passcodeBtn = document.getElementById("admin-login-btn");
    var passcodeInput = document.getElementById("admin-passcode-input");
    var passcodeStatus = document.getElementById("admin-passcode-status");
    var dashboardContainer = document.getElementById("admin-dashboard-container");
    var authPrompt = document.getElementById("admin-auth-prompt");

    var pendingGrid = document.getElementById("pending-cards-grid");
    var pendingCountBadge = document.getElementById("pending-count-badge");
    var refreshBtn = document.getElementById("refresh-candidates-btn");

    var tabPendingBtn = document.getElementById("tab-pending-btn");
    var tabPublishedBtn = document.getElementById("tab-published-btn");
    var tabManualBtn = document.getElementById("tab-manual-btn");
    var sectionPending = document.getElementById("section-pending-approvals");
    var sectionPublished = document.getElementById("section-published-posts");
    var sectionManual = document.getElementById("section-manual-post");
    var publishedGrid = document.getElementById("published-cards-grid");
    var publishedCountBadge = document.getElementById("published-count-badge");
    var refreshPublishedBtn = document.getElementById("refresh-published-btn");
    var triggerAutoPublishBtn = document.getElementById("trigger-auto-publish-btn");
    var cachedPublishedPulses = [];
    var currentAdminPublishedFilter = "all";

    // Gemini API Key Controls
    var geminiKeyInput = document.getElementById("gemini-api-key-input");
    var saveGeminiKeyBtn = document.getElementById("save-gemini-key-btn");
    var toggleGeminiKeyBtn = document.getElementById("toggle-gemini-key-visibility");
    var geminiStatusBadge = document.getElementById("gemini-status-badge");

    // Candidate Edit & Polish Modal Elements
    var editModal = document.getElementById("pulse-edit-modal");
    var editModalCloseBtn = document.getElementById("close-pulse-edit-modal-btn");
    var editModalCancelBtn = document.getElementById("edit-modal-cancel-btn");
    var editForm = document.getElementById("pulse-edit-form");
    var editIdInput = document.getElementById("edit-modal-candidate-id");
    var editOrigContent = document.getElementById("edit-modal-orig-content");
    var editOrigLink = document.getElementById("edit-modal-orig-link");
    var editTitleInput = document.getElementById("edit-modal-title");
    var editContentInput = document.getElementById("edit-modal-content");
    var editLinkInput = document.getElementById("edit-modal-link");
    var editTagsInput = document.getElementById("edit-modal-tags");
    var editGenerateAiBtn = document.getElementById("edit-modal-generate-ai-btn");
    var editAiStatus = document.getElementById("edit-modal-ai-status");
    var editCharCount = document.getElementById("edit-modal-char-count");
    var editLinkedInPreview = document.getElementById("edit-modal-linkedin-preview");
    var editCopyLinkedInBtn = document.getElementById("edit-modal-copy-linkedin-btn");
    var editModalStatus = document.getElementById("edit-modal-status");

    // Manual Form AI Polish Trigger
    var manualFormGeminiBtn = document.getElementById("manual-form-gemini-btn");

    var cachedCandidates = [];
    var cachedGeminiApiKey = "";
    var geminiCooldownUntil = 0;

    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    // Smart extractive fallback generator (used during rate limits, quota limits, or network errors)
    function createSmartFallbackHook(title, rawContent) {
      var clean = (rawContent || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&lt;[^&]+&gt;/gi, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

      var cleanTitle = (title || "Cloud Platform Update").trim();
      if (!clean) {
        return "🎯 What Changed: " + cleanTitle + ".\n\n💡 Why It Matters: Enables cloud and DevOps teams to optimize workloads and modernize cloud infrastructure.";
      }

      // Split into complete sentences, filtering out generic RSS filler
      var sentenceMatches = clean.match(/[^.!?]+[.!?]+/g) || [];
      var sentences = sentenceMatches
        .map(function(s) { return s.trim(); })
        .filter(function(s) {
          return s.length > 20 && !/want to know|check back|find it here|read more|latest from/i.test(s);
        });

      var whatChanged = "";
      var impact = "";

      if (sentences.length > 0) {
        whatChanged = sentences[0];
        if (whatChanged.length < 100 && sentences.length > 2) {
          whatChanged += " " + sentences[1];
          impact = sentences[2];
        } else if (sentences.length > 1) {
          impact = sentences[1];
        }
      } else {
        whatChanged = clean;
      }

      whatChanged = whatChanged
        .replace(/\s+(?:that|which|who|a|an|the|and|or|but|with|to|for|in|on|at|by|from|as|into|require|requires|requiring|is|are|was|were)\s*$/i, "")
        .trim();
      if (!/[.!?]$/.test(whatChanged)) {
        whatChanged += ".";
      }

      if (!impact) {
        impact = "Delivers architectural improvements, enhanced security postures, and operational efficiencies for cloud infrastructure teams.";
      } else {
        impact = impact
          .replace(/\s+(?:that|which|who|a|an|the|and|or|but|with|to|for|in|on|at|by|from|as|into|require|requires|requiring|is|are|was|were)\s*$/i, "")
          .trim();
        if (!/[.!?]$/.test(impact)) {
          impact += ".";
        }
      }

      return "🎯 What Changed: " + whatChanged + "\n\n💡 Why It Matters: " + impact;
    }

    async function fetchGeminiApiKeyFromSupabase(forceRefresh) {
      if (cachedGeminiApiKey && !forceRefresh) return cachedGeminiApiKey;
      try {
        var res = await fetch(config.url + "/rest/v1/site_settings?key=eq.gemini_api_key&select=value", {
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey
          }
        });
        var data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].value) {
          var val = data[0].value.trim();
          cachedGeminiApiKey = val;
          try { localStorage.setItem("gcloudcafe_gemini_api_key", val); } catch (e) {}
          if (geminiKeyInput) {
            geminiKeyInput.value = val;
            if (geminiStatusBadge) {
              geminiStatusBadge.textContent = "AI Key Active ✨";
              geminiStatusBadge.classList.remove("hidden");
            }
          }
          return val;
        }
      } catch (err) {}
      var stored = "";
      try { stored = (localStorage.getItem("gcloudcafe_gemini_api_key") || "").trim(); } catch (e) {}
      return (cachedGeminiApiKey || stored).trim();
    }

    // Call Gemini API to generate crisp TL;DR Hook with automatic fallback on rate limit / quota exhaustion
    async function generateGeminiPulseHook(apiKey, title, content) {
      var fallbackText = createSmartFallbackHook(title, content);

      // Check if temporary rate-limit cooldown is active
      if (Date.now() < geminiCooldownUntil) {
        var remainingSec = Math.ceil((geminiCooldownUntil - Date.now()) / 1000);
        return {
          text: fallbackText,
          isFallback: true,
          reason: "Rate limit active (" + remainingSec + "s cooldown) — using smart summary excerpt"
        };
      }

      var keyToUse = (apiKey || "").trim();
      if (!keyToUse || keyToUse.length < 20) {
        keyToUse = await fetchGeminiApiKeyFromSupabase(true);
      }
      if (!keyToUse) {
        return {
          text: fallbackText,
          isFallback: true,
          reason: "No Gemini Key configured — enter your key in the top bar to activate AI synthesis"
        };
      }

      var prompt = "You are the lead cloud architect and news editor for GCloud Cafe (https://gcloudcafe.com).\n"
        + "Transform this official cloud announcement into a structured, high-impact Cloud Pulse insight following this EXACT 2-part format.\n\n"
        + "STRICT FORMAT:\n"
        + "🎯 What Changed: [1-2 crisp sentences explaining what was launched, updated, or deprecated]\n\n"
        + "💡 Why It Matters: [1-2 crisp sentences explaining the technical impact, architectural benefit, or action required for Cloud/DevOps engineers]\n\n"
        + "RULES:\n"
        + "1. Always output BOTH '🎯 What Changed:' and '💡 Why It Matters:' sections.\n"
        + "2. Total length between 50 and 90 words.\n"
        + "3. Focus on concrete technical engineering takeaways (APIs, performance, security, architecture, cost, operations).\n"
        + "4. Do NOT wrap in markdown code blocks. Output plain text with a blank line between the two points.\n\n"
        + "Article Title: " + title + "\n"
        + "Article Context: " + content;

      var models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
      var lastError = null;

      for (var i = 0; i < models.length; i++) {
        var model = models[i];
        try {
          var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(keyToUse);
          var controller = new AbortController();
          var timeoutId = setTimeout(function() { controller.abort(); }, 15000); // 15s timeout

          var res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048
              }
            })
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            var data = await res.json();
            var parts = data?.candidates?.[0]?.content?.parts || [];
            var candidateText = parts.map(function(p) { return p.text || ""; }).join("").trim();
            var cleaned = candidateText.replace(/^[\s"'\`]+|[\s"'\`]+$/g, "").replace(/\r\n/g, "\n").trim();
            if (cleaned) {
              // Ensure both 🎯 What Changed and 💡 Why It Matters are fully formed and complete
              if (cleaned.includes("💡 Why It") && !cleaned.match(/💡 Why It Matters:[^\n]{15,}/)) {
                cleaned = cleaned.replace(/💡 Why It.*$/s, "").trim() + "\n\n💡 Why It Matters: Enables cloud and DevOps engineering teams to streamline release tracking and accelerate architecture adoption.";
              } else if (!cleaned.includes("💡") && !cleaned.toLowerCase().includes("why it matters")) {
                cleaned += "\n\n💡 Why It Matters: Delivers key architectural improvements and operational efficiencies for cloud infrastructure teams.";
              }
              return { text: cleaned, isFallback: false };
            }
          } else {
            var status = res.status;
            var errData = await res.json().catch(function () { return {}; });
            var errMsg = (errData?.error?.message || "").toLowerCase();

            // If 400 or 404 with invalid key, force refresh key from Supabase and retry
            if (status === 400 || status === 404 || errMsg.includes("api_key_invalid") || errMsg.includes("not found")) {
              cachedGeminiApiKey = null;
              try { localStorage.removeItem("gcloudcafe_gemini_api_key"); } catch (e) {}
              var freshKey = await fetchGeminiApiKeyFromSupabase(true);
              if (freshKey && freshKey !== keyToUse) {
                keyToUse = freshKey;
                i--; // retry with fresh key
                continue;
              }
            }

            // Detect Rate Limit or Quota Exhaustion
            if (status === 429 || errMsg.includes("quota") || errMsg.includes("resource_exhausted") || errMsg.includes("rate limit") || errMsg.includes("too many requests")) {
              geminiCooldownUntil = Date.now() + (60 * 1000); // 60s cooldown
              return {
                text: fallbackText,
                isFallback: true,
                reason: "Quota / Rate limit reached — switched to smart summary excerpt"
              };
            }
            lastError = new Error(errData?.error?.message || ("Gemini API Error (" + status + ")"));
          }
        } catch (err) {
          lastError = err;
        }
      }

      // If all attempts failed or timed out, naturally fallback to smart excerpt without breaking
      return {
        text: fallbackText,
        isFallback: true,
        reason: "Gemini API unavailable — smart fallback summary used"
      };
    }

    function unlockDashboard() {
      if (dashboardContainer) dashboardContainer.classList.remove("hidden");
      if (authPrompt) authPrompt.classList.add("hidden");
      if (passcodeStatus) passcodeStatus.classList.add("hidden");

      fetchGeminiApiKeyFromSupabase(true);

      if (geminiKeyInput) {
        var existingKey = localStorage.getItem("gcloudcafe_gemini_api_key") || "";
        geminiKeyInput.value = existingKey;
        if (existingKey && geminiStatusBadge) {
          geminiStatusBadge.textContent = "AI Key Active ✨";
          geminiStatusBadge.classList.remove("hidden");
        }
      }

      fetchGeminiApiKeyFromSupabase();
      fetchPendingCandidates();
      fetchPublishedPulses();
    }

    if (saveGeminiKeyBtn && geminiKeyInput) {
      saveGeminiKeyBtn.addEventListener("click", function () {
        var keyVal = geminiKeyInput.value.trim();
        if (keyVal) {
          localStorage.setItem("gcloudcafe_gemini_api_key", keyVal);
          cachedGeminiApiKey = keyVal;
          if (geminiStatusBadge) {
            geminiStatusBadge.textContent = "Saved & Active! ✨";
            geminiStatusBadge.classList.remove("hidden");
            setTimeout(function () { geminiStatusBadge.textContent = "AI Key Active ✨"; }, 3000);
          }
        }
      });
    }

    function lockDashboard() {
      if (dashboardContainer) dashboardContainer.classList.add("hidden");
      if (authPrompt) authPrompt.classList.remove("hidden");
    }

    function resetAdminTabStyles() {
      var inactiveClass = "px-4 py-2 rounded-xl text-xs font-bold bg-theme-light dark:bg-darkmode-theme-light text-text/80 dark:text-darkmode-text/80 hover:text-primary border border-border/60 dark:border-darkmode-border/60 cursor-pointer transition-all";
      if (tabPendingBtn) tabPendingBtn.className = inactiveClass;
      if (tabPublishedBtn) tabPublishedBtn.className = inactiveClass;
      if (tabManualBtn) tabManualBtn.className = inactiveClass;
      if (sectionPending) sectionPending.classList.add("hidden");
      if (sectionPublished) sectionPublished.classList.add("hidden");
      if (sectionManual) sectionManual.classList.add("hidden");
    }

    if (tabPendingBtn) {
      tabPendingBtn.addEventListener("click", function () {
        resetAdminTabStyles();
        tabPendingBtn.className = "px-4 py-2 rounded-xl text-xs font-extrabold bg-primary text-white border-none cursor-pointer shadow-xs transition-all";
        if (sectionPending) sectionPending.classList.remove("hidden");
        fetchPendingCandidates();
      });
    }

    if (tabPublishedBtn) {
      tabPublishedBtn.addEventListener("click", function () {
        resetAdminTabStyles();
        tabPublishedBtn.className = "px-4 py-2 rounded-xl text-xs font-extrabold bg-primary text-white border-none cursor-pointer shadow-xs transition-all";
        if (sectionPublished) sectionPublished.classList.remove("hidden");
        fetchPublishedPulses();
      });
    }

    if (tabManualBtn) {
      tabManualBtn.addEventListener("click", function () {
        resetAdminTabStyles();
        tabManualBtn.className = "px-4 py-2 rounded-xl text-xs font-extrabold bg-primary text-white border-none cursor-pointer shadow-xs transition-all";
        if (sectionManual) sectionManual.classList.remove("hidden");
      });
    }

    if (passcodeBtn && passcodeInput) {
      passcodeBtn.addEventListener("click", function () {
        var val = passcodeInput.value.trim();
        if (!val) return;

        if (passcodeStatus) {
          passcodeStatus.textContent = "Verifying passcode...";
          passcodeStatus.className = "mt-2 text-xs font-semibold text-primary";
          passcodeStatus.classList.remove("hidden");
        }

        // Fetch dynamic admin_passcode setting from Supabase public.site_settings table
        fetch(config.url + "/rest/v1/site_settings?key=eq.admin_passcode&select=value", {
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey
          }
        })
        .then(function (res) { return res.json(); })
        .then(function (settings) {
          var expectedPasscode = (Array.isArray(settings) && settings.length > 0) ? settings[0].value : "1526";
          if (val === expectedPasscode) {
            sessionStorage.setItem("pulse_admin_authed", "true");
            unlockDashboard();
          } else {
            if (passcodeStatus) {
              passcodeStatus.textContent = "Invalid passcode. Access denied.";
              passcodeStatus.className = "mt-2 text-xs font-semibold text-rose-500";
              passcodeStatus.classList.remove("hidden");
            }
          }
        })
        .catch(function () {
          if (val === "1526") {
            sessionStorage.setItem("pulse_admin_authed", "true");
            unlockDashboard();
          } else if (passcodeStatus) {
            passcodeStatus.textContent = "Invalid passcode. Access denied.";
            passcodeStatus.className = "mt-2 text-xs font-semibold text-rose-500";
            passcodeStatus.classList.remove("hidden");
          }
        });
      });
    }

    var pullBtn = document.getElementById("pull-scraped-articles-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", fetchPendingCandidates);
    }
    if (pullBtn) {
      pullBtn.addEventListener("click", ingestCleanedArticles);
    }

    async function fetchFeedXmlWithFallback(feedUrl) {
      var proxies = [
        function (u) { return "https://api.allorigins.win/get?url=" + encodeURIComponent(u); },
        function (u) { return "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(u); }
      ];

      for (var i = 0; i < proxies.length; i++) {
        try {
          var controller = new AbortController();
          var timeoutId = setTimeout(function () { controller.abort(); }, 4000);
          var pUrl = proxies[i](feedUrl);
          var res = await fetch(pUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            var data = await res.json().catch(function () { return null; });
            if (data && data.contents) return data.contents;
            var text = await res.text().catch(function () { return ""; });
            if (text && text.includes("<")) return text;
          }
        } catch (e) {}
      }
      return null;
    }

    async function ingestCleanedArticles() {
      if (!pullBtn) return;
      var originalHtml = pullBtn.innerHTML;
      pullBtn.disabled = true;
      pullBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Ingesting & Generating AI TL;DRs...';

      // 1. Try 1-Click Server-Side GitHub Actions Trigger (Zero CORS, 100% Reliable)
      try {
        var patToken = localStorage.getItem("gcloud_github_pat") || "";
        if (!patToken) {
          var sRes = await fetch(config.url + "/rest/v1/site_settings?key=eq.github_pat&select=value", {
            headers: { "apikey": config.anonKey, "Authorization": "Bearer " + config.anonKey }
          });
          if (sRes.ok) {
            var sRows = await sRes.json();
            if (Array.isArray(sRows) && sRows.length > 0 && sRows[0].value) {
              patToken = sRows[0].value.trim();
            }
          }
        }

        if (patToken) {
          pullBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-1.5"></i> Triggering GitHub Actions Scraper...';
          var ghRes = await fetch("https://api.github.com/repos/tharun15/gcloudcafe/actions/workflows/cloud-pulse-ingest.yml/dispatches", {
            method: "POST",
            headers: {
              "Authorization": "token " + patToken,
              "Accept": "application/vnd.github.v3+json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ ref: "main" })
          });

          if (ghRes.status === 204 || ghRes.ok) {
            pullBtn.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400 mr-1.5"></i> Cloud Scraper Running! Syncing...';
            setTimeout(fetchPendingCandidates, 4000);
            setTimeout(fetchPendingCandidates, 10000);
            setTimeout(function () {
              pullBtn.disabled = false;
              pullBtn.innerHTML = originalHtml;
              fetchPendingCandidates();
            }, 15000);
            return;
          }
        }
      } catch (e) {}

      // 2. Client-Side Fallback via Multi-Proxy
      var feeds = [
        { provider: "GCP", name: "Google Cloud Blog", url: "https://cloudblog.withgoogle.com/rss/", defaultTags: ["#GoogleCloud", "#GCP", "#CloudNews"] },
        { provider: "AWS", name: "AWS What's New", url: "https://aws.amazon.com/about-aws/whats-new/recent/feed/", defaultTags: ["#AWS", "#CloudArchitecture", "#CloudNews"] },
        { provider: "Kubernetes", name: "Kubernetes CNCF Blog", url: "https://kubernetes.io/feed.xml", defaultTags: ["#Kubernetes", "#CNCF", "#CloudNative"] },
        { provider: "OpenShift", name: "Red Hat Blog & OpenShift Releases", url: "https://www.redhat.com/en/rss/blog", defaultTags: ["#OpenShift", "#RedHat", "#DevOps"] }
      ];

      try {
        var fetchPromises = feeds.map(async function (feed) {
          var xmlData = await fetchFeedXmlWithFallback(feed.url);
          if (xmlData) {
            return parseFeedXml(xmlData, feed);
          }
          return [];
        });

        var results = await Promise.all(fetchPromises);
        var allCandidates = [];
        results.forEach(function (list) {
          if (Array.isArray(list)) allCandidates = allCandidates.concat(list);
        });

        if (allCandidates.length === 0) {
          pullBtn.disabled = false;
          pullBtn.innerHTML = '<i class="fa-solid fa-check mr-1.5"></i> Queue Up to Date';
          setTimeout(function () { pullBtn.innerHTML = originalHtml; }, 3000);
          fetchPendingCandidates();
          return;
        }

        var uniqueMap = new Map();
        allCandidates.forEach(function (c) { uniqueMap.set(c.title, c); });
        var newCandidates = Array.from(uniqueMap.values()).slice(0, 10);

        var apiKey = await fetchGeminiApiKeyFromSupabase();

        // Synthesize AI TL;DR Hook for each candidate
        for (var i = 0; i < newCandidates.length; i++) {
          var item = newCandidates[i];
          pullBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles fa-spin mr-1.5"></i> AI TL;DR (' + (i + 1) + '/' + newCandidates.length + ')...';
          try {
            var hookRes = await generateGeminiPulseHook(apiKey, item.title, item.content);
            if (hookRes && hookRes.text) {
              item.content = hookRes.text;
            }
          } catch (e) {}

          await fetch(config.url + "/rest/v1/cloud_pulses", {
            method: "POST",
            headers: {
              "apikey": config.anonKey,
              "Authorization": "Bearer " + config.anonKey,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify(item)
          }).catch(function () {});
        }

        pullBtn.disabled = false;
        pullBtn.innerHTML = '<i class="fa-solid fa-circle-check mr-1.5"></i> ' + newCandidates.length + ' AI TL;DRs Ingested!';
        setTimeout(function () { pullBtn.innerHTML = originalHtml; }, 3000);
        fetchPendingCandidates();
      } catch (err) {
        pullBtn.disabled = false;
        pullBtn.innerHTML = originalHtml;
        fetchPendingCandidates();
      }
    }


    function parseFeedXml(xmlText, feed) {
      var items = [];
      try {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlText, "text/xml");
        var nodes = xmlDoc.querySelectorAll("item, entry");

        nodes.forEach(function (node, idx) {
          if (idx >= 5) return;
          var titleNode = node.querySelector("title");
          var linkNode = node.querySelector("link");
          var summaryNode = node.querySelector("description, summary, content");

          var rawTitle = titleNode ? titleNode.textContent : "";
          var rawLink = linkNode ? (linkNode.getAttribute("href") || linkNode.textContent) : "";
          var rawSummary = summaryNode ? summaryNode.textContent : "";

          var title = cleanFeedText(rawTitle);
          var summary = cleanFeedText(rawSummary);

          if (title && summary.length >= 25 && !title.toLowerCase().includes("routine maintenance")) {
            var microContent = summary.length > 220 ? summary.substring(0, 217) + "..." : summary;
            items.push({
              title: title,
              content: microContent,
              author: "Cloud Newsroom Bot",
              link_url: rawLink || null,
              tags: feed.defaultTags,
              upvotes: 1,
              downvotes: 0,
              score: 1,
              status: "pending_approval",
              eligibility_reason: "Official " + feed.provider + " Release: Ingested & sanitized for high technical relevance."
            });
          }
        });
      } catch (e) {}
      return items;
    }

    function cleanFeedText(str) {
      if (!str) return "";
      return str.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    }

    // Check authentication state on page load
    if (sessionStorage.getItem("pulse_admin_authed") === "true") {
      unlockDashboard();
    } else {
      lockDashboard();
    }



    function updateLinkedInPreviewBox() {
      if (!editLinkedInPreview) return;
      var title = (editTitleInput ? editTitleInput.value : "").trim();
      var content = (editContentInput ? editContentInput.value : "").trim();
      var linkUrl = (editLinkInput ? editLinkInput.value : "").trim();
      var rawTags = (editTagsInput ? editTagsInput.value : "").trim();

      var previewText = formatPulseLinkedInPost(title, content, rawTags, linkUrl);
      editLinkedInPreview.textContent = previewText;

      if (editCharCount) {
        editCharCount.textContent = content.length + " chars";
      }
    }

    function openCandidateEditModal(candidate) {
      if (!editModal || !candidate) return;
      editIdInput.value = candidate.id;
      editTitleInput.value = candidate.title || "";
      editContentInput.value = candidate.content || "";
      editLinkInput.value = candidate.link_url || "";
      editTagsInput.value = Array.isArray(candidate.tags) ? candidate.tags.join(", ") : "";

      if (editOrigContent) {
        editOrigContent.textContent = candidate.content || "No original content available.";
      }
      if (editOrigLink) {
        if (candidate.link_url) {
          editOrigLink.href = candidate.link_url;
          editOrigLink.classList.remove("hidden");
        } else {
          editOrigLink.classList.add("hidden");
        }
      }

      if (editAiStatus) {
        editAiStatus.textContent = "";
        editAiStatus.className = "";
      }
      if (editModalStatus) {
        editModalStatus.textContent = "";
        editModalStatus.className = "";
      }

      updateLinkedInPreviewBox();
      editModal.classList.remove("hidden");

      // Do NOT auto-trigger AI — wait for explicit admin button click or manual edit
    }

    function closeCandidateEditModal() {
      if (editModal) editModal.classList.add("hidden");
    }

    if (editModalCloseBtn) editModalCloseBtn.addEventListener("click", closeCandidateEditModal);
    if (editModalCancelBtn) editModalCancelBtn.addEventListener("click", closeCandidateEditModal);
    if (editModal) {
      editModal.addEventListener("click", function (e) {
        if (e.target === editModal) closeCandidateEditModal();
      });
    }

    [editTitleInput, editContentInput, editLinkInput, editTagsInput].forEach(function (inp) {
      if (inp) {
        inp.addEventListener("input", updateLinkedInPreviewBox);
        inp.addEventListener("change", updateLinkedInPreviewBox);
      }
    });

    if (editCopyLinkedInBtn) {
      editCopyLinkedInBtn.addEventListener("click", function () {
        var text = editLinkedInPreview ? editLinkedInPreview.textContent : "";
        if (!text) return;
        navigator.clipboard.writeText(text).then(function () {
          editCopyLinkedInBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-500"></i> Copied!';
          setTimeout(function () {
            editCopyLinkedInBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Post Text';
          }, 2000);
        });
      });
    }

    // Modal AI Hook Generation Button
    if (editGenerateAiBtn) {
      editGenerateAiBtn.addEventListener("click", async function () {
        var origTitle = (editTitleInput ? editTitleInput.value : "").trim();
        var origCtx = (editOrigContent ? editOrigContent.textContent : "") || (editContentInput ? editContentInput.value : "");

        var originalBtnHtml = editGenerateAiBtn.innerHTML;
        editGenerateAiBtn.disabled = true;
        editGenerateAiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Generating Hook...';
        if (editAiStatus) {
          editAiStatus.textContent = "Consulting Gemini AI...";
          editAiStatus.className = "text-primary animate-pulse font-semibold";
        }

        try {
          var res = await generateGeminiPulseHook(cachedGeminiApiKey, origTitle, origCtx);
          if (editContentInput && res && res.text) {
            editContentInput.value = res.text;
          }
          updateLinkedInPreviewBox();

          if (editAiStatus) {
            if (res && res.isFallback) {
              editAiStatus.textContent = "ℹ️ " + (res.reason || "Smart summary excerpt used");
              editAiStatus.className = "text-amber-600 dark:text-amber-400 font-semibold";
            } else {
              editAiStatus.textContent = "AI Hook generated! ✨";
              editAiStatus.className = "text-emerald-500 font-semibold";
            }
          }
        } catch (err) {
          if (editContentInput && !editContentInput.value) {
            editContentInput.value = createSmartFallbackHook(origTitle, origCtx);
            updateLinkedInPreviewBox();
          }
          if (editAiStatus) {
            editAiStatus.textContent = "ℹ️ Smart summary excerpt used";
            editAiStatus.className = "text-amber-600 dark:text-amber-400 font-semibold";
          }
        } finally {
          editGenerateAiBtn.disabled = false;
          editGenerateAiBtn.innerHTML = originalBtnHtml;
        }
      });
    }

    // Modal Submit - Save & Approve Post
    if (editForm) {
      editForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var candidateId = editIdInput.value.trim();
        var title = editTitleInput.value.trim();
        var content = editContentInput.value.trim();
        var linkUrl = editLinkInput.value.trim();
        var tagsRaw = editTagsInput.value.trim();

        if (!candidateId || !title || !content) return;

        var tagsArr = tagsRaw.split(",").map(function (t) {
          var trimmed = t.trim();
          return trimmed.startsWith("#") ? trimmed : "#" + trimmed;
        }).filter(function (t) { return t.length > 1; });

        if (editModalStatus) {
          editModalStatus.textContent = "Saving and approving post...";
          editModalStatus.className = "text-xs font-semibold mr-auto text-primary animate-pulse";
        }

        var payload = {
          title: title,
          content: content,
          link_url: linkUrl || null,
          tags: tagsArr,
          status: "approved",
          eligibility_reason: "[Manual Approved] Curated and published by newsroom admin.",
          updated_at: new Date().toISOString()
        };

        fetch(config.url + "/rest/v1/cloud_pulses?id=eq." + encodeURIComponent(candidateId), {
          method: "PATCH",
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify(payload)
        })
        .then(function (res) {
          if (res.ok) {
            if (editModalStatus) {
              editModalStatus.textContent = "Published live! 🎉";
              editModalStatus.className = "text-xs font-semibold mr-auto text-emerald-500";
            }
            setTimeout(function () {
              closeCandidateEditModal();
              fetchPendingCandidates();
            }, 600);
          } else {
            if (editModalStatus) {
              editModalStatus.textContent = "Failed to update pulse.";
              editModalStatus.className = "text-xs font-semibold mr-auto text-rose-500";
            }
          }
        })
        .catch(function () {
          if (editModalStatus) {
            editModalStatus.textContent = "Network error.";
            editModalStatus.className = "text-xs font-semibold mr-auto text-rose-500";
          }
        });
      });
    }

    // Manual Form AI Polish
    if (manualFormGeminiBtn) {
      manualFormGeminiBtn.addEventListener("click", async function () {
        var form = document.querySelector("[data-pulse-admin-form]");
        if (!form) return;
        var titleInput = form.querySelector('input[name="title"]');
        var contentInput = form.querySelector('textarea[name="content"]');

        var title = titleInput ? titleInput.value.trim() : "";
        var content = contentInput ? contentInput.value.trim() : "";

        if (!title && !content) {
          alert("Please enter a headline or rough notes first to polish.");
          return;
        }

        var origHtml = manualFormGeminiBtn.innerHTML;
        manualFormGeminiBtn.disabled = true;
        manualFormGeminiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Polishing...';

        try {
          var res = await generateGeminiPulseHook(cachedGeminiApiKey, title || "Cloud Feature Update", content || title);
          if (contentInput && res && res.text) {
            contentInput.value = res.text;
          }
        } catch (err) {
          if (contentInput && !contentInput.value) {
            contentInput.value = createSmartFallbackHook(title, content);
          }
        } finally {
          manualFormGeminiBtn.disabled = false;
          manualFormGeminiBtn.innerHTML = origHtml;
        }
      });
    }

    var currentAdminFilter = "all";

    function detectCandidateProvider(c) {
      var text = ((Array.isArray(c.tags) ? c.tags.join(" ") : "") + " " + (c.title || "") + " " + (c.link_url || "")).toLowerCase();
      if (text.includes("google") || text.includes("gcp") || text.includes("bigquery") || text.includes("vertex")) {
        return { id: "gcp", name: "Google Cloud", icon: "fa-brands fa-google text-blue-500", badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
      }
      if (text.includes("aws") || text.includes("amazon") || text.includes("s3") || text.includes("ec2") || text.includes("sagemaker") || text.includes("corretto") || text.includes("workspaces")) {
        return { id: "aws", name: "AWS", icon: "fa-brands fa-aws text-amber-500", badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
      }
      if (text.includes("kubernetes") || text.includes("k8s") || text.includes("cncf")) {
        return { id: "k8s", name: "Kubernetes", icon: "fa-solid fa-dharmachakra text-indigo-500", badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" };
      }
      if (text.includes("openshift") || text.includes("redhat") || text.includes("red hat")) {
        return { id: "openshift", name: "OpenShift", icon: "fa-brands fa-redhat text-red-500", badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" };
      }
      return { id: "other", name: "Cloud Release", icon: "fa-solid fa-cloud text-primary", badgeClass: "bg-primary/10 text-primary border-primary/20" };
    }

    function formatCandidateContentToHtml(rawText) {
      var text = (rawText || "").trim();
      if (!text) return "";

      text = text
        .replace(/^&lt;p&gt;/i, "")
        .replace(/&lt;\/p&gt;$/i, "")
        .replace(/^<p>/i, "")
        .replace(/<\/p>$/i, "")
        .replace(/&lt;a[\s\S]*?&gt;/gi, "")
        .replace(/&lt;\/a&gt;/gi, "")
        .replace(/<a[\s\S]*?>/gi, "")
        .replace(/<\/a>/gi, "")
        .trim();

      var impactMatch = text.match(/(?:💡\s*(?:\*\*)?(?:Why It Matters|Engineering Impact|Impact)(?:\*\*)?:?)([\s\S]+)$/i);
      var whatChanged = "";
      var impact = "";

      if (impactMatch) {
        impact = impactMatch[1].trim();
        var beforeImpact = text.substring(0, impactMatch.index).trim();
        var whatChangedMatch = beforeImpact.match(/(?:🎯\s*(?:\*\*)?What Changed(?:\*\*)?:?)([\s\S]+)$/i);
        if (whatChangedMatch) {
          whatChanged = whatChangedMatch[1].trim();
        } else {
          whatChanged = beforeImpact.replace(/^🎯\s*/, "").trim();
        }
      } else {
        var whatChangedMatch = text.match(/(?:🎯\s*(?:\*\*)?What Changed(?:\*\*)?:?)([\s\S]+)$/i);
        if (whatChangedMatch) {
          whatChanged = whatChangedMatch[1].trim();
        } else {
          whatChanged = text;
        }
      }

      var out = '<div class="space-y-3 mb-3">';
      if (whatChanged) {
        out += '<div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">' +
                 '<div class="flex items-center gap-1.5 mb-1.5">' +
                   '<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">' +
                     '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>' +
                     '<span>What Changed</span>' +
                   '</span>' +
                 '</div>' +
                 '<p class="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal mb-0">' +
                   escapeHtml(whatChanged) +
                 '</p>' +
               '</div>';
      }
      if (impact) {
        out += '<div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">' +
                 '<div class="flex items-center gap-1.5 mb-1.5">' +
                   '<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">' +
                     '<i class="fa-regular fa-lightbulb text-[10px] text-amber-500"></i>' +
                     '<span>Why It Matters</span>' +
                   '</span>' +
                 '</div>' +
                 '<p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal mb-0">' +
                   escapeHtml(impact) +
                 '</p>' +
               '</div>';
      }
      if (!whatChanged && !impact) {
        out += '<div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed">' + escapeHtml(text) + '</div>';
      }
      out += '</div>';
      return out;
    }

    function renderCandidateCards(candidatesToRender) {
      if (!pendingGrid) return;
      if (!Array.isArray(candidatesToRender) || candidatesToRender.length === 0) {
        var msg = currentAdminFilter === "all" 
          ? "All candidate posts reviewed! No pending approvals in queue."
          : "No pending candidate posts found for this cloud ecosystem.";
        pendingGrid.innerHTML = '<div class="col-span-full text-center py-12 bg-body dark:bg-darkmode-body border border-border/80 rounded-3xl text-xs text-text/90 dark:text-darkmode-text/90 font-semibold"><i class="fa-solid fa-circle-check text-emerald-500 text-xl block mb-2"></i>' + escapeHtml(msg) + '</div>';
        return;
      }

      var html = "";
      candidatesToRender.forEach(function (c) {
        var prov = detectCandidateProvider(c);
        var tagsHtml = "";
        if (Array.isArray(c.tags)) {
          c.tags.forEach(function (tag) {
            tagsHtml += '<span class="text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md">' + escapeHtml(tag) + '</span> ';
          });
        }

        var formattedContentHtml = formatCandidateContentToHtml(c.content);

        var linkHtml = "";
        if (c.link_url) {
          linkHtml = '<div class="mb-3"><a href="' + escapeHtml(c.link_url) + '" target="_blank" rel="noopener noreferrer" class="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1.5"><i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> View Official Source</a></div>';
        }

        var reasonHtml = c.eligibility_reason ? '<div class="mb-3.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl p-2.5 text-xs text-amber-800 dark:text-amber-300 font-medium"><i class="fa-solid fa-lightbulb text-amber-500 mr-1.5"></i> <strong>Grounding Reason:</strong> ' + escapeHtml(c.eligibility_reason) + '</div>' : '';

        html += '<div class="bg-body dark:bg-darkmode-body border border-border/80 dark:border-darkmode-border/80 hover:border-primary/40 rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all" data-candidate-id="' + c.id + '">' +
          '<div>' +
            '<div class="flex items-center justify-between gap-2 mb-3">' +
              '<div class="flex items-center gap-2">' +
                '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ' + prov.badgeClass + '">' +
                  '<i class="' + prov.icon + '"></i> ' + escapeHtml(prov.name) +
                '</span>' +
                '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">PENDING REVIEW</span>' +
              '</div>' +
              '<span class="text-[10px] font-medium text-text/60 dark:text-darkmode-text/60 flex items-center gap-1">' +
                '<i class="fa-regular fa-clock text-[9px]"></i> ' + formatDate(c.created_at) +
              '</span>' +
            '</div>' +
            '<h4 class="text-base sm:text-lg font-bold text-dark dark:text-darkmode-dark mb-2.5 leading-snug">' + escapeHtml(c.title) + '</h4>' +
            formattedContentHtml +
            linkHtml +
            reasonHtml +
            '<div class="flex flex-wrap gap-1 mb-4">' + tagsHtml + '</div>' +
          '</div>' +

          '<div class="pt-3.5 border-t border-border/40 dark:border-darkmode-border/40 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap shrink-0">' +
            '<button data-action-reject="' + c.id + '" class="px-3 py-2 rounded-xl text-xs font-bold transition-all border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer inline-flex items-center gap-1.5">' +
              '<i class="fa-solid fa-trash-can text-[11px]"></i> Reject' +
            '</button>' +
            '<div class="flex items-center gap-2">' +
              '<button data-action-edit="' + c.id + '" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer inline-flex items-center gap-1.5">' +
                '<i class="fa-solid fa-pen-nib text-[11px]"></i> Refine TL;DR' +
              '</button>' +
              '<button data-action-approve="' + c.id + '" class="px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all border-none cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5">' +
                '<i class="fa-solid fa-check"></i> Quick Approve' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      });

      pendingGrid.innerHTML = html;
      bindCandidateActions();
    }

    function updateAdminFilterCounts() {
      var counts = { all: cachedCandidates.length, gcp: 0, aws: 0, k8s: 0, openshift: 0 };
      cachedCandidates.forEach(function (c) {
        var prov = detectCandidateProvider(c);
        if (counts[prov.id] !== undefined) counts[prov.id]++;
      });

      var elAll = document.getElementById("filter-count-all");
      if (elAll) elAll.textContent = String(counts.all);
      var elGcp = document.getElementById("filter-count-gcp");
      if (elGcp) elGcp.textContent = String(counts.gcp);
      var elAws = document.getElementById("filter-count-aws");
      if (elAws) elAws.textContent = String(counts.aws);
      var elK8s = document.getElementById("filter-count-k8s");
      if (elK8s) elK8s.textContent = String(counts.k8s);
      var elOs = document.getElementById("filter-count-openshift");
      if (elOs) elOs.textContent = String(counts.openshift);
    }

    function applyAdminFilter() {
      if (currentAdminFilter === "all") {
        renderCandidateCards(cachedCandidates);
      } else {
        var filtered = cachedCandidates.filter(function (c) {
          return detectCandidateProvider(c).id === currentAdminFilter;
        });
        renderCandidateCards(filtered);
      }
    }

    function initAdminFilterPills() {
      var filterContainer = document.getElementById("admin-provider-filters");
      if (!filterContainer) return;

      filterContainer.querySelectorAll("[data-admin-filter]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          var filter = this.getAttribute("data-admin-filter") || "all";
          currentAdminFilter = filter;

          filterContainer.querySelectorAll("[data-admin-filter]").forEach(function (b) {
            b.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-theme-light dark:bg-darkmode-theme-light text-text/80 dark:text-darkmode-text/80 hover:text-primary border border-border/70 dark:border-darkmode-border/70 cursor-pointer whitespace-nowrap";
          });
          this.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-primary text-white shadow-xs cursor-pointer border-none whitespace-nowrap";

          applyAdminFilter();
        });
      });
    }

    function fetchPendingCandidates() {
      if (!pendingGrid) return;
      pendingGrid.innerHTML = '<div class="col-span-full text-center py-12 text-xs font-semibold text-text/90 dark:text-darkmode-text/90"><i class="fa-solid fa-spinner fa-spin text-lg text-primary block mb-2"></i>Loading candidate approval queue...</div>';

      fetch(config.url + "/rest/v1/cloud_pulses?status=eq.pending_approval&order=created_at.desc", {
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey
        }
      })
      .then(function (res) { return res.json(); })
      .then(function (candidates) {
        if (!Array.isArray(candidates) || candidates.length === 0) {
          cachedCandidates = [];
          pendingGrid.innerHTML = '<div class="col-span-full text-center py-12 bg-body dark:bg-darkmode-body border border-border/80 rounded-3xl text-xs text-text/90 dark:text-darkmode-text/90 font-semibold"><i class="fa-solid fa-circle-check text-emerald-500 text-xl block mb-2"></i>All candidate posts reviewed! No pending approvals in queue.</div>';
          if (pendingCountBadge) pendingCountBadge.textContent = "0";
          updateAdminFilterCounts();
          return;
        }

        cachedCandidates = candidates;
        if (pendingCountBadge) pendingCountBadge.textContent = String(candidates.length);
        updateAdminFilterCounts();
        applyAdminFilter();
      })
      .catch(function (err) {
        console.error("Error fetching candidates:", err);
        pendingGrid.innerHTML = '<div class="col-span-full text-center py-12 text-xs font-semibold text-rose-500">Failed to load candidate approval queue.</div>';
      });
    }

    function bindCandidateActions() {
      pendingGrid.querySelectorAll("[data-action-edit]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          var id = (this.getAttribute("data-action-edit") || "").trim();
          var candidate = cachedCandidates.find(function (c) { return String(c.id) === id; });
          if (candidate) {
            openCandidateEditModal(candidate);
          }
        });
      });

      pendingGrid.querySelectorAll("[data-action-approve]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          var targetBtn = e.currentTarget || this;
          var id = targetBtn.getAttribute("data-action-approve");
          if (id) updatePulseStatus(id.trim(), "approved");
        });
      });

      pendingGrid.querySelectorAll("[data-action-reject]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          var targetBtn = e.currentTarget || this;
          var id = targetBtn.getAttribute("data-action-reject");
          if (id) updatePulseStatus(id.trim(), "rejected");
        });
      });
    }

    function updatePulseStatus(id, newStatus) {
      var card = pendingGrid.querySelector('[data-candidate-id="' + id + '"]');
      if (card) {
        card.style.opacity = "0.4";
        card.style.pointerEvents = "none";
      }

      var patchBody = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === "approved") {
        patchBody.eligibility_reason = "[Manual Approved] Verified and published by newsroom admin.";
      }

      fetch(config.url + "/rest/v1/cloud_pulses?id=eq." + encodeURIComponent(id.trim()), {
        method: "PATCH",
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(patchBody)
      })
      .then(function (res) {
        if (res.ok) {
          setTimeout(fetchPendingCandidates, 400);
        }
      });
    }

    function fetchPublishedPulses() {
      if (!publishedGrid) return;
      publishedGrid.innerHTML = '<div class="col-span-full text-center py-12 text-xs font-semibold text-text/90 dark:text-darkmode-text/90"><i class="fa-solid fa-spinner fa-spin text-lg text-primary block mb-2"></i>Loading live published posts...</div>';

      fetch(config.url + "/rest/v1/cloud_pulses?status=eq.approved&order=created_at.desc&limit=100", {
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey
        }
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!Array.isArray(data)) data = [];
        cachedPublishedPulses = data;
        if (publishedCountBadge) publishedCountBadge.textContent = String(data.length);
        updateAdminPublishedFilterCounts();
        applyAdminPublishedFilter();
      })
      .catch(function(err) {
        console.error("Error fetching published pulses:", err);
        if (publishedGrid) publishedGrid.innerHTML = '<div class="col-span-full text-center py-12 text-xs font-semibold text-rose-500">Failed to load published posts.</div>';
      });
    }

    function renderPublishedCards(itemsToRender) {
      if (!publishedGrid) return;
      if (!Array.isArray(itemsToRender) || itemsToRender.length === 0) {
        var msg = currentAdminPublishedFilter === "all"
          ? "No published micro-posts found on the live site."
          : "No published micro-posts found for this cloud ecosystem.";
        publishedGrid.innerHTML = '<div class="col-span-full text-center py-12 bg-body dark:bg-darkmode-body border border-border/80 rounded-3xl text-xs text-text/90 dark:text-darkmode-text/90 font-semibold"><i class="fa-solid fa-circle-check text-emerald-500 text-xl block mb-2"></i>' + escapeHtml(msg) + '</div>';
        return;
      }

      var html = "";
      itemsToRender.forEach(function(p) {
        var prov = detectCandidateProvider(p);
        var isManual = isManualApprovedPulse(p);

        var statusBadge = isManual
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider inline-flex items-center gap-1"><i class="fa-solid fa-user-check"></i> Manual Curation</span>'
          : '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wider inline-flex items-center gap-1"><i class="fa-solid fa-robot"></i> Auto-Published (12h)</span>';

        var tagsHtml = "";
        if (Array.isArray(p.tags)) {
          p.tags.forEach(function(t) {
            tagsHtml += '<span class="text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md">' + escapeHtml(t) + '</span> ';
          });
        }

        var linkHtml = "";
        if (p.link_url) {
          linkHtml = '<div class="mb-3"><a href="' + escapeHtml(p.link_url) + '" target="_blank" rel="noopener noreferrer" class="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1.5"><i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> View Official Source</a></div>';
        }

        var scoreHtml = '<span class="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Score: ' + (p.score || 0) + ' (+' + (p.upvotes || 0) + '/-' + (p.downvotes || 0) + ')</span>';

        html += '<div class="bg-body dark:bg-darkmode-body border border-border/80 dark:border-darkmode-border/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all" data-published-id="' + p.id + '">' +
          '<div>' +
            '<div class="flex items-center justify-between gap-2 mb-3 flex-wrap">' +
              '<div class="flex items-center gap-2">' +
                '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ' + prov.badgeClass + '">' +
                  '<i class="' + prov.icon + '"></i> ' + escapeHtml(prov.name) +
                '</span>' +
                statusBadge +
              '</div>' +
              '<div class="flex items-center gap-2">' +
                scoreHtml +
                '<span class="text-[10px] font-medium text-text/60 dark:text-darkmode-text/60 flex items-center gap-1">' +
                  '<i class="fa-regular fa-clock text-[9px]"></i> ' + formatDate(p.created_at) +
                '</span>' +
              '</div>' +
            '</div>' +
            '<h4 class="text-base sm:text-lg font-bold text-dark dark:text-darkmode-dark mb-2.5 leading-snug">' + escapeHtml(p.title) + '</h4>' +
            formatCandidateContentToHtml(p.content) +
            linkHtml +
            '<div class="flex flex-wrap gap-1 mb-4">' + tagsHtml + '</div>' +
          '</div>' +

          '<div class="pt-3.5 border-t border-border/40 dark:border-darkmode-border/40 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap shrink-0">' +
            '<button data-action-unpublish="' + p.id + '" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer inline-flex items-center gap-1.5">' +
              '<i class="fa-solid fa-eye-slash text-[11px]"></i> Unpublish' +
            '</button>' +
            '<a href="/pulse/#pulse-' + p.id + '" target="_blank" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-theme-light dark:bg-darkmode-theme-light text-text/80 dark:text-darkmode-text/80 hover:text-primary border border-border/70 dark:border-darkmode-border/70 cursor-pointer inline-flex items-center gap-1.5 no-underline">' +
              '<i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> View on Live Site' +
            '</a>' +
          '</div>' +
        '</div>';
      });

      publishedGrid.innerHTML = html;
      bindPublishedActions();
    }

    function bindPublishedActions() {
      if (!publishedGrid) return;
      publishedGrid.querySelectorAll("[data-action-unpublish]").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
          e.preventDefault();
          var id = this.getAttribute("data-action-unpublish");
          if (!id) return;
          var confirmMsg = "Are you sure you want to unpublish this micro-post?\n\nIt will be immediately retracted from the live Cloud Pulse feed.";
          if (!window.confirm(confirmMsg)) return;
          unpublishPulse(id.trim());
        });
      });
    }

    function unpublishPulse(id) {
      var card = publishedGrid ? publishedGrid.querySelector('[data-published-id="' + id + '"]') : null;
      if (card) {
        card.style.opacity = "0.35";
        card.style.pointerEvents = "none";
      }

      fetch(config.url + "/rest/v1/cloud_pulses?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          status: "rejected",
          updated_at: new Date().toISOString()
        })
      })
      .then(function(res) {
        if (res.ok) {
          fetchPublishedPulses();
          fetchPendingCandidates();
        } else {
          alert("Could not unpublish micro-post. Please try again.");
          if (card) {
            card.style.opacity = "1";
            card.style.pointerEvents = "auto";
          }
        }
      })
      .catch(function(err) {
        console.error("Error unpublishing pulse:", err);
        alert("Network error unpublishing pulse.");
        if (card) {
          card.style.opacity = "1";
          card.style.pointerEvents = "auto";
        }
      });
    }

    function updateAdminPublishedFilterCounts() {
      var counts = { all: cachedPublishedPulses.length, gcp: 0, aws: 0, k8s: 0, openshift: 0 };
      cachedPublishedPulses.forEach(function(c) {
        var prov = detectCandidateProvider(c);
        if (counts[prov.id] !== undefined) counts[prov.id]++;
      });

      var elAll = document.getElementById("pub-filter-count-all");
      if (elAll) elAll.textContent = String(counts.all);
      var elGcp = document.getElementById("pub-filter-count-gcp");
      if (elGcp) elGcp.textContent = String(counts.gcp);
      var elAws = document.getElementById("pub-filter-count-aws");
      if (elAws) elAws.textContent = String(counts.aws);
      var elK8s = document.getElementById("pub-filter-count-k8s");
      if (elK8s) elK8s.textContent = String(counts.k8s);
      var elOs = document.getElementById("pub-filter-count-openshift");
      if (elOs) elOs.textContent = String(counts.openshift);
    }

    function applyAdminPublishedFilter() {
      if (currentAdminPublishedFilter === "all") {
        renderPublishedCards(cachedPublishedPulses);
      } else {
        var filtered = cachedPublishedPulses.filter(function(c) {
          return detectCandidateProvider(c).id === currentAdminPublishedFilter;
        });
        renderPublishedCards(filtered);
      }
    }

    function initAdminPublishedFilterPills() {
      var filterContainer = document.getElementById("admin-published-provider-filters");
      if (!filterContainer) return;

      filterContainer.querySelectorAll("[data-admin-published-filter]").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
          e.preventDefault();
          var filter = this.getAttribute("data-admin-published-filter") || "all";
          currentAdminPublishedFilter = filter;

          filterContainer.querySelectorAll("[data-admin-published-filter]").forEach(function(b) {
            b.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-theme-light dark:bg-darkmode-theme-light text-text/80 dark:text-darkmode-text/80 hover:text-primary border border-border/70 dark:border-darkmode-border/70 cursor-pointer whitespace-nowrap";
          });
          this.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-primary text-white shadow-xs cursor-pointer border-none whitespace-nowrap";

          applyAdminPublishedFilter();
        });
      });
    }

    if (refreshPublishedBtn) {
      refreshPublishedBtn.addEventListener("click", fetchPublishedPulses);
    }

    if (triggerAutoPublishBtn) {
      triggerAutoPublishBtn.addEventListener("click", async function() {
        var origHtml = triggerAutoPublishBtn.innerHTML;
        triggerAutoPublishBtn.disabled = true;
        triggerAutoPublishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-[11px] mr-1"></i> Checking Inactivity...';

        try {
          var res = await fetch(config.url + "/rest/v1/cloud_pulses?status=eq.approved&order=created_at.desc&limit=25", {
            headers: { "apikey": config.anonKey, "Authorization": "Bearer " + config.anonKey }
          });
          var approved = await res.json();
          var latestManual = 0;
          if (Array.isArray(approved)) {
            approved.forEach(function(p) {
              if (isManualApprovedPulse(p)) {
                var t = new Date(p.updated_at || p.created_at).getTime();
                if (t > latestManual) latestManual = t;
              }
            });
          }
          var elapsedHours = latestManual ? ((Date.now() - latestManual) / (1000 * 60 * 60)) : Infinity;
          if (elapsedHours < 12) {
            alert("12-Hour Watchdog Status:\n\nAdmin manually approved a post " + elapsedHours.toFixed(1) + " hours ago. The 12-hour fallback auto-publisher will only trigger after 12h of inactivity (" + (12 - elapsedHours).toFixed(1) + "h remaining).");
          } else {
            var doPublish = confirm("12-Hour Watchdog Triggered:\n\nNo admin approvals in the last " + (elapsedHours === Infinity ? "12+" : elapsedHours.toFixed(1)) + " hours.\n\nDo you want to run the auto-publisher now to promote the freshest candidate?");
            if (doPublish) {
              triggerAutoPublishBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles fa-spin text-[11px] mr-1"></i> Auto-Publishing...';
              var pRes = await fetch(config.url + "/rest/v1/cloud_pulses?status=eq.pending_approval&order=created_at.desc&limit=1", {
                headers: { "apikey": config.anonKey, "Authorization": "Bearer " + config.anonKey }
              });
              var pData = await pRes.json();
              if (Array.isArray(pData) && pData.length > 0) {
                var topCand = pData[0];
                var updRes = await fetch(config.url + "/rest/v1/cloud_pulses?id=eq." + encodeURIComponent(topCand.id), {
                  method: "PATCH",
                  headers: { "apikey": config.anonKey, "Authorization": "Bearer " + config.anonKey, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    status: "approved",
                    eligibility_reason: "[Auto-Published] Published automatically after 12h without manual admin curation.",
                    updated_at: new Date().toISOString()
                  })
                });
                if (updRes.ok) {
                  alert("Auto-published candidate:\n\n\"" + topCand.title + "\" is now live!");
                  fetchPublishedPulses();
                  fetchPendingCandidates();
                } else {
                  alert("Failed to auto-publish candidate.");
                }
              } else {
                alert("No pending candidates available in the approval queue.");
              }
            }
          }
        } catch(e) {
          alert("Watchdog check error: " + e.message);
        } finally {
          triggerAutoPublishBtn.disabled = false;
          triggerAutoPublishBtn.innerHTML = origHtml;
        }
      });
    }

    // Initial setup & fetch
    initAdminFilterPills();
    initAdminPublishedFilterPills();
    fetchPendingCandidates();
  }

  function getCurrentQuarterInfo(nowDate) {
    var now = nowDate || new Date();
    var year = now.getFullYear();
    var month = now.getMonth();

    var quarterNum = Math.floor(month / 3) + 1;
    var quarterLabel = "Q" + quarterNum + " " + year;
    var quarterKey = "Q" + quarterNum + "_" + year;

    var nextQuarterMonth = quarterNum * 3;
    var resetYear = nextQuarterMonth === 12 ? year + 1 : year;
    var resetMonth = nextQuarterMonth === 12 ? 0 : nextQuarterMonth;

    var resetDate = new Date(resetYear, resetMonth, 1, 0, 0, 0);

    var prevQuarterNum = quarterNum === 1 ? 4 : quarterNum - 1;
    var prevQuarterYear = quarterNum === 1 ? year - 1 : year;
    var prevQuarterLabel = "Q" + prevQuarterNum + " " + prevQuarterYear;

    var diffMs = resetDate.getTime() - now.getTime();
    var daysLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    var hoursLeft = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var resetFormattedStr = monthNames[resetMonth] + " 1, " + resetYear;

    return {
      quarterNum: quarterNum,
      year: year,
      quarterLabel: quarterLabel,
      quarterKey: quarterKey,
      prevQuarterLabel: prevQuarterLabel,
      resetDate: resetDate,
      daysLeft: daysLeft,
      hoursLeft: hoursLeft,
      resetFormattedStr: resetFormattedStr
    };
  }

  /* ── Forever Cloud Provider Poll & Community Benchmark ── */
  function initCloudProviderPollSystem() {
    var container = document.querySelector("[data-cloud-poll-container]");
    if (!container) return;

    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    var qInfo = getCurrentQuarterInfo();

    // Update Header Labels & Badges
    document.querySelectorAll("[data-poll-quarter-label]").forEach(function (el) { el.textContent = qInfo.quarterLabel; });
    document.querySelectorAll("[data-poll-quarter-name]").forEach(function (el) { el.textContent = qInfo.quarterLabel; });

    var resetBadge = document.querySelector("[data-poll-reset-badge]");
    if (resetBadge) {
      resetBadge.innerHTML = '<i class="fa-solid fa-hourglass-half text-sky-500"></i> Resets in ' + qInfo.daysLeft + 'd ' + qInfo.hoursLeft + 'h (' + qInfo.resetFormattedStr + ')';
    }

    var championBadge = document.querySelector("[data-poll-champion-badge]");
    if (championBadge) {
      championBadge.classList.remove("hidden");
      championBadge.innerHTML = '<i class="fa-solid fa-trophy text-amber-500"></i> ' + qInfo.quarterLabel + ' Live Competition — Be the first to vote!';
    }

    var pollData = [
      { provider: "GCP", votes: 0, today_votes: 0 },
      { provider: "AWS", votes: 0, today_votes: 0 },
      { provider: "AZURE", votes: 0, today_votes: 0 },
      { provider: "OTHERS", votes: 0, today_votes: 0 }
    ];

    function fetchPollData() {
      fetch(config.url + "/rest/v1/cloud_provider_polls?provider=in.(GCP,AWS,AZURE,OTHERS)&select=*", {
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey,
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (Array.isArray(data) && data.length > 0) {
          pollData = data.filter(function (r) {
            return ["GCP", "AWS", "AZURE", "OTHERS"].indexOf(r.provider) !== -1;
          });
        }
        renderPollUI();
      })
      .catch(function () {
        renderPollUI();
      });
    }

    function renderPollUI() {
      var totalVotes = pollData.reduce(function (acc, row) { return acc + (row.votes || 0); }, 0);
      var userVotedProvider = localStorage.getItem("gcloudcafe_voted_provider_" + qInfo.quarterKey);

      var todayLeader = pollData.slice().sort(function (a, b) { return (b.today_votes || 0) - (a.today_votes || 0); })[0];
      var quarterLeader = pollData.slice().sort(function (a, b) { return (b.votes || 0) - (a.votes || 0); })[0];

      pollData.forEach(function (row) {
        var provider = row.provider;
        var votes = row.votes || 0;
        var percent = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0.0";

        var percentElem = container.querySelector('[data-provider-percent="' + provider + '"]');
        var barElem = container.querySelector('[data-provider-bar="' + provider + '"]');
        var votesElem = container.querySelector('[data-provider-votes="' + provider + '"]');
        var btnElem = container.querySelector('[data-poll-vote="' + provider + '"]');

        if (percentElem) percentElem.textContent = percent + "%";
        if (barElem) barElem.style.width = percent + "%";
        if (votesElem) votesElem.textContent = votes + " votes (" + percent + "%)";

        if (btnElem) {
          if (userVotedProvider === provider) {
            btnElem.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i> Voted';
            btnElem.className = "px-2.5 py-1 rounded font-mono text-[11px] font-bold border-none bg-emerald-600 text-white shadow-xs cursor-default";
            btnElem.disabled = true;
          } else if (userVotedProvider) {
            btnElem.innerHTML = '<i class="fa-solid fa-thumbs-up mr-1"></i> Vote';
            btnElem.className = "px-2.5 py-1 rounded font-mono text-[11px] font-bold border-none bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed";
            btnElem.disabled = true;
          }
        }
      });

      // Update Trend Insight Badge
      var trendBadge = document.querySelector("[data-poll-trend-badge]");
      if (trendBadge) {
        if (totalVotes === 0) {
          trendBadge.innerHTML = '<i class="fa-solid fa-fire text-amber-500 animate-pulse"></i> <strong>TODAY\'S TREND:</strong> No votes cast yet for ' + qInfo.quarterLabel + '. Be the first to vote!';
        } else if (todayLeader && quarterLeader) {
          var qPercent = ((quarterLeader.votes || 0) / totalVotes * 100).toFixed(1);
          trendBadge.innerHTML = '<i class="fa-solid fa-fire text-amber-500 animate-pulse"></i> <strong>TODAY\'S TREND:</strong> ' + todayLeader.provider + ' leads ' + qInfo.quarterLabel + ' today (+' + (todayLeader.today_votes || 0) + ' votes) &nbsp;|&nbsp; 🏆 <strong>CURRENT ' + qInfo.quarterLabel + ' LEADER:</strong> ' + quarterLeader.provider + ' (' + qPercent + '%)';
        }
      }

      bindPollEvents();
    }

    function bindPollEvents() {
      container.querySelectorAll("[data-poll-vote]").forEach(function (btn) {
        if (btn.getAttribute("data-poll-bound") === "true") return;
        btn.setAttribute("data-poll-bound", "true");

        btn.addEventListener("click", function (e) {
          e.preventDefault();
          var provider = this.getAttribute("data-poll-vote");
          castProviderVote(provider);
        });
      });
    }

    function castProviderVote(provider) {
      var userVotedProvider = localStorage.getItem("gcloudcafe_voted_provider_" + qInfo.quarterKey);
      if (userVotedProvider) return; // Deduplicated per quarter

      localStorage.setItem("gcloudcafe_voted_provider_" + qInfo.quarterKey, provider);

      var row = pollData.find(function (r) { return r.provider === provider; });
      var newVotes = row ? (row.votes || 0) + 1 : 1;
      var newToday = row ? (row.today_votes || 0) + 1 : 1;

      if (row) {
        row.votes = newVotes;
        row.today_votes = newToday;
      }

      renderPollUI();

      // Sync atomic update to Supabase by provider name
      fetch(config.url + "/rest/v1/cloud_provider_polls?provider=eq." + provider, {
        method: "PATCH",
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({ votes: newVotes, today_votes: newToday, updated_at: new Date().toISOString() })
      })
      .then(function () {
        setTimeout(fetchPollData, 500);
      })
      .catch(function (err) {
        console.error("Poll vote sync error:", err);
      });
    }

    renderPollUI();
    fetchPollData();
    setInterval(function () {
      if (document.hidden) return;
      fetchPollData();
    }, 30000);
  }

  /* ── 12. Article Admin Studio & Markdown Publisher System ── */
  function initArticleAdminSystem() {
    var dashboardContainer = document.getElementById("article-dashboard-container");
    var authPrompt = document.getElementById("admin-auth-prompt");
    var passcodeBtn = document.getElementById("admin-login-btn");
    var passcodeInput = document.getElementById("admin-passcode-input");
    var passcodeStatus = document.getElementById("admin-passcode-status");

    var titleInput = document.getElementById("article-title-input");
    var categorySelect = document.getElementById("article-category-select");
    var draftSelect = document.getElementById("article-draft-select");
    var draftStatusPill = document.getElementById("draft-status-pill");
    var tagsInput = document.getElementById("article-tags-input");
    var authorInput = document.getElementById("article-author-input");
    var descInput = document.getElementById("article-desc-input");
    var imageUrlInput = document.getElementById("article-image-url-input");
    var markdownInput = document.getElementById("article-markdown-input");
    var livePreview = document.getElementById("article-live-preview");


    var wordCountElem = document.getElementById("article-word-count");
    var readTimeElem = document.getElementById("article-read-time");

    var imgPreviewEmpty = document.getElementById("article-image-preview-empty");
    var imgPreviewImg = document.getElementById("article-image-preview-img");

    var btnCopyMd = document.getElementById("btn-copy-md");
    var btnExportMd = document.getElementById("btn-export-md");
    var btnPublishSupabase = document.getElementById("btn-publish-supabase");

    if (!dashboardContainer && !authPrompt) return;

    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    function unlockDashboard() {
      if (dashboardContainer) dashboardContainer.classList.remove("hidden");
      if (authPrompt) authPrompt.classList.add("hidden");
      if (passcodeStatus) passcodeStatus.classList.add("hidden");
      updateLivePreview();
    }

    function lockDashboard() {
      if (dashboardContainer) dashboardContainer.classList.add("hidden");
      if (authPrompt) authPrompt.classList.remove("hidden");
    }

    if (passcodeBtn && passcodeInput) {
      passcodeBtn.addEventListener("click", function () {
        var val = passcodeInput.value.trim();
        if (!val) return;

        if (passcodeStatus) {
          passcodeStatus.textContent = "Verifying passcode...";
          passcodeStatus.className = "mt-2 text-xs font-semibold text-primary";
          passcodeStatus.classList.remove("hidden");
        }

        fetch(config.url + "/rest/v1/site_settings?key=eq.admin_passcode&select=value", {
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey
          }
        })
        .then(function (res) { return res.json(); })
        .then(function (settings) {
          var expectedPasscode = (Array.isArray(settings) && settings.length > 0) ? settings[0].value : "1526";
          if (val === expectedPasscode) {
            sessionStorage.setItem("pulse_admin_authed", "true");
            unlockDashboard();
          } else {
            if (passcodeStatus) {
              passcodeStatus.textContent = "Invalid passcode. Access denied.";
              passcodeStatus.className = "mt-2 text-xs font-semibold text-rose-500";
              passcodeStatus.classList.remove("hidden");
            }
          }
        })
        .catch(function () {
          if (val === "1526") {
            sessionStorage.setItem("pulse_admin_authed", "true");
            unlockDashboard();
          } else if (passcodeStatus) {
            passcodeStatus.textContent = "Invalid passcode. Access denied.";
            passcodeStatus.className = "mt-2 text-xs font-semibold text-rose-500";
            passcodeStatus.classList.remove("hidden");
          }
        });
      });
    }

    if (sessionStorage.getItem("pulse_admin_authed") === "true") {
      unlockDashboard();
    } else {
      lockDashboard();
    }


    var seriesInput = document.getElementById("article-series-input");
    var seriesOrderInput = document.getElementById("article-series-order-input");

    var inputs = [titleInput, categorySelect, draftSelect, tagsInput, authorInput, descInput, imageUrlInput, seriesInput, seriesOrderInput, markdownInput];
    inputs.forEach(function (inp) {
      if (inp) {
        inp.addEventListener("input", updateLivePreview);
        inp.addEventListener("change", updateLivePreview);
      }
    });


    var toolbarButtons = document.querySelectorAll("[data-format]");
    toolbarButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var fmt = btn.getAttribute("data-format");
        applyFormatting(fmt);
      });
    });

    function applyFormatting(fmt) {
      if (!markdownInput) return;
      var start = markdownInput.selectionStart;
      var end = markdownInput.selectionEnd;
      var text = markdownInput.value;
      var selected = text.substring(start, end);

      var replacement = "";
      switch (fmt) {
        case "bold": replacement = "**" + (selected || "bold text") + "**"; break;
        case "italic": replacement = "*" + (selected || "italic text") + "*"; break;
        case "h2": replacement = "\n## " + (selected || "Heading 2") + "\n"; break;
        case "h3": replacement = "\n### " + (selected || "Heading 3") + "\n"; break;
        case "quote": replacement = "\n> " + (selected || "Quote text") + "\n"; break;
        case "code": replacement = "\n```bash\n" + (selected || "echo 'Hello World'") + "\n```\n"; break;
        case "list": replacement = "\n- " + (selected || "List item 1") + "\n- List item 2\n"; break;
        case "callout": replacement = "\n> [!NOTE]\n> " + (selected || "Important technical note here.") + "\n"; break;
        case "link": replacement = "[" + (selected || "Link Text") + "](https://cloud.google.com)"; break;
        case "image": replacement = "![" + (selected || "Image Alt") + "](/images/posts/default-banner.webp)"; break;
      }

      markdownInput.value = text.substring(0, start) + replacement + text.substring(end);
      markdownInput.focus();
      markdownInput.selectionStart = start + replacement.length;
      markdownInput.selectionEnd = start + replacement.length;
      updateLivePreview();
    }

    function updateLivePreview() {
      if (!livePreview) return;
      var title = titleInput ? titleInput.value.trim() : "";
      var category = categorySelect ? categorySelect.value : "Google Cloud";
      var isDraft = (draftSelect ? draftSelect.value === "true" : false);
      var author = authorInput ? authorInput.value.trim() : "Tharun Vempati";
      var desc = descInput ? descInput.value.trim() : "";
      var imageUrl = imageUrlInput ? imageUrlInput.value.trim() : "";
      var seriesName = seriesInput ? seriesInput.value.trim() : "";
      var seriesOrder = seriesOrderInput ? (parseInt(seriesOrderInput.value, 10) || 1) : 1;
      var rawMd = markdownInput ? markdownInput.value : "";

      if (draftStatusPill) {
        if (isDraft) {
          draftStatusPill.textContent = "Draft";
          draftStatusPill.className = "text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30";
        } else {
          draftStatusPill.textContent = "Live";
          draftStatusPill.className = "text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30";
        }
      }

      var btnPublishGithub = document.getElementById("btn-publish-github");
      if (btnPublishGithub && !btnPublishGithub.disabled) {
        if (isDraft) {
          btnPublishGithub.innerHTML = '<i class="fa-brands fa-github text-sm"></i> Push Draft to GitHub';
        } else {
          btnPublishGithub.innerHTML = '<i class="fa-brands fa-github text-sm"></i> Publish Live to GitHub';
        }
      }

      if (imgPreviewImg && imgPreviewEmpty) {
        if (imageUrl) {
          imgPreviewImg.onerror = function () {
            this.onerror = null;
            this.src = "/images/og-image.png";
          };
          imgPreviewImg.src = imageUrl;
          imgPreviewImg.classList.remove("hidden");
          imgPreviewEmpty.classList.add("hidden");
        } else {
          imgPreviewImg.src = "";
          imgPreviewImg.classList.add("hidden");
          imgPreviewEmpty.classList.remove("hidden");
        }
      }

      var cleanMdText = rawMd.replace(/<[^>]+>/g, "").replace(/[#*`>-]/g, " ").trim();
      var words = cleanMdText ? cleanMdText.split(/\s+/).filter(Boolean).length : 0;
      var readTime = Math.max(1, Math.ceil(words / 200));

      if (wordCountElem) wordCountElem.textContent = String(words);
      if (readTimeElem) readTimeElem.textContent = String(readTime);

      var categoryBadgeClass = (category === "Certifications") ? "stitch-badge-amber" : "stitch-badge";
      var draftBadgeHtml = isDraft ? '<span class="stitch-badge-amber text-xs py-0.5 px-2.5 mb-2 mr-2 inline-block"><i class="fa-solid fa-file-pen mr-1"></i> Draft Mode</span>' : '';
      var renderedHtml = "";

      if (title) {
        renderedHtml += '<div class="mb-4">' + draftBadgeHtml + '<span class="' + categoryBadgeClass + ' text-xs py-0.5 px-2.5 mb-2 inline-block">' + escapeHtml(category) + '</span>' +
          '<h1 class="text-2xl sm:text-3xl font-extrabold text-dark dark:text-darkmode-dark leading-snug mb-2">' + escapeHtml(title) + '</h1>' +
          (desc ? '<p class="text-sm text-text/80 dark:text-darkmode-text/80 leading-relaxed mb-3 italic">' + escapeHtml(desc) + '</p>' : '') +
          '<div class="flex items-center gap-3 text-xs font-semibold text-text/90 dark:text-darkmode-text/90 mb-4"><span class="text-primary font-bold"><i class="fa-solid fa-user-ninja mr-1"></i>' + escapeHtml(author) + '</span> <span><i class="fa-regular fa-clock mr-1"></i>' + readTime + ' min read</span></div></div>';
      }

      if (imageUrl) {
        renderedHtml += '<div class="mb-6 rounded-2xl overflow-hidden shadow-md"><img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(title) + '" onerror="this.onerror=null; this.src=\'/images/og-image.png\';" class="w-full h-48 sm:h-64 object-cover" /></div>';
      }

      // Live Render Guide Series Playlist Box if Series Name provided
      if (seriesName) {
        var totalParts = Math.max(seriesOrder, 5);
        var percent = Math.round((seriesOrder / totalParts) * 100);

        renderedHtml += '<div class="series-playlist-widget mb-6 border border-primary/20 dark:border-darkmode-primary/20 rounded-3xl p-5 bg-gradient-to-br from-primary/5 via-body to-theme-light/40 dark:from-darkmode-primary/10 dark:via-darkmode-body dark:to-darkmode-theme-light/30 shadow-xs">' +
          '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-border/40 dark:border-darkmode-border/40">' +
            '<div>' +
              '<div class="flex items-center gap-2 mb-1"><span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/15 text-primary"><i class="fa-solid fa-layer-group text-[9px]"></i> Guide Series</span><span class="text-xs font-semibold text-text/70 dark:text-darkmode-text/70">Part ' + seriesOrder + ' of ' + totalParts + '</span></div>' +
              '<h3 class="text-base font-bold text-dark dark:text-darkmode-dark">' + escapeHtml(seriesName) + '</h3>' +
            '</div>' +
            '<div class="w-32 sm:w-40 shrink-0"><div class="flex justify-between text-[10px] font-bold text-primary mb-1"><span>Progress</span><span>' + percent + '%</span></div><div class="h-2 w-full bg-border/60 dark:bg-darkmode-border/60 rounded-full overflow-hidden"><div class="h-full bg-primary rounded-full" style="width: ' + percent + '%;"></div></div></div>' +
          '</div>' +
          '<div class="text-xs font-bold uppercase tracking-wider text-text/80 dark:text-darkmode-text/80 mb-2"><i class="fa-solid fa-list-ol mr-1.5 text-primary"></i> Series Playlist (' + totalParts + ' Parts)</div>' +
          '<div class="space-y-1.5 pt-1">' +
            '<div class="flex items-center justify-between p-2.5 rounded-xl text-xs bg-primary text-white font-bold shadow-xs"><div class="flex items-center gap-2 min-w-0 pr-2"><span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/20">' + seriesOrder + '</span><span class="truncate">' + (title ? escapeHtml(title) : escapeHtml(seriesName) + ' (Part ' + seriesOrder + ')') + '</span></div><span class="px-2 py-0.5 rounded-full bg-white/20 text-[10px] shrink-0">CURRENT</span></div>' +
          '</div>' +
        '</div>';
      }

      renderedHtml += renderMarkdownToHtml(rawMd);
      livePreview.innerHTML = renderedHtml || '<div class="text-center py-12 text-xs font-semibold text-text/90 dark:text-darkmode-text/90"><i class="fa-solid fa-pen-fancy text-2xl text-primary block mb-2"></i>Start typing in the editor on the left to view live rendered Hugo article styling!</div>';
    }

    function renderMarkdownToHtml(md) {
      if (!md) return "";
      var html = escapeHtml(md);

      html = html.replace(/```([a-z0-9]*)\n([\s\S]*?)```/gi, function (_, lang, code) {
        return '<pre class="my-4 p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto"><code>' + code.trim() + '</code></pre>';
      });

      html = html.replace(/^&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING)\]\n&gt;\s*(.*)$/gim, function (_, type, text) {
        return '<div class="my-4 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300"><i class="fa-solid fa-triangle-exclamation mr-2 text-amber-500"></i><strong>' + type + ':</strong> ' + text + '</div>';
      });

      html = html.replace(/^&gt;\s*(.*)$/gim, '<blockquote class="my-3 pl-4 border-l-4 border-primary italic text-xs text-text/80 dark:text-darkmode-text/80">$1</blockquote>');
      html = html.replace(/^###\s*(.*)$/gim, '<h3 class="text-lg font-bold text-dark dark:text-darkmode-dark mt-6 mb-2">$1</h3>');
      html = html.replace(/^##\s*(.*)$/gim, '<h2 class="text-xl font-extrabold text-dark dark:text-darkmode-dark mt-8 mb-3 border-b border-border/40 pb-1">$1</h2>');
      html = html.replace(/^[\-*]\s*(.*)$/gim, '<li class="ml-4 list-disc text-xs text-text/90 dark:text-darkmode-text/90 mb-1">$1</li>');
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="my-4 rounded-2xl shadow-sm max-h-80 mx-auto" />');
      html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">$1</a>');
      html = html.replace(/\n\n/g, '<div class="h-3"></div>');

      return html;
    }

    if (btnExportMd) {
      btnExportMd.addEventListener("click", function () {
        var title = titleInput ? titleInput.value.trim() : "Untitled Article";
        var category = categorySelect ? categorySelect.value : "Google Cloud";
        var isDraft = (draftSelect ? draftSelect.value === "true" : false);
        var desc = descInput ? descInput.value.trim() : "";
        var author = authorInput ? authorInput.value.trim() : "Tharun Vempati";
        var tags = tagsInput ? tagsInput.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [];
        var imageUrl = imageUrlInput ? imageUrlInput.value.trim() : "/images/posts/default-banner.webp";
        var seriesName = seriesInput ? seriesInput.value.trim() : "";
        var seriesOrder = seriesOrderInput ? (parseInt(seriesOrderInput.value, 10) || 1) : 1;
        var rawMd = markdownInput ? markdownInput.value.trim() : "";

        var dateStr = new Date().toISOString();
        var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        var filename = new Date().toISOString().split("T")[0] + "-" + slug + ".md";

        var frontMatter = "---\n" +
          'title: "' + title.replace(/"/g, '\\"') + '"\n' +
          'meta_title: "' + title.replace(/"/g, '\\"') + ' | GCloud Cafe"\n' +
          'description: "' + desc.replace(/"/g, '\\"') + '"\n' +
          'date: "' + dateStr + '"\n' +
          'image: "' + imageUrl + '"\n' +
          'categories: ["' + category + '"]\n' +
          'tags: ' + JSON.stringify(tags) + '\n' +
          'author: "' + author + '"\n' +
          (seriesName ? ('series: "' + seriesName.replace(/"/g, '\\"') + '"\nseries_order: ' + seriesOrder + '\n') : '') +
          'draft: ' + isDraft + '\n' +
          "---\n\n" + rawMd;

        var blob = new Blob([frontMatter], { type: "text/markdown;charset=utf-8;" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    if (btnCopyMd) {
      btnCopyMd.addEventListener("click", function () {
        var title = titleInput ? titleInput.value.trim() : "Untitled Article";
        var category = categorySelect ? categorySelect.value : "Google Cloud";
        var isDraft = (draftSelect ? draftSelect.value === "true" : false);
        var desc = descInput ? descInput.value.trim() : "";
        var author = authorInput ? authorInput.value.trim() : "Tharun Vempati";
        var tags = tagsInput ? tagsInput.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [];
        var imageUrl = imageUrlInput ? imageUrlInput.value.trim() : "/images/posts/default-banner.webp";
        var seriesName = seriesInput ? seriesInput.value.trim() : "";
        var seriesOrder = seriesOrderInput ? (parseInt(seriesOrderInput.value, 10) || 1) : 1;
        var rawMd = markdownInput ? markdownInput.value.trim() : "";

        var frontMatter = "---\n" +
          'title: "' + title.replace(/"/g, '\\"') + '"\n' +
          'meta_title: "' + title.replace(/"/g, '\\"') + ' | GCloud Cafe"\n' +
          'description: "' + desc.replace(/"/g, '\\"') + '"\n' +
          'date: "' + new Date().toISOString() + '"\n' +
          'image: "' + imageUrl + '"\n' +
          'categories: ["' + category + '"]\n' +
          'tags: ' + JSON.stringify(tags) + '\n' +
          'author: "' + author + '"\n' +
          (seriesName ? ('series: "' + seriesName.replace(/"/g, '\\"') + '"\nseries_order: ' + seriesOrder + '\n') : '') +
          'draft: ' + isDraft + '\n' +
          "---\n\n" + rawMd;

        navigator.clipboard.writeText(frontMatter).then(function () {
          var originalText = btnCopyMd.innerHTML;
          btnCopyMd.innerHTML = '<i class="fa-solid fa-check text-emerald-500 mr-1.5"></i> Copied!';
          setTimeout(function () { btnCopyMd.innerHTML = originalText; }, 2500);
        });
      });
    }


    if (btnPublishSupabase) {
      btnPublishSupabase.addEventListener("click", function () {
        var title = titleInput ? titleInput.value.trim() : "";
        if (!title) {
          alert("Please enter an article title first!");
          return;
        }

        var originalHtml = btnPublishSupabase.innerHTML;
        btnPublishSupabase.disabled = true;
        btnPublishSupabase.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Publishing...';

        var category = categorySelect ? categorySelect.value : "Google Cloud";
        var desc = descInput ? descInput.value.trim() : "";
        var author = authorInput ? authorInput.value.trim() : "Tharun Vempati";
        var tags = tagsInput ? tagsInput.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [];
        var imageUrl = imageUrlInput ? imageUrlInput.value.trim() : "";
        var rawMd = markdownInput ? markdownInput.value.trim() : "";

        var payload = {
          title: title,
          content: rawMd || desc,
          author: author,
          link_url: imageUrl || null,
          tags: tags.length > 0 ? tags : ["#" + category.replace(/\s+/g, "")],
          upvotes: 1,
          downvotes: 0,
          score: 1,
          status: "published",
          eligibility_reason: "Admin Created Long-form Article Published via Article Studio Portal"
        };

        fetch(config.url + "/rest/v1/cloud_pulses", {
          method: "POST",
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(payload)
        })
        .then(function (res) {
          btnPublishSupabase.disabled = false;
          if (res.ok) {
            btnPublishSupabase.innerHTML = '<i class="fa-solid fa-circle-check mr-1.5"></i> Published to Supabase!';
          } else {
            btnPublishSupabase.innerHTML = '<i class="fa-solid fa-check mr-1.5"></i> Saved!';
          }
          setTimeout(function () { btnPublishSupabase.innerHTML = originalHtml; }, 3000);
        })
        .catch(function () {
          btnPublishSupabase.disabled = false;
          btnPublishSupabase.innerHTML = originalHtml;
        });
      });
    }

    // ── GitHub Direct Integration & Image Uploader ──
    var btnToggleGithub = document.getElementById("btn-toggle-github-config");
    var githubDrawer = document.getElementById("github-config-drawer");
    var githubPatInput = document.getElementById("github-pat-token");
    var btnSaveGithubToken = document.getElementById("btn-save-github-token");
    var githubTokenStatus = document.getElementById("github-token-status");

    var imageFileInput = document.getElementById("article-image-file-input");
    var lblUploadImage = document.getElementById("lbl-upload-image");
    var btnPublishGithub = document.getElementById("btn-publish-github");

    // ── AI Article Studio, Quality Audit & LinkedIn Generator Elements ──
    var btnAiArticle = document.getElementById("btn-ai-generate-article");
    var modalAiArticle = document.getElementById("ai-article-modal");
    var closeAiArticleBtn = document.getElementById("close-ai-article-modal-btn");
    var cancelAiArticleBtn = document.getElementById("cancel-ai-article-modal-btn");
    var formAiArticle = document.getElementById("ai-article-form");
    var aiPromptTopic = document.getElementById("ai-prompt-topic");
    var aiPromptStyle = document.getElementById("ai-prompt-style");
    var aiPromptCategory = document.getElementById("ai-prompt-category");
    var aiPromptNotes = document.getElementById("ai-prompt-notes");
    var aiArticleStatus = document.getElementById("ai-article-status");
    var submitAiArticleBtn = document.getElementById("submit-ai-article-btn");

    var btnPreflight = document.getElementById("btn-preflight-check");
    var modalPreflight = document.getElementById("preflight-modal");
    var closePreflightBtn = document.getElementById("close-preflight-modal-btn");
    var preflightDoneBtn = document.getElementById("preflight-done-btn");
    var preflightScoreLabel = document.getElementById("preflight-score-label");
    var preflightScoreBadge = document.getElementById("preflight-score-badge");
    var preflightChecklist = document.getElementById("preflight-checklist");
    var preflightRecommendationsList = document.getElementById("preflight-recommendations-list");

    var btnGenerateLinkedIn = document.getElementById("btn-generate-linkedin");
    var modalLinkedIn = document.getElementById("linkedin-post-modal");
    var closeLinkedInBtn = document.getElementById("close-linkedin-post-modal-btn");
    var linkedinTextarea = document.getElementById("linkedin-post-textarea");
    var btnRegenerateLinkedIn = document.getElementById("btn-regenerate-linkedin-ai");
    var btnCopyLinkedInPost = document.getElementById("btn-copy-linkedin-post");
    var btnSaveLinkedInRepo = document.getElementById("btn-save-linkedin-repo");
    var btnOpenLinkedInShare = document.getElementById("btn-open-linkedin-share");
    var linkedinSaveStatus = document.getElementById("linkedin-post-save-status");
    var linkedinCharCounter = document.getElementById("linkedin-char-counter");

    var aiArticleGeminiKeyInput = document.getElementById("ai-article-gemini-key-input");
    var toggleArticleGeminiKeyBtn = document.getElementById("toggle-article-gemini-key-visibility");
    var saveArticleGeminiKeyBtn = document.getElementById("save-article-gemini-key-btn");

    // ── AI Helper: Fetch Supabase-backed or locally saved Gemini Key ──
    async function getArticleGeminiApiKey() {
      // 1. Primary Source: Always fetch directly from Supabase site_settings
      try {
        var config = window.SUPABASE_CONFIG || {
          url: "https://axiijcsxtiukloarbfor.supabase.co",
          anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
        };
        var res = await fetch(config.url + "/rest/v1/site_settings?key=eq.gemini_api_key&select=value", {
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey
          }
        });
        var data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].value) {
          return data[0].value.trim();
        }
      } catch (e) {}

      // 2. Fallback to localStorage or input field if Supabase is offline
      var stored = (localStorage.getItem("gcloudcafe_gemini_api_key") || "").trim();
      if (stored) return stored;
      if (aiArticleGeminiKeyInput && aiArticleGeminiKeyInput.value.trim()) {
        return aiArticleGeminiKeyInput.value.trim();
      }
      return "";
    }

    if (saveArticleGeminiKeyBtn && aiArticleGeminiKeyInput) {
      saveArticleGeminiKeyBtn.addEventListener("click", async function () {
        var key = aiArticleGeminiKeyInput.value.trim();
        if (!key) return;
        localStorage.setItem("gcloudcafe_gemini_api_key", key);

        // Sync directly to Supabase site_settings
        try {
          var config = window.SUPABASE_CONFIG || {
            url: "https://axiijcsxtiukloarbfor.supabase.co",
            anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
          };
          await fetch(config.url + "/rest/v1/site_settings?key=eq.gemini_api_key", {
            method: "PATCH",
            headers: {
              "apikey": config.anonKey,
              "Authorization": "Bearer " + config.anonKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ value: key, updated_at: new Date().toISOString() })
          });
        } catch (e) {}

        saveArticleGeminiKeyBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Saved to Supabase!';
        saveArticleGeminiKeyBtn.className = "px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold border-none cursor-pointer whitespace-nowrap shadow-xs";
        if (aiArticleStatus) {
          aiArticleStatus.textContent = "Gemini API Key updated in Supabase!";
          aiArticleStatus.className = "text-xs font-semibold mr-auto text-emerald-500";
        }
        setTimeout(function () {
          saveArticleGeminiKeyBtn.innerHTML = "Save Key";
          saveArticleGeminiKeyBtn.className = "px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer whitespace-nowrap shadow-xs";
        }, 2000);
      });
    }

    if (toggleArticleGeminiKeyBtn && aiArticleGeminiKeyInput) {
      toggleArticleGeminiKeyBtn.addEventListener("click", function () {
        if (aiArticleGeminiKeyInput.type === "password") {
          aiArticleGeminiKeyInput.type = "text";
          toggleArticleGeminiKeyBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
        } else {
          aiArticleGeminiKeyInput.type = "password";
          toggleArticleGeminiKeyBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
        }
      });
    }

    // Call Gemini API with Fallback Handling & Multi-Model Redundancy
    async function callGeminiApi(promptText, maxTokens) {
      var apiKey = await getArticleGeminiApiKey();
      if (!apiKey) {
        throw new Error("Please enter your Google AI Studio Gemini API key in the field above.");
      }

      var models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-pro", "gemini-3.7-flash", "gemini-flash-latest"];
      var lastErr = null;

      for (var i = 0; i < models.length; i++) {
        var model = models[i];
        try {
          var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(apiKey);
          var res = await fetch(url, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: {
                temperature: 0.35,
                maxOutputTokens: maxTokens || 3500
              }
            })
          });

          if (res.ok) {
            var data = await res.json();
            var text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (text) return text.trim();
          } else {
            var errData = await res.json().catch(function () { return {}; });
            var msg = errData?.error?.message || ("Gemini error " + res.status);
            if (msg.toLowerCase().includes("api key not valid") || msg.toLowerCase().includes("api_key_invalid")) {
              throw new Error("API key is not valid. Please paste a valid Gemini API key from https://aistudio.google.com above and click Save Key.");
            }
            lastErr = new Error(msg);
          }
        } catch (e) {
          if (e.message && e.message.includes("API key is not valid")) {
            throw e;
          }
          lastErr = e;
        }
      }
      throw lastErr || new Error("Gemini API call failed. Please check your API key and network connection.");
    }

    // ── 1. AI Blog Draft Writer Integration ──
    async function openAiArticleModal() {
      if (modalAiArticle) modalAiArticle.classList.remove("hidden");
      if (aiArticleStatus) aiArticleStatus.textContent = "";
      if (aiArticleGeminiKeyInput && !aiArticleGeminiKeyInput.value) {
        var key = await getArticleGeminiApiKey();
        if (key) aiArticleGeminiKeyInput.value = key;
      }
    }

    function closeAiArticleModal() {
      if (modalAiArticle) modalAiArticle.classList.add("hidden");
    }

    if (btnAiArticle) btnAiArticle.addEventListener("click", openAiArticleModal);
    if (closeAiArticleBtn) closeAiArticleBtn.addEventListener("click", closeAiArticleModal);
    if (cancelAiArticleBtn) cancelAiArticleBtn.addEventListener("click", closeAiArticleModal);
    if (modalAiArticle) {
      modalAiArticle.addEventListener("click", function (e) {
        if (e.target === modalAiArticle) closeAiArticleModal();
      });
    }

    function extractAiArticleJson(rawText) {
      try {
        var cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
        return JSON.parse(cleaned);
      } catch (e) {
        var titleMatch = rawText.match(/"title"\s*:\s*"([^"]+)"/i);
        var descMatch = rawText.match(/"description"\s*:\s*"([^"]+)"/i);
        var catMatch = rawText.match(/"category"\s*:\s*"([^"]+)"/i);
        var tagsMatch = rawText.match(/"tags"\s*:\s*\[([^\]]+)\]/i);
        var mdMatch = rawText.match(/"markdown_content"\s*:\s*"([\s\S]*?)"\s*\}?\s*$/i);

        var tags = [];
        if (tagsMatch) {
          tags = tagsMatch[1].split(",").map(function (t) {
            return t.replace(/["'\s]/g, "").trim();
          }).filter(Boolean);
        }

        var mdContent = "";
        if (mdMatch) {
          mdContent = mdMatch[1]
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\");
        } else {
          mdContent = rawText
            .replace(/^[\s\S]*?"markdown_content"\s*:\s*"?/i, "")
            .replace(/"?\s*\}\s*$/i, "")
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"');
        }

        return {
          title: titleMatch ? titleMatch[1] : "",
          description: descMatch ? descMatch[1] : "",
          category: catMatch ? catMatch[1] : "",
          tags: tags,
          markdown_content: mdContent
        };
      }
    }

    async function handleGenerateAiArticle(e) {
      if (e && e.preventDefault) e.preventDefault();
      var topic = (aiPromptTopic ? aiPromptTopic.value : "").trim();
      var style = (aiPromptStyle ? aiPromptStyle.value : "storytelling");
      var category = (aiPromptCategory ? aiPromptCategory.value : "Google Cloud");
      var notes = (aiPromptNotes ? aiPromptNotes.value : "").trim();

      if (!topic) {
        if (aiArticleStatus) {
          aiArticleStatus.textContent = "⚠️ Please enter a topic or target headline.";
          aiArticleStatus.className = "text-xs font-semibold mr-auto text-rose-500";
        }
        if (aiPromptTopic) aiPromptTopic.focus();
        return;
      }

      var origBtnHtml = submitAiArticleBtn ? submitAiArticleBtn.innerHTML : "";
      if (submitAiArticleBtn) {
        submitAiArticleBtn.disabled = true;
        submitAiArticleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Drafting with Gemini...';
      }
      if (aiArticleStatus) {
        aiArticleStatus.textContent = "Synthesizing architecture & narrative in GCloud Cafe style...";
        aiArticleStatus.className = "text-xs font-semibold mr-auto text-primary animate-pulse";
      }

      var prompt = "You are Tharun Vempati, lead cloud architect and creator of GCloud Cafe (https://gcloudcafe.com).\n"
        + "Write an authentic, publication-ready, deeply practical technical blog post in Tharun's signature GCloud Cafe style.\n\n"
        + "TOPIC: " + topic + "\n"
        + "CATEGORY: " + category + "\n"
        + "STYLE PRESET: " + style + "\n"
        + (notes ? ("USER SPECIFIC NOTES: " + notes + "\n\n") : "\n")
        + "STRICT GUIDELINES FOR THARUN'S SIGNATURE BLOG STYLE:\n"
        + "1. Paragraph Structure: Write in clean, short, punchy paragraphs with generous line spacing (1-2 sentences per paragraph). Never write dense, overwhelming walls of text.\n"
        + "2. Narrative First-Person Voice: Open with an authentic, conversational reflection (\"I remember when...\", \"When working on cloud migrations...\", \"There is a big difference between knowing a concept and applying it in production...\").\n"
        + "3. Signature Emoji Bullets: Use emoji markers for key takeaways and checklists:\n"
        + "   👉 **Core Concept / Reference**\n"
        + "   💡 **Key Architect Insight**\n"
        + "   ⚠️ **Gotcha / Watch Out in Production**\n"
        + "   🚀 **Actionable Step**\n"
        + "4. Headings & Flow: Use clean H2 (##) and H3 (###) headers with clear, engaging titles (e.g. '## The Core Dilemma: Merge vs Rebase', '### What Actually Happens Under the Hood', '### Where Things Go Wrong in Production', '## Decision Framework: When to Use Which', '## Summary & Takeaways').\n"
        + "5. Practical Code Blocks: Include concrete, realistic code snippets (```bash, ```yaml, ```dockerfile, or ```terraform) with comments explaining practical flags.\n"
        + "6. Callouts: Include Hugo notice or alert callouts (e.g. '> **Note:** ...' or '> **Tip:** ...').\n"
        + "7. Markdown Body: Generate a comprehensive, 700+ word deep dive.\n\n"
        + "OUTPUT FORMAT: Return ONLY a valid JSON object matching this schema:\n"
        + "{\n"
        + '  "title": "Clean, Catchy & Authoritative Article Title",\n'
        + '  "description": "1-2 sentence compelling summary for SEO and social preview (140-160 characters)",\n'
        + '  "category": "' + category + '",\n'
        + '  "tags": ["DevOps", "Git", "Architecture", "Best Practices"],\n'
        + '  "image": "/images/og-image.png",\n'
        + '  "markdown_content": "Full markdown content starting after frontmatter..."\n'
        + "}\n"
        + "Do not include any conversational preamble or outro. Output only the JSON object.";

      try {
        var responseText = await callGeminiApi(prompt, 3500);
        var parsed = extractAiArticleJson(responseText);

        if (titleInput && parsed.title) titleInput.value = parsed.title;
        if (categorySelect && parsed.category) categorySelect.value = parsed.category;
        if (descInput && parsed.description) descInput.value = parsed.description;
        if (tagsInput && Array.isArray(parsed.tags)) tagsInput.value = parsed.tags.join(", ");
        if (authorInput) authorInput.value = "Tharun Vempati";
        if (imageUrlInput) imageUrlInput.value = parsed.image || "/images/og-image.png";
        if (markdownInput && parsed.markdown_content) markdownInput.value = parsed.markdown_content;

        updateLivePreview();
        if (aiArticleStatus) {
          aiArticleStatus.textContent = "Article draft generated! 🎉";
          aiArticleStatus.className = "text-xs font-semibold mr-auto text-emerald-500";
        }
        setTimeout(closeAiArticleModal, 600);
      } catch (err) {
        console.error("AI Article draft error:", err);
        if (aiArticleStatus) {
          aiArticleStatus.textContent = "⚠️ " + (err.message || "Could not generate article draft");
          aiArticleStatus.className = "text-xs font-semibold mr-auto text-rose-500";
        }
      } finally {
        if (submitAiArticleBtn) {
          submitAiArticleBtn.disabled = false;
          submitAiArticleBtn.innerHTML = origBtnHtml;
        }
      }
    }

    if (formAiArticle) {
      formAiArticle.addEventListener("submit", handleGenerateAiArticle);
    }
    if (submitAiArticleBtn) {
      submitAiArticleBtn.addEventListener("click", handleGenerateAiArticle);
    }


    // ── 2. Pre-flight Publishability Quality Audit ──
    function runPublishabilityAudit() {
      var title = titleInput ? titleInput.value.trim() : "";
      var desc = descInput ? descInput.value.trim() : "";
      var category = categorySelect ? categorySelect.value : "";
      var tags = tagsInput ? tagsInput.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [];
      var rawMd = markdownInput ? markdownInput.value.trim() : "";

      var cleanMdText = rawMd.replace(/<[^>]+>/g, "").replace(/[#*`>-]/g, " ").trim();
      var wordCount = cleanMdText ? cleanMdText.split(/\s+/).filter(Boolean).length : 0;

      var checks = [
        {
          name: "Article Title Quality",
          passed: title.length >= 20 && title.length <= 95,
          weight: 15,
          detail: title ? (title.length + " chars (Target: 20-95 chars)") : "Title is missing"
        },
        {
          name: "SEO Meta Description",
          passed: desc.length >= 60 && desc.length <= 200,
          weight: 15,
          detail: desc ? (desc.length + " chars (Target: 60-200 chars)") : "Summary / description missing"
        },
        {
          name: "Category & Taxonomy Tags",
          passed: !!category && tags.length >= 3,
          weight: 15,
          detail: tags.length + " tags configured (Target: 3+ tags)"
        },
        {
          name: "Article Depth & Word Count",
          passed: wordCount >= 300,
          weight: 25,
          detail: wordCount + " words (" + (wordCount >= 600 ? "Deep-dive grade" : (wordCount >= 300 ? "Standard length" : "Needs more detail")) + ")"
        },
        {
          name: "Structured Heading Hierarchy",
          passed: /##\s+/i.test(rawMd) || /###\s+/i.test(rawMd),
          weight: 15,
          detail: (/##\s+/i.test(rawMd) ? "H2/H3 subheadings present" : "Add ## and ### subheadings to organize concepts")
        },
        {
          name: "Code Blocks or Note Callouts",
          passed: /```/i.test(rawMd) || />\s*\[!/i.test(rawMd) || />\s+/i.test(rawMd),
          weight: 15,
          detail: (/```/i.test(rawMd) || />/i.test(rawMd) ? "Technical callouts / code snippets included" : "Add code snippets or [!NOTE] callouts")
        }
      ];

      var totalScore = checks.reduce(function (acc, c) { return acc + (c.passed ? c.weight : 0); }, 0);

      if (preflightScoreLabel) {
        if (totalScore >= 90) {
          preflightScoreLabel.textContent = "Ready to Publish! 🚀";
          preflightScoreLabel.className = "text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5";
        } else if (totalScore >= 70) {
          preflightScoreLabel.textContent = "Good Draft — Minor Polish Recommended ⚡";
          preflightScoreLabel.className = "text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5";
        } else {
          preflightScoreLabel.textContent = "Draft in Progress (Needs Details) ✍️";
          preflightScoreLabel.className = "text-2xl font-extrabold text-rose-500 mt-0.5";
        }
      }

      if (preflightScoreBadge) {
        preflightScoreBadge.textContent = totalScore + "%";
        preflightScoreBadge.className = "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold border " + (totalScore >= 80 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30");
      }

      if (preflightChecklist) {
        var checklistHtml = "";
        checks.forEach(function (c) {
          var icon = c.passed ? '<i class="fa-solid fa-circle-check text-emerald-500 text-base"></i>' : '<i class="fa-solid fa-circle-exclamation text-amber-500 text-base"></i>';
          checklistHtml += '<div class="flex items-center justify-between p-3 rounded-xl border ' + (c.passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5") + '">' +
            '<div class="flex items-center gap-2.5">' +
              icon +
              '<div><div class="text-xs font-bold text-dark dark:text-darkmode-dark">' + escapeHtml(c.name) + '</div><div class="text-[11px] text-text/70 dark:text-darkmode-text/70">' + escapeHtml(c.detail) + '</div></div>' +
            '</div>' +
            '<span class="text-xs font-bold ' + (c.passed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400") + '">' + (c.passed ? "+" + c.weight + " pts" : "0 pts") + '</span>' +
          '</div>';
        });
        preflightChecklist.innerHTML = checklistHtml;
      }

      if (preflightRecommendationsList) {
        var recs = [];
        if (title.length < 20) recs.push("Make the article title more descriptive and compelling (target 30–70 characters).");
        if (desc.length < 60) recs.push("Add a 1–2 sentence meta description for search engines and social cards.");
        if (tags.length < 3) recs.push("Add at least 3 comma-separated tags (e.g. #GoogleCloud, #DevOps, #Architecture).");
        if (wordCount < 300) recs.push("Expand on architecture concepts or add hands-on troubleshooting steps for reader depth.");
        if (!/##\s+/i.test(rawMd)) recs.push("Organize the post with structured subheadings (## and ###).");
        if (!/```/i.test(rawMd)) recs.push("Add bash commands, YAML snippets, or architectural code examples.");

        if (recs.length === 0) {
          preflightRecommendationsList.innerHTML = '<li class="text-emerald-600 dark:text-emerald-400 font-semibold">🎉 All checks passed! Your article meets highest quality standards.</li>';
        } else {
          preflightRecommendationsList.innerHTML = recs.map(function (r) { return '<li>' + escapeHtml(r) + '</li>'; }).join("");
        }
      }

      if (modalPreflight) modalPreflight.classList.remove("hidden");
    }

    if (btnPreflight) btnPreflight.addEventListener("click", runPublishabilityAudit);
    if (closePreflightBtn) closePreflightBtn.addEventListener("click", function () { if (modalPreflight) modalPreflight.classList.add("hidden"); });
    if (preflightDoneBtn) preflightDoneBtn.addEventListener("click", function () { if (modalPreflight) modalPreflight.classList.add("hidden"); });
    if (modalPreflight) {
      modalPreflight.addEventListener("click", function (e) {
        if (e.target === modalPreflight) modalPreflight.classList.add("hidden");
      });
    }

    // ── 3. LinkedIn Post Generator & Repo Exporter Studio ──
    async function generateLinkedInPostDraft() {
      var title = titleInput ? titleInput.value.trim() : "Cloud Architecture Deep Dive";
      var desc = descInput ? descInput.value.trim() : "";
      var category = categorySelect ? categorySelect.value : "Google Cloud";
      var tags = tagsInput ? tagsInput.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : ["GoogleCloud", "DevOps"];
      var rawMd = markdownInput ? markdownInput.value.trim() : "";

      var cleanExcerpt = rawMd.replace(/<[^>]+>/g, "").replace(/[#*`>-]/g, " ").substring(0, 700).trim();
      var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      var articleUrl = "https://gcloudcafe.com/blog/" + (slug || "article") + "/";

      if (linkedinTextarea) {
        linkedinTextarea.value = "Generating high-converting LinkedIn post with Gemini AI...";
      }

      var prompt = "You are Tharun Vempati, creator of GCloud Cafe (https://gcloudcafe.com).\n"
        + "Write an authentic, highly engaging LinkedIn post for your engineering audience based on this newly written blog article.\n\n"
        + "ARTICLE TITLE: " + title + "\n"
        + "SUMMARY: " + desc + "\n"
        + "CONTENT EXCERPT: " + cleanExcerpt + "\n\n"
        + "FORMAT:\n"
        + "☕ GCloud Cafe | Deep Dive\n\n"
        + "📌 [Punchy Hook / Main Question]\n\n"
        + "[2-3 narrative sentences about what changed or the architectural challenge]\n\n"
        + "Key Takeaways:\n"
        + "🔹 [Takeaway 1]\n"
        + "🔹 [Takeaway 2]\n"
        + "🔹 [Takeaway 3]\n\n"
        + "Read the full guide on GCloud Cafe 👇\n"
        + "🔗 " + articleUrl + "\n\n"
        + "#" + category.replace(/\s+/g, "") + " #GoogleCloud #CloudArchitecture #DevOps #GCloudCafe\n\n"
        + "Return ONLY the formatted post text without quotes.";

      try {
        var post = await callGeminiApi(prompt, 1000);
        if (linkedinTextarea) {
          linkedinTextarea.value = post;
          updateLinkedInCharCount();
        }
        if (btnOpenLinkedInShare) {
          btnOpenLinkedInShare.href = "https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent(post);
        }
      } catch (err) {
        // Natural smart fallback template
        var hashtags = tags.map(function (t) { return t.startsWith("#") ? t : "#" + t; }).join(" ");
        var fallbackPost = "☕ GCloud Cafe | Deep Dive\n\n"
          + "📌 " + title + "\n\n"
          + (desc || "A deep technical dive into cloud architecture and best practices.") + "\n\n"
          + "Read the full guide on GCloud Cafe 👇\n"
          + "🔗 " + articleUrl + "\n\n"
          + (hashtags ? hashtags + " " : "") + "#GoogleCloud #DevOps #GCloudCafe";

        if (linkedinTextarea) {
          linkedinTextarea.value = fallbackPost;
          updateLinkedInCharCount();
        }
        if (btnOpenLinkedInShare) {
          btnOpenLinkedInShare.href = "https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent(fallbackPost);
        }
      }
    }

    function updateLinkedInCharCount() {
      if (linkedinTextarea && linkedinCharCounter) {
        linkedinCharCounter.textContent = linkedinTextarea.value.length + " chars";
      }
    }

    if (linkedinTextarea) {
      linkedinTextarea.addEventListener("input", function () {
        updateLinkedInCharCount();
        if (btnOpenLinkedInShare) {
          btnOpenLinkedInShare.href = "https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent(linkedinTextarea.value);
        }
      });
    }

    if (btnGenerateLinkedIn) {
      btnGenerateLinkedIn.addEventListener("click", function () {
        if (modalLinkedIn) modalLinkedIn.classList.remove("hidden");
        if (linkedinSaveStatus) linkedinSaveStatus.textContent = "";
        generateLinkedInPostDraft();
      });
    }

    if (btnRegenerateLinkedIn) {
      btnRegenerateLinkedIn.addEventListener("click", generateLinkedInPostDraft);
    }

    if (closeLinkedInBtn) {
      closeLinkedInBtn.addEventListener("click", function () {
        if (modalLinkedIn) modalLinkedIn.classList.add("hidden");
      });
    }

    if (modalLinkedIn) {
      modalLinkedIn.addEventListener("click", function (e) {
        if (e.target === modalLinkedIn) modalLinkedIn.classList.add("hidden");
      });
    }

    if (btnCopyLinkedInPost) {
      btnCopyLinkedInPost.addEventListener("click", function () {
        if (!linkedinTextarea) return;
        navigator.clipboard.writeText(linkedinTextarea.value).then(function () {
          var origHtml = btnCopyLinkedInPost.innerHTML;
          btnCopyLinkedInPost.innerHTML = '<i class="fa-solid fa-check text-emerald-500 mr-1.5"></i> Copied!';
          setTimeout(function () { btnCopyLinkedInPost.innerHTML = origHtml; }, 2500);
        });
      });
    }

    // Save LinkedIn Post Draft to Repository (as Markdown File)
    if (btnSaveLinkedInRepo) {
      btnSaveLinkedInRepo.addEventListener("click", function () {
        var title = titleInput ? titleInput.value.trim() : "Article";
        var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        var dateStr = new Date().toISOString().split("T")[0];
        var filename = dateStr + "-" + (slug || "post") + "-linkedin.md";
        var content = linkedinTextarea ? linkedinTextarea.value : "";

        if (!content) return;

        var fullDraftMd = "# LinkedIn Post Draft: " + title + "\n"
          + "**Generated Date:** " + new Date().toISOString() + "\n"
          + "**Article Link:** https://gcloudcafe.com/blog/" + slug + "/\n\n"
          + "---\n\n"
          + content + "\n";

        // 1. If GitHub PAT configured, commit directly to content/linkedin-drafts/
        var patToken = localStorage.getItem("gcloud_github_pat") || (githubPatInput ? githubPatInput.value.trim() : "");
        if (patToken) {
          var targetPath = "content/linkedin-drafts/" + filename;
          var base64Draft = btoa(unescape(encodeURIComponent(fullDraftMd)));
          uploadFileToGithub(targetPath, base64Draft, "docs(linkedin): add social draft for " + title, patToken)
            .then(function () {
              if (linkedinSaveStatus) {
                linkedinSaveStatus.textContent = "✅ Committed draft to content/linkedin-drafts/" + filename + " on GitHub!";
              }
            })
            .catch(function (e) {
              console.warn("GitHub draft commit error:", e);
            });
        }

        // 2. Also download local file as seamless backup
        var blob = new Blob([fullDraftMd], { type: "text/markdown;charset=utf-8;" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (linkedinSaveStatus && !patToken) {
          linkedinSaveStatus.textContent = "💾 Downloaded " + filename + " (Save in repo drafts)!";
        }
      });
    }

    var toggleGithubPatBtn = document.getElementById("toggle-github-pat-btn");
    var githubStorageBadge = document.getElementById("github-storage-badge");

    async function getGithubPatToken() {
      var localPat = localStorage.getItem("gcloud_github_pat") || (githubPatInput ? githubPatInput.value.trim() : "");
      if (localPat) return localPat;

      try {
        var res = await fetch(config.url + "/rest/v1/site_settings?key=eq.github_pat&select=value", {
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey
          }
        });
        if (res.ok) {
          var rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0 && rows[0].value) {
            var pat = rows[0].value.trim();
            if (pat) {
              if (githubPatInput) githubPatInput.value = pat;
              localStorage.setItem("gcloud_github_pat", pat);
              if (githubStorageBadge) githubStorageBadge.textContent = "Connected via Supabase";
              return pat;
            }
          }
        }
      } catch (e) {}

      return "";
    }

    if (githubPatInput) {
      var savedPat = localStorage.getItem("gcloud_github_pat") || "";
      if (savedPat) {
        githubPatInput.value = savedPat;
        if (githubStorageBadge) githubStorageBadge.textContent = "Connected via Browser & Supabase";
      } else {
        getGithubPatToken();
      }
    }

    if (toggleGithubPatBtn && githubPatInput) {
      toggleGithubPatBtn.addEventListener("click", function () {
        if (githubPatInput.type === "password") {
          githubPatInput.type = "text";
          toggleGithubPatBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
        } else {
          githubPatInput.type = "password";
          toggleGithubPatBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
        }
      });
    }

    if (btnToggleGithub && githubDrawer) {
      btnToggleGithub.addEventListener("click", function () {
        githubDrawer.classList.toggle("hidden");
        if (!githubDrawer.classList.contains("hidden") && githubPatInput) {
          githubPatInput.focus();
        }
      });
    }

    if (btnSaveGithubToken && githubPatInput) {
      btnSaveGithubToken.addEventListener("click", async function () {
        var token = githubPatInput.value.trim();
        if (!token) return;
        localStorage.setItem("gcloud_github_pat", token);

        try {
          await fetch(config.url + "/rest/v1/site_settings", {
            method: "POST",
            headers: {
              "apikey": config.anonKey,
              "Authorization": "Bearer " + config.anonKey,
              "Content-Type": "application/json",
              "Prefer": "resolution=merge-duplicates"
            },
            body: JSON.stringify({
              key: "github_pat",
              value: token,
              updated_at: new Date().toISOString()
            })
          });
        } catch (e) {}

        if (githubTokenStatus) {
          githubTokenStatus.textContent = "✓ GitHub Personal Access Token saved and synced securely!";
          githubTokenStatus.classList.remove("hidden");
          if (githubStorageBadge) githubStorageBadge.textContent = "Connected via Supabase";
          setTimeout(function () { githubTokenStatus.classList.add("hidden"); }, 4000);
        }
      });
    }

    function uploadFileToGithub(path, base64Content, commitMessage, patToken) {
      var repo = "tharun15/gcloudcafe";
      var url = "https://api.github.com/repos/" + repo + "/contents/" + path;


      return fetch(url, {
        headers: { "Authorization": "token " + patToken }
      })
      .then(function (res) {
        if (res.ok) return res.json();
        return null;
      })
      .then(function (existingData) {
        var payload = {
          message: commitMessage,
          content: base64Content,
          branch: "main"
        };
        if (existingData && existingData.sha) {
          payload.sha = existingData.sha;
        }

        return fetch(url, {
          method: "PUT",
          headers: {
            "Authorization": "token " + patToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (err) {
            throw new Error((err && err.message) ? err.message : "GitHub API upload failed (" + res.status + ")");
          });
        }
        return res.json();
      });
    }

    // Direct Image Upload Handler
    if (imageFileInput) {
      imageFileInput.addEventListener("change", async function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;

        var patToken = await getGithubPatToken();
        if (!patToken) {
          if (githubDrawer) {
            githubDrawer.classList.remove("hidden");
            githubDrawer.scrollIntoView({ behavior: "smooth", block: "center" });
            if (githubPatInput) githubPatInput.focus();
          }
          return;
        }

        var origLbl = lblUploadImage ? lblUploadImage.innerHTML : "";
        if (lblUploadImage) lblUploadImage.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

        var reader = new FileReader();
        reader.onload = function (evt) {
          var dataUrl = evt.target.result;
          var base64Data = dataUrl.split(",")[1];
          var safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
          var datePrefix = new Date().toISOString().split("T")[0];
          var targetPath = "static/images/posts/" + datePrefix + "-" + safeName;

          uploadFileToGithub(targetPath, base64Data, "upload: add post image " + safeName, patToken)
            .then(function () {
              var publicRelPath = "/images/posts/" + datePrefix + "-" + safeName;
              if (imageUrlInput) {
                imageUrlInput.value = publicRelPath;
                imageUrlInput.dispatchEvent(new Event("input"));
              }
              if (lblUploadImage) {
                lblUploadImage.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-500"></i> Uploaded!';
                setTimeout(function () { lblUploadImage.innerHTML = origLbl; }, 3000);
              }
            })
            .catch(function (err) {
              alert("Image upload error: " + err.message);
              if (lblUploadImage) lblUploadImage.innerHTML = origLbl;
            });
        };
        reader.readAsDataURL(file);
      });
    }

    // 1-Click Publish Live to GitHub Repo Handler
    if (btnPublishGithub) {
      btnPublishGithub.addEventListener("click", async function () {
        var title = titleInput ? titleInput.value.trim() : "";
        if (!title) {
          alert("Please enter an article title first!");
          return;
        }

        var patToken = await getGithubPatToken();
        if (!patToken) {
          if (githubDrawer) {
            githubDrawer.classList.remove("hidden");
            githubDrawer.scrollIntoView({ behavior: "smooth", block: "center" });
            if (githubPatInput) githubPatInput.focus();
          }
          return;
        }


        var originalHtml = btnPublishGithub.innerHTML;
        btnPublishGithub.disabled = true;
        btnPublishGithub.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Committing to GitHub...';

        var category = categorySelect ? categorySelect.value : "Google Cloud";
        var desc = descInput ? descInput.value.trim() : "";
        var author = authorInput ? authorInput.value.trim() : "Tharun Vempati";
        var tags = tagsInput ? tagsInput.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [];
        var imageUrl = imageUrlInput ? imageUrlInput.value.trim() : "/images/posts/default-banner.webp";
        var seriesName = seriesInput ? seriesInput.value.trim() : "";
        var seriesOrder = seriesOrderInput ? (parseInt(seriesOrderInput.value, 10) || 1) : 1;
        var rawMd = markdownInput ? markdownInput.value.trim() : "";

        var dateStr = new Date().toISOString();
        var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        var filename = new Date().toISOString().split("T")[0] + "-" + slug + ".md";
        var targetPath = "content/english/blog/" + filename;

        var isDraft = (draftSelect ? draftSelect.value === "true" : false);
        var frontMatter = "---\n" +
          'title: "' + title.replace(/"/g, '\\"') + '"\n' +
          'meta_title: "' + title.replace(/"/g, '\\"') + ' | GCloud Cafe"\n' +
          'description: "' + desc.replace(/"/g, '\\"') + '"\n' +
          'date: "' + dateStr + '"\n' +
          'image: "' + imageUrl + '"\n' +
          'categories: ["' + category + '"]\n' +
          'tags: ' + JSON.stringify(tags) + '\n' +
          'author: "' + author + '"\n' +
          (seriesName ? ('series: "' + seriesName.replace(/"/g, '\\"') + '"\nseries_order: ' + seriesOrder + '\n') : '') +
          'draft: ' + isDraft + '\n' +
          "---\n\n" + rawMd;

        var base64Md = btoa(unescape(encodeURIComponent(frontMatter)));
        var commitMsg = isDraft ? ("feat(blog): add draft article: " + title) : ("feat(blog): publish article: " + title);

        uploadFileToGithub(targetPath, base64Md, commitMsg, patToken)
          .then(function () {
            btnPublishGithub.disabled = false;
            btnPublishGithub.innerHTML = isDraft ? '<i class="fa-solid fa-circle-check text-amber-400 mr-1.5"></i> Draft Pushed to GitHub!' : '<i class="fa-solid fa-circle-check text-emerald-400 mr-1.5"></i> Published Live to GitHub!';
            setTimeout(function () { updateLivePreview(); }, 4000);
          })
          .catch(function (err) {
            btnPublishGithub.disabled = false;
            alert("GitHub publishing error: " + err.message);
            btnPublishGithub.innerHTML = originalHtml;
          });

      });
    }
  }


  /* ── 13. Author Proposal Submission System (Figma ByteDepth Community) ── */
  function initAuthorProposalSystem() {
    var modal = document.getElementById("author-proposal-modal");
    var openBtn = document.getElementById("open-proposal-modal-btn");
    var closeBtn = document.getElementById("close-proposal-modal-btn");
    var cancelBtn = document.getElementById("proposal-cancel-btn");
    var form = document.getElementById("author-proposal-form");
    var modalCard = document.getElementById("author-proposal-modal-card");

    var nameInput = document.getElementById("proposal-name");
    var emailInput = document.getElementById("proposal-email");
    var categorySelect = document.getElementById("proposal-category");
    var timeframeSelect = document.getElementById("proposal-timeframe");
    var titleInput = document.getElementById("proposal-title");
    var outlineInput = document.getElementById("proposal-outline");
    var portfolioInput = document.getElementById("proposal-portfolio");
    var charCountEl = document.getElementById("proposal-char-count");
    var statusBanner = document.getElementById("proposal-status-banner");
    var submitBtn = document.getElementById("proposal-submit-btn");

    var formContainer = document.getElementById("proposal-form-container");
    var successView = document.getElementById("proposal-success-view");
    var successBadge = document.getElementById("proposal-success-badge");
    var successTitle = document.getElementById("proposal-success-title");
    var successEmail = document.getElementById("proposal-success-email");
    var anotherBtn = document.getElementById("proposal-another-btn");
    var doneBtn = document.getElementById("proposal-done-btn");

    if (!modal || !openBtn) return;

    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    function openModal() {
      modal.classList.remove("opacity-0", "pointer-events-none");
      modal.classList.add("opacity-100", "pointer-events-auto");
      if (modalCard) {
        modalCard.classList.remove("scale-95");
        modalCard.classList.add("scale-100");
      }
      document.body.style.overflow = "hidden";
      if (nameInput) setTimeout(function () { nameInput.focus(); }, 100);
    }

    function closeModal() {
      modal.classList.add("opacity-0", "pointer-events-none");
      modal.classList.remove("opacity-100", "pointer-events-auto");
      if (modalCard) {
        modalCard.classList.add("scale-95");
        modalCard.classList.remove("scale-100");
      }
      document.body.style.overflow = "";
    }

    openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (doneBtn) doneBtn.addEventListener("click", closeModal);

    // Close on backdrop click
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });

    // Close on Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.classList.contains("opacity-0")) {
        closeModal();
      }
    });

    // Character counter for outline
    if (outlineInput && charCountEl) {
      outlineInput.addEventListener("input", function () {
        var len = outlineInput.value.trim().length;
        charCountEl.textContent = len + " / 30 min chars";
        if (len >= 30) {
          charCountEl.className = "font-mono text-[11px] text-emerald-500 font-semibold";
        } else {
          charCountEl.className = "font-mono text-[11px] text-amber-500 font-semibold";
        }
      });
    }

    // Helper: show error
    function setError(inputEl, errorId, msg) {
      var errEl = document.getElementById(errorId);
      if (errEl) {
        if (msg) {
          errEl.textContent = msg;
          errEl.classList.remove("hidden");
          inputEl.classList.add("border-red-500", "ring-1", "ring-red-500");
        } else {
          errEl.textContent = "";
          errEl.classList.add("hidden");
          inputEl.classList.remove("border-red-500", "ring-1", "ring-red-500");
        }
      }
    }

    // Clear error on input
    if (nameInput) nameInput.addEventListener("input", function () { setError(nameInput, "proposal-name-error", ""); });
    if (emailInput) emailInput.addEventListener("input", function () { setError(emailInput, "proposal-email-error", ""); });
    if (titleInput) titleInput.addEventListener("input", function () { setError(titleInput, "proposal-title-error", ""); });
    if (outlineInput) outlineInput.addEventListener("input", function () { setError(outlineInput, "proposal-outline-error", ""); });

    // "Submit Another" button
    if (anotherBtn) {
      anotherBtn.addEventListener("click", function () {
        if (form) form.reset();
        if (charCountEl) {
          charCountEl.textContent = "0 / 30 min chars";
          charCountEl.className = "font-mono text-[11px] text-slate-400 dark:text-slate-500";
        }
        if (statusBanner) statusBanner.classList.add("hidden");
        if (successView) successView.classList.add("hidden");
        if (formContainer) formContainer.classList.remove("hidden");
        if (nameInput) setTimeout(function () { nameInput.focus(); }, 50);
      });
    }

    // Form Submission
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var isValid = true;
        var nameVal = nameInput ? nameInput.value.trim() : "";
        var emailVal = emailInput ? emailInput.value.trim().toLowerCase() : "";
        var categoryVal = categorySelect ? categorySelect.value : "Kubernetes";
        var timeframeVal = timeframeSelect ? timeframeSelect.value : "2-3 Weeks";
        var titleVal = titleInput ? titleInput.value.trim() : "";
        var outlineVal = outlineInput ? outlineInput.value.trim() : "";
        var portfolioVal = portfolioInput ? portfolioInput.value.trim() : "";

        // Validate Name
        if (!nameVal || nameVal.length < 2) {
          setError(nameInput, "proposal-name-error", "Please provide your full name (minimum 2 characters).");
          isValid = false;
        } else {
          setError(nameInput, "proposal-name-error", "");
        }

        // Validate Email (RFC regex)
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal || !emailRegex.test(emailVal)) {
          setError(emailInput, "proposal-email-error", "Please provide a valid email address for editorial feedback.");
          isValid = false;
        } else {
          setError(emailInput, "proposal-email-error", "");
        }

        // Validate Title
        if (!titleVal || titleVal.length < 5) {
          setError(titleInput, "proposal-title-error", "Please provide a working title (at least 5 characters).");
          isValid = false;
        } else {
          setError(titleInput, "proposal-title-error", "");
        }

        // Validate Outline
        if (!outlineVal || outlineVal.length < 30) {
          setError(outlineInput, "proposal-outline-error", "Please provide an outline or abstract of at least 30 characters.");
          isValid = false;
        } else {
          setError(outlineInput, "proposal-outline-error", "");
        }

        if (!isValid) {
          var firstErr = form.querySelector(".border-red-500");
          if (firstErr) firstErr.focus();
          return;
        }

        // Submission state
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Submitting...';
        }

        var propId = "PROP-" + Math.floor(1000 + Math.random() * 9000);
        var proposalData = {
          id: propId,
          created_at: new Date().toISOString(),
          name: nameVal,
          email: emailVal,
          category: categoryVal,
          delivery_timeframe: timeframeVal,
          title: titleVal,
          outline: outlineVal,
          sample_url: portfolioVal,
          status: "pending"
        };

        // Dual persistence: 1. Persistent Local Storage
        try {
          var existing = JSON.parse(localStorage.getItem("gcloudcafe_author_proposals") || "[]");
          existing.unshift(proposalData);
          localStorage.setItem("gcloudcafe_author_proposals", JSON.stringify(existing));
        } catch (storageErr) {
          console.warn("Local proposal storage note:", storageErr);
        }

        // Dual persistence: 2. Attempt Supabase REST POST (safe background sync)
        fetch(config.url + "/rest/v1/author_proposals", {
          method: "POST",
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(proposalData)
        })
        .then(function (res) {
          if (!res.ok) console.log("Supabase author_proposals sync response:", res.status);
        })
        .catch(function (err) {
          console.log("Supabase author_proposals note:", err);
        })
        .finally(function () {
          // Complete submission UI transition
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Submit Proposal</span><i class="fa-solid fa-paper-plane text-[11px] ml-1.5"></i>';
          }

          if (successBadge) successBadge.textContent = "#" + propId;
          if (successTitle) successTitle.textContent = titleVal;
          if (successEmail) successEmail.textContent = emailVal;

          if (formContainer) formContainer.classList.add("hidden");
          if (successView) successView.classList.remove("hidden");
        });

      });
    }
  }

  /* ── 14. Community & Author Editorial Admin Portal System ── */
  function initCommunityAdminSystem() {
    var dashboardContainer = document.getElementById("admin-dashboard-container");
    var authPrompt = document.getElementById("admin-auth-prompt");
    var passcodeBtn = document.getElementById("admin-login-btn");
    var passcodeInput = document.getElementById("admin-passcode-input");
    var passcodeStatus = document.getElementById("admin-passcode-status");
    var unauthedControls = document.getElementById("admin-unauthed-controls");
    var authedControls = document.getElementById("admin-authed-controls");
    var logoutBtn = document.getElementById("admin-logout-btn");

    // Tabs & Dropdown Selectors
    var tabProposalsBtn = document.getElementById("tab-proposals-btn");
    var tabSubscribersBtn = document.getElementById("tab-subscribers-btn");
    var tabContentEngineBtn = document.getElementById("tab-content-engine-btn");
    var tabTalksBtn = document.getElementById("tab-talks-btn");
    var tabWeeklyPollsBtn = document.getElementById("tab-weekly-polls-btn");
    var weeklyPollsCountBadge = document.getElementById("weekly-polls-count-badge");
    var sectionWeeklyPolls = document.getElementById("section-weekly-polls");
    var contentNicheSelect = document.getElementById("content-engine-niche-select");
    var talkVenueSelect = document.getElementById("talk-venue-select");

    var sectionProposals = document.getElementById("section-author-proposals");
    var sectionSubscribers = document.getElementById("section-newsletter-subscribers");
    var sectionContentEngine = document.getElementById("section-content-engine");
    var sectionTalkIdeas = document.getElementById("section-talk-ideas");

    var refreshBtn = document.getElementById("refresh-community-btn");

    // Proposals Elements
    var proposalsGrid = document.getElementById("proposals-list-grid");
    var proposalsEmptyState = document.getElementById("proposals-empty-state");
    var proposalsCountBadge = document.getElementById("proposals-count-badge");
    var filterCountAll = document.getElementById("filter-prop-count-all");
    var filterCountPending = document.getElementById("filter-prop-count-pending");
    var filterCountApproved = document.getElementById("filter-prop-count-approved");
    var filterCountRejected = document.getElementById("filter-prop-count-rejected");
    var proposalsSearchInput = document.getElementById("proposals-search-input");
    var seedDemoBtn = document.getElementById("seed-test-proposal-btn");
    var emptyDemoBtn = document.getElementById("empty-add-demo-btn");

    // Subscribers Elements
    var subscribersCountBadge = document.getElementById("subscribers-count-badge");
    var subscribersStatTotal = document.getElementById("subscribers-stat-total");
    var subscribersStatLatest = document.getElementById("subscribers-stat-latest");
    var subscribersTableBody = document.getElementById("subscribers-table-body");
    var subscribersSearchInput = document.getElementById("subscribers-search-input");
    var subscribersShowingCount = document.getElementById("subscribers-showing-count");
    var copyAllSubscribersBtn = document.getElementById("copy-all-subscribers-btn");
    var exportSubscribersCsvBtn = document.getElementById("export-subscribers-csv-btn");
    var exportToastMsg = document.getElementById("export-toast-msg");

    if (!dashboardContainer && !authPrompt) return;

    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    var cachedProposals = [];
    var currentProposalFilter = "all";
    var cachedSubscribers = [];

    function unlockDashboard() {
      if (dashboardContainer) dashboardContainer.classList.remove("hidden");
      if (authPrompt) authPrompt.classList.add("hidden");
      if (unauthedControls) unauthedControls.classList.add("hidden");
      if (authedControls) authedControls.classList.remove("hidden");
      if (passcodeStatus) passcodeStatus.classList.add("hidden");

      loadProposals();
      loadSubscribers();
      renderContentIdeas();
      renderPermanentContentVault();
      renderTalkIdeas();
      renderPermanentTalksVault();
    }

    function lockDashboard() {
      if (dashboardContainer) dashboardContainer.classList.add("hidden");
      if (authPrompt) authPrompt.classList.remove("hidden");
      if (unauthedControls) unauthedControls.classList.remove("hidden");
      if (authedControls) authedControls.classList.add("hidden");
      sessionStorage.removeItem("pulse_admin_authed");
    }

    // Authentication check deferred to the end of initCommunityAdminSystem

    if (passcodeBtn && passcodeInput) {
      passcodeBtn.addEventListener("click", function () {
        var val = passcodeInput.value.trim();
        if (!val) return;

        if (passcodeStatus) {
          passcodeStatus.textContent = "Verifying passcode...";
          passcodeStatus.className = "mt-2 text-xs font-semibold text-primary";
          passcodeStatus.classList.remove("hidden");
        }

        // Check against Supabase site_settings or fallback 1526
        fetch(config.url + "/rest/v1/site_settings?key=eq.admin_passcode&select=value", {
          headers: {
            "apikey": config.anonKey,
            "Authorization": "Bearer " + config.anonKey
          }
        })
        .then(function (res) { return res.json(); })
        .then(function (settings) {
          var expected = (Array.isArray(settings) && settings.length > 0) ? settings[0].value : "1526";
          if (val === expected) {
            sessionStorage.setItem("pulse_admin_authed", "true");
            unlockDashboard();
          } else {
            if (passcodeStatus) {
              passcodeStatus.textContent = "Invalid passcode. Access denied.";
              passcodeStatus.className = "mt-2 text-xs font-semibold text-rose-500";
              passcodeStatus.classList.remove("hidden");
            }
          }
        })
        .catch(function () {
          if (val === "1526") {
            sessionStorage.setItem("pulse_admin_authed", "true");
            unlockDashboard();
          } else if (passcodeStatus) {
            passcodeStatus.textContent = "Invalid passcode. Access denied.";
            passcodeStatus.className = "mt-2 text-xs font-semibold text-rose-500";
            passcodeStatus.classList.remove("hidden");
          }
        });
      });

      passcodeInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") passcodeBtn.click();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", lockDashboard);
    }

    // Tab Navigation for all 4 admin tools (automatically re-loads dynamic content upon switching)
    function switchAdminTab(activeTab) {
      var allTabs = [
        { btn: tabProposalsBtn, sec: sectionProposals, activeClass: "bg-primary text-white font-extrabold" },
        { btn: tabSubscribersBtn, sec: sectionSubscribers, activeClass: "bg-primary text-white font-extrabold" },
        { btn: tabContentEngineBtn, sec: sectionContentEngine, activeClass: "bg-amber-500 text-white font-extrabold shadow-xs" },
        { btn: tabTalksBtn, sec: sectionTalkIdeas, activeClass: "bg-indigo-600 text-white font-extrabold shadow-xs" },
        { btn: tabWeeklyPollsBtn, sec: sectionWeeklyPolls, activeClass: "bg-emerald-600 text-white font-extrabold shadow-xs" }
      ];

      allTabs.forEach(function (t) {
        if (!t.btn || !t.sec) return;
        if (t.btn === activeTab) {
          t.btn.className = "px-4 py-2 rounded-xl text-xs border-none cursor-pointer shadow-xs transition-all flex items-center gap-2 " + t.activeClass;
          t.sec.classList.remove("hidden");
        } else {
          t.btn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-theme-light dark:bg-darkmode-theme-light text-text/80 dark:text-darkmode-text/80 hover:text-primary border border-border/60 dark:border-darkmode-border/60 cursor-pointer transition-all flex items-center gap-2";
          t.sec.classList.add("hidden");
        }
      });

      // Automatically re-render dynamic items upon switching tabs so user sees previously generated data
      if (activeTab === tabWeeklyPollsBtn) {
        renderWeeklyPollsAdminQueue();
      } else if (activeTab === tabContentEngineBtn) {
        renderContentIdeas();
        renderPermanentContentVault();
      } else if (activeTab === tabTalksBtn) {
        renderTalkIdeas();
        renderPermanentTalksVault();
      } else if (activeTab === tabProposalsBtn) {
        renderProposals();
      } else if (activeTab === tabSubscribersBtn) {
        renderSubscribers();
      }
    }

    if (tabProposalsBtn) tabProposalsBtn.addEventListener("click", function() { switchAdminTab(tabProposalsBtn); });
    if (tabSubscribersBtn) tabSubscribersBtn.addEventListener("click", function() { switchAdminTab(tabSubscribersBtn); });
    if (tabContentEngineBtn) tabContentEngineBtn.addEventListener("click", function() { switchAdminTab(tabContentEngineBtn); });
    if (tabTalksBtn) tabTalksBtn.addEventListener("click", function() { switchAdminTab(tabTalksBtn); });
    if (tabWeeklyPollsBtn) tabWeeklyPollsBtn.addEventListener("click", function() { switchAdminTab(tabWeeklyPollsBtn); });

    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-[11px]"></i> Refreshing...';
        loadProposals();
        loadSubscribers();
        setTimeout(function () {
          refreshBtn.innerHTML = '<i class="fa-solid fa-rotate-right text-[11px]"></i> Refresh';
        }, 800);
      });
    }

    /* ── Proposals Logic ── */
    function loadProposals() {
      // 1. Fetch from local storage
      var localProposals = [];
      try {
        localProposals = JSON.parse(localStorage.getItem("gcloudcafe_author_proposals") || "[]");
      } catch (e) { localProposals = []; }

      // 2. Fetch from Supabase author_proposals if exists
      fetch(config.url + "/rest/v1/author_proposals?select=*&order=created_at.desc", {
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey
        }
      })
      .then(function (res) {
        if (!res.ok) return [];
        return res.json();
      })
      .then(function (remoteProposals) {
        // Merge by ID avoiding duplicates
        var merged = [].concat(localProposals);
        if (Array.isArray(remoteProposals)) {
          remoteProposals.forEach(function (rp) {
            var exists = merged.some(function (lp) { return lp.id === rp.id; });
            if (!exists) merged.push(rp);
          });
        }
        cachedProposals = merged;
        renderProposals();
      })
      .catch(function () {
        cachedProposals = localProposals;
        renderProposals();
      });
    }

    function saveProposalsState() {
      try {
        localStorage.setItem("gcloudcafe_author_proposals", JSON.stringify(cachedProposals));
      } catch (e) {}
    }

    function renderProposals() {
      var query = (proposalsSearchInput ? proposalsSearchInput.value : "").trim().toLowerCase();
      var pendingCount = 0;
      var approvedCount = 0;
      var rejectedCount = 0;

      cachedProposals.forEach(function (p) {
        var st = p.status || "pending";
        if (st === "approved") approvedCount++;
        else if (st === "rejected") rejectedCount++;
        else pendingCount++;
      });

      if (proposalsCountBadge) proposalsCountBadge.textContent = cachedProposals.length;
      if (filterCountAll) filterCountAll.textContent = cachedProposals.length;
      if (filterCountPending) filterCountPending.textContent = pendingCount;
      if (filterCountApproved) filterCountApproved.textContent = approvedCount;
      if (filterCountRejected) filterCountRejected.textContent = rejectedCount;

      var filtered = cachedProposals.filter(function (p) {
        var st = p.status || "pending";
        if (currentProposalFilter !== "all" && st !== currentProposalFilter) return false;
        if (query) {
          var matchTitle = (p.title || "").toLowerCase().indexOf(query) !== -1;
          var matchName = (p.name || "").toLowerCase().indexOf(query) !== -1;
          var matchEmail = (p.email || "").toLowerCase().indexOf(query) !== -1;
          var matchCat = (p.category || "").toLowerCase().indexOf(query) !== -1;
          if (!matchTitle && !matchName && !matchEmail && !matchCat) return false;
        }
        return true;
      });

      if (!proposalsGrid) return;
      proposalsGrid.innerHTML = "";

      if (filtered.length === 0) {
        if (proposalsEmptyState) proposalsEmptyState.classList.remove("hidden");
        return;
      } else {
        if (proposalsEmptyState) proposalsEmptyState.classList.add("hidden");
      }

      filtered.forEach(function (item) {
        var card = document.createElement("div");
        card.className = "p-5 sm:p-6 rounded-2xl bg-body dark:bg-darkmode-body border border-border/80 dark:border-darkmode-border/80 shadow-xs space-y-4";

        var statusPill = '';
        var st = item.status || "pending";
        if (st === "approved") {
          statusPill = '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"><i class="fa-solid fa-circle-check text-[10px]"></i> Approved</span>';
        } else if (st === "rejected") {
          statusPill = '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5"><i class="fa-solid fa-circle-xmark text-[10px]"></i> Rejected</span>';
        } else {
          statusPill = '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5"><i class="fa-solid fa-clock text-[10px]"></i> Pending Review</span>';
        }

        var dateFormatted = "--";
        try {
          dateFormatted = new Date(item.created_at).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          });
        } catch (e) {}

        var sampleHtml = '';
        if (item.sample_url) {
          sampleHtml = '<div class="text-xs pt-1"><span class="text-text/50 dark:text-darkmode-text/50">Writing Sample / Profile:</span> <a href="' + escapeHtml(item.sample_url) + '" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-mono ml-1 inline-flex items-center gap-1">' + escapeHtml(item.sample_url) + ' <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a></div>';
        }

        card.innerHTML = 
          '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 dark:border-darkmode-border/60 pb-3">' +
            '<div class="flex items-center gap-2 flex-wrap">' +
              statusPill +
              '<span class="px-2 py-0.5 rounded font-mono text-[11px] bg-theme-light dark:bg-darkmode-theme-light text-text/80 dark:text-darkmode-text/80 border border-border/70 dark:border-darkmode-border/70">' + escapeHtml(item.category || "Cloud") + '</span>' +
              '<span class="font-mono text-[11px] text-text/50 dark:text-darkmode-text/50">#' + escapeHtml(item.id || "") + '</span>' +
            '</div>' +
            '<div class="text-xs font-mono text-text/60 dark:text-darkmode-text/60">' +
              '<i class="fa-regular fa-clock mr-1"></i>' + dateFormatted +
            '</div>' +
          '</div>' +

          '<div>' +
            '<h3 class="text-base sm:text-lg font-bold text-dark dark:text-darkmode-dark mb-1 leading-snug">' +
              escapeHtml(item.title || "Untitled Proposal") +
            '</h3>' +
            '<div class="flex items-center gap-2 text-xs text-text/70 dark:text-darkmode-text/70 mb-3">' +
              '<span class="font-semibold text-dark dark:text-darkmode-dark"><i class="fa-regular fa-user mr-1 text-primary"></i>' + escapeHtml(item.name || "Anonymous") + '</span>' +
              '<span>&bull;</span>' +
              '<a href="mailto:' + escapeHtml(item.email || "") + '?subject=' + encodeURIComponent("Regarding your GCloudCafe Article Proposal: " + (item.title || "")) + '" class="text-primary hover:underline font-mono">' + escapeHtml(item.email || "") + '</a>' +
              '<span class="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold ml-auto">' + escapeHtml(item.delivery_timeframe || "2-3 Weeks") + '</span>' +
            '</div>' +

            '<div class="p-4 rounded-xl bg-theme-light/60 dark:bg-darkmode-theme-light/40 border border-border/70 dark:border-darkmode-border/70 text-xs text-text/80 dark:text-darkmode-text/80 leading-relaxed font-sans whitespace-pre-line">' +
              escapeHtml(item.outline || "No outline provided.") +
            '</div>' +
            sampleHtml +
          '</div>' +

          '<div class="pt-3 border-t border-border/60 dark:border-darkmode-border/60 flex flex-wrap items-center justify-between gap-3">' +
            '<div class="flex items-center gap-2">' +
              '<button data-action="approve" data-id="' + escapeHtml(item.id) + '" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border-none cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs">' +
                '<i class="fa-solid fa-check text-[11px]"></i> Approve' +
              '</button>' +
              '<button data-action="reject" data-id="' + escapeHtml(item.id) + '" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold border-none cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs">' +
                '<i class="fa-solid fa-xmark text-[11px]"></i> Reject' +
              '</button>' +
              '<button data-action="pending" data-id="' + escapeHtml(item.id) + '" class="px-3 py-1.5 rounded-lg bg-theme-light dark:bg-darkmode-theme-light text-text/70 dark:text-darkmode-text/70 hover:text-dark dark:hover:text-white text-xs font-semibold border border-border/70 dark:border-darkmode-border/70 cursor-pointer transition-colors">' +
                'Reset' +
              '</button>' +
            '</div>' +

            '<div class="flex items-center gap-2 ml-auto">' +
              '<button data-action="copy-email" data-email="' + escapeHtml(item.email || "") + '" class="px-2.5 py-1.5 rounded-lg bg-theme-light dark:bg-darkmode-theme-light text-text/70 dark:text-darkmode-text/70 hover:text-primary text-xs font-bold border border-border/70 dark:border-darkmode-border/70 cursor-pointer transition-colors flex items-center gap-1" title="Copy Author Email">' +
                '<i class="fa-regular fa-copy text-[11px]"></i> Copy Email' +
              '</button>' +
              '<button data-action="delete" data-id="' + escapeHtml(item.id) + '" class="px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 text-xs font-bold border-none bg-transparent cursor-pointer transition-colors" title="Delete Proposal">' +
                '<i class="fa-regular fa-trash-can text-[11px]"></i>' +
              '</button>' +
            '</div>' +
          '</div>';

        proposalsGrid.appendChild(card);
      });

      // Attach card action listeners
      proposalsGrid.querySelectorAll("[data-action]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var action = btn.getAttribute("data-action");
          var id = btn.getAttribute("data-id");
          var email = btn.getAttribute("data-email");

          if (action === "approve" || action === "reject" || action === "pending") {
            var target = cachedProposals.find(function (p) { return p.id === id; });
            if (target) {
              var newStatus = (action === "approve") ? "approved" : ((action === "reject") ? "rejected" : "pending");
              target.status = newStatus;
              saveProposalsState();
              renderProposals();
              // Try sync to Supabase
              fetch(config.url + "/rest/v1/author_proposals?id=eq." + encodeURIComponent(id), {
                method: "PATCH",
                headers: {
                  "apikey": config.anonKey,
                  "Authorization": "Bearer " + config.anonKey,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
              }).catch(function () {});
            }
          } else if (action === "copy-email") {
            if (email) {
              navigator.clipboard.writeText(email).then(function () {
                var orig = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check text-emerald-500 text-[11px]"></i> Copied!';
                setTimeout(function () { btn.innerHTML = orig; }, 1500);
              });
            }
          } else if (action === "delete") {
            if (confirm("Are you sure you want to delete this proposal?")) {
              cachedProposals = cachedProposals.filter(function (p) { return p.id !== id; });
              saveProposalsState();
              renderProposals();
              fetch(config.url + "/rest/v1/author_proposals?id=eq." + encodeURIComponent(id), {
                method: "DELETE",
                headers: {
                  "apikey": config.anonKey,
                  "Authorization": "Bearer " + config.anonKey
                }
              }).catch(function () {});
            }
          }
        });
      });
    }

    // Filter Buttons
    document.querySelectorAll("[data-proposal-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentProposalFilter = btn.getAttribute("data-proposal-filter");
        document.querySelectorAll("[data-proposal-filter]").forEach(function (b) {
          b.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-theme-light dark:bg-darkmode-theme-light text-text/80 dark:text-darkmode-text/80 border border-border/70 dark:border-darkmode-border/70 cursor-pointer whitespace-nowrap";
        });
        btn.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-primary text-white shadow-xs cursor-pointer border-none whitespace-nowrap";
        renderProposals();
      });
    });

    if (proposalsSearchInput) {
      proposalsSearchInput.addEventListener("input", renderProposals);
    }

    // Add Demo Proposal
    function addDemoProposal() {
      var sampleId = "PROP-" + Math.floor(1000 + Math.random() * 9000);
      var sample = {
        id: sampleId,
        created_at: new Date().toISOString(),
        name: "DevOps Engineer",
        email: "practitioner." + Math.floor(Math.random() * 1000) + "@gcloudcafe.com",
        category: "Kubernetes",
        delivery_timeframe: "1-2 Weeks",
        title: "Hands-on Zero Downtime GKE Cluster Upgrades with Gateway API Canary Routing",
        outline: "1. Motivation: Why standard rolling kubelet upgrades drop TLS long-lived gRPC streams.\n2. Architecture: Envoy Gateway vs classic Ingress Controller.\n3. Step-by-step Terraform and YAML manifests for automated canary traffic shifting.\n4. Real production load test results and Prometheus metrics.",
        sample_url: "https://github.com/gcloudcafe",
        status: "pending"
      };
      cachedProposals.unshift(sample);
      saveProposalsState();
      renderProposals();
    }

    if (seedDemoBtn) seedDemoBtn.addEventListener("click", addDemoProposal);
    if (emptyDemoBtn) emptyDemoBtn.addEventListener("click", addDemoProposal);

    /* ── Subscribers Logic ── */
    function loadSubscribers() {
      if (!subscribersTableBody) return;
      subscribersTableBody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-text/60 dark:text-darkmode-text/60 font-medium"><i class="fa-solid fa-spinner fa-spin text-primary mr-2"></i> Loading subscribers from database...</td></tr>';

      fetch(config.url + "/rest/v1/newsletter_subscribers?select=*&order=created_at.desc", {
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey
        }
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        cachedSubscribers = Array.isArray(data) ? data : [];
        renderSubscribers();
      })
      .catch(function (err) {
        subscribersTableBody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-rose-500 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Failed to connect to subscribers database.</td></tr>';
      });
    }

    function renderSubscribers() {
      var query = (subscribersSearchInput ? subscribersSearchInput.value : "").trim().toLowerCase();

      var filtered = cachedSubscribers.filter(function (s) {
        if (!query) return true;
        return (s.email || "").toLowerCase().indexOf(query) !== -1;
      });

      if (subscribersCountBadge) subscribersCountBadge.textContent = cachedSubscribers.length;
      if (subscribersStatTotal) subscribersStatTotal.textContent = cachedSubscribers.length;

      if (subscribersStatLatest) {
        if (cachedSubscribers.length > 0 && cachedSubscribers[0].created_at) {
          try {
            subscribersStatLatest.textContent = new Date(cachedSubscribers[0].created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            });
          } catch (e) {
            subscribersStatLatest.textContent = "Recently";
          }
        } else {
          subscribersStatLatest.textContent = "None yet";
        }
      }

      if (subscribersShowingCount) {
        subscribersShowingCount.textContent = "Showing " + filtered.length + " of " + cachedSubscribers.length;
      }

      if (!subscribersTableBody) return;
      subscribersTableBody.innerHTML = "";

      if (filtered.length === 0) {
        subscribersTableBody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-text/60 dark:text-darkmode-text/60 font-medium">No subscriber emails match your query.</td></tr>';
        return;
      }

      filtered.forEach(function (sub, idx) {
        var tr = document.createElement("tr");
        tr.className = "hover:bg-theme-light/40 dark:hover:bg-darkmode-theme-light/20 transition-colors";

        var dateStr = "--";
        if (sub.created_at) {
          try {
            dateStr = new Date(sub.created_at).toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            });
          } catch (e) { dateStr = sub.created_at; }
        }

        tr.innerHTML = 
          '<td class="py-3 px-4 text-center font-mono text-text/50 dark:text-darkmode-text/50">' + (idx + 1) + '</td>' +
          '<td class="py-3 px-4 font-mono font-medium text-dark dark:text-darkmode-dark flex items-center gap-2">' +
            '<i class="fa-regular fa-envelope text-primary/70 text-[11px]"></i>' +
            '<span>' + escapeHtml(sub.email || "") + '</span>' +
          '</td>' +
          '<td class="py-3 px-4 font-mono text-text/60 dark:text-darkmode-text/60">' + dateStr + '</td>' +
          '<td class="py-3 px-4 text-center">' +
            '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">Active</span>' +
          '</td>' +
          '<td class="py-3 px-4 text-right">' +
            '<button data-sub-copy="' + escapeHtml(sub.email || "") + '" class="px-2.5 py-1 rounded bg-theme-light dark:bg-darkmode-theme-light text-text/70 dark:text-darkmode-text/70 hover:text-primary text-xs font-bold border border-border/70 dark:border-darkmode-border/70 cursor-pointer transition-colors" title="Copy email">' +
              '<i class="fa-regular fa-copy text-[11px]"></i>' +
            '</button>' +
          '</td>';

        subscribersTableBody.appendChild(tr);
      });

      // Individual copy buttons
      subscribersTableBody.querySelectorAll("[data-sub-copy]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var em = btn.getAttribute("data-sub-copy");
          if (em) {
            navigator.clipboard.writeText(em).then(function () {
              var orig = btn.innerHTML;
              btn.innerHTML = '<i class="fa-solid fa-check text-emerald-500 text-[11px]"></i>';
              setTimeout(function () { btn.innerHTML = orig; }, 1500);
            });
          }
        });
      });
    }

    if (subscribersSearchInput) {
      subscribersSearchInput.addEventListener("input", renderSubscribers);
    }

    // Copy All Subscribers
    if (copyAllSubscribersBtn) {
      copyAllSubscribersBtn.addEventListener("click", function () {
        if (!cachedSubscribers.length) return;
        var emailsList = cachedSubscribers.map(function (s) { return s.email; }).filter(Boolean).join(", ");
        navigator.clipboard.writeText(emailsList).then(function () {
          if (exportToastMsg) {
            exportToastMsg.textContent = "Copied " + cachedSubscribers.length + " emails to clipboard!";
            exportToastMsg.classList.remove("hidden");
            setTimeout(function () { exportToastMsg.classList.add("hidden"); }, 2500);
          }
        });
      });
    }



    /* ══════════════════════════════════════════════════════════ */
    /* ── SECTION 3 & 4: CONTENT ENGINE & TALK SPEAKER HUB ─── */
    /* ══════════════════════════════════════════════════════════ */

    // Ephemeral & Permanent Storage Keys
    var KEY_EPHEMERAL_CONTENT = "gcloudcafe_ephemeral_content_ideas";
    var KEY_PERMANENT_CONTENT = "gcloudcafe_permanent_content_ideas";
    var KEY_EPHEMERAL_TALKS = "gcloudcafe_ephemeral_talk_ideas";
    var KEY_PERMANENT_TALKS = "gcloudcafe_permanent_talk_ideas";

    // Rich Curated Grounded Content Topics Pool
    var defaultContentCurations = {
      "all": [
        {
          id: "rec_k8s_gateway",
          title: "Kubernetes Gateway API in Production: Migrating from Ingress with Zero Downtime",
          category: "Kubernetes",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 97,
          whyViral: "Gateway API reached GA and Kubernetes SIG-Network is urging migration. Production teams struggle with HTTPRoute and TLS cross-namespace delegation.",
          keywords: "kubernetes gateway api, migrate ingress to gateway api, httproute example, tls gateway api",
          groundingRefs: [
            { title: "Kubernetes KEP-1907: Gateway API Spec", url: "https://github.com/kubernetes/enhancements/issues/1907" },
            { title: "Gateway API v1.1 Release Notes", url: "https://gateway-api.sigs.k8s.io/" }
          ],
          outline: [
            "Architectural shift: Ingress vs Gateway API separation of roles (Infra vs App dev)",
            "Step-by-step canary migration using Envoy Gateway and HTTPRoute traffic weights",
            "Debugging cross-namespace ReferenceGrants and TLS certificate routing"
          ]
        },
        {
          id: "rec_gemini_adk",
          title: "Building Multi-Agent Workflows with Gemini Enterprise Agent Platform & Python",
          category: "AI Agents",
          categoryType: "🔥 Latest Viral & Trending",
          viralityScore: 95,
          whyViral: "Enterprise AI shifts from raw chat prompts to deterministic multi-agent systems with schema-constrained JSON outputs.",
          keywords: "gemini enterprise agent platform, vertex ai multi agent, pydantic gemini python, express mode",
          groundingRefs: [
            { title: "arXiv:2403.05530: Gemini 1.5 Architecture", url: "https://arxiv.org/abs/2403.05530" },
            { title: "Google Cloud: Gemini Agent Platform Documentation", url: "https://cloud.google.com/vertex-ai" }
          ],
          outline: [
            "Single prompt vs Agentic loop: State management and tool calling",
            "Express Mode bootstrapping with ADC vs API key credentials",
            "Production schema enforcement with Pydantic and retry backoffs"
          ]
        },
        {
          id: "rec_openshift_storage",
          title: "OpenShift 4 Storage Troubleshooting: Recovering from Multi-Attach Errors (VolumeLocked)",
          category: "OpenShift",
          categoryType: "🧪 Production Runbook & War Story",
          viralityScore: 94,
          whyViral: "Volume attachment timeout is the #1 reason stateful pods get stuck in ContainerCreating in enterprise OpenShift clusters.",
          keywords: "openshift storage volume locked error, rwo pvc containercreating, ceph odf attach error",
          groundingRefs: [
            { title: "Kubernetes CSI Spec v1.5", url: "https://github.com/container-storage-interface/spec" },
            { title: "Red Hat OpenShift Storage Troubleshooting Guide", url: "https://docs.openshift.com/" }
          ],
          outline: [
            "Root cause: CSI node driver detachment timeouts and kubelet unmount loops",
            "Step-by-step force-detach runbook using oc and volumeattachment CRDs",
            "Long-term remediation: Pod disruption budgets and ReadWriteMany CSI configuration"
          ]
        },
        {
          id: "rec_tls_quantum",
          title: "Post-Quantum Cryptography in TLS: Benchmarking X25519MLKEM768 in NGINX & Cloudflare",
          category: "Security",
          categoryType: "🎯 High Search Growth / Spec Finalized",
          viralityScore: 92,
          whyViral: "NIST standardized post-quantum algorithms (ML-KEM). Major browsers now negotiate hybrid post-quantum key exchange by default.",
          keywords: "post quantum tls 1.3, ml kem 768 benchmark, hybrid key exchange, nginx openssl 3.3",
          groundingRefs: [
            { title: "NIST FIPS 203: ML-KEM Standard", url: "https://csrc.nist.gov/pubs/fips/203/final" },
            { title: "IETF RFC 8446: TLS Protocol v1.3", url: "https://datatracker.ietf.org/doc/html/rfc8446" }
          ],
          outline: [
            "How hybrid post-quantum key exchange works (ECDH + Kyber / ML-KEM)",
            "Packet size impact: Measuring TCP handshake latency over real mobile networks",
            "Configuring OpenSSL 3.x and Ingress controllers for post-quantum readiness"
          ]
        },
        {
          id: "rec_gcp_bigquery",
          title: "BigQuery Storage Billing Optimization: Physical vs Logical Storage Deep Dive",
          category: "Google Cloud",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 90,
          whyViral: "Google Cloud introduced physical storage billing which can cut BigQuery storage costs by up to 50% for compressed datasets.",
          keywords: "bigquery physical vs logical storage, gcp cost optimization, bq partitioning clustering",
          groundingRefs: [
            { title: "Google Research: Capacitor Columnar Storage (VLDB)", url: "https://research.google/pubs/pub45778/" },
            { title: "BigQuery Documentation: Storage Billing Models", url: "https://cloud.google.com/bigquery/pricing" }
          ],
          outline: [
            "Understanding Capacitor compression ratios on columnar BigQuery tables",
            "Querying INFORMATION_SCHEMA.TABLE_STORAGE to evaluate cost savings",
            "Safe transition script without interrupting BI queries"
          ]
        }
      ],
      "kubernetes": [
        {
          id: "rec_k8s_gateway_api",
          title: "Kubernetes Gateway API: Production HTTPRoute Traffic Splitting & Canary Deployments",
          category: "Kubernetes",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 96,
          whyViral: "Gateway API is replacing Ingress controllers across all major managed Kubernetes distributions.",
          keywords: "kubernetes gateway api canary, envoy gateway httproute, k8s traffic splitting",
          groundingRefs: [
            { title: "Kubernetes KEP-1907 Gateway API", url: "https://github.com/kubernetes/enhancements/issues/1907" }
          ],
          outline: [
            "HTTPRoute vs classic Ingress annotations: cleaner multi-service traffic weights",
            "Blue/Green and progressive Canary deployments with Envoy Gateway",
            "Cross-namespace ReferenceGrant security boundaries"
          ]
        },
        {
          id: "rec_k8s_dns_latency",
          title: "Debugging Silent 5-Second DNS Latency Spikes in CoreDNS & Kubernetes",
          category: "Kubernetes",
          categoryType: "🧪 Production Runbook & War Story",
          viralityScore: 95,
          whyViral: "The ndots:5 issue continues to silently degrade microservice latency across production clusters.",
          keywords: "coredns 5s latency, ndots 5 kubernetes, coredns autopath packet drop",
          groundingRefs: [
            { title: "CoreDNS Architecture & Performance", url: "https://coredns.io/manual/toc/" }
          ],
          outline: [
            "Why resolv.conf ndots:5 causes 4 sequential failed queries for external domains",
            "Configuring NodeLocal DNSCache and CoreDNS autopath plugin",
            "Benchmarking DNS query latencies under synthetic 10,000 QPS load"
          ]
        },
        {
          id: "rec_k8s_ebpf_cilium",
          title: "eBPF-Powered Kubernetes Networking: Replacing Kube-Proxy with Cilium",
          category: "Kubernetes",
          categoryType: "🔥 Latest Viral & Trending",
          viralityScore: 94,
          whyViral: "Iptables overhead on 1,000+ node clusters is driving enterprise adoption of eBPF and Cilium.",
          keywords: "ebpf cilium kube-proxy replacement, kubernetes packet tracing, cilium hubble",
          groundingRefs: [
            { title: "Cilium eBPF Architecture Spec", url: "https://docs.cilium.io/" }
          ],
          outline: [
            "Why large iptables rulesets cause O(N) packet traversal bottlenecks",
            "Direct server return (DSR) and socket-level load balancing with eBPF",
            "Tracing dropped packets with Hubble CLI in real time"
          ]
        },
        {
          id: "rec_k8s_dra",
          title: "Dynamic Resource Allocation (DRA) in Kubernetes: Next-Gen GPU & Accelerator Scheduling",
          category: "Kubernetes",
          categoryType: "🎯 High Search Growth / Spec Finalized",
          viralityScore: 92,
          whyViral: "Standard Device Plugins cannot handle dynamic GPU slicing or multi-node tensor interconnects for LLM inference workloads.",
          keywords: "kubernetes dra gpu scheduling, dynamic resource allocation k8s, kep 3063",
          groundingRefs: [
            { title: "Kubernetes KEP-3063: Dynamic Resource Allocation", url: "https://github.com/kubernetes/enhancements/issues/3063" }
          ],
          outline: [
            "Device Plugins vs DRA architecture: ResourceClaims and ResourceClaimTemplates",
            "Allocating NVIDIA Multi-Instance GPUs (MIG) dynamically per pod",
            "Benchmarking scheduling throughput for batch AI inference pipelines"
          ]
        },
        {
          id: "rec_k8s_pdb",
          title: "PodDisruptionBudgets and Eviction API: Preventing Cascading Outages During Cluster Upgrades",
          category: "Kubernetes",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 91,
          whyViral: "Aggressive node draining during automated GKE/EKS upgrades frequently violates quorum in stateful workloads.",
          keywords: "poddisruptionbudget best practices, pdb eviction api, zero downtime node drain",
          groundingRefs: [
            { title: "Kubernetes Disruptions Architecture", url: "https://kubernetes.io/docs/concepts/workloads/pods/disruptions/" }
          ],
          outline: [
            "How the Eviction API checks minAvailable and maxUnavailable before evicting pods",
            "Configuring PDBs for etcd, Kafka, and Redis clusters to avoid split-brain",
            "Writing safe cordon and drain automated CI/CD pipelines"
          ]
        }
      ],
      "google-cloud": [
        {
          id: "rec_gcp_spanner_dual",
          title: "Google Cloud Spanner Dual-Region Configurations: Achieving 99.999% SLA at Lower Cost",
          category: "Google Cloud",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 95,
          whyViral: "Dual-region instances offer five-nines availability without paying the higher latency and slot costs of multi-region replication.",
          keywords: "cloud spanner dual region, spanner high availability, gcp database architecture",
          groundingRefs: [
            { title: "Google Spanner TrueTime Paper (OSDI)", url: "https://research.google/pubs/pub39966/" }
          ],
          outline: [
            "Leader election and TrueTime commit wait mechanics across dual regions",
            "Configuring witness nodes for automatic zero-RPO failovers",
            "Read-write transaction latency benchmarks vs multi-region configurations"
          ]
        },
        {
          id: "rec_gcp_cloudrun_vpc",
          title: "Direct VPC Egress for Cloud Run: Eliminating Serverless VPC Access Connectors",
          category: "Google Cloud",
          categoryType: "🔥 Latest Viral & Trending",
          viralityScore: 94,
          whyViral: "Direct VPC egress drastically cuts serverless latency and eliminates costly Connector VMs.",
          keywords: "cloud run direct vpc egress, serverless vpc connector replacement, private cloud sql run",
          groundingRefs: [
            { title: "Google Cloud Run Networking Architecture", url: "https://cloud.google.com/run/docs/configuring/vpc-direct-vpc" }
          ],
          outline: [
            "Legacy Serverless VPC Access Connectors vs Direct VPC Egress performance",
            "Connecting Cloud Run containers to Private Service Access (Cloud SQL & Memorystore)",
            "Terraform configuration for subnets with private Google access"
          ]
        },
        {
          id: "rec_gcp_bigquery_phys",
          title: "BigQuery Physical Storage Billing: Saving 50% on Petabyte Columnar Tables",
          category: "Google Cloud",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 93,
          whyViral: "Capacitor compression ratios make physical storage far cheaper than active logical pricing.",
          keywords: "bigquery physical storage billing, capacitor compression, gcp finops bq",
          groundingRefs: [
            { title: "Google Research: Capacitor Columnar Storage (VLDB)", url: "https://research.google/pubs/pub45778/" }
          ],
          outline: [
            "Comparing physical compressed bytes against uncompressed logical bytes",
            "Querying INFORMATION_SCHEMA.TABLE_STORAGE to forecast cost reduction",
            "Automated transition script with zero query downtime"
          ]
        },
        {
          id: "rec_gcp_workload_id",
          title: "GKE Workload Identity Federation: Eliminating Long-Lived Service Account Keys",
          category: "Google Cloud",
          categoryType: "🧪 Production Runbook & War Story",
          viralityScore: 92,
          whyViral: "Leaked service account JSON keys remain the primary vector for GCP security breaches.",
          keywords: "gke workload identity federation, eliminate gcp service account json, gke iam role binding",
          groundingRefs: [
            { title: "Google Cloud Workload Identity Federation Guide", url: "https://cloud.google.com/iam/docs/workload-identity-federation" }
          ],
          outline: [
            "How Kubernetes ServiceAccounts map to Google Service Accounts via OIDC",
            "Automating IAM policy bindings with Terraform and Kustomize",
            "Audit scripts to detect and revoke orphaned JSON service account keys"
          ]
        },
        {
          id: "rec_gcp_vertex_agents",
          title: "Vertex AI Agent Platform: Bootstrapping Stateful Multi-Tool Agent Workflows",
          category: "Google Cloud",
          categoryType: "🔥 Latest Viral & Trending",
          viralityScore: 91,
          whyViral: "Enterprises want turnkey agents with grounding and tool calling directly inside Google Cloud VPCs.",
          keywords: "vertex ai agent builder, gemini agent enterprise platform, adc vertex python",
          groundingRefs: [
            { title: "Google Cloud: Vertex AI Agent Architecture", url: "https://cloud.google.com/vertex-ai" }
          ],
          outline: [
            "Agent state orchestration: Memory stores and session management",
            "Secure tool execution via Cloud Run private endpoints",
            "Latency and cost benchmarking across Gemini 1.5 Flash vs Pro"
          ]
        }
      ],
      "ai-agents": [
        {
          id: "rec_ai_pydantic_schema",
          title: "Schema-Constrained LLM Generation: Enforcing Strict Pydantic Output in Production",
          category: "AI Agents",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 96,
          whyViral: "Downstream microservices crash when LLMs return unstructured or hallucinated JSON keys.",
          keywords: "pydantic json schema llm, gemini response_schema python, deterministic agent output",
          groundingRefs: [
            { title: "arXiv:2403.05530: Gemini Model Architecture", url: "https://arxiv.org/abs/2403.05530" }
          ],
          outline: [
            "Grammar-constrained decoding vs prompt engineering",
            "Implementing nested Pydantic models with Gemini responseSchema",
            "Self-correcting validation loops with AST parsing and automated retries"
          ]
        },
        {
          id: "rec_ai_tool_calling",
          title: "Autonomous Tool Calling: Preventing Infinite Tool Execution Loops in Multi-Agent Systems",
          category: "AI Agents",
          categoryType: "🧪 Production Runbook & War Story",
          viralityScore: 95,
          whyViral: "Unbounded agent loops can rack up thousands of dollars in API bills and freeze worker processes.",
          keywords: "agent loop termination, tool calling guardrails, langgraph multi agent limits",
          groundingRefs: [
            { title: "arXiv:2305.15334: Gorilla Tool Calling Architecture", url: "https://arxiv.org/abs/2305.15334" }
          ],
          outline: [
            "Loop detection heuristics: cycle detection and token burn monitors",
            "State machine limits: max_iterations and circuit breakers",
            "Writing non-blocking async tool dispatchers with timeout fallbacks"
          ]
        },
        {
          id: "rec_ai_rag_evaluation",
          title: "Evaluating RAG Retrieval Quality: Measuring Context Precision and Recall with Ragas",
          category: "AI Agents",
          categoryType: "🎯 High Search Growth / Spec Finalized",
          viralityScore: 93,
          whyViral: "Vector search precision is the bottleneck in production AI agent knowledge grounding.",
          keywords: "rag evaluation ragas, context precision recall, chunking benchmark vector search",
          groundingRefs: [
            { title: "arXiv:2309.15217: Ragas Automated RAG Evaluation", url: "https://arxiv.org/abs/2309.15217" }
          ],
          outline: [
            "Semantic chunking strategies vs fixed-token chunking",
            "Automated evaluation metrics: Faithfulness, Answer Relevance, and Context Recall",
            "Continuous integration test suite for knowledge base updates"
          ]
        },
        {
          id: "rec_ai_local_quant",
          title: "Running Enterprise LLMs Locally: vLLM, Speculative Decoding, and KV Cache Optimization",
          category: "AI Agents",
          categoryType: "🔥 Latest Viral & Trending",
          viralityScore: 92,
          whyViral: "Data privacy regulations are forcing enterprises to host models on private GKE/EKS clusters.",
          keywords: "vllm speculative decoding, pagedattention kv cache, private llm hosting k8s",
          groundingRefs: [
            { title: "vLLM: Efficient Memory Management with PagedAttention (SOSP)", url: "https://arxiv.org/abs/2309.06180" }
          ],
          outline: [
            "PagedAttention mechanics: eliminating memory fragmentation in GPU VRAM",
            "Speculative decoding: drafting with small models to double throughput",
            "Deploying vLLM container workloads with autoscaling on GKE"
          ]
        },
        {
          id: "rec_ai_agent_eval",
          title: "Production Multi-Agent Observability: Tracing Token Latency & Steps with OpenTelemetry",
          category: "AI Agents",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 90,
          whyViral: "Debugging multi-turn agent conversations requires distributed tracing down to tool invocations.",
          keywords: "opentelemetry ai agent tracing, arize phoenix otel, llm observability latency",
          groundingRefs: [
            { title: "OpenTelemetry GenAI Semantic Conventions", url: "https://opentelemetry.io/docs/specs/semconv/gen-ai/" }
          ],
          outline: [
            "Mapping agent graph execution steps to OpenTelemetry spans",
            "Capturing input/output token metrics and tool latencies in Prometheus",
            "Visualizing execution bottlenecks and retries in Jaeger"
          ]
        }
      ],
      "openshift": [
        {
          id: "rec_ocp_multitenancy",
          title: "OpenShift 4 Multi-Tenancy Architecture: Project Request Templates and Quota Isolation",
          category: "OpenShift",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 96,
          whyViral: "Ungoverned self-service in large enterprise OpenShift clusters leads to noisy neighbor outages.",
          keywords: "openshift project request templates, clusterresourcequota ocp4, multitenant isolation openshift",
          groundingRefs: [
            { title: "Red Hat OpenShift Multi-Tenancy Architecture Guide", url: "https://cloud.redhat.com/architecture/" }
          ],
          outline: [
            "Customizing project-request templates to inject default NetworkPolicies and LimitRanges",
            "Configuring ClusterResourceQuotas across groups of developer namespaces",
            "Automated tenant onboarding via GitOps pipelines"
          ]
        },
        {
          id: "rec_ocp_storage_trouble",
          title: "Resolving OpenShift 4 Multi-Attach Storage Locks (VolumeAttachment Stuck)",
          category: "OpenShift",
          categoryType: "🧪 Production Runbook & War Story",
          viralityScore: 95,
          whyViral: "CSI volume attachment timeouts are the most common cause of ContainerCreating stalls in OCP.",
          keywords: "openshift volumeattachment stuck, csi attach error rwo, openshift storage remediation",
          groundingRefs: [
            { title: "Kubernetes CSI Spec v1.5", url: "https://github.com/container-storage-interface/spec" }
          ],
          outline: [
            "Analyzing Kubelet unmount loops vs cloud CSI attachment timeouts",
            "Safely force-detaching VolumeAttachment resources using oc patch",
            "Remediation: PDB configurations and Ceph/ODF ReadWriteMany settings"
          ]
        },
        {
          id: "rec_ocp_ex280",
          title: "EX280 Exam Mastery: 16 Essential Drills for Red Hat Certified OpenShift Administrator",
          category: "OpenShift",
          categoryType: "🎯 High Search Growth / Spec Finalized",
          viralityScore: 94,
          whyViral: "Engineers taking the hands-on EX280 exam need practical speed drills to pass under the 3-hour limit.",
          keywords: "ex280 exam drills, openshift administrator certification, ex280 rhcsa ocp4",
          groundingRefs: [
            { title: "Red Hat Certified Specialist in OpenShift Administration (EX280)", url: "https://www.redhat.com/en/services/training/ex280" }
          ],
          outline: [
            "Essential oc CLI shortcuts and dry-run manifest generation",
            "Role bindings, HTPasswd identity providers, and machine config pools",
            "Storage provisioning and troubleshooting exercises"
          ]
        },
        {
          id: "rec_ocp_gitops",
          title: "OpenShift GitOps with ArgoCD: Declarative Cluster Config & Zero-Drift Governance",
          category: "OpenShift",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 92,
          whyViral: "Managing cluster configurations manually across multiple OpenShift clusters causes configuration drift.",
          keywords: "openshift gitops argocd, zero drift cluster governance, app of apps pattern ocp",
          groundingRefs: [
            { title: "OpenShift GitOps Documentation", url: "https://docs.openshift.com/container-platform/latest/cicd/gitops/understanding-openshift-gitops.html" }
          ],
          outline: [
            "App-of-Apps architectural pattern for multi-cluster rollout",
            "Managing secrets securely in Git with Sealed Secrets and Vault",
            "Automated sync-wave ordering for Operators and Custom Resources"
          ]
        },
        {
          id: "rec_ocp_egress",
          title: "OpenShift Egress Firewalls & EgressIPs: Enterprise Perimeter Security",
          category: "OpenShift",
          categoryType: "🧪 Production Runbook & War Story",
          viralityScore: 91,
          whyViral: "Corporate compliance requires outbound container traffic to route through predictable, static firewall IPs.",
          keywords: "openshift egressip configuration, ocp egressnetworkpolicy, static outbound ip k8s",
          groundingRefs: [
            { title: "OVN-Kubernetes Egress Architecture", url: "https://github.com/ovn-org/ovn-kubernetes" }
          ],
          outline: [
            "OVN-Kubernetes CNI packet forwarding for egress IP assignment",
            "Configuring EgressNetworkPolicy to restrict external API access",
            "High availability failover mechanics for node-hosted EgressIPs"
          ]
        }
      ],
      "tls-security": [
        {
          id: "rec_sec_pqc_bench",
          title: "Benchmarking Post-Quantum Hybrid TLS 1.3: Latency & Packet Overhead with ML-KEM",
          category: "Security",
          categoryType: "🎯 High Search Growth / Spec Finalized",
          viralityScore: 96,
          whyViral: "NIST's publication of FIPS 203 has triggered widespread browser and CDN adoption of post-quantum TLS.",
          keywords: "post quantum tls 1.3 benchmark, ml kem 768 packet size, x25519mlkem768 handshake",
          groundingRefs: [
            { title: "NIST FIPS 203: ML-KEM Standard", url: "https://csrc.nist.gov/pubs/fips/203/final" },
            { title: "IETF RFC 8446: TLS 1.3 Specification", url: "https://datatracker.ietf.org/doc/html/rfc8446" }
          ],
          outline: [
            "Cryptographic breakdown: ECDH + Kyber / ML-KEM-768 hybrid key exchange",
            "Measuring initial flight packet fragmentation across lossy mobile networks",
            "OpenSSL 3.3 and NGINX configuration guide for production readiness"
          ]
        },
        {
          id: "rec_sec_spiffe_spire",
          title: "Zero-Trust Service Mesh Authentication: SPIFFE/SPIRE in Multi-Cluster Kubernetes",
          category: "Security",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 95,
          whyViral: "Static API keys and shared secrets are being replaced by cryptographic cryptographic workload identities.",
          keywords: "spiffe spire multi cluster, workload identity mTLS, spire node agent cert rotation",
          groundingRefs: [
            { title: "SPIFFE Specification & Architecture", url: "https://spiffe.io/" }
          ],
          outline: [
            "Workload attestation: How SPIRE node agents verify pod UID and namespace",
            "Automated X.509 SVID issuance and microsecond rotation",
            "Federated cross-cluster trust domains without shared root CAs"
          ]
        },
        {
          id: "rec_sec_cert_manager",
          title: "Automated Certificate Management in Kubernetes: Zero-Downtime Let's Encrypt Rotation",
          category: "Security",
          categoryType: "🧪 Production Runbook & War Story",
          viralityScore: 94,
          whyViral: "Expired TLS certificates remain a top cause of sudden customer-facing production outages.",
          keywords: "cert-manager lets encrypt zero downtime, acme dns01 ingress certs, vault pki k8s",
          groundingRefs: [
            { title: "cert-manager Architecture & Design", url: "https://cert-manager.io/docs/" }
          ],
          outline: [
            "Configuring ClusterIssuers with ACME DNS-01 and HTTP-01 challenges",
            "Integrating HashiCorp Vault PKI for internal microservice mTLS",
            "Setting up Prometheus alerts for certificates nearing expiration"
          ]
        },
        {
          id: "rec_sec_sigstore",
          title: "Supply Chain Security with Sigstore: Keyless Container Signing with Cosign in CI/CD",
          category: "Security",
          categoryType: "🔥 Latest Viral & Trending",
          viralityScore: 93,
          whyViral: "Securing the software supply chain against image tampering is now mandated by federal cybersecurity standards.",
          keywords: "cosign keyless signing github actions, sigstore fulcio rekor, slsa level 3 containers",
          groundingRefs: [
            { title: "Sigstore Architecture Spec", url: "https://www.sigstore.dev/" }
          ],
          outline: [
            "How keyless signing works: OIDC tokens, Fulcio CA, and Rekor transparency log",
            "Signing container images automatically in GitHub Actions pipelines",
            "Enforcing image signature admission verification in Kubernetes using Kyverno"
          ]
        },
        {
          id: "rec_sec_mtls_envoy",
          title: "Deep Dive into Envoy mTLS: Handshake Inspection, Cipher Negotiation, and ALPN",
          category: "Security",
          categoryType: "🌲 Evergreen Architectural Core",
          viralityScore: 91,
          whyViral: "Engineers troubleshooting service mesh communication need deep protocol-level understanding of Envoy TLS filters.",
          keywords: "envoy mtls handshake inspection, alpn h2 negotiation, openssl s_client envoy debug",
          groundingRefs: [
            { title: "Envoy Proxy TLS Architecture", url: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/security/ssl" }
          ],
          outline: [
            "Tracing TLS 1.3 ClientHello, ServerHello, and CertificateVerify in Envoy access logs",
            "Application Layer Protocol Negotiation (ALPN) for HTTP/2 and gRPC streams",
            "Diagnosing certificate verification errors and hostname mismatch panics"
          ]
        }
      ]
    };

    // Rich Curated Conference Talk Proposals with Grounding Research & Author Perspective
    // Content aliases to match single.html dropdown options exactly
    defaultContentCurations["k8s-openshift"] = defaultContentCurations["kubernetes"] || defaultContentCurations["all"];
    defaultContentCurations["gcp-data"] = defaultContentCurations["google-cloud"] || defaultContentCurations["all"];

    var defaultTalkCurations = {
      "cloud-native": [
        {
          id: "talk_tls_post_quantum",
          title: "Zero-Trust at Quantum Speed: Implementing Hybrid TLS 1.3 in Cloud-Native Mesh",
          format: "45-min Technical Deep Dive",
          level: "Intermediate / Advanced",
          audience: "Cloud Architects, SREs, Security Engineers",
          categoryType: "🌲 Evergreen Architectural Core",
          whyReviewersAccept: "Zero vendor marketing. Delivers real Wireshark packet captures, microsecond latency benchmarks, and copy-paste YAML configs for immediate production impact.",
          abstract: "As NIST finalizes post-quantum standards, modern distributed systems must prepare for 'harvest-now, decrypt-later' threats. In this session, we dissect the hybrid X25519MLKEM768 key exchange mechanism in TLS 1.3. We inspect live packet captures, analyze real latency trade-offs on Kubernetes Ingresses, and deliver a production-ready blueprint for automating mTLS certificates without service disruption.",
          groundingRefs: [
            { title: "NIST FIPS 203 ML-KEM Standard", url: "https://csrc.nist.gov/pubs/fips/203/final" },
            { title: "IETF RFC 8446 TLS 1.3 Spec", url: "https://datatracker.ietf.org/doc/html/rfc8446" },
            { title: "arXiv:2405.02104: PQC in Service Meshes", url: "https://arxiv.org/abs/2405.02104" }
          ],
          takeaways: [
            "Understand how hybrid post-quantum key exchange prevents cryptographic obsolescence",
            "Benchmark packet size overhead (1,184-byte keys) and latency impacts on live proxies",
            "Implement automated certificate rotation in Kubernetes using cert-manager"
          ],
          slidesOutline: [
            "Slide 1-10: The Harvest-Now Decrypt-Later threat model & TLS 1.3 handshake packet breakdown",
            "Slide 11-25: Benchmarking Envoy & NGINX handshake latency across 4G/5G mobile edges",
            "Slide 26-40: Live Production Runbook - Cert-Manager automated rotation & fallback policies"
          ]
        },
        {
          id: "talk_k8s_resilience",
          title: "3 AM Kubernetes Incident Runbook: Fixing NetworkPolicies, Storage Locks, and CoreDNS Panics",
          format: "45-min War Stories & Live Demo",
          level: "All Engineering Levels",
          audience: "DevOps Engineers, On-Call Practitioners, SREs",
          categoryType: "🧪 Production War Story / Runbook",
          whyReviewersAccept: "Every SRE has suffered through 3 AM silent DNS timeouts. This talk provides the exact non-destructive diagnostic flowcharts and CLI commands attendees can run immediately.",
          abstract: "When a multi-region Kubernetes cluster degrades in the middle of the night, standard dashboards often mask the true root cause. This talk walks through three real-world production outages: silent NetworkPolicy packet drops, multi-attach PVC volume locks, and CoreDNS throttling. Attendees learn non-destructive diagnostic CLI commands and leave with a battle-tested triage flowchart.",
          groundingRefs: [
            { title: "Google Research: Borg & Kubernetes Architecture", url: "https://research.google/pubs/pub43438/" },
            { title: "Kubernetes KEP-3063: Dynamic Resource Allocation", url: "https://github.com/kubernetes/enhancements/issues/3063" },
            { title: "CoreDNS Performance Tuning RFC", url: "https://coredns.io/manual/toc/" }
          ],
          takeaways: [
            "Quickly isolate NetworkPolicy drops using tcpdump and iptables / OVN trace logs",
            "Safely resolve stuck PersistentVolumeAttachments without dangerous node reboots",
            "Tune CoreDNS autoscaling and autopath to eliminate silent DNS lookup latency"
          ],
          slidesOutline: [
            "Slide 1-12: Anatomy of the 3 AM PagerDuty storm: What dashboards hide vs what packets prove",
            "Slide 13-28: Triage Deep Dive: Unraveling multi-attach volume locks & CoreDNS UDP buffer exhaustion",
            "Slide 29-45: Battle-tested on-call triage cheat sheet & preventative SLO alert rules"
          ]
        },
        {
          id: "talk_k8s_gateway_api",
          title: "The Great Ingress Migration: Zero-Downtime Gateway API in Large-Scale Production",
          format: "45-min Architecture Deep Dive",
          level: "Intermediate",
          audience: "Platform Engineers, Kubernetes Operators",
          categoryType: "🌲 Evergreen Architectural Core",
          whyReviewersAccept: "Program committees are flooded with migration questions from teams struggling with HTTPRoute and ReferenceGrant boundaries.",
          abstract: "With Ingress entering maintenance mode, platform teams are racing to adopt the Gateway API. This talk details a real-world migration of 150+ microservices without dropping a single TLS session. We demonstrate how Envoy Gateway, HTTPRoute splitting, and automated cert-manager binding deliver cleaner multi-tenant ownership.",
          groundingRefs: [
            { title: "Kubernetes KEP-1907: Gateway API Spec", url: "https://github.com/kubernetes/enhancements/issues/1907" }
          ],
          takeaways: [
            "Architectural separation of GatewayClass, Gateway, and HTTPRoute roles",
            "Canary traffic shifting without restarting ingress controller pods",
            "Troubleshooting Cross-Namespace ReferenceGrant permission errors"
          ],
          slidesOutline: [
            "Slide 1-12: The Ingress Dead-End: Why annotations became unmaintainable at scale",
            "Slide 13-28: Gateway API Architecture: Role-oriented configuration in action",
            "Slide 29-45: Production Migration Blueprint: Dual-homed routing and automated validation"
          ]
        },
        {
          id: "talk_k8s_ebpf",
          title: "eBPF Superpowers: Tracing Silent Packet Drops and Kernel TCP Latency in Production",
          format: "45-min Deep Dive with Live Demos",
          level: "Advanced",
          audience: "SREs, Network Engineers, Performance Specialists",
          categoryType: "🔥 Latest Viral & Trending",
          whyReviewersAccept: "Replaces theory with live bpftrace and Cilium Hubble demonstrations that reveal invisible kernel packet drops without changing application code.",
          abstract: "When latency spikes between Kubernetes nodes but application logs show nothing, the culprit is often buried inside Linux kernel conntrack tables or TCP socket buffers. This talk reveals how to write lightweight eBPF tracepoints to observe microsecond network stalls, socket retries, and silent SYN drops in live production environments.",
          groundingRefs: [
            { title: "BPF and XDP Reference Guide", url: "https://docs.cilium.io/en/stable/bpf/" }
          ],
          takeaways: [
            "Deploy live bpftrace probes safely on production worker nodes",
            "Diagnose conntrack table exhaustion before packet drops occur",
            "Map kernel network latency directly to Kubernetes pod namespaces"
          ],
          slidesOutline: [
            "Slide 1-10: The Invisible Latency: Why tcpdump is too slow and dashboards are too blind",
            "Slide 11-25: Kernel Deep Dive: How eBPF inspects socket buffers at zero overhead",
            "Slide 26-45: Live Production Demos: Tracing connection drops with Hubble and bpftrace"
          ]
        },
        {
          id: "talk_k8s_dra_gpus",
          title: "GPU Scheduling at Hyperscale: Mastering Kubernetes Dynamic Resource Allocation (DRA)",
          format: "30-min Deep Dive",
          level: "Advanced",
          audience: "MLOps Engineers, AI Platform Architects",
          categoryType: "🎯 High CFP Acceptance Rate",
          whyReviewersAccept: "Every major conference is starved for deep architectural talks on solving GPU fragmentation and multi-node training resource claims.",
          abstract: "Standard Kubernetes device plugins allocate whole GPUs, leading to massive resource waste in AI inference workloads. This session explores Kubernetes Dynamic Resource Allocation (KEP-3063), showing how ResourceClaims and custom driver plugins enable dynamic GPU slicing, shared PCIe topologies, and automated multi-accelerator provisioning.",
          groundingRefs: [
            { title: "Kubernetes KEP-3063: Dynamic Resource Allocation", url: "https://github.com/kubernetes/enhancements/issues/3063" }
          ],
          takeaways: [
            "Understand the architectural shift from Device Plugins to DRA",
            "Provision fractional GPU slices dynamically for inference pods",
            "Optimize NUMA node and NVLink topology placement for distributed training"
          ],
          slidesOutline: [
            "Slide 1-10: The $100K GPU Problem: Why device plugins leave 60% VRAM unutilized",
            "Slide 11-20: DRA Internals: ResourceClaims, Drivers, and Scheduler Plugins",
            "Slide 21-30: Architecture Blueprint: Production deployment with NVIDIA DRA driver"
          ]
        }
      ],
      "google-cloud": [
        {
          id: "talk_gcp_gemini_agent",
          title: "Beyond Simple Chatbots: Building Schema-Constrained AI Agents with Gemini Enterprise",
          format: "45-min Architecture Deep Dive",
          level: "Intermediate",
          audience: "Cloud Architects, Software Engineers, AI/ML Leads",
          categoryType: "🔥 Latest Viral & Trending",
          whyReviewersAccept: "Cuts through generative AI marketing to solve the #1 enterprise problem: how to enforce deterministic JSON schemas and resilient tool-calling in enterprise backend APIs.",
          abstract: "Enterprises cannot deploy LLMs that hallucinate unstructured prose into production APIs. In this architecture teardown, we showcase how Google Cloud's Gemini Enterprise Agent Platform enforces strict Pydantic schemas, handles tool calling with API backoffs, and connects to enterprise data stores using Application Default Credentials (ADC).",
          groundingRefs: [
            { title: "arXiv:2403.05530: Gemini Model Capabilities", url: "https://arxiv.org/abs/2403.05530" },
            { title: "Google Cloud: Vertex AI Agent Documentation", url: "https://cloud.google.com/vertex-ai" }
          ],
          takeaways: [
            "Design deterministic, schema-constrained multi-agent loops in Python",
            "Secure API keys vs ADC authentication in enterprise CI/CD environments",
            "Measure cost, latency, and token efficiency across Gemini Flash vs Pro models"
          ],
          slidesOutline: [
            "Slide 1-12: The Enterprise Failure Mode: Why freeform LLM outputs break downstream microservices",
            "Slide 13-28: Schema Enforcement Architecture: Pydantic parsing, AST validation & self-healing retries",
            "Slide 29-45: Production Architecture: Cloud Run + Secret Manager + ADC zero-trust deployment"
          ]
        },
        {
          id: "talk_gcp_bigquery_finops",
          title: "FinOps for Cloud Architects: Slashing 40% Off Google Cloud Data Pipelines",
          format: "45-min Deep Dive",
          level: "Advanced",
          audience: "Data Architects, FinOps Leads, Cloud Engineers",
          categoryType: "🎯 High CFP Acceptance Rate",
          whyReviewersAccept: "Every conference attendee's leadership is demanding cloud cost reduction this year. This talk shows concrete query optimization and storage migration steps that produce immediate dollar savings.",
          abstract: "Data engineering pipelines frequently suffer from slot thrashing, full-table scans, and runaway storage costs. This session demonstrates real architectural patterns across BigQuery, Cloud Storage lifecycle rules, and authorized materialized views that drastically reduce compute billing while maintaining sub-second query response times.",
          groundingRefs: [
            { title: "Google Research: Capacitor Columnar Storage (VLDB)", url: "https://research.google/pubs/pub45778/" },
            { title: "BigQuery Documentation: Storage Billing Models", url: "https://cloud.google.com/bigquery/pricing" }
          ],
          takeaways: [
            "Optimize BigQuery partitioning and clustering strategies to prune petabyte queries",
            "Leverage physical storage billing models to cut columnar storage bills",
            "Implement authorized views and column-level masking without duplicated data"
          ],
          slidesOutline: [
            "Slide 1-12: The Cloud Billing Shock: Analyzing INFORMATION_SCHEMA to identify petabyte scan leaks",
            "Slide 13-28: Storage & Compute Tuning: Capacitor compression ratios & physical billing transitions",
            "Slide 29-45: Architecture Blueprint: Automated FinOps guardrails & CI/CD query dry-run linters"
          ]
        },
        {
          id: "talk_gcp_spanner_ha",
          title: "Surviving Regional Cloud Outages: Spanner Dual-Region & Multi-Region Resiliency",
          format: "45-min Resilience Session",
          level: "Advanced",
          audience: "Principal Architects, SRE Leads",
          categoryType: "🌲 Evergreen Architectural Core",
          whyReviewersAccept: "Demystifies TrueTime consensus and leader election during real cloud datacenter cutoffs, providing concrete testing strategies.",
          abstract: "When an entire cloud region loses network connectivity, can your database truly fail over with zero RPO and zero split-brain? This session examines Google Cloud Spanner's Paxos consensus implementation across dual and multi-region topologies. We demonstrate automated failovers, commit-wait latency tuning, and cost-effective disaster recovery architectures.",
          groundingRefs: [
            { title: "Google Spanner TrueTime Paper (OSDI)", url: "https://research.google/pubs/pub39966/" }
          ],
          takeaways: [
            "How Paxos leader election operates during complete regional fiber cuts",
            "Tuning read-only queries with staleness bounds for microsecond performance",
            "Designing active-active multi-region architectures with Spanner"
          ],
          slidesOutline: [
            "Slide 1-12: The True Cost of Regional Outages: Why active-passive replication fails",
            "Slide 13-28: TrueTime and Paxos Internals: How Spanner guarantees serializability",
            "Slide 29-45: Chaos Engineering Demo: Simulating regional severance and automated recovery"
          ]
        },
        {
          id: "talk_gcp_gke_hardening",
          title: "Hardening GKE for PCI-DSS & HIPAA: Workload Identity, Shielded GKE, and Binary Auth",
          format: "30-min Practitioner Session",
          level: "Intermediate",
          audience: "Security Engineers, Compliance Leads",
          categoryType: "🧪 Production War Story / Runbook",
          whyReviewersAccept: "Gives compliance engineers a definitive, actionable checklist for passing regulated audits on Google Kubernetes Engine without slowing developer deployments.",
          abstract: "Achieving continuous compliance on Kubernetes often feels like fighting your developer teams. In this session, we reveal an automated security baseline for GKE: replacing static service account keys with Workload Identity Federation, enforcing cryptographic container provenance with Binary Authorization, and automating Datapath v2 network policies.",
          groundingRefs: [
            { title: "NIST SP 800-190 Container Security Guide", url: "https://csrc.nist.gov/publications/detail/sp/800-190/final" }
          ],
          takeaways: [
            "Eliminate all service account JSON keys using Workload Identity Federation",
            "Enforce cryptographically signed container deployments using Binary Authorization",
            "Audit and enforce network isolation using GKE Datapath v2 flow logs"
          ],
          slidesOutline: [
            "Slide 1-10: Anatomy of a Cloud Breach: How exposed JSON keys lead to lateral movement",
            "Slide 11-20: Zero-Trust GKE: Workload Identity, KMS envelope encryption, and Shielded Nodes",
            "Slide 21-30: Policy as Code: Enforcing compliance in CI/CD with Krew and Kyverno"
          ]
        },
        {
          id: "talk_gcp_cloudrun_scaling",
          title: "Cold Starts, Concurrency, and VPCs: Cloud Run Under 50,000 Requests per Second",
          format: "30-min Performance Deep Dive",
          level: "Intermediate",
          audience: "Backend Engineers, Cloud Architects",
          categoryType: "🔥 Latest Viral & Trending",
          whyReviewersAccept: "Full of real load-testing benchmarks, showing exactly how to configure concurrency, min-instances, and direct VPC egress to avoid latency cliffs.",
          abstract: "Serverless containers promise infinite scale, but improper concurrency or VPC connector bottlenecks can turn sudden traffic spikes into HTTP 504 timeouts. This talk provides actionable tuning techniques for Cloud Run under extreme load, demonstrating Direct VPC egress optimizations and CPU allocation strategies.",
          groundingRefs: [
            { title: "Google Cloud Run Networking Architecture", url: "https://cloud.google.com/run/docs/configuring/vpc-direct-vpc" }
          ],
          takeaways: [
            "Tune container concurrency to maximize CPU utilization without memory starvation",
            "Eliminate VPC connector throttles using Cloud Run Direct VPC Egress",
            "Analyze startup latency benchmarks across Go, Node.js, and Python runtimes"
          ],
          slidesOutline: [
            "Slide 1-8: The Serverless Mirage: What happens when 50,000 RPS hits un-tuned Cloud Run",
            "Slide 9-20: Concurrency vs CPU Allocation: Finding the sweet spot for throughput and cost",
            "Slide 21-30: Architecture Blueprint: High-throughput Cloud Run + Cloud Armor + VPC design"
          ]
        }
      ],
      "devops-days": [
        {
          id: "talk_devops_3am_runbook",
          title: "3 AM Kubernetes Incident Runbook: Fixing NetworkPolicies, Storage Locks, and CoreDNS Panics",
          format: "45-min War Stories & Live Demo",
          level: "All Engineering Levels",
          audience: "DevOps Engineers, On-Call Practitioners, SREs",
          categoryType: "🧪 Production War Story / Runbook",
          whyReviewersAccept: "Every SRE has suffered through 3 AM silent DNS timeouts. This talk provides the exact non-destructive diagnostic flowcharts and CLI commands attendees can run immediately.",
          abstract: "When a multi-region Kubernetes cluster degrades in the middle of the night, standard dashboards often mask the true root cause. This talk walks through three real-world production outages: silent NetworkPolicy packet drops, multi-attach PVC volume locks, and CoreDNS throttling. Attendees learn non-destructive diagnostic CLI commands and leave with a battle-tested triage flowchart.",
          groundingRefs: [
            { title: "Google Research: Borg & Kubernetes Architecture", url: "https://research.google/pubs/pub43438/" },
            { title: "CoreDNS Performance Tuning RFC", url: "https://coredns.io/manual/toc/" }
          ],
          takeaways: [
            "Quickly isolate NetworkPolicy drops using tcpdump and iptables / OVN trace logs",
            "Safely resolve stuck PersistentVolumeAttachments without dangerous node reboots",
            "Tune CoreDNS autoscaling and autopath to eliminate silent DNS lookup latency"
          ],
          slidesOutline: [
            "Slide 1-12: Anatomy of the 3 AM PagerDuty storm: What dashboards hide vs what packets prove",
            "Slide 13-28: Triage Deep Dive: Unraveling multi-attach volume locks & CoreDNS UDP buffer exhaustion",
            "Slide 29-45: Battle-tested on-call triage cheat sheet & preventative SLO alert rules"
          ]
        },
        {
          id: "talk_devops_alert_fatigue",
          title: "Killing 80% of Your Alerts: An SRE's Guide to Symptom-Based Alerting and Burn Rates",
          format: "45-min Cultural & Technical Session",
          level: "Intermediate",
          audience: "On-Call Engineers, Engineering Managers, SREs",
          categoryType: "🌲 Evergreen Architectural Core",
          whyReviewersAccept: "Addresses on-call burnout directly with Google SRE workbook methodologies, helping teams replace noisy CPU alerts with multi-window burn rate SLOs.",
          abstract: "If your engineers receive 50 PagerDuty notifications a week, they are not on call—they are experiencing alert fatigue. This session details how to overhaul legacy alerting systems using multi-window, multi-burn-rate alerts based on real user SLIs, eliminating noisy alerts and guaranteeing waking engineers only for true customer impact.",
          groundingRefs: [
            { title: "Google SRE Book: Alerting on SLOs", url: "https://sre.google/workbook/alerting-on-slos/" }
          ],
          takeaways: [
            "Formulate actionable Service Level Indicators (SLIs) that reflect actual user pain",
            "Implement multi-window burn rate alert rules in Prometheus / Alertmanager",
            "Automate on-call toil reduction with blameless postmortem action tracking"
          ],
          slidesOutline: [
            "Slide 1-10: The On-Call Nightmare: How alert fatigue causes production blind spots",
            "Slide 11-25: Mathematical Framework: Multi-window burn rates and error budget consumption",
            "Slide 26-45: Implementation Guide: Real Alertmanager YAML rules and PagerDuty routing"
          ]
        },
        {
          id: "talk_devops_chaos_testing",
          title: "Chaos Engineering in Production: Safely Injecting Latency and Pod Failures",
          format: "30-min Practitioner Session",
          level: "Intermediate",
          audience: "DevOps Practitioners, QA Architects, SREs",
          categoryType: "🧪 Production War Story / Runbook",
          whyReviewersAccept: "Demystifies chaos engineering by starting with safe, scoped experiments instead of chaotic cluster destruction.",
          abstract: "How do you test system resilience without getting fired? This session walks through safe chaos engineering methodologies using Chaos Mesh and LitmusChaos. We show how to define steady-state hypotheses, implement automated blast-radius containment, and inject network delay to verify circuit breakers.",
          groundingRefs: [
            { title: "Principles of Chaos Engineering", url: "https://principlesofchaos.org/" }
          ],
          takeaways: [
            "Define verifiable steady-state metrics before executing chaos experiments",
            "Configure automated emergency abort triggers when error budgets degrade",
            "Validate service mesh retries and circuit breaking under real packet loss"
          ],
          slidesOutline: [
            "Slide 1-8: The Fallacy of Static Testing: Why staging environments miss production failure modes",
            "Slide 9-20: Scoped Experiments: Network latency, DNS loss, and pod termination with Chaos Mesh",
            "Slide 21-30: Production Playbook: Integrating chaos experiments into continuous delivery"
          ]
        },
        {
          id: "talk_devops_gitops_drift",
          title: "Preventing GitOps Drift: Reconciling Terraform and ArgoCD Without Pipeline Deadlocks",
          format: "30-min Architecture Talk",
          level: "Intermediate",
          audience: "Platform Engineers, DevOps Leads",
          categoryType: "🎯 High CFP Acceptance Rate",
          whyReviewersAccept: "Solves the ubiquitous friction between infrastructure-as-code (Terraform) and application delivery (ArgoCD) with clean state ownership.",
          abstract: "Who owns the ingress certificate—Terraform or the Helm chart? When multiple GitOps tools manage overlapping resources, race conditions and perpetual sync loops occur. This session establishes strict resource ownership boundaries, showing how to coordinate Crossplane, Terraform, and ArgoCD cleanly.",
          groundingRefs: [
            { title: "Open GitOps Principles", url: "https://opengitops.dev/" }
          ],
          takeaways: [
            "Establish unambiguous resource ownership boundaries between IaaS and K8s manifests",
            "Use ArgoCD sync waves and ignoreDifferences to eliminate reconciliation loops",
            "Automate drift detection and remediation with webhook notifications"
          ],
          slidesOutline: [
            "Slide 1-8: The Reconciliation War: When Terraform and ArgoCD fight over the same resource",
            "Slide 9-20: Separation of Concerns: Crossplane vs Terraform vs Kubernetes Controllers",
            "Slide 21-30: Best Practices: Declarative drift detection and clean promotion pipelines"
          ]
        },
        {
          id: "talk_devops_postmortems",
          title: "Writing Blameless Postmortems That Actually Prevent Outages",
          format: "30-min Cultural & Process Talk",
          level: "All Engineering Levels",
          audience: "DevOps Engineers, Team Leads, SREs",
          categoryType: "🌲 Evergreen Architectural Core",
          whyReviewersAccept: "A refreshing, human-centered session that moves beyond technical checklists to build genuine psychological safety and high-leverage organizational learning.",
          abstract: "Saying 'human error was the root cause' is where the investigation should begin, not where it ends. This talk provides a blueprint for facilitating truly blameless incident retrospectives, teaching engineers how to identify systemic design traps and track corrective actions that genuinely prevent recurrences.",
          groundingRefs: [
            { title: "Etsy: Blameless PostMortems and Just Culture", url: "https://www.etsy.com/codeascraft/blameless-postmortems" }
          ],
          takeaways: [
            "Eliminate human error from root cause taxonomies",
            "Facilitate constructive timeline reconstruction after major incidents",
            "Ensure remediation action items are prioritized over new feature roadmaps"
          ],
          slidesOutline: [
            "Slide 1-8: The Blame Trap: How punitive retrospectives drive incident reports underground",
            "Slide 9-20: Systemic Causation: Human factors, cognitive load, and safety margins",
            "Slide 21-30: Facilitator Runbook: Templates, interview questions, and follow-through"
          ]
        }
      ],
      "redhat-commons": [
        {
          id: "talk_ocp_multitenant_scale",
          title: "Enterprise OpenShift 4 Administration: Mastering Multi-Tenancy & Governance at Scale",
          format: "45-min Architecture Deep Dive",
          level: "Intermediate / Advanced",
          audience: "Platform Engineers, System Administrators, OCP Operators",
          categoryType: "🌲 Evergreen Architectural Core",
          whyReviewersAccept: "Delivers enterprise compliance realities that textbook docs skip: hard multi-tenant isolation, project templates, and automated quota guardrails for hundreds of developers.",
          abstract: "How do you give 500 developers instant cluster access without risking cluster-wide CPU exhaustion or rogue route takeovers? This session shares the battle-tested configuration for OpenShift Project Request Templates, LimitRanges, and custom HTPasswd role bindings that keep multi-tenant clusters secure and compliant.",
          groundingRefs: [
            { title: "Red Hat Enterprise Multi-Tenancy Guide", url: "https://cloud.redhat.com/architecture/" },
            { title: "NIST SP 800-190 Container Security Guide", url: "https://csrc.nist.gov/publications/detail/sp/800-190/final" }
          ],
          takeaways: [
            "Configure custom OpenShift project request templates for automated governance",
            "Enforce tenant isolation with automated egress firewalls and edge routes",
            "Streamline EX280-grade administration drills for enterprise ops teams"
          ],
          slidesOutline: [
            "Slide 1-10: Multi-tenant chaos: How unconstrained namespaces take down shared worker nodes",
            "Slide 11-22: Automation Blueprint: Project Request Templates, ClusterResourceQuotas & NetworkPolicies",
            "Slide 23-30: Day-2 Ops Checklist: Audit logging, RBAC governance, and security automation"
          ]
        },
        {
          id: "talk_ocp_storage_odf",
          title: "Taming OpenShift Data Foundation: Troubleshooting Ceph OSD Failures and PVC Timeouts",
          format: "45-min Operational Deep Dive",
          level: "Advanced",
          audience: "Storage Administrators, OpenShift Architects",
          categoryType: "🧪 Production War Story / Runbook",
          whyReviewersAccept: "Ceph and ODF storage failures can paralyze stateful workloads. This talk delivers battle-tested CLI commands and recovery flowcharts for storage administrators.",
          abstract: "OpenShift Data Foundation (ODF) brings cloud-native block and file storage to on-prem and hybrid clouds, but disk degradation or network partition can throw Ceph into HEALTH_WARN or HEALTH_ERR states. This talk provides concrete diagnostics to recover degraded pools, clear mon quorums, and resolve VolumeAttachment locks safely.",
          groundingRefs: [
            { title: "Red Hat OpenShift Data Foundation Architecture", url: "https://docs.redhat.com/en/documentation/red_hat_openshift_data_foundation/" }
          ],
          takeaways: [
            "Diagnose Ceph OSD crashes and peering issues using oc rsh into rook-ceph pods",
            "Resolve VolumeLocked errors without rebooting bare-metal worker nodes",
            "Configure proactive storage monitoring and capacity alerts in OpenShift Prometheus"
          ],
          slidesOutline: [
            "Slide 1-12: The Storage Nightmare: When PVCs get locked in ContainerCreating across clusters",
            "Slide 13-28: Ceph Under the Hood: CRUSH maps, OSD peering, and Rook-Ceph operator reconciliation",
            "Slide 29-45: Field Recovery Runbook: Step-by-step triage commands for degraded pools"
          ]
        },
        {
          id: "talk_ocp_mcp_upgrades",
          title: "Zero-Downtime OpenShift 4 Upgrades: MachineConfigPools, Nodes, and Operators",
          format: "30-min Administration Talk",
          level: "Intermediate",
          audience: "OpenShift Administrators, SREs",
          categoryType: "🌲 Evergreen Architectural Core",
          whyReviewersAccept: "Upgrading large enterprise OCP clusters between Y-streams is high-risk. This session provides the paused MachineConfigPool strategy used in Fortune 500 rollouts.",
          abstract: "Major OpenShift cluster upgrades touch the control plane, worker nodes, and dozens of installed operators. Learn how to pause MachineConfigPools, perform canary node OS updates, and validate cluster operator health gates to ensure zero downtime for running microservices during major upgrades.",
          groundingRefs: [
            { title: "OpenShift Container Platform Update Architecture", url: "https://docs.openshift.com/container-platform/latest/updating/understanding_updates.html" }
          ],
          takeaways: [
            "Use paused MachineConfigPools to stage node reboots and CoreOS updates",
            "Validate cluster operator upgrade gates before progressing to worker nodes",
            "Automate pre-upgrade backup checks for etcd and critical CRDs"
          ],
          slidesOutline: [
            "Slide 1-8: The Upgrade Anxiety: What breaks during automated rolling cluster upgrades",
            "Slide 9-20: The MachineConfig Operator: Staging updates with custom MachineConfigPools",
            "Slide 21-30: Pre-flight & Post-flight Verification: Health-check checklists and automated verification"
          ]
        },
        {
          id: "talk_ocp_rhacs_security",
          title: "Advanced Cluster Security (RHACS / StackRox): Enforcing Runtime Security and Compliance",
          format: "30-min Security Session",
          level: "Intermediate",
          audience: "Security Engineers, DevSecOps Leads",
          categoryType: "🎯 High CFP Acceptance Rate",
          whyReviewersAccept: "Combines compliance auditing with live runtime detection, showing how to block privilege escalations and cryptominers without false positive alerts.",
          abstract: "Red Hat Advanced Cluster Security provides deep visibility into Kubernetes container runtimes. In this session, we demonstrate how to configure declarative security policies that automatically block unauthorized image registries, alert on privilege escalation attempts, and enforce compliance reporting against CIS Kubernetes benchmarks.",
          groundingRefs: [
            { title: "Red Hat Advanced Cluster Security Architecture", url: "https://www.redhat.com/en/technologies/cloud-computing/openshift/advanced-cluster-security-for-kubernetes" }
          ],
          takeaways: [
            "Implement declarative security policies across multiple OpenShift clusters",
            "Detect and terminate rogue container processes in real time",
            "Integrate vulnerability scans directly into OpenShift Pipelines (Tekton)"
          ],
          slidesOutline: [
            "Slide 1-8: Vulnerability vs Runtime Threat: Why image scanning alone is insufficient",
            "Slide 9-20: RHACS Architecture: Sensor, Collector, and Central policy enforcement",
            "Slide 21-30: Enforcement Blueprints: Blocking vulnerable pods in CI/CD before deployment"
          ]
        },
        {
          id: "talk_ocp_virtualization",
          title: "Migrating from VMware to OpenShift Virtualization: Architecture and Migration Playbook",
          format: "45-min Migration Deep Dive",
          level: "Intermediate",
          audience: "Infrastructure Architects, Virtualization Engineers, Platform Leads",
          categoryType: "🔥 Latest Viral & Trending",
          whyReviewersAccept: "The VMware licensing changes have created immense urgency for enterprise infrastructure teams looking to migrate VMs to KubeVirt and OpenShift.",
          abstract: "With enterprise infrastructure costs shifting rapidly, organizations are evaluating OpenShift Virtualization to run VMs and containers side-by-side on a single platform. This session covers network binding, live migration mechanics, and the Migration Toolkit for Virtualization (MTV) to transition production VMs with minimal disruption.",
          groundingRefs: [
            { title: "KubeVirt Architecture & Design Guide", url: "https://kubevirt.io/" }
          ],
          takeaways: [
            "Understand KubeVirt pod virtualization architecture and storage integration",
            "Configure Multus secondary networks for VLAN-backed VM communication",
            "Execute cold and warm VM migrations from vSphere using MTV"
          ],
          slidesOutline: [
            "Slide 1-12: The Virtualization Shift: Why run VMs on Kubernetes infrastructure?",
            "Slide 13-28: KubeVirt Internals: Libvirt in a pod, live migration, and SR-IOV networking",
            "Slide 29-45: Field Migration Playbook: Step-by-step migration from vSphere clusters"
          ]
        }
      ],
      "security-summit": [
        {
          id: "talk_sec_hybrid_tls",
          title: "Zero-Trust at Quantum Speed: Implementing Hybrid TLS 1.3 in Cloud-Native Mesh",
          format: "45-min Technical Deep Dive",
          level: "Intermediate / Advanced",
          audience: "Cloud Architects, SREs, Security Engineers",
          categoryType: "🌲 Evergreen Architectural Core",
          whyReviewersAccept: "Zero vendor marketing. Delivers real Wireshark packet captures, microsecond latency benchmarks, and copy-paste YAML configs for immediate production impact.",
          abstract: "As NIST finalizes post-quantum standards, modern distributed systems must prepare for 'harvest-now, decrypt-later' threats. In this session, we dissect the hybrid X25519MLKEM768 key exchange mechanism in TLS 1.3. We inspect live packet captures, analyze real latency trade-offs on Kubernetes Ingresses, and deliver a production-ready blueprint for automating mTLS certificates without service disruption.",
          groundingRefs: [
            { title: "NIST FIPS 203 ML-KEM Standard", url: "https://csrc.nist.gov/pubs/fips/203/final" },
            { title: "IETF RFC 8446 TLS 1.3 Spec", url: "https://datatracker.ietf.org/doc/html/rfc8446" },
            { title: "arXiv:2405.02104: PQC in Service Meshes", url: "https://arxiv.org/abs/2405.02104" }
          ],
          takeaways: [
            "Understand how hybrid post-quantum key exchange prevents cryptographic obsolescence",
            "Benchmark packet size overhead (1,184-byte keys) and latency impacts on live proxies",
            "Implement automated certificate rotation in Kubernetes using cert-manager"
          ],
          slidesOutline: [
            "Slide 1-10: The Harvest-Now Decrypt-Later threat model & TLS 1.3 handshake packet breakdown",
            "Slide 11-25: Benchmarking Envoy & NGINX handshake latency across 4G/5G mobile edges",
            "Slide 26-40: Live Production Runbook - Cert-Manager automated rotation & fallback policies"
          ]
        },
        {
          id: "talk_sec_spiffe_identities",
          title: "Cryptographic Workload Identity with SPIFFE/SPIRE: Killing the API Key in Microservices",
          format: "45-min Deep Dive",
          level: "Advanced",
          audience: "Security Architects, Principal Engineers, DevSecOps Leads",
          categoryType: "🌲 Evergreen Architectural Core",
          whyReviewersAccept: "Replaces vulnerable long-lived credentials with automated cryptographic workload identity verification.",
          abstract: "Static API keys, database passwords, and long-lived cloud credentials continue to be the primary cause of cloud breaches. This session demonstrates how SPIFFE/SPIRE provides cryptographically verifiable, ephemeral workload identities across hybrid and multi-cloud Kubernetes clusters without hardcoded secrets.",
          groundingRefs: [
            { title: "SPIFFE Specification & Architecture", url: "https://spiffe.io/" }
          ],
          takeaways: [
            "How SPIRE agents perform node and workload attestation in Kubernetes",
            "Issue short-lived X.509 SVID certificates with sub-minute rotation",
            "Federate trust domains across multi-cloud environments seamlessly"
          ],
          slidesOutline: [
            "Slide 1-12: The Secret Sprawl Epidemic: Why vaulting static tokens still leaves attack surfaces",
            "Slide 13-28: SPIFFE/SPIRE Architecture: Workload API, Attestors, and SVID minting",
            "Slide 29-45: Production Deployment: Integrating SPIRE with Envoy mTLS in live service mesh"
          ]
        },
        {
          id: "talk_sec_sigstore_supply_chain",
          title: "Defending Against Supply Chain Poisoning: Keyless Signing and SLSA Level 3 with Sigstore",
          format: "30-min Practitioner Session",
          level: "Intermediate",
          audience: "DevSecOps Engineers, CI/CD Architects",
          categoryType: "🔥 Latest Viral & Trending",
          whyReviewersAccept: "A hands-on, realistic walkthrough of cryptographic supply chain verification using Sigstore, Cosign, and Kyverno admission controllers.",
          abstract: "How can you be certain that the container image running in your production cluster is the exact binary built by your trusted GitHub Actions workflow? This session demonstrates keyless container signing with Cosign, cryptographic provenance attestation with SLSA, and automated admission rejection of unsigned images in Kubernetes.",
          groundingRefs: [
            { title: "Sigstore Architecture Specification", url: "https://www.sigstore.dev/" }
          ],
          takeaways: [
            "Implement keyless signing in GitHub Actions using Fulcio and Rekor transparency logs",
            "Generate cryptographic SLSA Level 3 build provenance attestations",
            "Enforce admission verification using Kyverno policies in Kubernetes"
          ],
          slidesOutline: [
            "Slide 1-8: The Supply Chain Threat: Dependency hijacking, rogue image tags, and registry tampering",
            "Slide 9-20: Keyless Cryptography: How OIDC identities replace vulnerable private keys",
            "Slide 21-30: Policy Enforcement: Rejecting unverified images at the Kubernetes admission webhook"
          ]
        },
        {
          id: "talk_sec_ebpf_security",
          title: "eBPF-Based Runtime Threat Detection with Tetragon: Blocking Kernel-Level Exploits",
          format: "30-min Deep Dive with Live Demos",
          level: "Advanced",
          audience: "Security Operations (SecOps), SREs, Kubernetes Engineers",
          categoryType: "🎯 High CFP Acceptance Rate",
          whyReviewersAccept: "Live demonstrations showing how eBPF can intercept and block malicious system calls (privilege escalations, root namespaces) before user-space processes execute.",
          abstract: "Traditional Linux auditd logs are easily overwhelmed and user-space detection agents can be bypassed by sophisticated rootkits. In this session, we explore eBPF runtime security using Tetragon, showing how in-kernel filters can detect namespace escapes, unauthorized file access, and reverse shells, killing malicious processes synchronously.",
          groundingRefs: [
            { title: "Cilium Tetragon eBPF Security Architecture", url: "https://tetragon.io/" }
          ],
          takeaways: [
            "Observe system calls and kernel capabilities directly via eBPF tracepoints",
            "Enforce in-kernel process termination for unauthorized namespace escapes",
            "Export real-time security events to SIEM without performance overhead"
          ],
          slidesOutline: [
            "Slide 1-8: The Blind Spot of User-Space Agents: How container escapes evade logging",
            "Slide 9-20: Tetragon Kernel Architecture: Hooking LSM, kprobes, and tracepoints",
            "Slide 21-30: Live Exploit & Containment: Intercepting a simulated CVE privilege escalation"
          ]
        },
        {
          id: "talk_sec_vault_secrets",
          title: "Architecting Zero-Trust Secret Rotation: HashiCorp Vault on Kubernetes at Scale",
          format: "30-min Practitioner Session",
          level: "Intermediate",
          audience: "Cloud Architects, Security Engineers",
          categoryType: "🌲 Evergreen Architectural Core",
          whyReviewersAccept: "Addresses the day-2 operational nightmare of rotating database credentials and dynamic secrets without causing application downtime.",
          abstract: "Deploying HashiCorp Vault in Kubernetes is only step one; establishing dynamic secret leases, automated database user rotation, and Vault Agent sidecar injection is where real engineering challenges arise. This talk shares architectural patterns for resilient, high-availability Vault clusters handling thousands of microservices.",
          groundingRefs: [
            { title: "HashiCorp Vault Reference Architecture", url: "https://developer.hashicorp.com/vault" }
          ],
          takeaways: [
            "Configure dynamic database credentials with automatic lease renewals",
            "Optimize Vault Agent injector mutating webhooks to prevent pod startup timeouts",
            "Implement multi-region Raft storage disaster recovery and automated unsealing"
          ],
          slidesOutline: [
            "Slide 1-8: The Secret Rotation Dilemma: Why applications crash when passwords change",
            "Slide 9-20: Dynamic Secrets Architecture: Vault leasing, renewal loops, and agent injection",
            "Slide 21-30: High Availability & Disaster Recovery: Multi-cluster Raft replication"
          ]
        }
      ]
    };

    // State getters / setters with Top 5 Housekeeping
    function getEphemeralContentIdeas(niche) {
      var sel = document.getElementById("content-engine-niche-select");
      var n = niche || (sel ? sel.value : "all");
      var key = KEY_EPHEMERAL_CONTENT + "_" + n;
      try {
        var items = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(items) && items.length > 0) return items.slice(0, 5);
      } catch (e) {}
      return [];
    }

    function saveEphemeralContentIdeas(items, niche) {
      var sel = document.getElementById("content-engine-niche-select");
      var n = niche || (sel ? sel.value : "all");
      var key = KEY_EPHEMERAL_CONTENT + "_" + n;
      var top5 = (items || []).slice(0, 5);
      try { localStorage.setItem(key, JSON.stringify(top5)); } catch (e) {}
      renderContentIdeas();
    }

    function getPermanentContentIdeas() {
      try {
        return JSON.parse(localStorage.getItem(KEY_PERMANENT_CONTENT) || "[]");
      } catch (e) { return []; }
    }

    function savePermanentContentIdeas(items) {
      try { localStorage.setItem(KEY_PERMANENT_CONTENT, JSON.stringify(items || [])); } catch (e) {}
      renderPermanentContentVault();
    }

    function getEphemeralTalks(venue) {
      var sel = document.getElementById("talk-venue-select");
      var v = venue || (sel ? sel.value : "cloud-native");
      var key = KEY_EPHEMERAL_TALKS + "_" + v;
      try {
        var items = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(items) && items.length > 0) return items.slice(0, 5);
      } catch (e) {}
      return [];
    }

    function saveEphemeralTalks(items, venue) {
      var sel = document.getElementById("talk-venue-select");
      var v = venue || (sel ? sel.value : "cloud-native");
      var key = KEY_EPHEMERAL_TALKS + "_" + v;
      var top5 = (items || []).slice(0, 5);
      try { localStorage.setItem(key, JSON.stringify(top5)); } catch (e) {}
      renderTalkIdeas();
    }

    function getPermanentTalks() {
      try {
        return JSON.parse(localStorage.getItem(KEY_PERMANENT_TALKS) || "[]");
      } catch (e) { return []; }
    }

    function savePermanentTalks(items) {
      try { localStorage.setItem(KEY_PERMANENT_TALKS, JSON.stringify(items || [])); } catch (e) {}
      renderPermanentTalksVault();
    }

    // Helper: Category badge styling for Author Perspective
    function getCategoryBadgeClass(categoryType) {
      var cat = categoryType || "";
      if (cat.indexOf("Evergreen") !== -1) {
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30";
      } else if (cat.indexOf("Viral") !== -1 || cat.indexOf("Trending") !== -1) {
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30";
      } else if (cat.indexOf("War Story") !== -1 || cat.indexOf("Runbook") !== -1) {
        return "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30";
      } else if (cat.indexOf("Acceptance") !== -1 || cat.indexOf("CFP") !== -1) {
        return "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30";
      }
      return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30";
    }

    // Render Content Ideas (Top 5 Active)
    function renderContentIdeas() {
      var grid = document.getElementById("content-ideas-grid");
      if (!grid) return;
      var sel = document.getElementById("content-engine-niche-select");
      var niche = sel ? sel.value : "all";
      var ideas = getEphemeralContentIdeas(niche);
      if (!ideas.length) {
        if (typeof defaultContentCurations !== "undefined" && defaultContentCurations) {
          ideas = (defaultContentCurations[niche] || defaultContentCurations["all"] || []).slice(0, 5);
        } else {
          ideas = [];
        }
        if (ideas.length) {
          try { localStorage.setItem(KEY_EPHEMERAL_CONTENT + "_" + niche, JSON.stringify(ideas)); } catch (e) {}
        }
      }

      var countBadge = document.getElementById("content-engine-count-badge");
      if (countBadge) countBadge.textContent = ideas.length;

      grid.innerHTML = ideas.map(function(item, idx) {
        var catClass = getCategoryBadgeClass(item.categoryType || item.category);

        // Grounding research links badges
        var refsHtml = "";
        if (item.groundingRefs && Array.isArray(item.groundingRefs) && item.groundingRefs.length > 0) {
          refsHtml = '<div class="flex items-center gap-1.5 flex-wrap pt-1">'
            + '<span class="text-[10px] font-bold uppercase tracking-wider text-text/60 dark:text-darkmode-text/60 flex items-center gap-1"><i class="fa-solid fa-graduation-cap text-amber-500"></i> Grounding:</span>'
            + item.groundingRefs.map(function(ref) {
                return '<a href="' + escapeHtml(ref.url) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-mono text-[10px] border border-amber-500/20 transition-colors">'
                  + '<i class="fa-solid fa-book-bookmark text-[9px]"></i> ' + escapeHtml(ref.title) + ' <i class="fa-solid fa-arrow-up-right-from-square text-[8px] opacity-70"></i></a>';
              }).join(" ")
            + '</div>';
        }

        return '<div class="bg-body dark:bg-darkmode-body border border-border/80 dark:border-darkmode-border/80 rounded-2xl p-5 shadow-xs hover:border-amber-500/50 transition-all flex flex-col md:flex-row items-start justify-between gap-5 group">'
          + '<div class="space-y-2.5 flex-grow">'
          + '  <div class="flex items-center gap-2 flex-wrap">'
          + '    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono">#' + (idx + 1) + ' ' + escapeHtml(item.category || "Cloud") + '</span>'
          + '    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ' + catClass + '">' + escapeHtml(item.categoryType || "🔥 Trending Topic") + '</span>'
          + '    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-text/80 dark:text-darkmode-text/80 font-mono flex items-center gap-1"><i class="fa-solid fa-fire text-amber-500 text-[10px]"></i> Score: ' + (item.viralityScore || 90) + '/100</span>'
          + '  </div>'
          + '  <h4 class="text-base font-bold text-dark dark:text-darkmode-dark group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">' + escapeHtml(item.title) + '</h4>'
          + '  <div class="text-[11px] bg-amber-500/5 dark:bg-amber-500/10 border-l-2 border-amber-500 p-2.5 rounded-r-xl">'
          + '    <span class="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-0.5"><i class="fa-solid fa-bullseye text-[10px]"></i> Why Readers Click &amp; Share:</span>'
          + '    <span class="text-text/80 dark:text-darkmode-text/80 italic">&ldquo;' + escapeHtml(item.whyViral || "") + '&rdquo;</span>'
          + '  </div>'
          + refsHtml
          + '  <div class="text-[11px] text-text/80 dark:text-darkmode-text/80 bg-theme-light/40 dark:bg-darkmode-theme-light/20 p-2.5 rounded-xl border border-border/50 dark:border-darkmode-border/50">'
          + '    <span class="font-bold text-dark dark:text-darkmode-dark block mb-1"><i class="fa-solid fa-list-check text-amber-500 mr-1"></i> 3-Step Hands-On Outline:</span>'
          + '    <ul class="list-disc pl-4 space-y-0.5 font-mono text-[10.5px]">' + (item.outline ? item.outline.map(function(o) { return '<li>' + escapeHtml(o) + '</li>'; }).join("") : '<li>Production Failure Mode</li><li>Architecture Implementation</li><li>Benchmarking & Verification</li>') + '</ul>'
          + '  </div>'
          + '  <div class="text-[11px] font-mono text-text/60 dark:text-darkmode-text/60 pt-1">'
          + '    <i class="fa-solid fa-tags mr-1"></i> <span class="font-semibold text-text/80 dark:text-darkmode-text/80">Target SEO Keywords:</span> ' + escapeHtml(item.keywords || "")
          + '  </div>'
          + '</div>'
          + '<div class="shrink-0 flex sm:flex-col gap-2 w-full sm:w-auto">'
          + '  <button data-save-content-id="' + escapeHtml(item.id) + '" class="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-600 text-amber-700 hover:text-white dark:text-amber-400 dark:hover:text-white border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">'
          + '    <i class="fa-regular fa-star"></i> <span>Save to Vault</span>'
          + '  </button>'
          + '  <button data-copy-content-id="' + escapeHtml(item.id) + '" class="px-3 py-1.5 rounded-xl bg-theme-light dark:bg-darkmode-theme-light hover:border-amber-500 border border-border/80 dark:border-darkmode-border/80 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">'
          + '    <i class="fa-regular fa-copy"></i> <span>Copy Blueprint</span>'
          + '  </button>'
          + '  <button data-discard-content-id="' + escapeHtml(item.id) + '" class="px-3 py-1.5 rounded-xl text-text/50 hover:text-red-500 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap" title="Remove this topic and rotate next">'
          + '    <i class="fa-solid fa-xmark text-sm"></i> <span>Discard</span>'
          + '  </button>'
          + '</div>'
          + '</div>';
      }).join("");

      attachContentIdeaHandlers();
    }

    // Render Permanent Content Vault
    function renderPermanentContentVault() {
      var grid = document.getElementById("vault-content-grid");
      var countEl = document.getElementById("vault-content-count");
      if (!grid) return;
      var vault = getPermanentContentIdeas();
      if (countEl) countEl.textContent = vault.length;

      if (!vault.length) {
        grid.innerHTML = '<div class="p-6 text-center border border-border/60 dark:border-darkmode-border/60 rounded-2xl bg-theme-light/10 dark:bg-darkmode-theme-light/5 text-xs text-text/60 dark:text-darkmode-text/60">Star items from the active recommendations above to pin them permanently in this vault.</div>';
        return;
      }

      grid.innerHTML = vault.map(function(item) {
        return '<div class="bg-body dark:bg-darkmode-body border border-border/80 dark:border-darkmode-border/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">'
          + '<div>'
          + '  <div class="flex items-center gap-2 mb-1 flex-wrap">'
          + '    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono">' + escapeHtml(item.category || "Cloud") + '</span>'
          + '    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ' + getCategoryBadgeClass(item.categoryType) + '">' + escapeHtml(item.categoryType || "Starred Article") + '</span>'
          + '  </div>'
          + '  <h5 class="text-sm font-bold text-dark dark:text-darkmode-dark">' + escapeHtml(item.title) + '</h5>'
          + '  <p class="text-xs text-text/70 dark:text-darkmode-text/70 mt-0.5 line-clamp-1">' + escapeHtml(item.whyViral || "") + '</p>'
          + '</div>'
          + '<div class="shrink-0 flex items-center gap-2">'
          + '  <button data-copy-vault-id="' + escapeHtml(item.id) + '" class="px-3 py-1.5 rounded-xl bg-theme-light dark:bg-darkmode-theme-light hover:border-primary border border-border/80 dark:border-darkmode-border/80 text-xs font-semibold transition-all cursor-pointer">'
          + '    <i class="fa-regular fa-copy mr-1"></i> Copy'
          + '  </button>'
          + '  <button data-delete-vault-id="' + escapeHtml(item.id) + '" class="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer" title="Delete from vault">'
          + '    <i class="fa-regular fa-trash-can mr-1"></i> Delete'
          + '  </button>'
          + '</div>'
          + '</div>';
      }).join("");

      attachVaultHandlers();
    }

    function attachContentIdeaHandlers() {
      // Save to Vault
      document.querySelectorAll("[data-save-content-id]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = btn.getAttribute("data-save-content-id");
          var ideas = getEphemeralContentIdeas();
          var item = ideas.find(function(i) { return i.id === id; });
          if (!item) return;

          var vault = getPermanentContentIdeas();
          if (!vault.some(function(v) { return v.id === id; })) {
            vault.unshift(item);
            savePermanentContentIdeas(vault);
          }
          btn.innerHTML = '<i class="fa-solid fa-check text-amber-500"></i> <span>Saved!</span>';
          btn.classList.add("pointer-events-none");
        });
      });

      // Discard from Top 5
      document.querySelectorAll("[data-discard-content-id]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = btn.getAttribute("data-discard-content-id");
          var ideas = getEphemeralContentIdeas().filter(function(i) { return i.id !== id; });
          saveEphemeralContentIdeas(ideas);
        });
      });

      // Copy Blueprint
      document.querySelectorAll("[data-copy-content-id]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = btn.getAttribute("data-copy-content-id");
          var ideas = getEphemeralContentIdeas();
          var item = ideas.find(function(i) { return i.id === id; });
          if (!item) return;

          var refsLines = [];
          if (item.groundingRefs && item.groundingRefs.length) {
            refsLines.push("");
            refsLines.push("## Authoritative Grounding & Research Links");
            item.groundingRefs.forEach(function(r) {
              refsLines.push("- [" + r.title + "](" + r.url + ")");
            });
          }

          var outlineLines = [];
          if (item.outline && item.outline.length) {
            item.outline.forEach(function(o, i) {
              outlineLines.push((i + 1) + ". " + o);
            });
          } else {
            outlineLines.push("1. Problem & Root Cause");
            outlineLines.push("2. Implementation Manifests");
            outlineLines.push("3. Benchmarking & Verification");
          }

          var textParts = [
            "# Article Blueprint: " + item.title,
            "",
            "**Category:** " + (item.category || "Cloud") + " (" + (item.categoryType || "Evergreen") + ")",
            "**Why Readers Click & Share:** " + (item.whyViral || ""),
            "**Target SEO Keywords:** " + (item.keywords || "")
          ];

          if (refsLines.length) textParts = textParts.concat(refsLines);
          textParts.push("");
          textParts.push("## 3-Step Hands-On Implementation Outline");
          textParts = textParts.concat(outlineLines);

          var fullText = textParts.join("\n");
          navigator.clipboard.writeText(fullText).then(function() {
            var orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check text-emerald-500"></i> <span>Copied!</span>';
            setTimeout(function() { btn.innerHTML = orig; }, 1800);
          });
        });
      });
    }

    function attachVaultHandlers() {
      document.querySelectorAll("[data-delete-vault-id]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = btn.getAttribute("data-delete-vault-id");
          if (!confirm("Are you sure you want to remove this item from your permanent vault?")) return;
          var vault = getPermanentContentIdeas().filter(function(v) { return v.id !== id; });
          savePermanentContentIdeas(vault);
        });
      });

      document.querySelectorAll("[data-copy-vault-id]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = btn.getAttribute("data-copy-vault-id");
          var vault = getPermanentContentIdeas();
          var item = vault.find(function(v) { return v.id === id; });
          if (!item) return;
          navigator.clipboard.writeText("# " + item.title + "\n\nKeywords: " + (item.keywords || "")).then(function() {
            var orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check text-emerald-500"></i> Copied!';
            setTimeout(function() { btn.innerHTML = orig; }, 1800);
          });
        });
      });
    }

    // Render Talk Ideas (Top 5 Active) - Empathetic Author Perspective
    function renderTalkIdeas() {
      var grid = document.getElementById("talk-ideas-grid");
      if (!grid) return;
      var sel = document.getElementById("talk-venue-select");
      var venue = sel ? sel.value : "cloud-native";
      var talks = getEphemeralTalks(venue);
      if (!talks.length) {
        if (typeof defaultTalkCurations !== "undefined" && defaultTalkCurations) {
          talks = (defaultTalkCurations[venue] || defaultTalkCurations["cloud-native"] || []).slice(0, 5);
        } else {
          talks = [];
        }
        if (talks.length) {
          try { localStorage.setItem(KEY_EPHEMERAL_TALKS + "_" + venue, JSON.stringify(talks)); } catch (e) {}
        }
      }

      var countBadge = document.getElementById("talks-count-badge");
      if (countBadge) countBadge.textContent = talks.length;

      grid.innerHTML = talks.map(function(talk, idx) {
        var catClass = getCategoryBadgeClass(talk.categoryType);

        // Grounding research links badges
        var refsHtml = "";
        if (talk.groundingRefs && Array.isArray(talk.groundingRefs) && talk.groundingRefs.length > 0) {
          refsHtml = '<div class="flex items-center gap-1.5 flex-wrap pt-1">'
            + '<span class="text-[10px] font-bold uppercase tracking-wider text-text/60 dark:text-darkmode-text/60 flex items-center gap-1"><i class="fa-solid fa-graduation-cap text-indigo-500"></i> Grounding:</span>'
            + talk.groundingRefs.map(function(ref) {
                return '<a href="' + escapeHtml(ref.url) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-mono text-[10px] border border-indigo-500/20 transition-colors">'
                  + '<i class="fa-solid fa-book-bookmark text-[9px]"></i> ' + escapeHtml(ref.title) + ' <i class="fa-solid fa-arrow-up-right-from-square text-[8px] opacity-70"></i></a>';
              }).join(" ")
            + '</div>';
        }

        // Speaker 3-slide outline
        var slidesHtml = "";
        if (talk.slidesOutline && Array.isArray(talk.slidesOutline) && talk.slidesOutline.length > 0) {
          slidesHtml = '<div class="text-[11px] text-text/80 dark:text-darkmode-text/80 bg-theme-light/40 dark:bg-darkmode-theme-light/20 p-2.5 rounded-xl border border-border/50 dark:border-darkmode-border/50">'
            + '<span class="font-bold text-dark dark:text-darkmode-dark block mb-1"><i class="fa-solid fa-layer-group text-indigo-500 mr-1"></i> 3-Slide Speaker Flow:</span>'
            + '<ol class="list-decimal pl-4 space-y-0.5 font-mono text-[10.5px]">' + talk.slidesOutline.map(function(s) { return '<li>' + escapeHtml(s) + '</li>'; }).join("") + '</ol>'
            + '</div>';
        }

        return '<div class="bg-body dark:bg-darkmode-body border border-border/80 dark:border-darkmode-border/80 rounded-2xl p-5 shadow-xs hover:border-indigo-500/50 transition-all flex flex-col md:flex-row items-start justify-between gap-5 group">'
          + '<div class="space-y-2.5 flex-grow">'
          + '  <div class="flex items-center gap-2 flex-wrap">'
          + '    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-mono">#' + (idx + 1) + ' ' + escapeHtml(talk.format || "Deep Dive") + '</span>'
          + '    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ' + catClass + '">' + escapeHtml(talk.categoryType || "🌲 Evergreen Architectural Core") + '</span>'
          + '    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-text/80 dark:text-darkmode-text/80 font-mono">' + escapeHtml(talk.level || "Intermediate") + '</span>'
          + '  </div>'
          + '  <h4 class="text-base font-bold text-dark dark:text-darkmode-dark group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">' + escapeHtml(talk.title) + '</h4>'
          + '  <p class="text-xs text-text/80 dark:text-darkmode-text/80 leading-relaxed font-serif italic">&ldquo;' + escapeHtml(talk.abstract) + '&rdquo;</p>'
          + '  <div class="text-[11px] bg-indigo-500/5 dark:bg-indigo-500/10 border-l-2 border-indigo-500 p-2.5 rounded-r-xl">'
          + '    <span class="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1 mb-0.5"><i class="fa-solid fa-bullseye text-[10px]"></i> Why CFP Reviewers Pick This:</span>'
          + '    <span class="text-text/80 dark:text-darkmode-text/80 italic">&ldquo;' + escapeHtml(talk.whyReviewersAccept || "Addresses real production failure modes with zero vendor marketing.") + '&rdquo;</span>'
          + '  </div>'
          + refsHtml
          + slidesHtml
          + '  <div class="text-[11px] text-text/80 dark:text-darkmode-text/80 bg-theme-light/40 dark:bg-darkmode-theme-light/20 p-2.5 rounded-xl border border-border/50 dark:border-darkmode-border/50">'
          + '    <span class="font-bold text-dark dark:text-darkmode-dark block mb-1"><i class="fa-solid fa-chalkboard-user text-indigo-500 mr-1"></i> Key Attendee Takeaways:</span>'
          + '    <ul class="list-disc pl-4 space-y-0.5 font-mono text-[10.5px]">' + (talk.takeaways ? talk.takeaways.map(function(t) { return '<li>' + escapeHtml(t) + '</li>'; }).join("") : '<li>Practical hands-on runbook</li>') + '</ul>'
          + '  </div>'
          + '</div>'
          + '<div class="shrink-0 flex sm:flex-col gap-2 w-full sm:w-auto">'
          + '  <button data-save-talk-id="' + escapeHtml(talk.id) + '" class="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:text-indigo-400 dark:hover:text-white border border-indigo-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">'
          + '    <i class="fa-regular fa-star"></i> <span>Save to Vault</span>'
          + '  </button>'
          + '  <button data-copy-talk-id="' + escapeHtml(talk.id) + '" class="px-3 py-1.5 rounded-xl bg-theme-light dark:bg-darkmode-theme-light hover:border-indigo-500 border border-border/80 dark:border-darkmode-border/80 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap" title="Copy full CFP proposal formatted for submission">'
          + '    <i class="fa-regular fa-copy"></i> <span>Copy CFP Pitch</span>'
          + '  </button>'
          + '  <button data-discard-talk-id="' + escapeHtml(talk.id) + '" class="px-3 py-1.5 rounded-xl text-text/50 hover:text-red-500 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap" title="Discard proposal and rotate next">'
          + '    <i class="fa-solid fa-xmark text-sm"></i> <span>Discard</span>'
          + '  </button>'
          + '</div>'
          + '</div>';
      }).join("");

      attachTalkIdeaHandlers();
    }

    // Render Permanent Talks Vault
    function renderPermanentTalksVault() {
      var grid = document.getElementById("vault-talks-grid");
      var countEl = document.getElementById("vault-talks-count");
      if (!grid) return;
      var vault = getPermanentTalks();
      if (countEl) countEl.textContent = vault.length;

      if (!vault.length) {
        grid.innerHTML = '<div class="p-6 text-center border border-border/60 dark:border-darkmode-border/60 rounded-2xl bg-theme-light/10 dark:bg-darkmode-theme-light/5 text-xs text-text/60 dark:text-darkmode-text/60">Star proposals from above to keep them permanently in your CFP vault.</div>';
        return;
      }

      grid.innerHTML = vault.map(function(talk) {
        return '<div class="bg-body dark:bg-darkmode-body border border-border/80 dark:border-darkmode-border/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">'
          + '<div>'
          + '  <div class="flex items-center gap-2 mb-1 flex-wrap">'
          + '    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-mono">' + escapeHtml(talk.format || "Talk") + '</span>'
          + '    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ' + getCategoryBadgeClass(talk.categoryType) + '">' + escapeHtml(talk.categoryType || "Starred Proposal") + '</span>'
          + '  </div>'
          + '  <h5 class="text-sm font-bold text-dark dark:text-darkmode-dark">' + escapeHtml(talk.title) + '</h5>'
          + '  <p class="text-xs text-text/70 dark:text-darkmode-text/70 mt-0.5 line-clamp-1 italic">&ldquo;' + escapeHtml(talk.abstract) + '&rdquo;</p>'
          + '</div>'
          + '<div class="shrink-0 flex items-center gap-2">'
          + '  <button data-copy-talk-vault-id="' + escapeHtml(talk.id) + '" class="px-3 py-1.5 rounded-xl bg-theme-light dark:bg-darkmode-theme-light hover:border-indigo-500 border border-border/80 dark:border-darkmode-border/80 text-xs font-semibold transition-all cursor-pointer">'
          + '    <i class="fa-regular fa-copy mr-1"></i> Copy'
          + '  </button>'
          + '  <button data-delete-talk-vault-id="' + escapeHtml(talk.id) + '" class="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer" title="Delete from vault">'
          + '    <i class="fa-regular fa-trash-can mr-1"></i> Delete'
          + '  </button>'
          + '</div>'
          + '</div>';
      }).join("");

      attachTalkVaultHandlers();
    }

    function attachTalkIdeaHandlers() {
      // Save to Vault
      document.querySelectorAll("[data-save-talk-id]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = btn.getAttribute("data-save-talk-id");
          var talks = getEphemeralTalks();
          var item = talks.find(function(t) { return t.id === id; });
          if (!item) return;

          var vault = getPermanentTalks();
          if (!vault.some(function(v) { return v.id === id; })) {
            vault.unshift(item);
            savePermanentTalks(vault);
          }
          btn.innerHTML = '<i class="fa-solid fa-check text-indigo-500"></i> <span>Saved!</span>';
          btn.classList.add("pointer-events-none");
        });
      });

      // Discard from Top 5
      document.querySelectorAll("[data-discard-talk-id]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = btn.getAttribute("data-discard-talk-id");
          var talks = getEphemeralTalks().filter(function(t) { return t.id !== id; });
          saveEphemeralTalks(talks);
        });
      });

      // Copy CFP Pitch formatted for submission platforms
      document.querySelectorAll("[data-copy-talk-id]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = btn.getAttribute("data-copy-talk-id");
          var talks = getEphemeralTalks();
          var talk = talks.find(function(t) { return t.id === id; });
          if (!talk) return;

          var refsLines = [];
          if (talk.groundingRefs && talk.groundingRefs.length) {
            refsLines.push("");
            refsLines.push("## Grounding Research & Specs");
            talk.groundingRefs.forEach(function(r) {
              refsLines.push("- [" + r.title + "](" + r.url + ")");
            });
          }

          var slidesLines = [];
          if (talk.slidesOutline && talk.slidesOutline.length) {
            slidesLines.push("");
            slidesLines.push("## 3-Slide Speaker Flow");
            talk.slidesOutline.forEach(function(s, i) {
              slidesLines.push((i + 1) + ". " + s);
            });
          }

          var takeawaysLines = [];
          if (talk.takeaways && talk.takeaways.length) {
            talk.takeaways.forEach(function(t) {
              takeawaysLines.push("- " + t);
            });
          } else {
            takeawaysLines.push("- Practical runbook and manifests");
          }

          var textParts = [
            "# Proposal Title: " + talk.title,
            "",
            "**Format:** " + (talk.format || "45-min Deep Dive"),
            "**Category / Track:** " + (talk.categoryType || "Cloud Architecture"),
            "**Target Audience:** " + (talk.audience || "Cloud Architects, SREs, DevOps Engineers"),
            "**Level:** " + (talk.level || "Intermediate / Advanced"),
            "",
            "## Session Abstract",
            talk.abstract || "",
            "",
            "## Why CFP Reviewers Should Accept This Session",
            talk.whyReviewersAccept || "Addresses production pain points with zero product pitch.",
            "",
            "## Key Attendee Takeaways"
          ];

          textParts = textParts.concat(takeawaysLines);
          if (refsLines.length) textParts = textParts.concat(refsLines);
          if (slidesLines.length) textParts = textParts.concat(slidesLines);

          var fullPitch = textParts.join("\n");
          navigator.clipboard.writeText(fullPitch).then(function() {
            var orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check text-emerald-500"></i> <span>Copied!</span>';
            setTimeout(function() { btn.innerHTML = orig; }, 1800);
          });
        });
      });
    }

    function attachTalkVaultHandlers() {
      document.querySelectorAll("[data-delete-talk-vault-id]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = btn.getAttribute("data-delete-talk-vault-id");
          if (!confirm("Are you sure you want to remove this talk proposal from your permanent vault?")) return;
          var vault = getPermanentTalks().filter(function(v) { return v.id !== id; });
          savePermanentTalks(vault);
        });
      });

      document.querySelectorAll("[data-copy-talk-vault-id]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = btn.getAttribute("data-copy-talk-vault-id");
          var vault = getPermanentTalks();
          var talk = vault.find(function(t) { return t.id === id; });
          if (!talk) return;
          navigator.clipboard.writeText("# " + talk.title + "\n\n" + talk.abstract).then(function() {
            var orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check text-emerald-500"></i> Copied!';
            setTimeout(function() { btn.innerHTML = orig; }, 1800);
          });
        });
      });
    }

    // Dropdown change listeners for instant switching of topics/proposals
    if (contentNicheSelect) {
      contentNicheSelect.addEventListener("change", function () {
        renderContentIdeas();
        if (contentStatusMsg) {
          contentStatusMsg.textContent = "📂 Switched to " + contentNicheSelect.options[contentNicheSelect.selectedIndex].text;
          contentStatusMsg.classList.remove("hidden");
          setTimeout(function () { contentStatusMsg.classList.add("hidden"); }, 2500);
        }
      });
    }

    if (talkVenueSelect) {
      talkVenueSelect.addEventListener("change", function () {
        renderTalkIdeas();
        if (talkStatusMsg) {
          talkStatusMsg.textContent = "📂 Switched to " + talkVenueSelect.options[talkVenueSelect.selectedIndex].text;
          talkStatusMsg.classList.remove("hidden");
          setTimeout(function () { talkStatusMsg.classList.add("hidden"); }, 2500);
        }
      });
    }

    // AI Generation Trigger for Content Engine (Generates 1 Topic at a time, FIFO rotation)
    var generateContentBtn = document.getElementById("generate-content-ideas-btn");
    var resetContentBtn = document.getElementById("reset-content-ideas-btn");
    var contentNicheSelect = document.getElementById("content-engine-niche-select");
    var contentStatusMsg = document.getElementById("content-engine-status-msg");

    if (resetContentBtn) {
      resetContentBtn.addEventListener("click", function() {
        var niche = contentNicheSelect ? contentNicheSelect.value : "all";
        var fresh5 = (defaultContentCurations[niche] || defaultContentCurations["all"]).slice(0, 5);
        saveEphemeralContentIdeas(fresh5);
        if (contentStatusMsg) {
          contentStatusMsg.textContent = "🔄 Reset active list to curated 5 topics.";
          contentStatusMsg.classList.remove("hidden");
          setTimeout(function() { contentStatusMsg.classList.add("hidden"); }, 2500);
        }
      });
    }

    if (generateContentBtn) {
      generateContentBtn.addEventListener("click", async function() {
        var niche = contentNicheSelect ? contentNicheSelect.value : "all";
        generateContentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-[11px]"></i> Analyzing Trends...';
        generateContentBtn.classList.add("pointer-events-none");
        if (contentStatusMsg) {
          contentStatusMsg.textContent = "Scanning cloud releases, CVEs, and search queries for " + niche + "...";
          contentStatusMsg.classList.remove("hidden");
        }

        var keyToUse = (typeof cachedGeminiApiKey !== "undefined" && cachedGeminiApiKey) ? cachedGeminiApiKey : localStorage.getItem("gcloudcafe_gemini_api_key");
        if (!keyToUse) {
          try {
            var res = await fetch(config.url + "/rest/v1/site_settings?key=eq.gemini_api_key&select=value", {
              headers: { "apikey": config.anonKey, "Authorization": "Bearer " + config.anonKey }
            });
            if (res.ok) {
              var rows = await res.json();
              if (rows && rows.length > 0) keyToUse = rows[0].value;
            }
          } catch(e) {}
        }

        var prompt = "You are the chief content strategist and lead cloud architect for GCloud Cafe (https://gcloudcafe.com).\n"
          + "Recommend exactly 1 high-impact, viral, practitioner-grade technical article to write next for the niche: '" + niche + "'.\n"
          + "Focus on real production pain points, recent CVEs, new Kubernetes/GCP features, or certification challenges.\n"
          + "STRICT FORMAT: Return ONLY a valid JSON object (no markdown fences, no raw text) with this exact structure:\n"
          + '{"id":"rec_' + Date.now() + '","title":"High CTR title","category":"Category Name","categoryType":"🌲 Evergreen Architectural Core","viralityScore":95,"whyViral":"Why this topic is trending right now","keywords":"3-4 target search keywords","groundingRefs":[{"title":"Reference Title","url":"https://..."}],"outline":["Key point 1","Key point 2","Key point 3"]}';

        var newSingleItem = null;

        if (keyToUse) {
          var models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
          for (var i = 0; i < models.length; i++) {
            try {
              var url = "https://generativelanguage.googleapis.com/v1beta/models/" + models[i] + ":generateContent?key=" + encodeURIComponent(keyToUse);
              var resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } })
              });
              if (resp.ok) {
                var jsonResp = await resp.json();
                var rawTxt = jsonResp?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                var cleaned = rawTxt.replace(/```json/g, "").replace(/```/g, "").trim();
                var parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  newSingleItem = parsed[0];
                } else if (parsed && typeof parsed === "object" && parsed.title) {
                  newSingleItem = parsed;
                }
                if (newSingleItem) break;
              }
            } catch(e) {}
          }
        }

        if (!newSingleItem) {
          // Fallback: pick a fresh item from pool that is not currently in the top 5
          var pool = defaultContentCurations[niche] || defaultContentCurations["all"];
          var current = getEphemeralContentIdeas();
          var existingIds = current.map(function(c) { return c.id; });
          var candidate = pool.find(function(p) { return existingIds.indexOf(p.id) === -1; });
          if (!candidate) {
            var base = pool[Math.floor(Math.random() * pool.length)];
            candidate = JSON.parse(JSON.stringify(base));
            candidate.id = "rec_" + Date.now();
          }
          newSingleItem = candidate;
        }

        // FIFO 1-at-a-time rotation: Insert at #1 and keep top 5 (drops oldest #5)
        var existingList = getEphemeralContentIdeas();
        if (!existingList.length) {
          existingList = (defaultContentCurations[niche] || defaultContentCurations["all"]).slice(0, 5);
        }
        existingList.unshift(newSingleItem);
        saveEphemeralContentIdeas(existingList.slice(0, 5));

        generateContentBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Generate 1 Fresh Topic</span>';
        generateContentBtn.classList.remove("pointer-events-none");
        if (contentStatusMsg) {
          contentStatusMsg.textContent = "✨ Generated 1 fresh topic! Pushed to #1 and rotated oldest out of Top 5.";
          setTimeout(function() { contentStatusMsg.classList.add("hidden"); }, 3500);
        }
      });
    }

    // AI Generation Trigger for Talk Hub (Generates 1 Proposal at a time, FIFO rotation)
    var generateTalksBtn = document.getElementById("generate-talk-ideas-btn");
    var resetTalksBtn = document.getElementById("reset-talk-ideas-btn");
    var talkVenueSelect = document.getElementById("talk-venue-select");
    var talkStatusMsg = document.getElementById("talk-status-msg");

    if (resetTalksBtn) {
      resetTalksBtn.addEventListener("click", function() {
        var venue = talkVenueSelect ? talkVenueSelect.value : "cloud-native";
        var fresh5 = (defaultTalkCurations[venue] || defaultTalkCurations["cloud-native"]).slice(0, 5);
        saveEphemeralTalks(fresh5);
        if (talkStatusMsg) {
          talkStatusMsg.textContent = "🔄 Reset active talk list to curated 5 proposals.";
          talkStatusMsg.classList.remove("hidden");
          setTimeout(function() { talkStatusMsg.classList.add("hidden"); }, 2500);
        }
      });
    }

    if (generateTalksBtn) {
      generateTalksBtn.addEventListener("click", async function() {
        var venue = talkVenueSelect ? talkVenueSelect.value : "cloud-native";
        generateTalksBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-[11px]"></i> Formulating Talk...';
        generateTalksBtn.classList.add("pointer-events-none");
        if (talkStatusMsg) {
          talkStatusMsg.textContent = "Formulating CFP proposal for " + venue + "...";
          talkStatusMsg.classList.remove("hidden");
        }

        var keyToUse = (typeof cachedGeminiApiKey !== "undefined" && cachedGeminiApiKey) ? cachedGeminiApiKey : localStorage.getItem("gcloudcafe_gemini_api_key");
        if (!keyToUse) {
          try {
            var res = await fetch(config.url + "/rest/v1/site_settings?key=eq.gemini_api_key&select=value", {
              headers: { "apikey": config.anonKey, "Authorization": "Bearer " + config.anonKey }
            });
            if (res.ok) {
              var rows = await res.json();
              if (rows && rows.length > 0) keyToUse = rows[0].value;
            }
          } catch(e) {}
        }

        var prompt = "You are a top-tier tech conference CFP reviewer and veteran cloud speaker for major events like KubeCon, Google Cloud Next, and DevOpsDays.\n"
          + "Formulate exactly 1 CFP-ready conference talk proposal for venue: '" + venue + "' from the perspective of a seasoned, battle-tested cloud engineer.\n"
          + "Focus on real production pain points, war stories, architecture benchmarks, and zero marketing fluff.\n"
          + "STRICT FORMAT: Return ONLY a valid JSON object (no markdown fences, no raw text) with this exact structure:\n"
          + '{"id":"talk_' + Date.now() + '","title":"Compelling talk title","format":"45-min Deep Dive","level":"Intermediate","audience":"Target roles","categoryType":"🌲 Evergreen Architectural Core","whyReviewersAccept":"1 sharp sentence explaining why conference reviewers will accept this over 200 other submissions","groundingRefs":[{"title":"Spec or Paper Title","url":"https://..."}],"abstract":"2-3 sentence engaging abstract","takeaways":["Takeaway 1","Takeaway 2","Takeaway 3"],"slidesOutline":["Slide 1: Anti-pattern & Root Cause","Slide 2: Architecture & Benchmarks","Slide 3: Production Runbook"]}';

        var newSingleTalk = null;

        if (keyToUse) {
          var models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
          for (var i = 0; i < models.length; i++) {
            try {
              var url = "https://generativelanguage.googleapis.com/v1beta/models/" + models[i] + ":generateContent?key=" + encodeURIComponent(keyToUse);
              var resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } })
              });
              if (resp.ok) {
                var jsonResp = await resp.json();
                var rawTxt = jsonResp?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                var cleaned = rawTxt.replace(/```json/g, "").replace(/```/g, "").trim();
                var parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  newSingleTalk = parsed[0];
                } else if (parsed && typeof parsed === "object" && parsed.title) {
                  newSingleTalk = parsed;
                }
                if (newSingleTalk) break;
              }
            } catch(e) {}
          }
        }

        if (!newSingleTalk) {
          // Fallback: pick a fresh item from pool that is not currently in the top 5
          var pool = defaultTalkCurations[venue] || defaultTalkCurations["cloud-native"];
          var current = getEphemeralTalks();
          var existingIds = current.map(function(c) { return c.id; });
          var candidate = pool.find(function(p) { return existingIds.indexOf(p.id) === -1; });
          if (!candidate) {
            var base = pool[Math.floor(Math.random() * pool.length)];
            candidate = JSON.parse(JSON.stringify(base));
            candidate.id = "talk_" + Date.now();
          }
          newSingleTalk = candidate;
        }

        // FIFO 1-at-a-time rotation: Insert at #1 and keep top 5 (drops oldest #5)
        var existingTalks = getEphemeralTalks();
        if (!existingTalks.length) {
          existingTalks = (defaultTalkCurations[venue] || defaultTalkCurations["cloud-native"]).slice(0, 5);
        }
        existingTalks.unshift(newSingleTalk);
        saveEphemeralTalks(existingTalks.slice(0, 5));

        generateTalksBtn.innerHTML = '<i class="fa-solid fa-microphone-lines"></i> <span>Generate 1 Fresh Talk</span>';
        generateTalksBtn.classList.remove("pointer-events-none");
        if (talkStatusMsg) {
          talkStatusMsg.textContent = "🎙️ Formulated 1 fresh talk proposal! Pushed to #1 and rotated oldest out of Top 5.";
          setTimeout(function() { talkStatusMsg.classList.add("hidden"); }, 3500);
        }
      });
    }

    // Initial render of Content Engine & Talk Hub
    renderContentIdeas();
    renderPermanentContentVault();
    renderTalkIdeas();
    renderPermanentTalksVault();

    // Check existing authentication once all variables, data structures, and handlers are initialized
    if (sessionStorage.getItem("pulse_admin_authed") === "true") {
      unlockDashboard();
    }


    // Export Subscribers CSV
    if (exportSubscribersCsvBtn) {
      exportSubscribersCsvBtn.addEventListener("click", function () {
        if (!cachedSubscribers.length) return;
        var csvRows = ["id,email,created_at"];
        cachedSubscribers.forEach(function (s) {
          csvRows.push([
            '"' + (s.id || "") + '"',
            '"' + (s.email || "").replace(/"/g, '""') + '"',
            '"' + (s.created_at || "") + '"'
          ].join(","));
        });
        var csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
        var link = document.createElement("a");
        link.setAttribute("href", csvContent);
        link.setAttribute("download", "gcloudcafe-newsletter-subscribers-" + new Date().toISOString().slice(0, 10) + ".csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    /* ── Weekly Polls Queue Manager in Community Admin ── */
    var cachedPollsQueue = null;
    var pollsFilterStatus = "all";

    function showPollsToast(msg) {
      var toast = document.getElementById("admin-polls-toast");
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.remove("hidden");
      setTimeout(function () { toast.classList.add("hidden"); }, 3000);
    }

    function getAdminActivePollId() {
      try {
        var override = localStorage.getItem("gcloudcafe_admin_active_poll_id");
        if (override) return override;
      } catch (e) {}
      return "week-2026-39";
    }

    function loadPollsQueueData(callback) {
      if (cachedPollsQueue && cachedPollsQueue.length > 0) {
        if (callback) callback(cachedPollsQueue);
        return;
      }

      try {
        var localQueue = localStorage.getItem("gcloudcafe_admin_polls_queue");
        if (localQueue) {
          cachedPollsQueue = JSON.parse(localQueue);
          if (Array.isArray(cachedPollsQueue) && cachedPollsQueue.length > 0) {
            if (callback) callback(cachedPollsQueue);
            return;
          }
        }
      } catch (e) {}

      fetch("/data/weekly_polls.json")
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (Array.isArray(data) && data.length > 0) {
            cachedPollsQueue = data;
          } else {
            cachedPollsQueue = [];
          }
          if (callback) callback(cachedPollsQueue);
        })
        .catch(function () {
          cachedPollsQueue = [];
          if (callback) callback(cachedPollsQueue);
        });
    }

    function renderWeeklyPollsAdminQueue() {
      loadPollsQueueData(function (polls) {
        var activePollId = getAdminActivePollId();
        var activePoll = polls.find(function (p) { return p.id === activePollId; }) || polls[0];

        if (weeklyPollsCountBadge) {
          weeklyPollsCountBadge.textContent = polls.length;
        }

        var liveTopicEl = document.getElementById("admin-live-poll-topic");
        var liveQuestionEl = document.getElementById("admin-live-poll-question");
        var liveVotesEl = document.getElementById("admin-live-poll-votes");
        var queueTotalEl = document.getElementById("admin-queue-total-count");

        if (queueTotalEl) queueTotalEl.textContent = polls.length;

        var adminTimerEl = document.getElementById("admin-polls-countdown");
        if (adminTimerEl) {
          var now = new Date();
          var targetDate = new Date(now.getTime());
          var day = now.getUTCDay();
          var daysUntilSunday = (7 - day) % 7;
          if (daysUntilSunday === 0 && (now.getUTCHours() > 0 || now.getUTCMinutes() > 0 || now.getUTCSeconds() > 0)) {
            daysUntilSunday = 7;
          }
          targetDate.setUTCDate(now.getUTCDate() + daysUntilSunday);
          targetDate.setUTCHours(0, 0, 0, 0);
          var diff = targetDate.getTime() - now.getTime();
          if (diff > 0) {
            var d = Math.floor(diff / (1000 * 60 * 60 * 24));
            var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            var pad = function(n) { return n < 10 ? "0" + n : n; };
            adminTimerEl.textContent = "Next in: " + (d > 0 ? (d + "d " + pad(h) + "h " + pad(m) + "m") : (pad(h) + "h " + pad(m) + "m"));
          }
        }

        if (activePoll) {
          if (liveTopicEl) liveTopicEl.textContent = "Week " + (activePoll.weekNumber || activePoll.week || 39) + " · " + (activePoll.topic || activePoll.category);
          if (liveQuestionEl) liveQuestionEl.textContent = activePoll.question;

          var totalRecordedVotes = 0;
          try {
            var rawVote = localStorage.getItem("gcloudcafe_weekly_poll_" + activePoll.id);
            if (rawVote) totalRecordedVotes += 1;
          } catch (e) {}
          (activePoll.options || []).forEach(function (o) { totalRecordedVotes += (o.votes || 0); });
          if (activePoll.otherOption) totalRecordedVotes += (activePoll.otherOption.votes || 0);

          if (liveVotesEl) liveVotesEl.textContent = totalRecordedVotes + (totalRecordedVotes === 1 ? " vote recorded" : " votes recorded");
        }

        var searchInput = document.getElementById("admin-polls-search-input");
        var query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        var filtered = polls.filter(function (p) {
          var isLive = p.id === activePollId;
          if (pollsFilterStatus === "active" && !isLive) return false;
          if (pollsFilterStatus === "upcoming" && isLive) return false;

          if (query) {
            var text = ((p.topic || "") + " " + (p.category || "") + " " + (p.question || "") + " week " + p.weekNumber).toLowerCase();
            if (!text.includes(query)) return false;
          }
          return true;
        });

        var countAllEl = document.getElementById("filter-polls-count-all");
        if (countAllEl) countAllEl.textContent = polls.length;

        var grid = document.getElementById("admin-polls-queue-grid");
        if (!grid) return;

        if (filtered.length === 0) {
          grid.innerHTML = '<div class="p-8 text-center bg-body dark:bg-darkmode-body border border-border/70 rounded-2xl text-xs text-text/60">No polls matched your filter.</div>';
          return;
        }

        var upcomingPollsList = polls.filter(function (p) { return p.id !== activePollId; });
        var html = '';
        filtered.forEach(function (poll) {
          var isLive = poll.id === activePollId;
          var weekNum = poll.weekNumber || poll.week || 39;
          var borderClass = isLive
            ? "border-2 border-emerald-500/70 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]"
            : "border border-border/80 dark:border-darkmode-border/80 bg-body dark:bg-darkmode-body";

          html += '<div class="p-5 rounded-2xl ' + borderClass + ' shadow-xs space-y-3 transition-all" data-poll-id="' + poll.id + '">';
            html += '<div class="flex flex-wrap items-center justify-between gap-2">';
              html += '<div class="flex items-center gap-2">';
                html += '<span class="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ' + (isLive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300') + '">Week ' + weekNum + ' (' + (poll.year || 2026) + ')</span>';
                html += '<span class="text-xs font-semibold text-text/70 dark:text-darkmode-text/70">' + escapeHtml(poll.category || 'Architecture') + '</span>';
              html += '</div>';

              html += '<div class="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">';
                if (isLive) {
                  html += '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-white shadow-xs">';
                    html += '<span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE ON SITE';
                  html += '</span>';
                } else {
                  var upcomingIndex = upcomingPollsList.indexOf(poll);
                  if (upcomingIndex === 0) {
                    html += '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs">';
                      html += '<i class="fa-regular fa-clock text-[9px]"></i> Next in Line';
                    html += '</span>';
                  } else {
                    html += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-text/60 border border-border/40">';
                      html += 'Queue #' + (upcomingIndex + 1);
                    html += '</span>';
                  }

                  // Queue reorder controls
                  html += '<button data-admin-move-up-poll="' + poll.id + '" class="px-2 py-1 rounded-lg bg-theme-light dark:bg-darkmode-theme-light hover:bg-slate-200 dark:hover:bg-slate-700 text-text/70 text-[10px] font-bold border border-border/70 cursor-pointer" title="Move Up in Queue">';
                    html += '<i class="fa-solid fa-arrow-up text-[9px]"></i>';
                  html += '</button>';
                  html += '<button data-admin-move-down-poll="' + poll.id + '" class="px-2 py-1 rounded-lg bg-theme-light dark:bg-darkmode-theme-light hover:bg-slate-200 dark:hover:bg-slate-700 text-text/70 text-[10px] font-bold border border-border/70 cursor-pointer" title="Move Down in Queue">';
                    html += '<i class="fa-solid fa-arrow-down text-[9px]"></i>';
                  html += '</button>';
                }

                html += '<button data-admin-edit-poll="' + poll.id + '" class="px-2 py-1 rounded-lg bg-theme-light dark:bg-darkmode-theme-light hover:bg-slate-200 dark:hover:bg-slate-700 text-text/80 text-[11px] font-semibold border border-border/80 cursor-pointer flex items-center gap-1">';
                  html += '<i class="fa-solid fa-pen text-[9px]"></i> Edit';
                html += '</button>';

                html += '<button data-admin-reset-poll-votes="' + poll.id + '" class="px-2 py-1 rounded-lg bg-transparent hover:bg-rose-500/10 text-rose-500 text-[11px] font-semibold border border-rose-500/30 cursor-pointer" title="Reset votes for this poll">';
                  html += '<i class="fa-solid fa-rotate-left text-[9px]"></i> Reset';
                html += '</button>';

                html += '<button data-admin-delete-poll="' + poll.id + '" class="px-2 py-1 rounded-lg bg-transparent hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-semibold border border-rose-500/40 cursor-pointer flex items-center gap-1" title="Delete poll (next item replaces it)">';
                  html += '<i class="fa-solid fa-trash text-[9px]"></i> Delete';
                html += '</button>';
              html += '</div>';
            html += '</div>';

            html += '<div>';
              html += '<h4 class="text-sm sm:text-base font-black text-dark dark:text-darkmode-dark mb-1 leading-snug">' + escapeHtml(poll.question) + '</h4>';
              html += '<p class="text-xs text-text/70 dark:text-darkmode-text/70 m-0 leading-relaxed">' + escapeHtml(poll.context || '') + '</p>';
            html += '</div>';

            html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">';
              (poll.options || []).forEach(function (opt, idx) {
                html += '<div class="p-2 rounded-lg bg-theme-light/40 dark:bg-darkmode-theme-light/30 border border-border/50 flex items-start gap-2">';
                  html += '<span class="font-mono text-[10px] font-bold text-primary mt-0.5">' + (idx + 1) + '.</span>';
                  html += '<div class="min-w-0 flex-grow">';
                    html += '<div class="font-bold text-dark dark:text-darkmode-dark text-[11px] leading-tight">' + escapeHtml(opt.text) + '</div>';
                    html += '<div class="text-[10px] text-text/60 truncate">' + escapeHtml(opt.description || '') + '</div>';
                  html += '</div>';
                html += '</div>';
              });
              if (poll.otherOption) {
                html += '<div class="p-2 rounded-lg bg-theme-light/40 dark:bg-darkmode-theme-light/30 border border-dashed border-border/70 flex items-start gap-2">';
                  html += '<span class="font-mono text-[10px] font-bold text-amber-500 mt-0.5">5.</span>';
                  html += '<div class="min-w-0 flex-grow">';
                    html += '<div class="font-bold text-dark dark:text-darkmode-dark text-[11px] leading-tight">' + escapeHtml(poll.otherOption.text) + '</div>';
                    html += '<div class="text-[10px] text-text/60 truncate">' + escapeHtml(poll.otherOption.description || '') + '</div>';
                  html += '</div>';
                html += '</div>';
              }
            html += '</div>';

          html += '</div>';
        });

        grid.innerHTML = html;

        // Move Up in Queue
        grid.querySelectorAll("[data-admin-move-up-poll]").forEach(function (btn) {
          btn.onclick = function (e) {
            e.preventDefault();
            var targetId = btn.getAttribute("data-admin-move-up-poll");
            var idx = polls.findIndex(function (p) { return p.id === targetId; });
            if (idx > 0) {
              // Ensure we don't swap with active poll if active poll is at 0
              var prevIdx = idx - 1;
              var temp = polls[idx];
              polls[idx] = polls[prevIdx];
              polls[prevIdx] = temp;
              cachedPollsQueue = polls;
              try {
                localStorage.setItem("gcloudcafe_admin_polls_queue", JSON.stringify(polls));
              } catch (err) {}
              showPollsToast("Moved up in queue!");
              renderWeeklyPollsAdminQueue();
            }
          };
        });

        // Move Down in Queue
        grid.querySelectorAll("[data-admin-move-down-poll]").forEach(function (btn) {
          btn.onclick = function (e) {
            e.preventDefault();
            var targetId = btn.getAttribute("data-admin-move-down-poll");
            var idx = polls.findIndex(function (p) { return p.id === targetId; });
            if (idx >= 0 && idx < polls.length - 1) {
              var nextIdx = idx + 1;
              var temp = polls[idx];
              polls[idx] = polls[nextIdx];
              polls[nextIdx] = temp;
              cachedPollsQueue = polls;
              try {
                localStorage.setItem("gcloudcafe_admin_polls_queue", JSON.stringify(polls));
              } catch (err) {}
              showPollsToast("Moved down in queue!");
              renderWeeklyPollsAdminQueue();
            }
          };
        });

        // Delete Poll from Queue (next item automatically replaces it)
        grid.querySelectorAll("[data-admin-delete-poll]").forEach(function (btn) {
          btn.onclick = function (e) {
            e.preventDefault();
            var targetId = btn.getAttribute("data-admin-delete-poll");
            var idx = polls.findIndex(function (p) { return p.id === targetId; });
            if (idx < 0) return;

            var isTargetActive = (targetId === activePollId);
            var confirmMsg = isTargetActive
              ? "Are you sure you want to delete the active poll? The next scheduled question in the queue will immediately replace it."
              : "Are you sure you want to delete this poll? Upcoming queued questions will automatically shift up to replace it.";

            if (!confirm(confirmMsg)) return;

            // Remove poll from array
            polls.splice(idx, 1);

            // Clean up localStorage vote record for deleted poll
            try {
              localStorage.removeItem("gcloudcafe_weekly_poll_" + targetId);
            } catch (err) {}

            // If deleted poll was active, promote next item in queue to be active
            if (isTargetActive && polls.length > 0) {
              var newActivePoll = polls[idx] || polls[0];
              try {
                localStorage.setItem("gcloudcafe_admin_active_poll_id", newActivePoll.id);
              } catch (err) {}
              showPollsToast("Active poll deleted. Replaced by: " + (newActivePoll.topic || newActivePoll.question));
            } else {
              showPollsToast("Poll deleted. Queue automatically shifted up!");
            }

            cachedPollsQueue = polls;
            try {
              localStorage.setItem("gcloudcafe_admin_polls_queue", JSON.stringify(polls));
            } catch (err) {}

            renderWeeklyPollsAdminQueue();
          };
        });

        grid.querySelectorAll("[data-admin-reset-poll-votes]").forEach(function (btn) {
          btn.onclick = function (e) {
            e.preventDefault();
            var targetId = btn.getAttribute("data-admin-reset-poll-votes");
            try {
              localStorage.removeItem("gcloudcafe_weekly_poll_" + targetId);
            } catch (err) {}
            var pObj = polls.find(function (p) { return p.id === targetId; });
            if (pObj) {
              (pObj.options || []).forEach(function (o) { o.votes = 0; });
              if (pObj.otherOption) pObj.otherOption.votes = 0;
              try {
                localStorage.setItem("gcloudcafe_admin_polls_queue", JSON.stringify(polls));
              } catch (err) {}
            }
            showPollsToast("Reset votes for " + targetId);
            renderWeeklyPollsAdminQueue();
          };
        });

        grid.querySelectorAll("[data-admin-edit-poll]").forEach(function (btn) {
          btn.onclick = function (e) {
            e.preventDefault();
            var targetId = btn.getAttribute("data-admin-edit-poll");
            var pObj = polls.find(function (p) { return p.id === targetId; });
            if (!pObj) return;

            openPollModal("edit", pObj);
          };
        });
      });
    }

    function openPollModal(mode, poll) {
      var modal = document.getElementById("admin-poll-modal");
      if (!modal) return;
      var title = document.getElementById("admin-poll-modal-title");
      var modeInput = document.getElementById("poll-form-mode");
      var idInput = document.getElementById("poll-form-id");

      var weekInput = document.getElementById("poll-form-week");
      var categoryInput = document.getElementById("poll-form-category");
      var badgeInput = document.getElementById("poll-form-badge");
      var topicInput = document.getElementById("poll-form-topic");
      var questionInput = document.getElementById("poll-form-question");
      var contextInput = document.getElementById("poll-form-context");

      var opt1 = document.getElementById("poll-form-opt1");
      var opt1Desc = document.getElementById("poll-form-opt1-desc");
      var opt2 = document.getElementById("poll-form-opt2");
      var opt2Desc = document.getElementById("poll-form-opt2-desc");
      var opt3 = document.getElementById("poll-form-opt3");
      var opt3Desc = document.getElementById("poll-form-opt3-desc");
      var opt4 = document.getElementById("poll-form-opt4");
      var opt4Desc = document.getElementById("poll-form-opt4-desc");

      if (mode === "edit" && poll) {
        if (title) title.innerHTML = '<i class="fa-solid fa-pen-to-square text-emerald-500"></i> Edit Week ' + poll.weekNumber + ' Poll';
        if (modeInput) modeInput.value = "edit";
        if (idInput) idInput.value = poll.id;
        if (weekInput) weekInput.value = poll.weekNumber || 39;
        if (categoryInput) categoryInput.value = poll.category || "";
        if (badgeInput) badgeInput.value = poll.badge || "Question of the Week";
        if (topicInput) topicInput.value = poll.topic || "";
        if (questionInput) questionInput.value = poll.question || "";
        if (contextInput) contextInput.value = poll.context || "";

        var opts = poll.options || [];
        if (opt1 && opts[0]) opt1.value = opts[0].text || "";
        if (opt1Desc && opts[0]) opt1Desc.value = opts[0].description || "";
        if (opt2 && opts[1]) opt2.value = opts[1].text || "";
        if (opt2Desc && opts[1]) opt2Desc.value = opts[1].description || "";
        if (opt3 && opts[2]) opt3.value = opts[2].text || "";
        if (opt3Desc && opts[2]) opt3Desc.value = opts[2].description || "";
        if (opt4 && opts[3]) opt4.value = opts[3].text || "";
        if (opt4Desc && opts[3]) opt4Desc.value = opts[3].description || "";
      } else {
        if (title) title.innerHTML = '<i class="fa-solid fa-calendar-plus text-emerald-500"></i> Schedule New Weekly Poll';
        if (modeInput) modeInput.value = "create";
        if (idInput) idInput.value = "";
        var form = document.getElementById("admin-poll-form");
        if (form) form.reset();
        if (badgeInput) badgeInput.value = "Question of the Week";
      }

      modal.classList.remove("hidden");
      modal.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    var modalCloseBtn = document.getElementById("admin-poll-modal-close");
    var modalCancelBtn = document.getElementById("admin-poll-cancel-btn");
    var pollModal = document.getElementById("admin-poll-modal");
    if (modalCloseBtn && pollModal) {
      modalCloseBtn.onclick = function () { pollModal.classList.add("hidden"); };
    }
    if (modalCancelBtn && pollModal) {
      modalCancelBtn.onclick = function () { pollModal.classList.add("hidden"); };
    }

    var createPollBtn = document.getElementById("admin-create-poll-btn");
    if (createPollBtn) {
      createPollBtn.onclick = function () { openPollModal("create", null); };
    }

    var pollForm = document.getElementById("admin-poll-form");
    if (pollForm) {
      pollForm.onsubmit = function (e) {
        e.preventDefault();
        var mode = document.getElementById("poll-form-mode").value;
        var existingId = document.getElementById("poll-form-id").value;
        var weekVal = parseInt(document.getElementById("poll-form-week").value, 10);
        var pollId = existingId || ("week-2026-" + weekVal);

        var newPollObj = {
          id: pollId,
          weekNumber: weekVal,
          year: 2026,
          category: document.getElementById("poll-form-category").value.trim(),
          badge: document.getElementById("poll-form-badge").value.trim(),
          topic: document.getElementById("poll-form-topic").value.trim(),
          question: document.getElementById("poll-form-question").value.trim(),
          context: document.getElementById("poll-form-context").value.trim(),
          options: [
            { id: "opt-1", text: document.getElementById("poll-form-opt1").value.trim(), description: document.getElementById("poll-form-opt1-desc").value.trim(), votes: 0 },
            { id: "opt-2", text: document.getElementById("poll-form-opt2").value.trim(), description: document.getElementById("poll-form-opt2-desc").value.trim(), votes: 0 },
            { id: "opt-3", text: document.getElementById("poll-form-opt3").value.trim(), description: document.getElementById("poll-form-opt3-desc").value.trim(), votes: 0 },
            { id: "opt-4", text: document.getElementById("poll-form-opt4").value.trim(), description: document.getElementById("poll-form-opt4-desc").value.trim(), votes: 0 }
          ],
          otherOption: { id: "other", text: "Other / Different perspective", description: "Hold an alternative architectural stance or distinct perspective", votes: 0 },
          customTakes: []
        };

        loadPollsQueueData(function (polls) {
          if (mode === "edit") {
            var idx = polls.findIndex(function (p) { return p.id === pollId; });
            if (idx >= 0) {
              polls[idx] = newPollObj;
            } else {
              polls.push(newPollObj);
            }
          } else {
            polls.push(newPollObj);
          }

          cachedPollsQueue = polls;
          try {
            localStorage.setItem("gcloudcafe_admin_polls_queue", JSON.stringify(polls));
          } catch (err) {}

          if (pollModal) pollModal.classList.add("hidden");
          showPollsToast("Poll saved to queue successfully!");
          renderWeeklyPollsAdminQueue();
        });
      };
    }

    var exportPollsBtn = document.getElementById("admin-export-polls-json-btn");
    if (exportPollsBtn) {
      exportPollsBtn.onclick = function (e) {
        e.preventDefault();
        loadPollsQueueData(function (polls) {
          var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(polls, null, 2));
          var downloadAnchor = document.createElement("a");
          downloadAnchor.setAttribute("href", dataStr);
          downloadAnchor.setAttribute("download", "weekly_polls.json");
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
          showPollsToast("Exported weekly_polls.json!");
        });
      };
    }

    var resetActiveVotesBtn = document.getElementById("admin-reset-all-poll-votes-btn");
    if (resetActiveVotesBtn) {
      resetActiveVotesBtn.onclick = function (e) {
        e.preventDefault();
        var activeId = getAdminActivePollId();
        try {
          localStorage.removeItem("gcloudcafe_weekly_poll_" + activeId);
        } catch (err) {}
        loadPollsQueueData(function (polls) {
          var activeP = polls.find(function (p) { return p.id === activeId; });
          if (activeP) {
            (activeP.options || []).forEach(function (o) { o.votes = 0; });
            if (activeP.otherOption) activeP.otherOption.votes = 0;
            try {
              localStorage.setItem("gcloudcafe_admin_polls_queue", JSON.stringify(polls));
            } catch (err) {}
          }
          showPollsToast("Active poll votes reset to 0!");
          renderWeeklyPollsAdminQueue();
        });
      };
    }

    var filterAllBtn = document.getElementById("filter-polls-all");
    var filterActiveBtn = document.getElementById("filter-polls-active");
    var filterUpcomingBtn = document.getElementById("filter-polls-upcoming");
    var searchPollsInput = document.getElementById("admin-polls-search-input");

    function setPollsFilter(status, btn) {
      pollsFilterStatus = status;
      [filterAllBtn, filterActiveBtn, filterUpcomingBtn].forEach(function (b) {
        if (!b) return;
        if (b === btn) {
          b.className = "px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white border-none cursor-pointer";
        } else {
          b.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-theme-light dark:bg-darkmode-theme-light text-text/70 hover:text-primary border border-border/60 cursor-pointer";
        }
      });
      renderWeeklyPollsAdminQueue();
    }

    if (filterAllBtn) filterAllBtn.onclick = function () { setPollsFilter("all", filterAllBtn); };
    if (filterActiveBtn) filterActiveBtn.onclick = function () { setPollsFilter("active", filterActiveBtn); };
    if (filterUpcomingBtn) filterUpcomingBtn.onclick = function () { setPollsFilter("upcoming", filterUpcomingBtn); };
    if (searchPollsInput) {
      searchPollsInput.addEventListener("input", function () { renderWeeklyPollsAdminQueue(); });
    }

  }

  /* ── Weekly Architecture Opinion & Question Poll System ── */
  function initWeeklyOpinionPollSystem() {
    var widget = document.getElementById("weekly-opinion-poll-widget");
    if (!widget) return;

    var container = widget.querySelector("[data-weekly-poll-container]");
    if (!container) return;

    var adminOverrideId = null;
    try { adminOverrideId = localStorage.getItem("gcloudcafe_admin_active_poll_id"); } catch (e) {}
    var pollId = adminOverrideId || widget.getAttribute("data-weekly-poll-id") || "week-2026-39";
    var storageKey = "gcloudcafe_weekly_poll_" + pollId;

    // Load active poll data from embedded JSON or fallback
    var pollData = null;
    var dataScript = document.getElementById("weekly-poll-active-data");
    if (dataScript && dataScript.textContent) {
      try {
        pollData = JSON.parse(dataScript.textContent);
      } catch (e) {
        console.warn("Failed to parse weekly-poll-active-data script:", e);
      }
    }

    if (!pollData) {
      // Fallback baseline for week 39
      pollData = {
        id: pollId,
        weekNumber: 39,
        year: 2026,
        category: "AI & Developer Workflows",
        topic: "Future of Software Engineering",
        question: "By 2027, what will software engineers spend most of their time doing?",
        context: "As AI tools evolve from simple code autocomplete to autonomous agents, how will everyday engineering work transform?",
        options: [
          { id: "reviewing-testing-ai-code", text: "Reviewing & testing AI-generated code", description: "Reading AI pull requests, validating edge cases, and catching subtle hallucinations", votes: 0 },
          { id: "system-design-architecture", text: "System design & architecture", description: "Designing data schemas, APIs, and writing precise specifications for AI agents to build", votes: 0 },
          { id: "writing-core-code-manually", text: "Writing core code by hand", description: "Crafting mission-critical business logic where human accuracy cannot be compromised", votes: 0 },
          { id: "debugging-production-fires", text: "Debugging production fires & outages", description: "Tracking down complex incidents, performance bottlenecks, and multi-service edge cases", votes: 0 }
        ],
        otherOption: { id: "other", text: "Other / Different perspective", description: "Hold a different perspective for how developer workflows will evolve", votes: 0 }
      };
    }

    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    var tallyKey = "weekly_poll_tallies_" + pollData.id;
    var providerPrefix = "wp_" + pollData.id + "_";

    // Retrieve and sync vote tallies so reloads reflect votes accurately
    function getStoredTallies() {
      var map = {};
      pollData.options.forEach(function (opt) {
        map[opt.id] = opt.votes || 0;
      });
      if (pollData.otherOption) {
        map[pollData.otherOption.id] = pollData.otherOption.votes || 0;
      }
      try {
        var raw = localStorage.getItem(tallyKey);
        if (raw) {
          var parsed = JSON.parse(raw);
          Object.keys(parsed).forEach(function (k) {
            map[k] = parsed[k];
          });
        }
      } catch (e) {}
      return map;
    }

    function saveTallies(tallies) {
      try {
        localStorage.setItem(tallyKey, JSON.stringify(tallies));
      } catch (e) {}
    }

    function applyTallies(userVote) {
      var tallies = getStoredTallies();
      if (userVote && userVote.optionId) {
        if (!tallies[userVote.optionId] || tallies[userVote.optionId] === 0) {
          tallies[userVote.optionId] = (tallies[userVote.optionId] || 0) + 1;
          saveTallies(tallies);
        }
      }
      pollData.options.forEach(function (opt) {
        opt.votes = tallies[opt.id] || 0;
      });
      if (pollData.otherOption) {
        pollData.otherOption.votes = tallies[pollData.otherOption.id] || 0;
      }
    }

    // Fetch remote accumulated votes from Supabase across all sessions
    function fetchRemoteWeeklyPollVotes() {
      if (!config || !config.url || !config.anonKey) return;
      var queryUrl = config.url + "/rest/v1/cloud_provider_polls?provider=like." + encodeURIComponent(providerPrefix) + "*&select=*";
      fetch(queryUrl, {
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey,
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      })
      .then(function (res) { return res.json(); })
      .then(function (rows) {
        if (Array.isArray(rows) && rows.length > 0) {
          var remoteTallies = {};
          rows.forEach(function (r) {
            if (r.provider && r.provider.indexOf(providerPrefix) === 0) {
              var optId = r.provider.slice(providerPrefix.length);
              remoteTallies[optId] = r.votes || 0;
            }
          });

          var localTallies = getStoredTallies();
          var mergedTallies = {};
          pollData.options.forEach(function (opt) {
            mergedTallies[opt.id] = Math.max(localTallies[opt.id] || 0, remoteTallies[opt.id] || 0);
          });
          if (pollData.otherOption) {
            mergedTallies[pollData.otherOption.id] = Math.max(localTallies[pollData.otherOption.id] || 0, remoteTallies[pollData.otherOption.id] || 0);
          }
          saveTallies(mergedTallies);

          var userVote = getSavedUserVote();
          applyTallies(userVote);
          if (userVote) {
            renderResultsState(userVote);
          }
        }
      })
      .catch(function (err) {
        console.warn("Weekly poll remote sync fetch warning:", err);
      });
    }

    // Sync individual vote atomically to Supabase for global cross-session accumulation
    function syncVoteToSupabase(optionId) {
      if (!config || !config.url || !config.anonKey) return;
      var targetProvider = providerPrefix + optionId;

      fetch(config.url + "/rest/v1/cloud_provider_polls?provider=eq." + encodeURIComponent(targetProvider) + "&select=*", {
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey,
          "Cache-Control": "no-cache"
        }
      })
      .then(function (res) { return res.json(); })
      .then(function (rows) {
        if (Array.isArray(rows) && rows.length > 0) {
          var current = rows[0];
          var newVotes = (current.votes || 0) + 1;
          var newToday = (current.today_votes || 0) + 1;
          return fetch(config.url + "/rest/v1/cloud_provider_polls?provider=eq." + encodeURIComponent(targetProvider), {
            method: "PATCH",
            headers: {
              "apikey": config.anonKey,
              "Authorization": "Bearer " + config.anonKey,
              "Content-Type": "application/json",
              "Prefer": "return=representation"
            },
            body: JSON.stringify({
              votes: newVotes,
              today_votes: newToday,
              updated_at: new Date().toISOString()
            })
          });
        } else {
          return fetch(config.url + "/rest/v1/cloud_provider_polls", {
            method: "POST",
            headers: {
              "apikey": config.anonKey,
              "Authorization": "Bearer " + config.anonKey,
              "Content-Type": "application/json",
              "Prefer": "return=representation"
            },
            body: JSON.stringify({
              provider: targetProvider,
              votes: 1,
              today_votes: 1,
              updated_at: new Date().toISOString()
            })
          });
        }
      })
      .then(function () {
        setTimeout(fetchRemoteWeeklyPollVotes, 300);
      })
      .catch(function (err) {
        console.warn("Weekly poll vote sync error:", err);
      });
    }

    // Check user vote in localStorage
    function getSavedUserVote() {
      try {
        var raw = localStorage.getItem(storageKey);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }

    // Render interactive voting state
    function renderVotingState() {
      var statusLabel = widget.querySelector("[data-weekly-poll-status-label]");
      if (statusLabel) statusLabel.textContent = "Active";
      var optionsHtml = '';
      pollData.options.forEach(function (opt) {
        optionsHtml += '<div class="poll-option-card p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 hover:border-red-500/50 hover:bg-red-500/[0.02] transition-all cursor-pointer group flex items-start justify-between gap-3" data-option-id="' + opt.id + '" role="button" tabindex="0" aria-label="Vote for ' + escapeHtml(opt.text) + '">' +
          '<div class="flex items-start gap-3 flex-grow">' +
            '<span class="poll-radio-indicator w-4 h-4 rounded-full border-2 border-slate-400 dark:border-slate-600 group-hover:border-red-500 shrink-0 mt-0.5 transition-colors flex items-center justify-center">' +
              '<span class="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-red-500/40"></span>' +
            '</span>' +
            '<div>' +
              '<div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">' + escapeHtml(opt.text) + '</div>' +
              '<div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">' + escapeHtml(opt.description) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      });

      // Add Option 5: Open-Ended / Alternative Perspective
      if (pollData.otherOption) {
        var other = pollData.otherOption;
        optionsHtml += '<div class="poll-option-card poll-option-other p-3.5 sm:p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/20 hover:border-red-500/70 hover:bg-red-500/[0.02] transition-all cursor-pointer group flex items-start justify-between gap-3" data-option-id="other" role="button" tabindex="0" aria-label="' + escapeHtml(other.text) + '">' +
          '<div class="flex items-start gap-3 flex-grow">' +
            '<span class="poll-radio-indicator w-4 h-4 rounded-full border-2 border-slate-400 dark:border-slate-600 group-hover:border-red-500 shrink-0 mt-0.5 transition-colors flex items-center justify-center">' +
              '<span class="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-red-500/40"></span>' +
            '</span>' +
            '<div>' +
              '<div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex items-center gap-1.5">' +
                '<i class="fa-regular fa-compass text-red-500 text-xs"></i>' +
                '<span>' + escapeHtml(other.text) + '</span>' +
              '</div>' +
              '<div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">' + escapeHtml(other.description) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }

      container.innerHTML = optionsHtml;

      // 1-Click voting on ANY option (including "other")
      container.querySelectorAll("[data-option-id]").forEach(function (card) {
        var optId = card.getAttribute("data-option-id");
        card.addEventListener("click", function (e) {
          e.preventDefault();
          castWeeklyVote(optId);
        });

        // Keyboard accessibility
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            castWeeklyVote(optId);
          }
        });
      });
    }

    // Cast vote and immediately show results
    var castPredictionVote = function (optId) { return castWeeklyVote(optId); };
    function castWeeklyVote(optionId) {
      var tallies = getStoredTallies();
      tallies[optionId] = (tallies[optionId] || 0) + 1;
      saveTallies(tallies);

      applyTallies({ optionId: optionId });

      var voteRecord = {
        optionId: optionId,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(voteRecord));
      } catch (e) {}

      renderResultsState(voteRecord);

      // Sync vote to Supabase across all sessions
      syncVoteToSupabase(optionId);
    }

    // Render Results Mode with animated progress bars
    function renderResultsState(userVote) {
      var allOptions = pollData.options.slice();
      if (pollData.otherOption) {
        allOptions.push(pollData.otherOption);
      }

      var totalVotes = allOptions.reduce(function (sum, opt) {
        return sum + (opt.votes || 0);
      }, 0);

      var resultsHtml = '<div class="flex items-center justify-between pb-1 mb-2 text-xs font-mono text-slate-500 dark:text-slate-400">' +
        '<span class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">' +
          '<i class="fa-solid fa-chart-simple text-red-500 text-[11px]"></i> Results' +
        '</span>' +
      '</div>';
      allOptions.forEach(function (opt) {
        var votes = opt.votes || 0;
        var percent = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0.0";
        var isUserChoice = userVote && userVote.optionId === opt.id;

        var cardBorderClass = isUserChoice
          ? "border-red-500/70 bg-red-500/[0.04] dark:bg-red-500/[0.06] ring-1 ring-red-500/30"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220]";

        var barBg = isUserChoice
          ? "linear-gradient(90deg, #ef4444, #f59e0b)"
          : (votes > 0 ? "linear-gradient(90deg, #64748b, #475569)" : "transparent");

        resultsHtml += '<div class="poll-result-card p-3.5 sm:p-4 rounded-xl border ' + cardBorderClass + ' transition-all">' +
          '<div class="flex items-center justify-between gap-2 mb-1.5">' +
            '<div class="flex items-center gap-2 flex-grow min-w-0">' +
              '<span class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">' +
                (opt.id === "other" ? '<i class="fa-regular fa-compass text-red-500 mr-1.5 text-xs"></i>' : '') +
                escapeHtml(opt.text) +
              '</span>' +
              (isUserChoice ? '<span class="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"><i class="fa-solid fa-check text-[9px]"></i> Your Choice</span>' : '') +
            '</div>' +
            '<span class="text-xs sm:text-sm font-mono font-black text-slate-900 dark:text-white shrink-0">' + percent + '%</span>' +
          '</div>' +
          '<div class="w-full rounded-full my-2.5 overflow-hidden bg-slate-100 dark:bg-slate-800" style="height: 8px;">' +
            '<div class="poll-progress-bar rounded-full" style="width: 0%; height: 100%; background: ' + barBg + '; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);" data-target-width="' + percent + '%"></div>' +
          '</div>' +
          (opt.description ? '<div class="text-[11px] text-slate-500 dark:text-slate-400 leading-normal truncate">' + escapeHtml(opt.description) + '</div>' : '') +
        '</div>';
      });

      container.innerHTML = resultsHtml;

      // Force layout reflow so animation from 0% to target-width triggers smoothly for all options
      setTimeout(function () {
        container.querySelectorAll(".poll-progress-bar").forEach(function (bar) {
          var target = bar.getAttribute("data-target-width");
          if (target) {
            bar.style.width = target;
          }
        });
      }, 30);
    }

    // Live countdown to next weekly question (Resets Sunday 00:00 UTC)
    function startNextQuestionCountdown() {
      function updateCountdown() {
        var now = new Date();
        var target = new Date(now.getTime());
        var day = now.getUTCDay();
        var daysUntilSunday = (7 - day) % 7;
        if (daysUntilSunday === 0 && (now.getUTCHours() > 0 || now.getUTCMinutes() > 0 || now.getUTCSeconds() > 0)) {
          daysUntilSunday = 7;
        }
        target.setUTCDate(now.getUTCDate() + daysUntilSunday);
        target.setUTCHours(0, 0, 0, 0);

        var diff = target.getTime() - now.getTime();
        var text = "";
        if (diff <= 0) {
          text = "Dropping soon!";
        } else {
          var d = Math.floor(diff / (1000 * 60 * 60 * 24));
          var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          var s = Math.floor((diff % (1000 * 60)) / 1000);

          var pad = function (n) { return n < 10 ? "0" + n : n; };
          text = d > 0 ? (d + "d " + pad(h) + "h " + pad(m) + "m") : (pad(h) + "h " + pad(m) + "m " + pad(s) + "s");
        }

        var headerEl = document.getElementById("weekly-poll-countdown-timer");
        if (headerEl) headerEl.textContent = text;

        var footerEl = document.getElementById("weekly-poll-footer-timer");
        if (footerEl) footerEl.textContent = text;

        var adminEl = document.getElementById("admin-polls-countdown");
        if (adminEl) adminEl.textContent = "Next in: " + text;
      }

      updateCountdown();
      setInterval(function () {
        if (document.hidden) return;
        updateCountdown();
      }, 1000);
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) updateCountdown();
      });
    }

    // Initialize: check if user already voted. He CANNOT view results before answering!
    var existingVote = getSavedUserVote();
    if (existingVote) {
      applyTallies(existingVote);
      renderResultsState(existingVote);
    } else {
      applyTallies(null);
      renderVotingState();
    }

    fetchRemoteWeeklyPollVotes();
    setInterval(function () {
      if (document.hidden) return;
      fetchRemoteWeeklyPollVotes();
    }, 15000);

    startNextQuestionCountdown();
  }


  /* ── Cloud Pulse Real-Time Multi-Filter & Search Engine ── */
  var pulseFilterEngine = {
    matchesProvider: function (pulse, provider) {
      if (!provider || provider === "all") return true;
      var p = pulse || {};
      var corpus = ((p.title || "") + " " + (p.content || "") + " " + (Array.isArray(p.tags) ? p.tags.join(" ") : "") + " " + (p.link_url || "")).toLowerCase();
      var target = String(provider).toLowerCase();

      if (target === "gcp" || target === "google") {
        return corpus.includes("google") || corpus.includes("gcp") || corpus.includes("bigquery") || corpus.includes("vertex") || corpus.includes("spanner") || corpus.includes("gke");
      }
      if (target === "aws" || target === "amazon") {
        return corpus.includes("aws") || corpus.includes("amazon") || corpus.includes("lambda") || corpus.includes("bedrock") || corpus.includes("eks") || corpus.includes("s3") || corpus.includes("kms");
      }
      if (target === "azure" || target === "microsoft") {
        return corpus.includes("azure") || corpus.includes("microsoft") || corpus.includes("openai");
      }
      if (target === "openshift" || target === "redhat" || target === "red hat") {
        return corpus.includes("openshift") || corpus.includes("redhat") || corpus.includes("red hat") || corpus.includes("rosa") || corpus.includes("odc") || corpus.includes("rhacs");
      }
      return corpus.includes(target);
    },

    matchesDomain: function (pulse, domain) {
      if (!domain || domain === "all") return true;
      var p = pulse || {};
      var corpus = ((p.title || "") + " " + (p.content || "") + " " + (Array.isArray(p.tags) ? p.tags.join(" ") : "") + " " + (p.content || "")).toLowerCase();
      var target = String(domain).toLowerCase();

      if (target === "kubernetes") {
        return corpus.includes("k8s") || corpus.includes("kube") || corpus.includes("cncf") || corpus.includes("gateway") || corpus.includes("ingress") || corpus.includes("pod") || corpus.includes("helm") || corpus.includes("eks") || corpus.includes("gke") || corpus.includes("openshift");
      }
      if (target === "devops") {
        return corpus.includes("devops") || corpus.includes("ci/cd") || corpus.includes("gitops") || corpus.includes("terraform") || corpus.includes("ansible") || corpus.includes("pipeline") || corpus.includes("automation");
      }
      if (target === "security") {
        return corpus.includes("security") || corpus.includes("tls") || corpus.includes("cve") || corpus.includes("cert") || corpus.includes("vulnerability") || corpus.includes("auth") || corpus.includes("iam") || corpus.includes("zero-trust") || corpus.includes("kms") || corpus.includes("encryption");
      }
      if (target === "ai") {
        var tags = Array.isArray(p.tags) ? p.tags.map(function(t){ return String(t).toLowerCase(); }) : [];
        if (tags.includes("ai") || tags.includes("genai") || tags.includes("llm")) return true;
        return /\b(ai|llm|genai|gpt|gemini|claude|bedrock|embeddings|rag|openai)\b/i.test(corpus);
      }
      if (target === "databases") {
        return corpus.includes("database") || corpus.includes("db") || corpus.includes("sql") || corpus.includes("spanner") || corpus.includes("bigquery") || corpus.includes("dynamodb") || corpus.includes("aurora") || corpus.includes("postgres") || corpus.includes("storage");
      }
      return corpus.includes(target);
    },

    matchesSearch: function (pulse, query) {
      if (!query || query.trim().length === 0) return true;
      var p = pulse || {};
      var corpus = ((p.title || "") + " " + (p.content || "") + " " + (Array.isArray(p.tags) ? p.tags.join(" ") : "") + " " + (p.link_url || "")).toLowerCase();
      var q = String(query).trim().toLowerCase();
      return corpus.includes(q);
    },

    filterPulses: function (pulses, options) {
      var opts = options || {};
      var provider = opts.provider || "all";
      var domain = opts.domain || "all";
      var query = opts.searchQuery || "";
      var sortBy = opts.sortBy || "trending";

      var self = this;
      var filtered = (pulses || []).filter(function (pulse) {
        return (
          self.matchesProvider(pulse, provider) &&
          self.matchesDomain(pulse, domain) &&
          self.matchesSearch(pulse, query)
        );
      });

      return filtered.slice().sort(function (a, b) {
        if (sortBy === "recent") {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        var scoreA = typeof a.score === "number" ? a.score : ((a.upvotes || 0) - (a.downvotes || 0));
        var scoreB = typeof b.score === "number" ? b.score : ((b.upvotes || 0) - (b.downvotes || 0));
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    },

    parseUrlState: function (searchString) {
      var search = searchString || (typeof window !== "undefined" && window.location ? window.location.search : "");
      var params = new URLSearchParams(search);
      return {
        provider: params.get("provider") || "all",
        domain: params.get("topic") || params.get("domain") || "all",
        searchQuery: params.get("q") || params.get("search") || "",
        sortBy: params.get("sort") === "recent" ? "recent" : "trending"
      };
    },

    buildQueryString: function (state) {
      var s = state || {};
      var params = new URLSearchParams();
      if (s.provider && s.provider !== "all") params.set("provider", s.provider);
      if (s.domain && s.domain !== "all") params.set("topic", s.domain);
      if (s.searchQuery && s.searchQuery.trim().length > 0) params.set("q", s.searchQuery.trim());
      if (s.sortBy && s.sortBy !== "trending") params.set("sort", s.sortBy);

      var str = params.toString();
      return str.length > 0 ? "?" + str : "";
    }
  };

  if (typeof window !== "undefined") {
    window.gcloudcafePulseFilter = pulseFilterEngine;
  }

  /* ── Interactive Cloud Decision Calculator & Comparison Engine ── */
  var calculatorEngine = {
    calculateStorageTier: function (options) {
      var opts = options || {};
      var rawVol = parseFloat(opts.volumeGb);
      var volumeGb = isNaN(rawVol) || rawVol < 0 ? 0 : rawVol;
      var accessFreq = opts.accessFrequency || "daily";
      var retrievalPct = typeof opts.retrievalPercent === "number" ? opts.retrievalPercent : 20;
      if (retrievalPct < 0) retrievalPct = 0;
      if (retrievalPct > 100) retrievalPct = 100;

      // Cloud Storage Official Rates ($/GB/month)
      var tiers = {
        Standard: { atRest: 0.020, retrieval: 0.00, minDays: 0 },
        Nearline: { atRest: 0.010, retrieval: 0.01, minDays: 30 },
        Coldline: { atRest: 0.004, retrieval: 0.02, minDays: 90 },
        Archive:  { atRest: 0.0012, retrieval: 0.05, minDays: 365 }
      };

      var costs = {};
      var retrievedGb = volumeGb * (retrievalPct / 100);

      Object.keys(tiers).forEach(function (name) {
        var t = tiers[name];
        var sCost = volumeGb * t.atRest;
        var rCost = retrievedGb * t.retrieval;
        var total = sCost + rCost;
        costs[name] = {
          storageCost: parseFloat(sCost.toFixed(2)),
          retrievalCost: parseFloat(rCost.toFixed(2)),
          totalCost: parseFloat(total.toFixed(2)),
          minDays: t.minDays
        };
      });

      var recommended = "Standard";
      var matchPct = 95;
      var reason = "";
      var caveats = "";
      var runnerUp = "Nearline";

      if (accessFreq === "daily") {
        recommended = "Standard";
        matchPct = 98;
        reason = "Standard storage is optimal for actively queried or streaming datasets with zero retrieval charges and no minimum retention commitment.";
        caveats = "At-rest storage is $0.020/GB/mo. For data accessed less than once a month, consider lifecycle rules to transition to Nearline.";
        runnerUp = "Nearline";
      } else if (accessFreq === "monthly") {
        recommended = "Nearline";
        matchPct = 96;
        reason = "Nearline halves at-rest storage costs to $0.010/GB/mo while retaining fast millisecond time-to-first-byte for data accessed ~once a month.";
        caveats = "Enforces a 30-day minimum storage duration. Deleting or overwriting before 30 days incurs an early-deletion fee.";
        runnerUp = costs.Standard.totalCost < costs.Nearline.totalCost ? "Standard" : "Coldline";
      } else if (accessFreq === "quarterly") {
        recommended = "Coldline";
        matchPct = 94;
        reason = "Coldline cuts storage costs by 80% to $0.004/GB/mo, making it ideal for quarterly reporting, backups, and secondary replicas.";
        caveats = "Enforces a 90-day minimum storage duration with $0.02/GB data retrieval fees. Unplanned bulk reads can erase monthly savings.";
        runnerUp = "Nearline";
      } else if (accessFreq === "rare") {
        recommended = "Archive";
        matchPct = 99;
        reason = "Archive storage delivers rock-bottom storage pricing at $0.0012/GB/mo ($1.20/TB/mo) for compliance, cold backups, and long-term disaster recovery.";
        caveats = "Requires a 365-day minimum storage commitment and has a $0.05/GB retrieval charge. Recommended strictly for rarely touched data.";
        runnerUp = "Coldline";
      }

      return {
        recommendedTier: recommended,
        matchPercent: matchPct,
        reason: reason,
        caveats: caveats,
        runnerUp: runnerUp,
        costs: costs
      };
    },

    calculateDatabase: function (options) {
      var opts = options || {};
      var workload = opts.workloadType || "oltp-relational";
      var scale = opts.scale || "small";
      var latency = opts.latency || "single-digit-ms";

      if (workload === "olap-analytics" || latency === "seconds-olap") {
        return {
          recommendedEngine: "BigQuery",
          matchPercent: 98,
          primaryStrength: "Serverless enterprise analytical data warehouse capable of scanning petabytes in seconds with ANSI SQL, Gemini data insights, and built-in ML.",
          tradeOffs: "Not designed for single-row transactional point lookups (OLTP); slot reservation or on-demand query pricing applies.",
          runnerUp: "Cloud Spanner"
        };
      }

      if (workload === "global-distributed" || (workload === "oltp-relational" && scale === "massive")) {
        return {
          recommendedEngine: "Cloud Spanner",
          matchPercent: 99,
          primaryStrength: "Unlimited horizontal write scaling with synchronous multi-region ACID transactions, TrueTime hardware clocks, and 99.999% SLA.",
          tradeOffs: "Higher base cost than Cloud SQL; requires schema indexing and primary key interleaving to avoid hot spots.",
          runnerUp: "Cloud SQL"
        };
      }

      if (workload === "nosql-kv") {
        return {
          recommendedEngine: "Cloud Bigtable",
          matchPercent: 97,
          primaryStrength: "Ultra-low sub-10ms read/write latency at millions of QPS for time-series, AdTech, telemetry, and IoT ingestion.",
          tradeOffs: "No secondary indexes or multi-row ACID transactions; requires dedicated nodes with a minimum cluster size.",
          runnerUp: "Firestore"
        };
      }

      if (workload === "document") {
        return {
          recommendedEngine: "Firestore",
          matchPercent: 96,
          primaryStrength: "Flexible hierarchical JSON document model with real-time WebSocket listeners, automatic offline mobile sync, and automatic multi-region replication.",
          tradeOffs: "Billed per document read/write/delete operation; continuous massive write streams are better suited for Bigtable.",
          runnerUp: "Cloud Bigtable"
        };
      }

      // Default OLTP relational
      return {
        recommendedEngine: "Cloud SQL",
        matchPercent: 95,
        primaryStrength: "Fully managed PostgreSQL, MySQL, and SQL Server with seamless read replica scaling, automated backups, and 99.95% HA.",
        tradeOffs: "Vertical scaling limit per single primary node (up to 30TB storage); for multi-region horizontal ACID scale, upgrade to Cloud Spanner.",
        runnerUp: "Cloud Spanner"
      };
    },

    calculateCompute: function (options) {
      var opts = options || {};
      var nature = opts.workloadNature || "stateless-container";
      var ops = opts.opsModel || "zero-ops";

      if (nature === "stateless-container" || ops === "zero-ops") {
        return {
          recommendedPlatform: "Cloud Run",
          matchPercent: 98,
          primaryStrength: "Fully managed serverless container runtime that scales automatically from zero to thousands of instances in seconds with per-millisecond billing.",
          tradeOffs: "Request timeout limit (up to 60 minutes); not designed for kernel-level OS modifications or bare-metal custom drivers.",
          runnerUp: "Google Kubernetes Engine (GKE)"
        };
      }

      if (nature === "complex-orchestration" || ops === "managed-k8s") {
        return {
          recommendedPlatform: "Google Kubernetes Engine (GKE)",
          matchPercent: 96,
          primaryStrength: "Production-grade Kubernetes with GKE Autopilot, multi-cluster service mesh, GPU nodepools, and custom ingress controllers.",
          tradeOffs: "Requires Kubernetes mastery and ongoing cluster lifecycle maintenance.",
          runnerUp: "Cloud Run"
        };
      }

      if (nature === "event-handler") {
        return {
          recommendedPlatform: "Cloud Functions (2nd Gen)",
          matchPercent: 95,
          primaryStrength: "Single-purpose event handlers triggered directly from Eventarc, Pub/Sub, or Cloud Storage with zero server management.",
          tradeOffs: "Cold starts can introduce latency for infrequently invoked functions; shared environment limits.",
          runnerUp: "Cloud Run"
        };
      }

      return {
        recommendedPlatform: "Compute Engine",
        matchPercent: 94,
        primaryStrength: "Unrestricted root-level access to Linux and Windows virtual machines, custom vCPU/RAM ratios, GPUs, and persistent local SSDs.",
        tradeOffs: "Full operational responsibility for OS patching, kernel upgrades, disk expansion, and auto-scaling health checks.",
        runnerUp: "Google Kubernetes Engine (GKE)"
      };
    }
  };

  if (typeof window !== "undefined") {
    window.gcloudcafeCalculator = calculatorEngine;
  }

  function initCloudDecisionCalculators() {
    var widgets = document.querySelectorAll("[data-cloud-calculator]");
    if (!widgets.length) return;

    widgets.forEach(function (widget) {
      var activePreset = widget.getAttribute("data-active-preset") || "storage-tier";
      var presetTabs = widget.querySelectorAll("[data-calc-preset-tab]");
      var inputPanels = widget.querySelectorAll("[data-calc-inputs]");

      // Storage elements
      var volSlider = widget.querySelector("[data-calc-storage-volume]");
      var volLabel = widget.querySelector("[data-calc-storage-volume-label]");
      var retSlider = widget.querySelector("[data-calc-storage-retrieval]");
      var retLabel = widget.querySelector("[data-calc-storage-retrieval-label]");
      var costMatrix = widget.querySelector("[data-calc-cost-matrix]");

      // Output elements
      var titleEl = widget.querySelector("[data-calc-result-title]");
      var matchEl = widget.querySelector("[data-calc-result-match]");
      var reasonEl = widget.querySelector("[data-calc-result-reason]");
      var caveatsEl = widget.querySelector("[data-calc-result-caveats]");
      var runnerUpEl = widget.querySelector("[data-calc-result-runnerup]");

      function formatStorageLabel(gb) {
        if (gb >= 1000) {
          return Number(gb).toLocaleString() + " GB (" + (gb / 1000).toFixed(1) + " TB)";
        }
        return Number(gb).toLocaleString() + " GB";
      }

      function updateCalculator() {
        if (activePreset === "storage-tier") {
          if (costMatrix) costMatrix.classList.remove("hidden");

          var vol = parseFloat(volSlider ? volSlider.value : 5000);
          var ret = parseFloat(retSlider ? retSlider.value : 20);
          var freqChecked = widget.querySelector("input[name$='-freq']:checked");
          var freq = freqChecked ? freqChecked.value : "daily";

          if (volLabel) volLabel.textContent = formatStorageLabel(vol);
          if (retLabel) retLabel.textContent = ret + "%";

          var res = calculatorEngine.calculateStorageTier({
            volumeGb: vol,
            accessFrequency: freq,
            retrievalPercent: ret
          });

          if (titleEl) titleEl.textContent = "Cloud Storage " + res.recommendedTier;
          if (matchEl) matchEl.textContent = res.matchPercent + "% Match";
          if (reasonEl) reasonEl.textContent = res.reason;
          if (caveatsEl) caveatsEl.textContent = res.caveats;
          if (runnerUpEl) runnerUpEl.textContent = "Cloud Storage " + res.runnerUp;

          // Update cost cards
          var tiers = ["Standard", "Nearline", "Coldline", "Archive"];
          tiers.forEach(function (tierName) {
            var costEl = widget.querySelector("[data-calc-tier-cost='" + tierName + "']");
            var cardEl = widget.querySelector("[data-calc-tier-card='" + tierName + "']");
            if (costEl && res.costs[tierName]) {
              costEl.textContent = "$" + res.costs[tierName].totalCost.toFixed(2) + "/mo";
            }
            if (cardEl) {
              if (tierName === res.recommendedTier) {
                cardEl.className = "p-2 rounded-lg border-2 border-red-500 bg-red-50/70 dark:bg-red-950/40 shadow-xs font-bold text-slate-900 dark:text-white";
              } else {
                cardEl.className = "p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50";
              }
            }
          });

        } else if (activePreset === "database-selection") {
          if (costMatrix) costMatrix.classList.add("hidden");

          var workloadChecked = widget.querySelector("input[name$='-db-workload']:checked");
          var scaleChecked = widget.querySelector("input[name$='-db-scale']:checked");
          var workload = workloadChecked ? workloadChecked.value : "oltp-relational";
          var scale = scaleChecked ? scaleChecked.value : "small";

          var dbRes = calculatorEngine.calculateDatabase({
            workloadType: workload,
            scale: scale
          });

          if (titleEl) titleEl.textContent = dbRes.recommendedEngine;
          if (matchEl) matchEl.textContent = dbRes.matchPercent + "% Match";
          if (reasonEl) reasonEl.textContent = dbRes.primaryStrength;
          if (caveatsEl) caveatsEl.textContent = dbRes.tradeOffs;
          if (runnerUpEl) runnerUpEl.textContent = dbRes.runnerUp;

        } else if (activePreset === "compute-selection") {
          if (costMatrix) costMatrix.classList.add("hidden");

          var natureChecked = widget.querySelector("input[name$='-compute-nature']:checked");
          var opsChecked = widget.querySelector("input[name$='-compute-ops']:checked");
          var nature = natureChecked ? natureChecked.value : "stateless-container";
          var ops = opsChecked ? opsChecked.value : "zero-ops";

          var computeRes = calculatorEngine.calculateCompute({
            workloadNature: nature,
            opsModel: ops
          });

          if (titleEl) titleEl.textContent = computeRes.recommendedPlatform;
          if (matchEl) matchEl.textContent = computeRes.matchPercent + "% Match";
          if (reasonEl) reasonEl.textContent = computeRes.primaryStrength;
          if (caveatsEl) caveatsEl.textContent = computeRes.tradeOffs;
          if (runnerUpEl) runnerUpEl.textContent = computeRes.runnerUp;
        }
      }

      // Wire preset switcher tabs
      presetTabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          var targetPreset = tab.getAttribute("data-calc-preset-tab");
          if (!targetPreset) return;
          activePreset = targetPreset;
          widget.setAttribute("data-active-preset", targetPreset);

          presetTabs.forEach(function (t) {
            if (t.getAttribute("data-calc-preset-tab") === targetPreset) {
              t.className = "calc-preset-tab px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold";
            } else {
              t.className = "calc-preset-tab px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
            }
          });

          inputPanels.forEach(function (panel) {
            if (panel.getAttribute("data-calc-inputs") === targetPreset) {
              panel.classList.remove("hidden");
            } else {
              panel.classList.add("hidden");
            }
          });

          updateCalculator();
        });
      });

      // Wire inputs
      if (volSlider) volSlider.addEventListener("input", updateCalculator);
      if (retSlider) retSlider.addEventListener("input", updateCalculator);
      widget.querySelectorAll("input[type='radio']").forEach(function (radio) {
        radio.addEventListener("change", updateCalculator);
      });

      // Initial run
      updateCalculator();
    });
  }

  calculatorEngine.init = initCloudDecisionCalculators;


  /* ── Reader Personalization: Bookmarks & "Save for Later" Drawer ── */
  var BOOKMARKS_STORAGE_KEY = "gcloudcafe_saved_bookmarks";

  function getSafeStorage(storageOverride) {
    if (storageOverride) return storageOverride;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage;
      }
    } catch (e) {}
    return null;
  }

  function normalizeUrl(url) {
    if (!url) return "";
    var clean = String(url).trim().split("?")[0].split("#")[0];
    if (clean.length > 1 && clean.endsWith("/")) {
      return clean.slice(0, -1);
    }
    return clean;
  }

  var bookmarksStore = {
    getBookmarks: function (storageOverride) {
      var storage = getSafeStorage(storageOverride);
      if (!storage) return [];
      try {
        var raw = storage.getItem(BOOKMARKS_STORAGE_KEY);
        if (!raw) return [];
        var parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
      } catch (e) {
        return [];
      }
    },

    isArticleBookmarked: function (url, storageOverride) {
      if (!url) return false;
      var bookmarks = bookmarksStore.getBookmarks(storageOverride);
      var target = normalizeUrl(url);
      return bookmarks.some(function (b) {
        return normalizeUrl(b.url) === target;
      });
    },

    toggleBookmark: function (article, storageOverride) {
      if (!article || !article.url) {
        return { isSaved: false, bookmarks: [], count: 0 };
      }
      var storage = getSafeStorage(storageOverride);
      var bookmarks = bookmarksStore.getBookmarks(storageOverride);
      var target = normalizeUrl(article.url);
      var existingIndex = bookmarks.findIndex(function (b) {
        return normalizeUrl(b.url) === target;
      });

      var isSaved = false;
      if (existingIndex > -1) {
        bookmarks.splice(existingIndex, 1);
        isSaved = false;
      } else {
        var sanitizedTitle = escapeHtml(article.title || "Untitled Article");
        var sanitizedCategory = escapeHtml(article.category || "Cloud Engineering");
        var sanitizedReadTime = escapeHtml(article.readTime || "5 min read");
        var cleanUrl = String(article.url || "").trim();

        bookmarks.unshift({
          url: cleanUrl,
          title: sanitizedTitle,
          category: sanitizedCategory,
          readTime: sanitizedReadTime,
          savedAt: Date.now()
        });
        isSaved = true;
      }

      if (storage) {
        try {
          storage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
        } catch (e) {}
      }

      bookmarksStore.updateBadges(bookmarks.length);
      bookmarksStore.updateToggleButtons();

      return {
        isSaved: isSaved,
        bookmarks: bookmarks,
        count: bookmarks.length
      };
    },

    removeBookmark: function (url, storageOverride) {
      var storage = getSafeStorage(storageOverride);
      var bookmarks = bookmarksStore.getBookmarks(storageOverride);
      var target = normalizeUrl(url);
      var updated = bookmarks.filter(function (b) {
        return normalizeUrl(b.url) !== target;
      });

      if (storage) {
        try {
          storage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
      }

      bookmarksStore.updateBadges(updated.length);
      bookmarksStore.updateToggleButtons();
      bookmarksStore.renderDrawerBookmarks(updated, storageOverride);

      return {
        bookmarks: updated,
        count: updated.length
      };
    },

    clearAllBookmarks: function (storageOverride) {
      var storage = getSafeStorage(storageOverride);
      if (storage) {
        try {
          storage.setItem(BOOKMARKS_STORAGE_KEY, "[]");
        } catch (e) {}
      }
      bookmarksStore.updateBadges(0);
      bookmarksStore.updateToggleButtons();
      bookmarksStore.renderDrawerBookmarks([], storageOverride);
      return [];
    },

    updateBadges: function (count) {
      var c = typeof count === "number" ? count : bookmarksStore.getBookmarks().length;
      var badges = document.querySelectorAll("#bookmarks-header-count, [data-bookmarks-badge]");
      badges.forEach(function (badge) {
        badge.textContent = String(c);
        if (c > 0) {
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
      });
    },

    updateToggleButtons: function () {
      var buttons = document.querySelectorAll("[data-bookmark-btn]");
      buttons.forEach(function (btn) {
        var url = btn.getAttribute("data-article-url") || (typeof window !== "undefined" && window.location ? window.location.pathname : "");
        var bookmarked = bookmarksStore.isArticleBookmarked(url);
        var icon = btn.querySelector("i");
        var text = btn.querySelector("[data-bookmark-btn-text]");

        if (bookmarked) {
          btn.classList.add("is-bookmarked", "text-red-500", "dark:text-red-400");
          btn.setAttribute("aria-pressed", "true");
          btn.setAttribute("title", "Remove from saved bookmarks");
          if (icon) {
            icon.classList.remove("fa-regular");
            icon.classList.add("fa-solid");
          }
          if (text) {
            text.textContent = "Saved";
          }
        } else {
          btn.classList.remove("is-bookmarked", "text-red-500", "dark:text-red-400");
          btn.setAttribute("aria-pressed", "false");
          btn.setAttribute("title", "Save for later");
          if (icon) {
            icon.classList.remove("fa-solid");
            icon.classList.add("fa-regular");
          }
          if (text) {
            text.textContent = "Save for later";
          }
        }
      });
    },

    renderDrawerBookmarks: function (bookmarksList, storageOverride) {
      var list = document.getElementById("bookmarks-drawer-list");
      var emptyState = document.getElementById("bookmarks-empty-state");
      var drawerCount = document.getElementById("bookmarks-drawer-count");
      var clearBtn = document.getElementById("bookmarks-clear-all");

      var bookmarks = Array.isArray(bookmarksList)
        ? bookmarksList
        : bookmarksStore.getBookmarks(storageOverride);

      if (drawerCount) {
        drawerCount.textContent = bookmarks.length + (bookmarks.length === 1 ? " article" : " articles");
      }

      if (clearBtn) {
        clearBtn.style.display = bookmarks.length > 0 ? "inline-flex" : "none";
      }

      if (!list || !emptyState) return;

      if (!bookmarks || bookmarks.length === 0) {
        list.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
      }

      emptyState.classList.add("hidden");
      var html = "";
      bookmarks.forEach(function (b) {
        var cleanUrl = escapeHtml(b.url);
        var cleanTitle = escapeHtml(b.title);
        var cleanCat = escapeHtml(b.category || "Cloud Engineering");
        var cleanTime = escapeHtml(b.readTime || "5 min read");

        html +=
          '<div class="bookmark-item group relative p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-red-500/40 hover:shadow-md transition-all duration-200">' +
            '<div class="flex items-start justify-between gap-3">' +
              '<div class="flex-1 min-w-0">' +
                '<div class="flex items-center gap-2 mb-1.5 flex-wrap">' +
                  '<span class="inline-block text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/40">' + cleanCat + '</span>' +
                  '<span class="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1"><i class="fa-regular fa-clock text-[10px]"></i>' + cleanTime + '</span>' +
                '</div>' +
                '<a href="' + cleanUrl + '" class="block text-sm font-semibold text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-2 leading-snug">' +
                  cleanTitle +
                '</a>' +
              '</div>' +
              '<button type="button" data-remove-bookmark="' + cleanUrl + '" class="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Remove bookmark" aria-label="Remove ' + cleanTitle + '">' +
                '<i class="fa-solid fa-trash-can text-xs"></i>' +
              '</button>' +
            '</div>' +
          '</div>';
      });

      list.innerHTML = html;

      list.querySelectorAll("[data-remove-bookmark]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var url = btn.getAttribute("data-remove-bookmark");
          bookmarksStore.removeBookmark(url, storageOverride);
        });
      });
    }
  };

  if (typeof window !== "undefined") {
    window.gcloudcafeBookmarks = bookmarksStore;
  }

  function initBookmarksSystem() {
    var drawer = document.getElementById("bookmarks-drawer");
    var backdrop = document.getElementById("bookmarks-drawer-backdrop");
    var panel = document.getElementById("bookmarks-drawer-panel");
    var triggers = document.querySelectorAll("[data-bookmarks-drawer-trigger]");
    var closeButtons = document.querySelectorAll("[data-bookmarks-drawer-close]");
    var clearAllBtn = document.getElementById("bookmarks-clear-all");

    function openDrawer() {
      if (!drawer) return;
      bookmarksStore.renderDrawerBookmarks();
      drawer.classList.remove("pointer-events-none", "opacity-0");
      drawer.classList.add("opacity-100");
      if (panel) {
        panel.classList.remove("translate-x-full");
      }
      document.body.classList.add("overflow-hidden");
    }

    function closeDrawer() {
      if (!drawer) return;
      if (panel) {
        panel.classList.add("translate-x-full");
      }
      drawer.classList.remove("opacity-100");
      drawer.classList.add("opacity-0", "pointer-events-none");
      document.body.classList.remove("overflow-hidden");
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        openDrawer();
      });
    });

    closeButtons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        closeDrawer();
      });
    });

    if (backdrop) {
      backdrop.addEventListener("click", closeDrawer);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer && !drawer.classList.contains("pointer-events-none")) {
        closeDrawer();
      }
    });

    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", function () {
        if (confirm("Are you sure you want to clear all saved articles?")) {
          bookmarksStore.clearAllBookmarks();
        }
      });
    }

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-bookmark-btn]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      var article = {
        url: btn.getAttribute("data-article-url") || window.location.pathname,
        title: btn.getAttribute("data-article-title") || document.title,
        category: btn.getAttribute("data-article-category") || "Cloud Engineering",
        readTime: btn.getAttribute("data-article-readtime") || "5 min read"
      };

      bookmarksStore.toggleBookmark(article);
    });

    window.addEventListener("storage", function (e) {
      if (e.key === BOOKMARKS_STORAGE_KEY) {
        bookmarksStore.updateBadges();
        bookmarksStore.updateToggleButtons();
        if (drawer && !drawer.classList.contains("pointer-events-none")) {
          bookmarksStore.renderDrawerBookmarks();
        }
      }
    });

    bookmarksStore.updateBadges();
    bookmarksStore.updateToggleButtons();
  }

  function initApp() {
    initCloudDecisionCalculators();
    initBookmarksSystem();
    initWeeklyOpinionPollSystem();
    initCommentsSystem();
    initCloudPulseSystem();
    initCloudProviderPollSystem();
    initPulseAdminApprovalSystem();
    initArticleAdminSystem();
    initAuthorProposalSystem();
    initCommunityAdminSystem();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();



  /* ── Modern Developer Terminal Decorator for Code Blocks ── */
  function initDevTerminalBlocks() {
    var codeBlocks = document.querySelectorAll('.content pre > code');
    if (!codeBlocks.length) return;

    codeBlocks.forEach(function (codeEl) {
      var pre = codeEl.parentElement;
      if (!pre || pre.closest('.dev-terminal-wrapper')) return;

      // Extract language class e.g. language-bash, language-yaml
      var lang = 'terminal';
      var classes = codeEl.className.split(' ');
      for (var i = 0; i < classes.length; i++) {
        if (classes[i].startsWith('language-')) {
          lang = classes[i].replace('language-', '').toUpperCase();
          break;
        }
      }

      var wrapper = document.createElement('div');
      wrapper.className = 'dev-terminal-wrapper';

      var bar = document.createElement('div');
      bar.className = 'dev-terminal-bar';
      bar.innerHTML = '<div class="dev-terminal-dots"><span class="dot-red"></span><span class="dot-yellow"></span><span class="dot-green"></span></div>' +
                      '<span class="dev-terminal-lang">' + escapeHtml(lang) + '</span>' +
                      '<button class="dev-copy-btn" aria-label="Copy code to clipboard"><i class="fa-regular fa-copy"></i> Copy</button>';

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(bar);
      wrapper.appendChild(pre);

      var copyBtn = bar.querySelector('.dev-copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', function () {
          var codeText = codeEl.innerText || codeEl.textContent;
          navigator.clipboard.writeText(codeText).then(function () {
            copyBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> Copied!';
            copyBtn.style.color = '#34d399';
            setTimeout(function () {
              copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
              copyBtn.style.color = '';
            }, 2000);
          });
        });
      }
    });
  }

document.addEventListener('DOMContentLoaded', initDevTerminalBlocks);