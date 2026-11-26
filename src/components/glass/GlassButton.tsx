import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'amber' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  success = false,
  icon,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) => {
  const sizeCls =
    size === 'sm'
      ? 'min-h-[38px] px-3.5 text-xs gap-1.5'
      : size === 'lg'
        ? 'min-h-[48px] px-6 text-base gap-2.5'
        : 'min-h-[44px] px-5 text-sm gap-2';

  const variantCls =
    variant === 'amber'
      ? 'glass-lens-btn-amber text-[var(--text-primary)] font-semibold'
      : variant === 'danger'
        ? 'bg-rose-500/20 border-rose-300/40 text-[var(--text-primary)]'
        : variant === 'ghost'
          ? 'bg-transparent border-transparent shadow-none hover:bg-[var(--glass-bg)]'
          : 'text-[var(--text-primary)] font-medium';

  return (
    <motion.button
      type={type}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      disabled={disabled || loading}
      className={`glass-lens-btn inline-flex items-center justify-center cursor-pointer select-none disabled:opacity-45 disabled:cursor-not-allowed ${sizeCls} ${variantCls} ${className}`}
      {...(rest as any)}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : success ? (
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          >
            <Check className="w-4 h-4 text-[var(--accent-amber)]" aria-hidden="true" />
          </motion.span>
        ) : (
          icon
        )}
        <span>{children}</span>
      </span>
    </motion.button>
  );
};
