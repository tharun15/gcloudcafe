---
name: humanizer
description: >-
  Autonomous writing and editing skill that transforms robotic, repetitive, or formulaic AI-generated drafts
  into authentic, calm, practitioner-grade human writing. Enforces natural sentence cadence, burstiness,
  grounded production metrics, physical analogies, honest trade-offs, and an absolute ban on AI buzzwords and fluff.
---

# Humanizer Skill: Authentic Senior Practitioner Voice

Use this skill whenever asked to **humanize, de-robotize, polish, or rewrite** technical writing, blog posts, documentation, guides, or notes across any cloud, data, DevOps, software engineering, or system architecture topic.

---

## 🎯 The Core Philosophy: The Calm Senior Practitioner

Authentic technical writing sounds like a **seasoned Staff Engineer having a calm 1-on-1 whiteboard discussion with a colleague over good coffee**.

- **Pragmatic, not promotional:** Never hype or cheerlead technology. Software is a tool with specific trade-offs, limitations, and failure modes.
- **Battle-tested:** Rooted in what happens at 2:00 AM when queries spike, pipelines back up, or cloud billing alert thresholds get blown through.
- **Clear without dumbing down:** Explain the deepest storage, kernel, or cryptographic primitives simply, using relatable physical intuition rather than academic jargon.
- **Zero performance:** Never write like you are trying to impress an audience or sound like a marketing brochure. Focus entirely on transferring mental models cleanly.

---

## 🚫 The Absolute Ban List (AI Clichés & Promotional Fluff)

Never use these words, phrases, or rhetorical crutches under any circumstances:

| Banned AI Marker / Phrase | Why It Fails | What to Do Instead |
| :--- | :--- | :--- |
| **"zero-fluff" / "zero fluff"** | Pretentious self-congratulation. Writing should *be* direct without needing to proclaim it. | Delete entirely. Let the substance prove the value. |
| **"delve into" / "delving" / "let's dive into"** | The quintessential LLM opening cliché. | Cut immediately. Start directly with the problem, metric, or architecture. |
| **"in today's fast-paced world" / "in the realm of" / "landscape"** | Filler that says nothing. | Anchor to a specific system, version, or operational constraint. |
| **"game-changer" / "revolutionary" / "revolutionize"** | Marketing hype that immediately discredits engineering authority. | State the exact quantitative improvement (e.g., *cut query scan from 2.8 TiB to 42 MB*). |
| **"tapestry" / "plethora" / "myriad" / "beacon" / "testament"** | Melodramatic vocabulary never used in production postmortems. | Use plain words: *many, several, wide range, evidence, proof*. |
| **"seamlessly" / "effortlessly"** | Nothing in distributed systems is seamless. Network calls fail; configurations drift. | Acknowledge the mechanism: *automatically reconciles*, *delegates via API*. |
| **"harness the power of" / "supercharge" / "unleash"** | Vague corporate cheerleading. | State the concrete capability: *stream directly*, *index columns*, *cache hot aggregates*. |
| **"it is worth noting that" / "it is important to remember"** | Passive throat-clearing that dilutes the statement. | State the fact directly or use: *Notice that...*, *Watch out for...*. |
| **"in conclusion" / "at the end of the day" / "summary" wrap-ups** | Formulaic essay boilerplate. | Conclude with an architectural decision rubric, a checklist, or a clear next step. |
| **Fake rhetorical questions** (*"Have you ever wondered...?", "Ready to take your skills to the next level?"*) | Reads like a cheap sales pitch. | State the dilemma directly: *A query scans 3 TiB when you only asked for 10 rows. Why?* |

---

## 🌊 Sentence Rhythm & "Burstiness" Rules

AI models generate sentences of almost uniform length (typically 18–25 words), producing a rhythmic drone that instantly signals machine generation. Real humans write with **extreme variance in cadence and length**:

### 1. The Short-Punch Anchor
Use short sentences (2 to 7 words) to land points with impact.
> *The SQL is not the problem. Storage layout is.*
> *BigQuery doesn't know.*
> *Speed was not the bottleneck; cost was.*

