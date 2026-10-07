---
title: "Data Engineering on GCP (Part 4): Building the Production Real-Time Streaming Pipeline (Hands-On Lab)"
meta_title: "GCP Streaming Pipeline Lab: Pub/Sub, Dataflow & BigQuery Storage Write API"
description: "A production hands-on GCP data engineering lab: build an event-driven streaming pipeline with Pub/Sub, Apache Beam on Dataflow, dead-letter quarantines, watermarking, and the BigQuery Storage Write API."
date: 2026-10-07
image: "/images/gcp-streaming-pipeline-lab.jpg"
categories: ["Google Cloud", "Architecture"]
tags: ["Data Engineering", "GCP", "Pub/Sub", "Dataflow", "BigQuery", "Apache Beam", "Hands-On Lab", "TravelTech"]
author: tharun-vempati
featured: true
draft: false
series: "Data Engineering on Google Cloud"
series_order: 4
series_description: "A practical architecture and hands-on guide to Google Cloud data engineering: Cloud Storage landing, BigLake external connections, partitioned and clustered BigQuery tables, dual-timestamp watermarks, materialized views, Time Travel recovery, authorized views, and streaming ingestion pipelines."
series_image: "/images/series-images/gcp-data-engineering-series-poster.jpg"
---

# Data Engineering on GCP (Part 4): Building the Production Real-Time Streaming Pipeline (Hands-On Lab)

In [Part 3 of this series](/blog/gcp-data-engineering-streaming-batch-ingestion-pubsub-dataflow/), we mapped the architectural trade-offs of modern real-time ingestion. We established why synchronous database inserts fail under load, why producers must never depend directly on analytical endpoints, and how Google Cloud Pub/Sub, Dataflow, and the BigQuery Storage Write API form a decoupled, fault-tolerant ingestion topology.

Now, we roll up our sleeves and build it.

In this hands-on lab, we will implement the real-time ingestion backbone for **Offvia**, our regional airline booking platform. We will set up a multi-tier streaming architecture that ingests high-velocity booking events, isolates malformed "poison-pill" payloads into an automated dead-letter quarantine without stalling the pipeline, enforces event-time watermarking, and writes clean, validated records to partitioned BigQuery tables using the high-performance Storage Write API.

<div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 my-8 shadow-xs space-y-3">
<div class="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
<span>🧪</span> Lab Objectives & Architecture Blueprint
</div>
<p class="text-sm text-slate-800 dark:text-slate-200 leading-relaxed m-0">
By the end of this lab, you will have constructed:
</p>
<ul class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1.5 pl-5 list-disc m-0">
<li><strong>Zero-Code Bronze Landing:</strong> A direct Pub/Sub BigQuery subscription capturing raw, unmodified JSON events and metadata without maintaining a worker cluster.</li>
<li><strong>Stateful Silver Pipeline:</strong> An Apache Beam pipeline executing on Google Cloud Dataflow with custom error handling, event-time timestamp extraction, and fixed-window processing.</li>
<li><strong>Quarantine Dead-Letter Pattern:</strong> An automated quarantine route separating corrupt or schema-incompatible payloads into a dedicated triage table.</li>
<li><strong>Storage Write API Integration:</strong> Direct streaming sinks into partitioned BigQuery tables with proto-schema enforcement.</li>
<li><strong>Chaos Testing:</strong> Synthetic event injection verifying pipeline resilience against out-of-order events, network lag, and schema corruption.</li>
</ul>
</div>

---

## 1. The Scenario & Failure Modes

During peak booking windows—such as flash sales or weather-induced flight rebookings—Offvia experiences bursts exceeding 15,000 transactions per second. 

In legacy architectures, engineers frequently make three architectural mistakes that lead to 3:00 AM production outages:

1. **The Shared-Database Anti-Pattern:** The checkout microservice writes both the operational transaction and the analytics event to the primary PostgreSQL or Cloud Spanner database. Analytical reporting queries subsequently saturate CPU slots and starve connection pools needed for paying travelers.
2. **The Direct Synchronous Sink Trap:** The application service opens a connection to BigQuery's legacy REST streaming endpoint (`tabledata.insertAll`). When BigQuery experiences temporary regional latency, worker threads block, the web servers run out of socket descriptors, and checkout requests time out.
3. **The Poison-Pill Crash Loop:** An upstream mobile app client releases a faulty update emitting an integer for a passenger name field (`"passenger_name": 10492`). A streaming worker attempting to parse the record encounters an unhandled type exception, crashes, restarts, reads the exact same message from the queue, and crashes again in an infinite loop.

Our architecture resolves every single one of these failure modes by enforcing decoupled message buffering, runner-level dead-letter routing, and asynchronous analytical writes.

---

## 2. The Mental Model: The Airport Baggage Screening Terminal

To understand how each piece of Google Cloud's streaming stack interacts, consider an automated airport baggage inspection terminal:

<div class="p-6 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border-2 border-sky-300 dark:border-sky-600/70 my-8 shadow-xs space-y-3">
<div class="flex items-center gap-2 font-bold text-sky-950 dark:text-sky-100 text-base">
<span>🧳</span> Mental Model: The Baggage Sorting Concourse
</div>
<p class="text-sm text-sky-900 dark:text-sky-200 leading-relaxed m-0">
<strong>1. The Check-in Desk & Belt (Pub/Sub):</strong> The check-in agent weighs your bag, slaps a barcoded tag on it, drops it onto the primary conveyor belt, and immediately addresses the next traveler. The check-in desk does not wait for the plane to be loaded. The conveyor belt serves as an elastic shock absorber.
</p>
<p class="text-sm text-sky-900 dark:text-sky-200 leading-relaxed m-0">
<strong>2. The Raw Cargo Hold (Direct BigQuery Subscription):</strong> As bags slide past, an automated photographic scanner snapshots every piece of luggage exactly as it entered the facility and stores the image in an archive vault. If anything goes wrong downstream, you have an untampered historical record.
</p>
<p class="text-sm text-sky-900 dark:text-sky-200 leading-relaxed m-0">
<strong>3. The Automated Inspection & Routing Sorter (Dataflow / Apache Beam):</strong> Robotic scanners examine the barcodes, inspect weights, group bags by destination flight gate, and filter out baggage with torn or missing tags onto a secondary inspection spur (The Quarantine Dead-Letter Chute) without stopping the main conveyor line.
</p>
<p class="text-sm text-sky-900 dark:text-sky-200 leading-relaxed m-0">
<strong>4. The High-Speed Loading Bay (BigQuery Storage Write API):</strong> Rather than loading bags one passenger at a time through a narrow side door, specialized automated cargo loaders pack validated luggage into structured containers and slide them directly into the aircraft fuselage via optimized gRPC streams.
</p>
</div>

---

## 3. Architecture Blueprint: Bronze, Silver & Quarantine

Our streaming architecture follows the modern Medallion pipeline pattern tailored for real-time cloud data warehouses:

