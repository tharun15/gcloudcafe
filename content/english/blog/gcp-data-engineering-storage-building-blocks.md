---
title: "Data Engineering on GCP (Part 1): The Core Storage & Access Building Blocks Demystified"
meta_title: "GCP Data Engineering: Storage Primitives, Tables & Authorized Views"
description: "A beginner-friendly, practitioner-grade guide to Google Cloud data storage: Understand external tables, partitioning, clustering, time-series, materialized views, table snapshots, and authorized views through the evolution of a production pipeline."
date: 2026-09-19
image: "/images/gcp-storage-building-blocks.jpg"
categories: ["Google Cloud", "Architecture"]
tags: ["Data Engineering", "GCP", "BigQuery", "Cloud Storage", "SQL", "Architecture", "Database Internals"]
author: tharun-vempati
featured: false
draft: true
series: "Data Engineering on Google Cloud"
series_order: 1
---

A data analyst opens the Google BigQuery console and runs a query that looks completely harmless:

```sql
SELECT user_id, order_total 
FROM `company_production.orders` 
WHERE order_date = '2026-09-18';
```

The goal is simple: pull yesterday's orders.

Before clicking **Run**, the query validator indicates: **2.84 TiB to be scanned**.

At standard on-demand pricing ($6.25 per TiB), executing that single query costs roughly **$17.75**. If that query powers an automated dashboard refreshing every ten minutes, it will run 1,008 times in a single week—accumulating nearly **$17,900 on your cloud invoice every seven days**.

The SQL syntax is fine. The table design is the problem.

Because the underlying table was created without a date boundary, BigQuery cannot jump directly to the rows for September 18. It is forced to scan every column referenced across the entire multi-year dataset, only applying the filter after reading terabytes of data from disk. 

The query asked for a single day, but the physical storage layout gave BigQuery no mechanism to isolate it.

This is why table and storage design comes first. Before writing streaming pipelines, designing Medallion architectures, or scheduling Airflow workflows, you need to understand the physical building blocks that govern performance, cost, and access control.

In this guide, we will step through how a production data platform evolves from a simple storage bucket to an enterprise analytical warehouse, introducing seven essential building blocks as real-world challenges demand them.

---

## The Journey: How Storage Requirements Evolve

As a company grows, its data pipeline goes through predictable scaling milestones:

```
1. Ingestion: Raw files land in Cloud Storage     ──▶ External Tables
2. Performance: Faster repeated queries needed     ──▶ Managed Tables (Capacitor)
3. Cost Control: Queries scan too many years       ──▶ Partitioning
4. Granular Search: High-cardinality lookups       ──▶ Clustering
5. Data Integrity: Sensor lags & late arrivals    ──▶ Time-Series Modeling
6. Concurrency: Hundreds of dashboard refreshes    ──▶ Materialized Views
7. Disaster Recovery: Accidental updates/deletes   ──▶ Time Travel & Snapshots
8. Governance: Sharing data without leaking PII    ──▶ Authorized Views
```

---

## 1. Querying Data Where It Lands: External Tables

When an application starts writing data, events typically land as raw files inside **Google Cloud Storage (GCS)**:

`gs://production-lake/orders/2026/09/18/orders.parquet`

The data team needs immediate visibility. Building formal ingestion pipelines, writing schema transformations, and loading data into a database takes time. You need to inspect these raw files immediately using standard SQL.

### What is an External Table?
An **External Table** is a BigQuery table definition that points directly to files stored outside BigQuery in Cloud Storage, Google Drive, or Bigtable. BigQuery stores only the schema definition and the file path. The actual data never leaves your Cloud Storage bucket.

> **💡 In Plain English:** Like reading a book inside a glass museum display case using binoculars. You can inspect the contents without checking the book out or moving it to your desk.

