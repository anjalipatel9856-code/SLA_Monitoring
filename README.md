# SLA Monitoring & Availability System

A production-grade SLA Monitoring & Availability Dashboard that ingests raw multi-day, multi-agent health check logs, runs them through a stateless validation & cleaning pipeline, persists clean check records to a database, and presents executive statistics and telemetry logs in a single-screen dashboard.

---

## 1. Architecture & Data Flow

```
                      ┌──────────────────────────────────────────────┐
                      │              Raw CSV Upload UI               │
                      │   Drag & Drop / Benchmark Dataset Selector   │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTP POST (CSV Body / Stream)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    Stateless Cloud Function Processing Engine │
                      │  (AWS Lambda / Serverless Next.js API Route) │
                      │   • Rule-Based Validator                     │
                      │   • Timestamp & Latency Unit Sanitizer       │
                      │   • Key-Based Deduplicator                   │
                      └──────────────────────┬───────────────────────┘
                                             │ Cleaned Records & Quality Report
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │             Persistent Database              │
                      │       (upload_batches & health_checks)       │
                      └──────────────────────┬───────────────────────┘
                                             │ SQL / Query Aggregations
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │            Single-Screen Dashboard           │
                      │   • Collapsible SLA Stats & Credit Alerts    │
                      │   • Per-Service Availability & P95 Latency   │
                      │   • Filterable & Paginated Log Inspection    │
                      └──────────────────────────────────────────────┘
```

### Component Selection Rationale:
- **Frontend (Next.js 14 + React 18 + Tailwind CSS)**: Next.js App Router provides server-side rendering, instant page hydration, and dynamic routing for low-latency dashboard interaction.
- **Processing Engine (Stateless Cloud Function / AWS Lambda Handler)**: Decouples file processing from the browser client, ensuring heavy CSV parsing, validation, and deduplication happen statelessly without risking UI thread blocking.
- **Persistence Layer (File-Backed Persistent Database / PostgreSQL Schema)**: Ensures health check data persists across function invocations and web server restarts so billing queries remain reproducible.
- **Single-Screen Dashboard**: Combines executive SLA stats (top) and granular check telemetry (bottom) onto one screen so on-call engineers and billing teams can diagnose availability breaches in seconds.

---

## 2. Data Findings & Quality Audit Report

During deep inspection of the benchmark datasets (`9d`, `12d`, `14d`, `21d`, `30d`), we identified **7 distinct data-quality issues**:

| # | Anomaly / Issue Discovered | Real Example from CSV | Pipeline Handling Decision & Rationale |
|---|---|---|---|
| **1** | **Mixed Timestamp Formats** | `2025-05-13T12:45:00Z` vs `1746938700` | Normalized all timestamps to ISO 8601 UTC strings. Epoch integers are detected via `/^\d+$/` and parsed as UTC seconds. |
| **2** | **Mixed Latency Units** | `707` (`ms`) vs `0.717` (`s`) | Normalized all latencies to integer milliseconds (`ms = s * 1000`). Prevents skewing latency averages. |
| **3** | **Missing Latency Values** | `2025-05-08T20:30:00Z,200,,ms` | For 5xx failures, defaulted missing latency to `0 ms`. For 2xx checks with missing latency, rejected row as incomplete telemetry. |
| **4** | **Negative Latency Values** | `-10` ms or `-500` ms | Rejected rows with `latency < 0` as invalid telemetry sensor errors. |
| **5** | **Invalid HTTP Status Codes** | Spurious code `999` | Strictly validated `100 <= status_code <= 599`. Rejected `999` or non-numeric status codes. |
| **6** | **Duplicate Check Records** | Identical `(service_id, timestamp)` from multiple agents | Deduplicated checks by `(service_id, timestamp)`, keeping the first valid record and recording duplicate count in the batch audit. |
| **7** | **Formatting & Whitespace** | `"svc-reports "` or `" agent-1 "` | Applied `.trim()` and lowercase normalization to all string identifiers. |

---

## 3. Key Assumptions & Business Logic

1. **Target Availability SLA**: **99.9%** availability.
2. **Success Definition**: A check is considered **Successful** if `200 <= status_code < 300`. Status codes 500, 502, and 503 are considered **Failed / Downtime**.
3. **Availability Formula**:
   $$\text{Availability \%} = \left( \frac{\text{Successful Checks}}{\text{Total Valid Checks}} \right) \times 100$$
4. **Billing Credit Trigger**: If Availability $< 99.9\%$, the service is marked as **SLA BREACH**, flagging that customer billing credit is owed.
5. **Stats Selection Rationale**:
   - **Overall Availability %**: Primary metric determining SLA compliance.
   - **Services Below SLA**: Fast overview of failing services.
   - **Total vs Failed Checks**: Quantum of downtime checks.
   - **Avg & P95 Tail Latency**: Key performance indicators for latency degradation preceding downtime.

---

## 4. Local Setup & Deployment Instructions

### Prerequisites
- Node.js v18+
- npm v9+

### Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run Next.js dev server
npm run dev

# 3. Open browser
http://localhost:3000
```

### Production Build & Verification

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

### Serverless Function Deployment (AWS Lambda / Vercel)
- The standalone serverless handler is available at [`lambda/handler.ts`](file:///d:/SLA_Monitoring/lambda/handler.ts).
- For Vercel deployment: Zero config required (`vercel.json` included).
- For AWS Lambda: Zip `lambda/handler.js` with `csv-parse` and attach to an API Gateway POST `/upload` endpoint.

---

## 5. What I Would Do Differently With More Time

1. **Automated Incident Interval Detection**: Compute 15-minute gap gaps in expected monitoring intervals to detect silent agent drops or missing checks.
2. **PostgreSQL / TimescaleDB Migration**: Swap file-backed storage for PostgreSQL with TimescaleDB hyper-tables for time-series aggregation.
3. **Export SLA Compliance Certificates**: Generate PDF/CSV downloadable reports for billing credit auditing.
4. **Real-Time WebSocket Feed**: Stream live check results into the dashboard UI.