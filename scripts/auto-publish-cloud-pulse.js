/**
 * Autonomous Cloud Pulse 12-Hour Fallback Publishing Engine
 * 
 * Checks when an admin last manually approved a micro-post.
 * If 12 hours have elapsed without any manual approvals, this engine selects
 * the freshest pending candidate, validates strict 2-part analogy compliance
 * (?? What Changed / ?? Why It Matters), and publishes it to the live feed.
 * 
 * Manual approvals always retain higher precedence in cohort ranking and sorting.
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://axiijcsxtiukloarbfor.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc";
const INACTIVITY_THRESHOLD_HOURS = 12;

const EMOJI_TARGET = "\u{1F3AF}"; // ??
const EMOJI_LIGHTBULB = "\u{1F4A1}"; // ??

/**
 * Checks if a pulse record is considered manually approved by an admin
 */
function isManualApproval(post) {
  if (!post) return false;
  const reason = (post.eligibility_reason || "").toLowerCase();
  // Auto-published posts explicitly contain [auto-published]
  if (reason.includes("auto-published")) return false;
  return true;
}

/**
 * Clean raw text from HTML tags and HTML entities
 */
function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;[^&]+&gt;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deterministic fallback generator guaranteeing the exact 2-part analogy structure
 */
function createSmartFallbackHook(title, rawContent) {
  const clean = cleanText(rawContent);
  const cleanTitle = (title || "Cloud Platform Update").trim();

  if (!clean) {
    return EMOJI_TARGET + " What Changed: " + cleanTitle + ".\n\n" + EMOJI_LIGHTBULB + " Why It Matters: Enables cloud and DevOps teams to optimize workloads and modernize cloud infrastructure.";
  }

  const sentenceMatches = clean.match(/[^.!?]+[.!?]+/g) || [];
  const sentences = sentenceMatches
    .map(function(s) { return s.trim(); })
    .filter(function(s) {
      return s.length > 20 && !/want to know|check back|find it here|read more|latest from/i.test(s);
    });

  let whatChanged = "";
  let impact = "";

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

  return EMOJI_TARGET + " What Changed: " + whatChanged + "\n\n" + EMOJI_LIGHTBULB + " Why It Matters: " + impact;
}

/**
 * Validates that candidate content strictly follows the 2-bullet Cloud Pulse analogy:
 * 1. ?? What Changed: (1-2 crisp sentences)
 * 2. ?? Why It Matters: or ?? Engineering Impact: (1-2 crisp sentences)
 * 3. No raw unparsed HTML or tags
 */
function validateAndEnforceAnalogy(title, content) {
  const text = (content || "").trim();
  const hasWhatChanged = /(?:\u{1F3AF}|🎯)\s*(?:\*\*)?What Changed(?:\*\*)?:?/iu.test(text);
  const hasWhyItMatters = /(?:\u{1F4A1}|💡)\s*(?:\*\*)?(?:Why It Matters|Engineering Impact|Impact)(?:\*\*)?:?/iu.test(text);
  const hasHtml = /<[a-z][\s\S]*>/i.test(text);

  if (hasWhatChanged && hasWhyItMatters && !hasHtml && text.length >= 60) {
    return {
      isValid: true,
      formattedContent: text
    };
  }

  // Synthesize into strict analogy using deterministic generator
  const polished = createSmartFallbackHook(title, text);
  return {
    isValid: true,
    synthesized: true,
    formattedContent: polished
  };
}

/**
 * Checks elapsed hours since last manual admin approval
 */
function calculateInactivityHours(approvedPulses, nowTimestamp = Date.now()) {
  if (!Array.isArray(approvedPulses) || approvedPulses.length === 0) {
    return Infinity;
  }

  let latestManualTime = 0;
  for (const p of approvedPulses) {
    if (isManualApproval(p)) {
      const timeStr = p.updated_at || p.created_at;
      const t = new Date(timeStr).getTime();
      if (!isNaN(t) && t > latestManualTime) {
        latestManualTime = t;
      }
    }
  }

  if (latestManualTime === 0) return Infinity;
  const diffMs = Math.max(0, nowTimestamp - latestManualTime);
  return diffMs / (1000 * 60 * 60);
}

