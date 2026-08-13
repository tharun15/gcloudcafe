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

      // 2. Global Cloud Counter Fetch (Ensures Brave, Mobile, and all fresh browsers get live totals!)
      Object.keys(defaultCounts).forEach(function (type) {
        var key = slug + "_" + type;
        fetch("https://api.counterapi.dev/v1/" + counterNamespace + "/" + key)
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && typeof data.count === "number") {
              var obj = {};
              obj[type] = data.count;
              mergeIncomingCounts(obj, false);
              saveAndBroadcastCounts(false);
            }
          })
          .catch(function () {});
      });
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
      // 1. Cloud Counter API Increment (100% RLS-free, works across all browsers including Brave!)
      var key = slug + "_" + type;
      fetch("https://api.counterapi.dev/v1/" + counterNamespace + "/" + key + "/up")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && typeof data.count === "number") {
            var obj = {};
            obj[type] = data.count;
            mergeIncomingCounts(obj, false);
            saveAndBroadcastCounts(false);
          }
        })
        .catch(function () {});

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
      // 1. Cloud Counter API Decrement
      var key = slug + "_" + type;
      fetch("https://api.counterapi.dev/v1/" + counterNamespace + "/" + key + "/down")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && typeof data.count === "number") {
            var obj = {};
            obj[type] = Math.max(0, data.count);
            mergeIncomingCounts(obj, true);
            saveAndBroadcastCounts(true);
          }
        })
        .catch(function () {});

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
              '<span class="text-[11px] text-text/60 dark:text-darkmode-text/60">' + escapeHtml(c.date || "Just now") + '</span>' +
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
    var supabase = null;
    if (window.SUPABASE_CONFIG && window.supabase) {
      supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    }
    if (!supabase) return;

    var forms = document.querySelectorAll("form[data-supabase-subscribe]");

    forms.forEach(function (form) {
      var status = form.querySelector("[data-newsletter-status]");
      if (!status) {
        var note = form.nextElementSibling;
        if (note && note.hasAttribute("data-newsletter-status")) {
          status = note;
        } else {
          status = document.createElement("p");
          status.className = "text-xs mt-2 font-medium transition-all text-text/80 dark:text-darkmode-text/80";
          form.appendChild(status);
        }
      }

      var input = form.querySelector("input[type='email']");
      var submitBtn = form.querySelector("button[type='submit']");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!input || !input.value.trim()) return;

        var emailValue = input.value.trim();
        status.textContent = "Connecting to database... ☕";
        status.className = "text-xs mt-2 font-semibold text-primary animate-pulse";
        if (submitBtn) submitBtn.disabled = true;

        supabase
          .from("newsletter_subscribers")
          .insert([{ email: emailValue }])
          .then(function (res) {
            if (submitBtn) submitBtn.disabled = false;
            
            if (res.error) {
              if (res.error.code === "23505") { // unique constraint violation
                status.textContent = "You are already subscribed! ☕";
                status.className = "text-xs mt-2 font-semibold text-green-600 dark:text-green-400";
              } else {
                console.error("Supabase subscription error:", res.error);
                status.textContent = "Oops! Something went wrong. Please try again.";
                status.className = "text-xs mt-2 font-semibold text-red-500";
              }
            } else {
              status.textContent = "Subscribed successfully! Welcome to the club! 🎉";
              status.className = "text-xs mt-2 font-semibold text-green-600 dark:text-green-400";
              input.value = ""; // clear input
            }
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

    var supabase = null;
    if (window.SUPABASE_CONFIG && window.supabase) {
      supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    }
    if (!supabase) return;

    // 1. Fetch total real reactions from Supabase database
    supabase
      .from("post_reactions")
      .select("helpful_count, insightful_count, awesome_count, brewtiful_count")
      .then(function (res) {
        if (res && res.data && res.data.length > 0) {
          var total = 0;
          res.data.forEach(function (row) {
            total += (parseInt(row.helpful_count) || 0) + 
                     (parseInt(row.insightful_count) || 0) + 
                     (parseInt(row.awesome_count) || 0) + 
                     (parseInt(row.brewtiful_count) || 0);
          });
          if (statElem) statElem.textContent = total + (total === 1 ? " VOTE" : " VOTES");
          if (posElem) posElem.textContent = total > 0 ? "● LIVE FEEDBACK" : "● NO VOTES YET";
        } else {
          if (statElem) statElem.textContent = "0 VOTES";
          if (posElem) posElem.textContent = "● NO VOTES YET";
        }
      })
      .catch(function () {});

    // 2. Fetch total real comments from Supabase database
    supabase
      .from("post_comments")
      .select("id", { count: 'exact', head: true })
      .then(function (res) {
        var count = res && typeof res.count === "number" ? res.count : 0;
        if (commentsElem) commentsElem.textContent = count + (count === 1 ? " COMMENT" : " COMMENTS");
      })
      .catch(function () {});
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
    initPostEngagement();
    initCommentsSystem();
    initNewsletterSignup();
    initTelemetryStats();
    initCloudPulseSystem();
    initPulseAdminApprovalSystem();
  }

  /* ── 9. Cloud Pulse Micro-News & Upvote System ── */
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

    function fetchPulses() {
      var queryUrl = config.url + "/rest/v1/cloud_pulses_trending?select=*&limit=6";
      
      fetch(queryUrl, {
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey
        }
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (Array.isArray(data)) {
          renderPulses(data);
        } else if (supabase) {
          supabase.from("cloud_pulses_trending").select("*").limit(6).then(function(sRes) {
            if (sRes && Array.isArray(sRes.data)) {
              renderPulses(sRes.data);
            }
          });
        }
      })
      .catch(function (err) {
        console.error("Cloud Pulse fetch error:", err);
        if (supabase) {
          supabase.from("cloud_pulses_trending").select("*").limit(6).then(function(sRes) {
            if (sRes && sRes.data) renderPulses(sRes.data);
          });
        }
      });
    }

    function renderPulses(pulses) {
      if (!pulses || pulses.length === 0) {
        feedContainer.innerHTML = '<div class="col-span-full text-center py-8 text-xs text-text/60 dark:text-darkmode-text/60">No cloud pulses yet. Be the first to post!</div>';
        return;
      }

      // Pre-sorted & calculated by Supabase Postgres View (cloud_pulses_trending)
      var topPulses = pulses.slice(0, 6);

      var html = "";
      topPulses.forEach(function (p, idx) {
        var rankBadge = idx === 0 ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/30">🔥 #1 TRENDING</span>'
                      : idx === 1 ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-400/20 text-slate-400 border border-slate-400/30">#2 TOP PULSE</span>'
                      : idx === 2 ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-700/20 text-amber-600 border border-amber-700/30">#3 TOP PULSE</span>'
                      : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">#' + (idx + 1) + '</span>';

        var tagsHtml = "";
        if (Array.isArray(p.tags)) {
          p.tags.forEach(function (tag) {
            tagsHtml += '<span class="text-xs font-bold text-primary/90 bg-primary/10 px-2.5 py-1 rounded-md">' + escapeHtml(tag) + '</span> ';
          });
        }

        var userVote = localStorage.getItem("pulse_voted_" + p.id);
        var upActiveClass = userVote === "up" ? "pulse-vote-btn is-upvoted" : "pulse-vote-btn";
        var downActiveClass = userVote === "down" ? "pulse-vote-btn pulse-vote-btn-down is-downvoted" : "pulse-vote-btn pulse-vote-btn-down";

        var titleHtml = escapeHtml(p.title);
        var eventLinkHtml = "";
        if (p.link_url) {
          titleHtml = '<a href="' + escapeHtml(p.link_url) + '" target="_blank" rel="noopener noreferrer" class="hover:underline flex items-center gap-1.5 no-underline hover:text-primary">' + titleHtml + ' <i class="fa-solid fa-arrow-up-right-from-square text-xs text-primary"></i></a>';
          eventLinkHtml = '<div class="mb-4"><a href="' + escapeHtml(p.link_url) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs sm:text-sm font-bold no-underline transition-all"><i class="fa-solid fa-link text-xs"></i> Official Event / Page <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a></div>';
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

        // Professional LinkedIn share template with crisp TL;DR & source attribution
        var shareText = "☕ GCloud Cafe | Cloud Pulse\n\n"
          + "📌 " + p.title + "\n\n"
          + "⚡ TL;DR: " + cleanContentText + "\n\n"
          + (sourceLabel ? "📖 Source: " + sourceLabel + (p.link_url ? "\n🔗 " + p.link_url : "") + "\n\n" : (p.link_url ? "🔗 Source: " + p.link_url + "\n\n" : ""))
          + hashtagsText + " #CloudNews #GCloudCafe\n\n"
          + "—\n"
          + "Follow GCloud Cafe for daily cloud updates 👇\n"
          + "🌐 " + pulseTargetUrl;

        var linkedinShareUrl = "https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent(shareText);

        var linkedinBtnHtml = '<a href="' + linkedinShareUrl + '" data-pulse-share-title="' + escapeHtml(p.title) + '" data-pulse-share-text="' + escapeHtml(shareText) + '" data-pulse-share-url="' + escapeHtml(originalUrl) + '" target="_blank" rel="noopener noreferrer" class="pulse-share-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#0a66c2]/10 hover:bg-[#0a66c2] text-[#0a66c2] hover:text-white transition-all no-underline shrink-0" title="Share pulse on LinkedIn">' +
          '<i class="fa-brands fa-linkedin text-sm"></i> Share' +
        '</a>';

        html += '<div class="cloud-pulse-card bg-body dark:bg-darkmode-body border border-border/80 dark:border-darkmode-border/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between transition-all hover:border-primary/50 group">' +
          '<div>' +
            '<div class="flex items-center justify-between gap-2 mb-3">' +
              rankBadge +
              '<span class="text-xs font-semibold text-text/70 dark:text-darkmode-text/70">' + formatDate(p.created_at) + '</span>' +
            '</div>' +
            '<h4 class="text-lg sm:text-xl font-extrabold text-dark dark:text-darkmode-dark mb-3 leading-snug group-hover:text-primary transition-colors">' + titleHtml + '</h4>' +
            '<p class="text-base sm:text-lg text-text/95 dark:text-darkmode-text/95 mb-4 leading-relaxed font-normal">' + escapeHtml(cleanContentText) + '</p>' +
            eventLinkHtml +
          '</div>' +

          '<div class="pt-3 border-t border-border/40 dark:border-darkmode-border/40 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">' +
            '<div class="flex flex-wrap gap-1">' + tagsHtml + '</div>' +

            '<div class="flex items-center gap-2 shrink-0">' +
              linkedinBtnHtml +
              '<div class="flex items-center gap-1.5 shrink-0 bg-theme-light dark:bg-darkmode-theme-light rounded-xl p-1 border border-border/50 dark:border-darkmode-border/50">' +
                '<button data-pulse-upvote="' + p.id + '" data-upvotes="' + (p.upvotes || 0) + '" data-downvotes="' + (p.downvotes || 0) + '" class="' + upActiveClass + '" title="Upvote pulse">' +
                  '<svg class="w-3.5 h-3.5 fill-current inline-block mr-0.5" viewBox="0 0 24 24"><path d="M12 4l-6.5 8h4.5v8h4v-8h4.5z"/></svg><span>' + (p.score >= 0 ? '+' + p.score : p.score) + '</span>' +
                '</button>' +
                '<button data-pulse-downvote="' + p.id + '" data-upvotes="' + (p.upvotes || 0) + '" data-downvotes="' + (p.downvotes || 0) + '" class="' + downActiveClass + '" title="Downvote pulse">' +
                  '<svg class="w-3.5 h-3.5 fill-current inline-block" viewBox="0 0 24 24"><path d="M12 20l6.5-8h-4.5V4h-4v8H5.5z"/></svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      });

      feedContainer.innerHTML = html;
      bindVoteEvents(topPulses);
    }

    var currentPulses = [];

    function bindVoteEvents(pulsesMap) {
      currentPulses = pulsesMap || [];
      if (feedContainer.getAttribute("data-vote-bound") === "true") return;
      feedContainer.setAttribute("data-vote-bound", "true");

      feedContainer.addEventListener("click", function (e) {
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
          void scoreSpan.offsetWidth; // Trigger reflow
          scoreSpan.classList.add(animClass);
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
    var tabManualBtn = document.getElementById("tab-manual-btn");
    var sectionPending = document.getElementById("section-pending-approvals");
    var sectionManual = document.getElementById("section-manual-post");

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
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;[^&]+&gt;/gi, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

      if (!clean) return (title || "Cloud Release Update").trim();

      var sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
      var firstSentence = (sentences[0] || "").trim();
      var secondSentence = (sentences[1] || "").trim();

      var combined = firstSentence;
      if (combined.length < 90 && secondSentence) {
        combined += " " + secondSentence;
      }
      if (combined.length > 210) {
        combined = combined.substring(0, 207).trim() + "...";
      }
      return combined || title;
    }

    var verifiedDefaultGeminiKey = "AIzaSyA0vfGV5i1yxOJpq2GKMta8R1exW4hOZR4";

    async function fetchGeminiApiKeyFromSupabase() {
      if (cachedGeminiApiKey) return cachedGeminiApiKey;
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
          localStorage.setItem("gcloudcafe_gemini_api_key", val);
          return val;
        }
      } catch (err) {
        console.warn("Could not fetch Gemini key from Supabase site_settings:", err);
      }
      var stored = (localStorage.getItem("gcloudcafe_gemini_api_key") || "").trim();
      if (stored) {
        cachedGeminiApiKey = stored;
        return stored;
      }
      cachedGeminiApiKey = verifiedDefaultGeminiKey;
      localStorage.setItem("gcloudcafe_gemini_api_key", verifiedDefaultGeminiKey);
      return verifiedDefaultGeminiKey;
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

      var keyToUse = (apiKey || "").trim() || (await fetchGeminiApiKeyFromSupabase());
      if (!keyToUse) {
        return {
          text: fallbackText,
          isFallback: true,
          reason: "No Gemini Key found in Supabase — using smart summary excerpt"
        };
      }

      var prompt = "You are the chief cloud architect and news editor for GCloud Cafe (https://gcloudcafe.com).\n"
        + "Turn the following cloud release update into a high-engagement LinkedIn insight for software engineers and architects.\n\n"
        + "CRITICAL OUTPUT FORMAT (Strictly 2 sentences):\n"
        + "Sentence 1: Crisp summary of what specifically launched or changed.\n"
        + "Sentence 2: Engaging takeaway explaining why this matters (strategic impact on architecture, security, cost, or developer speed).\n\n"
        + "RULES:\n"
        + "1. Keep total length between 120 and 220 characters.\n"
        + "2. Professional, punchy, active voice. No intro fluff or greetings.\n"
        + "3. Format as: <Sentence 1> Why it matters: <Sentence 2>\n"
        + "4. Return ONLY the plain text.\n\n"
        + "Article Title: " + title + "\n"
        + "Article Context: " + content;

      var models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      var lastError = null;

      for (var i = 0; i < models.length; i++) {
        var model = models[i];
        try {
          var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(keyToUse);
          var controller = new AbortController();
          var timeoutId = setTimeout(function() { controller.abort(); }, 8000); // 8s timeout

          var res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.25,
                maxOutputTokens: 250
              }
            })
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            var data = await res.json();
            var candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            var cleaned = candidateText.replace(/^[\s"'\`]+|[\s"'\`]+$/g, "").replace(/\n+/g, " ").trim();
            if (cleaned) {
              return { text: cleaned, isFallback: false };
            }
          } else {
            var status = res.status;
            var errData = await res.json().catch(function () { return {}; });
            var errMsg = (errData?.error?.message || "").toLowerCase();

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
        reason: "API temporarily unavailable — switched to smart summary excerpt"
      };
    }

    function unlockDashboard() {
      if (dashboardContainer) dashboardContainer.classList.remove("hidden");
      if (authPrompt) authPrompt.classList.add("hidden");
      if (passcodeStatus) passcodeStatus.classList.add("hidden");
      fetchGeminiApiKeyFromSupabase();
      fetchPendingCandidates();
    }

    function lockDashboard() {
      if (dashboardContainer) dashboardContainer.classList.add("hidden");
      if (authPrompt) authPrompt.classList.remove("hidden");
    }

    if (tabPendingBtn && tabManualBtn) {
      tabPendingBtn.addEventListener("click", function () {
        tabPendingBtn.className = "px-4 py-2 rounded-xl text-xs font-extrabold bg-primary text-white border-none cursor-pointer";
        tabManualBtn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-theme-light dark:bg-darkmode-theme-light text-text/80 dark:text-darkmode-text/80 hover:text-primary border border-border/60 dark:border-darkmode-border/60 cursor-pointer";
        if (sectionPending) sectionPending.classList.remove("hidden");
        if (sectionManual) sectionManual.classList.add("hidden");
      });

      tabManualBtn.addEventListener("click", function () {
        tabManualBtn.className = "px-4 py-2 rounded-xl text-xs font-extrabold bg-primary text-white border-none cursor-pointer";
        tabPendingBtn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-theme-light dark:bg-darkmode-theme-light text-text/80 dark:text-darkmode-text/80 hover:text-primary border border-border/60 dark:border-darkmode-border/60 cursor-pointer";
        if (sectionManual) sectionManual.classList.remove("hidden");
        if (sectionPending) sectionPending.classList.add("hidden");
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

    async function ingestCleanedArticles() {
      if (!pullBtn) return;
      var originalHtml = pullBtn.innerHTML;
      pullBtn.disabled = true;
      pullBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Ingesting & Generating AI TL;DRs...';

      var feeds = [
        { provider: "GCP", name: "Google Cloud Release Notes", url: "https://cloud.google.com/feeds/gcp-release-notes.xml", defaultTags: ["#GoogleCloud", "#GCP", "#CloudNews"] },
        { provider: "AWS", name: "AWS What's New", url: "https://aws.amazon.com/about-aws/whats-new/recent/feed/", defaultTags: ["#AWS", "#CloudArchitecture", "#CloudNews"] },
        { provider: "Kubernetes", name: "Kubernetes CNCF Blog", url: "https://kubernetes.io/feed.xml", defaultTags: ["#Kubernetes", "#CNCF", "#CloudNative"] },
        { provider: "OpenShift", name: "Red Hat Blog & OpenShift Releases", url: "https://www.redhat.com/en/rss/blog", defaultTags: ["#OpenShift", "#RedHat", "#DevOps"] }
      ];

      try {
        var fetchPromises = feeds.map(function (feed) {
          var proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(feed.url);
          return fetch(proxyUrl)
            .then(function (res) { return res.json(); })
            .then(function (data) {
              if (data && data.contents) {
                return parseFeedXml(data.contents, feed);
              }
              return [];
            })
            .catch(function () { return []; });
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

      var tagsArr = rawTags.split(",").map(function (t) {
        var tr = t.trim();
        return tr.startsWith("#") ? tr : "#" + tr;
      }).filter(function (t) { return t.length > 1; });

      var defaultTags = ["#CloudNews", "#GCloudCafe"];
      var uniqueTags = Array.from(new Set(tagsArr.concat(defaultTags)));
      var hashtagsText = uniqueTags.join(" ");

      var sourceLabel = tagsArr.length > 0 ? tagsArr[0].replace(/^#/, "").replace(/([a-z])([A-Z])/g, "$1 $2") : "Official Release";
      var pulseTargetUrl = window.location.origin + "/pulse/";

      // Split into TL;DR and Why it matters if structured
      var formattedContent = content;
      if (content.toLowerCase().includes("why it matters:")) {
        var parts = content.split(/Why it matters:\s*/i);
        var tldrPart = parts[0].trim();
        var impactPart = parts[1].trim();
        formattedContent = "⚡ TL;DR: " + tldrPart + "\n\n💡 Why this matters: " + impactPart;
      } else if (content.includes(". ") && content.length > 60) {
        var firstDot = content.indexOf(". ");
        var sentence1 = content.substring(0, firstDot + 1).trim();
        var sentence2 = content.substring(firstDot + 2).trim();
        formattedContent = "⚡ TL;DR: " + sentence1 + "\n\n💡 Why this matters: " + sentence2;
      } else {
        formattedContent = "⚡ TL;DR: " + (content || "[Refined TL;DR Hook will appear here...]");
      }

      var previewText = "☕ GCloud Cafe | Cloud Pulse\n\n"
        + "📌 " + (title || "[Headline]") + "\n\n"
        + formattedContent + "\n\n"
        + "📖 Source: " + sourceLabel + (linkUrl ? "\n🔗 " + linkUrl : "") + "\n\n"
        + hashtagsText + "\n\n"
        + "—\n"
        + "Follow GCloud Cafe for daily cloud updates 👇\n"
        + "🌐 " + pulseTargetUrl;

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

      if (editAiStatus) editAiStatus.textContent = "";
      if (editModalStatus) editModalStatus.textContent = "";

      updateLinkedInPreviewBox();
      editModal.classList.remove("hidden");

      // Auto-trigger AI TL;DR Hook if content appears raw or un-summarized
      if (editGenerateAiBtn && (!candidate.content || candidate.content.length > 180 || candidate.content.endsWith("..."))) {
        setTimeout(function() {
          if (!editModal.classList.contains("hidden")) {
            editGenerateAiBtn.click();
          }
        }, 100);
      }
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
          status: "approved"
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

    function fetchPendingCandidates() {
      if (!pendingGrid) return;
      pendingGrid.innerHTML = '<div class="col-span-full text-center py-12 text-xs font-semibold text-text/60 dark:text-darkmode-text/60"><i class="fa-solid fa-spinner fa-spin text-lg text-primary block mb-2"></i>Loading candidate approval queue...</div>';

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
          pendingGrid.innerHTML = '<div class="col-span-full text-center py-12 bg-body dark:bg-darkmode-body border border-border/80 rounded-3xl text-xs text-text/60 dark:text-darkmode-text/60 font-semibold"><i class="fa-solid fa-circle-check text-emerald-500 text-xl block mb-2"></i>All candidate posts reviewed! No pending approvals in queue.</div>';
          if (pendingCountBadge) pendingCountBadge.textContent = "0";
          return;
        }

        cachedCandidates = candidates;
        if (pendingCountBadge) pendingCountBadge.textContent = String(candidates.length);

        var html = "";
        candidates.forEach(function (c) {
          var tagsHtml = "";
          if (Array.isArray(c.tags)) {
            c.tags.forEach(function (tag) {
              tagsHtml += '<span class="text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md">' + escapeHtml(tag) + '</span> ';
            });
          }

          var cleanContent = escapeHtml(c.content || "")
            .replace(/^&lt;p&gt;/i, "")
            .replace(/&lt;\/p&gt;$/i, "")
            .replace(/&lt;a[\s\S]*?&gt;/gi, "")
            .replace(/&lt;\/a&gt;/gi, "")
            .trim();

          var linkHtml = "";
          if (c.link_url) {
            linkHtml = '<div class="mb-2"><a href="' + escapeHtml(c.link_url) + '" target="_blank" rel="noopener noreferrer" class="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"><i class="fa-solid fa-link text-[10px]"></i> View Source <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i></a></div>';
          }

          var reasonHtml = c.eligibility_reason ? '<div class="mb-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-800 dark:text-amber-300 font-medium"><i class="fa-solid fa-lightbulb text-amber-500 mr-1.5"></i> <strong>Grounding Reason:</strong> ' + escapeHtml(c.eligibility_reason) + '</div>' : '';

          html += '<div class="bg-body dark:bg-darkmode-body border border-border/80 dark:border-darkmode-border/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between" data-candidate-id="' + c.id + '">' +
            '<div>' +
              '<div class="flex items-center justify-between gap-2 mb-2">' +
                '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-600 border border-amber-500/30">PENDING REVIEW</span>' +
                '<span class="text-[10px] font-medium text-text/60 dark:text-darkmode-text/60">' + formatDate(c.created_at) + '</span>' +
              '</div>' +
              '<h4 class="text-sm font-bold text-dark dark:text-darkmode-dark mb-2 leading-snug">' + escapeHtml(c.title) + '</h4>' +
              '<p class="text-xs text-text/80 dark:text-darkmode-text/80 mb-3 leading-relaxed">' + cleanContent + '</p>' +
              linkHtml +
              reasonHtml +
              '<div class="flex flex-wrap gap-1 mb-4">' + tagsHtml + '</div>' +
            '</div>' +

            '<div class="pt-3 border-t border-border/40 dark:border-darkmode-border/40 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap shrink-0">' +
              '<button data-action-reject="' + c.id + '" class="px-3 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer" style="background-color: rgba(244, 63, 94, 0.12); color: #f43f5e;"><i class="fa-solid fa-xmark mr-1"></i> Reject</button>' +
              '<div class="flex items-center gap-2">' +
                '<button data-action-edit="' + c.id + '" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer inline-flex items-center gap-1"><i class="fa-solid fa-pen-nib text-[11px]"></i> Refine TL;DR</button>' +
                '<button data-action-approve="' + c.id + '" class="px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all border-none cursor-pointer" style="background-color: #059669; color: #ffffff;"><i class="fa-solid fa-check mr-1.5"></i> Quick Approve</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        });

        pendingGrid.innerHTML = html;
        bindCandidateActions();
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

      fetch(config.url + "/rest/v1/cloud_pulses?id=eq." + encodeURIComponent(id.trim()), {
        method: "PATCH",
        headers: {
          "apikey": config.anonKey,
          "Authorization": "Bearer " + config.anonKey,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({ status: newStatus })
      })
      .then(function (res) {
        if (res.ok) {
          setTimeout(fetchPendingCandidates, 400);
        }
      });
    }

    // Initial fetch - load candidate approval queue immediately
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
      fetch(config.url + "/rest/v1/cloud_provider_polls?select=*", {
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
          pollData = data;
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
            btnElem.className = "px-3 py-1.5 rounded-xl text-xs font-bold border-none bg-emerald-600 text-white shadow-xs cursor-default";
            btnElem.disabled = true;
          } else if (userVotedProvider) {
            btnElem.innerHTML = '<i class="fa-solid fa-thumbs-up mr-1"></i> Vote';
            btnElem.className = "px-3 py-1.5 rounded-xl text-xs font-bold border-none bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 opacity-60 cursor-not-allowed";
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

    setInterval(fetchPollData, 3000);
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

    var inputs = [titleInput, categorySelect, tagsInput, authorInput, descInput, imageUrlInput, seriesInput, seriesOrderInput, markdownInput];
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
        case "image": replacement = "![" + (selected || "Image Alt") + "](/images/posts/banner.webp)"; break;
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
      var author = authorInput ? authorInput.value.trim() : "Tharun Vempati";
      var desc = descInput ? descInput.value.trim() : "";
      var imageUrl = imageUrlInput ? imageUrlInput.value.trim() : "";
      var seriesName = seriesInput ? seriesInput.value.trim() : "";
      var seriesOrder = seriesOrderInput ? (parseInt(seriesOrderInput.value, 10) || 1) : 1;
      var rawMd = markdownInput ? markdownInput.value : "";

      if (imgPreviewImg && imgPreviewEmpty) {
        if (imageUrl) {
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
      var renderedHtml = "";

      if (title) {
        renderedHtml += '<div class="mb-4"><span class="' + categoryBadgeClass + ' text-xs py-0.5 px-2.5 mb-2 inline-block">' + escapeHtml(category) + '</span>' +
          '<h1 class="text-2xl sm:text-3xl font-extrabold text-dark dark:text-darkmode-dark leading-snug mb-2">' + escapeHtml(title) + '</h1>' +
          (desc ? '<p class="text-sm text-text/80 dark:text-darkmode-text/80 leading-relaxed mb-3 italic">' + escapeHtml(desc) + '</p>' : '') +
          '<div class="flex items-center gap-3 text-xs font-semibold text-text/60 dark:text-darkmode-text/60 mb-4"><span class="text-primary font-bold"><i class="fa-solid fa-user-ninja mr-1"></i>' + escapeHtml(author) + '</span> <span><i class="fa-regular fa-clock mr-1"></i>' + readTime + ' min read</span></div></div>';
      }

      if (imageUrl) {
        renderedHtml += '<div class="mb-6 rounded-2xl overflow-hidden shadow-md"><img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(title) + '" class="w-full h-48 sm:h-64 object-cover" /></div>';
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
      livePreview.innerHTML = renderedHtml || '<div class="text-center py-12 text-xs font-semibold text-text/60 dark:text-darkmode-text/60"><i class="fa-solid fa-pen-fancy text-2xl text-primary block mb-2"></i>Start typing in the editor on the left to view live rendered Hugo article styling!</div>';
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
          'draft: false\n' +
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
          'draft: false\n' +
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

    // ── AI Helper: Fetch Supabase-backed Gemini Key ──
    async function getArticleGeminiApiKey() {
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
      var stored = (localStorage.getItem("gcloudcafe_gemini_api_key") || "").trim();
      return stored || "AIzaSyA0vfGV5i1yxOJpq2GKMta8R1exW4hOZR4";
    }

    // Call Gemini API with Fallback Handling
    async function callGeminiApi(promptText, maxTokens) {
      var apiKey = await getArticleGeminiApiKey();
      if (!apiKey) {
        throw new Error("No Gemini API key found in Supabase site_settings.");
      }

      var models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      var lastErr = null;

      for (var i = 0; i < models.length; i++) {
        var model = models[i];
        try {
          var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(apiKey);
          var res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: maxTokens || 2500
              }
            })
          });

          if (res.ok) {
            var data = await res.json();
            var text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (text) return text.trim();
          } else {
            var errData = await res.json().catch(function () { return {}; });
            lastErr = new Error(errData?.error?.message || ("Gemini error " + res.status));
          }
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr || new Error("Gemini API call failed.");
    }

    // ── 1. AI Blog Draft Writer Integration ──
    function openAiArticleModal() {
      if (modalAiArticle) modalAiArticle.classList.remove("hidden");
      if (aiArticleStatus) aiArticleStatus.textContent = "";
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

    if (formAiArticle) {
      formAiArticle.addEventListener("submit", async function (e) {
        e.preventDefault();
        var topic = (aiPromptTopic ? aiPromptTopic.value : "").trim();
        var style = (aiPromptStyle ? aiPromptStyle.value : "storytelling");
        var category = (aiPromptCategory ? aiPromptCategory.value : "Google Cloud");
        var notes = (aiPromptNotes ? aiPromptNotes.value : "").trim();

        if (!topic) return;

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
          + "Write a publication-ready, deeply engaging technical blog post in your signature GCloud Cafe style.\n\n"
          + "TOPIC: " + topic + "\n"
          + "CATEGORY: " + category + "\n"
          + "STYLE PRESET: " + style + "\n"
          + (notes ? ("KEY CONCEPTS / NOTES: " + notes + "\n\n") : "\n")
          + "RULES FOR THARUN'S SIGNATURE BLOG STYLE:\n"
          + "1. Narrative Storytelling Hook: Open with an engaging, reflective first-person introduction (\"The journey began...\", \"A reflective journey...\", setting the real-world context).\n"
          + "2. Deep Technical Substance: Break down core architecture concepts, tradeoffs, real-world tools, and design decisions.\n"
          + "3. Structured Headings: Use emojis in headings (e.g. '### 🧠 The Art of...', '### ⚙️ The Invisible Backbone...', '### 🚀 Hands-on Implementation', '### 💡 Key Takeaways').\n"
          + "4. Use bold keywords, bullet points, code blocks (```bash or ```yaml), and Callout Alert boxes (> [!NOTE] or > [!TIP]).\n"
          + "5. Output MUST be valid JSON with this exact structure:\n"
          + "{\n"
          + '  "title": "Catchy, authoritative title",\n'
          + '  "description": "1-2 sentence compelling summary for SEO and social sharing",\n'
          + '  "category": "' + category + '",\n'
          + '  "tags": ["gcp", "architecture", "devops", "cloud"],\n'
          + '  "image": "/images/posts/cloud-architecture.webp",\n'
          + '  "markdown_content": "Full markdown body of the post starting after frontmatter..."\n'
          + "}\n"
          + "Return ONLY the JSON object, without surrounding conversational text.";

        try {
          var responseText = await callGeminiApi(prompt, 3000);
          var cleanJsonStr = responseText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
          var parsed = JSON.parse(cleanJsonStr);

          if (titleInput && parsed.title) titleInput.value = parsed.title;
          if (categorySelect && parsed.category) categorySelect.value = parsed.category;
          if (descInput && parsed.description) descInput.value = parsed.description;
          if (tagsInput && Array.isArray(parsed.tags)) tagsInput.value = parsed.tags.join(", ");
          if (authorInput) authorInput.value = "Tharun Vempati";
          if (imageUrlInput) imageUrlInput.value = parsed.image || "/images/posts/cloud-architecture.webp";
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
            aiArticleStatus.textContent = "⚠️ Could not generate: " + (err.message || "API error");
            aiArticleStatus.className = "text-xs font-semibold mr-auto text-rose-500";
          }
        } finally {
          if (submitAiArticleBtn) {
            submitAiArticleBtn.disabled = false;
            submitAiArticleBtn.innerHTML = origBtnHtml;
          }
        }
      });
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

    if (githubPatInput) {
      var savedPat = localStorage.getItem("gcloud_github_pat") || "";
      if (savedPat) githubPatInput.value = savedPat;
    }

    if (btnToggleGithub && githubDrawer) {
      btnToggleGithub.addEventListener("click", function () {
        githubDrawer.classList.toggle("hidden");
      });
    }

    if (btnSaveGithubToken && githubPatInput) {
      btnSaveGithubToken.addEventListener("click", function () {
        var token = githubPatInput.value.trim();
        if (!token) return;
        localStorage.setItem("gcloud_github_pat", token);
        if (githubTokenStatus) {
          githubTokenStatus.textContent = "GitHub Personal Access Token saved securely in your browser!";
          githubTokenStatus.classList.remove("hidden");
          setTimeout(function () { githubTokenStatus.classList.add("hidden"); }, 3500);
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
      imageFileInput.addEventListener("change", function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;

        var patToken = localStorage.getItem("gcloud_github_pat") || (githubPatInput ? githubPatInput.value.trim() : "");
        if (!patToken) {
          if (githubDrawer) githubDrawer.classList.remove("hidden");
          alert("Please enter and save your GitHub Personal Access Token first to upload images directly to the repo!");
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
      btnPublishGithub.addEventListener("click", function () {
        var title = titleInput ? titleInput.value.trim() : "";
        if (!title) {
          alert("Please enter an article title first!");
          return;
        }

        var patToken = localStorage.getItem("gcloud_github_pat") || (githubPatInput ? githubPatInput.value.trim() : "");
        if (!patToken) {
          if (githubDrawer) githubDrawer.classList.remove("hidden");
          alert("Please enter and save your GitHub Personal Access Token first to enable 1-click live publishing!");
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
          'draft: false\n' +
          "---\n\n" + rawMd;

        var base64Md = btoa(unescape(encodeURIComponent(frontMatter)));

        uploadFileToGithub(targetPath, base64Md, "feat(blog): publish article: " + title, patToken)
          .then(function () {
            btnPublishGithub.disabled = false;
            btnPublishGithub.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400 mr-1.5"></i> Published Live to GitHub!';
            setTimeout(function () { btnPublishGithub.innerHTML = originalHtml; }, 4000);
          })
          .catch(function (err) {
            btnPublishGithub.disabled = false;
            alert("GitHub publishing error: " + err.message);
            btnPublishGithub.innerHTML = originalHtml;
          });
      });
    }
  }

  function initApp() {
    initCommentsSystem();
    initCloudPulseSystem();
    initCloudProviderPollSystem();
    initPulseAdminApprovalSystem();
    initArticleAdminSystem();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();

