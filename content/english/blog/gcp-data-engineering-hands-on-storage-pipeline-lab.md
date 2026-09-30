---
title: "Data Engineering on GCP: Building the Production Storage & Access Layer (Hands-On Lab)"
meta_title: "GCP Data Engineering Lab: Cloud Storage to Partitioned BigQuery"
description: "A practical, end-to-end GCP data engineering lab covering Cloud Storage, BigLake external connections, partitioned and clustered BigQuery, materialized views, Time Travel, and authorized views."
date: 2026-09-30
image: "/images/gcp-storage-pipeline-lab.jpg"
categories: ["Google Cloud", "Architecture"]
tags: ["Data Engineering", "GCP", "BigQuery", "Cloud Storage", "SQL", "Hands-On Lab", "TravelTech"]
author: tharun-vempati
featured: true
draft: false
series: "Data Engineering on Google Cloud"
series_order: 2
series_description: "A practical architecture and hands-on guide to Google Cloud data engineering: Cloud Storage landing, BigLake external connections, partitioned and clustered BigQuery tables, dual-timestamp watermarks, materialized views, Time Travel recovery, and authorized views."
series_image: "/images/series-images/gcp-data-engineering-series-poster.jpg"
---

# Data Engineering on GCP: Building the Production Storage & Access Layer (Hands-On Lab)

In [Part 1 of this series](/blog/gcp-data-engineering-storage-building-blocks/), we mapped the architectural evolution of **Offvia**, a regional flight booking engine that rapidly outgrew its transactional database. We analyzed why modern cloud analytics requires distinct storage primitives: from raw landing in Cloud Storage to columnar pruning in BigQuery, automatic aggregation in Materialized Views, and cryptographic isolation in Authorized Views.

Now it is time to build it.

Architecture diagrams are useful, but they hide the operational details that usually matter most at 3:00 AM in production. The real engineering work starts when you have to write the DDL, choose partition boundaries, handle late-arriving events across timezone offsets, recover from an accidental production `UPDATE`, or expose useful metrics to auditors without leaking a single byte of passenger data.

In this lab, we will build Offvia's storage and access layer from scratch using the Google Cloud CLI (`gcloud`), the `bq` CLI, BigQuery SQL, and Python. The goal is not just to create resources, but to understand why each design choice matters and what happens when things go sideways.

<div class="my-6 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-950 dark:text-blue-200">

<strong>Lab Environment & Prerequisites:</strong> All commands in this guide use standard Google Cloud tools: <code>gcloud</code> CLI (v480.0+), <code>bq</code> CLI, Python 3.10+, and standard BigQuery SQL. Ensure you have <code>roles/bigquery.admin</code> and <code>roles/storage.admin</code> IAM roles assigned. Replace <code>offvia-prod-data</code> with your target project ID. Note that materialized view rewrites and enterprise features assume either BigQuery Enterprise/Enterprise Plus editions or standard On-Demand pricing.

</div>

---

<div class="my-7 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50">

<div class="border-b border-slate-200 px-5 py-3 dark:border-slate-800">

<div class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lab Execution Roadmap</div>

<div class="mt-1 font-bold text-slate-900 dark:text-slate-100">7 Production Steps to an Audited, Scalable GCP Storage & Access Layer</div>

</div>

<div class="p-5 text-xs text-slate-600 dark:text-slate-400 space-y-3">

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

<div class="rounded-xl border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-900 dark:bg-sky-950/20">
<span class="font-bold text-sky-900 dark:text-sky-200 block mb-1">Step 1: Raw Landing</span>
<strong class="text-slate-900 dark:text-slate-100 block">Cloud Storage Lake</strong>
<span class="text-[11px] text-slate-500 dark:text-slate-400">Dual-region bucket creation and Hive-partitioned Parquet booking ingestion.</span>
</div>

<div class="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/20">
<span class="font-bold text-amber-900 dark:text-amber-200 block mb-1">Step 2: Exploration</span>
<strong class="text-slate-900 dark:text-slate-100 block">BigLake Connection</strong>
<span class="text-[11px] text-slate-500 dark:text-slate-400">Secure zero-copy SQL discovery over GCS files with execution profile analysis.</span>
</div>

