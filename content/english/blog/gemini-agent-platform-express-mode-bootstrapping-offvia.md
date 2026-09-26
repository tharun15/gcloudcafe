---
title: "Vertex AI Is Now Agent Platform: Build Your First App with Express Mode (Part 1)"
meta_title: "Agent Platform Express Mode Hands-On Guide | GCloud Cafe"
description: "Explore Google Cloud Agent Platform Express Mode, compare API keys with ADC, and build a schema-constrained travel-intent parser in Python."
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

# Vertex AI Is Now Agent Platform: Build Your First App with Express Mode (Part 1)

On April 22, 2026, Google Cloud announced **Gemini Enterprise Agent Platform** as the evolution of Vertex AI: a unified platform for building, scaling, governing, and optimizing AI agents. It retains the model selection, model development, and machine-learning capabilities associated with Vertex AI while adding a stronger focus on agent integration, orchestration, deployment, evaluation, security, and operations.

This is more than a navigation-menu rename, but it is not a deletion of everything that came before. Existing machine-learning and generative-AI capabilities remain part of the broader platform. The important change is the platform's center of gravity: from calling individual models to operating complete agentic systems.

> **Reference architecture:** Offvia is a fictional travel platform used throughout this series to explain production AI and data-engineering patterns.

In our previous deep dive on [GCP Data Engineering Storage Building Blocks](/blog/gcp-data-engineering-storage-building-blocks/), we designed Offvia's analytical foundation: partitioned booking data, clustered airline identifiers, and protected passenger information with BigQuery authorized views.

Now Offvia has a new objective: transform a conventional search-and-filter experience into an AI Travel Concierge.

A traveler should be able to say:

> *"Find me a four-day tech-conference trip to Tokyo from San Francisco for no more than $2,200. I need a non-stop flight, a four-star hotel near Shibuya with high-speed Wi-Fi, and free cancellation in case my visa is delayed."*

A complete concierge would eventually need to interpret that goal, search authoritative flight and hotel systems, apply policy constraints, ask for missing information, and present options for approval. Before building all of that, however, we need a fast way to validate the first component: converting an unstructured request into a reliable application contract.

That is where Agent Platform in Express Mode is useful.

In Part 1 of this series, we will:
1. Explain what changed from Vertex AI to Agent Platform.
2. Compare Express Mode with the full Agent Platform experience.
3. Clarify API-key authentication versus Application Default Credentials (ADC).
4. Build a schema-constrained Offvia travel-intent parser in Python.
5. Define the boundary between a prototype and a production agent.

---

## 💡 What Is Gemini Enterprise Agent Platform in Express Mode?

> **Gemini Enterprise Agent Platform in Express Mode** is a Preview onboarding experience that lets eligible developers start experimenting with core generative-AI capabilities without first configuring a conventional Google Cloud organization, project hierarchy, and billing setup. It provides core Agent Studio features and an API key for supported Agent Platform APIs. Eligible new Google Cloud users signing up with a `@gmail.com` account can use a no-cost tier for up to 90 days, subject to the documented quotas and feature limits.

The words *core* and *Preview* matter. Express Mode is designed for learning and prototyping; it does not expose every service, data source, networking option, identity control, model, or quota available in a standard Google Cloud environment.

At the time of publication, Google documents the Express Mode free tier as providing:
* Core Agent Studio capabilities for testing prompts and obtaining generated code.
* API-key authentication for supported model requests.
* A limited set of available models and rate limits.
* Google Drive as the documented data source in the free-tier comparison.
* A path to activate billing and transition to the full Google Cloud experience.

Model availability changes over time, so always check the current Express Mode model table before selecting a model in code.

---

## ✈️ The Mental Model: Airport Fast-Track vs Full Customs Clearance

Consider Express Mode and full Agent Platform as two different routes through an airport:

```text
+--------------------------------------+--------------------------------------+
| EXPRESS MODE                         | FULL AGENT PLATFORM                  |
| Fast-track lane                      | Full operational clearance           |
+--------------------------------------+--------------------------------------+
| Simplified signup                    | Standard Cloud project and billing   |
| API key for supported requests       | ADC, workload identity, IAM          |
| Core generative-AI features          | Full Google Cloud service access     |
| Limited models, quotas, data sources | Broader models, quotas, integrations |
| Best for learning and prototypes     | Best for governed production systems |
+--------------------------------------+--------------------------------------+
```

