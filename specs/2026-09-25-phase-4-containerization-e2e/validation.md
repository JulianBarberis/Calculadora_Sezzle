# Feature Validation: Phase 4 — Containerization, Verification & Documentation

Branch: `feature/phase-4-containerization-e2e`  
Date: `2026-09-25`  
Status: `Pending Verification`

---

## 1. Quality Gates & Acceptance Criteria

Every gate below must pass without exception before merging `feature/phase-4-containerization-e2e` into `main`:

| Gate ID | Quality Gate | Command | Acceptance Threshold |
| :--- | :--- | :--- | :--- |
| **QG-4.1** | **Backend Unit & Race Tests** | `cd backend && go test -v -race -cover ./...` | 100% pass, 0 data races, $\ge 95\%$ coverage |
| **QG-4.2** | **Frontend Vitest Suite** | `cd frontend && pnpm test` | 100% pass, 0 `act(...)` warnings, 100-cycle StrictMode pass |
| **QG-4.3** | **Frontend Type-Check & Lint** | `cd frontend && pnpm type-check && pnpm lint` | 0 TypeScript errors, 0 lint warnings |
| **QG-4.4** | **Docker Container Build** | `docker compose build` | 0 build errors across both stages |
| **QG-4.5** | **Container Stack Launch** | `docker compose up -d` | Both containers report healthy/running |
| **QG-4.6** | **End-to-End Verification** | `node tests/e2e/runner.mjs` | 100% pass across all E2E test suites |
| **QG-4.7** | **Container Shutdown & Clean** | `docker compose down` | Clean exit, no orphaned volumes or processes |

---

## 2. End-to-End Test Suite Invariants (`tests/e2e/runner.mjs`)

The E2E test runner must validate the following contracts:
1. **Health Check**:
   - `GET http://localhost:8080/api/v1/health` $\rightarrow$ `200 OK`, `{"status":"healthy","service":"sezzle-calculator-api"}`.
2. **Financial Precision Operations**:
   - `0.1 + 0.2 = 0.3` (zero float drift).
   - `1.000000000000000000001 - 0.000000000000000000001 = 1`.
   - `0.00000005 * 20000000 = 1`.
   - `10 / 2 = 5` and `1 / 8 = 0.125`.
   - `2 ^ 3 = 8` and `2 ^ -3 = 0.125`.
   - `sqrt(16) = 4` and `sqrt(0.04) = 0.2`.
   - `25% = 0.25` and `15% of 200 = 30`.
3. **Extreme Scale Precision**:
   - $10^{400}$ power and $\sqrt{10^{400}} = 10^{200}$.
4. **Error Catalog Rejections**:
   - Division by zero $\rightarrow$ `400 Bad Request`, `code: "DIVISION_BY_ZERO"`.
   - Square root of negative number $\rightarrow$ `400 Bad Request`, `code: "NEGATIVE_SQUARE_ROOT"`.
   - Exponent exceeding $\pm 1000$ $\rightarrow$ `400 Bad Request`, `code: "EXPONENT_OUT_OF_BOUNDS"`.
   - Invalid JSON body $\rightarrow$ `400 Bad Request`, `code: "MALFORMED_JSON"`.
5. **History Ring Buffer**:
   - Capped at 20 entries, FIFO eviction, ordered newest first.
6. **Reverse Proxy Verification**:
   - `GET http://localhost:3000/api/v1/health` $\rightarrow$ proxied transparently to backend.
   - `POST http://localhost:3000/api/v1/calculate` $\rightarrow$ proxied transparently to backend.

---

## 3. Merge Readiness Checklist

- [ ] Multi-stage Dockerfiles optimized for minimal size and non-root execution.
- [ ] `docker-compose.yml` includes health checks and ordered dependencies.
- [ ] `tests/e2e/runner.mjs` runs with zero dependencies on Node.js and reports 100% pass.
- [ ] `README.md` complete with architecture diagrams, quickstart instructions, API contracts, and design decisions.
- [ ] Backend test suite passes with `-race` and $\ge 95\%$ coverage.
- [ ] Frontend vitest suite passes with zero `act(...)` warnings.
- [ ] GitHub PR created with `/pr-description-generator` in Spanish.
- [ ] PR URL recorded in `specs/roadmap.md`, `specs/prompts.md`, and `plan.md`.
