# specs/roadmap.md: Implementation Roadmap & Checklist

This document tracks the step-by-step development milestones for the Sezzle FinTech Calculator. Every phase contains explicit acceptance criteria, automated validation commands, the designated skills stack that governs its implementation, and a mandatory Pull Request completion checklist.

---

## Skills Activation Matrix

| Domain / Responsibility | Mandatory Skills | Scope & Invariants |
| :--- | :--- | :--- |
| **Go Backend** (Domain Engine, HTTP Layer, Concurrency) | `/golang-patterns`, `/golang-testing` | Idiomatic Go architecture, clean layered microservice structure (`cmd/api/` -> `internal/handler/` -> `internal/calculator/`), error wrapping, concurrency safety, table-driven unit and integration testing, race detector verification (`-race`), subtests, and strict code coverage thresholds ($\ge 95\%$). |
| **React Frontend** (State Architecture, Zero-useEffect Policy) | `/react-performance-optimization` | Strict zero-`useEffect` policy, pure `useReducer` state machines, `useSyncExternalStore` external subscriptions, elimination of re-render cascades, and React 19 StrictMode double-invocation resilience. |
| **Frontend UI/UX, Accessibility & Ergonomics** | `/impeccable`, `/design-taste-frontend`, `/web-design-guidelines` | Anti-slop UI standards, high-end visual polish, intentional art direction, Apple Liquid Glassmorphism execution (`backdrop-blur(16-24px)`, specular highlights, depth layers), GTA VI Neon Sunset palette, and WCAG AAA accessibility ($\ge 7:1$ contrast ratio, semantic `<output>`, ARIA alerts/dialogs). |
| **Frontend Testing** | `/vitest` | ESM-native fast unit test runner, Jest-compatible assertions, 100-cycle StrictMode endurance validation, and zero `act(...)` warnings in `stderr`. |
| **DevOps & Containerization** | `/docker-patterns`, `/fullstack-testing` | Production-grade multi-stage Dockerfiles (scratch/alpine Go static binary and Nginx Alpine frontend), secure non-root containers, unified Docker Compose orchestration, and cross-tier contract verification (`tests/e2e/runner.mjs`). |
| **Pull Requests** | `/pr-description-generator` | Professional, well-structured PR descriptions written in Spanish analyzing code diffs, structured by architectural layers (Controller, Service, Repository, DTO/Model, Configuration). |

---

## Phase 0: Scaffolding, `pnpm` Setup & CI/CD Pipeline First
> **Designated Skills**:
> - `/golang-patterns`
> - `/design-taste-frontend`
> - `/vitest`
> - `/docker-patterns`
> - `/pr-description-generator`

- [x] **0.1 Specification Anchoring**
  - [x] Create `AGENTS.md` (AI operational rules, SSOT, guardrails, skills matrix, PR workflow).
  - [x] Create `SPEC.md` (EARS/BDD contracts, error catalog, precision invariants).
  - [x] Create `specs/tech-stack.md` (Architectural justifications, trade-offs).
  - [x] Create `specs/roadmap.md` (Implementation checklist with phase skill stacks & PR workflow).
  - [x] Create `specs/prompts.md` (Audit prompt log template).
- [x] **0.2 Repository Initialization**
  - [x] Initialize git repository and create comprehensive `.gitignore`.
  - [x] Initialize Go module (`go mod init github.com/julianbarberis/sezzle-calculator`) in `backend/`.
  - [x] Scaffold React 19 + TypeScript + Vite frontend in `frontend/` using `pnpm create vite frontend --template react-ts`.
  - [x] Install frontend dependencies (`lucide-react`, `tailwindcss`, `@tailwindcss/vite`) via `pnpm add`.
- [x] **0.3 CI/CD GitHub Actions Pipeline**
  - [x] Create `.github/workflows/ci.yml`.
  - [x] Define Backend Job: `go test -v -race -cover ./...` with Go 1.22+.
  - [x] Define Frontend Job: `pnpm install`, `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build`.
  - [x] Define Container Job: `docker compose build`.
