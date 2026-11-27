import React from 'react';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  overdue?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  interactive = false,
  overdue = false,
  onClick,
  ariaLabel,
}) => {
  const baseCls = `glass-lens-card glass-lens-specular ${
    interactive ? 'glass-lens-card-interactive cursor-pointer' : ''
  } ${overdue ? 'animate-overdue-breathe border-amber-400/50' : ''} ${className}`;

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className={`${baseCls} active:scale-[0.99]`}
      >
        {children}
      </div>
    );
  }

  return <div className={baseCls}>{children}</div>;
};
