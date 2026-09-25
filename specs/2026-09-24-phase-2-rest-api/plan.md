# Feature Plan: Phase 2 — Go REST API Microservice, History & Concurrency Tests

Branch: `feature/phase-2-rest-api`  
Date: `2026-09-24`  
Status: `Completed`  
Designated Skills: `/golang-patterns`, `/golang-testing`, `/fullstack-testing`, `/pr-description-generator`

---

## Task Group 1: In-Memory History Ring Buffer (`backend/internal/history/`)

- [x] **Task 1.1: Thread-Safe Ring Buffer Data Structure**
  - Define `Calculation` domain model matching `SPEC.md`:
    - `ID string`: Monotonically increasing sequential identifier.
    - `Operation string`: Standardized operation name.
    - `A string`: First operand.
    - `B *string`: Second operand (optional for unary operations).
    - `Result string`: Arbitrary-precision decimal result.
    - `Expression string`: Human-readable formula (e.g., `"0.1 + 0.2 = 0.3"`).
    - `Timestamp time.Time`: UTC creation timestamp formatted as ISO 8601 / RFC 3339.
  - Implement `Buffer` struct in `backend/internal/history/history.go`:
    - Fixed array/slice capacity: `cap = 20`.
    - Protected by `sync.RWMutex` to permit concurrent readers while serializing writes.
    - Zero unbounded memory allocations; strict $O(1)$ cyclic ring storage.
  - Expose thread-safe methods:
    - `New(capacity int) *Buffer`: Factory with default capacity 20.
    - `Push(calc Calculation)`: Thread-safe write with FIFO overwrite eviction when capacity is exceeded.
    - `GetAll() []Calculation`: Thread-safe read returning slice in **reverse chronological order (newest first)**.
    - `Clear()`: Thread-safe reset of the buffer.

- [x] **Task 1.2: History Unit Testing (`backend/internal/history/history_test.go`)**
  - Table-driven unit tests for ring buffer operations:
    - FIFO eviction when pushing 25 items into a 20-capacity buffer.
    - Reverse chronological ordering assertion (`items[0]` is the latest pushed).
    - Handling unary calculations (`B == nil`).
    - Clear and empty buffer behavior.
  - Statement coverage $\ge 95\%$ on `internal/history` (achieved 100.0%).

---

## Task Group 2: REST API Server, Handlers & Error Catalog (`backend/internal/api/`)

