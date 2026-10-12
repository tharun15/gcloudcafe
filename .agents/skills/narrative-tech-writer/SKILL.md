---
name: narrative-tech-writer
description: >-
  World-class engineering storytelling and architectural case study writer. Crafts deeply immersive,
  humanized, beginner-accessible technical articles that trace real production problems, cross-functional
  engineering debates, low-level engine mechanics, and battle-tested cloud solutions.
---

# Narrative Technical Storytelling Skill

Use this skill whenever crafting, rewriting, or polishing engineering case studies, system architecture deep dives, or educational technical articles that trace how a scaling company solves production friction with cloud primitives.

---

## 🎯 The Core Philosophy: Story-Driven System Architecture

Great technical writing doesn't read like a dry API manual or a sanitized marketing whitepaper. It reads like an inside look into a real engineering organization navigating the messy reality of production scale.

Every architectural concept must emerge from **friction, necessity, and collaborative decision-making**:
1. **Never introduce a tool in a vacuum.** Introduce the operational pain or financial shock first.
2. **Bring the engineering team to life.** Real architectures are shaped by people with competing, legitimate priorities:
   - **Maya (Lead Data Architect):** Balances long-term governance, storage decoupling, cost predictability, and data contracts.
   - **Devin (Senior Data Engineer):** The hands-on pipeline builder wrestling with query execution plans, slot contention, late data, and 2:00 AM alerts.
   - **Sarah (Lead Product / Business Analyst):** Wants instant answers, real-time merchant metrics, and simple SQL without waiting 45 seconds per dashboard tile.
   - **Marcus (VP of Finance / CFO):** Watches cloud burn rates, questions billing spikes, and demands cost transparency down to the dollar.
   - **Elena (CISO / Security & Compliance Officer):** Protects customer PII and enforces zero-trust data access policies for external partners.
3. **Connect Intuition to Low-Level Engine Mechanics.** Bridge simple physical analogies (drawers, book displays, save states) to the exact database internals (Capacitor columnar blocks, Colossus storage, Jupiter network, Dremel query engine, min/max metadata pruning).

---

## 🏛️ The 7-Step Narrative Section Architecture

For every core building block or architectural milestone in the story, follow this cohesive 7-step arc:

```
[1. THE OPERATIONAL CATALYST]  ──▶ The concrete symptom (dashboard timeout, $17,900 billing surge, 2:15 AM overwrite).
[2. THE CROSS-FUNCTIONAL TENSION] ──▶ The debate: Analyst vs Engineer vs Finance vs Architect.
[3. THE PLAIN-ENGLISH ANALOGY] ──▶ An intuitive, real-world physical mental model.
[4. THE UNDER-THE-HOOD MECHANICS] ──▶ Exact engine internals (how blocks, columns, or network requests behave).
[5. THE PRODUCTION IMPLEMENTATION] ──▶ Clean, copy-pasteable DDL/SQL with clear inline commentary.
[6. THE QUANTIFIABLE RESULT]   ──▶ Real before-and-after numbers (e.g. 2.84 TiB scanned ➔ 42 MB, $17.75 ➔ $0.0002).
[7. THE OPERATIONAL SAFETY RAIL] ──▶ Quotas, hard limits, and configuration guardrails (e.g., require_partition_filter).
```

---

## ✍️ Voice, Cadence, and Tone Guidelines

- **Calm, conversational authority:** Write like a veteran Staff Engineer explaining a system over coffee.
- **High cadence variance (Burstiness):**
  - Use short, punchy declarative statements to land key truths:
    > *The query wasn't wrong. The storage layout was.*
    > *BigQuery doesn't guess.*
    > *Speed was easy. Predictable cost was hard.*
  - Follow with rich, explanatory sentences breaking down the technical mechanism.
- **Relatable to beginners without sacrificing engineering depth:**
  - Avoid academic jargon without defining it immediately.
  - Frame concepts around *what happens to the data on disk and across the network*.
- **Absolute ban on AI buzzwords:**
  - Zero "delve into", "game-changer", "revolutionary", "seamlessly", "tapestry", "plethora", "in today's digital landscape".
  - Never proclaim "zero-fluff"—let the dense, practical substance speak for itself.

---

## 🎨 Hugo Goldmark HTML Safety Rules (Mandatory)

To prevent Hugo's markdown parser from rendering raw HTML inside dark code block frames:
1. **Zero Indentation:** Every HTML element (`<div>`, `<span>`, `<p>`, `<img>`) MUST start at column 0 (flush to the left margin). Never use 2 or 4 spaces of internal indentation.
2. **No Blank Lines:** Never insert empty lines inside a multi-line HTML block.
3. **Explicit Icon Dimensions:** Always apply `class="gcp-icon w-8 h-8 object-contain"` to small inline product logos to prevent CSS layout expansion.
