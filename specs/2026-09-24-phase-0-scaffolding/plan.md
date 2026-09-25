# Feature Plan: Phase 0 — Scaffolding, `pnpm` Setup & CI/CD Pipeline First

Branch: `feature/phase-0-scaffolding`  
Date: `2026-09-24`  
Status: `In Progress`  
Designated Skills: `/golang-patterns`, `/design-taste-frontend`, `/vitest`, `/docker-patterns`, `/pr-description-generator`

---

## Task Group 1: Workspace & Repository Scaffolding

- [x] **Task 1.1: Root Repository Hardening (`.gitignore`)**
  - Create comprehensive `.gitignore` filtering Go binaries, test caches, coverage output (`coverage.out`), `node_modules/`, Vite build outputs (`dist/`), local environment files (`.env*.local`), OS metadata (`.DS_Store`, `Thumbs.db`), and IDE caches.
  - Ensure `pnpm-lock.yaml` is tracked while `package-lock.json` and `yarn.lock` are blocked.

- [x] **Task 1.2: Go Backend Module Bootstrap (`backend/`)**
  - Initialize Go module: `go mod init github.com/julianbarberis/sezzle-calculator` in `backend/`.
  - Establish idiomatic layered directory layout:
    - `cmd/api/main.go`: Minimal runnable server bootstrap with graceful shutdown skeleton.
    - `internal/api/`: HTTP transport package skeleton.
    - `internal/calculator/`: Domain engine placeholder.
    - `internal/history/`: In-memory history buffer placeholder.
  - Verify clean compilation: `go vet ./...` and `go build ./...`.

- [x] **Task 1.3: React 19 + TypeScript Frontend Scaffolding (`frontend/`)**
  - Scaffold Vite React 19 TypeScript project using `pnpm create vite . --template react-ts` inside `frontend/`.
  - Enforce package manager: verify `pnpm-lock.yaml` is generated; prevent creation of `package-lock.json` or `yarn.lock`.
  - Verify initial dev server and build: `pnpm install && pnpm build`.

---

## Task Group 2: Tooling & Baseline Configuration

- [x] **Task 2.1: Styling & Aesthetic Tokens (Tailwind CSS v4 & Apple Glass)**
  - Install `@tailwindcss/vite` and `lucide-react` via `pnpm add`.
  - Wire Tailwind CSS v4 in `frontend/vite.config.ts`.
  - Configure `frontend/src/index.css` declaring the GTA VI Neon Sunset CSS custom properties:
    - `--violet-twilight: #5644c0`
    - `--rose-kiss: #fe5ea3`
    - `--raspberry-plum: #ad3083`
    - `--petal-pink: #bb80a9`
    - `--cinnamon-wood: #bb7462`
    - `--powder-blue: #98b5cc`
    - `--lobster-pink: #b86b60`
    - `--midnight-violet: #36294b`
  - Define Apple Liquid Glass utility classes (`backdrop-blur(16-24px)`, specular border highlights, gradient depth layers).

- [x] **Task 2.2: Fast Unit Test Runner (Vitest & React Testing Library)**
  - Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` via `pnpm add -D`.
  - Configure Vitest in `frontend/vite.config.ts` (or `frontend/vitest.config.ts`) with `environment: 'jsdom'`, `globals: true`, and setup file.
  - Implement a baseline smoke test in `frontend/src/__tests__/smoke.test.tsx` verifying DOM mounting, StrictMode rendering, and zero `act(...)` warnings in `stderr`.

- [x] **Task 2.3: TypeScript & Linting Baseline**
  - Configure `frontend/tsconfig.json` with `strict: true`, `noImplicitAny: true`, and `exactOptionalPropertyTypes: true`.
  - Add script `"type-check": "tsc --noEmit"` to `frontend/package.json`.
  - Verify ESLint and TypeScript compilation pass with zero warnings or errors.

---

## Task Group 3: CI/CD Pipeline First

- [x] **Task 3.1: GitHub Actions CI Workflow (`.github/workflows/ci.yml`)**
  - Create multi-job workflow running on every push to `main`, `feature/**`, and all Pull Requests.
  - **Job 1 (`backend-verification`)**:
    - Checkout repo, setup Go 1.22+, restore Go module cache.
    - Run `go vet ./...`.
    - Run `go test -v -race -cover ./...`.
    - Run `go build -v ./...`.
  - **Job 2 (`frontend-verification`)**:
    - Checkout repo, setup Node 24+, setup `pnpm/action-setup@v3`.
    - Run `pnpm install --frozen-lockfile`.
    - Run `pnpm type-check`.
    - Run `pnpm lint`.
    - Run `pnpm test`.
    - Run `pnpm build`.
  - **Job 3 (`docker-verification`)**:
    - Validate container compose files syntax: `docker compose config`.

---

## Task Group 4: Phase Completion & PR Delivery Workflow

- [x] **Task 4.1: Pre-Verification Gate Execution**
  - Run backend verification: `cd backend && go vet ./... && go test -v -race -cover ./... && go build ./...`.
  - Run frontend verification: `cd frontend && pnpm test && pnpm type-check && pnpm lint && pnpm build`.
  - Verify working tree is clean with `git status`.

- [x] **Task 4.2: Branch Push & Pull Request Creation**
  - Push branch to GitHub: `git push -u origin feature/phase-0-scaffolding`.
  - Open a Pull Request targeting `main`.

- [x] **Task 4.3: Mandatory `/pr-description-generator` Invocation**
  - Invoke `/pr-description-generator` to draft the PR description in Spanish, structured by architectural layers:
    - **Controller**
    - **Service**
    - **Repository**
    - **DTO / Model**
    - **Configuration**

- [x] **Task 4.4: Documentation Traceability**
  - Record PR link in `specs/roadmap.md` and this `plan.md`.
  - Add Prompt Audit Log entry in `specs/prompts.md`.
  - **GitHub PR URL**: [PR #1: Inicializar scaffolding de backend Go, frontend React 19 con pnpm, tooling y CI/CD](https://github.com/JulianBarberis/Calculadora_Sezzle/pull/1)