/**
 * Main automated publisher execution
 */

const DEFAULT_MAX_ACTIVE_PULSES = 35;
const DEFAULT_LOW_TRACTION_DAYS = 14;
const DEFAULT_AGING_TRACTION_DAYS = 28;
const DEFAULT_STALE_PENDING_DAYS = 14;

/**
 * Evaluates active approved and pending pulses for engagement, freshness, and cohort limits.
 * Pure deterministic logic - 0 AI API usage.
 */
function evaluatePulseHousekeeping(approvedPulses = [], pendingPulses = [], options = {}) {
  const now = options.now || Date.now();
  const maxActive = options.maxActivePulses || DEFAULT_MAX_ACTIVE_PULSES;
  const lowTractionDays = options.lowTractionDays || DEFAULT_LOW_TRACTION_DAYS;
  const agingDays = options.agingTractionDays || DEFAULT_AGING_TRACTION_DAYS;
  const stalePendingDays = options.stalePendingDays || DEFAULT_STALE_PENDING_DAYS;

  const msInDay = 1000 * 60 * 60 * 24;

  const approvedToPrune = [];
  const pendingToPrune = [];
  const stats = {
    downvoted: 0,
    low_traction: 0,
    stale_aging: 0,
    capacity_overflow: 0,
    stale_pending: 0
  };

  // 1. Evaluate pending queue for stale unreviewed items
  (pendingPulses || []).forEach(p => {
    const createdTime = new Date(p.created_at || p.updated_at || now).getTime();
    const ageDays = (now - createdTime) / msInDay;
    if (ageDays >= stalePendingDays) {
      pendingToPrune.push({ ...p, pruneReason: 'stale_pending', ageDays });
      stats.stale_pending++;
    }
  });

  // 2. Evaluate approved pulses for engagement and age
  const retainedCandidates = [];

  (approvedPulses || []).forEach(p => {
    const createdTime = new Date(p.created_at || now).getTime();
    const ageDays = (now - createdTime) / msInDay;
    const upvotes = typeof p.upvotes === 'number' ? p.upvotes : 0;
    const downvotes = typeof p.downvotes === 'number' ? p.downvotes : 0;
    const score = typeof p.score === 'number' ? p.score : (upvotes - downvotes);

    // Rule 1: Downvoted posts (negative score) older than 24h
    if (score < 0 && ageDays >= 1) {
      approvedToPrune.push({ ...p, pruneReason: 'downvoted', score, ageDays });
      stats.downvoted++;
      return;
    }

    // Rule 2: Zero traction (score <= 0) older than lowTractionDays (14 days)
    if (score <= 0 && ageDays >= lowTractionDays) {
      approvedToPrune.push({ ...p, pruneReason: 'low_traction', score, ageDays });
      stats.low_traction++;
      return;
    }

    // Rule 3: Low attention aging posts (score <= 1) older than agingDays (28 days)
    if (score <= 1 && ageDays >= agingDays) {
      approvedToPrune.push({ ...p, pruneReason: 'stale_aging', score, ageDays });
      stats.stale_aging++;
      return;
    }

    retainedCandidates.push({ ...p, score, ageDays });
  });

  // 3. Enforce Cohort Capacity Cap (Max Active Pulses)
  let retainedApproved = [];
  if (retainedCandidates.length > maxActive) {
    // Sort descending by score, then recency
    const sorted = retainedCandidates.slice().sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    retainedApproved = sorted.slice(0, maxActive);
    const overflow = sorted.slice(maxActive);

    overflow.forEach(p => {
      approvedToPrune.push({ ...p, pruneReason: 'capacity_overflow' });
      stats.capacity_overflow++;
    });
  } else {
    retainedApproved = retainedCandidates;
  }

  return {
    approvedToPrune,
    pendingToPrune,
    retainedApproved,
    stats
  };
}

/**
 * Executes Supabase REST pruning for low-attention, stale, or overflow pulses.
 */