```text
                               ┌────────────────────────────────────────────────────────┐
                               │             FLIGHT BOOKING MICROSERVICE                │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ (1) Publish Event (Avro/JSON)
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │           GOOGLE CLOUD PUB/SUB TOPIC                   │
                               │           (booking-events-topic)                       │
                               └─────────────┬────────────────────────────┬─────────────┘
                                             │                            │
                     (2a) Direct BigQuery Sub│                            │ (2b) Pull Stream
                                             ▼                            ▼
                 ┌──────────────────────────────────────┐   ┌───────────────────────────┐
                 │    PUB/SUB BIGQUERY SUBSCRIPTION     │   │      GOOGLE CLOUD         │
                 │      (Zero-Worker Raw Landing)       │   │        DATAFLOW           │
                 └───────────────────┬──────────────────┘   │     (Apache Beam)         │
                                     │                      └─────────────┬─────────────┘
                                     │ Writes Raw JSON                    │
                                     ▼                                    │
                 ┌──────────────────────────────────────┐                 │ (3) Windowing, Parsing,
                 │         BRONZE DATASET               │                 │     & Schema Validation
                 │   (offvia_bronze.raw_bookings)       │                 │
                 └──────────────────────────────────────┘                 ├──────────────────────┐
                                                                          │ Valid Payload        │ Malformed / Parse Error
                                                                          ▼                      ▼
                                                        ┌──────────────────────┐  ┌──────────────────────┐
                                                        │ STORAGE WRITE API    │  │ DEAD-LETTER SINK     │
                                                        │ (Committed Stream)   │  │ (Quarantine Table)   │
                                                        └──────────┬───────────┘  └──────────┬───────────┘
                                                                   │                         │
                                                                   ▼                         ▼
                                                        ┌──────────────────────┐  ┌──────────────────────┐
                                                        │    SILVER DATASET    │  │  QUARANTINE DATASET  │
                                                        │  (Clean Bookings)    │  │  (Failed Triage)     │
                                                        └──────────────────────┘  └──────────────────────┘
```

---

## 4. 🚨 5 Fatal Streaming Misconceptions Every Data Engineer Must Unlearn

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 shadow-xs space-y-2">
<div class="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200 text-sm">
<span>❌</span> Myth 1: Pub/Sub Always Guarantees Global FIFO Order
</div>
<p class="text-xs text-rose-950 dark:text-rose-300 leading-relaxed m-0">
<strong>The Reality:</strong> Without explicit Ordering Keys, Pub/Sub distributes messages across thousands of parallel storage partitions. Messages are delivered out of order. To enforce sequencing, you must specify an ordering key (e.g., <code>booking_id</code>) and publish to the same region.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 shadow-xs space-y-2">
<div class="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200 text-sm">
<span>❌</span> Myth 2: A Pub/Sub DLQ Catches All Dataflow Worker Bugs
</div>
<p class="text-xs text-rose-950 dark:text-rose-300 leading-relaxed m-0">
<strong>The Reality:</strong> A Pub/Sub Dead-Letter Queue only triggers when a subscriber client continuously nacks or fails to acknowledge a message within the ack deadline. If a Dataflow pipeline unhandled exception causes worker restarts, you exhaust Compute Engine quotas before Pub/Sub DLQ intervention. You must handle exceptions within Beam `DoFn` transforms.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 shadow-xs space-y-2">
<div class="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200 text-sm">
<span>❌</span> Myth 3: Streaming Ingestion Means Processing Time Windows
</div>
<p class="text-xs text-rose-950 dark:text-rose-300 leading-relaxed m-0">
<strong>The Reality:</strong> Basing financial aggregations or hourly passenger counts on the machine time when the server received the event (Processing Time) corrupts metrics during network partitions. Robust analytics requires Event Time watermarks paired with an allowed lateness threshold.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 shadow-xs space-y-2">
<div class="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200 text-sm">
<span>❌</span> Myth 4: BigQuery Storage Write API Requires One Stream Per Thread
</div>
<p class="text-xs text-rose-950 dark:text-rose-300 leading-relaxed m-0">
<strong>The Reality:</strong> BigQuery's Storage Write API uses gRPC HTTP/2 multiplexing. A single persistent stream can handle thousands of concurrent write requests. Creating and destroying streams per HTTP request causes socket exhaustion and exceeds BigQuery connection quotas.
</p>
</div>
</div>

---

## 5. Parameter & Ingestion Route Cheat Sheet

Before writing pipeline code, review this architectural comparison across Google Cloud's ingestion options:

| Ingestion Mechanism | Target Latency | Compute Overhead | Transformation Power | Exactly-Once Semantics | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pub/Sub BigQuery Sub** | 1 - 3 seconds | Zero (Fully Serverless) | None (Schema mapping / JSON extraction) | Yes (Cloud Managed) | Raw Bronze landing, audit logging, zero-ops event capture |
| **Apache Beam / Dataflow** | 500ms - 2 seconds | Managed Worker Pool | Full (Windowing, Joins, Watermarks, Python/Java) | Yes (End-to-End Checkpointing) | Silver tier transformation, anomaly detection, aggregations |
| **Storage Write API (Direct)**| 200ms - 1 second | Application-Hosted | Custom application logic | Yes (Committed stream with offset tracking) | Microservices streaming domain events directly to BigQuery |
| **BigQuery Batch Load** | Minutes to Hours | Free Shared Quotas | High (SQL staging queries) | Yes (Atomic Table Replace) | Nightly historical snapshots, partner CSV dumps |

---

## 6. Step-by-Step Hands-On Lab

### Prerequisites & Environment Setup

Ensure you have the Google Cloud CLI installed and authenticated with your target development project:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login

# 2. Set environment variables
export PROJECT_ID="offvia-prod-data" # Replace with your GCP Project ID
export REGION="us-central1"

gcloud config set project ${PROJECT_ID}

# 3. Enable required Google Cloud APIs
gcloud services enable \
  pubsub.googleapis.com \
  dataflow.googleapis.com \
  bigquery.googleapis.com \
  bigquerystorage.googleapis.com \
  storage.googleapis.com
```

---

### Step 1: Provision BigQuery Storage Datasets & Schemas

We will construct three dedicated datasets: `offvia_bronze` for raw landing, `offvia_silver` for validated analytical tables, and `offvia_quarantine` for poisoned payloads.

```bash
# Create Datasets
bq mk --location=${REGION} --dataset ${PROJECT_ID}:offvia_bronze
bq mk --location=${REGION} --dataset ${PROJECT_ID}:offvia_silver
bq mk --location=${REGION} --dataset ${PROJECT_ID}:offvia_quarantine
```

Next, define the table schemas. Notice how the Silver table is partitioned by `event_timestamp` and clustered by `origin_airport` and `destination_airport`:

```sql
-- Execute via bq query or BigQuery Console

