# specs/tech-stack.md: Architecture Decisions & Technical Justifications

## 1. Executive Summary
This document provides the technical rationale, architectural trade-offs, and library selections for the Sezzle FinTech Calculator system. Every decision is anchored in FinTech operational requirements: auditability, deterministic arithmetic, zero race conditions, sub-millisecond response latency, and bulletproof client-side state handling.

---

## 2. Backend Architecture & Technology Choices

### 2.1 Go 1.22+ Microservice
- **Choice**: Go 1.22+ standard toolchain.
- **Alternatives Considered**: Node.js/TypeScript, Python (FastAPI), Rust (Actix-web).
- **Justification**:
  - **Memory Footprint & Startup**: Go produces single, statically linked binaries with negligible idle memory consumption (~10-15 MB) and sub-second container cold starts.
  - **Concurrency Primitives**: Native goroutines and channels, combined with `sync.RWMutex` and `sync/atomic`, provide compile-time verifiable, high-throughput concurrency safety.
  - **Standard Library Hardening**: Go's `net/http` provides battle-tested production server capabilities with first-class connection timeout configuration (`ReadHeaderTimeout`, `IdleTimeout`).
  - **Trade-offs**: Slightly more verbose error checking compared to Rust or TypeScript, but superior clarity, readability, and maintainability for high-reliability systems.

### 2.2 Arbitrary-Precision Engine: `github.com/shopspring/decimal`
- **Choice**: `github.com/shopspring/decimal`.
- **Alternatives Considered**: Go native `float64`, `math/big.Float`, `math/big.Rat`.
- **Justification**:
  - **Zero IEEE 754 Floating-Point Drift**: In Buy Now, Pay Later (BNPL) and payments infrastructure, calculations like `0.1 + 0.2` yielding `0.30000000000000004` lead to ledger discrepancies, broken reconciliations, and compliance penalties.
  - **Fixed-Point Decimal Ergonomics**: While `math/big.Float` also provides arbitrary precision, `shopspring/decimal` is specifically designed for monetary and financial computations. It handles serialization to/from JSON strings without loss of precision and includes clean rounding/scale control.
  - **Pure Decimal Newton-Raphson Sqrt**: We implement square roots natively in decimal space using Newton-Raphson iterations:
    $$x_{n+1} = \frac{1}{2}\left(x_n + \frac{S}{x_n}\right)$$
    This prevents standard `math.Sqrt` casting that would destroy precision for operands up to $10^{400}$.
  - **Trade-offs**: Slower than native CPU floating-point operations by a factor of 5-10x, but completely negligible for interactive calculations (<0.1ms per calculation) while guaranteeing 100% financial correctness.

### 2.3 Routing: Go Standard Library `net/http`
- **Choice**: Go 1.22+ enhanced `net/http.ServeMux` (or ultra-light `chi`).
- **Alternatives Considered**: Gin, Fiber, Echo.
- **Justification**:
  - Go 1.22 introduced method-based route matching (`POST /api/v1/calculate`, `GET /api/v1/history`) and path parameters directly in the standard library.
  - Avoids bloated external dependency trees, minimizes attack surface (CVE exposure), and simplifies long-term maintenance.
  - Clean middleware wrapping for CORS, panic recovery, and logging.

### 2.4 In-Memory Ring Buffer with `sync.RWMutex`
- **Choice**: Fixed-capacity (`cap = 20`) circular ring buffer backed by an array and protected by `sync.RWMutex`.
- **Alternatives Considered**: Unbounded slice (`append`), SQLite, Redis.
- **Justification**:
  - **Bounded Memory Invariant**: Slices that grow and get trimmed with `items = items[1:]` cause memory reallocation and slice header churn. A circular buffer has $O(1)$ writes, $O(1)$ memory consumption, and zero garbage collection overhead.
  - **Read/Write Optimization**: `sync.RWMutex` allows concurrent reads (`GET /api/v1/history`) while serializing writes (`POST /api/v1/calculate`).
  - **Trade-offs**: History resets upon container restart. For this assignment, in-memory persistence is explicitly mandated.