### 2. The Explanatory Follow-Through
Follow a punchy anchor with a medium or longer sentence that unpacks the technical mechanics:
> *Because the table is not partitioned by `order_date`, BigQuery cannot jump directly to the rows for September 18. It must scan the referenced columns across the entire multi-terabyte dataset and then apply the filter after reading.*

### 3. Avoid Formulaic Triads
AI loves listing exactly three adjective-heavy items (*"scalable, robust, and efficient"*). Break this habit:
- Use two precise terms, or four, or a concrete metric.
- Say *“resilient against network timeouts”* rather than *“robust and fault-tolerant”*.

---

## 🏛️ Physical Analogies & Grounded Realism

Abstract cloud and distributed systems concepts become immediately human when translated into physical, everyday mechanics:

| Abstract Concept | Artificial / Robotic Explanation | Humanized Physical Analogy |
| :--- | :--- | :--- |
| **BigQuery Partitioning** | *"Partitioning organizes data into distinct storage segments based on a timestamp column."* | Like a filing cabinet with color-coded daily folders. When an auditor asks for September 18, you open one drawer and pull one folder instead of flipping through all 50,000 pages in the room. |
| **BigQuery Clustering** | *"Clustering sorts data within partitions based on specified column attributes."* | Inside each daily folder, arranging invoices alphabetically by store name. You don't have to scan the whole folder to find "Austin-01". |
| **Table Snapshots** | *"Snapshots provide point-in-time read-only references without data duplication."* | Like a video game save state. BigQuery freezes metadata pointers to the existing storage blocks. You only pay for new storage when the original table modifies or deletes rows. |
| **Authorized Views** | *"Authorized views permit schema-level privilege escalation to access underlying datasets."* | Like a bank teller window. The customer never walks into the vault. They talk to the teller, and the teller alone holds the key to fetch the cash. |
| **External Tables** | *"External tables query data directly from Cloud Storage without loading it into BigQuery native storage."* | Like reading a book directly through a glass display case with binoculars instead of checking it out to take home. Slower and costs compute each time, but requires no warehouse relocation. |

---

## 💰 Ground in Real Numbers & Failure Modes

Robotic writing speaks in abstractions (*"large datasets"*, *"significant expenses"*, *"latency degradation"*). 
Human writing **gives real numbers, real dollars, and realistic failure points**:

1. **Quote Real Quantities:**
   - Instead of: *"Queries on unpartitioned tables can be expensive."*
   - Write: *"A query scanning 2.84 TiB costs roughly $17.75 at standard on-demand pricing ($6.25/TiB). Put that behind an automated dashboard refreshing every 10 minutes, and it burns ~$17,900 a week before anyone notices."*
2. **Highlight Hard Limits & Gotchas:**
   - Mention the 10,000 partition ceiling in BigQuery before someone tries partitioning by hour for 3 years.
   - Mention that Clustering only prunes data if the filter query uses constants or literals, not dynamic subqueries.
   - Mention that External Tables do not benefit from BigQuery Capacitor columnar metadata caching.
3. **Acknowledge the Trade-Offs:**
   - Every architecture choice has a price. If a solution reduces query latency, state clearly what it costs in pipeline complexity, storage fees, or slot utilization.

---

## 🛠️ Step-by-Step Humanization Workflow

When rewriting or reviewing a piece of writing:

```
[1. PURGE]       ──▶ Delete all banned AI buzzwords, cheerleading, and throat-clearing.
[2. CADENCE]     ──▶ Break up robotic ~20-word sentences. Add 3-5 word punchy declarations.
[3. CONCRETIZE]  ──▶ Replace vague terms ("large", "fast") with actual numbers (TiB, ms, $).
[4. ANALOGIZE]   ──▶ Introduce an intuitive physical analogy if introducing a core primitive.
[5. TRADE-OFF]   ──▶ Insert the uncomfortable edge case, operational trap, or quota limit.
[6. READ ALOUD]  ──▶ If it sounds like a slide deck or corporate blog, rewrite with conversational warmth.
```

---

## 💬 Quick Triggers & Invocations

You can invoke this skill at any time with:
- `"/humanize"` or `"Humanize this draft"`
- `"Make this draft sound like an authentic engineer, not AI"`
- `"Apply the humanizer skill to [filepath]"`
- `"Check this section for robotic phrasing and rhythm"`