-- 1. Silver Validated Bookings Table
CREATE TABLE IF NOT EXISTS `offvia-prod-data.offvia_silver.fact_bookings` (
  booking_id STRING NOT NULL,
  passenger_id STRING NOT NULL,
  flight_number STRING NOT NULL,
  origin_airport STRING NOT NULL,
  destination_airport STRING NOT NULL,
  fare_amount NUMERIC NOT NULL,
  currency STRING NOT NULL,
  booking_status STRING NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,
  ingestion_timestamp TIMESTAMP NOT NULL
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY origin_airport, destination_airport
OPTIONS (
  description = "Clean, validated, partitioned real-time flight bookings stream"
);

-- 2. Quarantine Dead-Letter Table
CREATE TABLE IF NOT EXISTS `offvia-prod-data.offvia_quarantine.poisoned_events` (
  raw_payload STRING NOT NULL,
  error_reason STRING NOT NULL,
  error_stage STRING NOT NULL,
  received_timestamp TIMESTAMP NOT NULL
)
PARTITION BY DATE(received_timestamp)
OPTIONS (
  description = "Quarantined payloads failing schema validation or JSON parsing"
);
```

---

### Step 2: Configure Pub/Sub Topics & the Direct BigQuery Subscription

Create the main event ingest topic:

```bash
gcloud pubsub topics create booking-events-topic
```

Now, deploy the **Zero-Worker Bronze Ingestion Subscription**. This subscription writes messages directly from Pub/Sub into BigQuery without requiring a Compute Engine or Dataflow instance:

```bash
# First, create the Bronze destination table with Pub/Sub metadata schema
bq query --use_legacy_sql=false '
CREATE TABLE IF NOT EXISTS `offvia-prod-data.offvia_bronze.raw_bookings` (
  subscription_name STRING,
  message_id STRING,
  publish_time TIMESTAMP,
  data STRING,
  attributes JSON
);'

# Grant the Google-managed Pub/Sub service account write permissions on the dataset
export PUBSUB_SA="service-$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')@gcp-sa-pubsub.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${PUBSUB_SA}" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${PUBSUB_SA}" \
  --role="roles/bigquery.metadataViewer"

# Create the BigQuery subscription with write-metadata enabled
gcloud pubsub subscriptions create booking-events-bronze-sub \
  --topic=booking-events-topic \
  --bigquery-table=${PROJECT_ID}:offvia_bronze.raw_bookings \
  --write-metadata \
  --drop-unknown-fields=false
```

<div class="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 my-6 text-xs text-amber-900 dark:text-amber-200">
<strong>⚠️ Production Tip:</strong> Always set <code>--write-metadata</code> on direct BigQuery subscriptions. This automatically attaches <code>message_id</code> and <code>publish_time</code> to every record, giving you an immutable audit trail to prove message arrival times if data discrepancies arise later.
</div>

---

### Step 3: Write the Production Apache Beam Streaming Pipeline (Python)

Create a dedicated subscriber for our Dataflow pipeline:

```bash
gcloud pubsub subscriptions create booking-events-dataflow-sub \
  --topic=booking-events-topic \
  --ack-deadline=60
```

Now, create the pipeline script: `stream_bookings_pipeline.py`.

Notice how we implement:
- **`TaggedOutput` for Poison-Pill Isolation:** Any malformed JSON or negative fare value is redirected to the `quarantine` output tag instead of raising an uncaught exception.
- **Event-Time Timestamping:** We extract the application-level `booking_time` and attach it as the element's event timestamp.
- **Fixed-Windowing:** Elements are grouped into 1-minute event-time windows with a 5-minute allowed lateness boundary.
- **Storage Write API Sink:** We use `METHOD_STORAGE_WRITE_API` for maximum throughput.

```python
"""
Offvia Production Real-Time Streaming Ingestion Pipeline.
Consumes flight booking events from Pub/Sub, validates schemas,
quarantines poison pills, and writes to BigQuery via the Storage Write API.
"""

import json
import logging
import argparse
from datetime import datetime

import apache_beam as beam
from apache_beam import pvalue
from apache_beam.options.pipeline_options import PipelineOptions, StandardOptions, GoogleCloudOptions
from apache_beam.transforms.window import FixedWindows


class ValidateAndEnrichBookingFn(beam.DoFn):
    """
    Validates booking schema, extracts event time, and tags invalid
    records for quarantine diversion.
    """
    TAG_QUARANTINE = "quarantine"

    def process(self, element):
        raw_text = element.decode("utf-8")
        now_iso = datetime.utcnow().isoformat()

        # Step 1: JSON Parse Validation
        try:
            payload = json.loads(raw_text)
        except Exception as err:
            logging.warning(f"Malformed JSON payload: {err}")
            yield pvalue.TaggedOutput(
                self.TAG_QUARANTINE,
                {
                    "raw_payload": raw_text,
                    "error_reason": f"JSONDecodeError: {str(err)}",
                    "error_stage": "PARSE_JSON",
                    "received_timestamp": now_iso
                }
            )
            return

        # Step 2: Required Field & Data Type Validation
        required_fields = ["booking_id", "passenger_id", "flight_number", 
                           "origin", "destination", "fare", "event_time"]
        missing = [f for f in required_fields if f not in payload]
        if missing:
            yield pvalue.TaggedOutput(
                self.TAG_QUARANTINE,
                {
                    "raw_payload": raw_text,
                    "error_reason": f"Missing required fields: {', '.join(missing)}",
                    "error_stage": "SCHEMA_VALIDATION",
                    "received_timestamp": now_iso
                }
            )
            return

        # Step 3: Domain Rules (e.g., Non-negative Fares)
        try:
            fare_val = float(payload["fare"])
            if fare_val <= 0.0:
                raise ValueError(f"Invalid fare amount: {fare_val}")
        except ValueError as val_err:
            yield pvalue.TaggedOutput(
                self.TAG_QUARANTINE,
                {
                    "raw_payload": raw_text,
                    "error_reason": str(val_err),
                    "error_stage": "BUSINESS_RULE_VALIDATION",
                    "received_timestamp": now_iso
                }
            )
            return

        # Step 4: Parse Event Time & Construct Clean Silver Record
        try:
            event_dt = datetime.fromisoformat(payload["event_time"].replace("Z", "+00:00"))
            event_timestamp_epoch = event_dt.timestamp()
        except Exception:
            event_timestamp_epoch = datetime.utcnow().timestamp()

        silver_record = {
            "booking_id": str(payload["booking_id"]),
            "passenger_id": str(payload["passenger_id"]),
            "flight_number": str(payload["flight_number"]),
            "origin_airport": str(payload["origin"]),
            "destination_airport": str(payload["destination"]),
            "fare_amount": str(round(fare_val, 2)),
            "currency": str(payload.get("currency", "USD")),
            "booking_status": str(payload.get("status", "CONFIRMED")),
            "event_timestamp": datetime.utcfromtimestamp(event_timestamp_epoch).isoformat(),
            "ingestion_timestamp": now_iso
        }

        # Attach event timestamp to Beam windowing system
        yield beam.window.TimestampedValue(silver_record, event_timestamp_epoch)


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--subscription", required=True, help="Full Pub/Sub subscription path")
    parser.add_argument("--silver_table", required=True, help="BigQuery silver destination table")
    parser.add_argument("--quarantine_table", required=True, help="BigQuery quarantine destination table")
    known_args, pipeline_args = parser.parse_known_args()

    pipeline_options = PipelineOptions(pipeline_args)
    pipeline_options.view_as(StandardOptions).streaming = True

    with beam.Pipeline(options=pipeline_options) as p:
        # 1. Ingest raw bytes from Pub/Sub
        messages = p | "ReadFromPubSub" >> beam.io.ReadFromPubSub(subscription=known_args.subscription)

        # 2. Branch: Validate or Quarantine
        results = (
            messages 
            | "ValidateAndEnrich" >> beam.ParDo(ValidateAndEnrichBookingFn()).with_outputs(
                ValidateAndEnrichBookingFn.TAG_QUARANTINE,
                main="valid_bookings"
            )
        )

        valid_bookings = results.valid_bookings
        quarantined_bookings = results.quarantine

        # 3. Apply 1-Minute Fixed Windows with 5-Minute Allowed Lateness
        windowed_silver = (
            valid_bookings 
            | "FixedWindow1Min" >> beam.WindowInto(
                FixedWindows(60),
                allowed_lateness=300
            )
        )

        # 4. Sink to Silver via Storage Write API
        windowed_silver | "WriteSilverToBigQuery" >> beam.io.WriteToBigQuery(
            table=known_args.silver_table,
            method=beam.io.WriteToBigQuery.Method.STORAGE_WRITE_API,
            write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
            create_disposition=beam.io.BigQueryDisposition.CREATE_NEVER
        )

        # 5. Sink to Quarantine Dead-Letter Table
        quarantined_bookings | "WriteQuarantineToBigQuery" >> beam.io.WriteToBigQuery(
            table=known_args.quarantine_table,
            method=beam.io.WriteToBigQuery.Method.STORAGE_WRITE_API,
            write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
            create_disposition=beam.io.BigQueryDisposition.CREATE_NEVER
        )


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)
    run()