async function executePulseHousekeeping(options = {}) {
  const isDryRun = options.dryRun || process.argv.includes("--dry-run");
  const maxActive = options.maxActivePulses || DEFAULT_MAX_ACTIVE_PULSES;

  console.log("🧹 Running Autonomous Cloud Pulse Housekeeping & Cohort Hygiene...");

  let approved = [];
  let pending = [];
  try {
    const [appRes, pendRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?status=eq.approved&order=created_at.desc&limit=100`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?status=eq.pending_approval&order=created_at.desc&limit=50`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      })
    ]);

    if (appRes.ok) approved = await appRes.json();
    if (pendRes.ok) pending = await pendRes.json();
  } catch (err) {
    console.error("Housekeeping fetch error:", err.message);
    return { pruned: 0, error: err.message };
  }

  const result = evaluatePulseHousekeeping(approved, pending, { maxActivePulses: maxActive });
  const toDelete = [...result.approvedToPrune, ...result.pendingToPrune];

  console.log(`📊 Evaluation complete:
  - Total Approved Examined: ${approved.length}
  - Total Pending Examined: ${pending.length}
  - Marked for Pruning: ${toDelete.length} (${result.stats.downvoted} downvoted, ${result.stats.low_traction} zero traction, ${result.stats.stale_aging} aging, ${result.stats.capacity_overflow} overflow, ${result.stats.stale_pending} stale pending)
  - Retained Cohort Size: ${result.retainedApproved.length}`);

  if (toDelete.length === 0) {
    console.log("✨ Cloud Pulse database is clean and within optimal cohort limits. No pruning needed.");
    return { pruned: 0, stats: result.stats, retainedCount: result.retainedApproved.length };
  }

  if (isDryRun) {
    console.log(`[DRY RUN] Would delete ${toDelete.length} pulses from Supabase.`);
    return { pruned: toDelete.length, dryRun: true, stats: result.stats, retainedCount: result.retainedApproved.length };
  }

  const idsToDelete = toDelete.map(p => p.id);
  let deletedCount = 0;

  for (let i = 0; i < idsToDelete.length; i += 20) {
    const chunk = idsToDelete.slice(i, i + 20);
    const filter = "id=in.(" + chunk.map(id => `"${id}"`).join(",") + ")";
    try {
      const delRes = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?${filter}`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        }
      });
      if (delRes.ok) {
        deletedCount += chunk.length;
      }
    } catch (dErr) {
      console.error("Housekeeping delete error:", dErr.message);
    }
  }

  console.log(`🗑️ Successfully pruned ${deletedCount} low-attention/stale pulses from Supabase.`);

  try {
    const localPath = path.resolve(__dirname, '../data/cloud_pulse.json');
    if (fs.existsSync(localPath)) {
      fs.writeFileSync(localPath, JSON.stringify(result.retainedApproved, null, 2));
      console.log("💾 Synchronized local data/cloud_pulse.json fallback cache.");
    }
  } catch (cErr) {
    console.warn("Could not sync local cloud_pulse.json:", cErr.message);
  }

  return {
    pruned: deletedCount,
    stats: result.stats,
    retainedCount: result.retainedApproved.length
  };
}

async function runAutoPublisher(options = {}) {
  const isDryRun = options.dryRun || process.argv.includes("--dry-run");
  const force = options.force || process.argv.includes("--force");

  console.log("? Starting Cloud Pulse 12-Hour Fallback Watchdog...");

  // 0. Run Housekeeping to purge low-attention/stale pulses & free up space
  await executePulseHousekeeping(options);


  // 1. Fetch recent approved pulses to verify admin activity
  let approvedPulses = [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?status=eq.approved&order=created_at.desc&limit=25`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (res.ok) {
      approvedPulses = await res.json();
    }
  } catch (err) {
    console.warn("Could not query Supabase for approved pulses:", err.message);
  }

  const elapsedHours = calculateInactivityHours(approvedPulses);
  console.log(`? Hours elapsed since last manual admin approval: ${elapsedHours === Infinity ? 'None recorded' : elapsedHours.toFixed(2) + 'h'}`);

  if (!force && elapsedHours < INACTIVITY_THRESHOLD_HOURS) {
    const remaining = (INACTIVITY_THRESHOLD_HOURS - elapsedHours).toFixed(1);
    console.log(`? Admin has actively approved micro-posts within the last 12 hours (${remaining}h remaining before auto-publish threshold).`);
    return {
      autoPublished: false,
      reason: "within_threshold",
      elapsedHours,
      thresholdHours: INACTIVITY_THRESHOLD_HOURS
    };
  }

  console.log(`?? Admin has not approved any micro-posts in >= ${INACTIVITY_THRESHOLD_HOURS} hours (or --force active). Proceeding to auto-publish freshest candidate...`);

  // 2. Fetch freshest candidate from pending_approval queue
  let pendingPulses = [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?status=eq.pending_approval&order=created_at.desc&limit=10`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (res.ok) {
      pendingPulses = await res.json();
    }
  } catch (err) {
    console.error("Error fetching pending candidates from Supabase:", err.message);
  }

  if (!Array.isArray(pendingPulses) || pendingPulses.length === 0) {
    console.log("? Pending approval queue is empty. No candidates available to auto-publish.");
    return {
      autoPublished: false,
      reason: "no_pending_candidates"
    };
  }

  // 3. Select freshest candidate & strictly validate / enforce analogy format
  const candidate = pendingPulses[0];
  console.log(`\n?? Selected candidate for auto-publishing: "${candidate.title}" (ID: ${candidate.id})`);

  const analogyResult = validateAndEnforceAnalogy(candidate.title, candidate.content);
  if (analogyResult.synthesized) {
    console.log("  ? Polished candidate content to strictly adhere to ?? What Changed + ?? Why It Matters format.");
  } else {
    console.log("  ? Confirmed candidate strictly matches Cloud Pulse 2-part analogy.");
  }

  const updatePayload = {
    content: analogyResult.formattedContent,
    status: "approved",
    eligibility_reason: `[Auto-Published] Published automatically after ${elapsedHours === Infinity ? '12+' : elapsedHours.toFixed(1)}h without manual admin curation.`,
    updated_at: new Date().toISOString()
  };

  if (isDryRun) {
    console.log("\n[DRY RUN] Would update pulse with payload:", JSON.stringify(updatePayload, null, 2));
    return {
      autoPublished: true,
      dryRun: true,
      candidateId: candidate.id,
      title: candidate.title,
      content: analogyResult.formattedContent
    };
  }

  // 4. Update Supabase
  try {
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?id=eq.${encodeURIComponent(candidate.id)}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(updatePayload)
    });

    if (patchRes.ok) {
      console.log(`?? Successfully auto-published pulse: "${candidate.title}"!`);

      // 5. Update local fallback data/cloud_pulse.json if present
      try {
        const localPath = path.resolve(__dirname, '../data/cloud_pulse.json');
        if (fs.existsSync(localPath)) {
          const raw = fs.readFileSync(localPath, 'utf8');
          const localData = JSON.parse(raw);
          const updatedCandidate = { ...candidate, ...updatePayload };
          const newArray = [updatedCandidate].concat(localData.filter(p => p.id !== candidate.id)).slice(0, 15);
          fs.writeFileSync(localPath, JSON.stringify(newArray, null, 2));
          console.log("? Synchronized local data/cloud_pulse.json fallback cache.");
        }
      } catch (fErr) {
        console.warn("Could not update local cloud_pulse.json:", fErr.message);
      }

      return {
        autoPublished: true,
        candidateId: candidate.id,
        title: candidate.title
      };
    } else {
      const errText = await patchRes.text();
      console.error("Failed to patch Supabase pulse:", errText);
      return { autoPublished: false, error: errText };
    }
  } catch (netErr) {
    console.error("Network error updating pulse:", netErr.message);
    return { autoPublished: false, error: netErr.message };
  }
}

if (require.main === module) {
  runAutoPublisher().catch(console.error);
}

module.exports = {
  evaluatePulseHousekeeping,
  executePulseHousekeeping,
  isManualApproval,
  cleanText,
  createSmartFallbackHook,
  validateAndEnforceAnalogy,
  calculateInactivityHours,
  runAutoPublisher
};
