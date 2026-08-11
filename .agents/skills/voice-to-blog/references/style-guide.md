# Tharun's GCloudCafe Writing Style Guide

This guide is extracted from Tharun's existing blog posts and must be followed when generating any new content.

---

## Voice & Tone

- **First-person, conversational** — writes as if talking to a colleague, not lecturing
- **Honest and self-aware** — admits mistakes, failures, "I almost gave up", "I was wrong"
- **Specific over vague** — uses real numbers, times, dates, scores (e.g. "61%", "45 minutes", "the morning of my exam")
- **Empathetic opener** — always starts by acknowledging the reader's pain or situation
- **Never preachy** — doesn't moralize; shares what worked for HIM and lets the reader decide
- **Light humour** — occasional dry wit, never forced (e.g. "Spoiler: it didn't go perfectly")

---

## Post Structure

### Single Post Structure

```
[Opening hook — relatable pain point OR surprising personal story, 2-3 sentences, NO heading]

[Brief framing — what this post is and isn't, sets expectations]

---

## [First major section — usually a story or context]

[Personal narrative with specific details]

---

## [Second section — the substance / what they should know]

### Subsection with emoji (in tips/tricks posts)
[Practical, specific advice]

---

## [Tips & Tricks section (if applicable)]
[Numbered or bulleted, each with a short story or rationale]

---

## Conclusion: [Title]
[Reflective wrap-up, returns to the opener's theme, ends with encouragement]

---

*[Italic footnote — points to GitHub repo, related resource, or invites comments]*
```

### Series Post Structure

```
[Opening — references series context, welcomes reader to this part]

[Brief summary of what THIS part covers]

---

## [Section 1]
[Content]

---

## [Section 2]
[Content]

---

## Tips & Tricks for [Topic]
[Numbered list, each grounded in personal experience]

---

## What's Coming Next
[Tease the next part specifically — not vaguely]

---

*[Closing italic — invites community sharing or feedback]*
```

---

## Frontmatter Schema

### Single Post
```yaml
---
title: "[Specific, benefit-driven title — not clickbait]"
meta_title: "[Slightly different angle for SEO]"
description: "[1-2 sentences — what the reader gains + Tharun's personal experience angle]"
date: YYYY-MM-DD
image: "/images/[image-file].png"
categories: ["[Primary]", "[Secondary]"]
author: "tharun-vempati"
tags: ["tag1", "tag2", "tag3", "tag4", "tag5"]
draft: true
---
```

### Series Post
```yaml
---
title: "[Series Name] – Part [N]: [Subtitle]"
meta_title: "[SEO-friendly version]"
date: YYYY-MM-DD
image: "/images/[image-file].png"
description: "[What this specific part covers]"
categories: ["[Primary]", "[Secondary]", "[Tertiary]"]
tags: ["tag1", "tag2", "tag3"]
author: tharun-vempati
series: "[Full Series Name]"
series_order: [N]
draft: true
---
```

---

## Section Heading Style

- **Major sections**: `## Title` — plain, descriptive, no fluff
- **Sub-sections in tips posts**: `### 🔗 Title` or `### 1. Title` — emoji optional but used in tips/tricks posts
- **Personal story sections**: `## My [Topic] Story: [Subtitle]` or `## [Relatable Scenario]`
- **Conclusion**: `## Conclusion: [Short punchy phrase]` or `## The [Topic] Decision Point`

---

## Recurring Patterns (use these naturally)

| Pattern | Example from Tharun's posts |
|---------|----------------------------|
| Relatable opening question | *"Does this sound familiar?"* |
| Honest admission | *"I wasn't really looking forward to..."* |
| Specific consequence | *"By the time I finally completed that single task, 45 minutes had already passed"* |
| Direct advice | *"Trust me, discovering it on exam day is not how you want to find out"* |
| Strong rule statement | *"The Simple Rule: If your answer is 'no' to even one of these questions, you're not ready"* |
| Callback to opener in conclusion | Returns to the opening pain and resolves it |
| "What's Coming Next" | Always specific, never vague ("next part covers X and Y") |
| Italic closing footnote | Links to GitHub repo or invites reader interaction |

---

## Categories & Tags Reference

| Topic Area | Typical Categories | Typical Tags |
|-----------|-------------------|-------------|
| Kubernetes/CKA | `["Kubernetes", "CKA"]` | `kubernetes, cka, certification, devops, cloud-native` |
| OpenShift/EX280 | `["Certifications", "DevOps", "Red Hat", "OpenShift", "Administrator"]` | `Red Hat, OpenShift, EX280, Certification, ...` |
| GCP Certifications | `["Google Cloud", "Certifications"]` | `Google Cloud, GCP, Certification, ...` |
| General Cloud | `["Cloud", "Technology"]` | based on specific tech covered |

---

## Placeholders for Missing Personal Details

When Tharun's raw voice input doesn't include a specific personal experience needed for a section, insert:

```
[THARUN: Add your personal experience here — what specifically happened to you with this?]
```

Or for specific data points:
```
[THARUN: Add your actual score/time/date here]
```

Never invent these details. Only use what was explicitly stated in the voice batches.

---

## Image Naming Convention

Images follow the pattern: `/images/[post-slug]-dp.png` or `/images/[post-slug].png`

For new posts, use `/images/[generated-slug].png` as a placeholder — Tharun will add the actual image before publishing.
