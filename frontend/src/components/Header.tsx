import { Calculator, History, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  historyCount: number;
  onOpenHistory: () => void;
}

export function Header({ isOnline, historyCount, onOpenHistory }: HeaderProps) {
  return (
    <header className="flex items-center justify-between pb-5 border-b border-white/10">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-gradient-to-br from-[#ff2a85] to-[#5644c0] shadow-md shadow-[#ff2a85]/30">
          <Calculator className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            Sezzle <span className="text-[#ff2a85] font-semibold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10">FinTech</span>
          </h1>
          <p className="text-[11px] text-white/60">Motor de Precisión Arbitraria</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Network Status Badge */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
          title={isOnline ? 'Servicio en línea' : 'Sin conexión a internet'}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" aria-hidden="true" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" aria-hidden="true" />
              <span className="hidden sm:inline">Offline</span>
            </>
          )}
        </div>

        {/* History Button */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="relative p-2 rounded-xl glass-button text-white/80 hover:text-white flex items-center justify-center transition-all"
          aria-label={`Ver historial de cálculos (${historyCount} elementos)`}
          title="Ver historial de cálculos"
        >
          <History className="w-4 h-4" aria-hidden="true" />
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff2a85] text-white text-[9px] font-bold flex items-center justify-center border border-[#0d0e1a]">
              {historyCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