```

---

### Step 4: Execute Pipeline on Dataflow Runner

Create a temporary Cloud Storage bucket for pipeline staging:

```bash
gcloud storage buckets create gs://${PROJECT_ID}-dataflow-staging \
  --location=${REGION}
```

Submit the streaming pipeline job to Google Cloud Dataflow:

```bash
python3 stream_bookings_pipeline.py \
  --runner=DataflowRunner \
  --project=${PROJECT_ID} \
  --region=${REGION} \
  --temp_location=gs://${PROJECT_ID}-dataflow-staging/temp \
  --staging_location=gs://${PROJECT_ID}-dataflow-staging/staging \
  --subscription=projects/${PROJECT_ID}/subscriptions/booking-events-dataflow-sub \
  --silver_table=${PROJECT_ID}:offvia_silver.fact_bookings \
  --quarantine_table=${PROJECT_ID}:offvia_quarantine.poisoned_events \
  --job_name=offvia-streaming-ingestion-v1 \
  --max_num_workers=3 \
  --enable_streaming_engine
```

<div class="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-700/60 my-6 text-xs text-sky-950 dark:text-sky-200">
<strong>💡 In Plain English:</strong> Enabling <code>--enable_streaming_engine</code> moves state storage and watermark computation off your Compute Engine worker VMs and onto Google Cloud's managed streaming backend. This reduces worker CPU usage, minimizes memory pressure, and drastically cuts costs.
</div>

---

### Step 5: Synthetic Traffic & Chaos Injection

Now, let's test our pipeline resilience by publishing three distinct event payloads:
1. **A valid booking event.**
2. **A poison-pill event with a negative fare.**
3. **A corrupted, non-JSON payload.**

```bash
# 1. Publish Valid Event
gcloud pubsub topics publish booking-events-topic --message='{
  "booking_id": "BK-90210",
  "passenger_id": "PAX-4821",
  "flight_number": "OF-104",
  "origin": "JFK",
  "destination": "LHR",
  "fare": 749.50,
  "currency": "USD",
  "status": "CONFIRMED",
  "event_time": "2026-10-07T14:10:00Z"
}'

