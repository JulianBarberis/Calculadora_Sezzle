import type { OperationType } from '../types/calculator';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onOperation: (op: OperationType) => void;
  onCalculate: () => void;
  onClear: () => void;
  onToggleSign: () => void;
  onBackspace: () => void;
  isClearAll: boolean;
  pendingOperation?: OperationType | null;
}

export function Keypad({
  onDigit,
  onDecimal,
  onOperation,
  onCalculate,
  onClear,
  onToggleSign,
  onBackspace,
  isClearAll,
}: KeypadProps) {
  const basicOperatorClass =
    'h-12 rounded-xl text-lg font-semibold glass-accent text-white hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center';
  const advancedOperatorClass =
    'h-12 rounded-xl font-semibold text-base glass-button text-white/90 hover:text-white active:scale-[0.97] transition-all flex items-center justify-center';

  return (
    <section aria-label="Teclado numérico y operaciones" className="grid grid-cols-4 gap-2.5">
      {/* Row 1: Clear, Toggle Sign, Percentage, Divide */}
      <button
        type="button"
        onClick={onClear}
        className="h-12 rounded-xl font-semibold text-base bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 active:scale-[0.97] transition-all flex items-center justify-center shadow-sm"
        aria-label={isClearAll ? 'Borrar todo' : 'Borrar entrada'}
      >
        {isClearAll ? 'AC' : 'C'}
      </button>

      <button
        type="button"
        onClick={onToggleSign}
        className="h-12 rounded-xl font-semibold text-base glass-button text-white/90 hover:text-white active:scale-[0.97] flex items-center justify-center"
        aria-label="Cambiar signo"
      >
        ±
      </button>

      <button
        type="button"
        onClick={onBackspace}
        className="h-12 rounded-xl font-semibold text-base glass-button text-white/90 hover:text-white active:scale-[0.97] flex items-center justify-center"
        aria-label="Borrar último dígito"
      >
        ⌫
      </button>

      <button
        type="button"
        onClick={() => onOperation('divide')}
        className={basicOperatorClass}
        aria-label="Dividir"
      >
        ÷
      </button>

      {/* Row 2: Square Root, Power, Backspace, Multiply */}
      <button
        type="button"
        onClick={() => onOperation('sqrt')}
        className={advancedOperatorClass}
        aria-label="Raíz cuadrada"
      >
        √
      </button>

      <button
        type="button"
        onClick={() => onOperation('power')}
        className={advancedOperatorClass}
        aria-label="Potencia"
      >
        xʸ
      </button>

      <button
        type="button"
        onClick={() => onOperation('percentage')}
        className={advancedOperatorClass}
        aria-label="Porcentaje"
      >
        %
      </button>

      <button
        type="button"
        onClick={() => onOperation('multiply')}
        className={basicOperatorClass}
        aria-label="Multiplicar"
      >
        ×
      </button>

      {/* Row 3: 7, 8, 9, Subtract */}
      {['7', '8', '9'].map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => onDigit(digit)}
          className="h-12 rounded-xl font-medium text-lg glass-button text-white hover:brightness-110 active:scale-[0.97] flex items-center justify-center"
          aria-label={`Dígito ${digit}`}
        >
          {digit}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onOperation('subtract')}
        className={basicOperatorClass}
        aria-label="Restar"
      >
        −
      </button>

      {/* Row 4: 4, 5, 6, Add */}
      {['4', '5', '6'].map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => onDigit(digit)}
          className="h-12 rounded-xl font-medium text-lg glass-button text-white hover:brightness-110 active:scale-[0.97] flex items-center justify-center"
          aria-label={`Dígito ${digit}`}
        >
          {digit}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onOperation('add')}
        className={basicOperatorClass}
        aria-label="Sumar"
      >
        +
      </button>

      {/* Row 5: 1, 2, 3, Decimal */}
      {['1', '2', '3'].map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => onDigit(digit)}
          className="h-12 rounded-xl font-medium text-lg glass-button text-white hover:brightness-110 active:scale-[0.97] flex items-center justify-center"
          aria-label={`Dígito ${digit}`}
        >
          {digit}
        </button>
      ))}

      <button
        type="button"
        onClick={onDecimal}
        className="h-12 rounded-xl font-medium text-lg glass-button text-white hover:brightness-110 active:scale-[0.97] flex items-center justify-center"
        aria-label="Punto decimal"
      >
        .
      </button>

      {/* Row 6: 0 (span 2), Equals (span 2) */}
      <button
        type="button"
        onClick={() => onDigit('0')}
        className="col-span-2 h-12 rounded-xl font-medium text-lg glass-button text-white hover:brightness-110 active:scale-[0.98] flex items-center justify-center"
        aria-label="Dígito 0"
      >
        0
      </button>

      <button
        type="button"
        onClick={onCalculate}
        className="col-span-2 h-12 rounded-xl font-bold text-lg bg-gradient-to-r from-[#ff2a85] to-[#ff8c00] text-white shadow-lg shadow-[#ff2a85]/30 hover:brightness-110 transition-all flex items-center justify-center border border-white/20 active:scale-[0.98]"
        aria-label="Calcular resultado"
      >
        =
      </button>
    </section>
  );
}
