# Feature Plan: Phase 3 — Frontend Apple Glass UI, State Machine & Vitest Suite

Branch: `feature/phase-3-frontend-ui`  
Date: `2026-09-24`  
Status: `Pending Execution`  
Designated Skills: `/react-performance-optimization`, `/impeccable`, `/design-taste-frontend`, `/web-design-guidelines`, `/vitest`, `/fullstack-testing`, `/pr-description-generator`

---

## Task Group 1: Theme Tokens, Design System & Accessibility (`frontend/src/`)

- [x] **Task 1.1: Design Tokens & Liquid Glass CSS Utilities**
  - Refine Tailwind CSS v4 custom theme tokens in `frontend/src/index.css`:
    - GTA VI Neon Sunset color ramp: deep night blues (`#0a0b14`), neon magentas (`#ff2a85`), electric sunset cyan (`#00f0ff`), warm sunset amber (`#ff8c00`).
    - Specular border gradients, radial ambient backdrops, and multi-layer depth shadows.
    - Apple Liquid Glassmorphism classes: `backdrop-blur(16-24px)`, semi-transparent surfaces with specular reflection borders.
  - Enforce WCAG AAA contrast ratio ($\ge 7:1$) on text displays, operator keys, and numeric keypad.

---

## Task Group 2: Zero-`useEffect` State Machine & External Stores (`frontend/src/state/`)

- [x] **Task 2.1: Deterministic `calculatorReducer`**
  - Implement pure reducer in `frontend/src/state/calculatorReducer.ts`:
    - Actions: `INPUT_DIGIT`, `INPUT_DECIMAL`, `SET_OPERATION`, `SET_RESULT`, `CLEAR`, `BACKSPACE`, `TOGGLE_SIGN`, `SET_ERROR`.
    - Pure state transitions: `displayValue`, `previousOperand`, `pendingOperation`, `isNewInput`, `error`.
    - Double-invocation resilience: 100% deterministic outputs under React 19 `StrictMode`.
    - Layout protection: dynamic string truncation/scaling ensuring display never overflows.

- [x] **Task 2.2: `useSyncExternalStore` External Stores**
  - Implement history store in `frontend/src/state/historyStore.ts`:
    - Subscribes external subscribers to in-memory history cache.
    - Synchronizes with backend `GET /api/v1/history` without `useEffect`.
  - Implement online/offline network monitor in `frontend/src/state/networkStore.ts`:
    - Subscribes to `navigator.onLine` and `window.addEventListener('online'/'offline')` via `useSyncExternalStore`.

- [x] **Task 2.3: Event-Driven API Dispatchers**
  - Build `calculateAction` dispatcher triggered strictly within UI event handlers (`onClick`, `onKeyDown`).
  - Calls `POST /api/v1/calculate` directly from user interactions.
  - Updates history store upon success and dispatches error toast on 4xx/5xx failure.

---

## Task Group 3: Accessible Component Suite & Ergonomics (`frontend/src/components/`)

- [x] **Task 3.1: Primary Calculation Display (`<Display />`)**
  - Semantic `<output>` element with `role="status"` and `aria-live="polite"`.
  - Tabular numbers font (`tabular-nums`) with dynamic font scaling based on string length (text-4xl down to text-2xl).
  - Secondary expression tape showing pending operand and operator (e.g. `12 +`).

- [x] **Task 3.2: Ergonomic Keypad Grid (`<Keypad />`)**
  - Accessible button grid with distinct visual hierarchy:
    - Primary operators (`+`, `-`, `*`, `/`, `^`, `%`, `√`): Neon Sunset accents.
    - Clear and modifier actions (`AC`, `C`, `±`, `⌫`): Warm amber accents.
    - Numeric keys (`0-9`, `.`): Muted glass surfaces with specular highlights.
    - Evaluation (`=`): Vivid neon gradient button.
  - Keyboard event bindings without `useEffect` (bound to root calculator container).

- [x] **Task 3.3: History Drawer (`<HistoryTape />`)**
  - Slide-over glass drawer modal with `role="dialog"`, `aria-modal="true"`, and `aria-label="Historial de cálculos"`.
  - Dismissible via `Escape` key and backdrop click.
  - Lists calculations in reverse chronological order with timestamp and expression.

- [x] **Task 3.4: Floating Error Toast (`<Toast />`)**
  - Accessible notification banner with `role="alert"` and auto-dismissal.

---

## Task Group 4: Vitest Suite & StrictMode Endurance Gate (`frontend/src/__tests__/`)

- [x] **Task 4.1: Reducer & Store Unit Tests (`reducer.test.ts`, `stores.test.ts`)**
  - Table-driven unit tests for all calculator actions and error states.
  - Store synchronization tests for `historyStore` and `networkStore`.

- [x] **Task 4.2: Component Integration & Accessibility Tests (`Calculator.test.tsx`)**
  - User interaction flows (addition, decimal input, chained operations, error handling).
  - Keyboard shortcut simulation.
  - Zero `act(...)` warnings in `stderr`.

- [x] **Task 4.3: 100-Cycle React 19 StrictMode Endurance Test (`endurance.test.tsx`)**
  - Re-mount the complete calculator component 100 consecutive times under `React.StrictMode`.
  - Assert zero state degradation, zero duplicate API calls, and clean unmounts.

- [x] **Task 4.4: Statement Coverage Gate**
  - Assert coverage meets or exceeds 95% on frontend code.

---

## Task Group 5: Phase Completion & PR Delivery Workflow

- [x] **Task 5.1: Pre-Verification Gate Execution**
  - Execute `cd frontend && pnpm test && pnpm type-check && pnpm lint && pnpm build`.
  - Execute backend verification: `cd backend && go test -v -race -cover ./...`.

- [x] **Task 5.2: Branch Push & Pull Request Creation**
  - Push branch to GitHub: `git push -u origin feature/phase-3-frontend-ui`.
  - Open a Pull Request targeting `main`.

- [x] **Task 5.3: Mandatory `/pr-description-generator` Invocation**
  - Invoke `/pr-description-generator` to draft the PR description in Spanish, structured by architectural layers:
    - **Controller / State** (`src/state`)
    - **Service / API Client** (`src/services`)
    - **UI / Components** (`src/components`, `src/App.tsx`)
    - **Configuration / Styling** (`src/index.css`, `vite.config.ts`)

- [x] **Task 5.4: Documentation Traceability**
  - Record PR link in `specs/roadmap.md` and this `plan.md`.
  - Add Prompt Audit Log entry in `specs/prompts.md`.
  - **GitHub PR URL**: [PR #4](https://github.com/JulianBarberis/Calculadora_Sezzle/pull/4)