# 2. Publish Business Rule Violation (Negative Fare)
gcloud pubsub topics publish booking-events-topic --message='{
  "booking_id": "BK-90211",
  "passenger_id": "PAX-7712",
  "flight_number": "OF-208",
  "origin": "SFO",
  "destination": "HND",
  "fare": -50.00,
  "currency": "USD",
  "status": "CONFIRMED",
  "event_time": "2026-10-07T14:10:05Z"
}'

# 3. Publish Corrupt Poison-Pill (Truncated raw JSON)
gcloud pubsub topics publish booking-events-topic --message='{"booking_id": "BK-90212", "passenger_id": "PAX-9988", "unclosed_json...'
```

---

### Step 6: Verify Segregation in BigQuery

Within seconds, check all three destinations in BigQuery:

```sql
-- 1. Verify Bronze Raw Stream (Received ALL three messages unmodified)
SELECT 
  message_id, 
  publish_time, 
  SUBSTR(data, 1, 60) AS raw_preview
FROM `offvia-prod-data.offvia_bronze.raw_bookings`
ORDER BY publish_time DESC
LIMIT 5;

-- 2. Verify Silver Validated Table (Only BK-90210 exists!)
SELECT 
  booking_id, 
  flight_number, 
  origin_airport, 
  destination_airport, 
  fare_amount, 
  event_timestamp
FROM `offvia-prod-data.offvia_silver.fact_bookings`
WHERE booking_id = 'BK-90210';

-- 3. Verify Quarantine Dead-Letter Table (BK-90211 and Corrupt JSON were safely caught!)
SELECT 
  error_stage, 
  error_reason, 
  raw_payload, 
  received_timestamp
