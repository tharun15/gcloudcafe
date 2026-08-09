/* system-design-lab.js — Sequential Pipeline & Dual-Endpoint Wire Rewiring Engine */
(function () {
  "use strict";

  var AVAILABLE_COMPONENTS = {
    "vpc": { name: "Private VPC Subnet & NAT", icon: "fa-shield-halved", cost: 0, category: "Security", tier: "security" },
    "gateway": { name: "API Gateway & Rate Limiter", icon: "fa-filter", cost: 15, category: "Security", tier: "ingress" },
    "cdn": { name: "Cloud CDN Edge Node", icon: "fa-bolt", cost: 20, category: "Edge", tier: "edge" },
    "load_balancer": { name: "Anycast Load Balancer", icon: "fa-network-wired", cost: 18, category: "Networking", tier: "edge" },
    "storage": { name: "GCS Object Storage Bucket", icon: "fa-box-archive", cost: 10, category: "Storage", tier: "storage" },
    "kafka": { name: "Kafka Event Stream", icon: "fa-diagram-project", cost: 45, category: "Queue", tier: "queue" },
    "redis": { name: "Redis In-Memory Cache", icon: "fa-database", cost: 30, category: "Caching", tier: "caching" },
    "read_replicas": { name: "DB Read Replicas", icon: "fa-server", cost: 60, category: "Database", tier: "database" }
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

  function generateBezierPath(x1, y1, x2, y2) {
    var dx = Math.abs(x2 - x1);
    var controlOffset = Math.max(dx * 0.45, 45);

    var cx1 = (x1 <= x2) ? (x1 + controlOffset) : (x1 - controlOffset);
    var cx2 = (x1 <= x2) ? (x2 - controlOffset) : (x2 + controlOffset);

    return "M " + x1 + " " + y1 + " C " + cx1 + " " + y1 + ", " + cx2 + " " + y2 + ", " + x2 + " " + y2;
  }

  function getNodePortCoords(node, portType) {
    if (portType === "output") {
      return { x: node.x + 140, y: node.y + 25 };
    }
    return { x: node.x, y: node.y + 25 };
  }

  function initSystemDesignLab() {
    var root = document.getElementById("system-design-lab-root");
    if (!root) return;

    var state = {
      activeChallengeId: CHALLENGES[0].id,
      failedAttempts: 0,
      showSolution: false,
      hasVpc: false,
      selectedConnIdx: null,
      nodes: [
        { id: "node_client", type: "client", label: "Client User", category: "User Tier", x: 60, y: 210, isBase: true },
        { id: "node_app", type: "app", label: "API Web Server", category: "Compute Tier", x: 550, y: 210, isBase: true },
        { id: "node_db", type: "db", label: "Primary Database", category: "Database Tier", x: 980, y: 210, isBase: true }
      ],
      connections: [
        { from: "node_client", to: "node_app" },
        { from: "node_app", to: "node_db" }
      ],
      dragState: { isDragging: false, nodeId: null, offsetX: 0, offsetY: 0 },
      wireDragState: { isDragging: false, mode: null, fromNodeId: null, connIdx: null, startX: 0, startY: 0, targetX: 0, targetY: 0 },
      validationResult: null
    };

    function renderLabUI() {
      var currentChallenge = CHALLENGES.find(function (c) { return c.id === state.activeChallengeId; }) || CHALLENGES[0];
      var addedComponentKeys = getAddedComponentKeys();
      var estCost = calculateTotalCost(addedComponentKeys);

      var html = '<div style="width:100%; max-width:1150px; margin:0 auto; display:flex; flex-direction:column; gap:1.5rem;">' +
        /* Header Banner */
        '<div style="text-align:center; display:flex; flex-direction:column; gap:0.5rem;">' +
          '<div>' +
            '<span style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.25rem 0.875rem; border-radius:9999px; background:rgba(var(--primary-rgb, 14,165,233), 0.1); border:1px solid rgba(var(--primary-rgb, 14,165,233), 0.2); color:var(--primary, #0ea5e9); font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em;">' +
              '<i class="fa-solid fa-scale-balanced"></i> Enterprise System Design Lab' +
            '</span>' +
          '</div>' +
          '<h1 style="font-size:2rem; font-weight:800; color:var(--dark-color, #0f172a); margin:0; letter-spacing:-0.02em;">' +
            'System Architecture Trade-off Lab' +
          '</h1>' +
          '<p style="font-size:0.875rem; color:var(--text-color, #4b5563); max-width:42rem; margin:0 auto; line-height:1.5;">' +
            'No system is perfect — every architecture is defined by its trade-offs. Drag component boxes, drag green/blue wire handles to rewire both ends, and validate your architecture!' +
          '</p>' +
        '</div>' +

        /* Step 1: Challenge Selector Card */
        '<div style="padding:1.25rem 1.5rem; border-radius:1.5rem; background:var(--body-bg, #ffffff); border:1px solid var(--border-color, #e5e7eb); box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:0.875rem;">' +
          '<label style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-color, #6b7280); display:block;">' +
            'Step 1: Select Your System Design Challenge' +
          '</label>' +

          '<div id="challenges-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:0.75rem;">' +
            renderChallengeCards(state.activeChallengeId) +
          '</div>' +

          '<div style="padding:0.75rem 1rem; border-radius:1rem; background:rgba(0,0,0,0.02); border:1px solid var(--border-color, #e5e7eb); font-size:0.75rem; font-weight:600; color:var(--dark-color, #1e293b); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">' +
            '<span>🎯 Challenge Goal: <strong>' + escapeHtml(currentChallenge.targetGoal) + '</strong></span>' +
            '<span style="color:#10b981; font-weight:800;">Est. Infra Spend: $' + estCost + '/mo</span>' +
          '</div>' +
        '</div>' +

        /* Step 2: Top Horizontal Component Toolbar */
        '<div style="padding:1.25rem; border-radius:1.5rem; background:var(--body-bg, #ffffff); border:1px solid var(--border-color, #e5e7eb); box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:1rem; width:100%;">' +
          '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">' +
            '<h4 style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:0.5rem; margin:0;">' +
              '<i class="fa-solid fa-toolbox" style="color:var(--primary, #0ea5e9);"></i> Step 2: Enterprise Component Toolbar' +
            '</h4>' +

            '<div style="display:flex; align-items:center; gap:0.75rem;">' +
              '<button id="reset-components-btn" style="font-size:0.7rem; font-weight:700; color:#ef4444; background:transparent; border:none; cursor:pointer;">Reset Canvas</button>' +
              '<button id="validate-arch-btn" style="padding:0.5rem 1.25rem; border-radius:0.875rem; font-size:0.75rem; font-weight:800; background:var(--primary, #0ea5e9); color:#ffffff; border:none; cursor:pointer; display:flex; align-items:center; gap:0.5rem; box-shadow:0 1px 2px rgba(0,0,0,0.1);">' +
                '<i class="fa-solid fa-circle-check"></i> Validate Architecture' +
              '</button>' +
              (state.failedAttempts >= 3 ? '<button id="unlock-solution-btn" style="padding:0.5rem 1rem; border-radius:0.875rem; font-size:0.7rem; font-weight:800; background:rgba(245,158,11,0.15); color:#d97706; border:1px solid rgba(245,158,11,0.3); cursor:pointer; display:flex; align-items:center; gap:0.5rem;"><i class="fa-solid fa-key"></i> 🔓 Solution</button>' : "") +
            '</div>' +
          '</div>' +

          '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:0.625rem; width:100%;">' +
            renderToolboxButtons(addedComponentKeys) +
          '</div>' +
        '</div>' +

        /* Step 3: Full-Width 1150px SVG Canvas Container */
        '<div style="padding:1.25rem; border-radius:1.5rem; background:var(--body-bg, #ffffff); border:1px solid var(--border-color, #e5e7eb); box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:1.25rem; width:100%;">' +
          '<div style="display:flex; align-items:center; justify-content:space-between; font-size:0.75rem; font-weight:700; color:#6b7280; padding-bottom:0.5rem; border-bottom:1px solid var(--border-color, #e5e7eb);">' +
            '<span><i class="fa-solid fa-plug" style="color:var(--primary, #0ea5e9);"></i> Dual Rewiring Canvas (Drag Green Handles to Move Start Node, Blue Arrowhead Handles to Move Target Node)</span>' +
            '<span>' + state.nodes.length + ' Nodes / ' + state.connections.length + ' Wires</span>' +
          '</div>' +

          /* SVG Canvas Container */
          '<div style="width:100%; overflow-x:auto; scrollbar-width:thin; border-radius:1rem; border:1px solid var(--border-color, #e5e7eb);">' +
            '<div id="architecture-svg-canvas" style="width:100%; min-width:1150px; height:480px; background:rgba(0,0,0,0.02); position:relative; overflow:hidden; user-select:none; touch-action:none;">' +
              renderSVGCanvas() +
            '</div>' +
          '</div>' +

          /* Selected Wire Action Control (Delete) */
          (state.selectedConnIdx !== null && state.connections[state.selectedConnIdx] ?
            '<div style="padding:0.75rem 1rem; border-radius:1rem; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); display:flex; align-items:center; justify-content:space-between; font-size:0.75rem;">' +
              '<span>Wire Selected: <strong>' + getNodeLabel(state.connections[state.selectedConnIdx].from) + ' ➔ ' + getNodeLabel(state.connections[state.selectedConnIdx].to) + '</strong></span>' +
              '<button id="delete-selected-wire-btn" style="padding:0.4rem 0.875rem; border-radius:0.625rem; font-size:0.7rem; font-weight:800; background:#ef4444; color:#ffffff; border:none; cursor:pointer;"><i class="fa-solid fa-trash-can"></i> Remove Connection Wire</button>' +
            '</div>' : "") +

          /* Validation Result & AI Hint Box */
          '<div id="validation-output-container">' +
            renderValidationOutput(state.validationResult, currentChallenge, state.failedAttempts, state.showSolution) +
          '</div>' +
        '</div>' +

      '</div>';

      root.innerHTML = html;

      bindLabEvents();
      bindDragEngine();
      bindWiringEngine();
    }

    function getNodeLabel(nodeId) {
      var n = state.nodes.find(function (item) { return item.id === nodeId; });
      return n ? n.label : nodeId;
    }

    function getAddedComponentKeys() {
      var keys = [];
      if (state.hasVpc) keys.push("vpc");
      state.nodes.forEach(function (n) {
        if (!n.isBase && n.type) keys.push(n.type);
      });
      return keys;
    }

    function calculateTotalCost(selected) {
      var cost = 45;
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
        html += '<button data-challenge-id="' + c.id + '" style="padding:0.875rem 1rem; border-radius:1rem; text-align:left; border:1px solid; transition:all 0.2s; cursor:pointer; display:flex; flex-direction:column; justify-between; gap:0.35rem; ' + (isActive ? "background:rgba(var(--primary-rgb, 14,165,233), 0.1); border-color:var(--primary, #0ea5e9); color:var(--primary, #0ea5e9);" : "background:rgba(0,0,0,0.02); border-color:var(--border-color, #e5e7eb); color:var(--dark-color, #0f172a);") + '">' +
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
        html += '<button data-component-key="' + key + '" style="text-align:left; padding:0.625rem 0.875rem; border-radius:0.875rem; border:1px solid; transition:all 0.2s; display:flex; align-items:center; justify-content:space-between; cursor:pointer; ' + (isAdded ? "background:rgba(16,185,129,0.12); border-color:#10b981; color:#059669; font-weight:700;" : "background:rgba(0,0,0,0.02); border-color:var(--border-color, #e5e7eb); color:var(--dark-color, #0f172a);") + '">' +
          '<div style="display:flex; align-items:center; gap:0.5rem;">' +
            '<span style="width:1.625rem; height:1.625rem; border-radius:0.5rem; display:flex; align-items:center; justify-content:center; font-size:0.7rem; flex-shrink:0; ' + (isAdded ? "background:#10b981; color:#ffffff;" : "background:rgba(var(--primary-rgb, 14,165,233), 0.1); color:var(--primary, #0ea5e9);") + '">' +
              '<i class="fa-solid ' + comp.icon + '"></i>' +
            '</span>' +
            '<div>' +
              '<div style="font-size:0.75rem; font-weight:700;">' + escapeHtml(comp.name) + '</div>' +
              '<div style="font-size:0.625rem; color:#6b7280; font-weight:400;">' + comp.category + ' Tier</div>' +
            '</div>' +
          '</div>' +

          '<span style="font-size:0.675rem; font-weight:800;">' + (isAdded ? "Active ✓" : "+ $" + comp.cost) + '</span>' +
        '</button>';
      });
      return html;
    }

    function renderSVGCanvas() {
      var pathsHtml = "";
      state.connections.forEach(function (c, idx) {
        var fromNode = state.nodes.find(function (n) { return n.id === c.from; });
        var toNode = state.nodes.find(function (n) { return n.id === c.to; });
        if (fromNode && toNode) {
          var p1 = getNodePortCoords(fromNode, "output");
          var p2 = getNodePortCoords(toNode, "input");
          var pathD = generateBezierPath(p1.x, p1.y, p2.x, p2.y);
          var isSelected = state.selectedConnIdx === idx;

          pathsHtml += '<g data-wire-conn-idx="' + idx + '" style="cursor:pointer;">' +
            '<path class="connection-bezier-path" d="' + pathD + '" stroke="' + (isSelected ? "#f59e0b" : "#0ea5e9") + '" stroke-width="' + (isSelected ? "4" : "2.5") + '" stroke-dasharray="5 5" fill="none" marker-end="url(#arrowhead)" opacity="0.9" />' +
            /* Green Source Handle Circle (Start of Wire) */
            '<circle data-wire-start-idx="' + idx + '" cx="' + p1.x + '" cy="' + p1.y + '" r="6.5" fill="#10b981" stroke="#ffffff" stroke-width="2" style="cursor:grab;" />' +
            /* Blue Target Arrowhead Handle Circle (End of Wire) */
            '<circle data-wire-endpoint-idx="' + idx + '" cx="' + p2.x + '" cy="' + p2.y + '" r="7" fill="#0ea5e9" stroke="#ffffff" stroke-width="2" style="cursor:grab;" />' +
          '</g>';
        }
      });

      var rubberbandHtml = "";
      if (state.wireDragState.isDragging) {
        var rPathD = generateBezierPath(state.wireDragState.startX, state.wireDragState.startY, state.wireDragState.targetX, state.wireDragState.targetY);
        rubberbandHtml = '<path class="rubberband-wire-preview" d="' + rPathD + '" stroke="#f59e0b" stroke-width="3.5" stroke-dasharray="4 4" fill="none" marker-end="url(#arrowhead-drag)" opacity="0.95" />';
      }

      var vpcBoxHtml = "";
      if (state.hasVpc) {
        vpcBoxHtml = '<rect x="490" y="30" width="640" height="420" rx="20" fill="rgba(14,165,233,0.03)" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="6 6" />' +
          '<text x="510" y="55" font-size="11" font-weight="bold" fill="#0ea5e9">🔒 Private VPC Subnet & NAT Perimeter</text>';
      }

      var nodesHtml = "";
      state.nodes.forEach(function (n) {
        var isBase = n.isBase;
        nodesHtml += '<g data-drag-node-id="' + n.id + '" transform="translate(' + n.x + ',' + n.y + ')" style="cursor:grab;">' +
          '<rect width="140" height="50" rx="14" fill="' + (isBase ? "#ffffff" : "rgba(16,185,129,0.12)") + '" stroke="' + (isBase ? "#cbd5e1" : "#10b981") + '" stroke-width="2" />' +
          '<text x="70" y="24" text-anchor="middle" font-size="10" font-weight="bold" fill="' + (isBase ? "#0f172a" : "#059669") + '">' + escapeHtml(n.label.slice(0, 20)) + '</text>' +
          '<text x="70" y="38" text-anchor="middle" font-size="8" fill="#64748b">' + escapeHtml(n.category || "Tier") + '</text>' +
          '<circle data-wire-source-id="' + n.id + '" cx="140" cy="25" r="9" fill="#0ea5e9" stroke="#ffffff" stroke-width="2" style="cursor:crosshair;" />' +
          '<text data-wire-source-id="' + n.id + '" x="140" y="28" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff" style="cursor:crosshair; pointer-events:none;">+</text>' +
        '</g>';
      });

      return '<svg width="1150" height="480" viewBox="0 0 1150 480" style="position:absolute; inset:0;">' +
        '<defs>' +
          '<marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
            '<path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" />' +
          '</marker>' +
          '<marker id="arrowhead-drag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
            '<path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />' +
          '</marker>' +
          '<pattern id="canvas-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">' +
            '<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="0.75" />' +
          '</pattern>' +
        '</defs>' +
        '<rect width="100%" height="100%" fill="url(#canvas-grid-pattern)" />' +
        vpcBoxHtml +
        pathsHtml +
        rubberbandHtml +
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
          '<div>Add components from the toolbar above, drag wire handles to rewire, and click <strong>Validate Architecture</strong>!</div>' +
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

    function rebuildConnections() {
      var clientNode = state.nodes.find(function (n) { return n.id === "node_client"; });
      var appNode = state.nodes.find(function (n) { return n.id === "node_app"; });
      var dbNode = state.nodes.find(function (n) { return n.id === "node_db"; });

      var edgeNode = state.nodes.find(function (n) { return n.type === "cdn" || n.type === "load_balancer"; });
      var gwNode = state.nodes.find(function (n) { return n.type === "gateway"; });
      var redisNode = state.nodes.find(function (n) { return n.type === "redis"; });
      var kafkaNode = state.nodes.find(function (n) { return n.type === "kafka"; });
      var storageNode = state.nodes.find(function (n) { return n.type === "storage"; });
      var replicaNode = state.nodes.find(function (n) { return n.type === "read_replicas"; });

      var newConns = [];

      // User -> Edge -> Gateway -> App Server
      var firstIngress = edgeNode || gwNode || appNode;
      if (clientNode && firstIngress) {
        newConns.push({ from: clientNode.id, to: firstIngress.id });
      }

      if (edgeNode && gwNode) {
        newConns.push({ from: edgeNode.id, to: gwNode.id });
      }

      var lastIngress = gwNode || edgeNode;
      if (lastIngress && appNode && lastIngress !== appNode) {
        newConns.push({ from: lastIngress.id, to: appNode.id });
      }

      // App Server -> Cache / Queue -> Database (Sequential pipeline!)
      if (appNode) {
        if (redisNode && dbNode) {
          newConns.push({ from: appNode.id, to: redisNode.id });
          newConns.push({ from: redisNode.id, to: dbNode.id });
        }
        if (kafkaNode && dbNode) {
          newConns.push({ from: appNode.id, to: kafkaNode.id });
          newConns.push({ from: kafkaNode.id, to: dbNode.id });
        }
        if (!redisNode && !kafkaNode && dbNode) {
          newConns.push({ from: appNode.id, to: dbNode.id });
        }
        if (storageNode) {
          newConns.push({ from: appNode.id, to: storageNode.id });
        }
      }

      if (dbNode && replicaNode) {
        newConns.push({ from: dbNode.id, to: replicaNode.id });
      }

      state.connections = newConns;
    }

    function bindLabEvents() {
      var challengeBtns = document.querySelectorAll("[data-challenge-id]");
      challengeBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          state.activeChallengeId = btn.getAttribute("data-challenge-id");
          state.failedAttempts = 0;
          state.showSolution = false;
          state.selectedConnIdx = null;
          state.validationResult = null;
          renderLabUI();
        });
      });

      var compBtns = document.querySelectorAll("[data-component-key]");
      compBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-component-key");
          var comp = AVAILABLE_COMPONENTS[key];

          if (key === "vpc") {
            state.hasVpc = !state.hasVpc;
          } else {
            var existingIdx = state.nodes.findIndex(function (n) { return n.type === key; });
            if (existingIdx !== -1) {
              var removedId = state.nodes[existingIdx].id;
              state.nodes.splice(existingIdx, 1);
              state.connections = state.connections.filter(function (c) {
                return c.from !== removedId && c.to !== removedId;
              });
            } else if (comp) {
              var newId = "node_" + key + "_" + Date.now();
              var defaultX = 780;
              var defaultY = 210;

              if (comp.tier === "edge") {
                defaultX = 300; defaultY = 210;
              } else if (comp.tier === "ingress") {
                defaultX = 300; defaultY = 330;
              } else if (comp.tier === "caching") {
                defaultX = 780; defaultY = 90;
              } else if (comp.tier === "queue") {
                defaultX = 780; defaultY = 330;
              } else if (comp.tier === "storage") {
                defaultX = 980; defaultY = 90;
              } else if (comp.tier === "database") {
                defaultX = 980; defaultY = 330;
              }

              state.nodes.push({
                id: newId,
                type: key,
                label: comp.name,
                category: comp.category + " Tier",
                x: defaultX,
                y: defaultY,
                isBase: false
              });
            }
          }

          rebuildConnections();
          state.selectedConnIdx = null;
          state.validationResult = null;
          renderLabUI();
        });
      });

      var resetBtn = document.getElementById("reset-components-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          state.hasVpc = false;
          state.nodes = [
            { id: "node_client", type: "client", label: "Client User", category: "User Tier", x: 60, y: 210, isBase: true },
            { id: "node_app", type: "app", label: "API Web Server", category: "Compute Tier", x: 550, y: 210, isBase: true },
            { id: "node_db", type: "db", label: "Primary Database", category: "Database Tier", x: 980, y: 210, isBase: true }
          ];
          state.connections = [
            { from: "node_client", to: "node_app" },
            { from: "node_app", to: "node_db" }
          ];
          state.failedAttempts = 0;
          state.showSolution = false;
          state.selectedConnIdx = null;
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

      var deleteWireBtn = document.getElementById("delete-selected-wire-btn");
      if (deleteWireBtn) {
        deleteWireBtn.addEventListener("click", function () {
          if (state.selectedConnIdx !== null && state.connections[state.selectedConnIdx]) {
            state.connections.splice(state.selectedConnIdx, 1);
            state.selectedConnIdx = null;
            renderLabUI();
          }
        });
      }
    }

    function bindDragEngine() {
      var canvasEl = document.getElementById("architecture-svg-canvas");
      if (!canvasEl) return;

      var nodeEls = canvasEl.querySelectorAll("[data-drag-node-id]");

      function startDrag(e, nodeId) {
        if (state.wireDragState.isDragging) return;

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

        nodeObj.x = Math.max(10, Math.min(1150 - 150, newX));
        nodeObj.y = Math.max(10, Math.min(480 - 60, newY));

        var targetG = canvasEl.querySelector('[data-drag-node-id="' + nodeObj.id + '"]');
        if (targetG) {
          targetG.setAttribute("transform", "translate(" + nodeObj.x + "," + nodeObj.y + ")");
        }

        var pathEls = canvasEl.querySelectorAll("path.connection-bezier-path");
        var startCircles = canvasEl.querySelectorAll("circle[data-wire-start-idx]");
        var endCircles = canvasEl.querySelectorAll("circle[data-wire-endpoint-idx]");
        state.connections.forEach(function (c, idx) {
          var fromN = state.nodes.find(function (n) { return n.id === c.from; });
          var toN = state.nodes.find(function (n) { return n.id === c.to; });
          if (fromN && toN && pathEls[idx]) {
            var p1 = getNodePortCoords(fromN, "output");
            var p2 = getNodePortCoords(toN, "input");
            pathEls[idx].setAttribute("d", generateBezierPath(p1.x, p1.y, p2.x, p2.y));
            if (startCircles[idx]) {
              startCircles[idx].setAttribute("cx", String(p1.x));
              startCircles[idx].setAttribute("cy", String(p1.y));
            }
            if (endCircles[idx]) {
              endCircles[idx].setAttribute("cx", String(p2.x));
              endCircles[idx].setAttribute("cy", String(p2.y));
            }
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
          if (e.target && (e.target.getAttribute("data-wire-source-id") || e.target.getAttribute("data-wire-start-idx") || e.target.getAttribute("data-wire-endpoint-idx"))) return;
          e.preventDefault();
          startDrag(e, nodeId);
        });

        gEl.addEventListener("touchstart", function (e) {
          if (e.target && (e.target.getAttribute("data-wire-source-id") || e.target.getAttribute("data-wire-start-idx") || e.target.getAttribute("data-wire-endpoint-idx"))) return;
          startDrag(e, nodeId);
        }, { passive: true });
      });

      window.addEventListener("mousemove", onMove);
      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("mouseup", stopDrag);
      window.addEventListener("touchend", stopDrag);
    }

    function bindWiringEngine() {
      var canvasEl = document.getElementById("architecture-svg-canvas");
      if (!canvasEl) return;

      var sourceHandles = canvasEl.querySelectorAll("[data-wire-source-id]");
      var startHandles = canvasEl.querySelectorAll("[data-wire-start-idx]");
      var endpointHandles = canvasEl.querySelectorAll("[data-wire-endpoint-idx]");
      var connGroups = canvasEl.querySelectorAll("[data-wire-conn-idx]");

      function startWireDrag(e, mode, fromId, connIdx, startX, startY) {
        e.stopPropagation();
        var rect = canvasEl.getBoundingClientRect();
        var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        var clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        state.wireDragState.isDragging = true;
        state.wireDragState.mode = mode;
        state.wireDragState.fromNodeId = fromId;
        state.wireDragState.connIdx = connIdx;
        state.wireDragState.startX = startX;
        state.wireDragState.startY = startY;
        state.wireDragState.targetX = clientX - rect.left;
        state.wireDragState.targetY = clientY - rect.top;

        renderLabUI();
      }

      sourceHandles.forEach(function (handle) {
        var nodeId = handle.getAttribute("data-wire-source-id");
        var nObj = state.nodes.find(function (n) { return n.id === nodeId; });
        if (nObj) {
          var p1 = getNodePortCoords(nObj, "output");
          handle.addEventListener("mousedown", function (e) {
            startWireDrag(e, "new", nodeId, null, p1.x, p1.y);
          });
          handle.addEventListener("touchstart", function (e) {
            startWireDrag(e, "new", nodeId, null, p1.x, p1.y);
          }, { passive: true });
        }
      });

      startHandles.forEach(function (handle) {
        var idx = parseInt(handle.getAttribute("data-wire-start-idx"), 10);
        var conn = state.connections[idx];
        if (conn) {
          var toN = state.nodes.find(function (n) { return n.id === conn.to; });
          if (toN) {
            var p2 = getNodePortCoords(toN, "input");
            handle.addEventListener("mousedown", function (e) {
              startWireDrag(e, "rewire_source", conn.from, idx, p2.x, p2.y);
            });
            handle.addEventListener("touchstart", function (e) {
              startWireDrag(e, "rewire_source", conn.from, idx, p2.x, p2.y);
            }, { passive: true });
          }
        }
      });

      endpointHandles.forEach(function (handle) {
        var idx = parseInt(handle.getAttribute("data-wire-endpoint-idx"), 10);
        var conn = state.connections[idx];
        if (conn) {
          var fromN = state.nodes.find(function (n) { return n.id === conn.from; });
          if (fromN) {
            var p1 = getNodePortCoords(fromN, "output");
            handle.addEventListener("mousedown", function (e) {
              startWireDrag(e, "rewire_target", conn.from, idx, p1.x, p1.y);
            });
            handle.addEventListener("touchstart", function (e) {
              startWireDrag(e, "rewire_target", conn.from, idx, p1.x, p1.y);
            }, { passive: true });
          }
        }
      });

      connGroups.forEach(function (group) {
        var idx = parseInt(group.getAttribute("data-wire-conn-idx"), 10);
        group.addEventListener("click", function (e) {
          e.stopPropagation();
          state.selectedConnIdx = idx;
          renderLabUI();
        });
      });

      function onWireMove(e) {
        if (!state.wireDragState.isDragging) return;

        var rect = canvasEl.getBoundingClientRect();
        var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        var clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        state.wireDragState.targetX = clientX - rect.left;
        state.wireDragState.targetY = clientY - rect.top;

        var rubEl = canvasEl.querySelector("path.rubberband-wire-preview");
        if (rubEl) {
          var rPathD = generateBezierPath(state.wireDragState.startX, state.wireDragState.startY, state.wireDragState.targetX, state.wireDragState.targetY);
          rubEl.setAttribute("d", rPathD);
        }
      }

      function stopWireDrag(e) {
        if (!state.wireDragState.isDragging) return;

        var clientX = e.clientX || (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0);
        var clientY = e.clientY || (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0);
        var rect = canvasEl.getBoundingClientRect();
        var canvasX = clientX - rect.left;
        var canvasY = clientY - rect.top;

        var targetNode = state.nodes.find(function (n) {
          return canvasX >= n.x && canvasX <= n.x + 140 && canvasY >= n.y && canvasY <= n.y + 50;
        });

        if (targetNode) {
          if (state.wireDragState.mode === "new" && targetNode.id !== state.wireDragState.fromNodeId) {
            state.connections.push({ from: state.wireDragState.fromNodeId, to: targetNode.id });
          } else if (state.wireDragState.mode === "rewire_target" && state.wireDragState.connIdx !== null) {
            state.connections[state.wireDragState.connIdx].to = targetNode.id;
          } else if (state.wireDragState.mode === "rewire_source" && state.wireDragState.connIdx !== null) {
            state.connections[state.wireDragState.connIdx].from = targetNode.id;
          }
        }

        state.wireDragState.isDragging = false;
        state.wireDragState.fromNodeId = null;
        state.wireDragState.connIdx = null;
        renderLabUI();
      }

      window.addEventListener("mousemove", onWireMove);
      window.addEventListener("touchmove", onWireMove, { passive: true });
      window.addEventListener("mouseup", stopWireDrag);
      window.addEventListener("touchend", stopWireDrag);
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
