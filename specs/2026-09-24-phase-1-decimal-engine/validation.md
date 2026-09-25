# Feature Validation: Phase 1 — Go Decimal Engine & Domain Unit Tests

Branch: `feature/phase-1-decimal-engine`  
Date: `2026-09-24`  
Purpose: Verification criteria and validation commands required before merging Phase 1 into `main`.

---

## 1. Quality Gates & Acceptance Matrix

| Verification Tier | Command | Success Criteria |
| :--- | :--- | :--- |
| **Static Analysis** | `cd backend && go vet ./...` | Zero diagnostic warnings or vet errors. |
| **Race Detector** | `cd backend && go test -race ./...` | Zero race conditions detected across all domain tests. |
| **Code Coverage** | `cd backend && go test -cover ./internal/calculator` | Statement coverage meets or exceeds **95%** ($\ge 95\%$). |
| **Float Eradication Audit** | `grep -rn "float32\|float64\|\"math\"" backend/internal/calculator/` | Zero occurrences (exit code 1 / empty output). |
| **Extreme Scale Precision** | Unit test `TestSqrt_LargeScale` & `TestPower_LargeScale` | Successful evaluation of radicands and bases up to $10^{400}$. |
| **Financial Decimal Precision** | Table tests for $0.1 + 0.2 = 0.3$, $2^{-3} = 0.125$ | Exact string representations matching expected decimal values. |

---

## 2. Automated Test Execution Commands

### 2.1 Domain Engine Test & Coverage Run
```bash
# Execute from backend directory
cd backend
go vet ./...
go test -v -race -cover ./internal/calculator/...
```
*Expected Output:*
- All tests pass with `PASS`.
- Coverage reports `coverage: >= 95.0% of statements`.
- Zero race condition warnings from `-race`.

### 2.2 Full Backend Suite Verification
```bash
cd backend
go test -v -race -cover ./...
```
*Expected Output:*
- Both `internal/api` and `internal/calculator` pass with $\ge 95\%$ coverage.

### 2.3 AST & Import Audit (Zero Float Verification)
```bash
# Verify no math package imports or float casts exist in domain engine
! grep -E '\b(float32|float64)\b|"math"' backend/internal/calculator/*.go
```

---

## 3. Merge-Readiness Checklist

Before creating the Pull Request and marking Phase 1 as complete:

- [ ] **Domain Engine Completeness**:
  - `Add`, `Subtract`, `Multiply`, `Divide`, `Power`, `Sqrt`, `Percentage` fully implemented in `internal/calculator`.
- [ ] **Error Enforcement**:
  - `DIVISION_BY_ZERO`, `NEGATIVE_SQUARE_ROOT`, `INVALID_OPERAND`, and `INVALID_OPERATION` return custom typed errors.
- [ ] **Coverage Threshold Met**:
  - Coverage $\ge 95\%$ confirmed via `go test -cover`.
- [ ] **Race Free**:
  - `go test -race` passes with zero warnings.
- [ ] **Remote Push**:
  - Branch `feature/phase-1-decimal-engine` is pushed to GitHub.
- [ ] **Pull Request Generation via Skill**:
  - Invoke `/pr-description-generator` to draft the PR description in Spanish, categorized by:
    - **Service**
    - **DTO / Model**
    - **Configuration**
- [ ] **Traceability**:
  - GitHub PR URL is captured and recorded into `specs/roadmap.md`, `specs/2026-09-24-phase-1-decimal-engine/plan.md`, and `specs/prompts.md`.
