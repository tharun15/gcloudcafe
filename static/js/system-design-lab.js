/* system-design-lab.js — Interactive Drag-and-Drop Canvas, Solution Unlock Engine & AI Architect Hints */
(function () {
  "use strict";

  var AVAILABLE_COMPONENTS = {
    "vpc": { name: "Private VPC Subnet & NAT", icon: "fa-shield-halved", cost: 0, category: "Security" },
    "gateway": { name: "API Gateway & Rate Limiter", icon: "fa-filter", cost: 15, category: "Security" },
    "cdn": { name: "Cloud CDN Edge Node", icon: "fa-bolt", cost: 20, category: "Edge" },
    "load_balancer": { name: "Anycast Load Balancer", icon: "fa-network-wired", cost: 18, category: "Networking" },
    "storage": { name: "GCS Object Storage Bucket", icon: "fa-box-archive", cost: 10, category: "Storage" },
    "kafka": { name: "Kafka Event Stream", icon: "fa-diagram-project", cost: 45, category: "Queue" },
    "redis": { name: "Redis In-Memory Cache", icon: "fa-database", cost: 30, category: "Caching" },
    "read_replicas": { name: "DB Read Replicas", icon: "fa-server", cost: 60, category: "Database" }
  };

  var CHALLENGES = [
    {
      id: "read_latency",
      title: "⚡ Sub-20ms Read Latency & High Volume",
      targetGoal: "Handle 100,000 queries/sec with sub-20ms read latency.",
      requiredComponents: ["redis", "read_replicas"],
      solutionComponents: ["redis", "read_replicas"],
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
      solutionComponents: ["kafka", "load_balancer", "vpc"],
      hintMissing: {
        "kafka": "💡 AI Architect Hint: Synchronous API writes crash your database during bursts. What event streaming queue buffers message spikes for asynchronous worker processing?",
        "load_balancer": "💡 AI Architect Hint: Incoming write bursts are saturating a single server instance. What networking component balances traffic across backend workers?",
        "vpc": "💡 AI Architect Hint: Database write endpoints are exposed publicly. What networking component isolates database instances inside private subnets?"
      },
      tradeoffExplanation: "By introducing a Kafka Event Queue and VPC Isolation, write bursts buffer safely. Trade-off: Sacrifices instant DB persistence for eventual consistency."
    },
    {
      id: "data_engineering",
      title: "📊 Real-Time Stream Ingestion & Pipeline",
      targetGoal: "Ingest 1,000,000 IoT/log events/sec with sub-second stream processing and Data Lake storage.",
      requiredComponents: ["kafka", "storage", "gateway", "vpc"],
      solutionComponents: ["kafka", "storage", "gateway", "vpc"],
      hintMissing: {
        "kafka": "💡 AI Architect Hint: Batch ETL jobs crash under 1,000,000 events/sec. What distributed event streaming log decouples high-speed data ingestion from stream processing?",
        "storage": "💡 AI Architect Hint: Raw event streams require persistent cold storage for auditing & replay. What object storage service acts as the Data Lake layer?",
        "gateway": "💡 AI Architect Hint: IoT devices require a secure single point of entry for streaming data. What component authenticates & throttles incoming ingestion streams?",
        "vpc": "💡 AI Architect Hint: Analytics worker pipelines need private network security. What component isolates streaming workers behind NAT gateways?"
      },
      tradeoffExplanation: "Pairing Kafka stream ingestion with GCS Object Storage in a private VPC enables 1M events/sec ingestion. Trade-off: Requires schema evolution governance (Avro/Protobuf) and partition key tuning."
    },
    {
      id: "global_edge",
      title: "🌍 Secure Global Edge Uptime & 99.99% Availability",
      targetGoal: "Deliver global static & API traffic with 99.99% SLA uptime and network isolation.",
      requiredComponents: ["cdn", "load_balancer", "vpc", "storage"],
      solutionComponents: ["cdn", "load_balancer", "vpc", "storage"],
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
      failedAttempts: 0,
      showSolution: false,
      nodes: [
        { id: "node_client", type: "client", label: "Client User", category: "User", x: 40, y: 160, isBase: true },
        { id: "node_app", type: "app", label: "API Web Server", category: "Compute", x: 260, y: 160, isBase: true },
        { id: "node_db", type: "db", label: "Primary Database", category: "Database", x: 480, y: 160, isBase: true }
      ],
      connections: [
        { from: "node_client", to: "node_app" },
        { from: "node_app", to: "node_db" }
      ],
      dragState: { isDragging: false, nodeId: null, offsetX: 0, offsetY: 0 },
      validationResult: null
    };

    function renderLabUI() {
      var currentChallenge = CHALLENGES.find(function (c) { return c.id === state.activeChallengeId; }) || CHALLENGES[0];
      var addedComponentKeys = getAddedComponentKeys();
      var estCost = calculateTotalCost(addedComponentKeys);

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
            'No system is perfect — every architecture is defined by its trade-offs. Select a challenge, drag components freely on the canvas grid, and validate your system!' +
          '</p>' +
        '</div>' +

        /* Step 1: Challenge Selector Card */
        '<div style="padding:1.5rem; border-radius:1.5rem; background:var(--body-bg, #ffffff); border:1px solid var(--border-color, #e5e7eb); box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:1rem;">' +
          '<label style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-color, #6b7280); display:block;">' +
            'Step 1: Select Your System Design Challenge' +
          '</label>' +

          '<div id="challenges-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:0.75rem;">' +
            renderChallengeCards(state.activeChallengeId) +
          '</div>' +

          '<div style="padding:0.875rem 1rem; border-radius:1rem; background:rgba(0,0,0,0.02); border:1px solid var(--border-color, #e5e7eb); font-size:0.75rem; font-weight:600; color:var(--dark-color, #1e293b); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">' +
            '<span>🎯 Challenge Goal: <strong>' + escapeHtml(currentChallenge.targetGoal) + '</strong></span>' +
            '<span style="color:#10b981; font-weight:800;">Est. Infra Spend: $' + estCost + '/mo</span>' +
          '</div>' +
        '</div>' +

        /* Step 2: Main Workspace (Toolbox & Drag-and-Drop Canvas) */
        '<div id="lab-workspace-grid" style="display:grid; grid-template-columns: 320px minmax(0, 1fr); gap:1.5rem; width:100%; align-items:start;">' +

          /* Left Column: Component Toolbox (320px) */
          '<div style="padding:1.25rem; border-radius:1.5rem; background:var(--body-bg, #ffffff); border:1px solid var(--border-color, #e5e7eb); box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:1rem; min-width:280px;">' +
            '<div style="display:flex; align-items:center; justify-content:space-between;">' +
              '<h4 style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:0.5rem; margin:0;">' +
                '<i class="fa-solid fa-toolbox" style="color:var(--primary, #0ea5e9);"></i> Step 2: Component Toolbox' +
              '</h4>' +
              '<button id="reset-components-btn" style="font-size:0.7rem; font-weight:700; color:#ef4444; background:transparent; border:none; cursor:pointer;">Reset Canvas</button>' +
            '</div>' +

            '<div style="display:flex; flex-direction:column; gap:0.5rem; max-height:450px; overflow-y:auto; padding-right:0.25rem;">' +
              renderToolboxButtons(addedComponentKeys) +
            '</div>' +

            '<div style="padding-top:0.75rem; border-top:1px solid var(--border-color, #e5e7eb); display:flex; flex-direction:column; gap:0.5rem;">' +
              '<button id="validate-arch-btn" style="width:100%; padding:0.75rem; border-radius:1rem; font-size:0.75rem; font-weight:800; background:var(--primary, #0ea5e9); color:#ffffff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.5rem; box-shadow:0 1px 2px rgba(0,0,0,0.1);">' +
                '<i class="fa-solid fa-circle-check"></i> Validate System Architecture' +
              '</button>' +

              (state.failedAttempts >= 3 ? '<button id="unlock-solution-btn" style="width:100%; padding:0.625rem; border-radius:1rem; font-size:0.7rem; font-weight:800; background:rgba(245,158,11,0.15); color:#d97706; border:1px solid rgba(245,158,11,0.3); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.5rem;"><i class="fa-solid fa-key"></i> 🔓 Unlock Optimal Solution</button>' : "") +
            '</div>' +
          '</div>' +

          /* Right Column: Interactive Drag-and-Drop SVG Canvas (1fr) */
          '<div style="padding:1.25rem; border-radius:1.5rem; background:var(--body-bg, #ffffff); border:1px solid var(--border-color, #e5e7eb); box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:1.25rem; min-width:0;">' +
            '<div style="display:flex; align-items:center; justify-content:space-between; font-size:0.75rem; font-weight:700; color:#6b7280; padding-bottom:0.5rem; border-bottom:1px solid var(--border-color, #e5e7eb);">' +
              '<span><i class="fa-solid fa-hand" style="color:var(--primary, #0ea5e9);"></i> Drag & Drop Canvas Workspace</span>' +
              '<span>' + state.nodes.length + ' Nodes / ' + state.connections.length + ' Connections</span>' +
            '</div>' +

            /* Draggable SVG Container */
            '<div id="architecture-svg-canvas" style="width:100%; height:460px; background:rgba(0,0,0,0.02); border-radius:1rem; border:1px solid var(--border-color, #e5e7eb); position:relative; overflow:hidden; user-select:none; touch-action:none;">' +
              renderSVGCanvas() +
            '</div>' +

            /* Validation Result & AI Hint Box */
            '<div id="validation-output-container">' +
              renderValidationOutput(state.validationResult, currentChallenge, state.failedAttempts, state.showSolution) +
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
      bindDragEngine();
    }

    function getAddedComponentKeys() {
      var keys = [];
      state.nodes.forEach(function (n) {
        if (!n.isBase && n.type) keys.push(n.type);
      });
      return keys;
    }

    function calculateTotalCost(selected) {
      var cost = 45; // Base 3-tier spend
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

    function renderToolboxButtons(addedKeys) {
      var html = "";
      Object.keys(AVAILABLE_COMPONENTS).forEach(function (key) {
        var comp = AVAILABLE_COMPONENTS[key];
        var isAdded = addedKeys.indexOf(key) !== -1;
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

          '<span style="font-size:0.7rem; font-weight:800;">' + (isAdded ? "Placed ✓" : "+ $" + comp.cost + "/mo") + '</span>' +
        '</button>';
      });
      return html;
    }

    function renderSVGCanvas() {
      var linesHtml = "";
      state.connections.forEach(function (c) {
        var fromNode = state.nodes.find(function (n) { return n.id === c.from; });
        var toNode = state.nodes.find(function (n) { return n.id === c.to; });
        if (fromNode && toNode) {
          linesHtml += '<line x1="' + (fromNode.x + 70) + '" y1="' + (fromNode.y + 25) + '" x2="' + (toNode.x + 70) + '" y2="' + (toNode.y + 25) + '" stroke="#0ea5e9" stroke-width="2.5" stroke-dasharray="5 5" opacity="0.85" />';
        }
      });

      var nodesHtml = "";
      state.nodes.forEach(function (n) {
        var isBase = n.isBase;
        nodesHtml += '<g data-drag-node-id="' + n.id + '" transform="translate(' + n.x + ',' + n.y + ')" style="cursor:grab;">' +
          '<rect width="140" height="50" rx="14" fill="' + (isBase ? "#ffffff" : "rgba(16,185,129,0.12)") + '" stroke="' + (isBase ? "#cbd5e1" : "#10b981") + '" stroke-width="2" />' +
          '<text x="70" y="24" text-anchor="middle" font-size="10" font-weight="bold" fill="' + (isBase ? "#0f172a" : "#059669") + '">' + escapeHtml(n.label.slice(0, 20)) + '</text>' +
          '<text x="70" y="38" text-anchor="middle" font-size="8" fill="#64748b">' + escapeHtml(n.category || "Tier") + '</text>' +
        '</g>';
      });

      return '<svg width="100%" height="100%" style="position:absolute; inset:0;">' +
        '<defs>' +
          '<pattern id="canvas-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">' +
            '<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="0.75" />' +
          '</pattern>' +
        '</defs>' +
        '<rect width="100%" height="100%" fill="url(#canvas-grid-pattern)" />' +
        linesHtml +
        nodesHtml +
      '</svg>';
    }

    function renderValidationOutput(res, currentChallenge, failedAttempts, showSolution) {
      if (showSolution) {
        var solNames = currentChallenge.solutionComponents.map(function (k) {
          return AVAILABLE_COMPONENTS[k] ? AVAILABLE_COMPONENTS[k].name : k;
        }).join(" + ");

        return '<div style="padding:1.25rem; border-radius:1.25rem; background:rgba(245,158,11,0.15); border:2px solid #f59e0b; color:#b45309; display:flex; flex-direction:column; gap:0.5rem;">' +
          '<div style="font-weight:800; font-size:0.875rem; display:flex; align-items:center; gap:0.5rem; color:#d97706;">' +
            '<i class="fa-solid fa-key" style="font-size:1.1rem;"></i> 🔓 Unlocked Optimal Solution Blueprint' +
          '</div>' +
          '<div style="font-size:0.75rem; font-weight:700; color:#92400e;">Required Upgrades: ' + escapeHtml(solNames) + '</div>' +
          '<p style="font-size:0.75rem; line-height:1.5; font-weight:400; margin:0;">' + escapeHtml(currentChallenge.tradeoffExplanation) + '</p>' +
        '</div>';
      }

      if (!res) {
        return '<div style="padding:1.25rem; border-radius:1rem; background:rgba(0,0,0,0.02); border:1px solid var(--border-color, #e5e7eb); text-align:center; font-size:0.75rem; color:#6b7280; display:flex; flex-direction:column; gap:0.35rem;">' +
          '<i class="fa-solid fa-hand-pointer" style="font-size:1.25rem; color:var(--primary, #0ea5e9);"></i>' +
          '<div>Drag nodes freely on the canvas grid! Add upgrades and click <strong>Validate System Architecture</strong>.</div>' +
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

      var attemptsRemainingNotice = failedAttempts < 3 ? ' <span style="font-size:0.7rem; font-weight:600; opacity:0.8;">(' + failedAttempts + '/3 failed validation attempts. Solution unlocks after 3 attempts.)</span>' : "";

      return '<div style="padding:1.25rem; border-radius:1.25rem; background:rgba(245,158,11,0.12); border:2px solid #f59e0b; color:#b45309; display:flex; flex-direction:column; gap:0.5rem;">' +
        '<div style="font-weight:800; font-size:0.875rem; display:flex; align-items:center; justify-content:space-between; gap:0.5rem; color:#d97706; flex-wrap:wrap;">' +
          '<span style="display:flex; align-items:center; gap:0.5rem;"><i class="fa-solid fa-lightbulb" style="font-size:1.1rem;"></i> AI Architect Guidance</span>' +
          attemptsRemainingNotice +
        '</div>' +
        '<p style="font-size:0.75rem; line-height:1.5; font-weight:400; margin:0;">' + escapeHtml(res.hint) + '</p>' +
      '</div>';
    }

    function validateArchitecture(challenge, selectedKeys) {
      var missing = [];
      challenge.requiredComponents.forEach(function (req) {
        if (selectedKeys.indexOf(req) === -1) {
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
          state.failedAttempts = 0;
          state.showSolution = false;
          state.validationResult = null;
          renderLabUI();
        });
      });

      var compBtns = document.querySelectorAll("[data-component-key]");
      compBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-component-key");
          var comp = AVAILABLE_COMPONENTS[key];

          var existingIdx = state.nodes.findIndex(function (n) { return n.type === key; });
          if (existingIdx !== -1) {
            // Remove node & its connections
            var removedNodeId = state.nodes[existingIdx].id;
            state.nodes.splice(existingIdx, 1);
            state.connections = state.connections.filter(function (c) {
              return c.from !== removedNodeId && c.to !== removedNodeId;
            });
          } else if (comp) {
            // Add new node onto canvas
            var newId = "node_" + key + "_" + Date.now();
            var newX = 50 + (state.nodes.length * 40) % 320;
            var newY = 50 + (state.nodes.length * 50) % 250;

            state.nodes.push({
              id: newId,
              type: key,
              label: comp.name,
              category: comp.category,
              x: newX,
              y: newY,
              isBase: false
            });

            // Connect to previous app node
            var appNode = state.nodes.find(function (n) { return n.id === "node_app"; }) || state.nodes[state.nodes.length - 2];
            if (appNode) {
              state.connections.push({ from: appNode.id, to: newId });
            }
          }

          state.validationResult = null;
          renderLabUI();
        });
      });

      var resetBtn = document.getElementById("reset-components-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          state.nodes = [
            { id: "node_client", type: "client", label: "Client User", category: "User", x: 40, y: 160, isBase: true },
            { id: "node_app", type: "app", label: "API Web Server", category: "Compute", x: 260, y: 160, isBase: true },
            { id: "node_db", type: "db", label: "Primary Database", category: "Database", x: 480, y: 160, isBase: true }
          ];
          state.connections = [
            { from: "node_client", to: "node_app" },
            { from: "node_app", to: "node_db" }
          ];
          state.failedAttempts = 0;
          state.showSolution = false;
          state.validationResult = null;
          renderLabUI();
        });
      }

      var validateBtn = document.getElementById("validate-arch-btn");
      if (validateBtn) {
        validateBtn.addEventListener("click", function () {
          var currentChallenge = CHALLENGES.find(function (c) { return c.id === state.activeChallengeId; }) || CHALLENGES[0];
          var addedKeys = getAddedComponentKeys();
          state.validationResult = validateArchitecture(currentChallenge, addedKeys);

          if (!state.validationResult.success) {
            state.failedAttempts += 1;
          }

          renderLabUI();
        });
      }

      var unlockBtn = document.getElementById("unlock-solution-btn");
      if (unlockBtn) {
        unlockBtn.addEventListener("click", function () {
          state.showSolution = true;
          renderLabUI();
        });
      }
    }

    function bindDragEngine() {
      var canvasEl = document.getElementById("architecture-svg-canvas");
      if (!canvasEl) return;

      var nodeEls = canvasEl.querySelectorAll("[data-drag-node-id]");

      function startDrag(e, nodeId) {
        var nodeObj = state.nodes.find(function (n) { return n.id === nodeId; });
        if (!nodeObj) return;

        var rect = canvasEl.getBoundingClientRect();
        var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        var clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        state.dragState.isDragging = true;
        state.dragState.nodeId = nodeId;
        state.dragState.offsetX = clientX - rect.left - nodeObj.x;
        state.dragState.offsetY = clientY - rect.top - nodeObj.y;
      }

      function onMove(e) {
        if (!state.dragState.isDragging || !state.dragState.nodeId) return;

        var nodeObj = state.nodes.find(function (n) { return n.id === state.dragState.nodeId; });
        if (!nodeObj) return;

        var rect = canvasEl.getBoundingClientRect();
        var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        var clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        var newX = clientX - rect.left - state.dragState.offsetX;
        var newY = clientY - rect.top - state.dragState.offsetY;

        // Clamp inside canvas bounds
        nodeObj.x = Math.max(10, Math.min(rect.width - 150, newX));
        nodeObj.y = Math.max(10, Math.min(rect.height - 60, newY));

        // Update node transform & SVG lines directly in DOM for 60fps performance
        var targetG = canvasEl.querySelector('[data-drag-node-id="' + nodeObj.id + '"]');
        if (targetG) {
          targetG.setAttribute("transform", "translate(" + nodeObj.x + "," + nodeObj.y + ")");
        }

        // Redraw SVG connection lines
        var lineEls = canvasEl.querySelectorAll("line");
        state.connections.forEach(function (c, idx) {
          var fromN = state.nodes.find(function (n) { return n.id === c.from; });
          var toN = state.nodes.find(function (n) { return n.id === c.to; });
          if (fromN && toN && lineEls[idx]) {
            lineEls[idx].setAttribute("x1", String(fromN.x + 70));
            lineEls[idx].setAttribute("y1", String(fromN.y + 25));
            lineEls[idx].setAttribute("x2", String(toN.x + 70));
            lineEls[idx].setAttribute("y2", String(toN.y + 25));
          }
        });
      }

      function stopDrag() {
        state.dragState.isDragging = false;
        state.dragState.nodeId = null;
      }

      nodeEls.forEach(function (gEl) {
        var nodeId = gEl.getAttribute("data-drag-node-id");

        gEl.addEventListener("mousedown", function (e) {
          e.preventDefault();
          startDrag(e, nodeId);
        });

        gEl.addEventListener("touchstart", function (e) {
          startDrag(e, nodeId);
        }, { passive: true });
      });

      window.addEventListener("mousemove", onMove);
      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("mouseup", stopDrag);
      window.addEventListener("touchend", stopDrag);
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
