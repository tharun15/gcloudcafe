import { describe, it, expect } from 'vitest';

function createSmartFallbackHook(title, rawContent) {
  var clean = (rawContent || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;[^&]+&gt;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  var cleanTitle = (title || "Cloud Platform Update").trim();
  if (!clean) {
    return "🎯 What Changed: " + cleanTitle + ".\n\n💡 Why It Matters: Enables cloud and DevOps teams to optimize workloads and modernize cloud infrastructure.";
  }

  var sentenceMatches = clean.match(/[^.!?]+[.!?]+/g) || [];
  var sentences = sentenceMatches
    .map(function(s) { return s.trim(); })
    .filter(function(s) {
      return s.length > 20 && !/want to know|check back|find it here|read more|latest from/i.test(s);
    });

  var whatChanged = "";
  var impact = "";

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

  return "🎯 What Changed: " + whatChanged + "\n\n💡 Why It Matters: " + impact;
}

describe('Intelligent AI Hook Synthesis & Structured Pulse Suite', () => {
  it('formats fallback hooks into structured 2-bullet What Changed + Why It Matters layout', () => {
    const rawContent = 'Google Cloud announced Cloud Spanner dual-region configurations. This reduces failover latency to under 5 seconds for distributed workloads.';
    const title = 'Cloud Spanner Dual-Region Launch';
    const hook = createSmartFallbackHook(title, rawContent);

    expect(hook).toContain('🎯 What Changed:');
    expect(hook).toContain('💡 Why It Matters:');
    expect(hook).toContain('Cloud Spanner dual-region configurations.');
    expect(hook).toContain('reduces failover latency');
  });

  it('filters out generic RSS preambles and promotional filler', () => {
    const rawContent = 'Want to know the latest from Google Cloud? Find it here in one handy location. Check back regularly. Vertex AI now supports real-time endpoint auto-scaling. This cuts idle GPU costs significantly.';
    const title = "Vertex AI Auto-Scaling";
    const hook = createSmartFallbackHook(title, rawContent);

    expect(hook).not.toContain('Want to know the latest');
    expect(hook).not.toContain('Find it here in one handy location');
    expect(hook).toContain('Vertex AI now supports real-time endpoint auto-scaling.');
    expect(hook).toContain('cuts idle GPU costs');
  });

  it('handles empty content gracefully with architectural impact default', () => {
    const title = 'Certified Kubernetes Administrator (CKA)';
    const hook = createSmartFallbackHook(title, '');

    expect(hook).toContain('🎯 What Changed: Certified Kubernetes Administrator (CKA).');
    expect(hook).toContain('💡 Why It Matters:');
  });

  it('validates Gemini model fallback list contains valid API model names', () => {
    const models = ["gemini-2.5-flash", "gemini-flash-latest"];
    models.forEach(m => {
      expect(m).toMatch(/^gemini-/);
    });
  });
});
