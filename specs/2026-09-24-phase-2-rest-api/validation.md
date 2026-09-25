# Validation: Phase 2 — Go REST API Microservice, History & Concurrency Tests

## 1. Acceptance Criteria & Quality Gates

To guarantee that the implementation meets Sezzle's production standards and can be merged into `main`, the following criteria must be satisfied:

### 1.1 In-Memory Ring Buffer Correctness
- [ ] Ring buffer capacity never exceeds 20 elements under any sequence of operations.
- [ ] FIFO eviction properly discards the oldest element when new items are added beyond capacity.
- [ ] Calculations returned by `GetAll()` are strictly sorted in reverse chronological order (newest first).
- [ ] Thread safety verified with `sync.RWMutex` under concurrent read/write load.

### 1.2 REST API Endpoint Compliance
- [ ] `GET /api/v1/health` returns HTTP 200 with `{ status: "healthy", ... }`.
- [ ] `POST /api/v1/calculate` resolves all valid operations (`add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`, `percentage`) with exact results.
- [ ] Unique, monotonic atomic ID generated per calculation (`"1"`, `"2"`, ...).
- [ ] `GET /api/v1/history` returns the recent history items and total count.
- [ ] Error catalog is strictly enforced: `MALFORMED_JSON`, `INVALID_OPERAND`, `MISSING_OPERAND`, `INVALID_OPERATION`, `DIVISION_BY_ZERO`, `NEGATIVE_SQUARE_ROOT`, `INTERNAL_ERROR`.
- [ ] Standard HTTP middleware: CORS headers present, panics caught and converted to HTTP 500 JSON envelope.

### 1.3 Concurrency & Race Detector Gate
- [ ] Adversarial concurrency test with 60 parallel goroutines writing and reading history simultaneously passes with zero data races (`-race`).
- [ ] Concurrent HTTP requests test produces no race conditions, duplicate IDs, or state corruption.

### 1.4 Code Coverage & Static Analysis Gate
- [ ] Coverage meets or exceeds **95%** statement coverage on `internal/history`.
- [ ] Coverage meets or exceeds **95%** statement coverage on `internal/api`.
- [ ] Zero static analysis warnings from `go vet ./...`.
- [ ] Zero regression errors on frontend: `pnpm test`, `pnpm type-check`, `pnpm lint`.

---

## 2. Validation Commands

### 2.1 Backend Concurrency & Unit Testing
```bash
cd backend

# Static analysis
go vet ./...

# Table-driven unit and concurrency tests with race detection and statement coverage
go test -v -race -cover ./internal/history/...
go test -v -race -cover ./internal/api/...
go test -v -race -cover ./...
```
*Requirement: 100% pass, 0 data races, $\ge 95\%$ statement coverage on `internal/history` and `internal/api`.*

### 2.2 Coverage Profile Generation
```bash
cd backend
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
```

### 2.3 Frontend Regression Verification
```bash
cd frontend
pnpm test
pnpm type-check
pnpm lint
```

---

## 3. Merge-Readiness Checklist
- [ ] All unit, integration, and concurrency tests pass cleanly.
- [ ] Statement coverage $\ge 95\%$ confirmed on `internal/history` and `internal/api`.
- [ ] Git commit created on branch `feature/phase-2-rest-api`.
- [ ] Branch pushed to remote: `git push -u origin feature/phase-2-rest-api`.
- [ ] Pull Request opened targeting `main`.
- [ ] PR description generated in Spanish via `/pr-description-generator` structured by architectural layers.
- [ ] PR link recorded in `specs/roadmap.md`, `specs/2026-09-24-phase-2-rest-api/plan.md`, and `specs/prompts.md`.