<div class="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
<span class="font-bold text-emerald-900 dark:text-emerald-200 block mb-1">Step 3: Core Analytical DDL</span>
<strong class="text-slate-900 dark:text-slate-100 block">Partitioned & Clustered Table</strong>
<span class="text-[11px] text-slate-500 dark:text-slate-400">Capacitor columnar storage with strict <code>require_partition_filter</code> enforcement.</span>
</div>

<div class="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-900 dark:bg-indigo-950/20">
<span class="font-bold text-indigo-900 dark:text-indigo-200 block mb-1">Step 4: Stream Watermarks</span>
<strong class="text-slate-900 dark:text-slate-100 block">Late-Arriving Reconciliation</strong>
<span class="text-[11px] text-slate-500 dark:text-slate-400">Dual-timestamp contract and partition-scoped idempotent MERGE mutations.</span>
</div>

<div class="rounded-xl border border-purple-200 bg-purple-50/60 p-3 dark:border-purple-900 dark:bg-purple-950/20">
<span class="font-bold text-purple-900 dark:text-purple-200 block mb-1">Step 5: High-Concurrency</span>
<strong class="text-slate-900 dark:text-slate-100 block">Materialized Views</strong>
<span class="text-[11px] text-slate-500 dark:text-slate-400">Precomputed aggregations with automatic cost-based optimizer query rewriting.</span>
</div>

<div class="rounded-xl border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900 dark:bg-rose-950/20">
<span class="font-bold text-rose-900 dark:text-rose-200 block mb-1">Step 6: Disaster Recovery</span>
<strong class="text-slate-900 dark:text-slate-100 block">Time Travel Runbook</strong>
<span class="text-[11px] text-slate-500 dark:text-slate-400">Simulating a catastrophic accidental UPDATE and executing point-in-time restore.</span>
</div>

<div class="rounded-xl border border-teal-200 bg-teal-50/60 p-3 dark:border-teal-900 dark:bg-teal-950/20">
<span class="font-bold text-teal-900 dark:text-teal-200 block mb-1">Step 7: Privacy & Trust</span>
<strong class="text-slate-900 dark:text-slate-100 block">Authorized Views</strong>
<span class="text-[11px] text-slate-500 dark:text-slate-400">Cross-dataset delegation exposing audited flight metrics without leaking customer PII.</span>
</div>

</div>

</div>

</div>

---

## 5 Common GCP Data Engineering Misconceptions

Before we run anything, let us clear up five common misconceptions that frequently lead to unexpected query costs, poor performance, or audit failures.

<div class="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">

<div class="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
<div class="flex items-center gap-2 font-bold text-red-700 dark:text-red-400 text-sm mb-1">
<span>❌</span> Misconception 1: Parquet on GCS Matches BigQuery Performance
</div>
<p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
<strong>The Myth:</strong> "If we store our booking data in Apache Parquet on Cloud Storage, external table queries will perform just like native BigQuery tables."<br>
<strong>The Reality:</strong> External queries must make remote HTTP calls to Cloud Storage, list object metadata, and read files over the network without native Capacitor compression, block-level min/max dictionary pruning, or Colossus direct NVMe bus throughput.
</p>
</div>

<div class="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
<div class="flex items-center gap-2 font-bold text-red-700 dark:text-red-400 text-sm mb-1">
<span>❌</span> Misconception 2: Clustering Eliminates the Need for Partitioning
</div>
<p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
<strong>The Myth:</strong> "Just cluster by booking date and carrier code; clustering is more flexible than strict partitioning."<br>
<strong>The Reality:</strong> Partitioning guarantees cost pruning before query execution begins and allows enforcement via <code>require_partition_filter = true</code>. Clustering optimizes block layout <em>inside</em> partitions. If you omit partitioning, a runaway query can scan your entire multi-year historical dataset.
</p>
</div>

<div class="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
<div class="flex items-center gap-2 font-bold text-red-700 dark:text-red-400 text-sm mb-1">
<span>❌</span> Misconception 3: Materialized Views Always Accelerate Queries
</div>
<p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
<strong>The Myth:</strong> "Create materialized views on all heavy dashboard queries to make everything instant."<br>
<strong>The Reality:</strong> If a query contains non-deterministic functions (like <code>CURRENT_TIMESTAMP()</code>), window functions without aggregations, or high-cardinality group-by columns, BigQuery cannot transparently rewrite the query and the view adds maintenance slot overhead without any speed benefit.
</p>
</div>

