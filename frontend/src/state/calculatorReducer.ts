import type { CalculatorAction, CalculatorState, OperationType } from '../types/calculator';

export const initialCalculatorState: CalculatorState = {
  displayValue: '0',
  previousOperand: null,
  pendingOperation: null,
  isNewInput: true,
  error: null,
  activeExpression: '',
};

export function getOperationSymbol(op: OperationType): string {
  switch (op) {
    case 'add':
      return '+';
    case 'subtract':
      return '−';
    case 'multiply':
      return '×';
    case 'divide':
      return '÷';
    case 'power':
      return '^';
    case 'sqrt':
      return '√';
    case 'percentage':
      return '%';
    default:
      return '';
  }
}

const MAX_DISPLAY_DIGITS = 32;

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  switch (action.type) {
    case 'INPUT_DIGIT': {
      if (state.isNewInput || state.displayValue === '0') {
        return {
          ...state,
          displayValue: action.digit,
          isNewInput: false,
          error: null,
        };
      }

      if (state.displayValue.length >= MAX_DISPLAY_DIGITS) {
        return state;
      }

      return {
        ...state,
        displayValue: state.displayValue + action.digit,
        error: null,
      };
    }

    case 'INPUT_DECIMAL': {
      if (state.isNewInput) {
        return {
          ...state,
          displayValue: '0.',
          isNewInput: false,
          error: null,
        };
      }

      if (state.displayValue.includes('.')) {
        return state;
      }

      return {
        ...state,
        displayValue: state.displayValue + '.',
        error: null,
      };
    }

    case 'SET_OPERATION': {
      const symbol = getOperationSymbol(action.operation);
      return {
        ...state,
        previousOperand: state.displayValue,
        pendingOperation: action.operation,
        isNewInput: true,
        error: null,
        activeExpression: `${state.displayValue} ${symbol}`,
      };
    }

    case 'SET_RESULT': {
      return {
        ...state,
        displayValue: action.result,
        previousOperand: null,
        pendingOperation: null,
        isNewInput: true,
        error: null,
        activeExpression: action.expression,
      };
    }

    case 'CLEAR': {
      if (state.displayValue !== '0') {
        return {
          ...state,
          displayValue: '0',
          isNewInput: true,
          error: null,
        };
      }

      // If already '0', act as ALL_CLEAR
      return initialCalculatorState;
    }

    case 'ALL_CLEAR': {
      return initialCalculatorState;
    }

    case 'BACKSPACE': {
      if (state.isNewInput) {
        return state;
      }

      if (
        state.displayValue.length <= 1 ||
        (state.displayValue.length === 2 && state.displayValue.startsWith('-'))
      ) {
        return {
          ...state,
          displayValue: '0',
          isNewInput: true,
        };
      }

      return {
        ...state,
        displayValue: state.displayValue.slice(0, -1),
      };
    }

    case 'TOGGLE_SIGN': {
      if (state.displayValue === '0') {
        return state;
      }

      const nextDisplay = state.displayValue.startsWith('-')
        ? state.displayValue.slice(1)
        : '-' + state.displayValue;

      return {
        ...state,
        displayValue: nextDisplay,
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.error,
        isNewInput: true,
      };
    }

    case 'RECALL_VALUE': {
      return {
        ...state,
        displayValue: action.value,
        isNewInput: true,
        error: null,
      };
    }

    default:
      return state;
  }
}
