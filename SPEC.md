# SPEC.md: Functional & Technical Specification

## 1. System Overview
The Sezzle Calculator is a high-precision, production-grade financial calculator platform built to deliver audit-ready mathematical calculations with zero floating-point drift. The architecture decouples a high-performance Go 1.22+ backend microservice from a reactive React 19 + TypeScript frontend application.

---

## 2. Mathematical Domain Engine Specification

### 2.1 Precision Invariant
- Calculations must **never** utilize IEEE 754 native binary floating-point numbers (`float32`, `float64`).
- All calculations must be computed using arbitrary-precision fixed-point decimal arithmetic via `github.com/shopspring/decimal`.
- Precision scale for division, power, and roots is set to dynamically maintain at least 32 decimal places of fractional precision without truncation, supporting bases up to $10^{400}$.

### 2.2 Supported Operations & EARS/BDD Requirements

#### 2.2.1 Addition (`add`)
- **EARS**: *When* an `add` operation is requested with operands $a$ and $b$, the engine *shall* compute $a + b$ with exact decimal precision.
- **BDD**:
  ```gherkin
  Scenario: Adding two decimal values
    Given operand a is "0.1"
    And operand b is "0.2"
    When operation is "add"
    Then the result shall be "0.3"
    And expression shall be "0.1 + 0.2 = 0.3"
  ```

#### 2.2.2 Subtraction (`subtract`)
- **EARS**: *When* a `subtract` operation is requested with operands $a$ and $b$, the engine *shall* compute $a - b$.
- **BDD**:
  ```gherkin
  Scenario: Subtracting decimal values
    Given operand a is "1.000000000000000000001"
    And operand b is "0.000000000000000000001"
    When operation is "subtract"
    Then the result shall be "1"
    And expression shall be "1.000000000000000000001 - 0.000000000000000000001 = 1"
  ```

#### 2.2.3 Multiplication (`multiply`)
- **EARS**: *When* a `multiply` operation is requested with operands $a$ and $b$, the engine *shall* compute $a \times b$.
- **BDD**:
  ```gherkin
  Scenario: Multiplying decimal values
    Given operand a is "0.00000005"
    And operand b is "20000000"
    When operation is "multiply"
    Then the result shall be "1"
  ```

#### 2.2.4 Division (`divide`)
- **EARS**: *When* a `divide` operation is requested with divisor $b \neq 0$, the engine *shall* compute $a / b$.
- **EARS (Error)**: *When* a `divide` operation is requested with divisor $b = 0$, the engine *shall* reject the request with a `DIVISION_BY_ZERO` error.
- **BDD**:
  ```gherkin
  Scenario: Division by zero is rejected
    Given operand a is "10"
    And operand b is "0"
    When operation is "divide"
    Then the system shall return HTTP status 400
    And error code shall be "DIVISION_BY_ZERO"
    And error message shall be "Cannot divide by zero. Please enter a non-zero divisor."
  ```

#### 2.2.5 Power (`power`)
- **EARS**: *When* a `power` operation is requested with base $a$ and integer exponent $b \in [-1000, 1000]$, the engine *shall* compute $a^b$.
- **EARS (Edge Case $0^0$)**: *When* both base $a = 0$ and exponent $b = 0$, the engine *shall* return $1$.
- **EARS (Edge Case $0^{-k}$)**: *When* base $a = 0$ and exponent $b < 0$, the engine *shall* reject the request with `DIVISION_BY_ZERO`.
- **EARS (Negative Exponent)**: *When* exponent $b < 0$ and $a \neq 0$, the engine *shall* evaluate $1 / a^{|b|}$.
- **BDD**:
  ```gherkin
  Scenario: Exponentiation of zero to the power of zero
    Given operand a is "0"
    And operand b is "0"
    When operation is "power"
    Then the result shall be "1"

  Scenario: Power with negative exponent
    Given operand a is "2"
    And operand b is "-3"
    When operation is "power"
    Then the result shall be "0.125"
  ```

#### 2.2.6 Square Root (`sqrt`)
- **EARS**: *When* a `sqrt` operation is requested with radicand $a \ge 0$, the engine *shall* compute $\sqrt{a}$ using the pure decimal Newton-Raphson approximation algorithm:
  $$x_{n+1} = \frac{1}{2}\left(x_n + \frac{S}{x_n}\right)$$
  converging until $|x_{n+1} - x_n| < 10^{-32}$ or max iterations reached.
- **EARS (Error)**: *When* a `sqrt` operation is requested with radicand $a < 0$, the engine *shall* reject the request with `NEGATIVE_SQUARE_ROOT`.
- **BDD**:
  ```gherkin
  Scenario: Extreme scale square root
    Given operand a is "100000000000000000000" (10^20)
    When operation is "sqrt"
    Then the result shall be "10000000000" (10^10)

  Scenario: Negative square root rejected
    Given operand a is "-4"
    When operation is "sqrt"
    Then the system shall return HTTP status 400
    And error code shall be "NEGATIVE_SQUARE_ROOT"
    And error message shall be "Cannot calculate the square root of a negative number in real numbers."
  ```

#### 2.2.7 Percentage (`percentage`)
- **EARS (Unary)**: *When* a `percentage` operation is requested with operand $a$ and $b$ is omitted or null, the engine *shall* compute $a / 100$.
- **EARS (Binary)**: *When* a `percentage` operation is requested with operands $a$ and $b$, the engine *shall* compute $(a \times b) / 100$.
- **BDD**:
  ```gherkin
  Scenario: Unary percentage
    Given operand a is "25"
    And operand b is omitted
    When operation is "percentage"
    Then the result shall be "0.25"

  Scenario: Binary percentage
    Given operand a is "200"
    And operand b is "15"
    When operation is "percentage"
    Then the result shall be "30"
  ```

