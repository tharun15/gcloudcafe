/* system-design-lab.js — Interactive System Design Trade-off Lab & AI Architect Hint Engine */
(function () {
  "use strict";

  var AVAILABLE_COMPONENTS = {
    "vpc": { name: "Private VPC Subnet & NAT", icon: "fa-shield-halved", cost: 0, category: "Security", pos: 1 },
    "gateway": { name: "API Gateway & Rate Limiter", icon: "fa-filter", cost: 15, category: "Security", pos: 2 },
    "cdn": { name: "Cloud CDN Edge Node", icon: "fa-bolt", cost: 20, category: "Edge", pos: 3 },
    "load_balancer": { name: "Anycast Load Balancer", icon: "fa-network-wired", cost: 18, category: "Networking", pos: 4 },
    "storage": { name: "GCS Object Storage Bucket", icon: "fa-box-archive", cost: 10, category: "Storage", pos: 5 },
    "kafka": { name: "Kafka Event Stream", icon: "fa-diagram-project", cost: 45, category: "Queue", pos: 6 },
    "redis": { name: "Redis In-Memory Cache", icon: "fa-database", cost: 30, category: "Caching", pos: 7 },
    "read_replicas": { name: "DB Read Replicas", icon: "fa-server", cost: 60, category: "Database", pos: 8 }
  };

  var CHALLENGES = [
    {
      id: "read_latency",
      title: "⚡ Sub-20ms Read Latency & High Volume",
      targetGoal: "Handle 100,000 queries/sec with sub-20ms read latency.",
      requiredComponents: ["redis", "read_replicas"],
      hintMissing: {
        "redis": "💡 AI Architect Hint: Reading directly from the primary DB creates query locks during spikes. What in-memory caching component intercepts frequent queries before hitting the DB?",
        "read_replicas": "💡 AI Architect Hint: A single database instance is overloaded by high query volume. What database component scales read throughput horizontally?"
      },
      tradeoffExplanation: "By combining a Redis Cache and DB Read Replicas, query response times drop to <10ms. Trade-off: Requires TTL cache invalidation and replica sync monitoring."
    },
    {
      id: "write_decoupling",
      title: "💥 Write Throughput & Burst Decoupling",
      targetGoal: "Ingest 50,000 write events/sec during peak spikes without dropping data or crashing the DB.",
      requiredComponents: ["kafka", "load_balancer", "vpc"],
      hintMissing: {
        "kafka": "💡 AI Architect Hint: Synchronous API writes crash your database during bursts. What event streaming queue buffers message spikes for asynchronous worker processing?",
        "load_balancer": "💡 AI Architect Hint: Incoming write bursts are saturating a single server instance. What networking component balances traffic across backend workers?",
        "vpc": "💡 AI Architect Hint: Database write endpoints are exposed publicly. What networking component isolates database instances inside private subnets?"
      },
      tradeoffExplanation: "By introducing a Kafka Event Queue and VPC Isolation, write bursts buffer safely. Trade-off: Sacrifices instant DB persistence for eventual consistency."
    },
    {
      id: "global_edge",
      title: "🌍 Secure Global Edge Uptime & 99.99% Availability",
      targetGoal: "Deliver global static & API traffic with 99.99% SLA uptime and network isolation.",
      requiredComponents: ["cdn", "load_balancer", "vpc", "storage"],
      hintMissing: {
        "cdn": "💡 AI Architect Hint: Users in Europe and Asia experience 300ms network round-trip delays to your US server. What Edge network caches static assets closer to global users?",
        "storage": "💡 AI Architect Hint: Serving heavy media files directly from API servers saturates bandwidth. What cloud storage service offloads static media files?",
        "load_balancer": "💡 AI Architect Hint: A single server entry point creates a single point of failure. What Anycast component enables multi-region failover?",
        "vpc": "💡 AI Architect Hint: Production resources need network security isolation. What networking component secures internal microservices behind NAT gateways?"
      },
      tradeoffExplanation: "By routing traffic through CDN Edge nodes, Anycast Load Balancers, and GCS Object Storage inside a VPC, global latency drops by 80%. Trade-off: Increases monthly infrastructure operational spend."
    }
  ];

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initSystemDesignLab() {
    var root = document.getElementById("system-design-lab-root");
    if (!root) return;

    var state = {
      activeChallengeId: CHALLENGES[0].id,
      selectedComponents: [],
      validationResult: null
    };

    function renderLabUI() {
      var currentChallenge = CHALLENGES.find(function (c) { return c.id === state.activeChallengeId; }) || CHALLENGES[0];
      var estCost = calculateTotalCost(state.selectedComponents);

      var html = '<div style="width:100%; max-width:1150px; margin:0 auto; display:flex; flex-direction:column; gap:1.75rem;">' +
        /* Header Banner */
        '<div style="text-align:center; display:flex; flex-direction:column; gap:0.5rem;">' +
          '<div>' +
            '<span style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.25rem 0.875rem; border-radius:9999px; background:rgba(var(--primary-rgb, 14,165,233), 0.1); border:1px solid rgba(var(--primary-rgb, 14,165,233), 0.2); color:var(--primary, #0ea5e9); font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em;">' +
              '<i class="fa-solid fa-scale-balanced"></i> System Design Trade-off Lab' +
            '</span>' +
          '</div>' +
          '<h1 style="font-size:2rem; font-weight:800; color:var(--dark-color, #0f172a); margin:0; letter-spacing:-0.02em;">' +
            'System Architecture Trade-off Lab' +
          '</h1>' +
          '<p style="font-size:0.875rem; color:var(--text-color, #4b5563); max-width:42rem; margin:0 auto; line-height:1.5;">' +
            'No system is perfect — every architecture is defined by its trade-offs. Select a real-world engineering challenge, upgrade your base 3-tier system, and validate your design!' +
          '</p>' +
        '</div>' +

        /* Step 1: Challenge Selector Card */
        '<div style="padding:1.5rem; border-radius:1.5rem; background:var(--body-bg, #ffffff); border:1px solid var(--border-color, #e5e7eb); box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:1rem;">' +
          '<label style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-color, #6b7280); display:block;">' +
            'Step 1: Select Your System Design Challenge' +
          '</label>' +

          '<div id="challenges-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:0.75rem;">' +
            renderChallengeCards(state.activeChallengeId) +
          '</div>' +

          '<div style="padding:0.875rem 1rem; border-radius:1rem; background:rgba(0,0,0,0.02); border:1px solid var(--border-color, #e5e7eb); font-size:0.75rem; font-weight:600; color:var(--dark-color, #1e293b); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">' +
            '<span>🎯 Challenge Goal: <strong>' + escapeHtml(currentChallenge.targetGoal) + '</strong></span>' +
            '<span style="color:#10b981; font-weight:800;">Est. Infra Spend: $' + estCost + '/mo</span>' +
          '</div>' +
        '</div>' +

        /* Step 2: Main Responsive Workspace Grid (Toolbox & Topology Flow) */
        '<div id="lab-workspace-grid" style="display:grid; grid-template-columns: 340px minmax(0, 1fr); gap:1.5rem; width:100%; align-items:start;">' +

          /* Left Column: Component Upgrade Toolbox (340px) */
          '<div style="padding:1.25rem; border-radius:1.5rem; background:var(--body-bg, #ffffff); border:1px solid var(--border-color, #e5e7eb); box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:1rem; min-width:300px;">' +
            '<div style="display:flex; align-items:center; justify-content:space-between;">' +
              '<h4 style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:0.5rem; margin:0;">' +
                '<i class="fa-solid fa-toolbox" style="color:var(--primary, #0ea5e9);"></i> Step 2: Component Toolbox' +
              '</h4>' +
              '<button id="reset-components-btn" style="font-size:0.7rem; font-weight:700; color:#ef4444; background:transparent; border:none; cursor:pointer;">Reset All</button>' +
            '</div>' +

            '<div style="display:flex; flex-direction:column; gap:0.5rem; max-height:460px; overflow-y:auto; padding-right:0.25rem;">' +
              renderToolboxButtons(state.selectedComponents) +
            '</div>' +

            '<div style="padding-top:0.75rem; border-top:1px solid var(--border-color, #e5e7eb);">' +
              '<button id="validate-arch-btn" style="width:100%; padding:0.75rem; border-radius:1rem; font-size:0.75rem; font-weight:800; background:var(--primary, #0ea5e9); color:#ffffff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.5rem; box-shadow:0 1px 2px rgba(0,0,0,0.1);">' +
                '<i class="fa-solid fa-circle-check"></i> Validate System Architecture' +
              '</button>' +
            '</div>' +
          '</div>' +

          /* Right Column: Visual System Flow & AI Hint Panel (1fr) */
          '<div style="padding:1.25rem; border-radius:1.5rem; background:var(--body-bg, #ffffff); border:1px solid var(--border-color, #e5e7eb); box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:1.25rem; min-width:0;">' +
            '<h4 style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; justify-content:space-between; margin:0;">' +
              '<span><i class="fa-solid fa-diagram-next" style="color:var(--primary, #0ea5e9);"></i> Active Topology Flow</span>' +
              '<span style="font-size:0.75rem; font-weight:600; color:#6b7280;">Base 3-Tier + ' + state.selectedComponents.length + ' Upgrades</span>' +
            '</h4>' +

            /* Topology Flow Visualizer with Mobile Horizontal Scroll */
            '<div style="padding:1.25rem; border-radius:1rem; background:rgba(0,0,0,0.02); border:1px solid var(--border-color, #e5e7eb); overflow-x:auto; scrollbar-width:thin;">' +
              renderTopologyFlow(state.selectedComponents) +
            '</div>' +

            /* Validation Result & AI Hint Box */
            '<div id="validation-output-container">' +
              renderValidationOutput(state.validationResult, currentChallenge) +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>';

      root.innerHTML = html;

      /* Inject Media Query for Mobile Stacking */
      if (!document.getElementById("lab-grid-responsive-style")) {
        var styleEl = document.createElement("style");
        styleEl.id = "lab-grid-responsive-style";
        styleEl.textContent = "@media (max-width: 900px) { #lab-workspace-grid { grid-template-columns: 1fr !important; } }";
        document.head.appendChild(styleEl);
      }

      bindLabEvents();
    }

    function calculateTotalCost(selected) {
      var cost = 45; // Base 3-tier system cost
      selected.forEach(function (key) {
        var comp = AVAILABLE_COMPONENTS[key];
        if (comp) cost += comp.cost;
      });
      return cost;
    }

    function renderChallengeCards(activeId) {
      var html = "";
      CHALLENGES.forEach(function (c) {
        var isActive = c.id === activeId;
        html += '<button data-challenge-id="' + c.id + '" style="padding:1rem; border-radius:1rem; text-align:left; border:1px solid; transition:all 0.2s; cursor:pointer; display:flex; flex-direction:column; justify-between; gap:0.4rem; ' + (isActive ? "background:rgba(var(--primary-rgb, 14,165,233), 0.1); border-color:var(--primary, #0ea5e9); color:var(--primary, #0ea5e9);" : "background:rgba(0,0,0,0.02); border-color:var(--border-color, #e5e7eb); color:var(--dark-color, #0f172a);") + '">' +
          '<div style="font-weight:800; font-size:0.75rem;">' + escapeHtml(c.title) + '</div>' +
          '<div style="font-size:0.7rem; font-weight:400; opacity:0.8; line-height:1.3;">' + escapeHtml(c.targetGoal) + '</div>' +
        '</button>';
      });
      return html;
    }

    function renderToolboxButtons(selected) {
      var html = "";
      Object.keys(AVAILABLE_COMPONENTS).forEach(function (key) {
        var comp = AVAILABLE_COMPONENTS[key];
        var isAdded = selected.indexOf(key) !== -1;
        html += '<button data-component-key="' + key + '" style="width:100%; text-align:left; padding:0.75rem; border-radius:1rem; border:1px solid; transition:all 0.2s; display:flex; align-items:center; justify-content:space-between; cursor:pointer; ' + (isAdded ? "background:rgba(16,185,129,0.12); border-color:#10b981; color:#059669; font-weight:700;" : "background:rgba(0,0,0,0.02); border-color:var(--border-color, #e5e7eb); color:var(--dark-color, #0f172a);") + '">' +
          '<div style="display:flex; align-items:center; gap:0.625rem;">' +
            '<span style="width:1.75rem; height:1.75rem; border-radius:0.625rem; display:flex; align-items:center; justify-content:center; font-size:0.75rem; flex-shrink:0; ' + (isAdded ? "background:#10b981; color:#ffffff;" : "background:rgba(var(--primary-rgb, 14,165,233), 0.1); color:var(--primary, #0ea5e9);") + '">' +
              '<i class="fa-solid ' + comp.icon + '"></i>' +
            '</span>' +
            '<div>' +
              '<div style="font-size:0.75rem; font-weight:700;">' + escapeHtml(comp.name) + '</div>' +
              '<div style="font-size:0.65rem; color:#6b7280; font-weight:400;">' + comp.category + ' Tier</div>' +
            '</div>' +
          '</div>' +

          '<span style="font-size:0.7rem; font-weight:800;">' + (isAdded ? "Added ✓" : "+ $" + comp.cost + "/mo") + '</span>' +
        '</button>';
      });
      return html;
    }

    function renderTopologyFlow(selected) {
      // Base 3-tier nodes
      var nodes = [
        { label: "Client User", icon: "fa-user-gear", type: "base" },
        { label: "API Web Server", icon: "fa-server", type: "base" },
        { label: "Primary Database", icon: "fa-database", type: "base" }
      ];

      if (selected.indexOf("vpc") !== -1) {
        nodes.unshift({ label: "Private VPC Subnet", icon: "fa-shield-halved", type: "upgrade" });
      }
      if (selected.indexOf("gateway") !== -1) {
        var clientIdx = nodes.findIndex(function (n) { return n.label.indexOf("Client") !== -1; });
        nodes.splice(clientIdx + 1, 0, { label: "API Gateway", icon: "fa-filter", type: "upgrade" });
      }
      if (selected.indexOf("cdn") !== -1) {
        var apiIdx = nodes.findIndex(function (n) { return n.label.indexOf("API Web Server") !== -1; });
        nodes.splice(apiIdx, 0, { label: "Cloud CDN Edge", icon: "fa-bolt", type: "upgrade" });
      }
      if (selected.indexOf("load_balancer") !== -1) {
        var apiIdx2 = nodes.findIndex(function (n) { return n.label.indexOf("API Web Server") !== -1; });
        nodes.splice(apiIdx2, 0, { label: "Anycast Load Balancer", icon: "fa-network-wired", type: "upgrade" });
      }
      if (selected.indexOf("storage") !== -1) {
        nodes.push({ label: "GCS Object Storage", icon: "fa-box-archive", type: "upgrade" });
      }
      if (selected.indexOf("kafka") !== -1) {
        var apiIdx3 = nodes.findIndex(function (n) { return n.label.indexOf("API Web Server") !== -1; });
        nodes.splice(apiIdx3 + 1, 0, { label: "Kafka Event Stream", icon: "fa-diagram-project", type: "upgrade" });
      }
      if (selected.indexOf("redis") !== -1) {
        var dbIdx = nodes.findIndex(function (n) { return n.label.indexOf("Primary Database") !== -1; });
        nodes.splice(dbIdx, 0, { label: "Redis In-Memory Cache", icon: "fa-database", type: "upgrade" });
      }
      if (selected.indexOf("read_replicas") !== -1) {
        nodes.push({ label: "DB Read Replicas", icon: "fa-server", type: "upgrade" });
      }

      var html = '<div style="display:flex; align-items:center; gap:0.5rem; width:max-content; padding:0.25rem 0;">';
      nodes.forEach(function (n, idx) {
        var isUpgrade = n.type === "upgrade";
        html += '<div style="padding:0.625rem 0.875rem; border-radius:0.875rem; border:1px solid; font-weight:700; font-size:0.75rem; display:flex; align-items:center; gap:0.5rem; white-space:nowrap; ' + (isUpgrade ? "background:rgba(16,185,129,0.12); border-color:#10b981; color:#059669;" : "background:#ffffff; border-color:#cbd5e1; color:#0f172a;") + '">' +
          '<i class="fa-solid ' + n.icon + '"></i>' +
          '<span>' + escapeHtml(n.label) + '</span>' +
        '</div>';

        if (idx < nodes.length - 1) {
          html += '<i class="fa-solid fa-arrow-right" style="color:#94a3b8; font-size:0.7rem; padding:0 0.25rem;"></i>';
        }
      });
      html += '</div>';
      return html;
    }

    function renderValidationOutput(res, currentChallenge) {
      if (!res) {
        return '<div style="padding:1.25rem; border-radius:1rem; background:rgba(0,0,0,0.02); border:1px solid var(--border-color, #e5e7eb); text-align:center; font-size:0.75rem; color:#6b7280; display:flex; flex-direction:column; gap:0.35rem;">' +
          '<i class="fa-solid fa-circle-question" style="font-size:1.25rem; color:var(--primary, #0ea5e9);"></i>' +
          '<div>Add component upgrades and click <strong>Validate System Architecture</strong> to test your trade-offs!</div>' +
        '</div>';
      }

      if (res.success) {
        return '<div style="padding:1.25rem; border-radius:1.25rem; background:rgba(16,185,129,0.12); border:2px solid #10b981; color:#047857; display:flex; flex-direction:column; gap:0.5rem;">' +
          '<div style="font-weight:800; font-size:0.875rem; display:flex; align-items:center; gap:0.5rem; color:#059669;">' +
            '<i class="fa-solid fa-trophy" style="font-size:1.1rem;"></i> 🎉 Challenge Mastered! Trade-offs Satisfied' +
          '</div>' +
          '<p style="font-size:0.75rem; line-height:1.5; font-weight:400; margin:0;">' + escapeHtml(currentChallenge.tradeoffExplanation) + '</p>' +
        '</div>';
      }

      return '<div style="padding:1.25rem; border-radius:1.25rem; background:rgba(245,158,11,0.12); border:2px solid #f59e0b; color:#b45309; display:flex; flex-direction:column; gap:0.5rem;">' +
        '<div style="font-weight:800; font-size:0.875rem; display:flex; align-items:center; gap:0.5rem; color:#d97706;">' +
          '<i class="fa-solid fa-lightbulb" style="font-size:1.1rem;"></i> AI Architect Guidance' +
        '</div>' +
        '<p style="font-size:0.75rem; line-height:1.5; font-weight:400; margin:0;">' + escapeHtml(res.hint) + '</p>' +
      '</div>';
    }

    function validateArchitecture(challenge, selected) {
      var missing = [];
      challenge.requiredComponents.forEach(function (req) {
        if (selected.indexOf(req) === -1) {
          missing.push(req);
        }
      });

      if (missing.length === 0) {
        return { success: true };
      }

      var firstMissing = missing[0];
      var hintMsg = challenge.hintMissing[firstMissing] || "💡 AI Architect Hint: Your architecture is missing a required scaling component for this trade-off.";
      return { success: false, hint: hintMsg };
    }

    function bindLabEvents() {
      var challengeBtns = document.querySelectorAll("[data-challenge-id]");
      challengeBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          state.activeChallengeId = btn.getAttribute("data-challenge-id");
          state.validationResult = null;
          renderLabUI();
        });
      });

      var compBtns = document.querySelectorAll("[data-component-key]");
      compBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-component-key");
          var idx = state.selectedComponents.indexOf(key);
          if (idx !== -1) {
            state.selectedComponents.splice(idx, 1);
          } else {
            state.selectedComponents.push(key);
          }
          state.validationResult = null;
          renderLabUI();
        });
      });

      var resetBtn = document.getElementById("reset-components-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          state.selectedComponents = [];
          state.validationResult = null;
          renderLabUI();
        });
      }

      var validateBtn = document.getElementById("validate-arch-btn");
      if (validateBtn) {
        validateBtn.addEventListener("click", function () {
          var currentChallenge = CHALLENGES.find(function (c) { return c.id === state.activeChallengeId; }) || CHALLENGES[0];
          state.validationResult = validateArchitecture(currentChallenge, state.selectedComponents);
          renderLabUI();
        });
      }
    }

    renderLabUI();
  }

  function initApp() {
    initSystemDesignLab();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