<div class="my-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-5">
  <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
        <img src="/images/icons/cloud-storage.png" alt="Cloud Storage" class="w-8 h-8 object-contain">
      </div>
      <div>
        <h4 class="text-base font-bold text-slate-900 dark:text-slate-100 m-0">External Tables (Data Lake Tier)</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 m-0">Querying raw files directly in Cloud Storage without loading</p>
      </div>
    </div>
    <span class="text-xs px-3 py-1 rounded-full bg-amber-600 text-white font-semibold">Data Lives in GCS</span>
  </div>

  <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
    <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
      <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-amber-600">1</span>
      <span>Analyst runs query: <code>SELECT * FROM company_lake.orders_external</code></span>
    </div>
    <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
      <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-amber-600">2</span>
      <span>BigQuery fetches schema definition and reads files across the network from GCS.</span>
    </div>
    <div class="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
      <span class="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 font-mono font-bold">3</span>
      <span>Data is parsed during query execution ➔ <strong>Zero loading delay, but slower network scan</strong></span>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
    <div class="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
      <strong class="text-emerald-800 dark:text-emerald-300 block mb-1">When to Use:</strong>
      <p class="text-slate-600 dark:text-slate-400 m-0 leading-relaxed">Ad-hoc lake exploration, staging tables prior to transformation, and cold historical archives queried infrequently.</p>
    </div>
    <div class="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
      <strong class="text-red-800 dark:text-red-300 block mb-1">Key Trade-Off:</strong>
      <p class="text-slate-600 dark:text-slate-400 m-0 leading-relaxed">Network latency on every query. Does not benefit from BigQuery internal metadata caching or clustering optimizations.</p>
    </div>
  </div>
</div>

---

## 2. Moving into the Warehouse: Native Managed Tables

As query volume grows from five queries a day to thousands, external tables become a bottleneck. Reading files over the network repeatedly is slow and burns compute capacity.

You need sub-second query performance and database-level optimization.

### What is a Managed Table?
A **Managed Table** is the standard, native table type in BigQuery. When you load data into a managed table, BigQuery takes ownership of the physical storage. It reorganizes rows into Google's proprietary columnar format (**Capacitor**), applies compression algorithms, and generates column-level metadata.

> **💡 In Plain English:** Moving food from a remote warehouse across town into your home kitchen refrigerator. You pay a small storage fee to keep it there, but accessing it is instantaneous.

<div class="my-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-5">
  <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
        <img src="/images/icons/bigquery.png" alt="BigQuery" class="w-8 h-8 object-contain">
      </div>
      <div>
        <h4 class="text-base font-bold text-slate-900 dark:text-slate-100 m-0">Native Managed Tables (Warehouse Tier)</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 m-0">Colossus-backed columnar storage with automated metadata optimization</p>
      </div>
    </div>
    <span class="text-xs px-3 py-1 rounded-full bg-blue-600 text-white font-semibold">Data Lives Inside BigQuery</span>
  </div>

  <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
    <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
      <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-blue-600">1</span>
      <span>Analyst queries table ➔ BigQuery checks local NVMe metadata cache.</span>
    </div>
    <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
      <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-blue-600">2</span>
      <span>Columnar engine reads <strong>only the columns requested</strong> from disk, skipping unused fields.</span>
    </div>
    <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
      <span class="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 font-mono font-bold">3</span>
      <span>Delivered via high-throughput local bus ➔ <strong>⚡ Sub-second response time</strong></span>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
    <div class="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
      <strong class="text-emerald-800 dark:text-emerald-300 block mb-1">When to Use:</strong>
      <p class="text-slate-600 dark:text-slate-400 m-0 leading-relaxed">Production dashboards, reporting data marts, and any dataset queried frequently by analysts or BI tools.</p>
    </div>
    <div class="p-3.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <strong class="text-slate-800 dark:text-slate-200 block mb-1">Storage Cost Model:</strong>
      <p class="text-slate-600 dark:text-slate-400 m-0 leading-relaxed">Active storage is $0.020 per GB. If a table or partition is not modified for 90 days, the price drops automatically by 50% to $0.010 per GB (long-term storage).</p>
    </div>
  </div>
</div>

---

## 3. Controlling Costs on Large Tables: Partitioning

Your managed `orders` table now holds three years of historical data totaling **2.84 TiB**. 

An analyst runs:

```sql
SELECT order_id, order_total 
FROM `company_warehouse.orders` 
WHERE order_date = '2026-09-18';
```

Even though the query asks for one day, BigQuery scans **all 2.84 TiB**. Why? Because the table has no physical boundaries. BigQuery has to read the entire table from start to finish to ensure no rows matching `2026-09-18` are missed.

### What is Partitioning?
**Partitioning** divides a large table into smaller physical segments based on a date, timestamp, ingestion time, or integer range. When you filter by the partitioning column, BigQuery opens only the matching segments and skips everything else. This process is called **partition pruning**.

> **💡 In Plain English:** A filing cabinet with dedicated daily drawers. When someone asks for September 18 receipts, you open only the drawer labeled "Sep 18, 2026" and leave the other 1,000 drawers closed.

