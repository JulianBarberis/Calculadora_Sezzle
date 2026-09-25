import { History} from 'lucide-react';

interface HeaderProps {
  isOnline?: boolean;
  historyCount: number;
  onOpenHistory: () => void;
}

export function Header({ historyCount, onOpenHistory }: HeaderProps) {
  return (
    <header className="flex items-center justify-between pb-2">
      <div className="flex items-center gap-2.5">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Sezzle Calculator 
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* History Button */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="relative w-9 h-9 rounded-xl glass-button text-white/80 hover:text-white active:scale-[0.97] flex items-center justify-center transition-all"
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