<div class="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
<div class="flex items-center gap-2 font-bold text-red-700 dark:text-red-400 text-sm mb-1">
<span>❌</span> Misconception 4: Time Travel Replaces Backups & Snapshots
</div>
<p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
<strong>The Myth:</strong> "We don't need disaster recovery snapshots because BigQuery has built-in 7-day Time Travel."<br>
<strong>The Reality:</strong> Time Travel only provides a sliding 7-day window (configurable from 2 to 7 days). If a silent data corruption or corrupting DML logic bug goes unnoticed for 8 days, Time Travel cannot help you. True point-in-time baseline protection requires explicit Table Snapshots.
</p>
</div>

<div class="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 md:col-span-2">
<div class="flex items-center gap-2 font-bold text-red-700 dark:text-red-400 text-sm mb-1">
<span>❌</span> Misconception 5: Authorized Views Inherit IAM Roles Automatically
</div>
<p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
<strong>The Myth:</strong> "Granting a user <code>roles/bigquery.dataViewer</code> on a view automatically lets them query the underlying table."<br>
<strong>The Reality:</strong> If you don't explicitly authorize the view inside the source dataset configuration, BigQuery checks permissions on the underlying table and immediately returns <code>403 Access Denied</code>. Furthermore, the external user still needs <code>roles/bigquery.jobUser</code> on their own project to allocate query slots.
</p>
</div>

</div>

---

## The End-to-End Pipeline

Before running commands, let us review the pipeline topology we are building:

```text
  [Producers: Booking Web App / Kiosk Sync / Offline Flight Batch]
                              │
                              ▼
        ┌──────────────────────────────────────────────┐
        │  Cloud Storage Landing Bucket (Raw Lake)     │
        │  gs://offvia-raw-lake/bookings/year=.../     │
        └──────────────────────┬───────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   ┌───────────────────────┐             ┌───────────────────────────┐
   │ BigLake Connection    │             │ Managed Table Ingestion   │
   │ (Secure Staging GCS)  │             │ PARTITION BY DATE()       │
   │ offvia_staging        │             │ CLUSTER BY carrier, route │
   └───────────────────────┘             │ offvia_warehouse          │
                                         └─────────────┬─────────────js
                                                       │
                 ┌─────────────────────────────────────┴─────────────────────────────────────┐
                 ▼                                                                           ▼
   ┌───────────────────────────────┐                                           ┌───────────────────────────────┐
   │ Materialized View             │                                           │ Authorized View               │
   │ (Transparent Query Rewrite)   │                                           │ (PII Masking & Delegation)    │
   │ offvia_analytics              │                                           │ offvia_compliance             │
   └──────────────┬────────────────┘                                           └──────────────┬────────────────┘
                  │                                                                           │
                  ▼                                                                           ▼
     [Live Operational Dashboards]                                                [Aviation Regulatory Auditors]
     (Sub-second response, 0 slot storms)                                         (Aggregates only, zero PII)
```

---

## Lab Setup: Environment and GCP Topology

Open your terminal or Google Cloud Shell. We define our project configuration and set up four isolated BigQuery datasets representing our medallion architecture layers:

```bash
# 1. Export deployment environment variables
export PROJECT_ID="offvia-prod-data"
export REGION="europe-west1"
export BUCKET_NAME="offvia-raw-lake-${PROJECT_ID}"
export CONNECTION_ID="gcs-secure-conn"

# Set the active project
gcloud config set project ${PROJECT_ID}

# 2. Enable required Google Cloud APIs
gcloud services enable \
    storage.googleapis.com \
    bigquery.googleapis.com \
    bigqueryconnection.googleapis.com

# 3. Create the 4 architecture datasets in BigQuery
bq --location=${REGION} mk -d \
    --description "Staging and raw external table bindings" \
    ${PROJECT_ID}:offvia_staging

bq --location=${REGION} mk -d \
    --description "Core immutable partitioned & clustered warehouse fact tables" \
    ${PROJECT_ID}:offvia_warehouse

bq --location=${REGION} mk -d \
    --description "Precomputed materialized views and operational analytics" \
    ${PROJECT_ID}:offvia_analytics

bq --location=${REGION} mk -d \
    --description "Governed authorized views for external auditors and compliance" \
    ${PROJECT_ID}:offvia_compliance
```