<div class="my-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-4">
  <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">
    📁 Partition Pruning: How Date Boundaries Reduce Scans
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
    <div class="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
      <span class="text-slate-400 block font-bold">2026-09-16</span>
      <span class="text-red-600 dark:text-red-400 font-semibold block mt-1">Pruned (Skipped)</span>
      <span class="text-slate-500 text-[11px]">0 bytes read</span>
    </div>
    <div class="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500 text-center">
      <span class="text-blue-900 dark:text-blue-200 block font-bold">2026-09-18 (Target)</span>
      <span class="text-blue-600 dark:text-blue-400 font-semibold block mt-1">Matched & Read</span>
      <span class="text-blue-700 dark:text-blue-300 font-bold text-[11px]">Reads 2.8 GiB (~$0.017)</span>
    </div>
    <div class="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
      <span class="text-slate-400 block font-bold">2026-09-20</span>
      <span class="text-red-600 dark:text-red-400 font-semibold block mt-1">Pruned (Skipped)</span>
      <span class="text-slate-500 text-[11px]">0 bytes read</span>
    </div>
  </div>

  <div class="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs space-y-1">
    <strong class="text-amber-800 dark:text-amber-300">Production Safety Rail:</strong>
    <p class="text-slate-600 dark:text-slate-400 m-0">Always add <code>OPTIONS(require_partition_filter = true)</code> to large production tables. If an analyst forgets to include a date filter in their SQL, BigQuery rejects the query immediately instead of scanning petabytes of data.</p>
  </div>
</div>

---

## 4. Fine-Grained Search: Clustering

Partitioning solved your daily scan problem. Your query now reads only **2.8 GiB** per run instead of 2.84 TiB.

Then your team builds a customer portal. A client with ID `CUST-402` logs in to view their orders for the last 30 days:

```sql
SELECT order_id, order_total, status 
FROM `company_warehouse.orders_partitioned` 
WHERE order_date BETWEEN '2026-08-20' AND '2026-09-18'
  AND customer_id = 'CUST-402';
```

Partitioning limits the query to the 30 daily drawers (~84 GiB). But `CUST-402` has only **50 orders out of 200 million rows** in that window. 

BigQuery still reads all 84 GiB because, inside each daily drawer, rows were written in random order. BigQuery has to inspect every block to ensure no rows for `CUST-402` are missed.

### What is Clustering?
**Clustering** physically sorts the data blocks **inside each partition** based on one or more columns (e.g., `customer_id, status`). BigQuery maintains lightweight min/max metadata for each block. When your query filters for `CUST-402`, BigQuery checks the block metadata, identifies which blocks cannot possibly contain that customer, and skips them entirely.

> **💡 In Plain English:** Inside each daily drawer, organizing invoices alphabetically by customer name. To find "Customer 402", you flip directly to the "C" section and ignore all other folders.

<div class="my-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-4">
  <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">
    🎯 The 2-Level Pruning Pipeline: How 2.84 TiB Becomes 42 MB
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
    <div class="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-1">
      <div class="font-bold text-blue-700 dark:text-blue-300">Level 1: Partition Pruning (Order Date)</div>
      <p class="text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
        Removes 99% of historical dates. Isolates the search to the requested 30-day drawers (shrinks 2.84 TiB down to 84 GiB).
      </p>
    </div>

    <div class="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-1">
      <div class="font-bold text-emerald-700 dark:text-emerald-300">Level 2: Clustering Pruning (Customer ID)</div>
      <p class="text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
        Inside those 30 drawers, reads only the blocks whose min/max range contains <code>CUST-402</code>. <strong>Shrinks scan from 84 GiB down to ~42 MB.</strong>
      </p>
    </div>
  </div>

  <p class="text-xs text-slate-500 dark:text-slate-400 m-0">
    <strong>Ordering Rule:</strong> You can cluster by up to four columns. Specify them in order of priority (e.g., <code>CLUSTER BY customer_id, status</code>). Queries filtering on <code>customer_id</code> benefit fully; queries filtering only on <code>status</code> receive less pruning.
  </p>
</div>

---

## 5. Handling Real-World Time: Time-Series Data Modeling

Your business expands into international retail and IoT warehouse tracking. 

Soon, a strange issue appears: financial totals for September 18 keep changing on September 19, and change again on September 22.

Why? Devices in offline retail warehouses sync hours or days after transactions happen. A purchase completed at 11:58 PM on September 18 in Tokyo arrives at your cloud pipeline at 3:15 AM UTC on September 19.

If your pipeline partitions by **ingestion time** (when BigQuery received the packet), that purchase is filed under September 19. Historical reports for September 18 become inaccurate.

