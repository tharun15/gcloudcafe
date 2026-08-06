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
  }
})();

