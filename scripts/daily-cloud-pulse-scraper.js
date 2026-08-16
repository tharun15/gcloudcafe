/**
 * Autonomous Cloud Pulse Newsroom Scraper & Gemini AI Synthesizer
 * 
 * Aggregates official release feeds (GCP, AWS, Kubernetes, CNCF, OpenShift),
 * deduplicates against Supabase, enriches with Gemini AI into crisp 2-bullet engineer insights,
 * and saves them with status='pending_approval' for newsroom admin curation.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://axiijcsxtiukloarbfor.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc";

const FEEDS = [
  { 
    provider: "GCP", 
    name: "Google Cloud Release Notes", 
    url: "https://cloud.google.com/feeds/gcp-release-notes.xml", 
    defaultTags: ["#GoogleCloud", "#GCP", "#CloudNews"] 
  },
  { 
    provider: "AWS", 
    name: "AWS What's New", 
    url: "https://aws.amazon.com/about-aws/whats-new/recent/feed/", 
    defaultTags: ["#AWS", "#CloudArchitecture", "#CloudNews"] 
  },
  { 
    provider: "Kubernetes", 
    name: "Kubernetes CNCF Updates", 
    url: "https://kubernetes.io/feed.xml", 
    defaultTags: ["#Kubernetes", "#CNCF", "#CloudNative"] 
  },
  { 
    provider: "OpenShift", 
    name: "Red Hat & OpenShift Releases", 
    url: "https://www.redhat.com/en/rss/blog", 
    defaultTags: ["#OpenShift", "#RedHat", "#DevOps"] 
  },
  {
    provider: "GCP",
    name: "Google Cloud Blog",
    url: "https://cloudblog.withgoogle.com/rss/",
    defaultTags: ["#GoogleCloud", "#Architecture", "#DevOps"]
  }
];

function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;[^&]+&gt;/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isHighRelevanceCandidate(title, summary) {
  const text = (title + " " + summary).toLowerCase();
  if (text.includes("customer bug fixes") || text.includes("internal release") || text.includes("routine maintenance") || text.includes("webinar recap")) return false;
  if (summary.length < 30) return false;
  return true;
}

function extractSmartHeadline(rawTitle, rawSummary, provider) {
  let title = cleanText(rawTitle);
  let summary = cleanText(rawSummary);

  // If title is just a date (e.g. "August 15, 2026"), extract feature name from summary
  if (/^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i.test(title)) {
    const featureMatch = summary.match(/^([A-Z0-9\s\-_.:]{5,70}?)(?:Feature|Announcement|Deprecated|Changed|Fixed|Preview|GA|\sis now|\sintroduces)/i);
    if (featureMatch) {
      title = `${provider}: ${featureMatch[1].trim()}`;
    } else {
      const firstSentence = summary.split(".")[0];
      title = (firstSentence && firstSentence.length > 10 && firstSentence.length < 80) ? firstSentence.trim() : `${provider} Feature Release`;
    }
  }

  return { title, summary };
}

function parseItems(xmlText, feed) {
  const items = [];
  const itemRegex = /<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi;
  const matches = xmlText.match(itemRegex) || [];

  for (const match of matches.slice(0, 5)) {
    const titleMatch = match.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = match.match(/<link[^>]*href=["']([^"']+)["'][^>]*>|<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const summaryMatch = match.match(/<(?:description|summary|content)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary|content)>/i);

    const rawTitle = titleMatch ? titleMatch[1] : "";
    const rawLink = linkMatch ? (linkMatch[1] || cleanText(linkMatch[2])) : "";
    const rawSummary = summaryMatch ? summaryMatch[1] : "";

    const { title, summary } = extractSmartHeadline(rawTitle, rawSummary, feed.provider);

    if (title && isHighRelevanceCandidate(title, summary)) {
      items.push({
        provider: feed.provider,
        title: title,
        summary: summary,
        link: rawLink,
        tags: feed.defaultTags
      });
    }
  }
  return items;
}

async function getExistingPulseUrls() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?select=title,link_url&limit=100`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      const set = new Set();
      data.forEach(item => {
        if (item.link_url) set.add(item.link_url.trim().toLowerCase());
        if (item.title) set.add(item.title.trim().toLowerCase());
      });
      return set;
    }
  } catch (err) {
    console.warn("Could not fetch existing pulse URLs for deduplication:", err.message);
  }
  return new Set();
}

async function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?key=eq.gemini_api_key&select=value`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].value) return data[0].value.trim();
    }
  } catch (e) {}
  return null;
}

async function generateAiPulse(apiKey, item) {
  if (!apiKey) {
    return {
      title: item.title,
      content: item.summary.length > 220 ? item.summary.substring(0, 217) + "..." : item.summary
    };
  }

  const prompt = `You are the lead cloud architect and news editor for GCloud Cafe (https://gcloudcafe.com).
Transform this official ${item.provider} cloud announcement into a structured, high-impact Cloud Pulse candidate for admin approval.

STRICT FORMAT:
Title: [A punchy, clear headline under 75 characters. If the original title was a date, give a real descriptive headline.]
Summary: 🎯 What Changed: [1 crisp sentence on what was released/changed]\n\n💡 Engineering Impact: [1-2 sentences on architectural benefit, DevOps impact, or migration guidance]

RULES:
- Maximum 90 words total.
- No meta text, no markdown codeblocks. Output directly in the Title: / Summary: format.

Original Title: ${item.title}
Context: ${item.summary}`;

  const models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-flash"];
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          let title = item.title;
          let content = text;

          const titleMatch = text.match(/^Title:\s*(.+)$/im);
          const summaryMatch = text.match(/^Summary:\s*([\s\S]+)$/im);

          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
          }
          if (summaryMatch && summaryMatch[1]) {
            content = summaryMatch[1].trim();
          }

          return { title, content };
        }
      }
    } catch (e) {}
  }

  return {
    title: item.title,
    content: item.summary.length > 220 ? item.summary.substring(0, 217) + "..." : item.summary
  };
}

async function runScraper() {
  console.log("🚀 Starting Gcloudcafe Daily Cloud Pulse Newsroom Scraper...");
  const apiKey = await getGeminiApiKey();
  if (apiKey) {
    console.log("✓ Gemini AI active for smart news synthesis.");
  } else {
    console.log("ℹ No Gemini API key detected; falling back to clean text extraction.");
  }

  const existingPulses = await getExistingPulseUrls();
  console.log(`✓ Loaded ${existingPulses.size} existing pulses for smart deduplication.`);

  let rawCandidates = [];

  for (const feed of FEEDS) {
    try {
      console.log(`📡 Fetching feed: ${feed.name}...`);
      const res = await fetch(feed.url, { 
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GCloudCafePulseBot/2.0" } 
      });
      if (!res.ok) {
        console.warn(`  ↳ HTTP ${res.status} for ${feed.name}`);
        continue;
      }
      const xml = await res.text();
      const parsed = parseItems(xml, feed);
      rawCandidates = rawCandidates.concat(parsed);
      console.log(`  ↳ Found ${parsed.length} candidate items.`);
    } catch (e) {
      console.error(`  ↳ Error fetching feed ${feed.name}:`, e.message);
    }
  }

  // Deduplicate against database and within current batch
  const toProcess = [];
  const seenInBatch = new Set();

  for (const item of rawCandidates) {
    const linkKey = item.link ? item.link.trim().toLowerCase() : "";
    const titleKey = item.title.trim().toLowerCase();

    if (linkKey && existingPulses.has(linkKey)) continue;
    if (existingPulses.has(titleKey)) continue;
    if (seenInBatch.has(titleKey)) continue;

    seenInBatch.add(titleKey);
    toProcess.push(item);
  }

  console.log(`\n✨ ${toProcess.length} fresh, unique candidates to process.`);

  // Limit to top 6 freshest candidates for the Admin queue
  const finalBatch = toProcess.slice(0, 6);
  let insertedCount = 0;

  for (const item of finalBatch) {
    try {
      console.log(`\n⚡ Processing candidate: ${item.title}`);
      const enriched = await generateAiPulse(apiKey, item);

      const payload = {
        title: enriched.title,
        content: enriched.content,
        author: "Cloud Newsroom Bot",
        link_url: item.link || null,
        tags: item.tags,
        upvotes: 1,
        downvotes: 0,
        score: 1,
        status: "pending_approval", // STRICT: All automated newsroom pulls require admin approval before live publishing
        eligibility_reason: `Official ${item.provider} Release: Ingested & AI synthesized for Admin Approval Queue.`
      };

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(payload)
      });

      if (insertRes.ok) {
        insertedCount++;
        console.log(`  ✓ Successfully added to /pulse-admin/ Approval Queue (status: pending_approval)!`);
      } else {
        const errText = await insertRes.text();
        console.warn(`  ⚠ Insert failed: ${errText}`);
      }
    } catch (err) {
      console.error("  ✕ Error during candidate ingestion:", err.message);
    }
  }

  console.log(`\n🎉 Newsroom Ingestion Complete! Added ${insertedCount} candidates to the Admin Approval Queue.`);
}

runScraper().catch(console.error);
