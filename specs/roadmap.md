# specs/roadmap.md: Implementation Roadmap & Checklist

This document tracks the step-by-step development milestones for the Sezzle FinTech Calculator. Every phase contains explicit acceptance criteria and automated validation commands that must pass before advancing.

---

## Phase 0: Scaffolding, `pnpm` Setup & CI/CD Pipeline First
- [ ] **0.1 Specification Anchoring**
  - [x] Create `AGENTS.md` (AI operational rules, SSOT, guardrails).
  - [x] Create `SPEC.md` (EARS/BDD contracts, error catalog, precision invariants).
  - [x] Create `specs/tech-stack.md` (Architectural justifications, trade-offs).
  - [x] Create `specs/roadmap.md` (Implementation checklist).
  - [x] Create `specs/prompts.md` (Audit prompt log template).
- [ ] **0.2 Repository Initialization**
  - [ ] Initialize git repository and create comprehensive `.gitignore`.
  - [ ] Initialize Go module (`go mod init github.com/julianbarberis/sezzle-calculator`) in `backend/`.
  - [ ] Scaffold React 19 + TypeScript + Vite frontend in `frontend/` using `pnpm create vite frontend --template react-ts`.
  - [ ] Install frontend dependencies (`lucide-react`, `tailwindcss`, `@tailwindcss/vite`) via `pnpm add`.
- [ ] **0.3 CI/CD GitHub Actions Pipeline**
  - [ ] Create `.github/workflows/ci.yml`.
  - [ ] Define Backend Job: `go test -v -race -cover ./...` with Go 1.22+.
  - [ ] Define Frontend Job: `pnpm install`, `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build`.
  - [ ] Define Container Job: `docker compose build`.

---

## Phase 1: Go Decimal Engine & Domain Unit Tests
- [ ] **1.1 Decimal Engine Implementation (`backend/internal/calculator/`)**
  - [ ] Add `github.com/shopspring/decimal` dependency.
  - [ ] Implement operations: `Add`, `Subtract`, `Multiply`, `Divide`.
  - [ ] Implement robust integer power (`Pow`) supporting $\pm 1000$ exponents, bases up to $10^{400}$, $0^0 = 1$, and reciprocal division for negative exponents.
  - [ ] Implement pure decimal Newton-Raphson square root (`Sqrt`) with dynamic scale precision up to $10^{400}$ without importing Go `math`.
  - [ ] Implement unary ($a / 100$) and binary ($(a \times b) / 100$) percentage.
  - [ ] Enforce domain validations (division by zero, negative square root, exponent bounds).
- [ ] **1.2 Domain Engine Unit Testing**
  - [ ] Author table-driven unit tests in `calculator_test.go`.
  - [ ] Verify financial precision edge cases ($0.1 + 0.2 = 0.3$, $0^0 = 1$, $\sqrt{10^{400}} = 10^{200}$).
  - [ ] Validate coverage meets or exceeds 95% (`go test -v -cover ./...`).

---

## Phase 2: Go REST API Microservice, History & Concurrency Tests
- [ ] **2.1 In-Memory History Ring Buffer (`backend/internal/history/`)**
  - [ ] Implement circular ring buffer with fixed capacity 20.
  - [ ] Synchronize reads and writes using `sync.RWMutex`.
  - [ ] Expose `Push(entry Calculation)` and `GetAll() []Calculation` in reverse chronological order.
  - [ ] Unit test ring buffer capacity capping and FIFO eviction.
- [ ] **2.2 REST API Server & HTTP Handlers (`backend/internal/api/`)**
  - [ ] Configure `http.Server` with production timeouts (`ReadHeaderTimeout: 5s`, `ReadTimeout: 15s`, etc.).
  - [ ] Implement CORS middleware and JSON panic recovery middleware.
  - [ ] Implement `GET /api/v1/health`.
  - [ ] Implement `POST /api/v1/calculate` with atomic sequential ID generation (`atomic.Uint64`).
  - [ ] Implement `GET /api/v1/history`.
  - [ ] Wire strict error catalog (`MALFORMED_JSON`, `INVALID_OPERAND`, `DIVISION_BY_ZERO`, etc.).
- [ ] **2.3 Concurrency & Race Verification**
  - [ ] Write adversarial concurrency test launching 60 parallel goroutines writing and reading history simultaneously.
  - [ ] Execute `go test -v -race -cover ./...` with zero race warnings.

---

## Phase 3: Frontend Apple Glass UI, State Machine & Vitest Suite
- [ ] **3.1 Styling & Theme System**
  - [ ] Configure Tailwind CSS v4 with GTA VI Neon Sunset palette tokens.
  - [ ] Implement Apple Liquid Glassmorphism utility classes (`backdrop-blur`, specular borders, gradient reflections).
  - [ ] Verify WCAG AAA contrast ratio ($\ge 7:1$) on text and buttons.
- [ ] **3.2 Deterministic State Machine (`calculatorReducer`)**
  - [ ] Define typed actions (`INPUT_DIGIT`, `INPUT_DECIMAL`, `SET_OPERATION`, `CALCULATE`, `CLEAR`, `BACKSPACE`, `TOGGLE_SIGN`, `SET_ERROR`).
  - [ ] Implement pure reducer resilient to `React.StrictMode` double invocation.
  - [ ] Support dynamic string formatting and up to 16 visible digits in the `<output>` display.
- [ ] **3.3 Zero-`useEffect` Architecture**
  - [ ] Implement `useSyncExternalStore` store for history tape updates.
  - [ ] Implement `useSyncExternalStore` store for network/online status.
  - [ ] Bind keyboard events directly via event listeners without `useEffect`.
  - [ ] Trigger calculation API mutations directly from click/enter handlers.
- [ ] **3.4 Component Suite**
  - [ ] `<Display />`: Semantic `<output>` with tabular numbers and auto-scaling font size.
  - [ ] `<Keypad />`: Ergonomic grid layout with accessible button roles and keyboard visual feedback.
  - [ ] `<HistoryTape />`: Drawer/dialog modal (`role="dialog"`, `aria-modal="true"`, `Escape` to close).
  - [ ] `<Toast />`: Floating error alert (`role="alert"`).
- [ ] **3.5 Vitest & React Testing Library Suite**
  - [ ] Achieve $\ge 95\%$ test coverage across components and reducer.
  - [ ] Verify zero `act(...)` warnings in `stderr`.
  - [ ] Verify 100-cycle `React.StrictMode` endurance.

---

## Phase 4: Containerization, Verification & Documentation
- [ ] **4.1 Docker Packaging**
  - [ ] Multi-stage `backend/Dockerfile` producing a minimal scratch/alpine static Go binary.
  - [ ] Multi-stage `frontend/Dockerfile` building Vite assets and serving via Nginx Alpine reverse proxy.
  - [ ] Root `docker-compose.yml` orchestrating backend and frontend services.
- [ ] **4.2 End-to-End Automated Verification**
  - [ ] Write zero-dependency `tests/e2e/runner.mjs`.
  - [ ] Verify all API routes, precision calculations, and error envelopes against running containers.
- [ ] **4.3 Documentation & Sezzle Submission**
  - [ ] Write comprehensive `README.md` with architecture diagrams, quickstart instructions, API curl examples, and design decisions.
  - [ ] Complete `specs/prompts.md` audit log.
