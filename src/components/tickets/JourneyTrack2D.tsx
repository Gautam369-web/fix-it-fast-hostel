import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ClipboardCheck, Send, Star, Wrench } from 'lucide-react';
import type { TicketStatus } from '../../types/domain';

const STATIONS = [
  { key: 'Reported', label: 'Reported', icon: Send },
  { key: 'Assigned', label: 'Assigned', icon: ClipboardCheck },
  { key: 'In progress', label: 'In progress', icon: Wrench },
  { key: 'Resolved', label: 'Resolved', icon: CheckCircle2 },
  { key: 'Rated', label: 'Rated', icon: Star },
];

export function statusToTrackIndex(status: TicketStatus): number {
  switch (status) {
    case 'Open':
      return 0;
    case 'Assigned':
      return 1;
    case 'In progress':
    case 'Waiting for parts':
    case 'Reopened':
      return 2;
    case 'Resolved':
      return 3;
    case 'Closed':
      return 4;
  }
}

/**
 * 2D / Low-end fallback for the 3D TicketOrb journey:
 * A liquid-glass pill sliding across 5 labelled stations.
 */
export const JourneyTrack2D: React.FC<{
  status: TicketStatus;
  overdue?: boolean;
}> = ({ status, overdue = false }) => {
  const activeIdx = statusToTrackIndex(status);
  const pct = (activeIdx / (STATIONS.length - 1)) * 100;

  return (
    <div className="glass-lens-card p-3.5 space-y-2.5" aria-label="2D Complaint Journey Progress">
      <div className="relative h-2 rounded-full bg-[var(--glass-bg)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[var(--accent-amber)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        />
      </div>
      <div className="grid grid-cols-5 gap-1">
        {STATIONS.map((st, idx) => {
          const Icon = st.icon;
          const reached = idx <= activeIdx;
          const current = idx === activeIdx;
          return (
            <div key={st.key} className="flex flex-col items-center text-center gap-1">
              <motion.span
                animate={current ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 0.45 }}
                className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                  current
                    ? 'bg-[var(--accent-amber)] text-slate-950 border-white/60 shadow-[0_0_12px_var(--accent-amber-glow)]'
                    : reached
                      ? 'bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] border-[var(--accent-amber)]/40'
                      : 'bg-[var(--glass-bg)] text-[var(--text-muted)] border-[var(--glass-border-side)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              </motion.span>
              <span
                className={`text-[10px] font-medium ${
                  current ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)]'
                }`}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
      {overdue && (
        <p className="text-[11px] font-medium text-[var(--accent-amber)]">
          SLA overdue — Clock Tower alert active
        </p>
      )}
    </div>
  );
};
