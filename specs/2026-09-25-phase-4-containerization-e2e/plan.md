# Feature Plan: Phase 4 — Containerization, Verification & Documentation

Branch: `feature/phase-4-containerization-e2e`  
Date: `2026-09-25`  
Status: `Pending Execution`  
Designated Skills: `/docker-patterns`, `/fullstack-testing`, `/pr-description-generator`

---

## Task Group 1: Container Architecture & Docker Compose Hardening (`/docker-patterns`)

- [x] **Task 1.1: Multi-Stage Dockerfile Verification & Hardening**
  - Verify and harden `backend/Dockerfile`:
    - Ensure multi-stage build uses `golang:1.24-alpine` builder and `alpine:3.21` runtime.
    - Compile static Go binary with `-ldflags="-s -w"` and `CGO_ENABLED=0`.
    - Run under unprivileged user `appuser:appgroup`.
    - Install `curl` or `wget` in alpine runtime for health check probe execution.
  - Verify and harden `frontend/Dockerfile`:
    - Ensure multi-stage build uses `node:24-alpine` with `corepack` enabled and `pnpm@11.22.0` active.
    - Serve compiled Vite static assets via `nginx:alpine`.
  - Validate and refine `frontend/nginx.conf`:
    - Ensure `/api/v1/` routes proxy to `http://backend:8080/api/v1/`.
    - Set security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).
    - Cache static assets (`css`, `js`, `svg`) and fallback unknown paths to `index.html`.

- [x] **Task 1.2: Docker Compose Orchestration & Healthchecks (`docker-compose.yml`)**
  - Configure `backend` service with `healthcheck`:
    - Test: `["CMD-SHELL", "wget -q --spider http://localhost:8080/api/v1/health || exit 1"]`.
    - Interval: `5s`, Timeout: `3s`, Retries: `5`, Start period: `2s`.
  - Configure `frontend` service with:
    - `depends_on`:
      - `backend`:
        - `condition: service_healthy`.
    - Port mapping `3000:80`.
  - Validate build and launch: `docker compose build && docker compose up -d`.

---

## Task Group 2: End-to-End Automated Verification Suite (`tests/e2e/runner.mjs`)

- [x] **Task 2.1: Implement Native ESM E2E Runner (`tests/e2e/runner.mjs`)**
  - Build zero-dependency Node.js test runner using native `fetch` and ANSI colored outputs.
  - Support configurable base URLs (`http://localhost:8080` for backend direct, `http://localhost:3000` for frontend proxy).
  - Implement assertion helpers with detailed diff reporting on mismatch.

- [x] **Task 2.2: Test Suites Implementation**
  - **Suite 1: Healthcheck & Liveness**:
    - Verify `GET /api/v1/health` returns `200 OK` with status `"healthy"`.
  - **Suite 2: Financial Precision Domain Operations**:
    - `0.1 + 0.2 = 0.3` (zero float drift).
    - High-precision subtraction with scale cancellation: `1.000000000000000000001 - 0.000000000000000000001 = 1`.
    - Multiplication: `0.00000005 * 20000000 = 1`.
    - Division: `10 / 2 = 5` and `1 / 8 = 0.125`.
    - Power: `2 ^ 3 = 8` and `2 ^ -3 = 0.125`.
    - Square root: `sqrt(16) = 4` and `sqrt(0.04) = 0.2`.
    - Percentage: `25% = 0.25` and `15% of 200 = 30`.
  - **Suite 3: Extreme Scale Calculations**:
    - $10^{400}$ base and $\sqrt{10^{400}} = 10^{200}$.
  - **Suite 4: Strict Error Catalog & HTTP Mapping**:
    - Division by zero $\rightarrow$ `DIVISION_BY_ZERO` (400).
    - Negative square root $\rightarrow$ `NEGATIVE_SQUARE_ROOT` (400).
    - Exponent out of bounds $\rightarrow$ `EXPONENT_OUT_OF_BOUNDS` (400).
    - Malformed payload / invalid JSON $\rightarrow$ `MALFORMED_JSON` (400).
    - Method not allowed $\rightarrow$ `METHOD_NOT_ALLOWED` (405).
  - **Suite 5: History Ring Buffer Lifecycle**:
    - Push 25 calculations.
    - Query `GET /api/v1/history` and assert exactly 20 items retained, newest first, FIFO eviction verified.
  - **Suite 6: Frontend Reverse Proxy Validation**:
    - Query `http://localhost:3000/api/v1/health` and `http://localhost:3000/api/v1/calculate` to verify Nginx routing.

