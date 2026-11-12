'use client';
import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'near';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary:
        'bg-accent-primary hover:bg-accent-primary/90 text-white shadow-lg shadow-accent-primary/20 focus:ring-accent-primary',
      secondary:
        'bg-surface-elevated hover:bg-surface-border text-text-main border border-surface-border focus:ring-slate-400',
      outline:
        'border border-surface-border hover:border-accent-primary/50 text-text-main hover:bg-surface-elevated/50 focus:ring-accent-primary',
      danger:
        'bg-status-error/20 hover:bg-status-error/30 text-rose-300 border border-status-error/40 focus:ring-status-error',
      ghost:
        'hover:bg-surface-elevated text-text-secondary hover:text-text-main focus:ring-slate-400',
      near:
        'bg-near-green text-black font-semibold hover:bg-near-green/90 shadow-lg shadow-near-green/20 focus:ring-near-green',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