---

## Step 1: Raw Landing in Cloud Storage with Hive Partitioning

A useful pattern for production data platforms is to keep the raw landing layer separate from transformed data. If a downstream model or schema change turns out to be wrong, the original files remain available for replay.

### 1.1 Create the Dual-Region Cloud Storage Bucket

We use uniform bucket-level access so permissions are managed consistently at the bucket level:

```bash
gcloud storage buckets create gs://${BUCKET_NAME} \
    --project=${PROJECT_ID} \
    --location=${REGION} \
    --uniform-bucket-level-access
```

### 1.2 Generate Simulated Booking Data (Python SDK)

To keep the lab reproducible, we generate 45,000 synthetic booking records across three days. The data uses a small set of carriers, European routes, booking statuses, and seat classes so the resulting queries are easy to inspect.

Create a virtual environment, install dependencies, and save this script as `generate_bookings.py`:

```bash
python3 -m venv venv
source venv/bin/activate
pip install pandas pyarrow
```

```python
import datetime
import os
import random
import uuid
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Seed for reproducibility
random.seed(42)

CARRIERS = ["LH", "BA", "AF", "FR", "U2"]
ROUTES = ["FRA_LHR", "CDG_BER", "AMS_MAD", "FCO_BCN", "MUC_CDG", "LHR_DUB"]
SEAT_CLASSES = ["ECONOMY", "ECONOMY", "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS"]
STATUSES = ["CONFIRMED", "CONFIRMED", "CONFIRMED", "CANCELLED", "MODIFIED"]

def generate_flight_records(date_str: str, num_records: int = 15000):
    base_date = datetime.datetime.strptime(date_str, "%Y-%m-%d")
    records = []
    for _ in range(num_records):
        minute_offset = random.randint(0, 1439)
        second_offset = random.randint(0, 59)
        event_time = base_date + datetime.timedelta(minutes=minute_offset, seconds=second_offset)
        # Flight fares in Euro cents (e.g. 149.50 EUR = 14950 cents)
        fare_cents = random.randint(4500, 75000)
        carrier = random.choice(CARRIERS)
        route = random.choice(ROUTES)
        booking_id = str(uuid.uuid4())
        passenger_id = f"PAX_{random.randint(10000, 99999)}"
        passenger_email = f"user_{random.randint(100, 999)}@example-travel.com"
        records.append({
            "booking_id": booking_id,
            "flight_id": f"{carrier}-{random.randint(100, 999)}",
            "carrier_code": carrier,
            "route_id": route,
            "passenger_id": passenger_id,
            "passenger_email": passenger_email,
            "event_time": event_time,
            "fare_amount_cents": fare_cents,
            "currency": "EUR",
            "seat_class": random.choice(SEAT_CLASSES),
            "status": random.choice(STATUSES),
        })
    return pd.DataFrame(records)

# Generate 3 days of booking data
dates = ["2026-09-28", "2026-09-29", "2026-09-30"]
for d in dates:
    df_day = generate_flight_records(d, num_records=15000)
    year, month, day = d.split("-")
    # Standard Hive partition path
    dir_path = f"raw_data/year={year}/month={month}/day={day}"
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, "bookings_batch_001.parquet")
    table = pa.Table.from_pandas(df_day)
    pq.write_table(table, file_path, compression="SNAPPY")
    print(f"Generated {len(df_day)} records in {file_path}")
```

Run the script and upload the Hive-partitioned files directly into Cloud Storage:

```bash
python3 generate_bookings.py

# Sync to Cloud Storage bucket with parallel upload
gcloud storage rsync -r raw_data/ gs://${BUCKET_NAME}/bookings/
```

Verify that the files landed with the correct folder hierarchy:

```bash
gcloud storage ls --recursive gs://${BUCKET_NAME}/bookings/
```