### What is Time-Series Modeling?
Time-series modeling is an architectural pattern that separates two concepts of time:
1. **Event Timestamp (`event_time`):** When the event occurred in the physical world.
2. **Ingestion Timestamp (`ingested_at`):** When BigQuery inserted the record into storage.

> **💡 In Plain English:** A flight recorder black box. It records both the exact second an engine alarm sounded at 35,000 feet (event time) and the second the data was downloaded onto a ground computer (ingestion time).

<div class="my-6 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
  <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">
    ⏱️ The Dual-Timestamp Rule for Reliable Pipelines
  </div>
  <ul class="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-disc list-inside m-0">
    <li><strong>For Business Reporting:</strong> Always filter and group by <code>event_time</code>. This ensures financial metrics reflect when sales actually took place, regardless of network delays.</li>
    <li><strong>For Incremental ETL Workflows:</strong> Always pull new records using <code>WHERE ingested_at > LAST_PROCESSED_WATERMARK</code>. This guarantees late-arriving events are never missed by scheduled transformations.</li>
  </ul>
</div>

---

## 6. High-Frequency Dashboard Queries: Materialized Views

Company executives open their BI dashboards every Monday morning. 150 regional leaders refresh the exact same regional revenue summary:

```sql
SELECT 
  region,
  DATE_TRUNC(order_date, MONTH) AS sales_month,
  SUM(order_total) AS total_revenue
FROM `company_warehouse.orders_clustered`
GROUP BY 1, 2;
```

Even though the table is partitioned and clustered, this query aggregates **every single row across all regions and dates**.

150 concurrent users running this aggregation exhausts your query slot capacity. Queries queue up, dashboards become unresponsive, and cloud costs escalate.

You could schedule an hourly batch job to pre-aggregate the data into a static table. But then data is stale by up to an hour, and an engineer has to maintain the ETL pipeline.

### What is a Materialized View?
A **Materialized View** precomputes and stores the results of an aggregation query. Unlike standard views (which execute the query every time they are called), a Materialized View caches the result. 

BigQuery provides two critical capabilities with Materialized Views:
1. **Smart Tuning (Automatic Query Rewrite):** Analysts do not need to rewrite their SQL. When an analyst queries the base table, BigQuery's optimizer detects the matching Materialized View and **transparently routes the query to the cached summary**.
2. **Freshness Guarantee with Delta Reader:** If new rows were loaded into the base table three seconds ago, BigQuery reads the pre-aggregated summary from the view and unions it with **only the new, un-materialized rows** from the base table.

> **💡 In Plain English:** Preparing a summary cheat-sheet before a meeting. If one last receipt arrives five minutes before the presentation, you add that single number to the total instead of recalculating 100,000 receipts from scratch.

<div class="my-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-5">
  <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
        <img src="/images/icons/bigquery.png" alt="BigQuery" class="w-8 h-8 object-contain">
      </div>
      <div>
        <h4 class="text-base font-bold text-slate-900 dark:text-slate-100 m-0">Materialized Views: Transparent Smart Tuning</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 m-0">Accelerating repeated aggregations without changing user queries</p>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
    <div class="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
      <div class="flex items-center justify-between">
        <strong class="text-emerald-800 dark:text-emerald-300 text-sm">⚡ With Materialized View</strong>
        <span class="px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold">Sub-Second</span>
      </div>
      <p class="text-slate-600 dark:text-slate-400 m-0">
        Optimizer intercepts query on the base table. Reads precomputed aggregates + tiny delta. <strong>Scans 0 bytes of raw historical rows.</strong>
      </p>
    </div>

    <div class="p-4 rounded-xl border-2 border-red-500/30 bg-red-50/30 dark:bg-red-950/20 space-y-2">
      <div class="flex items-center justify-between">
        <strong class="text-red-800 dark:text-red-200 text-sm">⚠️ Without Materialized View</strong>
        <span class="px-2 py-0.5 rounded bg-red-600 text-white font-semibold">High Scan</span>
      </div>
      <p class="text-slate-600 dark:text-slate-400 m-0">
        Recalculates millions of rows from scratch on every dashboard refresh. Burns compute slots and queues up concurrent queries.
      </p>
    </div>
  </div>
</div>

---

## 7. Disaster Recovery & Safety Nets: Time Travel and Snapshots

It is 2:15 AM on a Sunday. An engineer runs an operational backfill script. A misplaced `WHERE` clause turns a targeted update into an accidental full-table overwrite:

