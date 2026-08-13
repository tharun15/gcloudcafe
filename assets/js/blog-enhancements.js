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

        // Professional LinkedIn share template with source attribution
        var shareText = "☕ GCloud Cafe | Cloud Pulse\n\n"
          + "📌 " + p.title + "\n\n"
          + cleanContentText + "\n\n"
          + (sourceLabel ? "📖 Source: " + sourceLabel + (p.link_url ? "\n🔗 " + p.link_url : "") + "\n\n" : "")
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
                  '<i class="fa-solid fa-caret-up text-sm"></i> <span>' + (p.score >= 0 ? '+' + p.score : p.score) + '</span>' +
                '</button>' +
                '<button data-pulse-downvote="' + p.id + '" data-upvotes="' + (p.upvotes || 0) + '" data-downvotes="' + (p.downvotes || 0) + '" class="' + downActiveClass + '" title="Downvote pulse">' +
                  '<i class="fa-solid fa-caret-down text-sm"></i>' +
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

  /* ── Newsroom Candidate Approval Dashboard ── */
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

    var config = window.SUPABASE_CONFIG || {
      url: "https://axiijcsxtiukloarbfor.supabase.co",
      anonKey: "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc"
    };

    function unlockDashboard() {
      if (dashboardContainer) dashboardContainer.classList.remove("hidden");
      if (authPrompt) authPrompt.classList.add("hidden");
      if (passcodeStatus) passcodeStatus.classList.add("hidden");
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

    function ingestCleanedArticles() {
      if (!pullBtn) return;
      var originalHtml = pullBtn.innerHTML;
      pullBtn.disabled = true;
      pullBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Ingesting & Sanitizing Feeds...';

      var feeds = [
        { provider: "GCP", name: "Google Cloud Release Notes", url: "https://cloud.google.com/feeds/gcp-release-notes.xml", defaultTags: ["#GoogleCloud", "#GCP", "#CloudNews"] },
        { provider: "AWS", name: "AWS What's New", url: "https://aws.amazon.com/about-aws/whats-new/recent/feed/", defaultTags: ["#AWS", "#CloudArchitecture", "#CloudNews"] },
        { provider: "Kubernetes", name: "Kubernetes CNCF Blog", url: "https://kubernetes.io/feed.xml", defaultTags: ["#Kubernetes", "#CNCF", "#CloudNative"] },
        { provider: "OpenShift", name: "Red Hat Blog & OpenShift Releases", url: "https://www.redhat.com/en/rss/blog", defaultTags: ["#OpenShift", "#RedHat", "#DevOps"] }
      ];

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

      Promise.all(fetchPromises)
        .then(function (results) {
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
          var newCandidates = Array.from(uniqueMap.values());

          var postPromises = newCandidates.map(function (item) {
            return fetch(config.url + "/rest/v1/cloud_pulses", {
              method: "POST",
              headers: {
                "apikey": config.anonKey,
                "Authorization": "Bearer " + config.anonKey,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              },
              body: JSON.stringify(item)
            }).catch(function () {});
          });

          return Promise.all(postPromises);
        })
        .then(function () {
          pullBtn.disabled = false;
          pullBtn.innerHTML = '<i class="fa-solid fa-circle-check mr-1.5"></i> Articles Ingested!';
          setTimeout(function () { pullBtn.innerHTML = originalHtml; }, 3000);
          fetchPendingCandidates();
        })
        .catch(function () {
          pullBtn.disabled = false;
          pullBtn.innerHTML = originalHtml;
          fetchPendingCandidates();
        });
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
          pendingGrid.innerHTML = '<div class="col-span-full text-center py-12 bg-body dark:bg-darkmode-body border border-border/80 rounded-3xl text-xs text-text/60 dark:text-darkmode-text/60 font-semibold"><i class="fa-solid fa-circle-check text-emerald-500 text-xl block mb-2"></i>All candidate posts reviewed! No pending approvals in queue.</div>';
          if (pendingCountBadge) pendingCountBadge.textContent = "0";
          return;
        }

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

            '<div class="pt-3 border-t border-border/40 dark:border-darkmode-border/40 flex items-center justify-end gap-3 shrink-0">' +
              '<button data-action-reject="' + c.id + '" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer" style="background-color: rgba(244, 63, 94, 0.12); color: #f43f5e;"><i class="fa-solid fa-xmark mr-1"></i> Reject</button>' +
              '<button data-action-approve="' + c.id + '" class="px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all border-none cursor-pointer" style="background-color: #059669; color: #ffffff;"><i class="fa-solid fa-check mr-1.5"></i> Approve & Publish</button>' +
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

    fetchPollData();
    // Live sync polling: auto-refresh poll counts every 3 seconds across open browsers
    setInterval(fetchPollData, 3000);
  }

  function initApp() {
    initCommentsSystem();
    initCloudPulseSystem();
    initCloudProviderPollSystem();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();

