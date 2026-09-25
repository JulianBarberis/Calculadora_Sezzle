import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import { historyStore } from '../state/historyStore';

describe('Calculator Component Integration', () => {
  beforeEach(() => {
    historyStore.clear();
    vi.restoreAllMocks();
  });

  it('renders calculator interface with initial zero display', () => {
    render(<App />);
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('0');
  });

  it('inputs digits and decimal point correctly', () => {
    render(<App />);
    const display = screen.getByTestId('calculator-display');

    fireEvent.click(screen.getByRole('button', { name: 'Dígito 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Punto decimal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 5' }));

    expect(display).toHaveTextContent('12.5');
  });

  it('toggles sign and performs backspace', () => {
    render(<App />);
    const display = screen.getByTestId('calculator-display');

    fireEvent.click(screen.getByRole('button', { name: 'Dígito 8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 9' }));
    expect(display).toHaveTextContent('89');

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar signo' }));
    expect(display).toHaveTextContent('-89');

    fireEvent.click(screen.getByRole('button', { name: 'Borrar último dígito' }));
    expect(display).toHaveTextContent('-8');

    fireEvent.click(screen.getByRole('button', { name: 'Borrar último dígito' }));
    expect(display).toHaveTextContent('0');
  });

  it('performs addition through mock API successfully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1',
        operation: 'add',
        a: '0.1',
        b: '0.2',
        result: '0.3',
        expression: '0.1 + 0.2 = 0.3',
        timestamp: new Date().toISOString(),
      }),
    });

    render(<App />);
    const display = screen.getByTestId('calculator-display');

    // 0.1
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Punto decimal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 1' }));

    // +
    fireEvent.click(screen.getByRole('button', { name: 'Sumar' }));

    // 0.2
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Punto decimal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 2' }));

    // =
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Calcular resultado' }));
    });

    await waitFor(() => {
      expect(display).toHaveTextContent('0.3');
    });

    const expression = screen.getByTestId('calculator-expression');
    expect(expression).toHaveTextContent('0.1 + 0.2 = 0.3');
    expect(historyStore.getSnapshot().length).toBe(1);
  });

  it('executes unary square root immediately', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '2',
        operation: 'sqrt',
        a: '16',
        b: null,
        result: '4',
        expression: 'sqrt(16) = 4',
        timestamp: new Date().toISOString(),
      }),
    });

    render(<App />);
    const display = screen.getByTestId('calculator-display');

    // 16
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 6' }));

    // √
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Raíz cuadrada' }));
    });

    await waitFor(() => {
      expect(display).toHaveTextContent('4');
    });
  });

  it('supports keyboard navigation', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '3',
        operation: 'add',
        a: '5',
        b: '3',
        result: '8',
        expression: '5 + 3 = 8',
        timestamp: new Date().toISOString(),
      }),
    });

    render(<App />);
    const main = screen.getByRole('main');
    const display = screen.getByTestId('calculator-display');

    fireEvent.keyDown(main, { key: '5' });
    fireEvent.keyDown(main, { key: '+' });
    fireEvent.keyDown(main, { key: '3' });

    await act(async () => {
      fireEvent.keyDown(main, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(display).toHaveTextContent('8');
    });

    // Test Escape to clear
    fireEvent.keyDown(main, { key: 'Escape' });
    expect(display).toHaveTextContent('0');
  });

  it('opens and closes history drawer with Escape key', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], total: 0 }),
    });

    render(<App />);

    const historyBtn = screen.getByTitle('Ver historial de cálculos');
    await act(async () => {
      fireEvent.click(historyBtn);
    });

    const drawer = screen.getByRole('dialog', { name: 'Historial de cálculos' });
    expect(drawer).toBeInTheDocument();

    // Close via close button
    const closeBtn = screen.getByRole('button', { name: 'Cerrar historial' });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog', { name: 'Historial de cálculos' })).not.toBeInTheDocument();
  });

  it('recalls calculation value from history tape into active display', async () => {
    const mockItem = {
      id: '99',
      operation: 'add',
      a: '40',
      b: '2',
      result: '42',
      expression: '40 + 2 = 42',
      timestamp: new Date().toISOString(),
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [mockItem], total: 1 }),
    });

    historyStore.addCalculation(mockItem);

    render(<App />);
    const display = screen.getByTestId('calculator-display');

    // Open history
    const historyBtn = screen.getByTitle('Ver historial de cálculos');
    await act(async () => {
      fireEvent.click(historyBtn);
    });

    // Click recall button
    const recallBtn = screen.getByRole('button', { name: 'Usar resultado 42' });
    fireEvent.click(recallBtn);

    expect(display).toHaveTextContent('42');
    expect(screen.queryByRole('dialog', { name: 'Historial de cálculos' })).not.toBeInTheDocument();
  });

  it('displays Toast on API failure and dismisses it', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Cannot divide by zero. Please enter a non-zero divisor.',
        code: 'DIVISION_BY_ZERO',
        status: 400,
      }),
    });

    render(<App />);

    // 10 / 0 =
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dividir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 0' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Calcular resultado' }));
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Cannot divide by zero');
    });

    // Dismiss toast
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar alerta' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles percentage operation and power operation buttons', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, options?: any) => {
      const body = options?.body ? JSON.parse(options.body) : {};
      if (body.operation === 'percentage') {
        return {
          ok: true,
          json: async () => ({
            id: '4',
            operation: 'percentage',
            a: '50',
            b: null,
            result: '0.5',
            expression: '50% = 0.5',
            timestamp: new Date().toISOString(),
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          id: '5',
          operation: 'power',
          a: '2',
          b: '3',
          result: '8',
          expression: '2 ^ 3 = 8',
          timestamp: new Date().toISOString(),
        }),
      };
    });

    render(<App />);
    const display = screen.getByTestId('calculator-display');

    // 50 % -> 0.5
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 0' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Porcentaje' }));
    });

    await waitFor(() => {
      expect(display).toHaveTextContent('0.5');
    });

    // Clear
    fireEvent.click(screen.getByRole('button', { name: 'Borrar entrada' }));
    expect(display).toHaveTextContent('0');

    // 2 ^ 3 = 8
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Potencia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dígito 3' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Calcular resultado' }));
    });

    await waitFor(() => {
      expect(display).toHaveTextContent('8');
    });
  });

  it('closes history drawer on Escape keydown', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], total: 0 }),
    });

    render(<App />);
    const main = screen.getByRole('main');

    // Open history
    const historyBtn = screen.getByTitle('Ver historial de cálculos');
    await act(async () => {
      fireEvent.click(historyBtn);
    });
    expect(screen.getByRole('dialog', { name: 'Historial de cálculos' })).toBeInTheDocument();

    // Escape closes drawer
    fireEvent.keyDown(main, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Historial de cálculos' })).not.toBeInTheDocument();
  });

  it('handles various keyboard operator inputs and backspace', async () => {
    render(<App />);
    const main = screen.getByRole('main');
    const display = screen.getByTestId('calculator-display');

    fireEvent.keyDown(main, { key: '9' });
    fireEvent.keyDown(main, { key: '9' });
    expect(display).toHaveTextContent('99');

    fireEvent.keyDown(main, { key: 'Backspace' });
    expect(display).toHaveTextContent('9');

    fireEvent.keyDown(main, { key: '*' });
    fireEvent.keyDown(main, { key: '2' });
    expect(display).toHaveTextContent('2');

    // Test C key
    fireEvent.keyDown(main, { key: 'c' });
    expect(display).toHaveTextContent('0');

    // Test operators
    fireEvent.keyDown(main, { key: '7' });
    fireEvent.keyDown(main, { key: '-' });
    fireEvent.keyDown(main, { key: '1' });
    expect(display).toHaveTextContent('1');
    fireEvent.keyDown(main, { key: '/' });
    fireEvent.keyDown(main, { key: '2' });
    expect(display).toHaveTextContent('2');
    fireEvent.keyDown(main, { key: '^' });
    fireEvent.keyDown(main, { key: '3' });
    expect(display).toHaveTextContent('3');
  });

  it('scales font size down as digits increase in length', () => {
    render(<App />);
    const display = screen.getByTestId('calculator-display');

    // Type 10 digits -> text-3xl
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Dígito 1' }));
    }
    expect(display.className).toContain('text-3xl');

    // Type 5 more digits (15 total) -> text-2xl
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Dígito 1' }));
    }
    expect(display.className).toContain('text-2xl');

    // Type 6 more digits (21 total) -> text-xl
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Dígito 1' }));
    }
    expect(display.className).toContain('text-xl');
  });
});
