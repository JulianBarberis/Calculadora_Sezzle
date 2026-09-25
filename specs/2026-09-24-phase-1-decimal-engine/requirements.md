# Feature Requirements: Phase 1 — Go Decimal Engine & Domain Unit Tests

Branch: `feature/phase-1-decimal-engine`  
Date: `2026-09-24`  
Context: Sezzle FinTech Calculator Take-Home Engineering Assignment  
References: [`AGENTS.md`](file:///Users/julianbarberis/Repositorios/Calculadora_Sezzle/AGENTS.md), [`SPEC.md`](file:///Users/julianbarberis/Repositorios/Calculadora_Sezzle/SPEC.md), [`specs/tech-stack.md`](file:///Users/julianbarberis/Repositorios/Calculadora_Sezzle/specs/tech-stack.md)

---

## 1. Context & Business Rationale
In FinTech and Buy Now, Pay Later (BNPL) operations, numeric inaccuracies stemming from binary floating-point representations (IEEE 754) can cause ledger discrepancies, failed reconciliations, and regulatory non-compliance. Phase 1 implements an unyielding, arbitrary-precision decimal engine that performs exact calculations without floating-point conversion.

---

## 2. In-Scope vs. Out-of-Scope

### 2.1 In-Scope (Phase 1 Deliverables)
- Pure domain package `backend/internal/calculator/`.
- Integration of `github.com/shopspring/decimal`.
- Mathematical operations:
  - `Add(a, b)`: Exact decimal addition ($a + b$).
  - `Subtract(a, b)`: Exact decimal subtraction ($a - b$).
  - `Multiply(a, b)`: Exact decimal multiplication ($a \times b$).
  - `Divide(a, b)`: Arbitrary-precision division ($a / b$) with 32 decimal places of scale and division-by-zero validation.
  - `Power(a, b)`: Integer exponentiation for $b \in [-1000, 1000]$ supporting $0^0 = 1$ and reciprocal division for negative exponents.
  - `Sqrt(a)`: Pure decimal Newton-Raphson square root algorithm supporting radicands up to $10^{400}$ without floating-point casting.
  - `Percentage(a, b)`: Unary ($a / 100$) and binary ($(a \times b) / 100$) percentage.
- Structured domain error types matching `SPEC.md`.
- Comprehensive table-driven unit tests reaching $\ge 95\%$ coverage.

### 2.2 Out-of-Scope (Deferred to Future Phases)
- HTTP REST handlers and routing (`/api/v1/calculate`) $\implies$ **Phase 2**.
- In-memory circular ring buffer calculation history $\implies$ **Phase 2**.
- Concurrency stress testing with 60 parallel goroutines $\implies$ **Phase 2**.
- Frontend user interface and state machine $\implies$ **Phase 3**.

---

## 3. Mathematical Domain Engine Invariants

### 3.1 Total Eradication of `float32`/`float64`
- The domain calculation engine in `backend/internal/calculator/` is **strictly prohibited** from:
  1. Importing the Go standard `math` package.
  2. Casting any numeric value to or from `float32` or `float64`.
  3. Using floating-point intermediate values.
- All numbers are instantiated, manipulated, and exported via `decimal.Decimal` or string representations.

### 3.2 Dynamic Scale Precision & Division
- For fractional division, the engine computes results to at least **32 decimal places** (`scale = 32`).
- Trailing zeros are trimmed where appropriate to preserve canonical representation (e.g. `0.3000...` $\implies$ `0.3`).

### 3.3 Newton-Raphson Decimal Square Root Algorithm
- Radicands $a \ge 0$ are evaluated using Newton-Raphson approximation:
  $$x_{n+1} = \frac{1}{2}\left(x_n + \frac{a}{x_n}\right)$$
- **Initial Estimate ($x_0$)**: Determined via string length analysis of integer digits to ensure rapid convergence without floating-point `math.Log`:
  $$x_0 = 10^{\lfloor \text{len(integer part)} / 2 \rfloor}$$
- **Convergence Condition**: Iterations continue until $|x_{n+1} - x_n| < 10^{-32}$ or 100 iterations are reached.
- **Scale Support**: Evaluates radicands up to $10^{400}$ (e.g., $\sqrt{10^{400}} = 10^{200}$).
- **Negative Radicand**: $a < 0$ returns `ErrNegativeSquareRoot`.

### 3.4 Integer Exponentiation (`Power`)
- Base $a$ supports decimal values up to $10^{400}$.
- Exponent $b$ is bounded to integer values in $[-1000, 1000]$.
- Special Rules:
  - $0^0 = 1$ (standard mathematical definition for calculators).
  - $a^0 = 1$ for all $a \neq 0$.
  - $0^{-k} \implies$ Division by zero (`ErrDivisionByZero`).
  - $b < 0 \implies 1 / a^{|b|}$ evaluated with 32 decimal places of scale.

---

## 4. Error Catalog Alignment

| Error Code | Error Message | Domain Error Type |
| :--- | :--- | :--- |
| `DIVISION_BY_ZERO` | `"Cannot divide by zero. Please enter a non-zero divisor."` | `ErrDivisionByZero` |
| `NEGATIVE_SQUARE_ROOT` | `"Cannot calculate the square root of a negative number in real numbers."` | `ErrNegativeSquareRoot` |
| `INVALID_OPERAND` | `"Operand '<name>' is not a valid decimal number"` | `ErrInvalidOperand` |
| `INVALID_OPERATION` | `"Exponent out of range: must be between -1000 and 1000"` | `ErrExponentOutOfBounds` |
