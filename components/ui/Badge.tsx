import React from 'react';
import { cn } from '@/lib/utils';
import type { JobState } from '@/lib/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error' | 'near' | 'state';
  state?: JobState;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  state,
  ...props
}) => {
  let variantStyles = 'bg-surface-elevated text-text-secondary border-surface-border';

  if (state) {
    switch (state) {
      case 'DRAFT':
        variantStyles = 'bg-slate-800 text-slate-300 border-slate-700';
        break;
      case 'FUNDED':
      case 'ASSIGNED':
        variantStyles = 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80';
        break;
      case 'RUNNING':
        variantStyles = 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80 animate-pulse';
        break;
      case 'SUBMITTED':
      case 'VERIFYING':
        variantStyles = 'bg-amber-950/70 text-amber-300 border-amber-800/80';
        break;
      case 'PASSED':
      case 'PAID':
        variantStyles = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
        break;
      case 'FAILED':
      case 'REFUNDED':
        variantStyles = 'bg-rose-950/70 text-rose-300 border-rose-800/80';
        break;
      default:
        variantStyles = 'bg-surface-elevated text-text-secondary border-surface-border';
    }
  } else {
    switch (variant) {
      case 'success':
        variantStyles = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
        break;
      case 'warning':
        variantStyles = 'bg-amber-950/60 text-amber-300 border-amber-800/60';
        break;
      case 'error':
        variantStyles = 'bg-rose-950/60 text-rose-300 border-rose-800/60';
        break;
      case 'near':
        variantStyles = 'bg-emerald-950/80 text-near-green border-emerald-700/60 font-mono';
        break;
      case 'outline':
        variantStyles = 'border-surface-border text-text-secondary bg-transparent';
        break;
      default:
        variantStyles = 'bg-indigo-950/50 text-indigo-300 border-indigo-800/40';
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
