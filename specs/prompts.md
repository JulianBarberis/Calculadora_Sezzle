# specs/prompts.md: AI Interaction & Prompt Audit Log

This document serves as the immutable audit log recording all user prompts, architectural directives, model generations, and validation results across the development lifecycle of the Sezzle FinTech Calculator. This satisfies Sezzle's submission requirements for transparency, repeatability, and Spec-Driven Development (SDD).

---

## Prompt Log Format

Each interaction is recorded using the following standardized audit schema:

```markdown
### Prompt #[ID] — [YYYY-MM-DD HH:MM:SS TZ]
- **Phase**: [e.g., Phase 0 / Phase 1 / Phase 2]
- **Intent**: [Brief summary of the engineering goal]
- **User Prompt**:
  > [Exact text or summarized directive of the input prompt]
- **Architectural Constraints Enforced**:
  - [Constraint 1]
  - [Constraint 2]
- **Actions & Artifacts Generated**:
  - `path/to/file.ext`: [Summary of changes]
- **Verification & Validation**:
  - [Commands run, tests passed, coverage achieved]
```

---

## Audit Entries

### Prompt #001 — 2026-09-24 21:26:38 -03:00
- **Phase**: Phase 0 (Specification Anchoring & Architectural Baseline)
- **Intent**: Establish Spec-Anchored Spec-Driven Development (SDD) foundation, AI agent guardrails, technical justifications, roadmap, and prompt tracking template.
- **User Prompt**:
  > Build a production-grade, full-stack calculator application for the Sezzle engineering take-home assignment using a Spec-Anchored Spec-Driven Development (SDD) methodology. First generate the structural specification files: AGENTS.md, SPEC.md, specs/tech-stack.md, specs/roadmap.md, and specs/prompts.md.
- **Architectural Constraints Enforced**:
  - Strict eradication of `float32`/`float64` in domain engine; exclusive use of `shopspring/decimal`.
  - Newton-Raphson pure decimal square root algorithm up to $10^{400}$.
  - Strict zero-`useEffect` policy in React 19 frontend; pure `useReducer` and `useSyncExternalStore`.
  - `pnpm` enforced as the sole frontend package manager.
  - Apple Liquid Glassmorphism styling with GTA VI Neon Sunset color tokens.
  - Ring buffer history with fixed capacity 20 and `sync.RWMutex`.
  - Strict error catalog and atomic sequential ID tracking.
- **Actions & Artifacts Generated**:
  - `implementation_plan.md`: Comprehensive technical design artifact.
  - `AGENTS.md`: Operational rules for AI agents, SSOT, Go & TS standards.
  - `SPEC.md`: EARS/BDD functional specification, REST API contracts, numeric edge cases.
  - `specs/tech-stack.md`: Technical rationale, trade-off analysis, and library selection.
  - `specs/roadmap.md`: Step-by-step development milestone checklist.
  - `specs/prompts.md`: Prompt audit log template and initial entry.
- **Verification & Validation**:
  - Verified presence of all 5 structural specification files in repository.
  - Validated local toolchain: Go 1.27.1, pnpm 11.22.0, Node v24.19.0, Docker 29.6.2.

### Prompt #002 — 2026-09-24 21:28:24 -03:00
- **Phase**: Phase 0 (Architectural Alignment & Decision Confirmation)
- **Intent**: Confirm routing framework and client history synchronization strategy via interactive inquiry.
- **User Selections**:
  1. Routing Strategy: Standard library `net/http` (`ServeMux` method routing) for zero third-party web framework dependencies.
  2. History Strategy: Server-anchored synchronization via `GET /api/v1/history` subscribed through `useSyncExternalStore`.
- **Architectural Impact**:
  - Confirmed zero web framework dependencies (`net/http` only).
  - Confirmed frontend acts purely as a presentation layer for backend history with single source of truth in the Go ring buffer.
- **Actions & Artifacts Generated**:
  - `specs/prompts.md`: Updated with confirmation audit entry.

### Prompt #003 — 2026-09-24 21:53:50 -03:00
- **Phase**: Phase 0 (Specification Anchoring & Skill Stack Integration)
- **Intent**: Formally bind the specialized agent skill stack into `AGENTS.md` and `specs/roadmap.md` per domain and phase.
- **Skill Stack Enforced**:
  - **Backend**: `golang-patterns`, `golang-testing`
  - **Frontend**: `design-taste-frontend`, `impeccable`, `react-performance-optimization`, `vitest`, `fullstack-testing`
  - **Docker & Documentation**: `docker-patterns`, `technical-documentation`
- **Actions & Artifacts Generated**:
  - `AGENTS.md`: Added Section 2 "Required Agent Skills Matrix" explicitly categorizing backend, frontend, and DevOps/documentation skills.
  - `specs/roadmap.md`: Added Skills Stack Matrix and updated each phase (Phases 0 through 4) with active skill headers and item-level skill mapping.
- **Verification & Validation**:
  - Verified markdown formatting and link integrity across `AGENTS.md` and `specs/roadmap.md`.

### Prompt #004 — 2026-09-24 22:00:39 -03:00
- **Phase**: Phase 0 (Operational Protocol & PR Workflow Anchoring)
- **Intent**: Formalize the Skill Activation Matrix and mandatory Pull Request delivery workflow upon phase completion.
- **Skill Stack Enforced**:
  - **Go Backend**: `/golang-patterns`, `/golang-testing`
  - **React Frontend (State)**: `/react-performance-optimization`
  - **Frontend UI/UX & A11y**: `/impeccable`, `/design-taste-frontend`, `/web-design-guidelines`
  - **Frontend Testing**: `/vitest`
  - **DevOps & Containerization**: `/docker-patterns`, `/fullstack-testing`
  - **Pull Requests**: `/pr-description-generator`
- **Actions & Artifacts Generated**:
  - `AGENTS.md`: Added Section 2 "Skill Activation Matrix" and Section 3 "Phase Completion & PR Delivery Workflow" establishing pre-verification gates, branch pushes, mandatory `/pr-description-generator` invocations in Spanish (structured by Controller, Service, Repository, DTO/Model, Configuration), and PR URL recording.
  - `specs/roadmap.md`: Updated Skills Activation Matrix, explicitly listed designated skills per phase, and appended the mandatory 3-item PR completion checklist as the final task of every phase.
  - `implementation_plan.md`: Synchronized phase skill assignments and PR completion checklists across all milestones.
- **Verification & Validation**:
  - Checked git diff across modified files.
  - Confirmed alignment between `AGENTS.md`, `specs/roadmap.md`, and `implementation_plan.md`.



