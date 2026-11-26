import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  detail?: string;
  kind?: 'success' | 'warning' | 'info';
}

export const GlassToast: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 sm:bottom-auto sm:top-16 sm:right-4 sm:left-auto sm:translate-x-0 z-50 flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="glass-lens-pill pointer-events-auto px-4 py-3 flex items-center gap-3"
          >
            <motion.span
              initial={{ rotate: -18 }}
              animate={{ rotate: [0, 14, -10, 6, 0] }}
              transition={{ duration: 0.55 }}
              className="shrink-0 text-[var(--accent-amber)]"
              aria-hidden="true"
            >
              {toast.kind === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : toast.kind === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{toast.title}</p>
              {toast.detail && (
                <p className="text-xs text-[var(--text-secondary)] truncate">{toast.detail}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--glass-bg)] text-[var(--text-muted)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
