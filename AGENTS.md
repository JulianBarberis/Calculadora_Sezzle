# AGENTS.md: Operational Rules for AI Agents

Welcome to the Sezzle FinTech Calculator repository. This document defines the non-negotiable operational rules, coding standards, architectural guardrails, and validation procedures that all AI agents (and human engineers) must strictly uphold when contributing to this codebase.

---

## 1. Single Source of Truth (SSOT)
- `SPEC.md` is the canonical, immutable functional and behavioral specification for this system.
- Code implementations must never contradict or deviate from `SPEC.md`. If an ambiguity or edge case arises, update `SPEC.md` and document the decision before modifying implementation code.
- Every architectural choice, endpoint contract, and error catalog code is bounded by `SPEC.md` and `specs/tech-stack.md`.

---

## 2. Mathematical Domain Engine Invariants (Go Backend)
- **Total Eradication of `float32`/`float64`**: The domain calculation engine in `backend/internal/calculator/` is **strictly prohibited** from importing the Go standard `math` package or casting to native floating-point types (`float32`, `float64`).
- **Arbitrary Precision Arithmetic**: All numeric calculations must be performed using `github.com/shopspring/decimal`.
- **Square Root Algorithm**: Must use a pure decimal Newton-Raphson approximation algorithm:
  $$x_{n+1} = \frac{1}{2}\left(x_n + \frac{S}{x_n}\right)$$
  with dynamic scale convergence supporting radicands up to $10^{400}$ without floating-point intermediary states.
- **Power Algorithm**: Integer exponentiation up to $\pm 1000$ with bases up to $10^{400}$, strictly respecting $0^0 = 1$ and negative exponent reciprocal $1 / a^{|b|}$.
- **Zero Division Safety**: Division by zero (including $0^{-k}$) must be caught prior to any calculation and returned as a domain validation error.

---

## 3. Backend Conventions & Guardrails (Go 1.22+)
- **Layered Architecture**:
  - `cmd/api/`: Application entry point, flag parsing, server bootstrapping, graceful shutdown.
  - `internal/api/` (or `internal/handler/`): HTTP transport layer, request parsing, JSON envelope responses, HTTP status mapping, middleware.
  - `internal/calculator/`: Pure domain calculation engine, completely decoupled from HTTP concerns.
  - `internal/history/`: Thread-safe in-memory ring buffer (`cap = 20`) protected by `sync.RWMutex`.
- **Concurrency & Thread Safety**:
  - History buffer mutations must be synchronized with `sync.RWMutex`.
  - Sequential calculation identifiers must be generated using atomic primitives (`sync/atomic` / `atomic.Uint64`).
  - Zero tolerance for race conditions. All tests must pass with `-race`.
- **Server Hardening**:
  - Use explicitly configured `http.Server` timeouts: `ReadHeaderTimeout: 5s`, `ReadTimeout: 15s`, `WriteTimeout: 15s`, `IdleTimeout: 60s`.
  - Include standard CORS middleware and JSON panic recovery middleware.
- **Error Catalog**:
  - Strict compliance with the error schema defined in `SPEC.md`. No generic HTTP error bodies or raw Go errors exposed to the client.

---

## 4. Frontend Conventions & Guardrails (React 19 + TypeScript)
- **Package Manager Mandate**: **`pnpm` is strictly enforced**. Never invoke `npm` or `yarn`. Do not commit `package-lock.json` or `yarn.lock`.
- **STRICT ZERO-`useEffect` POLICY**:
  - Absolute prohibition of `useEffect` across all components and custom hooks.
  - State transitions must occur via a pure `calculatorReducer` invoked by user actions (`onClick`, `onKeyDown`).
  - External subscriptions (history updates, network state, window keyboard events) must be managed through `useSyncExternalStore`.
  - Network requests must be triggered directly within event handlers, not as reactive effects.
- **React 19 & StrictMode Resilience**:
  - The reducer must be pure and deterministic. It must survive 100-cycle `React.StrictMode` double-invocation without duplicate mutations or state degradation.
- **Visual Design & Accessibility (WCAG AAA)**:
  - Theme: Apple Liquid Glassmorphism (`backdrop-blur(16-24px)`, specular highlights, depth layers) styled with the GTA VI Neon Sunset palette.
  - Contrast ratio $\ge 7:1$ for interactive elements.
  - Semantic `<output>` element for the primary calculation display with `tabular-nums` and dynamic font scaling.
  - ARIA attributes: Toast alerts must have `role="alert"`; History modal/drawer must have `role="dialog"` with `aria-modal="true"` and `Escape` key dismissal.

---

## 5. Verification & Quality Commands
Every agent must run and verify all relevant test suites before declaring work complete:

### Backend Validation
```bash
# Run unit, domain, and concurrency tests with race detection and coverage
cd backend
go test -v -race -cover ./...
```
*Coverage requirement: $\ge 95\%$ on `internal/calculator` and `internal/history`.*

### Frontend Validation
```bash
cd frontend
pnpm test          # Vitest suite (zero act warnings, 100% pass)
pnpm type-check     # TypeScript strict compilation (tsc --noEmit)
pnpm lint           # ESLint verification
pnpm build          # Production bundle build
```

### Full-Stack & Container Verification
```bash
# Build and run containers
docker compose build
docker compose up -d

# Run end-to-end integration and precision suite
node tests/e2e/runner.mjs
```

---

## 6. Audit & Prompt Logging
Every interaction and agent generation must be recorded in `specs/prompts.md` detailing the timestamp, prompt directive, implementation changes, and verification outcomes to satisfy Sezzle's engineering auditability standards.