- [x] **Task 2.1: Server Hardening & Production Middleware**
  - Implement HTTP middleware in `backend/internal/api/middleware.go`:
    - `CORS`: Standard headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`).
    - `PanicRecovery`: Catches panics and returns standardized HTTP 500 JSON error envelope without process crash.
    - `JSONContentType`: Enforces `application/json; charset=utf-8` on API responses.
  - Production `http.Server` timeouts in `backend/cmd/api/main.go`:
    - `ReadHeaderTimeout: 5s`
    - `ReadTimeout: 15s`
    - `WriteTimeout: 15s`
    - `IdleTimeout: 60s`

- [x] **Task 2.2: Atomic ID Sequencing & DTO Definitions**
  - Atomic sequential identifier counter via `atomic.Uint64` ensuring thread-safe, monotonic calculation IDs (`"1"`, `"2"`, ...).
  - Define request/response DTOs:
    - `CalculateRequest`: `Operation string`, `A any`, `B any` (supporting string or numeric inputs via custom JSON unmarshaling or validation).
    - `CalculateResponse`: `ID`, `Operation`, `A`, `B`, `Result`, `Expression`, `Timestamp`.
    - `HistoryResponse`: `Items []Calculation`, `Total int`.
    - `ErrorResponse`: `Error string`, `Code string`, `Status int`.

- [x] **Task 2.3: HTTP Route Handlers**
  - `GET /api/v1/health`: Operational check returning status `healthy`.
  - `POST /api/v1/calculate`:
    - Validates JSON payload and maps malformed syntax to `MALFORMED_JSON`.
    - Validates operands and operations against error catalog (`INVALID_OPERAND`, `MISSING_OPERAND`, `INVALID_OPERATION`).
    - Delegates to `calculator.Engine` (`Add`, `Subtract`, `Multiply`, `Divide`, `Power`, `Sqrt`, `Percentage`).
    - Maps domain errors (`ErrDivisionByZero` $\to$ `DIVISION_BY_ZERO`, `ErrNegativeSquareRoot` $\to$ `NEGATIVE_SQUARE_ROOT`).
    - Formats expression string, generates atomic ID, records in `history.Buffer`, and returns HTTP 200 JSON envelope.
  - `GET /api/v1/history`:
    - Retrieves items from `history.Buffer` in reverse chronological order.
    - Returns `{ "items": [...], "total": N }` with HTTP 200.

- [x] **Task 2.4: Table-Driven HTTP API Tests (`backend/internal/api/api_test.go`)**
  - Table-driven HTTP handler tests using `net/http/httptest`:
    - Valid calculations (`POST /api/v1/calculate` for add, subtract, multiply, divide, power, sqrt, percentage).
    - Error responses matching exact JSON envelope and status codes (`MALFORMED_JSON`, `INVALID_OPERAND`, `DIVISION_BY_ZERO`, `NEGATIVE_SQUARE_ROOT`, `INVALID_OPERATION`).
    - History retrieval (`GET /api/v1/history`).
  - Statement coverage $\ge 95\%$ on `internal/api` (achieved 99.5%).

---

## Task Group 3: Adversarial Concurrency & Race Verification

- [x] **Task 3.1: Adversarial History Concurrency Test (`backend/internal/history/concurrency_test.go`)**
  - Launch 60 parallel goroutines writing and reading history simultaneously:
    - 30 writer goroutines pushing continuous calculations.
    - 30 reader goroutines querying `GetAll()`.
  - Ensure zero race conditions or data corruption under `go test -race`.
  - Verify ring buffer capacity never exceeds 20 elements during or after stress.

- [x] **Task 3.2: HTTP End-to-End Concurrent Request Test (`backend/internal/api/concurrency_test.go`)**
  - Concurrently dispatch 60 parallel HTTP requests against `POST /api/v1/calculate` and `GET /api/v1/history`.
  - Verify every atomic calculation ID is unique and monotonic.
  - Zero race detector warnings under `go test -v -race -cover ./...`.

---

## Task Group 4: Phase Completion & PR Delivery Workflow

- [x] **Task 4.1: Pre-Verification Gate Execution**
  - Execute `cd backend && go vet ./... && go test -v -race -cover ./...`.
  - Verify coverage meets or exceeds 95% on `internal/history` (100.0%) and `internal/api` (99.5%).
  - Execute frontend regression tests: `cd frontend && pnpm test && pnpm type-check && pnpm lint`.

- [x] **Task 4.2: Branch Push & Pull Request Creation**
  - Push branch to GitHub: `git push -u origin feature/phase-2-rest-api`.
  - Open a Pull Request targeting `main`.

- [x] **Task 4.3: Mandatory `/pr-description-generator` Invocation**
  - Invoke `/pr-description-generator` to draft the PR description in Spanish, structured by architectural layers:
    - **Controller** (`internal/api`)
    - **Repository** (`internal/history`)
    - **DTO / Model** (`internal/api/dto.go`, `internal/history/model.go`)
    - **Configuration** (`cmd/api/main.go`)

- [x] **Task 4.4: Documentation Traceability**
  - Record PR link in `specs/roadmap.md` and this `plan.md`.
  - Add Prompt Audit Log entry in `specs/prompts.md`.
  - **GitHub PR URL**: [PR #3](https://github.com/JulianBarberis/Calculadora_Sezzle/pull/3)
