// Frontend type definitions for Sezzle FinTech Calculator

export type OperationType = 
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'sqrt'
  | 'percentage';

export interface CalculationItem {
  id: string;
  operation: string;
  a: string;
  b: string | null;
  result: string;
  expression: string;
  timestamp: string;
}

export interface CalculatorState {
  displayValue: string;
  previousOperand: string | null;
  pendingOperation: OperationType | null;
  isNewInput: boolean;
  error: string | null;
  activeExpression: string;
}

export type CalculatorAction =
  | { type: 'INPUT_DIGIT'; digit: string }
  | { type: 'INPUT_DECIMAL' }
  | { type: 'SET_OPERATION'; operation: OperationType }
  | { type: 'SET_RESULT'; result: string; expression: string }
  | { type: 'CLEAR' }
  | { type: 'ALL_CLEAR' }
  | { type: 'BACKSPACE' }
  | { type: 'TOGGLE_SIGN' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RECALL_VALUE'; value: string };

export interface ApiErrorResponse {
  error: string;
  code: string;
  status: number;
}
