# Requirements: Phase 2 — Go REST API Microservice, History & Concurrency Tests

## 1. Context & Business Scope
Phase 2 establishes the HTTP transport layer, in-memory calculation history, and concurrency guarantees for the Sezzle FinTech Calculator. The microservice exposes endpoints that receive mathematical operation requests from the React frontend, coordinates with the arbitrary-precision decimal engine (`internal/calculator`), stores successful calculations in a thread-safe circular ring buffer (`internal/history`), and returns standardized responses or strict error envelopes according to `SPEC.md`.

---

## 2. In-Memory History Ring Buffer Requirements

### 2.1 Fixed Capacity & Eviction Policy
- **Capacity**: Strictly bounded to 20 entries (`cap = 20`).
- **Memory Footprint**: $O(1)$ memory allocation; no slice reallocations or unbounded heap growth.
- **Eviction Invariant**: First-In, First-Out (FIFO) cyclic overwrite once capacity is reached. When entry 21 is added, entry 1 is evicted.
- **Ordering**: Queries (`GetAll()`) must return calculation records in **reverse chronological order (newest calculation first)**.

### 2.2 Concurrency & Thread Safety
- **Synchronization**: Access to the ring buffer must be guarded by `sync.RWMutex`.
- **Reader-Writer Invariants**:
  - Concurrent readers are allowed simultaneous read locks (`RLock`/`RUnlock`).
  - Writes acquire an exclusive write lock (`Lock`/`Unlock`).
  - Zero data races under Go's race detector (`go test -race`).

### 2.3 Calculation Model Schema
```go
type Calculation struct {
    ID         string     `json:"id"`
    Operation  string     `json:"operation"`
    A          string     `json:"a"`
    B          *string    `json:"b,omitempty"`
    Result     string     `json:"result"`
    Expression string     `json:"expression"`
    Timestamp  time.Time  `json:"timestamp"`
}
```

---

## 3. Atomic ID Sequencing
- Each successful calculation must be assigned a monotonically increasing unique identifier.
- Generated using `sync/atomic` (`atomic.Uint64`), initialized at 0, incremented before persistence.
- Formatted as a base-10 string (e.g. `"1"`, `"2"`, `"3"`) to prevent JavaScript IEEE-754 precision loss on high ID ranges.

---

## 4. HTTP Server Hardening & Middleware

### 4.1 Server Timeouts
To mitigate slowloris attacks and handle connection exhaustion in high-throughput FinTech environments, `http.Server` must explicitly enforce:
- `ReadHeaderTimeout`: 5 seconds
- `ReadTimeout`: 15 seconds
- `WriteTimeout`: 15 seconds
- `IdleTimeout`: 60 seconds

### 4.2 Middleware Pipeline
1. **CORS Middleware**:
   - Headers: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`.
   - Handles `OPTIONS` pre-flight requests immediately with `204 No Content`.
2. **Panic Recovery Middleware**:
   - Recovers from unhandled panics inside handlers.
   - Logs panic trace to `stderr`.
   - Emits standardized HTTP 500 JSON error envelope (`INTERNAL_ERROR`).
3. **JSON Content-Type Middleware**:
   - Ensures response headers contain `Content-Type: application/json; charset=utf-8`.

---

## 5. API Endpoint Specifications

Base Path: `/api/v1`

### 5.1 `GET /api/v1/health`
- **Purpose**: Liveness and readiness probe for Docker / orchestrators.
- **Status**: `200 OK`
- **Payload**:
  ```json
  {
    "status": "healthy",
    "service": "calculator-api",
    "version": "1.0.0",
    "timestamp": "2026-09-24T20:00:00Z"
  }
  ```

### 5.2 `POST /api/v1/calculate`
- **Purpose**: Executes an arbitrary-precision operation and persists the calculation.
- **Request Format**:
  ```json
  {
    "operation": "add",
    "a": "0.1",
    "b": "0.2"
  }
  ```
  *(Operands may be submitted as strings or numbers; strings preserve high precision).*
- **Successful Response (`200 OK`)**:
  ```json
  {
    "id": "1",
    "operation": "add",
    "a": "0.1",
    "b": "0.2",
    "result": "0.3",
    "expression": "0.1 + 0.2 = 0.3",
    "timestamp": "2026-09-24T20:00:00Z"
  }
  ```
- **Unary Operations**:
  - `sqrt`: Operand `b` must be omitted or `null`. Expression: `sqrt(16) = 4`.
  - `percentage`: If operand `b` is omitted or `null`, evaluates $a / 100$. Expression: `25% = 0.25`.
- **Binary Operations**:
  - `add`, `subtract`, `multiply`, `divide`, `power`, binary `percentage`: Both `a` and `b` are required. Expression e.g. `2 ^ 3 = 8`, `15% of 200 = 30`.

### 5.3 `GET /api/v1/history`
- **Purpose**: Returns calculation records from the ring buffer.
- **Successful Response (`200 OK`)**:
  ```json
  {
    "items": [
      {
        "id": "2",
        "operation": "sqrt",
        "a": "16",
        "b": null,
        "result": "4",
        "expression": "sqrt(16) = 4",
        "timestamp": "2026-09-24T20:01:00Z"
      }
    ],
    "total": 1
  }
  ```
- **Ordering**: Reverse chronological order (latest calculation is first).
- **Limit**: At most 20 records.

---

## 6. Error Catalog & Envelopes

Every error response must adhere strictly to the JSON schema:
```json
{
  "error": "<Human-readable message>",
  "code": "<EXACT_ERROR_CODE>",
  "status": <HTTP_STATUS>
}
```

| HTTP Status | Error Code | Exact Message | Trigger Condition |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | `MALFORMED_JSON` | `"Malformed JSON request body"` | Invalid JSON syntax or unparseable body |
| `400 Bad Request` | `INVALID_OPERAND` | `"Operand '<name>' is not a valid decimal number"` | Operand cannot be parsed into a decimal |
| `400 Bad Request` | `MISSING_OPERAND` | `"Operand '<name>' is required for <unary/binary> operation '<op>'"` | Required operand missing or null |
| `400 Bad Request` | `INVALID_OPERATION` | `"Unsupported operation '<op>'"` | Operation name not recognized |
| `400 Bad Request` | `DIVISION_BY_ZERO` | `"Cannot divide by zero. Please enter a non-zero divisor."` | Divisor is zero, or base is zero with negative exponent |
| `400 Bad Request` | `NEGATIVE_SQUARE_ROOT` | `"Cannot calculate the square root of a negative number in real numbers."` | Radicand $a < 0$ in sqrt |
| `500 Internal Error`| `INTERNAL_ERROR` | `"An unexpected internal error occurred."` | Recovered panic or server internal failure |

---

## 7. Quality & Architectural Invariants
1. **Decoupled Architecture**: HTTP transport concerns in `internal/api` must never bleed into `internal/calculator` or `internal/history`.
2. **Deterministic Coverage**: Statement coverage must meet or exceed 95% on both `internal/history` and `internal/api`.
3. **Adversarial Concurrency**: All unit and stress tests must execute cleanly with `-race` enabled under high parallel goroutine loads (60+ workers).