- [x] **0.4 Phase Completion & PR Delivery Workflow**
  - [x] Run all test suites, race detection, and linters.
  - [x] Create a GitHub Pull Request using the `/pr-description-generator` skill (in Spanish, structured by architectural layers).
  - [x] Record the PR link in the phase documentation. *(PR URL: [PR #1](https://github.com/JulianBarberis/Calculadora_Sezzle/pull/1))*

---

## Phase 1: Go Decimal Engine & Domain Unit Tests
> **Designated Skills**:
> - `/golang-patterns`
> - `/golang-testing`
> - `/pr-description-generator`

- [x] **1.1 Decimal Engine Implementation (`backend/internal/calculator/`)**
  - [x] Add `github.com/shopspring/decimal` dependency (strictly zero `float32`/`float64`, no Go `math` import).
  - [x] Implement operations: `Add`, `Subtract`, `Multiply`, `Divide`.
  - [x] Implement robust integer power (`Pow`) supporting $\pm 1000$ exponents, bases up to $10^{400}$, $0^0 = 1$, and reciprocal division for negative exponents.
  - [x] Implement pure decimal Newton-Raphson square root (`Sqrt`) with dynamic scale precision up to $10^{400}$ without importing Go `math`.
  - [x] Implement unary ($a / 100$) and binary ($(a \times b) / 100$) percentage.
  - [x] Enforce domain validations (division by zero, negative square root, exponent bounds).
- [x] **1.2 Domain Engine Unit Testing**
  - [x] Author table-driven unit tests in `calculator_test.go` (`/golang-testing`).
  - [x] Verify financial precision edge cases ($0.1 + 0.2 = 0.3$, $0^0 = 1$, $\sqrt{10^{400}} = 10^{200}$).
  - [x] Validate coverage meets or exceeds 95% (`go test -v -cover ./...` achieved 97.7%).
- [x] **1.3 Phase Completion & PR Delivery Workflow**
  - [x] Run all test suites, race detection, and linters (`go test -v -race -cover ./...` $\ge 95\%$).
  - [x] Create a GitHub Pull Request using the `/pr-description-generator` skill (in Spanish, structured by architectural layers).
  - [x] Record the PR link in the phase documentation. *(PR URL: [PR #2](https://github.com/JulianBarberis/Calculadora_Sezzle/pull/2))*

---

## Phase 2: Go REST API Microservice, History & Concurrency Tests
> **Designated Skills**:
> - `/golang-patterns`
> - `/golang-testing`
> - `/fullstack-testing`
> - `/pr-description-generator`

- [x] **2.1 In-Memory History Ring Buffer (`backend/internal/history/`)**
  - [x] Implement circular ring buffer with fixed capacity 20.
  - [x] Synchronize reads and writes using `sync.RWMutex`.
  - [x] Expose `Push(entry Calculation)` and `GetAll() []Calculation` in reverse chronological order.
  - [x] Unit test ring buffer capacity capping and FIFO eviction (100.0% coverage).
- [x] **2.2 REST API Server & HTTP Handlers (`backend/internal/api/`)**
  - [x] Configure `http.Server` with production timeouts (`ReadHeaderTimeout: 5s`, `ReadTimeout: 15s`, etc.) via standard `net/http`.
  - [x] Implement CORS middleware and JSON panic recovery middleware.
  - [x] Implement `GET /api/v1/health`.
  - [x] Implement `POST /api/v1/calculate` with atomic sequential ID generation (`atomic.Uint64`).
  - [x] Implement `GET /api/v1/history`.
  - [x] Wire strict error catalog (`MALFORMED_JSON`, `INVALID_OPERAND`, `DIVISION_BY_ZERO`, etc.).
- [x] **2.3 Concurrency & Race Verification**
  - [x] Write adversarial concurrency test launching 60 parallel goroutines writing and reading history simultaneously.
  - [x] Execute `go test -v -race -cover ./...` with zero race warnings (99.5% coverage on `internal/api`).
- [x] **2.4 Phase Completion & PR Delivery Workflow**
  - [x] Run all test suites, race detection, and linters (`go test -v -race -cover ./...` $\ge 95\%$).
  - [x] Create a GitHub Pull Request using the `/pr-description-generator` skill (in Spanish, structured by architectural layers).
  - [x] Record the PR link in the phase documentation. *(PR URL: [PR #3](https://github.com/JulianBarberis/Calculadora_Sezzle/pull/3))*

---

## Phase 3: Frontend Apple Glass UI, State Machine & Vitest Suite
> **Designated Skills**:
> - `/react-performance-optimization`
> - `/impeccable`
> - `/design-taste-frontend`
> - `/web-design-guidelines`
> - `/vitest`
> - `/fullstack-testing`
> - `/pr-description-generator`

- [x] **3.1 Styling & Theme System (`/design-taste-frontend`, `/impeccable`, `/web-design-guidelines`)**
  - [x] Configure Tailwind CSS v4 with GTA VI Neon Sunset palette tokens.
  - [x] Implement Apple Liquid Glassmorphism utility classes (`backdrop-blur(16-24px)`, specular borders, gradient reflections).
  - [x] Verify WCAG AAA contrast ratio ($\ge 7:1$) on text and interactive elements.
- [x] **3.2 Deterministic State Machine (`/react-performance-optimization`)**
  - [x] Define typed actions (`INPUT_DIGIT`, `INPUT_DECIMAL`, `SET_OPERATION`, `CALCULATE`, `CLEAR`, `BACKSPACE`, `TOGGLE_SIGN`, `SET_ERROR`).
  - [x] Implement pure reducer resilient to `React.StrictMode` double invocation.
  - [x] Support dynamic string formatting and up to 16 visible digits in the `<output>` display without layout overflow.
- [x] **3.3 Zero-`useEffect` Architecture (`/react-performance-optimization`)**
  - [x] Implement `useSyncExternalStore` store for history tape updates.
  - [x] Implement `useSyncExternalStore` store for network/online status.
  - [x] Bind keyboard events directly via event listeners without `useEffect`.
  - [x] Trigger calculation API mutations directly from click/enter handlers.
- [x] **3.4 Component Suite (`/impeccable`)**
  - [x] `<Display />`: Semantic `<output>` with tabular numbers and auto-scaling font size.
  - [x] `<Keypad />`: Ergonomic grid layout with accessible button roles and keyboard visual feedback.
  - [x] `<HistoryTape />`: Drawer/dialog modal (`role="dialog"`, `aria-modal="true"`, `Escape` to close).
  - [x] `<Toast />`: Floating error alert (`role="alert"`).
- [x] **3.5 Vitest & Fullstack Testing Suite (`/vitest`, `/fullstack-testing`)**
  - [x] Achieve $\ge 95\%$ test coverage across state machine, stores, and components.
  - [x] Verify zero `act(...)` warnings in `stderr`.
  - [x] Verify 100-cycle `React.StrictMode` endurance.
- [x] **3.6 Phase Completion & PR Delivery Workflow**
  - [x] Run all test suites, race detection, and linters (`pnpm test`, `pnpm type-check`, `pnpm lint`, `pnpm build`).
  - [x] Create a GitHub Pull Request using the `/pr-description-generator` skill (in Spanish, structured by architectural layers).
  - [x] Record the PR link in the phase documentation. *(PR URL: [PR #4](https://github.com/JulianBarberis/Calculadora_Sezzle/pull/4))*

---

## Phase 4: Containerization, Verification & Documentation
> **Designated Skills**:
> - `/docker-patterns`
> - `/fullstack-testing`
> - `/pr-description-generator`

- [x] **4.1 Docker Packaging (`/docker-patterns`)**
  - [x] Multi-stage `backend/Dockerfile` producing a minimal scratch/alpine static Go binary.
  - [x] Multi-stage `frontend/Dockerfile` building Vite assets and serving via Nginx Alpine reverse proxy.
  - [x] Root `docker-compose.yml` orchestrating backend and frontend services.
- [x] **4.2 End-to-End Automated Verification (`/fullstack-testing`)**
  - [x] Write zero-dependency `tests/e2e/runner.mjs`.
  - [x] Verify all API routes, precision calculations, and error envelopes against running containers.
- [x] **4.3 Documentation & Sezzle Submission**
  - [x] Write comprehensive `README.md` with architecture diagrams, quickstart instructions, API curl examples, and design decisions.
  - [x] Complete `specs/prompts.md` audit log.
- [x] **4.4 Phase Completion & PR Delivery Workflow**
  - [x] Run all test suites, race detection, and linters (`docker compose build`, `node tests/e2e/runner.mjs`).
  - [x] Create a GitHub Pull Request using the `/pr-description-generator` skill (in Spanish, structured by architectural layers).
  - [x] Record the PR link in the phase documentation. *(PR URL: [PR #5](https://github.com/JulianBarberis/Calculadora_Sezzle/pull/5))*
