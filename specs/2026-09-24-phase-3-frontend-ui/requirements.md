# Requirements: Phase 3 — Frontend Apple Glass UI, State Machine & Vitest Suite

## 1. Context & Architectural Mandates
Phase 3 delivers the production-ready user interface and client architecture for the Sezzle FinTech Calculator in React 19 and TypeScript. The application must embody exceptional visual craftsmanship and strict engineering invariants:

1. **STRICT ZERO-`useEffect` POLICY**: Absolute prohibition of `useEffect` across all components and custom hooks.
2. **Pure Deterministic Reducer**: State managed via a pure `useReducer` state machine that produces identical results when invoked consecutively under `React.StrictMode`.
3. **External Stores via `useSyncExternalStore`**: External subscriptions (history records, online/offline browser state) must be connected using `useSyncExternalStore`.
4. **Apple Liquid Glassmorphism & GTA VI Neon Sunset**: Ultra-premium glassmorphism surfaces (`backdrop-blur(16-24px)`, specular border highlights, radial depth glows) styled with neon magenta, electric cyan, and warm sunset amber.
5. **WCAG AAA Accessibility**: Contrast ratio $\ge 7:1$ for all interactive text and numbers, semantic `<output>` with dynamic font scaling, ARIA dialogs for history, and ARIA alerts for error notifications.

---

## 2. STRICT ZERO-`useEffect` Architectural Specification

### 2.1 Rationale & Invariants
- Reactive effect cascades (`useEffect` triggers state update triggers another `useEffect`) are a primary cause of non-deterministic rendering, memory leaks, duplicate API calls, and flaky UI in financial interfaces.
- React 19's concurrent rendering and StrictMode re-invocations require components to be pure functions of state and props.
- Every state mutation in this application must be the **direct deterministic consequence of a user gesture** (`onClick`, `onKeyDown`) or an external subscription snapshot change.

### 2.2 Execution Patterns
| Requirement | Traditional (Prohibited) Pattern | Approved Zero-`useEffect` Pattern |
| :--- | :--- | :--- |
| **History Synchronization** | `useEffect(() => { fetchHistory() }, [])` | `useSyncExternalStore` with an external event-driven cache. |
| **Online/Offline Monitoring** | `useEffect(() => { window.addEventListener('online', ...) })` | `useSyncExternalStore` subscribing to `window` network events. |
| **Keyboard Shortcuts** | `useEffect(() => { window.addEventListener('keydown', ...) })` | Direct `onKeyDown` attached to the calculator container or explicit event dispatchers. |
| **API Mutations** | `useEffect(() => { if (pending) calculate() }, [pending])` | Asynchronous mutation triggered directly within the `=` button's `onClick` or `Enter` key handler. |

---

## 3. Deterministic State Machine (`calculatorReducer`)

### 3.1 State Shape
```typescript
interface CalculatorState {
  displayValue: string;        // Currently visible string on the primary display
  previousOperand: string | null; // Buffered first operand
  pendingOperation: string | null; // Currently selected operator ('add', 'subtract', etc.)
  isNewInput: boolean;         // True if the next digit starts a fresh input string
  error: string | null;        // Active error message or null
  activeExpression: string;    // Human-readable formula preview (e.g., "12 +")
}
```

### 3.2 Action Types
- `INPUT_DIGIT`: Appends a digit (`0-9`) or replaces `0`.
- `INPUT_DECIMAL`: Adds `.` ensuring at most one decimal point exists.
- `SET_OPERATION`: Stores first operand and sets active operator (`add`, `subtract`, `multiply`, `divide`, `power`, `percentage`).
- `SET_RESULT`: Updates display with exact calculation result from backend API.
- `SET_ERROR`: Sets error state and triggers error notification.
- `CLEAR`: Resets active operand (or all state on `AC`).
- `BACKSPACE`: Deletes the last character in the current input.
- `TOGGLE_SIGN`: Negates the current number (`-` prefix).

---

## 4. UI/UX Design System & Ergonomics

### 4.1 Palette Tokens (GTA VI Neon Sunset)
- **Deep Space Background**: `#08090f`
- **Glass Panel Surface**: `rgba(20, 24, 40, 0.65)` with `backdrop-blur: 20px`
- **Specular Border Highlight**: `rgba(255, 255, 255, 0.12)` to `rgba(255, 42, 133, 0.35)`
- **Neon Sunset Primary (Accent)**: `#ff2a85` (Vice Pink / Sunset Magenta)
- **Cyan Glow (Secondary)**: `#00f0ff` (Electric Cyan)
- **Sunset Amber (Modifiers)**: `#ff9e2c` (Sunset Gold)
- **Text High Contrast**: `#ffffff` (Contrast ratio $> 14:1$ on dark glass)

### 4.2 Accessibility & Typography
- **Primary Display**: Semantic `<output>` tag with `tabular-nums` ensuring fixed-width numbers that prevent layout jitter during typing.
- **Dynamic Scale**: Font auto-scales from `text-5xl` (for $\le 8$ characters) down to `text-2xl` (for $> 14$ characters) to guarantee zero layout clipping.
- **History Drawer**: `<aside role="dialog" aria-modal="true" aria-label="Historial de cálculos">` dismissible via `Escape` key and backdrop touch.
- **Toast Notifications**: `<div role="alert" aria-live="assertive">` with high-contrast text and icon.

---

## 5. External Stores (`useSyncExternalStore`)

### 5.1 `historyStore`
- In-memory cache holding recent calculations.
- Exposes `subscribe(callback)` and `getSnapshot()`.
- Provides `syncWithBackend()` method called after successful calculations and initial render.

### 5.2 `networkStore`
- Subscribes to browser `online` and `offline` window events.
- Exposes boolean snapshot `isOnline` to indicate network connectivity.