A fast-track lane removes unnecessary setup when your immediate goal is to validate an idea. It does not replace the controls required for an application that accesses customer records, processes payments, invokes privileged tools, or operates under formal compliance requirements.

* **Express Mode is the fast-track lane:** It helps you test prompts and supported APIs quickly without corporate bureaucracy.
* **Full Agent Platform is the operational environment:** It gives you standard Google Cloud resource management, identities, networking, data services, observability, and governance controls.

> 💡 **Practical rule:** Prototype the interaction and data contract in Express Mode. Move to a standard Google Cloud project before the agent requires private enterprise data, durable production resources, identity-aware tool calls, or customer-facing service guarantees.

---

## 🏛️ The Architectural Shift: From Model Calls to Agent Systems

Vertex AI already supported predictive ML, generative AI, and agent-building capabilities. The new Agent Platform umbrella makes the end-to-end agent lifecycle the primary organizing principle.

A model-centric application often looks like this:

```text
User prompt
    |
    v
Model endpoint
    |
    v
Text or JSON response
```

An agentic application introduces an execution loop and operational controls:

```text
User goal
    |
    v
Agent orchestration
    |
    +--> Model reasoning and planning
    |
    +--> Tool selection and invocation
    |
    +--> State, sessions, and memory
    |
    +--> Enterprise APIs and data systems
    |
    +--> Evaluation, observability, identity, and policy
    |
    v
Result, clarification, or approval request
```

The broader Agent Platform brings several building blocks under one product direction:

### 1. Agent Studio
Agent Studio provides a visual environment for creating and testing prompts, experimenting with supported models, and obtaining equivalent code. In Express Mode, it is the fastest place to validate an interaction before integrating it into an application.

### 2. Agent Development Kit (ADK)
The open-source Agent Development Kit is the code-first framework for building agents and multi-agent systems. Google currently documents ADK support for Python, TypeScript, Go, and Java. It supports tools, workflow agents, dynamic routing, evaluation, and deployment targets such as Agent Runtime, Cloud Run, and Google Kubernetes Engine.

### 3. Agent Garden
Agent Garden is a curated library of prebuilt agent samples. These templates can accelerate common patterns such as retrieval-augmented generation, research synthesis, and grounded customer support. Some Agent Garden capabilities are Preview and require a standard project and region configuration.

### 4. Models and Model Garden
Agent Platform includes Google's first-party models as well as partner and open models available through Model Garden. Google describes the broader platform as providing access to more than 200 models across those categories. Express Mode exposes only a subset, so its availability table remains the source of truth for an Express prototype.

### 5. Tools and Model Context Protocol (MCP)
MCP standardizes how an AI application discovers and invokes external capabilities. Google Cloud provides remote MCP servers and toolsets for supported services, but access still depends on the target service's authentication and authorization requirements. An Express Mode model API key does not automatically grant access to IAM-protected resources such as BigQuery datasets.

### 6. Production Operations and Governance
A production agent needs more than a successful prompt. The full platform includes capabilities for deployment, sessions, memory, evaluation, observability, identity, traffic management, content security, and governance. The exact controls and service-level commitments depend on the services and configurations you select; there is no universal "unlimited scale" or single blanket SLA for every agent architecture.

---

## 📊 Express Mode vs Full Agent Platform

| Capability | Express Mode | Full Agent Platform on Google Cloud |
| :--- | :--- | :--- |
| **Primary purpose** | Learning, prompt experiments, prototypes, early proof of value | Governed development, integration, deployment, and production operations |
| **Launch stage** | Preview | Platform-wide; individual features can have different launch stages |
| **Signup and setup** | Simplified Express signup; free tier available to eligible new users for up to 90 days | Standard project, billing, organization, and resource configuration |
| **Authentication** | API key for supported methods such as `generateContent` and `streamGenerateContent` | ADC, user or workload identities, service-account impersonation, and Workload Identity Federation; API keys remain limited to supported methods |
| **Caller identity** | An API key associates usage with a project but does not identify the caller | OAuth-based credentials identify a principal and participate in IAM authorization |
| **Services** | Basic supported generative-AI services | All enabled Google Cloud services, including the full Agent Platform feature set |
| **Data sources** | Google Drive in the documented free-tier comparison | Data sources and services available in the configured Google Cloud environment |
| **Models** | A documented subset with Express-specific limits | Broader Google, partner, and open-model catalog through Model Garden |
| **Quota** | Free-tier or Express-specific limits; availability can be dynamic | Standard pay-as-you-go quotas, with service-specific scaling options |
| **Networking and security** | Simplified experience with fewer enterprise controls | IAM, Cloud Audit Logs, VPC Service Controls, Private Service Connect, CMEK where supported, and organization policies |
| **Recommended use** | Local experiments and disposable prototypes | Customer-facing or enterprise workloads with operational and compliance requirements |

