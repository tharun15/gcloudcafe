---
name: voice-to-blog
description: Collects voice-dictated text batches from the user and converts them into a fully formatted GCloudCafe blog post (single or series) in Tharun's writing style. Triggers on phrases like "start a new voice post", "add batch", "new batch", "done processing", "stitch post", or "voice blog".
---

# Voice-to-Blog Skill

## Overview

This skill lets Tharun dictate blog content in spoken chunks (using Win+H or any dictation tool), accumulate those chunks across multiple messages, then stitch them into a fully formatted `.md` blog post (or multi-part series) in his exact writing style.

## Trigger Phrases

This skill activates on messages containing any of:
- "start a new voice post" / "start voice post"
- "new batch" / "add batch" / "next batch"
- "done" / "done processing" / "stitch post" / "finalise post"
- "voice blog"

---

## Workflow

### Phase 1 — Start

When the user says **"start a new voice post"**:

1. Ask two quick questions:
   - "What's the rough topic?" (e.g. "GKE networking", "CKA tips")
   - "Do you know if this will be a single post or a series, or let me decide after seeing all your batches?"
2. Create the staging file at: `content/english/blog/_voice_staging.md`
3. Write the header into the staging file (see format below)
4. Tell the user: "Ready! Paste your first batch whenever you're ready."

**Staging file header format:**
```
# VOICE STAGING — [TOPIC]
# Type: [single/series/TBD]
# Started: [datetime]
# Batches: 0

---
```

---

### Phase 2 — Accumulate Batches

When the user pastes a new batch of transcribed voice text:

1. Append the batch to `content/english/blog/_voice_staging.md` with a clear marker:
```
## BATCH [N] — [timestamp]
[raw transcribed text verbatim]

---
```
2. Increment the batch counter in the file header
3. Give a brief acknowledgement:
   - Extract the 2-3 key ideas you spotted in this batch
   - Tell user: "Batch [N] saved. Key ideas I spotted: [list]. Ready for the next batch, or say 'done' when finished."

Do NOT edit, clean up, or rephrase the raw text at this stage. Store it verbatim.

---

### Phase 3 — Stitch & Generate

When the user says **"done"** or **"stitch post"**:

1. Read the full staging file
2. Analyse all batches together:
   - How many distinct topics / angles are covered?
   - Is there a clear narrative arc or is it multi-part?
   - Estimate word count of the final post
3. **Decide: single post or series?**
   - If batches cover ONE cohesive story/topic → single post
   - If batches cover clearly distinct phases, tips, or chapters → series
   - If borderline, ask the user: "I see enough content for either a detailed single post or a 2-part series. Which do you prefer?"
4. Generate the post(s) using the style guide in `references/style-guide.md`
5. Save to `content/english/blog/[slug].md` (or multiple files if series)
6. **Delete** `content/english/blog/_voice_staging.md` (cleanup)
7. Report: what was created, the file path(s), word count, and any sections marked with [THARUN: ...] placeholders that need his personal touch

---

## Key Rules

- **Never fabricate personal details.** If a section needs Tharun's real story, personal score, specific date, or lived experience that wasn't in the batches — mark it clearly: `[THARUN: Add your personal experience here]`
- **Always follow the style guide** in `references/style-guide.md`
- **Preserve the raw voice energy.** Don't make it sound like AI wrote it. Keep the conversational directness.
- **Frontmatter must be complete.** Never leave title, date, author, categories, tags, or draft field empty.
- **New posts always start as `draft: true`** so Tharun can review before publishing.
- **Follow the branching rules** in `.agents/AGENTS.md`: content-only `.md` changes can go to main directly.