- [x] **Task 2.3: Execute & Validate E2E Suite**
  - Run `node tests/e2e/runner.mjs` against live containers.
  - Assert 100% test pass rate with exit code 0.

---

## Task Group 3: Comprehensive Production Documentation (`README.md`)

- [x] **Task 3.1: Document System Architecture & Visual Diagrams**
  - Executive overview of Sezzle FinTech Calculator.
  - Architecture diagram (Mermaid) showing React 19 Frontend, Nginx Reverse Proxy, Go 1.22 REST Microservice, Decimal Calculation Engine (`shopspring/decimal`), and Thread-Safe History Ring Buffer.
  - Zero IEEE 754 float drift explanation and Newton-Raphson pure decimal square root algorithm:
    $$x_{n+1} = \frac{1}{2}\left(x_n + \frac{S}{x_n}\right)$$

- [x] **Task 3.2: Quickstart, Setup & Docker Instructions**
  - Local development instructions:
    - Backend: `cd backend && go run ./cmd/api`.
    - Frontend: `cd frontend && pnpm dev`.
  - Docker Compose instructions:
    - Build and launch: `docker compose up --build -d`.
    - Health inspection: `docker compose ps`.
    - Logs inspection: `docker compose logs -f`.
    - Teardown: `docker compose down`.

- [x] **Task 3.3: API Contract & Error Catalog Reference**
  - Detailed endpoints reference with example `curl` commands and JSON schemas:
    - `GET /api/v1/health`
    - `POST /api/v1/calculate`
    - `GET /api/v1/history`
  - Error catalog table with codes (`DIVISION_BY_ZERO`, `NEGATIVE_SQUARE_ROOT`, `EXPONENT_OUT_OF_BOUNDS`, `MALFORMED_JSON`, `INTERNAL_SERVER_ERROR`).

- [x] **Task 3.4: Engineering Decisions & Verification Matrix**
  - Document key architectural trade-offs:
    - Why Go `net/http` + `shopspring/decimal` over Node/Python floats.
    - Why Zero-`useEffect` React 19 state architecture.
    - Why In-Memory Ring Buffer with `sync.RWMutex`.
  - Verification matrix detailing commands, coverage, and quality thresholds.

---

## Task Group 4: Phase Completion & PR Delivery Workflow

- [x] **Task 4.1: Pre-Verification Gate Execution**
  - Run backend suite: `cd backend && go test -v -race -cover ./...`.
  - Run frontend suite: `cd frontend && pnpm test && pnpm type-check && pnpm lint && pnpm build`.
  - Run containerized E2E suite: `docker compose build && docker compose up -d && node tests/e2e/runner.mjs && docker compose down`.

- [ ] **Task 4.2: Branch Push & Pull Request Creation**
  - Push branch to GitHub: `git push -u origin feature/phase-4-containerization-e2e`.
  - Open a Pull Request targeting `main`.

- [ ] **Task 4.3: Mandatory `/pr-description-generator` Invocation**
  - Invoke `/pr-description-generator` to draft the PR description in Spanish, structured by architectural layers:
    - **Controller:** (Reverse proxy routing, E2E HTTP verification assertions)
    - **Service:** (End-to-end precision verification cases)
    - **Repository:** (Containerized ring buffer lifecycle verification)
    - **DTO / Model:** (E2E contracts, response envelopes)
    - **Configuration:** (`docker-compose.yml`, Dockerfiles, Nginx config, README.md)

- [ ] **Task 4.4: Documentation Traceability**
  - Record PR link in `specs/roadmap.md` and this `plan.md`.
  - Add Prompt Audit Log entry in `specs/prompts.md`.
  - **GitHub PR URL**: `TBD`
