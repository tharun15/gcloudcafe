---
title: "From Vertex AI to Gemini Enterprise Agent Platform: Build a Travel Intent Parser with Express Mode (Part 1)"
meta_title: "Gemini Enterprise Agent Platform Express Mode Guide | GCloud Cafe"
description: "Explore Google Cloud Gemini Enterprise Agent Platform Express Mode, compare API keys with ADC, and build a schema-constrained travel-intent parser in Python."
date: 2026-09-26
last_modified: 2026-09-26
image: "/images/gemini-agent-platform-express-mode.jpg"
categories: ["Google Cloud", "AI & ML", "Architecture"]
tags: ["Gemini Enterprise Agent Platform", "Express Mode", "Vertex AI", "Gemini 2.5 Flash", "Agent Studio", "Google Gen AI SDK", "Python", "TravelTech"]
author: tharun-vempati
featured: true
draft: false
series: "Building Offvia with Gemini Enterprise Agent Platform"
series_order: 1
---

# From Vertex AI to Gemini Enterprise Agent Platform: Build a Travel Intent Parser with Express Mode (Part 1)

Google Cloud's agent-focused platform direction makes it easier to transition from isolated foundational model calls to governed, multi-agent workflows. In this first guide of our 6-part series, you will use **Express Mode** and Python to transform an unformatted natural-language travel request into a strictly validated `TripIntent` application contract—without pretending that an LLM alone has verified flight schedules, seat inventories, or hotel cancellation policies.

> 📌 **Terminology & Grounding:** Google Cloud officially designates the platform as **Gemini Enterprise Agent Platform (formerly Vertex AI)**—a comprehensive platform for building, scaling, governing, and optimizing AI agents. In this series, we refer to it by its exact name, **Gemini Enterprise Agent Platform**, and explore its **Express Mode** sandbox alongside **Agent Studio** and the **Agent Development Kit (ADK)**.

---

## 🏢 The Case Study: Meet "Offvia"

**Offvia** is our digital travel and flight booking platform used throughout Gcloudcafe to illustrate enterprise architecture. 

In our previous deep dive on [GCP Data Engineering Storage Building Blocks](/blog/gcp-data-engineering-storage-building-blocks/), we engineered Offvia's analytical backbone: partitioning high-volume booking logs, clustering airline carrier codes, and isolating passenger PII with BigQuery authorized views.

Now, Offvia is evolving from a passive search-and-filter UI into an **autonomous AI Travel Concierge**. A traveler should be able to state:

> *"Find me a four-day tech-conference trip to Tokyo from San Francisco for no more than $2,200, departing next Wednesday. I need a non-stop flight, a four-star hotel near Shibuya with dedicated high-speed Wi-Fi, and free cancellation in case my visa decision is delayed."*

A production concierge must parse that goal, search authoritative flight and hotel Global Distribution Systems (GDS), enforce corporate spending rules, ask clarifying questions, and present bookable itineraries for human approval. Before writing complex multi-agent orchestration, we must validate the first critical building block: **converting unformatted prose into a deterministic, schema-constrained data contract.**

That is where **Express Mode** provides immediate value.

---

## 💡 What Is Express Mode on Gemini Enterprise Agent Platform?

> **Express Mode** is Google Cloud's Preview onboarding experience designed for zero-friction agent prototyping. It allows developers to test prompts, access visual **Agent Studio**, and obtain an API key for supported model requests without first setting up enterprise billing hierarchies, IAM bindings, or VPC service perimeters.

At publication time, Google Cloud documents Express Mode as providing:
* Instant console access to **Agent Studio** for visual prototyping and generated code inspection.
* API key authentication for supported [Generative AI methods](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output).
* A documented free tier for eligible new users with supported limits and models (such as `gemini-2.5-flash`).
* A seamless path to activate organizational billing when graduating to the full platform.

---

## ✈️ The Mental Model: Airport Fast-Track vs Full Customs Clearance

