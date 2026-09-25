import { describe, it, expect } from 'vitest';
import {
  calculatorReducer,
  initialCalculatorState,
  getOperationSymbol,
} from '../state/calculatorReducer';
import type { CalculatorState } from '../types/calculator';

describe('calculatorReducer', () => {
  it('handles getOperationSymbol for all operations', () => {
    expect(getOperationSymbol('add')).toBe('+');
    expect(getOperationSymbol('subtract')).toBe('−');
    expect(getOperationSymbol('multiply')).toBe('×');
    expect(getOperationSymbol('divide')).toBe('÷');
    expect(getOperationSymbol('power')).toBe('^');
    expect(getOperationSymbol('sqrt')).toBe('√');
    expect(getOperationSymbol('percentage')).toBe('%');
    // @ts-expect-error testing fallback
    expect(getOperationSymbol('unknown')).toBe('');
  });

  describe('INPUT_DIGIT', () => {
    it('replaces initial 0 with digit', () => {
      const state = calculatorReducer(initialCalculatorState, {
        type: 'INPUT_DIGIT',
        digit: '7',
      });
      expect(state.displayValue).toBe('7');
      expect(state.isNewInput).toBe(false);
    });

    it('appends digits sequentially', () => {
      let state = calculatorReducer(initialCalculatorState, {
        type: 'INPUT_DIGIT',
        digit: '1',
      });
      state = calculatorReducer(state, {
        type: 'INPUT_DIGIT',
        digit: '2',
      });
      state = calculatorReducer(state, {
        type: 'INPUT_DIGIT',
        digit: '3',
      });
      expect(state.displayValue).toBe('123');
    });

    it('enforces MAX_DISPLAY_DIGITS cap at 32 characters', () => {
      let state: CalculatorState = {
        ...initialCalculatorState,
        displayValue: '1'.repeat(32),
        isNewInput: false,
      };

      state = calculatorReducer(state, {
        type: 'INPUT_DIGIT',
        digit: '9',
      });
      expect(state.displayValue.length).toBe(32);
    });
  });

  describe('INPUT_DECIMAL', () => {
    it('prepends 0. if starting a new input', () => {
      const state = calculatorReducer(initialCalculatorState, {
        type: 'INPUT_DECIMAL',
      });
      expect(state.displayValue).toBe('0.');
      expect(state.isNewInput).toBe(false);
    });

    it('appends decimal point to existing number', () => {
      let state = calculatorReducer(initialCalculatorState, {
        type: 'INPUT_DIGIT',
        digit: '5',
      });
      state = calculatorReducer(state, {
        type: 'INPUT_DECIMAL',
      });
      expect(state.displayValue).toBe('5.');
    });

    it('prevents multiple decimal points', () => {
      let state = calculatorReducer(initialCalculatorState, {
        type: 'INPUT_DIGIT',
        digit: '5',
      });
      state = calculatorReducer(state, {
        type: 'INPUT_DECIMAL',
      });
      state = calculatorReducer(state, {
        type: 'INPUT_DECIMAL',
      });
      expect(state.displayValue).toBe('5.');
    });
  });

  describe('SET_OPERATION', () => {
    it('buffers first operand and sets operator', () => {
      let state = calculatorReducer(initialCalculatorState, {
        type: 'INPUT_DIGIT',
        digit: '4',
      });
      state = calculatorReducer(state, {
        type: 'SET_OPERATION',
        operation: 'add',
      });

      expect(state.previousOperand).toBe('4');
      expect(state.pendingOperation).toBe('add');
      expect(state.activeExpression).toBe('4 +');
      expect(state.isNewInput).toBe(true);
    });
  });

  describe('SET_RESULT', () => {
    it('updates display and expression, resetting pending operator', () => {
      const state = calculatorReducer(initialCalculatorState, {
        type: 'SET_RESULT',
        result: '0.3',
        expression: '0.1 + 0.2 = 0.3',
      });

      expect(state.displayValue).toBe('0.3');
      expect(state.previousOperand).toBeNull();
      expect(state.pendingOperation).toBeNull();
      expect(state.activeExpression).toBe('0.1 + 0.2 = 0.3');
      expect(state.isNewInput).toBe(true);
    });
  });

  describe('CLEAR & ALL_CLEAR', () => {
    it('resets display to 0 on CLEAR if display is non-zero', () => {
      let state = calculatorReducer(initialCalculatorState, {
        type: 'INPUT_DIGIT',
        digit: '9',
      });
      state = calculatorReducer(state, {
        type: 'CLEAR',
      });
      expect(state.displayValue).toBe('0');
      expect(state.isNewInput).toBe(true);
    });

    it('acts as ALL_CLEAR on CLEAR if display is already 0', () => {
      const state: CalculatorState = {
        displayValue: '0',
        previousOperand: '10',
        pendingOperation: 'add',
        isNewInput: true,
        error: 'some error',
        activeExpression: '10 +',
      };

      const cleared = calculatorReducer(state, { type: 'CLEAR' });
      expect(cleared).toEqual(initialCalculatorState);
    });

    it('resets everything on ALL_CLEAR', () => {
      const state: CalculatorState = {
        displayValue: '42',
        previousOperand: '10',
        pendingOperation: 'multiply',
        isNewInput: false,
        error: null,
        activeExpression: '10 ×',
      };

      const cleared = calculatorReducer(state, { type: 'ALL_CLEAR' });
      expect(cleared).toEqual(initialCalculatorState);
    });
  });

  describe('BACKSPACE', () => {
    it('ignores backspace if isNewInput is true', () => {
      const state = calculatorReducer(initialCalculatorState, {
        type: 'BACKSPACE',
      });
      expect(state.displayValue).toBe('0');
    });

    it('slices last character', () => {
      let state = calculatorReducer(initialCalculatorState, {
        type: 'INPUT_DIGIT',
        digit: '1',
      });
      state = calculatorReducer(state, {
        type: 'INPUT_DIGIT',
        digit: '2',
      });
      state = calculatorReducer(state, {
        type: 'BACKSPACE',
      });
      expect(state.displayValue).toBe('1');
    });

    it('resets to 0 if only one character left', () => {
      let state = calculatorReducer(initialCalculatorState, {
        type: 'INPUT_DIGIT',
        digit: '9',
      });
      state = calculatorReducer(state, {
        type: 'BACKSPACE',
      });
      expect(state.displayValue).toBe('0');
      expect(state.isNewInput).toBe(true);
    });

    it('resets to 0 if negative single digit like -7', () => {
      let state: CalculatorState = {
        ...initialCalculatorState,
        displayValue: '-7',
        isNewInput: false,
      };
      state = calculatorReducer(state, {
        type: 'BACKSPACE',
      });
      expect(state.displayValue).toBe('0');
      expect(state.isNewInput).toBe(true);
    });
  });

  describe('TOGGLE_SIGN', () => {
    it('does not negate 0', () => {
      const state = calculatorReducer(initialCalculatorState, {
        type: 'TOGGLE_SIGN',
      });
      expect(state.displayValue).toBe('0');
    });

    it('negates positive number', () => {
      let state = calculatorReducer(initialCalculatorState, {
        type: 'INPUT_DIGIT',
        digit: '8',
      });
      state = calculatorReducer(state, {
        type: 'TOGGLE_SIGN',
      });
      expect(state.displayValue).toBe('-8');
    });

    it('removes negative sign on negative number', () => {
      let state: CalculatorState = {
        ...initialCalculatorState,
        displayValue: '-15',
        isNewInput: false,
      };
      state = calculatorReducer(state, {
        type: 'TOGGLE_SIGN',
      });
      expect(state.displayValue).toBe('15');
    });
  });

  describe('SET_ERROR & RECALL_VALUE', () => {
    it('stores error in state', () => {
      const state = calculatorReducer(initialCalculatorState, {
        type: 'SET_ERROR',
        error: 'Cannot divide by zero',
      });
      expect(state.error).toBe('Cannot divide by zero');
      expect(state.isNewInput).toBe(true);
    });

    it('recalls value into display', () => {
      const state = calculatorReducer(initialCalculatorState, {
        type: 'RECALL_VALUE',
        value: '100.5',
      });
      expect(state.displayValue).toBe('100.5');
      expect(state.isNewInput).toBe(true);
      expect(state.error).toBeNull();
    });

    it('returns state on unknown action', () => {
      // @ts-expect-error testing unknown action
      const state = calculatorReducer(initialCalculatorState, { type: 'UNKNOWN' });
      expect(state).toEqual(initialCalculatorState);
    });
  });
});
