import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface GlassChipProps {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  large?: boolean;
}

export const GlassChip: React.FC<GlassChipProps> = ({
  label,
  sublabel,
  icon,
  selected = false,
  onClick,
  className = '',
  large = false,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      aria-pressed={selected}
      className={`relative overflow-hidden cursor-pointer text-left transition-all ${
        large ? 'rounded-[22px] p-4 min-h-[76px]' : 'rounded-full px-4 py-2 min-h-[44px]'
      } glass-lens-card ${
        selected
          ? 'ring-2 ring-[var(--accent-amber)] bg-[var(--accent-amber-soft)]'
          : 'hover:bg-[var(--glass-bg-hover)]'
      } ${className}`}
    >
      {/* Outward selection ripple */}
      {selected && (
        <motion.span
          key="ripple"
          initial={{ scale: 0.2, opacity: 0.45 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 m-auto w-16 h-16 rounded-full bg-[var(--accent-amber)]/30"
        />
      )}

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <span
              className={`flex items-center justify-center rounded-xl ${
                large ? 'w-10 h-10 bg-[var(--glass-bg)]' : 'w-5 h-5'
              } text-[var(--accent-amber)]`}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">{label}</div>
            {sublabel && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{sublabel}</div>}
          </div>
        </div>
        {selected && (
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
            className="w-6 h-6 rounded-full bg-[var(--accent-amber)] text-slate-950 flex items-center justify-center shrink-0"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.6]" aria-hidden="true" />
          </motion.span>
        )}
      </div>
    </motion.button>
  );
};
