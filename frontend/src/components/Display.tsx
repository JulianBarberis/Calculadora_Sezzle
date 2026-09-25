import { formatDisplayNumber, formatExpression } from '../utils/formatters';

interface DisplayProps {
  value: string;
  expression: string;
}

export function Display({ value, expression }: DisplayProps) {
  // Dynamic font sizing based on string length to prevent layout clipping
  const getFontSizeClass = (len: number) => {
    if (len <= 9) return 'text-4xl md:text-5xl';
    if (len <= 14) return 'text-3xl md:text-4xl';
    if (len <= 20) return 'text-2xl md:text-3xl';
    if (len <= 24) return 'text-xl md:text-xl';
    if (len <= 28) return 'text-lg md:text-lg';
    return 'text-base md:text-base';
  };

  const safeValue = value || '0';
  const formattedValue = formatDisplayNumber(safeValue);
  const formattedExpression = formatExpression(expression);
  const fontSize = getFontSizeClass(formattedValue.length);

  return (
    <section aria-label="Pantalla de cálculo" className="my-4">
      <div className="rounded-2xl p-4 bg-black/40 border border-white/10 text-right shadow-inner relative overflow-hidden min-h-[5.5rem] flex flex-col justify-between">
        {/* Secondary expression breadcrumb */}
        <div 
          className="text-xs md:text-sm text-white/50 h-5 font-mono truncate select-none tracking-wide"
          data-testid="calculator-expression"
        >
          {formattedExpression || '\u00A0'}
        </div>

        {/* Primary calculation display */}
        <div className="flex items-center justify-end overflow-x-auto scrollbar-none w-full">
          <output 
            className={`${fontSize} font-mono font-bold tracking-tight text-white block tabular-nums select-all whitespace-nowrap transition-all duration-100 min-h-[2.5rem] flex items-center justify-end`}
            aria-live="polite"
            data-testid="calculator-display"
          >
            {formattedValue}
          </output>
        </div>
      </div>
    </section>
  );
}

