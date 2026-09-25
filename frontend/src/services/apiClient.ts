import type { ApiErrorResponse, CalculationItem, OperationType } from '../types/calculator';

const BASE_URL = '/api/v1';

export class CalculatorApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'CalculatorApiError';
    this.code = code;
    this.status = status;
  }
}

export async function calculateAPI(
  operation: OperationType,
  a: string,
  b?: string | null
): Promise<CalculationItem> {
  const payload: { operation: string; a: string; b?: string } = {
    operation,
    a,
  };

  if (b !== undefined && b !== null) {
    payload.b = b;
  }

  const res = await fetch(`${BASE_URL}/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errBody: ApiErrorResponse | null = null;
    try {
      errBody = (await res.json()) as ApiErrorResponse;
    } catch {
      // Fallback if not valid JSON
    }

    if (errBody && errBody.error) {
      throw new CalculatorApiError(errBody.error, errBody.code, errBody.status || res.status);
    }

    throw new CalculatorApiError(
      `Request failed with status ${res.status}`,
      'REQUEST_FAILED',
      res.status
    );
  }

  return (await res.json()) as CalculationItem;
}

export async function fetchHistoryAPI(): Promise<CalculationItem[]> {
  const res = await fetch(`${BASE_URL}/history`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new CalculatorApiError(
      `Failed to fetch history: status ${res.status}`,
      'HISTORY_FETCH_FAILED',
      res.status
    );
  }

  const data = (await res.json()) as { items: CalculationItem[]; total: number };
  return data.items || [];
}