FROM `offvia-prod-data.offvia_quarantine.poisoned_events`
ORDER BY received_timestamp DESC;
```

#### What to Look For in the Output:
- **Zero Pipeline Crashes:** The Dataflow pipeline never restarts or halts execution.
- **Bronze Completeness:** All 3 events exist in `offvia_bronze.raw_bookings`.
- **Silver Integrity:** `offvia_silver.fact_bookings` strictly contains clean, validated records ready for analytical dashboards and revenue accounting.
- **Actionable Quarantine:** `offvia_quarantine.poisoned_events` shows exact root-cause diagnostics (`JSONDecodeError` and `Invalid fare amount: -50.0`), allowing engineering teams to fix bugs and replay quarantined payloads safely.

---

## 7. ⚠️ 3 Critical Production Gotchas

<div class="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 my-8 shadow-xs space-y-3">
<div class="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100 text-sm">
<span>⚠️</span> 1. The Python Dataflow Pickling Trap
</div>
<p class="text-xs text-amber-900 dark:text-amber-200 leading-relaxed m-0">
Never initialize non-serializable objects (such as database connection pools, gRPC stubs, or open HTTP sessions) in the constructor (<code>__init__</code>) of an Apache Beam <code>DoFn</code>. Beam serializes the DoFn object on your local machine and ships it across the network to Dataflow workers. If a class contains an open network socket, serialization crashes with a <code>TypeError: cannot pickle '_thread.lock' object</code>. Always initialize clients lazily inside the <code>setup()</code> or <code>start_bundle()</code> lifecycle methods.
</p>
</div>

<div class="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 my-8 shadow-xs space-y-3">
<div class="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100 text-sm">
<span>⚠️</span> 2. BigQuery Storage Write API Quota Backoff
</div>
<p class="text-xs text-amber-900 dark:text-amber-200 leading-relaxed m-0">
While the Storage Write API offers extraordinary scale, projects face default throughput limits per region (typically 50,000 requests/second). If your pipeline experiences sudden traffic spikes and receives <code>RESOURCE_EXHAUSTED</code> status codes, ensure your client or Beam pipeline utilizes exponential backoff with randomized jitter to prevent self-inflicted retry storms.
</p>
</div>

<div class="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 my-8 shadow-xs space-y-3">
<div class="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100 text-sm">
<span>⚠️</span> 3. Missing IAM Permissions on Pub/Sub BigQuery Subscriptions
</div>
<p class="text-xs text-amber-900 dark:text-amber-200 leading-relaxed m-0">
When configuring a direct Pub/Sub BigQuery subscription, granting <code>roles/bigquery.dataEditor</code> alone is insufficient if your destination table resides in another project or if column-level security is enforced. You must also grant <code>roles/bigquery.metadataViewer</code> to the Google-managed Pub/Sub service account (<code>service-PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com</code>), or messages will remain stuck in unacknowledged status.
</p>
</div>

---

## 8. Summary & Architecture Reference

Building a resilient streaming data platform on Google Cloud is not about adding complexity; it is about establishing distinct boundaries for buffering, transformation, and storage:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        OFFVIA PRODUCTION STREAMING PRINCIPLES                          │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ ARCHITECTURAL LAYER      │ SERVICE IMPLEMENTATION      │ PRODUCTION RESPONSIBILITY     │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Ingestion Buffer         │ Cloud Pub/Sub               │ Decouple producers instantly  │
│ Zero-Ops Bronze Landing  │ Direct BigQuery Sub         │ Immutable raw audit archive   │
│ Transformation & Schema  │ Dataflow (Apache Beam)      │ Validate, window & quarantine │
│ High-Speed Ingestion Sink│ BigQuery Storage Write API  │ Multiplexed analytical writes │
│ Serving Layer            │ Partitioned BigQuery Fact   │ Sub-second dashboard queries  │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

In **Part 5**, we will tackle data transformation orchestration at scale: building automated data quality gates, scheduled dbt pipelines, and lineage monitoring across Google Cloud Dataplex.

***

**Official References:**
- [Google Cloud Pub/Sub BigQuery Subscriptions Documentation](https://cloud.google.com/pubsub/docs/bigquery)
- [BigQuery Storage Write API Overview](https://cloud.google.com/bigquery/docs/write-api)
- [Apache Beam Python Streaming Guide](https://beam.apache.org/documentation/programming-guide/#windowing)
- [Google Cloud Dataflow Streaming Engine](https://cloud.google.com/dataflow/docs/guides/streaming-engine)