---

## 🚨 Five Common Misconceptions

### Misconception 1: "Express Mode is only a UI demo."
**Reality:** Express Mode includes an API key that can be used with supported Agent Platform APIs and the official `google-genai` SDK. You can call a supported model from a local Python application, a notebook, or another development environment.

### Misconception 2: "An API key is equivalent to a production identity."
**Reality:** An API key associates a request with a project for quota and billing, but it does not establish the identity of the caller. Production workloads should normally use ADC backed by an attached workload identity, service-account impersonation, or Workload Identity Federation. Never place an API key in browser JavaScript, a mobile binary, or a public repository.

### Misconception 3: "The Agent Platform change means every Vertex AI integration must be rewritten immediately."
**Reality:** Google describes Agent Platform as the evolution of Vertex AI, retaining its model and ML capabilities while adding a broader agent lifecycle. That does not eliminate the need to review release notes, deprecations, model lifecycle notices, and API migration guidance for the specific services you use.

### Misconception 4: "Structured output eliminates hallucination."
**Reality:** A response schema can constrain the shape and types of the returned JSON. It does not prove that an airport code, date, hotel claim, price, or policy is factually correct. Schema validation is one layer; domain validation against authoritative systems is another.

### Misconception 5: "An Express Mode API key automatically unlocks BigQuery and every MCP server."
**Reality:** IAM-protected Google Cloud services require an authenticated and authorized principal. Google Cloud MCP servers that act on protected resources generally require OAuth-based credentials, ADC, or an agent identity with the necessary roles. Express Mode is not a shortcut around IAM.

---

## 🔐 Authentication Deep Dive: API Key vs ADC

The right authentication method depends on where the code runs and what the call must prove:

```text
Is this a disposable Express Mode prototype?
    |
    +-- Yes --> Use the generated Express Mode API key securely.
    |
    +-- No --> Does the workload run in or connect to Google Cloud?
                    |
                    +-- Local development --> ADC with user credentials or
                    |                         service-account impersonation
                    |
                    +-- Google Cloud runtime --> Attached workload identity
                    |
                    +-- Other cloud/on-prem --> Workload Identity Federation
```

| Property | Express Mode API key | ADC / OAuth-based Google Cloud credentials |
| :--- | :--- | :--- |
| **What it represents** | Project association for supported API usage | A user, workload, service account, or federated principal |
| **Authorization model** | Limited to APIs and methods that accept the key | IAM roles and permissions evaluated for the principal |
| **Best fit** | Local Express Mode prototype | Local enterprise development and production workloads |
| **Storage** | Environment variable or secret store; never source control | Discovered automatically from the local or runtime environment |
| **Rotation** | Manual key rotation and restriction | Short-lived tokens refreshed by the authentication libraries |
| **Audit attribution** | Does not establish caller identity | Requests can be attributed to the authenticated principal where audit logging applies |
| **Browser/mobile use** | Do not embed an unrestricted server-side key | Use an appropriate backend or end-user OAuth flow instead |

For local development against a standard Google Cloud project, ADC is commonly initialized with:

```bash
gcloud auth application-default login
```

For production on Google Cloud, prefer an attached service account or newer agent/workload identity mechanism rather than downloading a long-lived service-account key file.

---

## ⚠️ Production Gotchas to Address Early

1. **Express Mode is Preview:** Preview services can change and may have limited support. Avoid making a production availability commitment based only on an Express prototype.
2. **Quota errors are normal failure modes:** Express Mode has lower or dynamic limits depending on the model. Handle `429 RESOURCE_EXHAUSTED` and transient server errors with bounded exponential backoff and jitter. The sample below configures SDK retries, but production systems should also apply concurrency limits and monitor their quota usage.
3. **API keys leak easily:** Read the key from an environment variable, restrict it where supported, rotate it if exposed, and enable secret scanning in the repository. A `.gitignore` file helps, but it does not remove a secret already committed to Git history.
4. **Model availability changes:** Do not bury the model ID throughout the codebase. Store it in configuration and verify that it remains available in your selected environment and region.
5. **Relative dates require an explicit reference:** "Next Wednesday" is ambiguous without a reference date and timezone. Pass both into the extraction request, store normalized dates, and preserve the original phrase when further clarification might be required.
6. **A valid schema is not a valid booking:** An LLM can return syntactically valid airport codes and still choose an unsuitable airport. Validate codes against an airport reference table, verify routes through a flight provider, and obtain live prices and policies from authoritative tools before presenting bookable options.

