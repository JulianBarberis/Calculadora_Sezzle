import { Calculator, ShieldCheck, Sparkles } from 'lucide-react'

export function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-[#fe5ea3] selection:text-white">
      {/* Background Ambience */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10" 
      />

      {/* Main Glass Shell */}
      <div className="w-full max-w-md rounded-3xl p-6 glass-panel relative overflow-hidden">
        {/* Subtle Specular Top Highlight */}
        <div 
          aria-hidden="true" 
          className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" 
        />

        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#fe5ea3] to-[#ad3083] shadow-md shadow-[#ad3083]/30">
              <Calculator className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Sezzle <span className="text-[#fe5ea3] font-normal text-xs uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10">FinTech</span>
              </h1>
              <p className="text-xs text-white/70">Arbitrary Precision Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ready</span>
          </div>
        </header>

        {/* Display Preview */}
        <section aria-label="Calculation Display" className="my-6">
          <div className="rounded-2xl p-4 bg-black/30 border border-white/10 text-right">
            <div className="text-xs text-white/50 h-5 font-mono">0.1 + 0.2</div>
            <output className="text-4xl font-mono font-bold tracking-tight text-white block tabular-nums">
              0.3
            </output>
          </div>
        </section>

        {/* Keypad Placeholder */}
        <section aria-label="Calculator Controls" className="grid grid-cols-4 gap-2.5">
          {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '√', '='].map((key) => {
            const isAction = ['÷', '×', '-', '+', '='].includes(key)
            const isSpecial = ['C', '±', '%'].includes(key)
            return (
              <button
                key={key}
                type="button"
                className={`h-12 rounded-xl font-semibold text-base flex items-center justify-center transition-all ${
                  isAction 
                    ? 'glass-accent text-white font-bold' 
                    : isSpecial 
                      ? 'bg-white/15 text-white hover:bg-white/25 border border-white/20' 
                      : 'glass-button text-white'
                }`}
              >
                {key}
              </button>
            )
          })}
        </section>

        {/* Footer info */}
        <footer className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#fe5ea3]" aria-hidden="true" />
            Phase 0 Scaffolding
          </span>
          <span>Zero-`useEffect` Architecture</span>
        </footer>
      </div>
    </main>
  )
}

export default App
