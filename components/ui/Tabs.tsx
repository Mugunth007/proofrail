'use client';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

export const Tabs = ({
  tabs,
  defaultTab,
  className,
}: {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex border-b border-surface-border gap-2 overflow-x-auto scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                isActive
                  ? 'border-accent-primary text-text-main font-semibold'
                  : 'border-transparent text-text-secondary hover:text-text-main hover:border-surface-border'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full',
                    isActive ? 'bg-accent-primary/20 text-accent-secondary' : 'bg-surface-elevated text-text-muted'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-6">
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  );
};