Output:
```text
gs://offvia-raw-lake-offvia-prod-data/bookings/year=2026/month=09/day=28/bookings_batch_001.parquet
gs://offvia-raw-lake-offvia-prod-data/bookings/year=2026/month=09/day=29/bookings_batch_001.parquet
gs://offvia-raw-lake-offvia-prod-data/bookings/year=2026/month=09/day=30/bookings_batch_001.parquet
```

---

## Step 2: Creating & Profiling BigLake External Tables

To query files securely where they landed without copying data into native storage, we establish a BigLake connection. BigLake enables fine-grained access control down to the object and file level.

### 2.1 Create the Cloud Resource Connection

```bash
bq mk --connection \
    --location=${REGION} \
    --connection_type=CLOUD_RESOURCE \
    ${CONNECTION_ID}

# Retrieve and grant the connection service account permissions on the bucket
CONNECTION_SA=$(bq show --connection ${PROJECT_ID}.${REGION}.${CONNECTION_ID} | grep 'serviceAccountId' | awk -F'"' '{print $4}')

gcloud storage buckets add-iam-policy-binding gs://${BUCKET_NAME} \
    --member="serviceAccount:${CONNECTION_SA}" \
    --role="roles/storage.objectViewer"
```

### 2.2 Define the BigLake External Table DDL

We map directory names (`year`, `month`, `day`) directly to queryable virtual columns using the secure connection:

```sql
CREATE OR REPLACE EXTERNAL TABLE offvia_staging.ext_bookings
WITH CONNECTION `offvia-prod-data.europe-west1.gcs-secure-conn`
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://offvia-raw-lake-offvia-prod-data/bookings/*'],
  hive_partition_uri_prefix = 'gs://offvia-raw-lake-offvia-prod-data/bookings/'
);
```

Execute this via CLI:

```bash
bq query --use_legacy_sql=false "
CREATE OR REPLACE EXTERNAL TABLE offvia_staging.ext_bookings
WITH CONNECTION \`${PROJECT_ID}.${REGION}.${CONNECTION_ID}\`
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://${BUCKET_NAME}/bookings/*'],
  hive_partition_uri_prefix = 'gs://${BUCKET_NAME}/bookings/'
);"
```

### 2.3 Profiling Query Performance on External Tables

Run an analytical query against the external table:

```sql
SELECT 
  carrier_code,
  COUNT(1) AS booking_count,
  ROUND(SUM(fare_amount_cents) / 100.0, 2) AS total_revenue_eur
FROM offvia_staging.ext_bookings
WHERE year = 2026 AND month = 9 AND day = 30
GROUP BY carrier_code
ORDER BY total_revenue_eur DESC;
```

<div class="my-6 p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-950 dark:text-amber-200">

<strong>Execution Analysis: The Cost of External Tables</strong><br>
When querying an external table:
<ul class="list-disc ml-5 mt-2 space-y-1">
<li><strong>Metadata Latency:</strong> BigQuery workers issue Cloud Storage API calls to discover Parquet files matching the Hive partition prefix, adding baseline overhead (600ms–1500ms).</li>
<li><strong>Network Read Overhead:</strong> Parquet file footers must be pulled across the data center network into the worker slot pool.</li>
<li><strong>No Result Caching:</strong> External table queries cannot guarantee immutability, disabling deterministic cached results.</li>
</ul>
<strong>Verdict:</strong> BigLake and external tables are ideal for exploratory queries, staging layers, or cold archives. They are sub-optimal for high-concurrency dashboards requiring sub-second SLAs.

</div>

---

## Step 3: Production Managed Table (Partitioning & Clustering)

For primary analytical workloads, we migrate data into a native BigQuery table to leverage Capacitor storage, strict partition filters, and cluster sorting.

### 3.1 Production Fact Table DDL