---

## 3. REST API Contract & Endpoints

Base URL: `/api/v1`

### 3.1 `GET /api/v1/health`
Checks service health and operational status.
- **Response (`200 OK`)**:
  ```json
  {
    "status": "healthy",
    "service": "calculator-api",
    "version": "1.0.0",
    "timestamp": "2026-09-24T20:00:00Z"
  }
  ```

### 3.2 `POST /api/v1/calculate`
Executes an arbitrary-precision mathematical calculation and appends it to the in-memory history ring buffer.
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "operation": "add",
    "a": "0.1",
    "b": "0.2"
  }
  ```
  *(Operands `a` and `b` may be strings or numeric literals. Strings are preferred for large numbers to prevent JSON parser float truncation).*
- **Response (`200 OK`)**:
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
- **Sequential Atomic ID**: The `id` property must be a monotonically increasing unique integer formatted as a string (e.g., `"1"`, `"2"`, `"3"`), generated atomically via `atomic.Uint64`.

### 3.3 `GET /api/v1/history`
Retrieves calculation records from the in-memory ring buffer.
- **Response (`200 OK`)**:
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
      },
      {
        "id": "1",
        "operation": "add",
        "a": "0.1",
        "b": "0.2",
        "result": "0.3",
        "expression": "0.1 + 0.2 = 0.3",
        "timestamp": "2026-09-24T20:00:00Z"
      }
    ],
    "total": 2
  }
  ```
- **Ordering**: The `items` array must be sorted in **reverse chronological order (newest first)**.
- **Capacity**: Maximum items returned is 20 (bounded by the ring buffer capacity).

---

## 4. Strict Error Catalog & Envelopes

All error responses (4xx and 5xx) must return a JSON response adhering to the exact error envelope:
```json
{
  "error": "Human-readable description explaining why the operation cannot be resolved",
  "code": "EXACT_ERROR_CODE",
  "status": 400
}
```

| HTTP Status | Error Code | Exact Human-Readable Message | Condition |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | `MALFORMED_JSON` | `"Malformed JSON request body"` | Invalid JSON syntax or unparseable payload |
| `400 Bad Request` | `INVALID_OPERAND` | `"Operand '<name>' is not a valid decimal number"` | Operand cannot be parsed into a decimal |
| `400 Bad Request` | `MISSING_OPERAND` | `"Operand '<name>' is required for <unary/binary> operation '<op>'"` | Required operand `a` or `b` omitted |
| `400 Bad Request` | `INVALID_OPERATION` | `"Unsupported operation '<op>'"` | Operation is not in `[add, subtract, multiply, divide, power, sqrt, percentage]` |
| `400 Bad Request` | `DIVISION_BY_ZERO` | `"Cannot divide by zero. Please enter a non-zero divisor."` | Divisor is zero, or base is zero with negative exponent |
| `400 Bad Request` | `NEGATIVE_SQUARE_ROOT`| `"Cannot calculate the square root of a negative number in real numbers."` | Sqrt operand $a < 0$ |
| `500 Internal Error`| `INTERNAL_ERROR` | `"An unexpected internal error occurred."` | Unhandled panic or server failure |

---

## 5. Ring Buffer History Specifications
- **Fixed Capacity**: Exactly 20 entries.
- **Eviction Policy**: First-In, First-Out (FIFO) ring overwrite once capacity is reached.
- **Thread Safety**: Read and write access synchronized using `sync.RWMutex`.
- **Memory Footprint**: $O(1)$ memory allocation; no slice resizing or unbounded growth.

---

## 6. Frontend Architectural Invariants

### 6.1 STRICT ZERO-`useEffect` Policy
- Prohibition: No component or hook shall invoke `useEffect`.
- **State Machine**: All calculator state transitions (input buffering, pending operations, clear, backspace, sign toggling) are managed via `useReducer(calculatorReducer, initialState)`.
- **Double-Invocation Resilience**: The reducer must be pure and deterministic, producing identical state when invoked twice under `React.StrictMode`.
- **Event-Driven Mutations**: API requests to `/api/v1/calculate` are dispatched inside UI event handlers (`handleCalculate`, `onKeyDown`).
- **External Subscriptions**: History tape updates and network status monitoring subscribe via `useSyncExternalStore`.

### 6.2 Ergonomics, Visual Design & Accessibility (WCAG AAA)
- **Palette (GTA VI Neon Sunset)**:
  - Background & Atmosphere: Midnight Violet (`#36294b`) with radial gradient overlays of Violet Twilight (`#5644c0`) and Raspberry Plum (`#ad3083`).
  - Interactive Surfaces: Apple Liquid Glass (`backdrop-blur(16-24px)`, specular border highlights `rgba(255,255,255,0.15)`).
  - Accent Actions: Rose Kiss (`#fe5ea3`), Petal Pink (`#bb80a9`), Powder Blue (`#98b5cc`).
- **Contrast**: Contrast ratios $\ge 7:1$ across text and interactive button faces against backgrounds.
- **Display**: Semantic `<output>` element formatted with `tabular-nums` and dynamic font scaling supporting up to 16 visible digits before exponent notation.
- **Keyboard Navigation**:
  - Digits `0`-`9`, Decimal point `.`
  - Operators: `+`, `-`, `*`, `/`, `^`, `%`
  - Calculation trigger: `Enter`, `=`
  - Deletion: `Backspace` (delete last character), `Escape` (Clear All / AC)
- **Modals & Alerts**:
  - Toast notifications: `role="alert"`, `aria-live="assertive"`
  - History drawer: `role="dialog"`, `aria-modal="true"`, dismissible via `Escape` key and backdrop click.
