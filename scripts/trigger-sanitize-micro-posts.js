/**
 * trigger-sanitize-micro-posts.js
 * Workflow script to scrape, analyze, sanitize, and cap pending micro-posts to strict top 10 newest items.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://axiijcsxtiukloarbfor.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc";

const FEEDS = [
  { provider: "GCP", name: "Google Cloud Release Notes", url: "https://cloud.google.com/feeds/gcp-release-notes.xml", defaultTags: ["#GoogleCloud", "#GCP", "#CloudNews"] },
  { provider: "AWS", name: "AWS What's New", url: "https://aws.amazon.com/about-aws/whats-new/recent/feed/", defaultTags: ["#AWS", "#CloudArchitecture", "#CloudNews"] },
  { provider: "Kubernetes", name: "Kubernetes CNCF Blog", url: "https://kubernetes.io/feed.xml", defaultTags: ["#Kubernetes", "#CNCF", "#CloudNative"] },
  { provider: "OpenShift", name: "Red Hat Blog & OpenShift Releases", url: "https://www.redhat.com/en/rss/blog", defaultTags: ["#OpenShift", "#RedHat", "#DevOps"] }
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
    .replace(/\s+/g, " ")
    .trim();
}

function extractSmartHeadline(rawTitle, rawSummary, provider) {
  let title = cleanText(rawTitle);
  let summary = cleanText(rawSummary);

  if (/^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i.test(title)) {
    const featureMatch = summary.match(/^([A-Z0-9\s\-_.:]{5,60}?)(?:Feature|Announcement|Deprecated|Changed|Fixed|Preview|GA)\b/i);
    if (featureMatch) {
      title = `${provider} ${featureMatch[1].trim()} Update`;
    } else {
      const firstSentence = summary.split(".")[0];
      title = (firstSentence && firstSentence.length > 10 && firstSentence.length < 80) ? firstSentence.trim() : `${provider} Platform Feature Release`;
    }
  }

  return { title, summary };
}

function isHighRelevanceCandidate(title, summary) {
  const text = (title + " " + summary).toLowerCase();
  if (text.includes("customer bug fixes") || text.includes("internal release") || text.includes("routine maintenance")) return false;
  if (summary.length < 25) return false;
  return true;
}

function parseItems(xmlText, feed) {
  const items = [];
  const itemRegex = /<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi;
  const matches = xmlText.match(itemRegex) || [];

  for (const match of matches.slice(0, 6)) {
    const titleMatch = match.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = match.match(/<link[^>]*href=["']([^"']+)["'][^>]*>|<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const summaryMatch = match.match(/<(?:description|summary|content)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary|content)>/i);

    const rawTitle = titleMatch ? titleMatch[1] : "";
    const rawLink = linkMatch ? (linkMatch[1] || cleanText(linkMatch[2])) : "";
    const rawSummary = summaryMatch ? summaryMatch[1] : "";

    const { title, summary } = extractSmartHeadline(rawTitle, rawSummary, feed.provider);

    if (title && isHighRelevanceCandidate(title, summary)) {
      const microContent = summary.length > 220 ? summary.substring(0, 217) + "..." : summary;

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
        eligibility_reason: `Official ${feed.provider} Release: Grounded candidate notes evaluated for high technical relevance.`
      });
    }
  }
  return items;
}

async function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?key=eq.gemini_api_key&select=value`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].value) {
      return data[0].value.trim();
    }
  } catch (e) {}
  return "";
}

async function generateAITLDRHook(apiKey, title, rawSummary) {
  if (!apiKey) return generateSmartSummaryFallback(rawSummary);

  const models = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.5-flash", "gemini-3-flash-preview"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const prompt = `You are a Senior Cloud Architect & News Editor at GCloud Cafe (https://gcloudcafe.com).
Turn this cloud release into a high-engagement LinkedIn insight for software engineers and architects.

CRITICAL FORMAT (Strictly 2 sentences):
Sentence 1: Crisp summary of what specifically launched or changed.
Sentence 2: Engaging takeaway explaining why this matters for cloud architecture, security, cost, or developer speed.

Format as: <Sentence 1> Why it matters: <Sentence 2>
Do NOT use hashtags, emojis, or markdown. Return only the plain text.

Headline: ${title}
Context: ${rawSummary}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://gcloudcafe.com/"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.25 }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text && text.length >= 20) {
          return text.replace(/^["'\s]+|["'\s]+$/g, "");
        }
      }
    } catch (e) {}
  }
  return generateSmartSummaryFallback(rawSummary);
}

function generateSmartSummaryFallback(summary) {
  if (!summary) return "";
  const sentences = summary.split(/(?<=[.?!])\s+/);
  if (sentences.length >= 2 && (sentences[0] + " " + sentences[1]).length <= 220) {
    return (sentences[0] + " " + sentences[1]).trim();
  }
  return summary.length > 200 ? summary.substring(0, 197) + "..." : summary;
}

async function triggerSanitizeMicroPosts() {
  console.log("⚡ Executing trigger-sanitize-micro-posts Workflow with Gemini AI TL;DR Generation...");

  const geminiApiKey = await getGeminiApiKey();
  console.log(geminiApiKey ? "✨ Gemini API Key loaded from Supabase site_settings!" : "ℹ️ No Gemini API Key found; using smart semantic excerpts.");

  // Step 1: Purge all pending_approval posts in Supabase
  console.log("\n🧹 Step 1: Deleting all pending_approval posts in Supabase...");
  await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?status=eq.pending_approval`, {
    method: "DELETE",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
  });

  // Step 2: Scrape fresh feeds
  console.log("\n📡 Step 2: Fetching fresh cloud release feeds...");
  let candidates = [];
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { headers: { "User-Agent": "Mozilla/5.0 GCloudCafeNewsroom/1.0" } });
      if (res.ok) {
        const xml = await res.text();
        const parsed = parseItems(xml, feed);
        candidates = candidates.concat(parsed);
      }
    } catch (e) {
      console.warn(`Feed ${feed.name} error:`, e.message);
    }
  }

  // Step 3: Insert candidates with AI TL;DR synthesis
  console.log(`\n📥 Step 3: Generating AI TL;DRs and inserting candidates to Supabase...`);
  const uniqueMap = new Map();
  candidates.forEach(c => uniqueMap.set(c.title, c));
  const newCandidates = Array.from(uniqueMap.values()).slice(0, 10);

  for (const item of newCandidates) {
    console.log(`🤖 Synthesizing AI TL;DR for: "${item.title}"...`);
    const aiTLDR = await generateAITLDRHook(geminiApiKey, item.title, item.content);
    item.content = aiTLDR;

    await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(item)
    });
  }

  // Step 4: Cap Pending Queue to Strict Top 10 Newest Items
  console.log("\n✂️ Step 4: Capping pending queue to top 10 newest candidate posts...");
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?status=eq.pending_approval&order=created_at.desc&select=id,title,created_at`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
  });
  const allPending = await checkRes.json();

  if (Array.isArray(allPending) && allPending.length > 10) {
    const extraToDelete = allPending.slice(10);
    console.log(`Deleting ${extraToDelete.length} older extra candidates beyond top 10...`);
    for (const item of extraToDelete) {
      console.log(`🗑️ Deleted older extra candidate: "${item.title.substring(0, 45)}..."`);
      await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?id=eq.${item.id}&status=eq.pending_approval`, {
        method: "DELETE",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
    }
  }

  console.log("\n✨ trigger-sanitize-micro-posts workflow completed! All candidates have AI TL;DRs.");
}

triggerSanitizeMicroPosts();