```sql
CREATE OR REPLACE TABLE offvia_warehouse.fct_bookings (
  booking_id STRING NOT NULL OPTIONS(description="Unique UUIDv4 identifier for the booking"),
  flight_id STRING NOT NULL OPTIONS(description="IATA flight number, e.g. LH-402"),
  carrier_code STRING NOT NULL OPTIONS(description="Operating airline code: LH, BA, AF, FR, U2"),
  route_id STRING NOT NULL OPTIONS(description="Route origin and destination, e.g. FRA_LHR"),
  passenger_id STRING NOT NULL OPTIONS(description="Pseudonymized passenger identity token"),
  passenger_email STRING NOT NULL OPTIONS(description="Customer email address (Restricted PII)"),
  event_time TIMESTAMP NOT NULL OPTIONS(description="UTC timestamp when the booking was transacted"),
  ingestion_time TIMESTAMP NOT NULL OPTIONS(description="UTC timestamp when the record landed in the warehouse"),
  fare_amount_cents INT64 NOT NULL OPTIONS(description="Total fare paid in Euro cents"),
  currency STRING(3) NOT NULL OPTIONS(description="ISO-4217 3-letter currency code"),
  seat_class STRING NOT NULL OPTIONS(description="Cabin class: ECONOMY, PREMIUM_ECONOMY, BUSINESS"),
  status STRING NOT NULL OPTIONS(description="Status: CONFIRMED, MODIFIED, CANCELLED")
)
PARTITION BY DATE(event_time)
CLUSTER BY carrier_code, route_id, status
OPTIONS (
  require_partition_filter = true,
  partition_expiration_days = 1095, -- 3 years automatic retention
  description = "Production flight booking fact table for Offvia travel platform"
);
```

Execute this DDL:

```bash
bq query --use_legacy_sql=false "
CREATE OR REPLACE TABLE ${PROJECT_ID}:offvia_warehouse.fct_bookings (
  booking_id STRING NOT NULL,
  flight_id STRING NOT NULL,
  carrier_code STRING NOT NULL,
  route_id STRING NOT NULL,
  passenger_id STRING NOT NULL,
  passenger_email STRING NOT NULL,
  event_time TIMESTAMP NOT NULL,
  ingestion_time TIMESTAMP NOT NULL,
  fare_amount_cents INT64 NOT NULL,
  currency STRING NOT NULL,
  seat_class STRING NOT NULL,
  status STRING NOT NULL
)
PARTITION BY DATE(event_time)
CLUSTER BY carrier_code, route_id, status
OPTIONS (
  require_partition_filter = true,
  partition_expiration_days = 1095
);"
```

### 3.2 Ingesting from Staging into the Managed Fact Table

```bash
bq query --use_legacy_sql=false "
INSERT INTO ${PROJECT_ID}:offvia_warehouse.fct_bookings
SELECT 
  booking_id,
  flight_id,
  carrier_code,
  route_id,
  passenger_id,
  passenger_email,
  event_time,
  CURRENT_TIMESTAMP() AS ingestion_time,
  fare_amount_cents,
  currency,
  seat_class,
  status
FROM ${PROJECT_ID}:offvia_staging.ext_bookings;"
```

### 3.3 Verifying Partition Elimination & Clustering Guardrails

Testing the `require_partition_filter` guardrail by deliberately omitting the date filter:

```sql
-- This query will fail intentionally
SELECT COUNT(1) FROM offvia_warehouse.fct_bookings WHERE carrier_code = 'LH';
```

BigQuery immediately halts execution:
```text
Error: Cannot query over table 'offvia-prod-data.offvia_warehouse.fct_bookings' 
without a filter over column(s) 'event_time' that can be used for partition elimination.
```

Now, query with proper partition bounds:

```sql
SELECT 
  carrier_code,
  route_id,
  COUNT(1) AS flights_booked,
  ROUND(SUM(fare_amount_cents) / 100.0, 2) AS route_revenue_eur
FROM offvia_warehouse.fct_bookings
WHERE event_time >= TIMESTAMP('2026-09-30 00:00:00')
  AND event_time < TIMESTAMP('2026-10-01 00:00:00')
  AND carrier_code = 'LH'
GROUP BY carrier_code, route_id
ORDER BY route_revenue_eur DESC;
```

---

## Step 4: Late-Arriving Data with Dual-Timestamp Watermarks

In real-world airline systems, event time and ingestion time diverge. For instance, an in-flight Wi-Fi purchase made at 35,000 feet over the Atlantic sits in avionics queues until the aircraft docks and syncs its telemetry hours later. 

### 4.1 The Partition-Scoped Idempotent MERGE Pattern

To prevent full-table scans when processing late records, **always bind your `MERGE` conditions to target partition predicates**:

```sql
MERGE INTO offvia_warehouse.fct_bookings AS target
USING (
  SELECT 
    '00000000-0000-0000-0000-000000000999' AS booking_id,
    'LH-882' AS flight_id,
    'LH' AS carrier_code,
    'FRA_LHR' AS route_id,
    'PAX_99999' AS passenger_id,
    'vip_pax@example-travel.com' AS passenger_email,
    TIMESTAMP('2026-09-28 14:15:00') AS event_time,
    89000 AS fare_amount_cents,
    'EUR' AS currency,
    'FIRST' AS seat_class,
    'MODIFIED' AS status
) AS source
-- CRITICAL OPTIMIZATION: Bounding target.event_time forces BigQuery 
-- to scan ONLY the 2026-09-28 partition instead of the entire table!
ON target.event_time >= TIMESTAMP('2026-09-28 00:00:00')
   AND target.event_time < TIMESTAMP('2026-09-29 00:00:00')
   AND target.booking_id = source.booking_id
WHEN MATCHED THEN
  UPDATE SET
    status = source.status,
    seat_class = source.seat_class,
    fare_amount_cents = source.fare_amount_cents,
    ingestion_time = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN
  INSERT (
    booking_id, flight_id, carrier_code, route_id, passenger_id, passenger_email,
    event_time, ingestion_time, fare_amount_cents, currency, seat_class, status
  )
  VALUES (
    source.booking_id, source.flight_id, source.carrier_code, source.route_id, source.passenger_id, source.passenger_email,
    source.event_time, CURRENT_TIMESTAMP(), source.fare_amount_cents, source.currency, source.seat_class, source.status
  );
```

---

## Step 5: Materialized Views & Transparent Query Rewriting

Materialized views precompute daily summaries, allowing dashboards to run with zero lag while automatically keeping synchronized with base table updates.

### 5.1 Create the Materialized View DDL

```sql
CREATE MATERIALIZED VIEW offvia_analytics.mv_carrier_daily_summary
OPTIONS (
  enable_refresh = true,
  refresh_interval_minutes = 30
)
AS
SELECT 
  DATE(event_time) AS booking_date,
  carrier_code,
  route_id,
  seat_class,
  COUNT(1) AS total_bookings,
  SUM(fare_amount_cents) AS total_revenue_cents,
  AVG(fare_amount_cents) AS avg_fare_cents
FROM offvia_warehouse.fct_bookings
GROUP BY 1, 2, 3, 4;
```

### 5.2 Validating Transparent Query Rewriting

When analysts run standard queries against the *base* table `fct_bookings`:

```sql
SELECT 
  carrier_code,
  SUM(fare_amount_cents) / 100.0 AS total_revenue_eur
FROM offvia_warehouse.fct_bookings
WHERE event_time >= TIMESTAMP('2026-09-30 00:00:00')
  AND event_time < TIMESTAMP('2026-10-01 00:00:00')
GROUP BY carrier_code;
```

The Cost-Based Optimizer (CBO) inspects the execution graph and transparently redirects I/O to read exclusively from `mv_carrier_daily_summary`, slashing bytes scanned by over 99%.

---

## Step 6: Disaster Recovery Drill: Time Travel Point-in-Time Recovery

### 6.1 Simulating the Disaster

An engineer accidentally runs a destructive DML operation without a proper predicate:

```sql
UPDATE ${PROJECT_ID}:offvia_warehouse.fct_bookings
SET status = 'CANCELLED'
WHERE DATE(event_time) = '2026-09-30';
```

### 6.2 The Time Travel Recovery Runbook

Using BigQuery's built-in 7-day Time Travel window (`FOR SYSTEM_TIME AS OF`), we inspect and recover the table state from 5 minutes prior:

```sql
-- 1. Create temporary recovery snapshot
CREATE OR REPLACE TABLE offvia_warehouse.fct_bookings_recovery_snapshot AS
SELECT * 
FROM offvia_warehouse.fct_bookings
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE)
WHERE DATE(event_time) = '2026-09-30';

-- 2. Partition-bounded merge back to main table
MERGE INTO offvia_warehouse.fct_bookings AS target
USING offvia_warehouse.fct_bookings_recovery_snapshot AS source
ON target.event_time >= TIMESTAMP('2026-09-30 00:00:00')
   AND target.event_time < TIMESTAMP('2026-10-01 00:00:00')
   AND target.booking_id = source.booking_id
WHEN MATCHED THEN
  UPDATE SET
    status = source.status,
    seat_class = source.seat_class,
    fare_amount_cents = source.fare_amount_cents;

-- 3. Cleanup snapshot
DROP TABLE offvia_warehouse.fct_bookings_recovery_snapshot;
```

---

## Step 7: Authorized Views & Zero-Trust PII Masking

European aviation authorities require route volume insights, but exposing raw columns like `passenger_email` or `passenger_id` violates GDPR and PCI-DSS compliance.

### 7.1 Create the Compliance View DDL

```sql
CREATE OR REPLACE VIEW offvia_compliance.v_audited_flight_metrics
OPTIONS(
  description="Audited aggregated route capacity metrics for regulatory compliance. PII stripped."
)
AS
SELECT 
  DATE(event_time) AS flight_date,
  carrier_code,
  route_id,
  seat_class,
  COUNT(DISTINCT booking_id) AS total_passenger_count,
  ROUND(SUM(fare_amount_cents) / 100.0, 2) AS total_gross_fare_eur,
  ROUND(AVG(fare_amount_cents) / 100.0, 2) AS average_fare_eur
FROM offvia_warehouse.fct_bookings
WHERE status = 'CONFIRMED'
GROUP BY 1, 2, 3, 4;
```

### 7.2 Authorize the View in the Source Dataset

```bash
bq update --dataset --add_view \
    ${PROJECT_ID}:offvia_compliance.v_audited_flight_metrics \
    ${PROJECT_ID}:offvia_warehouse
```

This cryptographic delegation allows external auditor roles to query aggregated metrics through the view while receiving an immediate `403 Access Denied` if they attempt to query the underlying base table directly.

---

## Production Cheat Sheet: GCP Storage and Access

| Primitive | Key DDL / Syntax | Primary Purpose | Cost / Slot Impact |
|---|---|---|---|
| **BigLake Table** | `CREATE EXTERNAL TABLE ... WITH CONNECTION` | Secure zero-copy SQL exploration over Cloud Storage files | High scan latency; no caching; zero storage cost in BigQuery |
| **Partitioned Table** | `PARTITION BY DATE(col) OPTIONS(require_partition_filter=true)` | Coarse-grained pruning of historical dates; eliminates runaway scans | Scans only queried date blocks; guarantees predictable query cost |
| **Clustered Table** | `CLUSTER BY col1, col2, col3` | Fine-grained block sorting inside partitions; optimal for equality filters | Zero extra storage cost; automatic background re-clustering |
| **Materialized View** | `CREATE MATERIALIZED VIEW ... AS SELECT ... GROUP BY` | Transparent query acceleration for high-concurrency BI dashboards | Drastically reduces slot consumption; incremental refresh maintenance |
| **Time Travel** | `FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(..., INTERVAL X MINUTE)` | Instant disaster recovery from accidental DML without backup restore | Billed under 7-day physical history; zero configuration required |
| **Authorized View** | `CREATE VIEW ...` + `bq update --dataset --add_view` | Cryptographic data delegation; exposes aggregates without base table PII | Base table access completely shielded; zero PII leakage risk |

---

## Official Google Cloud Documentation

- [Google Cloud BigQuery Storage Architecture (Colossus & Capacitor)](https://cloud.google.com/bigquery/docs/storage_overview)
- [Managing Partitioned Tables in BigQuery](https://cloud.google.com/bigquery/docs/partitioned-tables)
- [Clustering in BigQuery Tables](https://cloud.google.com/bigquery/docs/clustered-tables)
- [BigQuery Materialized Views Best Practices](https://cloud.google.com/bigquery/docs/materialized-views-intro)
- [Time Travel and Fail-Safe Storage in BigQuery](https://cloud.google.com/bigquery/docs/time-travel)
- [Creating and Using Authorized Views](https://cloud.google.com/bigquery/docs/authorized-views)
- [BigLake Tables and External Object Storage](https://cloud.google.com/bigquery/docs/biglake-intro)