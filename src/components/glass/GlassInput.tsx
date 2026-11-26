import React from 'react';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  hint,
  icon,
  id,
  className = '',
  ...rest
}) => {
  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  return (
    <label htmlFor={inputId} className="block space-y-1.5">
      {label && (
        <span className="block text-xs font-medium tracking-wide uppercase text-[var(--text-secondary)]">
          {label}
        </span>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 text-[var(--text-muted)]" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`glass-lens-input w-full min-h-[44px] py-2.5 text-sm placeholder:text-[var(--text-muted)] ${
            icon ? 'pl-10 pr-4' : 'px-4'
          } ${className}`}
          {...rest}
        />
      </div>
      {hint && <span className="block text-xs text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
};

export interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const GlassTextarea: React.FC<GlassTextareaProps> = ({
  label,
  hint,
  id,
  className = '',
  ...rest
}) => {
  const inputId = id ?? (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  return (
    <label htmlFor={inputId} className="block space-y-1.5">
      {label && (
        <span className="block text-xs font-medium tracking-wide uppercase text-[var(--text-secondary)]">
          {label}
        </span>
      )}
      <textarea
        id={inputId}
        className={`glass-lens-input w-full min-h-[96px] p-3.5 text-sm placeholder:text-[var(--text-muted)] resize-y ${className}`}
        {...rest}
      />
      {hint && <span className="block text-xs text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
};
