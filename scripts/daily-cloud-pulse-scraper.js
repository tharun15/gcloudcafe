/**
 * Daily Cloud Micro-Post News Scraper & Candidate Generator
 * Scrapes official release feeds (GCP, AWS, Azure, OpenShift, Kubernetes / CNCF)
 * Filters out low-value notes and formats top grounded candidates with eligibility reasons into Supabase (status='pending_approval').
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
    name: "Kubernetes CNCF Blog",
    url: "https://kubernetes.io/feed.xml",
    defaultTags: ["#Kubernetes", "#CNCF", "#CloudNative"]
  },
  {
    provider: "OpenShift",
    name: "Red Hat Blog & OpenShift Releases",
    url: "https://www.redhat.com/en/rss/blog",
    defaultTags: ["#OpenShift", "#RedHat", "#DevOps"]
  }
];

function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, "")
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

  // Fix generic date titles from GCP RSS feeds (e.g. "August 06, 2026")
  if (/^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i.test(title)) {
    // Extract first meaningful sentence or service name from summary
    const featureMatch = summary.match(/^([A-Z0-9\s\-_.:]{5,60}?)(?:Feature|Announcement|Deprecated|Changed|Fixed|Preview|GA)\b/i);
    if (featureMatch) {
      title = `${provider} ${featureMatch[1].trim()} Update`;
    } else {
      const firstSentence = summary.split(".")[0];
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 80) {
        title = firstSentence.trim();
      } else {
        title = `${provider} Platform Feature Release`;
      }
    }
  }

  return { title, summary };
}

function isHighRelevanceCandidate(title, summary) {
  const text = (title + " " + summary).toLowerCase();

  // Reject low-value / internal routine entries
  if (text.includes("customer bug fixes") || text.includes("internal release") || text.includes("routine maintenance")) {
    return false;
  }
  if (summary.length < 25) {
    return false;
  }
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
        eligibility_reason: `Official ${feed.provider} Release: Grounded release note candidate from ${feed.name}. High architectural & engineering relevance.`
      });
    }
  }
  return items;
}

async function runScraper() {
  console.log("🚀 Starting Smart Cloud Micro-Post Scraper...");
  let candidates = [];

  for (const feed of FEEDS) {
    try {
      console.log(`Fetching feed: ${feed.name}...`);
      const res = await fetch(feed.url, { headers: { "User-Agent": "Mozilla/5.0 GCloudCafeNewsroom/1.0" } });
      if (!res.ok) {
        console.warn(`Feed ${feed.name} returned status ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const parsed = parseItems(xml, feed);
      candidates = candidates.concat(parsed);
      console.log(`Parsed ${parsed.length} high-relevance candidates from ${feed.provider}.`);
    } catch (e) {
      console.error(`Error fetching feed ${feed.name}:`, e.message);
    }
  }

  // Deduplicate candidates by title
  const uniqueMap = new Map();
  candidates.forEach(c => uniqueMap.set(c.title, c));
  const uniqueCandidates = Array.from(uniqueMap.values());

  const top10 = uniqueCandidates.slice(0, 10);
  console.log(`\nInserting ${top10.length} high-relevance candidate micro-posts to Supabase (status='pending_approval')...`);

  for (const item of top10) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        console.log(`✅ Ingested: "${item.title.substring(0, 50)}..."`);
      }
    } catch (err) {
      console.error("Error inserting candidate:", err.message);
    }
  }

  console.log("\n🎉 High-relevance newsroom ingestion complete!");
}

runScraper();