---

## 🧪 Hands-On Lab: Build Offvia's Travel-Intent Parser

This lab deliberately builds an intent parser, not a fully autonomous travel agent. Its responsibility is narrow:
* Accept a natural-language travel request.
* Normalize the request into a typed schema.
* Surface unresolved information instead of silently inventing it.
* Hand the validated contract to later workflow stages.

### Why This Lab Uses `gemini-2.5-flash`
The current Express Mode documentation explicitly lists `gemini-2.5-flash` as an available model. The separate Gemini 3.8 Flash guide shows a standard Agent Platform client initialized with a project ID and global location. Because the two experiences have different availability and initialization requirements, this Express Mode lab uses `gemini-2.5-flash`.

After upgrading to a standard project, you can evaluate `gemini-3.8-flash` using its documented client configuration and API rules. Do not assume that a model available in the full platform is automatically available in Express Mode.

### Step 1: Create a Local Python Environment
```bash
mkdir -p ~/offvia-agent-platform
cd ~/offvia-agent-platform

python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install --upgrade google-genai pydantic tzdata
```

On Windows PowerShell, activate the environment with:
```powershell
.\.venv\Scripts\Activate.ps1
```

### Step 2: Configure the Express Mode API Key
Retrieve the generated API key from the credentials page in your Express Mode environment, then expose it only to the current shell session.

Linux, macOS, or WSL:
```bash
export GEMINI_API_KEY="replace-with-your-express-mode-api-key"
export GEMINI_MODEL="gemini-2.5-flash"

test -n "$GEMINI_API_KEY" && echo "GEMINI_API_KEY is available"
```

Windows PowerShell:
```powershell
$env:GEMINI_API_KEY = "replace-with-your-express-mode-api-key"
$env:GEMINI_MODEL = "gemini-2.5-flash"
```

> 🔒 **Security Notice:** Do not commit the key to Git or paste it into screenshots, issue trackers, or frontend code.

