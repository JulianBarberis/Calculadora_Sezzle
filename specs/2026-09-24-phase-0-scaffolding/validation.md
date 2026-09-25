# Feature Validation: Phase 0 — Scaffolding, `pnpm` Setup & CI/CD Pipeline First

Branch: `feature/phase-0-scaffolding`  
Date: `2026-09-24`  
Purpose: Verification criteria and validation commands required before merging Phase 0 into `main`.

---

## 1. Quality Gates & Acceptance Matrix

| Verification Tier | Command | Success Criteria |
| :--- | :--- | :--- |
| **Backend Static Analysis** | `cd backend && go vet ./...` | Zero warnings or diagnostic errors. |
| **Backend Build** | `cd backend && go build ./...` | Successful binary compilation without linker errors. |
| **Backend Unit Testing** | `cd backend && go test -v -race -cover ./...` | 100% test pass with race detector enabled (`-race`). |
| **Frontend Dependency Tree** | `cd frontend && pnpm install --frozen-lockfile` | Strict `pnpm-lock.yaml` resolution; zero `package-lock.json` or `yarn.lock`. |
| **Frontend Type Checking** | `cd frontend && pnpm type-check` | `tsc --noEmit` succeeds with zero type diagnostics (`strict: true`). |
| **Frontend Linting** | `cd frontend && pnpm lint` | ESLint succeeds with zero errors or warnings. |
| **Frontend Unit Testing** | `cd frontend && pnpm test` | Vitest suite executes with 100% pass and **zero `act(...)` warnings in `stderr`**. |
| **Frontend Production Build** | `cd frontend && pnpm build` | Rollup/Vite bundle generates static assets in `frontend/dist/` without errors. |
| **CI/CD Configuration** | Manual / Action validator | `.github/workflows/ci.yml` contains valid GitHub Actions syntax and passes syntax checks. |

---

## 2. Automated Test Execution Commands

### 2.1 Backend Verification Suite
```bash
# Execute from repository root
cd backend
go vet ./...
go build ./...
go test -v -race -cover ./...
```
*Expected Output:*
- `go vet` exits with code 0.
- `go build` compiles without output (code 0).
- `go test` reports all packages passing.

### 2.2 Frontend Verification Suite
```bash
# Execute from repository root
cd frontend
pnpm test          # Run Vitest smoke suite
pnpm type-check     # Run tsc --noEmit
pnpm lint           # Run ESLint
pnpm build          # Generate production distribution
```
*Expected Output:*
- Vitest reports all test suites passing with 0 errors.
- `type-check` produces zero output and exits with code 0.
- `pnpm build` creates optimized bundle in `dist/`.

---

## 3. Merge-Readiness Checklist

Before creating the Pull Request and marking Phase 0 as complete:

- [ ] **Workspace Cleanliness**:
  ```bash
  git status
  ```
  Verify no untracked build artifacts (`node_modules/`, `dist/`, `.DS_Store`, binary files) are present.
- [ ] **Package Manager Compliance**:
  - `pnpm-lock.yaml` is present and committed.
  - Neither `package-lock.json` nor `yarn.lock` exists in any directory.
- [ ] **Zero `useEffect` Invariant**:
  - Verify that `frontend/src/` contains zero occurrences of `useEffect`.
- [ ] **Remote Push**:
  - Branch `feature/phase-0-scaffolding` is pushed to `origin`.
- [ ] **Pull Request Generation via Skill**:
  - Invoke `/pr-description-generator` to draft the PR description in Spanish, categorized by:
    - **Controller**
    - **Service**
    - **Repository**
    - **DTO / Model**
    - **Configuration**
- [ ] **Traceability**:
  - GitHub PR URL is captured and recorded into `specs/roadmap.md`, `specs/2026-09-24-phase-0-scaffolding/plan.md`, and `specs/prompts.md`.