```text
+--------------------------------------+--------------------------------------+
| EXPRESS MODE                         | GEMINI ENTERPRISE AGENT PLATFORM     |
| Fast-Track Crew Lane                 | Full Operational Customs Clearance   |
+--------------------------------------+--------------------------------------+
| • Ephemeral, frictionless sandbox    | • Standard GCP project & billing org |
| • API key for supported model APIs   | • ADC, IAM roles, Workload Identity  |
| • Public internet endpoints only     | • VPC Service Controls & CMEK        |
| • Bounded rate limits for safety     | • Production SLAs & audit logging    |
| • Best for early prototypes & tests  | • Mandatory for customer data & live |
|                                      |   booking transactions               |
+--------------------------------------+--------------------------------------+
```

A fast-track crew gate lets airline pilots step quickly onto the tarmac for rapid turnaround. You wouldn't force a maintenance technician through a three-hour immigration queue just to inspect an engine turbine. 

Conversely, permanent immigration requires rigorous customs clearance, background checks, and identity audits. 

* **Express Mode is your Fast-Track Lane:** Use it to validate prompts, structure schemas, and prove concept viability in an afternoon.
* **Full Gemini Enterprise Agent Platform is your Customs Clearance:** Graduate to standard Google Cloud infrastructure before your agent connects to private databases, executes financial transactions, or handles sensitive traveler PII.

---

## 🏛️ The Architectural Shift: From Model Endpoints to Cognitive Loops

Traditional Vertex AI applications were primarily **model-centric**:

```text
User Prompt ──► [ Model Endpoint ] ──► Static Text / JSON Response
```

Modern Gemini Enterprise Agent Platform applications are **agent-centric**:

```text
User Goal
   │
   ▼
┌─────────────────────────────────────────────────────────────┐
│                 AGENT COGNITIVE ENGINE                      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ 🧭 Reasoning & Planning (Gemini Flash Engine)       │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ State Loop                   │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │ 🛠️ Orchestration & Memory (Google ADK / Studio)     │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ Tool Discovery Protocol      │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │ 🔌 Remote Toolsets (Model Context Protocol - MCP)   │   │
│   │   • BigQuery Lakehouse   • Airline GDS APIs         │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
   │
   ▼
Validated Contract, Tool Result, or Clarification Request
```

The platform unifies four key primitives:
1. **Agent Studio:** Visual playground to test prompts, attach tools, and export configurations directly into code.
2. **Agent Development Kit (ADK):** Open-source code-first framework in Python, TypeScript, Go, and Java for building deterministic multi-agent state loops.
3. **Agent Garden:** Enterprise blueprints for common workflows (retrieval-augmented generation, financial advisory, and customer support).
4. **Gemini Enterprise Agent Platform MCP:** Anthropic's [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) specification for exposing enterprise databases and tools securely.

---

## 📊 Express Mode vs Full Gemini Enterprise Agent Platform: Feature Comparison