---

## 3. Frontend Architecture & Technology Choices

### 3.1 React 19 + TypeScript + Vite
- **Choice**: React 19 Single Page Application with TypeScript (`strict: true`) bundled via Vite.
- **Justification**:
  - **React 19**: Modern concurrent rendering capabilities, deterministic hook lifecycle, and strict compiler compliance.
  - **Vite**: Instant Hot Module Replacement (HMR) powered by native ES modules and Rollup-based production builds.
  - **TypeScript Strict**: Elimination of `any`, explicit typing for all domain inputs, arithmetic tokens, and API contracts.

### 3.2 Strict Enforcement of `pnpm`
- **Choice**: `pnpm` exclusively. `npm` and `yarn` prohibited.
- **Justification**:
  - **Content-Addressable Storage**: Saves disk space and ensures fast, reproducible installations.
  - **Strict Dependency Isolation**: `pnpm` does not flatten `node_modules` into a permissive tree. Packages cannot import undeclared transitive dependencies (phantom dependencies), preventing hard-to-diagnose runtime failures.

### 3.3 STRICT ZERO-`useEffect` Architectural Policy
- **Choice**: Complete ban of `useEffect` in favor of `useReducer` and `useSyncExternalStore`.
- **Alternatives Considered**: Standard React state with `useEffect` listeners.
- **Justification**:
  - **Eradication of Effect Cascades**: In financial and calculator applications, chained `useEffect` calls cause multi-render flashes, race conditions, stale closures, and inconsistent intermediate states.
  - **Pure State Machine (`useReducer`)**: The calculator is modeled as a deterministic finite-state machine (FSM). All transitions (digit entry, operator selection, unary actions, clear) are pure functions.
  - **React 19 StrictMode Immunity**: Pure reducers produce identical state when re-invoked by React 19 `StrictMode`.
  - **External Event Sync (`useSyncExternalStore`)**: For global keyboard listeners, history polling, and network status, `useSyncExternalStore` guarantees tearing-free reads and consistent snapshot hydration without reactive loops.

### 3.4 Styling: Tailwind CSS v4 & Apple Liquid Glassmorphism
- **Choice**: Tailwind CSS v4 with custom theme tokens.
- **Visual Palette**: GTA VI Neon Sunset (Midnight Violet, Violet Twilight, Rose Kiss, Raspberry Plum, Powder Blue, etc.).
- **Justification**:
  - Tailwind CSS v4 introduces CSS-first configuration via `@theme`, powered by LightningCSS for sub-millisecond compilation.
  - **Apple Liquid Glassmorphism**: Utilizes high-performance CSS hardware acceleration (`backdrop-filter: blur(20px)`, subtle specular borders `border-white/15`, translucent color layers).
  - High contrast ratio ($\ge 7:1$) ensures WCAG AAA accessibility compliance.

---

## 4. Testing & DevOps Strategy

### 4.1 Automated Backend Testing
- Go standard testing with table-driven patterns.
- Coverage threshold $\ge 95\%$.
- Race detection (`-race`) executed during CI to verify 60-goroutine concurrent read/write safety on the ring buffer.

### 4.2 Automated Frontend Testing
- **Vitest**: Fast, Vite-native testing environment with full TypeScript and ESM compatibility.
- **React Testing Library**: Behavioral UI testing focused on accessibility roles (`output`, `alert`, `dialog`) and keyboard interactions.
- Explicit assertion against `stderr` output to guarantee zero `act(...)` warnings.

### 4.3 Containerization
- **Backend Dockerfile**: Multi-stage build compiling a statically linked Go binary on Alpine/scratch, dropping all OS privileges to run as a non-root user.
- **Frontend Dockerfile**: Multi-stage build producing static assets served by an optimized Nginx Alpine image with gzip compression and reverse proxy routing for `/api/v1`.
- **Docker Compose**: Single-command orchestrator for local development and review.
