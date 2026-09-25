import { useReducer, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { calculatorReducer, initialCalculatorState } from './state/calculatorReducer';
import { useHistory, historyStore } from './state/historyStore';
import { useNetworkStatus } from './state/networkStore';
import { calculateAPI, CalculatorApiError } from './services/apiClient';
import { Header } from './components/Header';
import { Display } from './components/Display';
import { Keypad } from './components/Keypad';
import { HistoryDrawer } from './components/HistoryDrawer';
import { Toast } from './components/Toast';
import type { OperationType } from './types/calculator';

export function App() {
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const historyItems = useHistory();
  const isOnline = useNetworkStatus();

  // Handlers for user interactions
  const handleDigit = (digit: string) => {
    dispatch({ type: 'INPUT_DIGIT', digit });
  };

  const handleDecimal = () => {
    dispatch({ type: 'INPUT_DECIMAL' });
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR' });
  };

  const handleToggleSign = () => {
    dispatch({ type: 'TOGGLE_SIGN' });
  };

  const handleBackspace = () => {
    dispatch({ type: 'BACKSPACE' });
  };

  const handleRecall = (value: string) => {
    dispatch({ type: 'RECALL_VALUE', value });
  };

  const handleDismissToast = () => {
    dispatch({ type: 'SET_ERROR', error: '' });
  };

  const handleOpenHistory = () => {
    setIsHistoryOpen(true);
    void historyStore.syncWithBackend();
  };

  const handleOperation = async (op: OperationType) => {
    // Immediate execution for unary square root
    if (op === 'sqrt') {
      setIsCalculating(true);
      try {
        const res = await calculateAPI('sqrt', state.displayValue, null);
        dispatch({ type: 'SET_RESULT', result: res.result, expression: res.expression });
        historyStore.addCalculation(res);
      } catch (err) {
        const message = err instanceof CalculatorApiError ? err.message : 'Error al calcular raíz cuadrada';
        dispatch({ type: 'SET_ERROR', error: message });
      } finally {
        setIsCalculating(false);
      }
      return;
    }

    // Binary percentage calculation if an operation is already pending
    if (op === 'percentage' && state.previousOperand !== null && state.pendingOperation !== null) {
      setIsCalculating(true);
      try {
        const res = await calculateAPI('percentage', state.previousOperand, state.displayValue);
        dispatch({ type: 'SET_RESULT', result: res.result, expression: res.expression });
        historyStore.addCalculation(res);
      } catch (err) {
        const message = err instanceof CalculatorApiError ? err.message : 'Error en cálculo de porcentaje';
        dispatch({ type: 'SET_ERROR', error: message });
      } finally {
        setIsCalculating(false);
      }
      return;
    }

    // Unary percentage if no previous operand exists
    if (op === 'percentage' && state.previousOperand === null) {
      setIsCalculating(true);
      try {
        const res = await calculateAPI('percentage', state.displayValue, null);
        dispatch({ type: 'SET_RESULT', result: res.result, expression: res.expression });
        historyStore.addCalculation(res);
      } catch (err) {
        const message = err instanceof CalculatorApiError ? err.message : 'Error en cálculo de porcentaje';
        dispatch({ type: 'SET_ERROR', error: message });
      } finally {
        setIsCalculating(false);
      }
      return;
    }

    // Standard binary operator setup
    dispatch({ type: 'SET_OPERATION', operation: op });
  };

  const handleCalculate = async () => {
    if (!state.pendingOperation || state.previousOperand === null) {
      return;
    }

    setIsCalculating(true);
    try {
      const res = await calculateAPI(
        state.pendingOperation,
        state.previousOperand,
        state.displayValue
      );
      dispatch({ type: 'SET_RESULT', result: res.result, expression: res.expression });
      historyStore.addCalculation(res);
    } catch (err) {
      const message = err instanceof CalculatorApiError ? err.message : 'Error al procesar el cálculo';
      dispatch({ type: 'SET_ERROR', error: message });
    } finally {
      setIsCalculating(false);
    }
  };

  // Keyboard shortcut dispatcher attached directly to the main interactive container
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleDigit(e.key);
    } else if (e.key === '.') {
      e.preventDefault();
      handleDecimal();
    } else if (e.key === '+') {
      e.preventDefault();
      void handleOperation('add');
    } else if (e.key === '-') {
      e.preventDefault();
      void handleOperation('subtract');
    } else if (e.key === '*') {
      e.preventDefault();
      void handleOperation('multiply');
    } else if (e.key === '/') {
      e.preventDefault();
      void handleOperation('divide');
    } else if (e.key === '^') {
      e.preventDefault();
      void handleOperation('power');
    } else if (e.key === '%') {
      e.preventDefault();
      void handleOperation('percentage');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      void handleCalculate();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (isHistoryOpen) {
        setIsHistoryOpen(false);
      } else {
        handleClear();
      }
    } else if (e.key.toLowerCase() === 'c') {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <main
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-[#ff2a85] selection:text-white outline-none"
      aria-label="Calculadora Sezzle FinTech"
    >
      {/* Background Ambience */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10" 
      />

      {/* Main Glass Shell */}
      <div className="w-full max-w-sm rounded-3xl p-6 glass-panel relative overflow-hidden shadow-2xl transition-all">
        {/* Subtle Specular Top Highlight */}
        <div 
          aria-hidden="true" 
          className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" 
        />

        {/* Header */}
        <Header 
          isOnline={isOnline} 
          historyCount={historyItems.length} 
          onOpenHistory={handleOpenHistory} 
        />

        {/* Display */}
        <Display 
          value={state.displayValue} 
          expression={state.activeExpression} 
        />

        {/* Keypad */}
        <Keypad
          onDigit={handleDigit}
          onDecimal={handleDecimal}
          onOperation={handleOperation}
          onCalculate={handleCalculate}
          onClear={handleClear}
          onToggleSign={handleToggleSign}
          onBackspace={handleBackspace}
          isClearAll={state.displayValue === '0'}
          pendingOperation={state.pendingOperation}
        />

        {/* Footer info */}
        <footer className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#ff2a85]" aria-hidden="true" />
            Precisión 34 Decimales
          </span>
          <span className="text-white/40">
            {isCalculating ? 'Calculando...' : 'Zero-useEffect'}
          </span>
        </footer>
      </div>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onRecall={handleRecall}
      />

      {/* Floating Error Toast */}
      <Toast 
        message={state.error} 
        onDismiss={handleDismissToast} 
      />
    </main>
  );
}

export default App;
