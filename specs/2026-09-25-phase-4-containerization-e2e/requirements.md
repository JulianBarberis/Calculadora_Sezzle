# Feature Requirements: Phase 4 — Containerization, Verification & Documentation

Branch: `feature/phase-4-containerization-e2e`  
Date: `2026-09-25`  
Status: `Draft`  
Designated Skills: `/docker-patterns`, `/fullstack-testing`, `/pr-description-generator`

---

## 1. Scope & Purpose

Phase 4 concludes the development of the Sezzle FinTech Calculator by containerizing all components, establishing an end-to-end (E2E) automated verification suite that runs against live container services, and producing comprehensive technical documentation ready for engineering evaluation and production deployment.

---

## 2. Invariants & Technical Decisions

### 2.1 Container Architecture & Security Hardening (`/docker-patterns`)
- **Backend Container (`backend/Dockerfile`)**:
  - Multi-stage build with `golang:1.24-alpine` builder and `alpine:3.21` runtime.
  - Statically compiled binary with `-ldflags="-s -w"` and `CGO_ENABLED=0`.
  - Non-root user execution (`appuser:appgroup`) with minimal attack surface.
  - Healthcheck probe using native HTTP request check against `/api/v1/health`.
- **Frontend Container (`frontend/Dockerfile` & `nginx.conf`)**:
  - Multi-stage build with `node:24-alpine` builder preparing `pnpm@11.22.0` via `corepack`.
  - Production runtime using `nginx:alpine`.
  - Reverse proxy configured for `/api/v1/` routing to `http://backend:8080/api/v1/`.
  - Hardened security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`).
  - Gzip compression enabled for static assets.
- **Docker Compose Orchestration (`docker-compose.yml`)**:
  - Unified local multi-service stack with deterministic network bridging.
  - Dependency health ordering (`depends_on.backend.condition: service_healthy`).
  - Port mapping: `8080:8080` (Backend REST API) and `3000:80` (Frontend reverse proxy).

### 2.2 End-to-End Test Suite (`/fullstack-testing`)
- **Zero-Dependency Native ESM Runner (`tests/e2e/runner.mjs`)**:
  - Written in modern Node.js 20+ with native `fetch` (no external npm dependencies required).
  - Validates full HTTP contract against live containerized environment (`http://localhost:8080` and `http://localhost:3000`).
  - Test suites:
    1. **Service Liveness Probe**: Verifies `GET /api/v1/health` returns `200 OK` with status `"healthy"`.
    2. **Precision Arithmetic Suite**: Validates addition (`0.1 + 0.2 = 0.3`), subtraction, multiplication, division, Newton-Raphson square root, powers ($2^{-3} = 0.125$), and percentage without floating-point drift.
    3. **Large Scale Precision**: Validates bases up to $10^{400}$ and extreme square roots ($\sqrt{10^{400}} = 10^{200}$).
    4. **Error Catalog Conformance**: Rejects division by zero (`DIVISION_BY_ZERO`, HTTP 400), negative square roots (`NEGATIVE_SQUARE_ROOT`, HTTP 400), out-of-bounds exponents (`EXPONENT_OUT_OF_BOUNDS`, HTTP 400), and malformed payloads (`MALFORMED_JSON`, HTTP 400).
    5. **History Ring Buffer Verification**: Pushes calculations and validates `GET /api/v1/history` returns FIFO capped at 20 in reverse chronological order.
    6. **Frontend Reverse Proxy Route**: Verifies frontend Nginx proxies `/api/v1/health` and `/api/v1/calculate` transparently on port 3000.

### 2.3 Comprehensive Submission Documentation
- **Production README (`README.md`)**:
  - Executive overview and FinTech mission alignment.
  - Architecture diagram (Mermaid) illustrating client, Nginx reverse proxy, Go REST API, decimal engine, and history ring buffer.
  - Arbitrary-precision mathematics explanation (zero IEEE 754 float drift, Newton-Raphson square root formula).
  - Quickstart guide: local development (`go run`, `pnpm dev`) and containerized execution (`docker compose up --build`).
  - Complete API contract reference with `curl` examples and JSON request/response envelopes.
  - Design decisions and trade-offs justification.
  - Quality and verification matrix.

---

## 3. Pull Request Delivery Workflow
- Semantic branch: `feature/phase-4-containerization-e2e`.
- Pre-verification: All backend tests (`go test -v -race -cover ./...`), Vitest suite (`pnpm test`), and full-stack container build with E2E runner (`node tests/e2e/runner.mjs`) must report 100% pass.
- Invocation of `/pr-description-generator` in Spanish structured by architectural layers.
- Traceability recorded in `specs/roadmap.md`, `specs/prompts.md`, and `plan.md`.
