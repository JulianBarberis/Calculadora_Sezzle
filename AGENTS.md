# AGENTS.md: Operational Rules for AI Agents

Welcome to the Sezzle FinTech Calculator repository. This document defines the non-negotiable operational rules, coding standards, architectural guardrails, and validation procedures that all AI agents (and human engineers) must strictly uphold when contributing to this codebase.

---

## 1. Single Source of Truth (SSOT)
- `SPEC.md` is the canonical, immutable functional and behavioral specification for this system.
- Code implementations must never contradict or deviate from `SPEC.md`. If an ambiguity or edge case arises, update `SPEC.md` and document the decision before modifying implementation code.
- Every architectural choice, endpoint contract, and error catalog code is bounded by `SPEC.md` and `specs/tech-stack.md`.

---

## 2. Skill Activation Matrix
AI agents contributing to this repository must activate and adhere to the specialized skills stack corresponding to each architectural domain and operational phase:

| Domain / Responsibility | Mandatory Skills | Scope & Invariants |
| :--- | :--- | :--- |
| **Go Backend** (Domain Engine, HTTP Layer, Concurrency) | `/golang-patterns`, `/golang-testing` | Idiomatic Go architecture, clean layered microservice structure (`cmd/api/` -> `internal/handler/` -> `internal/calculator/`), error wrapping, concurrency safety, table-driven unit and integration testing, race detector verification (`-race`), subtests, and strict code coverage thresholds ($\ge 95\%$). |
| **React Frontend** (State Architecture, Zero-useEffect Policy) | `/react-performance-optimization` | Strict zero-`useEffect` policy, pure `useReducer` state machines, `useSyncExternalStore` external subscriptions, elimination of re-render cascades, and React 19 StrictMode double-invocation resilience. |
| **Frontend UI/UX, Accessibility & Ergonomics** | `/impeccable`, `/design-taste-frontend`, `/web-design-guidelines` | Anti-slop UI standards, high-end visual polish, intentional art direction, Apple Liquid Glassmorphism execution (`backdrop-blur(16-24px)`, specular highlights, depth layers), GTA VI Neon Sunset palette, and WCAG AAA accessibility ($\ge 7:1$ contrast ratio, semantic `<output>`, ARIA alerts/dialogs). |
| **Frontend Testing** | `/vitest` | ESM-native fast unit test runner, Jest-compatible assertions, 100-cycle StrictMode endurance validation, and zero `act(...)` warnings in `stderr`. |
| **DevOps & Containerization** | `/docker-patterns`, `/fullstack-testing` | Production-grade multi-stage Dockerfiles (scratch/alpine Go static binary and Nginx Alpine frontend), secure non-root containers, unified Docker Compose orchestration, and cross-tier contract verification (`tests/e2e/runner.mjs`). |
| **Pull Requests** | `/pr-description-generator` | Professional, well-structured PR descriptions written in Spanish analyzing code diffs, structured by architectural layers (Controller, Service, Repository, DTO/Model, Configuration). |

---

## 3. Phase Completion & PR Delivery Workflow
Upon finishing any implementation phase or milestone (e.g., Phase 0, Phase 1, Phase 2, Phase 3, Phase 4), all AI agents and engineers must adhere to the following delivery protocol:

1. **Pre-Verification Gate**:
   - **Backend**: All unit and concurrency tests must pass with race detection enabled:
     ```bash
     cd backend && go test -v -race -cover ./...
     ```
     Coverage must meet or exceed $95\%$ on `internal/calculator` and `internal/history`.
   - **Frontend**: Full compilation, linting, and test execution must succeed with zero errors:
     ```bash
     cd frontend && pnpm test && pnpm type-check && pnpm lint && pnpm build
     ```
     Vitest suite must report 100% pass with zero `act(...)` warnings in `stderr`.
   - **Containerization**: Container build verification must pass when applicable (`docker compose build`).

2. **Dedicated Feature Branch & Push**:
   - All commits for the phase must reside on a semantic feature branch (e.g., `feature/phase-0-scaffolding`, `feature/phase-1-decimal-engine`, etc.).
   - Push the feature branch to GitHub:
     ```bash
     git push -u origin <branch-name>
     ```

3. **Pull Request Creation & Skill Usage**:
   - Open a Pull Request targeting `main` on GitHub.
   - **MANDATORY**: Invoke and execute the `/pr-description-generator` skill.
   - The PR description must be drafted in Spanish, explaining all changes clearly, concisely, and simply, categorized by architectural layers:
     - **Controller:** (HTTP transport, route handlers, middleware)
     - **Service:** (Domain calculation engine, business logic, precision routines)
     - **Repository:** (History ring buffer, in-memory data store)
     - **DTO / Model:** (Request/response schemas, error envelopes, domain types)
     - **Configuration:** (Vite, Tailwind v4, Docker, GitHub Actions, environment variables)
   - Ensure the description articulates the business rationale (*why*), references exact symbols in backticks, and omits layers that were not modified.

4. **Documentation & Traceability**:
   - Capture the generated GitHub PR URL.
   - Record the PR link directly into the phase checklist in `specs/roadmap.md` and `implementation_plan.md` before checking off the phase as complete.
   - Record an audit log entry in `specs/prompts.md`.

---

## 4. Mathematical Domain Engine Invariants (Go Backend)
- **Total Eradication of `float32`/`float64`**: The domain calculation engine in `backend/internal/calculator/` is **strictly prohibited** from importing the Go standard `math` package or casting to native floating-point types (`float32`, `float64`).
- **Arbitrary Precision Arithmetic**: All numeric calculations must be performed using `github.com/shopspring/decimal`.
- **Square Root Algorithm**: Must use a pure decimal Newton-Raphson approximation algorithm:
  $$x_{n+1} = \frac{1}{2}\left(x_n + \frac{S}{x_n}\right)$$
  with dynamic scale convergence supporting radicands up to $10^{400}$ without floating-point intermediary states.
- **Power Algorithm**: Integer exponentiation up to $\pm 1000$ with bases up to $10^{400}$, strictly respecting $0^0 = 1$ and negative exponent reciprocal $1 / a^{|b|}$.
- **Zero Division Safety**: Division by zero (including $0^{-k}$) must be caught prior to any calculation and returned as a domain validation error.

---

## 5. Backend Conventions & Guardrails (Go 1.22+)
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

## 6. Frontend Conventions & Guardrails (React 19 + TypeScript)
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

## 7. Verification & Quality Commands
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

## 8. Audit & Prompt Logging
Every interaction and agent generation must be recorded in `specs/prompts.md` detailing the timestamp, prompt directive, implementation changes, and verification outcomes to satisfy Sezzle's engineering auditability standards.
