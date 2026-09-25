import { AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-150"
    >
      <div className="rounded-2xl p-4 bg-[#1a0f18]/95 border border-[#ff2a85]/50 shadow-2xl shadow-[#ff2a85]/20 backdrop-blur-xl flex items-start justify-between gap-3 text-white">
        <div className="flex items-start gap-3">
          <div className="p-1 rounded-lg bg-[#ff2a85]/20 text-[#ff2a85] shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Error de cálculo</h4>
            <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