| Capability | Express Mode (Preview) | Full Gemini Enterprise Agent Platform |
| :--- | :--- | :--- |
| **Primary Purpose** | Fast prototyping, prompt iteration, schema validation | Governed production deployment and enterprise operations |
| **Setup Overhead** | **< 60 seconds** (instant sandbox project) | Standard Cloud Identity, Organization, IAM, and Billing |
| **Authentication** | Lightweight API Key for supported generative methods | [Application Default Credentials (ADC)](https://cloud.google.com/docs/authentication/application-default-credentials), IAM service accounts, OAuth2 |
| **Caller Identity** | Tracks project usage; does not identify caller | Authenticated principal with granular IAM role evaluation |
| **Available Models** | Documented subset (e.g. `gemini-2.5-flash`) | Full Google, partner, and open-weight catalog (200+ models) |
| **Enterprise Security** | Public API endpoints with basic rate limits | VPC Service Controls, Cloud Audit Logs, CMEK, Private Endpoints |
| **Data Connectivity** | Google Drive & basic public integrations | BigQuery Lakehouse, Cloud SQL, Cloud Spanner, Remote MCP |

---

## 🔍 Four Common Questions Answered

### 1. Can Express Mode call APIs from local Python code?
**Yes.** Express Mode provisions an authenticated sandbox project. The generated API key works immediately with the official [`google-genai`](https://github.com/googleapis/python-genai) SDK from local scripts, virtual environments, Docker containers, or notebooks.

### 2. Is an API key a production identity?
**No.** An API key authenticates a project for billing and quota, but it cannot represent an individual user, service account, or workload identity. Customer-facing services should always use ADC or Workload Identity Federation with least-privilege IAM roles (`roles/aiplatform.user`).

### 3. Does a valid JSON schema guarantee factual travel data?
**No.** Schema validation via Pydantic guarantees **syntactic structure** (e.g. that a value is a 3-letter string), not **semantic correctness**. An LLM can emit `ZZZ` as an airport code or invent a $40 flight to Tokyo that passes JSON schema validation. Authoritative domain validation must occur in downstream tool pipelines.

### 4. Can an Express Mode API key access BigQuery or IAM-protected MCP tools?
**No.** Google Cloud services like BigQuery enforce Google Cloud IAM permissions. An Express Mode model API key cannot be passed as a bearer token to query internal enterprise databases. Protected resources require OAuth2-based credentials or service-account impersonation.

---

## 🔐 Authentication Decision Matrix

```text
Is this a local, disposable Express Mode experiment?
    │
    ├── Yes ──► Use the generated Express Mode API Key via os.getenv("GEMINI_API_KEY")
    │
    └── No  ──► Does the workload run in or connect to Google Cloud?
                     │
                     ├── Local Workstation  ──► gcloud auth application-default login (ADC)
                     ├── Cloud Run / GKE    ──► Attached Workload Identity (No service account keys)
                     └── AWS / Azure / On-Prem ──► Workload Identity Federation
```

---

## 🧪 Hands-On Lab: Build Offvia's Travel-Intent Parser

Our intent parser has a strictly defined boundary:
1. Parse unformatted prose into typed fields.
2. Separate raw traveler inputs from authoritative domain data.
3. Preserve the traveler's original date expression alongside normalized dates.
4. Record operational telemetry (request ID, model ID, latency, validation status).

### Step 1: Initialize the Local Environment
```bash
mkdir -p ~/offvia-agent-platform && cd ~/offvia-agent-platform
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade google-genai pydantic tzdata
```

### Step 2: Configure Your Express Mode Credentials
```bash
export GEMINI_API_KEY="your-express-mode-api-key"
export GEMINI_MODEL="gemini-2.5-flash"
test -n "$GEMINI_API_KEY" && echo "GEMINI_API_KEY is available"
```

### Step 3: Create `offvia_intent_parser.py`

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Offvia Travel Concierge -- Schema-Constrained Intent Parser (Part 1)
Bootstrapped on Google Cloud Gemini Enterprise Agent Platform Express Mode.
"""

from __future__ import annotations

import os
import sys
import logging
from datetime import date, datetime
from time import perf_counter
from uuid import uuid4
from zoneinfo import ZoneInfo
from typing import List, Optional

from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError, field_validator

# Configure structured telemetry logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("offvia.intent_parser")

MODEL_ID = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
REFERENCE_TIMEZONE = os.getenv("OFFVIA_TIMEZONE", "Europe/Rome")


# 1. Define Typed Sub-Schemas
class HotelCriteria(BaseModel):
    """Hotel preferences extracted from traveler requests."""
    preferred_area: Optional[str] = Field(default=None, description="Neighborhood or district, e.g. Shibuya")
    min_star_rating: Optional[float] = Field(default=None, ge=1.0, le=5.0, description="Minimum hotel star rating")
    required_amenities: List[str] = Field(default_factory=list, description="Mandatory amenities like high-speed Wi-Fi")
    free_cancellation_required: bool = Field(default=False, description="Whether free cancellation is mandatory")


class TripIntent(BaseModel):
    """
    Normalized travel contract passed to downstream Offvia services.
    Enforces clear boundaries: extraction vs domain verification.
    """
    # Explicit separation of raw user input vs authoritative resolution
    origin_city: str = Field(description="Origin city mentioned by user, e.g. San Francisco")
    destination_city: str = Field(description="Destination city mentioned by user, e.g. Tokyo")
    supplied_origin_iata: Optional[str] = Field(
        default=None, 
        description="Populate ONLY if the traveler explicitly specified a 3-letter IATA code (e.g. SFO)"
    )
    airport_resolution_required: bool = Field(
        default=True, 
        description="Flag for downstream GDS tools to resolve multi-airport metro areas (e.g. Tokyo -> HND, NRT)"
    )
    
    trip_duration_days: int = Field(ge=1, le=60, description="Total trip duration in days")
    
    # Preserve original expression for auditing alongside resolved date
    departure_date_expression: Optional[str] = Field(
        default=None, 
        description="Original unparsed date phrasing, e.g. 'next Wednesday'"
    )
    departure_date: Optional[str] = Field(
        default=None, 
        description="Resolved departure date in YYYY-MM-DD format based on reference context"
    )
    
    budget_limit: float = Field(gt=0, description="Maximum total trip budget in stated currency")
    budget_currency: str = Field(description="Three-letter currency code, e.g. USD, EUR")
    non_stop_required: bool = Field(default=False, description="Whether direct flights are strictly required")
    
    hotel_preferences: HotelCriteria
    special_constraints: List[str] = Field(default_factory=list, description="Specific passenger rules or visa needs")
    unresolved_questions: List[str] = Field(
        default_factory=list, 
        description="Ambiguous points that require clarification turns"
    )

    @field_validator("budget_currency")
    @classmethod
    def validate_currency_format(cls, value: str) -> str:
        code = value.strip().upper()
        if len(code) != 3 or not code.isalpha():
            raise ValueError("budget_currency must be a 3-letter currency code (syntax validation)")
        return code

    @field_validator("departure_date")
    @classmethod
    def validate_date_format(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        try:
            date.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("departure_date must be in valid YYYY-MM-DD format") from exc
        return value


# 2. Resilient Client Factory
def build_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set. Export your key first.")

    return genai.Client(
        vertexai=True,
        api_key=api_key,
        http_options=types.HttpOptions(
            retry_options=types.HttpRetryOptions(
                attempts=4,
                initial_delay=1.0,
                max_delay=8.0,
            )
        ),
    )


# 3. Intent Parser Function
def parse_traveler_request(
    client: genai.Client,
    request_text: str,
    reference_date: date,
    reference_timezone: str,
) -> TripIntent:
    system_instruction = (
        "You are the intent ingestion component for Offvia, an AI travel platform. "
        "Extract only facts stated by the traveler. Do not invent flight availability, "
        "prices, or booking confirmations. If the user states a city rather than an airport code, "
        "leave supplied_origin_iata as null and set airport_resolution_required to true. "
        "Capture both the raw date phrasing in departure_date_expression and the calculated "
        "date in departure_date using the supplied reference date context."
    )

    prompt_payload = (
        f"Reference Date: {reference_date.isoformat()}\n"
        f"Reference Timezone: {reference_timezone}\n\n"
        f"Traveler Query:\n{request_text}"
    )

    response = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt_payload,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=TripIntent,
        ),
    )

    if not response.text:
        raise RuntimeError("Received empty response from Gemini model.")

    return TripIntent.model_validate_json(response.text)


# 4. Main Execution & Telemetry
def main():
    request_id = str(uuid4())[:8]
    sample_request = (
        "Find me a four-day tech-conference trip to Tokyo from San Francisco for no more than "
        "$2,200, departing next Wednesday. I need a non-stop flight, a four-star hotel near "
        "Shibuya with dedicated high-speed Wi-Fi, and free cancellation in case my visa decision is delayed."
    )

    ref_date = datetime.now(ZoneInfo(REFERENCE_TIMEZONE)).date()
    logger.info("Initiating request [%s] using model [%s]", request_id, MODEL_ID)

    client = build_client()
    start_time = perf_counter()

    try:
        intent = parse_traveler_request(
            client=client,
            request_text=sample_request,
            reference_date=ref_date,
            reference_timezone=REFERENCE_TIMEZONE,
        )
        elapsed_ms = (perf_counter() - start_time) * 1000

        logger.info("Request [%s] parsed successfully in %.0f ms", request_id, elapsed_ms)
        print("\n=== Offvia Parsed Travel Intent ===")
        print(intent.model_dump_json(indent=2))

    except ValidationError as e:
        logger.error("Request [%s] failed Pydantic schema validation: %s", request_id, e)
        sys.exit(1)
    except Exception as e:
        logger.error("Request [%s] encountered runtime execution error: %s", request_id, e)
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    main()
```

### Step 4: Sample Output
```json
{
  "origin_city": "San Francisco",
  "destination_city": "Tokyo",
  "supplied_origin_iata": null,
  "airport_resolution_required": true,
  "trip_duration_days": 4,
  "departure_date_expression": "next Wednesday",
  "departure_date": "2026-09-30",
  "budget_limit": 2200.0,
  "budget_currency": "USD",
  "non_stop_required": true,
  "hotel_preferences": {
    "preferred_area": "Shibuya",
    "min_star_rating": 4.0,
    "required_amenities": [
      "dedicated high-speed Wi-Fi"
    ],
    "free_cancellation_required": true
  },
  "special_constraints": [
    "Japanese visa decision might be delayed"
  ],
  "unresolved_questions": []
}
```

---

## 🛡️ Production-Readiness & What Still Has to Be Built

Capturing a typed `TripIntent` object is the entrance gate to an agent, not the complete concierge. A production deployment requires several subsequent architectural layers:

```text
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  1. Intent Ingestion   │ ───► │ 2. Domain Verification │ ───► │  3. Multi-Agent Team   │
│  (Pydantic Contract)   │      │ (IATA / Currency / GDS)│      │  (Supervisor & Agents) │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                             │
┌────────────────────────┐      ┌────────────────────────┐                   ▼
│  5. Human Confirmation │ ◄─── │ 4. Remote MCP Toolsets │ ◄─────────────────┘
│  (Booking Approval)    │      │ (BigQuery & Real APIs) │
└────────────────────────┘      └────────────────────────┘
```

1. **Deterministic Domain Lookup:** As modeled in our schema, when a user says "Tokyo", downstream code queries authoritative airport databases to expand Tokyo into `HND` and `NRT`. Do not rely on LLM memory for canonical reference data.
2. **Quota Handling & Retries:** Express Mode projects have lower RPM quotas. Production systems must combine client-side exponential backoff with request-rate limiting and circuit breakers.
3. **Identity & Secret Security:** Never commit API keys. Migrate production workers to Google Cloud Workload Identity Federation so no static secrets ever touch source code.
4. **Human Approval Gates:** Agents should propose travel bookings; they should never autonomously charge corporate credit cards without an explicit human-in-the-loop confirmation turn.

---

## 🏁 Summary: Part 1 Architecture

| Architectural Layer | Part 1 Prototype (Express Mode) | Production Target (Full Platform) |
| :--- | :--- | :--- |
| **Cloud Environment** | Google Cloud Express Mode Sandbox | Standard GCP Organization with Resource Hierarchy |
| **Authentication** | Ephemeral API Key in environment variable | ADC with Workload Identity or Service Account Impersonation |
| **Reasoning Model** | `gemini-2.5-flash` (Express Preview) | Documented production models (e.g. Gemini Flash checkpoints) |
| **Schema Contract** | Strict JSON Schema via Pydantic V2 | Versioned Protobuf / JSON event bus across microservices |
| **Domain Validation** | Syntax-level format checks | Authoritative airline GDS and airport reference services |
| **Observability** | Local request ID and latency logging | Cloud Trace, Cloud Logging, and OpenTelemetry instrumentation |

---

## 🚀 What's Next in Part 2?

In **Part 2: Visual Prototyping in Agent Studio — Designing the Offvia Concierge**, we will:
* Recreate our extraction instructions visually in **Agent Studio**.
* Compare prompt variations and inspect the underlying code exported by the studio.
* Configure built-in tools and evaluate token consumption across complex multi-city prompts.
* Prepare our contract for **Google ADK (`google-adk`)** code-first orchestration.

---

## 📖 Official Documentation & Verified Standards

* [Google Cloud Gemini Enterprise Overview](https://cloud.google.com/products/gemini)
* [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
* [Vertex AI Agent Builder & Generative AI Overview](https://cloud.google.com/generative-ai-app-builder/docs/introduction)
* [Google Cloud Application Default Credentials (ADC) Guide](https://cloud.google.com/docs/authentication/application-default-credentials)
* [Structured Output & Schema Control with Gemini](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output)
* [Google GenAI Python SDK Documentation](https://github.com/googleapis/python-genai)
* [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/)
* [Pydantic V2 Documentation](https://docs.pydantic.dev/)
