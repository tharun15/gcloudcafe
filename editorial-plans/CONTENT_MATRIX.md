# Global Architecture Content Matrix & Series Backlog

Welcome to the **Architecture Content Engine**. This matrix tracks all active and planned architectural deep-dive series, standalone articles, and topic flywheels inspired by Martin Kleppmann (*DDIA*) and Alex Xu (*System Design Interview*).

---

## 🧭 Active Series & Roadmaps

| Series Title | Slug | Total Parts | Completed | Status | Plan File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Harness Engineering for AI Agents** | `agent-harness-engineering` | 3 Parts | 1/3 Drafted | `[💡 Planned]` | [SERIES_ROADMAP.md](agent-harness-engineering/SERIES_ROADMAP.md) |
| **Modern Storage Engines (LSM vs B-Tree)** | `storage-engines` | 5 Parts | 0/5 | `[💡 Planned]` | [SERIES_ROADMAP.md](storage-engines/SERIES_ROADMAP.md) |

---

## 💡 Evergreen + Trending Idea Incubator (The Content Flywheel)

Every time a series or post is brainstormed, spin-off ideas are captured here so we never run out of high-impact topics:

### From Harness Engineering Series:
- [ ] **eBPF for AI Agent Observability:** Tracing file descriptors, syscalls, and outbound network packets in untrusted sandboxes without modifying agent code.
- [ ] **Time-Travel Transcript Debugging:** Designing append-only, deterministic session logs that replay agent decision trees step-by-step.
- [ ] **Prompt Injection Containment at the L4/L7 Network Boundary:** Using proxy filters and egress firewalls to prevent data exfiltration.
- [ ] **Snapshot Restoration at Scale:** Benchmarking memory ballooning and page-cache sharing across 10,000 parallel Firecracker microVMs.
- [ ] **Model Context Protocol (MCP) Internals:** Architectural breakdown of JSON-RPC over stdio vs SSE, security isolation gaps, and state management.

### General Systems Architecture:
- [ ] **Distributed Consensus Under Network Partitions:** Split-brain mechanics, leader leases, and Raft log replication.
- [ ] **The Dual-Write Trap:** Why microservices fail without the Transactional Outbox pattern and WAL tails.
- [ ] **Vector Indexing Internals:** How HNSW graphs and inverted file indexes (IVF) navigate high-dimensional space without memory exhaustion.
- [ ] **Cache Topologies & Consistency:** Write-Through vs Write-Behind vs Cache-Aside under race conditions.
- [ ] **TrueTime & Spanner:** How physical atomic clocks and GPS receivers solve serializability across continents.
