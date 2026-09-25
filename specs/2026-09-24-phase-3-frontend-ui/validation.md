# Validation: Phase 3 — Frontend Apple Glass UI, State Machine & Vitest Suite

## 1. Acceptance Criteria & Quality Gates

To guarantee that the frontend implementation meets Sezzle's production standards and can be merged into `main`, the following criteria must be satisfied:

### 1.1 Strict Zero-`useEffect` Verification
- [ ] Static grep audit across all `frontend/src/` files returns exactly **zero** imports or invocations of `useEffect`:
  ```bash
  grep -rn "useEffect" frontend/src/
  ```
- [ ] History updates and network state are managed exclusively through `useSyncExternalStore`.
- [ ] API mutations are dispatched strictly within user event handlers (`onClick`, `onKeyDown`).

### 1.2 State Machine Determinism & StrictMode Endurance
- [ ] `calculatorReducer` behaves deterministically without side effects.
- [ ] Vitest endurance test re-mounts the complete `<App />` component 100 consecutive times under `React.StrictMode` without:
  - Any state corruption or duplicate calculations.
  - Any `act(...)` warnings in `stderr`.
  - Any unhandled exceptions or memory leaks.

### 1.3 Accessibility & Visual Design (WCAG AAA)
- [ ] Semantic `<output>` element used for calculation display with dynamic font scaling and tabular numerals.
- [ ] History tape implemented as `<aside role="dialog" aria-modal="true">` with `Escape` key dismissal.
- [ ] Toast notification uses `role="alert"`.
- [ ] Contrast ratio $\ge 7:1$ verified on interactive elements.

### 1.4 Code Coverage & Compilation Gates
- [ ] Statement coverage meets or exceeds **95%** across frontend codebase.
- [ ] Vitest test suite reports 100% pass with zero failures.
- [ ] TypeScript strict compilation (`pnpm type-check`) completes with 0 errors.
- [ ] Linter (`pnpm lint`) reports 0 warnings and 0 errors.
- [ ] Production build (`pnpm build`) completes cleanly.

---

## 2. Validation Commands

### 2.1 Static Zero-`useEffect` Audit
```bash
grep -rn "useEffect" frontend/src/
```
*Expected: 0 matches.*

### 2.2 Vitest Test Suite & Coverage
```bash
cd frontend
pnpm test
```
*Requirement: 100% pass, zero `act(...)` warnings, 100-cycle StrictMode endurance.*

### 2.3 Strict TypeScript & Linting
```bash
cd frontend
pnpm type-check
pnpm lint
```

### 2.4 Production Bundle Build
```bash
cd frontend
pnpm build
```

---

## 3. Merge-Readiness Checklist
- [ ] All frontend test suites pass cleanly.
- [ ] Zero `useEffect` invariant verified.
- [ ] Zero `act(...)` warnings confirmed.
- [ ] Git commit created on branch `feature/phase-3-frontend-ui`.
- [ ] Branch pushed to remote: `git push -u origin feature/phase-3-frontend-ui`.
- [ ] Pull Request opened targeting `main`.
- [ ] PR description generated in Spanish via `/pr-description-generator` structured by architectural layers.
- [ ] PR link recorded in `specs/roadmap.md`, `specs/2026-09-24-phase-3-frontend-ui/plan.md`, and `specs/prompts.md`.
