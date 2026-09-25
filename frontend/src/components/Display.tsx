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
    return 'text-xl md:text-2xl';
  };

  const safeValue = value || '0';
  const fontSize = getFontSizeClass(safeValue.length);

  return (
    <section aria-label="Pantalla de cálculo" className="my-4">
      <div className="rounded-2xl p-4 bg-black/40 border border-white/10 text-right shadow-inner relative overflow-hidden">
        {/* Secondary expression breadcrumb */}
        <div 
          className="text-xs md:text-sm text-white/50 h-5 font-mono truncate select-none tracking-wide"
          data-testid="calculator-expression"
        >
          {expression || '\u00A0'}
        </div>

        {/* Primary calculation display */}
        <output 
          className={`${fontSize} font-mono font-bold tracking-tight text-white block tabular-nums select-all break-all transition-all duration-100 min-h-[3rem] flex items-center justify-end`}
          aria-live="polite"
          data-testid="calculator-display"
        >
          {value}
        </output>
      </div>
    </section>
  );
}
