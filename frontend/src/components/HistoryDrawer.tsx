import { Clock, History, RotateCcw, X } from 'lucide-react';
import type { CalculationItem } from '../types/calculator';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CalculationItem[];
  onRecall: (value: string) => void;
}

export function HistoryDrawer({ isOpen, onClose, items, onRecall }: HistoryDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Historial de cálculos"
        className="w-full max-w-sm h-full glass-panel border-l border-white/20 bg-[#0d0e1a]/90 p-6 flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#ff2a85]" aria-hidden="true" />
            <h2 className="text-lg font-bold text-white tracking-tight">Historial</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
              {items.length} / 20
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar historial"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Calculation List */}
        <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
          {items.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-white/40 text-center gap-2">
              <Clock className="w-8 h-8 opacity-40" aria-hidden="true" />
              <p className="text-sm">No hay cálculos recientes</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-mono text-white/50 break-all">
                    {item.expression}
                  </div>
                  <span className="text-[10px] text-white/30 whitespace-nowrap">
                    #{item.id}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="text-lg font-mono font-bold text-white tracking-tight break-all">
                    = {item.result}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onRecall(item.result);
                      onClose();
                    }}
                    className="p-1.5 rounded-lg opacity-80 group-hover:opacity-100 hover:bg-white/10 text-[#00f0ff] text-xs flex items-center gap-1 font-medium transition-all"
                    aria-label={`Usar resultado ${item.result}`}
                    title="Cargar resultado en la calculadora"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Usar</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 text-[11px] text-white/50 flex items-center justify-between">
          <span>Buffer circular (Cap: 20)</span>
          <span className="text-white/40">Presiona Esc para cerrar</span>
        </div>
      </aside>
    </div>
  );
}
