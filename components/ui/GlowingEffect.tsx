'use client';
import React from 'react';
import { cn } from '@/lib/utils';

export const GlowingCard = ({
  children,
  className,
  glowColor = 'rgba(99, 102, 241, 0.25)',
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) => {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-surface-border bg-surface-primary/70 backdrop-blur-xl p-6 transition-all duration-300 hover:border-accent-primary/50 group overflow-hidden',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 100px) var(--mouse-y, 100px), ${glowColor}, transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