```sql
UPDATE `company_warehouse.orders_clustered` 
SET status = 'CANCELLED' 
WHERE 1 = 1;
```

Production tables now report all historical orders as cancelled.

### Time Travel: Short-Term Operational Recovery
BigQuery automatically tracks historical changes for all managed tables within a rolling window (default **7 days**). You do not need to restore from external backup media. You query the table as it existed thirty minutes ago:

```sql
CREATE OR REPLACE TABLE `company_warehouse.orders_recovered` AS
SELECT * 
FROM `company_warehouse.orders_clustered`
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 MINUTE);
```

Within two minutes, your data is restored to its exact pre-incident state.

### Table Snapshots: Long-Term Point-in-Time Protection
Time travel expires after seven days. If your team is preparing for a major multi-week database migration or schema refactor, you need a named recovery point that lasts longer.

You create a **Table Snapshot**:

```sql
CREATE SNAPSHOT TABLE `company_warehouse.orders_snapshot_pre_migration`
CLONE `company_warehouse.orders_clustered`;
```

> **💡 In Plain English:** Time travel is rewinding a video 30 seconds to catch what someone said. A Table Snapshot is creating a dedicated save point in a video game before entering a major mission.

<div class="my-6 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
  <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">
    📸 The Zero-Copy Cost Model of Table Snapshots
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
    <div class="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
      <strong class="text-emerald-800 dark:text-emerald-300 block mb-1">Day 1: Snapshot Created ($0 Extra Cost)</strong>
      <p class="text-slate-600 dark:text-slate-400 m-0">BigQuery freezes pointers to existing storage blocks. Zero duplicate data is written. <strong>You pay $0 in additional storage fees.</strong></p>
    </div>
    <div class="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
      <strong class="text-blue-800 dark:text-blue-300 block mb-1">Day 14: Base Table Changes (Delta Billed)</strong>
      <p class="text-slate-600 dark:text-slate-400 m-0">When the base table modifies rows, BigQuery writes new blocks while keeping the old blocks for the snapshot. You are billed only for the diverging delta blocks.</p>
    </div>
  </div>
</div>

---

## 8. Governance & Zero-Trust Access: Authorized Views

An external auditing firm needs to inspect monthly revenue figures by region for the past 36 months. 

You cannot grant them read access to your raw orders table. That table contains customer credit card numbers, billing addresses, and profit margins.

In standard database configurations, if you create a view with `SELECT region, SUM(amount)...` and grant an external user read access to that view, **the query will fail with `403 Access Denied`** unless the user also has read permissions on the raw underlying table. But granting access to the raw table exposes all sensitive PII.

### What is an Authorized View?
An **Authorized View** allows you to share query results with specific users or groups without giving them access to the underlying source tables. 

You authorize the view inside the restricted dataset's access controls. BigQuery grants the *view itself* permission to query the restricted tables with delegated authority.

> **💡 In Plain English:** The bank teller window. You cannot walk into the bank vault to count money. You talk to the teller (the Authorized View), who steps into the vault, retrieves only the permitted funds, and hands them to you. The vault remains locked.

<div class="my-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-5">
  <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
        <img src="/images/icons/iam.png" alt="IAM" class="w-8 h-8 object-contain">
      </div>
      <div>
        <h4 class="text-base font-bold text-slate-900 dark:text-slate-100 m-0">Authorized Views: Delegated Access Control</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 m-0">Sharing aggregated insights without exposing underlying sensitive rows</p>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
    <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
      <strong class="text-slate-800 dark:text-slate-200 block text-sm">1. External User</strong>
      <p class="text-slate-600 dark:text-slate-400 m-0">Granted <code>bigquery.dataViewer</code> <strong>only</strong> on the reporting dataset.</p>
      <div class="p-2 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-semibold text-[11px]">
        🚫 Zero access to raw finance data
      </div>
    </div>

    <div class="p-4 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/30 border-2 border-indigo-500/40 space-y-2">
      <strong class="text-indigo-900 dark:text-indigo-200 block text-sm">2. Authorized View</strong>
      <p class="text-slate-600 dark:text-slate-400 m-0 font-mono text-[11px]">
        SELECT region, SUM(amount)<br>FROM finance_restricted.orders<br>GROUP BY region;
      </p>
      <div class="p-2 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-semibold text-[11px]">
        ✔ Authorized in source ACL
      </div>
    </div>

    <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
      <strong class="text-slate-800 dark:text-slate-200 block text-sm">3. Restricted Vault</strong>
      <p class="text-slate-600 dark:text-slate-400 m-0">Contains raw customer PII, credit card hashes, and sensitive financial records.</p>
      <div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
        🔒 Vault remains locked
      </div>
    </div>
  </div>