### Step 3: Create `offvia_intent_parser.py`
```python
#!/usr/bin/env python3
"""Schema-constrained travel-intent parsing for the fictional Offvia platform."""

from __future__ import annotations

import os
from datetime import date, datetime
from time import perf_counter
from zoneinfo import ZoneInfo

from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError, field_validator

MODEL_ID = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
REFERENCE_TIMEZONE = os.getenv("OFFVIA_TIMEZONE", "Europe/Rome")


class HotelCriteria(BaseModel):
    """Hotel preferences explicitly stated or inferred from the request."""

    preferred_area: str | None = Field(
        default=None,
        description="Requested neighborhood or district, such as Shibuya.",
    )
    min_star_rating: float | None = Field(
        default=None,
        ge=1,
        le=5,
        description="Minimum hotel star rating, when supplied.",
    )
    required_amenities: list[str] = Field(
        default_factory=list,
        description="Amenities that the traveler treats as mandatory.",
    )
    free_cancellation_required: bool = Field(
        default=False,
        description="Whether a free-cancellation policy is mandatory.",
    )


class TripIntent(BaseModel):
    """Normalized booking intent passed to downstream Offvia services."""

    origin_airport: str = Field(
        description="Three-letter origin IATA airport or metropolitan-area code."
    )
    destination_city: str = Field(
        description="Destination city as understood from the request."
    )
    destination_airports: list[str] = Field(
        min_length=1,
        description=(
            "Plausible three-letter destination IATA airport or metropolitan-area "
            "codes. Include multiple codes when the city has multiple major airports."
        ),
    )
    trip_duration_days: int = Field(
        ge=1,
        le=60,
        description="Total requested trip duration in calendar days.",
    )
    departure_date: str | None = Field(
        default=None,
        description="Resolved departure date in YYYY-MM-DD format, when supplied.",
    )
    budget_limit: float = Field(
        gt=0,
        description="Maximum total trip budget in the stated currency.",
    )
    budget_currency: str = Field(
        description="ISO 4217 currency code, such as USD or EUR."
    )
    non_stop_required: bool = Field(
        default=False,
        description="Whether a non-stop flight is a strict requirement.",
    )
    hotel_preferences: HotelCriteria
    special_constraints: list[str] = Field(
        default_factory=list,
        description="Other material constraints, such as visa or accessibility needs.",
    )
    unresolved_questions: list[str] = Field(
        default_factory=list,
        description="Questions that must be answered before a reliable search or booking.",
    )

    @field_validator("origin_airport")
    @classmethod
    def validate_origin_iata(cls, value: str) -> str:
        normalized = value.strip().upper()
        if len(normalized) != 3 or not normalized.isalpha():
            raise ValueError("origin_airport must be a three-letter IATA code")
        return normalized

    @field_validator("destination_airports")
    @classmethod
    def validate_destination_iata(cls, values: list[str]) -> list[str]:
        normalized: list[str] = []
        for value in values:
            code = value.strip().upper()
            if len(code) != 3 or not code.isalpha():
                raise ValueError(
                    "Every destination_airports entry must be a three-letter IATA code"
                )
            if code not in normalized:
                normalized.append(code)
        return normalized

    @field_validator("departure_date")
    @classmethod
    def validate_departure_date(cls, value: str | None) -> str | None:
        if value is None:
            return None
        try:
            date.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("departure_date must use YYYY-MM-DD format") from exc
        return value

    @field_validator("budget_currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        normalized = value.strip().upper()
        if len(normalized) != 3 or not normalized.isalpha():
            raise ValueError("budget_currency must be a three-letter currency code")
        return normalized


def build_client() -> genai.Client:
    """Create an Express Mode client and configure bounded transient retries."""

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Export the Express Mode API key first."
        )

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


def parse_traveler_request(
    client: genai.Client,
    natural_language_request: str,
    reference_date: date,
    reference_timezone: str,
) -> TripIntent:
    """Convert traveler prose into a validated TripIntent object."""

    system_instruction = (
        "You are the intent-ingestion component for Offvia, a fictional travel "
        "application. Extract only information supported by the traveler request. "
        "Do not claim that a flight, hotel, price, or policy is available. When a "
        "destination city has multiple major airports, include each plausible code. "
        "Resolve relative travel dates using the supplied reference date and timezone. "
        "Put missing information that blocks a reliable search into unresolved_questions."
    )

    contents = (
        f"Reference date: {reference_date.isoformat()}\n"
        f"Reference timezone: {reference_timezone}\n\n"
        f"Traveler request:\n{natural_language_request}"
    )

    response = client.models.generate_content(
        model=MODEL_ID,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=TripIntent,
        ),
    )

    if not response.text:
        raise RuntimeError("The model returned an empty response.")

    return TripIntent.model_validate_json(response.text)


def main() -> None:
    traveler_request = (
        "Hey Offvia, I need a four-day tech-conference trip to Tokyo from "
        "San Francisco, departing next Wednesday. My total limit is $2,200. "
        "I can only take a non-stop flight. I want a four-star hotel near "
        "Shibuya with dedicated high-speed Wi-Fi and free cancellation because "
        "my Japanese visa decision might be delayed."
    )

    client = build_client()
    started = perf_counter()

    try:
        intent = parse_traveler_request(
            client=client,
            natural_language_request=traveler_request,
            reference_date=datetime.now(ZoneInfo(REFERENCE_TIMEZONE)).date(),
            reference_timezone=REFERENCE_TIMEZONE,
        )
    except ValidationError as exc:
        raise RuntimeError(f"Model output failed schema validation: {exc}") from exc
    finally:
        client.close()

    elapsed_ms = (perf_counter() - started) * 1_000

    print("Successfully parsed Offvia travel intent:\n")
    print(intent.model_dump_json(indent=2))
    print(f"\nAPI round-trip and validation: {elapsed_ms:,.0f} ms")


if __name__ == "__main__":
    main()
```

### Step 4: Run the Parser
```bash
python3 offvia_intent_parser.py
```

A representative response for an execution with reference date September 26, 2026:

```json
{
  "origin_airport": "SFO",
  "destination_city": "Tokyo",
  "destination_airports": [
    "HND",
    "NRT"
  ],
  "trip_duration_days": 4,
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

### What the Parser Achieved
1. **Schema-constrained output:** The response must conform to the JSON structure expected by the application, and Pydantic validates it again locally.
2. **Explicit date context:** The request includes a reference date and timezone, allowing the phrase "next Wednesday" to be normalized deterministically.
3. **Multiple-airport handling:** Tokyo is not collapsed into one supposedly definitive airport. The contract can carry both `HND` and `NRT` into the search stage.
4. **Clear system boundary:** The parser captures intent; it does not pretend that flights, hotel rooms, prices, or cancellation policies have been verified.
5. **Measured rather than invented latency:** The script records the actual round-trip duration for the current execution instead of publishing an unsupported fixed number.

---

## 🔄 Moving the Same Contract to Gemini 3.8 Flash

Gemini 3.8 Flash is documented for the full Agent Platform experience. After moving to a standard Google Cloud project and configuring ADC, the basic client initialization changes to:

```python
import os
from google import genai

client = genai.Client(
    enterprise=True,
    project=os.environ["GOOGLE_CLOUD_PROJECT"],
    location="global",
)

response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents="Extract this travel request into the configured response schema.",
)
```

For the real parser, keep the `response_schema` configuration from the Express example. Review the current Gemini 3.8 developer guide before migration: Gemini 3.8 Flash uses `thinking_level` values such as `LOW`, `MEDIUM`, and `HIGH`, and its guide instructs developers to remove deprecated or unsupported sampling parameters including `temperature`, `top_p`, and `top_k`.

A low reasoning level can be appropriate for basic metadata extraction, but benchmark the model against a representative evaluation set before changing production behavior.

---

## 🧱 What Still Has to Be Built

A typed intent object is only the entrance to the agentic workflow. A production Offvia concierge would still require:
* Airport and route validation against authoritative reference data.
* Flight and hotel tools with explicit authentication and authorization.
* Policy checks for budget, cabin, supplier, refund, and approval rules.
* Clarification turns when information is missing or conflicting.
* Idempotency and confirmation controls before any booking action.
* Evaluation datasets covering ambiguous, multilingual, adversarial, and incomplete requests.
* Tracing, cost monitoring, rate limiting, content controls, and audit logging.
* Human approval for high-impact or irreversible actions.

This distinction is important: structured extraction is a dependable component of an agent, but it is not itself autonomy.

---

## 🏁 Summary: Part 1 Architecture

| Layer | Part 1 Implementation | Production Direction |
| :--- | :--- | :--- |
| **Environment** | Agent Platform in Express Mode, subject to Preview limits | Standard Google Cloud project and full Agent Platform |
| **Authentication** | Express Mode API key stored in an environment variable | ADC with workload identity, service-account impersonation, or federation |
| **Model** | `gemini-2.5-flash`, verified in the Express Mode model list at publication time | Evaluate a currently supported production model such as `gemini-3.8-flash` |
| **Contract** | Pydantic `TripIntent` response schema | Versioned API or event schema with compatibility controls |
| **Date handling** | Explicit reference date and timezone | User locale, trip timezone, and deterministic date service |
| **Domain validation** | Local format validation only | Airport, route, inventory, price, and policy verification through authoritative services |
| **Reliability** | Bounded SDK retries and local schema validation | Concurrency controls, idempotency, SLOs, monitoring, fallbacks, and incident response |
| **Security** | Local secret isolation | IAM, Secret Manager where needed, audit logging, service perimeters, and private connectivity where supported |

---

## 🚀 What's Next in Part 2?

In **Part 2: Visual Prototyping in Agent Studio — Designing the Offvia Concierge**, we will:
* Recreate the intent-extraction prompt in Agent Studio.
* Compare prompt variants using repeatable travel requests.
* Inspect the code generated by the visual environment.
* Define the first evaluation cases for missing dates, multiple airports, conflicting budgets, and ambiguous constraints.
* Prepare the parser for a code-first ADK workflow without treating visual prototyping as the production runtime.

---

## 📖 Official Documentation (Verified Links)

* [Google Cloud Gemini Enterprise Overview](https://cloud.google.com/products/gemini)
* [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
* [Vertex AI Agent Builder & Generative AI Overview](https://cloud.google.com/generative-ai-app-builder/docs/introduction)
* [Google Cloud Application Default Credentials (ADC) Guide](https://cloud.google.com/docs/authentication/application-default-credentials)
* [Structured Output & Schema Control with Gemini](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output)
* [Google GenAI Python SDK Documentation](https://github.com/googleapis/python-genai)
* [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/)
* [Pydantic V2 Documentation](https://docs.pydantic.dev/)
