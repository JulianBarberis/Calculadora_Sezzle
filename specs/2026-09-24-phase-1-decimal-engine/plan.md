# Feature Plan: Phase 1 — Go Decimal Engine & Domain Unit Tests

Branch: `feature/phase-1-decimal-engine`  
Date: `2026-09-24`  
Status: `Completed`  
Designated Skills: `/golang-patterns`, `/golang-testing`, `/pr-description-generator`

---

## Task Group 1: Core Decimal Operations & Domain Errors

- [x] **Task 1.1: Dependency & Domain Error Definition**
  - Add `github.com/shopspring/decimal` dependency to `backend/go.mod`.
  - Author `backend/internal/calculator/errors.go` defining structured domain errors:
    - `ErrDivisionByZero`: `"Cannot divide by zero. Please enter a non-zero divisor."`
    - `ErrNegativeSquareRoot`: `"Cannot calculate the square root of a negative number in real numbers."`
    - `ErrExponentOutOfBounds`: `"Exponent out of range: must be between -1000 and 1000"`
    - `ErrInvalidOperand`: `"Operand is not a valid decimal number"`

- [x] **Task 1.2: Core Arithmetic Implementation (`backend/internal/calculator/calculator.go`)**
  - Implement basic operations:
    - `Add(a, b decimal.Decimal) decimal.Decimal`
    - `Subtract(a, b decimal.Decimal) decimal.Decimal`
    - `Multiply(a, b decimal.Decimal) decimal.Decimal`
    - `Divide(a, b decimal.Decimal) (decimal.Decimal, error)`
  - Enforce zero-division guard in `Divide`: if `b.IsZero()`, return `ErrDivisionByZero`.
  - Ensure zero native float types (`float32`, `float64`) and zero imports of standard `math`.

---

## Task Group 2: Advanced Precision Routines

- [x] **Task 2.1: Robust Integer Exponentiation (`Power`)**
  - Implement `Power(a decimal.Decimal, b int64) (decimal.Decimal, error)`:
    - Validate bounds: $|b| \le 1000$. Return `ErrExponentOutOfBounds` if violated.
    - Validate zero base with negative exponent: $a = 0 \land b < 0 \implies ErrDivisionByZero$.
    - Evaluate $0^0 = 1$ and $a^0 = 1$.
    - Negative exponent: evaluate $1 / a^{|b|}$ with scale precision 32.
    - Positive exponent: compute via binary exponentiation using decimal multiplication.

- [x] **Task 2.2: Pure Decimal Newton-Raphson Square Root (`Sqrt`)**
  - Implement `Sqrt(a decimal.Decimal) (decimal.Decimal, error)`:
    - Validate radicand: if `a.IsNegative()`, return `ErrNegativeSquareRoot`.
    - Handle trivial base cases: $a = 0 \implies 0$, $a = 1 \implies 1$.
    - Dynamic scale initial guess: $x_0 = 10^{\lfloor \text{digits}/2 \rfloor}$ (computed via integer magnitude string parsing, avoiding float math).
    - Iteration: $x_{n+1} = \frac{1}{2}\left(x_n + \frac{a}{x_n}\right)$ with division scale 34.
    - Convergence criterion: $|x_{n+1} - x_n| < 10^{-32}$ or max 100 iterations.
    - Supports radicands up to $10^{400}$ without precision degradation.

- [x] **Task 2.3: Percentage Operations (`Percentage`)**
  - Implement `Percentage(a decimal.Decimal, b *decimal.Decimal) decimal.Decimal`:
    - Unary: if `b == nil`, return $a / 100$.
    - Binary: if `b != nil`, return $(a \times b) / 100$.

---

## Task Group 3: Exhaustive Testing & Precision Verification

- [x] **Task 3.1: Table-Driven Unit Tests (`backend/internal/calculator/calculator_test.go`)**
  - Test suite covering all operations with table-driven cases.
  - Verify financial precision invariants ($0.1 + 0.2 = 0.3$, $0.3 - 0.2 = 0.1$, $0.1 \times 0.2 = 0.02$).
  - Verify edge cases: $0^0 = 1$, $2^{-3} = 0.125$, $\sqrt{0} = 0$, $\sqrt{10^{400}} = 10^{200}$.
  - Verify error handling: division by zero, negative square root, exponent overflow ($b = 1001$).

- [x] **Task 3.2: Coverage & Race Detector Gate**
  - Execute `go test -v -race -cover ./...` in `backend/`.
  - Enforce statement coverage threshold $\ge 95\%$ on `internal/calculator` (achieved 97.7%).

---

## Task Group 4: Phase Completion & PR Delivery Workflow

- [x] **Task 4.1: Pre-Verification Gate Execution**
  - Run `cd backend && go vet ./... && go test -v -race -cover ./...`.
  - Verify coverage meets or exceeds 95% with zero race warnings.

- [ ] **Task 4.2: Branch Push & Pull Request Creation**
  - Push branch to GitHub: `git push -u origin feature/phase-1-decimal-engine`.
  - Open a Pull Request targeting `main`.

- [ ] **Task 4.3: Mandatory `/pr-description-generator` Invocation**
  - Invoke `/pr-description-generator` to draft the PR description in Spanish, structured by architectural layers:
    - **Service** (`internal/calculator`)
    - **DTO / Model** (`internal/calculator/errors.go`)
    - **Configuration** (`go.mod`, `go.sum`)

- [ ] **Task 4.4: Documentation Traceability**
  - Record PR link in `specs/roadmap.md` and this `plan.md`.
  - Add Prompt Audit Log entry in `specs/prompts.md`.
  - **GitHub PR URL**: `TBD`