</div>

---

## The Complete Storage Blueprint

Now that you have seen why each building block exists, here is how they connect in a complete Google Cloud enterprise data platform:

<div class="my-8 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-6">
  <div class="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
    <div class="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
      <img src="/images/icons/bigquery.png" alt="BigQuery" class="w-8 h-8 object-contain">
    </div>
    <div>
      <h4 class="text-base font-bold text-slate-900 dark:text-slate-100 m-0">The GCP Lakehouse Storage Architecture Blueprint</h4>
      <p class="text-xs text-slate-500 dark:text-slate-400 m-0">How raw files move from object storage into high-performance, governed analytical views</p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
    <!-- Tier 1 -->
    <div class="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-2">
      <div class="flex items-center gap-2">
        <img src="/images/icons/cloud-storage.png" alt="GCS" class="w-6 h-6 object-contain">
        <strong class="text-amber-900 dark:text-amber-200 text-sm">1. Data Lake Tier</strong>
      </div>
      <p class="text-slate-600 dark:text-slate-400 m-0">
        Raw files land in Google Cloud Storage. <strong>External Tables</strong> provide immediate, low-cost SQL inspection without ingestion delays.
      </p>
    </div>

    <!-- Tier 2 -->
    <div class="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-2">
      <div class="flex items-center gap-2">
        <img src="/images/icons/bigquery.png" alt="BigQuery" class="w-6 h-6 object-contain">
        <strong class="text-blue-900 dark:text-blue-200 text-sm">2. Warehouse Tier</strong>
      </div>
      <p class="text-slate-600 dark:text-slate-400 m-0">
        High-throughput tables stored in native <strong>Managed Storage</strong>. Partitioning prunes date boundaries; clustering sorts records inside partitions.
      </p>
    </div>

    <!-- Tier 3 -->
    <div class="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 space-y-2">
      <div class="flex items-center gap-2">
        <img src="/images/icons/iam.png" alt="IAM" class="w-6 h-6 object-contain">
        <strong class="text-indigo-900 dark:text-indigo-200 text-sm">3. Acceleration & Governance</strong>
      </div>
      <p class="text-slate-600 dark:text-slate-400 m-0">
        <strong>Materialized Views</strong> accelerate repeated dashboard queries. <strong>Table Snapshots</strong> protect state. <strong>Authorized Views</strong> secure sensitive PII.
      </p>
    </div>
  </div>
</div>

---

## Architectural Decision Framework

Use this practical decision matrix when designing your next dataset:

| Production Goal | Building Block | Primary Benefit |
| :--- | :--- | :--- |
| Inspecting raw files in GCS without loading | **External Table** | Zero ingestion time and zero duplicate storage fees. |
| Production analytical tables queried repeatedly | **Native Managed Table** | Sub-second columnar performance, compression, and slot efficiency. |
| Queries consistently filter on dates or timestamps | **Partitioned Table** | Skips 99% of bytes by reading only the matching date drawer. |
| Frequent filters on high-cardinality keys (`customer_id`) | **Clustered Table** | Prunes non-matching storage blocks using sorted min/max metadata. |
| Sensor data or mobile apps with late sync delays | **Dual-Timestamp Modeling** | Preserves historical business truth while managing ETL watermarks. |
| Heavy dashboard traffic running identical aggregations | **Materialized View** | Transparent query auto-rewrite with sub-second delta merges. |
| Major schema migration or pipeline refactor | **Table Snapshot** | Zero-copy point-in-time backup with $0 extra storage cost on Day 1. |
| Sharing aggregated metrics without exposing PII | **Authorized View** | Grants access to view queries with zero read permissions on raw tables. |

---

## What's Next in the Series?

In this first part, we focused on building clear mental models, physical storage boundaries, and architecture decisions.

In **Part 1.1 (Hands-On Implementation Lab)**, we will open Google Cloud Shell and build this entire lakehouse architecture from scratch:
- Deploying Cloud Storage buckets and defining BigLake external tables.
- Creating partitioned and clustered tables with `require_partition_filter` constraints.
- Building live Materialized Views and validating query execution plans in the console.
- Configuring cross-dataset Authorized Views with least-privilege IAM permissions.

Stay tuned, and design your tables with physical boundaries in mind!
