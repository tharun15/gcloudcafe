import { describe, it, expect } from 'vitest';

// Core logic from daily-cloud-pulse-scraper.js
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

function deduplicateCandidates(candidates) {
  const uniqueMap = new Map();
  candidates.forEach(c => uniqueMap.set(c.title, c));
  return Array.from(uniqueMap.values());
}

describe('Newsroom Scraper & Feed Processing Engine', () => {
  it('cleans raw HTML and HTML entities from RSS text', () => {
    const raw = '<p>Google Cloud &amp; Kubernetes <b>GA release</b>&#39;s update.</p>';
    expect(cleanText(raw)).toBe("Google Cloud & Kubernetes GA release's update.");
  });

  it('extracts smart headlines when feed title is a generic date string', () => {
    const title = 'August 08, 2026';
    const summary = 'BigQuery Storage Feature Announcement for zero-code data ingestion.';
    const result = extractSmartHeadline(title, summary, 'GCP');

    expect(result.title).toBe('GCP BigQuery Storage Update');
  });

  it('filters out low-relevance customer bug fixes and routine maintenance notes', () => {
    expect(isHighRelevanceCandidate('Routine maintenance window', 'Short note')).toBe(false);
    expect(isHighRelevanceCandidate('Customer bug fixes for internal release', 'Fixing minor edge case')).toBe(false);
    expect(isHighRelevanceCandidate('Operating AI/ML Workloads on Kubernetes', 'Detailed engineering guide on Kubeflow and Headlamp plugins.')).toBe(true);
  });

  it('deduplicates identical candidate titles across multiple RSS feeds', () => {
    const candidates = [
      { title: 'AWS DevOps Update', content: 'First feed item' },
      { title: 'AWS DevOps Update', content: 'Duplicate feed item' },
      { title: 'OpenShift Service Mesh Guide', content: 'Unique feed item' }
    ];

    const deduplicated = deduplicateCandidates(candidates);
    expect(deduplicated).toHaveLength(2);
    expect(deduplicated[0].title).toBe('AWS DevOps Update');
    expect(deduplicated[1].title).toBe('OpenShift Service Mesh Guide');
  });

  it('correctly maps cloud providers from tags, title, or url', () => {
    function detectProvider(c) {
      const text = ((Array.isArray(c.tags) ? c.tags.join(" ") : "") + " " + (c.title || "") + " " + (c.link_url || "")).toLowerCase();
      if (text.includes("google") || text.includes("gcp") || text.includes("bigquery") || text.includes("vertex")) return "gcp";
      if (text.includes("aws") || text.includes("amazon") || text.includes("s3") || text.includes("ec2")) return "aws";
      if (text.includes("kubernetes") || text.includes("k8s") || text.includes("cncf")) return "k8s";
      if (text.includes("openshift") || text.includes("redhat")) return "openshift";
      return "other";
    }

    expect(detectProvider({ title: "Google Cloud Forrester Leader", tags: ["#GoogleCloud"] })).toBe("gcp");
    expect(detectProvider({ title: "Amazon WorkSpaces Blackwell", tags: ["#AWS"] })).toBe("aws");
    expect(detectProvider({ title: "K8s v1.37 Storage Beta", tags: ["#Kubernetes"] })).toBe("k8s");
    expect(detectProvider({ title: "Red Hat OpenShift AI", tags: ["#OpenShift"] })).toBe("openshift");
  });

  it('guarantees balanced HTML output without dangling closing tags when What Changed is absent', () => {
    function safeFormatCandidateHtml(text) {
      const raw = (text || "").trim();
      const impactMatch = raw.match(/(?:💡\s*(?:\*\*)?Impact(?:\*\*)?:?)([\s\S]+)$/i);
      let whatChanged = "";
      let impact = "";

      if (impactMatch) {
        impact = impactMatch[1].trim();
        const before = raw.substring(0, impactMatch.index).trim();
        const wcMatch = before.match(/(?:🎯\s*(?:\*\*)?What Changed(?:\*\*)?:?)([\s\S]+)$/i);
        whatChanged = wcMatch ? wcMatch[1].trim() : before;
      } else {
        const wcMatch = raw.match(/(?:🎯\s*(?:\*\*)?What Changed(?:\*\*)?:?)([\s\S]+)$/i);
        whatChanged = wcMatch ? wcMatch[1].trim() : raw;
      }

      let out = '<div>';
      if (whatChanged) out += `<span>${whatChanged}</span>`;
      if (impact) out += `<span>${impact}</span>`;
      out += '</div>';
      return out;
    }

    const unformatted = "A raw release note without standard emojis or sections.";
    const result = safeFormatCandidateHtml(unformatted);
    expect(result).toBe("<div><span>A raw release note without standard emojis or sections.</span></div>");
    expect(result.startsWith("<div>") && result.endsWith("</div>")).toBe(true);
  });
});
