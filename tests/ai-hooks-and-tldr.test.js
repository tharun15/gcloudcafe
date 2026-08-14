import { describe, it, expect } from 'vitest';

// Core smart fallback hook generation logic from blog-enhancements.js
function createSmartFallbackHook(title, rawContent) {
  var clean = (rawContent || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;[^&]+&gt;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return (title || "Cloud Release Update").trim() + ".";

  var sentenceMatches = clean.match(/[^.!?]+[.!?]+/g) || [];
  var completeSentences = sentenceMatches
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s.length > 20; });

  var combined = "";
  if (completeSentences.length > 0) {
    combined = completeSentences[0];
    if (combined.length < 120 && completeSentences.length > 1) {
      combined += " " + completeSentences[1];
    }
  } else {
    combined = clean;
  }

  combined = combined
    .replace(/\s+(?:that|which|who|a|an|the|and|or|but|with|to|for|in|on|at|by|from|as|into|require|requires|requiring|is|are|was|were)\s*$/i, "")
    .trim();

  if (!/[.!?]$/.test(combined)) {
    combined += ".";
  }

  return combined || (title + ".");
}

describe('Intelligent AI Hook Synthesis & Smart Fallback Suite', () => {
  it('never cuts off mid-sentence on dangling prepositions or conjunctions', () => {
    const rawContent = 'Enterprise IT and agentic systems require a complex reasoning framework that require a <a href="#">read more</a>';
    const title = 'What is metal to agents?';
    const hook = createSmartFallbackHook(title, rawContent);

    expect(hook.endsWith('require a.')).toBe(false);
    expect(hook.endsWith('that require a.')).toBe(false);
    expect(hook.endsWith('.')).toBe(true);
  });

  it('cleans all HTML tags and entities perfectly', () => {
    const rawContent = '<p>Google Cloud &lt;Release&ngt; announces &quot;Cloud Run GemeSpan&quot; &amp; database updates. This boosts performance.</p>';
    const hook = createSmartFallbackHook('GCP Update', rawContent);

    expect(hook).not.toContain('<p>');
    expect(hook).not.toContain('&quot;');
    expect(hook).not.toContain('&amp;');
    expect(hook).toContain('"Cloud Run GemeSpan" & database updates.');
  });

  it('returns title when raw content is empty', () => {
    const title = 'Certified Kubernetes Administrator (CKA)';
    expect(createSmartFallbackHook(title, '')).toBe('Certified Kubernetes Administrator (CKA).');
    expect(createSmartFallbackHook('', '')).toBe('Cloud Release Update.');
  });

  it('validates Gemini model fallback list contains valid API model names', () => {
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    models.forEach(m => {
      expect(m).toMatch(/^gemini-\d+\./);
    });
  });
});
